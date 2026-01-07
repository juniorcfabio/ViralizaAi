// Google OAuth Service
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
}

class GoogleAuthService {
  private static instance: GoogleAuthService;
  private isInitialized = false;
  private clientId = ''; // Será configurado via env

  private constructor() {}

  static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      // Carregar Google Identity Services
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('✅ Google Identity Services carregado');
        this.isInitialized = true;
        resolve();
      };
      
      script.onerror = () => {
        console.error('❌ Erro ao carregar Google Identity Services');
        reject(new Error('Falha ao carregar Google Auth'));
      };
      
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<GoogleUser> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      try {
        // Configurar Google Sign-In
        window.google.accounts.id.initialize({
          client_id: this.getClientId(),
          callback: (response: any) => {
            try {
              const payload = this.parseJWT(response.credential);
              const googleUser: GoogleUser = {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                given_name: payload.given_name,
                family_name: payload.family_name
              };
              
              console.log('✅ Login Google bem-sucedido:', googleUser);
              resolve(googleUser);
            } catch (error) {
              console.error('❌ Erro ao processar resposta do Google:', error);
              reject(error);
            }
          }
        });

        // Renderizar botão de login
        window.google.accounts.id.prompt();
      } catch (error) {
        console.error('❌ Erro no Google Sign-In:', error);
        reject(error);
      }
    });
  }

  renderSignInButton(element: HTMLElement): void {
    if (!this.isInitialized) {
      console.error('Google Auth não inicializado');
      return;
    }

    window.google.accounts.id.renderButton(element, {
      theme: 'outline',
      size: 'large',
      width: '100%'
    });
  }

  private parseJWT(token: string): any {
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
      throw new Error('Token JWT inválido');
    }
  }

  private getClientId(): string {
    // Em produção, isso viria de variáveis de ambiente
    // Por enquanto, usar um client ID de desenvolvimento
    return '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com';
  }

  signOut(): void {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect();
    }
  }
}

export const googleAuthService = GoogleAuthService.getInstance();
