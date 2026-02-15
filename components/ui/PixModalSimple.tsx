import React, { useState } from 'react';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../contexts/AuthContextFixed';

interface PixModalSimpleProps {
  planName: string;
  amount: number;
  onClose: () => void;
}

const PixModalSimple: React.FC<PixModalSimpleProps> = ({ planName, amount, onClose }) => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const pixKey = 'caccb1b4-6b25-4e5a-98a0-17121d31780e';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`PIX:${pixKey}:${amount}:${planName}`)}`;
  
  const copyPixCode = () => {
    const pixCode = `PIX: ${pixKey} - Valor: R$ ${amount.toFixed(2)} - ${planName}`;
    navigator.clipboard.writeText(pixCode).then(() => {
      alert('✅ Código PIX copiado!');
    });
  };

  const handlePaymentConfirmation = async () => {
    if (!user) {
      alert('❌ Erro: Usuário não autenticado');
      return;
    }

    setProcessing(true);
    try {
      const paymentId = `PIX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Mapear nome do plano para tipo
      const planType = planName.toLowerCase().includes('mensal') ? 'mensal' :
                       planName.toLowerCase().includes('trimestral') ? 'trimestral' :
                       planName.toLowerCase().includes('semestral') ? 'semestral' :
                       planName.toLowerCase().includes('anual') ? 'anual' : 'mensal';

      console.log('💾 Salvando pagamento PIX no Supabase:', {
        user_id: user.id || user.email,
        plan_type: planType,
        amount,
        payment_id: paymentId
      });

      // 1. Criar registro em subscriptions
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id || user.email,
          plan_type: planType,
          amount: amount,
          payment_id: paymentId,
          payment_provider: 'pix',
          status: 'pending_payment'
        });

      if (subError) {
        console.error('❌ Erro ao criar subscription:', subError);
        throw subError;
      }

      // 2. Criar registro em purchases
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id || user.email,
          payment_id: paymentId,
          plan_type: planType,
          amount: amount,
          status: 'pending'
        });

      if (purchaseError) {
        console.error('❌ Erro ao criar purchase:', purchaseError);
        throw purchaseError;
      }

      console.log('✅ Pagamento PIX registrado com sucesso!');
      alert('✅ Pagamento registrado! Aguarde a aprovação do administrador.');
      onClose();
      
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error);
      alert('❌ Erro ao registrar pagamento. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Pagamento PIX</h2>
          <p className="text-gray-600">{planName}</p>
          <p className="text-3xl font-bold text-green-600 mt-2">R$ {amount.toFixed(2)}</p>
        </div>

        <div className="text-center mb-6">
          <img src={qrCodeUrl} alt="QR Code PIX" className="w-48 h-48 mx-auto border rounded" />
          <p className="text-sm text-gray-600 mt-2">Escaneie com o app do seu banco</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-bold text-green-800 mb-2">Chave PIX:</p>
          <p className="text-xs font-mono text-gray-700 break-all">{pixKey}</p>
          <button 
            onClick={copyPixCode}
            className="w-full mt-3 py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
          >
            📋 Copiar Chave PIX
          </button>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            disabled={processing}
            className="flex-1 py-3 rounded-lg font-semibold text-gray-600 bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Fechar
          </button>
          <button 
            onClick={handlePaymentConfirmation}
            disabled={processing}
            className="flex-1 py-3 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {processing ? '⏳ Processando...' : '✅ Já Paguei'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PixModalSimple;
