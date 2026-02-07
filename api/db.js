// =======================
// 🔌 CONEXÃO POSTGRESQL - STACK FINAL
// =======================

const { Pool } = require('pg');

// Configuração do pool de conexões
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Event listeners para monitoramento
pool.on('connect', () => {
  console.log('🔌 Nova conexão PostgreSQL estabelecida');
});

pool.on('error', (err) => {
  console.error('❌ Erro no pool PostgreSQL:', err);
});

// Função para executar queries com retry
const query = async (text, params) => {
  const start = Date.now();
  let client;
  
  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    
    console.log('📊 Query executada:', {
      query: text.substring(0, 100) + '...',
      duration: `${duration}ms`,
      rows: result.rowCount
    });
    
    return result;
  } catch (error) {
    console.error('❌ Erro na query:', {
      error: error.message,
      query: text.substring(0, 100) + '...',
      params
    });
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Função para transações
const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Função para verificar saúde do banco
const healthCheck = async () => {
  try {
    const result = await query('SELECT NOW() as current_time, version() as version');
    return {
      status: 'healthy',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].version,
      connections: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
};

// Funções específicas para o negócio
const userQueries = {
  // Buscar usuário por email
  findByEmail: async (email) => {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    return result.rows[0];
  },

  // Criar usuário
  create: async (userData) => {
    const { name, email, cpf, password_hash, plan = 'free' } = userData;
    const result = await query(
      `INSERT INTO users (name, email, cpf, password_hash, plan)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, cpf, password_hash, plan]
    );
    return result.rows[0];
  },

  // Atualizar último login
  updateLastLogin: async (userId) => {
    await query(
      `UPDATE users 
       SET last_login = NOW(), login_count = login_count + 1
       WHERE id = $1`,
      [userId]
    );
  },

  // Verificar assinatura ativa
  hasActiveSubscription: async (userId) => {
    const result = await query(
      `SELECT s.* FROM subscriptions s
       WHERE s.user_id = $1 
       AND s.status = 'active' 
       AND s.expires_at > NOW()`,
      [userId]
    );
    return result.rows[0];
  }
};

const subscriptionQueries = {
  // Criar assinatura
  create: async (subscriptionData) => {
    const {
      user_id,
      plan_name,
      plan_type,
      amount,
      stripe_session_id,
      expires_at
    } = subscriptionData;

    return await transaction(async (client) => {
      // Cancelar assinaturas ativas existentes
      await client.query(
        `UPDATE subscriptions 
         SET status = 'cancelled', updated_at = NOW()
         WHERE user_id = $1 AND status = 'active'`,
        [user_id]
      );

      // Criar nova assinatura
      const result = await client.query(
        `INSERT INTO subscriptions (
          user_id, plan_name, plan_type, status, amount, 
          stripe_session_id, expires_at, next_billing_date
        ) VALUES ($1, $2, $3, 'active', $4, $5, $6, $6)
        RETURNING *`,
        [user_id, plan_name, plan_type, amount, stripe_session_id, expires_at]
      );

      // Atualizar usuário
      await client.query(
        `UPDATE users 
         SET plan = $2, plan_status = 'active', plan_expires_at = $3
         WHERE id = $1`,
        [user_id, plan_type, expires_at]
      );

      return result.rows[0];
    });
  },

  // Expirar assinaturas
  expireSubscriptions: async () => {
    return await transaction(async (client) => {
      // Expirar assinaturas
      const expiredResult = await client.query(
        `UPDATE subscriptions 
         SET status = 'expired', updated_at = NOW()
         WHERE status = 'active' AND expires_at < NOW()
         RETURNING user_id`
      );

      // Atualizar usuários
      if (expiredResult.rows.length > 0) {
        const userIds = expiredResult.rows.map(row => row.user_id);
        await client.query(
          `UPDATE users 
           SET plan_status = 'expired'
           WHERE id = ANY($1)`,
          [userIds]
        );
      }

      return expiredResult.rowCount;
    });
  },

  // Buscar assinaturas que vencem em breve
  findExpiringSoon: async (days = 3) => {
    const result = await query(
      `SELECT s.*, u.email, u.name 
       FROM subscriptions s
       JOIN users u ON s.user_id = u.id
       WHERE s.status = 'active'
       AND s.expires_at BETWEEN NOW() AND NOW() + INTERVAL '${days} days'`,
    );
    return result.rows;
  }
};

const paymentQueries = {
  // Registrar pagamento
  create: async (paymentData) => {
    const {
      user_id,
      subscription_id,
      stripe_session_id,
      amount,
      status = 'paid'
    } = paymentData;

    const result = await query(
      `INSERT INTO payments (
        user_id, subscription_id, stripe_session_id, 
        amount, status, webhook_received_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *`,
      [user_id, subscription_id, stripe_session_id, amount, status]
    );
    return result.rows[0];
  },

  // Buscar por session ID
  findBySessionId: async (sessionId) => {
    const result = await query(
      'SELECT * FROM payments WHERE stripe_session_id = $1',
      [sessionId]
    );
    return result.rows[0];
  }
};

const auditQueries = {
  // Log de auditoria
  log: async (logData) => {
    const {
      user_id,
      action,
      entity_type,
      entity_id,
      details = {},
      ip_address,
      user_agent
    } = logData;

    await query(
      `INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id, 
        details, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user_id, action, entity_type, entity_id, JSON.stringify(details), ip_address, user_agent]
    );
  }
};

// Função para inicializar o banco
const initializeDatabase = async () => {
  try {
    console.log('🔄 Inicializando banco de dados...');
    
    // Verificar conexão
    const health = await healthCheck();
    if (health.status !== 'healthy') {
      throw new Error(`Banco não saudável: ${health.error}`);
    }

    console.log('✅ Banco de dados inicializado com sucesso');
    console.log(`📊 Conexões: ${health.connections.total} total, ${health.connections.idle} idle`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    throw error;
  }
};

// Graceful shutdown
const closePool = async () => {
  try {
    await pool.end();
    console.log('🔌 Pool PostgreSQL fechado');
  } catch (error) {
    console.error('❌ Erro ao fechar pool:', error);
  }
};

// Interceptar sinais de shutdown
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);

module.exports = {
  query,
  transaction,
  healthCheck,
  initializeDatabase,
  closePool,
  
  // Queries organizadas por domínio
  users: userQueries,
  subscriptions: subscriptionQueries,
  payments: paymentQueries,
  audit: auditQueries,
  
  // Pool para casos especiais
  pool
};
