// 🧠 IA QUE ADMINISTRA O PRÓPRIO NEGÓCIO - ECOSSISTEMA AUTÔNOMO
// Sistema que toma decisões de negócio automaticamente

export class BusinessAIManager {
  constructor() {
    this.churnPredictor = new ChurnPredictor();
    this.priceOptimizer = new AutoPriceOptimizer();
    this.retentionEngine = new RetentionEngine();
    this.campaignManager = new AutoCampaignManager();
    this.fraudBlocker = new AutoFraudBlocker();
    
    this.businessMetrics = new Map();
    this.decisionHistory = [];
    this.activeStrategies = new Set();
    
    this.initializeBusinessAI();
  }

  // 🚀 INICIALIZAR IA DE NEGÓCIO
  initializeBusinessAI() {
    console.log("🧠 Inicializando IA de administração de negócio...");

    // 🎯 INICIAR MONITORAMENTO CONTÍNUO
    this.startContinuousMonitoring();
    
    // 🔄 INICIAR TOMADA DE DECISÕES AUTOMÁTICAS
    this.startAutonomousDecisions();
    
    // 📊 INICIAR COLETA DE MÉTRICAS
    this.startMetricsCollection();
    
    console.log("✅ IA de negócio ativa - Sistema autônomo operacional");
  }

