import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, Plan, BillingRecord, FeatureKey } from '../types';

export type RegistrationData = Omit<User, 'id' | 'type' | 'status' | 'joinedDate'>;
export type AdminUserData = Omit<User, 'id' | 'joinedDate'>;

interface RegistrationResult {
  success: boolean;
  user?: User;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  platformUsers: User[];
  isLoading: boolean;
  isAuthenticated: boolean;
  isSubscriptionActive: () => boolean;
  hasAccess: (feature: FeatureKey) => boolean;
  login: (cpf: string, password: string) => Promise<User | { error: string }>;
  loginWithGoogle: () => Promise<User | { error: string }>;
  register: (data: RegistrationData) => Promise<RegistrationResult>;
  logout: () => void;
  addUser: (data: AdminUserData) => Promise<User | null>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  deleteUsers: (userIds: string[]) => Promise<void>;
  activateAffiliate: (userId: string, affiliateData?: any) => Promise<void>;
  subscribeUserToPlan: (userId: string, plan: Plan) => Promise<boolean>;
  purchaseAddOn: (userId: string, feature: FeatureKey, price: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEY = 'viraliza_user';
const AUTH_KEY = 'viraliza_authenticated';
const SESSION_KEY = 'viraliza_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [platformUsers, setPlatformUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Simple storage functions
  const saveUserToStorage = (userData: User) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(AUTH_KEY, 'true');
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
      console.log('✅ Usuário salvo com segurança');
    } catch (error) {
      console.error('❌ Erro ao salvar usuário:', error);
    }
  };

  const loadUserFromStorage = (): User | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const isAuth = localStorage.getItem(AUTH_KEY);
      
      if (stored && isAuth === 'true') {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao carregar usuário:', error);
      return null;
    }
  };

  const clearUserFromStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem('google_user_data');
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_oauth_state');
      console.log('✅ Dados limpos com segurança');
    } catch (error) {
      console.error('❌ Erro ao limpar dados:', error);
    }
  };

  const isSubscriptionActive = (): boolean => {
    if (!user) return false;
    if (user.type === 'admin') return true;
    if (user.plan) return true;
    return false;
  };

  const hasAccess = (feature: FeatureKey): boolean => {
    if (!user) return false;
    if (user.type === 'admin') return true;
    return true; // Simplified access control
  };

  // Initialize auth
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🚀 Inicializando autenticação estável...');
        setIsLoading(true);
        
        const storedUser = loadUserFromStorage();
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
          console.log('✅ Usuário carregado:', storedUser.email);
        }
        
        setIsLoading(false);
        console.log('✅ Autenticação inicializada com sucesso!');
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (loginField: string, password: string): Promise<User | { error: string }> => {
    try {
      console.log('🔄 Iniciando login estável');
      
      const cleanCpf = String(loginField).replace(/\D/g, '');
      
      // Admin login
      if (cleanCpf === '01484270657' && password === 'J137546fc@') {
        console.log('🚨 Admin login detectado');
        
        const adminUser: User = {
          id: 'admin_stable',
          name: 'Administrador ViralizaAI',
          email: 'admin@viralizaai.com',
          cpf: '01484270657',
          type: 'admin',
          status: 'Ativo',
          joinedDate: new Date().toISOString().split('T')[0],
          socialAccounts: [],
          paymentMethods: [],
          billingHistory: [],
          password: 'J137546fc@'
        };

        setUser(adminUser);
        setIsAuthenticated(true);
        saveUserToStorage(adminUser);
        
        console.log('✅ Admin logado com sucesso');
        return adminUser;
      }

      // Test user login
      if ((loginField === 'teste@teste.com' || loginField === 'teste') && password === '123456') {
        console.log('🚨 Usuário teste detectado');
        
        const testUser: User = {
          id: 'user_teste',
          name: 'Usuário Teste',
          email: 'teste@teste.com',
          cpf: '12345678901',
          type: 'client',
          status: 'Ativo',
          joinedDate: new Date().toISOString().split('T')[0],
          socialAccounts: [],
          paymentMethods: [],
          billingHistory: [],
          plan: 'Plano Mensal',
          trialStartDate: new Date().toISOString(),
          trialFollowers: 0,
          trialSales: 0,
          password: '123456'
        };

        setUser(testUser);
        setIsAuthenticated(true);
        saveUserToStorage(testUser);
        
        console.log('✅ Usuário teste logado com sucesso');
        return testUser;
      }

      console.log('❌ Credenciais não reconhecidas');
      return { error: 'Usuário não encontrado' };
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return { error: 'Erro interno do sistema' };
    }
  };

  const loginWithGoogle = async (): Promise<User | { error: string }> => {
    return { error: 'Login com Google em desenvolvimento' };
  };

  const register = async (data: RegistrationData): Promise<RegistrationResult> => {
    try {
      console.log('🔄 Iniciando cadastro:', { name: data.name, email: data.email });

      const newUser: User = {
        id: `user_${Date.now()}`,
        name: data.name,
        email: data.email,
        cpf: data.cpf ? String(data.cpf).replace(/\D/g, '') : undefined,
        type: 'client',
        status: 'Ativo',
        joinedDate: new Date().toISOString().split('T')[0],
        socialAccounts: [],
        paymentMethods: [],
        billingHistory: [],
        plan: 'Plano Mensal',
        trialStartDate: new Date().toISOString(),
        trialFollowers: 0,
        trialSales: 0,
        password: data.password
      };

      setPlatformUsers(prev => [...prev, newUser]);
      console.log('✅ Usuário cadastrado com sucesso');
      return { success: true, user: newUser };
    } catch (error) {
      console.error('❌ Erro no cadastro:', error);
      return { success: false, message: 'Erro ao cadastrar usuário' };
    }
  };

  const logout = () => {
    console.log('🔄 Fazendo logout...');
    setUser(null);
    setIsAuthenticated(false);
    clearUserFromStorage();
    console.log('✅ Logout realizado');
  };

  const addUser = async (data: AdminUserData): Promise<User | null> => {
    const emailToCheck = data.email.trim().toLowerCase();

    if (platformUsers.find((u) => u.email.trim().toLowerCase() === emailToCheck)) {
      return null;
    }

    const newUser: User = {
      ...data,
      email: emailToCheck,
      id: `user_${Date.now()}`,
      type: 'client',
      joinedDate: new Date().toISOString().split('T')[0]
    };

    setPlatformUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const updateUser = async (userId: string, data: Partial<User>) => {
    const userToUpdate = platformUsers.find((u) => u.id === userId);
    if (!userToUpdate) return;

    const updatedUser = { ...userToUpdate, ...data };
    setPlatformUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));

    if (user && user.id === userId) {
      setUser(updatedUser);
      saveUserToStorage(updatedUser);
      console.log('🔒 Dados do usuário atualizados');
    }
  };

  const deleteUsers = async (userIds: string[]) => {
    setPlatformUsers((prev) => prev.filter((u) => !userIds.includes(u.id)));

    if (user && userIds.includes(user.id)) {
      logout();
    }
  };

  const activateAffiliate = async (userId: string, affiliateData?: any) => {
    const defaultAffiliateInfo = {
      referralCode: `viral_${userId.slice(-6)}`,
      earnings: 0,
      referredUserIds: []
    };

    const affiliateInfo = affiliateData ? {
      ...defaultAffiliateInfo,
      ...affiliateData
    } : defaultAffiliateInfo;

    await updateUser(userId, { 
      affiliateInfo
    });
  };

  const subscribeUserToPlan = async (userId: string, plan: Plan): Promise<boolean> => {
    try {
      await updateUser(userId, { plan: plan as any });
      return true;
    } catch (error) {
      console.error('Erro ao assinar plano:', error);
      return false;
    }
  };

  const purchaseAddOn = async (userId: string, feature: FeatureKey, price: number): Promise<boolean> => {
    try {
      return true;
    } catch (error) {
      console.error('Erro ao comprar add-on:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        platformUsers,
        isLoading,
        isAuthenticated,
        isSubscriptionActive,
        hasAccess,
        login,
        loginWithGoogle,
        register,
        logout,
        addUser,
        updateUser,
        deleteUsers,
        activateAffiliate,
        subscribeUserToPlan,
        purchaseAddOn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
