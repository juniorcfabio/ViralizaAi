// API SEGURA PARA PAGAMENTOS STRIPE - SEM SECRETS EXPOSTOS
// Sistema de pagamentos real e funcional usando apenas variáveis de ambiente

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
    // Validar variáveis de ambiente obrigatórias
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY não configurada');
      return res.status(500).json({
        error: 'Configuração de pagamento não encontrada',
        message: 'Entre em contato com o suporte',
        success: false
      });
    }

    console.log('🔐 Sistema de pagamento seguro iniciado');
    console.log('🔑 Stripe configurado:', stripeSecretKey.substring(0, 7) + '...');

    const {
      planType,
      planName,
      amount,
      currency = 'brl',
      mode = 'subscription',
      success_url,
      cancel_url,
      customer_email,
      metadata = {}
    } = req.body;

    // Validar dados obrigatórios
    if (!planType || !planName || !amount || !success_url || !cancel_url) {
      return res.status(400).json({
        error: 'Dados obrigatórios ausentes',
        required: ['planType', 'planName', 'amount', 'success_url', 'cancel_url'],
        success: false
      });
    }

    console.log('💰 Criando sessão de pagamento:', {
      planType,
      planName,
      amount,
      mode,
      customer_email
    });

    // Preparar dados para o Stripe
    const sessionData = {
      mode: mode,
      success_url: success_url,
      cancel_url: cancel_url,
      customer_email: customer_email || '',
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      locale: 'pt-BR',
      allow_promotion_codes: true,
      automatic_tax: { enabled: false },
      line_items: [{
        price_data: {
          currency: currency,
          product_data: {
            name: planName,
            description: `Plano ${planType} - ViralizaAI`,
            images: ['https://viralizaai.vercel.app/logo.png']
          },
          unit_amount: Math.round(amount * 100), // Converter para centavos
          ...(mode === 'subscription' ? {
            recurring: {
              interval: planType === 'Anual' ? 'year' : 
                       planType === 'Semestral' ? 'month' :
                       planType === 'Trimestral' ? 'month' : 'month',
              interval_count: planType === 'Semestral' ? 6 :
                             planType === 'Trimestral' ? 3 : 1
            }
          } : {})
        },
        quantity: 1
      }],
      metadata: {
        planType,
        planName,
        userId: metadata.userId || 'unknown',
        source: 'viralizaai',
        ...metadata
      }
    };

    // Fazer chamada segura para API do Stripe
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(flattenObject(sessionData))
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.text();
      console.error('❌ Erro da API Stripe:', errorData);
      
      return res.status(500).json({
        error: 'Erro ao processar pagamento',
        message: 'Tente novamente em alguns instantes',
        success: false
      });
    }

    const session = await stripeResponse.json();
    
    console.log('✅ Sessão criada com sucesso:', session.id);
    console.log('🔗 URL de pagamento:', session.url);

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
      success: true,
      message: 'Sessão de pagamento criada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no sistema de pagamento:', {
      message: error.message,
      type: error.type,
      code: error.code
    });
    
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Entre em contato com o suporte',
      success: false
    });
  }
}

// Função auxiliar para converter objeto em URLSearchParams
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
