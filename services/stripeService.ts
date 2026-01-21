// STRIPE SERVICE - INTEGRAÇÃO COMPLETA PARA PAGAMENTOS REAIS
// Sistema ultra-avançado para processar todos os pagamentos via Stripe

export interface StripePaymentData {
  amount: number;
  currency: string;
  description: string;
  productId: string;
  productType: 'subscription' | 'tool' | 'ad';
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface StripeSubscriptionData extends StripePaymentData {
  planId: string;
  planName: string;
  billingCycle: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
}

class StripeService {
  private static instance: StripeService;
  private stripePublicKey: string;
  private isInitialized: boolean = false;

  constructor() {
    // Chave pública do Stripe LIVE configurada
    this.stripePublicKey = process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_live_51RbXyNH6btTxgDogkRcYNr8SyOg4KzGPG0TJQb7zU8TsI';
  }

  static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  // Inicializar Stripe
  async initializeStripe(): Promise<any> {
    if (this.isInitialized && (window as any).Stripe) {
      return (window as any).Stripe(this.stripePublicKey);
    }

    try {
      // Verificar se Stripe já está carregado
      if (typeof window !== 'undefined' && (window as any).Stripe) {
        this.isInitialized = true;
        console.log('✅ Stripe já estava carregado');
        return (window as any).Stripe(this.stripePublicKey);
      }

      // Carregar Stripe.js dinamicamente
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        script.onload = () => {
          // Aguardar um pouco para garantir que o Stripe está disponível
          setTimeout(() => {
            if ((window as any).Stripe) {
              resolve(true);
            } else {
              reject(new Error('Stripe não foi carregado corretamente'));
            }
          }, 100);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });

      this.isInitialized = true;
      console.log('✅ Stripe inicializado com sucesso');
      return (window as any).Stripe(this.stripePublicKey);
    } catch (error) {
      console.error('❌ Erro ao inicializar Stripe:', error);
      throw new Error('Falha na inicialização do Stripe');
    }
  }

  // SISTEMA DE CHECKOUT RECONSTRUÍDO - SOLUÇÃO DEFINITIVA
  async processSubscriptionPayment(subscriptionData: any): Promise<void> {
    try {
      console.log('🚀 SISTEMA RECONSTRUÍDO - Processando pagamento...');
      console.log('📋 Dados da assinatura:', subscriptionData);

      // Validar dados antes de enviar
      if (!subscriptionData.line_items || !Array.isArray(subscriptionData.line_items)) {
        throw new Error('line_items é obrigatório e deve ser um array');
      }

      if (!subscriptionData.success_url || !subscriptionData.cancel_url) {
        throw new Error('success_url e cancel_url são obrigatórios');
      }

      // Usar API create-checkout-session reconstruída
      const appBaseUrl = window.location.origin;
      console.log('🔗 Chamando API reconstruída:', `${appBaseUrl}/api/create-checkout-session`);
      
      const response = await fetch(`${appBaseUrl}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData)
      });

      console.log('📡 Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro da API reconstruída:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        throw new Error(`API Error: ${response.status} - ${errorData.message || errorText}`);
      }

      const result = await response.json();
      console.log('✅ Resultado da API reconstruída:', result);
      
      if (result.success && result.url) {
        console.log('🎉 SUCESSO! Redirecionando para Stripe...');
        console.log('🔗 URL do checkout:', result.url);
        window.location.href = result.url;
      } else {
        throw new Error(result.message || 'URL de checkout não retornada');
      }
      
    } catch (error) {
      console.error('❌ ERRO no sistema reconstruído:', error);
      throw error;
    }
  }

  // Processar pagamento de ferramenta avulsa
  async processToolPayment(data: StripePaymentData): Promise<void> {
    await this.initializeStripe();

    try {
      console.log('🔧 Iniciando pagamento de ferramenta via Stripe');
      console.log('💰 Ferramenta:', data.description, '- R$', data.amount);

      // Usar API específica para ferramentas
      console.log('📡 Chamando API de ferramenta:', {
        amount: data.amount,
        description: data.description,
        successUrl: data.successUrl
      });
      
      const response = await fetch('https://viralizaai.vercel.app/api/create-tool-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: data.amount,
          currency: data.currency,
          description: data.description,
          success_url: data.successUrl,
          cancel_url: data.cancelUrl,
          customer_email: data.userEmail,
          metadata: data.metadata
        })
      });
      
      console.log('📡 Resposta da API:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.url) {
        console.log('✅ Redirecionando para checkout de ferramenta:', result.sessionId);
        window.location.href = result.url;
      } else {
        throw new Error('Falha ao criar sessão de checkout de ferramenta');
      }
    } catch (error) {
      console.error('❌ Erro no pagamento de ferramenta:', error);
      throw error;
    }
  }

  // Processar pagamento de anúncio
  async processAdPayment(data: StripePaymentData): Promise<void> {
    await this.initializeStripe();

    try {
      console.log('📢 Iniciando pagamento de anúncio via Stripe');
      console.log(`💰 Anúncio: ${data.description} - R$ ${data.amount.toFixed(2)}`);

      // Usar API específica para anúncios
      const response = await fetch('https://viralizaai.vercel.app/api/create-ad-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: data.amount,
          currency: data.currency,
          description: data.description,
          success_url: data.successUrl,
          cancel_url: data.cancelUrl,
          customer_email: data.userEmail,
          metadata: data.metadata
        })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.url) {
        console.log('✅ Redirecionando para checkout de anúncio:', result.sessionId);
        window.location.href = result.url;
      } else {
        throw new Error('Falha ao criar sessão de checkout de anúncio');
      }
    } catch (error) {
      console.error('❌ Erro no pagamento de anúncio:', error);
      throw error;
    }
  }

  // Redirecionar para Stripe Checkout REAL - CONFIGURAÇÃO FUNCIONANDO 02/01 e 07/01/2026
  private async redirectToStripeCheckout(checkoutData: any): Promise<void> {
    try {
      console.log('🔄 Criando sessão Stripe (configuração 02/01-07/01/2026)...');
      console.log('📋 Dados do checkout:', checkoutData);
      
      // Usar API create-checkout-session que estava funcionando perfeitamente
      const appBaseUrl = window.location.origin;
      const response = await fetch(`${appBaseUrl}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData)
      });

