import React from 'react';

interface PixModalSimpleProps {
  planName: string;
  amount: number;
  onClose: () => void;
}

const PixModalSimple: React.FC<PixModalSimpleProps> = ({ planName, amount, onClose }) => {
  const pixKey = 'caccb1b4-6b25-4e5a-98a0-17121d31780e';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`PIX:${pixKey}:${amount}:${planName}`)}`;
  
  const copyPixCode = () => {
    const pixCode = `PIX: ${pixKey} - Valor: R$ ${amount.toFixed(2)} - ${planName}`;
    navigator.clipboard.writeText(pixCode).then(() => {
      alert('✅ Código PIX copiado!');
    });
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
            className="flex-1 py-3 rounded-lg font-semibold text-gray-600 bg-gray-200 hover:bg-gray-300"
          >
            Fechar
          </button>
          <button 
            onClick={() => {
              alert('✅ Pagamento confirmado! Plano ativado.');
              onClose();
            }}
            className="flex-1 py-3 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700"
          >
            ✅ Paguei
          </button>
        </div>
      </div>
    </div>
  );
};

export default PixModalSimple;
