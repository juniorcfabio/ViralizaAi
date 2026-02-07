// EDGE FUNCTION PARA CHECKOUT STRIPE - VIRALIZAAI
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const { planId, userId, billingInterval = 'monthly', referralCode } = await req.json()

    if (!planId || !userId) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Buscar plano
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return new Response('Plan not found', { status: 404 })
    }

    // Buscar usuário
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return new Response('User not found', { status: 404 })
    }

    // Verificar se já tem customer no Stripe
    let customerId: string
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (existingSubscription?.stripe_customer_id) {
      customerId = existingSubscription.stripe_customer_id
    } else {
      // Criar customer no Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          user_id: userId,
          supabase_user: 'true'
        }
      })
      customerId = customer.id
    }

    // Processar código de referência se fornecido
    let affiliateId: string | null = null
    if (referralCode) {
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id, user_id')
        .eq('referral_code', referralCode)
        .eq('is_active', true)
        .single()

      if (affiliate && affiliate.user_id !== userId) {
        affiliateId = affiliate.id
      }
    }

    // Determinar price_id baseado no intervalo
    const priceId = billingInterval === 'yearly' 
      ? plan.stripe_price_id_yearly 
      : plan.stripe_price_id_monthly

    if (!priceId) {
      return new Response('Price ID not configured for this plan', { status: 400 })
    }

    // Criar checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/pricing?canceled=true`,
      metadata: {
        user_id: userId,
        plan_id: planId,
        affiliate_id: affiliateId || '',
        billing_interval: billingInterval
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan_id: planId,
          affiliate_id: affiliateId || ''
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      }
    })

    // Registrar tentativa de checkout
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'checkout_initiated',
      details: {
        plan_id: planId,
        plan_name: plan.name,
        billing_interval: billingInterval,
        session_id: session.id,
        affiliate_id: affiliateId
      }
    })

    // Se há afiliado, criar registro de referência
    if (affiliateId) {
      await supabase.from('referrals').insert({
        affiliate_id: affiliateId,
        referred_user_id: userId,
        commission_amount: (billingInterval === 'yearly' ? plan.price_yearly : plan.price_monthly) * 0.1 // 10% comissão
      })
    }

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
        success: true
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Checkout error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
