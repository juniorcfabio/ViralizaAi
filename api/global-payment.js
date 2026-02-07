// 🌍 API DE PAGAMENTO GLOBAL - MULTIMOEDA E MULTI-GATEWAY
import { processGlobalPayment } from "../lib/paymentGateway.js";
import { detectUserRegion, getLocalizedPrice } from "../lib/globalConfig.js";
import { securityMiddleware } from "../lib/securityManager.js";
import { requirePermission } from "../lib/rolePermissions.js";

export default async function handler(req, res) {
  // 🛡️ APLICAR SEGURANÇA PRIMEIRO
  await new Promise((resolve, reject) => {
    securityMiddleware(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { planType, userId, userEmail } = req.body;

    if (!planType || !userId || !userEmail) {
      return res.status(400).json({ 
        error: "Dados obrigatórios faltando",
        required: ["planType", "userId", "userEmail"]
      });
    }

    console.log(`🌍 Processamento global de pagamento iniciado`);
    console.log(`👤 Usuário: ${userId} (${userEmail})`);
    console.log(`📦 Plano: ${planType}`);

    // 🌍 DETECTAR REGIÃO DO USUÁRIO
    const userRegion = detectUserRegion(req);
    console.log(`🌍 Região detectada: ${userRegion.regionId} (${userRegion.country})`);

    // 💰 OBTER PREÇO LOCALIZADO
    const pricing = getLocalizedPrice(planType, userRegion.currency);
    if (!pricing) {
      return res.status(400).json({ 
        error: "Plano não disponível",
        planType: planType,
        region: userRegion.regionId
      });
    }

    console.log(`💰 Preço localizado: ${pricing.formatted}`);

    // 🔄 PROCESSAR PAGAMENTO COM FAILOVER
    const paymentResult = await processGlobalPayment({
      planType,
      userId,
      userEmail
    }, req);

    if (!paymentResult.success) {
      console.error("❌ Falha no processamento:", paymentResult.error);
      return res.status(500).json({
        error: paymentResult.error,
        code: paymentResult.code,
        region: paymentResult.region
      });
    }

    console.log(`✅ Pagamento processado via: ${paymentResult.gateway}`);

    // 📊 PREPARAR RESPOSTA COMPLETA
    const response = {
      success: true,
      payment: paymentResult.data,
      region: {
        country: userRegion.country,
        currency: userRegion.currency,
        timezone: userRegion.timezone,
        language: userRegion.language
      },
      pricing: {
        amount: pricing.amount,
        currency: userRegion.currency,
        formatted: pricing.formatted
      },
      gateway: paymentResult.gateway,
      availablePaymentMethods: userRegion.paymentMethods,
      message: `Pagamento criado com sucesso via ${paymentResult.gateway}`
    };

    // 🇧🇷 ADICIONAR DADOS PIX SE DISPONÍVEL
    if (paymentResult.data.pix) {
      response.pix = paymentResult.data.pix;
    }

    res.json(response);

  } catch (error) {
    console.error("🚨 Erro no processamento global:", error);
    res.status(500).json({ 
      error: "Erro interno no processamento de pagamento",
      details: error.message 
    });
  }
}

// 🔧 CONFIGURAÇÃO PARA DESABILITAR BODY PARSING (NECESSÁRIO PARA STRIPE)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
