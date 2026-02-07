// =======================
// 🔐 CLIENTE API SEGURO
// =======================

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface ToolPayload {
  action: string;
  parameters?: any;
  metadata?: {
    userAgent: string;
    timestamp: number;
    sessionId: string;
  };
}

class SecureAPIClient {
  private static instance: SecureAPIClient;
  private baseURL: string;
  private sessionId: string;

  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://viralizaai.vercel.app/api' 
      : 'http://localhost:3000/api';
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): SecureAPIClient {
    if (!SecureAPIClient.instance) {
      SecureAPIClient.instance = new SecureAPIClient();
    }
    return SecureAPIClient.instance;
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getAuthToken(): string | null {
    try {
      const token = localStorage.getItem('viraliza_ai_auth_token');
      if (!token) {
        console.warn('🔐 Token de autenticação não encontrado');
        return null;
      }
      return token;
    } catch (error) {
      console.error('❌ Erro ao obter token:', error);
      return null;
    }
  }

  private getHeaders(): HeadersInit {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Session-ID': this.sessionId,
      'X-Client-Version': '1.0.0',
      'X-Request-Time': Date.now().toString()
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<APIResponse<T>> {
    try {
      if (!response.ok) {
        if (response.status === 401) {
          this.handleUnauthorized();
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        
        if (response.status === 403) {
          throw new Error('Acesso negado. Upgrade de plano necessário.');
        }

        if (response.status === 429) {
          throw new Error('Muitas requisições. Tente novamente em alguns minutos.');
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Erro na resposta da API:', error);
      throw error;
    }
  }

  private handleUnauthorized(): void {
    // Limpar dados de autenticação
    localStorage.removeItem('viraliza_ai_auth_token');
    localStorage.removeItem('viraliza_ai_active_user_v1');
    
    // Redirecionar para login
    window.location.href = '/#/login';
  }

  async callToolAPI<T = any>(action: string, payload: any = {}): Promise<APIResponse<T>> {
    try {
      const toolPayload: ToolPayload = {
        action,
        parameters: payload,
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          sessionId: this.sessionId
        }
      };

      console.log(`🔧 Chamando ferramenta: ${action}`);

      const response = await fetch(`${this.baseURL}/tools/${action}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(toolPayload)
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      console.error(`❌ Erro ao chamar ferramenta ${action}:`, error);
      return {
        success: false,
        error: error.message || 'Erro interno do servidor'
      };
    }
  }

  async validatePlan(requiredPlan: string): Promise<APIResponse<{ hasAccess: boolean; currentPlan: string }>> {
    try {
      const response = await fetch(`${this.baseURL}/auth/validate-plan`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ requiredPlan })
      });

      return await this.handleResponse(response);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro na validação do plano'
      };
    }
  }

  async createCheckoutSession(planData: any): Promise<APIResponse<{ url: string }>> {
    try {
      const response = await fetch(`${this.baseURL}/payments/create-checkout`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(planData)
      });

      return await this.handleResponse(response);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao criar sessão de checkout'
      };
    }
  }

  async getUserProfile(): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/auth/profile`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      return await this.handleResponse(response);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao obter perfil do usuário'
      };
    }
  }

  // Método para renovar token automaticamente
  async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('viraliza_ai_auth_token', data.token);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      return false;
    }
  }
}

export default SecureAPIClient;
