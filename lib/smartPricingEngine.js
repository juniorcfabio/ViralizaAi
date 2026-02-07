// 💰 MOTOR DE PREÇOS INTELIGENTES - PREÇOS DINÂMICOS AUTOMÁTICOS
class SmartPricingEngine {
  constructor() {
    this.basePrices = {
      basico: 29.90,
      pro: 79.90,
      premium: 149.90
    };
    
    this.pricingFactors = this.initializePricingFactors();
    this.marketData = new Map();
    this.userBehaviorData = new Map();
  }

  // 🎯 FATORES DE PRECIFICAÇÃO
  initializePricingFactors() {
    return {
      // 🌍 FATORES GEOGRÁFICOS
      geographic: {
        'US': 1.5,    // Estados Unidos - maior poder de compra
        'CA': 1.4,    // Canadá
        'GB': 1.3,    // Reino Unido
        'AU': 1.3,    // Austrália
        'DE': 1.2,    // Alemanha
        'FR': 1.2,    // França
        'BR': 1.0,    // Brasil - base
        'MX': 0.8,    // México
        'AR': 0.7,    // Argentina
        'IN': 0.6,    // Índia
        'PH': 0.5     // Filipinas
      },

      // 📊 FATORES DE DEMANDA
      demand: {
        very_high: 1.3,  // Demanda muito alta
        high: 1.15,      // Demanda alta
        normal: 1.0,     // Demanda normal
        low: 0.9,        // Demanda baixa
        very_low: 0.8    // Demanda muito baixa
      },

      // 👤 FATORES COMPORTAMENTAIS
      behavior: {
        power_user: 1.2,      // Usuário intensivo
        regular_user: 1.0,    // Usuário regular
        casual_user: 0.95,    // Usuário casual
        at_risk: 0.7,         // Risco de cancelamento
        new_user: 0.85       // Usuário novo (desconto de aquisição)
      },

      // ⏰ FATORES TEMPORAIS
      temporal: {
        peak_hours: 1.1,      // Horários de pico
        weekend: 1.05,        // Final de semana
        holiday: 0.9,         // Feriados (promoção)
        end_of_month: 1.15,   // Final do mês (urgência)
        black_friday: 0.6     // Black Friday
      },

      // 🎯 FATORES DE CONVERSÃO
      conversion: {
        high_intent: 1.1,     // Alta intenção de compra
        medium_intent: 1.0,   // Média intenção
        low_intent: 0.9,      // Baixa intenção
        price_sensitive: 0.8, // Sensível a preço
        premium_seeker: 1.3   // Busca premium
      }
    };
  }

  // 🧮 CALCULAR PREÇO DINÂMICO
  async calculateDynamicPrice(planType, userContext) {
    try {
      const basePrice = this.basePrices[planType];
      if (!basePrice) {
        throw new Error(`Plano ${planType} não encontrado`);
      }

      let finalPrice = basePrice;
      const appliedFactors = [];

      // 🌍 FATOR GEOGRÁFICO
      const geoFactor = this.getGeographicFactor(userContext.country);
      finalPrice *= geoFactor;
      appliedFactors.push({ type: 'geographic', factor: geoFactor, country: userContext.country });

      // 📊 FATOR DE DEMANDA
      const demandFactor = await this.getDemandFactor(planType);
      finalPrice *= demandFactor;
      appliedFactors.push({ type: 'demand', factor: demandFactor });

      // 👤 FATOR COMPORTAMENTAL
      const behaviorFactor = this.getBehaviorFactor(userContext);
      finalPrice *= behaviorFactor;
      appliedFactors.push({ type: 'behavior', factor: behaviorFactor });

      // ⏰ FATOR TEMPORAL
      const temporalFactor = this.getTemporalFactor();
      finalPrice *= temporalFactor;
      appliedFactors.push({ type: 'temporal', factor: temporalFactor });

      // 🎯 FATOR DE CONVERSÃO
      const conversionFactor = this.getConversionFactor(userContext);
      finalPrice *= conversionFactor;
      appliedFactors.push({ type: 'conversion', factor: conversionFactor });

      // 🔒 LIMITES DE PREÇO (não pode ser muito baixo ou muito alto)
      const minPrice = basePrice * 0.5;  // Mínimo 50% do preço base
      const maxPrice = basePrice * 2.0;  // Máximo 200% do preço base
      
      finalPrice = Math.max(minPrice, Math.min(maxPrice, finalPrice));

      // 💰 ARREDONDAR PARA VALORES "PSICOLÓGICOS"
      finalPrice = this.applyPsychologicalPricing(finalPrice);

      // 📊 REGISTRAR PARA ANALYTICS
      await this.logPricingDecision(userContext.userId, planType, basePrice, finalPrice, appliedFactors);

      return {
        originalPrice: basePrice,
        finalPrice: finalPrice,
        discount: basePrice > finalPrice ? ((basePrice - finalPrice) / basePrice * 100).toFixed(1) : 0,
        premium: finalPrice > basePrice ? ((finalPrice - basePrice) / basePrice * 100).toFixed(1) : 0,
        appliedFactors,
        validUntil: new Date(Date.now() + 30 * 60 * 1000) // Válido por 30 minutos
      };

    } catch (error) {
      console.error('🚨 Erro no cálculo de preço dinâmico:', error);
      return {
        originalPrice: this.basePrices[planType],
        finalPrice: this.basePrices[planType],
        discount: 0,
        premium: 0,
        appliedFactors: [],
        error: error.message
      };
    }
  }

