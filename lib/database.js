// 🗄️ CONFIGURAÇÃO DO BANCO DE DADOS SUPABASE
import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Pool } = pkg;

// 🔧 CONFIGURAÇÃO SUPABASE
const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// 🌐 CLIENTE SUPABASE (FRONTEND)
export const supabase = createClient(supabaseUrl, supabaseKey);

// 🔐 CLIENTE SUPABASE ADMIN (BACKEND)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// 🐘 POOL DE CONEXÃO POSTGRESQL DIRETO
let pool = null;

export function getPool() {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL não configurada');
      return null;
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // 🔍 EVENTOS DE CONEXÃO
    pool.on('connect', () => {
      console.log('✅ Conectado ao PostgreSQL');
    });

    pool.on('error', (err) => {
      console.error('❌ Erro no pool PostgreSQL:', err);
    });
  }

  return pool;
}

// 🔍 EXECUTAR QUERY
export async function query(text, params) {
  const pool = getPool();
  if (!pool) {
    throw new Error('Pool de conexão não disponível');
  }

  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executada:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Erro na query:', { text, error: error.message });
    throw error;
  }
}

// 🧪 TESTAR CONEXÃO
export async function testConnection() {
  try {
    console.log('🧪 Testando conexão com banco...');
    
    // TESTE 1: Supabase Client
    if (supabase) {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (!error) {
        console.log('✅ Supabase Client conectado');
      } else {
        console.log('⚠️ Supabase Client:', error.message);
      }
    }

    // TESTE 2: PostgreSQL Pool
    const pool = getPool();
    if (pool) {
      const result = await query('SELECT NOW() as current_time');
      console.log('✅ PostgreSQL conectado:', result.rows[0].current_time);
    }

    return true;
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
    return false;
  }
}

// 🔄 INICIALIZAR CONEXÃO
export async function initializeDatabase() {
  try {
    console.log('🚀 Inicializando banco de dados...');
    
    const isConnected = await testConnection();
    if (isConnected) {
      console.log('✅ Banco de dados inicializado com sucesso');
      return true;
    } else {
      console.error('❌ Falha na inicialização do banco');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    return false;
  }
}

// 🏗️ EXECUTAR MIGRATIONS
export async function runMigrations() {
  try {
    console.log('🏗️ Executando migrations...');
    
    // CRIAR TABELA DE MIGRATIONS SE NÃO EXISTIR
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // LISTA DE MIGRATIONS
    const migrations = [
      'create_users_table',
      'create_subscriptions_table',
      'create_affiliate_tables',
      'create_marketplace_tables',
      'create_franchise_tables',
      'create_whitelabel_tables',
      'create_api_clients_table'
    ];

    for (const migration of migrations) {
      const { rows } = await query(
        'SELECT * FROM migrations WHERE name = $1',
        [migration]
      );

      if (rows.length === 0) {
        console.log(`🔄 Executando migration: ${migration}`);
        await executeMigration(migration);
        await query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migration]
        );
        console.log(`✅ Migration executada: ${migration}`);
      } else {
        console.log(`⏭️ Migration já executada: ${migration}`);
      }
    }

    console.log('✅ Todas as migrations executadas');
    return true;
  } catch (error) {
    console.error('❌ Erro nas migrations:', error);
    return false;
  }
}

