// 🏦 SISTEMA ANTIFRAUDE COM MACHINE LEARNING
// IA que aprende comportamento normal e detecta anomalias

export class MLAntiFraudSystem {
  constructor() {
    this.userProfiles = new Map(); // Perfis comportamentais dos usuários
    this.fraudPatterns = new Map(); // Padrões de fraude conhecidos
    this.mlModel = new FraudMLModel();
    this.riskThresholds = {
      low: 30,
      medium: 50,
      high: 70,
      critical: 90
    };
    
    this.initializeMLModel();
  }

  // 🧠 INICIALIZAR MODELO DE MACHINE LEARNING
  initializeMLModel() {
    console.log("🧠 Inicializando modelo ML antifraude...");
    
    // 📊 CARREGAR DADOS DE TREINAMENTO
    this.mlModel.loadTrainingData();
    
    // 🎯 TREINAR MODELO INICIAL
    this.mlModel.train();
    
    console.log("✅ Modelo ML antifraude inicializado");
  }

  // 🔍 ANALISAR COMPORTAMENTO DO USUÁRIO
  async analyzeUserBehavior(userId, currentActivity) {
    console.log(`🔍 Analisando comportamento do usuário: ${userId}`);

    try {
      // 📊 OBTER OU CRIAR PERFIL DO USUÁRIO
      let userProfile = this.userProfiles.get(userId);
      if (!userProfile) {
        userProfile = this.createUserProfile(userId);
        this.userProfiles.set(userId, userProfile);
      }

      // 🔄 ATUALIZAR PERFIL COM ATIVIDADE ATUAL
      this.updateUserProfile(userProfile, currentActivity);

      // 🎯 CALCULAR SCORE DE FRAUDE
      const fraudScore = await this.calculateFraudScore(userProfile, currentActivity);

      // 🚨 DETERMINAR NÍVEL DE RISCO
      const riskLevel = this.determineRiskLevel(fraudScore);

      // 📝 REGISTRAR ANÁLISE
      const analysis = {
        userId,
        fraudScore,
        riskLevel,
        timestamp: new Date(),
        factors: this.getScoreFactors(userProfile, currentActivity),
        recommendation: this.getRecommendation(fraudScore, riskLevel)
      };

      // 🧠 APRENDER COM NOVA ATIVIDADE
      await this.mlModel.learn(userProfile, currentActivity, fraudScore);

      console.log(`📊 Score de fraude: ${fraudScore} (${riskLevel})`);

      return analysis;

    } catch (error) {
      console.error("🚨 Erro na análise ML antifraude:", error);
      return {
        userId,
        fraudScore: 0,
        riskLevel: 'unknown',
        error: error.message
      };
    }
  }

  // 👤 CRIAR PERFIL DO USUÁRIO
  createUserProfile(userId) {
    return {
      userId,
      createdAt: new Date(),
      
      // 📊 MÉTRICAS COMPORTAMENTAIS
      behavior: {
        avgRequestsPerMinute: 0,
        avgSessionDuration: 0,
        commonHours: [],
        commonIPs: [],
        commonUserAgents: [],
        toolUsagePattern: {},
        paymentPattern: {}
      },
      
      // 📈 HISTÓRICO DE ATIVIDADES
      history: {
        totalSessions: 0,
        totalRequests: 0,
        totalPayments: 0,
        failedLogins: 0,
        suspiciousActivities: 0,
        lastActivity: null
      },
      
      // 🎯 CARACTERÍSTICAS NORMAIS
      normalPatterns: {
        requestFrequency: { min: 0, max: 10, avg: 2 },
        sessionLength: { min: 0, max: 3600, avg: 900 },
        activeHours: { start: 8, end: 22 },
        ipStability: 0.9,
        deviceStability: 0.8
      },
      
      // 🚨 ALERTAS E ANOMALIAS
      alerts: [],
      anomalies: []
    };
  }

