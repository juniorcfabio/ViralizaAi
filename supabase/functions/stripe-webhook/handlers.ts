// HANDLERS COMPLETOS PARA WEBHOOK STRIPE - VIRALIZAAI

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Subscription updated:', subscription.id)
  
  try {
    const userId = await getUserIdFromCustomer(subscription.customer as string)
    
    if (!userId) {
      throw new Error('Usuário não encontrado para customer: ' + subscription.customer)
    }

    // Atualizar assinatura
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
      action: 'subscription_updated',
      details: {
        subscription_id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end
      },
      resource_type: 'subscription'
    })

    return { success: true, message: 'Subscription updated successfully' }
  } catch (error) {
    console.error('❌ Erro ao processar subscription updated:', error)
    return { success: false, error: error.message }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('❌ Subscription canceled:', subscription.id)
  
  try {
    const userId = await getUserIdFromCustomer(subscription.customer as string)
    
    if (!userId) {
      throw new Error('Usuário não encontrado para customer: ' + subscription.customer)
    }

    // Cancelar assinatura
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('❌ Erro ao cancelar assinatura:', error)
    }

    // Log da atividade
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'subscription_canceled',
      details: {
        subscription_id: subscription.id,
        canceled_at: new Date().toISOString(),
        reason: 'stripe_webhook'
      },
      resource_type: 'subscription'
    })

    return { success: true, message: 'Subscription canceled successfully' }
  } catch (error) {
    console.error('❌ Erro ao processar subscription deleted:', error)
    return { success: false, error: error.message }
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('💰 Payment succeeded:', invoice.id)
  
  try {
    const userId = await getUserIdFromCustomer(invoice.customer as string)
    
    if (!userId) {
      throw new Error('Usuário não encontrado para customer: ' + invoice.customer)
    }

    // Registrar pagamento
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'payment_succeeded',
      details: {
        invoice_id: invoice.id,
        subscription_id: invoice.subscription,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        period_start: invoice.period_start,
        period_end: invoice.period_end
      },
      resource_type: 'payment'
    })

    // Processar comissões de afiliados se houver
    await processAffiliateCommission(userId, invoice.amount_paid / 100)

    return { success: true, message: 'Payment processed successfully' }
  } catch (error) {
    console.error('❌ Erro ao processar payment succeeded:', error)
    return { success: false, error: error.message }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('❌ Payment failed:', invoice.id)
  
  try {
    const userId = await getUserIdFromCustomer(invoice.customer as string)
    
    if (!userId) {
      throw new Error('Usuário não encontrado para customer: ' + invoice.customer)
    }

    // Registrar falha no pagamento
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'payment_failed',
      details: {
        invoice_id: invoice.id,
        subscription_id: invoice.subscription,
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        failure_reason: 'stripe_payment_failed'
      },
      resource_type: 'payment'
    })

    // Atualizar status da assinatura se necessário
    if (invoice.subscription) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', invoice.subscription)
    }

    return { success: true, message: 'Payment failure processed successfully' }
  } catch (error) {
    console.error('❌ Erro ao processar payment failed:', error)
    return { success: false, error: error.message }
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('💳 Payment intent succeeded:', paymentIntent.id)
  
  try {
    const userId = paymentIntent.metadata?.user_id
    
    if (!userId) {
      console.log('ℹ️ user_id não encontrado nos metadados do payment intent')
      return { success: true, message: 'Payment intent processed (no user_id)' }
    }

    // Registrar pagamento único (não assinatura)
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'payment_intent_succeeded',
      details: {
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        payment_method: paymentIntent.payment_method
      },
      resource_type: 'payment'
    })

    return { success: true, message: 'Payment intent processed successfully' }
  } catch (error) {
    console.error('❌ Erro ao processar payment intent succeeded:', error)
    return { success: false, error: error.message }
  }
}

// ==================== FUNÇÕES UTILITÁRIAS ====================

async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single()
    
    if (error) {
      console.error('❌ Erro ao buscar user_id:', error)
      return null
    }
    
    return data?.user_id || null
  } catch (error) {
    console.error('❌ Erro ao buscar user_id:', error)
    return null
  }
}

async function processAffiliateCommission(userId: string, amount: number) {
  try {
    // Verificar se o usuário foi referenciado
    const { data: referral, error } = await supabase
      .from('referrals')
      .select(`
        affiliate_id, 
        commission_amount,
        affiliates (
          commission_rate,
          user_id
        )
      `)
      .eq('referred_user_id', userId)
      .eq('commission_paid', false)
      .single()

    if (error || !referral) {
      console.log('ℹ️ Nenhuma referência encontrada para usuário:', userId)
      return
    }

    const commissionRate = referral.affiliates?.commission_rate || 10 // 10% padrão
    const commissionAmount = (amount * commissionRate) / 100

    // Marcar comissão como paga
    await supabase
      .from('referrals')
      .update({ 
        commission_paid: true,
        commission_amount: commissionAmount,
        paid_at: new Date().toISOString()
      })
      .eq('referred_user_id', userId)

    // Atualizar earnings do afiliado
    await supabase
      .from('affiliates')
      .update({
        total_earnings: supabase.sql`total_earnings + ${commissionAmount}`,
        total_referrals: supabase.sql`total_referrals + 1`,
        updated_at: new Date().toISOString()
      })
      .eq('id', referral.affiliate_id)

    // Log da comissão
    await supabase.from('activity_logs').insert({
      user_id: referral.affiliates?.user_id,
      action: 'affiliate_commission_paid',
      details: {
        referred_user_id: userId,
        commission_amount: commissionAmount,
        commission_rate: commissionRate,
        original_amount: amount
      },
      resource_type: 'affiliate'
    })

    console.log('💸 Comissão de afiliado processada:', commissionAmount)
  } catch (error) {
    console.error('❌ Erro ao processar comissão de afiliado:', error)
  }
}
