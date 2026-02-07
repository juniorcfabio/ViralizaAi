// 🏢 SISTEMA DE FRANQUIA DIGITAL - EXPANSÃO MUNDIAL
class FranchiseSystem {
  constructor() {
    this.franchises = new Map();
    this.franchisees = new Map();
    this.revenueSharing = new Map();
    this.territories = new Map();
    this.initializeFranchiseSystem();
  }

  // 🚀 INICIALIZAR SISTEMA DE FRANQUIAS
  initializeFranchiseSystem() {
    this.setupTerritories();
    this.setupFranchisePackages();
    console.log('🏢 Sistema de Franquias inicializado');
  }

  // 🌍 CONFIGURAR TERRITÓRIOS DISPONÍVEIS
  setupTerritories() {
    const territories = [
      // 🇺🇸 AMÉRICA DO NORTE
      { id: 'us-east', name: 'Estados Unidos - Costa Leste', country: 'US', population: 120000000, fee: 50000, royalty: 0.15 },
      { id: 'us-west', name: 'Estados Unidos - Costa Oeste', country: 'US', population: 80000000, fee: 45000, royalty: 0.15 },
      { id: 'canada', name: 'Canadá', country: 'CA', population: 38000000, fee: 35000, royalty: 0.12 },
      { id: 'mexico', name: 'México', country: 'MX', population: 130000000, fee: 25000, royalty: 0.10 },

      // 🇪🇺 EUROPA
      { id: 'germany', name: 'Alemanha', country: 'DE', population: 83000000, fee: 40000, royalty: 0.13 },
      { id: 'france', name: 'França', country: 'FR', population: 68000000, fee: 38000, royalty: 0.13 },
      { id: 'uk', name: 'Reino Unido', country: 'GB', population: 67000000, fee: 42000, royalty: 0.14 },
      { id: 'spain', name: 'Espanha', country: 'ES', population: 47000000, fee: 30000, royalty: 0.11 },

      // 🌏 ÁSIA-PACÍFICO
      { id: 'japan', name: 'Japão', country: 'JP', population: 125000000, fee: 45000, royalty: 0.14 },
      { id: 'australia', name: 'Austrália', country: 'AU', population: 26000000, fee: 35000, royalty: 0.12 },
      { id: 'singapore', name: 'Singapura', country: 'SG', population: 6000000, fee: 25000, royalty: 0.11 },

      // 🌎 AMÉRICA LATINA
      { id: 'argentina', name: 'Argentina', country: 'AR', population: 46000000, fee: 20000, royalty: 0.08 },
      { id: 'chile', name: 'Chile', country: 'CL', population: 19000000, fee: 18000, royalty: 0.08 },
      { id: 'colombia', name: 'Colômbia', country: 'CO', population: 51000000, fee: 22000, royalty: 0.09 }
    ];

    territories.forEach(territory => {
      territory.status = 'available';
      territory.marketPotential = this.calculateMarketPotential(territory);
      this.territories.set(territory.id, territory);
    });
  }

  // 📦 CONFIGURAR PACOTES DE FRANQUIA
  setupFranchisePackages() {
    this.franchisePackages = {
      starter: {
        name: 'Franquia Starter',
        price: 15000,
        features: [
          'Plataforma básica',
          'Suporte por email',
          'Treinamento online',
          'Marketing básico'
        ],
        royalty: 0.08,
        maxUsers: 1000,
        territories: ['small']
      },
      professional: {
        name: 'Franquia Professional',
        price: 35000,
        features: [
          'Plataforma completa',
          'Suporte prioritário',
          'Treinamento presencial',
          'Kit de marketing',
          'Customização básica'
        ],
        royalty: 0.12,
        maxUsers: 5000,
        territories: ['medium']
      },
      enterprise: {
        name: 'Franquia Enterprise',
        price: 75000,
        features: [
          'Plataforma premium',
          'Suporte 24/7',
          'Treinamento completo',
          'Marketing personalizado',
          'Customização total',
          'Equipe dedicada'
        ],
        royalty: 0.15,
        maxUsers: 'unlimited',
        territories: ['large']
      }
    };
  }

