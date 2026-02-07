// 🚀 STRIPE SERVICE - VERSÃO EXATA DO DIA 28/01/2026
// Sistema que funcionava perfeitamente sem erros

class StripeService28Jan {
  constructor() {
    this.apiUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:5173/api' 
      : 'https://viralizaai.vercel.app/api';
    
    console.log('🚀 Stripe Service 28/01/2026 inicializado');
  }

  // 💳 CRIAR SESSÃO DE CHECKOUT PARA PLANOS
  async createCheckoutSession(planData) {
    try {
      console.log('💳 Criando sessão checkout (28/01/2026):', planData);

      const response = await fetch(`${this.apiUrl}/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(planData.price.toString().replace('R$ ', '').replace(',', '.')),
          currency: 'brl',
          description: `Assinatura ${planData.name} - ViralizaAI`,
          success_url: `${window.location.origin}/dashboard?payment=success&plan=${planData.id}`,
          cancel_url: `${window.location.origin}/pricing?payment=cancelled`,
          customer_email: planData.email,
          metadata: {
            plan_id: planData.id,
            plan_name: planData.name,
            user_id: planData.userId,
            product_type: 'subscription'
          },
          product_type: 'subscription'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Sessão criada (28/01/2026):', data);

      if (data.success && data.url) {
        console.log('🔄 Redirecionando para Stripe...');
        window.location.href = data.url;
        return data;
      } else {
        throw new Error(data.error || 'Erro ao criar sessão de checkout');
      }

    } catch (error) {
      console.error('❌ Erro na sessão de checkout:', error);
      throw error;
    }
  }

  // 🛠️ CRIAR CHECKOUT PARA FERRAMENTAS
  async createToolCheckout(toolData) {
    try {
      console.log('🛠️ Criando checkout ferramenta (28/01/2026):', toolData);

      const response = await fetch(`${this.apiUrl}/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(toolData.price.toString().replace('R$ ', '').replace(',', '.')),
          currency: 'brl',
          description: `Compra ${toolData.name} - ViralizaAI`,
          success_url: `${window.location.origin}/dashboard?payment=success&tool=${toolData.id}`,
          cancel_url: `${window.location.origin}/dashboard?payment=cancelled`,
          customer_email: toolData.email,
          metadata: {
            tool_id: toolData.id,
            tool_name: toolData.name,
            user_id: toolData.userId,
            product_type: 'tool'
          },
          product_type: 'tool'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Checkout ferramenta criado (28/01/2026):', data);

      if (data.success && data.url) {
        console.log('🔄 Redirecionando para Stripe...');
        window.location.href = data.url;
        return data;
      } else {
        throw new Error(data.error || 'Erro ao criar checkout da ferramenta');
      }

    } catch (error) {
      console.error('❌ Erro no checkout da ferramenta:', error);
      throw error;
    }
  }

  // 📢 CRIAR CHECKOUT PARA ANÚNCIOS
  async createAdCheckout(adData) {
    try {
      console.log('📢 Criando checkout anúncio (28/01/2026):', adData);

      const response = await fetch(`${this.apiUrl}/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: adData.amount,
          currency: 'brl',
          description: `${adData.name} - ${adData.companyName} - ViralizaAI`,
          success_url: `${window.location.origin}/advertise?payment=success&plan=${adData.plan}`,
          cancel_url: `${window.location.origin}/advertise?payment=cancelled`,
          customer_email: adData.email,
          metadata: {
            ad_plan: adData.plan,
            ad_name: adData.name,
            company_name: adData.companyName,
            user_id: adData.userId,
            product_type: 'advertisement'
          },
          product_type: 'advertisement'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Checkout anúncio criado (28/01/2026):', data);

      if (data.success && data.url) {
        console.log('🔄 Redirecionando para Stripe...');
        window.location.href = data.url;
        return data;
      } else {
        throw new Error(data.error || 'Erro ao criar checkout do anúncio');
      }

    } catch (error) {
      console.error('❌ Erro no checkout do anúncio:', error);
      throw error;
    }
  }

  // 🚀 MÉTODO UNIFICADO DE REDIRECIONAMENTO (28/01/2026)
  async redirectToCheckout(checkoutData) {
    try {
      console.log('🚀 Redirecionamento unificado (28/01/2026):', checkoutData);

      // Determinar tipo de produto
      if (checkoutData.type === 'plan' || checkoutData.planId) {
        return await this.createCheckoutSession(checkoutData);
      } else if (checkoutData.type === 'tool' || checkoutData.toolId) {
        return await this.createToolCheckout(checkoutData);
      } else if (checkoutData.type === 'ad' || checkoutData.adId) {
        return await this.createAdCheckout(checkoutData);
      } else {
        // Fallback para plano
        return await this.createCheckoutSession(checkoutData);
      }

    } catch (error) {
      console.error('❌ Erro no redirecionamento:', error);
      throw error;
    }
  }
}

// Exportar instância única
export default new StripeService28Jan();
