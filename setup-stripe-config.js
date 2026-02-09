#!/usr/bin/env node

/**
 * SCRIPT DE CONFIGURAÇÃO STRIPE + SUPABASE
 * Automatiza a configuração das variáveis de ambiente e testes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 CONFIGURAÇÃO STRIPE + SUPABASE - VIRALIZAAI');
console.log('================================================');

// Configurações do projeto
const config = {
  // Stripe Keys (LIVE - já configuradas)
  STRIPE_SECRET_KEY: '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',
  STRIPE_PUBLISHABLE_KEY: 'pk_live_51RbXyNH6btTxgDogkRcYNr8SyOg4KzGPG0TJQb7zU8TsI',
  STRIPE_WEBHOOK_SECRET: 'whsec_afpxdAu3owW1haW9q1TtIbxXvAqQQe0n',
  
  // Supabase
  SUPABASE_URL: 'https://ymmswnmietxoupeazmok.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbXN3bm1pZXR4b3VwZWF6bW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODY2NjcsImV4cCI6MjA4MDI2MjY2N30.yvCcvTnqAMsNz9itandg4lyxeEmhsukcbqfkWZnkeu4',
  
  // Site
  NEXT_PUBLIC_SITE_URL: 'https://viralizaai.vercel.app'
};

console.log('✅ CONFIGURAÇÕES CARREGADAS:');
console.log('- Stripe Secret Key:', config.STRIPE_SECRET_KEY.substring(0, 20) + '...');
console.log('- Stripe Publishable Key:', config.STRIPE_PUBLISHABLE_KEY.substring(0, 20) + '...');
console.log('- Supabase URL:', config.SUPABASE_URL);
console.log('- Site URL:', config.NEXT_PUBLIC_SITE_URL);

// Criar arquivo de configuração para o frontend
const frontendConfig = `// CONFIGURAÇÃO STRIPE FRONTEND - GERADO AUTOMATICAMENTE
export const STRIPE_CONFIG = {
  publishableKey: '${config.STRIPE_PUBLISHABLE_KEY}',
  apiVersion: '2022-11-15'
};

export const SITE_CONFIG = {
  baseUrl: '${config.NEXT_PUBLIC_SITE_URL}',
  successUrl: '${config.NEXT_PUBLIC_SITE_URL}/checkout/success',
  cancelUrl: '${config.NEXT_PUBLIC_SITE_URL}/checkout/cancel'
};
`;

fs.writeFileSync(path.join(__dirname, 'src/config/stripe.ts'), frontendConfig);
console.log('✅ Arquivo de configuração criado: src/config/stripe.ts');

// Instruções para configuração manual
console.log('\n📋 PRÓXIMOS PASSOS MANUAIS:');
console.log('1. Configure as variáveis no Vercel Dashboard:');
console.log('   - STRIPE_SECRET_KEY =', config.STRIPE_SECRET_KEY);
console.log('   - STRIPE_WEBHOOK_SECRET =', config.STRIPE_WEBHOOK_SECRET);
console.log('   - SUPABASE_URL =', config.SUPABASE_URL);
console.log('   - NEXT_PUBLIC_SITE_URL =', config.NEXT_PUBLIC_SITE_URL);

console.log('\n2. Para testar webhook localmente:');
console.log('   stripe listen --forward-to', config.NEXT_PUBLIC_SITE_URL + '/api/stripe/webhook');

console.log('\n3. Exemplo de teste com curl:');
console.log(`curl -X POST https://api.stripe.com/v1/checkout/sessions \\
  -u ${config.STRIPE_SECRET_KEY}: \\
  -d success_url="${config.NEXT_PUBLIC_SITE_URL}/checkout/success" \\
  -d cancel_url="${config.NEXT_PUBLIC_SITE_URL}/checkout/cancel" \\
  -d mode=payment \\
  -d "line_items[0][price]=price_XXXXXXXX" \\
  -d "line_items[0][quantity]=1" \\
  -d "metadata[user_id]=00000000-0000-0000-0000-000000000000" \\
  -d "metadata[affiliate_id]=AFF123"`);

console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA!');
console.log('Sistema pronto para uso em produção.');
