-- =====================================================
-- VIRALIZAAI - SISTEMA DE CONTROLE DE ACESSO POR PAGAMENTO
-- Migration: 001_payment_access_control.sql
-- Executar no Supabase SQL Editor
-- =====================================================

-- 1️⃣ TABELA: subscriptions (Assinaturas de planos)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('mensal', 'trimestral', 'semestral', 'anual')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired', 'at_risk')),
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'pix')),
  payment_id TEXT,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_id ON subscriptions(payment_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);

-- 2️⃣ TABELA: purchases (Compras avulsas de ferramentas)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'pix')),
  payment_id TEXT,
  stripe_session_id TEXT,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_id ON purchases(payment_id);

-- 3️⃣ TABELA: user_access (Acesso efetivo do usuário a ferramentas)
CREATE TABLE IF NOT EXISTS user_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  access_type TEXT NOT NULL DEFAULT 'subscription' CHECK (access_type IN ('subscription', 'purchase', 'admin', 'trial')),
  source_id UUID, -- FK para subscriptions.id ou purchases.id
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tool_name)
);

CREATE INDEX IF NOT EXISTS idx_user_access_user_id ON user_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_tool ON user_access(tool_name);
CREATE INDEX IF NOT EXISTS idx_user_access_active ON user_access(is_active);
CREATE INDEX IF NOT EXISTS idx_user_access_valid ON user_access(valid_until);

-- 4️⃣ TABELA: user_credits (Preparação futura para sistema de créditos)
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  credits_total INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  credits_remaining INTEGER GENERATED ALWAYS AS (credits_total - credits_used) STORED,
  daily_usage INTEGER NOT NULL DEFAULT 0,
  daily_limit INTEGER NOT NULL DEFAULT 20,
  last_daily_reset TIMESTAMPTZ DEFAULT NOW(),
  monthly_ai_generations INTEGER NOT NULL DEFAULT 0,
  monthly_videos INTEGER NOT NULL DEFAULT 0,
  monthly_ebooks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- 5️⃣ TABELA: webhook_events (Idempotência de webhooks)
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'pix')),
  payload JSONB DEFAULT '{}',
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'processed'
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);

-- 6️⃣ FUNÇÕES UTILITÁRIAS

-- Função: Ativar acesso após pagamento confirmado (subscription)
CREATE OR REPLACE FUNCTION activate_subscription_access(
  p_user_id TEXT,
  p_subscription_id UUID,
  p_plan_type TEXT,
  p_end_date TIMESTAMPTZ
)
RETURNS void AS $$
DECLARE
  tool_name TEXT;
  all_tools TEXT[];
  plan_tools TEXT[];
BEGIN
  -- Definir ferramentas por plano
  all_tools := ARRAY[
    'Gerador de Scripts IA',
    'Criador de Thumbnails',
    'Analisador de Trends',
    'Otimizador de SEO',
    'Gerador de Hashtags',
    'Criador de Logos',
    'Agendamento Multiplataforma',
    'IA de Copywriting',
    'Tradutor Automático',
    'Gerador de QR Code',
    'Editor de Vídeo Pro',
    'Gerador de Ebooks Premium',
    'Gerador de Animações',
    'IA Video Generator 8K',
    'AI Funil Builder'
  ];

  -- Selecionar ferramentas baseado no plano
  CASE p_plan_type
    WHEN 'mensal' THEN plan_tools := all_tools[1:6];
    WHEN 'trimestral' THEN plan_tools := all_tools[1:9];
    WHEN 'semestral' THEN plan_tools := all_tools[1:12];
    WHEN 'anual' THEN plan_tools := all_tools;
    ELSE plan_tools := all_tools[1:6];
  END CASE;

  -- Desativar acessos antigos por subscription deste usuário
  UPDATE user_access 
  SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id AND access_type = 'subscription';

  -- Inserir novos acessos
  FOREACH tool_name IN ARRAY plan_tools
  LOOP
    INSERT INTO user_access (user_id, tool_name, access_type, source_id, valid_until, is_active)
    VALUES (p_user_id, tool_name, 'subscription', p_subscription_id, p_end_date, true)
    ON CONFLICT (user_id, tool_name)
    DO UPDATE SET 
      access_type = 'subscription',
      source_id = p_subscription_id,
      valid_until = p_end_date,
      is_active = true,
      updated_at = NOW();
  END LOOP;

  -- Inicializar créditos do usuário se não existirem
  INSERT INTO user_credits (user_id, daily_limit)
  VALUES (p_user_id, CASE p_plan_type
    WHEN 'mensal' THEN 20
    WHEN 'trimestral' THEN 50
    WHEN 'semestral' THEN 100
    WHEN 'anual' THEN 999999
    ELSE 20
  END)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    daily_limit = CASE p_plan_type
      WHEN 'mensal' THEN 20
      WHEN 'trimestral' THEN 50
      WHEN 'semestral' THEN 100
      WHEN 'anual' THEN 999999
      ELSE 20
    END,
    daily_usage = 0,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Função: Ativar acesso após compra avulsa de ferramenta
CREATE OR REPLACE FUNCTION activate_purchase_access(
  p_user_id TEXT,
  p_purchase_id UUID,
  p_tool_name TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_access (user_id, tool_name, access_type, source_id, is_active)
  VALUES (p_user_id, p_tool_name, 'purchase', p_purchase_id, true)
  ON CONFLICT (user_id, tool_name)
  DO UPDATE SET 
    access_type = 'purchase',
    source_id = p_purchase_id,
    valid_until = NULL, -- compra avulsa não expira
    is_active = true,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Função: Verificar se usuário tem acesso a ferramenta
CREATE OR REPLACE FUNCTION check_user_tool_access(
  p_user_id TEXT,
  p_tool_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_access
    WHERE user_id = p_user_id
      AND tool_name = p_tool_name
      AND is_active = true
      AND (valid_until IS NULL OR valid_until > NOW())
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql;

-- Função: Desativar todos os acessos de um usuário (cancelamento)
CREATE OR REPLACE FUNCTION deactivate_user_access(p_user_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE user_access 
  SET is_active = false, updated_at = NOW()
  WHERE user_id = p_user_id AND access_type = 'subscription';
END;
$$ LANGUAGE plpgsql;

-- Função: Reset diário de uso
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void AS $$
BEGIN
  UPDATE user_credits
  SET daily_usage = 0, last_daily_reset = NOW(), updated_at = NOW()
  WHERE last_daily_reset < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 7️⃣ RLS (Row Level Security) - Opcional, ativar se necessário
-- ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_access ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
