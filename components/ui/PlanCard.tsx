// =======================
// 💳 CARD DE PLANO COM PIX STRIPE
// =======================

import React, { useState } from 'react';
import PixPaymentModal from './PixPaymentModal';
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
      console.log('� MODAL 28/01/2026 - Iniciando pagamento plano:', {
        planType,
        planName,
        price,
        userEmail: user?.email
      });

      // Usar a API funcional stripe-test que está funcionando
      const paymentData = {
        planName: `${planName} - ViralizaAI`,
        amount: Math.round(price * 100), // Converter para centavos
        successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/cancel`
      };

      console.log('📋 Dados do pagamento PlanCard:', paymentData);

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
      console.error('❌ Erro no sistema 28/01/2026:', error);
      
      // Fallback para modal PIX se falhar
      console.log('🔄 Fallback para modal PIX');
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
      <PixPaymentModal
        isOpen={showPixModal}
        onClose={() => setShowPixModal(false)}
        planName={planName}
        planType={planType}
        amount={price}
        onPaymentSuccess={() => {
          setShowPixModal(false);
          // Callback de sucesso se necessário
        }}
      />
    </>
  );
};

export default PlanCard;
