// SISTEMA ULTRA-ROBUSTO DE ATIVAÇÃO PÓS-PAGAMENTO
// Garante que pagamentos aprovados liberem ferramentas IMEDIATAMENTE
// INTEGRAÇÃO COM SUPABASE/POSTGRESQL

import autoSupabase from './autoSupabaseIntegration';

interface PaymentActivation {
  userId: string;
  toolId: string;
  sessionId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  retryCount: number;
}

class PaymentActivationService {
  private static instance: PaymentActivationService;
  private activationQueue: PaymentActivation[] = [];
  private processingInterval: number | null = null;

  constructor() {
    this.startProcessingQueue();
    this.setupStorageListener();
  }

  static getInstance(): PaymentActivationService {
    if (!PaymentActivationService.instance) {
      PaymentActivationService.instance = new PaymentActivationService();
    }
    return PaymentActivationService.instance;
  }

  // Processar pagamento aprovado
  async processPaymentSuccess(sessionId: string, userId: string, toolId: string, amount: number): Promise<boolean> {
    console.log('💳 Processando pagamento aprovado:', { sessionId, userId, toolId, amount });

    try {
      // 1. ATIVAÇÃO IMEDIATA NO LOCALSTORAGE
      await this.activateToolImmediately(userId, toolId);

      // 2. SALVAR ATIVAÇÃO PERSISTENTE
      await this.saveActivationPersistent(userId, toolId, sessionId, amount);

      // 3. NOTIFICAR TODAS AS ABAS/JANELAS
      this.broadcastActivation(userId, toolId);

      // 4. REDIRECIONAR PARA FERRAMENTA
      this.redirectToTool(toolId, userId);

      console.log('✅ Ferramenta ativada com sucesso!');
      return true;

    } catch (error) {
      console.error('❌ Erro na ativação:', error);
      
      // Adicionar à fila de retry
      this.addToRetryQueue(userId, toolId, sessionId, amount);
      return false;
    }
  }

  // Ativação imediata no localStorage
  private async activateToolImmediately(userId: string, toolId: string): Promise<void> {
    console.log('🚀 Ativando ferramenta imediatamente...');

    // 1. Ativar no usuário atual
    const currentUser = JSON.parse(localStorage.getItem('viraliza_ai_active_user_v1') || '{}');
    if (currentUser.id === userId || currentUser.email === userId) {
      if (!currentUser.addOns) currentUser.addOns = [];
      if (!currentUser.addOns.includes(toolId)) {
        currentUser.addOns.push(toolId);
      }
      
      if (!currentUser.purchasedTools) currentUser.purchasedTools = {};
      currentUser.purchasedTools[toolId] = {
        purchasedAt: new Date().toISOString(),
        active: true,
        sessionId: `stripe_${Date.now()}`
      };

      localStorage.setItem('viraliza_ai_active_user_v1', JSON.stringify(currentUser));
      // SYNC COM SUPABASE
      autoSupabase.saveUser(currentUser);
      console.log('✅ Usuário atual atualizado e sincronizado com Supabase');
    }

    // 2. Ativar em todos os usuários persistentes
    const allUsers = JSON.parse(localStorage.getItem('viraliza_users_persistent') || '[]');
    const updatedUsers = allUsers.map((user: any) => {
      if (user.id === userId || user.email === userId) {
        if (!user.addOns) user.addOns = [];
        if (!user.addOns.includes(toolId)) {
          user.addOns.push(toolId);
        }
        
        if (!user.purchasedTools) user.purchasedTools = {};
        user.purchasedTools[toolId] = {
          purchasedAt: new Date().toISOString(),
          active: true,
          sessionId: `stripe_${Date.now()}`
        };
      }
      return user;
    });

    localStorage.setItem('viraliza_users_persistent', JSON.stringify(updatedUsers));
    console.log('✅ Usuários persistentes atualizados');

    // 3. Criar chaves específicas para a ferramenta
    localStorage.setItem(`user_${userId}_tools`, JSON.stringify([toolId]));
    localStorage.setItem(`${toolId}_activated_${userId}`, 'true');
    localStorage.setItem(`payment_success_${toolId}`, Date.now().toString());
  }

  // Salvar ativação persistente
  private async saveActivationPersistent(userId: string, toolId: string, sessionId: string, amount: number): Promise<void> {
    const activation = {
      userId,
      toolId,
      sessionId,
      amount,
      timestamp: Date.now(),
      status: 'completed'
    };

    // Salvar no localStorage
    const activations = JSON.parse(localStorage.getItem('payment_activations') || '[]');
    activations.push(activation);
    localStorage.setItem('payment_activations', JSON.stringify(activations));

    // Salvar chave específica
    localStorage.setItem(`activation_${sessionId}`, JSON.stringify(activation));

    // SYNC COM SUPABASE/POSTGRESQL
    autoSupabase.savePayment({
      userId,
      type: 'tool',
      itemName: toolId,
      amount,
      paymentMethod: 'stripe',
      status: 'confirmed',
      stripeSessionId: sessionId
    });
    autoSupabase.saveToolAccess(userId, toolId, 'individual');
    autoSupabase.logActivity(userId, 'payment_activation', { toolId, sessionId, amount });
  }

