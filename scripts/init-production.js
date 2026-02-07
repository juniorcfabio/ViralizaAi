#!/usr/bin/env node

// 🗄️ SCRIPT PARA INICIALIZAR BANCO EM PRODUÇÃO - 1 CLIQUE
import fetch from 'node-fetch';

console.log('🗄️ INICIALIZANDO BANCO DE DADOS DO ULTRA IMPÉRIO...\n');

// 🎯 CONFIGURAÇÕES
const PRODUCTION_URL = 'https://viralizaai.vercel.app';
const ADMIN_KEY = 'admin-init-key-para-inicializar-banco-producao';

// 🧪 FUNÇÃO PARA TESTAR ENDPOINT
async function testEndpoint(url, description) {
  try {
    console.log(`🧪 Testando: ${description}...`);
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${description} - OK`);
      return { success: true, data };
    } else {
      console.log(`⚠️ ${description} - ${data.error || 'Erro desconhecido'}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log(`❌ ${description} - Erro de conexão: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 🗄️ FUNÇÃO PARA INICIALIZAR BANCO
async function initializeDatabase() {
  try {
    console.log(`🚀 Inicializando banco em: ${PRODUCTION_URL}`);
    
    const response = await fetch(`${PRODUCTION_URL}/api/database/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ BANCO INICIALIZADO COM SUCESSO!');
      console.log('📊 Detalhes:', JSON.stringify(data.details, null, 2));
      return true;
    } else {
      console.log('❌ Erro na inicialização:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return false;
  }
}

// 🩺 FUNÇÃO PARA HEALTH CHECK
async function healthCheck() {
  console.log('\n🩺 EXECUTANDO HEALTH CHECK...');
  
  const result = await testEndpoint(`${PRODUCTION_URL}/api/health/check`, 'Health Check');
  
  if (result.success) {
    const { data } = result;
    console.log('\n📊 STATUS DO SISTEMA:');
    console.log(`🌍 Ambiente: ${data.environment}`);
    console.log(`🗄️ Banco: ${data.database?.status || 'N/A'}`);
    console.log(`🤖 OpenAI: ${data.openai?.status || 'N/A'}`);
    console.log(`💳 Stripe: ${data.stripe?.status || 'N/A'}`);
    console.log(`📧 Email: ${data.email?.status || 'N/A'}`);
    console.log(`⚡ Status Geral: ${data.overall_status || 'N/A'}`);
    
    if (data.features) {
      console.log('\n🎯 FEATURES ATIVAS:');
      Object.entries(data.features).forEach(([feature, active]) => {
        console.log(`${active ? '✅' : '❌'} ${feature.replace(/_/g, ' ').toUpperCase()}`);
      });
    }
    
    return data.overall_status === 'healthy';
  }
  
  return false;
}

// 🎯 FUNÇÃO PRINCIPAL
async function initProduction() {
  console.log('🔥 VIRALIZAAI ULTRA IMPÉRIO - INICIALIZAÇÃO COMPLETA\n');
  
  // 1️⃣ TESTAR CONECTIVIDADE
  const connectivityTest = await testEndpoint(PRODUCTION_URL, 'Conectividade do site');
  if (!connectivityTest.success) {
    console.log('❌ Site não está acessível. Verifique o deploy.');
    return;
  }

  // 2️⃣ INICIALIZAR BANCO
  const dbInit = await initializeDatabase();
  if (!dbInit) {
    console.log('❌ Falha na inicialização do banco.');
    console.log('💡 DICA: Verifique se as variáveis SUPABASE estão configuradas no Vercel.');
    return;
  }

  // 3️⃣ HEALTH CHECK FINAL
  const isHealthy = await healthCheck();
  
  if (isHealthy) {
    console.log('\n🎊 ULTRA IMPÉRIO TOTALMENTE OPERACIONAL!');
    console.log('\n🌍 ACESSE SEU IMPÉRIO:');
    console.log(`👉 ${PRODUCTION_URL}`);
    console.log('\n💰 AGORA É SÓ LUCRAR! 🚀');
  } else {
    console.log('\n⚠️ Sistema parcialmente operacional.');
    console.log('🔧 Algumas configurações podem precisar de ajustes.');
  }
}

// 🎯 EXECUTAR SE CHAMADO DIRETAMENTE
if (import.meta.url === `file://${process.argv[1]}`) {
  initProduction().catch(console.error);
}

export { initProduction, healthCheck, initializeDatabase };
