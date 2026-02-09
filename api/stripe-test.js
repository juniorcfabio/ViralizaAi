// API STRIPE TESTE - VERSÃO SIMPLES PARA VALIDAÇÃO
export default async function handler(req, res) {
  console.log('🧪 API Stripe Test - Método:', req.method);
  console.log('🧪 Headers:', req.headers);
  console.log('🧪 Body:', req.body);

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'API Stripe Test está funcionando!',
      timestamp: new Date().toISOString(),
      methods: ['GET', 'POST', 'OPTIONS']
    });
  }

  if (req.method === 'POST') {
    try {
      const { planName, amount, successUrl, cancelUrl } = req.body;
      
      console.log('📋 Dados recebidos:', { planName, amount, successUrl, cancelUrl });

      // Validação básica
      if (!planName || !amount || !successUrl || !cancelUrl) {
        return res.status(400).json({
          success: false,
          error: 'Dados obrigatórios: planName, amount, successUrl, cancelUrl'
        });
      }

      // Chave Stripe real
      const stripeSecretKey = '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';
      
      console.log('🔑 Usando chave Stripe real');

      // Preparar dados para Stripe
      const stripeData = {
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'brl',
            product_data: {
              name: planName
            },
            unit_amount: amount
          },
          quantity: 1
        }]
      };

      console.log('📡 Enviando para Stripe API...');

      // Chamar Stripe API real
      const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'mode': stripeData.mode,
          'success_url': stripeData.success_url,
          'cancel_url': stripeData.cancel_url,
          'payment_method_types[0]': 'card',
          'line_items[0][price_data][currency]': 'brl',
          'line_items[0][price_data][product_data][name]': planName,
          'line_items[0][price_data][unit_amount]': amount.toString(),
          'line_items[0][quantity]': '1'
        })
      });

      console.log('📡 Stripe response status:', stripeResponse.status);

      if (!stripeResponse.ok) {
        const errorText = await stripeResponse.text();
        console.error('❌ Erro do Stripe:', errorText);
        throw new Error(`Stripe API error: ${stripeResponse.status} - ${errorText}`);
      }

      const session = await stripeResponse.json();
      console.log('✅ Sessão Stripe criada:', session.id);

      return res.status(200).json({
        success: true,
        sessionId: session.id,
        url: session.url,
        message: 'Sessão Stripe real criada com sucesso!'
      });

    } catch (error) {
      console.error('❌ Erro na API:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        details: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Método não permitido'
  });
}
