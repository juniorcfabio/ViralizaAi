/**
 * SERVIÇO DE CONFIRMAÇÃO DE PAGAMENTO
 * Garante que acesso só é liberado após pagamento REAL confirmado
 * Integração: Supabase/PostgreSQL + Stripe + PIX
 */

import { supabase } from './autoSupabaseIntegration';

// ==================== TIPOS ====================

export interface SubscriptionRecord {
  id?: string;
  user_id: string;
  plan_type: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  status: 'pending' | 'active' | 'cancelled' | 'expired' | 'at_risk';
  payment_provider: 'stripe' | 'pix';
  payment_id?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  amount: number;
  start_date?: string;
  end_date?: string;
}

export interface PurchaseRecord {
  id?: string;
  user_id: string;
  tool_name: string;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  payment_provider: 'stripe' | 'pix';
  payment_id?: string;
  stripe_session_id?: string;
  amount: number;
}

export interface UserAccessRecord {
  user_id: string;
  tool_name: string;
  access_type: 'subscription' | 'purchase' | 'admin' | 'trial';
  valid_until?: string;
  is_active: boolean;
}

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

function getToolsByPlan(planType: string): string[] {
  const plan = planType.toLowerCase();
  if (plan.includes('mensal')) return ALL_TOOLS.slice(0, 6);
  if (plan.includes('trimestral')) return ALL_TOOLS.slice(0, 9);
  if (plan.includes('semestral')) return ALL_TOOLS.slice(0, 12);
  if (plan.includes('anual')) return ALL_TOOLS;
  return ALL_TOOLS.slice(0, 6);
}

function calculateEndDate(planType: string): Date {
  const now = new Date();
  const plan = planType.toLowerCase();
  if (plan.includes('mensal')) { now.setMonth(now.getMonth() + 1); return now; }
  if (plan.includes('trimestral')) { now.setMonth(now.getMonth() + 3); return now; }
  if (plan.includes('semestral')) { now.setMonth(now.getMonth() + 6); return now; }
  if (plan.includes('anual')) { now.setFullYear(now.getFullYear() + 1); return now; }
  now.setMonth(now.getMonth() + 1);
  return now;
}

function getDailyLimit(planType: string): number {
  const plan = planType.toLowerCase();
  if (plan.includes('mensal')) return 20;
  if (plan.includes('trimestral')) return 50;
  if (plan.includes('semestral')) return 100;
  if (plan.includes('anual')) return 999999;
  return 20;
}

// ==================== IDEMPOTÊNCIA ====================

