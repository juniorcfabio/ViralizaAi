// =======================
// 🔥 STRIPE PIX SERVICE - INTEGRAÇÃO COMPLETA
// =======================

export interface PixCheckoutData {
  userId: string;
  planName: string;
  planType: string;
  amount: number;
  userEmail: string;
  userName?: string;
}

export interface PixCheckoutResponse {
  success: boolean;
  url?: string;
  sessionId?: string;
  expiresAt?: number;
  error?: string;
}

export class StripePixService {
  private static instance: StripePixService;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://viralizaai.vercel.app'
      : 'http://localhost:3000';
  }

  static getInstance(): StripePixService {
    if (!StripePixService.instance) {
      StripePixService.instance = new StripePixService();
    }
    return StripePixService.instance;
  }

  // Criar checkout PIX
  async createPixCheckout(data: PixCheckoutData): Promise<PixCheckoutResponse> {
    try {
      console.log('🔥 Criando checkout PIX:', data);

      const response = await fetch(`${this.baseUrl}/api/create-pix-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar checkout PIX');
      }

      return result;
    } catch (error) {
      console.error('❌ Erro no serviço PIX:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Verificar status do pagamento
  async checkPaymentStatus(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/check-payment-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });

      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  // Valores fixos dos planos (antifraude)
  getPlanPrice(planType: string): number {
    const prices: Record<string, number> = {
      'mensal': 59.90,
      'trimestral': 149.90,
      'semestral': 279.90,
      'anual': 499.90,
      'ebook': 29.90,
      'video': 19.90,
      'funnel': 39.90,
      'anuncio': 99.90,
      'ferramenta': 9.90
    };

    return prices[planType] || 59.90;
  }

  // Validar dados do checkout
  validateCheckoutData(data: PixCheckoutData): { valid: boolean; error?: string } {
    if (!data.userId) {
      return { valid: false, error: 'ID do usuário é obrigatório' };
    }

    if (!data.userEmail || !this.isValidEmail(data.userEmail)) {
      return { valid: false, error: 'Email válido é obrigatório' };
    }

    if (!data.planName || data.planName.trim().length === 0) {
      return { valid: false, error: 'Nome do plano é obrigatório' };
    }

    if (!data.planType || data.planType.trim().length === 0) {
      return { valid: false, error: 'Tipo do plano é obrigatório' };
    }

    if (!data.amount || data.amount < 1) {
      return { valid: false, error: 'Valor deve ser maior que R$ 1,00' };
    }

    // Verificar se o valor está correto para o plano
    const expectedPrice = this.getPlanPrice(data.planType);
    if (Math.abs(data.amount - expectedPrice) > 0.10) {
      return { valid: false, error: 'Valor inválido para este plano' };
    }

    return { valid: true };
  }

  // Validar email
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Hook para usar o serviço PIX
export const useStripePixService = () => {
  const service = StripePixService.getInstance();

  const createCheckout = async (data: PixCheckoutData): Promise<PixCheckoutResponse> => {
    // Validar dados
    const validation = service.validateCheckoutData(data);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Criar checkout
    return await service.createPixCheckout(data);
  };

  const getPlanPrice = (planType: string): number => {
    return service.getPlanPrice(planType);
  };

  const checkPaymentStatus = async (sessionId: string) => {
    return await service.checkPaymentStatus(sessionId);
  };

  return {
    createCheckout,
    getPlanPrice,
    checkPaymentStatus
  };
};

export default StripePixService;
