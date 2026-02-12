import { createClient } from "@supabase/supabase-js";

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
    provider: 'pix',
    payload,
    status: 'processed'
  });
}

// ==================== ATIVAÇÃO DE ASSINATURA ====================
async function activateSubscription(userId, planType, paymentId, amount) {
  console.log(`🟢 PIX: Ativando assinatura no Supabase: ${userId} → ${planType}`);

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
        payment_provider: 'pix',
        payment_id: paymentId,
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
    action: 'subscription_activated_pix',
    details: { plan_type: planType, payment_id: paymentId, tools_count: tools.length, end_date: endDate.toISOString(), amount }
  });

  console.log(`✅ PIX: Assinatura ativada com ${tools.length} ferramentas até ${endDate.toISOString()}`);
}

// ==================== ATIVAÇÃO DE COMPRA AVULSA ====================
async function activateToolPurchase(userId, toolName, paymentId, amount) {
  console.log(`🟢 PIX: Ativando ferramenta no Supabase: ${userId} → ${toolName}`);

  const { data: created } = await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      tool_name: toolName,
      status: 'paid',
      payment_provider: 'pix',
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
    action: 'tool_purchased_pix',
    details: { tool_name: toolName, payment_id: paymentId, amount }
  });

  console.log(`✅ PIX: Ferramenta ${toolName} ativada`);
}

// ==================== HANDLER PRINCIPAL ====================
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    console.log('🟢 PIX Webhook recebido:', JSON.stringify(body).substring(0, 500));

    // Extrair dados do callback PIX
    // Suporte a múltiplos formatos de callback (BTG, Mercado Pago, etc.)
    const pixData = body.pix?.[0] || body.data || body;
    
    const txid = pixData.txid || pixData.transaction_id || body.txid || body.id;
    const endToEndId = pixData.endToEndId || pixData.e2e_id || '';
    const valor = parseFloat(pixData.valor || pixData.amount || pixData.value || 0);
    
    // Metadata do pagamento (enviado na criação do PIX)
    const metadata = pixData.metadata || body.metadata || {};
    const userId = metadata.userId || metadata.user_id || body.userId || body.user_id;
    const planType = metadata.planType || metadata.plan_type || body.planType || body.plan_type;
    const toolName = metadata.toolName || metadata.tool_name || body.toolName || body.tool_name;

    // Gerar eventId único para idempotência
    const eventId = `pix_${txid || endToEndId || Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    console.log('🟢 PIX dados extraídos:', { txid, endToEndId, valor, userId, planType, toolName, eventId });

    if (!userId) {
      // Tentar buscar pelo txid nas subscriptions/purchases pendentes
      console.log('🔍 Buscando usuário pelo txid:', txid);
      
      const { data: pendingSub } = await supabase
        .from('subscriptions')
        .select('user_id, plan_type')
        .eq('payment_id', txid)
        .eq('status', 'pending')
        .maybeSingle();

      if (pendingSub) {
        console.log('✅ Subscription pendente encontrada:', pendingSub);
        
        if (await isEventProcessed(eventId)) {
          return res.json({ received: true, status: 'already_processed' });
        }

        await activateSubscription(pendingSub.user_id, pendingSub.plan_type, txid, valor);
        await markEventProcessed(eventId, 'pix.subscription.confirmed', { txid, userId: pendingSub.user_id, planType: pendingSub.plan_type, valor });
        
        return res.json({ received: true, status: 'subscription_activated' });
      }

      const { data: pendingPurchase } = await supabase
        .from('purchases')
        .select('user_id, tool_name')
        .eq('payment_id', txid)
        .eq('status', 'pending')
        .maybeSingle();

      if (pendingPurchase) {
        console.log('✅ Purchase pendente encontrada:', pendingPurchase);
        
        if (await isEventProcessed(eventId)) {
          return res.json({ received: true, status: 'already_processed' });
        }

        await activateToolPurchase(pendingPurchase.user_id, pendingPurchase.tool_name, txid, valor);
        await markEventProcessed(eventId, 'pix.purchase.confirmed', { txid, userId: pendingPurchase.user_id, toolName: pendingPurchase.tool_name, valor });
        
        return res.json({ received: true, status: 'purchase_activated' });
      }

      console.warn('⚠️ PIX callback sem userId e sem pendência encontrada');
      
      // Salvar webhook para processamento manual
      await supabase.from('incoming_webhooks').insert({
        provider: 'pix',
        event_type: 'pix.unknown',
        payload: body,
        status: 'unprocessed'
      });

      return res.json({ received: true, status: 'stored_for_manual_review' });
    }

    // Idempotência
    if (await isEventProcessed(eventId)) {
      console.log(`⚠️ PIX evento já processado: ${eventId}`);
      return res.json({ received: true, status: 'already_processed' });
    }

    // Processar pagamento
    if (planType) {
      await activateSubscription(userId, planType, txid || eventId, valor);
      await markEventProcessed(eventId, 'pix.subscription.confirmed', { txid, userId, planType, valor });
      return res.json({ received: true, status: 'subscription_activated' });
    }

    if (toolName) {
      await activateToolPurchase(userId, toolName, txid || eventId, valor);
      await markEventProcessed(eventId, 'pix.purchase.confirmed', { txid, userId, toolName, valor });
      return res.json({ received: true, status: 'purchase_activated' });
    }

    // Pagamento genérico - salvar para processamento
    await supabase.from('incoming_webhooks').insert({
      provider: 'pix',
      event_type: 'pix.generic',
      payload: body,
      status: 'needs_classification'
    });

    await markEventProcessed(eventId, 'pix.generic', { txid, userId, valor });
    return res.json({ received: true, status: 'stored' });

  } catch (error) {
    console.error('🚨 Erro no PIX webhook:', error);
    return res.status(500).json({ error: 'Erro interno ao processar PIX webhook' });
  }
}
