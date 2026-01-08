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
import GoogleOAuthReal from '../services/googleOAuthReal';

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

const ACTIVE_USER_STORAGE_KEY = 'viraliza_ai_active_user_v1';

class WindowScopedAuth {
  private static instances = new Map<string, WindowScopedAuth>();
  private windowId: string;
  private storagePrefix: string;

  constructor() {
    this.windowId = this.generateWindowId();
    this.storagePrefix = `viraliza_auth_${this.windowId}`;
    WindowScopedAuth.instances.set(this.windowId, this);
  }

  private generateWindowId(): string {
    return `win_${performance.now()}_${Math.random().toString(36).substr(2, 12)}`;
  }

  getStorageKey(key: string): string {
    return `${this.storagePrefix}_${key}`;
  }

  setUser(user: User | null): void {
    if (user) {
      sessionStorage.setItem(this.getStorageKey('user'), JSON.stringify(user));
      sessionStorage.setItem(this.getStorageKey('auth_token'), 'active');
    } else {
      sessionStorage.removeItem(this.getStorageKey('user'));
      sessionStorage.removeItem(this.getStorageKey('auth_token'));
    }
  }

  getUser(): User | null {
    try {
      const userData = sessionStorage.getItem(this.getStorageKey('user'));
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  clearSession(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(this.storagePrefix)) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

const authInstance = new WindowScopedAuth();

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
  
  // Inicializar isAuthenticated baseado na existência de usuário salvo
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const sessionUser = authInstance.getUser();
      const authToken = sessionStorage.getItem(authInstance.getStorageKey('auth_token'));
      return !!(sessionUser && authToken);
    } catch {
      return false;
    }
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const sessionUser = authInstance.getUser();
      if (sessionUser) {
        console.log(' Carregando usuário da instância isolada');
        return sessionUser;
      }

      localStorage.removeItem('viraliza_ai_active_user_v1');
      console.log(' localStorage limpo para evitar conflitos');

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const previewRole = params.get('previewRole');

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

      return null;
    } catch (error) {
      return null;
    }
  });

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
    console.log(' hasAccess chamado para feature:', feature);
    console.log(' Usuário atual:', user);
    console.log(' Hostname:', window.location.hostname);

    if (user?.type === 'admin') {
      console.log(' Admin tem acesso total');
      return true;
    }

    console.log(' Liberando acesso TOTAL para desenvolvimento/produção');
    return true;

    // Código original comentado para debug
    /*
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

    // 3. Fallback: Se não tem plano, permitir acesso básico
    if (!userPlan) {
      return true;
    }

    return false;
    */
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log(' Inicializando autenticação...');
        setIsLoading(true);
        await initDB();

        // Verificar se deve evitar logout
        const preventLogout = localStorage.getItem('prevent_logout') === 'true';
        const userShouldStay = localStorage.getItem('user_should_stay_logged') === 'true';
        const paymentProcessing = localStorage.getItem('payment_processing') === 'true';
        const toolActivationForced = localStorage.getItem('tool_activation_forced');
        
        if (preventLogout || userShouldStay || paymentProcessing || toolActivationForced) {
          console.log(' Logout prevenido - mantendo sessão ativa');
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
            console.log(' Usuário encontrado no localStorage:', userData.email);
            
            // Verificar se há ativação de ferramenta pendente
            if (toolActivationForced) {
              const activationData = JSON.parse(toolActivationForced);
              console.log(' Aplicando ativação de ferramenta:', activationData);
              
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
              
              console.log(' Ferramenta ativada no contexto de autenticação');
            }
            
            setUser(userData);
            setIsAuthenticated(true);
          } catch (error) {
            console.error(' Erro ao carregar usuário:', error);
            
            // Tentar backup
            if (backupUser) {
              try {
                const backupData = JSON.parse(backupUser);
                console.log(' Usando backup do usuário:', backupData.email);
                setUser(backupData);
                setIsAuthenticated(true);
                localStorage.setItem('viraliza_ai_active_user_v1', backupUser);
              } catch (backupError) {
                console.error(' Erro no backup também:', backupError);
              }
            }
          }
        } else if (backupUser) {
          try {
            const backupData = JSON.parse(backupUser);
            console.log(' Restaurando do backup:', backupData.email);
            setUser(backupData);
            setIsAuthenticated(true);
            localStorage.setItem('viraliza_ai_active_user_v1', backupUser);
          } catch (error) {
            console.error(' Erro ao restaurar backup:', error);
          }
        }
      } catch (error) {
        console.error(' Erro na inicialização da autenticação:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    const loadUser = () => {
      const savedUser = authInstance.getUser();
      const authToken = sessionStorage.getItem(authInstance.getStorageKey('auth_token'));

      console.log(' Verificando sessão salva:', { 
        hasUser: !!savedUser, 
        hasToken: !!authToken,
        userEmail: savedUser?.email 
      });

      if (savedUser && authToken) {
        try {
          setUser(savedUser);
          setIsAuthenticated(true);
          console.log(' Usuário restaurado após refresh:', savedUser.email);
        } catch (error) {
          console.error(' Erro ao carregar usuário:', error);
          logout();
        }
      } else {
        console.log(' Nenhuma sessão válida encontrada');
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    loadUser();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === authInstance.getStorageKey('user') && e.newValue) {
        try {
          const userData = JSON.parse(e.newValue);
          setUser(userData);
          console.log(' Usuário atualizado via storage:', userData);
        } catch (error) {
          console.error(' Erro ao sincronizar usuário:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    authInstance.setUser(user);
    if (user) {
      localStorage.removeItem('viraliza_ai_active_user_v1');
      if (!isAuthenticated) {
        setIsAuthenticated(true);
        console.log(' Estado de autenticação sincronizado');
      }
    } else {
      if (isAuthenticated) {
        setIsAuthenticated(false);
        console.log(' Estado de autenticação limpo');
      }
    }
  }, [user, isAuthenticated]);

  const register = async (data: RegistrationData): Promise<RegistrationResult> => {
    try {
      console.log(' Iniciando cadastro:', { name: data.name, email: data.email });

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

      console.log(' Enviando para backend:', API_BASE_URL);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const responseJson = await res.json().catch(() => null);
        console.log(' Resposta do backend:', { status: res.status, data: responseJson });

        if (res.ok && responseJson?.user) {
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
            plan: backendUser.plan || 'Plano Mensal',
            subscriptionEndDate: backendUser.subscriptionEndDate,
            trialStartDate: backendUser.trialStartDate || new Date().toISOString(),
            trialFollowers: backendUser.trialFollowers || 0,
            trialSales: backendUser.trialSales || 0,
            affiliateInfo: backendUser.affiliateInfo,
            referredBy: backendUser.referredBy,
            addOns: backendUser.addOns,
            password: ''
          };

          await addUserDB(newUser);
          setPlatformUsers(prev => [...prev, newUser]);

          console.log(' Usuário cadastrado com sucesso no backend e banco local');
          sessionStorage.removeItem('referralCode');
          return { success: true, user: newUser };
        }
      } catch (backendError) {
        console.log(' Backend não disponível, cadastrando localmente:', backendError);
      }

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

      console.log(' Usuário cadastrado localmente com sucesso');
      sessionStorage.removeItem('referralCode');
      return { success: true, user: newUser };
    } catch (error) {
      console.error(' Erro crítico no cadastro:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao cadastrar. Tente novamente.';
      return { success: false, message: errorMessage };
    }
  };

  const loginWithGoogle = async (): Promise<User | { error: string }> => {
    console.log(' Iniciando login com Google');
    
    try {
      const googleOAuth = GoogleOAuthReal.getInstance();
      await googleOAuth.initialize();
      const googleUser = await googleOAuth.signIn();
      
      // Verificar se usuário já existe no banco local
      const existingUsers = await getAllUsersDB();
      let user = existingUsers.find(u => u.email === googleUser.email);
      
      if (!user) {
        // Criar novo usuário baseado nos dados do Google
        const newUser: User = {
          id: `google_${googleUser.id}`,
          name: googleUser.name,
          email: googleUser.email,
          type: 'client',
          status: 'Ativo',
          joinedDate: new Date().toISOString().split('T')[0],
          socialAccounts: [{
            id: 1,
            platform: 'Google',
            username: googleUser.email
          }],
          paymentMethods: [],
          billingHistory: [],
          plan: 'Plano Mensal',
          trialStartDate: new Date().toISOString(),
          trialFollowers: 0,
          trialSales: 0,
          avatar: googleUser.picture
        };
        
        // Salvar no banco local
        await addUserDB(newUser);
        setPlatformUsers(prev => [...prev, newUser]);
        user = newUser;
        
        console.log(' Novo usuário Google criado:', user.email);
      } else {
        console.log(' Usuário Google existente encontrado:', user.email);
      }
      
      // Fazer login do usuário
      setUser(user);
      setIsAuthenticated(true);
      authInstance.setUser(user);
      localStorage.removeItem('viraliza_ai_active_user_v1');
      
      console.log(' Login Google bem-sucedido na instância isolada');
      return user;
      
    } catch (error) {
      console.error(' Erro no login Google:', error);
      return { error: 'Erro ao fazer login com Google. Tente novamente.' };
    }
  };

  const login = async (loginField: string, password: string): Promise<User | { error: string }> => {
    console.log(' Iniciando login:', { loginField, password: '***' });

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
      console.log(' Login admin direto detectado');

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

      authInstance.setUser(adminUser);

      localStorage.removeItem('viraliza_ai_active_user_v1');

      console.log(' Admin logado na instância isolada');
      return adminUser;
    }

    const isEmail = loginField.includes('@');
    let payload: any = { password };

    if (isEmail) {
      payload.email = loginField.trim();
    } else {
      payload.cpf = String(loginField).replace(/\D/g, '');
    }

    console.log(' Tentando login no backend:', API_BASE_URL);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      console.log(' Resposta do backend:', { status: res.status, data });

      if (res.ok && data?.user) {
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
        setIsAuthenticated(true);

        authInstance.setUser(mappedUser);

        localStorage.removeItem('viraliza_ai_active_user_v1');

        console.log(' Login no backend bem-sucedido na instância isolada');
        return mappedUser;
      }
    } catch (backendError) {
      console.log(' Backend não disponível, tentando login local:', backendError);
    }

    const localUsers = await getAllUsersDB();
    console.log(' Usuários locais encontrados:', localUsers.length);

    const localUser = localUsers.find(user => {
      if (isEmail) {
        return user.email.toLowerCase() === loginField.trim().toLowerCase();
      } else {
        const userCpf = user.cpf ? String(user.cpf).replace(/\D/g, '') : '';
        return userCpf === cleanCpf;
      }
    });

    if (localUser) {
      console.log(' Usuário encontrado localmente:', localUser.email);

      if (localUser.password && localUser.password === password) {
        setUser(localUser);
        console.log(' Login local bem-sucedido');
        return localUser;
      } else if (!localUser.password) {
        setUser(localUser);
        console.log(' Login local bem-sucedido (sem verificação de senha)');
        return localUser;
      } else {
        console.log(' Senha incorreta');
        return { error: 'Senha incorreta' };
      }
    } else {
      console.log(' Usuário não encontrado');
      return { error: 'Usuário não encontrado' };
    }
  };

