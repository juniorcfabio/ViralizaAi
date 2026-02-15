-- =====================================================
-- CORRIGIR POLÍTICAS RLS - PERMITIR ACESSO TOTAL
-- =====================================================

-- 1. DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE tool_pricing DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLÍTICAS EXISTENTES
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.tablename;
    END LOOP;
END $$;

-- 3. CRIAR POLÍTICAS PERMISSIVAS (ACESSO TOTAL)
CREATE POLICY "Permitir SELECT em user_profiles"
ON user_profiles FOR SELECT
USING (true);

CREATE POLICY "Permitir INSERT em user_profiles"
ON user_profiles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir UPDATE em user_profiles"
ON user_profiles FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir DELETE em user_profiles"
ON user_profiles FOR DELETE
USING (true);

-- system_settings
CREATE POLICY "Permitir SELECT em system_settings"
ON system_settings FOR SELECT
USING (true);

CREATE POLICY "Permitir INSERT em system_settings"
ON system_settings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir UPDATE em system_settings"
ON system_settings FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir DELETE em system_settings"
ON system_settings FOR DELETE
USING (true);

-- pricing_config
CREATE POLICY "Permitir SELECT em pricing_config"
ON pricing_config FOR SELECT
USING (true);

CREATE POLICY "Permitir INSERT em pricing_config"
ON pricing_config FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir UPDATE em pricing_config"
ON pricing_config FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir DELETE em pricing_config"
ON pricing_config FOR DELETE
USING (true);

-- tool_pricing
CREATE POLICY "Permitir SELECT em tool_pricing"
ON tool_pricing FOR SELECT
USING (true);

CREATE POLICY "Permitir INSERT em tool_pricing"
ON tool_pricing FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir UPDATE em tool_pricing"
ON tool_pricing FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir DELETE em tool_pricing"
ON tool_pricing FOR DELETE
USING (true);

-- 4. REABILITAR RLS COM POLÍTICAS PERMISSIVAS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_pricing ENABLE ROW LEVEL SECURITY;

SELECT '✅ Políticas RLS corrigidas - Acesso total permitido!' as status;
