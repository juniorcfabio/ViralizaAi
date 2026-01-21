// API RECONSTRUÍDA PARA CHECKOUT STRIPE - SOLUÇÃO DEFINITIVA
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed',
      message: 'Apenas POST é permitido'
    });
  }

  try {
    console.log('🚀 API CHECKOUT RECONSTRUÍDA - Iniciando...');
    console.log('📋 Dados recebidos:', JSON.stringify(req.body, null, 2));

    const {
      mode = 'subscription',
      line_items,
      success_url,
      cancel_url,
      customer_email,
      metadata
    } = req.body;

    // Validações rigorosas
    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      console.error('❌ line_items inválido:', line_items);
      return res.status(400).json({
        success: false,
        error: 'line_items é obrigatório e deve ser um array não vazio',
        received: line_items
      });
    }

    if (!success_url || !cancel_url) {
      console.error('❌ URLs obrigatórias ausentes');
      return res.status(400).json({
        success: false,
        error: 'success_url e cancel_url são obrigatórios',
        received: { success_url, cancel_url }
      });
    }

    // CHAVE STRIPE DEFINITIVA - SOLUÇÃO PARA TESTE REAL
    // Construindo a chave em partes para evitar truncamento
    const keyPart1 = 'sk_live_51RbXyNH6btTxgDogj9E5AEyOcXBuqjbs66xCMukRCT9bUOg3aeDG5hLdAMfttTNxDl2qEhcYrZnq6R2TWcEzqVrw';
    const keyPart2 = '00CPfRY1l8';
    const stripeSecretKey = keyPart1 + keyPart2;
    
    console.log('🔑 TESTE - Chave Stripe construída');
    console.log('🔑 Length:', stripeSecretKey.length);
    console.log('🔑 Válida:', stripeSecretKey.startsWith('sk_live_'));
    console.log('🔑 Prefixo:', stripeSecretKey.substring(0, 15) + '...');
    console.log('🔑 Sufixo:', '...' + stripeSecretKey.substring(stripeSecretKey.length - 10));
    
    // Validação final
    if (stripeSecretKey.length !== 108 || !stripeSecretKey.startsWith('sk_live_51RbXyNH6btTxgDog')) {
      console.error('❌ CHAVE STRIPE AINDA INVÁLIDA');
      return res.status(500).json({
        success: false,
        error: 'Chave Stripe inválida após construção',
        debug: {
          length: stripeSecretKey.length,
          expectedLength: 108,
          prefix: stripeSecretKey.substring(0, 20),
          suffix: stripeSecretKey.substring(stripeSecretKey.length - 10)
        }
      });
    }
    
    console.log('✅ CHAVE STRIPE VÁLIDA E COMPLETA!');

    console.log('🔑 Chave Stripe DEFINITIVA configurada');
    console.log('🔑 Prefixo da chave:', stripeSecretKey.substring(0, 15) + '...');

    // Validar estrutura completa dos line_items
    for (let i = 0; i < line_items.length; i++) {
      const item = line_items[i];
      if (!item.price_data) {
        throw new Error(`line_items[${i}].price_data é obrigatório`);
      }
      if (!item.price_data.product_data) {
        throw new Error(`line_items[${i}].price_data.product_data é obrigatório`);
      }
      if (!item.price_data.product_data.name) {
        throw new Error(`line_items[${i}].price_data.product_data.name é obrigatório`);
      }
      if (!item.price_data.unit_amount || item.price_data.unit_amount <= 0) {
        throw new Error(`line_items[${i}].price_data.unit_amount deve ser maior que 0`);
      }
      if (!item.price_data.currency) {
        throw new Error(`line_items[${i}].price_data.currency é obrigatório`);
      }
    }

    console.log('✅ Validações concluídas - Criando sessão Stripe...');

    // CONSTRUIR PARÂMETROS STRIPE CORRETAMENTE
    const stripeParams = new URLSearchParams();
    
    // Parâmetros básicos
    stripeParams.append('mode', mode);
    stripeParams.append('success_url', success_url);
    stripeParams.append('cancel_url', cancel_url);
    stripeParams.append('payment_method_types[0]', 'card');
    stripeParams.append('billing_address_collection', 'auto');
    stripeParams.append('locale', 'pt-BR');
    stripeParams.append('allow_promotion_codes', 'true');
    stripeParams.append('automatic_tax[enabled]', 'false');
    stripeParams.append('phone_number_collection[enabled]', 'false');
    
    if (customer_email) {
      stripeParams.append('customer_email', customer_email);
    }
    
    if (mode !== 'subscription') {
      stripeParams.append('submit_type', 'pay');
    }

    // Adicionar line_items
    line_items.forEach((item, index) => {
      stripeParams.append(`line_items[${index}][price_data][currency]`, item.price_data.currency);
      stripeParams.append(`line_items[${index}][price_data][product_data][name]`, item.price_data.product_data.name);
      stripeParams.append(`line_items[${index}][price_data][unit_amount]`, item.price_data.unit_amount.toString());
      stripeParams.append(`line_items[${index}][quantity]`, (item.quantity || 1).toString());
      
      if (item.price_data.recurring) {
        stripeParams.append(`line_items[${index}][price_data][recurring][interval]`, item.price_data.recurring.interval);
        stripeParams.append(`line_items[${index}][price_data][recurring][interval_count]`, '1');
      }
    });

    // Adicionar metadata
    if (metadata && typeof metadata === 'object') {
      Object.keys(metadata).forEach(key => {
        stripeParams.append(`metadata[${key}]`, String(metadata[key]));
      });
    }

    console.log('📡 Fazendo chamada para Stripe API...');
    console.log('🔗 URL:', 'https://api.stripe.com/v1/checkout/sessions');
    console.log('📋 Parâmetros construídos:', stripeParams.toString().substring(0, 200) + '...');

    // CHAMADA PARA STRIPE API
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2023-10-16'
      },
      body: stripeParams.toString()
    });

    console.log('📡 Status da resposta Stripe:', stripeResponse.status);

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error('❌ Erro detalhado da API Stripe:', errorText);
      
      let errorMessage = 'Erro desconhecido do Stripe';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch (e) {
        errorMessage = errorText;
      }

      return res.status(500).json({
        success: false,
        error: 'Stripe API falhou',
        message: `Stripe API falhou: ${stripeResponse.status} - ${errorText}`,
        stripeError: errorMessage,
        timestamp: new Date().toISOString(),
        requestId: Math.random().toString(36).substr(2, 9)
      });
    }

    const session = await stripeResponse.json();
    
    console.log('✅ SESSÃO CRIADA COM SUCESSO!');
    console.log('🆔 Session ID:', session.id);
    console.log('🔗 Checkout URL:', session.url);

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
      message: 'Sessão de checkout criada com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ ERRO CRÍTICO na API create-checkout-session:', error);
    console.error('❌ Stack trace:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substr(2, 9)
    });
  }
}
