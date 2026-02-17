-- =====================================================
-- ATUALIZAÇÃO DE PREÇOS E CRÉDITOS DOS PLANOS
-- Adiciona colunas de tokens/imagens/minutos e atualiza valores
-- =====================================================

-- 1. Adicionar colunas de créditos à pricing_config (se não existirem)
ALTER TABLE pricing_config ADD COLUMN IF NOT EXISTS gpt4o_tokens BIGINT DEFAULT 0;
ALTER TABLE pricing_config ADD COLUMN IF NOT EXISTS gpt4turbo_tokens BIGINT DEFAULT 0;
ALTER TABLE pricing_config ADD COLUMN IF NOT EXISTS gpt35_tokens BIGINT DEFAULT 0;
ALTER TABLE pricing_config ADD COLUMN IF NOT EXISTS dalle3_images INTEGER DEFAULT 0;
ALTER TABLE pricing_config ADD COLUMN IF NOT EXISTS whisper_minutes INTEGER DEFAULT 0;

-- 2. Atualizar planos de assinatura com preços e créditos ajustados
UPDATE pricing_config
SET 
  price = CASE name
    WHEN 'Mensal' THEN 59.90
    WHEN 'Trimestral' THEN 159.90
    WHEN 'Semestral' THEN 259.90
    WHEN 'Anual' THEN 399.90
    ELSE price
  END,
  gpt4o_tokens = CASE name
    WHEN 'Mensal' THEN 887000
    WHEN 'Trimestral' THEN 2370000
    WHEN 'Semestral' THEN 3850000
    WHEN 'Anual' THEN 5990000
    ELSE gpt4o_tokens
  END,
  gpt4turbo_tokens = CASE name
    WHEN 'Mensal' THEN 444000
    WHEN 'Trimestral' THEN 1180000
    WHEN 'Semestral' THEN 1920000
    WHEN 'Anual' THEN 2960000
    ELSE gpt4turbo_tokens
  END,
  gpt35_tokens = CASE name
    WHEN 'Mensal' THEN 8800000
    WHEN 'Trimestral' THEN 23700000
    WHEN 'Semestral' THEN 38500000
    WHEN 'Anual' THEN 59900000
    ELSE gpt35_tokens
  END,
  dalle3_images = CASE name
    WHEN 'Mensal' THEN 111
    WHEN 'Trimestral' THEN 296
    WHEN 'Semestral' THEN 481
    WHEN 'Anual' THEN 747
    ELSE dalle3_images
  END,
  whisper_minutes = CASE name
    WHEN 'Mensal' THEN 740
    WHEN 'Trimestral' THEN 1975
    WHEN 'Semestral' THEN 3210
    WHEN 'Anual' THEN 4930
    ELSE whisper_minutes
  END
WHERE category = 'subscription';

-- 3. Atualizar Add-ons Avulsos (tokens, imagens, minutos, TTS)
UPDATE tool_pricing SET price = 67.50 WHERE name = 'GPT-4o 1M tokens';
UPDATE tool_pricing SET price = 135.00 WHERE name = 'GPT-4 Turbo 1M tokens';
UPDATE tool_pricing SET price = 6.75 WHERE name = 'GPT-3.5 Turbo 1M tokens';
UPDATE tool_pricing SET price = 54.00 WHERE name = 'DALL·E 3 100 imagens';
UPDATE tool_pricing SET price = 27.00 WHERE name = 'DALL·E 2 100 imagens';
UPDATE tool_pricing SET price = 8.10 WHERE name = 'Whisper 100 minutos';
UPDATE tool_pricing SET price = 202.50 WHERE name = 'TTS-1 1M caracteres';
UPDATE tool_pricing SET price = 405.00 WHERE name = 'TTS-1 HD 1M caracteres';

-- 4. Atualizar Ferramentas Avulsas (15 ferramentas)
UPDATE tool_pricing SET price = 29.90 WHERE name = 'Gerador de Scripts IA';
UPDATE tool_pricing SET price = 19.90 WHERE name = 'Criador de Thumbnails';
UPDATE tool_pricing SET price = 39.90 WHERE name = 'Analisador de Trends';
UPDATE tool_pricing SET price = 24.90 WHERE name = 'Otimizador de SEO';
UPDATE tool_pricing SET price = 14.90 WHERE name = 'Gerador de Hashtags';
UPDATE tool_pricing SET price = 49.90 WHERE name = 'Criador de Logos';
UPDATE tool_pricing SET price = 39.90 WHERE name = 'Agendamento Multiplataforma';
UPDATE tool_pricing SET price = 34.90 WHERE name = 'IA de Copywriting';
UPDATE tool_pricing SET price = 29.90 WHERE name = 'Tradutor Automático';
UPDATE tool_pricing SET price = 19.90 WHERE name = 'Gerador de QR Code';
UPDATE tool_pricing SET price = 97.00 WHERE name = 'Editor de Vídeo Pro';
UPDATE tool_pricing SET price = 49.90 WHERE name = 'Gerador de Ebooks Premium';
UPDATE tool_pricing SET price = 67.00 WHERE name = 'Gerador de Animações';
UPDATE tool_pricing SET price = 79.90 WHERE name = 'IA Video Generator 8K';
UPDATE tool_pricing SET price = 89.90 WHERE name = 'AI Funil Builder';

SELECT '✅ Preços e créditos atualizados com sucesso!' as status;
