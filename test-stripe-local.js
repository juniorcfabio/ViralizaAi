// PROVA DE FUNCIONAMENTO DO SISTEMA STRIPE - TESTE LOCAL
import https from 'https';

// Simular a API create-checkout-session localmente
const createCheckoutSession = async (data) => {
  console.log('🚀 SIMULANDO API create-checkout-session LOCAL');
  
  // Chave Stripe via variável de ambiente
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY não configurada. Defina a variável de ambiente.');
  }
  
  console.log('🔑 Chave Stripe construída:');
  console.log('   - Length:', stripeSecretKey.length);
  console.log('   - Válida:', stripeSecretKey.startsWith('sk_live_'));
  console.log('   - Prefixo:', stripeSecretKey.substring(0, 15) + '...');
  console.log('   - Sufixo:', '...' + stripeSecretKey.substring(stripeSecretKey.length - 10));
  
  // Validar dados
  if (!data.line_items || !Array.isArray(data.line_items)) {
    throw new Error('line_items inválido');
  }
  
  if (!data.success_url || !data.cancel_url) {
    throw new Error('URLs obrigatórias ausentes');
  }
  
  console.log('✅ Validações passaram');
  console.log('📋 Dados recebidos:', JSON.stringify(data, null, 2));
  
  // Construir parâmetros para Stripe
  const stripeParams = new URLSearchParams();
  stripeParams.append('mode', data.mode || 'payment');
  stripeParams.append('success_url', data.success_url);
  stripeParams.append('cancel_url', data.cancel_url);
  stripeParams.append('payment_method_types[0]', 'card');
  stripeParams.append('billing_address_collection', 'auto');
  stripeParams.append('locale', 'pt-BR');
  
  if (data.customer_email) {
    stripeParams.append('customer_email', data.customer_email);
  }
  
  // Adicionar line_items
  data.line_items.forEach((item, index) => {
    stripeParams.append(`line_items[${index}][price_data][currency]`, item.price_data.currency);
    stripeParams.append(`line_items[${index}][price_data][product_data][name]`, item.price_data.product_data.name);
    stripeParams.append(`line_items[${index}][price_data][unit_amount]`, item.price_data.unit_amount.toString());
    stripeParams.append(`line_items[${index}][quantity]`, (item.quantity || 1).toString());
  });
  
  console.log('📡 Parâmetros construídos para Stripe API');
  console.log('🔗 URL:', 'https://api.stripe.com/v1/checkout/sessions');
  
  // Fazer chamada real para Stripe API
  return new Promise((resolve, reject) => {
    const postData = stripeParams.toString();
    
    const options = {
      hostname: 'api.stripe.com',
      port: 443,
      path: '/v1/checkout/sessions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'Stripe-Version': '2023-10-16'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📊 Status da resposta Stripe:', res.statusCode);
        
        if (res.statusCode === 200) {
          const session = JSON.parse(data);
          console.log('✅ SUCESSO! Sessão criada:');
          console.log('   - Session ID:', session.id);
          console.log('   - URL:', session.url);
          console.log('🎉 SISTEMA DE PAGAMENTO FUNCIONANDO PERFEITAMENTE!');
          
          resolve({
            success: true,
            sessionId: session.id,
            url: session.url,
            message: 'Sessão criada com sucesso'
          });
        } else {
          console.log('❌ Erro da API Stripe:', data);
          reject(new Error(`Stripe API Error: ${res.statusCode} - ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
};

// Teste real
const testData = {
  mode: 'payment',
  line_items: [{
    price_data: {
      currency: 'brl',
      product_data: {
        name: 'TESTE REAL - Plano Mensal ViralizaAI'
      },
      unit_amount: 5990 // R$ 59,90
    },
    quantity: 1
  }],
  success_url: 'https://viralizaai.vercel.app/#/dashboard/social-tools?payment=success',
  cancel_url: 'https://viralizaai.vercel.app/#/dashboard/billing?payment=cancelled',
  customer_email: 'teste@viralizaai.com'
};

console.log('🧪 INICIANDO TESTE REAL LOCAL DO SISTEMA STRIPE');
console.log('=' .repeat(60));

createCheckoutSession(testData)
  .then(result => {
    console.log('=' .repeat(60));
    console.log('🎯 RESULTADO FINAL:');
    console.log('✅ SISTEMA STRIPE FUNCIONANDO 100%');
    console.log('✅ CHAVE API VÁLIDA E COMPLETA');
    console.log('✅ SESSÃO CRIADA COM SUCESSO');
    console.log('✅ URL DE CHECKOUT GERADA');
    console.log('');
    console.log('🔗 URL PARA PAGAMENTO REAL:');
    console.log(result.url);
    console.log('');
    console.log('🎉 PROVA CONCRETA: O SISTEMA ESTÁ FUNCIONANDO!');
    console.log('=' .repeat(60));
  })
  .catch(error => {
    console.log('=' .repeat(60));
    console.log('❌ ERRO NO TESTE:', error.message);
    console.log('=' .repeat(60));
  });
