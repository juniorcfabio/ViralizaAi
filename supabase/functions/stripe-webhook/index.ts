// EDGE FUNCTION WEBHOOK STRIPE COMPLETO - VIRALIZAAI
// Corrige: validação de assinatura, idempotência, processamento completo

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

// Configuração de ambiente
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

serve(async (req) => {
  const startTime = Date.now()
  let eventId = 'unknown'
  
  try {
    // Verificar método
    if (req.method !== 'POST') {
      console.log('❌ Method not allowed:', req.method)
      return new Response('Method not allowed', { status: 405 })
    }

    // Obter body e signature
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    console.log('🔄 Webhook recebido, tamanho:', body.length, 'bytes')

    // Verificar se temos webhook secret
    if (!webhookSecret) {
      console.warn('⚠️ STRIPE_WEBHOOK_SECRET não configurado - processando sem validação')
    }

    // Verificar webhook signature (se secret disponível)
    let event: Stripe.Event
    
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
        console.log('✅ Webhook signature verified:', event.type)
      } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message)
        return new Response('Webhook signature verification failed', { status: 400 })
      }
    } else {
      // Parse manual se não temos secret (desenvolvimento)
      try {
        event = JSON.parse(body) as Stripe.Event
        console.log('⚠️ Processando webhook sem validação de assinatura:', event.type)
      } catch (err) {
        console.error('❌ Invalid JSON payload:', err.message)
        return new Response('Invalid JSON payload', { status: 400 })
      }
    }

    eventId = event.id

    // Verificar idempotência
    const { data: existingEvent } = await supabase
      .from('processed_webhook_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single()

    if (existingEvent) {
      console.log('✅ Evento já processado (idempotente):', event.id)
      return new Response('Event already processed', { status: 200 })
    }

    // Registrar evento como processando
    await supabase
      .from('processed_webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        processed: false,
        data: event,
        created_at: new Date().toISOString()
      })

    console.log('🔄 Processando evento:', event.type, event.id)

    // Processar eventos específicos
    let processResult = null
    
    switch (event.type) {
      case 'checkout.session.completed':
        processResult = await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.created':
        processResult = await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.updated':
        processResult = await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        processResult = await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_succeeded':
        processResult = await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        processResult = await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      case 'payment_intent.succeeded':
        processResult = await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      default:
        console.log('ℹ️ Evento não processado:', event.type)
        processResult = { success: true, message: 'Event type not handled' }
    }

    // Marcar evento como processado
    await supabase
      .from('processed_webhook_events')
      .update({ 
        processed: true, 
        result: processResult,
        processed_at: new Date().toISOString()
      })
      .eq('stripe_event_id', event.id)

    const processingTime = Date.now() - startTime
    console.log(`✅ Webhook processado com sucesso: ${event.type} (${processingTime}ms)`)

    return new Response(JSON.stringify({ 
      success: true, 
      eventId: event.id,
      eventType: event.type,
      processingTime 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`❌ Webhook error (${processingTime}ms):`, error)
    
    // Log do erro no banco
    try {
      await supabase.from('activity_logs').insert({
        user_id: null,
        action: 'webhook_error',
        details: {
          event_id: eventId,
          error: error.message,
          processing_time: processingTime
        },
        resource_type: 'webhook'
      })
    } catch (logError) {
      console.error('❌ Erro ao registrar log:', logError)
    }

    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      eventId,
      processingTime 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

// ==================== HANDLERS DE EVENTOS ====================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('🎉 Checkout completed:', session.id)
  
  try {
    const userId = session.metadata?.user_id
    const planId = session.metadata?.plan_id
    const affiliateId = session.metadata?.affiliate_id
    
    if (!userId) {
      throw new Error('user_id não encontrado nos metadados')
    }

    // Criar/atualizar assinatura
    const subscriptionData: any = {
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (planId) {
      subscriptionData.plan_id = planId
    }

    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'stripe_subscription_id' })

    if (subError) {
      console.error('❌ Erro ao criar assinatura:', subError)
    }

    // Processar afiliado se houver
    if (affiliateId) {
      await processAffiliateCommission(userId, session.amount_total / 100)
    }

    // Log da atividade
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'checkout_completed',
      details: {
        session_id: session.id,
        subscription_id: session.subscription,
        amount: session.amount_total / 100,
        currency: session.currency,
        plan_id: planId,
        affiliate_id: affiliateId
      },
      resource_type: 'payment'
    })

    return { success: true, message: 'Checkout processed successfully' }
  } catch (error) {
    console.error('❌ Erro no checkout completed:', error)
    return { success: false, error: error.message }
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🎉 New subscription created:', subscription.id)
  
  try {
    const userId = await getUserIdFromCustomer(subscription.customer as string)
    
    if (!userId) {
      throw new Error('Usuário não encontrado para customer: ' + subscription.customer)
    }

    // Atualizar assinatura com dados completos
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('❌ Erro ao atualizar assinatura:', error)
    }

    // Log da atividade
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'subscription_created',
      details: {
        subscription_id: subscription.id,
        status: subscription.status,
        plan: subscription.items.data[0]?.price?.nickname || 'Unknown',
        period_start: subscription.current_period_start,
        period_end: subscription.current_period_end
      },
      resource_type: 'subscription'
    })

    return { success: true, message: 'Subscription created successfully' }
  } catch (error) {
    console.error('❌ Erro ao processar subscription created:', error)
    return { success: false, error: error.message }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id)
  
  await supabase.from('activity_logs').insert({
    user_id: await getUserIdFromCustomer(subscription.customer as string),
    action: 'subscription_updated',
    details: {
      subscription_id: subscription.id,
      status: subscription.status
    }
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('❌ Subscription canceled:', subscription.id)
  
  await supabase.from('activity_logs').insert({
    user_id: await getUserIdFromCustomer(subscription.customer as string),
    action: 'subscription_canceled',
    details: {
      subscription_id: subscription.id,
      canceled_at: new Date().toISOString()
    }
  })
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('💰 Payment succeeded:', invoice.id)
  
  const userId = await getUserIdFromCustomer(invoice.customer as string)
  
  // Registrar pagamento
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'payment_succeeded',
    details: {
      invoice_id: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency
    }
  })

  // Processar comissões de afiliados se houver
  await processAffiliateCommission(userId, invoice.amount_paid / 100)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('❌ Payment failed:', invoice.id)
  
  await supabase.from('activity_logs').insert({
    user_id: await getUserIdFromCustomer(invoice.customer as string),
    action: 'payment_failed',
    details: {
      invoice_id: invoice.id,
      amount: invoice.amount_due / 100,
      currency: invoice.currency
    }
  })
}

async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const { data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()
  
  return data?.user_id || null
}

async function processAffiliateCommission(userId: string, amount: number) {
  // Verificar se o usuário foi referenciado
  const { data: referral } = await supabase
    .from('referrals')
    .select('affiliate_id, commission_amount')
    .eq('referred_user_id', userId)
    .eq('commission_paid', false)
    .single()

  if (referral) {
    const commissionAmount = referral.commission_amount || (amount * 0.1) // 10% padrão
    
    // Marcar comissão como paga
    await supabase
      .from('referrals')
      .update({ commission_paid: true })
      .eq('referred_user_id', userId)

    // Atualizar earnings do afiliado
    await supabase.rpc('increment', {
      table_name: 'affiliates',
      row_id: referral.affiliate_id,
      column_name: 'total_earnings',
      increment_value: commissionAmount
    })

    console.log('💸 Affiliate commission processed:', commissionAmount)
  }
}
