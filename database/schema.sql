-- =======================
-- 🗄️ BANCO DE DADOS COMPLETO - NÍVEL ENTERPRISE
-- =======================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =======================
-- 👥 USUÁRIOS
-- =======================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  cpf TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  plan TEXT DEFAULT 'mensal' CHECK (plan IN ('mensal', 'trimestral', 'semestral', 'anual')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  email_verified BOOLEAN DEFAULT FALSE,
  phone TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  language TEXT DEFAULT 'pt-BR',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0
);

-- Índices para performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_cpf ON users(cpf);
CREATE INDEX idx_users_plan ON users(plan);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =======================
-- 🔐 TOKENS DE REDES SOCIAIS (CRIPTOGRAFADOS)
-- =======================
CREATE TABLE social_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'facebook', 'twitter', 'youtube', 'linkedin', 'telegram')),
  token_encrypted TEXT NOT NULL,
  token_type TEXT DEFAULT 'bearer',
  expires_at TIMESTAMP WITH TIME ZONE,
  refresh_token_encrypted TEXT,
  scope TEXT[],
  account_id TEXT,
  account_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_social_tokens_user_id ON social_tokens(user_id);
CREATE INDEX idx_social_tokens_platform ON social_tokens(platform);
CREATE INDEX idx_social_tokens_active ON social_tokens(is_active);
CREATE UNIQUE INDEX idx_social_tokens_user_platform ON social_tokens(user_id, platform, account_id);

-- =======================
-- 💳 ASSINATURAS E BILLING
-- =======================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_payment_method_id TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('mensal', 'trimestral', 'semestral', 'anual')),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL',
  billing_cycle_anchor TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan);

-- =======================
-- 🧾 FATURAS E PAGAMENTOS
-- =======================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_invoice_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  attempt_count INTEGER DEFAULT 0,
  next_payment_attempt TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- =======================
-- 📊 LOGS DE AUDITORIA
-- =======================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  session_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  request_data JSONB,
  response_data JSONB,
  duration_ms INTEGER,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warn', 'error', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Particionamento por data para performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_ip ON audit_logs(ip_address);

-- =======================
-- ⚙️ LIMITES DE USO
-- =======================
CREATE TABLE usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool TEXT NOT NULL,
  plan TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  limit_count INTEGER NOT NULL,
  reset_period TEXT DEFAULT 'monthly' CHECK (reset_period IN ('daily', 'weekly', 'monthly', 'yearly')),
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_reset TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_usage_limits_user_tool ON usage_limits(user_id, tool);
CREATE INDEX idx_usage_limits_next_reset ON usage_limits(next_reset);

-- =======================
-- 🔄 FILAS DE PROCESSAMENTO
-- =======================
CREATE TABLE job_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  job_type TEXT NOT NULL,
  priority INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
  payload JSONB NOT NULL,
  result JSONB,
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_job_queue_status ON job_queue(status);
CREATE INDEX idx_job_queue_priority ON job_queue(priority);
CREATE INDEX idx_job_queue_scheduled_at ON job_queue(scheduled_at);
CREATE INDEX idx_job_queue_user_id ON job_queue(user_id);

-- =======================
-- 📈 MÉTRICAS E ANALYTICS
-- =======================
CREATE TABLE user_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value DECIMAL(15,2),
  metric_data JSONB,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_metrics_user_id ON user_metrics(user_id);
CREATE INDEX idx_user_metrics_type ON user_metrics(metric_type);
CREATE INDEX idx_user_metrics_period ON user_metrics(period_start, period_end);

-- =======================

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_email_sent ON notifications(email_sent);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS update_system_config_updated_at ON system_config;

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    SET usage_count = 0, 
        last_reset = NOW(),
        next_reset = CASE 
            WHEN reset_period = 'daily' THEN NOW() + INTERVAL '1 day'
            WHEN reset_period = 'weekly' THEN NOW() + INTERVAL '1 week'
            WHEN reset_period = 'monthly' THEN NOW() + INTERVAL '1 month'
            WHEN reset_period = 'yearly' THEN NOW() + INTERVAL '1 year'
        END
    WHERE next_reset <= NOW();
END;
$$ LANGUAGE plpgsql;

-- =======================
-- 📊 VIEWS PARA ANALYTICS
-- =======================

-- View para estatísticas de usuários
CREATE VIEW user_stats AS
SELECT 
    plan,
    COUNT(*) as total_users,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
    COUNT(CASE WHEN last_login > NOW() - INTERVAL '7 days' THEN 1 END) as weekly_active,
    COUNT(CASE WHEN last_login > NOW() - INTERVAL '30 days' THEN 1 END) as monthly_active,
    AVG(login_count) as avg_login_count
FROM users 
GROUP BY plan;

-- View para métricas de receita
CREATE VIEW revenue_metrics AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    plan,
    COUNT(*) as subscriptions,
    SUM(amount) as total_revenue,
    AVG(amount) as avg_revenue
FROM subscriptions 
WHERE status = 'active'
GROUP BY DATE_TRUNC('month', created_at), plan
ORDER BY month DESC;

-- =======================
-- 🔐 POLÍTICAS DE SEGURANÇA RLS
-- =======================

-- Habilitar RLS nas tabelas sensíveis
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (usuários só veem seus próprios dados)
CREATE POLICY user_isolation ON users FOR ALL USING (id = current_setting('app.current_user_id')::UUID);
CREATE POLICY social_tokens_isolation ON social_tokens FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY subscriptions_isolation ON subscriptions FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY usage_limits_isolation ON usage_limits FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY user_sessions_isolation ON user_sessions FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);
CREATE POLICY security_settings_isolation ON security_settings FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

-- =======================
-- 📋 DADOS INICIAIS
-- =======================

-- Planos padrão com limites
INSERT INTO usage_limits (user_id, tool, plan, limit_count, reset_period) 
SELECT 
    u.id,
    tool.name,
    u.plan,
    CASE u.plan
        WHEN 'mensal' THEN tool.mensal_limit
        WHEN 'trimestral' THEN tool.trimestral_limit
        WHEN 'semestral' THEN tool.semestral_limit
        WHEN 'anual' THEN tool.anual_limit
    END,
    'monthly'
FROM users u
CROSS JOIN (
    VALUES 
        ('scheduleContent', 50, 200, 500, 2000),
        ('generateCopy', 30, 120, 300, 1200),
        ('editVideo', 10, 40, 100, 400),
        ('generateHashtags', 100, 400, 1000, 4000),
        ('createChatbot', 5, 20, 50, 200),
        ('analyzeCompetitors', 20, 80, 200, 800)
) AS tool(name, mensal_limit, trimestral_limit, semestral_limit, anual_limit)
ON CONFLICT (user_id, tool) DO NOTHING;
