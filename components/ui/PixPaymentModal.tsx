import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planType: string;
  amount: number;
  onPaymentSuccess?: () => void;
}

const PixPaymentModal: React.FC<PixPaymentModalProps> = ({
  isOpen,
  onClose,
  planName,
  planType,
  amount,
  onPaymentSuccess
}) => {
  const { user } = useAuth();
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [pixCode, setPixCode] = useState<string>('');
  const [statusPix, setStatusPix] = useState<string>('Aguardando pagamento...');
  const [showModal, setShowModal] = useState<boolean>(false);

  // 🔒 PROTEÇÃO SSR TOTAL
  useEffect(() => {
    if (typeof window !== "undefined" && typeof document !== "undefined" && isOpen) {
      document.body.style.overflow = 'hidden';
      // 🚀 GERAR PIX AUTOMATICAMENTE QUANDO MODAL ABRE
      abrirPix();
    }
    return () => {
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        document.body.style.overflow = 'auto';
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // 🚀 CRIAR PIX SEGURO
  const abrirPix = async () => {
    if (!user?.id || !user?.email) {
      alert('Usuário não autenticado');
      return;
    }

    try {
      console.log('🔐 Criando PIX seguro...');
      
      const res = await fetch("/api/pix-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          planType: planType,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar PIX');
      }

      console.log('✅ PIX seguro criado:', data.paymentIntentId);

      setPaymentIntentId(data.paymentIntentId);
      setQrCode(data.qrCode);
      setPixCode(data.pixCode);
      setShowModal(true);

      // 🔍 FRONTEND SÓ CONSULTA STATUS
      verificarPagamento(data.paymentIntentId);
    } catch (error) {
      console.error('🚨 Erro ao criar PIX:', error);
      alert('Erro ao criar PIX: ' + (error as Error).message);
    }
  };

  // 📋 COPIAR PIX
  const copiarPix = () => {
    if (typeof document === "undefined") return;
    
    const el = document.createElement('textarea');
    el.value = pixCode;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    alert('Código PIX copiado!');
  };

  // 🔍 VERIFICAR PAGAMENTO (SÓ CONSULTA)
  const verificarPagamento = (paymentId: string) => {
    console.log('🔍 Iniciando verificação de pagamento (só consulta)');
    
    const intervalo = setInterval(async () => {
      try {
        const res = await fetch(`/api/check-payment?id=${paymentId}`);
        const data = await res.json();

        console.log('📊 Status consultado:', data.status);

        if (data.status === "succeeded") {
          clearInterval(intervalo);
          setStatusPix("✅ Pagamento confirmado via webhook!");
          
          console.log('🎉 Pagamento confirmado! Webhook processará a liberação.');
          
          setTimeout(() => {
            alert('🎉 Pagamento confirmado!\n\n✅ Seu plano será ativado automaticamente pelo sistema.\n🔄 Recarregando página...');
            onClose();
            if (onPaymentSuccess) {
              onPaymentSuccess();
            }
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          }, 2000);
        } else if (data.status === "canceled" || data.status === "failed") {
          clearInterval(intervalo);
          setStatusPix("❌ Pagamento cancelado ou falhou");
        }
      } catch (error) {
        console.error('🚨 Erro ao verificar pagamento:', error);
      }
    }, 5000);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏦</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Pagamento via PIX</h2>
          <p className="text-gray-600">{planName}</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            R$ {amount.toFixed(2)}
          </p>
        </div>

        <div className="space-y-4">
          {/* QR CODE PIX STRIPE */}
          {qrCode && (
            <div className="text-center">
              <h3 className="font-bold text-green-800 mb-4">📱 QR Code PIX Stripe</h3>
              <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                <img 
                  src={qrCode}
                  width="200" 
                  className="mx-auto"
                  alt="QR Code PIX"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">Escaneie com o app do seu banco</p>
            </div>
          )}

          {/* CÓDIGO PIX STRIPE */}
          {pixCode && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <h3 className="font-bold text-green-800 mb-3">🔐 Código PIX Seguro (Stripe)</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Código PIX (com valor embutido):</p>
                  <div className="bg-white border rounded p-3 mt-1">
                    <code className="text-xs font-mono text-gray-800 break-all">
                      {pixCode}
                    </code>
                  </div>
                  <p className="text-xs text-green-600 mt-1 font-semibold">
                    ✅ Valor R$ {amount.toFixed(2)} já incluído pelo Stripe
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-gray-700">Processador:</p>
                    <p className="text-gray-600">Stripe</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Valor:</p>
                    <p className="text-green-600 font-bold">R$ {amount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(pixCode);
                    alert(`✅ Código PIX copiado!\n💰 Valor: R$ ${amount.toFixed(2)}\n🔐 Processado pelo Stripe`);
                  } else {
                    const el = document.createElement('textarea');
                    el.value = pixCode;
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand('copy');
                    document.body.removeChild(el);
                    alert(`✅ Código PIX copiado!\n💰 Valor: R$ ${amount.toFixed(2)}`);
                  }
                }}
                className="w-full mt-4 py-3 px-4 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                📋 Copiar Código PIX Stripe
              </button>
            </div>
          )}
          
          {/* INSTRUÇÕES */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-bold text-yellow-800 mb-2">📋 Como pagar:</h4>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Copie a chave PIX acima</li>
              <li>2. Abra o app do seu banco</li>
              <li>3. Escolha "PIX" → "Transferir"</li>
              <li>4. Cole a chave copiada</li>
              <li>5. Confirme o valor: <strong>R$ {amount.toFixed(2)}</strong></li>
              <li>6. Finalize a transferência</li>
            </ol>
          </div>
          
          {/* STATUS */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-center">
            <p className="text-blue-800 font-semibold">{statusPix}</p>
            <p className="text-xs text-blue-600 mt-1">Verificando automaticamente a cada 5 segundos</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 border border-red-600 transition-colors"
          >
            ✕ Fechar
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PixPaymentModal;
