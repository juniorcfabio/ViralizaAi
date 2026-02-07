// 🔒 MIDDLEWARE DE PROTEÇÃO TOTAL - MODELO SAAS PROFISSIONAL
// Frontend nunca decide acesso - Backend valida plano, limites e permissões

import { PLAN_RULES, getPlanRules, checkLimit } from "./planRules.js";
import { autoCheckAndBlock } from "./fraudDetection.js";
import { trackUser, trackTool, realTimeMetrics } from "./realTimeMetrics.js";

export async function requireActivePlan(req, res, next) {
  try {
    const userId = req.headers["x-user-id"];

    console.log("🔍 Verificando acesso para usuário:", userId);

    if (!userId) {
      console.log("❌ Usuário não identificado");
      return res.status(401).json({ 
        error: "Não autorizado",
        code: "NO_USER_ID"
      });
    }

    // 🔥 BUSCAR USUÁRIO NO BANCO
    const user = await getUserFromDB(userId);

    if (!user) {
      console.log("❌ Usuário não encontrado no banco:", userId);
      return res.status(401).json({ 
        error: "Usuário inválido",
        code: "USER_NOT_FOUND"
      });
    }

    console.log("👤 Usuário encontrado:", {
      userId: user.userId,
      plan: user.plan,
      status: user.planStatus,
      expires: user.planExpiresAt,
      dailyUsage: user.dailyUsage || 0,
      monthlyUsage: user.monthlyUsage || {}
    });

    // 🛡️ VERIFICAR STATUS DO PLANO
    if (user.planStatus !== "active") {
      console.log("❌ Plano inativo:", user.planStatus);
      return res.status(403).json({ 
        error: "Plano inativo",
        code: "PLAN_INACTIVE",
        planStatus: user.planStatus
      });
    }

    // ⏰ VERIFICAR EXPIRAÇÃO
    const now = new Date();
    const expiresAt = new Date(user.planExpiresAt);
    
    if (expiresAt < now) {
      console.log("❌ Plano expirado:", {
        expiresAt: user.planExpiresAt,
        now: now.toISOString()
      });
      
      // 🔒 MARCAR COMO EXPIRADO NO BANCO
      await updateUserPlanStatus(userId, "expired");
      
      return res.status(403).json({ 
        error: "Plano expirado",
        code: "PLAN_EXPIRED",
        expiresAt: user.planExpiresAt
      });
    }

    // 📊 VERIFICAR LIMITES DO PLANO
    const planRules = getPlanRules(user.plan);
    const dailyUsage = user.dailyUsage || 0;

    console.log("📋 Regras do plano:", {
      plan: user.plan,
      toolsPerDay: planRules.toolsPerDay,
      currentUsage: dailyUsage
    });

    // 🚫 VERIFICAR LIMITE DIÁRIO
    if (planRules.toolsPerDay !== Infinity && dailyUsage >= planRules.toolsPerDay) {
      console.log("❌ Limite diário atingido:", {
        limit: planRules.toolsPerDay,
        usage: dailyUsage
      });
      
      return res.status(403).json({ 
        error: "Limite diário de ferramentas atingido",
        code: "DAILY_LIMIT_EXCEEDED",
        limit: planRules.toolsPerDay,
        usage: dailyUsage,
        resetTime: getNextResetTime()
      });
    }

    // 🚨 VERIFICAÇÃO ANTIFRAUDE
    const fraudAnalysis = await autoCheckAndBlock(user, {
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      requestsPerMinute: await getRequestsPerMinute(userId)
    });

    if (fraudAnalysis.recommendedAction.action === 'block_immediately') {
      console.log("🚫 Usuário bloqueado por detecção de fraude:", fraudAnalysis);
      return res.status(403).json({ 
        error: "Conta suspensa por atividade suspeita",
        code: "FRAUD_DETECTED",
        riskLevel: fraudAnalysis.riskLevel
      });
    }

    // 📊 REGISTRAR USUÁRIO ONLINE
    trackUser(userId, {
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    console.log("✅ Acesso liberado para:", userId);

    // 🔓 USUÁRIO VÁLIDO - ADICIONAR AO REQUEST
    req.user = user;
    
    if (next) {
      next();
    } else {
      return { success: true, user };
    }

  } catch (error) {
    console.error("🚨 Erro no middleware de proteção:", error);
    return res.status(500).json({ 
      error: "Erro interno do servidor",
      code: "INTERNAL_ERROR"
    });
  }
}

// 🗄️ SIMULAÇÃO DE BANCO DE DADOS - MODELO SAAS
// EM PRODUÇÃO: SUBSTITUIR POR SEU BANCO REAL
async function getUserFromDB(userId) {
  console.log("🔍 Buscando usuário no banco:", userId);
  
  // 🎯 SIMULAÇÃO - SUBSTITUIR POR CONSULTA REAL
  // Exemplo: MongoDB, PostgreSQL, Firebase, etc.
  const mockUsers = {
    "USER123": {
      userId: "USER123",
      plan: "gold",
      planStatus: "active",
      planExpiresAt: "2026-04-01T00:00:00Z", // 3 meses
      lastPaymentId: "pi_test_123",
      activatedAt: "2026-01-01T00:00:00Z",
      dailyUsage: 15, // Usado 15 de 100 ferramentas hoje
      monthlyUsage: {
        aiGenerations: 45, // Usado 45 de 300 IA
        videos: 3, // Usado 3 de 25 vídeos
        ebooks: 1 // Usado 1 de 10 ebooks
      },
      subscriptionId: "sub_stripe_123",
      customerId: "cus_stripe_123"
    },
    "teste": {
      userId: "teste",
      plan: "mensal", 
      planStatus: "active",
      planExpiresAt: "2026-02-01T00:00:00Z",
      lastPaymentId: "pi_test_456",
      activatedAt: "2026-01-01T00:00:00Z",
      dailyUsage: 5, // Usado 5 de 20 ferramentas hoje
      monthlyUsage: {
        aiGenerations: 12, // Usado 12 de 50 IA
        videos: 1, // Usado 1 de 5 vídeos
        ebooks: 0 // Usado 0 de 2 ebooks
      },
      subscriptionId: null, // PIX não tem subscription
      customerId: null
    },
    "premium_user": {
      userId: "premium_user",
      plan: "premium",
      planStatus: "active", 
      planExpiresAt: "2027-01-01T00:00:00Z", // 1 ano
      lastPaymentId: "pi_test_789",
      activatedAt: "2026-01-01T00:00:00Z",
      dailyUsage: 250, // Ilimitado
      monthlyUsage: {
        aiGenerations: 1500, // Ilimitado
        videos: 50, // Ilimitado
        ebooks: 20 // Ilimitado
      },
      subscriptionId: "sub_stripe_premium",
      customerId: "cus_stripe_premium"
    }
  };

  // 🔍 EM PRODUÇÃO: 
  // const user = await database.users.findOne({ userId });
  // return user;
  
  const user = mockUsers[userId];
  
  if (user) {
    console.log("✅ Usuário encontrado no banco");
  } else {
    console.log("❌ Usuário não encontrado no banco");
  }
  
  return user || null;
}

// ⏰ FUNÇÃO PARA CALCULAR PRÓXIMO RESET
function getNextResetTime() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

// 📈 FUNÇÃO PARA INCREMENTAR USO COM TRACKING
export async function incrementUsage(userId, usageType = 'dailyUsage', toolData = {}) {
  console.log(`📈 Incrementando uso: ${userId} -> ${usageType}`);
  
  // 🔍 EM PRODUÇÃO:
  // await database.users.updateOne(
  //   { userId },
  //   { $inc: { [usageType]: 1 } }
  // );
  
  // 📊 REGISTRAR USO DA FERRAMENTA
  if (toolData.tool) {
    await trackTool({
      userId,
      tool: toolData.tool,
      ip: toolData.ip,
      success: true,
      metadata: toolData.metadata
    });
  }
  
  console.log("✅ Uso incrementado no banco");
}

// 📊 FUNÇÃO PARA OBTER REQUESTS POR MINUTO
async function getRequestsPerMinute(userId) {
  // 🎯 SIMULAÇÃO - EM PRODUÇÃO BUSCAR DO CACHE/BANCO
  const mockRequestCounts = {
    "USER123": 15,
    "teste": 8,
    "premium_user": 45,
    "blocked_user": 150 // Usuário suspeito
  };
  
  return mockRequestCounts[userId] || 5;
}

// 🔄 ATUALIZAR STATUS DO PLANO
async function updateUserPlanStatus(userId, status) {
  console.log(`🔄 Atualizando status do plano: ${userId} -> ${status}`);
  
  // 🔍 EM PRODUÇÃO:
  // await database.users.updateOne(
  //   { userId },
  //   { $set: { planStatus: status, updatedAt: new Date() } }
  // );
  
  console.log("✅ Status atualizado no banco");
}

// 🔓 FUNÇÃO PARA LIBERAR PLANO (CHAMADA PELO WEBHOOK)
export async function liberarPlanoSeguro(userId, planType, paymentId) {
  console.log(`🔓 Liberando plano seguro: ${userId} -> ${planType}`);
  
  // 📅 CALCULAR EXPIRAÇÃO
  const now = new Date();
  let expiration = new Date();
  
  switch (planType) {
    case 'mensal':
      expiration.setMonth(expiration.getMonth() + 1);
      break;
    case 'trimestral':
      expiration.setMonth(expiration.getMonth() + 3);
      break;
    case 'semestral':
      expiration.setMonth(expiration.getMonth() + 6);
      break;
    case 'anual':
      expiration.setFullYear(expiration.getFullYear() + 1);
      break;
    default:
      expiration.setMonth(expiration.getMonth() + 1);
  }

  const userData = {
    userId: userId,
    plan: planType,
    planStatus: "active",
    planExpiresAt: expiration.toISOString(),
    lastPaymentId: paymentId,
    activatedAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  console.log("💾 Dados do plano a serem salvos:", userData);

  // 🔍 EM PRODUÇÃO: SALVAR NO BANCO REAL
  // await database.users.updateOne(
  //   { userId },
  //   { $set: userData },
  //   { upsert: true }
  // );

  console.log("✅ Plano liberado com segurança no banco!");
  
  return userData;
}

// 🔍 VERIFICAR PLANO (PARA FRONTEND)
export async function checkUserPlan(userId) {
  const user = await getUserFromDB(userId);
  
  if (!user) {
    return {
      hasAccess: false,
      reason: "USER_NOT_FOUND"
    };
  }

  if (user.planStatus !== "active") {
    return {
      hasAccess: false,
      reason: "PLAN_INACTIVE",
      planStatus: user.planStatus
    };
  }

  const now = new Date();
  const expiresAt = new Date(user.planExpiresAt);
  
  if (expiresAt < now) {
    // Marcar como expirado
    await updateUserPlanStatus(userId, "expired");
    
    return {
      hasAccess: false,
      reason: "PLAN_EXPIRED",
      expiresAt: user.planExpiresAt
    };
  }

  return {
    hasAccess: true,
    user: user,
    plan: user.plan,
    expiresAt: user.planExpiresAt
  };
}
