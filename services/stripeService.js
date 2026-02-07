// 🚀 SERVIÇO STRIPE - INTEGRAÇÃO FRONTEND
// Restaurado da versão F323zcAzv que funcionava perfeitamente

class StripeService {
  constructor() {
    this.apiUrl = process.env.VITE_API_BASE_URL || 'https://viralizaai.vercel.app/api';
  }

  // 💳 CRIAR SESSÃO DE CHECKOUT PARA PLANOS
  async createCheckoutSession(planData) {
    try {
      console.log('🚀 Criando sessão Stripe para plano:', planData);

      const response = await fetch(`${this.apiUrl}/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: planData.price,
          currency: 'brl',
          description: `Plano ${planData.name} - ViralizaAI`,
          success_url: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${planData.id}`,
          cancel_url: `${window.location.origin}/pricing?canceled=true`,
          customer_email: planData.email,
          metadata: {
            plan_id: planData.id,
            plan_name: planData.name,
            user_id: planData.userId || 'guest',
            product_type: 'subscription'
          },
          product_type: 'subscription'
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao criar sessão de pagamento');
      }

      console.log('✅ Sessão criada com sucesso:', data);
      return data;

    } catch (error) {
      console.error('❌ Erro ao criar checkout:', error);
      throw error;
    }
  }

  // 🛠️ CRIAR SESSÃO PARA FERRAMENTAS AVULSAS
  async createToolCheckout(toolData) {
    try {
      console.log('🛠️ Criando checkout para ferramenta:', toolData);

      const response = await fetch(`${this.apiUrl}/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: toolData.price,
          currency: 'brl',
          description: `${toolData.name} - Ferramenta ViralizaAI`,
          success_url: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&tool=${toolData.id}`,
          cancel_url: `${window.location.origin}/dashboard/ultra-tools?canceled=true`,
          customer_email: toolData.email,
          metadata: {
            tool_id: toolData.id,
            tool_name: toolData.name,
            user_id: toolData.userId || 'guest',
            product_type: 'tool'
          },
          product_type: 'tool'
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao criar sessão de pagamento');
      }

      console.log('✅ Checkout ferramenta criado:', data);
      return data;

    } catch (error) {
      console.error('❌ Erro ao criar checkout ferramenta:', error);
      throw error;
    }
  }

  // 📢 CRIAR SESSÃO PARA ANÚNCIOS
  async createAdCheckout(adData) {
    try {
      console.log('📢 Criando checkout para anúncio:', adData);

      const response = await fetch(`${this.apiUrl}/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: adData.price,
          currency: 'brl',
          description: `Anúncio ${adData.type} - ViralizaAI`,
          success_url: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&ad=${adData.id}`,
          cancel_url: `${window.location.origin}/advertise?canceled=true`,
          customer_email: adData.email,
          metadata: {
            ad_id: adData.id,
            ad_type: adData.type,
            user_id: adData.userId || 'guest',
            product_type: 'advertisement'
          },
          product_type: 'advertisement'
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erro ao criar sessão de pagamento');
      }

      console.log('✅ Checkout anúncio criado:', data);
      return data;

    } catch (error) {
      console.error('❌ Erro ao criar checkout anúncio:', error);
      throw error;
    }
  }

  // 🚀 REDIRECIONAR PARA CHECKOUT
  async redirectToCheckout(checkoutData) {
    try {
      let sessionData;

      // Determinar tipo de produto e criar sessão apropriada
      if (checkoutData.type === 'plan' || checkoutData.planId) {
        sessionData = await this.createCheckoutSession(checkoutData);
      } else if (checkoutData.type === 'tool' || checkoutData.toolId) {
        sessionData = await this.createToolCheckout(checkoutData);
      } else if (checkoutData.type === 'ad' || checkoutData.adId) {
        sessionData = await this.createAdCheckout(checkoutData);
      } else {
        // Fallback genérico
        sessionData = await this.createCheckoutSession(checkoutData);
      }

      if (sessionData.url) {
        console.log('🔄 Redirecionando para Stripe:', sessionData.url);
        window.location.href = sessionData.url;
        return sessionData;
      } else {
        throw new Error('URL de checkout não recebida');
      }

    } catch (error) {
      console.error('❌ Erro no redirecionamento:', error);
      
      // Mostrar erro amigável para o usuário
      alert(`Erro ao processar pagamento: ${error.message}\n\nTente novamente ou entre em contato com o suporte.`);
      throw error;
    }
  }

  // 🔍 VERIFICAR STATUS DO PAGAMENTO
  async checkPaymentStatus(sessionId) {
    try {
      const response = await fetch(`${this.apiUrl}/check-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('❌ Erro ao verificar pagamento:', error);
      throw error;
    }
  }
}

// Criar e exportar instância única
export default new StripeService();
