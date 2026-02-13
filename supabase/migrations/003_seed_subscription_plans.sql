-- =====================================================
-- VIRALIZAAI - SEED DE PLANOS DE ASSINATURA
-- Migration: 003_seed_subscription_plans.sql
-- Executar no Supabase SQL Editor APÓS a migration 002
-- =====================================================

-- Inserir os 4 planos do ViralizaAI
-- stripe_price_id deve ser preenchido após criar os preços no Stripe Dashboard
INSERT INTO public.subscription_plans (slug, name, price_cents, currency, interval, stripe_price_id, features, included_tools, is_active)
VALUES
  (
    'mensal',
    'Mensal',
    5990,
    'BRL',
    'month',
    NULL, -- Preencher com price_xxx do Stripe
    '["Ferramentas de IA básicas", "Gerador de Scripts", "Criador de Thumbnails", "Gerador de Hashtags", "Gerador de QR Code", "Gerador de Ebooks"]'::jsonb,
    '["audioDetector", "affiliate", "social", "ebook-generator", "ultra-tools", "qr-generator"]'::jsonb,
    true
  ),
  (
    'trimestral',
    'Trimestral',
    15990,
    'BRL',
    'quarter',
    NULL, -- Preencher com price_xxx do Stripe
    '["Tudo do Mensal", "Analytics avançado", "Analisador de Trends", "Ferramentas de Mídia Social", "IA de Copywriting", "Tradutor Automático"]'::jsonb,
    '["audioDetector", "affiliate", "social", "ebook-generator", "ultra-tools", "qr-generator", "analytics", "social-media-tools", "trendPredictor"]'::jsonb,
    true
  ),
  (
    'semestral',
    'Semestral',
    25990,
    'BRL',
    'semester',
    NULL, -- Preencher com price_xxx do Stripe
    '["Tudo do Trimestral", "Gerador de Vídeo IA", "Analisador Viral", "Espião de Concorrentes", "Radar de Conversão", "Editor de Vídeo Pro"]'::jsonb,
    '["audioDetector", "affiliate", "social", "ebook-generator", "ultra-tools", "qr-generator", "analytics", "social-media-tools", "trendPredictor", "ai-video-generator", "viral-analyzer", "competitorSpy", "conversionRadar"]'::jsonb,
    true
  ),
  (
    'anual',
    'Anual',
    39990,
    'BRL',
    'year',
    NULL, -- Preencher com price_xxx do Stripe
    '["Acesso TOTAL ilimitado", "Motor de Crescimento", "Funil de Vendas IA", "Publicidade avançada", "Projeção de Receita", "Suporte prioritário", "Todas as ferramentas"]'::jsonb,
    '["audioDetector", "affiliate", "social", "ebook-generator", "ultra-tools", "qr-generator", "analytics", "social-media-tools", "trendPredictor", "ai-video-generator", "viral-analyzer", "competitorSpy", "conversionRadar", "growth-engine", "ai-funnel-builder", "advertise", "revenue-projection", "advancedGrowth", "viralPrediction", "autopilot", "growthEngine"]'::jsonb,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_cents = EXCLUDED.price_cents,
  features = EXCLUDED.features,
  included_tools = EXCLUDED.included_tools,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- =====================================================
-- FIM DO SEED
-- =====================================================
