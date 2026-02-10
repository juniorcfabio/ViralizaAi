// 🔐 SERVIÇO DE CONTROLE DE ACESSO REAL
// Sistema rigoroso para validar pagamentos e liberar ferramentas

export interface PaymentRecord {
  id: string;
  userId: string;
  type: 'plan' | 'tool';
  itemName: string;
  amount: number;
  paymentMethod: 'stripe' | 'pix';
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  createdAt: Date;
  validUntil?: Date;
}

export interface ToolAccess {
  toolId: string;
  toolName: string;
  hasAccess: boolean;
  accessType: 'plan' | 'individual' | 'admin';
  expiresAt?: Date;
}

class AccessControlService {
  private readonly STORAGE_KEY = 'viralizaai_payments';
  private readonly ACCESS_KEY = 'viralizaai_access';

  // 💳 REGISTRAR PAGAMENTO REAL
  registerPayment(payment: Omit<PaymentRecord, 'id' | 'createdAt'>): PaymentRecord {
    const newPayment: PaymentRecord = {
      ...payment,
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    const payments = this.getAllPayments();
    payments.push(newPayment);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payments));

    console.log('💳 Pagamento registrado:', newPayment);
    return newPayment;
  }

  // ✅ CONFIRMAR PAGAMENTO (após webhook/confirmação real)
  confirmPayment(paymentId: string, transactionId: string): boolean {
    const payments = this.getAllPayments();
    const payment = payments.find(p => p.id === paymentId);

    if (!payment) {
      console.error('❌ Pagamento não encontrado:', paymentId);
      return false;
    }

    payment.status = 'completed';
    payment.transactionId = transactionId;

    // Definir validade baseada no tipo
    if (payment.type === 'plan') {
      payment.validUntil = this.calculatePlanExpiry(payment.itemName);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payments));

    // Liberar acesso após confirmação
    this.grantAccess(payment);

    console.log('✅ Pagamento confirmado:', payment);
    return true;
  }

  // 🔓 LIBERAR ACESSO APÓS PAGAMENTO CONFIRMADO
  private grantAccess(payment: PaymentRecord): void {
    const accesses = this.getAllAccesses();
    
    if (payment.type === 'plan') {
      // Liberar todas as ferramentas do plano
      const planTools = this.getPlanTools(payment.itemName);
      planTools.forEach(toolName => {
        const access: ToolAccess = {
          toolId: toolName.toLowerCase().replace(/\s+/g, '_'),
          toolName,
          hasAccess: true,
          accessType: 'plan',
          expiresAt: payment.validUntil
        };
        
        // Remover acesso anterior se existir
        const existingIndex = accesses.findIndex(a => a.toolId === access.toolId && a.toolName === access.toolName);
        if (existingIndex >= 0) {
          accesses[existingIndex] = access;
        } else {
          accesses.push(access);
        }
      });
    } else if (payment.type === 'tool') {
      // Liberar ferramenta específica
      const access: ToolAccess = {
        toolId: payment.itemName.toLowerCase().replace(/\s+/g, '_'),
        toolName: payment.itemName,
        hasAccess: true,
        accessType: 'individual'
      };
      
      const existingIndex = accesses.findIndex(a => a.toolId === access.toolId);
      if (existingIndex >= 0) {
        accesses[existingIndex] = access;
      } else {
        accesses.push(access);
      }
    }

    localStorage.setItem(this.ACCESS_KEY, JSON.stringify(accesses));
    console.log('🔓 Acesso liberado para:', payment.itemName);
  }

  // 🔍 VERIFICAR ACESSO A FERRAMENTA
  hasToolAccess(userId: string, toolName: string, userType?: string): boolean {
    console.log('🔍 Verificando acesso:', { userId, toolName, userType });
    
    // Admin sempre tem acesso
    if (userType === 'admin') {
      console.log('👑 Admin tem acesso total a:', toolName);
      return true;
    }

    const accesses = this.getAllAccesses();
    console.log('📋 Acessos disponíveis:', accesses);
    
    const access = accesses.find(a => 
      a.toolName === toolName || 
      a.toolId === toolName.toLowerCase().replace(/\s+/g, '_')
    );

    console.log('🔍 Acesso encontrado:', access);

    if (!access || !access.hasAccess) {
      console.log('❌ Sem acesso a:', toolName, 'para usuário:', userId);
      return false;
    }

    // Verificar expiração
    if (access.expiresAt && new Date() > new Date(access.expiresAt)) {
      console.log('⏰ Acesso expirado para:', toolName);
      return false;
    }

    console.log('✅ Acesso liberado para:', toolName);
    return true;
  }

  // 📋 LISTAR FERRAMENTAS COM ACESSO
  getUserToolAccess(userId: string, userType?: string): ToolAccess[] {
    if (userType === 'admin') {
      // Admin tem acesso a todas as ferramentas
      return this.getAllTools().map(tool => ({
        toolId: tool.toLowerCase().replace(/\s+/g, '_'),
        toolName: tool,
        hasAccess: true,
        accessType: 'admin' as const
      }));
    }

    return this.getAllAccesses().filter(access => {
      if (!access.hasAccess) return false;
      if (access.expiresAt && new Date() > new Date(access.expiresAt)) return false;
      return true;
    });
  }

  // 📊 OBTER TODOS OS PAGAMENTOS
  getAllPayments(): PaymentRecord[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      return [];
    }
  }

  // 🔐 OBTER TODOS OS ACESSOS
  getAllAccesses(): ToolAccess[] {
    try {
      const stored = localStorage.getItem(this.ACCESS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar acessos:', error);
      return [];
    }
  }

  // 📅 CALCULAR EXPIRAÇÃO DO PLANO
  private calculatePlanExpiry(planName: string): Date {
    const now = new Date();
    const planLower = planName.toLowerCase();
    
    if (planLower.includes('mensal')) {
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias
    } else if (planLower.includes('trimestral')) {
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 dias
    } else if (planLower.includes('semestral')) {
      return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 180 dias
    } else if (planLower.includes('anual')) {
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 365 dias
    }
    
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Padrão 30 dias
  }

  // 🛠️ FERRAMENTAS POR PLANO
  private getPlanTools(planName: string): string[] {
    const planLower = planName.toLowerCase();
    
    // Todas as ferramentas disponíveis
    const allTools = [
      'Gerador de Scripts IA',
      'Criador de Thumbnails', 
      'Analisador de Trends',
      'Otimizador de SEO',
      'Gerador de Hashtags',
      'Criador de Logos',
      'Agendamento Multiplataforma',
      'IA de Copywriting',
      'Tradutor Automático',
      'Gerador de QR Code'
    ];

    if (planLower.includes('mensal')) {
      return allTools.slice(0, 4); // 4 ferramentas básicas
    } else if (planLower.includes('trimestral')) {
      return allTools.slice(0, 6); // 6 ferramentas
    } else if (planLower.includes('semestral')) {
      return allTools.slice(0, 8); // 8 ferramentas
    } else if (planLower.includes('anual')) {
      return allTools; // Todas as ferramentas
    }
    
    return allTools.slice(0, 4); // Padrão
  }

  // 📝 TODAS AS FERRAMENTAS DISPONÍVEIS
  private getAllTools(): string[] {
    return [
      'Gerador de Scripts IA',
      'Criador de Thumbnails', 
      'Analisador de Trends',
      'Otimizador de SEO',
      'Gerador de Hashtags',
      'Criador de Logos',
      'Agendamento Multiplataforma',
      'IA de Copywriting',
      'Tradutor Automático',
      'Gerador de QR Code'
    ];
  }

  // 🧹 LIMPAR ACESSOS EXPIRADOS
  cleanExpiredAccess(): void {
    const accesses = this.getAllAccesses();
    const validAccesses = accesses.filter(access => {
      if (!access.expiresAt) return true;
      return new Date() <= new Date(access.expiresAt);
    });
    
    localStorage.setItem(this.ACCESS_KEY, JSON.stringify(validAccesses));
    console.log('🧹 Acessos expirados removidos');
  }

  // 🔄 RESETAR SISTEMA (apenas para desenvolvimento)
  resetSystem(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.ACCESS_KEY);
    console.log('🔄 Sistema de acesso resetado');
  }
}

export default new AccessControlService();
