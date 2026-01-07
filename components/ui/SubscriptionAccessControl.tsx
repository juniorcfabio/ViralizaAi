import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import StripeService from '../../services/stripeService';

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
      
      const plans = {
        monthly: { price: 59.90, name: 'Plano Mensal' },
        quarterly: { price: 159.90, name: 'Plano Trimestral' },
        semiannual: { price: 259.90, name: 'Plano Semestral' },
        annual: { price: 399.90, name: 'Plano Anual' }
      };
      
      const plan = plans[planType as keyof typeof plans];
      
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
      const stripeService = StripeService.getInstance();
      
      const paymentData = {
        amount: toolPrice,
        currency: 'BRL',
        description: `${toolName} - Ferramenta Avulsa`,
        productId: toolName.toLowerCase().replace(/\s+/g, '-'),
        productType: 'tool' as const,
        userId: user?.id || 'guest_' + Date.now(),
        userEmail: user?.email || 'usuario@exemplo.com',
        successUrl: `${window.location.origin}/dashboard?payment=success`,
        cancelUrl: `${window.location.origin}/dashboard?payment=cancelled`,
        metadata: {
          toolName,
          purchaseType: 'standalone'
        }
      };
      
      await stripeService.processToolPayment(paymentData);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
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
              <div className="bg-primary/50 p-4 rounded-lg border border-gray-600">
                <h4 className="text-lg font-bold text-white mb-2">Plano Mensal</h4>
                <div className="text-2xl font-bold text-green-400 mb-3">R$ 59,90/mês</div>
                <ul className="text-sm text-gray-300 mb-4 space-y-1">
                  <li>• Acesso a todas as ferramentas</li>
                  <li>• Degustação de 24h</li>
                  <li>• Suporte prioritário</li>
                </ul>
                <button
                  onClick={() => purchaseSubscription('monthly')}
                  className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition-colors"
                >
                  Assinar Agora
                </button>
              </div>

              <div className="bg-primary/50 p-4 rounded-lg border border-purple-500">
                <div className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full inline-block mb-2">
                  RECOMENDADO
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Plano Semestral</h4>
                <div className="text-2xl font-bold text-purple-400 mb-3">R$ 259,90/6 meses</div>
                <ul className="text-sm text-gray-300 mb-4 space-y-1">
                  <li>• Tudo do mensal</li>
                  <li>• Economia de 28%</li>
                  <li>• Relatórios avançados</li>
                  <li>• API de integração</li>
                </ul>
                <button
                  onClick={() => purchaseSubscription('semiannual')}
                  className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded hover:bg-purple-700 transition-colors"
                >
                  Assinar Agora
                </button>
              </div>
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
