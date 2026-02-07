// =======================
// 🎯 GERENCIADOR DE ASSINATURAS - LÓGICA SAAS
// =======================

export interface Subscription {
  id: string;
  userId: string;
  planType: string;
  planName: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  amount: number;
  paymentMethod: 'pix' | 'credit_card';
  stripeSessionId?: string;
  createdAt: string;
  expiresAt: string;
  nextBillingDate: string;
  autoRenew: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
  planStatus: 'active' | 'expired' | 'trial';
  planExpiresAt?: string;
  subscriptionId?: string;
}

export class SubscriptionManager {
  private static instance: SubscriptionManager;

  static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  // Criar nova assinatura
  async createSubscription(data: {
    userId: string;
    planType: string;
    planName: string;
    amount: number;
    paymentMethod: 'pix' | 'credit_card';
    stripeSessionId?: string;
  }): Promise<Subscription> {
    const now = new Date();
    const expiresAt = this.calculateExpirationDate(data.planType, now);
    
    const subscription: Subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: data.userId,
      planType: data.planType,
      planName: data.planName,
      status: 'active',
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      stripeSessionId: data.stripeSessionId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      nextBillingDate: expiresAt.toISOString(),
      autoRenew: true
    };

    // Salvar assinatura
    await this.saveSubscription(subscription);
    
    // Ativar plano do usuário
    await this.activateUserPlan(data.userId, data.planType, expiresAt);
    
