// =======================
// 💳 CARD DE PLANO COM PIX STRIPE
// =======================

import React, { useState } from 'react';
import PixModalSimple from './PixModalSimple';
import { useAuth } from '../../contexts/AuthContextFixed';

interface PlanCardProps {
  planType: string;
  planName: string;
  price: number;
  originalPrice?: number;
  features: string[];
  isPopular?: boolean;
  discount?: string;
}

const PlanCard: React.FC<PlanCardProps> = ({
  planType,
  planName,
  price,
  originalPrice,
  features,
  isPopular = false,
  discount
}) => {
  const { user } = useAuth();
  const [showPixModal, setShowPixModal] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      alert('Faça login para assinar um plano');
      return;
    }

    try {
      console.log('💳 Iniciando pagamento Stripe:', {
        planType,
        planName,
        price,
        userEmail: user?.email
      });

      // Criar checkout session via Supabase Edge Function
      const { data: sessionData } = await (window as any).supabase.auth.getSession();
      const jwt = sessionData?.session?.access_token;

      if (!jwt) {
        throw new Error('Sessão não encontrada');
      }

      const SUPABASE_URL = 'https://ymmswnmietxoupeazmok.supabase.co';
      const EDGE_FN_URL = `${SUPABASE_URL}/functions/v1/create-checkout-session`;

      const response = await fetch(EDGE_FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          plan_slug: planType,
          payment_method_types: ['card'],
          success_url: `${window.location.origin}/dashboard?checkout=success&plan=${planType}`,
          cancel_url: `${window.location.origin}/pricing?checkout=cancel`,
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Erro: ${response.status}`);
      }
      
      if (result.success && result.url) {
        console.log('🔄 Redirecionando para Stripe:', result.url);
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'URL de checkout não retornada');
      }

    } catch (error) {
      console.error('❌ Erro no pagamento Stripe:', error);
      console.log('🔄 Abrindo modal PIX como alternativa');
      setShowPixModal(true);
    }
  };

  return (
    <>
      <div className={`relative bg-white rounded-2xl shadow-xl p-6 ${
        isPopular ? 'border-2 border-blue-500 transform scale-105' : 'border border-gray-200'
      }`}>
        
        {/* Badge Popular */}
        {isPopular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
              🔥 MAIS POPULAR
            </span>
          </div>
        )}

        {/* Desconto */}
        {discount && (
          <div className="absolute -top-2 -right-2">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              {discount}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{planName}</h3>
          
          <div className="mb-4">
            {originalPrice && (
              <span className="text-gray-400 line-through text-lg mr-2">
                R$ {originalPrice.toFixed(2)}
              </span>
            )}
            <span className="text-4xl font-bold text-green-600">
              R$ {price.toFixed(2)}
            </span>
            <span className="text-gray-600 ml-1">
              {planType === 'anual' ? '/ano' : planType === 'semestral' ? '/semestre' : planType === 'trimestral' ? '/trimestre' : '/mês'}
            </span>
          </div>

          {/* Economia */}
          {originalPrice && (
            <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
              💰 Economize R$ {(originalPrice - price).toFixed(2)}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center">
              <span className="text-green-500 mr-3">✓</span>
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        {/* Botões de Pagamento */}
        <div className="space-y-3">
          {/* Botão Stripe */}
          <button
            onClick={handleSubscribe}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
              isPopular
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                : 'bg-gray-800 text-white hover:bg-gray-900'
            }`}
          >
            <div className="flex items-center justify-center">
              <span className="mr-2">💳</span>
              Assinar com Cartão
            </div>
          </button>

          {/* Botão PIX */}
          <button
            onClick={() => setShowPixModal(true)}
            className="w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg"
          >
            <div className="flex items-center justify-center">
              <span className="mr-2">🏦</span>
              Pagar com PIX
            </div>
          </button>
        </div>

        {/* Informações PIX */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            🔒 Pagamento seguro via Stripe PIX
          </p>
          <p className="text-xs text-gray-500">
            ⚡ Ativação automática em segundos
          </p>
        </div>
      </div>

      {/* Modal PIX */}
      {showPixModal && (
        <PixModalSimple
          planName={planName}
          amount={price}
          onClose={() => setShowPixModal(false)}
        />
      )}
    </>
  );
};

export default PlanCard;
