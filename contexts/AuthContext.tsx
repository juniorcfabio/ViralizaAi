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
  isSubscriptionActive: () => boolean;
  hasAccess: (feature: FeatureKey) => boolean;
  login: (cpf: string, password: string) => Promise<User | { error: string }>;
  register: (data: RegistrationData) => Promise<RegistrationResult>;
  logout: () => void;
  addUser: (data: AdminUserData) => Promise<User | null>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  deleteUsers: (userIds: string[]) => Promise<void>;

  activateAffiliate: (userId: string) => Promise<void>;
  subscribeUserToPlan: (userId: string, plan: Plan) => Promise<boolean>;
  purchaseAddOn: (userId: string, feature: FeatureKey, price: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_USER_STORAGE_KEY = 'viraliza_ai_active_user_v1';

const PLAN_FEATURES: Record<string, FeatureKey[]> = {
  'Plano Mensal': ['conversionRadar', 'affiliate'],
  'Monthly Plan': ['conversionRadar', 'affiliate'],
  'Plan Mensual': ['conversionRadar', 'affiliate'],
  'Plano Trimestral': ['conversionRadar', 'audioDetector', 'analytics', 'affiliate'],
  'Quarterly Plan': ['conversionRadar', 'audioDetector', 'analytics', 'affiliate'],
  'Plano Semestral': [
    'conversionRadar',
    'audioDetector',
    'competitorSpy',
    'analytics',
    'affiliate',
    'advancedGrowth'
  ],
  'Semiannual Plan': [
    'conversionRadar',
    'audioDetector',
    'competitorSpy',
    'analytics',
    'affiliate',
    'advancedGrowth'
  ],
  'Plano Anual': [
    'conversionRadar',
    'audioDetector',
    'competitorSpy',
    'trendPredictor',
    'analytics',
    'affiliate',
    'autopilot',
    'advancedGrowth',
    'viralPrediction'
  ],
  'Annual Plan': [
    'conversionRadar',
    'audioDetector',
    'competitorSpy',
    'trendPredictor',
    'analytics',
    'affiliate',
    'autopilot',
    'advancedGrowth',
    'viralPrediction'
  ]
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [platformUsers, setPlatformUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
      const baseUser: User | null = storedUser ? JSON.parse(storedUser) : null;

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const previewRole = params.get('previewRole');

        // Pré-visualização CLIENTE (usada nos iframes de teste)
        if (previewRole === 'client') {
          const now = new Date();
          const end = new Date(now);
          end.setMonth(end.getMonth() + 1);

          const previewClient: User = {
            id: 'preview_client',
            type: 'client',
            status: 'Ativo',
            name: 'Cliente de Pré-visualização',
            email: 'preview@client.test',
            password: '',
            joinedDate: now.toISOString().split('T')[0],
            socialAccounts: [],
            paymentMethods: [],
            billingHistory: [],
            plan: 'Plano Mensal',
            subscriptionEndDate: end.toISOString(),
            trialFollowers: 0,
            trialSales: 0,
            trialStartDate: now.toISOString()
          };

          return previewClient;
        }

        // Pré-visualização ADMIN (usada nos iframes de teste)
        if (previewRole === 'admin') {
          const now = new Date();

          const previewAdmin: User = {
            id: 'preview_admin',
            type: 'admin',
            status: 'Ativo',
            name: 'Admin de Pré-visualização',
            email: 'preview@admin.test',
            password: '',
            joinedDate: now.toISOString().split('T')[0],
            socialAccounts: [],
            paymentMethods: [],
            billingHistory: []
          };

          return previewAdmin;
        }
      }

      return baseUser;
    } catch (error) {
      return null;
    }
  });

  const isSubscriptionActive = (): boolean => {
    if (!user) return false;
    if (user.type === 'admin') return true;

    // Simplificação: se tiver um plano definido, considera ativo.
    if (user.plan) return true;

    // Só trial para quem ainda não tem plano
    if (!user.plan && user.trialStartDate) {
      const trialStart = new Date(user.trialStartDate);
      const trialDuration = 24 * 60 * 60 * 1000;
      return new Date().getTime() - trialStart.getTime() < trialDuration;
    }

    return false;
  };

  const hasAccess = (feature: FeatureKey): boolean => {
    if (user?.type === 'admin') return true;

    // 1. Check Plan Features
    const userPlan = user?.plan || '';
    let planKey = Object.keys(PLAN_FEATURES).find((k) => k === userPlan);
    if (!planKey) {
      planKey = Object.keys(PLAN_FEATURES).find(
        (k) => userPlan.includes(k) || k.includes(userPlan)
      );
    }
    const allowedFeatures = planKey ? PLAN_FEATURES[planKey] : [];
    if (allowedFeatures.includes(feature)) return true;

    // 2. Check Add-ons (Purchased separately or granted by admin)
    if (user?.addOns && user.addOns.includes(feature)) return true;

    return false;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await initDB(); // Auto-restore do banco

        // Tentar carregar usuários do backend (se endpoint existir)
        try {
          console.log('🔄 Tentando sincronizar usuários do backend...');
          const res = await fetch(`${API_BASE_URL}/auth/users`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (res.ok) {
            const backendUsers = await res.json();
            console.log('✅ Usuários encontrados no backend:', backendUsers.length);
            
            // Sincronizar usuários do backend com o banco local
            for (const backendUser of backendUsers) {
              const mappedUser: User = {
                id: String(backendUser.id),
                name: String(backendUser.name || ''),
                email: String(backendUser.email || ''),
                cpf: backendUser.cpf ? String(backendUser.cpf) : undefined,
                type: backendUser.role === 'admin' ? 'admin' : 'client',
                status: 'Ativo',
                joinedDate: backendUser.createdAt ? String(backendUser.createdAt).split('T')[0] : new Date().toISOString().split('T')[0],
                socialAccounts: backendUser.socialAccounts || [],
                paymentMethods: backendUser.paymentMethods || [],
                billingHistory: backendUser.billingHistory || [],
                plan: backendUser.plan,
                subscriptionEndDate: backendUser.subscriptionEndDate,
                trialStartDate: backendUser.trialStartDate || new Date().toISOString(),
                trialFollowers: backendUser.trialFollowers || 0,
                trialSales: backendUser.trialSales || 0,
                affiliateInfo: backendUser.affiliateInfo,
                referredBy: backendUser.referredBy,
                addOns: backendUser.addOns,
                password: ''
              };

              // Verificar se usuário já existe no banco local
              const existingUsers = await getAllUsersDB();
              const existingUser = existingUsers.find(u => u.email === mappedUser.email);

              if (!existingUser) {
                await addUserDB(mappedUser);
                console.log('➕ Usuário adicionado:', mappedUser.email);
              } else {
                // Atualizar dados do usuário existente
                await updateUserDB({ ...existingUser, ...mappedUser });
                console.log('🔄 Usuário atualizado:', mappedUser.email);
              }
            }
          } else {
            console.log('⚠️ Endpoint /auth/users não disponível ou retornou erro:', res.status);
          }
        } catch (error) {
          console.log('❌ Erro ao sincronizar com backend:', error);
          
          // Fallback: Criar usuários de exemplo se não houver nenhum
          const existingUsers = await getAllUsersDB();
          if (existingUsers.length === 0) {
            console.log('📝 Criando usuários de exemplo...');
            
            // Criar usuário admin padrão
            const adminUser: User = {
              id: 'admin_default',
              name: 'Administrador',
              email: 'admin@viralizaai.com',
              type: 'admin',
              status: 'Ativo',
              joinedDate: new Date().toISOString().split('T')[0],
              socialAccounts: [],
              paymentMethods: [],
              billingHistory: [],
              password: ''
            };
            
            // Criar usuário de exemplo baseado no e-mail que tentou cadastrar
            const exampleUser: User = {
              id: 'user_example',
              name: 'Junior Viralizaai',
              email: 'juniorviralizaai@gmail.com',
              cpf: '12345678910',
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
              password: ''
            };
            
            await addUserDB(adminUser);
            await addUserDB(exampleUser);
            console.log('✅ Usuários de exemplo criados');
          }
        }

        const users = await getAllUsersDB();
        setPlatformUsers(users);

        if (user) {
          // Revalidar usuário salvo contra o DB atual
          const freshUser = users.find((u) => u.id === user.id);
          if (freshUser) {
            setUser(freshUser);
            localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(freshUser));
          }
        }
      } catch (error) {
        console.error('Falha crítica ao carregar DB:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    }
  }, [user]);

  const register = async (data: RegistrationData): Promise<RegistrationResult> => {
    try {
      const referralCode = sessionStorage.getItem('referralCode');
      const payload: any = {
        name: data.name,
        email: data.email,
        password: data.password,
        cpf: data.cpf ? String(data.cpf).replace(/\D/g, '') : undefined,
      };

      if (referralCode) {
        payload.referredBy = referralCode;
      }

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseJson = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          (responseJson && (responseJson.message || responseJson.error)) ||
          `Erro ao cadastrar: ${res.status}`;
        return { success: false, message };
      }

      // Adicionar usuário ao banco local após cadastro bem-sucedido no backend
      if (responseJson?.user) {
        const backendUser = responseJson.user;
        const newUser: User = {
          id: String(backendUser.id),
          name: String(backendUser.name || data.name),
          email: String(backendUser.email || data.email),
          cpf: backendUser.cpf ? String(backendUser.cpf) : (data.cpf ? String(data.cpf).replace(/\D/g, '') : undefined),
          type: backendUser.role === 'admin' ? 'admin' : 'client',
          status: 'Ativo',
          joinedDate: backendUser.createdAt ? String(backendUser.createdAt).split('T')[0] : new Date().toISOString().split('T')[0],
          socialAccounts: backendUser.socialAccounts || [],
          paymentMethods: backendUser.paymentMethods || [],
          billingHistory: backendUser.billingHistory || [],
          plan: backendUser.plan,
          subscriptionEndDate: backendUser.subscriptionEndDate,
          trialStartDate: backendUser.trialStartDate || new Date().toISOString(),
          trialFollowers: backendUser.trialFollowers || 0,
          trialSales: backendUser.trialSales || 0,
          affiliateInfo: backendUser.affiliateInfo,
          referredBy: backendUser.referredBy,
          addOns: backendUser.addOns,
          password: '' // Não armazenar senha localmente
        };

        // Adicionar ao banco local e atualizar lista de usuários
        await addUserDB(newUser);
        setPlatformUsers(prev => [...prev, newUser]);
      }

      sessionStorage.removeItem('referralCode');
      return { success: true };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao cadastrar. Tente novamente.';
      return { success: false, message: errorMessage };
    }
  };

  const login = async (cpf: string, password: string): Promise<User | { error: string }> => {
    const cleanCpf = String(cpf).replace(/\D/g, '');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf: cleanCpf, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          (data && (data.message || data.error)) ||
          `Erro ao logar: ${res.status}`;
        return { error: message };
      }

      if (data?.token) {
        setAuthToken(data.token);
      }

      if (data?.user) {
        const backendUser = data.user as any;
        const joinedDate = backendUser.createdAt
          ? String(backendUser.createdAt).split('T')[0]
          : new Date().toISOString().split('T')[0];

        const mappedUser: User = {
          id: String(backendUser.id),
          name: String(backendUser.name || ''),
          email: String(backendUser.email || ''),
          cpf: backendUser.cpf ? String(backendUser.cpf) : undefined,
          type: backendUser.role === 'admin' ? 'admin' : 'client',
          status: 'Ativo',
          joinedDate,
          socialAccounts: backendUser.socialAccounts || [],
          paymentMethods: backendUser.paymentMethods || [],
          billingHistory: backendUser.billingHistory || [],
          plan: backendUser.plan,
          subscriptionEndDate: backendUser.subscriptionEndDate,
          trialStartDate: backendUser.trialStartDate,
          trialFollowers: backendUser.trialFollowers,
          trialSales: backendUser.trialSales,
          affiliateInfo: backendUser.affiliateInfo,
          referredBy: backendUser.referredBy,
          addOns: backendUser.addOns,
        };

        setUser(mappedUser);
        return mappedUser;
      }

      return { error: 'Erro ao logar' };
    } catch (error) {
      console.error('Erro ao logar:', error);
      const message = error instanceof Error ? error.message : String(error);
      return { error: message || 'Erro ao logar. Tente novamente.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    clearAuthToken();
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
    }
  };

  const deleteUsers = async (userIds: string[]) => {
    await deleteUsersDB(userIds);
    setPlatformUsers((prev) => prev.filter((u) => !userIds.includes(u.id)));

    if (user && userIds.includes(user.id)) {
      setUser(null);
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      clearAuthToken();
    }
  };

  const activateAffiliate = async (userId: string) => {
    await updateUser(userId, {
      affiliateInfo: {
        referralCode: `viral_${userId.slice(-6)}`,
        earnings: 0,
        referredUserIds: []
      }
    });
  };

  const subscribeUserToPlan = async (userId: string, plan: Plan): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 1500));

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
    else endDate.setMonth(endDate.getMonth() + 1); // Default

    await updateUser(userId, {
      plan: plan.name,
      subscriptionEndDate: endDate.toISOString(),
      billingHistory: [...(userToUpdate.billingHistory || []), newBillingRecord]
    });

    // Comissão de afiliado
    if (userToUpdate.referredBy) {
      const usersAll = await getAllUsersDB();
      const affiliate = usersAll.find(
        (u) => u.affiliateInfo?.referralCode === userToUpdate.referredBy
      );

      if (affiliate && affiliate.affiliateInfo) {
        const commissionRate =
          parseFloat(localStorage.getItem('viraliza_affiliate_commission_rate') || '20') /
          100;
        const planPrice =
          typeof plan.price === 'string'
            ? parseFloat(plan.price.replace(',', '.'))
            : plan.price;
        const commission = planPrice * commissionRate;

        await updateUser(affiliate.id, {
          affiliateInfo: {
            ...affiliate.affiliateInfo,
            earnings: (affiliate.affiliateInfo.earnings || 0) + commission,
            referredUserIds: [
              ...Array.from(
                new Set([...(affiliate.affiliateInfo.referredUserIds || []), userId])
              )
            ]
          }
        });
      }
    }

    return true;
  };

  const purchaseAddOn = async (
    userId: string,
    feature: FeatureKey,
    price: number
  ): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

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
        login,
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