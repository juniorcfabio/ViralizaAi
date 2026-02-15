// 👥 API ADMIN - LISTAR E GERENCIAR USUÁRIOS
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
    if (req.method === "GET") {
      // 📋 LISTAR TODOS OS USUÁRIOS
      const users = await getAllUsers();
      
      logAdminAction("LIST_USERS", { count: users.length });
      
      res.json({
        success: true,
        users: users,
        total: users.length,
        timestamp: new Date().toISOString()
      });

    } else if (req.method === "POST") {
      // ✏️ ATUALIZAR USUÁRIO
      const { userId, updates } = req.body;

      if (!userId || !updates) {
        return res.status(400).json({ 
          error: "userId e updates são obrigatórios" 
        });
      }

      const result = await updateUser(userId, updates);
      
      logAdminAction("UPDATE_USER", { userId, updates });
      
      res.json({
        success: true,
        result: result,
        message: "Usuário atualizado com sucesso"
      });

    } else {
      res.status(405).json({ error: "Método não permitido" });
    }

  } catch (error) {
    console.error("🚨 Erro na API admin/users:", error);
    res.status(500).json({ 
      error: "Erro interno do servidor",
      details: error.message 
    });
  }
}

// 📋 FUNÇÃO PARA BUSCAR TODOS OS USUÁRIOS
async function getAllUsers() {
  console.log("📋 Buscando todos os usuários...");
  
  // 🎯 SIMULAÇÃO - SUBSTITUIR POR CONSULTA REAL
  const mockUsers = [
    {
      userId: "USER123",
      email: "user123@email.com",
      name: "João Silva",
      plan: "gold",
      planStatus: "active",
      planExpiresAt: "2026-04-01T00:00:00Z",
      dailyUsage: 15,
      monthlyUsage: {
        aiGenerations: 45,
        videos: 3,
        ebooks: 1
      },
      totalSpent: 149.90,
      createdAt: "2026-01-01T00:00:00Z",
      lastLoginAt: "2026-01-30T10:30:00Z",
      subscriptionId: "sub_stripe_123",
      customerId: "cus_stripe_123"
    },
    {
      userId: "teste",
      email: "teste@teste.com",
      name: "Usuário Teste",
      plan: "mensal",
      planStatus: "active",
      planExpiresAt: "2026-02-01T00:00:00Z",
      dailyUsage: 5,
      monthlyUsage: {
        aiGenerations: 12,
        videos: 1,
        ebooks: 0
      },
      totalSpent: 59.90,
      createdAt: "2026-01-15T00:00:00Z",
      lastLoginAt: "2026-01-30T14:15:00Z",
      subscriptionId: null,
      customerId: null
    },
    {
      userId: "premium_user",
      email: "premium@empresa.com",
      name: "Maria Premium",
      plan: "premium",
      planStatus: "active",
      planExpiresAt: "2027-01-01T00:00:00Z",
      dailyUsage: 250,
      monthlyUsage: {
        aiGenerations: 1500,
        videos: 50,
        ebooks: 20
      },
      totalSpent: 499.90,
      createdAt: "2025-12-01T00:00:00Z",
      lastLoginAt: "2026-01-30T16:45:00Z",
      subscriptionId: "sub_stripe_premium",
      customerId: "cus_stripe_premium"
    },
    {
      userId: "blocked_user",
      email: "blocked@spam.com",
      name: "Usuário Bloqueado",
      plan: "mensal",
      planStatus: "blocked",
      planExpiresAt: "2026-02-01T00:00:00Z",
      dailyUsage: 0,
      monthlyUsage: {
        aiGenerations: 0,
        videos: 0,
        ebooks: 0
      },
      totalSpent: 59.90,
      createdAt: "2026-01-10T00:00:00Z",
      lastLoginAt: "2026-01-25T09:20:00Z",
      subscriptionId: null,
      customerId: null,
      blockedReason: "Uso abusivo detectado"
    },
    {
      userId: "expired_user",
      email: "expired@old.com",
      name: "Usuário Expirado",
      plan: "mensal",
      planStatus: "expired",
      planExpiresAt: "2026-01-15T00:00:00Z",
      dailyUsage: 0,
      monthlyUsage: {
        aiGenerations: 0,
        videos: 0,
        ebooks: 0
      },
      totalSpent: 59.90,
      createdAt: "2025-12-15T00:00:00Z",
      lastLoginAt: "2026-01-20T11:10:00Z",
      subscriptionId: null,
      customerId: null
    }
  ];

  // 🔍 EM PRODUÇÃO:
  // const users = await database.users.find({}).toArray();
  
  // 📊 ADICIONAR DADOS CALCULADOS
  const usersWithStats = mockUsers.map(user => {
    const planRules = getPlanRules(user.plan);
    
    return {
      ...user,
      planDetails: {
        name: planRules.name,
        price: planRules.price,
        limits: planRules.limits
      },
      usagePercent: {
        daily: planRules.toolsPerDay === Infinity ? 0 : 
          Math.round((user.dailyUsage / planRules.toolsPerDay) * 100),
        ai: planRules.aiGenerations === Infinity ? 0 :
          Math.round((user.monthlyUsage.aiGenerations / planRules.aiGenerations) * 100)
      },
      daysUntilExpiry: Math.ceil(
        (new Date(user.planExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)
      )
    };
  });

  console.log(`✅ ${usersWithStats.length} usuários encontrados`);
  return usersWithStats;
}

// ✏️ FUNÇÃO PARA ATUALIZAR USUÁRIO
async function updateUser(userId, updates) {
  console.log(`✏️ Atualizando usuário: ${userId}`, updates);
  
  // 🔍 EM PRODUÇÃO:
  // const result = await database.users.updateOne(
  //   { userId },
  //   { $set: { ...updates, updatedAt: new Date() } }
  // );
  
  // 🎯 SIMULAÇÃO
  const mockResult = {
    userId: userId,
    updates: updates,
    updatedAt: new Date().toISOString(),
    success: true
  };

  console.log("✅ Usuário atualizado:", mockResult);
  return mockResult;
}
