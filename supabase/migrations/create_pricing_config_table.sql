-- =====================================================
-- TABELA DE CONFIGURAÇÃO DE PREÇOS
-- Armazena preços de assinaturas e anúncios
-- =====================================================

CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  category VARCHAR(50) NOT NULL CHECK (category IN ('subscription', 'advertising')),
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  period VARCHAR(50),
  discount INTEGER,
  highlight BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pricing_config_plan_id ON pricing_config(plan_id);
CREATE INDEX IF NOT EXISTS idx_pricing_config_category ON pricing_config(category);
CREATE INDEX IF NOT EXISTS idx_pricing_config_active ON pricing_config(is_active);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_pricing_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pricing_config_updated_at
BEFORE UPDATE ON pricing_config
FOR EACH ROW
EXECUTE FUNCTION update_pricing_config_updated_at();

-- =====================================================
-- INSERIR PLANOS DE ASSINATURA
-- =====================================================
INSERT INTO pricing_config (plan_id, name, price, original_price, category, description, features, period, discount, highlight) VALUES
  (
    'mensal',
    'Mensal',
    59.90,
    99.90,
    'subscription',
    'Plano mensal com acesso completo',
    '["Acesso a todas as ferramentas de IA", "Geração ilimitada de conteúdo", "Suporte prioritário", "Atualizações automáticas", "Analytics avançado"]'::jsonb,
    'mês',
    40,
    false
  ),
  (
    'trimestral',
    'Trimestral',
    159.90,
    299.70,
    'subscription',
    'Plano trimestral com desconto',
    '["Acesso a todas as ferramentas de IA", "Geração ilimitada de conteúdo", "Suporte prioritário", "Atualizações automáticas", "Analytics avançado", "3 meses de acesso"]'::jsonb,
    'trimestre',
    47,
    false
  ),
  (
    'semestral',
    'Semestral',
    259.90,
    599.40,
    'subscription',
    'Plano semestral com maior desconto',
    '["Acesso a todas as ferramentas de IA", "Geração ilimitada de conteúdo", "Suporte prioritário", "Atualizações automáticas", "Analytics avançado", "6 meses de acesso", "Bônus exclusivos"]'::jsonb,
    'semestre',
    57,
    true
  ),
  (
    'anual',
    'Anual',
    399.90,
    1198.80,
    'subscription',
    'Plano anual com máximo desconto',
    '["Acesso a todas as ferramentas de IA", "Geração ilimitada de conteúdo", "Suporte prioritário VIP", "Atualizações automáticas", "Analytics avançado", "12 meses de acesso", "Bônus exclusivos", "Consultoria mensal"]'::jsonb,
    'ano',
    67,
    false
  )
ON CONFLICT (plan_id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  features = EXCLUDED.features,
  period = EXCLUDED.period,
  discount = EXCLUDED.discount,
  highlight = EXCLUDED.highlight,
  updated_at = NOW();

-- =====================================================
-- INSERIR PLANOS DE ANÚNCIOS
-- =====================================================
INSERT INTO pricing_config (plan_id, name, price, category, description, features, period) VALUES
  (
    'ad_basic',
    'Anúncio Básico',
    49.90,
    'advertising',
    'Anúncio básico por 7 dias',
    '["Exibição por 7 dias", "Posição padrão", "Analytics básico"]'::jsonb,
    '7 dias'
  ),
  (
    'ad_premium',
    'Anúncio Premium',
    99.90,
    'advertising',
    'Anúncio premium por 15 dias',
    '["Exibição por 15 dias", "Posição destacada", "Analytics completo", "Suporte prioritário"]'::jsonb,
    '15 dias'
  ),
  (
    'ad_vip',
    'Anúncio VIP',
    199.90,
    'advertising',
    'Anúncio VIP por 30 dias',
    '["Exibição por 30 dias", "Posição premium", "Analytics avançado", "Suporte VIP", "Destaque na home"]'::jsonb,
    '30 dias'
  )
ON CONFLICT (plan_id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  period = EXCLUDED.period,
  updated_at = NOW();

-- Habilitar RLS (Row Level Security)
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler preços ativos
CREATE POLICY "Preços ativos são públicos"
ON pricing_config FOR SELECT
USING (is_active = true);

-- Política: Apenas admins podem inserir/atualizar
CREATE POLICY "Apenas admins podem modificar preços"
ON pricing_config FOR ALL
USING (auth.role() = 'authenticated');

SELECT '✅ Tabela pricing_config criada e populada com sucesso!' as status;
