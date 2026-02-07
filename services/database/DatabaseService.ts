// =======================
// 🗄️ SERVIÇO DE BANCO DE DADOS - NÍVEL ENTERPRISE
// =======================

import { Pool, PoolClient } from 'pg';
import crypto from 'crypto';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  plan: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  status: 'active' | 'suspended' | 'deleted';
  created_at: Date;
  updated_at: Date;
}

interface UsageLimit {
  user_id: string;
  tool: string;
  usage_count: number;
  limit_count: number;
  next_reset: Date;
}

interface AuditLog {
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  request_data?: any;
  response_data?: any;
  duration_ms?: number;
  severity: 'debug' | 'info' | 'warn' | 'error' | 'critical';
}

class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool;
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.DB_ENCRYPTION_KEY || 'default-key-change-in-production';
    
    const config: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'viralizaai',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: process.env.NODE_ENV === 'production',
      max: 20, // máximo de conexões no pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    };

    this.pool = new Pool(config);
    this.setupEventHandlers();
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private setupEventHandlers(): void {
    this.pool.on('error', (err) => {
      console.error('🔥 Erro no pool de conexões:', err);
    });

    this.pool.on('connect', () => {
      console.log('🔗 Nova conexão estabelecida com o banco');
    });

    this.pool.on('remove', () => {
      console.log('🔌 Conexão removida do pool');
    });
  }

  // =======================
  // 🔐 CRIPTOGRAFIA
  // =======================

  private encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, this.encryptionKey);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-gcm';
    const parts = encryptedText.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Formato de dados criptografados inválido');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(algorithm, this.encryptionKey);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // =======================
  // 👥 OPERAÇÕES DE USUÁRIO
  // =======================

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO users (name, email, cpf, password_hash, plan, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const values = [
        userData.name,
        userData.email,
        userData.cpf,
        userData.password_hash,
        userData.plan,
        userData.status
      ];

      const result = await client.query(query, values);
      
      // Criar limites de uso padrão para o usuário
      await this.createDefaultUsageLimits(result.rows[0].id, userData.plan);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const client = await this.pool.connect();
    
    try {
      const query = 'SELECT * FROM users WHERE id = $1 AND status != $2';
      const result = await client.query(query, [id, 'deleted']);
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const client = await this.pool.connect();
    
    try {
      const query = 'SELECT * FROM users WHERE email = $1 AND status != $2';
      const result = await client.query(query, [email, 'deleted']);
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const client = await this.pool.connect();
    
    try {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const query = `
        UPDATE users 
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1 
        RETURNING *
      `;
      
      const values = [id, ...Object.values(updates)];
      const result = await client.query(query, values);
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // =======================
  // 🔑 TOKENS SOCIAIS
  // =======================

  async saveSocialToken(userId: string, platform: string, token: string, metadata: any = {}): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      const encryptedToken = this.encrypt(token);
      
      const query = `
        INSERT INTO social_tokens (user_id, platform, token_encrypted, account_id, account_name, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, platform, account_id)
        DO UPDATE SET 
          token_encrypted = EXCLUDED.token_encrypted,
          updated_at = NOW(),
          is_active = TRUE
      `;
      
      const values = [
        userId,
        platform,
        encryptedToken,
        metadata.account_id || null,
        metadata.account_name || null,
        metadata.expires_at || null
      ];

      await client.query(query, values);
    } finally {
      client.release();
    }
  }

  async getSocialToken(userId: string, platform: string): Promise<string | null> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT token_encrypted 
        FROM social_tokens 
        WHERE user_id = $1 AND platform = $2 AND is_active = TRUE
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const result = await client.query(query, [userId, platform]);
      
      if (result.rows[0]) {
        return this.decrypt(result.rows[0].token_encrypted);
      }
      
      return null;
    } finally {
      client.release();
    }
  }

  // =======================
  // ⚙️ LIMITES DE USO
  // =======================

  async checkUsageLimit(userId: string, tool: string): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const client = await this.pool.connect();
    
    try {
      // Reset automático se necessário
      await client.query('SELECT reset_usage_limits()');
      
      const query = `
        SELECT usage_count, limit_count, next_reset
        FROM usage_limits
        WHERE user_id = $1 AND tool = $2
      `;
      
      const result = await client.query(query, [userId, tool]);
      
      if (!result.rows[0]) {
        // Criar limite se não existir
        const user = await this.getUserById(userId);
        if (user) {
          await this.createToolUsageLimit(userId, tool, user.plan);
          return this.checkUsageLimit(userId, tool);
        }
        throw new Error('Usuário não encontrado');
      }

      const { usage_count, limit_count, next_reset } = result.rows[0];
      const remaining = Math.max(0, limit_count - usage_count);
      const allowed = usage_count < limit_count;

      return {
        allowed,
        remaining,
        resetAt: new Date(next_reset)
      };
    } finally {
      client.release();
    }
  }

  async incrementUsage(userId: string, tool: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        UPDATE usage_limits 
        SET usage_count = usage_count + 1, updated_at = NOW()
        WHERE user_id = $1 AND tool = $2
      `;
      
      await client.query(query, [userId, tool]);
    } finally {
      client.release();
    }
  }

  private async createDefaultUsageLimits(userId: string, plan: string): Promise<void> {
    const tools = [
      { name: 'scheduleContent', limits: { mensal: 50, trimestral: 200, semestral: 500, anual: 2000 }},
      { name: 'generateCopy', limits: { mensal: 30, trimestral: 120, semestral: 300, anual: 1200 }},
      { name: 'editVideo', limits: { mensal: 10, trimestral: 40, semestral: 100, anual: 400 }},
      { name: 'generateHashtags', limits: { mensal: 100, trimestral: 400, semestral: 1000, anual: 4000 }},
      { name: 'createChatbot', limits: { mensal: 5, trimestral: 20, semestral: 50, anual: 200 }},
      { name: 'analyzeCompetitors', limits: { mensal: 20, trimestral: 80, semestral: 200, anual: 800 }}
    ];

    const client = await this.pool.connect();
    
    try {
      for (const tool of tools) {
        await this.createToolUsageLimit(userId, tool.name, plan, client);
      }
    } finally {
      client.release();
    }
  }

  private async createToolUsageLimit(userId: string, tool: string, plan: string, client?: PoolClient): Promise<void> {
    const dbClient = client || await this.pool.connect();
    
    try {
      const limits = {
        mensal: { scheduleContent: 50, generateCopy: 30, editVideo: 10, generateHashtags: 100, createChatbot: 5, analyzeCompetitors: 20 },
        trimestral: { scheduleContent: 200, generateCopy: 120, editVideo: 40, generateHashtags: 400, createChatbot: 20, analyzeCompetitors: 80 },
        semestral: { scheduleContent: 500, generateCopy: 300, editVideo: 100, generateHashtags: 1000, createChatbot: 50, analyzeCompetitors: 200 },
        anual: { scheduleContent: 2000, generateCopy: 1200, editVideo: 400, generateHashtags: 4000, createChatbot: 200, analyzeCompetitors: 800 }
      };

      const limitCount = limits[plan]?.[tool] || 10;
      
      const query = `
        INSERT INTO usage_limits (user_id, tool, plan, limit_count, next_reset)
        VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 month')
        ON CONFLICT (user_id, tool) DO NOTHING
      `;
      
      await dbClient.query(query, [userId, tool, plan, limitCount]);
    } finally {
      if (!client) {
        dbClient.release();
      }
    }
  }

  // =======================
  // 📊 LOGS DE AUDITORIA
  // =======================

  async createAuditLog(logData: AuditLog): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO audit_logs (
          user_id, action, resource_type, resource_id, ip_address, 
          user_agent, success, error_message, request_data, 
          response_data, duration_ms, severity
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;
      
      const values = [
        logData.user_id || null,
        logData.action,
        logData.resource_type || null,
        logData.resource_id || null,
        logData.ip_address || null,
        logData.user_agent || null,
        logData.success,
        logData.error_message || null,
        logData.request_data ? JSON.stringify(logData.request_data) : null,
        logData.response_data ? JSON.stringify(logData.response_data) : null,
        logData.duration_ms || null,
        logData.severity
      ];

      await client.query(query, values);
    } finally {
      client.release();
    }
  }

  async getAuditLogs(userId?: string, limit: number = 100): Promise<AuditLog[]> {
    const client = await this.pool.connect();
    
    try {
      let query = `
        SELECT * FROM audit_logs 
        WHERE ($1::UUID IS NULL OR user_id = $1)
        ORDER BY created_at DESC 
        LIMIT $2
      `;
      
      const result = await client.query(query, [userId || null, limit]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // =======================
  // 💳 ASSINATURAS
  // =======================

  async createSubscription(subscriptionData: any): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO subscriptions (
          user_id, stripe_customer_id, stripe_subscription_id, 
          plan, status, current_period_start, current_period_end, 
          amount, currency, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (stripe_subscription_id) 
        DO UPDATE SET 
          status = EXCLUDED.status,
          current_period_end = EXCLUDED.current_period_end,
          updated_at = NOW()
      `;
      
      const values = [
        subscriptionData.user_id,
        subscriptionData.stripe_customer_id,
        subscriptionData.stripe_subscription_id,
        subscriptionData.plan,
        subscriptionData.status,
        subscriptionData.current_period_start,
        subscriptionData.current_period_end,
        subscriptionData.amount,
        subscriptionData.currency || 'BRL',
        JSON.stringify(subscriptionData.metadata || {})
      ];

      await client.query(query, values);
    } finally {
      client.release();
    }
  }

  async updateSubscriptionStatus(stripeSubscriptionId: string, status: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        UPDATE subscriptions 
        SET status = $1, updated_at = NOW()
        WHERE stripe_subscription_id = $2
      `;
      
      await client.query(query, [status, stripeSubscriptionId]);
    } finally {
      client.release();
    }
  }

  // =======================
  // 🔄 FILAS DE TRABALHO
  // =======================

  async addJob(jobData: { user_id?: string; job_type: string; payload: any; priority?: number }): Promise<string> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO job_queue (user_id, job_type, payload, priority)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      
      const values = [
        jobData.user_id || null,
        jobData.job_type,
        JSON.stringify(jobData.payload),
        jobData.priority || 5
      ];

      const result = await client.query(query, values);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  async getNextJob(): Promise<any | null> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        UPDATE job_queue 
        SET status = 'processing', started_at = NOW()
        WHERE id = (
          SELECT id FROM job_queue 
          WHERE status = 'pending' AND scheduled_at <= NOW()
          ORDER BY priority ASC, created_at ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING *
      `;
      
      const result = await client.query(query);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async completeJob(jobId: string, result?: any): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        UPDATE job_queue 
        SET status = 'completed', completed_at = NOW(), result = $2
        WHERE id = $1
      `;
      
      await client.query(query, [jobId, result ? JSON.stringify(result) : null]);
    } finally {
      client.release();
    }
  }

  async failJob(jobId: string, error: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      const query = `
        UPDATE job_queue 
        SET attempts = attempts + 1,
            error_message = $2,
            status = CASE 
              WHEN attempts + 1 >= max_attempts THEN 'failed'
              ELSE 'retrying'
            END,
            scheduled_at = CASE 
              WHEN attempts + 1 < max_attempts THEN NOW() + INTERVAL '5 minutes'
              ELSE scheduled_at
            END
        WHERE id = $1
      `;
      
      await client.query(query, [jobId, error]);
    } finally {
      client.release();
    }
  }

  // =======================
  // 🔧 UTILITÁRIOS
  // =======================

  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('❌ Health check falhou:', error);
      return false;
    }
  }

  async getStats(): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      const queries = await Promise.all([
        client.query('SELECT COUNT(*) as total_users FROM users WHERE status = $1', ['active']),
        client.query('SELECT COUNT(*) as active_subscriptions FROM subscriptions WHERE status = $1', ['active']),
        client.query('SELECT COUNT(*) as pending_jobs FROM job_queue WHERE status = $1', ['pending']),
        client.query('SELECT COUNT(*) as total_logs FROM audit_logs WHERE created_at > NOW() - INTERVAL $1', ['24 hours'])
      ]);

      return {
        total_users: parseInt(queries[0].rows[0].total_users),
        active_subscriptions: parseInt(queries[1].rows[0].active_subscriptions),
        pending_jobs: parseInt(queries[2].rows[0].pending_jobs),
        logs_24h: parseInt(queries[3].rows[0].total_logs),
        pool_stats: {
          total_connections: this.pool.totalCount,
          idle_connections: this.pool.idleCount,
          waiting_requests: this.pool.waitingCount
        }
      };
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export default DatabaseService;
