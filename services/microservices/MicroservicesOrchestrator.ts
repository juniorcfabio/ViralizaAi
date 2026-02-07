// =======================
// 🎼 ORQUESTRADOR DE MICROSERVIÇOS - SISTEMA COMPLETO
// =======================

import APIGateway from './APIGateway';
import AuthService from './AuthService';
import BillingService from './BillingService';
import SocialAutomationService from './SocialAutomationService';
import MonitoringService from './MonitoringService';
import DatabaseService from '../database/DatabaseService';

interface ServiceConfig {
  name: string;
  port: number;
  enabled: boolean;
  healthCheckPath: string;
  dependencies: string[];
}

class MicroservicesOrchestrator {
  private services: Map<string, any> = new Map();
  private serviceConfigs: Map<string, ServiceConfig> = new Map();
  private db: DatabaseService;
  private isStarted: boolean = false;

  constructor() {
    this.db = DatabaseService.getInstance();
    this.setupServiceConfigs();
  }

  private setupServiceConfigs(): void {
    // Configuração dos microserviços
    this.serviceConfigs.set('monitoring', {
      name: 'Monitoring Service',
      port: parseInt(process.env.MONITORING_SERVICE_PORT || '3000'),
      enabled: true,
      healthCheckPath: '/health',
      dependencies: []
    });

    this.serviceConfigs.set('auth', {
      name: 'Authentication Service',
      port: parseInt(process.env.AUTH_SERVICE_PORT || '3001'),
      enabled: true,
      healthCheckPath: '/health',
      dependencies: ['monitoring']
    });

    this.serviceConfigs.set('billing', {
      name: 'Billing Service',
      port: parseInt(process.env.BILLING_SERVICE_PORT || '3002'),
      enabled: true,
      healthCheckPath: '/health',
      dependencies: ['monitoring', 'auth']
    });

    this.serviceConfigs.set('social', {
      name: 'Social Automation Service',
      port: parseInt(process.env.SOCIAL_SERVICE_PORT || '3003'),
      enabled: true,
      healthCheckPath: '/health',
      dependencies: ['monitoring', 'auth']
    });

    this.serviceConfigs.set('gateway', {
      name: 'API Gateway',
      port: parseInt(process.env.GATEWAY_PORT || '8080'),
      enabled: true,
      healthCheckPath: '/health',
      dependencies: ['monitoring', 'auth', 'billing', 'social']
    });
  }

  // =======================
  // 🚀 INICIALIZAÇÃO SEQUENCIAL
  // =======================
  public async start(): Promise<void> {
    if (this.isStarted) {
      console.log('⚠️ Orquestrador já está rodando');
      return;
    }

    console.log('🎼 Iniciando Orquestrador de Microserviços ViralizaAI v2.0');
    console.log('=' .repeat(60));

    try {
      // 1. Verificar banco de dados
      await this.checkDatabase();

      // 2. Iniciar serviços em ordem de dependência
      await this.startServicesInOrder();

      // 3. Verificar saúde de todos os serviços
      await this.performHealthChecks();

      // 4. Configurar monitoramento contínuo
      this.setupContinuousMonitoring();

      this.isStarted = true;
      
      console.log('=' .repeat(60));
      console.log('✅ TODOS OS MICROSERVIÇOS INICIADOS COM SUCESSO!');
      console.log('🌐 API Gateway: http://localhost:8080');
      console.log('📊 Monitoring: http://localhost:3000/dashboard');
      console.log('🔐 Auth Service: http://localhost:3001');
      console.log('💳 Billing Service: http://localhost:3002');
      console.log('🤖 Social Service: http://localhost:3003');
      console.log('=' .repeat(60));

    } catch (error: any) {
      console.error('❌ Erro ao iniciar microserviços:', error.message);
      await this.shutdown();
      throw error;
    }
  }

  private async checkDatabase(): Promise<void> {
    console.log('🗄️ Verificando conexão com banco de dados...');
    
    const isHealthy = await this.db.healthCheck();
    if (!isHealthy) {
      throw new Error('Banco de dados não está acessível');
    }

    console.log('✅ Banco de dados conectado');
  }

