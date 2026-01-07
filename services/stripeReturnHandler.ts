// INTERCEPTADOR ULTRA-ROBUSTO DE RETORNO DO STRIPE
// Garante ativação imediata sem logout após pagamento

interface StripeReturnData {
  session_id: string;
  userId: string;
  toolId: string;
  amount: number;
  timestamp: number;
}

class StripeReturnHandler {
  private static instance: StripeReturnHandler;
  private isProcessing = false;

  constructor() {
    this.setupURLInterceptor();
    this.setupStorageWatcher();
  }

  static getInstance(): StripeReturnHandler {
    if (!StripeReturnHandler.instance) {
      StripeReturnHandler.instance = new StripeReturnHandler();
    }
    return StripeReturnHandler.instance;
  }

  // Interceptar URLs de retorno do Stripe
  private setupURLInterceptor(): void {
    // Verificar URL atual na inicialização
    this.checkCurrentURL();

    // Interceptar mudanças de URL (para SPAs)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      setTimeout(() => this.checkCurrentURL(), 100);
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      setTimeout(() => this.checkCurrentURL(), 100);
    };

    // Interceptar eventos de navegação
    window.addEventListener('popstate', () => {
      setTimeout(() => this.checkCurrentURL(), 100);
    });

    // Verificar periodicamente (fallback)
    setInterval(() => {
      this.checkCurrentURL();
    }, 1000);
  }

  // Verificar URL atual
  private checkCurrentURL(): void {
    const url = window.location.href;
    
    // Verificar se é retorno do Stripe
    if (url.includes('payment-success') || url.includes('session_id=')) {
      console.log('🔍 Detectado retorno do Stripe:', url);
      this.handleStripeReturn(url);
    }

    // Verificar parâmetros específicos
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const userId = urlParams.get('userId');
    const tool = urlParams.get('tool');

    if (sessionId && (userId || tool)) {
      console.log('🔍 Detectados parâmetros de pagamento:', { sessionId, userId, tool });
      this.processPaymentReturn(sessionId, userId, tool);
    }
  }

  // Processar retorno do Stripe
  private async handleStripeReturn(url: string): Promise<void> {
    if (this.isProcessing) {
      console.log('⏳ Já processando retorno do Stripe...');
      return;
    }

    this.isProcessing = true;
    console.log('🚀 Processando retorno do Stripe:', url);

    try {
      // Extrair dados da URL
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const sessionId = urlParams.get('session_id');
      const userId = urlParams.get('userId');
      const tool = urlParams.get('tool') || 'ai_video_generator';

      if (!sessionId) {
        console.log('❌ Session ID não encontrado na URL');
        return;
      }

      // Salvar dados de retorno
      const returnData: StripeReturnData = {
        session_id: sessionId,
        userId: userId || 'current_user',
        toolId: tool,
        amount: 0.59, // Valor padrão
        timestamp: Date.now()
      };

      localStorage.setItem('stripe_return_data', JSON.stringify(returnData));
      localStorage.setItem('payment_processing', 'true');

      // FORÇAR ATIVAÇÃO IMEDIATA
      await this.forceToolActivation(returnData);

      // Evitar logout preservando sessão
      this.preserveUserSession();

      // Redirecionar para ferramenta
      this.redirectToTool(tool, userId);

    } catch (error) {
      console.error('❌ Erro ao processar retorno do Stripe:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Processar retorno de pagamento
  private async processPaymentReturn(sessionId: string, userId?: string, tool?: string): Promise<void> {
    console.log('💳 Processando retorno de pagamento:', { sessionId, userId, tool });

    const returnData: StripeReturnData = {
      session_id: sessionId,
      userId: userId || 'current_user',
      toolId: tool || 'ai_video_generator',
      amount: 0.59,
      timestamp: Date.now()
    };

    await this.forceToolActivation(returnData);
    this.preserveUserSession();
  }

  // FORÇAR ATIVAÇÃO DA FERRAMENTA
  private async forceToolActivation(data: StripeReturnData): Promise<void> {
    console.log('🔥 FORÇANDO ATIVAÇÃO DA FERRAMENTA:', data);

    try {
      // 1. ATIVAR NO USUÁRIO ATUAL
      const currentUser = JSON.parse(localStorage.getItem('viraliza_ai_active_user_v1') || '{}');
      if (currentUser.email || currentUser.id) {
        if (!currentUser.addOns) currentUser.addOns = [];
        if (!currentUser.addOns.includes(data.toolId)) {
          currentUser.addOns.push(data.toolId);
        }
        if (!currentUser.addOns.includes('ai_video_generator')) {
          currentUser.addOns.push('ai_video_generator');
        }
        if (!currentUser.addOns.includes('ai-video-generator')) {
          currentUser.addOns.push('ai-video-generator');
        }

        if (!currentUser.purchasedTools) currentUser.purchasedTools = {};
        currentUser.purchasedTools[data.toolId] = {
          purchasedAt: new Date().toISOString(),
          active: true,
          sessionId: data.session_id
        };
        currentUser.purchasedTools['ai_video_generator'] = {
          purchasedAt: new Date().toISOString(),
          active: true,
          sessionId: data.session_id
        };
        currentUser.purchasedTools['ai-video-generator'] = {
          purchasedAt: new Date().toISOString(),
          active: true,
          sessionId: data.session_id
        };

        localStorage.setItem('viraliza_ai_active_user_v1', JSON.stringify(currentUser));
        console.log('✅ Usuário atual ativado:', currentUser);
      }

      // 2. ATIVAR EM TODOS OS USUÁRIOS PERSISTENTES
      const allUsers = JSON.parse(localStorage.getItem('viraliza_users_persistent') || '[]');
      const updatedUsers = allUsers.map((user: any) => {
        if (user.email === currentUser.email || user.id === currentUser.id || user.id === data.userId) {
          if (!user.addOns) user.addOns = [];
          if (!user.addOns.includes(data.toolId)) user.addOns.push(data.toolId);
          if (!user.addOns.includes('ai_video_generator')) user.addOns.push('ai_video_generator');
          if (!user.addOns.includes('ai-video-generator')) user.addOns.push('ai-video-generator');

          if (!user.purchasedTools) user.purchasedTools = {};
          user.purchasedTools[data.toolId] = {
            purchasedAt: new Date().toISOString(),
            active: true,
            sessionId: data.session_id
          };
          user.purchasedTools['ai_video_generator'] = {
            purchasedAt: new Date().toISOString(),
            active: true,
            sessionId: data.session_id
          };
          user.purchasedTools['ai-video-generator'] = {
            purchasedAt: new Date().toISOString(),
            active: true,
            sessionId: data.session_id
          };
        }
        return user;
      });

      localStorage.setItem('viraliza_users_persistent', JSON.stringify(updatedUsers));
      console.log('✅ Usuários persistentes atualizados');

      // 3. CRIAR CHAVES ESPECÍFICAS DE ATIVAÇÃO
      const userId = currentUser.id || currentUser.email || data.userId;
      localStorage.setItem(`${data.toolId}_activated_${userId}`, 'true');
      localStorage.setItem(`ai_video_generator_activated_${userId}`, 'true');
      localStorage.setItem(`ai-video-generator_activated_${userId}`, 'true');
      localStorage.setItem(`user_${userId}_tools`, JSON.stringify([data.toolId, 'ai_video_generator', 'ai-video-generator']));
      localStorage.setItem('payment_success_ai-video-generator', Date.now().toString());
      localStorage.setItem('payment_success_ai_video_generator', Date.now().toString());
      localStorage.setItem('tool_activation_forced', JSON.stringify({
        toolId: data.toolId,
        userId: userId,
        sessionId: data.session_id,
        timestamp: Date.now()
      }));

      // 4. BROADCAST PARA TODAS AS ABAS
      const channel = new BroadcastChannel('viraliza_activation');
      channel.postMessage({
        type: 'TOOL_ACTIVATED_FORCE',
        toolId: data.toolId,
        userId: userId,
        sessionId: data.session_id,
        timestamp: Date.now()
      });

      // 5. EVENTO CUSTOMIZADO
      window.dispatchEvent(new CustomEvent('toolActivatedForce', {
        detail: {
          toolId: data.toolId,
          userId: userId,
          sessionId: data.session_id,
          timestamp: Date.now()
        }
      }));

      console.log('🎉 FERRAMENTA ATIVADA COM SUCESSO!');

    } catch (error) {
      console.error('❌ Erro na ativação forçada:', error);
    }
  }

  // Preservar sessão do usuário
  private preserveUserSession(): void {
    console.log('🔒 Preservando sessão do usuário...');

    // Marcar que não deve fazer logout
    localStorage.setItem('prevent_logout', 'true');
    localStorage.setItem('payment_in_progress', 'false');
    localStorage.setItem('user_should_stay_logged', 'true');

    // Reforçar dados de autenticação
    const currentUser = localStorage.getItem('viraliza_ai_active_user_v1');
    if (currentUser) {
      localStorage.setItem('viraliza_ai_backup_user', currentUser);
      localStorage.setItem('user_authenticated', 'true');
      localStorage.setItem('auth_token_backup', 'valid_' + Date.now());
    }

    // Limpar flags de logout
    localStorage.removeItem('user_logged_out');
    localStorage.removeItem('force_logout');
    localStorage.removeItem('session_expired');

    console.log('✅ Sessão preservada');
  }

  // Redirecionar para ferramenta
  private redirectToTool(toolId: string, userId?: string): void {
    console.log('🔄 Redirecionando para ferramenta:', toolId);

    const toolRoutes = {
      'ai-video-generator': '/dashboard/ai-video-generator',
      'ai_video_generator': '/dashboard/ai-video-generator',
      'ebook-generator': '/dashboard/ebook-generator',
      'ai-funnel-builder': '/dashboard/ai-funnel-builder'
    };

    const route = toolRoutes[toolId as keyof typeof toolRoutes] || '/dashboard/ai-video-generator';
    const params = new URLSearchParams({
      activated: 'true',
      forced: 'true',
      sessionId: Date.now().toString(),
      timestamp: Date.now().toString()
    });

    if (userId) {
      params.set('userId', userId);
    }

    const redirectUrl = `${window.location.origin}/#${route}?${params.toString()}`;
    
    console.log('🔗 URL de redirecionamento:', redirectUrl);

    // Aguardar um pouco para garantir que tudo foi salvo
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 2000);
  }

  // Watcher para mudanças no localStorage
  private setupStorageWatcher(): void {
    window.addEventListener('storage', (e) => {
      if (e.key === 'stripe_return_data' && e.newValue) {
        const data = JSON.parse(e.newValue);
        this.forceToolActivation(data);
      }
    });
  }

  // Verificar se há dados de retorno pendentes
  public checkPendingReturns(): void {
    const returnData = localStorage.getItem('stripe_return_data');
    if (returnData) {
      const data = JSON.parse(returnData);
      if (Date.now() - data.timestamp < 300000) { // 5 minutos
        console.log('🔄 Processando retorno pendente:', data);
        this.forceToolActivation(data);
      }
    }
  }

  // Forçar ativação manual (para emergências)
  public forceActivateManual(toolId: string = 'ai_video_generator'): void {
    console.log('🚨 ATIVAÇÃO MANUAL FORÇADA:', toolId);
    
    const currentUser = JSON.parse(localStorage.getItem('viraliza_ai_active_user_v1') || '{}');
    const data: StripeReturnData = {
      session_id: 'manual_' + Date.now(),
      userId: currentUser.id || currentUser.email || 'manual_user',
      toolId: toolId,
      amount: 0.59,
      timestamp: Date.now()
    };

    this.forceToolActivation(data);
    this.preserveUserSession();
  }
}

export default StripeReturnHandler;
