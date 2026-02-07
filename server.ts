// =======================
// 🚀 SERVIDOR PRINCIPAL - ARQUITETURA COMPLETA
// =======================

import { getOrchestrator } from './services/microservices/MicroservicesOrchestrator';
import DatabaseService from './services/database/DatabaseService';

// Configurações de ambiente
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = parseInt(process.env.PORT || '8080');

// =======================
// 🎯 INICIALIZAÇÃO PRINCIPAL
// =======================
async function startViralizaAI(): Promise<void> {
  console.log('🚀 ViralizaAI v2.0 - Arquitetura de Microserviços');
  console.log('=' .repeat(60));
  console.log(`📍 Ambiente: ${NODE_ENV}`);
  console.log(`🌐 Porta: ${PORT}`);
  console.log('=' .repeat(60));

  try {
    // 1. Verificar variáveis de ambiente críticas
    checkEnvironmentVariables();

    // 2. Inicializar banco de dados
    await initializeDatabase();

    // 3. Iniciar orquestrador de microserviços
    const orchestrator = getOrchestrator();
    await orchestrator.start();

    // 4. Configurar handlers de processo
    setupProcessHandlers(orchestrator);

    console.log('🎉 ViralizaAI iniciado com sucesso!');
    console.log('📊 Status: http://localhost:8080/health');
    console.log('📈 Métricas: http://localhost:8080/metrics');
    console.log('🔍 Monitoramento: http://localhost:3000/dashboard');

  } catch (error: any) {
    console.error('❌ Erro crítico na inicialização:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// =======================
// 🔧 VERIFICAÇÕES DE AMBIENTE
// =======================
function checkEnvironmentVariables(): void {
  const required = [
    'JWT_SECRET',
    'DB_ENCRYPTION_KEY'
  ];

  const recommended = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'REDIS_HOST',
    'SENTRY_DSN',
    'SLACK_WEBHOOK_URL'
  ];

  console.log('🔍 Verificando variáveis de ambiente...');

  // Verificar obrigatórias
  for (const env of required) {
    if (!process.env[env]) {
      throw new Error(`Variável de ambiente obrigatória não definida: ${env}`);
    }
  }

  // Avisar sobre recomendadas
  for (const env of recommended) {
    if (!process.env[env]) {
      console.warn(`⚠️ Variável recomendada não definida: ${env}`);
    }
  }

  console.log('✅ Variáveis de ambiente verificadas');
}

// =======================
// 🗄️ INICIALIZAÇÃO DO BANCO
// =======================
async function initializeDatabase(): Promise<void> {
  console.log('🗄️ Inicializando banco de dados...');

  const db = DatabaseService.getInstance();
  const isHealthy = await db.healthCheck();

  if (!isHealthy) {
    throw new Error('Falha na conexão com o banco de dados');
  }

  // Executar migrações se necessário (em produção)
  if (NODE_ENV === 'production') {
    console.log('🔄 Executando migrações...');
    // await runMigrations();
  }

  console.log('✅ Banco de dados inicializado');
}

// =======================
// 🛡️ HANDLERS DE PROCESSO
// =======================
function setupProcessHandlers(orchestrator: any): void {
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM recebido, iniciando shutdown graceful...');
    await orchestrator.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('🛑 SIGINT recebido, iniciando shutdown graceful...');
    await orchestrator.shutdown();
    process.exit(0);
  });

  // Capturar erros não tratados
  process.on('uncaughtException', (error) => {
    console.error('💥 Exceção não capturada:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Promise rejeitada não tratada:', reason);
    console.error('Promise:', promise);
    process.exit(1);
  });

  console.log('🛡️ Handlers de processo configurados');
}

// =======================
// 🚀 INICIAR APLICAÇÃO
// =======================
if (require.main === module) {
  startViralizaAI().catch((error) => {
    console.error('💥 Falha crítica na inicialização:', error);
    process.exit(1);
  });
}

export { startViralizaAI };
