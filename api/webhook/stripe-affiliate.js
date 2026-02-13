// 💳 WEBHOOK STRIPE INTEGRADO COM SISTEMA REAL DE AFILIADOS (SUPABASE)
import Stripe from 'stripe';
import { buffer } from 'micro';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ymmswnmietxoupeazmok.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.error('Erro na verificação do webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      default:
        console.log(`Evento não tratado: ${event.type}`);
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// ──── REGISTRAR COMISSÃO REAL NO SUPABASE ────
async function registerAffiliateCommission(buyerUserId, saleId, saleAmountCents, buyerEmail, productName) {
  try {
    const saleAmount = saleAmountCents / 100; // converter centavos para reais

    // Buscar se o comprador foi indicado por alguém
    const { data: referral } = await supabase
      .from('referrals')
      .select('affiliate_id, referral_code')
      .eq('referred_user_id', buyerUserId)
      .eq('type', 'signup')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!referral?.affiliate_id) {
      console.log('Comprador não foi indicado por afiliado');
      return null;
    }

    // Buscar configurações de comissão
    const { data: settingsRow } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'affiliate_settings')
      .single();

    const globalRate = settingsRow?.value?.commission_rate || 20;
    const maxCommission = settingsRow?.value?.max_commission_per_sale || 0;
    const paymentDelay = settingsRow?.value?.payment_delay_days || 7;

    // Buscar taxa individual do afiliado
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('commission_rate, status')
      .eq('id', referral.affiliate_id)
      .single();

    if (!affiliate || affiliate.status !== 'active') {
      console.log('Afiliado inativo ou não encontrado');
      return null;
    }

    const rate = affiliate.commission_rate || globalRate;
    let commissionValue = (saleAmount * rate) / 100;
    if (maxCommission > 0) commissionValue = Math.min(commissionValue, maxCommission);

    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    const paymentEligible = new Date(endOfWeek);
    paymentEligible.setDate(paymentEligible.getDate() + paymentDelay);

    const start = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);

    // Inserir comissão no Supabase
    const { data: commission, error } = await supabase
      .from('affiliate_commissions')
      .insert({
        affiliate_id: referral.affiliate_id,
        sale_id: saleId,
        buyer_user_id: buyerUserId,
        buyer_email: buyerEmail || '',
        product_name: productName || '',
        sale_amount: saleAmount,
        commission_rate: rate,
        commission_value: commissionValue,
        status: 'pending',
        sale_date: now.toISOString(),
        week_number: weekNumber,
        year: now.getFullYear(),
        payment_eligible_date: paymentEligible.toISOString(),
        created_at: now.toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Atualizar saldos do afiliado
    const { data: currentAff } = await supabase
      .from('affiliates')
      .select('total_earnings, pending_balance')
      .eq('id', referral.affiliate_id)
      .single();

    if (currentAff) {
      await supabase.from('affiliates').update({
        total_earnings: (currentAff.total_earnings || 0) + commissionValue,
        pending_balance: (currentAff.pending_balance || 0) + commissionValue,
        updated_at: now.toISOString()
      }).eq('id', referral.affiliate_id);
    }

    // Registrar pagamento na tabela de purchases
    await supabase.from('purchases').insert({
      user_id: buyerUserId,
      stripe_session_id: saleId,
      amount: saleAmountCents,
      status: 'completed',
      affiliate_commission_id: commission?.id,
      created_at: now.toISOString()
    }).then(() => {});

    console.log(`Comissão registrada: R$${commissionValue.toFixed(2)} para afiliado ${referral.affiliate_id}`);
    return commission;
  } catch (error) {
    console.error('Erro ao registrar comissão:', error);
    return null;
  }
}

// 💳 PROCESSAR CHECKOUT COMPLETADO
async function handleCheckoutCompleted(session) {
  console.log('Processando checkout completado:', session.id);
  try {
    const userId = session.metadata?.userId;
    if (!userId) { console.log('UserId não encontrado no metadata'); return; }

    const commission = await registerAffiliateCommission(
      userId,
      session.id,
      session.amount_total,
      session.customer_details?.email,
      session.metadata?.planType || 'Assinatura'
    );

    if (commission) {
      console.log(`Comissão de checkout processada: R$${commission.commission_value.toFixed(2)}`);
    }
  } catch (error) {
    console.error('Erro ao processar checkout:', error);
    throw error;
  }
}

// 💰 PROCESSAR PAGAMENTO BEM-SUCEDIDO
async function handlePaymentSucceeded(paymentIntent) {
  console.log('Processando pagamento:', paymentIntent.id);
  try {
    const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntent.id, limit: 1 });
    if (sessions.data.length > 0) {
      await handleCheckoutCompleted(sessions.data[0]);
    }
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    throw error;
  }
}

// 🧾 PROCESSAR PAGAMENTO DE FATURA (ASSINATURAS)
async function handleInvoicePaymentSucceeded(invoice) {
  console.log('Processando pagamento de fatura:', invoice.id);
  try {
    let userId = invoice.metadata?.userId;
    if (!userId) {
      const customer = await stripe.customers.retrieve(invoice.customer);
      userId = customer.metadata?.userId;
    }
    if (!userId) { console.log('UserId não encontrado na fatura'); return; }

    // Apenas primeira fatura (nova assinatura)
    if (invoice.billing_reason === 'subscription_create') {
      const commission = await registerAffiliateCommission(
        userId,
        invoice.id,
        invoice.amount_paid,
        invoice.customer_email,
        'Assinatura'
      );
      if (commission) {
        console.log(`Comissão de assinatura processada: R$${commission.commission_value.toFixed(2)}`);
      }
    }
  } catch (error) {
    console.error('Erro ao processar fatura:', error);
    throw error;
  }
}
