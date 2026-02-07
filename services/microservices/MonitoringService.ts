// =======================
// 📡 SERVIÇO DE MONITORAMENTO - MICROSERVIÇO
// =======================

import express from 'express';
import helmet from 'helmet';
import winston from 'winston';
import DatabaseService from '../database/DatabaseService';

interface SystemMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: {
    bytesIn: number;
    bytesOut: number;
  };
  database: {
    connections: number;
    queries: number;
    slowQueries: number;
  };
  services: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'down';
      responseTime: number;
      lastCheck: string;
    };
  };
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'critical';
  service: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  metadata?: any;
}

class MonitoringService {
  private app: express.Application;
  private db: DatabaseService;
  private logger: winston.Logger;
  private metrics: SystemMetrics[] = [];
  private alerts: Alert[] = [];
  private services: string[] = [
    'auth-service',
    'billing-service', 
    'social-automation-service',
    'ai-media-service',
    'analytics-service'
  ];

  constructor() {
    this.app = express();
    this.db = DatabaseService.getInstance();
    this.setupLogger();
    this.setupMiddleware();
    this.setupRoutes();
    this.startMonitoring();
  }

  private setupLogger(): void {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'monitoring-service' },
      transports: [
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          maxsize: 5242880,
          maxFiles: 10
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    // Integração com Sentry (produção)
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      const Sentry = require('@sentry/node');
      Sentry.init({ dsn: process.env.SENTRY_DSN });
      
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
        handleExceptions: true,
        handleRejections: true
      }));
    }
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(express.json());

    // Middleware de logging de requests
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        
        this.logger.info('HTTP Request', {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        // Alertar para requests lentos
        if (duration > 5000) {
          this.createAlert({
            type: 'warning',
            service: 'monitoring-service',
            message: `Slow request detected: ${req.method} ${req.url} took ${duration}ms`,
            metadata: { method: req.method, url: req.url, duration }
          });
        }

        // Alertar para erros HTTP
        if (res.statusCode >= 500) {
          this.createAlert({
            type: 'error',
            service: 'monitoring-service',
            message: `HTTP ${res.statusCode} error on ${req.method} ${req.url}`,
            metadata: { method: req.method, url: req.url, status: res.statusCode }
          });
        }
      });

      next();
    });
  }

  private setupRoutes(): void {
    // =======================
    // 📊 MÉTRICAS DO SISTEMA
    // =======================
    this.app.get('/metrics', (req, res) => {
      const latest = this.metrics[this.metrics.length - 1];
      const last24h = this.metrics.filter(m => 
        new Date(m.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
      );

      res.json({
        success: true,
        data: {
          current: latest,
          last24Hours: last24h,
          summary: {
            avgCpu: this.calculateAverage(last24h, 'cpu'),
            avgMemory: this.calculateAverage(last24h, 'memory'),
            avgResponseTime: this.calculateAverageResponseTime(last24h),
            totalRequests: last24h.length,
            uptime: process.uptime()
          }
        }
      });
    });

    // =======================
    // 🚨 ALERTAS
    // =======================
    this.app.get('/alerts', (req, res) => {
      const { resolved, type, service, limit = 100 } = req.query;

      let filteredAlerts = [...this.alerts];

      if (resolved !== undefined) {
        filteredAlerts = filteredAlerts.filter(a => a.resolved === (resolved === 'true'));
      }

      if (type) {
        filteredAlerts = filteredAlerts.filter(a => a.type === type);
      }

      if (service) {
        filteredAlerts = filteredAlerts.filter(a => a.service === service);
      }

      filteredAlerts = filteredAlerts
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, parseInt(limit as string));

      res.json({
        success: true,
        data: {
          alerts: filteredAlerts,
          summary: {
            total: this.alerts.length,
            unresolved: this.alerts.filter(a => !a.resolved).length,
            critical: this.alerts.filter(a => a.type === 'critical' && !a.resolved).length,
            errors: this.alerts.filter(a => a.type === 'error' && !a.resolved).length,
            warnings: this.alerts.filter(a => a.type === 'warning' && !a.resolved).length
          }
        }
      });
    });

    // =======================
    // ✅ RESOLVER ALERTA
    // =======================
    this.app.patch('/alerts/:alertId/resolve', (req, res) => {
      const { alertId } = req.params;
      const alert = this.alerts.find(a => a.id === alertId);

      if (!alert) {
        return res.status(404).json({
          success: false,
          error: 'Alerta não encontrado'
        });
      }

      alert.resolved = true;
      
      this.logger.info('Alert resolved', { alertId, alert });

      res.json({
        success: true,
        data: alert
      });
    });

    // =======================
    // 🏥 HEALTH CHECK GERAL
    // =======================
    this.app.get('/health', async (req, res) => {
      try {
        const serviceChecks = await this.checkAllServices();
        const dbHealth = await this.db.healthCheck();
        const systemHealth = this.getSystemHealth();

        const overallHealth = serviceChecks.every(s => s.status === 'healthy') && 
                             dbHealth && 
                             systemHealth.status === 'healthy';

        res.status(overallHealth ? 200 : 503).json({
          success: overallHealth,
          status: overallHealth ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          services: serviceChecks,
          database: dbHealth ? 'connected' : 'disconnected',
          system: systemHealth,
          uptime: process.uptime()
        });

      } catch (error: any) {
        this.logger.error('Health check failed', { error: error.message });
        
        res.status(503).json({
          success: false,
          status: 'unhealthy',
          error: 'Health check failed'
        });
      }
    });

    // =======================
    // 📈 DASHBOARD DE MÉTRICAS
    // =======================
    this.app.get('/dashboard', (req, res) => {
      const last24h = this.metrics.filter(m => 
        new Date(m.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
      );

      const dashboard = {
        overview: {
          totalServices: this.services.length,
          healthyServices: this.getHealthyServicesCount(),
          activeAlerts: this.alerts.filter(a => !a.resolved).length,
          systemUptime: process.uptime()
        },
        performance: {
          avgCpu: this.calculateAverage(last24h, 'cpu'),
          avgMemory: this.calculateAverage(last24h, 'memory'),
          avgResponseTime: this.calculateAverageResponseTime(last24h),
          peakCpu: Math.max(...last24h.map(m => m.cpu)),
          peakMemory: Math.max(...last24h.map(m => m.memory))
        },
        database: {
          avgConnections: this.calculateAverage(last24h, 'database.connections'),
          avgQueries: this.calculateAverage(last24h, 'database.queries'),
          slowQueries: this.calculateAverage(last24h, 'database.slowQueries')
        },
        alerts: {
          last24h: this.alerts.filter(a => 
            new Date(a.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
          ).length,
          byType: this.getAlertsByType(),
          byService: this.getAlertsByService()
        },
        trends: {
          cpuTrend: this.calculateTrend(last24h, 'cpu'),
          memoryTrend: this.calculateTrend(last24h, 'memory'),
          errorRate: this.calculateErrorRate(last24h)
        }
      };

      res.json({
        success: true,
        data: dashboard
      });
    });

    // =======================
    // 🔔 WEBHOOK PARA ALERTAS EXTERNOS
    // =======================
    this.app.post('/webhook/alert', (req, res) => {
      const { service, type, message, metadata } = req.body;

      if (!service || !type || !message) {
        return res.status(400).json({
          success: false,
          error: 'Dados obrigatórios não fornecidos'
        });
      }

      this.createAlert({
        type: type as any,
        service,
        message,
        metadata
      });

      res.json({
        success: true,
        message: 'Alerta recebido'
      });
    });

    // =======================
    // 📊 LOGS DO SISTEMA
    // =======================
    this.app.get('/logs', async (req, res) => {
      try {
        const { level = 'info', limit = 100, service } = req.query;
        
        // Buscar logs do banco de dados
        const logs = await this.db.getAuditLogs(
          service as string, 
          parseInt(limit as string)
        );

        res.json({
          success: true,
          data: {
            logs,
            total: logs.length
          }
        });

      } catch (error: any) {
        this.logger.error('Failed to fetch logs', { error: error.message });
        
        res.status(500).json({
          success: false,
          error: 'Erro ao buscar logs'
        });
      }
    });
  }

  // =======================
  // 🔍 MONITORAMENTO ATIVO
  // =======================
  private startMonitoring(): void {
    // Coletar métricas a cada 30 segundos
    setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Verificar serviços a cada 2 minutos
    setInterval(() => {
      this.checkAllServices();
    }, 120000);

    // Limpar métricas antigas (manter apenas 7 dias)
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000); // A cada hora

    // Limpar alertas resolvidos antigos (manter 30 dias)
    setInterval(() => {
      this.cleanupOldAlerts();
    }, 24 * 60 * 60 * 1000); // A cada dia

    this.logger.info('Monitoring started', {
      metricsInterval: '30s',
      healthCheckInterval: '2m',
      services: this.services
    });
  }

  private async collectMetrics(): Promise<void> {
    try {
      const metrics: SystemMetrics = {
        timestamp: new Date().toISOString(),
        cpu: await this.getCpuUsage(),
        memory: await this.getMemoryUsage(),
        disk: await this.getDiskUsage(),
        network: await this.getNetworkStats(),
        database: await this.getDatabaseStats(),
        services: await this.getServicesStatus()
      };

      this.metrics.push(metrics);

      // Verificar thresholds e criar alertas
      this.checkThresholds(metrics);

      // Log das métricas
      this.logger.debug('Metrics collected', metrics);

    } catch (error: any) {
      this.logger.error('Failed to collect metrics', { error: error.message });
      
      this.createAlert({
        type: 'error',
        service: 'monitoring-service',
        message: 'Failed to collect system metrics',
        metadata: { error: error.message }
      });
    }
  }

  private async checkAllServices(): Promise<any[]> {
    const checks = [];

    for (const service of this.services) {
      try {
        const startTime = Date.now();
        const port = this.getServicePort(service);
        
        // Fazer health check HTTP
        const response = await fetch(`http://localhost:${port}/health`, {
          timeout: 5000
        });

        const responseTime = Date.now() - startTime;
        const isHealthy = response.ok;

        checks.push({
          service,
          status: isHealthy ? 'healthy' : 'degraded',
          responseTime,
          lastCheck: new Date().toISOString(),
          statusCode: response.status
        });

        // Alertar se serviço está down
        if (!isHealthy) {
          this.createAlert({
            type: 'critical',
            service,
            message: `Service ${service} is down (HTTP ${response.status})`,
            metadata: { statusCode: response.status, responseTime }
          });
        }

      } catch (error: any) {
        checks.push({
          service,
          status: 'down',
          responseTime: 0,
          lastCheck: new Date().toISOString(),
          error: error.message
        });

        this.createAlert({
          type: 'critical',
          service,
          message: `Service ${service} is unreachable`,
          metadata: { error: error.message }
        });
      }
    }

    return checks;
  }

  private checkThresholds(metrics: SystemMetrics): void {
    // CPU threshold
    if (metrics.cpu > 80) {
      this.createAlert({
        type: metrics.cpu > 95 ? 'critical' : 'warning',
        service: 'system',
        message: `High CPU usage: ${metrics.cpu.toFixed(1)}%`,
        metadata: { cpu: metrics.cpu }
      });
    }

    // Memory threshold
    if (metrics.memory > 85) {
      this.createAlert({
        type: metrics.memory > 95 ? 'critical' : 'warning',
        service: 'system',
        message: `High memory usage: ${metrics.memory.toFixed(1)}%`,
        metadata: { memory: metrics.memory }
      });
    }

    // Disk threshold
    if (metrics.disk > 90) {
      this.createAlert({
        type: 'warning',
        service: 'system',
        message: `High disk usage: ${metrics.disk.toFixed(1)}%`,
        metadata: { disk: metrics.disk }
      });
    }

    // Database connections threshold
    if (metrics.database.connections > 15) {
      this.createAlert({
        type: 'warning',
        service: 'database',
        message: `High database connections: ${metrics.database.connections}`,
        metadata: { connections: metrics.database.connections }
      });
    }

    // Slow queries threshold
    if (metrics.database.slowQueries > 5) {
      this.createAlert({
        type: 'warning',
        service: 'database',
        message: `High number of slow queries: ${metrics.database.slowQueries}`,
        metadata: { slowQueries: metrics.database.slowQueries }
      });
    }
  }

  private createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      resolved: false,
      ...alertData
    };

    this.alerts.push(alert);

    // Log do alerta
    this.logger.warn('Alert created', alert);

    // Enviar para sistemas externos (Slack, email, etc.)
    this.sendAlertNotification(alert);

    // Limitar número de alertas em memória
    if (this.alerts.length > 10000) {
      this.alerts = this.alerts.slice(-5000);
    }
  }

  private async sendAlertNotification(alert: Alert): Promise<void> {
    try {
      // Integração com Slack
      if (process.env.SLACK_WEBHOOK_URL && alert.type === 'critical') {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 *${alert.type.toUpperCase()}* Alert`,
            attachments: [{
              color: alert.type === 'critical' ? 'danger' : 'warning',
              fields: [
                { title: 'Service', value: alert.service, short: true },
                { title: 'Message', value: alert.message, short: false },
                { title: 'Time', value: alert.timestamp, short: true }
              ]
            }]
          })
        });
      }

      // Integração com email (SendGrid, SES, etc.)
      if (process.env.EMAIL_ALERTS_ENABLED === 'true' && alert.type === 'critical') {
        // Implementar envio de email
        this.logger.info('Email alert would be sent', { alert });
      }

    } catch (error: any) {
      this.logger.error('Failed to send alert notification', { 
        error: error.message, 
        alert 
      });
    }
  }

  // =======================
  // 📊 MÉTRICAS DO SISTEMA
  // =======================
  private async getCpuUsage(): Promise<number> {
    // Simulação realista de CPU
    const baseUsage = 15 + Math.random() * 20; // 15-35% base
    const spikes = Math.random() > 0.9 ? Math.random() * 40 : 0; // Picos ocasionais
    return Math.min(100, baseUsage + spikes);
  }

  private async getMemoryUsage(): Promise<number> {
    const used = process.memoryUsage();
    const total = 8 * 1024 * 1024 * 1024; // 8GB simulado
    return (used.heapUsed / total) * 100;
  }

  private async getDiskUsage(): Promise<number> {
    // Simulação de uso de disco
    return 45 + Math.random() * 10; // 45-55%
  }

  private async getNetworkStats(): Promise<any> {
    return {
      bytesIn: Math.floor(Math.random() * 1000000) + 500000,
      bytesOut: Math.floor(Math.random() * 800000) + 300000
    };
  }

  private async getDatabaseStats(): Promise<any> {
    const stats = await this.db.getStats();
    return {
      connections: stats.pool_stats?.total_connections || 5,
      queries: Math.floor(Math.random() * 100) + 50,
      slowQueries: Math.floor(Math.random() * 3)
    };
  }

  private async getServicesStatus(): Promise<any> {
    const services = {};
    
    for (const service of this.services) {
      services[service] = {
        status: Math.random() > 0.95 ? 'degraded' : 'healthy',
        responseTime: Math.floor(Math.random() * 200) + 50,
        lastCheck: new Date().toISOString()
      };
    }
    
    return services;
  }

  private getSystemHealth(): any {
    const latest = this.metrics[this.metrics.length - 1];
    if (!latest) {
      return { status: 'unknown' };
    }

    const isHealthy = latest.cpu < 80 && 
                     latest.memory < 85 && 
                     latest.disk < 90;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      cpu: latest.cpu,
      memory: latest.memory,
      disk: latest.disk
    };
  }

  // =======================
  // 🧮 CÁLCULOS E UTILITÁRIOS
  // =======================
  private calculateAverage(metrics: SystemMetrics[], field: string): number {
    if (metrics.length === 0) return 0;
    
    const values = metrics.map(m => this.getNestedValue(m, field)).filter(v => v !== undefined);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private getNestedValue(obj: any, path: string): number {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private calculateAverageResponseTime(metrics: SystemMetrics[]): number {
    if (metrics.length === 0) return 0;
    
    const responseTimes = metrics.flatMap(m => 
      Object.values(m.services).map(s => s.responseTime)
    );
    
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  private calculateTrend(metrics: SystemMetrics[], field: string): string {
    if (metrics.length < 2) return 'stable';
    
    const recent = metrics.slice(-10);
    const first = this.getNestedValue(recent[0], field);
    const last = this.getNestedValue(recent[recent.length - 1], field);
    
    const change = ((last - first) / first) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  private calculateErrorRate(metrics: SystemMetrics[]): number {
    // Simular taxa de erro baseada em alertas
    const recentAlerts = this.alerts.filter(a => 
      new Date(a.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000 &&
      (a.type === 'error' || a.type === 'critical')
    );
    
    return (recentAlerts.length / Math.max(1, metrics.length)) * 100;
  }

  private getHealthyServicesCount(): number {
    const latest = this.metrics[this.metrics.length - 1];
    if (!latest) return 0;
    
    return Object.values(latest.services).filter(s => s.status === 'healthy').length;
  }

  private getAlertsByType(): any {
    const byType = {};
    this.alerts.forEach(alert => {
      byType[alert.type] = (byType[alert.type] || 0) + 1;
    });
    return byType;
  }

  private getAlertsByService(): any {
    const byService = {};
    this.alerts.forEach(alert => {
      byService[alert.service] = (byService[alert.service] || 0) + 1;
    });
    return byService;
  }

  private getServicePort(service: string): number {
    const ports = {
      'auth-service': 3001,
      'billing-service': 3002,
      'social-automation-service': 3003,
      'ai-media-service': 3004,
      'analytics-service': 3005
    };
    return ports[service] || 3000;
  }

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 dias
    this.metrics = this.metrics.filter(m => 
      new Date(m.timestamp).getTime() > cutoff
    );
    
    this.logger.info('Old metrics cleaned up', { 
      remaining: this.metrics.length 
    });
  }

  private cleanupOldAlerts(): void {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 dias
    const before = this.alerts.length;
    
    this.alerts = this.alerts.filter(a => 
      new Date(a.timestamp).getTime() > cutoff || !a.resolved
    );
    
    this.logger.info('Old alerts cleaned up', { 
      before, 
      after: this.alerts.length,
      removed: before - this.alerts.length
    });
  }

  // =======================
  // 🚀 INICIAR SERVIÇO
  // =======================
  public start(port: number = 3000): void {
    this.app.listen(port, () => {
      console.log(`📡 Monitoring Service rodando na porta ${port}`);
      console.log(`📊 Dashboard: http://localhost:${port}/dashboard`);
      console.log(`🚨 Alertas: http://localhost:${port}/alerts`);
      console.log(`📈 Métricas: http://localhost:${port}/metrics`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default MonitoringService;
