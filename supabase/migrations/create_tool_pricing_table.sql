-- =====================================================
-- TABELA DE PREÇOS DE FERRAMENTAS AVULSAS
-- Armazena preços de todas as ferramentas do marketplace
-- =====================================================

CREATE TABLE IF NOT EXISTS tool_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  created_by VARCHAR(50) DEFAULT 'Admin',
  is_active BOOLEAN DEFAULT true,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tool_pricing_tool_id ON tool_pricing(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_pricing_category ON tool_pricing(category);
CREATE INDEX IF NOT EXISTS idx_tool_pricing_active ON tool_pricing(is_active);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_tool_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tool_pricing_updated_at
BEFORE UPDATE ON tool_pricing
FOR EACH ROW
EXECUTE FUNCTION update_tool_pricing_updated_at();

-- Inserir ferramentas existentes com preços
INSERT INTO tool_pricing (tool_id, name, price, category, description, created_by) VALUES
  ('script-generator', 'Gerador de Scripts IA', 29.90, 'Conteúdo', 'Gera scripts otimizados com IA', 'IA'),
  ('thumbnail-creator', 'Criador de Thumbnails', 19.90, 'Design', 'Cria thumbnails profissionais', 'IA'),
  ('trend-analyzer', 'Analisador de Trends', 39.90, 'Analytics', 'Analisa tendências em tempo real', 'IA'),
  ('seo-optimizer', 'Otimizador de SEO', 34.90, 'Marketing', 'Otimiza conteúdo para SEO', 'IA'),
  ('hashtag-generator', 'Gerador de Hashtags', 14.90, 'Social Media', 'Gera hashtags estratégicas', 'IA'),
  ('logo-creator', 'Criador de Logos', 49.90, 'Design', 'Cria logos profissionais', 'IA'),
  ('social-scheduler', 'Agendamento Multiplataforma', 44.90, 'Social Media', 'Agenda posts em múltiplas redes', 'IA'),
  ('ai-copywriting', 'IA de Copywriting', 39.90, 'Conteúdo', 'Gera textos persuasivos com IA', 'IA'),
  ('auto-translator', 'Tradutor Automático', 19.90, 'Utilidades', 'Traduz conteúdo para múltiplos idiomas', 'IA'),
  ('qr-generator', 'Gerador de QR Code', 9.90, 'Utilidades', 'Gera QR codes personalizados', 'Admin'),
  ('video-editor-pro', 'Editor de Vídeo Pro', 79.90, 'Vídeo', 'Editor de vídeo profissional com IA', 'IA'),
  ('ebook-generator-premium', 'Gerador de Ebooks Premium', 59.90, 'Conteúdo', 'Gera ebooks completos automaticamente', 'IA'),
  ('animation-generator', 'Gerador de Animações', 69.90, 'Vídeo', 'Cria animações profissionais', 'IA'),
  ('ai-video-8k', 'IA Video Generator 8K', 99.90, 'Vídeo', 'Gera vídeos em 8K com IA', 'IA'),
  ('ai-funnel-builder', 'AI Funil Builder', 89.90, 'Marketing', 'Constrói funis de vendas automaticamente', 'IA')
ON CONFLICT (tool_id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Comentários para documentação
COMMENT ON TABLE tool_pricing IS 'Armazena preços e informações de ferramentas avulsas do marketplace';
COMMENT ON COLUMN tool_pricing.tool_id IS 'Identificador único da ferramenta';
COMMENT ON COLUMN tool_pricing.price IS 'Preço da ferramenta em reais (BRL)';
COMMENT ON COLUMN tool_pricing.is_active IS 'Indica se a ferramenta está disponível para venda';
COMMENT ON COLUMN tool_pricing.features IS 'Lista de recursos da ferramenta em formato JSON';

-- Habilitar RLS (Row Level Security)
ALTER TABLE tool_pricing ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler ferramentas ativas
CREATE POLICY "Ferramentas ativas são públicas"
ON tool_pricing FOR SELECT
USING (is_active = true);

-- Política: Apenas admins podem inserir/atualizar
CREATE POLICY "Apenas admins podem modificar ferramentas"
ON tool_pricing FOR ALL
USING (auth.role() = 'authenticated');

SELECT '✅ Tabela tool_pricing criada com sucesso!' as status;