  // 🎯 ANALISAR USUÁRIO E TOMAR DECISÕES
  async analyzeUserAndDecide(userId, userContext) {
    try {
      console.log(`🧠 Analisando usuário para decisões autônomas: ${userId}`);

      // 📊 COLETAR DADOS DO USUÁRIO
      const userData = await this.collectUserData(userId, userContext);
      
      // 🔮 PREVER CHURN
      const churnAnalysis = await this.churnPredictor.predictChurn(userData);
      
      // 💰 OTIMIZAR PREÇO
      const priceOptimization = await this.priceOptimizer.optimizePrice(userData);
      
      // 🎯 ESTRATÉGIAS DE RETENÇÃO
      const retentionStrategy = await this.retentionEngine.generateStrategy(userData, churnAnalysis);
      
      // 📢 CAMPANHAS AUTOMÁTICAS
      const campaignDecision = await this.campaignManager.decideCampaign(userData);
      
      // 🚫 VERIFICAÇÃO DE FRAUDE
      const fraudDecision = await this.fraudBlocker.evaluateFraud(userData);

      // 🎯 EXECUTAR DECISÕES AUTOMÁTICAS
      const decisions = await this.executeAutonomousDecisions({
        userId,
        userData,
        churnAnalysis,
        priceOptimization,
        retentionStrategy,
        campaignDecision,
        fraudDecision
      });

      // 📝 REGISTRAR DECISÕES
      this.logBusinessDecisions(userId, decisions);

      return {
        success: true,
        decisions,
        analysis: {
          churnRisk: churnAnalysis.riskScore,
          priceOptimization: priceOptimization.recommendedPrice,
          retentionActions: retentionStrategy.actions,
          campaignType: campaignDecision.type,
          fraudRisk: fraudDecision.riskLevel
        }
      };

    } catch (error) {
      console.error("🚨 Erro na análise de negócio:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 📊 COLETAR DADOS DO USUÁRIO
  async collectUserData(userId, context) {
    // 🎯 SIMULAÇÃO - EM PRODUÇÃO BUSCAR DO BANCO REAL
    const mockUserData = {
      normal_user: {
        id: userId,
        planType: 'mensal',
        monthsSubscribed: 3,
        lastLogin: new Date(Date.now() - 86400000), // 1 dia atrás
        dailyUsage: 15,
        monthlyUsage: 450,
        totalSpent: 179.70,
        supportTickets: 1,
        paymentFailures: 0,
        engagementScore: 0.7,
        featureUsage: {
          aiGenerator: 80,
          videoCreator: 20,
          ebookMaker: 10
        },
        behaviorPattern: 'consistent',
        lastPaymentDate: new Date(Date.now() - 2592000000), // 30 dias atrás
        churnIndicators: ['low_usage_last_week']
      },
      premium_user: {
        id: userId,
        planType: 'premium',
        monthsSubscribed: 12,
        lastLogin: new Date(Date.now() - 3600000), // 1 hora atrás
        dailyUsage: 85,
        monthlyUsage: 2550,
        totalSpent: 5988.00,
        supportTickets: 0,
        paymentFailures: 0,
        engagementScore: 0.95,
        featureUsage: {
          aiGenerator: 300,
          videoCreator: 150,
          ebookMaker: 80
        },
        behaviorPattern: 'power_user',
        lastPaymentDate: new Date(Date.now() - 86400000), // 1 dia atrás
        churnIndicators: []
      },
      at_risk_user: {
        id: userId,
        planType: 'gold',
        monthsSubscribed: 6,
        lastLogin: new Date(Date.now() - 1209600000), // 14 dias atrás
        dailyUsage: 2,
        monthlyUsage: 60,
        totalSpent: 899.40,
        supportTickets: 3,
        paymentFailures: 2,
        engagementScore: 0.2,
        featureUsage: {
          aiGenerator: 40,
          videoCreator: 5,
          ebookMaker: 2
        },
        behaviorPattern: 'declining',
        lastPaymentDate: new Date(Date.now() - 5184000000), // 60 dias atrás
        churnIndicators: ['no_login_14_days', 'low_usage', 'payment_issues', 'support_complaints']
      }
    };

    const userType = context.userType || 'normal_user';
    return mockUserData[userType] || mockUserData.normal_user;
  }

  // 🎯 EXECUTAR DECISÕES AUTÔNOMAS
  async executeAutonomousDecisions(analysisData) {
    const { userId, userData, churnAnalysis, priceOptimization, retentionStrategy, campaignDecision, fraudDecision } = analysisData;
    const decisions = [];

    // 🚨 DECISÃO DE CHURN - PRIORIDADE MÁXIMA
    if (churnAnalysis.riskScore > 70) {
      console.log(`🚨 Alto risco de churn detectado: ${churnAnalysis.riskScore}%`);
      
      // 💰 OFERECER DESCONTO AUTOMÁTICO
      const discountDecision = await this.offerAutomaticDiscount(userId, churnAnalysis.riskScore);
      decisions.push(discountDecision);

      // 📧 CAMPANHA DE RETENÇÃO
      const retentionCampaign = await this.launchRetentionCampaign(userId, userData);
      decisions.push(retentionCampaign);

      // 🎯 PERSONALIZAR EXPERIÊNCIA
      const personalizationDecision = await this.personalizeExperience(userId, userData);
      decisions.push(personalizationDecision);
    }

    // 💰 DECISÃO DE PREÇO DINÂMICO
    if (priceOptimization.shouldAdjust) {
      const priceDecision = await this.adjustPriceDynamically(userId, priceOptimization);
      decisions.push(priceDecision);
    }

    // 📈 DECISÃO DE UPGRADE
    if (userData.planType === 'mensal' && userData.dailyUsage > 50) {
      const upgradeDecision = await this.offerUpgrade(userId, userData);
      decisions.push(upgradeDecision);
    }

    // 🚫 DECISÃO DE FRAUDE
    if (fraudDecision.riskLevel === 'high') {
      const fraudAction = await this.executeFraudAction(userId, fraudDecision);
      decisions.push(fraudAction);
    }

    // 📢 DECISÃO DE MARKETING
    if (campaignDecision.shouldExecute) {
      const marketingDecision = await this.executeMarketingCampaign(userId, campaignDecision);
      decisions.push(marketingDecision);
    }

    return decisions;
  }

  // 💰 OFERECER DESCONTO AUTOMÁTICO
  async offerAutomaticDiscount(userId, churnRisk) {
    const discountPercentage = Math.min(50, Math.round(churnRisk / 2)); // Máximo 50%
    
    console.log(`💰 Oferecendo desconto automático: ${discountPercentage}% para usuário ${userId}`);

    // 🎯 EM PRODUÇÃO: CRIAR CUPOM REAL
    const couponCode = `STAY${discountPercentage}_${Date.now()}`;
    
    return {
      type: 'automatic_discount',
      action: 'offer_discount',
      userId,
      discountPercentage,
      couponCode,
      reason: `Alto risco de churn (${churnRisk}%)`,
      validUntil: new Date(Date.now() + 604800000), // 7 dias
      executed: true,
      timestamp: new Date()
    };
  }

  // 📧 LANÇAR CAMPANHA DE RETENÇÃO
  async launchRetentionCampaign(userId, userData) {
    console.log(`📧 Lançando campanha de retenção para usuário ${userId}`);

    const campaignType = this.selectRetentionCampaignType(userData);
    
    return {
      type: 'retention_campaign',
      action: 'launch_campaign',
      userId,
      campaignType,
      channels: ['email', 'in_app', 'push'],
      message: this.generateRetentionMessage(userData, campaignType),
      reason: 'Prevenção de churn',
      executed: true,
      timestamp: new Date()
    };
  }

  // 🎯 PERSONALIZAR EXPERIÊNCIA
  async personalizeExperience(userId, userData) {
    console.log(`🎯 Personalizando experiência para usuário ${userId}`);

    const personalizations = [];

    // 🎨 PERSONALIZAR INTERFACE
    if (userData.featureUsage.aiGenerator > userData.featureUsage.videoCreator) {
      personalizations.push('highlight_ai_features');
    }

    // 📚 SUGERIR TUTORIAIS
    if (userData.engagementScore < 0.5) {
      personalizations.push('show_tutorials');
    }

    // 🎁 DESTACAR BENEFÍCIOS
    personalizations.push('highlight_unused_features');

    return {
      type: 'experience_personalization',
      action: 'personalize_ui',
      userId,
      personalizations,
      reason: 'Aumentar engajamento e retenção',
      executed: true,
      timestamp: new Date()
    };
  }

  // 📈 OFERECER UPGRADE
  async offerUpgrade(userId, userData) {
    console.log(`📈 Oferecendo upgrade para usuário ${userId}`);

    const recommendedPlan = userData.dailyUsage > 80 ? 'premium' : 'gold';
    const discount = userData.monthsSubscribed > 6 ? 20 : 10; // Desconto por fidelidade

    return {
      type: 'upgrade_offer',
      action: 'offer_upgrade',
      userId,
      currentPlan: userData.planType,
      recommendedPlan,
      discount,
      reason: `Alto uso (${userData.dailyUsage}/dia)`,
      benefits: this.getUpgradeBenefits(recommendedPlan),
      executed: true,
      timestamp: new Date()
    };
  }

  // 🚫 EXECUTAR AÇÃO DE FRAUDE
  async executeFraudAction(userId, fraudDecision) {
    console.log(`🚫 Executando ação antifraude para usuário ${userId}`);

    let action = 'monitor';
    
    if (fraudDecision.riskLevel === 'critical') {
      action = 'block_immediately';
    } else if (fraudDecision.riskLevel === 'high') {
      action = 'require_verification';
    }

    return {
      type: 'fraud_action',
      action,
      userId,
      riskLevel: fraudDecision.riskLevel,
      reason: fraudDecision.reason,
      executed: true,
      timestamp: new Date()
    };
  }

  // 📢 EXECUTAR CAMPANHA DE MARKETING
  async executeMarketingCampaign(userId, campaignDecision) {
    console.log(`📢 Executando campanha de marketing para usuário ${userId}`);

    return {
      type: 'marketing_campaign',
      action: 'execute_campaign',
      userId,
      campaignType: campaignDecision.type,
      channel: campaignDecision.channel,
      message: campaignDecision.message,
      reason: campaignDecision.reason,
      executed: true,
      timestamp: new Date()
    };
  }

  // 🔄 INICIAR MONITORAMENTO CONTÍNUO
  startContinuousMonitoring() {
    // 📊 ANÁLISE DE USUÁRIOS A CADA 5 MINUTOS
    setInterval(() => {
      this.analyzeAllUsers();
    }, 300000);

    // 🎯 OTIMIZAÇÃO DE ESTRATÉGIAS A CADA 15 MINUTOS
    setInterval(() => {
      this.optimizeStrategies();
    }, 900000);

    // 📈 ANÁLISE DE PERFORMANCE A CADA HORA
    setInterval(() => {
      this.analyzeBusinessPerformance();
    }, 3600000);

    console.log("🔄 Monitoramento contínuo iniciado");
  }

  // 🎯 INICIAR DECISÕES AUTÔNOMAS
  startAutonomousDecisions() {
    // 🧠 DECISÕES ESTRATÉGICAS A CADA 10 MINUTOS
    setInterval(() => {
      this.makeStrategicDecisions();
    }, 600000);

    // 💰 AJUSTES DE PREÇO A CADA 30 MINUTOS
    setInterval(() => {
      this.adjustGlobalPricing();
    }, 1800000);

    // 📢 CAMPANHAS AUTOMÁTICAS A CADA HORA
    setInterval(() => {
      this.launchAutomaticCampaigns();
    }, 3600000);

    console.log("🎯 Sistema de decisões autônomas ativo");
  }

  // 📊 INICIAR COLETA DE MÉTRICAS
  startMetricsCollection() {
    setInterval(() => {
      this.collectBusinessMetrics();
    }, 60000); // A cada minuto

    console.log("📊 Coleta de métricas iniciada");
  }

  // 🧠 ANALISAR TODOS OS USUÁRIOS
  async analyzeAllUsers() {
    console.log("🧠 Analisando todos os usuários para decisões autônomas...");

    // 🎯 SIMULAÇÃO - EM PRODUÇÃO BUSCAR USUÁRIOS REAIS
    const mockUsers = [
      { id: 'user_001', type: 'at_risk_user' },
      { id: 'user_002', type: 'normal_user' },
      { id: 'user_003', type: 'premium_user' },
      { id: 'user_004', type: 'at_risk_user' },
      { id: 'user_005', type: 'normal_user' }
    ];

    for (const user of mockUsers) {
      try {
        await this.analyzeUserAndDecide(user.id, { userType: user.type });
      } catch (error) {
        console.error(`Erro ao analisar usuário ${user.id}:`, error);
      }
    }
  }

  // 🎯 TOMAR DECISÕES ESTRATÉGICAS
  async makeStrategicDecisions() {
    console.log("🎯 Tomando decisões estratégicas autônomas...");

    const metrics = await this.getBusinessMetrics();
    
    // 📉 SE CHURN ALTO, ATIVAR CAMPANHAS AGRESSIVAS
    if (metrics.churnRate > 0.15) {
      await this.activateChurnReductionStrategy();
    }

    // 📈 SE CRESCIMENTO BAIXO, ATIVAR AQUISIÇÃO
    if (metrics.growthRate < 0.05) {
      await this.activateAcquisitionStrategy();
    }

    // 💰 SE RECEITA BAIXA, OTIMIZAR PREÇOS
    if (metrics.revenueGrowth < 0.10) {
      await this.activateRevenueOptimization();
    }
  }

  // 📊 OBTER MÉTRICAS DE NEGÓCIO
  async getBusinessMetrics() {
    // 🎯 SIMULAÇÃO - EM PRODUÇÃO CALCULAR MÉTRICAS REAIS
    return {
      churnRate: 0.12,
      growthRate: 0.08,
      revenueGrowth: 0.15,
      customerSatisfaction: 0.87,
      conversionRate: 0.18,
      averageLifetimeValue: 450.00
    };
  }

  // 📝 REGISTRAR DECISÕES DE NEGÓCIO
  logBusinessDecisions(userId, decisions) {
    const logEntry = {
      userId,
      timestamp: new Date(),
      decisions,
      totalDecisions: decisions.length,
      decisionTypes: decisions.map(d => d.type)
    };

    this.decisionHistory.push(logEntry);

    // 🧹 MANTER APENAS ÚLTIMAS 10000 DECISÕES
    if (this.decisionHistory.length > 10000) {
      this.decisionHistory = this.decisionHistory.slice(-10000);
    }

    console.log(`📝 ${decisions.length} decisões registradas para usuário ${userId}`);
  }

  // 📊 OBTER ESTATÍSTICAS DA IA DE NEGÓCIO
  getBusinessAIStats() {
    const recentDecisions = this.decisionHistory.filter(d => 
      d.timestamp > new Date(Date.now() - 86400000) // Últimas 24h
    );

    const decisionsByType = recentDecisions.reduce((acc, decision) => {
      decision.decisionTypes.forEach(type => {
        acc[type] = (acc[type] || 0) + 1;
      });
      return acc;
    }, {});

    return {
      totalDecisions: this.decisionHistory.length,
      decisionsLast24h: recentDecisions.length,
      decisionsByType: Object.entries(decisionsByType).map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / recentDecisions.length) * 100)
      })),
      activeStrategies: Array.from(this.activeStrategies),
      autonomyLevel: this.calculateAutonomyLevel(),
      businessImpact: this.calculateBusinessImpact()
    };
  }

  // 🎯 CALCULAR NÍVEL DE AUTONOMIA
  calculateAutonomyLevel() {
    const totalPossibleDecisions = 7; // Tipos de decisão disponíveis
    const activeDecisionTypes = new Set(
      this.decisionHistory.flatMap(d => d.decisionTypes)
    ).size;

    const autonomyPercentage = (activeDecisionTypes / totalPossibleDecisions) * 100;
    
    if (autonomyPercentage >= 90) return 'full_autonomy';
    if (autonomyPercentage >= 70) return 'high_autonomy';
    if (autonomyPercentage >= 50) return 'medium_autonomy';
    return 'low_autonomy';
  }

  // 💰 CALCULAR IMPACTO NO NEGÓCIO
  calculateBusinessImpact() {
    // 🎯 SIMULAÇÃO - EM PRODUÇÃO CALCULAR IMPACTO REAL
    return {
      revenueIncrease: '+18.5%',
      churnReduction: '-34.2%',
      conversionImprovement: '+27.8%',
      costReduction: '-23.1%',
      customerSatisfaction: '+15.6%'
    };
  }

  // 🎨 FUNÇÕES AUXILIARES
  selectRetentionCampaignType(userData) {
    if (userData.supportTickets > 2) return 'support_focused';
    if (userData.engagementScore < 0.3) return 'engagement_boost';
    if (userData.paymentFailures > 0) return 'payment_assistance';
    return 'general_retention';
  }

  generateRetentionMessage(userData, campaignType) {
    const messages = {
      support_focused: `Olá ${userData.id}! Notamos que você teve algumas dúvidas. Nossa equipe está aqui para ajudar! 🤝`,
      engagement_boost: `${userData.id}, descobra recursos incríveis que você ainda não explorou! 🚀`,
      payment_assistance: `${userData.id}, vamos resolver juntos qualquer questão de pagamento. Estamos aqui para ajudar! 💳`,
      general_retention: `${userData.id}, você é importante para nós! Veja o que preparamos especialmente para você! ⭐`
    };
    
    return messages[campaignType] || messages.general_retention;
  }

  getUpgradeBenefits(plan) {
    const benefits = {
      gold: ['Mais ferramentas IA', 'Suporte prioritário', 'Sem limites diários'],
      premium: ['IA avançada', 'Recursos exclusivos', 'Suporte VIP', 'API access']
    };
    
    return benefits[plan] || [];
  }
}

