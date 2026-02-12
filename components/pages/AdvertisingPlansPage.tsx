import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StripeService from '../../services/stripeService';
import PixPaymentModal from '../ui/PixPaymentModal';

interface AdvertisingPlan {
  id: string;
  name: string;
  currentPrice: number;
  category: string;
  description: string;
  isActive: boolean;
  days: number;
}

const AdvertisingPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<AdvertisingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<AdvertisingPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixSelectedPlan, setPixSelectedPlan] = useState<AdvertisingPlan | null>(null);

  useEffect(() => {
    // Verificar se há empresa pendente
    const pendingAdvertiser = localStorage.getItem('pending_advertiser');
    if (!pendingAdvertiser) {
      navigate('/');
      return;
    }

    // Carregar planos de anúncio
    loadAdvertisingPlans();
  }, [navigate]);

  const loadAdvertisingPlans = () => {
    // Carregar planos de anúncio do localStorage
    const savedPlans = localStorage.getItem('advertising_plans');
    
    const defaultPlans: AdvertisingPlan[] = [
      {
        id: 'ad-weekly',
        name: '1 Semana',
        currentPrice: 99.90,
        category: 'Plano de Anúncio',
        description: 'Anúncio na página inicial por 7 dias',
        isActive: true,
        days: 7
      },
      {
        id: 'ad-biweekly',
        name: '15 Dias',
        currentPrice: 179.90,
        category: 'Plano de Anúncio',
        description: 'Anúncio na página inicial por 15 dias',
        isActive: true,
        days: 15
      },
      {
        id: 'ad-monthly',
        name: '30 Dias',
        currentPrice: 299.90,
        category: 'Plano de Anúncio',
        description: 'Anúncio na página inicial por 30 dias',
        isActive: true,
        days: 30
      }
    ];

    if (savedPlans) {
      const parsedPlans = JSON.parse(savedPlans);
      const validPlans = parsedPlans
        .filter((plan: AdvertisingPlan) => plan.isActive)
        .map((plan: AdvertisingPlan) => ({
          ...plan,
          days: plan.days || (plan.id === 'ad-weekly' ? 7 : plan.id === 'ad-biweekly' ? 15 : 30)
        }));
      setPlans(validPlans);
    } else {
      setPlans(defaultPlans);
    }
  };

  const handlePlanSelection = async (plan: AdvertisingPlan) => {
    console.log('🎯 Plano selecionado:', plan);
    setSelectedPlan(plan);
    setIsProcessing(true);

    try {
      const pendingAdvertiser = localStorage.getItem('pending_advertiser');
      console.log('📋 Dados do anunciante:', pendingAdvertiser);
      
      if (!pendingAdvertiser) {
        throw new Error('Dados da empresa não encontrados');
      }

      const advertiserData = JSON.parse(pendingAdvertiser);
      console.log('👤 Dados processados:', advertiserData);
      
      console.log('💳 Usando API funcional stripe-test');

      // Usar a API Supabase Edge Function
      const paymentData = {
        mode: 'payment',
        planName: `Plano de Anúncio ${plan.name} - ${plan.description}`,
        amount: Math.round(plan.currentPrice * 100), // Converter para centavos
        currency: 'brl',
        successUrl: `${window.location.origin}/advertising-success?plan=${plan.id}`,
        cancelUrl: `${window.location.origin}/advertising-plans`
      };

      console.log('💰 Dados do pagamento:', paymentData);

      // Salvar dados do plano selecionado
      localStorage.setItem('selected_advertising_plan', JSON.stringify(plan));
      // SYNC COM SUPABASE
      import('../../src/lib/supabase').then(({ supabase }) => {
        supabase.from('activity_logs').insert({ action: 'advertising_plan_selected', details: plan, created_at: new Date().toISOString() }).then(() => {});
      });
      console.log('💾 Plano salvo no localStorage + Supabase');

      // Usar a API funcional stripe-test
      console.log('🚀 Chamando API funcional...');
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
      console.log('✅ Resposta da API:', result);

      if (result.success && result.url) {
        console.log('🔄 Redirecionando para Stripe:', result.url);
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }

    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error);
      alert(`Erro ao processar pagamento: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const handlePixPayment = (plan: AdvertisingPlan) => {
    setPixSelectedPlan(plan);
    setPixModalOpen(true);
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'ad-weekly':
        return 'border-blue-500 bg-blue-500/10';
      case 'ad-biweekly':
        return 'border-purple-500 bg-purple-500/10';
      case 'ad-monthly':
        return 'border-green-500 bg-green-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getRecommendedBadge = (planId: string) => {
    if (planId === 'ad-monthly') {
      return (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            RECOMENDADO
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-primary text-light">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">📢 Planos de Anúncio</h1>
          <p className="text-gray-400 text-lg">
            Escolha o plano ideal para anunciar sua empresa na página inicial
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-8 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${getPlanColor(plan.id)}`}
            >
              {getRecommendedBadge(plan.id)}
              
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-6">{plan.description}</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold text-accent">
                    R$ {plan.currentPrice.toFixed(2)}
                  </span>
                  <p className="text-gray-400 mt-2">Pagamento único</p>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-center text-sm">
                    <span className="text-green-400 mr-2">✓</span>
                    Anúncio na página inicial
                  </div>
                  <div className="flex items-center justify-center text-sm">
                    <span className="text-green-400 mr-2">✓</span>
                    Visibilidade para milhares de visitantes
                  </div>
                  <div className="flex items-center justify-center text-sm">
                    <span className="text-green-400 mr-2">✓</span>
                    Logo e informações da empresa
                  </div>
                  <div className="flex items-center justify-center text-sm">
                    <span className="text-green-400 mr-2">✓</span>
                    Link para seu site/Instagram
                  </div>
                  <div className="flex items-center justify-center text-sm font-bold text-accent">
                    <span className="text-accent mr-2">⭐</span>
                    {plan.days} dias de exposição
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handlePlanSelection(plan)}
                    disabled={isProcessing && selectedPlan?.id === plan.id}
                    className="w-full bg-accent hover:bg-accent/80 text-primary font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing && selectedPlan?.id === plan.id ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processando...
                      </span>
                    ) : (
                      '💳 Cartão/Boleto'
                    )}
                  </button>
                  <button
                    onClick={() => handlePixPayment(plan)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    ⚡ PIX
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-light transition-colors underline"
          >
            Voltar para página inicial
          </button>
        </div>
      </div>

      {/* Modal PIX */}
      <PixPaymentModal
        isOpen={pixModalOpen}
        onClose={() => setPixModalOpen(false)}
        amount={pixSelectedPlan ? pixSelectedPlan.currentPrice : 0}
        planName={pixSelectedPlan ? `Plano de Anúncio ${pixSelectedPlan.name} - ${pixSelectedPlan.description}` : ''}
        pixKey="caccb1b4-6b25-4e5a-98a0-17121d31780e"
      />
    </div>
  );
};

export default AdvertisingPlansPage;
