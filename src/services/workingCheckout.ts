// SISTEMA DE CHECKOUT RECONSTRUÍDO BASEADO NA VERSÃO FUNCIONAL
// Este é o sistema que está funcionando nas imagens fornecidas

export interface CheckoutData {
  planName: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  planId?: string;
}

class WorkingCheckoutService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = 'https://viralizaai.vercel.app/api';
    console.log('🔗 API Base URL:', this.apiBaseUrl);
  }

  async processSubscriptionPayment(subscriptionData: any): Promise<void> {
    try {
      console.log('🚀 SISTEMA RECONSTRUÍDO - Processando pagamento...');
      console.log('📋 Dados da assinatura:', subscriptionData);

      // Extrair dados do formato da LandingPage
      const checkoutData: CheckoutData = {
        planName: subscriptionData.line_items[0].price_data.product_data.name,
        amount: subscriptionData.line_items[0].price_data.unit_amount,
        billingCycle: subscriptionData.billingCycle || 'monthly',
        planId: subscriptionData.planId || 'basic'
      };

      // Usar a API que realmente funciona
      const apiUrl = `${window.location.origin}/api/stripe-checkout`;
      console.log('🔗 Chamando API que funciona:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: checkoutData.amount,
          currency: 'brl',
          description: checkoutData.planName,
          success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/cancel`,
          customer_email: 'usuario@viralizaai.com',
          metadata: {
            source: 'landing_page',
            plan_name: checkoutData.planName,
            billing_cycle: checkoutData.billingCycle,
            plan_id: checkoutData.planId
          },
          product_type: 'subscription'
        })
      });

      console.log('📡 Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na API reconstruída:', errorText);
        throw new Error(`Erro HTTP: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Resultado da API reconstruída:', result);
      
      if (result.success && result.url) {
        console.log('🎉 SUCESSO! Redirecionando para Stripe...');
        console.log('🔗 URL do checkout:', result.url);
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'Erro desconhecido na criação da sessão');
      }

    } catch (error) {
      console.error('❌ Erro no sistema reconstruído:', error);
      throw error;
    }
  }
}

// Instância singleton
export const workingCheckoutService = new WorkingCheckoutService();

// Função de conveniência para compatibilidade
export const processSubscriptionPayment = async (subscriptionData: any): Promise<void> => {
  return workingCheckoutService.processSubscriptionPayment(subscriptionData);
};

export default workingCheckoutService;
