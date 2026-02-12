// API STRIPE CHECKOUT - CORRIGIDA E FUNCIONAL
export default async function handler(req, res) {
  console.log('🚀 API Stripe Checkout iniciada - Método:', req.method);
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request handled');
    return res.status(200).end();
  }

  // Handle GET for testing
  if (req.method === 'GET') {
    console.log('✅ GET request - API is alive');
    return res.status(200).json({ 
      status: 'API is working', 
      timestamp: new Date().toISOString(),
      methods: ['POST', 'OPTIONS', 'GET']
    });
  }

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('🚀 STRIPE CHECKOUT API - Iniciando...');
    console.log('📋 Body recebido:', JSON.stringify(req.body, null, 2));
    
    // Verificar variáveis de ambiente
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY não configurada');
      return res.status(500).json({ success: false, error: 'Stripe não configurado' });
    }
    console.log('🔑 Stripe key disponível:', stripeSecretKey ? 'SIM' : 'NÃO');
    console.log('🔑 Stripe key prefix:', stripeSecretKey.substring(0, 20) + '...');
    
    const { 
      line_items, 
      success_url, 
      cancel_url, 
      customer_email, 
      mode = 'payment', 
      payment_method_types, 
      metadata,
      // Novos campos para compatibilidade
      planName,
      amount,
      billingCycle,
      checkoutId,
      successUrl,
      cancelUrl
    } = req.body;

    // Se não tiver line_items, criar a partir dos novos campos
    let processedLineItems = line_items;
    
    if (!processedLineItems && planName && amount) {
      processedLineItems = [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: planName
          },
          unit_amount: amount,
          ...(billingCycle && billingCycle !== 'one-time' && {
            recurring: {
              interval: billingCycle === 'yearly' ? 'year' : 'month'
            }
          })
        },
        quantity: 1
      }];
      
      // Ajustar mode baseado no billing cycle
      if (billingCycle && billingCycle !== 'one-time') {
        mode = 'subscription';
      }
    }

    // Validações básicas
    if (!processedLineItems || !Array.isArray(processedLineItems) || processedLineItems.length === 0) {
      return res.status(400).json({ success: false, error: 'line_items ou dados do plano são obrigatórios' });
    }

    // Usar URLs fornecidas ou fallback
    const finalSuccessUrl = successUrl || success_url;
    const finalCancelUrl = cancelUrl || cancel_url;
    
    if (!finalSuccessUrl || !finalCancelUrl) {
      return res.status(400).json({ success: false, error: 'URLs são obrigatórias' });
    }

    console.log('🔑 Usando chave Stripe já verificada');

    // Preparar dados para Stripe
    const checkoutData = {
      mode: mode,
      line_items: processedLineItems,
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl
    };
    
    // Adicionar metadata do checkout se fornecido
    if (checkoutId) {
      checkoutData.metadata = {
        ...metadata,
        checkout_id: checkoutId
      };
    }

    if (customer_email) {
      checkoutData.customer_email = customer_email;
    }

    // 🔑 Adicionar payment_method_types se fornecido (para PIX)
    if (payment_method_types && Array.isArray(payment_method_types)) {
      checkoutData.payment_method_types = payment_method_types;
    }

    // 📝 Adicionar metadata se fornecido
    if (metadata && typeof metadata === 'object') {
      checkoutData.metadata = metadata;
    }

    console.log('📋 Dados para Stripe:', JSON.stringify(checkoutData, null, 2));

    // Fazer requisição para Stripe API
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'mode': checkoutData.mode,
        'success_url': checkoutData.success_url,
        'cancel_url': checkoutData.cancel_url,
        ...(checkoutData.customer_email && { 'customer_email': checkoutData.customer_email }),
        // 🔑 Adicionar payment_method_types para PIX
        ...(checkoutData.payment_method_types && checkoutData.payment_method_types.reduce((acc, method, index) => {
          acc[`payment_method_types[${index}]`] = method;
          return acc;
        }, {})),
        // 📝 Adicionar metadata
        ...(checkoutData.metadata && Object.keys(checkoutData.metadata).reduce((acc, key) => {
          acc[`metadata[${key}]`] = checkoutData.metadata[key];
          return acc;
        }, {})),
        ...processedLineItems.reduce((acc, item, index) => {
          acc[`line_items[${index}][price_data][currency]`] = item.price_data.currency;
          acc[`line_items[${index}][price_data][product_data][name]`] = item.price_data.product_data.name;
          acc[`line_items[${index}][price_data][unit_amount]`] = item.price_data.unit_amount;
          acc[`line_items[${index}][quantity]`] = item.quantity;
          
          if (item.price_data.recurring) {
            acc[`line_items[${index}][price_data][recurring][interval]`] = item.price_data.recurring.interval;
            if (item.price_data.recurring.interval_count) {
              acc[`line_items[${index}][price_data][recurring][interval_count]`] = item.price_data.recurring.interval_count;
            }
          }
          
          return acc;
        }, {})
      })
    });

    console.log('📡 Status da resposta Stripe:', stripeResponse.status);

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error('❌ Erro do Stripe:', errorText);
      
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar sessão no Stripe',
        details: errorText
      });
    }

    const session = await stripeResponse.json();
    console.log('✅ Sessão criada com sucesso:', session.id);

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('❌ Erro na API:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
}
