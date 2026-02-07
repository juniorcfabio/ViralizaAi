// 🌍 API GLOBAL - PLATAFORMA COMO SERVIÇO
class GlobalAPISystem {
  constructor() {
    this.apiClients = new Map();
    this.apiKeys = new Map();
    this.rateLimits = new Map();
    this.usage = new Map();
    this.endpoints = new Map();
    this.initializeGlobalAPI();
  }

  // 🚀 INICIALIZAR API GLOBAL
  initializeGlobalAPI() {
    this.setupAPIEndpoints();
    this.setupRateLimits();
    this.setupPricingTiers();
    console.log('🌍 API Global inicializada');
  }

  // 🔌 CONFIGURAR ENDPOINTS DA API
  setupAPIEndpoints() {
    const endpoints = [
      // 🤖 IA E CONTEÚDO
      {
        id: 'ai-content-generator',
        path: '/api/v1/ai/generate-content',
        method: 'POST',
        description: 'Gera conteúdo viral com IA',
        category: 'ai',
        pricing: 'per_request',
        cost: 0.10,
        rateLimit: { requests: 100, window: 3600 }
      },
      {
        id: 'hashtag-analyzer',
        path: '/api/v1/social/hashtags/analyze',
        method: 'POST',
        description: 'Analisa e otimiza hashtags',
        category: 'social',
        pricing: 'per_request',
        cost: 0.05,
        rateLimit: { requests: 200, window: 3600 }
      },
      {
        id: 'sentiment-analysis',
        path: '/api/v1/ai/sentiment',
        method: 'POST',
        description: 'Análise de sentimentos de texto',
        category: 'ai',
        pricing: 'per_request',
        cost: 0.03,
        rateLimit: { requests: 500, window: 3600 }
      },

      // 📊 ANALYTICS E MÉTRICAS
      {
        id: 'social-metrics',
        path: '/api/v1/analytics/social-metrics',
        method: 'GET',
        description: 'Métricas de redes sociais',
        category: 'analytics',
        pricing: 'per_request',
        cost: 0.02,
        rateLimit: { requests: 1000, window: 3600 }
      },
      {
        id: 'competitor-analysis',
        path: '/api/v1/analytics/competitors',
        method: 'POST',
        description: 'Análise de concorrentes',
        category: 'analytics',
        pricing: 'per_request',
        cost: 0.15,
        rateLimit: { requests: 50, window: 3600 }
      },

      // 🎨 DESIGN E MÍDIA
      {
        id: 'image-generator',
        path: '/api/v1/media/generate-image',
        method: 'POST',
        description: 'Geração de imagens com IA',
        category: 'media',
        pricing: 'per_request',
        cost: 0.20,
        rateLimit: { requests: 50, window: 3600 }
      },
      {
        id: 'video-editor',
        path: '/api/v1/media/edit-video',
        method: 'POST',
        description: 'Edição automática de vídeos',
        category: 'media',
        pricing: 'per_minute',
        cost: 0.50,
        rateLimit: { requests: 20, window: 3600 }
      },

      // 🛠️ FERRAMENTAS UTILITÁRIAS
      {
        id: 'url-shortener',
        path: '/api/v1/tools/shorten-url',
        method: 'POST',
        description: 'Encurtador de URLs',
        category: 'tools',
        pricing: 'per_request',
        cost: 0.01,
        rateLimit: { requests: 2000, window: 3600 }
      },
      {
        id: 'qr-generator',
        path: '/api/v1/tools/generate-qr',
        method: 'POST',
        description: 'Gerador de QR Codes',
        category: 'tools',
        pricing: 'per_request',
        cost: 0.01,
        rateLimit: { requests: 1000, window: 3600 }
      }
    ];

    endpoints.forEach(endpoint => this.endpoints.set(endpoint.id, endpoint));
  }