// 🔮 PREDITOR DE CHURN
class ChurnPredictor {
  async predictChurn(userData) {
    let riskScore = 0;
    const riskFactors = [];

    // 📅 ÚLTIMA ATIVIDADE
    const daysSinceLastLogin = (Date.now() - userData.lastLogin.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastLogin > 14) {
      riskScore += 40;
      riskFactors.push('no_login_14_days');
    } else if (daysSinceLastLogin > 7) {
      riskScore += 20;
      riskFactors.push('no_login_7_days');
    }

    // 📉 USO BAIXO
    if (userData.dailyUsage < 5) {
      riskScore += 30;
      riskFactors.push('low_daily_usage');
    }

    // 💳 PROBLEMAS DE PAGAMENTO
    if (userData.paymentFailures > 0) {
      riskScore += 25;
      riskFactors.push('payment_issues');
    }

    // 🎫 TICKETS DE SUPORTE
    if (userData.supportTickets > 2) {
      riskScore += 15;
      riskFactors.push('multiple_support_tickets');
    }

    // 📊 ENGAJAMENTO BAIXO
    if (userData.engagementScore < 0.3) {
      riskScore += 20;
      riskFactors.push('low_engagement');
    }

    return {
      riskScore: Math.min(100, riskScore),
      riskLevel: this.getRiskLevel(riskScore),
      riskFactors,
      recommendation: this.getChurnRecommendation(riskScore)
    };
  }