  // 💰 CALCULAR POTENCIAL DE MERCADO
  calculateMarketPotential(territory) {
    const baseValue = territory.population * 0.001; // 0.1% da população como potencial
    const economicFactor = this.getEconomicFactor(territory.country);
    return Math.round(baseValue * economicFactor);
  }

  // 📊 OBTER FATOR ECONÔMICO DO PAÍS
  getEconomicFactor(country) {
    const factors = {
      'US': 2.5, 'CA': 2.2, 'GB': 2.0, 'DE': 1.9, 'FR': 1.8,
      'AU': 1.7, 'JP': 1.6, 'SG': 1.5, 'ES': 1.3, 'MX': 1.0,
      'AR': 0.8, 'CL': 0.9, 'CO': 0.7
    };
    return factors[country] || 1.0;
  }

  // 🏢 CRIAR NOVA FRANQUIA
  async createFranchise(franchiseeData, territoryId, packageType) {
    try {
      const territory = this.territories.get(territoryId);
      if (!territory) {
        return { success: false, message: 'Território não encontrado' };
      }

      if (territory.status !== 'available') {
        return { success: false, message: 'Território não disponível' };
      }

      const package = this.franchisePackages[packageType];
      if (!package) {
        return { success: false, message: 'Pacote de franquia inválido' };
      }

      // 🆔 GERAR ID ÚNICO DA FRANQUIA
      const franchiseId = `franchise_${Date.now()}`;

      // 🏢 CRIAR FRANQUIA
      const franchise = {
        id: franchiseId,
        franchiseeId: franchiseeData.userId,
        territoryId,
        packageType,
        status: 'pending_payment',
        createdAt: new Date(),
        
        // 📊 DADOS DO TERRITÓRIO
        territory: {
          ...territory,
          status: 'reserved'
        },
        
        // 📦 DADOS DO PACOTE
        package: {
          ...package,
          paidAmount: 0,
          paymentStatus: 'pending'
        },
        
        // 👤 DADOS DO FRANQUEADO
        franchisee: {
          ...franchiseeData,
          joinedAt: new Date(),
          status: 'active'
        },
        
        // 💰 CONFIGURAÇÕES FINANCEIRAS
        financial: {
          initialFee: package.price,
          royaltyRate: package.royalty,
          totalRevenue: 0,
          totalRoyalties: 0,
          lastPayment: null
        },
        
        // 🌐 CONFIGURAÇÕES TÉCNICAS
        technical: {
          subdomain: `${territoryId}.viralizaai.com`,
          customDomain: null,
          apiKey: this.generateAPIKey(),
          maxUsers: package.maxUsers,
          currentUsers: 0
        }
      };

      // 💾 SALVAR FRANQUIA
      this.franchises.set(franchiseId, franchise);
      this.franchisees.set(franchiseeData.userId, franchiseId);
      
      // 🔒 RESERVAR TERRITÓRIO
      territory.status = 'reserved';
      territory.franchiseId = franchiseId;
      this.territories.set(territoryId, territory);

      // 💳 GERAR LINK DE PAGAMENTO
      const paymentLink = await this.generatePaymentLink(franchise);

      return {
        success: true,
        franchise: {
          id: franchiseId,
          territory: territory.name,
          package: package.name,
          initialFee: package.price,
          royaltyRate: package.royalty,
          subdomain: franchise.technical.subdomain,
          paymentLink
        },
        message: 'Franquia criada com sucesso! Complete o pagamento para ativar.'
      };

    } catch (error) {
      console.error('🚨 Erro ao criar franquia:', error);
      return { success: false, error: error.message };
    }
  }

