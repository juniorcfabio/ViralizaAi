// SISTEMA COMERCIAL COMPLETO - VIRALIZAAI
import { supabase } from '../lib/supabase';

export interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_active: boolean;
  stripe_price_id_monthly: string;
  stripe_price_id_yearly: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_subscription_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export interface Affiliate {
  id: string;
  user_id: string;
  referral_code: string;
  commission_rate: number;
  total_earnings: number;
  total_referrals: number;
  is_active: boolean;
}

class CommercialSystemService {
  
  // ==================== PLANOS ====================
  
  async getPlans(): Promise<Plan[]> {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar planos:', error);
      return [];
    }
  }

  async getPlanById(planId: string): Promise<Plan | null> {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar plano:', error);
      return null;
    }
  }

  // ==================== CHECKOUT ====================
  
  async createCheckoutSession(
    planId: string, 
    billingInterval: 'monthly' | 'yearly' = 'monthly',
    referralCode?: string
  ): Promise<{ url: string; sessionId: string } | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const response = await supabase.functions.invoke('checkout', {
        body: {
          planId,
          userId: user.user.id,
          billingInterval,
          referralCode
        }
      });

      if (response.error) throw response.error;
      
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar checkout:', error);
      return null;
    }
  }

  // ==================== ASSINATURAS ====================
  
  async getUserSubscription(): Promise<Subscription | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plans (
            name,
            description,
            features
          )
        `)
        .eq('user_id', user.user.id)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar assinatura:', error);
      return null;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;
      
      // Log da atividade
      await this.logActivity('subscription_cancel_requested', {
        subscription_id: subscriptionId
      });

      return true;
    } catch (error) {
      console.error('❌ Erro ao cancelar assinatura:', error);
      return false;
    }
  }

  // ==================== SISTEMA DE AFILIADOS ====================
  
  async createAffiliate(): Promise<Affiliate | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      // Gerar código único
      const referralCode = this.generateReferralCode();

      const { data, error } = await supabase
        .from('affiliates')
        .insert({
          user_id: user.user.id,
          referral_code: referralCode,
          commission_rate: 10.00, // 10% padrão
          total_earnings: 0,
          total_referrals: 0,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      await this.logActivity('affiliate_created', {
        referral_code: referralCode
      });

      return data;
    } catch (error) {
      console.error('❌ Erro ao criar afiliado:', error);
      return null;
    }
  }

  async getAffiliateData(): Promise<Affiliate | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar dados do afiliado:', error);
      return null;
    }
  }

  async getAffiliateReferrals(): Promise<any[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          user_profiles!referred_user_id (
            name,
            email
          ),
          subscriptions (
            status,
            current_period_start,
            current_period_end
          )
        `)
        .eq('affiliates.user_id', user.user.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar referências:', error);
      return [];
    }
  }

  // ==================== ANALYTICS ====================
  
  async getSubscriptionAnalytics(): Promise<any> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      // Verificar se é admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.user.id)
        .single();

      if (profile?.user_type !== 'admin') {
        throw new Error('Acesso negado');
      }

      // Buscar métricas
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plans (name, price_monthly, price_yearly)
        `);

      if (error) throw error;

      // Calcular métricas
      const activeSubscriptions = subscriptions?.filter(s => s.status === 'active') || [];
      const totalRevenue = activeSubscriptions.reduce((sum, sub) => {
        const plan = sub.plans;
        return sum + (plan?.price_monthly || 0);
      }, 0);

      const churnRate = subscriptions?.filter(s => s.status === 'canceled').length || 0;

      return {
        totalSubscriptions: subscriptions?.length || 0,
        activeSubscriptions: activeSubscriptions.length,
        totalRevenue,
        churnRate: (churnRate / (subscriptions?.length || 1)) * 100,
        subscriptionsByPlan: this.groupSubscriptionsByPlan(activeSubscriptions)
      };
    } catch (error) {
      console.error('❌ Erro ao buscar analytics:', error);
      return null;
    }
  }

  // ==================== UTILITÁRIOS ====================
  
  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private groupSubscriptionsByPlan(subscriptions: any[]): Record<string, number> {
    return subscriptions.reduce((acc, sub) => {
      const planName = sub.plans?.name || 'Unknown';
      acc[planName] = (acc[planName] || 0) + 1;
      return acc;
    }, {});
  }

  private async logActivity(action: string, details: any): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase.from('activity_logs').insert({
        user_id: user.user.id,
        action,
        details,
        resource_type: 'commercial'
      });
    } catch (error) {
      console.error('❌ Erro ao registrar atividade:', error);
    }
  }

  // ==================== VALIDAÇÕES ====================
  
  async validateReferralCode(code: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('id')
        .eq('referral_code', code)
        .eq('is_active', true)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  async hasActiveSubscription(): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription();
      return !!subscription && subscription.status === 'active';
    } catch (error) {
      return false;
    }
  }

  async canAccessFeature(feature: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription();
      if (!subscription) return false;

      const plan = await this.getPlanById(subscription.plan_id);
      if (!plan) return false;

      return plan.features.includes(feature);
    } catch (error) {
      return false;
    }
  }
}

export const commercialSystem = new CommercialSystemService();
