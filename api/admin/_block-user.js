// 🚫 API ADMIN - BLOQUEAR/DESBLOQUEAR USUÁRIO
import { requireAdmin, logAdminAction } from "../../lib/requireAdmin.js";

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
    const { userId, action, reason } = req.body;

    if (!userId || !action) {
      return res.status(400).json({ 
        error: "userId e action são obrigatórios",
        validActions: ["block", "unblock"]
      });
    }

    if (!["block", "unblock"].includes(action)) {
      return res.status(400).json({ 
        error: "Action inválida",
        validActions: ["block", "unblock"]
      });
    }

    console.log(`🚫 ${action.toUpperCase()} usuário: ${userId}`);

    // 🔍 VERIFICAR SE USUÁRIO EXISTE
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: "Usuário não encontrado",
        userId: userId
      });
    }

    // 🚫 EXECUTAR AÇÃO
    let result;
    if (action === "block") {
      result = await blockUser(userId, reason);
    } else {
      result = await unblockUser(userId);
    }

    // 📝 LOG DA AÇÃO
    logAdminAction(`${action.toUpperCase()}_USER`, {
      userId: userId,
      userEmail: user.email,
      reason: reason,
      previousStatus: user.planStatus,
      newStatus: result.newStatus
    });

    res.json({
      success: true,
      action: action,
      userId: userId,
      result: result,
      message: `Usuário ${action === "block" ? "bloqueado" : "desbloqueado"} com sucesso`
    });

  } catch (error) {
    console.error("🚨 Erro na API admin/block-user:", error);
    res.status(500).json({ 
      error: "Erro ao processar ação",
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
      planStatus: "active"
    },
    "teste": {
      userId: "teste",
      email: "teste@teste.com", 
      name: "Usuário Teste",
      plan: "mensal",
      planStatus: "active"
    },
    "premium_user": {
      userId: "premium_user",
      email: "premium@empresa.com",
      name: "Maria Premium", 
      plan: "premium",
      planStatus: "active"
    },
    "blocked_user": {
      userId: "blocked_user",
      email: "blocked@spam.com",
      name: "Usuário Bloqueado",
      plan: "mensal",
      planStatus: "blocked"
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

// 🚫 BLOQUEAR USUÁRIO
async function blockUser(userId, reason) {
  console.log(`🚫 Bloqueando usuário: ${userId}`);
  console.log(`📝 Motivo: ${reason || "Não especificado"}`);

  const blockData = {
    planStatus: "blocked",
    blockedAt: new Date().toISOString(),
    blockedReason: reason || "Bloqueado pelo administrador",
    blockedBy: "admin",
    // Zerar uso para bloquear imediatamente
    dailyUsage: 0,
    monthlyUsage: {
      aiGenerations: 0,
      videos: 0,
      ebooks: 0
    }
  };

  // 🔍 EM PRODUÇÃO:
  // const result = await database.users.updateOne(
  //   { userId },
  //   { $set: blockData }
  // );

  // 🎯 SIMULAÇÃO
  const result = {
    userId: userId,
    newStatus: "blocked",
    blockedAt: blockData.blockedAt,
    reason: blockData.blockedReason,
    success: true
  };

  console.log("🚫 Usuário bloqueado:", result);
  return result;
}

// ✅ DESBLOQUEAR USUÁRIO
async function unblockUser(userId) {
  console.log(`✅ Desbloqueando usuário: ${userId}`);

  const unblockData = {
    planStatus: "active",
    unblockedAt: new Date().toISOString(),
    unblockedBy: "admin",
    // Remover dados de bloqueio
    blockedAt: null,
    blockedReason: null,
    blockedBy: null
  };

  // 🔍 EM PRODUÇÃO:
  // const result = await database.users.updateOne(
  //   { userId },
  //   { 
  //     $set: unblockData,
  //     $unset: { blockedAt: "", blockedReason: "", blockedBy: "" }
  //   }
  // );

  // 🎯 SIMULAÇÃO
  const result = {
    userId: userId,
    newStatus: "active",
    unblockedAt: unblockData.unblockedAt,
    success: true
  };

  console.log("✅ Usuário desbloqueado:", result);
  return result;
}
