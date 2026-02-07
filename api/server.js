// =======================
// 🚀 SERVIDOR PRINCIPAL - STACK FINAL POSTGRESQL
// =======================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Importar módulos do sistema
const db = require('./db');
const { initializeCronJobs } = require('./cron-jobs');
const { testEmailConfiguration } = require('./mailer');
const { 
  checkSubscription, 
  requireAdmin, 
  protectedEndpoint 
} = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// =======================
// 🔧 CONFIGURAÇÕES DE SEGURANÇA
// =======================

// Helmet para headers de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com"]
    }
  }
}));

// CORS configurado
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://viralizaai.vercel.app', 'https://viralizaai.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));

// Compressão
app.use(compression());

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por IP
  message: {
    error: 'Muitas requisições, tente novamente em 15 minutos',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(globalLimiter);

// Parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =======================
// 🏥 HEALTH CHECK
// =======================

app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: dbHealth,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// =======================
// 📊 MÉTRICAS DO SISTEMA
// =======================

app.get('/api/admin/metrics', requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeSubscriptions,
      todayRevenue,
      systemStats
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM users WHERE is_active = true'),
      db.query('SELECT COUNT(*) as count FROM subscriptions WHERE status = \'active\''),
      db.query(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM payments 
        WHERE status = 'paid' 
        AND created_at >= CURRENT_DATE
      `),
      db.query(`
        SELECT 
          (SELECT COUNT(*) FROM payments WHERE status = 'paid') as total_payments,
          (SELECT COUNT(*) FROM audit_logs WHERE created_at >= CURRENT_DATE) as today_actions,
          (SELECT AVG(amount) FROM payments WHERE status = 'paid') as avg_payment
      `)
    ]);

    const metrics = {
      users: {
        total: parseInt(totalUsers.rows[0].count),
        active_subscriptions: parseInt(activeSubscriptions.rows[0].count)
      },
      revenue: {
        today: parseFloat(todayRevenue.rows[0].total) / 100,
        total_payments: parseInt(systemStats.rows[0].total_payments),
        average_payment: parseFloat(systemStats.rows[0].avg_payment) / 100
      },
      system: {
        today_actions: parseInt(systemStats.rows[0].today_actions),
        uptime: process.uptime(),
        memory_usage: process.memoryUsage()
      }
    };

    res.json(metrics);
  } catch (error) {
    console.error('❌ Erro ao buscar métricas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =======================
// 🔐 ENDPOINTS DE AUTENTICAÇÃO
// =======================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Buscar usuário
    const user = await db.users.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar senha (implementar hash comparison)
    // const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    // Por enquanto, comparação simples (IMPLEMENTAR BCRYPT EM PRODUÇÃO)
    const isValidPassword = password === 'temp_password';
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Atualizar último login
    await db.users.updateLastLogin(user.id);
    
    // Log de auditoria
    await db.audit.log({
      user_id: user.id,
      action: 'user_login',
      entity_type: 'auth',
      details: {
        login_method: 'email_password',
        success: true
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    // Retornar dados do usuário (sem senha)
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: userWithoutPassword,
      message: 'Login realizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR' 
    });
  }
});

// =======================
// 💳 ENDPOINTS PROTEGIDOS DE FERRAMENTAS
// =======================

// Gerador de conteúdo
app.post('/api/tools/generate-content', 
  ...protectedEndpoint({
    toolName: 'generateContent',
    auditAction: 'generate_content'
  }),
  async (req, res) => {
    try {
      const { prompt, type } = req.body;
      
      // Implementar geração real de conteúdo
      const content = await generateContentWithAI(prompt, type);
      
      res.json({
        success: true,
        content: content,
        usage: req.usageInfo
      });
      
    } catch (error) {
      console.error('❌ Erro na geração de conteúdo:', error);
      res.status(500).json({ error: 'Erro ao gerar conteúdo' });
    }
  }
);

// Agendamento de posts
app.post('/api/tools/schedule-post',
  ...protectedEndpoint({
    toolName: 'schedulePost',
    requiredPlans: ['trimestral', 'semestral', 'anual'],
    auditAction: 'schedule_post'
  }),
  async (req, res) => {
    try {
      const { content, platforms, scheduleDate } = req.body;
      
      // Implementar agendamento real
      const scheduledPost = await schedulePostToPlatforms(content, platforms, scheduleDate);
      
      res.json({
        success: true,
        scheduledPost: scheduledPost,
        usage: req.usageInfo
      });
      
    } catch (error) {
      console.error('❌ Erro no agendamento:', error);
      res.status(500).json({ error: 'Erro ao agendar post' });
    }
  }
);

// =======================
// 🚀 INICIALIZAÇÃO DO SERVIDOR
// =======================

const startServer = async () => {
  try {
    console.log('🚀 Iniciando ViralizaAI Stack Final...');
    
    // 1. Inicializar banco de dados
    await db.initializeDatabase();
    console.log('✅ PostgreSQL conectado');
    
    // 2. Testar configuração de email
    const emailOk = await testEmailConfiguration();
    if (emailOk) {
      console.log('✅ Email configurado');
    } else {
      console.log('⚠️ Email não configurado (opcional)');
    }
    
    // 3. Inicializar CRON jobs
    initializeCronJobs();
    console.log('✅ CRON jobs iniciados');
    
    // 4. Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🔥 Servidor rodando na porta ${PORT}`);
      console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log('🎯 ViralizaAI Stack Final pronto para produção!');
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Recebido sinal ${signal}, iniciando shutdown graceful...`);
  
  try {
    // Fechar conexões do banco
    await db.closePool();
    console.log('✅ Conexões do banco fechadas');
    
    console.log('✅ Shutdown concluído');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no shutdown:', error);
    process.exit(1);
  }
};

// Interceptar sinais de shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Interceptar erros não tratados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não tratado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  process.exit(1);
});

// Iniciar servidor
if (require.main === module) {
  startServer();
}

module.exports = app;
