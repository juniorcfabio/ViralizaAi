#!/usr/bin/env node

// 🔐 SCRIPT PARA CONFIGURAR VARIÁVEIS NO VERCEL AUTOMATICAMENTE
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 CONFIGURANDO ULTRA IMPÉRIO NO VERCEL...\n');

// 📋 VARIÁVEIS ESSENCIAIS PARA PRODUÇÃO
const requiredEnvVars = {
  // 🗄️ BANCO DE DADOS (SUPABASE)
  'SUPABASE_URL': 'https://seu-projeto.supabase.co',
  'SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  'DATABASE_URL': 'postgresql://postgres:[password]@db.projeto.supabase.co:5432/postgres',
  
  // 🤖 OPENAI
  'OPENAI_API_KEY': 'sk-proj-sua-key-openai-aqui',
  'OPENAI_MODEL': 'gpt-4o-mini',
  
  // 🔐 SEGURANÇA
  'JWT_SECRET': 'viralizaai-ultra-imperio-jwt-secret-2024-production-key-64chars',
  'JWT_EXPIRES_IN': '7d',
  'ADMIN_INIT_KEY': 'admin-init-key-para-inicializar-banco-producao',
  
  // 📧 EMAIL (OPCIONAL)
  'EMAIL_HOST': 'smtp.gmail.com',
  'EMAIL_PORT': '587',
  'EMAIL_USER': 'noreply@viralizaai.com',
  'EMAIL_PASS': 'sua-app-password-gmail',
  'EMAIL_FROM': 'ViralizaAI <noreply@viralizaai.com>',
  
  // 🌍 AMBIENTE
  'NODE_ENV': 'production',
  'PORT': '3000',
  
  // 🔒 CORS E SEGURANÇA
  'CORS_ORIGIN': 'https://viralizaai.vercel.app',
  'RATE_LIMIT_WINDOW_MS': '900000',
  'RATE_LIMIT_MAX_REQUESTS': '100',
  
  // 🎯 FEATURES DO ULTRA IMPÉRIO
  'ENABLE_AFFILIATE_SYSTEM': 'true',
  'ENABLE_MARKETPLACE': 'true',
  'ENABLE_FRANCHISE_SYSTEM': 'true',
  'ENABLE_WHITELABEL': 'true',
  'ENABLE_GLOBAL_API': 'true',
  'ENABLE_AI_TOOL_CREATOR': 'true',
  'ENABLE_SMART_PRICING': 'true',
  'ENABLE_AI_SUPPORT': 'true'
};

// 🎯 FUNÇÃO PARA CONFIGURAR VARIÁVEL NO VERCEL
function setVercelEnv(key, value) {
  try {
    console.log(`📝 Configurando: ${key}`);
    execSync(`vercel env add ${key} production`, {
      input: `${value}\n`,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log(`✅ ${key} configurado com sucesso`);
  } catch (error) {
    console.log(`⚠️ ${key} - ${error.message.includes('already exists') ? 'já existe' : 'erro'}`);
  }
}

// 🚀 EXECUTAR CONFIGURAÇÃO
async function setupVercelEnvironment() {
  console.log('🔍 Verificando se Vercel CLI está instalado...');
  
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('✅ Vercel CLI encontrado\n');
  } catch (error) {
    console.log('❌ Vercel CLI não encontrado. Instalando...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('✅ Vercel CLI instalado\n');
  }

  console.log('🔐 Configurando variáveis de ambiente...\n');
  
  // 📝 CONFIGURAR TODAS AS VARIÁVEIS
  for (const [key, defaultValue] of Object.entries(requiredEnvVars)) {
    setVercelEnv(key, defaultValue);
  }

  console.log('\n🎊 CONFIGURAÇÃO CONCLUÍDA!');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. 🌐 Acesse: https://vercel.com/dashboard');
  console.log('2. 🔧 Vá em Settings > Environment Variables');
  console.log('3. ✏️ Atualize as variáveis com valores reais:');
  console.log('   - SUPABASE_URL (do seu projeto Supabase)');
  console.log('   - SUPABASE_ANON_KEY (do seu projeto Supabase)');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY (do seu projeto Supabase)');
  console.log('   - DATABASE_URL (connection string do Supabase)');
  console.log('   - OPENAI_API_KEY (da sua conta OpenAI)');
  console.log('   - EMAIL_USER e EMAIL_PASS (se usar Gmail)');
  console.log('\n🚀 Depois execute: npm run deploy');
}

// 🎯 EXECUTAR SE CHAMADO DIRETAMENTE
if (import.meta.url === `file://${process.argv[1]}`) {
  setupVercelEnvironment().catch(console.error);
}

export { setupVercelEnvironment, requiredEnvVars };
