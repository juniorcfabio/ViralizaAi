// 🌍🔥 SISTEMA DE AFILIADOS MUNDIAL - MÁQUINA DE CRESCIMENTO VIRAL
// Transforma usuários em vendedores automáticos da plataforma

import { v4 as uuid } from 'uuid';
import { db } from './database.js';
import { stripe } from './stripe.js';

export class AffiliateSystemManager {
  constructor() {
    this.commissionRate = 0.30; // 30% de comissão
    this.minimumPayout = 100.00; // Mínimo R$100 para saque
    this.cookieExpiration = 30; // 30 dias para conversão
    
    this.affiliateStats = new Map();
    this.conversionTracking = new Map();
    this.payoutQueue = [];
    
    this.initializeAffiliateSystem();
  }

  // 🚀 INICIALIZAR SISTEMA DE AFILIADOS
  initializeAffiliateSystem() {
    console.log("🌍 Inicializando sistema de afiliados mundial...");

    // 📊 INICIAR TRACKING DE CONVERSÕES
    this.startConversionTracking();
    
    // 💰 INICIAR PROCESSAMENTO DE COMISSÕES
    this.startCommissionProcessing();
    
    // 💸 INICIAR PAGAMENTOS AUTOMÁTICOS
    this.startAutomaticPayouts();
    
    console.log("✅ Sistema de afiliados ativo - Máquina de crescimento viral operacional");
  }

