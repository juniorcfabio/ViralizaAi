/**
 * Serviço de Pagamento Automático de Afiliados
 * Integração com Stripe/BTG para pagamentos automáticos após aprovação
 */

export interface BankingData {
  bank: string;
  agency: string;
  account: string;
  pixKey: string;
  accountType: 'corrente' | 'poupanca';
  accountHolder: string;
  cpf: string;
}

export interface WithdrawalRequest {
  id: string;
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  amount: number;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'processing';
  bankingData: BankingData;
  approvedBy?: string;
  approvedDate?: string;
  paidDate?: string;
  transactionId?: string;
  rejectionReason?: string;
}

export interface CommissionConfig {
  percentage: number;
  lastUpdated: string;
  updatedBy: string;
}

class AffiliatePaymentService {
  private static instance: AffiliatePaymentService;
  private readonly STORAGE_KEY = 'viraliza_affiliate_payments_v1';
  private readonly COMMISSION_CONFIG_KEY = 'viraliza_commission_config_v1';

  static getInstance(): AffiliatePaymentService {
    if (!AffiliatePaymentService.instance) {
      AffiliatePaymentService.instance = new AffiliatePaymentService();
    }
    return AffiliatePaymentService.instance;
  }

  /**
   * Configurar percentual de comissão global
   */
  setCommissionPercentage(percentage: number, adminId: string): void {
    const config: CommissionConfig = {
      percentage,
      lastUpdated: new Date().toISOString(),
      updatedBy: adminId
    };

    localStorage.setItem(this.COMMISSION_CONFIG_KEY, JSON.stringify(config));
    
    // Disparar evento para atualizar todas as referências
    window.dispatchEvent(new CustomEvent('commissionUpdated', { 
      detail: { percentage } 
    }));

    console.log(`💰 Comissão de afiliados atualizada para ${percentage}%`);
  }

  /**
   * Obter percentual de comissão atual
   */
  getCommissionPercentage(): number {
    try {
      const config = localStorage.getItem(this.COMMISSION_CONFIG_KEY);
      if (config) {
        const parsed: CommissionConfig = JSON.parse(config);
        return parsed.percentage;
      }
    } catch (error) {
      console.error('❌ Erro ao obter percentual de comissão:', error);
    }
    
    // Valor padrão de 20%
    return 20;
  }

  /**
   * Calcular comissão baseada no valor da venda
   */
  calculateCommission(saleAmount: number): number {
    const percentage = this.getCommissionPercentage();
    return (saleAmount * percentage) / 100;
  }

  /**
   * Salvar dados bancários do afiliado
   */
  saveBankingData(affiliateId: string, bankingData: BankingData): void {
    try {
      const key = `banking_data_${affiliateId}`;
      localStorage.setItem(key, JSON.stringify(bankingData));
      console.log(`🏦 Dados bancários salvos para afiliado ${affiliateId}`);
    } catch (error) {
      console.error('❌ Erro ao salvar dados bancários:', error);
    }
  }

  /**
   * Obter dados bancários do afiliado
   */
  getBankingData(affiliateId: string): BankingData | null {
    try {
      const key = `banking_data_${affiliateId}`;
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('❌ Erro ao obter dados bancários:', error);
    }
    return null;
  }

