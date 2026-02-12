import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// ==================== FERRAMENTAS POR PLANO ====================
const ALL_TOOLS = [
  'Gerador de Scripts IA',
  'Criador de Thumbnails',
  'Analisador de Trends',
  'Otimizador de SEO',
  'Gerador de Hashtags',
  'Criador de Logos',
  'Agendamento Multiplataforma',
  'IA de Copywriting',
  'Tradutor Automático',
  'Gerador de QR Code',
  'Editor de Vídeo Pro',
  'Gerador de Ebooks Premium',
  'Gerador de Animações',
  'IA Video Generator 8K',
  'AI Funil Builder'
];

function getToolsByPlan(planType) {
  const plan = (planType || '').toLowerCase();
  if (plan.includes('mensal')) return ALL_TOOLS.slice(0, 6);
  if (plan.includes('trimestral')) return ALL_TOOLS.slice(0, 9);
  if (plan.includes('semestral')) return ALL_TOOLS.slice(0, 12);
  if (plan.includes('anual')) return ALL_TOOLS;
  return ALL_TOOLS.slice(0, 6);
}

function calculateEndDate(planType) {
  const now = new Date();
  const plan = (planType || '').toLowerCase();
  if (plan.includes('mensal')) { now.setMonth(now.getMonth() + 1); return now; }
  if (plan.includes('trimestral')) { now.setMonth(now.getMonth() + 3); return now; }
  if (plan.includes('semestral')) { now.setMonth(now.getMonth() + 6); return now; }
  if (plan.includes('anual')) { now.setFullYear(now.getFullYear() + 1); return now; }
  now.setMonth(now.getMonth() + 1);
  return now;
}

function getDailyLimit(planType) {
  const plan = (planType || '').toLowerCase();
  if (plan.includes('mensal')) return 20;
  if (plan.includes('trimestral')) return 50;
  if (plan.includes('semestral')) return 100;
  if (plan.includes('anual')) return 999999;
  return 20;
}

// ==================== IDEMPOTÊNCIA ====================
async function isEventProcessed(eventId) {
  const { data } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('event_id', eventId)
    .maybeSingle();
  return !!data;
}

async function markEventProcessed(eventId, eventType, payload) {
  await supabase.from('webhook_events').insert({
    event_id: eventId,
    event_type: eventType,
    provider: 'stripe',
    payload,
    status: 'processed'
  });
}

// ==================== ATIVAÇÃO DE ASSINATURA ====================
async function activateSubscription(userId, planType, paymentId, amount, stripeSubId, stripeCustomerId) {
  console.log(`🔓 Ativando assinatura REAL no Supabase: ${userId} → ${planType}`);

  const endDate = calculateEndDate(planType);
  const tools = getToolsByPlan(planType);

  // 1. Cancelar subscriptions ativas anteriores
  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'active');

  // 2. Criar ou atualizar subscription
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('payment_id', paymentId)
    .maybeSingle();

  let subscriptionId;

  if (existingSub) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        plan_type: planType,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        stripe_subscription_id: stripeSubId,
        stripe_customer_id: stripeCustomerId,
        amount: amount || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSub.id);
    subscriptionId = existingSub.id;
  } else {
    const { data: created } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: planType,
        status: 'active',
        payment_provider: 'stripe',
        payment_id: paymentId,
        stripe_subscription_id: stripeSubId,
        stripe_customer_id: stripeCustomerId,
        amount: amount || 0,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString()
      })
      .select('id')
      .single();
    subscriptionId = created?.id;
  }

  // 3. Desativar acessos antigos por subscription
  await supabase
    .from('user_access')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('access_type', 'subscription');

  // 4. Criar acessos para cada ferramenta
  for (const toolName of tools) {
    await supabase
      .from('user_access')
      .upsert({
        user_id: userId,
        tool_name: toolName,
        access_type: 'subscription',
        source_id: subscriptionId,
        valid_until: endDate.toISOString(),
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,tool_name' });
  }

  // 5. Configurar créditos
  await supabase
    .from('user_credits')
    .upsert({
      user_id: userId,
      daily_limit: getDailyLimit(planType),
      daily_usage: 0,
      last_daily_reset: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  // 6. Log
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'subscription_activated_webhook',
    details: { plan_type: planType, payment_id: paymentId, tools_count: tools.length, end_date: endDate.toISOString() }
  });

  console.log(`✅ Assinatura ativada: ${tools.length} ferramentas até ${endDate.toISOString()}`);
}

// ==================== ATIVAÇÃO DE COMPRA AVULSA ====================
async function activateToolPurchase(userId, toolName, paymentId, amount) {
  console.log(`🔓 Ativando ferramenta REAL no Supabase: ${userId} → ${toolName}`);

  const { data: created } = await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      tool_name: toolName,
      status: 'paid',
      payment_provider: 'stripe',
      payment_id: paymentId,
      amount: amount || 0,
      confirmed_at: new Date().toISOString()
    })
    .select('id')
    .single();

  await supabase
    .from('user_access')
    .upsert({
      user_id: userId,
      tool_name: toolName,
      access_type: 'purchase',
      source_id: created?.id,
      valid_until: null,
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,tool_name' });

  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'tool_purchased_webhook',
    details: { tool_name: toolName, payment_id: paymentId, amount }
  });

  console.log(`✅ Ferramenta ativada: ${toolName}`);
}

