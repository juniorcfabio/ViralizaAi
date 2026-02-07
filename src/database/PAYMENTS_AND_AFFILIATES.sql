-- ==========================================
-- SISTEMA DE PAGAMENTOS AVULSOS E COMISSÕES
-- FERRAMENTAS, ANÚNCIOS E PROGRAMA DE AFILIADOS
-- ==========================================

-- 1) TABELA DE PRODUTOS AVULSOS (Ferramentas, Anúncios, etc.)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('tool', 'ad_credit', 'service', 'course', 'template')),
    price DECIMAL(10,2) NOT NULL,
    stripe_price_id TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2) TABELA DE COMPRAS AVULSAS
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    affiliate_id UUID REFERENCES public.affiliates(id),
    commission_amount DECIMAL(10,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3) TABELA DE CRÉDITOS DE ANÚNCIOS
CREATE TABLE IF NOT EXISTS public.ad_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES public.purchases(id),
    amount DECIMAL(10,2) NOT NULL,
    used_amount DECIMAL(10,2) DEFAULT 0,
    remaining_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount - used_amount) STORED,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4) TABELA DE COMISSÕES DE AFILIADOS
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id), -- Afiliado que vai receber
    source_type TEXT NOT NULL CHECK (source_type IN ('subscription', 'purchase', 'referral_bonus')),
    source_id UUID, -- ID da assinatura, compra, etc.
    amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    stripe_transfer_id TEXT, -- ID da transferência no Stripe
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5) TABELA DE SAQUES DE AFILIADOS
CREATE TABLE IF NOT EXISTS public.affiliate_withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    amount DECIMAL(10,2) NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('pix', 'bank_transfer', 'stripe_transfer')),
    account_info JSONB NOT NULL, -- Dados da conta (PIX, banco, etc.)
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'completed', 'failed', 'cancelled')),
    stripe_transfer_id TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6) INSERIR PRODUTOS AVULSOS PADRÃO
INSERT INTO public.products (name, description, type, price, metadata) VALUES
-- Ferramentas Avulsas
('Geração de Ebook Premium', 'Gere um ebook profissional com IA avançada', 'tool', 19.90, '{"credits": 1, "category": "content"}'),
('Criação de Vídeo Viral', 'Crie vídeos virais com IA em minutos', 'tool', 29.90, '{"credits": 1, "category": "video"}'),
('Análise de Concorrência', 'Análise completa dos seus concorrentes', 'tool', 39.90, '{"credits": 1, "category": "analysis"}'),
('Campanha de Email Marketing', 'Sequência completa de emails persuasivos', 'tool', 24.90, '{"credits": 1, "category": "marketing"}'),

-- Créditos de Anúncios
('Créditos de Anúncios R$ 50', 'R$ 50 em créditos para impulsionar seus anúncios', 'ad_credit', 50.00, '{"credit_amount": 50, "bonus_percentage": 0}'),
('Créditos de Anúncios R$ 100', 'R$ 100 em créditos + 10% bônus', 'ad_credit', 100.00, '{"credit_amount": 110, "bonus_percentage": 10}'),
('Créditos de Anúncios R$ 250', 'R$ 250 em créditos + 15% bônus', 'ad_credit', 250.00, '{"credit_amount": 287.50, "bonus_percentage": 15}'),
('Créditos de Anúncios R$ 500', 'R$ 500 em créditos + 20% bônus', 'ad_credit', 500.00, '{"credit_amount": 600, "bonus_percentage": 20}'),

-- Serviços Premium
('Consultoria 1h com Especialista', 'Sessão de consultoria individual', 'service', 197.00, '{"duration": 60, "category": "consulting"}'),
('Setup Completo de Funil', 'Configuração profissional do seu funil', 'service', 497.00, '{"delivery_days": 7, "category": "setup"}'),
('Curso Avançado de Conversão', 'Curso completo sobre otimização de conversão', 'course', 297.00, '{"modules": 12, "category": "education"}')

ON CONFLICT DO NOTHING;

-- 7) CONFIGURAR RLS PARA NOVAS TABELAS

-- RLS para Products (público para leitura)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON public.products FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "products_admin_all" ON public.products FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- RLS para Purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchases_own" ON public.purchases FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "purchases_admin" ON public.purchases FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- RLS para Ad Credits
ALTER TABLE public.ad_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ad_credits_own" ON public.ad_credits FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ad_credits_admin" ON public.ad_credits FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- RLS para Affiliate Commissions
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commissions_own" ON public.affiliate_commissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "commissions_admin" ON public.affiliate_commissions FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- RLS para Affiliate Withdrawals
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "withdrawals_own" ON public.affiliate_withdrawals FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "withdrawals_admin" ON public.affiliate_withdrawals FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type = 'admin')
);

-- 8) ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_ad_credits_user_id ON public.ad_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_credits_active ON public.ad_credits(is_active);
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_affiliate_id ON public.affiliate_withdrawals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.affiliate_withdrawals(status);

-- 9) TRIGGERS PARA AUTO-UPDATE
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchases_updated_at ON public.purchases;
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_commissions_updated_at ON public.affiliate_commissions;
CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON public.affiliate_commissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON public.affiliate_withdrawals;
CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON public.affiliate_withdrawals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- VERIFICAÇÃO FINAL
SELECT 
    'SISTEMA DE PAGAMENTOS AVULSOS E COMISSÕES CONFIGURADO!' as status,
    'Produtos: ' || (SELECT COUNT(*) FROM public.products) as total_produtos,
    'Tabelas criadas: products, purchases, ad_credits, affiliate_commissions, affiliate_withdrawals' as tabelas;