  getRiskLevel(score) {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'minimal';
  }

  getChurnRecommendation(score) {
    if (score >= 70) return 'immediate_intervention';
    if (score >= 50) return 'retention_campaign';
    if (score >= 30) return 'engagement_boost';
    return 'monitor';
  }
}

// 💰 OTIMIZADOR DE PREÇOS AUTOMÁTICO
class AutoPriceOptimizer {
  async optimizePrice(userData) {
    // 🎯 LÓGICA DE OTIMIZAÇÃO BASEADA NO PERFIL
    let shouldAdjust = false;
    let recommendedPrice = userData.currentPrice || 59.90;
    let reason = 'no_adjustment_needed';

    // 📈 USUÁRIO DE ALTO VALOR
    if (userData.dailyUsage > 80 && userData.engagementScore > 0.8) {
      recommendedPrice *= 1.15; // +15%
      shouldAdjust = true;
      reason = 'high_value_user';
    }

    // 📉 USUÁRIO EM RISCO
    if (userData.churnIndicators.length > 2) {
      recommendedPrice *= 0.80; // -20%
      shouldAdjust = true;
      reason = 'churn_prevention';
    }

    return {
      shouldAdjust,
      currentPrice: userData.currentPrice || 59.90,
      recommendedPrice: Math.round(recommendedPrice * 100) / 100,
      reason,
      priceChange: shouldAdjust ? ((recommendedPrice / (userData.currentPrice || 59.90) - 1) * 100).toFixed(1) + '%' : '0%'
    };
  }
}

