-- CRIAÇÃO DAS TABELAS FALTANTES NO SUPABASE
-- Execute este SQL no Table Editor do Supabase

-- 1. TABELA user_access - Controle de acesso às ferramentas
CREATE TABLE IF NOT EXISTS user_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tool_name TEXT NOT NULL,
  tool_id TEXT,
  plan_name TEXT,
  access_type TEXT DEFAULT 'plan', -- 'plan', 'individual', 'admin'
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Índices para performance
  CONSTRAINT fk_user_access_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_user_access_user_id ON user_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_tool_name ON user_access(tool_name);
CREATE INDEX IF NOT EXISTS idx_user_access_expires_at ON user_access(expires_at);

-- 2. TABELA payments - Pagamentos PIX/Stripe (complementar à purchases)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'plan', 'tool', 'affiliate_payout'
  item_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'pix', 'stripe', 'bank_transfer'
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'failed', 'cancelled'
  transaction_id TEXT,
  pix_key TEXT,
  stripe_session_id TEXT,
  payment_details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  
  -- Referência ao usuário
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Comentários para documentação
COMMENT ON TABLE user_access IS 'Controle de acesso dos usuários às ferramentas do sistema';
COMMENT ON TABLE payments IS 'Registro de todos os pagamentos PIX/Stripe do sistema';

COMMENT ON COLUMN user_access.tool_name IS 'Nome da ferramenta (ex: Editor de Vídeo Pro)';
COMMENT ON COLUMN user_access.access_type IS 'Tipo de acesso: plan, individual, admin';
COMMENT ON COLUMN user_access.expires_at IS 'Data de expiração do acesso (NULL = permanente)';

COMMENT ON COLUMN payments.type IS 'Tipo de pagamento: plan, tool, affiliate_payout';
COMMENT ON COLUMN payments.payment_method IS 'Método: pix, stripe, bank_transfer';
COMMENT ON COLUMN payments.status IS 'Status: pending, confirmed, failed, cancelled';
COMMENT ON COLUMN payments.payment_details IS 'Detalhes adicionais em JSON';

-- Inserir dados de exemplo (opcional)
-- INSERT INTO user_access (user_id, tool_name, access_type) 
-- SELECT id, 'Todas as Ferramentas', 'admin' FROM users WHERE email LIKE '%admin%';

-- Verificar criação
SELECT 'user_access' as tabela, COUNT(*) as registros FROM user_access
UNION ALL
SELECT 'payments' as tabela, COUNT(*) as registros FROM payments;
