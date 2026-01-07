// API ENDPOINT PARA CRIAR SESSÃO DE PAGAMENTO DE FERRAMENTAS
// Endpoint serverless para processar pagamentos de ferramentas avulsas

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Chave Stripe hardcoded como fallback
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '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';
    
    console.log('🔧 Criando sessão de pagamento para ferramenta...');
    console.log('🔑 Stripe key (first 20 chars):', stripeSecretKey.substring(0, 20) + '...');

    const {
      amount,
      currency,
      description,
      success_url,
      cancel_url,
      customer_email,
      metadata
    } = req.body;

    console.log('💰 Valor:', amount);
    console.log('📧 Email:', customer_email);
    console.log('📝 Descrição:', description);

    // Validar dados obrigatórios
    if (!amount || !success_url || !cancel_url) {
      throw new Error('amount, success_url e cancel_url são obrigatórios');
    }

    // Fazer chamada direta para API REST do Stripe
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'success_url': success_url.replace('viralizaai-pi.vercel.app', 'viralizaai.vercel.app'),
        'cancel_url': cancel_url.replace('viralizaai-pi.vercel.app', 'viralizaai.vercel.app'),
        'customer_email': customer_email || '',
        'payment_method_types[0]': 'card',
        'billing_address_collection': 'required',
        'locale': 'pt-BR',
        'line_items[0][price_data][currency]': currency || 'brl',
        'line_items[0][price_data][product_data][name]': description || 'Ferramenta ViralizaAI',
        'line_items[0][price_data][unit_amount]': Math.round(amount * 100), // Converter para centavos
        'line_items[0][quantity]': '1',
        ...(metadata ? Object.keys(metadata).reduce((acc, key) => {
          acc[`metadata[${key}]`] = metadata[key];
          return acc;
        }, {}) : {})
      })
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.text();
      console.error('❌ Erro da API Stripe:', errorData);
      throw new Error(`Stripe API Error: ${stripeResponse.status} - ${errorData}`);
    }

    const session = await stripeResponse.json();
    
    console.log('✅ Sessão de ferramenta criada:', session.id);
    console.log('🔗 URL da sessão:', session.url);

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
      success: true
    });

  } catch (error) {
    console.error('❌ Erro ao criar sessão de pagamento de ferramenta:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });
    
    return res.status(500).json({
      error: 'Erro ao criar sessão de pagamento de ferramenta',
      message: error.message,
      type: error.type || 'unknown',
      success: false
    });
  }
}