// 🎯 ENGINE DE RETENÇÃO
class RetentionEngine {
  async generateStrategy(userData, churnAnalysis) {
    const actions = [];

    if (churnAnalysis.riskScore > 50) {
      actions.push('offer_discount');
      actions.push('personal_outreach');
    }

    if (userData.engagementScore < 0.5) {
      actions.push('feature_education');
      actions.push('onboarding_refresh');
    }

    if (userData.supportTickets > 1) {
      actions.push('priority_support');
    }

    return {
      actions,
      priority: churnAnalysis.riskLevel,
      timeline: this.getActionTimeline(churnAnalysis.riskScore)
    };
  }

  getActionTimeline(riskScore) {
    if (riskScore > 80) return 'immediate';
    if (riskScore > 60) return 'within_24h';
    if (riskScore > 40) return 'within_week';
    return 'within_month';
  }
}

// 📢 GERENCIADOR DE CAMPANHAS AUTOMÁTICAS
class AutoCampaignManager {
  async decideCampaign(userData) {
    // 🎯 DECIDIR TIPO DE CAMPANHA BASEADO NO PERFIL
    if (userData.planType === 'mensal' && userData.dailyUsage > 50) {
      return {
        shouldExecute: true,
        type: 'upgrade_campaign',
        channel: 'email',
        message: 'Você está usando muito! Que tal um upgrade?',
        reason: 'high_usage_upgrade_opportunity'
      };
    }

    if (userData.monthsSubscribed > 6 && userData.engagementScore > 0.8) {
      return {
        shouldExecute: true,
        type: 'loyalty_campaign',
        channel: 'in_app',
        message: 'Obrigado por ser um cliente fiel! Aqui está um bônus especial.',
        reason: 'loyalty_reward'
      };
    }

    return { shouldExecute: false };
  }
}

// 🚫 BLOQUEADOR AUTOMÁTICO DE FRAUDE
class AutoFraudBlocker {
  async evaluateFraud(userData) {
    let riskLevel = 'low';
    let reason = 'normal_behavior';

    // 🚨 PADRÕES SUSPEITOS
    if (userData.dailyUsage > 500) {
      riskLevel = 'high';
      reason = 'excessive_usage';
    } else if (userData.paymentFailures > 5) {
      riskLevel = 'high';
      reason = 'multiple_payment_failures';
    } else if (userData.behaviorPattern === 'bot_like') {
      riskLevel = 'critical';
      reason = 'bot_behavior_detected';
    }

    return {
      riskLevel,
      reason,
      shouldBlock: riskLevel === 'critical',
      shouldMonitor: riskLevel === 'high'
    };
  }
}

// 🚀 INSTÂNCIA GLOBAL
export const businessAI = new BusinessAIManager();

// 🔧 FUNÇÕES AUXILIARES
export const analyzeUser = (userId, context) => businessAI.analyzeUserAndDecide(userId, context);
export const getBusinessAIStats = () => businessAI.getBusinessAIStats();

console.log("🧠 IA de administração de negócio carregada - Ecossistema autônomo ativo");
