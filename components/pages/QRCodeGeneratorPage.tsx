// 📱 GERADOR DE QR CODE COM IA
// Gera QR Codes + estratégias de marketing com OpenAI

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import AccessControlService from '../../services/accessControlService';
import PixPaymentSecure from '../ui/PixPaymentSecure';
import openaiService from '../../services/openaiService';

const QRCodeGeneratorPage: React.FC = () => {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [qrSize, setQrSize] = useState('300');
  const [qrColor, setQrColor] = useState('000000');
  const [bgColor, setBgColor] = useState('ffffff');
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [aiStrategy, setAiStrategy] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [qrType, setQrType] = useState('url');

  useEffect(() => {
    const checkAccess = async () => {
      if (user) {
        const access = await AccessControlService.hasToolAccess(
          user.id,
          'Gerador de QR Code',
          user.type
        );
        setHasAccess(access);
      }
    };
    checkAccess();
  }, [user]);

  const generateQR = () => {
    if (!url.trim()) {
      alert('Insira uma URL ou texto!');
      return;
    }

    let data = url;
    if (qrType === 'whatsapp') {
      data = `https://wa.me/${url.replace(/\D/g, '')}`;
    } else if (qrType === 'email') {
      data = `mailto:${url}`;
    } else if (qrType === 'wifi') {
      data = `WIFI:T:WPA;S:${url};P:senha123;;`;
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(data)}&color=${qrColor}&bgcolor=${bgColor}&format=png`;
    setQrImageUrl(qrUrl);
  };

  const generateAIStrategy = async () => {
    setAiLoading(true);
    try {
      const strategy = await openaiService.generate('general',
        `Crie uma estratégia completa de marketing usando QR Codes para o link/negócio: ${url || 'negócio digital'}

Tipo de QR Code: ${qrType}

Inclua:
1. 5 locais estratégicos para colocar o QR Code (físico e digital)
2. Call-to-action otimizado para cada local
3. Estratégia de rastreamento e analytics
4. Landing page ideal para o QR Code
5. Como aumentar taxa de escaneamento
6. Integração com redes sociais
7. Métricas para acompanhar (KPIs)
8. Ideias criativas de uso do QR Code para viralizar

Seja prático e específico para o mercado brasileiro.`
      );
      setAiStrategy(strategy);
    } catch (e: any) {
      alert('Erro IA: ' + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrImageUrl) return;
    const a = document.createElement('a');
    a.href = qrImageUrl;
    a.download = `qrcode-viralizaai-${Date.now()}.png`;
    a.target = '_blank';
    a.click();
  };

  const purchaseWithStripe = async () => {
    try {
      AccessControlService.registerPayment({
        userId: user?.id || 'guest',
        type: 'tool',
        itemName: 'Gerador de QR Code',
        amount: 47.00,
        paymentMethod: 'stripe',
        status: 'pending'
      });

      const response = await fetch('/api/stripe-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: 'Gerador de QR Code - ViralizaAI',
          amount: 4700,
          successUrl: `${window.location.origin}/dashboard/qr-generator?payment=success`,
          cancelUrl: `${window.location.origin}/dashboard/qr-generator?payment=cancelled`
        })
      });

      const result = await response.json();
      if (result.success && result.url) {
        window.location.href = result.url;
      }
    } catch (error: any) {
      console.error('Erro no pagamento:', error);
      const msg = error?.message || '';
      if (msg.includes('Expired') || msg.includes('expired') || msg.includes('api_key')) {
        alert('Chave Stripe expirada. O administrador precisa atualizar STRIPE_SECRET_KEY no Vercel.\n\nUse PIX enquanto isso.');
      } else {
        alert('Erro ao processar pagamento. Tente novamente ou use PIX.');
      }
    }
  };

  const purchaseWithPix = () => {
    AccessControlService.registerPayment({
      userId: user?.id || 'guest',
      type: 'tool',
      itemName: 'Gerador de QR Code',
      amount: 47.00,
      paymentMethod: 'pix',
      status: 'pending'
    });
    setShowPixModal(true);
  };

  if (user?.type !== 'admin' && !hasAccess) {
    return (
      <div className="min-h-screen bg-primary text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">📱 Gerador de QR Code</h1>
            <p className="text-xl mb-8">Ferramenta Premium - Acesso Restrito</p>
            
            <div className="bg-secondary rounded-2xl p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">📱 Gerador de QR Code com IA</h2>
              <p className="text-gray-300 mb-6">QR Codes personalizados + estratégias de marketing com IA</p>
              
              <div className="bg-primary/50 rounded-lg p-4 mb-6">
                <div className="text-3xl font-bold text-green-400 mb-2">R$ 47,00</div>
                <div className="text-gray-300 text-sm">Acesso vitalício à ferramenta</div>
              </div>
              
              <div className="space-y-4">
                <button onClick={purchaseWithStripe} className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 transition-all">
                  💳 Pagar com Cartão (Stripe)
                </button>
                <button onClick={purchaseWithPix} className="w-full bg-green-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-green-700 transition-all">
                  🏦 Pagar com PIX
                </button>
              </div>
            </div>
          </div>
        </div>

        {showPixModal && (
          <PixPaymentSecure
            isOpen={showPixModal}
            onClose={() => setShowPixModal(false)}
            planName="Gerador de QR Code"
            planSlug="qr-code-generator"
            amount={47.00}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">📱 Gerador de QR Code com IA</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Painel de Configuração */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">⚙️ Configuração</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de QR Code</label>
                <select
                  value={qrType}
                  onChange={(e) => setQrType(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-4 py-3 text-white"
                >
                  <option value="url">🔗 URL / Link</option>
                  <option value="whatsapp">📱 WhatsApp</option>
                  <option value="email">📧 Email</option>
                  <option value="text">📝 Texto Livre</option>
                  <option value="wifi">📶 WiFi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {qrType === 'url' ? 'URL' : qrType === 'whatsapp' ? 'Número WhatsApp' : qrType === 'email' ? 'Email' : qrType === 'wifi' ? 'Nome da Rede' : 'Texto'}
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={qrType === 'url' ? 'https://seusite.com' : qrType === 'whatsapp' ? '5511999999999' : qrType === 'email' ? 'email@exemplo.com' : 'Digite aqui...'}
                  className="w-full bg-gray-700 rounded-lg px-4 py-3 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tamanho</label>
                  <select value={qrSize} onChange={(e) => setQrSize(e.target.value)} className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white">
                    <option value="200">200px</option>
                    <option value="300">300px</option>
                    <option value="400">400px</option>
                    <option value="500">500px</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cor QR</label>
                  <input type="color" value={`#${qrColor}`} onChange={(e) => setQrColor(e.target.value.replace('#', ''))} className="w-full h-10 rounded-lg cursor-pointer" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cor Fundo</label>
                  <input type="color" value={`#${bgColor}`} onChange={(e) => setBgColor(e.target.value.replace('#', ''))} className="w-full h-10 rounded-lg cursor-pointer" />
                </div>
              </div>

              <button
                onClick={generateQR}
                className="w-full bg-blue-600 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                📱 Gerar QR Code
              </button>

              <button
                onClick={generateAIStrategy}
                disabled={aiLoading}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 py-3 rounded-lg font-bold hover:from-yellow-600 hover:to-orange-600 transition-colors"
              >
                {aiLoading ? '⏳ Gerando estratégia...' : '🤖 Gerar Estratégia de Marketing IA'}
              </button>
            </div>
          </div>

          {/* Resultado */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">📱 QR Code Gerado</h2>
            
            {qrImageUrl ? (
              <div className="text-center">
                <div className="bg-white rounded-xl p-6 inline-block mb-4">
                  <img src={qrImageUrl} alt="QR Code" className="mx-auto" style={{ maxWidth: '300px' }} />
                </div>
                <div className="flex gap-4 justify-center">
                  <button onClick={downloadQR} className="bg-green-600 px-6 py-3 rounded-lg font-bold hover:bg-green-700">
                    💾 Baixar PNG
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(url); alert('✅ URL copiada!'); }} className="bg-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-purple-700">
                    📋 Copiar URL
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <p className="text-6xl mb-4">📱</p>
                <p>Configure e gere seu QR Code</p>
              </div>
            )}
          </div>
        </div>

        {/* Estratégia IA */}
        {aiStrategy && (
          <div className="mt-6 bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">🤖 Estratégia de Marketing IA</h2>
            <div className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">
              {aiStrategy}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeGeneratorPage;
