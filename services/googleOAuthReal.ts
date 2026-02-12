// GOOGLE OAUTH REAL - IMPLEMENTAÇÃO COMPLETA PARA PRODUÇÃO

interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

class GoogleOAuthReal {
  private static instance: GoogleOAuthReal;
  private config: GoogleOAuthConfig;
  private isInitialized = false;

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
      redirectUri: `${window.location.origin}/auth/google/callback`,
      scopes: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    };

    // Log de configuração para debug
    console.log('🔧 Google OAuth Config:', {
      hasClientId: !!this.config.clientId,
      hasClientSecret: !!this.config.clientSecret,
      redirectUri: this.config.redirectUri,
      clientIdPreview: this.config.clientId ? `${this.config.clientId.substring(0, 10)}...` : 'não configurado'
    });
  }

  static getInstance(): GoogleOAuthReal {
    if (!GoogleOAuthReal.instance) {
      GoogleOAuthReal.instance = new GoogleOAuthReal();
    }
    return GoogleOAuthReal.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Verificar se as configurações estão presentes
      if (!this.config.clientId) {
        console.warn('⚠️ Google Client ID não configurado. Login social limitado.');
        return;
      }

      // Carregar Google API
      await this.loadGoogleAPI();
      
      // Inicializar Google Auth
      await this.initializeGoogleAuth();
      
      this.isInitialized = true;
      console.log('✅ Google OAuth inicializado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao inicializar Google OAuth:', error);
      throw error;
    }
  }

  private async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar se já está carregado
      if ((window as any).google?.accounts) {
        resolve();
        return;
      }

      // Carregar Google Identity Services (nova API)
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('✅ Google Identity Services carregado');
        resolve();
      };
      
      script.onerror = () => {
        console.error('❌ Falha ao carregar Google Identity Services');
        reject(new Error('Falha ao carregar Google Identity Services'));
      };
      
      document.head.appendChild(script);
    });
  }

  private async initializeGoogleAuth(): Promise<void> {
    // Usar a nova Google Identity Services API
    const google = (window as any).google;
    
    if (!google?.accounts) {
      throw new Error('Google Identity Services não carregado');
    }

    // Inicializar Google Identity Services
    google.accounts.id.initialize({
      client_id: this.config.clientId,
      callback: this.handleCredentialResponse.bind(this),
      auto_select: false,
      cancel_on_tap_outside: true
    });

    console.log('✅ Google Identity Services inicializado');
  }

  private async handleCredentialResponse(response: any): Promise<void> {
    console.log('🔄 Resposta de credencial recebida:', response);
    
    try {
      // Decodificar JWT token
      const credential = response.credential;
      const payload = JSON.parse(atob(credential.split('.')[1]));
      
      const userData: GoogleUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        verified_email: payload.email_verified
      };

      // Salvar dados do usuário
      localStorage.setItem('google_user_data', JSON.stringify(userData));
      // SYNC COM SUPABASE
      import('../src/lib/supabase').then(({ supabase }) => {
        supabase.from('users').upsert({ id: userData.id || userData.email, email: userData.email, updated_at: new Date().toISOString() }).then(() => {});
        supabase.from('user_profiles').upsert({ user_id: userData.id || userData.email, name: userData.name, updated_at: new Date().toISOString() }).then(() => {});
      });
      
      console.log('✅ Login Google realizado e sincronizado com Supabase:', userData.email);
      
      // Resolver promise do login
      if (this.loginResolve) {
        this.loginResolve(userData);
        this.loginResolve = undefined;
        this.loginReject = undefined;
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar credencial:', error);
      if (this.loginReject) {
        this.loginReject(error);
        this.loginResolve = undefined;
        this.loginReject = undefined;
      }
    }
  }

  async signIn(): Promise<GoogleUser> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.config.clientId) {
      throw new Error('Google OAuth não configurado. Configure VITE_GOOGLE_CLIENT_ID.');
    }

    return new Promise((resolve, reject) => {
      try {
        const google = (window as any).google;
        
        if (!google?.accounts) {
          reject(new Error('Google Identity Services não disponível'));
          return;
        }

        // Configurar callback temporário para este login
        this.loginResolve = resolve;
        this.loginReject = reject;

        // Mostrar popup de login
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Se o popup não foi mostrado, usar OAuth2 flow
            this.fallbackToOAuth2Flow().then(resolve).catch(reject);
          }
        });

      } catch (error) {
        console.error('❌ Erro no login Google:', error);
        reject(error);
      }
    });
  }

  private loginResolve?: (value: GoogleUser) => void;
  private loginReject?: (reason?: any) => void;

  private async fallbackToOAuth2Flow(): Promise<GoogleUser> {
    // Fallback para OAuth2 flow tradicional
    const authUrl = this.generateAuthUrl();
    window.location.href = authUrl;
    
    // Esta promise nunca resolve porque redirecionamos
    return new Promise(() => {});
  }

  async signOut(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const gapi = (window as any).gapi;
      const authInstance = gapi.auth2.getAuthInstance();
      
      await authInstance.signOut();
      
      // Limpar dados locais
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_user_data');
      
      console.log('✅ Logout Google realizado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro no logout Google:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<GoogleUser | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const gapi = (window as any).gapi;
      const authInstance = gapi.auth2.getAuthInstance();
      
      if (authInstance.isSignedIn.get()) {
        const googleUser = authInstance.currentUser.get();
        const profile = googleUser.getBasicProfile();
        
        return {
          id: profile.getId(),
          email: profile.getEmail(),
          name: profile.getName(),
          picture: profile.getImageUrl(),
          verified_email: true
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Erro ao obter usuário atual:', error);
      return null;
    }
  }

  isSignedIn(): boolean {
    if (!this.isInitialized) return false;
    
    try {
      const gapi = (window as any).gapi;
      const authInstance = gapi.auth2.getAuthInstance();
      return authInstance.isSignedIn.get();
    } catch {
      return false;
    }
  }

  // Método para obter token de acesso
  getAccessToken(): string | null {
    return localStorage.getItem('google_access_token');
  }

  // Método para verificar se OAuth está configurado
  isConfigured(): boolean {
    return !!this.config.clientId;
  }

  // Método para gerar URL de autorização (fallback)
  generateAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Processar callback de autorização
  async handleAuthCallback(code: string): Promise<GoogleUser> {
    try {
      // Trocar código por token
      const tokenResponse = await this.exchangeCodeForToken(code);
      
      // Obter dados do usuário
      const userData = await this.getUserInfo(tokenResponse.access_token);
      
      // Salvar dados
      localStorage.setItem('google_access_token', tokenResponse.access_token);
      if (tokenResponse.refresh_token) {
        localStorage.setItem('google_refresh_token', tokenResponse.refresh_token);
      }
      localStorage.setItem('google_user_data', JSON.stringify(userData));
      // SYNC COM SUPABASE
      import('../src/lib/supabase').then(({ supabase }) => {
        supabase.from('users').upsert({ id: userData.id || userData.email, email: userData.email, updated_at: new Date().toISOString() }).then(() => {});
      });
      
      return userData;
      
    } catch (error) {
      console.error('❌ Erro no callback OAuth:', error);
      throw error;
    }
  }

  private async exchangeCodeForToken(code: string): Promise<GoogleTokenResponse> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Falha ao trocar código por token');
    }

    return response.json();
  }

  private async getUserInfo(accessToken: string): Promise<GoogleUser> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Falha ao obter informações do usuário');
    }

    return response.json();
  }
}

export default GoogleOAuthReal;
export type { GoogleUser, GoogleOAuthConfig };