// ==================== CANCELAMENTO ====================
async function deactivateSubscription(userId, stripeSubId) {
  console.log(`🚫 Desativando assinatura REAL no Supabase: ${userId}`);

  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'active');

  await supabase
    .from('user_access')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('access_type', 'subscription');

  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'subscription_cancelled_webhook',
    details: { stripe_subscription_id: stripeSubId }
  });

  console.log(`✅ Assinatura cancelada e acessos revogados`);
}

// ==================== MARCAR EM RISCO ====================
async function markAtRisk(userId, invoiceId) {
  console.log(`⚠️ Marcando assinatura em risco: ${userId}`);

  await supabase
    .from('subscriptions')
    .update({ status: 'at_risk', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'active');

  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'payment_failed_webhook',
    details: { invoice_id: invoiceId }
  });
}

// ==================== HANDLER PRINCIPAL ====================
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers["stripe-signature"];

  // Ler body raw
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const rawBody = Buffer.concat(chunks);

  let event;
  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(rawBody.toString());
      console.warn('⚠️ STRIPE_WEBHOOK_SECRET não configurado, webhook não verificado');
    }
  } catch (err) {
    console.error("🚨 Assinatura inválida:", err.message);
    return res.status(400).json({ error: "Webhook signature inválida" });
  }

  console.log(`📩 Webhook Stripe recebido: ${event.type} (${event.id})`);

  // Idempotência
  if (await isEventProcessed(event.id)) {
    console.log(`⚠️ Evento já processado: ${event.id}`);
    return res.json({ received: true, status: 'already_processed' });
  }

  try {
    // ==================== CHECKOUT COMPLETADO ====================
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, planType, toolName } = session.metadata || {};
      const amount = (session.amount_total || 0) / 100;

      console.log('💳 Checkout completado:', { userId, planType, toolName, amount });

      if (userId && planType) {
        await activateSubscription(userId, planType, session.payment_intent || session.id, amount, session.subscription, session.customer);
      } else if (userId && toolName) {
        await activateToolPurchase(userId, toolName, session.payment_intent || session.id, amount);
      }
    }

    // ==================== PAGAMENTO PIX/INTENT CONFIRMADO ====================
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { userId, planType, toolName } = paymentIntent.metadata || {};
      const amount = (paymentIntent.amount || 0) / 100;

      console.log('💰 Payment intent succeeded:', { userId, planType, toolName, amount });

      if (userId && planType) {
        await activateSubscription(userId, planType, paymentIntent.id, amount);
      } else if (userId && toolName) {
        await activateToolPurchase(userId, toolName, paymentIntent.id, amount);
      }
    }

    // ==================== FATURA PAGA (RENOVAÇÃO) ====================
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      let userId, planType;

      if (invoice.subscription) {
        try {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          userId = subscription.metadata?.userId;
          planType = subscription.metadata?.planType;
        } catch (e) {
          console.warn('⚠️ Não foi possível buscar subscription:', e.message);
        }
      }

      if (!userId) {
        userId = invoice.metadata?.userId;
        planType = invoice.metadata?.planType;
      }

      if (userId && planType) {
        const amount = (invoice.amount_paid || 0) / 100;
        console.log('🔄 Renovação automática:', { userId, planType, amount });
        await activateSubscription(userId, planType, invoice.payment_intent || invoice.id, amount, invoice.subscription);
      }
    }

    // ==================== FALHA NO PAGAMENTO ====================
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      let userId;

      if (invoice.subscription) {
        try {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          userId = subscription.metadata?.userId;
        } catch (e) {
          console.warn('⚠️ Não foi possível buscar subscription:', e.message);
        }
      }

      if (!userId) userId = invoice.metadata?.userId;

      if (userId) {
        await markAtRisk(userId, invoice.id);
      }
    }

    // ==================== ASSINATURA CANCELADA ====================
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;

      if (userId) {
        await deactivateSubscription(userId, subscription.id);
      }
    }

    // Marcar como processado
    await markEventProcessed(event.id, event.type, {
      userId: event.data?.object?.metadata?.userId,
      planType: event.data?.object?.metadata?.planType,
      amount: event.data?.object?.amount || event.data?.object?.amount_total
    });

    console.log(`✅ Evento ${event.type} processado com sucesso`);
    return res.json({ received: true, status: 'processed' });

  } catch (error) {
    console.error('🚨 Erro ao processar webhook:', error);
    return res.status(500).json({ error: 'Erro interno ao processar webhook' });
  }
}
