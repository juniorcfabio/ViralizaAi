// 🛒 MARKETPLACE INTERNO - ECOSSISTEMA DE FERRAMENTAS
class MarketplaceSystem {
  constructor() {
    this.tools = new Map();
    this.categories = new Map();
    this.userPurchases = new Map();
    this.initializeMarketplace();
  }

  // 🚀 INICIALIZAR MARKETPLACE
  initializeMarketplace() {
    this.setupCategories();
    this.setupDefaultTools();
  }

  // 📂 CONFIGURAR CATEGORIAS
  setupCategories() {
    const categories = [
      {
        id: 'content-creation',
        name: '✍️ Criação de Conteúdo',
        description: 'Ferramentas para criar conteúdo viral',
        icon: '✍️'
      },
      {
        id: 'social-media',
        name: '📱 Redes Sociais',
        description: 'Automação e gestão de redes sociais',
        icon: '📱'
      },
      {
        id: 'analytics',
        name: '📊 Analytics',
        description: 'Análise e métricas avançadas',
        icon: '📊'
      },
      {
        id: 'automation',
        name: '🤖 Automação',
        description: 'Ferramentas de automação inteligente',
        icon: '🤖'
      },
      {
        id: 'design',
        name: '🎨 Design',
        description: 'Criação visual e design gráfico',
        icon: '🎨'
      },
      {
        id: 'video',
        name: '🎬 Vídeo',
        description: 'Edição e criação de vídeos',
        icon: '🎬'
      }
    ];

    categories.forEach(cat => this.categories.set(cat.id, cat));
  }

  // 🛠️ CONFIGURAR FERRAMENTAS PADRÃO
  setupDefaultTools() {
    const defaultTools = [
      {
        id: 'viral-post-generator',
        name: 'Gerador de Posts Virais',
        description: 'IA que cria posts com potencial viral para qualquer nicho',
        category: 'content-creation',
        price: 19.90,
        icon: '🔥',
        features: ['IA GPT-4', 'Templates virais', 'Análise de tendências'],
        minPlan: 'basico',
        popularity: 95,
        rating: 4.8,
        totalSales: 1247
      },
      {
        id: 'hashtag-optimizer',
        name: 'Otimizador de Hashtags',
        description: 'Encontra as melhores hashtags para maximizar alcance',
        category: 'social-media',
        price: 14.90,
        icon: '#️⃣',
        features: ['Análise de tendências', 'Hashtags por nicho', 'Métricas de performance'],
        minPlan: 'basico',
        popularity: 87,
        rating: 4.6,
        totalSales: 892
      },
      {
        id: 'competitor-analyzer',
        name: 'Analisador de Concorrentes',
        description: 'Monitora e analisa estratégias dos concorrentes',
        category: 'analytics',
        price: 39.90,
        icon: '🔍',
        features: ['Monitoramento 24/7', 'Relatórios detalhados', 'Alertas em tempo real'],
        minPlan: 'pro',
        popularity: 78,
        rating: 4.7,
        totalSales: 634
      },
      {
        id: 'auto-scheduler',
        name: 'Agendador Inteligente',
        description: 'Agenda posts automaticamente nos melhores horários',
        category: 'automation',
        price: 29.90,
        icon: '⏰',
        features: ['IA de timing', 'Multi-plataformas', 'Análise de engajamento'],
        minPlan: 'pro',
        popularity: 91,
        rating: 4.9,
        totalSales: 1156
      },
      {
        id: 'logo-creator-ai',
        name: 'Criador de Logos IA',
        description: 'Cria logos profissionais em segundos',
        category: 'design',
        price: 24.90,
        icon: '🎨',
        features: ['IA generativa', 'Múltiplos formatos', 'Edição avançada'],
        minPlan: 'basico',
        popularity: 83,
        rating: 4.5,
        totalSales: 756
      },
      {
        id: 'video-editor-pro',
        name: 'Editor de Vídeo Pro',
        description: 'Edição profissional de vídeos com IA',
        category: 'video',
        price: 49.90,
        icon: '🎬',
        features: ['Edição automática', 'Efeitos IA', 'Exportação 4K'],
        minPlan: 'premium',
        popularity: 72,
        rating: 4.8,
        totalSales: 423
      }
    ];

    defaultTools.forEach(tool => this.tools.set(tool.id, tool));
  }