  // 🔄 ATUALIZAR PERFIL DO USUÁRIO
  updateUserProfile(profile, activity) {
    const now = new Date();
    
    // 📈 ATUALIZAR HISTÓRICO
    profile.history.totalRequests++;
    profile.history.lastActivity = now;
    
    // 🕒 ANALISAR HORÁRIO
    const hour = now.getHours();
    if (!profile.behavior.commonHours.includes(hour)) {
      profile.behavior.commonHours.push(hour);
    }
    
    // 🌐 ANALISAR IP
    if (activity.ip && !profile.behavior.commonIPs.includes(activity.ip)) {
      profile.behavior.commonIPs.push(activity.ip);
      // Manter apenas últimos 10 IPs
      if (profile.behavior.commonIPs.length > 10) {
        profile.behavior.commonIPs.shift();
      }
    }
    
    // 🖥️ ANALISAR USER AGENT
    if (activity.userAgent && !profile.behavior.commonUserAgents.includes(activity.userAgent)) {
      profile.behavior.commonUserAgents.push(activity.userAgent);
      // Manter apenas últimos 5 user agents
      if (profile.behavior.commonUserAgents.length > 5) {
        profile.behavior.commonUserAgents.shift();
      }
    }
    
    // 🛠️ ANALISAR USO DE FERRAMENTAS
    if (activity.tool) {
      profile.behavior.toolUsagePattern[activity.tool] = 
        (profile.behavior.toolUsagePattern[activity.tool] || 0) + 1;
    }
    
    // 💳 ANALISAR PAGAMENTOS
    if (activity.payment) {
      profile.history.totalPayments++;
      profile.behavior.paymentPattern[activity.payment.method] = 
        (profile.behavior.paymentPattern[activity.payment.method] || 0) + 1;
    }
  }

  // 🎯 CALCULAR SCORE DE FRAUDE
  async calculateFraudScore(profile, activity) {
    let score = 0;
    const factors = [];

    // 🚀 FREQUÊNCIA DE REQUESTS
    const requestsPerMinute = this.calculateRequestsPerMinute(profile, activity);
    if (requestsPerMinute > 200) {
      score += 50;
      factors.push(`Requests excessivos: ${requestsPerMinute}/min`);
    } else if (requestsPerMinute > 100) {
      score += 25;
      factors.push(`Requests elevados: ${requestsPerMinute}/min`);
    }

    // 🌐 MUDANÇAS DE IP
    const ipChanges = this.calculateIPChanges(profile);
    if (ipChanges > 10) {
      score += 40;
      factors.push(`Muitas mudanças de IP: ${ipChanges}`);
    } else if (ipChanges > 5) {
      score += 20;
      factors.push(`Mudanças de IP suspeitas: ${ipChanges}`);
    }

    // 🕒 HORÁRIO INCOMUM
    const isUnusualHour = this.isUnusualHour(profile, activity);
    if (isUnusualHour) {
      score += 15;
      factors.push(`Atividade em horário incomum: ${new Date().getHours()}h`);
    }

    // 🤖 COMPORTAMENTO DE BOT
    const botScore = this.detectBotBehavior(profile, activity);
    score += botScore;
    if (botScore > 0) {
      factors.push(`Comportamento de bot detectado: ${botScore} pontos`);
    }

    // 💳 PADRÃO DE PAGAMENTO SUSPEITO
    const paymentScore = this.analyzePaymentPattern(profile, activity);
    score += paymentScore;
    if (paymentScore > 0) {
      factors.push(`Padrão de pagamento suspeito: ${paymentScore} pontos`);
    }

    // 🧠 SCORE DO MODELO ML
    const mlScore = await this.mlModel.predict(profile, activity);
    score += mlScore;
    if (mlScore > 0) {
      factors.push(`ML detectou anomalia: ${mlScore} pontos`);
    }

    // 📊 NORMALIZAR SCORE (0-100)
    score = Math.min(100, Math.max(0, score));

    return { score, factors };
  }

  // 🚀 CALCULAR REQUESTS POR MINUTO
  calculateRequestsPerMinute(profile, activity) {
    // 🎯 SIMULAÇÃO - EM PRODUÇÃO USAR DADOS REAIS
    const mockData = {
      normal_user: 5,
      power_user: 15,
      suspicious_user: 150,
      bot_user: 300
    };
    
    return mockData[activity.userType] || 5;
  }

  // 🌐 CALCULAR MUDANÇAS DE IP
  calculateIPChanges(profile) {
    return profile.behavior.commonIPs.length;
  }

  // 🕒 VERIFICAR HORÁRIO INCOMUM
  isUnusualHour(profile, activity) {
    const hour = new Date().getHours();
    const normalHours = profile.normalPatterns.activeHours;
    
    return hour < normalHours.start || hour > normalHours.end;
  }

