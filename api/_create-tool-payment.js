// API ENDPOINT PARA PAGAMENTOS DE FERRAMENTAS AVULSAS
// Endpoint serverless para processar compras de ferramentas via Stripe

export default async function handler(req, res) {
  console.log('🚀 API create-tool-payment iniciada');
  console.log('📋 Method:', req.method);
  console.log('📋 Body:', req.body);

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
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY não configurada');
      return res.status(500).json({ error: 'Stripe não configurado' });
    }
    
    console.log('🛠️ Criando pagamento de ferramenta...');
    console.log('🔑 Stripe key disponível:', !!stripeSecretKey);
    
    // Verificar se req.body existe e tem dados
    if (!req.body) {
      throw new Error('Body da requisição está vazio');
    }

    const {
      amount,
      currency = 'brl',
      description,
      success_url,
      cancel_url,
      customer_email,
      metadata = {}
    } = req.body;

    console.log('💰 Dados recebidos:', {
      amount,
      currency,
      description,
      success_url,
      cancel_url,
      customer_email,
      metadata
    });

    // Validar dados obrigatórios
    if (!amount || !description || !success_url || !cancel_url) {
      const missing = [];
      if (!amount) missing.push('amount');
      if (!description) missing.push('description');
      if (!success_url) missing.push('success_url');
      if (!cancel_url) missing.push('cancel_url');
      throw new Error(`Dados obrigatórios não fornecidos: ${missing.join(', ')}`);
    }

    // Preparar dados para o Stripe
    const stripeData = {
      'mode': 'payment',
      'success_url': success_url,
      'cancel_url': cancel_url,
      'customer_email': customer_email || '',
      'payment_method_types[0]': 'card',
      'billing_address_collection': 'auto',
      'locale': 'pt-BR',
      'allow_promotion_codes': 'true',
      'line_items[0][price_data][currency]': currency.toLowerCase(),
      'line_items[0][price_data][product_data][name]': description,
      'line_items[0][price_data][unit_amount]': Math.round(parseFloat(amount) * 100).toString(),
      'line_items[0][quantity]': '1',
      'metadata[productType]': 'tool',
      'metadata[toolId]': metadata.toolId || 'tool',
      'metadata[userId]': metadata.userId || customer_email || 'unknown',
      'metadata[amount]': amount.toString()
    };

    console.log('📡 Enviando para Stripe:', stripeData);

    // Criar sessão de checkout para ferramenta
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(stripeData)
    });

    console.log('📡 Resposta Stripe status:', stripeResponse.status);

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.text();
      console.error('❌ Erro da API Stripe:', errorData);
      throw new Error(`Stripe API Error: ${stripeResponse.status} - ${errorData}`);
    }

    const session = await stripeResponse.json();
    
    console.log('✅ Sessão de ferramenta criada:', session.id);
    console.log('🔗 URL:', session.url);

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
      success: true,
      message: 'Sessão de pagamento de ferramenta criada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro detalhado ao criar pagamento de ferramenta:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    
    return res.status(500).json({
      error: 'Erro ao criar sessão de pagamento de ferramenta',
      message: error.message,
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
