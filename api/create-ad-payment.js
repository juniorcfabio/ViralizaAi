// API ENDPOINT PARA PAGAMENTOS DE ANÚNCIOS
// Endpoint serverless para processar pagamentos de anúncios via Stripe

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
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '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';
    
    console.log('📢 Criando pagamento de anúncio...');
    
    const {
      amount,
      currency = 'brl',
      description,
      success_url,
      cancel_url,
      customer_email,
      metadata = {}
    } = req.body;

    console.log('💰 Anúncio:', description, '- R$', amount);
    console.log('📧 Email:', customer_email);

    // Validar dados obrigatórios
    if (!amount || !description || !success_url || !cancel_url) {
      throw new Error('Dados obrigatórios não fornecidos');
    }

    // Criar sessão de checkout para anúncio
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
        'allow_promotion_codes': 'true',
        'line_items[0][price_data][currency]': currency,
        'line_items[0][price_data][product_data][name]': description,
        'line_items[0][price_data][product_data][description]': `Anúncio Premium: ${description}`,
        'line_items[0][price_data][unit_amount]': Math.round(amount * 100),
        'line_items[0][quantity]': '1',
        'metadata[productType]': 'ad',
        'metadata[adId]': metadata.adId || 'premium_ad',
        'metadata[userId]': metadata.userId || customer_email,
        'metadata[amount]': amount.toString(),
        'metadata[description]': description,
        'metadata[duration]': metadata.duration || '30',
        'metadata[reach]': metadata.reach || '10000'
      })
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.text();
      console.error('❌ Erro da API Stripe:', errorData);
      throw new Error(`Stripe API Error: ${stripeResponse.status} - ${errorData}`);
    }

    const session = await stripeResponse.json();
    
    console.log('✅ Sessão de anúncio criada:', session.id);
    console.log('🔗 URL:', session.url);

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
      success: true,
      message: 'Sessão de pagamento de anúncio criada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar pagamento de anúncio:', error);
    
    return res.status(500).json({
      error: 'Erro ao criar sessão de pagamento de anúncio',
      message: error.message,
      success: false
    });
  }
}