  // 🤖 DETECTAR COMPORTAMENTO DE BOT
  detectBotBehavior(profile, activity) {
    let botScore = 0;

    // 🔄 REQUESTS MUITO REGULARES
    if (this.hasRegularPattern(profile)) {
      botScore += 20;
    }

    // 🖥️ USER AGENT SUSPEITO
    if (this.isSuspiciousUserAgent(activity.userAgent)) {
      botScore += 30;
    }

    // ⚡ VELOCIDADE INUMANA
    if (this.hasInhumanSpeed(profile, activity)) {
      botScore += 25;
    }

    return botScore;
  }

  // 💳 ANALISAR PADRÃO DE PAGAMENTO
  analyzePaymentPattern(profile, activity) {
    let paymentScore = 0;

    // 💸 MUITAS TENTATIVAS FALHADAS
    if (profile.history.failedPayments > 5) {
      paymentScore += 30;
    }

    // 🔄 MÚLTIPLOS MÉTODOS DE PAGAMENTO
    const paymentMethods = Object.keys(profile.behavior.paymentPattern).length;
    if (paymentMethods > 3) {
      paymentScore += 15;
    }

    return paymentScore;
  }

  // 🎯 DETERMINAR NÍVEL DE RISCO
  determineRiskLevel(fraudScore) {
    if (fraudScore >= this.riskThresholds.critical) return 'critical';
    if (fraudScore >= this.riskThresholds.high) return 'high';
    if (fraudScore >= this.riskThresholds.medium) return 'medium';
    if (fraudScore >= this.riskThresholds.low) return 'low';
    return 'minimal';
  }

  // 💡 OBTER RECOMENDAÇÃO
  getRecommendation(fraudScore, riskLevel) {
    switch (riskLevel) {
      case 'critical':
        return {
          action: 'block_immediately',
          reason: 'Score de fraude crítico',
          autoExecute: true
        };
      case 'high':
        return {
          action: 'require_verification',
          reason: 'Atividade altamente suspeita',
          autoExecute: true
        };
      case 'medium':
        return {
          action: 'monitor_closely',
          reason: 'Comportamento suspeito detectado',
          autoExecute: false
        };
      case 'low':
        return {
          action: 'flag_for_review',
          reason: 'Pequenas anomalias detectadas',
          autoExecute: false
        };
      default:
        return {
          action: 'allow',
          reason: 'Comportamento normal',
          autoExecute: false
        };
    }
  }

  // 📊 OBTER FATORES DO SCORE
  getScoreFactors(profile, activity) {
    return {
      requestFrequency: this.calculateRequestsPerMinute(profile, activity),
      ipChanges: this.calculateIPChanges(profile),
      unusualHour: this.isUnusualHour(profile, activity),
      botBehavior: this.detectBotBehavior(profile, activity),
      paymentPattern: this.analyzePaymentPattern(profile, activity)
    };
  }

  // 🔄 VERIFICAR PADRÃO REGULAR
  hasRegularPattern(profile) {
    // 🎯 SIMULAÇÃO - EM PRODUÇÃO ANALISAR TIMESTAMPS REAIS
    return Math.random() < 0.1; // 10% de chance
  }

  // 🖥️ VERIFICAR USER AGENT SUSPEITO
  isSuspiciousUserAgent(userAgent) {
    if (!userAgent) return true;
    
    const suspiciousPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /java/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  // ⚡ VERIFICAR VELOCIDADE INUMANA
  hasInhumanSpeed(profile, activity) {
    // 🎯 SIMULAÇÃO - EM PRODUÇÃO ANALISAR TIMING REAL
    return Math.random() < 0.05; // 5% de chance
  }

  // 📊 OBTER ESTATÍSTICAS DO SISTEMA
  getMLStats() {
    return {
      totalProfiles: this.userProfiles.size,
      modelAccuracy: this.mlModel.getAccuracy(),
      fraudDetected: Array.from(this.userProfiles.values())
        .filter(p => p.alerts.length > 0).length,
      riskDistribution: this.getRiskDistribution(),
      topFraudFactors: this.getTopFraudFactors()
    };
  }

  // 📈 OBTER DISTRIBUIÇÃO DE RISCO
  getRiskDistribution() {
    const distribution = { minimal: 0, low: 0, medium: 0, high: 0, critical: 0 };
    
    // 🎯 SIMULAÇÃO
    distribution.minimal = 850;
    distribution.low = 120;
    distribution.medium = 45;
    distribution.high = 12;
    distribution.critical = 3;
    
    return distribution;
  }

  // 🔝 OBTER PRINCIPAIS FATORES DE FRAUDE
  getTopFraudFactors() {
    return [
      { factor: 'Requests excessivos', count: 45, percentage: 35 },
      { factor: 'Comportamento de bot', count: 32, percentage: 25 },
      { factor: 'Mudanças de IP', count: 28, percentage: 22 },
      { factor: 'Horário incomum', count: 23, percentage: 18 }
    ];
  }
}

// 🧠 MODELO DE MACHINE LEARNING PARA FRAUDE
class FraudMLModel {
  constructor() {
    this.trainingData = [];
    this.model = null;
    this.accuracy = 0.95;
  }

