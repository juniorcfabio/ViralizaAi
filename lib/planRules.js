// 🚀 REGRAS DOS PLANOS - MODELO SAAS PROFISSIONAL
// Definição completa de limites, permissões e recursos por plano

export const PLAN_RULES = {
  // 🥈 PLANO PRATA (MENSAL)
  mensal: {
    name: "Plano Prata",
    price: 59.9,
    toolsPerDay: 20,
    aiGenerations: 50,
    videosPerMonth: 5,
    ebooksPerMonth: 2,
    maxVideoLength: 30, // segundos
    maxEbookPages: 20,
    support: "normal",
    features: [
      "Geração de conteúdo básico",
      "20 ferramentas por dia",
      "50 gerações de IA por mês",
      "5 vídeos por mês",
      "2 ebooks por mês",
      "Suporte por email"
    ],
    permissions: {
      basicTools: true,
      advancedTools: false,
      premiumTools: false,
      analytics: "basic",
      apiAccess: false,
      whiteLabel: false,
      customTemplates: false
    },
    limits: {
      dailyTools: 20,
      monthlyAI: 50,
      monthlyVideos: 5,
      monthlyEbooks: 2,
      storageGB: 1,
      teamMembers: 1
    }
  },

  // 🥇 PLANO GOLD (TRIMESTRAL)
  gold: {
    name: "Plano Gold",
    price: 149.9,
    toolsPerDay: 100,
    aiGenerations: 300,
    videosPerMonth: 25,
    ebooksPerMonth: 10,
    maxVideoLength: 120, // segundos
    maxEbookPages: 100,
    support: "priority",
    features: [
      "Geração de conteúdo avançado",
      "100 ferramentas por dia",
      "300 gerações de IA por mês",
      "25 vídeos por mês",
      "10 ebooks por mês",
      "Suporte prioritário",
      "Templates premium",
      "Análises avançadas"
    ],
    permissions: {
      basicTools: true,
      advancedTools: true,
      premiumTools: false,
      analytics: "advanced",
      apiAccess: true,
      whiteLabel: false,
      customTemplates: true
    },
    limits: {
      dailyTools: 100,
      monthlyAI: 300,
      monthlyVideos: 25,
      monthlyEbooks: 10,
      storageGB: 10,
      teamMembers: 3
    }
  },

  // 💎 PLANO PREMIUM (ANUAL)
  premium: {
    name: "Plano Premium",
    price: 499.9,
    toolsPerDay: Infinity,
    aiGenerations: Infinity,
    videosPerMonth: Infinity,
    ebooksPerMonth: Infinity,
    maxVideoLength: 600, // 10 minutos
    maxEbookPages: 1000,
    support: "vip",
    features: [
      "Geração de conteúdo ilimitado",
      "Ferramentas ilimitadas",
      "IA ilimitada",
      "Vídeos ilimitados",
      "Ebooks ilimitados",
      "Suporte VIP 24/7",
      "Todos os templates",
      "White label",
      "API completa",
      "Análises empresariais"
    ],
    permissions: {
      basicTools: true,
      advancedTools: true,
      premiumTools: true,
      analytics: "enterprise",
      apiAccess: true,
      whiteLabel: true,
      customTemplates: true
    },
    limits: {
      dailyTools: Infinity,
      monthlyAI: Infinity,
      monthlyVideos: Infinity,
      monthlyEbooks: Infinity,
      storageGB: 100,
      teamMembers: 10
    }
  },

  // 🆓 PLANO GRATUITO (TRIAL)
  free: {
    name: "Plano Gratuito",
    price: 0,
    toolsPerDay: 3,
    aiGenerations: 5,
    videosPerMonth: 1,
    ebooksPerMonth: 0,
    maxVideoLength: 15, // segundos
    maxEbookPages: 0,
    support: "community",
    features: [
      "3 ferramentas por dia",
      "5 gerações de IA por mês",
      "1 vídeo por mês",
      "Suporte da comunidade"
    ],
    permissions: {
      basicTools: true,
      advancedTools: false,
      premiumTools: false,
      analytics: "none",
      apiAccess: false,
      whiteLabel: false,
      customTemplates: false
    },
    limits: {
      dailyTools: 3,
      monthlyAI: 5,
      monthlyVideos: 1,
      monthlyEbooks: 0,
      storageGB: 0.1,
      teamMembers: 1
    }
  }
};

// 🎯 FUNÇÃO PARA OBTER REGRAS DO PLANO
export function getPlanRules(planType) {
  return PLAN_RULES[planType] || PLAN_RULES.free;
}

// 🔍 FUNÇÃO PARA VERIFICAR PERMISSÃO
export function hasPermission(planType, permission) {
  const rules = getPlanRules(planType);
  return rules.permissions[permission] || false;
}

// 📊 FUNÇÃO PARA VERIFICAR LIMITE
export function checkLimit(planType, limitType, currentUsage) {
  const rules = getPlanRules(planType);
  const limit = rules.limits[limitType];
  
  if (limit === Infinity) return { allowed: true, remaining: Infinity };
  
  const remaining = Math.max(0, limit - currentUsage);
  const allowed = currentUsage < limit;
  
  return { allowed, remaining, limit };
}

// 🏆 FUNÇÃO PARA COMPARAR PLANOS
export function comparePlans(planA, planB) {
  const hierarchy = { free: 0, mensal: 1, gold: 2, premium: 3 };
  return hierarchy[planA] - hierarchy[planB];
}

// 💰 STRIPE PRICE IDs (CONFIGURAR NO STRIPE)
export const STRIPE_PRICE_IDS = {
  mensal: "price_mensal_prata_5990", // Substituir pelos IDs reais do Stripe
  gold: "price_trimestral_gold_14990",
  premium: "price_anual_premium_49990"
};

// 🔄 PERÍODOS DE RENOVAÇÃO
export const RENEWAL_PERIODS = {
  mensal: { interval: "month", interval_count: 1 },
  gold: { interval: "month", interval_count: 3 },
  premium: { interval: "year", interval_count: 1 }
};

console.log("📋 Regras dos planos carregadas:", Object.keys(PLAN_RULES));
