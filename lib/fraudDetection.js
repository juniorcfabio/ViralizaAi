// 🚨 SISTEMA DE DETECÇÃO DE FRAUDE E BLOQUEIO AUTOMÁTICO
// Monitoramento inteligente para proteger a plataforma

export class FraudDetectionSystem {
  constructor() {
    this.rules = {
      // 🔥 REGRAS DE USO EXTREMO
      extremeUsage: {
        dailyToolsLimit: 1000,
        hourlyToolsLimit: 200,
        aiGenerationsPerHour: 100,
        videosPerHour: 20
      },
      
      // 💳 REGRAS DE PAGAMENTO
      payment: {
        maxFailedAttempts: 5,
        maxChargebacks: 2,
        suspiciousAmountPattern: true
      },
      
      // 🌐 REGRAS DE COMPORTAMENTO
      behavior: {
        maxIpChanges: 15,
        maxDeviceChanges: 10,
        suspiciousLoginPattern: true,
        botLikeActivity: true
      },
      
      // ⏰ REGRAS TEMPORAIS
      temporal: {
        nightTimeActivity: true, // 2AM-6AM
        weekendSpikes: true,
        holidayActivity: true
      }
    };
  }

  // 🔍 ANÁLISE PRINCIPAL DE FRAUDE
  async detectFraud(user, context = {}) {
    console.log(`🔍 Analisando usuário: ${user.userId}`);
    
    const risks = [];
    const score = { total: 0, breakdown: {} };

    // 📊 ANÁLISE DE USO
    const usageRisk = this.analyzeUsagePatterns(user);
    if (usageRisk.risk > 0) {
      risks.push(usageRisk);
      score.total += usageRisk.risk;
      score.breakdown.usage = usageRisk.risk;
    }

    // 💳 ANÁLISE DE PAGAMENTOS
    const paymentRisk = this.analyzePaymentBehavior(user);
    if (paymentRisk.risk > 0) {
      risks.push(paymentRisk);
      score.total += paymentRisk.risk;
      score.breakdown.payment = paymentRisk.risk;
    }

    // 🌐 ANÁLISE DE COMPORTAMENTO
    const behaviorRisk = this.analyzeBehaviorPatterns(user, context);
    if (behaviorRisk.risk > 0) {
      risks.push(behaviorRisk);
      score.total += behaviorRisk.risk;
      score.breakdown.behavior = behaviorRisk.risk;
    }

    // ⏰ ANÁLISE TEMPORAL
    const temporalRisk = this.analyzeTemporalPatterns(user);
    if (temporalRisk.risk > 0) {
      risks.push(temporalRisk);
      score.total += temporalRisk.risk;
      score.breakdown.temporal = temporalRisk.risk;
    }

    // 🎯 DETERMINAR AÇÃO
    const action = this.determineAction(score.total, risks);
    
    const result = {
      userId: user.userId,
      riskScore: score.total,
      riskLevel: this.getRiskLevel(score.total),
      risks: risks,
      scoreBreakdown: score.breakdown,
      recommendedAction: action,
      timestamp: new Date().toISOString()
    };

    console.log(`🚨 Análise completa:`, result);
    return result;
  }

  // 📊 ANÁLISE DE PADRÕES DE USO
  analyzeUsagePatterns(user) {
    const risks = [];
    let riskScore = 0;

    // 🔥 USO DIÁRIO EXTREMO
    if (user.dailyUsage > this.rules.extremeUsage.dailyToolsLimit) {
      risks.push(`Uso diário extremo: ${user.dailyUsage} ferramentas`);
      riskScore += 40;
    }

    // 🤖 PADRÃO DE BOT
    const hourlyUsage = user.hourlyUsage || 0;
    if (hourlyUsage > this.rules.extremeUsage.hourlyToolsLimit) {
      risks.push(`Uso por hora suspeito: ${hourlyUsage} ferramentas`);
      riskScore += 35;
    }

    // 🎯 IA ABUSE
    const aiUsage = user.monthlyUsage?.aiGenerations || 0;
    const aiPerHour = aiUsage / (24 * 30); // Estimativa
    if (aiPerHour > this.rules.extremeUsage.aiGenerationsPerHour) {
      risks.push(`Abuso de IA detectado: ${Math.round(aiPerHour)} gerações/hora`);
      riskScore += 30;
    }

    // 📈 CRESCIMENTO ANÔMALO
    if (user.usageGrowth && user.usageGrowth > 500) {
      risks.push(`Crescimento anômalo de uso: +${user.usageGrowth}%`);
      riskScore += 25;
    }

    return {
      category: 'usage',
      risk: riskScore,
      details: risks,
      description: 'Análise de padrões de uso'
    };
  }

