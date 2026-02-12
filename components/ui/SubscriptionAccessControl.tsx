import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import StripeService from '../../services/stripeService';
import { SUBSCRIPTION_PLANS } from '../../data/plansConfig';

interface SubscriptionAccessControlProps {
  children: React.ReactNode;
  requiredPlan?: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  toolName?: string;
  toolPrice?: number;
  allowTrial?: boolean;
  trialDuration?: number; // em horas
}

const SubscriptionAccessControl: React.FC<SubscriptionAccessControlProps> = ({
  children,
  requiredPlan,
  toolName,
  toolPrice,
  allowTrial = false,
  trialDuration = 24
}) => {
  const { user, updateUser } = useAuth();

  const hasValidSubscription = () => {
    if (!user?.subscription) return false;
    
    const now = new Date();
    const expiryDate = new Date(user.subscription.expiryDate);
    
    return user.subscription.isActive && expiryDate > now;
  };

  const hasTrialAccess = () => {
    if (!allowTrial || !user) return false;
    
    const trialKey = `trial_${toolName || 'subscription'}_${user.id}`;
    const trialData = localStorage.getItem(trialKey);
    
    if (!trialData) return true; // Primeira vez, pode iniciar trial
    
    const trial = JSON.parse(trialData);
    const trialStart = new Date(trial.startDate);
    const trialEnd = new Date(trialStart.getTime() + (trialDuration * 60 * 60 * 1000));
    
    return new Date() < trialEnd;
  };

  const startTrial = () => {
    if (!user) return;
    
    const trialKey = `trial_${toolName || 'subscription'}_${user.id}`;
    const trialData = {
      startDate: new Date().toISOString(),
      duration: trialDuration,
      toolName: toolName || 'subscription'
    };
    
    localStorage.setItem(trialKey, JSON.stringify(trialData));
    // SYNC COM SUPABASE
    import('../../src/lib/supabase').then(({ supabase }) => {
      supabase.from('user_data').upsert({ user_id: trialKey, data: trialData, updated_at: new Date().toISOString() }).then(() => {});
    });
    
    // Atualizar usuário com informação de trial
    const updatedUser = {
      ...user,
      trialInfo: {
        ...user.trialInfo,
        [toolName || 'subscription']: trialData
      }
    };
    
    updateUser(updatedUser);
  };

  const purchaseSubscription = async (planType: string) => {
    try {
      const stripeService = StripeService.getInstance();
      
      // Usar planos dinâmicos do plansConfig
      const planMap: { [key: string]: any } = {};
      SUBSCRIPTION_PLANS.forEach(p => {
        const key = p.name.toLowerCase().includes('mensal') ? 'monthly' :
                   p.name.toLowerCase().includes('trimestral') ? 'quarterly' :
                   p.name.toLowerCase().includes('semestral') ? 'semiannual' : 'annual';
        planMap[key] = { price: p.price, name: p.name };
      });
      
      const plan = planMap[planType];
      
      const subscriptionData = {
        amount: plan.price,
        currency: 'BRL',
        description: `${plan.name} - ViralizaAI`,
        productId: `plan_${planType}`,
        productType: 'subscription' as const,
        userId: user?.id || 'guest_' + Date.now(),
        userEmail: user?.email || 'usuario@exemplo.com',
        successUrl: `${window.location.origin}/dashboard?payment=success`,
        cancelUrl: `${window.location.origin}/dashboard?payment=cancelled`,
        planId: `plan_${planType}`,
        planName: plan.name,
        billingCycle: planType as 'monthly' | 'quarterly' | 'semiannual' | 'annual',
        metadata: {
          planType,
          features: 'Acesso completo a todas as ferramentas'
        }
      };
      
      await stripeService.processSubscriptionPayment(subscriptionData);
    } catch (error) {
      console.error('Erro ao processar assinatura:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    }
  };

  const purchaseTool = async () => {
    if (!toolName || !toolPrice) return;
    
    try {
      console.log('🛠️ Comprando ferramenta:', toolName, 'Preço:', toolPrice);
      
      // Usar a API funcional stripe-test
      const paymentData = {
        planName: `${toolName} - Ferramenta Avulsa ViralizaAI`,
        amount: Math.round(toolPrice * 100), // Converter para centavos
        successUrl: `${window.location.origin}/dashboard?payment=success&tool=${encodeURIComponent(toolName)}`,
        cancelUrl: `${window.location.origin}/dashboard?payment=cancelled`
      };

      console.log('📋 Dados do pagamento da ferramenta:', paymentData);
      
      const response = await fetch('/api/stripe-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success && result.url) {
        console.log('🔄 Redirecionando para Stripe:', result.url);
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar pagamento da ferramenta:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    }
  };

  const getRemainingTrialTime = () => {
    if (!user) return 0;
    
    const trialKey = `trial_${toolName || 'subscription'}_${user.id}`;
    const trialData = localStorage.getItem(trialKey);
    
    if (!trialData) return trialDuration;
    
    const trial = JSON.parse(trialData);
    const trialStart = new Date(trial.startDate);
    const trialEnd = new Date(trialStart.getTime() + (trialDuration * 60 * 60 * 1000));
    const now = new Date();
    
    const remainingMs = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.floor(remainingMs / (60 * 60 * 1000)));
  };

  // Verificar se tem acesso
  const hasAccess = hasValidSubscription() || hasTrialAccess();

  if (hasAccess) {
    return <>{children}</>;
  }

  // Tela de bloqueio
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-secondary rounded-xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-white mb-4">
            {toolName ? `Acesso Restrito - ${toolName}` : 'Assinatura Necessária'}
          </h1>
          <p className="text-gray-300 text-lg">
            {toolName 
              ? `Para usar ${toolName}, você precisa de uma assinatura ativa ou comprar a ferramenta avulsa.`
              : 'Para acessar este conteúdo, você precisa de uma assinatura ativa.'
            }
          </p>
        </div>

        {/* Trial disponível */}
        {allowTrial && hasTrialAccess() && (
          <div className="bg-blue-500/20 border border-blue-500/30 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-bold text-blue-400 mb-3">🎁 Degustação Gratuita Disponível</h3>
            <p className="text-gray-300 mb-4">
              Experimente gratuitamente por {trialDuration} horas antes de decidir!
            </p>
            <button
              onClick={startTrial}
              className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🚀 Iniciar Degustação ({trialDuration}h grátis)
            </button>
          </div>
        )}

        {/* Trial ativo */}
        {allowTrial && !hasTrialAccess() && getRemainingTrialTime() > 0 && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-3">⏰ Degustação Ativa</h3>
            <p className="text-gray-300">
              Tempo restante: <span className="font-bold text-yellow-400">{getRemainingTrialTime()} horas</span>
            </p>
          </div>
        )}

        {/* Opções de compra */}
        <div className="space-y-6">
          {/* Assinaturas */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">📅 Planos de Assinatura</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUBSCRIPTION_PLANS.slice(0, 2).map((plan, index) => {
                const planType = plan.name.toLowerCase().includes('mensal') ? 'monthly' : 'semiannual';
                const isRecommended = plan.name.toLowerCase().includes('semestral');
                return (
                  <div key={plan.id || index} className={`bg-primary/50 p-4 rounded-lg border ${isRecommended ? 'border-purple-500' : 'border-gray-600'}`}>
                    {isRecommended && (
                      <div className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full inline-block mb-2">
                        RECOMENDADO
                      </div>
                    )}
                    <h4 className="text-lg font-bold text-white mb-2">{plan.name}</h4>
                    <div className={`text-2xl font-bold mb-3 ${isRecommended ? 'text-purple-400' : 'text-green-400'}`}>
                      R$ {typeof plan.price === 'number' ? plan.price.toFixed(2) : plan.price}
                      {plan.period || (plan.name.toLowerCase().includes('mensal') ? '/mês' : '/6 meses')}
                    </div>
                    <ul className="text-sm text-gray-300 mb-4 space-y-1">
                      {(Array.isArray(plan.features) ? plan.features : [plan.features]).slice(0, 4).map((feature, i) => (
                        <li key={i}>• {feature}</li>
                      ))}
                    </ul>
                    <button
                      onClick={() => purchaseSubscription(planType)}
                      className={`w-full font-bold py-2 px-4 rounded transition-colors ${
                        isRecommended 
                          ? 'bg-purple-600 text-white hover:bg-purple-700' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      Assinar Agora
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ferramenta avulsa */}
          {toolName && toolPrice && (
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">🛠️ Compra Avulsa</h3>
              <div className="bg-primary/50 p-6 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-white">{toolName}</h4>
                    <p className="text-gray-300">Acesso permanente a esta ferramenta</p>
                  </div>
                  <div className="text-3xl font-bold text-blue-400">
                    R$ {toolPrice.toFixed(2)}
                  </div>
                </div>
                <div className="bg-yellow-500/20 border border-yellow-500/30 p-4 rounded-lg mb-4">
                  <p className="text-yellow-300 text-sm">
                    ⚠️ <strong>Sem degustação:</strong> Ferramentas avulsas não possuem período de teste gratuito.
                  </p>
                </div>
                <button
                  onClick={purchaseTool}
                  className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  💳 Comprar Ferramenta
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Apenas afiliado */}
        {user?.affiliateInfo?.isActive && !user.subscription && (
          <div className="mt-6 bg-orange-500/20 border border-orange-500/30 p-4 rounded-lg">
            <p className="text-orange-300 text-sm">
              <strong>Conta de Afiliado:</strong> Você está registrado apenas como afiliado. 
              Para acessar as ferramentas, é necessário uma assinatura ou compra avulsa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionAccessControl;
