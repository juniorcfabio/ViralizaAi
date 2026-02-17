// =======================
// 🔥 STRIPE PIX - CHECKOUT DINÂMICO
// =======================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { userId, planName, amount, planType, userEmail, userName } = req.body;

    // Validações de segurança
    if (!userId || !planName || !amount || !userEmail) {
      return res.status(400).json({ 
        error: 'Dados obrigatórios: userId, planName, amount, userEmail' 
      });
    }

    // Validar valor mínimo (R$ 1,00)
    if (amount < 1) {
      return res.status(400).json({ 
        error: 'Valor mínimo: R$ 1,00' 
      });
    }

    // Definir valores fixos por plano (antifraude)
    const planPrices = {
      'mensal': 59.90,
      'trimestral': 159.90,
      'semestral': 259.90,
      'anual': 399.90,
      'ebook': 29.90,
      'video': 19.90,
      'funnel': 39.90,
      'anuncio': 99.90
    };

    const expectedAmount = planPrices[planType] || amount;
    
    // Verificar se o valor está correto (tolerância de R$ 0,10)
    if (Math.abs(amount - expectedAmount) > 0.10) {
      return res.status(400).json({ 
        error: 'Valor inválido para este plano' 
      });
    }

    // Criar sessão PIX no Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['pix'],
      mode: 'payment',
      expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutos
      line_items: [
        {
          price_data: {
            currency: 'brl',
            unit_amount: Math.round(amount * 100), // Centavos
            product_data: {
              name: `ViralizaAI - ${planName}`,
              description: `Assinatura ${planName} - ViralizaAI`,
              images: ['https://viralizaai.vercel.app/logo.png']
            }
          },
          quantity: 1
        }
      ],
      metadata: {
        userId: userId,
        planName: planName,
        planType: planType || 'mensal',
        userEmail: userEmail,
        userName: userName || 'Cliente',
        timestamp: new Date().toISOString(),
        source: 'viralizaai_pix'
      },
      success_url: `${process.env.FRONTEND_URL || 'https://viralizaai.vercel.app'}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://viralizaai.vercel.app'}/?payment=cancelled`
    });

    // Log para auditoria
    console.log('🔥 PIX Checkout criado:', {
      sessionId: session.id,
      userId,
      planName,
      amount,
      userEmail
    });

    // Retornar URL do checkout
    res.status(200).json({ 
      success: true,
      url: session.url,
      sessionId: session.id,
      expiresAt: session.expires_at
    });

  } catch (error) {
    console.error('❌ Erro ao criar PIX checkout:', error);
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Tente novamente'
    });
  }
}