  // 💳 ANÁLISE DE COMPORTAMENTO DE PAGAMENTO
  analyzePaymentBehavior(user) {
    const risks = [];
    let riskScore = 0;

    // 💔 FALHAS DE PAGAMENTO
    const failedPayments = user.failedPayments || 0;
    if (failedPayments > this.rules.payment.maxFailedAttempts) {
      risks.push(`Muitas tentativas de pagamento falharam: ${failedPayments}`);
      riskScore += 30;
    }

    // 🔄 CHARGEBACKS
    const chargebacks = user.chargebacks || 0;
    if (chargebacks > this.rules.payment.maxChargebacks) {
      risks.push(`Chargebacks excessivos: ${chargebacks}`);
      riskScore += 50;
    }

    // 💰 PADRÃO DE VALORES SUSPEITOS
    if (user.paymentPattern === 'suspicious') {
      risks.push('Padrão de pagamento suspeito detectado');
      riskScore += 20;
    }

    // 🕐 TENTATIVAS RÁPIDAS
    if (user.rapidPaymentAttempts && user.rapidPaymentAttempts > 10) {
      risks.push(`Tentativas de pagamento muito rápidas: ${user.rapidPaymentAttempts}`);
      riskScore += 25;
    }

    return {
      category: 'payment',
      risk: riskScore,
      details: risks,
      description: 'Análise de comportamento de pagamento'
    };
  }

  // 🌐 ANÁLISE DE PADRÕES DE COMPORTAMENTO
  analyzeBehaviorPatterns(user, context) {
    const risks = [];
    let riskScore = 0;

    // 🌍 MUDANÇAS DE IP SUSPEITAS
    const ipChanges = user.ipChanges || 0;
    if (ipChanges > this.rules.behavior.maxIpChanges) {
      risks.push(`Muitas mudanças de IP: ${ipChanges}`);
      riskScore += 25;
    }

    // 📱 MUDANÇAS DE DISPOSITIVO
    const deviceChanges = user.deviceChanges || 0;
    if (deviceChanges > this.rules.behavior.maxDeviceChanges) {
      risks.push(`Muitas mudanças de dispositivo: ${deviceChanges}`);
      riskScore += 20;
    }

    // 🤖 ATIVIDADE DE BOT
    if (user.botScore && user.botScore > 0.8) {
      risks.push(`Atividade de bot detectada: ${Math.round(user.botScore * 100)}%`);
      riskScore += 45;
    }

    // 🚀 VELOCIDADE ANÔMALA
    if (context.requestsPerMinute && context.requestsPerMinute > 60) {
      risks.push(`Velocidade anômala: ${context.requestsPerMinute} req/min`);
      riskScore += 30;
    }

    // 🔄 PADRÃO REPETITIVO
    if (user.repetitivePattern) {
      risks.push('Padrão de uso extremamente repetitivo');
      riskScore += 20;
    }

    return {
      category: 'behavior',
      risk: riskScore,
      details: risks,
      description: 'Análise de padrões comportamentais'
    };
  }

  // ⏰ ANÁLISE DE PADRÕES TEMPORAIS
  analyzeTemporalPatterns(user) {
    const risks = [];
    let riskScore = 0;
    const now = new Date();
    const hour = now.getHours();

    // 🌙 ATIVIDADE NOTURNA SUSPEITA
    if (user.nightTimeActivity && (hour >= 2 && hour <= 6)) {
      const nightUsage = user.nightTimeActivity;
      if (nightUsage > 100) {
        risks.push(`Atividade noturna excessiva: ${nightUsage} ações`);
        riskScore += 15;
      }
    }

    // 📅 PADRÃO DE FINS DE SEMANA
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    if (isWeekend && user.weekendSpike && user.weekendSpike > 300) {
      risks.push(`Pico suspeito no fim de semana: ${user.weekendSpike}%`);
      riskScore += 10;
    }

    // ⚡ RAJADAS DE ATIVIDADE
    if (user.activityBursts && user.activityBursts > 5) {
      risks.push(`Rajadas de atividade detectadas: ${user.activityBursts}`);
      riskScore += 20;
    }

    return {
      category: 'temporal',
      risk: riskScore,
      details: risks,
      description: 'Análise de padrões temporais'
    };
  }

  // 🎯 DETERMINAR AÇÃO BASEADA NO SCORE
  determineAction(totalScore, risks) {
    if (totalScore >= 80) {
      return {
        action: 'block_immediately',
        severity: 'critical',
        message: 'Bloqueio imediato necessário - Risco crítico',
        autoExecute: true
      };
    } else if (totalScore >= 60) {
      return {
        action: 'suspend_temporarily',
        severity: 'high',
        message: 'Suspensão temporária recomendada - Risco alto',
        autoExecute: true,
        duration: '24h'
      };
    } else if (totalScore >= 40) {
      return {
        action: 'limit_usage',
        severity: 'medium',
        message: 'Limitar uso e monitorar - Risco médio',
        autoExecute: true,
        limits: { dailyTools: 50, aiGenerations: 20 }
      };
    } else if (totalScore >= 20) {
      return {
        action: 'monitor_closely',
        severity: 'low',
        message: 'Monitoramento próximo necessário - Risco baixo',
        autoExecute: false
      };
    } else {
      return {
        action: 'no_action',
        severity: 'none',
        message: 'Usuário dentro dos padrões normais',
        autoExecute: false
      };
    }
  }

