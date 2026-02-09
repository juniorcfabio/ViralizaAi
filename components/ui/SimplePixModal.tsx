import React, { useState, useEffect } from 'react';

interface SimplePixModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  amount: number;
  onPaymentSuccess?: () => void;
}

const SimplePixModal: React.FC<SimplePixModalProps> = ({
  isOpen,
  onClose,
  planName,
  amount,
  onPaymentSuccess
}) => {
  const [pixCode, setPixCode] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Função para gerar PIX payload
  const generatePixPayload = (amount: number, description: string) => {
    const pixKey = 'caccb1b4-6b25-4e5a-98a0-17121d31780e';
    const merchantName = 'Viralizaai';
    const merchantCity = 'SAO PAULO';
    const txid = `pix-${Date.now()}`;
    
    // Função auxiliar para criar campos PIX
    const field = (id: string, value: string) => {
      if (!value) return '';
      return id + String(value.length).padStart(2, '0') + value;
    };

    // Função CRC16
    const crc16 = (str: string) => {
      let crc = 0xFFFF;
      for (let i = 0; i < str.length; i++) {
        crc ^= (str.charCodeAt(i) << 8);
        for (let j = 0; j < 8; j++) {
          crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
        }
      }
      return ('0000' + crc.toString(16).toUpperCase()).slice(-4);
    };

    // Construir payload PIX
    const gui = field('00', 'br.gov.bcb.pix');
    const keyField = field('01', pixKey);
    const descField = description ? field('02', description) : '';
    const merchantInfo = field('26', gui + keyField + descField);
    const txidField = field('62', field('05', txid));
    const amountField = field('54', amount.toFixed(2));
    
    const payload = field('00', '01') + 
                   field('01', '12') + 
                   merchantInfo + 
                   field('52', '0000') + 
                   field('53', '986') + 
                   amountField + 
                   field('58', 'BR') + 
                   field('59', merchantName) + 
                   field('60', merchantCity) + 
                   txidField + 
                   '6304';
    
    const crc = crc16(payload);
    return payload + crc;
  };

  useEffect(() => {
    if (isOpen && amount > 0) {
      const payload = generatePixPayload(amount, planName);
      setPixCode(payload);
      
      // Gerar QR Code usando API pública
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payload)}`;
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
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
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">Escaneie com o app do seu banco</p>
            </div>
          )}

          {/* Código PIX */}
          {pixCode && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-green-800 mb-3">🔐 Código PIX</h3>
              
              <div className="bg-white border rounded p-3 mb-3">
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

          {/* Botões */}
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 rounded-lg font-semibold text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Fechar
            </button>
            <button 
              onClick={() => {
                if (onPaymentSuccess) onPaymentSuccess();
                onClose();
              }}
              className="flex-1 py-3 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              ✅ Paguei
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplePixModal;
