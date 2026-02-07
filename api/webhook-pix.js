// =======================
// 📡 WEBHOOK STRIPE PIX - POSTGRESQL STACK FINAL
// =======================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verificar assinatura do webhook
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Log do evento recebido
  console.log('📡 Webhook recebido:', {
    type: event.type,
    id: event.id,
    created: new Date(event.created * 1000)
  });

  // Processar eventos do Stripe
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`🔔 Evento não tratado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    
    // Log do erro no banco
    await db.audit.log({
      action: 'webhook_error',
      entity_type: 'stripe_event',
      entity_id: event.id,
      details: {
        error: error.message,
        event_type: event.type,
        stack: error.stack
      }
    });
    
    res.status(500).json({ error: 'Erro interno' });
  }
}

// Processar checkout completado - POSTGRESQL
async function handleCheckoutCompleted(session) {
  console.log('🎉 Checkout completado:', session.id);

  if (session.payment_status === 'paid') {
    const { userId, planName, planType, userEmail, userName } = session.metadata;

    try {
      // Verificar se pagamento já foi processado
      const existingPayment = await db.payments.findBySessionId(session.id);
      if (existingPayment) {
        console.log('⚠️ Pagamento já processado:', session.id);
        return;
      }

      // Calcular data de expiração
      const now = new Date();
      let expiresAt;
      
      switch (planType) {
        case 'mensal':
          expiresAt = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 dias
          break;
        case 'trimestral':
          expiresAt = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 dias
          break;
        case 'semestral':
          expiresAt = new Date(now.getTime() + (180 * 24 * 60 * 60 * 1000)); // 180 dias
          break;
        case 'anual':
          expiresAt = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 365 dias
          break;
        default:
          expiresAt = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 dias padrão
      }

      // Criar assinatura no banco
      const subscription = await db.subscriptions.create({
        user_id: userId,
        plan_name: planName,
        plan_type: planType,
        amount: session.amount_total, // já em centavos
        stripe_session_id: session.id,
        expires_at: expiresAt
      });

      // Registrar pagamento
      await db.payments.create({
        user_id: userId,
        subscription_id: subscription.id,
        stripe_session_id: session.id,
        amount: session.amount_total,
        status: 'paid'
      });

      // Log de auditoria
      await db.audit.log({
        user_id: userId,
        action: 'subscription_activated',
        entity_type: 'subscription',
        entity_id: subscription.id,
        details: {
          plan_type: planType,
          amount: session.amount_total / 100,
          expires_at: expiresAt,
          stripe_session_id: session.id
        }
      });

      // Enviar notificação de sucesso
      await createSuccessNotification(userId, planName, expiresAt);
      
      console.log('✅ Assinatura ativada no PostgreSQL:', {
        subscriptionId: subscription.id,
        userId,
        planType,
        expiresAt
      });

    } catch (error) {
      console.error('❌ Erro ao processar checkout:', error);
      
      // Log do erro
      await db.audit.log({
        user_id: userId,
        action: 'checkout_processing_error',
        entity_type: 'stripe_session',
        entity_id: session.id,
        details: {
          error: error.message,
          session_data: {
            amount: session.amount_total,
            plan_type: planType
          }
        }
      });
      
      throw error;
    }
  }
}

// Processar pagamento bem-sucedido
async function handlePaymentSucceeded(paymentIntent) {
  console.log('💰 Pagamento confirmado:', paymentIntent.id);
  
  // Aqui você pode adicionar lógica adicional se necessário
  // Por exemplo, enviar notificação adicional ou atualizar métricas
}

// Processar falha no pagamento
async function handlePaymentFailed(paymentIntent) {
  console.log('❌ Pagamento falhou:', paymentIntent.id);
  
  // Notificar sobre falha no pagamento
  // Manter conta bloqueada ou em trial
}

// Salvar assinatura (simular banco de dados)
async function saveSubscription(data) {
  try {
    // Em produção, salvar no PostgreSQL/MongoDB
    console.log('💾 Salvando assinatura:', data);
    
    // Simular salvamento no localStorage para demo
    if (typeof window !== 'undefined') {
      const subscriptions = JSON.parse(localStorage.getItem('viralizaai_subscriptions') || '[]');
      subscriptions.push(data);
      localStorage.setItem('viralizaai_subscriptions', JSON.stringify(subscriptions));
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar assinatura:', error);
    throw error;
  }
}

// Ativar plano do usuário
async function activateUserPlan(userId, planType, expiresAt) {
  try {
    console.log('🔓 Ativando plano:', { userId, planType, expiresAt });
    
    // Em produção, atualizar no banco de dados
    // UPDATE users SET plan = planType, plan_expires_at = expiresAt WHERE id = userId
    
    // Para demo, simular no localStorage
    if (typeof window !== 'undefined') {
      const users = JSON.parse(localStorage.getItem('viralizaai_users') || '[]');
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex !== -1) {
        users[userIndex].plan = planType;
        users[userIndex].planExpiresAt = expiresAt;
        users[userIndex].planStatus = 'active';
        localStorage.setItem('viralizaai_users', JSON.stringify(users));
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao ativar plano:', error);
    throw error;
  }
}

// Enviar confirmação de pagamento
async function sendPaymentConfirmation(email, name, planName, amount) {
  try {
    console.log('📧 Enviando confirmação:', { email, name, planName, amount });
    
    // Em produção, integrar com SendGrid, Mailgun, etc.
    // await sendEmail({
    //   to: email,
    //   subject: 'Pagamento Confirmado - ViralizaAI',
    //   template: 'payment-confirmation',
    //   data: { name, planName, amount }
    // });
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    // Não falhar o webhook por causa do email
  }
}

// Configuração para raw body (necessário para webhook)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
