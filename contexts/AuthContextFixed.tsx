import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, Plan, BillingRecord, FeatureKey } from '../types';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getCurrentUser, 
  getSession, 
  onAuthStateChange 
} from '../src/services/auth';
import autoSupabase from '../services/autoSupabaseIntegration';

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
  hasToolAccess: (toolName: string) => boolean;
  getPlanPermissions: () => any;
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
  activatePlanPermissions: (planType: string, permissions: any) => void;
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
    console.log('🔍 hasAccess chamado para feature:', feature, 'usuário:', user?.type);
    if (user?.type === 'admin') {
      console.log('✅ Admin tem acesso total a:', feature);
      return true;
    }
    
    // Para usuários normais, verificar planos e add-ons
    if (!user) return false;
    
    // Verificar se tem no plano atual
    const userPlan = user.plan;
    if (userPlan) {
      // Aqui você pode adicionar lógica específica de planos
      return true; // Temporariamente liberado para desenvolvimento
    }
    
    // Verificar add-ons
    if (user.addOns && user.addOns.includes(feature)) {
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // 1. VERIFICAR SESSÃO ADMIN NO LOCALSTORAGE (admin não usa Supabase Auth)
        try {
          const savedAdmin = localStorage.getItem('viraliza_admin_session');
          if (savedAdmin) {
            const adminData = JSON.parse(savedAdmin);
            if (adminData?.type === 'admin') {
              console.log('✅ Sessão admin restaurada do localStorage');
              setUser(adminData);
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('⚠️ Erro ao restaurar sessão admin:', e);
        }

        // 2. Verificar sessão do Supabase (para clientes)
        const session = await getSession();
        if (session?.user) {
          console.log('✅ Sessão Supabase encontrada:', session.user.email);
          
          const userData: User = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
            email: session.user.email || '',
            type: 'client',
            status: 'Ativo',
            joinedDate: new Date().toISOString().split('T')[0],
            socialAccounts: [],
            paymentMethods: [],
            billingHistory: []
          };
          
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          console.log('❌ Nenhuma sessão encontrada');
          setUser(null);
          setIsAuthenticated(false);
        }
        
        // Listener para mudanças de autenticação
        const { data: { subscription } } = onAuthStateChange((event, session) => {
          console.log('🔄 Auth state changed:', event, session?.user?.email);
          
          if (event === 'SIGNED_IN' && session?.user) {
            const userData: User = {
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
              email: session.user.email || '',
              type: 'client',
              status: 'Ativo',
              joinedDate: new Date().toISOString().split('T')[0],
              socialAccounts: [],
              paymentMethods: [],
              billingHistory: []
            };
            
            setUser(userData);
            setIsAuthenticated(true);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setIsAuthenticated(false);
          }
        });
        
        return () => {
          subscription.unsubscribe();
        };
        
      } catch (error) {
        console.error('❌ Erro na inicialização da autenticação:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const register = async (data: RegistrationData): Promise<RegistrationResult> => {
    try {
      console.log('🔄 Iniciando cadastro SUPABASE:', { name: data.name, email: data.email });

      const authData = await registerUser(data.email, data.password);
      
      if (authData.user) {
        // Criar perfil no Supabase
        const { supabaseStorage } = await import('../src/services/supabaseStorage');
        await supabaseStorage.createUserProfile({
          name: data.name,
          email: data.email,
          user_type: 'client',
          status: 'active',
          joined_date: new Date().toISOString(),
          preferences: {}
        });

        const userData: User = {
          id: authData.user.id,
          name: data.name,
          email: data.email,
          type: 'client',
          status: 'Ativo',
          joinedDate: new Date().toISOString().split('T')[0],
          socialAccounts: [],
          paymentMethods: [],
          billingHistory: []
        };

        // Log da atividade
        await supabaseStorage.logActivity({
          action: 'user_registered',
          details: { email: data.email, name: data.name }
        });

        // Registrar indicação de afiliado se houver referral code
        try {
          const refCode = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('referralCode') : null;
          if (refCode && authData.user.id) {
            const { default: RealAffiliateService } = await import('../services/realAffiliateService');
            const affiliateSvc = RealAffiliateService.getInstance();
            const tracked = await affiliateSvc.trackReferral(refCode, authData.user.id);
            if (tracked) {
              console.log('✅ Indicação de afiliado registrada:', refCode, '->', authData.user.id);
              sessionStorage.removeItem('referralCode');
            }
          }
        } catch (refErr) {
          console.warn('⚠️ Erro ao registrar indicação de afiliado:', refErr);
        }

        console.log('✅ Usuário cadastrado no SUPABASE com perfil criado');
        return { success: true, user: userData };
      }

      return { success: false, message: 'Erro no cadastro' };
    } catch (error: any) {
      console.error('❌ Erro no cadastro SUPABASE:', error);
      const errorMessage = error.message || 'Erro ao cadastrar. Tente novamente.';
      return { success: false, message: errorMessage };
    }
  };

  const loginWithGoogle = async (): Promise<User | { error: string }> => {
    try {
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
    }
  };

  const login = async (email: string, password: string): Promise<User | { error: string }> => {
    try {
      console.log('🔄 Iniciando login:', { email, password: '***' });

      // Admin login hardcoded
      const cleanCpf = String(email).replace(/\D/g, '');
      if (cleanCpf === '01484270657' && password === 'J137546fc@') {
        console.log('🚨 Admin login detectado');
        
        const adminUser: User = {
          id: 'admin_fixed',
          name: 'Administrador ViralizaAI',
          email: 'admin@viralizaai.com',
          cpf: '01484270657',
          type: 'admin',
          status: 'Ativo',
          joinedDate: new Date().toISOString().split('T')[0],
          socialAccounts: [],
          paymentMethods: [],
          billingHistory: []
        };

        setUser(adminUser);
        setIsAuthenticated(true);
        // Persistir sessão admin no localStorage para sobreviver a refresh
        localStorage.setItem('viraliza_admin_session', JSON.stringify(adminUser));
        // SYNC COM SUPABASE/POSTGRESQL
        autoSupabase.saveUser(adminUser);
        autoSupabase.logActivity(adminUser.id, 'admin_login', { cpf: cleanCpf });
        console.log('✅ Admin logado com sucesso (Supabase + localStorage)');
        return adminUser;
      }

      const authData = await loginUser(email, password);
      
      if (authData.user) {
        const userData: User = {
          id: authData.user.id,
          name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'Usuário',
          email: authData.user.email || '',
          type: 'client',
          status: 'Ativo',
          joinedDate: new Date().toISOString().split('T')[0],
          socialAccounts: [],
          paymentMethods: [],
          billingHistory: []
        };

        setUser(userData);
        setIsAuthenticated(true);
        console.log('✅ Login SUPABASE realizado com sucesso');
        return userData;
      }

      return { error: 'Erro no login' };
    } catch (error: any) {
      console.error('❌ Erro no login SUPABASE:', error);
      return { error: error.message || 'Credenciais inválidas' };
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setIsAuthenticated(false);
      // Limpar sessão admin do localStorage
      localStorage.removeItem('viraliza_admin_session');
      console.log('✅ Logout realizado');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('viraliza_admin_session');
    }
  };

  const addUser = async (data: AdminUserData): Promise<User | null> => {
    // Função administrativa - não usa Supabase Auth
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
    // Função administrativa - não usa Supabase Auth
    const userToUpdate = platformUsers.find((u) => u.id === userId);

    if (!userToUpdate) return;

    const updatedUser = { ...userToUpdate, ...data };

    setPlatformUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));

    if (user && user.id === userId) {
      setUser(updatedUser);
    }
  };

  const deleteUsers = async (userIds: string[]) => {
    // Função administrativa - não usa Supabase Auth
    setPlatformUsers((prev) => prev.filter((u) => !userIds.includes(u.id)));

    if (user && userIds.includes(user.id)) {
      await logout();
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
    const userToUpdate = platformUsers.find((u) => u.id === userId);

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
    const userToUpdate = platformUsers.find((u) => u.id === userId);
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

  // 🔐 VERIFICAR ACESSO A FERRAMENTA ESPECÍFICA
  const hasToolAccess = (toolName: string): boolean => {
    if (!user) return false;
    
    // Admin tem acesso a tudo
    if (user.type === 'admin') return true;
    
    // Verificar se tem assinatura ativa
    if (!isSubscriptionActive()) return false;
    
    // Verificar permissões do plano
    const permissions = getPlanPermissions();
    if (!permissions) return false;
    
    return permissions.tools.includes(toolName) || permissions.tools.includes('all_tools');
  };

  // 📋 OBTER PERMISSÕES DO PLANO ATUAL
  const getPlanPermissions = () => {
    if (!user || !user.plan) return null;
    
    const planPermissions = {
      'mensal': {
        tools: ['basic_tools', 'social_media', 'content_generator'],
        features: ['basic_analytics', 'standard_support'],
        limits: { videos_per_month: 10, ebooks_per_month: 5 }
      },
      'trimestral': {
        tools: ['basic_tools', 'social_media', 'content_generator', 'advanced_analytics'],
        features: ['advanced_analytics', 'priority_support', 'custom_templates'],
        limits: { videos_per_month: 30, ebooks_per_month: 15 }
      },
      'semestral': {
        tools: ['basic_tools', 'social_media', 'content_generator', 'advanced_analytics', 'ai_tools'],
        features: ['advanced_analytics', 'priority_support', 'custom_templates', 'white_label'],
        limits: { videos_per_month: 60, ebooks_per_month: 30 }
      },
      'anual': {
        tools: ['all_tools', 'premium_features', 'enterprise_tools'],
        features: ['all_features', 'dedicated_support', 'custom_integrations', 'api_access'],
        limits: { videos_per_month: 'unlimited', ebooks_per_month: 'unlimited' }
      }
    };

    return planPermissions[user.plan.toLowerCase()] || null;
  };

  // ⚡ ATIVAR PERMISSÕES DO PLANO
  const activatePlanPermissions = (planType: string, permissions: any) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      plan: planType,
      planExpiresAt: permissions.expiresAt,
      planPermissions: permissions.permissions
    };
    
    setUser(updatedUser);
    console.log('🔓 Permissões ativadas:', permissions.permissions);
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
        hasAccess,
        hasToolAccess,
        getPlanPermissions,
        activatePlanPermissions
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
