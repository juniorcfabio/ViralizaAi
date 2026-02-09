// SERVIÇO STRIPE CORRIGIDO - VIRALIZAAI
// Corrige erros: ji.getInstance, signInWithPassword, SDK incompatível

import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';
import { useState } from 'react';

// Chave pública do Stripe (ambiente)
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 
  'pk_live_51RbXyNH6btTxgDogkRcYNr8SyOg4KzGPG0TJQb7zU8TsI';

class StripeService {
  private stripe: Stripe | null = null;
  private isInitialized = false;

  // ==================== INICIALIZAÇÃO SEGURA ====================
  
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized && this.stripe) {
        return true;
      }

      console.log('🔄 Inicializando Stripe SDK...');
      
      // Carregar Stripe de forma segura
      this.stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
      
      if (!this.stripe) {
        console.error('❌ Falha ao carregar Stripe SDK');
        return false;
      }

      this.isInitialized = true;
      console.log('✅ Stripe SDK inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar Stripe:', error);
      return false;
    }
  }

  // ==================== CHECKOUT PÚBLICO (LANDING PAGE) ====================
  
  async createPublicCheckout(planData: any): Promise<void> {
    try {
      console.log('🚀 Criando checkout público para:', planData);
      
      // Inicializar Stripe se necessário
      await this.initialize();
      
      if (!this.stripe) {
        throw new Error('Stripe não inicializado');
      }

      // Usar API funcional stripe-test
      const apiUrl = '/api/stripe-test';
      console.log('🔗 Chamando API funcional:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planName: planData.line_items[0].price_data.product_data.name,
          amount: planData.line_items[0].price_data.unit_amount,
          successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/cancel`
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.url) {
        console.log('✅ Redirecionando para Stripe Checkout');
        window.location.href = result.url;
      } else {
        throw new Error('URL de checkout não retornada');
      }
      
    } catch (error) {
      console.error('❌ Erro no checkout público:', error);
      throw error;
    }
  }

  // ==================== COMPATIBILIDADE RETROATIVA ====================
  
  /**
   * Método de compatibilidade para código legado.
   * Delega chamadas para createPublicCheckout.
   * @deprecated Use createPublicCheckout diretamente
   */
  async processSubscriptionPayment(subscriptionData: any): Promise<void> {
    console.warn('⚠️ processSubscriptionPayment está deprecated. Use createPublicCheckout.');
    return this.createPublicCheckout(subscriptionData);
  }

  // ==================== CHECKOUT AUTENTICADO ====================
  
  async createCheckoutSession(planId: string, billingInterval: 'monthly' | 'yearly' = 'monthly', referralCode?: string): Promise<{ url: string; sessionId: string } | null> {
    try {
      // Verificar autenticação ANTES de criar checkout
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Usuário não autenticado:', authError);
        throw new Error('Usuário deve estar logado para fazer checkout');
      }

      console.log('✅ Usuário autenticado:', user.id);

      // Buscar dados do usuário
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        console.error('❌ Perfil do usuário não encontrado:', profileError);
        throw new Error('Perfil do usuário não encontrado');
      }

      // Buscar plano
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !plan) {
        console.error('❌ Plano não encontrado:', planError);
        throw new Error('Plano não encontrado');
      }

      console.log('📋 Criando checkout para plano:', plan.name);

      // Chamar Edge Function de checkout
      const { data, error } = await supabase.functions.invoke('checkout', {
        body: {
          planId,
          userId: user.id,
          billingInterval,
          referralCode,
          userEmail: userProfile.email,
          userName: userProfile.name
        }
      });

      if (error) {
        console.error('❌ Erro na Edge Function checkout:', error);
        throw error;
      }

      if (!data || !data.url) {
        console.error('❌ Resposta inválida da Edge Function:', data);
        throw new Error('Falha ao criar sessão de checkout');
      }

      console.log('✅ Checkout criado com sucesso:', data.sessionId);

      // Log da atividade
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'checkout_session_created',
        details: {
          plan_id: planId,
          plan_name: plan.name,
          billing_interval: billingInterval,
          session_id: data.sessionId,
          referral_code: referralCode || null
        },
        resource_type: 'payment'
      });

      return {
        url: data.url,
        sessionId: data.sessionId
      };

    } catch (error) {
      console.error('❌ Erro ao criar checkout:', error);
      
      // Log do erro
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('activity_logs').insert({
            user_id: user.id,
            action: 'checkout_error',
            details: {
              error: error.message,
              plan_id: planId,
              billing_interval: billingInterval
            },
            resource_type: 'payment'
          });
        }
      } catch (logError) {
        console.error('❌ Erro ao registrar log:', logError);
      }

      return null;
    }
  }

  // ==================== REDIRECIONAMENTO SEGURO ====================
  
  async redirectToCheckout(sessionId: string): Promise<boolean> {
    try {
      if (!this.stripe) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Stripe não inicializado');
        }
      }

      console.log('🔄 Redirecionando para checkout:', sessionId);

      const { error } = await this.stripe!.redirectToCheckout({
        sessionId: sessionId
      });

      if (error) {
        console.error('❌ Erro no redirecionamento:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao redirecionar para checkout:', error);
      return false;
    }
  }

  // ==================== VALIDAÇÃO DE SESSÃO ====================
  
  async validateCheckoutSession(sessionId: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('validate-checkout', {
        body: { sessionId }
      });

      if (error) {
        console.error('❌ Erro ao validar sessão:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao validar checkout:', error);
      return null;
    }
  }

  // ==================== UTILITÁRIOS ====================
  
  async getPublicKey(): Promise<string> {
    return STRIPE_PUBLISHABLE_KEY;
  }

  isReady(): boolean {
    return this.isInitialized && this.stripe !== null;
  }

  // ==================== TRATAMENTO DE ERROS ESPECÍFICOS ====================
  
  private handleStripeError(error: any): string {
    switch (error.type) {
      case 'card_error':
        return `Erro no cartão: ${error.message}`;
      case 'validation_error':
        return `Dados inválidos: ${error.message}`;
      case 'authentication_error':
        return 'Erro de autenticação com Stripe';
      case 'api_connection_error':
        return 'Erro de conexão. Tente novamente.';
      case 'api_error':
        return 'Erro interno do Stripe. Tente novamente.';
      case 'rate_limit_error':
        return 'Muitas tentativas. Aguarde um momento.';
      default:
        return error.message || 'Erro desconhecido no pagamento';
    }
  }
}

// Instância singleton
export const stripeService = new StripeService();

// Garantir que o método de compatibilidade está disponível na instância
(stripeService as any).processSubscriptionPayment = stripeService.processSubscriptionPayment.bind(stripeService);

// Função standalone para máxima compatibilidade
export const processSubscriptionPayment = async (subscriptionData: any): Promise<void> => {
  console.warn('⚠️ processSubscriptionPayment (standalone) está deprecated. Use createPublicCheckout.');
  return stripeService.createPublicCheckout(subscriptionData);
};

// Hook React para usar o Stripe
export const useStripe = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckout = async (
    planId: string, 
    billingInterval: 'monthly' | 'yearly' = 'monthly',
    referralCode?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await stripeService.createCheckoutSession(planId, billingInterval, referralCode);
      
      if (!result) {
        throw new Error('Falha ao criar sessão de checkout');
      }

      // Redirecionar automaticamente
      window.location.href = result.url;
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao processar pagamento';
      setError(errorMessage);
      console.error('❌ Erro no checkout:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createCheckout,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};

// Exportar para compatibilidade
export default stripeService;
