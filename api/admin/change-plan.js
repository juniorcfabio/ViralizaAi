// 🔄 API ADMIN - ALTERAR PLANO DO USUÁRIO
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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { userId, planType, duration, reason } = req.body;

    if (!userId || !planType) {
      return res.status(400).json({ 
        error: "userId e planType são obrigatórios",
        validPlans: ["free", "mensal", "gold", "premium"]
      });
    }

    // 🔍 VALIDAR PLANO
    const validPlans = ["free", "mensal", "gold", "premium"];
    if (!validPlans.includes(planType)) {
      return res.status(400).json({ 
        error: "Plano inválido",
        validPlans: validPlans,
        received: planType
      });
    }

    console.log(`🔄 Alterando plano: ${userId} -> ${planType}`);

    // 🔍 VERIFICAR SE USUÁRIO EXISTE
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: "Usuário não encontrado",
        userId: userId
      });
    }

    // 📊 OBTER REGRAS DO NOVO PLANO
    const newPlanRules = getPlanRules(planType);
    const oldPlanRules = getPlanRules(user.plan);

    // 🔄 EXECUTAR ALTERAÇÃO
    const result = await changePlan(userId, planType, duration, reason);

    // 📝 LOG DA AÇÃO
    logAdminAction("CHANGE_PLAN", {
      userId: userId,
      userEmail: user.email,
      oldPlan: user.plan,
      newPlan: planType,
      oldPlanName: oldPlanRules.name,
      newPlanName: newPlanRules.name,
      duration: duration,
      reason: reason
    });

    res.json({
      success: true,
      userId: userId,
      changes: {
        oldPlan: {
          type: user.plan,
          name: oldPlanRules.name,
          price: oldPlanRules.price
        },
        newPlan: {
          type: planType,
          name: newPlanRules.name,
          price: newPlanRules.price
        }
      },
      result: result,
      message: `Plano alterado de ${oldPlanRules.name} para ${newPlanRules.name}`
    });

  } catch (error) {
    console.error("🚨 Erro na API admin/change-plan:", error);
    res.status(500).json({ 
      error: "Erro ao alterar plano",
      details: error.message 
    });
  }
}

// 🔍 BUSCAR USUÁRIO POR ID
async function getUserById(userId) {
  console.log(`🔍 Buscando usuário: ${userId}`);
  
  // 🎯 SIMULAÇÃO - SUBSTITUIR POR CONSULTA REAL
  const mockUsers = {
    "USER123": {
      userId: "USER123",
      email: "user123@email.com",
      name: "João Silva",
      plan: "gold",
      planStatus: "active",
      planExpiresAt: "2026-04-01T00:00:00Z"
    },
    "teste": {
      userId: "teste",
      email: "teste@teste.com", 
      name: "Usuário Teste",
      plan: "mensal",
      planStatus: "active",
      planExpiresAt: "2026-02-01T00:00:00Z"
    },
    "premium_user": {
      userId: "premium_user",
      email: "premium@empresa.com",
      name: "Maria Premium", 
      plan: "premium",
      planStatus: "active",
      planExpiresAt: "2027-01-01T00:00:00Z"
    },
    "blocked_user": {
      userId: "blocked_user",
      email: "blocked@spam.com",
      name: "Usuário Bloqueado",
      plan: "mensal",
      planStatus: "blocked",
      planExpiresAt: "2026-02-01T00:00:00Z"
    }
  };

  // 🔍 EM PRODUÇÃO:
  // const user = await database.users.findOne({ userId });
  
  const user = mockUsers[userId];
  
  if (user) {
    console.log("✅ Usuário encontrado:", user.email);
  } else {
    console.log("❌ Usuário não encontrado");
  }
  
  return user || null;
}

// 🔄 ALTERAR PLANO DO USUÁRIO
async function changePlan(userId, planType, duration, reason) {
  console.log(`🔄 Alterando plano: ${userId} -> ${planType}`);

  // 📅 CALCULAR NOVA EXPIRAÇÃO
  const now = new Date();
  let newExpiration = new Date();

  if (duration) {
    // Duração específica fornecida (em dias)
    newExpiration.setDate(newExpiration.getDate() + parseInt(duration));
  } else {
    // Duração padrão baseada no plano
    switch (planType) {
      case 'free':
        newExpiration.setDate(newExpiration.getDate() + 7); // 7 dias
        break;
      case 'mensal':
        newExpiration.setMonth(newExpiration.getMonth() + 1); // 1 mês
        break;
      case 'gold':
        newExpiration.setMonth(newExpiration.getMonth() + 3); // 3 meses
        break;
      case 'premium':
        newExpiration.setFullYear(newExpiration.getFullYear() + 1); // 1 ano
        break;
    }
  }

  const planData = {
    plan: planType,
    planStatus: planType === 'free' ? 'active' : 'active',
    planExpiresAt: newExpiration.toISOString(),
    planChangedAt: now.toISOString(),
    planChangedBy: "admin",
    planChangeReason: reason || "Alteração manual pelo administrador",
    
    // 🔄 RESETAR CONTADORES PARA NOVO PLANO
    dailyUsage: 0,
    monthlyUsage: {
      aiGenerations: 0,
      videos: 0,
      ebooks: 0
    },
    
    // 📊 HISTÓRICO
    lastPlanChange: {
      date: now.toISOString(),
      reason: reason,
      changedBy: "admin"
    }
  };

  // 🔍 EM PRODUÇÃO:
  // const result = await database.users.updateOne(
  //   { userId },
  //   { 
  //     $set: planData,
  //     $push: { 
  //       planHistory: {
  //         date: now.toISOString(),
  //         action: "plan_changed",
  //         newPlan: planType,
  //         reason: reason,
  //         changedBy: "admin"
  //       }
  //     }
  //   }
  // );

  // 🎯 SIMULAÇÃO
  const result = {
    userId: userId,
    newPlan: planType,
    newExpiration: planData.planExpiresAt,
    changedAt: planData.planChangedAt,
    reason: planData.planChangeReason,
    resetUsage: true,
    success: true
  };

  console.log("🔄 Plano alterado:", result);
  return result;
}

// 📊 FUNÇÃO AUXILIAR PARA CALCULAR DURAÇÃO EM DIAS
function calculateDaysUntilExpiry(expirationDate) {
  const now = new Date();
  const expiry = new Date(expirationDate);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
