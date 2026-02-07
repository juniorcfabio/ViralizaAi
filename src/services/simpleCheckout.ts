// CHECKOUT SIMPLES E DIRETO - SEM DEPENDÊNCIAS COMPLEXAS
// Funciona diretamente com API Stripe via Vercel

export interface SimpleCheckoutData {
  planName: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
}

export const processSimpleCheckout = async (subscriptionData: any): Promise<void> => {
  try {
    console.log('🚀 Processando checkout simples...');
    
    // Extrair dados do formato da LandingPage
    const checkoutData: SimpleCheckoutData = {
      planName: subscriptionData.line_items[0].price_data.product_data.name,
      amount: subscriptionData.line_items[0].price_data.unit_amount,
      billingCycle: subscriptionData.billingCycle || 'monthly'
    };

    console.log('📋 Dados do checkout:', checkoutData);

    // Chamar API diretamente
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planName: checkoutData.planName,
        amount: checkoutData.amount,
        billingCycle: checkoutData.billingCycle,
        successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/cancel`,
        metadata: {
          source: 'landing_page',
          plan_name: checkoutData.planName,
          billing_cycle: checkoutData.billingCycle
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API:', errorText);
      throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (result.success && result.url) {
      console.log('✅ Redirecionando para Stripe:', result.sessionId);
      window.location.href = result.url;
    } else {
      throw new Error(result.error || 'Erro desconhecido na criação da sessão');
    }

  } catch (error) {
    console.error('❌ Erro no checkout simples:', error);
    throw error;
  }
};

export default processSimpleCheckout;
