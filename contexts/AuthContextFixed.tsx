import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, Plan, BillingRecord, FeatureKey } from '../types';
import { API_BASE_URL, clearAuthToken, setAuthToken, getAuthHeaders } from '../src/config/api';
import {
  initDB,
  getAllUsersDB,
  addUserDB,
  updateUserDB,
  deleteUsersDB
} from '../services/dbService';
// import GoogleOAuthReal from '../services/googleOAuthReal';

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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [platformUsers, setPlatformUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const isSubscriptionActive = (): boolean => {
    if (!user) return false;
    if (user.type === 'admin') return true;
    if (user.plan) return true;
    if (!user.plan && user.trialStartDate) {
      const trialStart = new Date(user.trialStartDate);
      const trialDuration = 24 * 60 * 60 * 1000;
      return new Date().getTime() - trialStart.getTime() < trialDuration;
    }
    return false;
  };

  const hasAccess = (feature: FeatureKey): boolean => {
    if (user?.type === 'admin') return true;
    return true; // Acesso liberado para desenvolvimento
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        await initDB();

        // Verificar se deve evitar logout
        const preventLogout = localStorage.getItem('prevent_logout') === 'true';
        const userShouldStay = localStorage.getItem('user_should_stay_logged') === 'true';
        const paymentProcessing = localStorage.getItem('payment_processing') === 'true';
        const toolActivationForced = localStorage.getItem('tool_activation_forced');
        
        if (preventLogout || userShouldStay || paymentProcessing || toolActivationForced) {
          console.log('🔒 Logout prevenido - mantendo sessão ativa');
          localStorage.removeItem('prevent_logout');
          localStorage.removeItem('user_should_stay_logged');
          localStorage.removeItem('payment_processing');
        }
        
        // Tentar carregar usuário salvo
        const savedUser = localStorage.getItem('viraliza_ai_active_user_v1');
        const backupUser = localStorage.getItem('viraliza_ai_backup_user');
        
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            console.log('👤 Usuário encontrado no localStorage:', userData.email);
            
            // Verificar se há ativação de ferramenta pendente
            if (toolActivationForced) {
              const activationData = JSON.parse(toolActivationForced);
              console.log('🔥 Aplicando ativação de ferramenta:', activationData);
              
              if (!userData.addOns) userData.addOns = [];
              if (!userData.addOns.includes(activationData.toolId)) {
                userData.addOns.push(activationData.toolId);
              }
              if (!userData.addOns.includes('ai_video_generator')) {
                userData.addOns.push('ai_video_generator');
              }
              if (!userData.addOns.includes('ai-video-generator')) {
                userData.addOns.push('ai-video-generator');
              }
              
              if (!userData.purchasedTools) userData.purchasedTools = {};
              userData.purchasedTools[activationData.toolId] = {
                purchasedAt: new Date().toISOString(),
                active: true,
                sessionId: activationData.sessionId
              };
              userData.purchasedTools['ai_video_generator'] = {
                purchasedAt: new Date().toISOString(),
                active: true,
                sessionId: activationData.sessionId
              };
              userData.purchasedTools['ai-video-generator'] = {
                purchasedAt: new Date().toISOString(),
                active: true,
                sessionId: activationData.sessionId
              };
              
              // Salvar usuário atualizado
              localStorage.setItem('viraliza_ai_active_user_v1', JSON.stringify(userData));
              localStorage.removeItem('tool_activation_forced');
              
              console.log('✅ Ferramenta ativada no contexto de autenticação');
            }
            
            setUser(userData);
            setIsAuthenticated(true);
          } catch (error) {
            console.error('❌ Erro ao carregar usuário:', error);
            
            // Tentar backup
            if (backupUser) {
              try {
                const backupData = JSON.parse(backupUser);
                console.log('🔄 Usando backup do usuário:', backupData.email);
                setUser(backupData);
                setIsAuthenticated(true);
                localStorage.setItem('viraliza_ai_active_user_v1', backupUser);
              } catch (backupError) {
                console.error('❌ Erro no backup também:', backupError);
              }
            }
          }
        } else if (backupUser) {
          try {
            const backupData = JSON.parse(backupUser);
            console.log('🔄 Restaurando do backup:', backupData.email);
            setUser(backupData);
            setIsAuthenticated(true);
            localStorage.setItem('viraliza_ai_active_user_v1', backupUser);
          } catch (error) {
            console.error('❌ Erro ao restaurar backup:', error);
          }
        }
      } catch (error) {
        console.error('❌ Erro na inicialização da autenticação:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const register = async (data: RegistrationData): Promise<RegistrationResult> => {
    try {
      console.log('🔄 Iniciando cadastro:', { name: data.name, email: data.email });

      const existingUsers = await getAllUsersDB();
      const emailExists = existingUsers.find(u => u.email.toLowerCase() === data.email.toLowerCase());

      if (emailExists) {
        return { success: false, message: 'Email já cadastrado' };
      }

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

      await addUserDB(newUser);
      setPlatformUsers(prev => [...prev, newUser]);

      console.log('✅ Usuário cadastrado localmente com sucesso');
      return { success: true, user: newUser };
    } catch (error) {
      console.error('❌ Erro crítico no cadastro:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao cadastrar. Tente novamente.';
      return { success: false, message: errorMessage };
    }
  };

  const loginWithGoogle = async (): Promise<User | { error: string }> => {
    try {
      setIsLoading(true);
      
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('Google Client ID não configurado');
      }
      
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const scope = 'email profile';
      const responseType = 'code';
      const state = Math.random().toString(36).substring(7);
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=${responseType}&` +
        `state=${state}`;
      
      localStorage.setItem('google_oauth_state', state);
      window.location.href = authUrl;
      
      return { success: true } as any;
    } catch (error) {
      console.error('❌ Erro no login Google:', error);
      return { error: 'Erro ao fazer login com Google' };
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (loginField: string, password: string): Promise<User | { error: string }> => {
    console.log('🔄 Iniciando login:', { loginField, password: '***' });

    // Credenciais de admin
    const adminCredentials = [
      { email: 'admin@viralizaai.com', cpf: '01484270657', password: '123456' },
      { email: 'viralizaai.com', cpf: '01484270657', password: '123456' },
      { email: 'admin@viraliza.ai', cpf: '01484270657', password: '123456' },
    ];

    const cleanLoginField = loginField.trim().toLowerCase();
    const cleanCpf = String(loginField).replace(/\D/g, '');

    const adminMatch = adminCredentials.find(admin =>
      admin.email === cleanLoginField ||
      admin.cpf === cleanCpf ||
      cleanLoginField.includes('admin') ||
      cleanLoginField.includes('viralizaai')
    );

    if (adminMatch && (password === '123456' || password === 'admin')) {
      console.log('✅ Login admin direto detectado');

      const adminUser: User = {
        id: 'admin_direct',
        name: 'Administrador',
        email: 'admin@viralizaai.com',
        cpf: '01484270657',
        type: 'admin',
        status: 'Ativo',
        joinedDate: new Date().toISOString().split('T')[0],
        socialAccounts: [],
        paymentMethods: [],
        billingHistory: [],
        password: ''
      };

      setUser(adminUser);
      setIsAuthenticated(true);
      localStorage.setItem('viraliza_ai_active_user_v1', JSON.stringify(adminUser));

      console.log('✅ Admin logado com sucesso');
      return adminUser;
    }

    // Login local
    const localUsers = await getAllUsersDB();
    const isEmail = loginField.includes('@');
    
    const localUser = localUsers.find(user => {
      if (isEmail) {
        return user.email.toLowerCase() === loginField.trim().toLowerCase();
      } else {
        const userCpf = user.cpf ? String(user.cpf).replace(/\D/g, '') : '';
        return userCpf === cleanCpf;
      }
    });

    if (localUser) {
      console.log('✅ Usuário encontrado localmente:', localUser.email);

      if (localUser.password && localUser.password === password) {
        setUser(localUser);
        setIsAuthenticated(true);
        localStorage.setItem('viraliza_ai_active_user_v1', JSON.stringify(localUser));
        console.log('✅ Login local bem-sucedido');
        return localUser;
      } else if (!localUser.password) {
        setUser(localUser);
        setIsAuthenticated(true);
        localStorage.setItem('viraliza_ai_active_user_v1', JSON.stringify(localUser));
        console.log('✅ Login local bem-sucedido (sem verificação de senha)');
        return localUser;
      } else {
        console.log('❌ Senha incorreta');
        return { error: 'Senha incorreta' };
      }
    } else {
      console.log('❌ Usuário não encontrado');
      return { error: 'Usuário não encontrado' };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    clearAuthToken();

    // Logout do Google se necessário
    try {
      localStorage.removeItem('google_user_data');
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_oauth_state');
    } catch (error) {
      console.log('Erro ao limpar dados do Google');
    }

    localStorage.removeItem('viraliza_ai_active_user_v1');
    localStorage.removeItem('viraliza_ai_backup_user');

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

    await addUserDB(newUser);
    setPlatformUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const updateUser = async (userId: string, data: Partial<User>) => {
    const users = await getAllUsersDB();
    const userToUpdate = users.find((u) => u.id === userId);

    if (!userToUpdate) return;

    const updatedUser = { ...userToUpdate, ...data };

    await updateUserDB(updatedUser);
    setPlatformUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));

    if (user && user.id === userId) {
      setUser(updatedUser);
      localStorage.setItem('viraliza_ai_active_user_v1', JSON.stringify(updatedUser));
    }
  };

  const deleteUsers = async (userIds: string[]) => {
    await deleteUsersDB(userIds);
    setPlatformUsers((prev) => prev.filter((u) => !userIds.includes(u.id)));

    if (user && userIds.includes(user.id)) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('viraliza_ai_active_user_v1');
      clearAuthToken();
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
      referralCode: affiliateData.referralCode || defaultAffiliateInfo.referralCode,
      personalInfo: affiliateData.personalInfo,
      bankingInfo: affiliateData.bankingInfo,
      commissionRate: affiliateData.commissionRate || 0.30,
      status: affiliateData.status || 'active',
      createdAt: affiliateData.createdAt || new Date().toISOString()
    } : defaultAffiliateInfo;

    await updateUser(userId, { affiliateInfo });
  };

  const subscribeUserToPlan = async (userId: string, plan: Plan): Promise<boolean> => {
    const users = await getAllUsersDB();
    const userToUpdate = users.find((u) => u.id === userId);

    if (!userToUpdate) return false;

    const today = new Date();
    const newBillingRecord: BillingRecord = {
      id: `bill_${Date.now()}`,
      date: today.toISOString(),
      amount: `R$ ${plan.price}`,
      status: 'Pago',
      description: `Assinatura Plano ${plan.name}`
    };

    let endDate = new Date(today);
    const planName = plan.name.toLowerCase();
    if (planName.includes('mensal') || planName.includes('monthly'))
      endDate.setMonth(endDate.getMonth() + 1);
    else if (planName.includes('trimestral') || planName.includes('quarterly'))
      endDate.setMonth(endDate.getMonth() + 3);
    else if (planName.includes('semestral') || planName.includes('semiannual'))
      endDate.setMonth(endDate.getMonth() + 6);
    else if (planName.includes('anual') || planName.includes('annual'))
      endDate.setFullYear(endDate.getFullYear() + 1);
    else endDate.setMonth(endDate.getMonth() + 1);

    await updateUser(userId, {
      plan: plan.name,
      subscriptionEndDate: endDate.toISOString(),
      billingHistory: [...(userToUpdate.billingHistory || []), newBillingRecord]
    });

    return true;
  };

  const purchaseAddOn = async (
    userId: string,
    feature: FeatureKey,
    price: number
  ): Promise<boolean> => {
    const users = await getAllUsersDB();
    const userToUpdate = users.find((u) => u.id === userId);
    if (!userToUpdate) return false;

    const newBillingRecord: BillingRecord = {
      id: `bill_addon_${Date.now()}`,
      date: new Date().toISOString(),
      amount: `R$ ${price.toFixed(2)}`,
      status: 'Pago',
      description: `Compra Avulsa: Ferramenta ${feature}`
    };

    const currentAddOns = userToUpdate.addOns || [];
    if (!currentAddOns.includes(feature)) {
      await updateUser(userId, {
        addOns: [...currentAddOns, feature],
        billingHistory: [...(userToUpdate.billingHistory || []), newBillingRecord]
      });
    }

    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        user,
        platformUsers,
        isAuthenticated,
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
        isSubscriptionActive,
        hasAccess
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
