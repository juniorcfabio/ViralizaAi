// 🩺 API DE HEALTH CHECK - VERIFICAR STATUS DO SISTEMA
import { testConnection } from '../../lib/database.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const startTime = Date.now();
    
    // 🧪 TESTES DE SISTEMA
    const checks = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      status: 'healthy'
    };

    // 🗄️ TESTE DE BANCO DE DADOS
    try {
      const dbConnected = await testConnection();
      checks.database = {
        status: dbConnected ? 'connected' : 'disconnected',
        type: 'PostgreSQL/Supabase'
      };
    } catch (error) {
      checks.database = {
        status: 'error',
        error: error.message
      };
    }

    // 🤖 TESTE DE OPENAI
    checks.openai = {
      status: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    };

    // 💳 TESTE DE STRIPE
    checks.stripe = {
      status: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured',
      mode: process.env.STRIPE_SECRET_KEY?.includes('live') ? 'live' : 'test'
    };

    // 📧 TESTE DE EMAIL
    checks.email = {
      status: (process.env.EMAIL_HOST && process.env.EMAIL_USER) ? 'configured' : 'not_configured',
      host: process.env.EMAIL_HOST || 'not_set'
    };

    // 🎯 FEATURES ATIVAS
    checks.features = {
      affiliate_system: process.env.ENABLE_AFFILIATE_SYSTEM === 'true',
      marketplace: process.env.ENABLE_MARKETPLACE === 'true',
      franchise_system: process.env.ENABLE_FRANCHISE_SYSTEM === 'true',
      whitelabel: process.env.ENABLE_WHITELABEL === 'true',
      global_api: process.env.ENABLE_GLOBAL_API === 'true',
      ai_tool_creator: process.env.ENABLE_AI_TOOL_CREATOR === 'true',
      smart_pricing: process.env.ENABLE_SMART_PRICING === 'true',
      ai_support: process.env.ENABLE_AI_SUPPORT === 'true'
    };

    // ⚡ PERFORMANCE
    const responseTime = Date.now() - startTime;
    checks.performance = {
      response_time_ms: responseTime,
      memory_usage: process.memoryUsage(),
      uptime_seconds: process.uptime()
    };

    // 🚨 DETERMINAR STATUS GERAL
    const hasErrors = Object.values(checks).some(check => 
      check && typeof check === 'object' && check.status === 'error'
    );

    const isHealthy = checks.database?.status === 'connected' && 
                     checks.openai?.status === 'configured' &&
                     checks.stripe?.status === 'configured';

    checks.overall_status = hasErrors ? 'error' : (isHealthy ? 'healthy' : 'warning');

    // 📊 RESPOSTA
    const statusCode = checks.overall_status === 'healthy' ? 200 : 
                      checks.overall_status === 'warning' ? 200 : 503;

    res.status(statusCode).json({
      success: checks.overall_status !== 'error',
      ...checks
    });

  } catch (error) {
    console.error('🚨 Erro no health check:', error);
    res.status(503).json({
      success: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
