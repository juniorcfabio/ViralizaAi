// =======================
// 🌐 API GATEWAY - ORQUESTRADOR PRINCIPAL
// =======================

import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import compression from 'compression';
import jwt from 'jsonwebtoken';
import httpProxy from 'http-proxy-middleware';
import DatabaseService from '../database/DatabaseService';

interface ServiceRoute {
  path: string;
  target: string;
  auth: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

interface GatewayRequest extends express.Request {
  user?: any;
}

class APIGateway {
  private app: express.Application;
  private db: DatabaseService;
  private jwtSecret: string;
  private services: Map<string, ServiceRoute> = new Map();

  constructor() {
    this.app = express();
    this.db = DatabaseService.getInstance();
    this.jwtSecret = process.env.JWT_SECRET || 'ultra-secure-jwt-secret-change-in-production';
    
    this.setupServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupProxies();
  }

  private setupServices(): void {
    // Definir rotas dos microserviços
    this.services.set('auth', {
      path: '/api/auth',
      target: `http://localhost:${process.env.AUTH_SERVICE_PORT || 3001}`,
      auth: false
    });

    this.services.set('billing', {
      path: '/api/billing',
      target: `http://localhost:${process.env.BILLING_SERVICE_PORT || 3002}`,
      auth: true,
      rateLimit: { windowMs: 15 * 60 * 1000, max: 20 }
    });

    this.services.set('social', {
      path: '/api/social',
      target: `http://localhost:${process.env.SOCIAL_SERVICE_PORT || 3003}`,
      auth: true,
      rateLimit: { windowMs: 60 * 1000, max: 30 }
    });

    this.services.set('ai-media', {
      path: '/api/ai-media',
      target: `http://localhost:${process.env.AI_MEDIA_SERVICE_PORT || 3004}`,
      auth: true,
      rateLimit: { windowMs: 60 * 1000, max: 10 }
    });

    this.services.set('analytics', {
      path: '/api/analytics',
      target: `http://localhost:${process.env.ANALYTICS_SERVICE_PORT || 3005}`,
      auth: true
    });

    this.services.set('monitoring', {
      path: '/api/monitoring',
      target: `http://localhost:${process.env.MONITORING_SERVICE_PORT || 3000}`,
      auth: false // Monitoring pode ser público para health checks
    });
  }

  private setupMiddleware(): void {
    // Segurança avançada
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https://api.stripe.com", "wss:"],
          frameSrc: ["'self'", "https://js.stripe.com"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configurado para produção
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://viralizaai.vercel.app', 'https://www.viralizaai.com']
        : ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
    }));