  // 🛒 OBTER FERRAMENTAS DO MARKETPLACE
  async getMarketplaceTools(filters = {}) {
    try {
      let tools = Array.from(this.tools.values());

      // 🔍 APLICAR FILTROS
      if (filters.category) {
        tools = tools.filter(tool => tool.category === filters.category);
      }

      if (filters.minPlan) {
        const planHierarchy = { basico: 1, pro: 2, premium: 3 };
        const userPlanLevel = planHierarchy[filters.minPlan] || 1;
        tools = tools.filter(tool => planHierarchy[tool.minPlan] <= userPlanLevel);
      }

      if (filters.maxPrice) {
        tools = tools.filter(tool => tool.price <= filters.maxPrice);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        tools = tools.filter(tool => 
          tool.name.toLowerCase().includes(searchTerm) ||
          tool.description.toLowerCase().includes(searchTerm)
        );
      }

      // 📊 ORDENAÇÃO
      switch (filters.sortBy) {
        case 'popularity':
          tools.sort((a, b) => b.popularity - a.popularity);
          break;
        case 'price_low':
          tools.sort((a, b) => a.price - b.price);
          break;
        case 'price_high':
          tools.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          tools.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
          tools.sort((a, b) => b.totalSales - a.totalSales);
          break;
        default:
          tools.sort((a, b) => b.popularity - a.popularity);
      }

      return {
        success: true,
        tools,
        categories: Array.from(this.categories.values()),
        totalTools: tools.length
      };

    } catch (error) {
      console.error('🚨 Erro ao obter ferramentas:', error);
      return { success: false, error: error.message };
    }
  }

  // 💰 COMPRAR FERRAMENTA
  async purchaseTool(userId, toolId, userPlan) {
    try {
      const tool = this.tools.get(toolId);
      if (!tool) {
        return { success: false, message: 'Ferramenta não encontrada' };
      }

      // 🔒 VERIFICAR PERMISSÃO DE PLANO
      if (!this.canUserAccessTool(userPlan, tool.minPlan)) {
        return { 
          success: false, 
          message: `Esta ferramenta requer plano ${tool.minPlan} ou superior`,
          requiredPlan: tool.minPlan
        };
      }

      // 🔍 VERIFICAR SE JÁ POSSUI
      const userTools = this.userPurchases.get(userId) || [];
      if (userTools.includes(toolId)) {
        return { success: false, message: 'Você já possui esta ferramenta' };
      }

      // 💳 PROCESSAR COMPRA (integração com Stripe)
      const paymentResult = await this.processToolPayment(userId, tool);
      
      if (paymentResult.success) {
        // ✅ ADICIONAR FERRAMENTA AO USUÁRIO
        userTools.push(toolId);
        this.userPurchases.set(userId, userTools);

        // 📊 ATUALIZAR ESTATÍSTICAS
        tool.totalSales += 1;
        this.tools.set(toolId, tool);

        return {
          success: true,
          message: 'Ferramenta adquirida com sucesso!',
          tool: {
            id: tool.id,
            name: tool.name,
            price: tool.price
          },
          paymentId: paymentResult.paymentId
        };
      }

      return { success: false, message: 'Erro no processamento do pagamento' };

    } catch (error) {
      console.error('🚨 Erro na compra:', error);
      return { success: false, error: error.message };
    }
  }

  // 🔒 VERIFICAR ACESSO À FERRAMENTA
  canUserAccessTool(userPlan, requiredPlan) {
    const planHierarchy = { basico: 1, pro: 2, premium: 3 };
    const userLevel = planHierarchy[userPlan] || 0;
    const requiredLevel = planHierarchy[requiredPlan] || 1;
    
    return userLevel >= requiredLevel;
  }

  // 💳 PROCESSAR PAGAMENTO DA FERRAMENTA
  async processToolPayment(userId, tool) {
    try {
      // EM PRODUÇÃO: Integrar com Stripe
      // const session = await stripe.checkout.sessions.create({
      //   payment_method_types: ['card'],
      //   line_items: [{
      //     price_data: {
      //       currency: 'brl',
      //       product_data: { name: tool.name },
      //       unit_amount: tool.price * 100
      //     },
      //     quantity: 1
      //   }],
      //   mode: 'payment',
      //   success_url: `${process.env.FRONTEND_URL}/marketplace/success`,
      //   cancel_url: `${process.env.FRONTEND_URL}/marketplace/cancel`,
      //   metadata: { userId, toolId: tool.id, type: 'marketplace_tool' }
      // });

      // Simulação para desenvolvimento
      return {
        success: true,
        paymentId: `pay_${Date.now()}`,
        sessionUrl: 'https://checkout.stripe.com/simulated'
      };

    } catch (error) {
      console.error('Erro no pagamento:', error);
      return { success: false, error: error.message };
    }
  }

