// 🔁 SISTEMA DE GATEWAY DE PAGAMENTO COM FAILOVER
// Múltiplos provedores para máxima disponibilidade

import Stripe from "stripe";
import { PAYMENT_GATEWAYS, detectUserRegion, getLocalizedPrice } from "./globalConfig.js";

// 🔧 CONFIGURAÇÃO DOS GATEWAYS
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export class PaymentGatewayManager {
  constructor() {
    this.gateways = PAYMENT_GATEWAYS.gateways;
    this.primaryGateway = PAYMENT_GATEWAYS.primary;
  }

  // 🌍 PROCESSAR PAGAMENTO COM FAILOVER AUTOMÁTICO
  async processPayment(paymentData, req) {
    const userRegion = detectUserRegion(req);
    const availableGateways = this.getAvailableGateways(userRegion);

    console.log(`💳 Processando pagamento para região: ${userRegion.regionId}`);
    console.log(`🔄 Gateways disponíveis: ${availableGateways.map(g => g.name).join(', ')}`);

    // 🎯 TENTAR CADA GATEWAY EM ORDEM DE PRIORIDADE
    for (const gateway of availableGateways) {
      try {
        console.log(`🔄 Tentando gateway: ${gateway.name}`);
        
        const result = await this.processWithGateway(gateway, paymentData, userRegion);
        
        if (result.success) {
          console.log(`✅ Pagamento processado com sucesso via ${gateway.name}`);
          return {
            success: true,
            gateway: gateway.name,
            data: result.data,
            region: userRegion
          };
        }
        
      } catch (error) {
        console.error(`❌ Falha no gateway ${gateway.name}:`, error.message);
        
        // 📝 LOG DO ERRO PARA MONITORAMENTO
        await this.logGatewayError(gateway.name, error, paymentData);
        
        // 🔄 CONTINUAR PARA PRÓXIMO GATEWAY
        continue;
      }
    }

    // 🚨 TODOS OS GATEWAYS FALHARAM
    console.error("🚨 CRÍTICO: Todos os gateways de pagamento falharam!");
    
    return {
      success: false,
      error: "Serviço de pagamento temporariamente indisponível",
      code: "ALL_GATEWAYS_FAILED",
      region: userRegion
    };
  }

  // 🔧 PROCESSAR COM GATEWAY ESPECÍFICO
  async processWithGateway(gateway, paymentData, userRegion) {
    switch (gateway.name.toLowerCase()) {
      case 'stripe':
        return await this.processWithStripe(paymentData, userRegion);
      
      case 'mercado pago':
        return await this.processWithMercadoPago(paymentData, userRegion);
      
      case 'paypal':
        return await this.processWithPayPal(paymentData, userRegion);
      
      default:
        throw new Error(`Gateway não implementado: ${gateway.name}`);
    }
  }

  // 💳 PROCESSAR COM STRIPE
  async processWithStripe(paymentData, userRegion) {
    const { planType, userId, userEmail } = paymentData;
    
    // 💰 OBTER PREÇO LOCALIZADO
    const pricing = getLocalizedPrice(planType, userRegion.currency);
    if (!pricing) {
      throw new Error(`Preço não encontrado para plano: ${planType}`);
    }

    console.log(`💰 Stripe: ${pricing.formatted} (${userRegion.currency.toUpperCase()})`);

    // 🔧 CONFIGURAR MÉTODOS DE PAGAMENTO POR REGIÃO
    const paymentMethods = this.getPaymentMethodsForRegion(userRegion, 'stripe');

    // 🎯 CRIAR PAYMENT INTENT
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(pricing.amount * 100), // Centavos
      currency: userRegion.currency,
      payment_method_types: paymentMethods,
      metadata: {
        userId,
        planType,
        userEmail,
        region: userRegion.regionId,
        country: userRegion.country,
        gateway: 'stripe'
      },
      description: `ViralizaAI - ${planType} - ${userRegion.country}`,
      receipt_email: userEmail
    });

    // 🔄 PREPARAR RESPOSTA BASEADA NO MÉTODO
    let responseData = {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: pricing.amount,
      currency: userRegion.currency,
      formatted: pricing.formatted
    };

    // 🇧🇷 PIX ESPECÍFICO PARA BRASIL
    if (userRegion.country === 'BR' && paymentMethods.includes('pix')) {
      const pixData = paymentIntent.next_action?.pix_display_qr_code;
      if (pixData) {
        responseData.pix = {
          qrCode: pixData.image_url_png,
          pixCode: pixData.emv_code
        };
      }
    }

    return {
      success: true,
      data: responseData
    };
  }

  // 🇧🇷 PROCESSAR COM MERCADO PAGO (BACKUP PARA BRASIL)
  async processWithMercadoPago(paymentData, userRegion) {
    console.log("🔄 Processando com Mercado Pago (simulado)");
    
    // 🎯 SIMULAÇÃO - EM PRODUÇÃO IMPLEMENTAR SDK DO MERCADO PAGO
    const { planType } = paymentData;
    const pricing = getLocalizedPrice(planType, userRegion.currency);

    // ⏱️ SIMULAR TEMPO DE PROCESSAMENTO
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      data: {
        paymentId: `mp_${Date.now()}`,
        amount: pricing.amount,
        currency: userRegion.currency,
        formatted: pricing.formatted,
        paymentUrl: `https://mercadopago.com.br/checkout/v1/payment/${Date.now()}`,
        gateway: 'mercadopago'
      }
    };
  }

  // 🌍 PROCESSAR COM PAYPAL (BACKUP GLOBAL)
  async processWithPayPal(paymentData, userRegion) {
    console.log("🔄 Processando com PayPal (simulado)");
    
    // 🎯 SIMULAÇÃO - EM PRODUÇÃO IMPLEMENTAR SDK DO PAYPAL
    const { planType } = paymentData;
    const pricing = getLocalizedPrice(planType, userRegion.currency);

    // ⏱️ SIMULAR TEMPO DE PROCESSAMENTO
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      success: true,
      data: {
        paymentId: `pp_${Date.now()}`,
        amount: pricing.amount,
        currency: userRegion.currency,
        formatted: pricing.formatted,
        approvalUrl: `https://paypal.com/checkoutnow?token=${Date.now()}`,
        gateway: 'paypal'
      }
    };
  }

  // 🌍 OBTER GATEWAYS DISPONÍVEIS PARA REGIÃO
  getAvailableGateways(userRegion) {
    const available = [];

    for (const [gatewayId, gateway] of Object.entries(this.gateways)) {
      // ✅ VERIFICAR SE GATEWAY SUPORTA A REGIÃO
      const supportsRegion = gateway.regions.includes('global') || 
                           gateway.regions.includes(userRegion.regionId);
      
      // ✅ VERIFICAR SE GATEWAY SUPORTA A MOEDA
      const supportsCurrency = gateway.currencies.includes(userRegion.currency);

      if (supportsRegion && supportsCurrency) {
        available.push(gateway);
      }
    }

    // 📊 ORDENAR POR PRIORIDADE
    return available.sort((a, b) => a.priority - b.priority);
  }

  // 💳 OBTER MÉTODOS DE PAGAMENTO PARA REGIÃO
  getPaymentMethodsForRegion(userRegion, gatewayName) {
    const gateway = Object.values(this.gateways).find(g => 
      g.name.toLowerCase() === gatewayName.toLowerCase()
    );

    if (!gateway) return ['card'];

    // 🎯 FILTRAR MÉTODOS DISPONÍVEIS NA REGIÃO
    const regionMethods = userRegion.paymentMethods;
    const gatewayMethods = gateway.methods;

    return gatewayMethods.filter(method => regionMethods.includes(method));
  }

  // 📝 LOG DE ERRO DO GATEWAY
  async logGatewayError(gatewayName, error, paymentData) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      gateway: gatewayName,
      error: error.message,
      stack: error.stack,
      paymentData: {
        planType: paymentData.planType,
        userId: paymentData.userId,
        // Não logar dados sensíveis
      }
    };

    console.error("🚨 Gateway Error Log:", errorLog);

    // 🔍 EM PRODUÇÃO: ENVIAR PARA SISTEMA DE MONITORAMENTO
    // await sendToDatadog(errorLog);
    // await sendToSentry(error);
  }

  // 📊 OBTER ESTATÍSTICAS DOS GATEWAYS
  async getGatewayStats() {
    // 🎯 SIMULAÇÃO - EM PRODUÇÃO BUSCAR DO BANCO/CACHE
    return {
      stripe: {
        successRate: 98.5,
        avgResponseTime: 1200,
        lastFailure: null,
        status: 'healthy'
      },
      mercadopago: {
        successRate: 96.2,
        avgResponseTime: 2100,
        lastFailure: new Date(Date.now() - 3600000), // 1 hora atrás
        status: 'healthy'
      },
      paypal: {
        successRate: 94.8,
        avgResponseTime: 1800,
        lastFailure: new Date(Date.now() - 7200000), // 2 horas atrás
        status: 'degraded'
      }
    };
  }

  // 🔍 VERIFICAR SAÚDE DOS GATEWAYS
  async healthCheck() {
    const results = {};

    for (const [gatewayId, gateway] of Object.entries(this.gateways)) {
      try {
        const startTime = Date.now();
        
        // 🏥 TESTE ESPECÍFICO POR GATEWAY
        await this.testGateway(gateway.name);
        
        const responseTime = Date.now() - startTime;
        
        results[gatewayId] = {
          status: 'healthy',
          responseTime,
          lastCheck: new Date().toISOString()
        };
        
      } catch (error) {
        results[gatewayId] = {
          status: 'unhealthy',
          error: error.message,
          lastCheck: new Date().toISOString()
        };
      }
    }

    return results;
  }

  // 🧪 TESTAR GATEWAY ESPECÍFICO
  async testGateway(gatewayName) {
    switch (gatewayName.toLowerCase()) {
      case 'stripe':
        // Teste simples do Stripe
        await stripe.paymentMethods.list({ limit: 1 });
        break;
        
      case 'mercado pago':
        // Teste simulado do Mercado Pago
        await new Promise(resolve => setTimeout(resolve, 100));
        break;
        
      case 'paypal':
        // Teste simulado do PayPal
        await new Promise(resolve => setTimeout(resolve, 150));
        break;
        
      default:
        throw new Error(`Teste não implementado para: ${gatewayName}`);
    }
  }
}

// 🚀 INSTÂNCIA GLOBAL DO GERENCIADOR
export const paymentGateway = new PaymentGatewayManager();

// 🔄 FUNÇÃO AUXILIAR PARA PROCESSAR PAGAMENTO
export async function processGlobalPayment(paymentData, req) {
  return await paymentGateway.processPayment(paymentData, req);
}

// 🏥 FUNÇÃO AUXILIAR PARA VERIFICAR SAÚDE
export async function checkGatewayHealth() {
  return await paymentGateway.healthCheck();
}
