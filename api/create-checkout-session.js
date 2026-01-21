// API STRIPE CHECKOUT - FUNCIONAMENTO GARANTIDO
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('🚀 STRIPE CHECKOUT API - Iniciando...');
    
    const { line_items, success_url, cancel_url, customer_email, mode = 'payment' } = req.body;

    // Validações básicas
    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return res.status(400).json({ success: false, error: 'line_items é obrigatório' });
    }

    if (!success_url || !cancel_url) {
      return res.status(400).json({ success: false, error: 'URLs são obrigatórias' });
    }

    // Chave Stripe
    const stripeSecretKey = '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';
    
    console.log('🔑 Chave Stripe configurada');

    // Preparar dados para Stripe
    const checkoutData = {
      mode: mode,
      line_items: line_items,
      success_url: success_url,
      cancel_url: cancel_url
    };

    if (customer_email) {
      checkoutData.customer_email = customer_email;
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
        ...line_items.reduce((acc, item, index) => {
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
