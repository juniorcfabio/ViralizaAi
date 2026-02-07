// 🌎 CONFIGURAÇÃO GLOBAL - INFRAESTRUTURA MUNDIAL
// Sistema multimoeda, multiregião e escalável

// 💱 MOEDAS SUPORTADAS POR PAÍS
export const CURRENCIES = {
  // 🇧🇷 América do Sul
  BR: "brl", // Brasil
  AR: "usd", // Argentina (USD mais estável)
  CL: "usd", // Chile
  CO: "usd", // Colômbia
  PE: "usd", // Peru
  UY: "usd", // Uruguai
  
  // 🇺🇸 América do Norte
  US: "usd", // Estados Unidos
  CA: "cad", // Canadá
  MX: "usd", // México
  
  // 🇪🇺 Europa
  DE: "eur", // Alemanha
  FR: "eur", // França
  ES: "eur", // Espanha
  IT: "eur", // Itália
  PT: "eur", // Portugal
  NL: "eur", // Holanda
  BE: "eur", // Bélgica
  AT: "eur", // Áustria
  
  // 🇬🇧 Reino Unido
  GB: "gbp", // Reino Unido
  
  // 🌏 Ásia-Pacífico
  AU: "aud", // Austrália
  NZ: "aud", // Nova Zelândia
  SG: "usd", // Singapura
  HK: "usd", // Hong Kong
  JP: "usd", // Japão
  KR: "usd", // Coreia do Sul
  
  // 🌍 Outros
  ZA: "usd", // África do Sul
  IN: "usd", // Índia
  AE: "usd", // Emirados Árabes
};

// 💰 PREÇOS GLOBAIS POR PLANO E MOEDA
export const GLOBAL_PRICES = {
  free: {
    brl: 0,
    usd: 0,
    eur: 0,
    gbp: 0,
    cad: 0,
    aud: 0
  },
  
  mensal: {
    brl: 59.90,   // Brasil - Preço local
    usd: 12.90,   // EUA/Global - Convertido
    eur: 11.90,   // Europa - Ajustado para mercado
    gbp: 10.90,   // Reino Unido - Premium
    cad: 16.90,   // Canadá
    aud: 18.90    // Austrália
  },
  
  gold: {
    brl: 149.90,  // Brasil
    usd: 29.90,   // EUA/Global
    eur: 27.90,   // Europa
    gbp: 24.90,   // Reino Unido
    cad: 39.90,   // Canadá
    aud: 44.90    // Austrália
  },
  
  premium: {
    brl: 499.90,  // Brasil
    usd: 99.90,   // EUA/Global
    eur: 89.90,   // Europa
    gbp: 79.90,   // Reino Unido
    cad: 129.90,  // Canadá
    aud: 149.90   // Austrália
  }
};

// 🌍 CONFIGURAÇÃO DE REGIÕES
export const REGIONS = {
  // 🇧🇷 América do Sul
  'sa-east-1': {
    name: 'São Paulo',
    countries: ['BR', 'AR', 'CL', 'CO', 'PE', 'UY'],
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    currency: 'brl',
    paymentMethods: ['pix', 'card', 'boleto'],
    taxRate: 0.0775 // ICMS médio Brasil
  },
  
  // 🇺🇸 América do Norte
  'us-east-1': {
    name: 'Virginia',
    countries: ['US', 'CA', 'MX'],
    timezone: 'America/New_York',
    language: 'en-US',
    currency: 'usd',
    paymentMethods: ['card', 'paypal', 'apple_pay'],
    taxRate: 0.08 // Sales tax médio EUA
  },
  
  // 🇪🇺 Europa
  'eu-west-1': {
    name: 'Dublin',
    countries: ['DE', 'FR', 'ES', 'IT', 'PT', 'NL', 'BE', 'AT'],
    timezone: 'Europe/Dublin',
    language: 'en-GB',
    currency: 'eur',
    paymentMethods: ['card', 'sepa', 'ideal', 'sofort'],
    taxRate: 0.20 // VAT médio Europa
  },
  
  // 🇬🇧 Reino Unido
  'eu-west-2': {
    name: 'London',
    countries: ['GB'],
    timezone: 'Europe/London',
    language: 'en-GB',
    currency: 'gbp',
    paymentMethods: ['card', 'paypal', 'bacs'],
    taxRate: 0.20 // VAT Reino Unido
  },
  
  // 🌏 Ásia-Pacífico
  'ap-southeast-2': {
    name: 'Sydney',
    countries: ['AU', 'NZ', 'SG', 'HK', 'JP', 'KR'],
    timezone: 'Australia/Sydney',
    language: 'en-AU',
    currency: 'aud',
    paymentMethods: ['card', 'paypal', 'alipay'],
    taxRate: 0.10 // GST Austrália
  }
};