async function isWebhookProcessed(eventId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

async function markWebhookProcessed(eventId: string, eventType: string, provider: string, payload: any): Promise<void> {
  try {
    await supabase.from('webhook_events').insert({
      event_id: eventId,
      event_type: eventType,
      provider,
      payload,
      status: 'processed'
    });
  } catch (error) {
    console.error('⚠️ Erro ao registrar webhook event:', error);
  }
}

// ==================== CRIAÇÃO DE REGISTROS PENDING ====================

/**
 * Criar subscription pendente (antes do pagamento)
 */
export async function createPendingSubscription(data: {
  userId: string;
  planType: string;
  amount: number;
  paymentProvider: 'stripe' | 'pix';
  paymentId?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}): Promise<{ id: string } | null> {
  try {
    const endDate = calculateEndDate(data.planType);

    const { data: result, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: data.userId,
        plan_type: data.planType,
        status: 'pending',
        payment_provider: data.paymentProvider,
        payment_id: data.paymentId,
        stripe_subscription_id: data.stripeSubscriptionId,
        stripe_customer_id: data.stripeCustomerId,
        amount: data.amount,
        end_date: endDate.toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ Erro ao criar subscription pendente:', error);
      return null;
    }

    console.log('📋 Subscription pendente criada:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Exceção ao criar subscription:', error);
    return null;
  }
}

/**
 * Criar purchase pendente (antes do pagamento)
 */
export async function createPendingPurchase(data: {
  userId: string;
  toolName: string;
  amount: number;
  paymentProvider: 'stripe' | 'pix';
  paymentId?: string;
  stripeSessionId?: string;
}): Promise<{ id: string } | null> {
  try {
    const { data: result, error } = await supabase
      .from('purchases')
      .insert({
        user_id: data.userId,
        tool_name: data.toolName,
        status: 'pending',
        payment_provider: data.paymentProvider,
        payment_id: data.paymentId,
        stripe_session_id: data.stripeSessionId,
        amount: data.amount
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ Erro ao criar purchase pendente:', error);
      return null;
    }

    console.log('📋 Purchase pendente criada:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Exceção ao criar purchase:', error);
    return null;
  }
}

// ==================== CONFIRMAÇÃO DE PAGAMENTO ====================

/**
 * Confirmar pagamento Stripe (chamado pelo webhook)
 * Idempotente: verifica se o evento já foi processado
 */
export async function confirmStripePayment(webhookEvent: {
  eventId: string;
  eventType: string;
  paymentId: string;
  userId: string;
  planType?: string;
  toolName?: string;
  amount: number;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}): Promise<{ success: boolean; message: string }> {
  console.log('💳 Confirmando pagamento Stripe:', webhookEvent.eventId);

  // Idempotência
  if (await isWebhookProcessed(webhookEvent.eventId)) {
    console.log('⚠️ Evento já processado:', webhookEvent.eventId);
    return { success: true, message: 'Evento já processado anteriormente' };
  }

  try {
    let result;

    if (webhookEvent.planType) {
      // É uma assinatura
      result = await activateSubscription(
        webhookEvent.userId,
        webhookEvent.planType,
        webhookEvent.paymentId,
        'stripe',
        webhookEvent.amount,
        webhookEvent.stripeSubscriptionId,
        webhookEvent.stripeCustomerId
      );
    } else if (webhookEvent.toolName) {
      // É uma compra avulsa
      result = await activateToolPurchase(
        webhookEvent.userId,
        webhookEvent.toolName,
        webhookEvent.paymentId,
        'stripe',
        webhookEvent.amount
      );
    } else {
      return { success: false, message: 'Tipo de pagamento não identificado' };
    }

    // Registrar evento como processado
    await markWebhookProcessed(
      webhookEvent.eventId,
      webhookEvent.eventType,
      'stripe',
      webhookEvent
    );

    return result;
  } catch (error) {
    console.error('❌ Erro ao confirmar pagamento Stripe:', error);
    return { success: false, message: `Erro: ${error}` };
  }
}

/**
 * Confirmar pagamento PIX (chamado pelo callback)
 * Idempotente
 */
export async function confirmPixPayment(callbackData: {
  eventId: string;
  paymentId: string;
  userId: string;
  planType?: string;
  toolName?: string;
  amount: number;
  txid?: string;
}): Promise<{ success: boolean; message: string }> {
  console.log('🟢 Confirmando pagamento PIX:', callbackData.eventId);

  // Idempotência
  if (await isWebhookProcessed(callbackData.eventId)) {
    console.log('⚠️ Evento PIX já processado:', callbackData.eventId);
    return { success: true, message: 'Evento já processado anteriormente' };
  }

  try {
    let result;

    if (callbackData.planType) {
      result = await activateSubscription(
        callbackData.userId,
        callbackData.planType,
        callbackData.paymentId,
        'pix',
        callbackData.amount
      );
    } else if (callbackData.toolName) {
      result = await activateToolPurchase(
        callbackData.userId,
        callbackData.toolName,
        callbackData.paymentId,
        'pix',
        callbackData.amount
      );
    } else {
      return { success: false, message: 'Tipo de pagamento PIX não identificado' };
    }

    await markWebhookProcessed(
      callbackData.eventId,
      'pix.payment.confirmed',
      'pix',
      callbackData
    );

    return result;
  } catch (error) {
    console.error('❌ Erro ao confirmar pagamento PIX:', error);
    return { success: false, message: `Erro: ${error}` };
  }
}

// ==================== ATIVAÇÃO ====================

/**
 * Ativar assinatura após confirmação de pagamento
 */
export async function activateSubscription(
  userId: string,
  planType: string,
  paymentId: string,
  provider: 'stripe' | 'pix',
  amount: number,
  stripeSubscriptionId?: string,
  stripeCustomerId?: string
): Promise<{ success: boolean; message: string }> {
  console.log(`🔓 Ativando assinatura: ${userId} → ${planType}`);

  try {
    const endDate = calculateEndDate(planType);
    const tools = getToolsByPlan(planType);

    // 1. Cancelar subscriptions ativas anteriores
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'active');

    // 2. Atualizar subscription pendente ou criar nova
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('payment_id', paymentId)
      .eq('status', 'pending')
      .maybeSingle();

    let subscriptionId: string;

    if (existingSub) {
      // Atualizar existente
      const { data: updated, error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSub.id)
        .select('id')
        .single();

      if (error) throw error;
      subscriptionId = updated.id;
    } else {
      // Criar nova
      const { data: created, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: planType,
          status: 'active',
          payment_provider: provider,
          payment_id: paymentId,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
          amount,
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      subscriptionId = created.id;
    }

    // 3. Desativar acessos antigos por subscription
    await supabase
      .from('user_access')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('access_type', 'subscription');

    // 4. Criar acessos para cada ferramenta do plano
    const accessRecords = tools.map(toolName => ({
      user_id: userId,
      tool_name: toolName,
      access_type: 'subscription' as const,
      source_id: subscriptionId,
      valid_until: endDate.toISOString(),
      is_active: true
    }));

    for (const record of accessRecords) {
      await supabase
        .from('user_access')
        .upsert(record, { onConflict: 'user_id,tool_name' });
    }

    // 5. Configurar créditos do usuário
    const dailyLimit = getDailyLimit(planType);
    await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        daily_limit: dailyLimit,
        daily_usage: 0,
        last_daily_reset: new Date().toISOString()
      }, { onConflict: 'user_id' });

    // 6. Atualizar user_profiles
    await supabase
      .from('user_profiles')
      .update({
        plan: planType,
        plan_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    // 7. Atualizar auth.users metadata
    const { error: metadataError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          plan: planType,
          plan_status: 'active'
        }
      }
    );

    if (metadataError) {
      console.error('❌ Erro ao atualizar metadata:', metadataError);
    }

    // 8. Log de atividade
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'subscription_activated',
      details: {
        plan_type: planType,
        payment_id: paymentId,
        provider,
        amount,
        tools_count: tools.length,
        end_date: endDate.toISOString()
      }
    });

    console.log(`✅ Assinatura ativada: ${userId} → ${planType} (${tools.length} ferramentas até ${endDate.toISOString()})`);
    return { success: true, message: `Plano ${planType} ativado com ${tools.length} ferramentas` };

  } catch (error) {
    console.error('❌ Erro ao ativar assinatura:', error);
    return { success: false, message: `Erro ao ativar: ${error}` };
  }
}

