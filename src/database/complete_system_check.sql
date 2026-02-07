-- ==========================================
-- VERIFICAÇÃO COMPLETA DO SISTEMA VIRALIZAAI
-- CORREÇÕES RLS + UPSERT + WEBHOOKS + COMERCIALIZAÇÃO
-- ==========================================

-- 1) CORRIGIR RLS PARA ACTIVITY_LOGS (403 ERROR)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Política para permitir INSERT de usuários autenticados
DROP POLICY IF EXISTS "activity_logs_insert" ON public.activity_logs;
CREATE POLICY "activity_logs_insert" 
ON public.activity_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

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

-- 2) CORRIGIR USER_PROFILES PARA EVITAR 409 (CONFLICT)
-- Função para UPSERT seguro de perfis
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

-- 3) CRIAR TABELAS PARA SISTEMA COMERCIAL COMPLETO

-- Tabela de Planos
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
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

-- Tabela de Webhooks Stripe (legado - manter compatibilidade)
CREATE TABLE IF NOT EXISTS public.stripe_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed BOOLEAN DEFAULT false,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4) POLÍTICAS RLS PARA TABELAS COMERCIAIS

-- RLS para Plans (público para leitura)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON public.plans FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "plans_admin_all" ON public.plans FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- RLS para Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_own" ON public.subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_admin" ON public.subscriptions FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- RLS para Affiliates
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "affiliates_own" ON public.affiliates FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "affiliates_admin" ON public.affiliates FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- RLS para Referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrals_affiliate_view" ON public.referrals FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.affiliates WHERE id = referrals.affiliate_id AND user_id = auth.uid())
);
CREATE POLICY "referrals_admin" ON public.referrals FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- RLS para Stripe Webhooks (apenas admin)
ALTER TABLE public.stripe_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhooks_admin_only" ON public.stripe_webhooks FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- 5) INSERIR PLANOS PADRÃO
INSERT INTO public.plans (name, description, price_monthly, price_yearly, features, stripe_price_id_monthly, stripe_price_id_yearly)
VALUES 
    ('Básico', 'Plano básico com funcionalidades essenciais', 29.90, 299.00, 
     '["Geração de ebooks", "Até 10 vídeos/mês", "Suporte por email"]'::jsonb,
     'price_basic_monthly', 'price_basic_yearly'),
    ('Pro', 'Plano profissional com recursos avançados', 59.90, 599.00,
     '["Geração ilimitada de ebooks", "Até 50 vídeos/mês", "IA conversacional", "Suporte prioritário"]'::jsonb,
     'price_pro_monthly', 'price_pro_yearly'),
    ('Enterprise', 'Plano empresarial com todos os recursos', 99.90, 999.00,
     '["Recursos ilimitados", "Vídeos ilimitados", "API access", "Suporte 24/7", "Treinamento personalizado"]'::jsonb,
     'price_enterprise_monthly', 'price_enterprise_yearly')
ON CONFLICT DO NOTHING;

-- 6) FUNÇÃO PARA PROCESSAR WEBHOOKS STRIPE
CREATE OR REPLACE FUNCTION public.process_stripe_webhook(
    event_id TEXT,
    event_type TEXT,
    event_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    subscription_data JSONB;
    customer_id TEXT;
    user_uuid UUID;
BEGIN
    -- Registrar webhook
    INSERT INTO public.stripe_webhooks (stripe_event_id, event_type, data)
    VALUES (event_id, event_type, event_data)
    ON CONFLICT (stripe_event_id) DO NOTHING;
    
    -- Processar diferentes tipos de eventos
    CASE event_type
        WHEN 'customer.subscription.created', 'customer.subscription.updated' THEN
            subscription_data := event_data->'data'->'object';
            customer_id := subscription_data->>'customer';
            
            -- Encontrar usuário pelo customer_id
            SELECT up.id INTO user_uuid
            FROM public.user_profiles up
            JOIN public.subscriptions s ON s.user_id = up.id
            WHERE s.stripe_customer_id = customer_id
            LIMIT 1;
            
            IF user_uuid IS NOT NULL THEN
                -- Atualizar ou criar assinatura
                INSERT INTO public.subscriptions (
                    user_id, stripe_subscription_id, stripe_customer_id, status,
                    current_period_start, current_period_end
                )
                VALUES (
                    user_uuid,
                    subscription_data->>'id',
                    customer_id,
                    subscription_data->>'status',
                    to_timestamp((subscription_data->>'current_period_start')::bigint),
                    to_timestamp((subscription_data->>'current_period_end')::bigint)
                )
                ON CONFLICT (stripe_subscription_id)
                DO UPDATE SET
                    status = EXCLUDED.status,
                    current_period_start = EXCLUDED.current_period_start,
                    current_period_end = EXCLUDED.current_period_end,
                    updated_at = NOW();
            END IF;
            
        WHEN 'customer.subscription.deleted' THEN
            subscription_data := event_data->'data'->'object';
            UPDATE public.subscriptions 
            SET status = 'canceled', updated_at = NOW()
            WHERE stripe_subscription_id = subscription_data->>'id';
    END CASE;
    
    -- Marcar como processado
    UPDATE public.stripe_webhooks 
    SET processed = true 
    WHERE stripe_event_id = event_id;
    
    RETURN true;
END;
$$;

-- 7) ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code ON public.affiliates(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_affiliate_id ON public.referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_event_id ON public.stripe_webhooks(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_processed ON public.stripe_webhooks(processed);

-- 8) TRIGGERS PARA AUTO-UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON public.affiliates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RELATÓRIO FINAL
SELECT 
    'SISTEMA COMERCIAL COMPLETO CONFIGURADO!' as status,
    'RLS corrigido, tabelas criadas, webhooks prontos' as detalhes;
