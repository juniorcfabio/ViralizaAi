// 💳 WEBHOOK STRIPE INTEGRADO COM SISTEMA DE AFILIADOS
import Stripe from 'stripe';
import { buffer } from 'micro';
import { affiliateSystem } from '../../lib/affiliateSystem.js';
import { processAffiliateCommission } from '../../middleware/affiliate-tracking.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
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
    console.error('🚨 Erro na verificação do webhook:', err.message);
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
        console.log(`🔔 Evento não tratado: ${event.type}`);
    }

    res.json({ received: true });
    
  } catch (error) {
    console.error('🚨 Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// 💳 PROCESSAR CHECKOUT COMPLETADO
async function handleCheckoutCompleted(session) {
  console.log('💳 Processando checkout completado:', session.id);

  try {
    // 📝 EXTRAIR DADOS DO PAGAMENTO
    const paymentData = {
      id: session.id,
      userId: session.metadata?.userId,
      amount: session.amount_total, // em centavos
      currency: session.currency,
      paymentId: session.payment_intent,
      customerEmail: session.customer_details?.email,
      planType: session.metadata?.planType,
      metadata: session.metadata
    };

    if (!paymentData.userId) {
      console.log('⚠️ UserId não encontrado no metadata do checkout');
      return;
    }

    // 🎯 PROCESSAR COMISSÃO DE AFILIADO
    const commissionResult = await processAffiliateCommission(paymentData);
    
    if (commissionResult.success) {
      console.log(`✅ Comissão processada: R$${commissionResult.commissionValue.toFixed(2)} para afiliado ${commissionResult.affiliateCode}`);
    } else {
      console.log(`ℹ️ Nenhuma comissão processada: ${commissionResult.message}`);
    }

    // 🎯 EM PRODUÇÃO: ATUALIZAR BANCO DE DADOS
    // await db.payments.create({
    //   data: {
    //     stripe_session_id: session.id,
    //     user_id: paymentData.userId,
    //     amount: paymentData.amount,
    //     status: 'completed',
    //     affiliate_commission_processed: commissionResult.success
    //   }
    // });

  } catch (error) {
    console.error('🚨 Erro ao processar checkout:', error);
    throw error;
  }
}

// 💰 PROCESSAR PAGAMENTO BEM-SUCEDIDO
async function handlePaymentSucceeded(paymentIntent) {
  console.log('💰 Processando pagamento bem-sucedido:', paymentIntent.id);

  try {
    // 🔍 BUSCAR SESSÃO RELACIONADA
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntent.id,
      limit: 1
    });

    if (sessions.data.length > 0) {
      const session = sessions.data[0];
      
      // 📝 PROCESSAR COMO CHECKOUT COMPLETADO
      await handleCheckoutCompleted(session);
    } else {
      console.log('⚠️ Sessão não encontrada para payment_intent:', paymentIntent.id);
    }

  } catch (error) {
    console.error('🚨 Erro ao processar pagamento:', error);
    throw error;
  }
}

// 🧾 PROCESSAR PAGAMENTO DE FATURA (ASSINATURAS)
async function handleInvoicePaymentSucceeded(invoice) {
  console.log('🧾 Processando pagamento de fatura:', invoice.id);

  try {
    // 📝 EXTRAIR DADOS DA FATURA
    const paymentData = {
      id: invoice.id,
      userId: invoice.metadata?.userId,
      amount: invoice.amount_paid, // em centavos
      currency: invoice.currency,
      paymentId: invoice.payment_intent,
      customerEmail: invoice.customer_email,
      subscriptionId: invoice.subscription,
      metadata: invoice.metadata
    };

    if (!paymentData.userId) {
      // 🔍 TENTAR BUSCAR USUÁRIO PELO CUSTOMER
      const customer = await stripe.customers.retrieve(invoice.customer);
      paymentData.userId = customer.metadata?.userId;
    }

    if (!paymentData.userId) {
      console.log('⚠️ UserId não encontrado na fatura');
      return;
    }

    // 🎯 PROCESSAR COMISSÃO DE AFILIADO (APENAS PARA PRIMEIRA FATURA)
    if (invoice.billing_reason === 'subscription_create') {
      const commissionResult = await processAffiliateCommission(paymentData);
      
      if (commissionResult.success) {
        console.log(`✅ Comissão de assinatura processada: R$${commissionResult.commissionValue.toFixed(2)}`);
      }
    } else {
      console.log('ℹ️ Renovação de assinatura - comissão já processada anteriormente');
    }

  } catch (error) {
    console.error('🚨 Erro ao processar fatura:', error);
    throw error;
  }
}

// 📊 FUNÇÃO AUXILIAR PARA LOGS DETALHADOS
function logWebhookEvent(event) {
  console.log('📊 Webhook Event Details:', {
    id: event.id,
    type: event.type,
    created: new Date(event.created * 1000).toISOString(),
    livemode: event.livemode
  });
}
