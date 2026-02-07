// Sistema de autenticação local temporário
interface LocalUser {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

class LocalAuthService {
  private storageKey = 'viralizaai_users';
  private sessionKey = 'viralizaai_session';

  // Salvar usuários no localStorage
  private saveUsers(users: LocalUser[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(users));
  }

  // Carregar usuários do localStorage
  private getUsers(): LocalUser[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  // Cadastrar usuário
  async registerUser(name: string, email: string, password: string): Promise<{ success: boolean; user?: LocalUser; message?: string }> {
    try {
      const users = this.getUsers();
      
      // Verificar se email já existe
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, message: 'Email já cadastrado' };
      }

      // Criar novo usuário
      const newUser: LocalUser = {
        id: `user_${Date.now()}`,
        name,
        email,
        password, // Em produção, seria hash
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      this.saveUsers(users);

      console.log('✅ Usuário cadastrado com sucesso:', { name, email });
      return { success: true, user: newUser };
    } catch (error) {
      console.error('❌ Erro no cadastro:', error);
      return { success: false, message: 'Erro ao cadastrar usuário' };
    }
  }

  // Login usuário
  async loginUser(email: string, password: string): Promise<{ success: boolean; user?: LocalUser; message?: string }> {
    try {
      const users = this.getUsers();
      const user = users.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password
      );

      if (!user) {
        return { success: false, message: 'Email ou senha incorretos' };
      }

      // Salvar sessão
      localStorage.setItem(this.sessionKey, JSON.stringify(user));
      console.log('✅ Login realizado com sucesso:', user.email);
      return { success: true, user };
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return { success: false, message: 'Erro ao fazer login' };
    }
  }

  // Verificar sessão atual
  getCurrentUser(): LocalUser | null {
    try {
      const stored = localStorage.getItem(this.sessionKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  // Logout
  logout(): void {
    localStorage.removeItem(this.sessionKey);
    console.log('✅ Logout realizado');
  }

  // Verificar se está logado
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}

export const localAuth = new LocalAuthService();