    console.log('✅ Assinatura criada:', subscription);
    return subscription;
  }

  // Calcular data de expiração
  private calculateExpirationDate(planType: string, fromDate: Date): Date {
    const date = new Date(fromDate);
    
    switch (planType) {
      case 'mensal':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'trimestral':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'semestral':
        date.setMonth(date.getMonth() + 6);
        break;
      case 'anual':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1); // Default: mensal
    }
    
    return date;
  }

  // Verificar assinaturas expiradas
  async checkExpiredSubscriptions(): Promise<void> {
    const subscriptions = await this.getAllSubscriptions();
    const now = new Date();

    for (const subscription of subscriptions) {
      const expiresAt = new Date(subscription.expiresAt);
      
      if (now > expiresAt && subscription.status === 'active') {
        console.log('⏰ Assinatura expirada:', subscription.id);
        
        // Marcar como expirada
        subscription.status = 'expired';
        await this.saveSubscription(subscription);
        
        // Bloquear usuário
        await this.blockUser(subscription.userId);
        
        // Gerar nova cobrança se auto-renovação estiver ativa
        if (subscription.autoRenew) {
          await this.generateRenewalPayment(subscription);
        }
      }
    }
  }

  // Gerar pagamento de renovação
  private async generateRenewalPayment(subscription: Subscription): Promise<void> {
    console.log('🔄 Gerando renovação para:', subscription.id);
    
    // Em produção, criar nova sessão PIX
    // const newSession = await stripe.checkout.sessions.create({...});
    
    // Enviar notificação por email/WhatsApp
    await this.sendRenewalNotification(subscription);
  }

  // Renovar assinatura após pagamento
  async renewSubscription(subscriptionId: string): Promise<void> {
    const subscription = await this.getSubscription(subscriptionId);
    if (!subscription) return;

    const now = new Date();
    const newExpiresAt = this.calculateExpirationDate(subscription.planType, now);
    
    subscription.status = 'active';
    subscription.expiresAt = newExpiresAt.toISOString();
    subscription.nextBillingDate = newExpiresAt.toISOString();
    
    await this.saveSubscription(subscription);
    await this.activateUserPlan(subscription.userId, subscription.planType, newExpiresAt);
    
    console.log('✅ Assinatura renovada:', subscriptionId);
  }

  // Cancelar assinatura
  async cancelSubscription(subscriptionId: string): Promise<void> {
    const subscription = await this.getSubscription(subscriptionId);
    if (!subscription) return;

    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    
    await this.saveSubscription(subscription);
    console.log('❌ Assinatura cancelada:', subscriptionId);
  }

  // Ativar plano do usuário
  private async activateUserPlan(userId: string, planType: string, expiresAt: Date): Promise<void> {
    try {
      // Em produção, atualizar no banco de dados
      // UPDATE users SET plan = planType, plan_expires_at = expiresAt WHERE id = userId
      
      // Para demo, usar localStorage
      if (typeof window !== 'undefined') {
        const users = JSON.parse(localStorage.getItem('viralizaai_users') || '[]');
        const userIndex = users.findIndex((u: User) => u.id === userId);
        
        if (userIndex !== -1) {
          users[userIndex].plan = planType;
          users[userIndex].planStatus = 'active';
          users[userIndex].planExpiresAt = expiresAt.toISOString();
          localStorage.setItem('viralizaai_users', JSON.stringify(users));
        }
      }
      
      console.log('🔓 Plano ativado:', { userId, planType, expiresAt });
    } catch (error) {
      console.error('❌ Erro ao ativar plano:', error);
    }
  }

  // Bloquear usuário
  private async blockUser(userId: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const users = JSON.parse(localStorage.getItem('viralizaai_users') || '[]');
        const userIndex = users.findIndex((u: User) => u.id === userId);
        
        if (userIndex !== -1) {
          users[userIndex].planStatus = 'expired';
          localStorage.setItem('viralizaai_users', JSON.stringify(users));
        }
      }
      
      console.log('🔒 Usuário bloqueado:', userId);
    } catch (error) {
      console.error('❌ Erro ao bloquear usuário:', error);
    }
  }

  // Salvar assinatura
  private async saveSubscription(subscription: Subscription): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const subscriptions = JSON.parse(localStorage.getItem('viralizaai_subscriptions') || '[]');
        const index = subscriptions.findIndex((s: Subscription) => s.id === subscription.id);
        
        if (index !== -1) {
          subscriptions[index] = subscription;
        } else {
          subscriptions.push(subscription);
        }
        
        localStorage.setItem('viralizaai_subscriptions', JSON.stringify(subscriptions));
      }
    } catch (error) {
      console.error('❌ Erro ao salvar assinatura:', error);
    }
  }

  // Obter assinatura
  private async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      if (typeof window !== 'undefined') {
        const subscriptions = JSON.parse(localStorage.getItem('viralizaai_subscriptions') || '[]');
        return subscriptions.find((s: Subscription) => s.id === subscriptionId) || null;
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao obter assinatura:', error);
      return null;
    }
  }

  // Obter todas as assinaturas
  private async getAllSubscriptions(): Promise<Subscription[]> {
    try {
      if (typeof window !== 'undefined') {
        return JSON.parse(localStorage.getItem('viralizaai_subscriptions') || '[]');
      }
      return [];
    } catch (error) {
      console.error('❌ Erro ao obter assinaturas:', error);
      return [];
    }
  }

  // Enviar notificação de renovação
  private async sendRenewalNotification(subscription: Subscription): Promise<void> {
    console.log('📧 Enviando notificação de renovação:', subscription.userId);
    
    // Em produção, integrar com serviço de email/WhatsApp
    // await emailService.send({
    //   to: user.email,
    //   subject: 'Renovação de Assinatura - ViralizaAI',
    //   template: 'renewal-notification'
    // });
  }

  // Verificar se usuário tem acesso
  async hasAccess(userId: string, feature?: string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined') {
        const users = JSON.parse(localStorage.getItem('viralizaai_users') || '[]');
        const user = users.find((u: User) => u.id === userId);
        
        if (!user) return false;
        
        // Verificar se o plano está ativo
        if (user.planStatus !== 'active') return false;
        
        // Verificar se não expirou
        if (user.planExpiresAt) {
          const expiresAt = new Date(user.planExpiresAt);
          const now = new Date();
          if (now > expiresAt) {
            // Marcar como expirado
            user.planStatus = 'expired';
            localStorage.setItem('viralizaai_users', JSON.stringify(users));
            return false;
          }
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erro ao verificar acesso:', error);
      return false;
    }
  }
}

// Hook para usar o gerenciador de assinaturas
export const useSubscriptionManager = () => {
  const manager = SubscriptionManager.getInstance();

  return {
    createSubscription: manager.createSubscription.bind(manager),
    renewSubscription: manager.renewSubscription.bind(manager),
    cancelSubscription: manager.cancelSubscription.bind(manager),
    checkExpiredSubscriptions: manager.checkExpiredSubscriptions.bind(manager),
    hasAccess: manager.hasAccess.bind(manager)
  };
};

export default SubscriptionManager;
