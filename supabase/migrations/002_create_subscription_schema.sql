-- =====================================================
-- VIRALIZAAI - SUBSCRIPTION SCHEMA (Stripe + PIX)
-- Migration: 002_create_subscription_schema.sql
-- Executar no Supabase SQL Editor
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. TABELA: subscription_plans (Planos disponíveis)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  interval text NOT NULL, -- 'month', 'quarter', 'semester', 'year'
  stripe_price_id text,   -- Stripe Price ID (preenchido após criar no Stripe)
  features jsonb DEFAULT '[]'::jsonb,
  included_tools jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. TABELA: subscriptions (adicionar colunas novas se necessário)
-- ============================================================
-- A tabela subscriptions já existe da migration 001.
-- Adicionamos colunas extras para integração Stripe completa.

DO $$
BEGIN
  -- plan_id (FK para subscription_plans)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='plan_id') THEN
    ALTER TABLE public.subscriptions ADD COLUMN plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE SET NULL;
  END IF;
  -- provider_subscription_id (Stripe subscription ID alternativo)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='provider_subscription_id') THEN
    ALTER TABLE public.subscriptions ADD COLUMN provider_subscription_id text;
  END IF;
  -- current_period_start / end
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='current_period_start') THEN
    ALTER TABLE public.subscriptions ADD COLUMN current_period_start timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='current_period_end') THEN
    ALTER TABLE public.subscriptions ADD COLUMN current_period_end timestamptz;
  END IF;
  -- cancel_at_period_end
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='cancel_at_period_end') THEN
    ALTER TABLE public.subscriptions ADD COLUMN cancel_at_period_end boolean DEFAULT false;
  END IF;
  -- metadata jsonb
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='metadata') THEN
    ALTER TABLE public.subscriptions ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Index para provider_subscription_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_sub_id ON public.subscriptions(provider_subscription_id);

-- ============================================================
-- 3. TABELA: subscription_events (logs de eventos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  provider_event_id text,
  event_type text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_events_sub_id ON public.subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_events_provider ON public.subscription_events(provider_event_id);

-- ============================================================
-- 4. RLS (Row Level Security)
-- ============================================================

-- Subscriptions RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (para recriar sem erro)
DO $$ BEGIN
  DROP POLICY IF EXISTS "authenticated_select_own_subscriptions" ON public.subscriptions;
  DROP POLICY IF EXISTS "authenticated_insert_subscriptions" ON public.subscriptions;
  DROP POLICY IF EXISTS "authenticated_update_own_subscriptions" ON public.subscriptions;
  DROP POLICY IF EXISTS "authenticated_delete_own_subscriptions" ON public.subscriptions;
  DROP POLICY IF EXISTS "service_role_full_access_subscriptions" ON public.subscriptions;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE POLICY "authenticated_select_own_subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id::text = (SELECT auth.uid())::text);

CREATE POLICY "authenticated_insert_subscriptions" ON public.subscriptions
  FOR INSERT TO authenticated WITH CHECK (user_id::text = (SELECT auth.uid())::text);

CREATE POLICY "authenticated_update_own_subscriptions" ON public.subscriptions
  FOR UPDATE TO authenticated 
  USING (user_id::text = (SELECT auth.uid())::text) 
  WITH CHECK (user_id::text = (SELECT auth.uid())::text);

CREATE POLICY "authenticated_delete_own_subscriptions" ON public.subscriptions
  FOR DELETE TO authenticated USING (user_id::text = (SELECT auth.uid())::text);

-- Service role tem acesso total (para webhooks)
CREATE POLICY "service_role_full_access_subscriptions" ON public.subscriptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Subscription Events RLS
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "authenticated_select_subscription_events" ON public.subscription_events;
  DROP POLICY IF EXISTS "service_role_full_access_events" ON public.subscription_events;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE POLICY "authenticated_select_subscription_events" ON public.subscription_events
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s 
      WHERE s.id = subscription_events.subscription_id 
      AND s.user_id::text = (SELECT auth.uid())::text
    )
  );

CREATE POLICY "service_role_full_access_events" ON public.subscription_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Subscription Plans: leitura pública
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "anyone_can_read_plans" ON public.subscription_plans;
  DROP POLICY IF EXISTS "service_role_manage_plans" ON public.subscription_plans;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE POLICY "anyone_can_read_plans" ON public.subscription_plans
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "service_role_manage_plans" ON public.subscription_plans
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 5. TRIGGER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.subscriptions_set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscriptions_set_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.subscriptions_set_updated_at();

-- ============================================================
-- 6. FUNCTION: log_subscription_event (helper)
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_subscription_event(
  p_subscription_id uuid, 
  p_provider_event_id text, 
  p_event_type text, 
  p_payload jsonb
)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO public.subscription_events(subscription_id, provider_event_id, event_type, payload)
  VALUES (p_subscription_id, p_provider_event_id, p_event_type, p_payload);
$$;

-- ============================================================
-- 7. FUNCTION: get_active_subscription (para frontend)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_active_subscription(p_user_id text)
RETURNS TABLE (
  subscription_id uuid,
  plan_slug text,
  plan_name text,
  status text,
  current_period_end timestamptz
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    s.id as subscription_id,
    sp.slug as plan_slug,
    sp.name as plan_name,
    s.status,
    COALESCE(s.current_period_end, s.end_date) as current_period_end
  FROM public.subscriptions s
  LEFT JOIN public.subscription_plans sp ON sp.id = s.plan_id
  WHERE s.user_id::text = p_user_id 
    AND s.status = 'active'
    AND (s.end_date IS NULL OR s.end_date > now())
  ORDER BY s.created_at DESC
  LIMIT 1;
$$;

-- =====================================================
-- FIM DA MIGRATION 002
-- =====================================================
