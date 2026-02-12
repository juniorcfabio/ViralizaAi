// CORREÇÃO EMERGENCIAL PARA PROBLEMA DE LOGOUT APÓS PAGAMENTO
// Sistema ultra-robusto que intercepta e corrige automaticamente
// INTEGRAÇÃO COM SUPABASE/POSTGRESQL

import autoSupabase from './autoSupabaseIntegration';

class EmergencyPaymentFix {
  private static instance: EmergencyPaymentFix;
  private isActive = false;

  constructor() {
    this.initialize();
  }

  static getInstance(): EmergencyPaymentFix {
    if (!EmergencyPaymentFix.instance) {
      EmergencyPaymentFix.instance = new EmergencyPaymentFix();
    }
    return EmergencyPaymentFix.instance;
  }

  private initialize(): void {
    console.log('🚨 SISTEMA DE CORREÇÃO EMERGENCIAL ATIVADO');
    
    // Interceptar todas as URLs que contenham parâmetros de pagamento
    this.interceptPaymentURLs();
    
    // Monitorar mudanças na URL
    this.monitorURLChanges();
    
    // Verificar se há pagamento pendente na inicialização
    this.checkPendingPayments();
    
    // Interceptar tentativas de logout
    this.preventLogoutAfterPayment();
    
    this.isActive = true;
  }

  private interceptPaymentURLs(): void {
    const currentURL = window.location.href;
    
    // Verificar se é retorno do Stripe
    if (currentURL.includes('session_id=') || currentURL.includes('payment-success')) {
      console.log('🔍 DETECTADO RETORNO DO STRIPE:', currentURL);
      this.handleStripeReturn(currentURL);
    }
  }

  private monitorURLChanges(): void {
    // Interceptar mudanças de URL
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      setTimeout(() => this.interceptPaymentURLs(), 100);
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      setTimeout(() => this.interceptPaymentURLs(), 100);
    };

    window.addEventListener('popstate', () => {
      setTimeout(() => this.interceptPaymentURLs(), 100);
    });

