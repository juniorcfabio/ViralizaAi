import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';

interface PixPaymentModalFixedProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  amount: number;
  onPaymentSuccess?: () => void;
}

const PixPaymentModalFixed: React.FC<PixPaymentModalFixedProps> = ({
  isOpen,
  onClose,
  planName,
  amount,
  onPaymentSuccess
}) => {
  const { user, updateUser } = useAuth();
  const [pixCode, setPixCode] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Função para gerar PIX EMV Code válido (padrão bancário brasileiro)
  const generatePixEMVCode = (amount: number, description: string) => {
    const pixKey = 'caccb1b4-6b25-4e5a-98a0-17121d31780e';
    const merchantName = 'VIRALIZAAI';
    const merchantCity = 'SAO PAULO';
    const txid = `VIR${Date.now().toString().slice(-8)}`;
    
    // Função para criar campo EMV
    const createEMVField = (id: string, value: string) => {
      if (!value) return '';
      const length = value.length.toString().padStart(2, '0');
      return id + length + value;
    };

    // Função CRC16 CCITT para PIX
    const calculateCRC16 = (str: string) => {
      let crc = 0xFFFF;
      for (let i = 0; i < str.length; i++) {
        crc ^= (str.charCodeAt(i) << 8);
        for (let j = 0; j < 8; j++) {
          crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
        }
      }
      return crc.toString(16).toUpperCase().padStart(4, '0');
    };

    // Construir payload PIX EMV padrão
    const payloadFormatIndicator = createEMVField('00', '01');
    const pointOfInitiationMethod = createEMVField('01', '12');
    
    // Merchant Account Information (26)
    const gui = createEMVField('00', 'br.gov.bcb.pix');
    const key = createEMVField('01', pixKey);
    const desc = createEMVField('02', description.substring(0, 25));
    const merchantAccountInfo = createEMVField('26', gui + key + desc);
    
    const merchantCategoryCode = createEMVField('52', '0000');
    const transactionCurrency = createEMVField('53', '986'); // BRL
    const transactionAmount = createEMVField('54', amount.toFixed(2));
    const countryCode = createEMVField('58', 'BR');
    const merchantNameField = createEMVField('59', merchantName);
    const merchantCityField = createEMVField('60', merchantCity);
    
    // Additional Data Field (62)
    const txidField = createEMVField('05', txid);
    const additionalDataField = createEMVField('62', txidField);
    
    // Montar payload sem CRC
    const payloadWithoutCRC = payloadFormatIndicator + 
                             pointOfInitiationMethod + 
                             merchantAccountInfo + 
                             merchantCategoryCode + 
                             transactionCurrency + 
                             transactionAmount + 
                             countryCode + 
                             merchantNameField + 
                             merchantCityField + 
                             additionalDataField + 
                             '6304';
    
    // Calcular e adicionar CRC
    const crc = calculateCRC16(payloadWithoutCRC);
    return payloadWithoutCRC + crc;
  };

  useEffect(() => {
    if (isOpen && amount > 0) {
      const emvCode = generatePixEMVCode(amount, planName);
      setPixCode(emvCode);
      
      // Gerar QR Code com payload PIX válido
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(emvCode)}`;
      setQrCodeUrl(qrUrl);
    }
  }, [isOpen, amount, planName]);

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      alert('✅ Código PIX copiado!\n\n📱 Cole no seu app bancário para pagar');
    } catch (err) {
      // Fallback para browsers mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = pixCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('✅ Código PIX copiado!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
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

          {/* QR Code */}
          {qrCodeUrl && (
            <div className="text-center mb-6">
              <h3 className="font-bold text-green-800 mb-4">📱 QR Code PIX</h3>
              <div className="bg-white p-4 rounded-lg border-2 border-green-200 inline-block">
                <img 
                  src={qrCodeUrl}
                  alt="QR Code PIX"
                  className="w-64 h-64"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">Escaneie com o app do seu banco</p>
            </div>
          )}

          {/* Código PIX */}
          {pixCode && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-green-800 mb-3">🔐 Código PIX EMV</h3>
              
              <div className="bg-white border rounded p-3 mb-3 max-h-32 overflow-y-auto">
                <code className="text-xs font-mono text-gray-800 break-all">
                  {pixCode}
                </code>
              </div>
              
              <button 
                onClick={copyPixCode}
                className="w-full py-3 px-4 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                📋 Copiar Código PIX
              </button>
            </div>
          )}
          
          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-bold text-blue-800 mb-2">📋 Como pagar:</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Copie o código PIX acima</li>
              <li>2. Abra o app do seu banco</li>
              <li>3. Escolha "PIX" → "Colar código"</li>
              <li>4. Confirme o valor: <strong>R$ {amount.toFixed(2)}</strong></li>
              <li>5. Finalize o pagamento</li>
              <li>6. Seu plano será ativado automaticamente</li>
            </ol>
          </div>

          {/* Chave PIX */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="font-bold text-gray-800 mb-2">🔑 Chave PIX:</h4>
            <p className="text-sm font-mono text-gray-700 break-all">
              caccb1b4-6b25-4e5a-98a0-17121d31780e
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 rounded-lg font-semibold text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Fechar
            </button>
            <button 
              onClick={async () => {
                if (!user) {
                  alert('Erro: Usuário não identificado');
                  return;
                }

                setIsProcessing(true);
                
                try {
                  // Extrair tipo do plano a partir do nome
                  const planLower = planName.toLowerCase();
                  let planType = 'mensal';
                  if (planLower.includes('anual') || planLower.includes('annual')) planType = 'anual';
                  else if (planLower.includes('semestral') || planLower.includes('semiannual')) planType = 'semestral';
                  else if (planLower.includes('trimestral') || planLower.includes('quarterly')) planType = 'trimestral';
                  else if (planLower.includes('mensal') || planLower.includes('monthly')) planType = 'mensal';

                  const paymentId = `pix_${Date.now()}`;
                  const { supabase } = await import('../../src/lib/supabase');

                  // Criar subscription como PENDING_PAYMENT (admin precisa aprovar)
                  const { error: subError } = await supabase
                    .from('subscriptions')
                    .insert({
                      user_id: user.id,
                      plan_type: planType,
                      status: 'pending_payment',
                      payment_provider: 'pix',
                      payment_id: paymentId,
                      amount: amount,
                    });

                  if (subError) {
                    console.error('Erro ao salvar subscription:', subError);
                  }

                  // Registrar compra como pendente
                  await supabase
                    .from('purchases')
                    .insert({
                      user_id: user.id,
                      item_type: 'plan',
                      item_name: planName,
                      amount: amount,
                      payment_method: 'pix',
                      payment_id: paymentId,
                      status: 'pending',
                      created_at: new Date().toISOString()
                    });

                  console.log('PIX pendente salvo:', planType, paymentId);

                  alert(`Pagamento PIX registrado!\n\nSeu plano ${planType.charAt(0).toUpperCase() + planType.slice(1)} será ativado após a confirmação do pagamento pelo administrador.\n\nAguarde a aprovação (até 15 minutos).`);
                  onClose();
                  if (onPaymentSuccess) onPaymentSuccess();

                } catch (error) {
                  console.error('Erro ao registrar pagamento:', error);
                  alert('Erro ao registrar pagamento. Tente novamente.');
                } finally {
                  setIsProcessing(false);
                }
              }}
              disabled={isProcessing}
              className={`flex-1 py-3 rounded-lg font-semibold text-white transition-colors ${
                isProcessing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isProcessing ? '⏳ Processando...' : '✅ Já Paguei'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixPaymentModalFixed;
