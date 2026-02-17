-- 🏢 TABELAS DO SISTEMA DE FRANQUIAS - SUPABASE/POSTGRESQL

-- Tabela de territórios disponíveis para franquia
CREATE TABLE IF NOT EXISTS franchise_territories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    population BIGINT,
    fee DECIMAL(10,2),
    royalty_rate DECIMAL(5,4),
    status TEXT DEFAULT 'available', -- available, sold, reserved
    market_potential DECIMAL(15,2),
    franchisee_id TEXT,
    franchise_package TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de franquias vendidas
CREATE TABLE IF NOT EXISTS franchises (
    id TEXT PRIMARY KEY DEFAULT 'franchise_' || gen_random_uuid(),
    territory_id TEXT REFERENCES franchise_territories(id),
    franchisee_id TEXT NOT NULL,
    franchisee_name TEXT NOT NULL,
    franchisee_email TEXT NOT NULL,
    franchisee_phone TEXT,
    company_name TEXT,
    package_type TEXT NOT NULL, -- starter, professional, enterprise
    package_price DECIMAL(10,2),
    royalty_rate DECIMAL(5,4),
    status TEXT DEFAULT 'pending', -- pending, active, suspended, cancelled
    contract_signed BOOLEAN DEFAULT FALSE,
    payment_status TEXT DEFAULT 'pending', -- pending, paid, overdue
    activation_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de royalties e receitas
CREATE TABLE IF NOT EXISTS franchise_royalties (
    id TEXT PRIMARY KEY DEFAULT 'royalty_' || gen_random_uuid(),
    franchise_id TEXT REFERENCES franchises(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    gross_revenue DECIMAL(15,2),
    royalty_amount DECIMAL(15,2),
    royalty_rate DECIMAL(5,4),
    status TEXT DEFAULT 'pending', -- pending, calculated, paid
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de white-label clients
CREATE TABLE IF NOT EXISTS whitelabel_clients (
    id TEXT PRIMARY KEY DEFAULT 'wl_' || gen_random_uuid(),
    franchise_id TEXT REFERENCES franchises(id),
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    domain TEXT,
    customizations JSONB,
    monthly_fee DECIMAL(10,2),
    status TEXT DEFAULT 'active', -- active, inactive, suspended
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de API Global metrics
CREATE TABLE IF NOT EXISTS api_global_metrics (
    id TEXT PRIMARY KEY DEFAULT 'api_' || gen_random_uuid(),
    date DATE NOT NULL,
    total_requests BIGINT DEFAULT 0,
    successful_requests BIGINT DEFAULT 0,
    failed_requests BIGINT DEFAULT 0,
    unique_clients BIGINT DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    average_response_time DECIMAL(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de ferramentas personalizadas criadas
CREATE TABLE IF NOT EXISTS custom_tools (
    id TEXT PRIMARY KEY DEFAULT 'tool_' || gen_random_uuid(),
    creator_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    tool_description TEXT,
    tool_type TEXT, -- ai, automation, analytics, etc
    configuration JSONB,
    api_endpoint TEXT,
    status TEXT DEFAULT 'draft', -- draft, testing, active, deprecated
    usage_count BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de monitoramento do sistema
CREATE TABLE IF NOT EXISTS system_monitoring (
    id TEXT PRIMARY KEY DEFAULT 'monitor_' || gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,2),
    metric_unit TEXT,
    status TEXT, -- healthy, warning, critical
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de promoções automáticas
CREATE TABLE IF NOT EXISTS autonomous_promotions (
    id TEXT PRIMARY KEY DEFAULT 'promo_' || gen_random_uuid(),
    campaign_name TEXT NOT NULL,
    target_audience TEXT,
    channels JSONB,
    budget DECIMAL(10,2),
    status TEXT DEFAULT 'draft', -- draft, active, paused, completed
    metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de solicitações de saque de afiliados
CREATE TABLE IF NOT EXISTS affiliate_withdrawals (
    id TEXT PRIMARY KEY DEFAULT 'withdrawal_' || gen_random_uuid(),
    affiliate_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, paid
    payment_method TEXT,
    payment_details JSONB,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by TEXT,
    notes TEXT
);

-- Inserir territórios iniciais
INSERT INTO franchise_territories (id, name, country, population, fee, royalty_rate) VALUES
    ('us-east', 'Estados Unidos - Costa Leste', 'US', 120000000, 50000.00, 0.15),
    ('us-west', 'Estados Unidos - Costa Oeste', 'US', 80000000, 45000.00, 0.15),
    ('canada', 'Canadá', 'CA', 38000000, 35000.00, 0.12),
    ('mexico', 'México', 'MX', 130000000, 25000.00, 0.10),
    ('germany', 'Alemanha', 'DE', 83000000, 40000.00, 0.13),
    ('france', 'França', 'FR', 68000000, 38000.00, 0.13),
    ('uk', 'Reino Unido', 'GB', 67000000, 42000.00, 0.14),
    ('spain', 'Espanha', 'ES', 47000000, 30000.00, 0.11),
    ('japan', 'Japão', 'JP', 125000000, 45000.00, 0.14),
    ('australia', 'Austrália', 'AU', 26000000, 35000.00, 0.12),
    ('singapore', 'Singapura', 'SG', 6000000, 25000.00, 0.11),
    ('argentina', 'Argentina', 'AR', 46000000, 20000.00, 0.08),
    ('chile', 'Chile', 'CL', 19000000, 18000.00, 0.08),
    ('colombia', 'Colômbia', 'CO', 51000000, 22000.00, 0.09)
ON CONFLICT (id) DO NOTHING;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_franchises_territory ON franchises(territory_id);
CREATE INDEX IF NOT EXISTS idx_franchises_franchisee ON franchises(franchisee_id);
CREATE INDEX IF NOT EXISTS idx_franchises_status ON franchises(status);
CREATE INDEX IF NOT EXISTS idx_royalties_franchise ON franchise_royalties(franchise_id);
CREATE INDEX IF NOT EXISTS idx_royalties_period ON franchise_royalties(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_whitelabel_franchise ON whitelabel_clients(franchise_id);
CREATE INDEX IF NOT EXISTS idx_api_metrics_date ON api_global_metrics(date);
CREATE INDEX IF NOT EXISTS idx_custom_tools_creator ON custom_tools(creator_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_timestamp ON system_monitoring(timestamp);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON autonomous_promotions(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_affiliate ON affiliate_withdrawals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON affiliate_withdrawals(status);
