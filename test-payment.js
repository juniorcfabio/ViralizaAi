// TESTE REAL DO SISTEMA DE PAGAMENTO STRIPE
const testPayment = async () => {
  console.log('🧪 INICIANDO TESTE REAL DO SISTEMA DE PAGAMENTO');
  
  const testData = {
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'brl',
        product_data: {
          name: 'Teste Pagamento ViralizaAI'
        },
        unit_amount: 1000 // R$ 10,00
      },
      quantity: 1
    }],
    success_url: 'https://viralizaai.vercel.app/success',
    cancel_url: 'https://viralizaai.vercel.app/cancel',
    customer_email: 'teste@viralizaai.com'
  };

  try {
    console.log('📡 Fazendo chamada para API...');
    
    const response = await fetch('https://viralizaai.vercel.app/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Status da resposta:', response.status);
    
    const result = await response.json();
    console.log('📋 Resultado:', result);
    
    if (result.success && result.url) {
      console.log('✅ SUCESSO! URL do Stripe gerada:');
      console.log('🔗', result.url);
      console.log('🎉 SISTEMA DE PAGAMENTO FUNCIONANDO PERFEITAMENTE!');
      return true;
    } else {
      console.log('❌ ERRO:', result.error || result.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ ERRO na chamada:', error.message);
    return false;
  }
};

// Executar teste
testPayment().then(success => {
  if (success) {
    console.log('🎯 TESTE CONCLUÍDO COM SUCESSO - SISTEMA FUNCIONANDO!');
  } else {
    console.log('🚨 TESTE FALHOU - SISTEMA PRECISA DE CORREÇÃO');
  }
});