  // 🌍 OBTER FATOR GEOGRÁFICO
  getGeographicFactor(country) {
    return this.pricingFactors.geographic[country] || 1.0;
  }

  // 📊 OBTER FATOR DE DEMANDA
  async getDemandFactor(planType) {
    try {
      // Simular análise de demanda em tempo real
      const currentHour = new Date().getHours();
      const dayOfWeek = new Date().getDay();
      
      // Horários de pico (9-11h e 14-16h)
      const isPeakHour = (currentHour >= 9 && currentHour <= 11) || 
                        (currentHour >= 14 && currentHour <= 16);
      
      // Final de semana tem menos demanda
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      if (isPeakHour && !isWeekend) {
        return this.pricingFactors.demand.high;
      } else if (isWeekend) {
        return this.pricingFactors.demand.low;
      }
      
      return this.pricingFactors.demand.normal;
      
    } catch (error) {
      return this.pricingFactors.demand.normal;
    }
  }

  // 👤 OBTER FATOR COMPORTAMENTAL
  getBehaviorFactor(userContext) {
    // Analisar comportamento do usuário
    const {
      usageIntensity = 'regular',
      churnRisk = false,
      isNewUser = false,
      daysSinceLastLogin = 0
    } = userContext;

    if (churnRisk) {
      return this.pricingFactors.behavior.at_risk;
    }

    if (isNewUser) {
      return this.pricingFactors.behavior.new_user;
    }

    if (usageIntensity === 'high' || daysSinceLastLogin <= 1) {
      return this.pricingFactors.behavior.power_user;
    }

    if (daysSinceLastLogin > 7) {
      return this.pricingFactors.behavior.casual_user;
    }

    return this.pricingFactors.behavior.regular_user;
  }

  // ⏰ OBTER FATOR TEMPORAL
  getTemporalFactor() {
    const now = new Date();
    const hour = now.getHours();
    const dayOfMonth = now.getDate();
    const month = now.getMonth();
    const dayOfWeek = now.getDay();

    // Black Friday (novembro)
    if (month === 10 && dayOfMonth >= 20 && dayOfMonth <= 30) {
      return this.pricingFactors.temporal.black_friday;
    }

    // Final do mês (urgência)
    if (dayOfMonth >= 28) {
      return this.pricingFactors.temporal.end_of_month;
    }

    // Final de semana
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return this.pricingFactors.temporal.weekend;
    }

