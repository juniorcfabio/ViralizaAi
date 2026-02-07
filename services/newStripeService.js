// 🚀 NOVO SERVIÇO STRIPE - RECONSTRUÍDO COMPLETAMENTE DO ZERO
// Sistema totalmente novo baseado na versão que funciona perfeitamente

class NewStripeService {
  constructor() {
    this.baseUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:5173' 
      : 'https://viralizaai.vercel.app';
    
    console.log('🚀 Novo Serviço Stripe inicializado:', this.baseUrl);
  }

  // 💳 CRIAR CHECKOUT PARA PLANOS
  async createPlanCheckout(planData) {
    try {
      console.log('💳 Criando checkout para plano:', planData);

      const response = await fetch(`${this.baseUrl}/api/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(planData.price.toString().replace('R$ ', '').replace(',', '.')),
          currency: 'brl',
          description: `Assinatura ${planData.name} - ViralizaAI`,
          success_url: `${this.baseUrl}/dashboard?payment=success&plan=${planData.type}`,
          cancel_url: `${this.baseUrl}/pricing?payment=cancelled`,
          customer_email: planData.email,
          metadata: {
            plan_type: planData.type,
            plan_name: planData.name,
            user_id: planData.userId,
            product_type: 'subscription'
          },
          product_type: 'subscription'
        })
      });

      const data = await response.json();
      console.log('📋 Resposta checkout plano:', data);

      if (data.success && data.url) {
        console.log('🔄 Redirecionando para Stripe (plano):', data.url);
        window.location.href = data.url;
        return data;
      } else {
        throw new Error(data.error || 'Erro ao criar checkout do plano');
      }

    } catch (error) {
      console.error('❌ Erro no checkout do plano:', error);
      throw error;
    }
  }

  // 🛠️ CRIAR CHECKOUT PARA FERRAMENTAS
  async createToolCheckout(toolData) {
    try {
      console.log('🛠️ Criando checkout para ferramenta:', toolData);

      const response = await fetch(`${this.baseUrl}/api/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(toolData.price.toString().replace('R$ ', '').replace(',', '.')),
          currency: 'brl',
          description: `Compra ${toolData.name} - ViralizaAI`,
          success_url: `${this.baseUrl}/dashboard?payment=success&tool=${toolData.id}`,
          cancel_url: `${this.baseUrl}/dashboard?payment=cancelled`,
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

      const data = await response.json();
      console.log('📋 Resposta checkout ferramenta:', data);

      if (data.success && data.url) {
        console.log('🔄 Redirecionando para Stripe (ferramenta):', data.url);
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
      console.log('📢 Criando checkout para anúncio:', adData);

      const response = await fetch(`${this.baseUrl}/api/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: adData.amount,
          currency: 'brl',
          description: `${adData.name} - ${adData.companyName} - ViralizaAI`,
          success_url: `${this.baseUrl}/advertise?payment=success&plan=${adData.plan}`,
          cancel_url: `${this.baseUrl}/advertise?payment=cancelled`,
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

      const data = await response.json();
      console.log('📋 Resposta checkout anúncio:', data);

      if (data.success && data.url) {
        console.log('🔄 Redirecionando para Stripe (anúncio):', data.url);
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
}

// Exportar instância única
export default new NewStripeService();