  // ⏱️ CONFIGURAR LIMITES DE TAXA
  setupRateLimits() {
    this.rateLimitTiers = {
      free: {
        requests_per_hour: 100,
        requests_per_day: 1000,
        requests_per_month: 10000
      },
      basic: {
        requests_per_hour: 1000,
        requests_per_day: 10000,
        requests_per_month: 100000
      },
      professional: {
        requests_per_hour: 5000,
        requests_per_day: 50000,
        requests_per_month: 1000000
      },
      enterprise: {
        requests_per_hour: 'unlimited',
        requests_per_day: 'unlimited',
        requests_per_month: 'unlimited'
      }
    };
  }

  // 💰 CONFIGURAR NÍVEIS DE PREÇOS
  setupPricingTiers() {
    this.pricingTiers = {
      free: {
        name: 'Free',
        monthlyFee: 0,
        includedRequests: 1000,
        overageRate: 0.001,
        features: ['Rate limiting', 'Basic support']
      },
      basic: {
        name: 'Basic',
        monthlyFee: 29,
        includedRequests: 10000,
        overageRate: 0.0008,
        features: ['Higher limits', 'Email support', 'Analytics dashboard']
      },
      professional: {
        name: 'Professional',
        monthlyFee: 99,
        includedRequests: 100000,
        overageRate: 0.0005,
        features: ['Priority support', 'Custom webhooks', 'Advanced analytics']
      },
      enterprise: {
        name: 'Enterprise',
        monthlyFee: 499,
        includedRequests: 'unlimited',
        overageRate: 0,
        features: ['Dedicated support', 'SLA', 'Custom integrations', 'White-label']
      }
    };
  }

