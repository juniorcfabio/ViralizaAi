-- 🌍🔥 TABELAS DO SISTEMA DE AFILIADOS MUNDIAL
-- Criação das tabelas para o sistema de afiliados

-- 👤 TABELA DE AFILIADOS
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  codigo TEXT UNIQUE NOT NULL,
  comissao_total NUMERIC(10,2) DEFAULT 0.00,
  comissao_pendente NUMERIC(10,2) DEFAULT 0.00,
  total_indicacoes INTEGER DEFAULT 0,
  total_vendas INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  dados_pagamento JSONB,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  
  -- Índices para performance
  CONSTRAINT unique_user_affiliate UNIQUE (user_id)
);

-- 💰 TABELA DE COMISSÕES DE AFILIADOS
CREATE TABLE affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  user_indicado UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pagamento_id TEXT NOT NULL, -- ID do pagamento no Stripe
  valor NUMERIC(10,2) NOT NULL,
  valor_original NUMERIC(10,2) NOT NULL,
  percentual NUMERIC(5,4) NOT NULL DEFAULT 0.30, -- 30%
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmada', 'paga', 'cancelada')),
  metadata JSONB,
  criado_em TIMESTAMP DEFAULT NOW(),
  processado_em TIMESTAMP,
  
  -- Evitar comissões duplicadas
  CONSTRAINT unique_payment_commission UNIQUE (pagamento_id, affiliate_id)
);

-- 💸 TABELA DE SAQUES DE AFILIADOS
CREATE TABLE affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL,
  dados_pagamento JSONB NOT NULL,
  status TEXT DEFAULT 'solicitado' CHECK (status IN ('solicitado', 'processando', 'processado', 'erro', 'cancelado')),
  transaction_id TEXT,
  erro TEXT,
  solicitado_em TIMESTAMP DEFAULT NOW(),
  processado_em TIMESTAMP,
  
  -- Validações
  CONSTRAINT positive_payout_amount CHECK (valor > 0)
);

-- 🔗 TABELA DE TRACKING DE CLIQUES
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  user_ip INET,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMP,
  criado_em TIMESTAMP DEFAULT NOW(),
  
  -- Índices para analytics
  INDEX idx_affiliate_clicks_date (criado_em),
  INDEX idx_affiliate_clicks_converted (converted, converted_at)
);

-- 📊 TABELA DE ESTATÍSTICAS DIÁRIAS DE AFILIADOS
CREATE TABLE affiliate_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,
  commission_earned NUMERIC(10,2) DEFAULT 0.00,
  criado_em TIMESTAMP DEFAULT NOW(),
  
  -- Uma entrada por afiliado por dia
  CONSTRAINT unique_affiliate_daily_stats UNIQUE (affiliate_id, data)
);

-- 🎯 TABELA DE CONVERSÕES DE AFILIADOS
CREATE TABLE affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  click_id UUID REFERENCES affiliate_clicks(id),
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('signup', 'purchase', 'subscription')),
  valor NUMERIC(10,2),
  metadata JSONB,
  criado_em TIMESTAMP DEFAULT NOW(),
  
  -- Evitar conversões duplicadas
  CONSTRAINT unique_user_conversion UNIQUE (user_id, affiliate_id, conversion_type)
);

-- 📈 ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_affiliates_codigo ON affiliates(codigo);
CREATE INDEX idx_affiliates_status ON affiliates(status);
CREATE INDEX idx_affiliates_user_id ON affiliates(user_id);

CREATE INDEX idx_affiliate_commissions_affiliate ON affiliate_commissions(affiliate_id);
CREATE INDEX idx_affiliate_commissions_status ON affiliate_commissions(status);
CREATE INDEX idx_affiliate_commissions_date ON affiliate_commissions(criado_em);

CREATE INDEX idx_affiliate_payouts_affiliate ON affiliate_payouts(affiliate_id);
CREATE INDEX idx_affiliate_payouts_status ON affiliate_payouts(status);

CREATE INDEX idx_affiliate_clicks_affiliate ON affiliate_clicks(affiliate_id);
CREATE INDEX idx_affiliate_clicks_ip ON affiliate_clicks(user_ip);

