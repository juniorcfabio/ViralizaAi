// =======================
// 🔐 SERVIÇO DE AUTENTICAÇÃO - MICROSERVIÇO
// =======================

import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import DatabaseService from '../database/DatabaseService';
import SecurityService from '../securityService';

interface AuthRequest extends express.Request {
  user?: any;
}

class AuthService {
  private app: express.Application;
  private db: DatabaseService;
  private security: SecurityService;
  private jwtSecret: string;

  constructor() {
    this.app = express();
    this.db = DatabaseService.getInstance();
    this.security = SecurityService.getInstance();
    this.jwtSecret = process.env.JWT_SECRET || 'ultra-secure-jwt-secret-change-in-production';
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Segurança básica
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Rate limiting agressivo para auth
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // máximo 5 tentativas por IP
      message: {
        error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use('/login', authLimiter);
    this.app.use('/register', authLimiter);

    // Middleware de logs
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', async () => {
        const duration = Date.now() - start;
        
        await this.db.createAuditLog({
          action: `${req.method} ${req.path}`,
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
      });

      next();
    });
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    return sanitized;
  }

  private setupRoutes(): void {
    // =======================
    // 🔐 REGISTRO DE USUÁRIO
    // =======================
    this.app.post('/register', [
      body('name').isLength({ min: 2, max: 100 }).trim().escape(),
      body('email').isEmail().normalizeEmail(),
      body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
      body('cpf').optional().matches(/^\d{11}$/)
    ], async (req: AuthRequest, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Dados inválidos',
            details: errors.array()
          });
        }

        const { name, email, password, cpf } = req.body;

        // Verificar se usuário já existe
        const existingUser = await this.db.getUserByEmail(email);
        if (existingUser) {
          await this.db.createAuditLog({
            action: 'register_attempt_duplicate_email',
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            success: false,
            error_message: 'Email já cadastrado',
            severity: 'warn'
          });

          return res.status(409).json({
            success: false,
            error: 'Email já cadastrado'
          });
        }

        // Hash da senha
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Criar usuário
        const user = await this.db.createUser({
          name,
          email,
          cpf,
          password_hash: passwordHash,
          plan: 'mensal',
          status: 'active'
        });

        // Gerar token JWT
        const token = this.generateJWT(user);

        await this.db.createAuditLog({
          user_id: user.id,
          action: 'user_registered',
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          success: true,
          severity: 'info'
        });

        res.status(201).json({
          success: true,
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              plan: user.plan,
              status: user.status
            },
            token,
            expires_in: '24h'
          }
        });

      } catch (error: any) {
        console.error('❌ Erro no registro:', error);
        
        await this.db.createAuditLog({
          action: 'register_error',
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          success: false,
          error_message: error.message,
          severity: 'error'
        });

        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });

    // =======================
    // 🔑 LOGIN DE USUÁRIO
    // =======================
    this.app.post('/login', [
      body('email').isEmail().normalizeEmail(),
      body('password').isLength({ min: 1 })
    ], async (req: AuthRequest, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Dados inválidos'
          });
        }

        const { email, password } = req.body;

        // Buscar usuário
        const user = await this.db.getUserByEmail(email);
        if (!user) {
          await this.db.createAuditLog({
            action: 'login_attempt_invalid_email',
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            success: false,
            error_message: 'Email não encontrado',
            severity: 'warn'
          });

          return res.status(401).json({
            success: false,
            error: 'Credenciais inválidas'
          });
        }

        // Verificar senha
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
          await this.db.createAuditLog({
            user_id: user.id,
            action: 'login_attempt_invalid_password',
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            success: false,
            error_message: 'Senha inválida',
            severity: 'warn'
          });

          return res.status(401).json({
            success: false,
            error: 'Credenciais inválidas'
          });
        }

        // Verificar status da conta
        if (user.status !== 'active') {
          await this.db.createAuditLog({
            user_id: user.id,
            action: 'login_attempt_inactive_account',
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            success: false,
            error_message: `Conta com status: ${user.status}`,
            severity: 'warn'
          });

          return res.status(403).json({
            success: false,
            error: 'Conta inativa ou suspensa'
          });
        }

        // Atualizar último login
        await this.db.updateUser(user.id, {
          last_login: new Date(),
          login_count: (user.login_count || 0) + 1
        });

        // Gerar token JWT
        const token = this.generateJWT(user);

        await this.db.createAuditLog({
          user_id: user.id,
          action: 'user_login_success',
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          success: true,
          severity: 'info'
        });

        res.json({
          success: true,
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              plan: user.plan,
              status: user.status
            },
            token,
            expires_in: '24h'
          }
        });

      } catch (error: any) {
        console.error('❌ Erro no login:', error);
        
        await this.db.createAuditLog({
          action: 'login_error',
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          success: false,
          error_message: error.message,
          severity: 'error'
        });

        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });

    // =======================
    // 🔄 REFRESH TOKEN
    // =======================
    this.app.post('/refresh', this.authenticateToken, async (req: AuthRequest, res) => {
      try {
        const user = await this.db.getUserById(req.user.id);
        if (!user || user.status !== 'active') {
          return res.status(401).json({
            success: false,
            error: 'Token inválido'
          });
        }

        const newToken = this.generateJWT(user);

        res.json({
          success: true,
          data: {
            token: newToken,
            expires_in: '24h'
          }
        });

      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });

    // =======================
    // 👤 PERFIL DO USUÁRIO
    // =======================
    this.app.get('/profile', this.authenticateToken, async (req: AuthRequest, res) => {
      try {
        const user = await this.db.getUserById(req.user.id);
        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'Usuário não encontrado'
          });
        }

        res.json({
          success: true,
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            plan: user.plan,
            status: user.status,
            created_at: user.created_at,
            last_login: user.last_login,
            login_count: user.login_count
          }
        });

      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });

    // =======================
    // 🛡️ VALIDAÇÃO DE PLANO
    // =======================
    this.app.post('/validate-plan', this.authenticateToken, async (req: AuthRequest, res) => {
      try {
        const { requiredPlan } = req.body;
        
        const user = await this.db.getUserById(req.user.id);
        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'Usuário não encontrado'
          });
        }

        const hasAccess = this.security.validatePlanAccess(user.plan, requiredPlan, req.user.isAdmin);

        res.json({
          success: true,
          data: {
            hasAccess,
            currentPlan: user.plan,
            requiredPlan
          }
        });

      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });

    // =======================
    // 🚪 LOGOUT
    // =======================
    this.app.post('/logout', this.authenticateToken, async (req: AuthRequest, res) => {
      try {
        await this.db.createAuditLog({
          user_id: req.user.id,
          action: 'user_logout',
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          success: true,
          severity: 'info'
        });

        res.json({
          success: true,
          message: 'Logout realizado com sucesso'
        });

      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });

    // =======================
    // 📊 HEALTH CHECK
    // =======================
    this.app.get('/health', async (req, res) => {
      try {
        const dbHealth = await this.db.healthCheck();
        const stats = await this.db.getStats();

        res.json({
          success: true,
          service: 'auth-service',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: dbHealth ? 'connected' : 'disconnected',
          stats
        });
      } catch (error) {
        res.status(503).json({
          success: false,
          service: 'auth-service',
          status: 'unhealthy',
          error: 'Database connection failed'
        });
      }
    });
  }

  // =======================
  // 🔐 MIDDLEWARE DE AUTENTICAÇÃO
  // =======================
  private authenticateToken = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso requerido'
      });
    }

    jwt.verify(token, this.jwtSecret, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Token inválido ou expirado'
        });
      }

      req.user = user;
      next();
    });
  };

  // =======================
  // 🎫 GERAÇÃO DE JWT
  // =======================
  private generateJWT(user: any): string {
    const payload = {
      id: user.id,
      email: user.email,
      plan: user.plan,
      isAdmin: user.email.includes('@viralizaai.com') || user.cpf === '01484270657'
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '24h',
      issuer: 'viralizaai-auth-service',
      audience: 'viralizaai-users'
    });
  }

  // =======================
  // 🚀 INICIAR SERVIÇO
  // =======================
  public start(port: number = 3001): void {
    this.app.listen(port, () => {
      console.log(`🔐 Auth Service rodando na porta ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default AuthService;
