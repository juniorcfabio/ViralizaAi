import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import RealVideoGeneratorAI, { VideoConfig as VideoGenerationConfig, GeneratedVideoReal as GeneratedVideo } from '../../services/realVideoGeneratorAI';
import RealTimePriceSyncService from '../../services/realTimePriceSync';

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
}

const AIVideoGeneratorPage: React.FC = () => {
  const { user } = useAuth();
  const [hasVideoAccess, setHasVideoAccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [videoService] = useState(() => RealVideoGeneratorAI.getInstance());
  const [priceService] = useState(() => RealTimePriceSyncService.getInstance());
  const [currentPrice, setCurrentPrice] = useState(197.00);
  const [config, setConfig] = useState<VideoConfig>({
    businessType: '',
    businessName: '',
    targetAudience: '',
    mainMessage: '',
    callToAction: '',
    avatarStyle: 'professional',
    voiceStyle: 'friendly',
    duration: '60',
    background: 'studio'
  });

  useEffect(() => {
    const checkVideoAccess = () => {
      console.log('🔍 Verificando acesso ao vídeo para usuário:', user);
      console.log('🔍 Tipo de usuário:', user?.type);
      
      // Admin sempre tem acesso total - SEM VERIFICAÇÕES DE PAGAMENTO
      if (user?.type === 'admin') {
        setHasVideoAccess(true);
        console.log('✅ Acesso ADMIN - Total e irrestrito');
        return;
      }
      
      // Para usuários normais, verificar pagamentos e add-ons
      let hasAccess = false;
      
      if (user?.addOns?.includes('ai_video_generator') || 
          user?.addOns?.includes('ai-video-generator') ||
          user?.purchasedTools?.['ai_video_generator']?.active ||
          user?.purchasedTools?.['ai-video-generator']?.active) {
        hasAccess = true;
      }
      
      console.log('🔍 Acesso final determinado:', hasAccess);
      setHasVideoAccess(hasAccess);
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
    
    try {
      console.log('🎬 Iniciando geração REAL de vídeo...');
      
      const videoConfig: VideoGenerationConfig = {
        businessType: config.businessType,
        businessName: config.businessName,
        targetAudience: config.targetAudience,
        mainMessage: config.mainMessage,
        callToAction: config.callToAction,
        avatarStyle: config.avatarStyle,
        voiceStyle: config.voiceStyle,
        duration: config.duration,
        background: config.background
      };

      const video = await videoService.generateRealVideo(videoConfig);
      setGeneratedVideo(video);
      console.log('✅ Vídeo gerado com sucesso:', video);
      
    } catch (error) {
      console.error('❌ Erro na geração do vídeo:', error);
      alert('❌ Erro ao gerar vídeo. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewVideo = () => {
    if (!generatedVideo) return;
    setShowPreview(true);
  };

  const handleDownloadVideo = async () => {
    if (!generatedVideo) return;
    
    try {
      await videoService.downloadVideo(generatedVideo);
      alert('🎉 Vídeo baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar vídeo:', error);
      alert('❌ Erro ao baixar o vídeo. Tente novamente.');
    }
  };

  // Se não é admin e não tem acesso, mostrar página de compra
  if (user?.type !== 'admin' && !hasVideoAccess) {
    return (
      <div className="min-h-screen bg-primary text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">🎬 IA Video Generator 8K</h1>
            <p className="text-xl mb-8">Ferramenta Premium - Acesso Restrito</p>
            <div className="bg-secondary rounded-2xl p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Acesso Premium Necessário</h2>
              <p className="text-gray-300 mb-6">Esta ferramenta está disponível apenas para usuários com plano premium ou add-on específico.</p>
              <button className="bg-accent text-white px-8 py-3 rounded-lg font-bold hover:bg-accent/80">
                Ver Planos
              </button>
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
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Avatar</label>
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
                  <div className="text-center">
                    <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-300">Gerando vídeo...</p>
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
    </div>
  );
};

export default AIVideoGeneratorPage;