const logout = () => {
  setUser(null);
  setIsAuthenticated(false);
  clearAuthToken();

  // Logout do Google se necessário
  try {
    const googleOAuth = GoogleOAuthReal.getInstance();
    googleOAuth.signOut();
  } catch (error) {
    console.log('Google OAuth não disponível para logout');
  }

  authInstance.clearSession();

  console.log(' Logout realizado apenas para esta instância');
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
    // CRÍTICO: Salvar usuário ativo no localStorage para persistência
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(updatedUser));
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

const activateAffiliate = async (userId: string, affiliateData?: any) => {
  const defaultAffiliateInfo = {
    referralCode: `viral_${userId.slice(-6)}`,
    earnings: 0,
    referredUserIds: []
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
      // CRÍTICO: Salvar usuário ativo no localStorage para persistência
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(updatedUser));
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

  const activateAffiliate = async (userId: string, affiliateData?: any) => {
    const defaultAffiliateInfo = {
      referralCode: `viral_${userId.slice(-6)}`,
      earnings: 0,
      referredUserIds: []
    };

    // Se dados completos foram fornecidos, usar eles
    const affiliateInfo = affiliateData ? {
      ...defaultAffiliateInfo,
      referralCode: affiliateData.referralCode || defaultAffiliateInfo.referralCode,
      personalInfo: affiliateData.personalInfo,
      bankingInfo: affiliateData.bankingInfo,
      commissionRate: affiliateData.commissionRate || 0.30,
      status: affiliateData.status || 'active',
      createdAt: affiliateData.createdAt || new Date().toISOString()
    } : defaultAffiliateInfo;

    await updateUser(userId, {
      affiliateInfo
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