  private async startServicesInOrder(): Promise<void> {
    const startOrder = this.getStartupOrder();
    
    for (const serviceName of startOrder) {
      const config = this.serviceConfigs.get(serviceName);
      if (!config || !config.enabled) {
        console.log(`⏭️ Pulando ${serviceName} (desabilitado)`);
        continue;
      }

      console.log(`🚀 Iniciando ${config.name}...`);
      
      try {
        await this.startService(serviceName, config);
        console.log(`✅ ${config.name} iniciado na porta ${config.port}`);
        
        // Aguardar um pouco antes do próximo serviço
        await this.sleep(2000);
        
      } catch (error: any) {
        console.error(`❌ Erro ao iniciar ${config.name}:`, error.message);
        throw error;
      }
    }
  }

  private getStartupOrder(): string[] {
    // Ordenação topológica baseada nas dependências
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (serviceName: string) => {
      if (visited.has(serviceName)) return;
      
      const config = this.serviceConfigs.get(serviceName);
      if (!config) return;

      // Visitar dependências primeiro
      for (const dep of config.dependencies) {
        visit(dep);
      }

      visited.add(serviceName);
      order.push(serviceName);
    };

    // Visitar todos os serviços
    for (const serviceName of this.serviceConfigs.keys()) {
      visit(serviceName);
    }

    return order;
  }

  private async startService(serviceName: string, config: ServiceConfig): Promise<void> {
    switch (serviceName) {
      case 'monitoring':
        const monitoringService = new MonitoringService();
        this.services.set('monitoring', monitoringService);
        monitoringService.start(config.port);
        break;

      case 'auth':
        const authService = new AuthService();
        this.services.set('auth', authService);
        authService.start(config.port);
        break;

      case 'billing':
        const billingService = new BillingService();
        this.services.set('billing', billingService);
        billingService.start(config.port);
        break;

      case 'social':
        const socialService = new SocialAutomationService();
        this.services.set('social', socialService);
        socialService.start(config.port);
        break;

      case 'gateway':
        const gateway = new APIGateway();
        this.services.set('gateway', gateway);
        gateway.start(config.port);
        break;

      default:
        throw new Error(`Serviço desconhecido: ${serviceName}`);
    }

    // Aguardar o serviço ficar pronto
    await this.waitForService(config.port, config.healthCheckPath);
  }

