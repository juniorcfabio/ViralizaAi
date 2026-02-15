// =======================
// 🛡️ MIDDLEWARE DE AUTENTICAÇÃO E VERIFICAÇÃO
// =======================

const db = require('../db');

// Middleware para verificar assinatura ativa
const checkSubscription = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado',
        code: 'UNAUTHORIZED' 
      });
    }

    // Verificar assinatura ativa
    const subscription = await db.users.hasActiveSubscription(userId);
    
    if (!subscription) {
      return res.status(403).json({ 
        error: 'Assinatura inativa ou expirada',
        code: 'SUBSCRIPTION_REQUIRED',
        action: 'redirect_to_pricing'
      });
    }

    // Adicionar dados da assinatura ao request
    req.subscription = subscription;
    req.userPlan = subscription.plan_type;
    
    next();
    
  } catch (error) {
    console.error('❌ Erro no middleware de assinatura:', error);
    
    // Log de auditoria
    await db.audit.log({
      user_id: req.user?.id,
      action: 'subscription_check_error',
      entity_type: 'middleware',
      details: {
        error: error.message,
        endpoint: req.path,
        method: req.method
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR' 
    });
  }
};

// Middleware para verificar plano específico
const requirePlan = (requiredPlans) => {
  return async (req, res, next) => {
    try {
      const userPlan = req.userPlan || req.subscription?.plan_type;
      
      if (!userPlan) {
        return res.status(403).json({
          error: 'Plano não identificado',
          code: 'PLAN_REQUIRED'
        });
      }

      // Hierarquia de planos
      const planHierarchy = {
        'mensal': 1,
        'trimestral': 2,
        'semestral': 3,
        'anual': 4,
        'unlimited': 999
      };

      const userPlanLevel = planHierarchy[userPlan] || 0;
      const requiredLevel = Math.min(...requiredPlans.map(plan => planHierarchy[plan] || 999));

      if (userPlanLevel < requiredLevel) {
        return res.status(403).json({
          error: `Plano ${requiredPlans.join(' ou ')} necessário`,
          code: 'PLAN_UPGRADE_REQUIRED',
          currentPlan: userPlan,
          requiredPlans: requiredPlans
        });
      }

      next();
      
    } catch (error) {
      console.error('❌ Erro no middleware de plano:', error);
      return res.status(500).json({ 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR' 
      });
    }
  };
};

// Middleware para rate limiting por plano
const rateLimitByPlan = (toolName) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const userPlan = req.userPlan;
      
      if (!userId || !userPlan) {
        return res.status(401).json({
          error: 'Usuário ou plano não identificado',
          code: 'UNAUTHORIZED'
        });
      }

      // Verificar limite de uso
      const usageResult = await db.query(
        `SELECT usage_count, limit_count, next_reset 
         FROM usage_limits 
         WHERE user_id = $1 AND tool = $2`,
        [userId, toolName]
      );

      if (usageResult.rows.length === 0) {
        // Criar limite se não existir
        const limits = {
          'mensal': { limit: 50 },
          'trimestral': { limit: 200 },
          'semestral': { limit: 500 },
          'anual': { limit: 2000 },
          'unlimited': { limit: 999999 }
        };

        const planLimit = limits[userPlan]?.limit || 50;
        
        await db.query(
          `INSERT INTO usage_limits (user_id, tool, plan, usage_count, limit_count, next_reset)
           VALUES ($1, $2, $3, 0, $4, NOW() + INTERVAL '1 month')`,
          [userId, toolName, userPlan, planLimit]
        );

        req.usageInfo = { usage_count: 0, limit_count: planLimit };
      } else {
        const usage = usageResult.rows[0];
        
        // Verificar se precisa resetar
        if (new Date() > new Date(usage.next_reset)) {
          await db.query(
            `UPDATE usage_limits 
             SET usage_count = 0, next_reset = NOW() + INTERVAL '1 month'
             WHERE user_id = $1 AND tool = $2`,
            [userId, toolName]
          );
          usage.usage_count = 0;
        }

        // Verificar limite
        if (usage.usage_count >= usage.limit_count) {
          return res.status(429).json({
            error: 'Limite de uso excedido',
            code: 'RATE_LIMIT_EXCEEDED',
            usage: usage.usage_count,
            limit: usage.limit_count,
            resetDate: usage.next_reset,
            upgradeRequired: true
          });
        }

        req.usageInfo = usage;
      }

      next();
      
    } catch (error) {
      console.error('❌ Erro no rate limiting:', error);
      return res.status(500).json({ 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR' 
      });
    }
  };
};

// Middleware para incrementar uso após sucesso
const incrementUsage = (toolName) => {
  return async (req, res, next) => {
    // Interceptar resposta para incrementar apenas em caso de sucesso
    const originalSend = res.send;
    
    res.send = function(data) {
      // Incrementar uso apenas se resposta for de sucesso (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id;
        if (userId) {
          db.query(
            `UPDATE usage_limits 
             SET usage_count = usage_count + 1 
             WHERE user_id = $1 AND tool = $2`,
            [userId, toolName]
          ).catch(error => {
            console.error('❌ Erro ao incrementar uso:', error);
          });
        }
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Middleware para log de auditoria
const auditLog = (action) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Interceptar resposta para log completo
    const originalSend = res.send;
    
    res.send = function(data) {
      const duration = Date.now() - startTime;
      const success = res.statusCode >= 200 && res.statusCode < 400;
      
      // Log assíncrono
      setImmediate(async () => {
        try {
          await db.audit.log({
            user_id: req.user?.id,
            action: action,
            entity_type: 'api_endpoint',
            entity_id: req.path,
            details: {
              method: req.method,
              status_code: res.statusCode,
              duration_ms: duration,
              success: success,
              user_plan: req.userPlan,
              query_params: req.query,
              body_size: req.get('content-length') || 0
            },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
          });
        } catch (error) {
          console.error('❌ Erro no log de auditoria:', error);
        }
      });
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Middleware para verificar admin
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        error: 'Usuário não autenticado',
        code: 'UNAUTHORIZED'
      });
    }

    const user = await db.users.findById(userId);
    
    if (!user || user.type !== 'admin') {
      return res.status(403).json({
        error: 'Acesso negado - Admin necessário',
        code: 'ADMIN_REQUIRED'
      });
    }

    req.isAdmin = true;
    next();
    
  } catch (error) {
    console.error('❌ Erro no middleware admin:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR' 
    });
  }
};

// Middleware combinado para endpoints protegidos
const protectedEndpoint = (options = {}) => {
  const middlewares = [];
  
  // Sempre verificar assinatura
  middlewares.push(checkSubscription);
  
  // Verificar plano se especificado
  if (options.requiredPlans) {
    middlewares.push(requirePlan(options.requiredPlans));
  }
  
  // Rate limiting se especificado
  if (options.toolName) {
    middlewares.push(rateLimitByPlan(options.toolName));
    middlewares.push(incrementUsage(options.toolName));
  }
  
  // Log de auditoria se especificado
  if (options.auditAction) {
    middlewares.push(auditLog(options.auditAction));
  }
  
  return middlewares;
};

module.exports = {
  checkSubscription,
  requirePlan,
  rateLimitByPlan,
  incrementUsage,
  auditLog,
  requireAdmin,
  protectedEndpoint
};