  // 👤 OBTER FERRAMENTAS DO USUÁRIO
  async getUserTools(userId) {
    try {
      const userToolIds = this.userPurchases.get(userId) || [];
      const userTools = userToolIds.map(id => this.tools.get(id)).filter(Boolean);

      return {
        success: true,
        tools: userTools,
        totalTools: userTools.length
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 🔧 USAR FERRAMENTA
  async useTool(userId, toolId, parameters = {}) {
    try {
      // 🔍 VERIFICAR SE USUÁRIO POSSUI A FERRAMENTA
      const userTools = this.userPurchases.get(userId) || [];
      if (!userTools.includes(toolId)) {
        return { 
          success: false, 
          message: 'Você não possui esta ferramenta',
          needsPurchase: true
        };
      }

      const tool = this.tools.get(toolId);
      if (!tool) {
        return { success: false, message: 'Ferramenta não encontrada' };
      }

      // 🚀 EXECUTAR FERRAMENTA
      const result = await this.executeToolLogic(toolId, parameters);

      // 📊 REGISTRAR USO
      await this.logToolUsage(userId, toolId);

      return {
        success: true,
        result,
        toolName: tool.name,
        usageCount: await this.getUserToolUsage(userId, toolId)
      };

    } catch (error) {
      console.error('🚨 Erro ao usar ferramenta:', error);
      return { success: false, error: error.message };
    }
  }

  // ⚙️ EXECUTAR LÓGICA DA FERRAMENTA
  async executeToolLogic(toolId, parameters) {
    // Simulação da execução das ferramentas
    switch (toolId) {
      case 'viral-post-generator':
        return {
          post: "🔥 Descubra o segredo que 99% das pessoas não sabem sobre [NICHO]! Thread 👇",
          hashtags: ["#viral", "#dica", "#segredo"],
          engagement_score: 8.7
        };

      case 'hashtag-optimizer':
        return {
          hashtags: ["#trending", "#viral", "#content", "#marketing", "#growth"],
          reach_potential: "250K - 500K",
          competition_level: "Médio"
        };

      case 'competitor-analyzer':
        return {
          competitors: ["@competitor1", "@competitor2"],
          top_content: ["Post sobre tendência X", "Vídeo sobre Y"],
          growth_rate: "+15% último mês"
        };

      default:
        return { message: "Ferramenta executada com sucesso!" };
    }
  }

  // 📊 REGISTRAR USO DA FERRAMENTA
  async logToolUsage(userId, toolId) {
    // EM PRODUÇÃO: Salvar no banco de dados
    console.log(`📊 Uso registrado: Usuário ${userId} usou ferramenta ${toolId}`);
  }

  // 📈 OBTER USO DA FERRAMENTA PELO USUÁRIO
  async getUserToolUsage(userId, toolId) {
    // EM PRODUÇÃO: Buscar do banco de dados
    return Math.floor(Math.random() * 50) + 1;
  }

  // 📊 OBTER ESTATÍSTICAS DO MARKETPLACE
  getMarketplaceStats() {
    const tools = Array.from(this.tools.values());
    
    return {
      totalTools: tools.length,
      totalCategories: this.categories.size,
      totalSales: tools.reduce((sum, tool) => sum + tool.totalSales, 0),
      averagePrice: tools.reduce((sum, tool) => sum + tool.price, 0) / tools.length,
      topSellingTool: tools.sort((a, b) => b.totalSales - a.totalSales)[0],
      totalRevenue: tools.reduce((sum, tool) => sum + (tool.price * tool.totalSales), 0)
    };
  }

  // 🆕 ADICIONAR NOVA FERRAMENTA
  async addNewTool(toolData) {
    try {
      const tool = {
        id: `tool_${Date.now()}`,
        ...toolData,
        totalSales: 0,
        rating: 0,
        popularity: 0,
        createdAt: new Date()
      };

      this.tools.set(tool.id, tool);

      return { success: true, tool };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// 🚀 INSTÂNCIA GLOBAL
const marketplace = new MarketplaceSystem();

export { marketplace, MarketplaceSystem };
