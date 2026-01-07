// API ENDPOINT PARA CRIAR SESSÃO STRIPE CHECKOUT
// Endpoint serverless para processar pagamentos reais via Stripe

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
    // Fallback para chaves hardcoded se env vars não funcionarem
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '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';
    
    console.log('🔍 Environment check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('VERCEL:', process.env.VERCEL);
    console.log('STRIPE_SECRET_KEY from env:', !!process.env.STRIPE_SECRET_KEY);
    console.log('Using fallback key:', !process.env.STRIPE_SECRET_KEY);
    console.log('🔑 Stripe key (first 20 chars):', stripeSecretKey.substring(0, 20) + '...');

    const {
      mode,
      line_items,
      success_url,
      cancel_url,
      customer_email,
      metadata
    } = req.body;

    console.log('🚀 Criando sessão Stripe Checkout...');
    console.log('📧 Email do cliente:', customer_email);
    console.log('💰 Itens:', JSON.stringify(line_items, null, 2));
    console.log('🎯 Modo:', mode);

    // Validar dados obrigatórios
    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      throw new Error('line_items é obrigatório e deve ser um array não vazio');
    }

    if (!success_url || !cancel_url) {
      throw new Error('success_url e cancel_url são obrigatórios');
    }

    // Fazer chamada direta para API REST do Stripe
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': mode || 'subscription',
        'success_url': success_url.replace('viralizaai-pi.vercel.app', 'viralizaai.vercel.app'),
        'cancel_url': cancel_url.replace('viralizaai-pi.vercel.app', 'viralizaai.vercel.app'),
        'customer_email': customer_email || '',
        'payment_method_types[0]': 'card',
        'billing_address_collection': 'required',
        'locale': 'pt-BR',
        'allow_promotion_codes': 'true',
        'automatic_tax[enabled]': 'false',
        ...line_items.reduce((acc, item, index) => {
          if (item.price_data) {
            acc[`line_items[${index}][price_data][currency]`] = item.price_data.currency;
            acc[`line_items[${index}][price_data][product_data][name]`] = item.price_data.product_data.name;
            acc[`line_items[${index}][price_data][unit_amount]`] = item.price_data.unit_amount;
            if (item.price_data.recurring) {
              acc[`line_items[${index}][price_data][recurring][interval]`] = item.price_data.recurring.interval;
            }
          }
          acc[`line_items[${index}][quantity]`] = item.quantity;
          return acc;
        }, {}),
        ...(metadata ? Object.keys(metadata).reduce((acc, key, index) => {
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
    
    console.log('✅ Sessão criada com sucesso:', session.id);
    console.log('🔗 URL da sessão:', session.url);

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
      success: true
    });

  } catch (error) {
    console.error('❌ Erro detalhado ao criar sessão Stripe:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack
    });
    
    return res.status(500).json({
      error: 'Erro ao criar sessão de pagamento',
      message: error.message,
      type: error.type || 'unknown',
      success: false
    });
  }
}
