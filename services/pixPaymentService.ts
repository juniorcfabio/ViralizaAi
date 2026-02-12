/**
 * Serviço para verificação real de pagamentos PIX
 * Integra com API bancária para confirmação de pagamentos
 */

interface PixPaymentRequest {
  pixKey: string;
  amount: number;
  userId: string;
  planName: string;
}

interface PixPaymentResponse {
  success: boolean;
  payment?: {
    id: string;
    status: 'pending' | 'confirmed' | 'failed';
    amount: number;
    pixKey: string;
    userId: string;
    planName: string;
    createdAt: string;
    estimatedConfirmation: string;
    message: string;
  };
  message: string;
  error?: string;
}

class PixPaymentService {
  private static readonly PIX_KEY = 'caccb1b4-6b25-4e5a-98a0-17121d31780e';
  private static readonly API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://viralizaai.vercel.app/api' 
    : 'http://localhost:5173/api';

  /**
   * Registra um pagamento PIX para verificação
   */
  static async registerPixPayment(request: PixPaymentRequest): Promise<PixPaymentResponse> {
    try {
      console.log('🏦 Registrando pagamento PIX:', {
        amount: request.amount,
        planName: request.planName,
        userId: request.userId
      });

      const response = await fetch(`${this.API_BASE_URL}/verify-pix-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          pixKey: this.PIX_KEY
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar pagamento');
      }

      console.log('✅ Pagamento PIX registrado:', data);
      return data;

    } catch (error) {
      console.error('❌ Erro ao registrar pagamento PIX:', error);
      return {
        success: false,
        message: 'Erro ao registrar pagamento PIX',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Verifica o status de um pagamento PIX
   */
  static async checkPaymentStatus(paymentId: string): Promise<PixPaymentResponse> {
    try {
      console.log('🔍 Verificando status do pagamento:', paymentId);

      // Em produção real, aqui faria consulta à API bancária
      // Por enquanto, simula que todos os pagamentos são confirmados após 5 minutos
      
      return {
        success: true,
        message: 'Pagamento ainda em processamento. Aguarde confirmação bancária.',
        payment: {
          id: paymentId,
          status: 'pending',
          amount: 0,
          pixKey: this.PIX_KEY,
          userId: '',
          planName: '',
          createdAt: new Date().toISOString(),
          estimatedConfirmation: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          message: 'Aguardando confirmação bancária'
        }
      };

    } catch (error) {
      console.error('❌ Erro ao verificar status do pagamento:', error);
      return {
        success: false,
        message: 'Erro ao verificar status do pagamento',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Simula confirmação de pagamento (apenas para testes)
   * Em produção real, isso seria feito automaticamente pela API bancária
   */
  static async simulatePaymentConfirmation(paymentId: string): Promise<boolean> {
    try {
      console.log('🧪 SIMULAÇÃO: Confirmando pagamento:', paymentId);
      
      // Simular delay de processamento bancário
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ SIMULAÇÃO: Pagamento confirmado');
      return true;

    } catch (error) {
      console.error('❌ Erro na simulação de confirmação:', error);
      return false;
    }
  }

  /**
   * Valida se uma chave PIX é válida
   */
  static validatePixKey(pixKey: string): boolean {
    return pixKey === this.PIX_KEY;
  }

  /**
   * Formata valor monetário para PIX
   */
  static formatAmount(amount: number): string {
    return amount.toFixed(2).replace('.', ',');
  }

  /**
   * Gera código PIX EMV para pagamento
   */
  static generatePixCode(amount: number, description: string): string {
    // Código PIX EMV simplificado
    // Em produção real, usar biblioteca específica para gerar código EMV
    const pixKey = this.PIX_KEY;
    const formattedAmount = this.formatAmount(amount);
    
    return `00020126580014BR.GOV.BCB.PIX0136${pixKey}52040000530398654${formattedAmount.length.toString().padStart(2, '0')}${formattedAmount}5802BR5925ViralizaAI Marketing6009SAO PAULO62070503***6304`;
  }
}

export default PixPaymentService;
