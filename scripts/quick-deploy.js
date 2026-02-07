#!/usr/bin/env node

// 🚀 SCRIPT DE DEPLOY RÁPIDO - ULTRA IMPÉRIO
import { execSync } from 'child_process';

console.log('🚀 INICIANDO DEPLOY DO ULTRA IMPÉRIO...\n');

// 🎯 FUNÇÃO PARA EXECUTAR COMANDO COM LOG
function runCommand(command, description) {
  console.log(`📝 ${description}...`);
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    console.log(`✅ ${description} - SUCESSO\n`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} - ERRO: ${error.message}\n`);
    return false;
  }
}

// 🚀 PROCESSO DE DEPLOY
async function quickDeploy() {
  console.log('🔥 VIRALIZAAI ULTRA IMPÉRIO - DEPLOY AUTOMÁTICO\n');
  
  // 1️⃣ BUILD DO PROJETO
  if (!runCommand('npm run build', 'Building projeto')) {
    console.log('❌ Falha no build. Abortando deploy.');
    return;
  }

  // 2️⃣ DEPLOY NO VERCEL
  if (!runCommand('vercel --prod --yes', 'Deploy no Vercel')) {
    console.log('❌ Falha no deploy. Verificar configurações.');
    return;
  }

  console.log('🎊 DEPLOY CONCLUÍDO COM SUCESSO!');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. 🗄️ Inicializar banco: npm run init-database');
  console.log('2. 🧪 Testar sistema: npm run health-check');
  console.log('3. 💰 LUCRAR com seu Ultra Império!\n');
  
  console.log('🌍 SEU IMPÉRIO ESTÁ ONLINE EM:');
  console.log('👉 https://viralizaai.vercel.app\n');
}

// 🎯 EXECUTAR DEPLOY
quickDeploy().catch(console.error);
