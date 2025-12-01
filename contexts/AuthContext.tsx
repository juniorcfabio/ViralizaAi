
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, Plan, BillingRecord, FeatureKey } from '../types';
import { initDB, getAllUsersDB, addUserDB, updateUserDB, deleteUsersDB, verifyCredentialsDB } from '../services/dbService';

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
    login: (email: string, password: string) => Promise<User | null>;
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
    'Plano Semestral': ['conversionRadar', 'audioDetector', 'competitorSpy', 'analytics', 'affiliate', 'advancedGrowth'],
    'Semiannual Plan': ['conversionRadar', 'audioDetector', 'competitorSpy', 'analytics', 'affiliate', 'advancedGrowth'],
    'Plano Anual': ['conversionRadar', 'audioDetector', 'competitorSpy', 'trendPredictor', 'analytics', 'affiliate', 'autopilot', 'advancedGrowth', 'viralPrediction'],
    'Annual Plan': ['conversionRadar', 'audioDetector', 'competitorSpy', 'trendPredictor', 'analytics', 'affiliate', 'autopilot', 'advancedGrowth', 'viralPrediction'],
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [platformUsers, setPlatformUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [user, setUser] = useState<User | null>(() => {
        try {
            const storedUser = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            return null;
        }
    });

    const isSubscriptionActive = (): boolean => {
        if (!user) return false;
        if (user.type === 'admin') return true;
        
        if (user.plan && user.subscriptionEndDate) {
            const now = new Date();
            const end = new Date(user.subscriptionEndDate);
            return now < end;
        }
        
        if (!user.plan && user.trialStartDate) {
            const trialStart = new Date(user.trialStartDate);
            const trialDuration = 24 * 60 * 60 * 1000;
            return (new Date().getTime() - trialStart.getTime()) < trialDuration;
        }
        
        return false;
    };
    
    const hasAccess = (feature: FeatureKey): boolean => {
        if (user?.type === 'admin') return true;
        
        // 1. Check Plan Features
        const userPlan = user?.plan || '';
        let planKey = Object.keys(PLAN_FEATURES).find(k => k === userPlan);
        if (!planKey) {
            planKey = Object.keys(PLAN_FEATURES).find(k => userPlan.includes(k) || k.includes(userPlan));
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
                await initDB(); // This now handles auto-restore from localstorage
                const users = await getAllUsersDB();
                setPlatformUsers(users);
                
                if (user) {
                    // Re-verify user existence against the loaded data
                    const freshUser = users.find(u => u.id === user.id);
                    if (freshUser) {
                        setUser(freshUser);
                        localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(freshUser));
                    }
                }
            } catch (error) {
                console.error("Falha crítica ao carregar DB:", error);
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
        // Query DB directly for existence to avoid state staleness
        const freshUsers = await getAllUsersDB();
        const emailToCheck = data.email.trim().toLowerCase();
        
        if (freshUsers.some(u => u.email.trim().toLowerCase() === emailToCheck)) {
            return { success: false, message: 'Este e-mail já está cadastrado.' };
        }

        const referralCode = sessionStorage.getItem('referralCode');

        const newUser: User = {
            ...data,
            email: emailToCheck,
            password: data.password, 
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'client',
            status: 'Ativo',
            joinedDate: new Date().toISOString().split('T')[0],
            trialStartDate: new Date().toISOString(),
            socialAccounts: [],
            paymentMethods: [],
            billingHistory: [],
            plan: undefined,
            trialFollowers: 0,
            trialSales: 0,
            referredBy: referralCode || undefined,
        };
        
        // This saves to IndexedDB AND LocalStorage immediately
        await addUserDB(newUser);
        
        setPlatformUsers(prev => [...prev, newUser]);
        setUser(newUser);
        sessionStorage.removeItem('referralCode');
        
        return { success: true, user: newUser };
    };
    
    const addUser = async (data: AdminUserData): Promise<User | null> => {
        const emailToCheck = data.email.trim().toLowerCase();
        
        if (platformUsers.find(u => u.email.trim().toLowerCase() === emailToCheck)) {
            return null;
        }

        const newUser: User = {
            ...data,
            email: emailToCheck,
            id: `user_${Date.now()}`,
            type: 'client',
            joinedDate: new Date().toISOString().split('T')[0],
        };
        
        await addUserDB(newUser);
        setPlatformUsers(prev => [...prev, newUser]);
        return newUser;
    };

    const updateUser = async (userId: string, data: Partial<User>) => {
        const users = await getAllUsersDB();
        const userToUpdate = users.find(u => u.id === userId);
        
        if (!userToUpdate) return;
        
        const updatedUser = { ...userToUpdate, ...data };
        
        await updateUserDB(updatedUser);
        
        setPlatformUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        
        if (user && user.id === userId) {
            setUser(updatedUser);
        }
    };

    const deleteUsers = async (userIds: string[]) => {
        await deleteUsersDB(userIds);
        setPlatformUsers(prev => prev.filter(u => !userIds.includes(u.id)));
        
        if (user && userIds.includes(user.id)) {
            setUser(null);
        }
    };

    const login = async (email: string, password: string): Promise<User | null> => {
        const cleanEmail = email.trim().toLowerCase();
        
        // CRITICAL FIX: Don't rely on 'platformUsers' state which might be empty on reload.
        // Query the DB (and Backup) directly.
        const foundUser = await verifyCredentialsDB(cleanEmail, password);
        
        if (foundUser) {
            setUser(foundUser);
            return foundUser;
        }
        
        return null;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
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
        await new Promise(resolve => setTimeout(resolve, 1500));

        const users = await getAllUsersDB();
        const userToUpdate = users.find(u => u.id === userId);
        
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
        if (planName.includes('mensal') || planName.includes('monthly')) endDate.setMonth(endDate.getMonth() + 1);
        else if (planName.includes('trimestral') || planName.includes('quarterly')) endDate.setMonth(endDate.getMonth() + 3);
        else if (planName.includes('semestral') || planName.includes('semiannual')) endDate.setMonth(endDate.getMonth() + 6);
        else if (planName.includes('anual') || planName.includes('annual')) endDate.setFullYear(endDate.getFullYear() + 1);
        else endDate.setMonth(endDate.getMonth() + 1); // Default

        await updateUser(userId, {
            plan: plan.name,
            subscriptionEndDate: endDate.toISOString(),
            billingHistory: [...(userToUpdate.billingHistory || []), newBillingRecord]
        });

        // Handle Affiliate Commission
        if (userToUpdate.referredBy) {
            const affiliate = users.find(u => u.affiliateInfo?.referralCode === userToUpdate.referredBy);
            
            if (affiliate && affiliate.affiliateInfo) {
                const commissionRate = parseFloat(localStorage.getItem('viraliza_affiliate_commission_rate') || '20') / 100;
                const planPrice = typeof plan.price === 'string' ? parseFloat(plan.price.replace(',', '.')) : plan.price;
                const commission = planPrice * commissionRate;

                await updateUser(affiliate.id, {
                    affiliateInfo: {
                        ...affiliate.affiliateInfo,
                        earnings: (affiliate.affiliateInfo.earnings || 0) + commission,
                        referredUserIds: [...(new Set([...(affiliate.affiliateInfo.referredUserIds || []), userId]))]
                    }
                });
            }
        }
        
        return true;
    };

    const purchaseAddOn = async (userId: string, feature: FeatureKey, price: number): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const users = await getAllUsersDB();
        const userToUpdate = users.find(u => u.id === userId);
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
    }

    return (
        <AuthContext.Provider value={{ isLoading, user, platformUsers, login, register, logout, addUser, updateUser, deleteUsers, activateAffiliate, subscribeUserToPlan, purchaseAddOn, isSubscriptionActive, hasAccess }}>
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
