// 🚀 API STRIPE CHECKOUT - VERSÃO FUNCIONAL RESTAURADA
// Baseada na versão F323zcAzv que funcionava perfeitamente

export default async function handler(req, res) {
  console.log('🚀 Stripe Checkout API iniciada');
  
  // CORS Headers
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
    const {
      amount,
      currency = 'brl',
      description,
      success_url,
      cancel_url,
      customer_email,
      metadata = {},
      product_type = 'subscription'
    } = req.body;

    console.log('💰 Dados recebidos:', {
      amount,
      currency,
      description,
      product_type,
      customer_email
    });

    // Validação
    if (!amount || !description || !success_url || !cancel_url) {
      return res.status(400).json({
        error: 'Dados obrigatórios: amount, description, success_url, cancel_url'
      });
    }

    // Chave do Stripe (usar variável de ambiente em produção)
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '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';

    // Preparar dados para o Stripe
    const unitAmount = Math.round(parseFloat(amount) * 100);
    
    const stripeData = {
      mode: 'payment',
      success_url: success_url,
      cancel_url: cancel_url,
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      locale: 'pt-BR',
      allow_promotion_codes: true,
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: description
          },
          unit_amount: unitAmount
        },
        quantity: 1
      }],
      metadata: {
        productType: product_type,
        amount: amount.toString(),
        description: description,
        ...metadata
      }
    };

    // Adicionar email do cliente se fornecido
    if (customer_email) {
      stripeData.customer_email = customer_email;
    }

    console.log('📡 Enviando para Stripe:', {
      amount: unitAmount,
      currency,
      description
    });

    // Chamada para API do Stripe
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(flattenObject(stripeData))
    });

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error('❌ Erro do Stripe:', errorText);
      throw new Error(`Stripe API Error: ${stripeResponse.status}`);
    }

    const session = await stripeResponse.json();
    
    console.log('✅ Sessão criada:', {
      id: session.id,
      url: session.url
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
      checkoutUrl: session.url
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

// Função auxiliar para achatar objeto para URLSearchParams
function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}[${key}]` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            Object.assign(flattened, flattenObject(item, `${newKey}[${index}]`));
          } else {
            flattened[`${newKey}[${index}]`] = item;
          }
        });
      } else {
        flattened[newKey] = value;
      }
    }
  }
  
  return flattened;
}