/**
 * Ativar compra avulsa de ferramenta após confirmação de pagamento
 */
export async function activateToolPurchase(
  userId: string,
  toolName: string,
  paymentId: string,
  provider: 'stripe' | 'pix',
  amount: number
): Promise<{ success: boolean; message: string }> {
  console.log(`🔓 Ativando ferramenta: ${userId} → ${toolName}`);

  try {
    // 1. Atualizar purchase pendente ou criar nova
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('payment_id', paymentId)
      .eq('status', 'pending')
      .maybeSingle();

    let purchaseId: string;

    if (existingPurchase) {
      const { data: updated, error } = await supabase
        .from('purchases')
        .update({
          status: 'paid',
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPurchase.id)
        .select('id')
        .single();

      if (error) throw error;
      purchaseId = updated.id;
    } else {
      const { data: created, error } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          tool_name: toolName,
          status: 'paid',
          payment_provider: provider,
          payment_id: paymentId,
          amount,
          confirmed_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      purchaseId = created.id;
    }

    // 2. Criar/atualizar acesso (sem expiração para compra avulsa)
    await supabase
      .from('user_access')
      .upsert({
        user_id: userId,
        tool_name: toolName,
        access_type: 'purchase',
        source_id: purchaseId,
        valid_until: null,
        is_active: true
      }, { onConflict: 'user_id,tool_name' });

    // 3. Atualizar auth.users metadata com ferramenta comprada
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const currentTools = authUser?.user?.user_metadata?.purchased_tools || [];
    
    if (!currentTools.includes(toolName)) {
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...authUser?.user?.user_metadata,
          purchased_tools: [...currentTools, toolName]
        }
      });
    }

    // 4. Log de atividade
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'tool_purchased',
      details: {
        tool_name: toolName,
        payment_id: paymentId,
        provider,
        amount
      }
    });

    console.log(`✅ Ferramenta ativada: ${userId} → ${toolName}`);
    return { success: true, message: `Ferramenta ${toolName} ativada` };

  } catch (error) {
    console.error('❌ Erro ao ativar ferramenta:', error);
    return { success: false, message: `Erro ao ativar: ${error}` };
  }
}

/**
 * Ativar anúncio pago após confirmação de pagamento
 */