  private async waitForService(port: number, healthPath: string, maxAttempts: number = 30): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(`http://localhost:${port}${healthPath}`);
        if (response.ok) {
          return;
        }
      } catch (error) {
        // Serviço ainda não está pronto
      }

      if (attempt === maxAttempts) {
        throw new Error(`Serviço na porta ${port} não ficou pronto após ${maxAttempts} tentativas`);
      }

      await this.sleep(1000);
    }
  }

  private async performHealthChecks(): Promise<void> {
    console.log('🏥 Verificando saúde de todos os serviços...');

    const healthPromises = Array.from(this.serviceConfigs.entries())
      .filter(([, config]) => config.enabled)
      .map(async ([name, config]) => {
        try {
          const response = await fetch(`http://localhost:${config.port}${config.healthCheckPath}`);
          const data = await response.json();
          
          return {
            service: name,
            status: response.ok ? 'healthy' : 'unhealthy',
            port: config.port,
            data
          };
        } catch (error: any) {
          return {
            service: name,
            status: 'error',
            port: config.port,
            error: error.message
          };
        }
      });

    const results = await Promise.all(healthPromises);
    
    console.log('\n📊 Status dos Serviços:');
    results.forEach(result => {
      const status = result.status === 'healthy' ? '✅' : '❌';
      console.log(`   ${status} ${result.service} (porta ${result.port}): ${result.status}`);
    });

    const unhealthyServices = results.filter(r => r.status !== 'healthy');
    if (unhealthyServices.length > 0) {
      throw new Error(`Serviços não saudáveis: ${unhealthyServices.map(s => s.service).join(', ')}`);
    }

    console.log('✅ Todos os serviços estão saudáveis');
  }

  private setupContinuousMonitoring(): void {
    // Monitoramento contínuo a cada 5 minutos
    setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error: any) {
        console.error('⚠️ Problema detectado no monitoramento contínuo:', error.message);
        
        // Log do problema
        await this.db.createAuditLog({
          action: 'continuous_monitoring_alert',
          resource_type: 'orchestrator',
          success: false,
          error_message: error.message,
          severity: 'error'
        });
      }
    }, 5 * 60 * 1000);

    console.log('🔄 Monitoramento contínuo configurado (5 min)');
  }

  // =======================
  // 🛑 SHUTDOWN GRACEFUL
  // =======================
  public async shutdown(): Promise<void> {
    if (!this.isStarted) {
      console.log('⚠️ Orquestrador não está rodando');
      return;
    }

    console.log('🛑 Iniciando shutdown graceful...');

    // Parar serviços em ordem reversa
    const shutdownOrder = this.getStartupOrder().reverse();
    
    for (const serviceName of shutdownOrder) {
      try {
        console.log(`🛑 Parando ${serviceName}...`);
        
        const service = this.services.get(serviceName);
        if (service && typeof service.stop === 'function') {
          await service.stop();
        }
        
        console.log(`✅ ${serviceName} parado`);
      } catch (error: any) {
        console.error(`❌ Erro ao parar ${serviceName}:`, error.message);
      }
    }

    // Fechar conexão com banco
    try {
      await this.db.close();
      console.log('✅ Conexão com banco fechada');
    } catch (error: any) {
      console.error('❌ Erro ao fechar banco:', error.message);
    }

    this.isStarted = false;
    console.log('✅ Shutdown completo');
  }

  // =======================
  // 📊 STATUS E MÉTRICAS
  // =======================
  public async getStatus(): Promise<any> {
    if (!this.isStarted) {
      return {
        status: 'stopped',
        services: {}
      };
    }

    const serviceStatuses = {};
    
    for (const [name, config] of this.serviceConfigs.entries()) {
      if (!config.enabled) continue;

      try {
        const response = await fetch(`http://localhost:${config.port}${config.healthCheckPath}`);
        const data = await response.json();
        
        serviceStatuses[name] = {
          status: response.ok ? 'healthy' : 'unhealthy',
          port: config.port,
          uptime: data.uptime || 0,
          lastCheck: new Date().toISOString()
        };
      } catch (error: any) {
        serviceStatuses[name] = {
          status: 'error',
          port: config.port,
          error: error.message,
          lastCheck: new Date().toISOString()
        };
      }
    }

    return {
      status: 'running',
      startedAt: new Date().toISOString(),
      services: serviceStatuses,
      database: await this.db.healthCheck() ? 'connected' : 'disconnected'
    };
  }

  public async getMetrics(): Promise<any> {
    const metrics = {
      orchestrator: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        servicesCount: this.services.size
      },
      services: {}
    };

    // Coletar métricas de cada serviço
    for (const [name, config] of this.serviceConfigs.entries()) {
      if (!config.enabled) continue;

      try {
        const response = await fetch(`http://localhost:${config.port}/metrics`);
        if (response.ok) {
          const data = await response.json();
          metrics.services[name] = data.data || data;
        }
      } catch (error) {
        metrics.services[name] = { error: 'Metrics unavailable' };
      }
    }

    return metrics;
  }

  // =======================
  // 🔧 UTILITÁRIOS
  // =======================
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public isRunning(): boolean {
    return this.isStarted;
  }

  public getServices(): string[] {
    return Array.from(this.services.keys());
  }

  // =======================
  // 🔄 RESTART DE SERVIÇO
  // =======================
  public async restartService(serviceName: string): Promise<void> {
    const config = this.serviceConfigs.get(serviceName);
    if (!config) {
      throw new Error(`Serviço ${serviceName} não encontrado`);
    }

    console.log(`🔄 Reiniciando ${config.name}...`);

    // Parar serviço atual
    const service = this.services.get(serviceName);
    if (service && typeof service.stop === 'function') {
      await service.stop();
    }

    // Aguardar um pouco
    await this.sleep(2000);

    // Iniciar novamente
    await this.startService(serviceName, config);
    
    console.log(`✅ ${config.name} reiniciado com sucesso`);
  }

  // =======================
  // 📈 SCALING (FUTURO)
  // =======================
  public async scaleService(serviceName: string, instances: number): Promise<void> {
    // Implementação futura para scaling horizontal
    console.log(`🔧 Scaling de ${serviceName} para ${instances} instâncias (não implementado)`);
  }
}

// =======================
// 🎯 SINGLETON E EXPORT
// =======================
let orchestratorInstance: MicroservicesOrchestrator | null = null;

export function getOrchestrator(): MicroservicesOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new MicroservicesOrchestrator();
  }
  return orchestratorInstance;
}

export default MicroservicesOrchestrator;
