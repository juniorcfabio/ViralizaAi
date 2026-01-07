// API SIMPLES PARA TESTAR STRIPE
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔍 Testando Stripe básico...');
    
    // Testar se conseguimos importar o Stripe
    const stripe = require('stripe')('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');
    
    console.log('✅ Stripe importado com sucesso');
    
    // Testar criação de sessão básica
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: 'Teste ViralizaAI',
          },
          unit_amount: 5990,
          recurring: {
            interval: 'month'
          }
        },
        quantity: 1,
      }],
      success_url: 'https://viralizaai.vercel.app/success',
      cancel_url: 'https://viralizaai.vercel.app/cancel',
    });

    console.log('✅ Sessão criada:', session.id);

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
      message: 'Stripe funcionando perfeitamente!'
    });

  } catch (error) {
    console.error('❌ Erro no teste Stripe:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      type: error.type,
      code: error.code
    });
  }
}
