// 📊 API ADMIN - ESTATÍSTICAS E MÉTRICAS GERAIS
import { requireAdmin, logAdminAction } from "../../lib/requireAdmin.js";
import { getPlanRules } from "../../lib/planRules.js";

export default async function handler(req, res) {
  // 🔒 PROTEÇÃO ADMIN
  await new Promise((resolve, reject) => {
    requireAdmin(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  try {
    console.log("📊 Gerando estatísticas administrativas...");

    // 📈 BUSCAR DADOS
    const userStats = await getUserStats();
    const planStats = await getPlanStats();
    const usageStats = await getUsageStats();
    const revenueStats = await getRevenueStats();
    const systemHealth = await getSystemHealth();

    const stats = {
      users: userStats,
      plans: planStats,
      usage: usageStats,
      revenue: revenueStats,
      system: systemHealth,
      generatedAt: new Date().toISOString()
    };

    logAdminAction("VIEW_STATS", { 
      totalUsers: userStats.total,
      activeUsers: userStats.active
    });

    res.json({
      success: true,
      stats: stats,
      message: "Estatísticas geradas com sucesso"
    });

  } catch (error) {
    console.error("🚨 Erro na API admin/stats:", error);
    res.status(500).json({ 
      error: "Erro ao gerar estatísticas",
      details: error.message 
    });
  }
}

// 👥 ESTATÍSTICAS DE USUÁRIOS
async function getUserStats() {
  console.log("👥 Calculando estatísticas de usuários...");

  // 🎯 SIMULAÇÃO - SUBSTITUIR POR CONSULTA REAL
  const mockUsers = [
    { planStatus: "active", plan: "gold", createdAt: "2026-01-01T00:00:00Z" },
    { planStatus: "active", plan: "mensal", createdAt: "2026-01-15T00:00:00Z" },
    { planStatus: "active", plan: "premium", createdAt: "2025-12-01T00:00:00Z" },
    { planStatus: "blocked", plan: "mensal", createdAt: "2026-01-10T00:00:00Z" },
    { planStatus: "expired", plan: "mensal", createdAt: "2025-12-15T00:00:00Z" },
    { planStatus: "active", plan: "free", createdAt: "2026-01-25T00:00:00Z" },
    { planStatus: "active", plan: "gold", createdAt: "2026-01-20T00:00:00Z" }
  ];

  // 🔍 EM PRODUÇÃO:
  // const users = await database.users.find({}).toArray();

  const total = mockUsers.length;
  const active = mockUsers.filter(u => u.planStatus === "active").length;
  const blocked = mockUsers.filter(u => u.planStatus === "blocked").length;
  const expired = mockUsers.filter(u => u.planStatus === "expired").length;

  // 📅 USUÁRIOS NOVOS (ÚLTIMOS 30 DIAS)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const newUsers = mockUsers.filter(u => 
    new Date(u.createdAt) > thirtyDaysAgo
  ).length;

  return {
    total,
    active,
    blocked,
    expired,
    newUsers,
    activePercent: Math.round((active / total) * 100),
    newUsersPercent: Math.round((newUsers / total) * 100)
  };
}

// 📦 ESTATÍSTICAS DE PLANOS
async function getPlanStats() {
  console.log("📦 Calculando estatísticas de planos...");

  // 🎯 SIMULAÇÃO
  const mockUsers = [
    { plan: "gold", planStatus: "active" },
    { plan: "mensal", planStatus: "active" },
    { plan: "premium", planStatus: "active" },
    { plan: "mensal", planStatus: "blocked" },
    { plan: "mensal", planStatus: "expired" },
    { plan: "free", planStatus: "active" },
    { plan: "gold", planStatus: "active" }
  ];

  const planCounts = {};
  const activePlanCounts = {};

  mockUsers.forEach(user => {
    planCounts[user.plan] = (planCounts[user.plan] || 0) + 1;
    
    if (user.planStatus === "active") {
      activePlanCounts[user.plan] = (activePlanCounts[user.plan] || 0) + 1;
    }
  });

  // 📊 ADICIONAR DETALHES DOS PLANOS
  const planDetails = {};
  Object.keys(planCounts).forEach(planType => {
    const rules = getPlanRules(planType);
    planDetails[planType] = {
      name: rules.name,
      price: rules.price,
      totalUsers: planCounts[planType],
      activeUsers: activePlanCounts[planType] || 0,
      revenue: (activePlanCounts[planType] || 0) * rules.price
    };
  });

  return {
    byPlan: planDetails,
    mostPopular: Object.keys(activePlanCounts).reduce((a, b) => 
      activePlanCounts[a] > activePlanCounts[b] ? a : b
    )
  };
}

// 📈 ESTATÍSTICAS DE USO
async function getUsageStats() {
  console.log("📈 Calculando estatísticas de uso...");

  // 🎯 SIMULAÇÃO
  const mockUsage = {
    totalToolsUsed: 1250,
    totalAIGenerations: 3500,
    totalVideosGenerated: 180,
    totalEbooksGenerated: 45,
    
    // USO HOJE
    todayTools: 85,
    todayAI: 120,
    todayVideos: 8,
    todayEbooks: 2,
    
    // MÉDIAS
    avgToolsPerUser: 25.5,
    avgAIPerUser: 71.4,
    avgVideosPerUser: 3.7,
    avgEbooksPerUser: 0.9
  };

  return mockUsage;
}

// 💰 ESTATÍSTICAS DE RECEITA
async function getRevenueStats() {
  console.log("💰 Calculando estatísticas de receita...");

  // 🎯 SIMULAÇÃO
  const mockRevenue = {
    totalRevenue: 2847.30,
    monthlyRevenue: 1456.80,
    weeklyRevenue: 389.70,
    dailyRevenue: 67.90,
    
    // POR PLANO
    revenueByPlan: {
      mensal: 359.40,   // 6 usuários × 59.90
      trimestral: 959.40,  // 6 usuários × 159.90
      semestral: 779.70,   // 3 usuários × 259.90
      anual: 1199.70,      // 3 usuários × 399.90
      free: 0
    },
    
    // MÉTRICAS
    avgRevenuePerUser: 94.91,
    conversionRate: 78.5, // % de usuários que pagam
    churnRate: 5.2 // % de cancelamentos
  };

  return mockRevenue;
}

// 🔧 SAÚDE DO SISTEMA
async function getSystemHealth() {
  console.log("🔧 Verificando saúde do sistema...");

  // 🎯 SIMULAÇÃO
  const mockHealth = {
    uptime: "99.8%",
    responseTime: "145ms",
    errorRate: "0.2%",
    
    // APIS
    apiHealth: {
      payments: "healthy",
      users: "healthy", 
      tools: "healthy",
      webhooks: "healthy"
    },
    
    // RECURSOS
    resources: {
      memory: "67%",
      cpu: "23%",
      storage: "45%"
    },
    
    // ÚLTIMAS 24H
    last24h: {
      requests: 12450,
      errors: 25,
      successRate: "99.8%"
    }
  };

  return mockHealth;
}
