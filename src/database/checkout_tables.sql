-- TABELAS PARA SISTEMA DE CHECKOUT DIRETO
-- Executa criação de tabelas necessárias para o checkout funcionar

-- Tabela de sessões de checkout
CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  plan_id UUID,
  stripe_session_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'brl',
  billing_interval TEXT CHECK (billing_interval IN ('monthly', 'yearly', 'one-time')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de planos (se não existir)
CREATE TABLE IF NOT EXISTS plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  stripe_price_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_stripe_session_id ON checkout_sessions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status ON checkout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_plans_name ON plans(name);

-- RLS (Row Level Security)
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para checkout_sessions
DROP POLICY IF EXISTS "Users can view their own checkout sessions" ON checkout_sessions;
CREATE POLICY "Users can view their own checkout sessions" ON checkout_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own checkout sessions" ON checkout_sessions;
CREATE POLICY "Users can insert their own checkout sessions" ON checkout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own checkout sessions" ON checkout_sessions;
CREATE POLICY "Users can update their own checkout sessions" ON checkout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para plans (leitura pública)
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON plans;
CREATE POLICY "Plans are viewable by everyone" ON plans
  FOR SELECT USING (true);

-- Inserir planos padrão se não existirem
INSERT INTO plans (name, price_monthly, price_yearly, features, stripe_price_id)
VALUES 
  ('Mensal', 59.90, NULL, ARRAY['Crescimento Orgânico', 'Gestão de Conteúdo', 'Análises Básicas'], 'price_monthly_basic'),
  ('Trimestral', 159.90, NULL, ARRAY['Tudo do Mensal', 'Análises Avançadas', 'IA Otimizada'], 'price_quarterly_pro'),
  ('Anual', 599.90, 599.90, ARRAY['Tudo do Trimestral', 'Suporte Premium', 'Recursos Exclusivos'], 'price_yearly_premium')
ON CONFLICT (name) DO NOTHING;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_checkout_sessions_updated_at ON checkout_sessions;
CREATE TRIGGER update_checkout_sessions_updated_at
    BEFORE UPDATE ON checkout_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
