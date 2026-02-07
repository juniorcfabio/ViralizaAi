// SERVIÇO DE CHECKOUT DIRETO COM SUPABASE
// Funciona sem Edge Functions, integrando diretamente com o banco

import { supabase, initializeAnonymousSession } from '../lib/supabase';
import { loadStripe } from '@stripe/stripe-js';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_live_51RbXyNH6btTxgDogkRcYNr8SyOg4KzGPG0TJQb7zU8TsI';

export interface CheckoutData {
  planId: string;
  planName: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  userEmail?: string;
  userName?: string;
}

export class CheckoutService {
  private stripe: any = null;

  async initialize() {
    if (!this.stripe) {
      this.stripe = await loadStripe(STRIPE_PUBLIC_KEY);
    }
    return this.stripe;
  }

  async createCheckoutSession(checkoutData: CheckoutData) {
    try {
      console.log('🚀 Iniciando checkout direto via API...');
      
      // Criar sessão Stripe diretamente via API do Vercel (sem dependência do Supabase)
      const stripeSession = await this.createStripeSession(checkoutData, null);
      
      console.log('✅ Checkout criado com sucesso:', stripeSession.id);
      
      // Redirecionar para Stripe
      window.location.href = stripeSession.url;
      
    } catch (error) {
      console.error('❌ Erro no checkout:', error);
      throw error;
    }
  }

  private async ensurePlanExists(checkoutData: CheckoutData) {
    // Verificar se plano existe
    let { data: plan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('name', checkoutData.planName)
      .single();

    if (error || !plan) {
      console.log('📋 Criando plano no banco:', checkoutData.planName);
      
      // Criar plano se não existir
      const { data: newPlan, error: createError } = await supabase
        .from('plans')
        .insert({
          name: checkoutData.planName,
          price_monthly: checkoutData.billingCycle === 'monthly' ? checkoutData.amount / 100 : null,
          price_yearly: checkoutData.billingCycle === 'yearly' ? checkoutData.amount / 100 : null,
          features: ['Acesso completo', 'Suporte 24h', 'Ferramentas IA'],
          is_active: true,
          stripe_price_id: `price_${checkoutData.planId}_${checkoutData.billingCycle}`,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar plano:', createError);
        throw new Error('Erro ao criar plano no banco de dados');
      }

      plan = newPlan;
    }

    return plan;
  }

  private async createCheckoutRecord(userId: string, planId: string, checkoutData: CheckoutData) {
    const { data, error } = await supabase
      .from('checkout_sessions')
      .insert({
        user_id: userId,
        plan_id: planId,
        amount: checkoutData.amount,
        currency: 'brl',
        billing_interval: checkoutData.billingCycle,
        status: 'pending',
        metadata: {
          source: 'landing_page',
          plan_name: checkoutData.planName,
          user_email: checkoutData.userEmail || 'anonymous@viralizaai.com'
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar registro de checkout:', error);
      throw new Error('Erro ao registrar checkout no banco');
    }

    return data;
  }

  private async createStripeSession(checkoutData: CheckoutData, checkoutId: string | null) {
    // Usar API do Vercel para criar sessão Stripe
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planName: checkoutData.planName,
        amount: checkoutData.amount,
        billingCycle: checkoutData.billingCycle,
        checkoutId: checkoutId || 'direct-checkout',
        successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/cancel`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API de checkout:', errorText);
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const session = await response.json();
    return session;
  }

  private async updateCheckoutRecord(checkoutId: string, stripeSessionId: string) {
    const { error } = await supabase
      .from('checkout_sessions')
      .update({
        stripe_session_id: stripeSessionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', checkoutId);

    if (error) {
      console.warn('⚠️ Erro ao atualizar registro de checkout:', error);
    }
  }
}

// Instância singleton
export const checkoutService = new CheckoutService();

// Função de conveniência para compatibilidade
export const processSubscriptionPayment = async (subscriptionData: any): Promise<void> => {
  console.log('🔄 Processando pagamento via CheckoutService...');
  
  const checkoutData: CheckoutData = {
    planId: subscriptionData.planId || 'basic',
    planName: subscriptionData.line_items[0].price_data.product_data.name,
    amount: subscriptionData.line_items[0].price_data.unit_amount,
    billingCycle: subscriptionData.billingCycle || 'monthly',
    userEmail: 'usuario@viralizaai.com',
    userName: 'Usuário ViralizaAI'
  };

  await checkoutService.createCheckoutSession(checkoutData);
};

export default checkoutService;