  // 👤 CRIAR AFILIADO
  async criarAfiliado(userId, userData = {}) {
    try {
      console.log(`👤 Criando afiliado para usuário: ${userId}`);

      // 🔍 VERIFICAR SE JÁ É AFILIADO
      const existingAffiliate = await this.getAffiliateByUserId(userId);
      if (existingAffiliate) {
        return {
          success: true,
          affiliate: existingAffiliate,
          link: this.generateAffiliateLink(existingAffiliate.codigo),
          message: 'Afiliado já existe'
        };
      }

      // 🎯 GERAR CÓDIGO ÚNICO
      const codigo = await this.generateUniqueCode();
      
      // 📝 CRIAR REGISTRO DO AFILIADO
      const affiliateData = {
        id: uuid(),
        user_id: userId,
        codigo,
        comissao_total: 0,
        comissao_pendente: 0,
        total_indicacoes: 0,
        total_vendas: 0,
        status: 'ativo',
        dados_pagamento: userData.dadosPagamento || null,
        criado_em: new Date()
      };

      // 🎯 EM PRODUÇÃO: SALVAR NO BANCO
      // await db.affiliates.create({ data: affiliateData });
      
      // 📊 INICIALIZAR ESTATÍSTICAS
      this.affiliateStats.set(affiliateData.id, {
        clicks: 0,
        conversions: 0,
        conversionRate: 0,
        totalEarnings: 0,
        lastActivity: new Date()
      });

      const affiliateLink = this.generateAffiliateLink(codigo);

      console.log(`✅ Afiliado criado: ${codigo}`);

      return {
        success: true,
        affiliate: affiliateData,
        link: affiliateLink,
        codigo,
        comissaoRate: this.commissionRate * 100,
        minimumPayout: this.minimumPayout
      };

    } catch (error) {
      console.error("🚨 Erro ao criar afiliado:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 🔗 GERAR LINK DO AFILIADO
  generateAffiliateLink(codigo) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://viralizaai.com';
    return `${baseUrl}/?ref=${codigo}`;
  }

  // 🎯 GERAR CÓDIGO ÚNICO
  async generateUniqueCode() {
    let codigo;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      // 🎲 GERAR CÓDIGO AMIGÁVEL
      codigo = this.generateFriendlyCode();
      
      // 🔍 VERIFICAR UNICIDADE
      // EM PRODUÇÃO: const existing = await db.affiliates.findUnique({ where: { codigo } });
      const existing = null; // Simulação
      
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      // 🔄 FALLBACK PARA UUID
      codigo = uuid().slice(0, 8).toUpperCase();
    }

    return codigo;
  }

  // 🎲 GERAR CÓDIGO AMIGÁVEL
  generateFriendlyCode() {
    const adjectives = ['VIRAL', 'SMART', 'FAST', 'COOL', 'MEGA', 'SUPER', 'TOP', 'PRO'];
    const numbers = Math.floor(Math.random() * 999) + 1;
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    
    return `${adjective}${numbers}`;
  }

  // 🧲 CAPTURAR INDICAÇÃO NO CADASTRO
  async capturarIndicacao(refCode, novoUsuarioId, userIP = null) {
    try {
      console.log(`🧲 Capturando indicação: ${refCode} -> ${novoUsuarioId}`);

      if (!refCode) return { success: false, message: 'Código de referência não fornecido' };

      // 🔍 BUSCAR AFILIADO
      const afiliado = await this.getAffiliateByCode(refCode);
      if (!afiliado) {
        return { success: false, message: 'Código de afiliado inválido' };
      }

      // 🚫 VERIFICAR AUTO-REFERÊNCIA
      if (afiliado.user_id === novoUsuarioId) {
        return { success: false, message: 'Não é possível se auto-referenciar' };
      }

      // 📝 REGISTRAR INDICAÇÃO
      // EM PRODUÇÃO: 
      // await db.users.update({
      //   where: { id: novoUsuarioId },
      //   data: { indicado_por: afiliado.id }
      // });

      // 📊 ATUALIZAR ESTATÍSTICAS
      await this.updateAffiliateStats(afiliado.id, 'conversion');
      
      // 📝 REGISTRAR TRACKING
      this.conversionTracking.set(novoUsuarioId, {
        affiliateId: afiliado.id,
        affiliateCode: refCode,
        capturedAt: new Date(),
        userIP,
        status: 'captured'
      });

      console.log(`✅ Indicação capturada: ${refCode} -> ${novoUsuarioId}`);

      return {
        success: true,
        affiliateId: afiliado.id,
        affiliateCode: refCode,
        message: 'Indicação registrada com sucesso'
      };

    } catch (error) {
      console.error("🚨 Erro ao capturar indicação:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 💳 PROCESSAR COMISSÃO APÓS PAGAMENTO
  async processarComissao(paymentData) {
    try {
      console.log(`💳 Processando comissão para pagamento: ${paymentData.id}`);

      const { userId, amount, paymentId, metadata } = paymentData;

      // 🔍 VERIFICAR SE USUÁRIO FOI INDICADO
      const tracking = this.conversionTracking.get(userId);
      if (!tracking) {
        console.log(`ℹ️ Usuário ${userId} não foi indicado por afiliado`);
        return { success: false, message: 'Usuário não foi indicado' };
      }

      // 🔍 BUSCAR AFILIADO
      const afiliado = await this.getAffiliateById(tracking.affiliateId);
      if (!afiliado) {
        return { success: false, message: 'Afiliado não encontrado' };
      }

      // 💰 CALCULAR COMISSÃO
      const valorComissao = (amount / 100) * this.commissionRate;

      // 📝 CRIAR REGISTRO DE COMISSÃO
      const commissionData = {
        id: uuid(),
        affiliate_id: afiliado.id,
        user_indicado: userId,
        pagamento_id: paymentId,
        valor: valorComissao,
        valor_original: amount / 100,
        percentual: this.commissionRate,
        status: 'confirmada',
        metadata: {
          ...metadata,
          affiliateCode: tracking.affiliateCode,
          conversionDate: tracking.capturedAt
        },
        criado_em: new Date()
      };

      // 🎯 EM PRODUÇÃO: SALVAR COMISSÃO
      // await db.affiliate_commissions.create({ data: commissionData });

      // 📊 ATUALIZAR TOTAIS DO AFILIADO
      await this.updateAffiliateTotals(afiliado.id, valorComissao);

      // 📊 ATUALIZAR ESTATÍSTICAS
      await this.updateAffiliateStats(afiliado.id, 'sale', valorComissao);

      // 🔄 ATUALIZAR TRACKING
      this.conversionTracking.set(userId, {
        ...tracking,
        status: 'converted',
        commissionValue: valorComissao,
        convertedAt: new Date()
      });

      console.log(`✅ Comissão processada: R$${valorComissao.toFixed(2)} para ${afiliado.codigo}`);

      return {
        success: true,
        commission: commissionData,
        affiliateCode: afiliado.codigo,
        commissionValue: valorComissao
      };

    } catch (error) {
      console.error("🚨 Erro ao processar comissão:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 📊 OBTER DASHBOARD DO AFILIADO
  async getDashboardAfiliado(userId) {
    try {
      console.log(`📊 Obtendo dashboard do afiliado: ${userId}`);

      // 🔍 BUSCAR AFILIADO
      const afiliado = await this.getAffiliateByUserId(userId);
      if (!afiliado) {
        return { success: false, message: 'Afiliado não encontrado' };
      }

      // 📊 BUSCAR COMISSÕES
      const comissoes = await this.getAffiliateCommissions(afiliado.id);
      
      // 📈 CALCULAR ESTATÍSTICAS
      const stats = this.affiliateStats.get(afiliado.id) || this.getDefaultStats();
      
      // 💰 CALCULAR VALORES
      const totalComissoes = comissoes.reduce((sum, c) => sum + c.valor, 0);
      const comissoesPendentes = comissoes.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.valor, 0);
      const comissoesConfirmadas = comissoes.filter(c => c.status === 'confirmada').reduce((sum, c) => sum + c.valor, 0);

      // 📅 ESTATÍSTICAS POR PERÍODO
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const comissoesEsteMes = comissoes.filter(c => new Date(c.criado_em) >= inicioMes);

      const dashboard = {
        afiliado: {
          id: afiliado.id,
          codigo: afiliado.codigo,
          link: this.generateAffiliateLink(afiliado.codigo),
          status: afiliado.status,
          criadoEm: afiliado.criado_em
        },
        financeiro: {
          totalComissoes: Math.round(totalComissoes * 100) / 100,
          comissoesPendentes: Math.round(comissoesPendentes * 100) / 100,
          comissoesConfirmadas: Math.round(comissoesConfirmadas * 100) / 100,
          disponivelSaque: Math.round(comissoesConfirmadas * 100) / 100,
          proximoSaque: comissoesConfirmadas >= this.minimumPayout,
          minimumPayout: this.minimumPayout
        },
        estatisticas: {
          totalClicks: stats.clicks,
          totalConversoes: stats.conversions,
          taxaConversao: stats.conversions > 0 ? Math.round((stats.conversions / stats.clicks) * 100 * 100) / 100 : 0,
          totalIndicacoes: afiliado.total_indicacoes || 0,
          totalVendas: afiliado.total_vendas || 0
        },
        periodo: {
          comissoesEsteMes: comissoesEsteMes.length,
          valorEsteMes: Math.round(comissoesEsteMes.reduce((sum, c) => sum + c.valor, 0) * 100) / 100
        },
        comissoes: comissoes.slice(0, 10), // Últimas 10 comissões
        configuracao: {
          percentualComissao: this.commissionRate * 100,
          cookieExpiration: this.cookieExpiration
        }
      };

      return {
        success: true,
        dashboard
      };

    } catch (error) {
      console.error("🚨 Erro ao obter dashboard:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 💸 SOLICITAR SAQUE
  async solicitarSaque(affiliateId, dadosPagamento) {
    try {
      console.log(`💸 Solicitando saque para afiliado: ${affiliateId}`);

      // 🔍 BUSCAR AFILIADO
      const afiliado = await this.getAffiliateById(affiliateId);
      if (!afiliado) {
        return { success: false, message: 'Afiliado não encontrado' };
      }

      // 💰 VERIFICAR SALDO DISPONÍVEL
      const saldoDisponivel = await this.getSaldoDisponivel(affiliateId);
      if (saldoDisponivel < this.minimumPayout) {
        return { 
          success: false, 
          message: `Saldo mínimo para saque: R$${this.minimumPayout.toFixed(2)}. Saldo atual: R$${saldoDisponivel.toFixed(2)}` 
        };
      }

      // 📝 CRIAR SOLICITAÇÃO DE SAQUE
      const saqueData = {
        id: uuid(),
        affiliate_id: affiliateId,
        valor: saldoDisponivel,
        dados_pagamento: dadosPagamento,
        status: 'solicitado',
        solicitado_em: new Date()
      };

      // 🎯 EM PRODUÇÃO: SALVAR SOLICITAÇÃO
      // await db.affiliate_payouts.create({ data: saqueData });

      // 📝 ADICIONAR À FILA DE PAGAMENTOS
      this.payoutQueue.push(saqueData);

      // 🔄 ATUALIZAR STATUS DAS COMISSÕES
      await this.markCommissionsAsPending(affiliateId);

      console.log(`✅ Saque solicitado: R$${saldoDisponivel.toFixed(2)} para ${afiliado.codigo}`);

      return {
        success: true,
        saque: saqueData,
        valor: saldoDisponivel,
        previsaoProcessamento: '1-3 dias úteis'
      };

    } catch (error) {
      console.error("🚨 Erro ao solicitar saque:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 🤖 PROCESSAR PAGAMENTOS AUTOMÁTICOS
  async processarPagamentosAutomaticos() {
    console.log("🤖 Processando pagamentos automáticos...");

    for (const saque of this.payoutQueue) {
      try {
        if (saque.status === 'solicitado') {
          await this.processarPagamentoPix(saque);
        }
      } catch (error) {
        console.error(`Erro ao processar pagamento ${saque.id}:`, error);
      }
    }
  }

  // 💳 PROCESSAR PAGAMENTO PIX
  async processarPagamentoPix(saque) {
    console.log(`💳 Processando pagamento PIX: ${saque.id}`);

    try {
      // 🎯 EM PRODUÇÃO: INTEGRAR COM GATEWAY DE PAGAMENTO
      // const pixPayment = await stripe.transfers.create({
      //   amount: Math.round(saque.valor * 100),
      //   currency: 'brl',
      //   destination: saque.dados_pagamento.pixKey
      // });

      // 📝 SIMULAR PAGAMENTO PROCESSADO
      saque.status = 'processado';
      saque.processado_em = new Date();
      saque.transaction_id = `pix_${uuid().slice(0, 8)}`;

      console.log(`✅ Pagamento PIX processado: R$${saque.valor.toFixed(2)}`);

      return {
        success: true,
        transactionId: saque.transaction_id
      };

    } catch (error) {
      saque.status = 'erro';
      saque.erro = error.message;
      throw error;
    }
  }

  // 📊 INICIAR TRACKING DE CONVERSÕES
  startConversionTracking() {
    // 🔗 RASTREAR CLICKS EM LINKS A CADA 5 MINUTOS
    setInterval(() => {
      this.trackAffiliateClicks();
    }, 300000);

    console.log("📊 Tracking de conversões iniciado");
  }

  // 💰 INICIAR PROCESSAMENTO DE COMISSÕES
  startCommissionProcessing() {
    // 💳 PROCESSAR COMISSÕES PENDENTES A CADA 10 MINUTOS
    setInterval(() => {
      this.processPendingCommissions();
    }, 600000);

    console.log("💰 Processamento de comissões iniciado");
  }

  // 💸 INICIAR PAGAMENTOS AUTOMÁTICOS
  startAutomaticPayouts() {
    // 🤖 PROCESSAR PAGAMENTOS A CADA 30 MINUTOS
    setInterval(() => {
      this.processarPagamentosAutomaticos();
    }, 1800000);

    console.log("💸 Pagamentos automáticos iniciados");
  }

  // 📊 OBTER ESTATÍSTICAS GERAIS DO SISTEMA
  getAffiliateSystemStats() {
    const totalAffiliates = this.affiliateStats.size;
    const totalCommissions = Array.from(this.conversionTracking.values())
      .filter(t => t.status === 'converted').length;
    
    return {
      totalAffiliates,
      totalCommissions,
      totalPayouts: this.payoutQueue.filter(p => p.status === 'processado').length,
      conversionRate: this.calculateOverallConversionRate(),
      topPerformers: this.getTopPerformers(),
      recentActivity: this.getRecentActivity(),
      systemHealth: {
        status: 'operational',
        uptime: '99.9%',
        lastProcessing: new Date()
      }
    };
  }

  // 🔧 FUNÇÕES AUXILIARES
  async getAffiliateByUserId(userId) {
    // 🎯 EM PRODUÇÃO: BUSCAR NO BANCO
    // return await db.affiliates.findFirst({ where: { user_id: userId } });
    
    // 📝 SIMULAÇÃO
    return {
      id: uuid(),
      user_id: userId,
      codigo: 'VIRAL123',
      comissao_total: 450.75,
      total_indicacoes: 12,
      total_vendas: 8,
      status: 'ativo',
      criado_em: new Date(Date.now() - 2592000000) // 30 dias atrás
    };
  }

  async getAffiliateByCode(codigo) {
    // 🎯 EM PRODUÇÃO: BUSCAR NO BANCO
    // return await db.affiliates.findUnique({ where: { codigo } });
    
    // 📝 SIMULAÇÃO
    if (codigo === 'VIRAL123') {
      return {
        id: uuid(),
        user_id: uuid(),
        codigo: 'VIRAL123',
        comissao_total: 450.75,
        status: 'ativo'
      };
    }
    return null;
  }

  async getAffiliateById(id) {
    // 🎯 EM PRODUÇÃO: BUSCAR NO BANCO
    return {
      id,
      codigo: 'VIRAL123',
      comissao_total: 450.75,
      status: 'ativo'
    };
  }

  async getAffiliateCommissions(affiliateId) {
    // 🎯 EM PRODUÇÃO: BUSCAR NO BANCO
    // return await db.affiliate_commissions.findMany({ where: { affiliate_id: affiliateId } });
    
    // 📝 SIMULAÇÃO
    return [
      {
        id: uuid(),
        affiliate_id: affiliateId,
        valor: 89.90,
        status: 'confirmada',
        criado_em: new Date(Date.now() - 86400000)
      },
      {
        id: uuid(),
        affiliate_id: affiliateId,
        valor: 179.80,
        status: 'confirmada',
        criado_em: new Date(Date.now() - 172800000)
      }
    ];
  }

  async updateAffiliateTotals(affiliateId, comissaoValue) {
    // 🎯 EM PRODUÇÃO: ATUALIZAR NO BANCO
    // await db.affiliates.update({
    //   where: { id: affiliateId },
    //   data: { 
    //     comissao_total: { increment: comissaoValue },
    //     total_vendas: { increment: 1 }
    //   }
    // });
    
    console.log(`📊 Totais atualizados para afiliado ${affiliateId}: +R$${comissaoValue.toFixed(2)}`);
  }

  async updateAffiliateStats(affiliateId, action, value = 0) {
    const stats = this.affiliateStats.get(affiliateId) || this.getDefaultStats();
    
    switch (action) {
      case 'click':
        stats.clicks++;
        break;
      case 'conversion':
        stats.conversions++;
        break;
      case 'sale':
        stats.totalEarnings += value;
        break;
    }
    
    stats.conversionRate = stats.clicks > 0 ? (stats.conversions / stats.clicks) * 100 : 0;
    stats.lastActivity = new Date();
    
    this.affiliateStats.set(affiliateId, stats);
  }

  getDefaultStats() {
    return {
      clicks: 0,
      conversions: 0,
      conversionRate: 0,
      totalEarnings: 0,
      lastActivity: new Date()
    };
  }

  async getSaldoDisponivel(affiliateId) {
    const comissoes = await this.getAffiliateCommissions(affiliateId);
    return comissoes
      .filter(c => c.status === 'confirmada')
      .reduce((sum, c) => sum + c.valor, 0);
  }

  calculateOverallConversionRate() {
    const totalClicks = Array.from(this.affiliateStats.values())
      .reduce((sum, stats) => sum + stats.clicks, 0);
    const totalConversions = Array.from(this.affiliateStats.values())
      .reduce((sum, stats) => sum + stats.conversions, 0);
    
    return totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 100 * 100) / 100 : 0;
  }

  getTopPerformers() {
    return Array.from(this.affiliateStats.entries())
      .sort(([,a], [,b]) => b.totalEarnings - a.totalEarnings)
      .slice(0, 5)
      .map(([id, stats]) => ({ id, ...stats }));
  }

  getRecentActivity() {
    return Array.from(this.conversionTracking.values())
      .filter(t => t.convertedAt && t.convertedAt > new Date(Date.now() - 86400000))
      .length;
  }
}

// 🚀 INSTÂNCIA GLOBAL
export const affiliateSystem = new AffiliateSystemManager();

// 🔧 FUNÇÕES AUXILIARES
export const criarAfiliado = (userId, userData) => affiliateSystem.criarAfiliado(userId, userData);
export const capturarIndicacao = (refCode, userId, userIP) => affiliateSystem.capturarIndicacao(refCode, userId, userIP);
export const processarComissao = (paymentData) => affiliateSystem.processarComissao(paymentData);
export const getDashboard = (userId) => affiliateSystem.getDashboardAfiliado(userId);
export const solicitarSaque = (affiliateId, dadosPagamento) => affiliateSystem.solicitarSaque(affiliateId, dadosPagamento);

console.log("🌍🔥 Sistema de afiliados mundial carregado - Máquina de crescimento viral ativa");
