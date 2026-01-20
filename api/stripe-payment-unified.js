// API UNIFICADA PARA TODOS OS PAGAMENTOS STRIPE
// Solução alternativa robusta para resolver problemas de redirecionamento

export default async function handler(req, res) {
  console.log('🚀 API stripe-payment-unified iniciada');
  console.log('📋 Method:', req.method);
  console.log('📋 Headers:', req.headers);
  console.log('📋 Body completo:', JSON.stringify(req.body, null, 2));

  // Configurar CORS mais permissivo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['POST'],
      receivedMethod: req.method
    });
  }

  try {
    // Chave do Stripe com fallback
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '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';
    
    console.log('🔑 Stripe key status:', {
      hasEnvKey: !!process.env.STRIPE_SECRET_KEY,
      keyLength: stripeSecretKey?.length,
      keyPrefix: stripeSecretKey?.substring(0, 7)
    });

    // Verificar body
    if (!req.body || Object.keys(req.body).length === 0) {
      throw new Error('Request body está vazio ou inválido');
    }

    // Extrair dados do body com validação
    const {
      amount,
      currency = 'brl',
      description,
      success_url,
      cancel_url,
      customer_email,
      metadata = {},
      product_type = 'payment'
    } = req.body;

    console.log('💰 Dados extraídos:', {
      amount: amount,
      currency: currency,
      description: description,
      success_url: success_url,
      cancel_url: cancel_url,
      customer_email: customer_email,
      product_type: product_type,
      metadata: metadata
    });

    // Validação rigorosa
    const errors = [];
    if (!amount || isNaN(parseFloat(amount))) errors.push('amount deve ser um número válido');
    if (!description || description.trim() === '') errors.push('description é obrigatória');
    if (!success_url || !success_url.startsWith('http')) errors.push('success_url deve ser uma URL válida');
    if (!cancel_url || !cancel_url.startsWith('http')) errors.push('cancel_url deve ser uma URL válida');

    if (errors.length > 0) {
      throw new Error(`Validação falhou: ${errors.join(', ')}`);
    }

    // Preparar dados para o Stripe de forma mais robusta
    const unitAmount = Math.round(parseFloat(amount) * 100);
    const cleanDescription = description.trim();
    
    console.log('📊 Valores calculados:', {
      originalAmount: amount,
      unitAmount: unitAmount,
      cleanDescription: cleanDescription
    });

    // Construir parâmetros do Stripe manualmente
    const stripeParams = new URLSearchParams();
    stripeParams.append('mode', 'payment');
    stripeParams.append('success_url', success_url);
    stripeParams.append('cancel_url', cancel_url);
    stripeParams.append('payment_method_types[0]', 'card');
    stripeParams.append('billing_address_collection', 'auto');
    stripeParams.append('locale', 'pt-BR');
    stripeParams.append('allow_promotion_codes', 'true');
    
    // Line items
    stripeParams.append('line_items[0][price_data][currency]', currency.toLowerCase());
    stripeParams.append('line_items[0][price_data][product_data][name]', cleanDescription);
    stripeParams.append('line_items[0][price_data][unit_amount]', unitAmount.toString());
    stripeParams.append('line_items[0][quantity]', '1');
    
    // Customer email se fornecido
    if (customer_email && customer_email.trim() !== '') {
      stripeParams.append('customer_email', customer_email.trim());
    }
    
    // Metadata
    stripeParams.append('metadata[productType]', product_type);
    stripeParams.append('metadata[amount]', amount.toString());
    stripeParams.append('metadata[description]', cleanDescription);
    
    // Adicionar metadata customizada
    Object.keys(metadata).forEach(key => {
      if (metadata[key] !== null && metadata[key] !== undefined) {
        stripeParams.append(`metadata[${key}]`, String(metadata[key]));
      }
    });

    console.log('📡 Parâmetros para Stripe:', stripeParams.toString());

    // Fazer chamada para Stripe com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2023-10-16'
      },
      body: stripeParams,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('📡 Resposta Stripe:', {
      status: stripeResponse.status,
      statusText: stripeResponse.statusText,
      headers: Object.fromEntries(stripeResponse.headers.entries())
    });

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error('❌ Erro detalhado do Stripe:', {
        status: stripeResponse.status,
        statusText: stripeResponse.statusText,
        body: errorText
      });
      
      throw new Error(`Stripe API falhou: ${stripeResponse.status} - ${errorText}`);
    }

    const session = await stripeResponse.json();
    
    console.log('✅ Sessão criada com sucesso:', {
      id: session.id,
      url: session.url,
      payment_status: session.payment_status,
      status: session.status
    });

    // Resposta de sucesso
    const response = {
      success: true,
      sessionId: session.id,
      url: session.url,
      checkoutUrl: session.url, // Compatibilidade
      message: 'Sessão de pagamento criada com sucesso',
      timestamp: new Date().toISOString(),
      metadata: {
        amount: amount,
        currency: currency,
        description: cleanDescription,
        product_type: product_type
      }
    };

    console.log('🎉 Resposta final:', response);
    
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Erro crítico na API:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      body: req.body,
      url: req.url,
      method: req.method
    });
    
    const errorResponse = {
      success: false,
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(2),
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        body: req.body
      } : undefined
    };
    
    return res.status(500).json(errorResponse);
  }
}