-- 🔄 TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
CREATE OR REPLACE FUNCTION update_affiliate_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar totais do afiliado quando comissão é confirmada
  IF NEW.status = 'confirmada' AND OLD.status != 'confirmada' THEN
    UPDATE affiliates 
    SET 
      comissao_total = comissao_total + NEW.valor,
      total_vendas = total_vendas + 1,
      atualizado_em = NOW()
    WHERE id = NEW.affiliate_id;
  END IF;
  
  -- Reverter totais se comissão for cancelada
  IF NEW.status = 'cancelada' AND OLD.status = 'confirmada' THEN
    UPDATE affiliates 
    SET 
      comissao_total = comissao_total - NEW.valor,
      total_vendas = total_vendas - 1,
      atualizado_em = NOW()
    WHERE id = NEW.affiliate_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_affiliate_totals
  AFTER UPDATE ON affiliate_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_totals();

-- 📊 TRIGGER PARA ESTATÍSTICAS DIÁRIAS
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir ou atualizar estatísticas diárias
  INSERT INTO affiliate_daily_stats (affiliate_id, data, clicks)
  VALUES (NEW.affiliate_id, CURRENT_DATE, 1)
  ON CONFLICT (affiliate_id, data)
  DO UPDATE SET clicks = affiliate_daily_stats.clicks + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_stats
  AFTER INSERT ON affiliate_clicks
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_stats();

-- 🔄 FUNÇÃO PARA ATUALIZAR TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_affiliates_updated_at
  BEFORE UPDATE ON affiliates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 📋 VIEWS ÚTEIS PARA RELATÓRIOS
CREATE VIEW affiliate_performance AS
SELECT 
  a.id,
  a.codigo,
  a.user_id,
  u.name as affiliate_name,
  u.email as affiliate_email,
  a.comissao_total,
  a.total_indicacoes,
  a.total_vendas,
  a.total_clicks,
  CASE 
    WHEN a.total_clicks > 0 THEN ROUND((a.total_vendas::NUMERIC / a.total_clicks::NUMERIC) * 100, 2)
    ELSE 0
  END as conversion_rate,
  a.status,
  a.criado_em
FROM affiliates a
JOIN users u ON a.user_id = u.id;

CREATE VIEW affiliate_monthly_earnings AS
SELECT 
  a.id as affiliate_id,
  a.codigo,
  DATE_TRUNC('month', ac.criado_em) as month,
  COUNT(*) as total_commissions,
  SUM(ac.valor) as total_earned,
  AVG(ac.valor) as avg_commission
FROM affiliates a
JOIN affiliate_commissions ac ON a.id = ac.affiliate_id
WHERE ac.status = 'confirmada'
GROUP BY a.id, a.codigo, DATE_TRUNC('month', ac.criado_em)
ORDER BY month DESC;

-- 🎯 FUNÇÃO PARA GERAR CÓDIGO ÚNICO DE AFILIADO
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar código aleatório
    code := 'VIR' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE codigo = code) INTO exists;
    
    -- Se não existe, retornar
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 💰 FUNÇÃO PARA CALCULAR COMISSÕES PENDENTES
CREATE OR REPLACE FUNCTION get_pending_commissions(affiliate_uuid UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(valor) 
     FROM affiliate_commissions 
     WHERE affiliate_id = affiliate_uuid 
     AND status = 'confirmada'
     AND id NOT IN (
       SELECT DISTINCT commission_id 
       FROM affiliate_payouts 
       WHERE status IN ('processado', 'processando')
     )), 
    0
  );
END;
$$ LANGUAGE plpgsql;

-- 📊 COMENTÁRIOS NAS TABELAS
COMMENT ON TABLE affiliates IS 'Tabela principal de afiliados do sistema';
COMMENT ON TABLE affiliate_commissions IS 'Comissões geradas pelos afiliados';
COMMENT ON TABLE affiliate_payouts IS 'Solicitações e processamento de saques';
COMMENT ON TABLE affiliate_clicks IS 'Tracking de cliques nos links de afiliados';
COMMENT ON TABLE affiliate_daily_stats IS 'Estatísticas diárias agregadas por afiliado';
COMMENT ON TABLE affiliate_conversions IS 'Conversões realizadas pelos afiliados';

-- ✅ DADOS INICIAIS (OPCIONAL)
-- Inserir configurações do sistema de afiliados
INSERT INTO system_config (key, value, description) VALUES
('affiliate_commission_rate', '0.30', 'Taxa de comissão padrão para afiliados (30%)'),
('affiliate_minimum_payout', '100.00', 'Valor mínimo para saque de comissões'),
('affiliate_cookie_duration', '30', 'Duração do cookie de tracking em dias'),
('affiliate_system_enabled', 'true', 'Sistema de afiliados habilitado')
ON CONFLICT (key) DO NOTHING;