    // Horários de pico
    if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
      return this.pricingFactors.temporal.peak_hours;
    }

    return 1.0;
  }

  // 🎯 OBTER FATOR DE CONVERSÃO
  getConversionFactor(userContext) {
    const {
      pageViews = 1,
      timeOnSite = 0,
      previousPurchases = 0,
      referralSource = 'direct'
    } = userContext;

    // Alta intenção: muitas páginas vistas, tempo no site alto
    if (pageViews >= 5 && timeOnSite >= 300) { // 5+ páginas e 5+ minutos
      return this.pricingFactors.conversion.high_intent;
    }

    // Usuário premium: já fez compras antes
    if (previousPurchases > 0) {
      return this.pricingFactors.conversion.premium_seeker;
    }

    // Sensível a preço: veio de comparador de preços
    if (referralSource.includes('price') || referralSource.includes('deal')) {
      return this.pricingFactors.conversion.price_sensitive;
    }

    // Baixa intenção: pouco engajamento
    if (pageViews <= 2 && timeOnSite <= 60) {
      return this.pricingFactors.conversion.low_intent;
    }

    return this.pricingFactors.conversion.medium_intent;
  }

  // 💰 APLICAR PRECIFICAÇÃO PSICOLÓGICA
  applyPsychologicalPricing(price) {
    // Arredondar para valores "psicológicos" (.90, .95, .99)
    const rounded = Math.round(price);
    
    if (price < 50) {
      return rounded - 0.01; // R$ 49.99
    } else if (price < 100) {
      return rounded - 0.10; // R$ 99.90
    } else {
      return rounded - 0.01; // R$ 149.99
    }
  }

  // 📊 REGISTRAR DECISÃO DE PREÇO
  async logPricingDecision(userId, planType, originalPrice, finalPrice, factors) {
    try {
      const logEntry = {
        userId,
        planType,
        originalPrice,
        finalPrice,
        factors,
        timestamp: new Date(),
        priceChange: ((finalPrice - originalPrice) / originalPrice * 100).toFixed(2)
      };

      // EM PRODUÇÃO: Salvar no banco de dados
      console.log('💰 Decisão de preço:', logEntry);
      
      // await db.pricing_logs.create({ data: logEntry });
      
    } catch (error) {
      console.error('Erro ao registrar decisão de preço:', error);
    }
  }

  // 📈 OBTER PREÇOS PARA TODOS OS PLANOS
  async getAllPlanPrices(userContext) {
    const plans = ['basico', 'pro', 'premium'];
    const prices = {};

    for (const plan of plans) {
      prices[plan] = await this.calculateDynamicPrice(plan, userContext);
    }

    return prices;
  }

  // 🎯 OTIMIZAR PREÇOS BASEADO EM CONVERSÕES
  async optimizePricesBasedOnConversions() {
    try {
      // Analisar conversões das últimas 24 horas
      const conversionData = await this.getConversionData();
      
      // Ajustar fatores baseado na performance
      for (const [planType, data] of Object.entries(conversionData)) {
        if (data.conversionRate < 0.02) { // Menos de 2%
          // Reduzir preços
          this.adjustPricingFactor(planType, 'demand', 0.95);
        } else if (data.conversionRate > 0.05) { // Mais de 5%
          // Aumentar preços
          this.adjustPricingFactor(planType, 'demand', 1.05);
        }
      }

      console.log('✅ Preços otimizados baseado em conversões');
      
    } catch (error) {
      console.error('Erro na otimização de preços:', error);
    }
  }

  // 📊 OBTER DADOS DE CONVERSÃO
  async getConversionData() {
    // EM PRODUÇÃO: Buscar dados reais do banco
    return {
      basico: { views: 1000, conversions: 25, conversionRate: 0.025 },
      pro: { views: 800, conversions: 32, conversionRate: 0.04 },
      premium: { views: 400, conversions: 12, conversionRate: 0.03 }
    };
  }

  // ⚙️ AJUSTAR FATOR DE PRECIFICAÇÃO
  adjustPricingFactor(planType, factorType, adjustment) {
    // Aplicar ajuste gradual
    if (this.pricingFactors[factorType]) {
      for (const key in this.pricingFactors[factorType]) {
        this.pricingFactors[factorType][key] *= adjustment;
      }
    }
  }

  // 📊 OBTER ESTATÍSTICAS DE PRECIFICAÇÃO
  getPricingStats() {
    return {
      basePrices: this.basePrices,
      activePricingFactors: this.pricingFactors,
      totalPriceCalculations: this.marketData.size,
      averageDiscount: this.calculateAverageDiscount(),
      uptime: process.uptime()
    };
  }

  // 💹 CALCULAR DESCONTO MÉDIO
  calculateAverageDiscount() {
    // Simular cálculo de desconto médio
    return '12.5%';
  }
}

// 🚀 INSTÂNCIA GLOBAL
const smartPricing = new SmartPricingEngine();

// 🔄 OTIMIZAÇÃO AUTOMÁTICA A CADA HORA
setInterval(() => {
  smartPricing.optimizePricesBasedOnConversions();
}, 60 * 60 * 1000);

export { smartPricing, SmartPricingEngine };