  // 📊 DETERMINAR NÍVEL DE RISCO
  getRiskLevel(score) {
    if (score >= 80) return 'CRÍTICO';
    if (score >= 60) return 'ALTO';
    if (score >= 40) return 'MÉDIO';
    if (score >= 20) return 'BAIXO';
    return 'NORMAL';
  }

  // 🚨 EXECUTAR AÇÃO AUTOMÁTICA
  async executeAction(userId, action) {
    console.log(`🚨 Executando ação automática: ${action.action} para ${userId}`);

    try {
      switch (action.action) {
        case 'block_immediately':
          await this.blockUser(userId, 'Bloqueio automático por detecção de fraude');
          break;
        
        case 'suspend_temporarily':
          await this.suspendUser(userId, action.duration, 'Suspensão automática por atividade suspeita');
          break;
        
        case 'limit_usage':
          await this.limitUser(userId, action.limits, 'Limitação automática por uso anômalo');
          break;
        
        case 'monitor_closely':
          await this.flagForMonitoring(userId, 'Usuário marcado para monitoramento próximo');
          break;
      }

      // 📝 LOG DA AÇÃO
      await this.logFraudAction(userId, action);
      
      return { success: true, action: action.action };
      
    } catch (error) {
      console.error(`❌ Erro ao executar ação: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // 🚫 BLOQUEAR USUÁRIO
  async blockUser(userId, reason) {
    console.log(`🚫 Bloqueando usuário: ${userId}`);
    
    // 🔍 EM PRODUÇÃO: ATUALIZAR NO BANCO
    // await database.users.updateOne(
    //   { userId },
    //   { 
    //     $set: { 
    //       planStatus: 'blocked',
    //       blockedReason: reason,
    //       blockedAt: new Date(),
    //       blockedBy: 'fraud_detection_system'
    //     }
    //   }
    // );
    
    console.log(`✅ Usuário ${userId} bloqueado por: ${reason}`);
  }

  // ⏸️ SUSPENDER USUÁRIO TEMPORARIAMENTE
  async suspendUser(userId, duration, reason) {
    console.log(`⏸️ Suspendendo usuário: ${userId} por ${duration}`);
    
    const suspendUntil = new Date();
    if (duration === '24h') suspendUntil.setHours(suspendUntil.getHours() + 24);
    if (duration === '7d') suspendUntil.setDate(suspendUntil.getDate() + 7);
    
    // 🔍 EM PRODUÇÃO: ATUALIZAR NO BANCO
    console.log(`✅ Usuário ${userId} suspenso até: ${suspendUntil.toISOString()}`);
  }

  // 🔒 LIMITAR USUÁRIO
  async limitUser(userId, limits, reason) {
    console.log(`🔒 Limitando usuário: ${userId}`, limits);
    
    // 🔍 EM PRODUÇÃO: ATUALIZAR NO BANCO
    console.log(`✅ Usuário ${userId} limitado: ${JSON.stringify(limits)}`);
  }

  // 👁️ MARCAR PARA MONITORAMENTO
  async flagForMonitoring(userId, reason) {
    console.log(`👁️ Marcando para monitoramento: ${userId}`);
    
    // 🔍 EM PRODUÇÃO: ADICIONAR FLAG
    console.log(`✅ Usuário ${userId} marcado para monitoramento`);
  }

  // 📝 LOG DE AÇÕES DE FRAUDE
  async logFraudAction(userId, action) {
    const logEntry = {
      userId,
      action: action.action,
      severity: action.severity,
      timestamp: new Date().toISOString(),
      autoExecuted: action.autoExecute,
      reason: action.message
    };

    console.log("📝 Log de fraude:", logEntry);
    
    // 🔍 EM PRODUÇÃO: SALVAR NO BANCO
    // await database.fraudLogs.insertOne(logEntry);
  }
}

// 🚨 INSTÂNCIA GLOBAL DO SISTEMA
export const fraudDetection = new FraudDetectionSystem();

// 🔍 FUNÇÃO AUXILIAR PARA VERIFICAÇÃO RÁPIDA
export async function checkUserForFraud(user, context = {}) {
  return await fraudDetection.detectFraud(user, context);
}

// 🤖 FUNÇÃO PARA VERIFICAÇÃO AUTOMÁTICA
export async function autoCheckAndBlock(user, context = {}) {
  const analysis = await fraudDetection.detectFraud(user, context);
  
  if (analysis.recommendedAction.autoExecute) {
    await fraudDetection.executeAction(user.userId, analysis.recommendedAction);
  }
  
  return analysis;
}
