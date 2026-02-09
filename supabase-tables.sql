-- TABELAS NECESSÁRIAS PARA STRIPE + SUPABASE INTEGRATION
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- 1. TABELA DE COMPRAS (PAGAMENTOS ÚNICOS)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    product_id TEXT,
    stripe_session_id TEXT UNIQUE NOT NULL,
    amount INTEGER, -- em centavos
    currency TEXT DEFAULT 'brl',
    status TEXT NOT NULL,
    customer_email TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE ASSINATURAS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    product_id TEXT,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL, -- active, canceled, past_due, etc.
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE PAGAMENTOS DE AFILIADOS
CREATE TABLE IF NOT EXISTS public.affiliate_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id TEXT NOT NULL,
    purchase_session_id TEXT,
    subscription_id UUID REFERENCES public.subscriptions(id),
    amount INTEGER, -- em centavos
    currency TEXT DEFAULT 'brl',
    status TEXT NOT NULL, -- pending, paid, canceled
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE PRODUTOS/PLANOS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_price_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    amount INTEGER NOT NULL, -- em centavos
    currency TEXT DEFAULT 'brl',
    interval TEXT, -- month, year (para assinaturas)
    active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session ON public.purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payments_affiliate_id ON public.affiliate_payments(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_products_stripe_price_id ON public.products(stripe_price_id);

-- TRIGGERS PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_payments_updated_at BEFORE UPDATE ON public.affiliate_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- INSERIR PRODUTOS DE EXEMPLO
INSERT INTO public.products (stripe_price_id, name, description, amount, interval) VALUES
('price_mensal_example', 'Plano Mensal ViralizaAI', 'Acesso completo por 1 mês', 5990, 'month'),
('price_trimestral_example', 'Plano Trimestral ViralizaAI', 'Acesso completo por 3 meses', 15990, 'month'),
('price_anual_example', 'Plano Anual ViralizaAI', 'Acesso completo por 12 meses', 59990, 'year')
ON CONFLICT (stripe_price_id) DO NOTHING;

-- POLÍTICAS RLS (ROW LEVEL SECURITY)
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública dos produtos
CREATE POLICY "Produtos são públicos" ON public.products
    FOR SELECT USING (active = true);

-- Política para permitir inserção via service role (webhook)
CREATE POLICY "Service role pode inserir compras" ON public.purchases
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role pode inserir assinaturas" ON public.subscriptions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role pode inserir pagamentos de afiliados" ON public.affiliate_payments
    FOR INSERT WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE public.purchases IS 'Registra pagamentos únicos processados via Stripe';
COMMENT ON TABLE public.subscriptions IS 'Registra assinaturas recorrentes do Stripe';
COMMENT ON TABLE public.affiliate_payments IS 'Registra comissões de afiliados';
COMMENT ON TABLE public.products IS 'Catálogo de produtos/planos disponíveis';

-- Verificação final
SELECT 'Tabelas criadas com sucesso!' as status;