  // 💳 GERAR LINK DE PAGAMENTO
  async generatePaymentLink(franchise) {
    try {
      // EM PRODUÇÃO: Integrar com Stripe
      // const session = await stripe.checkout.sessions.create({
      //   payment_method_types: ['card'],
      //   line_items: [{
      //     price_data: {
      //       currency: 'usd',
      //       product_data: { 
      //         name: `Franquia ${franchise.territory.name}`,
      //         description: franchise.package.name
      //       },
      //       unit_amount: franchise.financial.initialFee * 100
      //     },
      //     quantity: 1
      //   }],
      //   mode: 'payment',
      //   success_url: `${process.env.FRONTEND_URL}/franchise/success?session_id={CHECKOUT_SESSION_ID}`,
      //   cancel_url: `${process.env.FRONTEND_URL}/franchise/cancel`,
      //   metadata: { 
      //     franchiseId: franchise.id,
      //     type: 'franchise_fee'
      //   }
      // });

      // return session.url;

      // Simulação para desenvolvimento
      return `https://checkout.stripe.com/franchise/${franchise.id}`;

    } catch (error) {
      console.error('Erro ao gerar link de pagamento:', error);
      return null;
    }
  }

  // ✅ ATIVAR FRANQUIA APÓS PAGAMENTO
  async activateFranchise(franchiseId, paymentData) {
    try {
      const franchise = this.franchises.get(franchiseId);
      if (!franchise) {
        return { success: false, message: 'Franquia não encontrada' };
      }

      // ✅ ATUALIZAR STATUS
      franchise.status = 'active';
      franchise.package.paymentStatus = 'paid';
      franchise.package.paidAmount = franchise.financial.initialFee;
      franchise.financial.lastPayment = new Date();

      // 🌐 CONFIGURAR INFRAESTRUTURA
      await this.setupFranchiseInfrastructure(franchise);

      // 📧 ENVIAR CREDENCIAIS
      await this.sendFranchiseCredentials(franchise);

      // 🔓 LIBERAR TERRITÓRIO
      const territory = this.territories.get(franchise.territoryId);
      territory.status = 'occupied';
      this.territories.set(franchise.territoryId, territory);

      // 💾 SALVAR ALTERAÇÕES
      this.franchises.set(franchiseId, franchise);

      return {
        success: true,
        franchise: {
          id: franchiseId,
          status: 'active',
          subdomain: franchise.technical.subdomain,
          apiKey: franchise.technical.apiKey,
          dashboardUrl: `https://${franchise.technical.subdomain}/admin`
        },
        message: 'Franquia ativada com sucesso!'
      };

    } catch (error) {
      console.error('🚨 Erro ao ativar franquia:', error);
      return { success: false, error: error.message };
    }
  }

  // 🌐 CONFIGURAR INFRAESTRUTURA DA FRANQUIA
  async setupFranchiseInfrastructure(franchise) {
    try {
      // 🔧 CONFIGURAR SUBDOMÍNIO
      await this.setupSubdomain(franchise.technical.subdomain);
      
      // 🗄️ CRIAR BANCO DE DADOS ISOLADO
      await this.createFranchiseDatabase(franchise.id);
      
      // 🎨 APLICAR CUSTOMIZAÇÕES
      await this.applyFranchiseCustomizations(franchise);
      
      console.log(`🌐 Infraestrutura configurada para ${franchise.technical.subdomain}`);

    } catch (error) {
      console.error('Erro na configuração de infraestrutura:', error);
      throw error;
    }
  }

  // 🔧 CONFIGURAR SUBDOMÍNIO
  async setupSubdomain(subdomain) {
    // EM PRODUÇÃO: Configurar DNS, SSL, etc.
    console.log(`🔧 Configurando subdomínio: ${subdomain}`);
  }

  // 🗄️ CRIAR BANCO DE DADOS DA FRANQUIA
  async createFranchiseDatabase(franchiseId) {
    // EM PRODUÇÃO: Criar schema isolado
    console.log(`🗄️ Criando banco para franquia: ${franchiseId}`);
  }

  // 🎨 APLICAR CUSTOMIZAÇÕES
  async applyFranchiseCustomizations(franchise) {
    // EM PRODUÇÃO: Aplicar tema, logo, cores, etc.
    console.log(`🎨 Aplicando customizações para: ${franchise.id}`);
  }

  // 📧 ENVIAR CREDENCIAIS
  async sendFranchiseCredentials(franchise) {
    const credentials = {
      subdomain: franchise.technical.subdomain,
      apiKey: franchise.technical.apiKey,
      adminEmail: franchise.franchisee.email,
      dashboardUrl: `https://${franchise.technical.subdomain}/admin`,
      supportEmail: 'franchise-support@viralizaai.com'
    };

    console.log(`📧 Enviando credenciais para: ${franchise.franchisee.email}`);
    // EM PRODUÇÃO: Enviar email com credenciais
  }