  /**
   * Criar solicitação de saque
   */
  createWithdrawalRequest(affiliateId: string, affiliateName: string, affiliateEmail: string, amount: number): WithdrawalRequest | null {
    try {
      const bankingData = this.getBankingData(affiliateId);
      if (!bankingData) {
        throw new Error('Dados bancários não encontrados');
      }

      const request: WithdrawalRequest = {
        id: `WD_${Date.now()}_${affiliateId}`,
        affiliateId,
        affiliateName,
        affiliateEmail,
        amount,
        requestDate: new Date().toISOString(),
        status: 'pending',
        bankingData
      };

      const requests = this.getAllWithdrawalRequests();
      requests.push(request);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(requests));

      console.log(`💸 Solicitação de saque criada: ${request.id} - R$ ${amount}`);
      return request;

    } catch (error) {
      console.error('❌ Erro ao criar solicitação de saque:', error);
      return null;
    }
  }

  /**
   * Obter todas as solicitações de saque
   */
  getAllWithdrawalRequests(): WithdrawalRequest[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('❌ Erro ao obter solicitações:', error);
    }
    return [];
  }

  /**
   * Obter solicitações pendentes de aprovação
   */
  getPendingWithdrawals(): WithdrawalRequest[] {
    return this.getAllWithdrawalRequests().filter(req => req.status === 'pending');
  }

  /**
   * Aprovar solicitação de saque (admin)
   */
  async approveWithdrawal(requestId: string, adminId: string): Promise<boolean> {
    try {
      const requests = this.getAllWithdrawalRequests();
      const requestIndex = requests.findIndex(req => req.id === requestId);
      
      if (requestIndex === -1) {
        throw new Error('Solicitação não encontrada');
      }

      const request = requests[requestIndex];
      request.status = 'approved';
      request.approvedBy = adminId;
      request.approvedDate = new Date().toISOString();

      // Salvar alterações
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(requests));

      // Processar pagamento automático
      const paymentSuccess = await this.processAutomaticPayment(request);
      
      if (paymentSuccess) {
        request.status = 'paid';
        request.paidDate = new Date().toISOString();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(requests));
      }

      console.log(`✅ Saque aprovado e ${paymentSuccess ? 'pago' : 'em processamento'}: ${requestId}`);
      return true;

    } catch (error) {
      console.error('❌ Erro ao aprovar saque:', error);
      return false;
    }
  }

  /**
   * Rejeitar solicitação de saque
   */
  rejectWithdrawal(requestId: string, reason: string, adminId: string): boolean {
    try {
      const requests = this.getAllWithdrawalRequests();
      const requestIndex = requests.findIndex(req => req.id === requestId);
      
      if (requestIndex === -1) {
        throw new Error('Solicitação não encontrada');
      }

      requests[requestIndex].status = 'rejected';
      requests[requestIndex].rejectionReason = reason;
      requests[requestIndex].approvedBy = adminId;
      requests[requestIndex].approvedDate = new Date().toISOString();

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(requests));
      console.log(`❌ Saque rejeitado: ${requestId} - ${reason}`);
      return true;

    } catch (error) {
      console.error('❌ Erro ao rejeitar saque:', error);
      return false;
    }
  }

  /**
   * Processar pagamento automático via Stripe/BTG
   */
  private async processAutomaticPayment(request: WithdrawalRequest): Promise<boolean> {
    try {
      console.log(`🔄 Processando pagamento automático para ${request.affiliateName}`);
      
      // Simular integração com Stripe/BTG
      // Em produção, aqui seria feita a chamada real para a API de pagamento
      
      const paymentData = {
        amount: request.amount,
        currency: 'BRL',
        recipient: {
          name: request.bankingData.accountHolder,
          bank: request.bankingData.bank,
          agency: request.bankingData.agency,
          account: request.bankingData.account,
          pixKey: request.bankingData.pixKey,
          cpf: request.bankingData.cpf
        },
        description: `Comissão de afiliado - ${request.affiliateName}`,
        requestId: request.id
      };

      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular sucesso (95% de taxa de sucesso)
      const success = Math.random() > 0.05;
      
      if (success) {
        request.transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`✅ Pagamento processado com sucesso: ${request.transactionId}`);
        
        // Notificar afiliado por email (simulado)
        this.notifyAffiliatePayment(request);
        
        return true;
      } else {
        console.log(`❌ Falha no processamento do pagamento para ${request.id}`);
        return false;
      }

    } catch (error) {
      console.error('❌ Erro no pagamento automático:', error);
      return false;
    }
  }

  /**
   * Notificar afiliado sobre pagamento (simulado)
   */
  private notifyAffiliatePayment(request: WithdrawalRequest): void {
    console.log(`📧 Notificação enviada para ${request.affiliateEmail}:`);
    console.log(`   Pagamento de R$ ${request.amount.toFixed(2)} processado com sucesso`);
    console.log(`   Transação: ${request.transactionId}`);
    console.log(`   Data: ${new Date().toLocaleString('pt-BR')}`);
  }

  /**
   * Obter histórico de saques de um afiliado
   */
  getAffiliateWithdrawals(affiliateId: string): WithdrawalRequest[] {
    return this.getAllWithdrawalRequests().filter(req => req.affiliateId === affiliateId);
  }

  /**
   * Obter estatísticas de pagamentos
   */
  getPaymentStats(): {
    totalPaid: number;
    totalPending: number;
    totalRequests: number;
    averageAmount: number;
  } {
    const requests = this.getAllWithdrawalRequests();
    const paidRequests = requests.filter(req => req.status === 'paid');
    const pendingRequests = requests.filter(req => req.status === 'pending');

    const totalPaid = paidRequests.reduce((sum, req) => sum + req.amount, 0);
    const totalPending = pendingRequests.reduce((sum, req) => sum + req.amount, 0);
    const averageAmount = requests.length > 0 ? requests.reduce((sum, req) => sum + req.amount, 0) / requests.length : 0;

    return {
      totalPaid,
      totalPending,
      totalRequests: requests.length,
      averageAmount
    };
  }
}

export default AffiliatePaymentService;
