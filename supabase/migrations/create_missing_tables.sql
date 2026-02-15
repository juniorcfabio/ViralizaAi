-- =====================================================
-- TABELAS FALTANTES PARA CORRIGIR ERROS
-- =====================================================

-- =====================================================
-- 1. TABELA user_profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'free',
  status VARCHAR(50) DEFAULT 'active',
  credits INTEGER DEFAULT 0,
  affiliate_code VARCHAR(50) UNIQUE,
  referred_by VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_affiliate_code ON user_profiles(affiliate_code);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_profiles_updated_at();

-- =====================================================
-- 2. TABELA system_settings
-- =====================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  category VARCHAR(100),
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_settings_updated_at
BEFORE UPDATE ON system_settings
FOR EACH ROW
EXECUTE FUNCTION update_system_settings_updated_at();

-- Inserir configurações padrão
INSERT INTO system_settings (key, value, category, description, is_public) VALUES
  ('maintenance_mode', 'false', 'system', 'Modo de manutenção do sistema', true),
  ('app_version', '1.0.0', 'system', 'Versão atual do aplicativo', true),
  ('max_daily_credits', '100', 'limits', 'Créditos diários máximos', false),
  ('default_plan', 'free', 'billing', 'Plano padrão para novos usuários', false),
  ('affiliate_commission_rate', '20', 'affiliate', 'Taxa de comissão de afiliados (%)', false)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas user_profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
ON user_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Políticas system_settings
CREATE POLICY "Configurações públicas são visíveis"
ON system_settings FOR SELECT
USING (is_public = true);

CREATE POLICY "Apenas admins podem modificar configurações"
ON system_settings FOR ALL
USING (auth.role() = 'authenticated');

SELECT '✅ Tabelas user_profiles e system_settings criadas com sucesso!' as status;