export async function activateAdvertising(
  userId: string,
  advertisingData: any,
  paymentId: string,
  provider: 'stripe' | 'pix',
  amount: number
): Promise<{ success: boolean; message: string }> {
  console.log(`📢 Ativando anúncio: ${userId}`);

  try {
    const { planName, planDays, companyName, cnpj, advertiserId } = advertisingData;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(planDays || 30));

    // 1. Criar registro de anúncio
    const { data: created, error } = await supabase
      .from('advertising_purchases')
      .insert({
        user_id: userId,
        advertiser_id: advertiserId,
        plan_name: planName,
        plan_days: parseInt(planDays || 30),
        company_name: companyName,
        cnpj: cnpj,
        status: 'active',
        payment_provider: provider,
        payment_id: paymentId,
        amount: amount || 0,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        confirmed_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw error;

    // 2. Atualizar auth.users metadata com anúncio ativo
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const currentAds = authUser?.user?.user_metadata?.active_ads || [];
    
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...authUser?.user?.user_metadata,
        active_ads: [...currentAds, { id: created?.id, plan: planName, end_date: endDate.toISOString() }],
        has_active_advertising: true
      }
    });

    // 3. Log de atividade
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'advertising_purchased',
      details: {
        plan_name: planName,
        payment_id: paymentId,
        provider,
        amount,
        plan_days: planDays,
        end_date: endDate.toISOString()
      }
    });

    console.log(`✅ Anúncio ativado: ${planName} (${planDays} dias)`);
    return { success: true, message: `Anúncio ${planName} ativado por ${planDays} dias` };

  } catch (error) {
    console.error('❌ Erro ao ativar anúncio:', error);
    return { success: false, message: `Erro ao ativar: ${error}` };
  }
}

// ==================== VERIFICAÇÃO DE ACESSO ====================

/**
 * Verificar se usuário tem acesso a uma ferramenta (consulta Supabase)
 */
export async function checkAccess(userId: string, toolName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_access')
      .select('id, valid_until, is_active')
      .eq('user_id', userId)
      .eq('tool_name', toolName)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) return false;

    // Verificar expiração
    if (data.valid_until && new Date(data.valid_until) < new Date()) {
      // Expirou - desativar
      await supabase
        .from('user_access')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', data.id);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Obter todas as ferramentas com acesso ativo de um usuário
 */
export async function getUserActiveTools(userId: string): Promise<UserAccessRecord[]> {
  try {
    const { data, error } = await supabase
      .from('user_access')
      .select('user_id, tool_name, access_type, valid_until, is_active')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error || !data) return [];

    // Filtrar expirados
    const now = new Date();
    return data.filter(record => {
      if (!record.valid_until) return true;
      return new Date(record.valid_until) > now;
    });
  } catch {
    return [];
  }
}

/**
 * Obter subscription ativa do usuário
 */
export async function getActiveSubscription(userId: string): Promise<SubscriptionRecord | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    // Verificar se expirou
    if (data.end_date && new Date(data.end_date) < new Date()) {
      await supabase
        .from('subscriptions')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', data.id);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

// ==================== CANCELAMENTO ====================

/**
 * Cancelar subscription e revogar acesso
 */
export async function cancelSubscription(
  userId: string,
  subscriptionId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const query = supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (subscriptionId) {
      query.eq('stripe_subscription_id', subscriptionId);
    }

    await query;

    // Desativar acessos por subscription
    await supabase
      .from('user_access')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('access_type', 'subscription');

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'subscription_cancelled',
      details: { subscription_id: subscriptionId }
    });

    console.log(`🚫 Assinatura cancelada: ${userId}`);
    return { success: true, message: 'Assinatura cancelada' };
  } catch (error) {
    console.error('❌ Erro ao cancelar:', error);
    return { success: false, message: `Erro: ${error}` };
  }
}

/**
 * Marcar subscription em risco (falha no pagamento)
 */
export async function markSubscriptionAtRisk(
  userId: string,
  invoiceId: string
): Promise<void> {
  try {
    await supabase
      .from('subscriptions')
      .update({
        status: 'at_risk',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'payment_failed',
      details: { invoice_id: invoiceId }
    });
  } catch (error) {
    console.error('❌ Erro ao marcar em risco:', error);
  }
}

// Export singleton-style
const paymentConfirmationService = {
  createPendingSubscription,
  createPendingPurchase,
  confirmStripePayment,
  confirmPixPayment,
  activateSubscription,
  activateToolPurchase,
  activateAdvertising,
  checkAccess,
  getUserActiveTools,
  getActiveSubscription,
  cancelSubscription,
  markSubscriptionAtRisk
};

export default paymentConfirmationService;
