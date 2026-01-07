/**
 * Google OAuth Advanced Implementation
 * Ultra-technical implementation using Google Identity Services
 */

interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
  verified_email?: boolean;
}

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

class GoogleOAuthAdvanced {
  private static instance: GoogleOAuthAdvanced;
  private isInitialized = false;
  private clientId = '158170096258-5bb00bb3jqjqjcv4r1no1ac5v3dc2e6.apps.googleusercontent.com';

  private constructor() {}

  public static getInstance(): GoogleOAuthAdvanced {
    if (!GoogleOAuthAdvanced.instance) {
      GoogleOAuthAdvanced.instance = new GoogleOAuthAdvanced();
    }
    return GoogleOAuthAdvanced.instance;
  }

  /**
   * Initialize Google Identity Services
   */
  public async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isInitialized) {
        resolve();
        return;
      }

      // Check if Google Identity Services is loaded
      if (typeof window.google === 'undefined') {
        console.error('❌ Google Identity Services not loaded');
        reject(new Error('Google Identity Services not loaded'));
        return;
      }

      try {
        console.log('🔄 Inicializando Google Identity Services...');
        
        window.google.accounts.id.initialize({
          client_id: this.clientId,
          callback: this.handleCredentialResponse.bind(this),
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true
        });

        this.isInitialized = true;
        console.log('✅ Google Identity Services inicializado com sucesso');
        resolve();
      } catch (error) {
        console.error('❌ Erro ao inicializar Google Identity Services:', error);
        reject(error);
      }
    });
  }

  /**
   * Handle credential response from Google
   */
  private handleCredentialResponse(response: GoogleCredentialResponse): void {
    console.log('🔄 Processando resposta do Google...');
    
    try {
      if (!response.credential) {
        throw new Error('Credential não recebido');
      }

      // Decode JWT token
      const payload = this.decodeJWT(response.credential);
      console.log('👤 Dados do usuário decodificados:', payload);

      // Create user object
      const user = this.createUserFromPayload(payload);
      
      // Save user to localStorage
      this.saveUser(user);
      
      // Trigger custom event for app to handle
      window.dispatchEvent(new CustomEvent('googleLoginSuccess', { 
        detail: { user } 
      }));

      console.log('✅ Login Google processado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao processar resposta do Google:', error);
      window.dispatchEvent(new CustomEvent('googleLoginError', { 
        detail: { error: error.message } 
      }));
    }
  }

  /**
   * Decode JWT token
   */
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('❌ Erro ao decodificar JWT:', error);
      throw new Error('Token JWT inválido');
    }
  }

  /**
   * Create user object from Google payload
   */
  private createUserFromPayload(payload: any): any {
    return {
      id: `google_${payload.sub}`,
      name: payload.name || payload.email,
      email: payload.email,
      type: 'client' as const,
      status: 'Ativo',
      joinedDate: new Date().toISOString().split('T')[0],
      avatar: payload.picture || '',
      socialAccounts: [{
        platform: 'Google',
        accountId: payload.sub,
        username: payload.email,
        verified: payload.email_verified || false
      }],
      paymentMethods: [],
      billingHistory: [],
      googleData: {
        sub: payload.sub,
        iss: payload.iss,
        aud: payload.aud,
        exp: payload.exp,
        iat: payload.iat
      }
    };
  }

  /**
   * Save user to localStorage
   */
  private saveUser(user: any): void {
    try {
      localStorage.setItem('viraliza_ai_active_user_v1', JSON.stringify(user));
      localStorage.setItem('google_login_timestamp', Date.now().toString());
      console.log('💾 Usuário salvo no localStorage:', user.email);
    } catch (error) {
      console.error('❌ Erro ao salvar usuário:', error);
      throw error;
    }
  }

  /**
   * Render Google Sign-In button
   */
  public renderSignInButton(elementId: string, options?: any): void {
    if (!this.isInitialized) {
      console.error('❌ Google OAuth não inicializado');
      return;
    }

    try {
      const defaultOptions = {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: '100%'
      };

      const buttonOptions = { ...defaultOptions, ...options };
      
      console.log('🔄 Renderizando botão Google Sign-In...');
      
      window.google.accounts.id.renderButton(
        document.getElementById(elementId),
        buttonOptions
      );

      console.log('✅ Botão Google Sign-In renderizado');
    } catch (error) {
      console.error('❌ Erro ao renderizar botão:', error);
    }
  }

  /**
   * Prompt Google One Tap
   */
  public promptOneTap(): void {
    if (!this.isInitialized) {
      console.error('❌ Google OAuth não inicializado');
      return;
    }

    try {
      console.log('🔄 Exibindo Google One Tap...');
      window.google.accounts.id.prompt();
    } catch (error) {
      console.error('❌ Erro ao exibir One Tap:', error);
    }
  }

  /**
   * Sign out user
   */
  public signOut(): void {
    try {
      console.log('🔄 Fazendo logout do Google...');
      
      // Clear localStorage
      localStorage.removeItem('viraliza_ai_active_user_v1');
      localStorage.removeItem('google_login_timestamp');
      
      // Revoke Google session if available
      if (window.google && window.google.accounts.id) {
        window.google.accounts.id.disableAutoSelect();
      }
      
      console.log('✅ Logout realizado com sucesso');
      
      // Trigger custom event
      window.dispatchEvent(new CustomEvent('googleLogoutSuccess'));
      
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
    }
  }

  /**
   * Check if user is logged in
   */
  public isLoggedIn(): boolean {
    try {
      const user = localStorage.getItem('viraliza_ai_active_user_v1');
      const timestamp = localStorage.getItem('google_login_timestamp');
      
      if (!user || !timestamp) {
        return false;
      }

      // Check if login is not expired (24 hours)
      const loginTime = parseInt(timestamp);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (now - loginTime > twentyFourHours) {
        console.log('🔄 Login expirado, removendo dados...');
        this.signOut();
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao verificar login:', error);
      return false;
    }
  }

  /**
   * Get current user
   */
  public getCurrentUser(): any | null {
    try {
      if (!this.isLoggedIn()) {
        return null;
      }

      const userData = localStorage.getItem('viraliza_ai_active_user_v1');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ Erro ao obter usuário atual:', error);
      return null;
    }
  }
}

// Global declarations for TypeScript
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
    googleOAuthAdvanced: GoogleOAuthAdvanced;
  }
}

// Make instance globally available
window.googleOAuthAdvanced = GoogleOAuthAdvanced.getInstance();

export default GoogleOAuthAdvanced;