  // Broadcast para todas as abas
  private broadcastActivation(userId: string, toolId: string): void {
    // BroadcastChannel para comunicação entre abas
    const channel = new BroadcastChannel('viraliza_activation');
    channel.postMessage({
      type: 'TOOL_ACTIVATED',
      userId,
      toolId,
      timestamp: Date.now()
    });

    // Evento customizado
    window.dispatchEvent(new CustomEvent('toolActivated', {
      detail: { userId, toolId, timestamp: Date.now() }
    }));

    // Flag no localStorage
    localStorage.setItem('tool_activation_broadcast', JSON.stringify({
      userId,
      toolId,
      timestamp: Date.now()
    }));
  }

  // Redirecionar para ferramenta
  private redirectToTool(toolId: string, userId: string): void {
    const toolRoutes = {
      'ai-video-generator': '/dashboard/ai-video-generator',
      'ai_video_generator': '/dashboard/ai-video-generator',
      'ebook-generator': '/dashboard/ebook-generator',
      'ai-funnel-builder': '/dashboard/ai-funnel-builder'
    };

    const route = toolRoutes[toolId as keyof typeof toolRoutes] || '/dashboard';
    const fullUrl = `${window.location.origin}/#${route}?activated=true&userId=${userId}&timestamp=${Date.now()}`;
    
    console.log('🔄 Redirecionando para:', fullUrl);
    
    // Aguardar um pouco para garantir que tudo foi salvo
    setTimeout(() => {
      window.location.href = fullUrl;
    }, 1000);
  }

  // Adicionar à fila de retry
  private addToRetryQueue(userId: string, toolId: string, sessionId: string, amount: number): void {
    const activation: PaymentActivation = {
      userId,
      toolId,
      sessionId,
      amount,
      status: 'pending',
      timestamp: Date.now(),
      retryCount: 0
    };

    this.activationQueue.push(activation);
    this.saveQueue();
  }

  // Processar fila de retry
  private startProcessingQueue(): void {
    this.loadQueue();
    
    this.processingInterval = window.setInterval(() => {
      this.processQueue();
    }, 5000); // Processar a cada 5 segundos
  }

  private async processQueue(): Promise<void> {
    if (this.activationQueue.length === 0) return;

    console.log('🔄 Processando fila de ativações:', this.activationQueue.length);

    for (let i = this.activationQueue.length - 1; i >= 0; i--) {
      const activation = this.activationQueue[i];
      
      if (activation.retryCount >= 5) {
        console.log('❌ Ativação falhou após 5 tentativas:', activation);
        this.activationQueue.splice(i, 1);
        continue;
      }

      try {
        await this.activateToolImmediately(activation.userId, activation.toolId);
        await this.saveActivationPersistent(activation.userId, activation.toolId, activation.sessionId, activation.amount);
        
        activation.status = 'completed';
        this.activationQueue.splice(i, 1);
        console.log('✅ Ativação processada com sucesso:', activation);
        
      } catch (error) {
        activation.retryCount++;
        console.log(`⚠️ Retry ${activation.retryCount}/5 para:`, activation);
      }
    }

    this.saveQueue();
  }

  // Salvar/carregar fila
  private saveQueue(): void {
    localStorage.setItem('activation_queue', JSON.stringify(this.activationQueue));
  }

  private loadQueue(): void {
    const saved = localStorage.getItem('activation_queue');
    if (saved) {
      this.activationQueue = JSON.parse(saved);
    }
  }

  // Listener para mudanças de storage
  private setupStorageListener(): void {
    window.addEventListener('storage', (e) => {
      if (e.key === 'payment_success_stripe') {
        const data = JSON.parse(e.newValue || '{}');
        if (data.userId && data.toolId) {
          this.processPaymentSuccess(data.sessionId, data.userId, data.toolId, data.amount);
        }
      }
    });
  }

  // Verificar se ferramenta está ativada
  public isToolActivated(userId: string, toolId: string): boolean {
    // Verificar múltiplas fontes
    const sources = [
      localStorage.getItem(`${toolId}_activated_${userId}`),
      localStorage.getItem(`user_${userId}_tools`),
      localStorage.getItem('viraliza_ai_active_user_v1')
    ];

    return sources.some(source => {
      if (!source) return false;
      try {
        if (source === 'true') return true;
        const parsed = JSON.parse(source);
        return parsed.includes?.(toolId) || parsed.addOns?.includes(toolId);
      } catch {
        return false;
      }
    });
  }

  // Forçar ativação manual (para casos de emergência)
  public forceActivation(userId: string, toolId: string): void {
    console.log('🚨 FORÇANDO ATIVAÇÃO MANUAL:', { userId, toolId });
    this.activateToolImmediately(userId, toolId);
    this.broadcastActivation(userId, toolId);
  }

  // Cleanup
  public destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }
}

export default PaymentActivationService;