    // Compressão
    this.app.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      }
    }));

    // Body parsing
    this.app.use(express.json({ 
      limit: '50mb',
      verify: (req, res, buf) => {
        // Verificar se o body não é malicioso
        if (buf.length > 50 * 1024 * 1024) {
          throw new Error('Request body too large');
        }
      }
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '50mb' 
    }));

    // Rate limiting global
    const globalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 1000, // máximo 1000 requests por IP
      message: {
        error: 'Muitas requisições. Tente novamente em 15 minutos.',
        code: 'GLOBAL_RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        // Usar IP real mesmo atrás de proxy
        return req.ip || req.connection.remoteAddress || 'unknown';
      }
    });

    this.app.use(globalLimiter);

    // Middleware de logging
    this.app.use(this.requestLogger);

    // Trust proxy para Vercel/Heroku
    this.app.set('trust proxy', 1);
  }

  private requestLogger = async (req: GatewayRequest, res: express.Response, next: express.NextFunction) => {
    const start = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Adicionar request ID aos headers
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    res.on('finish', async () => {
      const duration = Date.now() - start;
      
      try {
        await this.db.createAuditLog({
          user_id: req.user?.id,
          action: `${req.method} ${req.path}`,
          resource_type: 'api_request',
          resource_id: requestId,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          success: res.statusCode < 400,
          duration_ms: duration,
          severity: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
          request_data: {
            method: req.method,
            path: req.path,
            query: req.query,
            headers: this.sanitizeHeaders(req.headers)
          },
          response_data: {
            status: res.statusCode,
            headers: this.sanitizeHeaders(res.getHeaders())
          }
        });
      } catch (error) {
        console.error('❌ Erro ao salvar log:', error);
      }
    });

    next();
  };

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    delete sanitized['stripe-signature'];
    return sanitized;
  }

  private setupRoutes(): void {
    // =======================
    // 🏠 ROTA PRINCIPAL
    // =======================
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        service: 'ViralizaAI API Gateway',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
          auth: '/api/auth',
          billing: '/api/billing',
          social: '/api/social',
          aiMedia: '/api/ai-media',
          analytics: '/api/analytics',
          monitoring: '/api/monitoring'
        },
        documentation: 'https://docs.viralizaai.com',
        status: 'https://status.viralizaai.com'
      });
    });

    // =======================
    // 🏥 HEALTH CHECK AGREGADO
    // =======================
    this.app.get('/health', async (req, res) => {
      try {
        const services = Array.from(this.services.entries());
        const healthChecks = await Promise.allSettled(
          services.map(async ([name, config]) => {
            try {
              const response = await fetch(`${config.target}/health`, {
                timeout: 5000
              });
              return {
                service: name,
                status: response.ok ? 'healthy' : 'degraded',
                responseTime: Date.now() - Date.now(),
                url: config.target
              };
            } catch (error) {
              return {
                service: name,
                status: 'down',
                error: error.message,
                url: config.target
              };
            }
          })
        );

        const results = healthChecks.map(result => 
          result.status === 'fulfilled' ? result.value : {
            service: 'unknown',
            status: 'error',
            error: result.reason
          }
        );

        const allHealthy = results.every(r => r.status === 'healthy');
        const dbHealth = await this.db.healthCheck();

        res.status(allHealthy && dbHealth ? 200 : 503).json({
          success: allHealthy && dbHealth,
          status: allHealthy && dbHealth ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          gateway: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: '2.0.0'
          },
          database: dbHealth ? 'connected' : 'disconnected',
          services: results
        });

      } catch (error: any) {
        res.status(503).json({
          success: false,
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // =======================
    // 📊 MÉTRICAS AGREGADAS
    // =======================
    this.app.get('/metrics', async (req, res) => {
      try {
        // Buscar métricas de todos os serviços
        const metricsPromises = Array.from(this.services.entries())
          .filter(([name]) => name !== 'auth') // Auth não tem métricas
          .map(async ([name, config]) => {
            try {
              const response = await fetch(`${config.target}/metrics`, {
                timeout: 3000
              });
              if (response.ok) {
                const data = await response.json();
                return { service: name, metrics: data.data };
              }
            } catch (error) {
              return { service: name, error: error.message };
            }
          });

        const metricsResults = await Promise.allSettled(metricsPromises);
        const metrics = metricsResults
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value);

        res.json({
          success: true,
          timestamp: new Date().toISOString(),
          gateway: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            requests: await this.getRequestStats()
          },
          services: metrics
        });

      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // =======================
    // 🔐 VALIDAÇÃO DE TOKEN
    // =======================
    this.app.post('/api/validate-token', this.authenticateToken, (req: GatewayRequest, res) => {
      res.json({
        success: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          plan: req.user.plan,
          isAdmin: req.user.isAdmin
        },
        token: {
          valid: true,
          expiresIn: req.user.exp - Math.floor(Date.now() / 1000)
        }
      });
    });

    // =======================
    // 🚫 ROTA 404
    // =======================
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: Array.from(this.services.values()).map(s => s.path)
      });
    });

    // =======================
    // 🚨 ERROR HANDLER GLOBAL
    // =======================
    this.app.use(this.errorHandler);
  }

  private setupProxies(): void {
    // Configurar proxies para cada microserviço
    this.services.forEach((config, serviceName) => {
      const middlewares = [];

      // Rate limiting específico do serviço
      if (config.rateLimit) {
        middlewares.push(rateLimit({
          windowMs: config.rateLimit.windowMs,
          max: config.rateLimit.max,
          message: {
            error: `Rate limit excedido para ${serviceName}`,
            service: serviceName
          }
        }));
      }

      // Autenticação se necessária
      if (config.auth) {
        middlewares.push(this.authenticateToken);
      }

      // Middleware de validação de plano para serviços pagos
      if (serviceName !== 'auth' && serviceName !== 'monitoring') {
        middlewares.push(this.validatePlan);
      }

      // Proxy para o microserviço
      const proxyMiddleware = httpProxy.createProxyMiddleware({
        target: config.target,
        changeOrigin: true,
        pathRewrite: {
          [`^${config.path}`]: ''
        },
        timeout: 30000,
        proxyTimeout: 30000,
        onError: (err, req, res) => {
          console.error(`❌ Proxy error for ${serviceName}:`, err.message);
          
          if (!res.headersSent) {
            res.status(503).json({
              success: false,
              error: `Serviço ${serviceName} temporariamente indisponível`,
              service: serviceName,
              code: 'SERVICE_UNAVAILABLE'
            });
          }
        },
        onProxyReq: (proxyReq, req: GatewayRequest) => {
          // Adicionar headers de contexto
          if (req.user) {
            proxyReq.setHeader('X-User-ID', req.user.id);
            proxyReq.setHeader('X-User-Plan', req.user.plan);
            proxyReq.setHeader('X-User-Admin', req.user.isAdmin ? 'true' : 'false');
          }
          
          proxyReq.setHeader('X-Gateway-Version', '2.0.0');
          proxyReq.setHeader('X-Request-Time', Date.now().toString());
        },
        onProxyRes: (proxyRes, req, res) => {
          // Adicionar headers de resposta
          proxyRes.headers['X-Service'] = serviceName;
          proxyRes.headers['X-Gateway'] = 'ViralizaAI-Gateway-v2';
        }
      });

      // Aplicar middlewares e proxy
      this.app.use(config.path, ...middlewares, proxyMiddleware);

      console.log(`🔗 Proxy configurado: ${config.path} -> ${config.target}`);
    });
  }

  // =======================
  // 🔐 MIDDLEWARE DE AUTENTICAÇÃO
  // =======================
  private authenticateToken = (req: GatewayRequest, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso requerido',
        code: 'MISSING_TOKEN'
      });
    }

    jwt.verify(token, this.jwtSecret, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Token inválido ou expirado',
          code: 'INVALID_TOKEN'
        });
      }

      req.user = user;
      next();
    });
  };

  // =======================
  // 🛡️ MIDDLEWARE DE VALIDAÇÃO DE PLANO
  // =======================
  private validatePlan = async (req: GatewayRequest, res: express.Response, next: express.NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // Buscar usuário atualizado do banco
      const user = await this.db.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verificar se a conta está ativa
      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          error: 'Conta inativa ou suspensa',
          code: 'ACCOUNT_INACTIVE',
          status: user.status
        });
      }

      // Atualizar dados do usuário na requisição
      req.user.plan = user.plan;
      req.user.status = user.status;

      next();

    } catch (error: any) {
      console.error('❌ Erro na validação de plano:', error);
      
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  // =======================
  // 🚨 ERROR HANDLER
  // =======================
  private errorHandler = async (error: any, req: GatewayRequest, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Gateway Error:', error);

    // Log do erro
    try {
      await this.db.createAuditLog({
        user_id: req.user?.id,
        action: 'gateway_error',
        resource_type: 'error',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        success: false,
        error_message: error.message,
        severity: 'error',
        request_data: {
          method: req.method,
          path: req.path,
          query: req.query
        }
      });
    } catch (logError) {
      console.error('❌ Erro ao salvar log de erro:', logError);
    }

    // Resposta de erro padronizada
    if (!res.headersSent) {
      res.status(error.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
          ? 'Erro interno do servidor' 
          : error.message,
        code: error.code || 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id']
      });
    }
  };

  // =======================
  // 📊 ESTATÍSTICAS
  // =======================
  private async getRequestStats(): Promise<any> {
    // Buscar estatísticas dos últimos logs
    const logs = await this.db.getAuditLogs(undefined, 1000);
    
    const last24h = logs.filter(log => 
      new Date(log.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );

    return {
      total24h: last24h.length,
      successful: last24h.filter(log => log.success).length,
      errors: last24h.filter(log => !log.success).length,
      avgDuration: last24h.reduce((sum, log) => sum + (log.duration_ms || 0), 0) / last24h.length || 0,
      topEndpoints: this.getTopEndpoints(last24h),
      errorRate: (last24h.filter(log => !log.success).length / last24h.length * 100) || 0
    };
  }

  private getTopEndpoints(logs: any[]): any[] {
    const endpoints = {};
    
    logs.forEach(log => {
      const endpoint = log.action;
      endpoints[endpoint] = (endpoints[endpoint] || 0) + 1;
    });

    return Object.entries(endpoints)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  // =======================
  // 🚀 INICIAR GATEWAY
  // =======================
  public start(port: number = 8080): void {
    this.app.listen(port, () => {
      console.log(`🌐 API Gateway rodando na porta ${port}`);
      console.log(`🏥 Health check: http://localhost:${port}/health`);
      console.log(`📊 Métricas: http://localhost:${port}/metrics`);
      console.log(`📚 Documentação: http://localhost:${port}/`);
      
      console.log('\n🔗 Serviços configurados:');
      this.services.forEach((config, name) => {
        console.log(`   ${name}: ${config.path} -> ${config.target}`);
      });
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default APIGateway;
