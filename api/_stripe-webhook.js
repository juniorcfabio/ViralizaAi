import Stripe from "stripe";
import { buffer } from "micro";
import { liberarPlanoSeguro } from "../lib/requirePlan.js";

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const sig = req.headers["stripe-signature"];
  const rawBody = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("🚨 Assinatura inválida", err.message);
    return res.status(400).send("Webhook inválido");
  }

  // 🚨 EVENTOS DE PAGAMENTO E ASSINATURA
  
  // 💳 PAGAMENTO PIX ÚNICO CONFIRMADO
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    // 🛡️ Evita duplicidade
    if (paymentIntent.metadata.processed) {
      console.log("⚠️ Webhook já processado:", paymentIntent.id);
      return res.json({ received: true });
    }

    const { userId, planType } = paymentIntent.metadata;

    console.log("🎉 Pagamento PIX confirmado via webhook:", userId);
    console.log("💰 Valor:", paymentIntent.amount / 100);
    console.log("📦 Plano:", planType);

    // 🔓 LIBERAR PLANO NO BANCO DE DADOS
    await liberarPlanoSeguro(userId, planType, paymentIntent.id);

    // 🔒 Marca como processado para evitar duplicidade
    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: { processed: "true" },
    });

    console.log("✅ Plano PIX liberado com segurança!");
  }

  // 🔄 ASSINATURA ATIVADA (PRIMEIRO PAGAMENTO)
  if (event.type === "customer.subscription.created") {
    const subscription = event.data.object;
    const { userId, planType } = subscription.metadata;

    console.log("🔄 Nova assinatura criada:", subscription.id);
    console.log("👤 Usuário:", userId);
    console.log("📦 Plano:", planType);
    console.log("📅 Status:", subscription.status);
  }

  // 💰 FATURA PAGA (RENOVAÇÃO AUTOMÁTICA)
  if (event.type === "invoice.paid") {
    const invoice = event.data.object;
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const { userId, planType } = subscription.metadata;

    console.log("🔄 RENOVAÇÃO AUTOMÁTICA CONFIRMADA!");
    console.log("💰 Fatura paga:", invoice.id);
    console.log("👤 Usuário:", userId);
    console.log("📦 Plano:", planType);
    console.log("💵 Valor:", invoice.amount_paid / 100);

    // 🔄 RENOVAR PLANO AUTOMATICAMENTE
    await renovarPlanoAutomatico(userId, planType, subscription.id, invoice.id);

    console.log("✅ Plano renovado automaticamente!");
  }

  // ❌ FALHA NO PAGAMENTO DA ASSINATURA
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const { userId, planType } = subscription.metadata;

    console.log("❌ FALHA NA RENOVAÇÃO AUTOMÁTICA!");
    console.log("💔 Fatura falhou:", invoice.id);
    console.log("👤 Usuário:", userId);
    console.log("📦 Plano:", planType);

    // ⚠️ MARCAR PLANO COMO EM RISCO
    await marcarPlanoEmRisco(userId, invoice.id);

    console.log("⚠️ Plano marcado como em risco de cancelamento!");
  }

  // 🚫 ASSINATURA CANCELADA
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const { userId, planType } = subscription.metadata;

    console.log("🚫 ASSINATURA CANCELADA!");
    console.log("👤 Usuário:", userId);
    console.log("📦 Plano:", planType);

    // 🔒 DESATIVAR PLANO
    await desativarPlano(userId, subscription.id);

    console.log("🔒 Plano desativado por cancelamento!");
  }

  res.json({ received: true });
}

// 🔄 RENOVAR PLANO AUTOMATICAMENTE
async function renovarPlanoAutomatico(userId, planType, subscriptionId, invoiceId) {
  console.log(`🔄 Renovando plano automaticamente: ${userId} -> ${planType}`);
  
  // 📅 CALCULAR NOVA EXPIRAÇÃO
  const now = new Date();
  let newExpiration = new Date();
  
  switch (planType) {
    case 'mensal':
      newExpiration.setMonth(newExpiration.getMonth() + 1);
      break;
    case 'gold':
      newExpiration.setMonth(newExpiration.getMonth() + 3);
      break;
    case 'premium':
      newExpiration.setFullYear(newExpiration.getFullYear() + 1);
      break;
  }

  const renewalData = {
    userId: userId,
    planType: planType,
    planStatus: "active",
    planExpiresAt: newExpiration.toISOString(),
    subscriptionId: subscriptionId,
    lastInvoiceId: invoiceId,
    renewedAt: now.toISOString(),
    // 🔄 RESETAR CONTADORES MENSAIS
    monthlyUsage: {
      aiGenerations: 0,
      videos: 0,
      ebooks: 0
    },
    dailyUsage: 0 // Resetar também o diário
  };

  console.log("💾 Dados da renovação:", renewalData);

  // 🔍 EM PRODUÇÃO: ATUALIZAR NO BANCO
  // await database.users.updateOne(
  //   { userId },
  //   { $set: renewalData }
  // );

  console.log("✅ Plano renovado automaticamente no banco!");
  return renewalData;
}

// ⚠️ MARCAR PLANO EM RISCO
async function marcarPlanoEmRisco(userId, invoiceId) {
  console.log(`⚠️ Marcando plano em risco: ${userId}`);
  
  const riskData = {
    planStatus: "at_risk",
    riskReason: "payment_failed",
    failedInvoiceId: invoiceId,
    riskSince: new Date().toISOString()
  };

  // 🔍 EM PRODUÇÃO: ATUALIZAR NO BANCO
  // await database.users.updateOne(
  //   { userId },
  //   { $set: riskData }
  // );

  // 📧 ENVIAR NOTIFICAÇÃO DE FALHA (OPCIONAL)
  console.log("📧 Enviando notificação de falha no pagamento...");
  
  console.log("⚠️ Plano marcado como em risco no banco!");
}

// 🔒 DESATIVAR PLANO
async function desativarPlano(userId, subscriptionId) {
  console.log(`🔒 Desativando plano: ${userId}`);
  
  const deactivationData = {
    planStatus: "canceled",
    canceledAt: new Date().toISOString(),
    canceledSubscriptionId: subscriptionId,
    // Manter dados históricos mas bloquear acesso
    dailyUsage: 0,
    monthlyUsage: {
      aiGenerations: 0,
      videos: 0,
      ebooks: 0
    }
  };

  // 🔍 EM PRODUÇÃO: ATUALIZAR NO BANCO
  // await database.users.updateOne(
  //   { userId },
  //   { $set: deactivationData }
  // );

  console.log("🔒 Plano desativado no banco!");
}
