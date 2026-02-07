-- ==========================================
-- SISTEMA COMERCIAL VIRALIZAAI - VERSÃO FINAL
-- SCRIPT 100% FUNCIONAL SEM ERROS
-- ==========================================

-- 1) VERIFICAR E CRIAR TABELA ACTIVITY_LOGS SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    resource_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para ACTIVITY_LOGS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Política para permitir INSERT de usuários autenticados
DROP POLICY IF EXISTS "activity_logs_insert" ON public.activity_logs;
CREATE POLICY "activity_logs_insert" 
ON public.activity_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Política para permitir SELECT dos próprios logs
DROP POLICY IF EXISTS "activity_logs_select" ON public.activity_logs;
CREATE POLICY "activity_logs_select" 
ON public.activity_logs 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Política para admin ver todos os logs
DROP POLICY IF EXISTS "activity_logs_admin" ON public.activity_logs;
CREATE POLICY "activity_logs_admin" 
ON public.activity_logs 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND user_type = 'admin'
    )
);

-- 2) FUNÇÃO PARA UPSERT SEGURO DE PERFIS
CREATE OR REPLACE FUNCTION public.upsert_user_profile(
    profile_id UUID,
    profile_name TEXT,
    profile_email TEXT,
    profile_type TEXT DEFAULT 'client'
)
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result public.user_profiles;
BEGIN
    INSERT INTO public.user_profiles (
        id, name, email, user_type, status, joined_date, preferences, created_at, updated_at
    )
    VALUES (
        profile_id, profile_name, profile_email, profile_type, 'active', NOW(), '{}', NOW(), NOW()
    )
    ON CONFLICT (id) 
    DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$;

-- 3) CRIAR TABELAS COMERCIAIS

-- Tabela de Planos
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Assinaturas
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.plans(id),
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Afiliados
CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT UNIQUE NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    total_referrals INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Referências
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID REFERENCES public.affiliates(id),
    referred_user_id UUID REFERENCES auth.users(id),
    subscription_id UUID REFERENCES public.subscriptions(id),
    commission_amount DECIMAL(10,2),
    commission_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Webhooks Stripe Processados
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed BOOLEAN DEFAULT false,
    data JSONB NOT NULL,
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 4) POLÍTICAS RLS PARA TODAS AS TABELAS

-- RLS para Plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "plans_public_read" ON public.plans;
CREATE POLICY "plans_public_read" ON public.plans FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "plans_admin_all" ON public.plans;
CREATE POLICY "plans_admin_all" ON public.plans FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- RLS para Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_own" ON public.subscriptions;
CREATE POLICY "subscriptions_own" ON public.subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "subscriptions_admin" ON public.subscriptions;
CREATE POLICY "subscriptions_admin" ON public.subscriptions FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- RLS para Affiliates
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "affiliates_own" ON public.affiliates;
CREATE POLICY "affiliates_own" ON public.affiliates FOR ALL TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "affiliates_admin" ON public.affiliates;
CREATE POLICY "affiliates_admin" ON public.affiliates FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- RLS para Referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "referrals_affiliate_view" ON public.referrals;
CREATE POLICY "referrals_affiliate_view" ON public.referrals FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.affiliates WHERE id = referrals.affiliate_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "referrals_admin" ON public.referrals;
CREATE POLICY "referrals_admin" ON public.referrals FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- RLS para Processed Webhook Events
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "processed_webhooks_admin_only" ON public.processed_webhook_events;
CREATE POLICY "processed_webhooks_admin_only" ON public.processed_webhook_events FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- 5) INSERIR PLANOS PADRÃO (SEM ON CONFLICT)
DO $$
BEGIN
    -- Inserir Plano Básico se não existir
    IF NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Básico') THEN
        INSERT INTO public.plans (name, description, price_monthly, price_yearly, features, stripe_price_id_monthly, stripe_price_id_yearly)
        VALUES ('Básico', 'Plano básico com funcionalidades essenciais', 29.90, 299.00, 
                '["Geração de ebooks", "Até 10 vídeos/mês", "Suporte por email"]'::jsonb,
                'price_basic_monthly', 'price_basic_yearly');
    END IF;

    -- Inserir Plano Pro se não existir
    IF NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Pro') THEN
        INSERT INTO public.plans (name, description, price_monthly, price_yearly, features, stripe_price_id_monthly, stripe_price_id_yearly)
        VALUES ('Pro', 'Plano profissional com recursos avançados', 59.90, 599.00,
                '["Geração ilimitada de ebooks", "Até 50 vídeos/mês", "IA conversacional", "Suporte prioritário"]'::jsonb,
                'price_pro_monthly', 'price_pro_yearly');
    END IF;

    -- Inserir Plano Enterprise se não existir
    IF NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Enterprise') THEN
        INSERT INTO public.plans (name, description, price_monthly, price_yearly, features, stripe_price_id_monthly, stripe_price_id_yearly)
        VALUES ('Enterprise', 'Plano empresarial com todos os recursos', 99.90, 999.00,
                '["Recursos ilimitados", "Vídeos ilimitados", "API access", "Suporte 24/7", "Treinamento personalizado"]'::jsonb,
                'price_enterprise_monthly', 'price_enterprise_yearly');
    END IF;
END $$;

-- 6) ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code ON public.affiliates(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_affiliate_id ON public.referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_event_id ON public.processed_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_processed ON public.processed_webhook_events(processed);

-- 7) TRIGGERS PARA AUTO-UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_plans_updated_at ON public.plans;
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_affiliates_updated_at ON public.affiliates;
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON public.affiliates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- VERIFICAÇÃO FINAL E RELATÓRIO
SELECT 
    'SISTEMA COMERCIAL CONFIGURADO COM SUCESSO!' as status,
    'Tabelas: ' || (
        SELECT string_agg(table_name, ', ')
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('plans', 'subscriptions', 'affiliates', 'referrals', 'processed_webhook_events', 'activity_logs')
    ) as tabelas_criadas,
    'Planos inseridos: ' || (SELECT COUNT(*) FROM public.plans) as total_planos;