  // 🔑 CRIAR CLIENTE DA API
  async createAPIClient(clientData) {
    try {
      const clientId = `api_${Date.now()}`;
      const apiKey = this.generateAPIKey();

      const client = {
        id: clientId,
        name: clientData.name,
        email: clientData.email,
        company: clientData.company,
        
        // 🔑 CREDENCIAIS
        apiKey,
        secretKey: this.generateSecretKey(),
        
        // 📊 PLANO E LIMITES
        tier: clientData.tier || 'free',
        status: 'active',
        
        // 💰 CONFIGURAÇÕES COMERCIAIS
        billing: {
          plan: clientData.tier || 'free',
          monthlyFee: this.pricingTiers[clientData.tier || 'free'].monthlyFee,
          currentUsage: 0,
          billingCycle: 'monthly',
          nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        
        // 📊 ESTATÍSTICAS DE USO
        usage: {
          totalRequests: 0,
          thisMonth: 0,
          thisDay: 0,
          thisHour: 0,
          lastRequest: null,
          popularEndpoints: {}
        },
        
        // ⚙️ CONFIGURAÇÕES
        settings: {
          webhookUrl: clientData.webhookUrl || null,
          ipWhitelist: clientData.ipWhitelist || [],
          allowedDomains: clientData.allowedDomains || [],
          customHeaders: clientData.customHeaders || {}
        },
        
        createdAt: new Date()
      };

      // 💾 SALVAR CLIENTE
      this.apiClients.set(clientId, client);
      this.apiKeys.set(apiKey, clientId);

      return {
        success: true,
        client: {
          id: clientId,
          apiKey,
          tier: client.tier,
          endpoints: this.getAvailableEndpoints(client.tier),
          documentation: 'https://api.viralizaai.com/docs'
        },
        message: 'Cliente da API criado com sucesso!'
      };

    } catch (error) {
      console.error('🚨 Erro ao criar cliente da API:', error);
      return { success: false, error: error.message };
    }
  }

  // 🔑 GERAR CHAVE API
  generateAPIKey() {
    return `vir_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  // 🔐 GERAR CHAVE SECRETA
  generateSecretKey() {
    return `sk_${Date.now()}_${Math.random().toString(36).substr(2, 32)}`;
  }

  // 🔍 VALIDAR CHAVE API
  async validateAPIKey(apiKey) {
    try {
      const clientId = this.apiKeys.get(apiKey);
      if (!clientId) {
        return { valid: false, error: 'API key inválida' };
      }

      const client = this.apiClients.get(clientId);
      if (!client || client.status !== 'active') {
        return { valid: false, error: 'Cliente inativo' };
      }

      return { valid: true, client };

    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // ⏱️ VERIFICAR RATE LIMIT
  async checkRateLimit(clientId, endpoint) {
    try {
      const client = this.apiClients.get(clientId);
      if (!client) {
        return { allowed: false, error: 'Cliente não encontrado' };
      }

      const limits = this.rateLimitTiers[client.tier];
      const endpointConfig = this.endpoints.get(endpoint);

      // 🔍 VERIFICAR LIMITES GERAIS
      if (limits.requests_per_hour !== 'unlimited' && 
          client.usage.thisHour >= limits.requests_per_hour) {
        return { 
          allowed: false, 
          error: 'Rate limit excedido (por hora)',
          resetTime: this.getNextHourReset()
        };
      }

      if (limits.requests_per_day !== 'unlimited' && 
          client.usage.thisDay >= limits.requests_per_day) {
        return { 
          allowed: false, 
          error: 'Rate limit excedido (por dia)',
          resetTime: this.getNextDayReset()
        };
      }

      // 🔍 VERIFICAR LIMITES ESPECÍFICOS DO ENDPOINT
      if (endpointConfig && endpointConfig.rateLimit) {
        const endpointUsage = client.usage.popularEndpoints[endpoint] || 0;
        if (endpointUsage >= endpointConfig.rateLimit.requests) {
          return { 
            allowed: false, 
            error: `Rate limit do endpoint ${endpoint} excedido`,
            resetTime: this.getEndpointReset(endpointConfig.rateLimit.window)
          };
        }
      }

      return { allowed: true };

    } catch (error) {
      return { allowed: false, error: error.message };
    }
  }

  // 📊 REGISTRAR USO DA API
  async recordAPIUsage(clientId, endpoint, cost = 0) {
    try {
      const client = this.apiClients.get(clientId);
      if (!client) return;

      // 📈 ATUALIZAR CONTADORES
      client.usage.totalRequests += 1;
      client.usage.thisMonth += 1;
      client.usage.thisDay += 1;
      client.usage.thisHour += 1;
      client.usage.lastRequest = new Date();

      // 📊 ATUALIZAR ENDPOINT ESPECÍFICO
      if (!client.usage.popularEndpoints[endpoint]) {
        client.usage.popularEndpoints[endpoint] = 0;
      }
      client.usage.popularEndpoints[endpoint] += 1;

      // 💰 ATUALIZAR CUSTOS
      client.billing.currentUsage += cost;

      // 💾 SALVAR
      this.apiClients.set(clientId, client);

      // 📊 REGISTRAR MÉTRICAS GLOBAIS
      await this.recordGlobalMetrics(endpoint, cost);

    } catch (error) {
      console.error('Erro ao registrar uso:', error);
    }
  }

  // 📊 REGISTRAR MÉTRICAS GLOBAIS
  async recordGlobalMetrics(endpoint, cost) {
    // EM PRODUÇÃO: Salvar em sistema de métricas
    console.log(`📊 API Usage: ${endpoint} - Cost: $${cost.toFixed(4)}`);
  }

  // 🔌 EXECUTAR ENDPOINT DA API
  async executeAPIEndpoint(endpointId, parameters, clientId) {
    try {
      const endpoint = this.endpoints.get(endpointId);
      if (!endpoint) {
        return { success: false, error: 'Endpoint não encontrado' };
      }

      // 🚀 EXECUTAR LÓGICA DO ENDPOINT
      const result = await this.executeEndpointLogic(endpointId, parameters);

      // 📊 REGISTRAR USO
      await this.recordAPIUsage(clientId, endpointId, endpoint.cost);

      return {
        success: true,
        data: result,
        endpoint: endpoint.path,
        cost: endpoint.cost,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`🚨 Erro no endpoint ${endpointId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // ⚙️ EXECUTAR LÓGICA DO ENDPOINT
  async executeEndpointLogic(endpointId, parameters) {
    // Simulação da execução dos endpoints
    switch (endpointId) {
      case 'ai-content-generator':
        return {
          content: "🔥 Conteúdo viral gerado por IA baseado em: " + parameters.topic,
          hashtags: ["#viral", "#ai", "#content"],
          engagement_score: 8.5
        };

      case 'hashtag-analyzer':
        return {
          hashtags: parameters.hashtags,
          analysis: {
            reach_potential: "500K - 1M",
            competition: "Medium",
            trending_score: 7.2
          }
        };

      case 'sentiment-analysis':
        return {
          text: parameters.text,
          sentiment: "positive",
          confidence: 0.87,
          emotions: ["joy", "excitement"]
        };

      case 'social-metrics':
        return {
          platform: parameters.platform,
          followers: 15420,
          engagement_rate: 4.2,
          reach: 89340,
          impressions: 156780
        };

      case 'image-generator':
        return {
          image_url: "https://api.viralizaai.com/generated/image_123.jpg",
          prompt: parameters.prompt,
          style: parameters.style || "realistic",
          dimensions: "1024x1024"
        };

      default:
        return { message: `Endpoint ${endpointId} executado com sucesso` };
    }
  }

  // 📋 OBTER ENDPOINTS DISPONÍVEIS
  getAvailableEndpoints(tier = 'free') {
    const endpoints = Array.from(this.endpoints.values());
    
    // 🔒 FILTRAR POR TIER (se necessário)
    return endpoints.map(endpoint => ({
      id: endpoint.id,
      path: endpoint.path,
      method: endpoint.method,
      description: endpoint.description,
      category: endpoint.category,
      cost: endpoint.cost,
      rateLimit: endpoint.rateLimit
    }));
  }

  // ⏰ OBTER PRÓXIMO RESET (HORA)
  getNextHourReset() {
    const now = new Date();
    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
    return nextHour;
  }

  // ⏰ OBTER PRÓXIMO RESET (DIA)
  getNextDayReset() {
    const now = new Date();
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return nextDay;
  }

  // ⏰ OBTER RESET DO ENDPOINT
  getEndpointReset(windowSeconds) {
    return new Date(Date.now() + windowSeconds * 1000);
  }

  // 📊 OBTER ESTATÍSTICAS DO CLIENTE
  getClientStats(clientId) {
    const client = this.apiClients.get(clientId);
    if (!client) return null;

    return {
      id: clientId,
      tier: client.tier,
      usage: client.usage,
      billing: client.billing,
      topEndpoints: Object.entries(client.usage.popularEndpoints)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([endpoint, count]) => ({ endpoint, count }))
    };
  }

  // 📊 OBTER ESTATÍSTICAS GLOBAIS
  getGlobalAPIStats() {
    const clients = Array.from(this.apiClients.values());
    const activeClients = clients.filter(c => c.status === 'active');
    
    return {
      totalClients: clients.length,
      activeClients: activeClients.length,
      totalRequests: activeClients.reduce((sum, c) => sum + c.usage.totalRequests, 0),
      totalRevenue: activeClients.reduce((sum, c) => sum + c.billing.currentUsage, 0),
      averageRequestsPerClient: activeClients.length > 0 ? 
        activeClients.reduce((sum, c) => sum + c.usage.totalRequests, 0) / activeClients.length : 0,
      topEndpoints: this.getTopEndpoints(),
      tierDistribution: this.getTierDistribution(activeClients)
    };
  }

  // 🔝 OBTER ENDPOINTS MAIS USADOS
  getTopEndpoints() {
    const endpointUsage = {};
    
    for (const client of this.apiClients.values()) {
      for (const [endpoint, count] of Object.entries(client.usage.popularEndpoints)) {
        endpointUsage[endpoint] = (endpointUsage[endpoint] || 0) + count;
      }
    }
    
    return Object.entries(endpointUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  // 📊 OBTER DISTRIBUIÇÃO POR TIER
  getTierDistribution(clients) {
    const distribution = {};
    
    for (const client of clients) {
      distribution[client.tier] = (distribution[client.tier] || 0) + 1;
    }
    
    return distribution;
  }
}

// 🚀 INSTÂNCIA GLOBAL
const globalAPI = new GlobalAPISystem();

export { globalAPI, GlobalAPISystem };