// 🔐 CONFIGURAÇÃO DE ROLES E PERMISSÕES
export const ROLES = {
  admin: {
    name: 'Administrador',
    permissions: ['*'], // Todas as permissões
    level: 100
  },
  
  financial: {
    name: 'Financeiro',
    permissions: [
      'view_payments',
      'view_revenue',
      'export_financial_data',
      'manage_refunds',
      'view_analytics'
    ],
    level: 80
  },
  
  support: {
    name: 'Suporte',
    permissions: [
      'view_users',
      'edit_user_plans',
      'view_user_usage',
      'send_notifications',
      'view_support_tickets'
    ],
    level: 60
  },
  
  moderator: {
    name: 'Moderador',
    permissions: [
      'block_users',
      'unblock_users',
      'view_fraud_reports',
      'moderate_content',
      'view_user_activity'
    ],
    level: 40
  },
  
  analyst: {
    name: 'Analista',
    permissions: [
      'view_analytics',
      'view_metrics',
      'export_reports',
      'view_user_stats'
    ],
    level: 20
  },
  
  user: {
    name: 'Usuário',
    permissions: [
      'use_tools',
      'view_own_data',
      'manage_own_account'
    ],
    level: 1
  }
};

// 🛡️ CONFIGURAÇÃO DE SEGURANÇA
export const SECURITY_CONFIG = {
  // 🚨 RATE LIMITING
  rateLimits: {
    global: 1000,        // Requests por minuto globalmente
    perIP: 200,          // Requests por IP por minuto
    perUser: 100,        // Requests por usuário por minuto
    api: 500,            // Requests para APIs por minuto
    auth: 10,            // Tentativas de login por minuto
    payment: 5           // Tentativas de pagamento por minuto
  },
  
  // 🔒 BLOQUEIO AUTOMÁTICO
  autoBlock: {
    suspiciousRequests: 500,    // Requests suspeitos para bloqueio
    failedLogins: 5,            // Logins falhados para bloqueio
    fraudScore: 80,             // Score de fraude para bloqueio
    unusualActivity: true       // Bloquear atividade incomum
  },
  
  // 🌍 GEO-BLOCKING
  blockedCountries: [
    // Países com alto risco de fraude (configurável)
    // 'XX' // Adicionar conforme necessário
  ],
  
  // 🔐 CRIPTOGRAFIA
  encryption: {
    algorithm: 'aes-256-gcm',
    keyRotation: 30, // dias
    saltRounds: 12
  }
};

// 🚀 CONFIGURAÇÃO DE PERFORMANCE
export const PERFORMANCE_CONFIG = {
  // 📦 CACHE
  cache: {
    ttl: {
      static: 86400,      // 24 horas para conteúdo estático
      api: 300,           // 5 minutos para APIs
      user: 900,          // 15 minutos para dados de usuário
      metrics: 60         // 1 minuto para métricas
    },
    
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD
    }
  },
  
  // 🌐 CDN
  cdn: {
    provider: 'cloudflare',
    zones: {
      static: process.env.CLOUDFLARE_ZONE_STATIC,
      api: process.env.CLOUDFLARE_ZONE_API
    }
  },
  
  // 📊 MONITORAMENTO
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development'
    },
    
    datadog: {
      apiKey: process.env.DATADOG_API_KEY,
      service: 'viralizaai'
    }
  }
};

// 🔄 GATEWAYS DE PAGAMENTO
export const PAYMENT_GATEWAYS = {
  primary: 'stripe',
  
  gateways: {
    stripe: {
      name: 'Stripe',
      regions: ['global'],
      currencies: ['brl', 'usd', 'eur', 'gbp', 'cad', 'aud'],
      methods: ['card', 'pix', 'sepa', 'ideal'],
      priority: 1
    },
    
    mercadopago: {
      name: 'Mercado Pago',
      regions: ['sa-east-1'],
      currencies: ['brl', 'usd'],
      methods: ['card', 'pix', 'boleto'],
      priority: 2
    },
    
    paypal: {
      name: 'PayPal',
      regions: ['us-east-1', 'eu-west-1', 'ap-southeast-2'],
      currencies: ['usd', 'eur', 'gbp', 'aud'],
      methods: ['paypal'],
      priority: 3
    }
  }
};

// 🌍 FUNÇÃO PARA DETECTAR REGIÃO DO USUÁRIO
export function detectUserRegion(req) {
  // Cloudflare fornece o país via header
  const country = req.headers['cf-ipcountry'] || 
                 req.headers['x-country'] || 
                 'BR'; // Default Brasil

  // Encontrar região baseada no país
  for (const [regionId, region] of Object.entries(REGIONS)) {
    if (region.countries.includes(country)) {
      return {
        regionId,
        country,
        ...region,
        currency: CURRENCIES[country] || 'usd'
      };
    }
  }

  // Fallback para região padrão
  return {
    regionId: 'sa-east-1',
    country: 'BR',
    ...REGIONS['sa-east-1'],
    currency: 'brl'
  };
}

// 💰 FUNÇÃO PARA OBTER PREÇO LOCALIZADO
export function getLocalizedPrice(planType, currency) {
  const prices = GLOBAL_PRICES[planType];
  if (!prices) return null;

  return {
    amount: prices[currency] || prices.usd,
    currency: currency,
    formatted: formatCurrency(prices[currency] || prices.usd, currency)
  };
}

// 💱 FUNÇÃO PARA FORMATAR MOEDA
export function formatCurrency(amount, currency) {
  const formatters = {
    brl: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    usd: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    eur: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }),
    gbp: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
    cad: new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }),
    aud: new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })
  };

  const formatter = formatters[currency] || formatters.usd;
  return formatter.format(amount);
}

console.log("🌍 Configuração global carregada - Infraestrutura mundial ativa");
