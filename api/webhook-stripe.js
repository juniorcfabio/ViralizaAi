// WEBHOOK STRIPE PARA PROCESSAR EVENTOS DE PAGAMENTO
// Endpoint para receber notificações do Stripe sobre status de pagamentos

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🎯 Webhook recebido do Stripe');
  console.log('📦 Headers:', req.headers);
  console.log('📦 Body type:', typeof req.body);

  let event;

  try {
    // Para desenvolvimento, aceitar sem verificação de assinatura
    if (req.body && typeof req.body === 'object') {
      event = req.body;
    } else {
      event = JSON.parse(req.body);
    }
    
    console.log('✅ Evento processado:', event.type);
  } catch (err) {
    console.error('❌ Erro ao processar evento:', err.message);
    return res.status(400).json({ error: 'Invalid event data' });
  }

  try {
    // Processar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleSubscriptionPayment(event.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object);
        break;
      
      default:
        console.log(`🔔 Evento não tratado: ${event.type}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Processar checkout completado
async function handleCheckoutCompleted(session) {
  console.log('🎉 Checkout completado:', session.id);
  console.log('📋 Session completa:', JSON.stringify(session, null, 2));
  
  const { metadata } = session;
  const userId = metadata?.userId;
  const productType = metadata?.productType;
  
  console.log('👤 UserId:', userId);
  console.log('🛍️ ProductType:', productType);
  console.log('📋 Metadata completo:', metadata);
  
  if (!userId) {
    console.error('❌ UserId não encontrado no metadata');
    return;
  }

  try {
    // Atualizar dados do usuário baseado no tipo de produto
    if (productType === 'subscription') {
      await activateUserSubscription(userId, metadata);
    } else if (productType === 'tool' || productType === 'ai_video_generator') {
      const userData = await activateUserTool(userId, metadata);
      
      // Notificar que a ferramenta foi ativada
      console.log('🚀 FERRAMENTA ATIVADA COM SUCESSO!');
      console.log('🎯 Usuário pode agora acessar o gerador de vídeo');
      
      // Em um sistema real, você enviaria uma notificação para o frontend
      // ou atualizaria o cache/sessão do usuário
    }
    
    // Registrar transação
    await recordTransaction(session);
    
    console.log('✅ Processamento completo para usuário:', userId);
    
  } catch (error) {
    console.error('❌ Erro ao processar checkout:', error);
  }
}

// Processar pagamento bem-sucedido
async function handlePaymentSucceeded(paymentIntent) {
  console.log('💰 Pagamento bem-sucedido:', paymentIntent.id);
  
  // Lógica adicional para pagamentos únicos
  const { metadata } = paymentIntent;
  
  if (metadata?.userId) {
    await updateUserPaymentStatus(metadata.userId, 'paid');
  }
}

// Processar pagamento de assinatura
async function handleSubscriptionPayment(invoice) {
  console.log('🔄 Pagamento de assinatura:', invoice.id);
  
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;
  
  // Renovar assinatura do usuário
  await renewUserSubscription(customerId, subscriptionId);
}

// Processar criação de assinatura
async function handleSubscriptionCreated(subscription) {
  console.log('🆕 Assinatura criada:', subscription.id);
  
  const customerId = subscription.customer;
  const planId = subscription.items.data[0]?.price?.id;
  
  await activateSubscription(customerId, planId, subscription);
}

// Processar atualização de assinatura
async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Assinatura atualizada:', subscription.id);
  
  const customerId = subscription.customer;
  const status = subscription.status;
  
  await updateSubscriptionStatus(customerId, status, subscription);
}

// Processar cancelamento de assinatura
async function handleSubscriptionCanceled(subscription) {
  console.log('❌ Assinatura cancelada:', subscription.id);
  
  const customerId = subscription.customer;
  
  await deactivateSubscription(customerId, subscription);
}

// Funções auxiliares para atualizar dados do usuário
async function activateUserSubscription(userId, metadata) {
  // Implementar lógica para ativar assinatura do usuário
  console.log('🔓 Ativando assinatura para usuário:', userId);
  
  // Aqui você integraria com seu banco de dados
  // Por exemplo: await updateUserInDatabase(userId, { plan: metadata.planId, active: true });
}

async function activateUserTool(userId, metadata) {
  console.log('🛠️ Ativando ferramenta para usuário:', userId);
  console.log('📋 Metadata:', metadata);
  
  try {
    // Simular ativação da ferramenta no localStorage
    // Em produção, isso seria feito no banco de dados
    
    const toolId = metadata?.toolId || 'ai_video_generator';
    
    // Criar dados do usuário atualizado
    const userData = {
      id: userId,
      email: metadata?.userEmail || 'user@example.com',
      addOns: ['ai_video_generator'], // Ativar a ferramenta
      plan: 'free',
      isActive: true,
      purchasedTools: {
        ai_video_generator: {
          purchasedAt: new Date().toISOString(),
          active: true,
          transactionId: metadata?.sessionId
        }
      }
    };
    
    console.log('✅ Ferramenta ativada com sucesso para usuário:', userId);
    console.log('🎉 Dados do usuário:', userData);
    
    // Em um sistema real, você salvaria isso no banco de dados
    // await database.users.update(userId, userData);
    
    return userData;
    
  } catch (error) {
    console.error('❌ Erro ao ativar ferramenta:', error);
    throw error;
  }
}

async function recordTransaction(session) {
  // Registrar transação no banco de dados
  console.log('📝 Registrando transação:', session.id);
  
  const transaction = {
    id: session.id,
    amount: session.amount_total / 100,
    currency: session.currency,
    status: 'completed',
    userId: session.metadata?.userId,
    productType: session.metadata?.productType,
    timestamp: new Date().toISOString()
  };
  
  // Salvar no banco de dados
  // await saveTransaction(transaction);
}

async function updateUserPaymentStatus(userId, status) {
  console.log('💳 Atualizando status de pagamento:', userId, status);
  // Implementar atualização no banco de dados
}

async function renewUserSubscription(customerId, subscriptionId) {
  console.log('🔄 Renovando assinatura:', customerId);
  // Implementar renovação de assinatura
}

async function activateSubscription(customerId, planId, subscription) {
  console.log('🔓 Ativando assinatura:', customerId, planId);
  // Implementar ativação de assinatura
}

async function updateSubscriptionStatus(customerId, status, subscription) {
  console.log('📊 Atualizando status da assinatura:', customerId, status);
  // Implementar atualização de status
}

async function deactivateSubscription(customerId, subscription) {
  console.log('🔒 Desativando assinatura:', customerId);
  // Implementar desativação de assinatura
}
