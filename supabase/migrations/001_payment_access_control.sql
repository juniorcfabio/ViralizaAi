-- =====================================================
-- VIRALIZAAI - SISTEMA DE CONTROLE DE ACESSO POR PAGAMENTO
-- Migration: 001_payment_access_control.sql
-- Executar no Supabase SQL Editor
-- SEGURO: Adiciona colunas faltantes a tabelas existentes
-- =====================================================

-- ============================================================
-- 1️⃣ TABELA: subscriptions (Assinaturas de planos)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas que podem não existir na tabela existente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='plan_type') THEN
    ALTER TABLE subscriptions ADD COLUMN plan_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='status') THEN
    ALTER TABLE subscriptions ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='payment_provider') THEN
    ALTER TABLE subscriptions ADD COLUMN payment_provider TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='payment_id') THEN
    ALTER TABLE subscriptions ADD COLUMN payment_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='stripe_subscription_id') THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_subscription_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='stripe_customer_id') THEN
    ALTER TABLE subscriptions ADD COLUMN stripe_customer_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='amount') THEN
    ALTER TABLE subscriptions ADD COLUMN amount DECIMAL(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='start_date') THEN
    ALTER TABLE subscriptions ADD COLUMN start_date TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='end_date') THEN
    ALTER TABLE subscriptions ADD COLUMN end_date TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='cancelled_at') THEN
    ALTER TABLE subscriptions ADD COLUMN cancelled_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='updated_at') THEN
    ALTER TABLE subscriptions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_id ON subscriptions(payment_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);

-- ============================================================
-- 2️⃣ TABELA: purchases (Compras avulsas de ferramentas)
-- ============================================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='tool_name') THEN
    ALTER TABLE purchases ADD COLUMN tool_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='status') THEN
    ALTER TABLE purchases ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='payment_provider') THEN
    ALTER TABLE purchases ADD COLUMN payment_provider TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='payment_id') THEN
    ALTER TABLE purchases ADD COLUMN payment_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='stripe_session_id') THEN
    ALTER TABLE purchases ADD COLUMN stripe_session_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='amount') THEN
    ALTER TABLE purchases ADD COLUMN amount DECIMAL(10,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='confirmed_at') THEN
    ALTER TABLE purchases ADD COLUMN confirmed_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchases' AND column_name='updated_at') THEN
    ALTER TABLE purchases ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_id ON purchases(payment_id);

-- ============================================================
-- 3️⃣ TABELA: user_access (Acesso efetivo do usuário a ferramentas)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_access' AND column_name='access_type') THEN
    ALTER TABLE user_access ADD COLUMN access_type TEXT DEFAULT 'subscription';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_access' AND column_name='source_id') THEN
    ALTER TABLE user_access ADD COLUMN source_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_access' AND column_name='valid_until') THEN
    ALTER TABLE user_access ADD COLUMN valid_until TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_access' AND column_name='is_active') THEN
    ALTER TABLE user_access ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_access' AND column_name='updated_at') THEN
    ALTER TABLE user_access ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Adicionar constraint UNIQUE se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_access_user_id_tool_name_key'
  ) THEN
    ALTER TABLE user_access ADD CONSTRAINT user_access_user_id_tool_name_key UNIQUE (user_id, tool_name);
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'UNIQUE constraint já existe ou não pôde ser criada: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_access_user_id ON user_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_tool ON user_access(tool_name);
CREATE INDEX IF NOT EXISTS idx_user_access_active ON user_access(is_active);
CREATE INDEX IF NOT EXISTS idx_user_access_valid ON user_access(valid_until);

-- ============================================================
-- 4️⃣ TABELA: user_credits (Sistema de créditos e limites)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_credits' AND column_name='credits_total') THEN
    ALTER TABLE user_credits ADD COLUMN credits_total INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_credits' AND column_name='credits_used') THEN
    ALTER TABLE user_credits ADD COLUMN credits_used INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_credits' AND column_name='daily_usage') THEN
    ALTER TABLE user_credits ADD COLUMN daily_usage INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_credits' AND column_name='daily_limit') THEN
    ALTER TABLE user_credits ADD COLUMN daily_limit INTEGER DEFAULT 20;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_credits' AND column_name='last_daily_reset') THEN
    ALTER TABLE user_credits ADD COLUMN last_daily_reset TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_credits' AND column_name='monthly_ai_generations') THEN
    ALTER TABLE user_credits ADD COLUMN monthly_ai_generations INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_credits' AND column_name='monthly_videos') THEN
    ALTER TABLE user_credits ADD COLUMN monthly_videos INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_credits' AND column_name='monthly_ebooks') THEN
    ALTER TABLE user_credits ADD COLUMN monthly_ebooks INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_credits' AND column_name='updated_at') THEN
    ALTER TABLE user_credits ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- ============================================================
-- 5️⃣ TABELA: webhook_events (Idempotência de webhooks)
-- ============================================================
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL,
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
