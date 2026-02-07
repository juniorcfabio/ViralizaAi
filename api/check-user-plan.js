// 🔍 API PARA VERIFICAR PLANO DO USUÁRIO
import { checkUserPlan } from "../lib/requirePlan.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({ 
        error: "User ID é obrigatório",
        code: "NO_USER_ID"
      });
    }

    console.log("🔍 Verificando plano do usuário:", userId);

    // 🔍 VERIFICAR PLANO NO BANCO
    const planCheck = await checkUserPlan(userId);

    if (!planCheck.hasAccess) {
      return res.status(403).json({
        hasAccess: false,
        reason: planCheck.reason,
        message: getReasonMessage(planCheck.reason),
        planStatus: planCheck.planStatus,
        expiresAt: planCheck.expiresAt
      });
    }

    // ✅ USUÁRIO TEM ACESSO
    res.status(200).json({
      hasAccess: true,
      user: {
        id: planCheck.user.userId,
        plan: planCheck.user.plan,
        planStatus: planCheck.user.planStatus,
        expiresAt: planCheck.user.planExpiresAt,
        activatedAt: planCheck.user.activatedAt
      },
      planDetails: getPlanDetails(planCheck.user.plan),
      message: "Plano ativo e válido"
    });

  } catch (error) {
    console.error("🚨 Erro ao verificar plano:", error);
    res.status(500).json({ 
      error: "Erro interno do servidor",
      details: error.message 
    });
  }
}

function getReasonMessage(reason) {
  const messages = {
    "USER_NOT_FOUND": "Usuário não encontrado no sistema",
    "PLAN_INACTIVE": "Seu plano está inativo. Faça um pagamento para ativar.",
    "PLAN_EXPIRED": "Seu plano expirou. Renove sua assinatura para continuar."
  };
  
  return messages[reason] || "Acesso negado";
}

function getPlanDetails(planType) {
  const planDetails = {
    mensal: {
      name: "Plano Mensal",
      price: 59.9,
      features: [
        "Geração de conteúdo básico",
        "5 vídeos por mês",
        "2 ebooks por mês",
        "Suporte por email"
      ],
      limits: {
        videos: 5,
        ebooks: 2,
        maxVideoLength: 30,
        maxEbookPages: 20
      }
    },
    trimestral: {
      name: "Plano Trimestral",
      price: 149.9,
      features: [
        "Geração de conteúdo avançado",
        "15 vídeos por mês",
        "5 ebooks por mês",
        "Suporte prioritário",
        "Templates premium"
      ],
      limits: {
        videos: 15,
        ebooks: 5,
        maxVideoLength: 60,
        maxEbookPages: 50
      }
    },
    semestral: {
      name: "Plano Semestral",
      price: 279.9,
      features: [
        "Geração de conteúdo premium",
        "30 vídeos por mês",
        "10 ebooks por mês",
        "Suporte 24/7",
        "Templates premium",
        "Análises avançadas"
      ],
      limits: {
        videos: 30,
        ebooks: 10,
        maxVideoLength: 120,
        maxEbookPages: 100
      }
    },
    anual: {
      name: "Plano Anual",
      price: 499.9,
      features: [
        "Geração de conteúdo ilimitado",
        "100 vídeos por mês",
        "50 ebooks por mês",
        "Suporte dedicado",
        "Todos os templates",
        "Análises empresariais",
        "API access"
      ],
      limits: {
        videos: 100,
        ebooks: 50,
        maxVideoLength: 300,
        maxEbookPages: 500
      }
    }
  };

  return planDetails[planType] || planDetails.mensal;
}
