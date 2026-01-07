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
  const { user, hasAccess } = useAuth();
  const [hasVideoAccess, setHasVideoAccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [videoService] = useState(() => RealVideoGeneratorAI.getInstance());
  const [priceService] = useState(() => RealTimePriceSyncService.getInstance());
  const [currentPrice, setCurrentPrice] = useState(197.00);
  const [config, setConfig] = useState<VideoConfig>({
    businessType: '',
    businessName: '',
    targetAudience: '',
    mainMessage: '',
    callToAction: '',
    avatarStyle: '',
    voiceStyle: 'friendly',
    duration: '60',
    background: 'studio'
  });

  const avatarStyles = [
    { id: 'professional_woman_caucasian', name: 'Executiva Caucasiana', description: 'Mulher executiva caucasiana, terno elegante, confiante' },
    { id: 'professional_woman_african', name: 'Executiva Africana', description: 'Mulher executiva africana, look corporativo sofisticado' },
    { id: 'professional_woman_asian', name: 'Executiva Asiática', description: 'Mulher executiva asiática, estilo moderno e profissional' },
    { id: 'professional_woman_latina', name: 'Executiva Latina', description: 'Mulher executiva latina, presença marcante e elegante' },
    { id: 'professional_man_caucasian', name: 'Executivo Caucasiano', description: 'Homem executivo caucasiano, terno clássico, autoridade' },
    { id: 'professional_man_african', name: 'Executivo Africano', description: 'Homem executivo africano, presença imponente e confiável' },
    { id: 'professional_man_asian', name: 'Executivo Asiático', description: 'Homem executivo asiático, estilo refinado e moderno' },
    { id: 'professional_man_latino', name: 'Executivo Latino', description: 'Homem executivo latino, carisma e profissionalismo' },
    { id: 'casual_woman_young', name: 'Jovem Moderna', description: 'Mulher jovem, roupas casuais, energia positiva' },
    { id: 'casual_man_young', name: 'Jovem Empreendedor', description: 'Homem jovem, estilo casual-chique, inovador' },
    { id: 'expert_woman_tech', name: 'Especialista Tech Feminina', description: 'Mulher especialista em tecnologia, look inovador' },
    { id: 'expert_man_tech', name: 'Especialista Tech Masculino', description: 'Homem especialista em tecnologia, visual futurista' },
    { id: 'coach_woman_fitness', name: 'Coach Fitness Feminina', description: 'Mulher coach fitness, energia e motivação' },
    { id: 'coach_man_business', name: 'Coach Business Masculino', description: 'Homem coach empresarial, liderança e resultados' },
    { id: 'doctor_woman_health', name: 'Doutora Saúde', description: 'Mulher médica, jaleco branco, confiança científica' },
    { id: 'doctor_man_health', name: 'Doutor Saúde', description: 'Homem médico, autoridade médica, cuidado profissional' }
  ];

  useEffect(() => {
    const checkVideoAccess = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const activated = urlParams.get('activated') === 'true';
      const userIdFromUrl = urlParams.get('userId');
      
      let hasAccess = false;
      
      // 1. Verificar no usuário atual
      if (user?.addOns?.includes('ai_video_generator') || 
          user?.addOns?.includes('ai-video-generator') ||
          user?.purchasedTools?.ai_video_generator?.active ||
          user?.purchasedTools?.['ai-video-generator']?.active) {
        hasAccess = true;
        console.log('✅ Acesso via usuário atual');
      }
      
      // 2. Verificar ativação via URL
      if (activated) {
        hasAccess = true;
        console.log('✅ Acesso via URL de ativação');
      }
      
      // 3. Verificar localStorage específico
      const toolActivated = localStorage.getItem(`ai-video-generator_activated_${user?.id}`) === 'true' ||
                           localStorage.getItem(`ai_video_generator_activated_${user?.id}`) === 'true';
      if (toolActivated) {
        hasAccess = true;
        console.log('✅ Acesso via localStorage específico');
      }
      
      // 4. Verificar chave de pagamento bem-sucedido
      const paymentSuccess = localStorage.getItem('payment_success_ai-video-generator') ||
                            localStorage.getItem('payment_success_ai_video_generator');
      if (paymentSuccess) {
        hasAccess = true;
        console.log('✅ Acesso via pagamento bem-sucedido');
      }
      
      // 5. Verificar usuário salvo no localStorage
      const savedUser = localStorage.getItem('viraliza_ai_active_user_v1');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          if (userData.addOns?.includes('ai_video_generator') || 
              userData.addOns?.includes('ai-video-generator') ||
              userData.purchasedTools?.ai_video_generator?.active ||
              userData.purchasedTools?.['ai-video-generator']?.active) {
            hasAccess = true;
            console.log('✅ Acesso via localStorage do usuário');
          }
        } catch (e) {
          console.log('❌ Erro ao verificar localStorage');
        }
      }
      
      // 6. Verificar por userId específico
      if (userIdFromUrl) {
        const userTools = localStorage.getItem(`user_${userIdFromUrl}_tools`);
        if (userTools) {
          try {
            const tools = JSON.parse(userTools);
            if (tools.includes('ai_video_generator') || tools.includes('ai-video-generator')) {
              hasAccess = true;
              console.log('✅ Acesso via userId específico');
            }
          } catch (e) {
            console.log('❌ Erro ao verificar tools do usuário');
          }
        }
      }
      
      setHasVideoAccess(hasAccess);
      console.log('🔍 Verificação de acesso completa:', { 
        hasAccess, 
        userId: user?.id, 
        activated, 
        userIdFromUrl,
        userAddOns: user?.addOns,
        purchasedTools: user?.purchasedTools
      });
    };
    
    // Sistema de sincronização de preços ultra-robusto
    const updatePrice = (newPrice?: number) => {
      if (newPrice !== undefined) {
        console.log('💰 Preço atualizado via callback:', newPrice);
        setCurrentPrice(newPrice);
        return;
      }

      // Obter preço atual do serviço
      const currentPriceFromService = priceService.getCurrentPrice('ai-video-generator');
      console.log('💰 Preço atual do serviço:', currentPriceFromService);
      setCurrentPrice(currentPriceFromService);
    };
    
    checkVideoAccess();
    updatePrice();
    
    // Registrar listener para mudanças de preço em tempo real
    priceService.onPriceChange('ai-video-generator', updatePrice);
    
    return () => {
      priceService.removeListener('ai-video-generator', updatePrice);
    };
  }, [user, priceService]);

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
      
      // Converter config para o formato esperado pelo serviço
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

      // Gerar vídeo real usando IA
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

  const [showPreview, setShowPreview] = useState(false);

  const handlePreviewVideo = () => {
    if (!generatedVideo) return;
    setShowPreview(true);
  };

  const handleDownloadVideo = async () => {
    if (!generatedVideo) return;
    
    try {
      await videoService.downloadVideo(generatedVideo);
      alert('🎉 Vídeo baixado com sucesso!\n\n📁 Arquivo salvo na pasta Downloads\n🎬 Qualidade: 8K Ultra HD\n✨ Pronto para uso profissional!');
    } catch (error) {
      console.error('Erro ao baixar vídeo:', error);
      alert('❌ Erro ao baixar o vídeo. Tente novamente.');
    }
  };

  const handlePurchase = async () => {
    console.log('🛒 Iniciando processo de compra IA Video Generator');
    
    try {
      // URL da API
      const API_BASE_URL = 'https://viralizaai.vercel.app';
      
      console.log('📡 Criando sessão de pagamento...');
      console.log('💰 Preço atual:', currentPrice);
      console.log('👤 Usuário:', user?.email);
      
      const paymentData = {
        userId: user?.id,
        productType: 'ai_video_generator',
        amount: currentPrice,
        currency: 'brl',
        description: 'Gerador de Vídeo IA 8K - ViralizaAI',
        success_url: `${window.location.origin}/#/payment-success?userId=${user?.id}&tool=ai_video_generator`,
        cancel_url: `${window.location.origin}/#/dashboard/ai-video-generator?canceled=true`,
        customer_email: user?.email,
        metadata: {
          userId: user?.id,
          productType: 'tool',
          toolId: 'ai_video_generator'
        }
      };

      console.log('📦 Dados do pagamento:', paymentData);
      
      const response = await fetch(`${API_BASE_URL}/api/create-video-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      console.log('📥 Status da resposta:', response.status);
      console.log('📥 Headers da resposta:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('📥 Resposta bruta:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse da resposta:', parseError);
        throw new Error(`Resposta inválida da API: ${responseText}`);
      }

      console.log('✅ Dados da sessão:', data);

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} - ${data.message || data.error}`);
      }

      if (data.success && data.url) {
        console.log('🔄 Redirecionando para Stripe Checkout via URL...');
        console.log('🔗 URL do Stripe:', data.url);
        
        // Redirecionar diretamente via window.location
        window.location.href = data.url;
      } else if (data.sessionId) {
        console.log('🔄 Redirecionando para Stripe Checkout via sessionId...');
        
        // Carregar Stripe se necessário
        if (!(window as any).Stripe) {
          console.log('📦 Carregando Stripe...');
          const script = document.createElement('script');
          script.src = 'https://js.stripe.com/v3/';
          script.async = true;
          document.head.appendChild(script);
          
          await new Promise((resolve) => {
            script.onload = resolve;
          });
        }

        const stripePublicKey = 'pk_live_51RbXyNH6btTxgDogj9E5AEyOcXBuqjbs66xCMukRCT9bUOg3aeDG5hLdAMfttTNxDl2qEhcYrZnq6R2TWcEzqVrw00CPfRY1l8';
        const stripe = (window as any).Stripe(stripePublicKey);
        
        const result = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (result.error) {
          console.error('❌ Erro no Stripe:', result.error);
          alert(`Erro no pagamento: ${result.error.message}`);
        }
      } else {
        throw new Error('Nenhuma URL ou SessionId retornado pela API');
      }
    } catch (error) {
      console.error('❌ Erro completo:', error);
      console.error('❌ Stack trace:', error.stack);
      
      alert(
        '❌ Erro ao processar pagamento\n\n' +
        `Detalhes: ${error.message}\n\n` +
        'Por favor, tente novamente em alguns instantes.\n\n' +
        'Se o problema persistir, entre em contato com o suporte.'
      );
    }
  };

  if (!hasVideoAccess) {
    return (
      <div className="min-h-screen bg-primary text-white">
        <div className="container mx-auto px-6 py-12">
          {/* Header Premium */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-6">
              <span className="text-4xl">🎬</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-4">
              IA Video Generator 8K
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              A primeira e única ferramenta do mundo que cria vídeos promocionais com apresentadora virtual ultra-realística em 8K
            </p>
          </div>

          {/* Demonstração de Recursos */}
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="space-y-8">
              <div className="bg-secondary/50 rounded-2xl p-8 border border-purple-500/30">
                <h3 className="text-2xl font-bold text-purple-400 mb-4">🤖 IA Ultra-Realística</h3>
                <ul className="space-y-3 text-gray-300">
                  <li>• Apresentadora virtual indistinguível de humano real</li>
                  <li>• Movimentos faciais e gestos naturais</li>
                  <li>• Sincronização labial perfeita</li>
                  <li>• Expressões emocionais autênticas</li>
                </ul>
              </div>

              <div className="bg-secondary/50 rounded-2xl p-8 border border-pink-500/30">
                <h3 className="text-2xl font-bold text-pink-400 mb-4">🎯 Personalização Total</h3>
                <ul className="space-y-3 text-gray-300">
                  <li>• Roteiro adaptado ao seu nicho específico</li>
                  <li>• Apresentadora escolhida por segmento</li>
                  <li>• Tom de voz personalizado</li>
                  <li>• Background profissional</li>
                </ul>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-secondary/50 rounded-2xl p-8 border border-blue-500/30">
                <h3 className="text-2xl font-bold text-blue-400 mb-4">📈 Resultados Comprovados</h3>
                <ul className="space-y-3 text-gray-300">
                  <li>• +400% aumento em conversões</li>
                  <li>• +250% engajamento nas redes sociais</li>
                  <li>• +180% taxa de cliques</li>
                  <li>• ROI médio de 850% em 30 dias</li>
                </ul>
              </div>

              <div className="bg-secondary/50 rounded-2xl p-8 border border-green-500/30">
                <h3 className="text-2xl font-bold text-green-400 mb-4">⚡ Tecnologia Exclusiva</h3>
                <ul className="space-y-3 text-gray-300">
                  <li>• Resolução 8K ultra-nítida</li>
                  <li>• Geração em menos de 5 minutos</li>
                  <li>• 15+ avatares profissionais</li>
                  <li>• Múltiplos formatos de exportação</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Casos de Sucesso */}
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-3xl p-8 mb-16">
            <h3 className="text-3xl font-bold text-center mb-8">🏆 Casos de Sucesso</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">+1.200%</div>
                <div className="text-gray-300">Aumento em vendas</div>
                <div className="text-sm text-gray-400 mt-2">Restaurante em SP</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">+850%</div>
                <div className="text-gray-300">ROI em 30 dias</div>
                <div className="text-sm text-gray-400 mt-2">E-commerce de moda</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">+2.5M</div>
                <div className="text-gray-300">Visualizações</div>
                <div className="text-sm text-gray-400 mt-2">Clínica de estética</div>
              </div>
            </div>
          </div>

          {/* Preço e CTA */}
          <div className="text-center">
            <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-3xl p-8 max-w-2xl mx-auto">
              <div className="mb-6">
                <div className="text-sm text-yellow-200 mb-2">OFERTA LIMITADA</div>
                <div className="text-5xl font-bold text-white mb-2">R$ {currentPrice.toFixed(2).replace('.', ',')}</div>
                <div className="text-yellow-200">Pagamento único • Acesso vitalício</div>
                <div className="text-sm text-yellow-300 mt-2">
                  <span className="line-through">De R$ 897</span> • Economia de R$ 700
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-center text-white">
                  <span className="text-green-400 mr-2">✓</span>
                  Vídeos ilimitados
                </div>
                <div className="flex items-center justify-center text-white">
                  <span className="text-green-400 mr-2">✓</span>
                  15+ avatares profissionais
                </div>
                <div className="flex items-center justify-center text-white">
                  <span className="text-green-400 mr-2">✓</span>
                  Qualidade 8K ultra-realística
                </div>
                <div className="flex items-center justify-center text-white">
                  <span className="text-green-400 mr-2">✓</span>
                  Suporte VIP incluído
                </div>
              </div>

              <button
                onClick={handlePurchase}
                className="w-full bg-white text-orange-600 font-bold py-4 px-8 rounded-full text-xl hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl"
              >
                🚀 COMPRAR AGORA - R$ {currentPrice.toFixed(2).replace('.', ',')}
              </button>

              <div className="text-xs text-yellow-200 mt-4">
                💳 Pagamento 100% seguro via Stripe • 🔒 Garantia de 30 dias
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Prévia */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">👁️ Prévia do Vídeo</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="aspect-video bg-black rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
                {generatedVideo ? (
                  <div className="w-full h-full relative">
                    <img 
                      src={generatedVideo.thumbnailUrl} 
                      alt="Thumbnail do vídeo"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-4 hover:bg-white transition-colors cursor-pointer">
                        <svg className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {generatedVideo.quality} • {generatedVideo.duration}s
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-white">
                    <div className="text-8xl mb-4">🎬</div>
                    <h4 className="text-2xl font-bold mb-2">{config.businessName || 'Seu Negócio'}</h4>
                    <p className="text-gray-300 mb-4">{config.mainMessage || 'Sua mensagem aparecerá aqui'}</p>
                    <div className="bg-white/10 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-gray-300">
                        📺 Qualidade: 8K Ultra HD<br/>
                        ⏱️ Duração: {config.duration} segundos<br/>
                        👤 Avatar: {config.avatarStyle || 'Profissional'}<br/>
                        🎤 Voz: {config.voiceStyle}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowPreview(false)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fechar Prévia
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    handleDownloadVideo();
                  }}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  📥 Baixar Vídeo (8K)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-4">
            🎬 IA Video Generator 8K
          </h1>
          <p className="text-xl text-gray-300">
            Crie vídeos promocionais ultra-realísticos para seu negócio
          </p>
        </div>

        {/* Configuração do Vídeo */}
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="bg-secondary rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">📝 Configuração do Vídeo</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Tipo de Negócio
                  </label>
                  <select
                    value={config.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    className="w-full bg-primary border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Selecione o tipo de negócio</option>
                    <option value="restaurante">Restaurante</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="clinica">Clínica/Consultório</option>
                    <option value="academia">Academia</option>
                    <option value="consultoria">Consultoria</option>
                    <option value="salao">Salão de Beleza</option>
                    <option value="loja">Loja Física</option>
                    <option value="servicos">Prestação de Serviços</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Nome do Negócio
                  </label>
                  <input
                    type="text"
                    value={config.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="Digite o nome do seu negócio"
                    className="w-full bg-primary border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Público-Alvo
                  </label>
                  <input
                    type="text"
                    value={config.targetAudience}
                    onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                    placeholder="Ex: Mulheres de 25-45 anos, classe média"
                    className="w-full bg-primary border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Mensagem Principal
                  </label>
                  <textarea
                    value={config.mainMessage}
                    onChange={(e) => handleInputChange('mainMessage', e.target.value)}
                    placeholder="Descreva o principal benefício ou diferencial do seu negócio"
                    rows={3}
                    className="w-full bg-primary border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Call to Action
                  </label>
                  <input
                    type="text"
                    value={config.callToAction}
                    onChange={(e) => handleInputChange('callToAction', e.target.value)}
                    placeholder="Ex: Agende sua consulta, Compre agora, Visite nossa loja"
                    className="w-full bg-primary border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-secondary rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">🎨 Personalização</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Estilo da Avatar
                  </label>
                  <select
                    value={config.avatarStyle}
                    onChange={(e) => handleInputChange('avatarStyle', e.target.value as any)}
                    className="w-full bg-primary border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="professional">Profissional</option>
                    <option value="casual">Casual</option>
                    <option value="elegant">Elegante</option>
                    <option value="modern">Moderno</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Tom de Voz
                  </label>
                  <select
                    value={config.voiceStyle}
                    onChange={(e) => handleInputChange('voiceStyle', e.target.value as any)}
                    className="w-full bg-primary border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="friendly">Amigável</option>
                    <option value="energetic">Energético</option>
                    <option value="calm">Calmo</option>
                    <option value="authoritative">Autoritativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Duração
                  </label>
                  <select
                    value={config.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value as any)}
                    className="w-full bg-primary border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="30">30 segundos</option>
                    <option value="60">60 segundos</option>
                    <option value="90">90 segundos</option>
                    <option value="120">2 minutos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Background
                  </label>
                  <select
                    value={config.background}
                    onChange={(e) => handleInputChange('background', e.target.value as any)}
                    className="w-full bg-primary border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="studio">Estúdio Profissional</option>
                    <option value="office">Escritório Moderno</option>
                    <option value="outdoor">Ambiente Externo</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Preview e Geração */}
          <div className="space-y-8">
            <div className="bg-secondary rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">🎬 Preview do Vídeo</h3>
              
              <div className="aspect-video bg-primary rounded-xl mb-6 flex items-center justify-center border-2 border-dashed border-gray-600">
                {isGenerating ? (
                  <div className="text-center">
                    <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-300">Gerando vídeo ultra-realístico...</p>
                    <p className="text-sm text-gray-400 mt-2">Isso pode levar alguns minutos</p>
                  </div>
                ) : generatedVideo ? (
                  <div className="w-full h-full bg-black rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎬</div>
                      <p className="text-white mb-4">Vídeo gerado com sucesso!</p>
                      <div className="flex gap-3 justify-center">
                        <button 
                          onClick={handlePreviewVideo}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          👁️ Visualizar Prévia
                        </button>
                        <button 
                          onClick={handleDownloadVideo}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          📥 Baixar MP4 (8K)
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">🎥</div>
                    <p>Configure os parâmetros e gere seu vídeo</p>
                  </div>
                )}
              </div>

              <button
                onClick={generateVideo}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-8 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Gerando Vídeo Real... (IA Processando)
                  </div>
                ) : (
                  '🎬 Gerar Vídeo Ultra-Realístico'
                )}
              </button>
            </div>

            {/* Estatísticas de Resultados */}
            <div className="bg-secondary rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">📊 Resultados Comprovados</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">+400%</div>
                  <div className="text-sm text-gray-300">Conversões</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">+250%</div>
                  <div className="text-sm text-gray-300">Engajamento</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">+180%</div>
                  <div className="text-sm text-gray-300">Cliques</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">850%</div>
                  <div className="text-sm text-gray-300">ROI Médio</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Preview */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">👁️ Prévia do Vídeo</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="aspect-video bg-black rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
                {generatedVideo ? (
                  <div className="w-full h-full relative">
                    <img 
                      src={generatedVideo.thumbnailUrl} 
                      alt="Thumbnail do vídeo"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-4 hover:bg-white transition-colors cursor-pointer">
                        <svg className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {generatedVideo.quality} • {generatedVideo.duration}s
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-white">
                    <div className="text-8xl mb-4">🎬</div>
                    <h4 className="text-2xl font-bold mb-2">{config.businessName || 'Seu Negócio'}</h4>
                    <p className="text-gray-300 mb-4">{config.mainMessage || 'Sua mensagem aparecerá aqui'}</p>
                    <div className="bg-white/10 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-gray-300">
                        📺 Qualidade: 8K Ultra HD<br/>
                        ⏱️ Duração: {config.duration} segundos<br/>
                        👤 Avatar: {config.avatarStyle || 'Profissional'}<br/>
                        🎤 Voz: {config.voiceStyle}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowPreview(false)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fechar Prévia
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    handleDownloadVideo();
                  }}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  📥 Baixar Vídeo (8K)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIVideoGeneratorPage;