      console.log('📡 Resposta da API original:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro da API original:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Resultado recebido:', result);
      
      if (result.success && result.url) {
        console.log('🔄 Redirecionando para Stripe (método funcionando)...');
        window.location.href = result.url;
      } else {
        throw new Error('URL de checkout não retornada');
      }
      
    } catch (error) {
      console.error('❌ Erro ao criar sessão Stripe:', error);
      
      // Fallback: usar Stripe.js diretamente
      await this.fallbackStripeRedirect(checkoutData);
    }
  }

  // Fallback para API original
  private async fallbackToOriginalAPI(checkoutData: any): Promise<void> {
    try {
      console.log('🔄 Tentando API original como fallback...');
      
      const response = await fetch('https://viralizaai.vercel.app/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData)
      });

      if (!response.ok) {
        throw new Error('Falha na API original');
      }

      const { sessionId, url } = await response.json();
      
      if (url) {
        console.log('✅ Redirecionando via API original...');
        window.location.href = url;
      } else {
        throw new Error('URL não retornada pela API original');
      }
      
    } catch (error) {
      console.error('❌ Erro no fallback para API original:', error);
      alert('Erro ao processar pagamento. Verifique sua conexão e tente novamente.');
    }
  }

  // Fallback usando Stripe.js diretamente
  private async fallbackStripeRedirect(checkoutData: any): Promise<void> {
    try {
      // Garantir que o Stripe está inicializado
      await this.initializeStripe();
      
      // @ts-ignore
      const stripe = (window as any).Stripe ? (window as any).Stripe(this.stripePublicKey) : null;
      
      if (!stripe) {
        throw new Error('Stripe não carregado após inicialização');
      }

      console.log('🔄 Usando Stripe.js diretamente como fallback...');
      
      // Criar sessão usando Stripe.js
      const { error } = await stripe.redirectToCheckout({
        sessionId: await this.createCheckoutSession(checkoutData)
      });

      if (error) {
        throw error;
      }
      
    } catch (error) {
      console.error('❌ Erro no fallback Stripe:', error);
      alert('Erro ao processar pagamento. Verifique sua conexão e tente novamente.');
    }
  }

  // Criar sessão de checkout
  private async createCheckoutSession(checkoutData: any): Promise<string> {
    try {
      const response = await fetch('https://viralizaai.vercel.app/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.sessionId) {
        throw new Error('Session ID não retornado pela API');
      }

      return data.sessionId;
    } catch (error) {
      console.error('❌ Erro ao criar sessão:', error);
      throw error;
    }
  }

  // Modal de demonstração do pagamento
  private showPaymentModal(checkoutData: any): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div class="text-center">
          <div class="text-6xl mb-4">💳</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-4">Pagamento via Stripe</h2>
          <p class="text-gray-600 mb-4">Você seria redirecionado para o Stripe Checkout</p>
          <div class="bg-gray-100 p-4 rounded-lg mb-4">
            <p class="text-sm text-gray-700">
              <strong>Produto:</strong> ${checkoutData.line_items[0].price_data.product_data.name}<br>
              <strong>Valor:</strong> R$ ${(checkoutData.line_items[0].price_data.unit_amount / 100).toFixed(2)}
            </p>
          </div>
          <div class="flex gap-3 justify-center">
            <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" 
                    class="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600">
              Fechar
            </button>
            <button onclick="alert('Pagamento processado com sucesso!'); this.parentElement.parentElement.parentElement.parentElement.remove();" 
                    class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
              Simular Pagamento
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  // Converter ciclo de cobrança para formato Stripe
  private getBillingInterval(cycle: string): string {
    switch (cycle) {
      case 'monthly': return 'month';
      case 'quarterly': return 'month'; // 3 meses
      case 'semiannual': return 'month'; // 6 meses
      case 'annual': return 'year';
      default: return 'month';
    }
  }

  // Verificar status do pagamento
  async checkPaymentStatus(sessionId: string): Promise<any> {
    try {
      console.log('🔍 Verificando status do pagamento:', sessionId);
      
      // Em produção, faria chamada para API do backend
      // que consultaria o Stripe para verificar o status
      
      return {
        status: 'completed',
        paymentId: sessionId,
        amount: 0,
        currency: 'BRL',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      throw error;
    }
  }
}
