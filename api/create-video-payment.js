export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🎬 Iniciando criação de sessão de pagamento');
    console.log('📦 Body recebido:', req.body);
    
    const {
      amount,
      currency = 'brl',
      description = 'Gerador de Vídeo IA 8K - ViralizaAI',
      success_url,
      cancel_url,
      customer_email,
      metadata = {}
    } = req.body;

    console.log('💰 Dados:', { amount, currency, description, success_url, cancel_url });

    if (!amount || !success_url || !cancel_url) {
      console.log('❌ Dados obrigatórios ausentes');
      return res.status(400).json({ 
        error: 'Dados obrigatórios ausentes',
        required: ['amount', 'success_url', 'cancel_url']
      });
    }

    // Usar fetch para chamar API do Stripe diretamente
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'success_url': success_url,
        'cancel_url': cancel_url,
        'customer_email': customer_email || '',
        'payment_method_types[0]': 'card',
        'locale': 'pt-BR',
        'billing_address_collection': 'required',
        'line_items[0][price_data][currency]': currency,
        'line_items[0][price_data][product_data][name]': description,
        'line_items[0][price_data][product_data][description]': 'Ferramenta de geração de vídeos com IA ultra-realística',
        'line_items[0][price_data][unit_amount]': Math.round(amount * 100).toString(),
        'line_items[0][quantity]': '1',
        ...(metadata ? Object.keys(metadata).reduce((acc, key) => {
          acc[`metadata[${key}]`] = metadata[key];
          return acc;
        }, {}) : {})
      })
    });

    console.log('📡 Status da resposta Stripe:', stripeResponse.status);

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error('❌ Erro do Stripe:', errorText);
      throw new Error(`Stripe API Error: ${stripeResponse.status} - ${errorText}`);
    }

    const session = await stripeResponse.json();
    console.log('✅ Sessão criada:', session.id);
    console.log('🔗 URL:', session.url);

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
      success: true
    });

  } catch (error) {
    console.error('❌ Erro completo:', error);
    
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
      success: false
    });
  }
}