// 🏗️ EXECUTAR MIGRATION ESPECÍFICA
async function executeMigration(migrationName) {
  switch (migrationName) {
    case 'create_users_table':
      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          plano VARCHAR(50) DEFAULT 'free',
          plano_ativo BOOLEAN DEFAULT false,
          stripe_customer_id VARCHAR(255),
          affiliate_code VARCHAR(50) UNIQUE,
          referred_by VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      break;

    case 'create_subscriptions_table':
      await query(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          stripe_subscription_id VARCHAR(255) UNIQUE,
          status VARCHAR(50),
          plan_type VARCHAR(50),
          current_period_start TIMESTAMP,
          current_period_end TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      break;

    case 'create_affiliate_tables':
      await query(`
        CREATE TABLE IF NOT EXISTS affiliates (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          affiliate_code VARCHAR(50) UNIQUE NOT NULL,
          commission_rate DECIMAL(5,4) DEFAULT 0.30,
          total_earnings DECIMAL(10,2) DEFAULT 0,
          available_balance DECIMAL(10,2) DEFAULT 0,
          total_referrals INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'active',
          pix_key VARCHAR(255),
          bank_details JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS affiliate_commissions (
          id SERIAL PRIMARY KEY,
          affiliate_id INTEGER REFERENCES affiliates(id),
          user_id INTEGER REFERENCES users(id),
          order_id VARCHAR(255),
          commission_amount DECIMAL(10,2),
          commission_rate DECIMAL(5,4),
          order_value DECIMAL(10,2),
          status VARCHAR(20) DEFAULT 'pending',
          paid_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      break;

    case 'create_marketplace_tables':
      await query(`
        CREATE TABLE IF NOT EXISTS marketplace_tools (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          price DECIMAL(10,2),
          icon VARCHAR(50),
          features JSONB,
          min_plan VARCHAR(50),
          popularity INTEGER DEFAULT 0,
          rating DECIMAL(3,2) DEFAULT 0,
          total_sales INTEGER DEFAULT 0,
          created_by VARCHAR(50) DEFAULT 'system',
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_tools (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          tool_id INTEGER REFERENCES marketplace_tools(id),
          purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          usage_count INTEGER DEFAULT 0,
          last_used TIMESTAMP
        );
      `);
      break;

    case 'create_franchise_tables':
      await query(`
        CREATE TABLE IF NOT EXISTS franchises (
          id SERIAL PRIMARY KEY,
          franchisee_id INTEGER REFERENCES users(id),
          territory_id VARCHAR(100),
          package_type VARCHAR(50),
          status VARCHAR(50),
          subdomain VARCHAR(100) UNIQUE,
          custom_domain VARCHAR(255),
          api_key VARCHAR(255) UNIQUE,
          initial_fee DECIMAL(10,2),
          royalty_rate DECIMAL(5,4),
          total_revenue DECIMAL(12,2) DEFAULT 0,
          total_royalties DECIMAL(12,2) DEFAULT 0,
          max_users INTEGER,
          current_users INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      break;

    case 'create_whitelabel_tables':
      await query(`
        CREATE TABLE IF NOT EXISTS whitelabel_clients (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          company VARCHAR(255),
          subdomain VARCHAR(100) UNIQUE,
          custom_domain VARCHAR(255),
          api_key VARCHAR(255) UNIQUE,
          branding JSONB,
          technical_config JSONB,
          commercial_config JSONB,
          stats JSONB DEFAULT '{}',
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      break;

    case 'create_api_clients_table':
      await query(`
        CREATE TABLE IF NOT EXISTS api_clients (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          company VARCHAR(255),
          api_key VARCHAR(255) UNIQUE NOT NULL,
          secret_key VARCHAR(255) NOT NULL,
          tier VARCHAR(50) DEFAULT 'free',
          status VARCHAR(20) DEFAULT 'active',
          usage_stats JSONB DEFAULT '{}',
          billing_info JSONB DEFAULT '{}',
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS api_usage_logs (
          id SERIAL PRIMARY KEY,
          client_id INTEGER REFERENCES api_clients(id),
          endpoint VARCHAR(255),
          method VARCHAR(10),
          status_code INTEGER,
          response_time INTEGER,
          cost DECIMAL(10,6),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      break;

    default:
      console.log(`⚠️ Migration não encontrada: ${migrationName}`);
  }
}

// 🔄 FECHAR CONEXÕES
export async function closeConnections() {
  if (pool) {
    await pool.end();
    console.log('🔌 Conexões do pool fechadas');
  }
}

// 🚀 AUTO-INICIALIZAÇÃO EM PRODUÇÃO
if (process.env.NODE_ENV === 'production') {
  initializeDatabase().then(() => {
    runMigrations();
  });
}