    // Verificar periodicamente
    setInterval(() => {
      this.interceptPaymentURLs();
    }, 1000);
  }

  private checkPendingPayments(): void {
    // Verificar se há dados de pagamento pendentes
    const pendingPayment = localStorage.getItem('pending_payment_activation');
    if (pendingPayment) {
      const data = JSON.parse(pendingPayment);
      console.log('🔄 PROCESSANDO PAGAMENTO PENDENTE:', data);
      this.forceActivateTools(data);
    }
  }

  private preventLogoutAfterPayment(): void {
    // Interceptar tentativas de logout após pagamento
    const originalRemoveItem = localStorage.removeItem;
    const originalClear = localStorage.clear;

    localStorage.removeItem = (key: string) => {
      if (this.shouldPreventLogout() && this.isAuthRelatedKey(key)) {
        console.log('🔒 LOGOUT PREVENIDO - Chave protegida:', key);
        return;
      }
      return originalRemoveItem.call(localStorage, key);
    };

    localStorage.clear = () => {
      if (this.shouldPreventLogout()) {
        console.log('🔒 CLEAR PREVENIDO - Mantendo dados de autenticação');
        return;
      }
      return originalClear.call(localStorage);
    };
  }

  private shouldPreventLogout(): boolean {
    const preventLogout = localStorage.getItem('prevent_logout') === 'true';
    const paymentProcessing = localStorage.getItem('payment_processing') === 'true';
    const recentPayment = this.hasRecentPayment();
    
    return preventLogout || paymentProcessing || recentPayment;
  }

  private hasRecentPayment(): boolean {
    const lastPayment = localStorage.getItem('last_payment_timestamp');
    if (!lastPayment) return false;
    
    const timeDiff = Date.now() - parseInt(lastPayment);
    return timeDiff < 300000; // 5 minutos
  }

  private isAuthRelatedKey(key: string): boolean {
    const authKeys = [
      'viraliza_ai_active_user_v1',
      'viraliza_ai_backup_user',
      'user_authenticated',
      'auth_token_backup'
    ];
    return authKeys.includes(key);
  }

  private handleStripeReturn(url: string): void {
    console.log('🚀 PROCESSANDO RETORNO DO STRIPE...');
    
    try {
      // Extrair dados da URL
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const sessionId = urlParams.get('session_id');
      const userId = urlParams.get('userId');
      const tool = urlParams.get('tool') || 'ai_video_generator';

      if (!sessionId) {
        console.log('❌ Session ID não encontrado');
        return;
      }

      // Marcar timestamp do pagamento
      localStorage.setItem('last_payment_timestamp', Date.now().toString());
      localStorage.setItem('prevent_logout', 'true');
      localStorage.setItem('payment_processing', 'true');

      // Dados do pagamento
      const paymentData = {
        sessionId,
        userId: userId || this.getCurrentUserId(),
        toolId: tool,
        timestamp: Date.now()
      };

      // Salvar para processamento
      localStorage.setItem('pending_payment_activation', JSON.stringify(paymentData));

      // FORÇAR ATIVAÇÃO IMEDIATA
      this.forceActivateTools(paymentData);

      // Redirecionar após ativação
      setTimeout(() => {
        this.redirectToTool(tool, userId);
      }, 2000);

    } catch (error) {
      console.error('❌ Erro ao processar retorno:', error);
    }
  }

  private getCurrentUserId(): string {
    try {
      const currentUser = JSON.parse(localStorage.getItem('viraliza_ai_active_user_v1') || '{}');
      return currentUser.id || currentUser.email || 'current_user';
    } catch {
      return 'current_user';
    }
  }

  private forceActivateTools(data: any): void {
    console.log('🔥 FORÇANDO ATIVAÇÃO DE FERRAMENTAS:', data);

    try {
      // 1. ATIVAR NO USUÁRIO ATUAL
      const currentUser = JSON.parse(localStorage.getItem('viraliza_ai_active_user_v1') || '{}');
      if (currentUser.email || currentUser.id) {
        // Garantir arrays
        if (!currentUser.addOns) currentUser.addOns = [];
        if (!currentUser.purchasedTools) currentUser.purchasedTools = {};

        // Adicionar todas as variações da ferramenta
        const toolVariations = [data.toolId, 'ai_video_generator', 'ai-video-generator'];
        toolVariations.forEach(toolId => {
          if (!currentUser.addOns.includes(toolId)) {
            currentUser.addOns.push(toolId);
          }
          
          currentUser.purchasedTools[toolId] = {
            purchasedAt: new Date().toISOString(),
            active: true,
            sessionId: data.sessionId
          };
        });

        // Salvar usuário atualizado
        localStorage.setItem('viraliza_ai_active_user_v1', JSON.stringify(currentUser));
        localStorage.setItem('viraliza_ai_backup_user', JSON.stringify(currentUser));
        // SYNC COM SUPABASE/POSTGRESQL
        autoSupabase.saveUser(currentUser);
        autoSupabase.saveToolAccess(currentUser.id || data.userId, data.toolId, 'individual');
        autoSupabase.savePayment({
          userId: currentUser.id || data.userId,
          type: 'tool',
          itemName: data.toolId,
          amount: 0,
          paymentMethod: 'stripe',
          status: 'confirmed',
          stripeSessionId: data.sessionId
        });
        
        console.log('✅ Usuário ativado e sincronizado com Supabase:', currentUser);
      }

      // 2. ATIVAR EM USUÁRIOS PERSISTENTES
      const allUsers = JSON.parse(localStorage.getItem('viraliza_users_persistent') || '[]');
      const updatedUsers = allUsers.map((user: any) => {
        if (user.email === currentUser.email || user.id === currentUser.id || user.id === data.userId) {
          if (!user.addOns) user.addOns = [];
          if (!user.purchasedTools) user.purchasedTools = {};

          const toolVariations = [data.toolId, 'ai_video_generator', 'ai-video-generator'];
          toolVariations.forEach(toolId => {
            if (!user.addOns.includes(toolId)) {
              user.addOns.push(toolId);
            }
            
            user.purchasedTools[toolId] = {
              purchasedAt: new Date().toISOString(),
              active: true,
              sessionId: data.sessionId
            };
          });
        }
        return user;
      });

      localStorage.setItem('viraliza_users_persistent', JSON.stringify(updatedUsers));

      // 3. CRIAR CHAVES ESPECÍFICAS
      const userId = currentUser.id || currentUser.email || data.userId;
      const toolVariations = [data.toolId, 'ai_video_generator', 'ai-video-generator'];
      
      toolVariations.forEach(toolId => {
        localStorage.setItem(`${toolId}_activated_${userId}`, 'true');
        localStorage.setItem(`user_${userId}_${toolId}`, 'true');
      });

      localStorage.setItem(`user_${userId}_tools`, JSON.stringify(toolVariations));
      localStorage.setItem('payment_success_ai-video-generator', Date.now().toString());
      localStorage.setItem('payment_success_ai_video_generator', Date.now().toString());
      localStorage.setItem('tool_activation_emergency', JSON.stringify({
        toolId: data.toolId,
        userId: userId,
        sessionId: data.sessionId,
        timestamp: Date.now()
      }));

      // 4. BROADCAST
      try {
        const channel = new BroadcastChannel('viraliza_activation');
        channel.postMessage({
          type: 'EMERGENCY_ACTIVATION',
          toolId: data.toolId,
          userId: userId,
          timestamp: Date.now()
        });
      } catch (e) {
        console.log('BroadcastChannel não disponível');
      }

      // 5. EVENTO CUSTOMIZADO
      window.dispatchEvent(new CustomEvent('emergencyToolActivation', {
        detail: {
          toolId: data.toolId,
          userId: userId,
          sessionId: data.sessionId
        }
      }));

      // Limpar dados pendentes
      localStorage.removeItem('pending_payment_activation');
      localStorage.setItem('payment_processing', 'false');

      console.log('🎉 ATIVAÇÃO EMERGENCIAL CONCLUÍDA!');

    } catch (error) {
      console.error('❌ Erro na ativação emergencial:', error);
    }
  }

  private redirectToTool(toolId: string, userId?: string): void {
    const toolRoutes = {
      'ai-video-generator': '/dashboard/ai-video-generator',
      'ai_video_generator': '/dashboard/ai-video-generator',
      'ebook-generator': '/dashboard/ebook-generator',
      'ai-funnel-builder': '/dashboard/ai-funnel-builder'
    };

    const route = toolRoutes[toolId as keyof typeof toolRoutes] || '/dashboard/ai-video-generator';
    const params = new URLSearchParams({
      activated: 'true',
      emergency: 'true',
      timestamp: Date.now().toString()
    });

    if (userId) {
      params.set('userId', userId);
    }

    const redirectUrl = `${window.location.origin}/#${route}?${params.toString()}`;
    
    console.log('🔄 REDIRECIONAMENTO EMERGENCIAL:', redirectUrl);
    
    // Limpar flags de logout
    localStorage.removeItem('prevent_logout');
    localStorage.setItem('user_should_stay_logged', 'true');
    
    window.location.href = redirectUrl;
  }

  // Método público para ativação manual
  public forceActivateManual(toolId: string = 'ai_video_generator'): void {
    console.log('🚨 ATIVAÇÃO MANUAL EMERGENCIAL:', toolId);
    
    const data = {
      sessionId: 'emergency_' + Date.now(),
      userId: this.getCurrentUserId(),
      toolId: toolId,
      timestamp: Date.now()
    };

    this.forceActivateTools(data);
    
    // Redirecionar
    setTimeout(() => {
      this.redirectToTool(toolId);
    }, 1000);
  }

  // Verificar se sistema está ativo
  public isSystemActive(): boolean {
    return this.isActive;
  }
}

// Inicializar automaticamente
const emergencyFix = EmergencyPaymentFix.getInstance();

// Exportar para uso global
(window as any).emergencyPaymentFix = emergencyFix;

export default EmergencyPaymentFix;
