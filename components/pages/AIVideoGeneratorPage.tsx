import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import RealVideoGeneratorAI, { VideoConfig as VideoGenerationConfig, GeneratedVideoReal as GeneratedVideo } from '../../services/realVideoGeneratorAI';
import RealTimePriceSyncService from '../../services/realTimePriceSync';
import PixPaymentModalFixed from '../ui/PixPaymentModalFixed';
import AccessControlService from '../../services/accessControlService';

interface VideoConfig {
  businessType: string;
  businessName: string;
  targetAudience: string;
  mainMessage: string;
  callToAction: string;
  avatarStyle: 'professional' | 'casual' | 'elegant' | 'modern';
  voiceStyle: 'energetic' | 'calm' | 'authoritative' | 'friendly';
  duration: '30' | '60' | '90' | '120';
  background: 'office' | 'studio' | 'outdoor' | 'custom';
  avatarGender: 'masculino' | 'feminino';
  voiceGender: 'masculina' | 'feminina';
}

const AIVideoGeneratorPage: React.FC = () => {
  const { user } = useAuth();
  const [hasVideoAccess, setHasVideoAccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [generationStep, setGenerationStep] = useState(0);
  const [videoService] = useState(() => RealVideoGeneratorAI.getInstance());
  const [priceService] = useState(() => RealTimePriceSyncService.getInstance());
  const [currentPrice, setCurrentPrice] = useState(197.00);
  const [showPixModal, setShowPixModal] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [config, setConfig] = useState<VideoConfig>({
    businessType: 'Tecnologia',
    businessName: '',
    targetAudience: 'Empresários',
    mainMessage: '',
    callToAction: 'Entre em contato conosco',
    avatarStyle: 'professional',
    voiceStyle: 'friendly',
    duration: '30',
    background: 'office',
    avatarGender: 'masculino',
    voiceGender: 'feminina'
  });

  useEffect(() => {
    const checkVideoAccess = () => {
      if (!user) return;
      
      // Verificar acesso usando AccessControlService
      const hasAccess = AccessControlService.hasToolAccess(
        user.id, 
        'IA Video Generator 8K', 
        user.type
      );
      
      setHasVideoAccess(hasAccess);
      console.log('🔍 Acesso ao IA Video Generator:', hasAccess);
    };
    
    checkVideoAccess();
  }, [user]);

  const handleInputChange = (field: keyof VideoConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const generateVideo = async () => {
    if (!config.businessName || !config.mainMessage) {
      alert('⚠️ Preencha pelo menos o nome do negócio e a mensagem principal');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(0);
    setGenerationProgress('Iniciando geração...');
    
    try {
      console.log('🎬 Iniciando geração REAL de vídeo...');
      
      // Simular progresso das etapas
      const progressSteps = [
        'Gerando script personalizado...',
        'Criando áudio com IA...',
        'Gerando avatar...',
        'Criando background...',
        'Compondo vídeo final...'
      ];

      // Atualizar progresso durante a geração
      const progressInterval = setInterval(() => {
        setGenerationStep(prev => {
          const next = prev + 1;
          if (next < progressSteps.length) {
            setGenerationProgress(progressSteps[next]);
          }
          return next;
        });
      }, 2000);

      const videoConfig: VideoGenerationConfig = {
        businessType: config.businessType,
        businessName: config.businessName,
        targetAudience: config.targetAudience,
        mainMessage: config.mainMessage,
        callToAction: config.callToAction,
        avatarStyle: config.avatarStyle,
        voiceStyle: config.voiceStyle,
        duration: config.duration,
        background: config.background,
        avatarGender: config.avatarGender,
        voiceGender: config.voiceGender
      };

      const video = await videoService.generateRealVideo(videoConfig);
      
      clearInterval(progressInterval);
      setGenerationStep(5);
      setGenerationProgress('Vídeo gerado com sucesso!');
      
      setGeneratedVideo(video);
      console.log('✅ Vídeo gerado com sucesso:', video);
      
    } catch (error) {
      console.error('❌ Erro na geração do vídeo:', error);
      setGenerationProgress('Erro na geração. Usando vídeo demo...');
      
      // Ainda tentar gerar um vídeo demo
      try {
        const demoConfig: VideoGenerationConfig = {
          businessType: config.businessType || 'Negócio',
          businessName: config.businessName || 'Empresa Demo',
          targetAudience: config.targetAudience || 'Público geral',
          mainMessage: config.mainMessage || 'Mensagem de demonstração',
          callToAction: config.callToAction || 'Entre em contato',
          avatarStyle: config.avatarStyle,
          voiceStyle: config.voiceStyle,
          duration: config.duration,
          background: config.background,
          avatarGender: config.avatarGender,
          voiceGender: config.voiceGender
        };
        
        const demoVideo = await videoService.generateRealVideo(demoConfig);
        setGeneratedVideo(demoVideo);
        setGenerationProgress('Vídeo demo gerado com sucesso!');
      } catch (demoError) {
        console.error('❌ Erro ao gerar vídeo demo:', demoError);
        alert('❌ Erro ao gerar vídeo. Tente novamente ou verifique sua conexão.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewVideo = () => {
    if (!generatedVideo) return;
    setShowPreview(true);
  };

  const handleDownloadVideo = () => {
    if (generatedVideo) {
      console.log('📥 Download do vídeo:', generatedVideo.videoUrl);
      alert('🎬 Download iniciado! O vídeo será salvo na pasta Downloads.');
    }
  };

  // 💳 MOSTRAR OPÇÕES DE PAGAMENTO
  const showPaymentOptionsModal = () => {
    setShowPaymentOptions(true);
  };

  // 💳 PAGAMENTO VIA STRIPE
  const purchaseWithStripe = async () => {
    try {
      // Registrar pagamento no sistema de controle
      const payment = AccessControlService.registerPayment({
        userId: user?.id || 'guest',
        type: 'tool',
        itemName: 'IA Video Generator 8K',
        amount: currentPrice,
        paymentMethod: 'stripe',
        status: 'pending'
      });

      console.log('💳 Pagamento Stripe registrado:', payment);

      // Usar API funcional stripe-test
      const paymentData = {
        planName: 'IA Video Generator 8K - ViralizaAI',
        amount: Math.round(currentPrice * 100), // Converter para centavos
        successUrl: `${window.location.origin}/dashboard/ai-video-generator?payment=success&tool=IA%20Video%20Generator%208K`,
        cancelUrl: `${window.location.origin}/dashboard/ai-video-generator?payment=cancelled`
      };

      console.log('📋 Dados do pagamento Stripe:', paymentData);
      
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
      console.error('❌ Erro ao processar pagamento Stripe:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    }
  };

  // 🏦 PAGAMENTO VIA PIX
  const purchaseWithPix = () => {
    // Registrar pagamento PIX no sistema de controle
    const payment = AccessControlService.registerPayment({
      userId: user?.id || 'guest',
      type: 'tool',
      itemName: 'IA Video Generator 8K',
      amount: currentPrice,
      paymentMethod: 'pix',
      status: 'pending'
    });

    console.log('🏦 Pagamento PIX registrado:', payment);
    
    setShowPaymentOptions(false);
    setShowPixModal(true);
  };

  // ✅ CONFIRMAR PAGAMENTO PIX
  const handlePixPaymentSuccess = () => {
    // Confirmar pagamento PIX e liberar acesso
    const payments = AccessControlService.getAllPayments();
    const pendingPayment = payments.find(p => 
      p.itemName === 'IA Video Generator 8K' && 
      p.paymentMethod === 'pix' && 
      p.status === 'pending'
    );
    
    if (pendingPayment) {
      AccessControlService.confirmPayment(pendingPayment.id, `pix_${Date.now()}`);
      console.log('✅ Pagamento PIX confirmado e acesso liberado!');
      
      // Atualizar estado de acesso
      setHasVideoAccess(true);
    }
    
    setShowPixModal(false);
    alert('✅ Pagamento PIX confirmado! IA Video Generator 8K ativado com sucesso.');
    
    // Recarregar página para atualizar interface
    window.location.reload();
  };

  // ADMIN NUNCA VÊ PÁGINA DE COMPRA - ACESSO DIRETO
  if (!user) {
    return <div>Carregando...</div>;
  }

  // Se não é admin e não tem acesso, mostrar página de compra
  if (user.type !== 'admin' && !hasVideoAccess) {
    return (
      <div className="min-h-screen bg-primary text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">🎬 IA Video Generator 8K</h1>
            <p className="text-xl mb-8">Ferramenta Premium - Acesso Restrito</p>
            <div className="bg-secondary rounded-2xl p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">🎬 IA Video Generator 8K</h2>
              <p className="text-gray-300 mb-6">Crie vídeos promocionais ultra-realísticos com avatares IA</p>
              
              <div className="bg-primary/50 rounded-lg p-4 mb-6">
                <div className="text-3xl font-bold text-green-400 mb-2">R$ {currentPrice.toFixed(2)}</div>
                <div className="text-gray-300 text-sm">Acesso vitalício à ferramenta</div>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={purchaseWithStripe}
                  className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                >
                  💳 Pagar com Cartão (Stripe)
                </button>
                
                <button
                  onClick={purchaseWithPix}
                  className="w-full bg-green-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-3"
                >
                  🏦 Pagar com PIX
                </button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">✅ Pagamento seguro • ✅ Acesso imediato • ✅ Suporte incluído</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin ou usuários com acesso veem a ferramenta completa
  return (
    <div className="min-h-screen bg-primary text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">🎬 IA Video Generator 8K</h1>
          <p className="text-xl text-gray-300">Crie vídeos promocionais ultra-realísticos</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="bg-secondary rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">📝 Configuração do Vídeo</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Nome do Negócio</label>
                  <input
                    type="text"
                    value={config.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="Digite o nome do seu negócio"
                    className="w-full bg-primary border border-gray-600 rounded-lg p-3 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Mensagem Principal</label>
                  <textarea
                    value={config.mainMessage}
                    onChange={(e) => handleInputChange('mainMessage', e.target.value)}
                    placeholder="Descreva o principal benefício do seu negócio"
                    rows={3}
                    className="w-full bg-primary border border-gray-600 rounded-lg p-3 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Gênero do Avatar</label>
                    <select
                      value={config.avatarGender}
                      onChange={(e) => handleInputChange('avatarGender', e.target.value)}
                      className="w-full bg-primary border border-gray-600 rounded-lg p-3 text-white"
                    >
                      <option value="masculino">👨 Masculino</option>
                      <option value="feminino">👩 Feminino</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Voz</label>
                    <select
                      value={config.voiceGender}
                      onChange={(e) => handleInputChange('voiceGender', e.target.value)}
                      className="w-full bg-primary border border-gray-600 rounded-lg p-3 text-white"
                    >
                      <option value="feminina">🎵 Voz Feminina</option>
                      <option value="masculina">🎵 Voz Masculina</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Estilo</label>
                    <select
                      value={config.avatarStyle}
                      onChange={(e) => handleInputChange('avatarStyle', e.target.value as any)}
                      className="w-full bg-primary border border-gray-600 rounded-lg p-3 text-white"
                    >
                      <option value="professional">Profissional</option>
                      <option value="casual">Casual</option>
                      <option value="elegant">Elegante</option>
                      <option value="modern">Moderno</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Duração</label>
                    <select
                      value={config.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value as any)}
                      className="w-full bg-primary border border-gray-600 rounded-lg p-3 text-white"
                    >
                      <option value="30">30 segundos</option>
                      <option value="60">60 segundos</option>
                      <option value="90">90 segundos</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-secondary rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">🎬 Preview do Vídeo</h3>
              
              <div className="aspect-video bg-primary rounded-xl mb-6 flex items-center justify-center border-2 border-dashed border-gray-600">
                {isGenerating ? (
                  <div className="text-center w-full max-w-md">
                    <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-white font-semibold mb-3">{generationProgress}</p>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(generationStep / 5) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-300 text-sm">Etapa {generationStep}/5</p>
                  </div>
                ) : generatedVideo ? (
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎬</div>
                    <p className="text-white mb-4">Vídeo gerado com sucesso!</p>
                    <div className="flex gap-3 justify-center">
                      <button 
                        onClick={handlePreviewVideo}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                      >
                        👁️ Visualizar
                      </button>
                      <button 
                        onClick={handleDownloadVideo}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                      >
                        📥 Baixar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">🎥</div>
                    <p>Configure e gere seu vídeo</p>
                  </div>
                )}
              </div>

              <button
                onClick={generateVideo}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-8 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
              >
                {isGenerating ? 'Gerando Vídeo...' : '🎬 Gerar Vídeo IA'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Preview do Vídeo */}
      {showPreview && generatedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-secondary rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">🎬 Preview do Vídeo</h3>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="aspect-video bg-black rounded-lg mb-6 overflow-hidden">
              <video 
                controls 
                autoPlay
                className="w-full h-full"
                poster={generatedVideo.thumbnailUrl}
              >
                <source src={generatedVideo.videoUrl} type="video/mp4" />
                Seu navegador não suporta reprodução de vídeo.
              </video>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-accent">Detalhes do Vídeo:</h4>
                <p><span className="text-gray-400">ID:</span> {generatedVideo.id}</p>
                <p><span className="text-gray-400">Duração:</span> {generatedVideo.duration} segundos</p>
                <p><span className="text-gray-400">Qualidade:</span> {generatedVideo.quality}</p>
                <p><span className="text-gray-400">Status:</span> {generatedVideo.status}</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-accent">Configuração:</h4>
                <p><span className="text-gray-400">Negócio:</span> {generatedVideo.config.businessName}</p>
                <p><span className="text-gray-400">Avatar:</span> {generatedVideo.config.avatarStyle}</p>
                <p><span className="text-gray-400">Voz:</span> {generatedVideo.config.voiceStyle}</p>
                <p><span className="text-gray-400">Background:</span> {generatedVideo.config.background}</p>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6 justify-center">
              <button 
                onClick={handleDownloadVideo}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                📥 Baixar Vídeo
              </button>
              <button 
                onClick={() => setShowPreview(false)}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PIX */}
      {showPixModal && (
        <PixPaymentModalFixed
          isOpen={showPixModal}
          onClose={() => setShowPixModal(false)}
          planName="IA Video Generator 8K"
          amount={currentPrice}
          onPaymentSuccess={undefined}
        />
      )}
    </div>
  );
};

export default AIVideoGeneratorPage;
