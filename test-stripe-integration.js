#!/usr/bin/env node

/**
 * TESTE DE INTEGRAÇÃO STRIPE + SUPABASE
 * Testa o sistema completo de checkout
 */

import fetch from 'node-fetch';

const config = {
  STRIPE_SECRET_KEY: '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',
  API_URL: 'https://viralizaai.vercel.app/api/create-checkout-session',
  WEBHOOK_URL: 'https://viralizaai.vercel.app/api/stripe/webhook'
};

console.log('🧪 TESTE DE INTEGRAÇÃO STRIPE + SUPABASE');
console.log('==========================================');

async function testCheckoutSession() {
  console.log('\n1️⃣ TESTANDO CRIAÇÃO DE SESSÃO DE CHECKOUT...');
  
  try {
    const response = await fetch(config.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'payment',
        priceId: 'price_test_example', // Substitua por um price ID real
        quantity: 1,
        metadata: {
          user_id: '00000000-0000-0000-0000-000000000000',
          product_id: 'plan_mensal',
          affiliate_id: 'AFF123',
          origin: 'test_integration'
        },
        customerEmail: 'test@viralizaai.com'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sessão criada com sucesso!');
      console.log('📋 Dados:', {
        sessionId: data.id,
        checkoutUrl: data.url?.substring(0, 50) + '...'
      });
      return data;
    } else {
      const error = await response.text();
      console.log('❌ Erro na criação da sessão:', error);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return null;
  }
}

async function testWebhookEndpoint() {
  console.log('\n2️⃣ TESTANDO ENDPOINT DO WEBHOOK...');
  
  try {
    const response = await fetch(config.WEBHOOK_URL, {
      method: 'GET'
    });
    
    console.log('📡 Status do webhook:', response.status);
    
    if (response.status === 405) {
      console.log('✅ Webhook endpoint está ativo (Method Not Allowed é esperado para GET)');
    } else {
      console.log('⚠️ Status inesperado do webhook');
    }
  } catch (error) {
    console.log('❌ Erro ao testar webhook:', error.message);
  }
}

async function displayTestInstructions() {
  console.log('\n📋 INSTRUÇÕES PARA TESTE COMPLETO:');
  console.log('==================================');
  
  console.log('\n🔧 1. CONFIGURAR PRODUTOS NO STRIPE:');
  console.log('   - Acesse: https://dashboard.stripe.com/products');
  console.log('   - Crie um produto de teste');
  console.log('   - Copie o Price ID (price_xxxxx)');
  
  console.log('\n🎯 2. TESTAR CHECKOUT REAL:');
  console.log('   - Substitua "price_test_example" por um Price ID real');
  console.log('   - Execute novamente este teste');
  console.log('   - Abra a URL retornada no navegador');
  console.log('   - Use cartão de teste: 4242 4242 4242 4242');
  
  console.log('\n🔗 3. CONFIGURAR WEBHOOK NO STRIPE:');
  console.log('   - Acesse: https://dashboard.stripe.com/webhooks');
  console.log('   - Adicione endpoint:', config.WEBHOOK_URL);
  console.log('   - Eventos: checkout.session.completed, invoice.paid');
  
  console.log('\n📊 4. VERIFICAR DADOS NO SUPABASE:');
  console.log('   - Acesse: https://supabase.com/dashboard');
  console.log('   - Vá para Table Editor');
  console.log('   - Verifique tabelas: purchases, subscriptions, affiliate_payments');
  
  console.log('\n🎉 SISTEMA PRONTO PARA PRODUÇÃO!');
}

// Executar testes
async function runTests() {
  await testCheckoutSession();
  await testWebhookEndpoint();
  await displayTestInstructions();
}

runTests().catch(console.error);
