// 🔄 API PARA CRIAR ASSINATURA RECORRENTE - MODELO SAAS
import Stripe from "stripe";
import { STRIPE_PRICE_IDS, RENEWAL_PERIODS } from "../lib/planRules.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Método não permitido" });

  try {
    const { userId, userEmail, planType, paymentMethod } = req.body;

    if (!userId || !userEmail || !planType)
      return res.status(400).json({ error: "Dados obrigatórios faltando" });

    console.log(`🔄 Criando assinatura recorrente: ${planType} para ${userId}`);

    // 🔐 VALIDAR PLANO
    const validPlans = ['mensal', 'gold', 'premium'];
    if (!validPlans.includes(planType)) {
      return res.status(400).json({ error: "Plano inválido para assinatura" });
    }

    // 👤 CRIAR OU BUSCAR CUSTOMER NO STRIPE
    let customer;
    try {
      // Buscar customer existente
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1
      });

      if (customers.data.length > 0) {
        customer = customers.data[0];
        console.log("👤 Customer existente encontrado:", customer.id);
      } else {
        // Criar novo customer
        customer = await stripe.customers.create({
          email: userEmail,
          metadata: { userId }
        });
        console.log("👤 Novo customer criado:", customer.id);
      }
    } catch (error) {
      console.error("❌ Erro ao gerenciar customer:", error);
      return res.status(500).json({ error: "Erro ao criar customer" });
    }

    // 💳 OBTER PRICE ID DO STRIPE
    const priceId = STRIPE_PRICE_IDS[planType];
    if (!priceId) {
      return res.status(400).json({ 
        error: "Price ID não configurado para este plano",
        planType: planType
      });
    }

    // 🔄 CRIAR ASSINATURA
    const subscriptionData = {
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { 
        save_default_payment_method: 'on_subscription',
        payment_method_types: paymentMethod === 'pix' ? ['pix'] : ['card']
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: { 
        userId, 
        planType,
        userEmail,
        source: 'viralizaai_subscription'
      }
    };

    // 📅 CONFIGURAR PERÍODO DE RENOVAÇÃO
    const renewalPeriod = RENEWAL_PERIODS[planType];
    if (renewalPeriod) {
      subscriptionData.billing_cycle_anchor_config = {
        day_of_month: 1 // Renovar sempre no dia 1
      };
    }

    console.log("🔄 Dados da assinatura:", {
      customer: customer.id,
      priceId: priceId,
      planType: planType,
      paymentMethod: paymentMethod
    });

    const subscription = await stripe.subscriptions.create(subscriptionData);

    console.log("✅ Assinatura criada:", subscription.id);

    // 🎯 PREPARAR RESPOSTA BASEADA NO MÉTODO DE PAGAMENTO
    let response = {
      subscriptionId: subscription.id,
      customerId: customer.id,
      planType: planType,
      status: subscription.status
    };

    if (paymentMethod === 'pix') {
      // PIX: Retornar dados do PaymentIntent
      const paymentIntent = subscription.latest_invoice.payment_intent;
      const pix = paymentIntent.next_action?.pix_display_qr_code;

      if (pix) {
        response.pix = {
          qrCode: pix.image_url_png,
          pixCode: pix.emv_code,
          paymentIntentId: paymentIntent.id
        };
      }
    } else {
      // CARTÃO: Retornar client_secret para confirmação
      const paymentIntent = subscription.latest_invoice.payment_intent;
      response.clientSecret = paymentIntent.client_secret;
    }

    res.json({
      success: true,
      subscription: response,
      message: "Assinatura criada com sucesso!"
    });

  } catch (err) {
    console.error("🚨 Erro ao criar assinatura:", err);
    res.status(500).json({ 
      error: "Erro ao criar assinatura",
      details: err.message 
    });
  }
}

// 🔄 FUNÇÃO AUXILIAR PARA CALCULAR PRÓXIMA COBRANÇA
function calculateNextBilling(planType) {
  const now = new Date();
  
  switch (planType) {
    case 'mensal':
      now.setMonth(now.getMonth() + 1);
      break;
    case 'gold':
      now.setMonth(now.getMonth() + 3);
      break;
    case 'premium':
      now.setFullYear(now.getFullYear() + 1);
      break;
  }
  
  return now.toISOString();
}