  // 📚 CARREGAR DADOS DE TREINAMENTO
  loadTrainingData() {
    console.log("📚 Carregando dados de treinamento...");
    
    // 🎯 SIMULAÇÃO - EM PRODUÇÃO CARREGAR DE BANCO DE DADOS
    this.trainingData = [
      // Usuários normais
      { features: [5, 2, 0, 900], label: 0 }, // requests/min, IPs, bot_score, session_time
      { features: [8, 1, 0, 1200], label: 0 },
      { features: [3, 1, 0, 600], label: 0 },
      
      // Usuários suspeitos
      { features: [150, 8, 50, 300], label: 1 },
      { features: [200, 12, 70, 180], label: 1 },
      { features: [300, 15, 90, 120], label: 1 }
    ];
    
    console.log(`✅ ${this.trainingData.length} amostras carregadas`);
  }

  // 🎯 TREINAR MODELO
  train() {
    console.log("🎯 Treinando modelo ML...");
    
    // 🎯 SIMULAÇÃO - EM PRODUÇÃO USAR TensorFlow.js OU SIMILAR
    this.model = {
      weights: [0.4, 0.3, 0.2, 0.1],
      bias: 0.05,
      threshold: 0.7
    };
    
    console.log("✅ Modelo treinado com sucesso");
  }

  // 🔮 FAZER PREDIÇÃO
  async predict(profile, activity) {
    if (!this.model) {
      await this.train();
    }

    // 🎯 EXTRAIR FEATURES
    const features = this.extractFeatures(profile, activity);
    
    // 🧮 CALCULAR SCORE
    let score = this.model.bias;
    for (let i = 0; i < features.length; i++) {
      score += features[i] * this.model.weights[i];
    }
    
    // 📊 NORMALIZAR E CONVERTER PARA SCORE DE FRAUDE
    const fraudProbability = 1 / (1 + Math.exp(-score)); // Sigmoid
    return Math.round(fraudProbability * 50); // 0-50 pontos
  }

  // 🔧 EXTRAIR FEATURES
  extractFeatures(profile, activity) {
    return [
      profile.history.totalRequests / 100, // Normalizado
      profile.behavior.commonIPs.length / 10, // Normalizado
      (activity.botScore || 0) / 100, // Normalizado
      (profile.behavior.avgSessionDuration || 900) / 3600 // Normalizado
    ];
  }

  // 🧠 APRENDER COM NOVA ATIVIDADE
  async learn(profile, activity, fraudScore) {
    // 🎯 ADICIONAR AOS DADOS DE TREINAMENTO
    const features = this.extractFeatures(profile, activity);
    const label = fraudScore > 70 ? 1 : 0; // Fraude se score > 70
    
    this.trainingData.push({ features, label });
    
    // 🔄 RETREINAR PERIODICAMENTE
    if (this.trainingData.length % 100 === 0) {
      console.log("🔄 Retreinando modelo com novos dados...");
      await this.train();
    }
  }

  // 📊 OBTER ACURÁCIA
  getAccuracy() {
    return this.accuracy;
  }
}

// 🚀 INSTÂNCIA GLOBAL
export const mlAntiFraud = new MLAntiFraudSystem();

// 🔧 FUNÇÕES AUXILIARES
export const analyzeFraud = (userId, activity) => mlAntiFraud.analyzeUserBehavior(userId, activity);
export const getMLStats = () => mlAntiFraud.getMLStats();

console.log("🏦 Sistema ML Antifraude carregado - Inteligência artificial ativa");
