// 💳 API ADMIN - LISTAR PAGAMENTOS E TRANSAÇÕES
import Stripe from "stripe";
import { requireAdmin, logAdminAction } from "../../lib/requireAdmin.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export default async function handler(req, res) {
  // 🔒 PROTEÇÃO ADMIN
  await new Promise((resolve, reject) => {
    requireAdmin(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  try {
    const { limit = 50, status, userId } = req.query;

    console.log("💳 Buscando pagamentos...", { limit, status, userId });

    // 📊 BUSCAR PAGAMENTOS NO STRIPE
    const stripePayments = await getStripePayments(limit, status);
    
    // 📋 BUSCAR DADOS LOCAIS DOS PAGAMENTOS
    const localPayments = await getLocalPayments(userId);
    
    // 🔄 COMBINAR DADOS
    const combinedPayments = combinePaymentData(stripePayments, localPayments);

    logAdminAction("LIST_PAYMENTS", { 
      count: combinedPayments.length,
      filters: { limit, status, userId }
    });

    res.json({
      success: true,
      payments: combinedPayments,
      total: combinedPayments.length,
      summary: calculatePaymentSummary(combinedPayments),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("🚨 Erro na API admin/payments:", error);
    res.status(500).json({ 
      error: "Erro ao buscar pagamentos",
      details: error.message 
    });
  }
}

// 💳 BUSCAR PAGAMENTOS NO STRIPE
async function getStripePayments(limit, status) {
  try {
    console.log("🔍 Buscando no Stripe...");

    const params = { 
      limit: parseInt(limit),
      expand: ['data.charges']
    };

    if (status) {
      params.status = status;
    }

    const paymentIntents = await stripe.paymentIntents.list(params);
    
    console.log(`✅ ${paymentIntents.data.length} pagamentos encontrados no Stripe`);
    
    return paymentIntents.data.map(payment => ({
      id: payment.id,
      amount: payment.amount / 100, // Converter centavos para reais
      currency: payment.currency.toUpperCase(),
      status: payment.status,
      created: new Date(payment.created * 1000).toISOString(),
      description: payment.description,
      metadata: payment.metadata,
      paymentMethod: payment.payment_method_types[0],
      clientSecret: payment.client_secret,
      charges: payment.charges?.data || []
    }));

  } catch (error) {
    console.error("❌ Erro ao buscar no Stripe:", error);
    return [];
  }
}

// 📋 BUSCAR DADOS LOCAIS DOS PAGAMENTOS
async function getLocalPayments(userId) {
  console.log("🔍 Buscando dados locais...");
  
  // 🎯 SIMULAÇÃO - SUBSTITUIR POR CONSULTA REAL
  const mockLocalData = [
    {
      paymentId: "pi_test_123",
      userId: "USER123",
      userEmail: "user123@email.com",
      planType: "gold",
      planName: "Plano Gold",
      processed: true,
      processedAt: "2026-01-01T10:30:00Z",
      liberatedAt: "2026-01-01T10:31:00Z"
    },
    {
      paymentId: "pi_test_456", 
      userId: "teste",
      userEmail: "teste@teste.com",
      planType: "mensal",
      planName: "Plano Prata",
      processed: true,
      processedAt: "2026-01-15T14:20:00Z",
      liberatedAt: "2026-01-15T14:21:00Z"
    },
    {
      paymentId: "pi_test_789",
      userId: "premium_user",
      userEmail: "premium@empresa.com", 
      planType: "premium",
      planName: "Plano Premium",
      processed: true,
      processedAt: "2025-12-01T09:15:00Z",
      liberatedAt: "2025-12-01T09:16:00Z"
    }
  ];

  // 🔍 EM PRODUÇÃO:
  // const filter = userId ? { userId } : {};
  // const localData = await database.payments.find(filter).toArray();

  const filteredData = userId ? 
    mockLocalData.filter(p => p.userId === userId) : 
    mockLocalData;

  console.log(`✅ ${filteredData.length} registros locais encontrados`);
  return filteredData;
}

// 🔄 COMBINAR DADOS DO STRIPE COM DADOS LOCAIS
function combinePaymentData(stripePayments, localPayments) {
  console.log("🔄 Combinando dados...");

  const combined = stripePayments.map(stripePayment => {
    const localData = localPayments.find(
      local => local.paymentId === stripePayment.id
    );

    return {
      // Dados do Stripe
      id: stripePayment.id,
      amount: stripePayment.amount,
      currency: stripePayment.currency,
      status: stripePayment.status,
      created: stripePayment.created,
      paymentMethod: stripePayment.paymentMethod,
      
      // Dados locais (se existirem)
      userId: localData?.userId || stripePayment.metadata?.userId || 'N/A',
      userEmail: localData?.userEmail || 'N/A',
      planType: localData?.planType || stripePayment.metadata?.planType || 'N/A',
      planName: localData?.planName || 'N/A',
      processed: localData?.processed || false,
      processedAt: localData?.processedAt || null,
      liberatedAt: localData?.liberatedAt || null,

      // Status combinado
      systemStatus: getSystemStatus(stripePayment.status, localData?.processed),
      
      // Tempo de processamento
      processingTime: localData?.processedAt && localData?.liberatedAt ?
        calculateProcessingTime(localData.processedAt, localData.liberatedAt) : null
    };
  });

  console.log(`✅ ${combined.length} pagamentos combinados`);
  return combined.sort((a, b) => new Date(b.created) - new Date(a.created));
}

// 📊 CALCULAR RESUMO DOS PAGAMENTOS
function calculatePaymentSummary(payments) {
  const summary = {
    total: payments.length,
    totalAmount: 0,
    byStatus: {},
    byPlan: {},
    byPaymentMethod: {},
    processed: 0,
    pending: 0
  };

  payments.forEach(payment => {
    // Total em dinheiro
    summary.totalAmount += payment.amount;
    
    // Por status
    summary.byStatus[payment.status] = (summary.byStatus[payment.status] || 0) + 1;
    
    // Por plano
    summary.byPlan[payment.planType] = (summary.byPlan[payment.planType] || 0) + 1;
    
    // Por método de pagamento
    summary.byPaymentMethod[payment.paymentMethod] = (summary.byPaymentMethod[payment.paymentMethod] || 0) + 1;
    
    // Processados vs pendentes
    if (payment.processed) {
      summary.processed++;
    } else {
      summary.pending++;
    }
  });

  return summary;
}

// 🔍 DETERMINAR STATUS DO SISTEMA
function getSystemStatus(stripeStatus, processed) {
  if (stripeStatus === 'succeeded' && processed) {
    return 'completed';
  } else if (stripeStatus === 'succeeded' && !processed) {
    return 'paid_not_processed';
  } else if (stripeStatus === 'processing') {
    return 'processing';
  } else if (stripeStatus === 'requires_payment_method') {
    return 'pending_payment';
  } else {
    return stripeStatus;
  }
}

// ⏱️ CALCULAR TEMPO DE PROCESSAMENTO
function calculateProcessingTime(processedAt, liberatedAt) {
  const processed = new Date(processedAt);
  const liberated = new Date(liberatedAt);
  const diffMs = liberated - processed;
  return Math.round(diffMs / 1000); // Retornar em segundos
}