  // 💰 PROCESSAR DIVISÃO DE RECEITA
  async processRevenueSharing(franchiseId, revenue) {
    try {
      const franchise = this.franchises.get(franchiseId);
      if (!franchise) {
        return { success: false, message: 'Franquia não encontrada' };
      }

      const royaltyRate = franchise.financial.royaltyRate;
      const royaltyAmount = revenue * royaltyRate;
      const franchiseeAmount = revenue - royaltyAmount;

      // 💰 ATUALIZAR TOTAIS
      franchise.financial.totalRevenue += revenue;
      franchise.financial.totalRoyalties += royaltyAmount;

      // 💳 PROCESSAR PAGAMENTOS
      await this.processRoyaltyPayment(franchise, royaltyAmount);
      await this.processFranchiseePayment(franchise, franchiseeAmount);

      // 💾 SALVAR
      this.franchises.set(franchiseId, franchise);

      return {
        success: true,
        revenue,
        royalty: royaltyAmount,
        franchiseeAmount,
        royaltyRate: `${(royaltyRate * 100).toFixed(1)}%`
      };

    } catch (error) {
      console.error('🚨 Erro na divisão de receita:', error);
      return { success: false, error: error.message };
    }
  }

  // 💳 PROCESSAR PAGAMENTO DE ROYALTY
  async processRoyaltyPayment(franchise, amount) {
    // EM PRODUÇÃO: Transferir para conta da matriz
    console.log(`💰 Royalty recebido: R$${amount.toFixed(2)} de ${franchise.territory.name}`);
  }

  // 💸 PROCESSAR PAGAMENTO DO FRANQUEADO
  async processFranchiseePayment(franchise, amount) {
    // EM PRODUÇÃO: Transferir para conta do franqueado
    console.log(`💸 Pagamento para franqueado: R$${amount.toFixed(2)} - ${franchise.franchisee.name}`);
  }

  // 🔑 GERAR CHAVE API
  generateAPIKey() {
    return `vir_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 📊 OBTER TERRITÓRIOS DISPONÍVEIS
  getAvailableTerritories() {
    return Array.from(this.territories.values())
      .filter(territory => territory.status === 'available')
      .map(territory => ({
        id: territory.id,
        name: territory.name,
        country: territory.country,
        population: territory.population,
        marketPotential: territory.marketPotential,
        fee: territory.fee,
        royalty: `${(territory.royalty * 100).toFixed(1)}%`
      }));
  }

  // 🏢 OBTER FRANQUIAS ATIVAS
  getActiveFranchises() {
    return Array.from(this.franchises.values())
      .filter(franchise => franchise.status === 'active')
      .map(franchise => ({
        id: franchise.id,
        territory: franchise.territory.name,
        franchisee: franchise.franchisee.name,
        revenue: franchise.financial.totalRevenue,
        royalties: franchise.financial.totalRoyalties,
        users: franchise.technical.currentUsers,
        subdomain: franchise.technical.subdomain
      }));
  }

  // 📈 OBTER ESTATÍSTICAS DO SISTEMA
  getFranchiseStats() {
    const franchises = Array.from(this.franchises.values());
    const activeFranchises = franchises.filter(f => f.status === 'active');
    
    return {
      totalFranchises: franchises.length,
      activeFranchises: activeFranchises.length,
      availableTerritories: Array.from(this.territories.values())
        .filter(t => t.status === 'available').length,
      totalRevenue: activeFranchises.reduce((sum, f) => sum + f.financial.totalRevenue, 0),
      totalRoyalties: activeFranchises.reduce((sum, f) => sum + f.financial.totalRoyalties, 0),
      averageRevenuePerFranchise: activeFranchises.length > 0 ? 
        activeFranchises.reduce((sum, f) => sum + f.financial.totalRevenue, 0) / activeFranchises.length : 0
    };
  }
}

// 🚀 INSTÂNCIA GLOBAL
const franchiseSystem = new FranchiseSystem();

export { franchiseSystem, FranchiseSystem };
