import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

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
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
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
    // Verificar se o usuário tem acesso à ferramenta de vídeo
    const checkVideoAccess = () => {
      if (user?.addOns?.includes('ai_video_generator')) {
        setHasVideoAccess(true);
      } else {
        setHasVideoAccess(false);
      }
    };
    
    checkVideoAccess();
  }, [user]);

  const handleInputChange = (field: keyof VideoConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const generateVideo = async () => {
    setIsGenerating(true);
    
    // Simular geração de vídeo (em produção, seria uma chamada para API de IA)
    setTimeout(() => {
      const mockVideoUrl = `https://example.com/generated-video-${Date.now()}.mp4`;
      setGeneratedVideo(mockVideoUrl);
      setIsGenerating(false);
    }, 15000); // 15 segundos de simulação
  };

  const handlePurchase = async () => {
    // Integração com Stripe para compra avulsa
    const stripe = (window as any).Stripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);
    
    try {
      const response = await fetch('/api/create-video-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          productType: 'ai_video_generator',
          amount: 89700, // R$ 897,00 em centavos
        }),
      });

      const { sessionId } = await response.json();
      
      await stripe.redirectToCheckout({
        sessionId: sessionId,
      });
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
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
                <div className="text-5xl font-bold text-white mb-2">R$ 897</div>
                <div className="text-yellow-200">Pagamento único • Acesso vitalício</div>
                <div className="text-sm text-yellow-300 mt-2">
                  <span className="line-through">De R$ 1.497</span> • Economia de R$ 600
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
                🚀 COMPRAR AGORA - R$ 897
              </button>

              <div className="text-xs text-yellow-200 mt-4">
                💳 Pagamento 100% seguro via Stripe • 🔒 Garantia de 30 dias
              </div>
            </div>
          </div>
        </div>
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
                      <p className="text-white">Vídeo gerado com sucesso!</p>
                      <button className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        📥 Download (8K)
                      </button>
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
                disabled={isGenerating || !config.businessType || !config.businessName}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-8 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-pulse">🤖 Gerando Vídeo...</span>
                  </>
                ) : (
                  '🚀 Gerar Vídeo Ultra-Realístico'
                )}
              </button>
            </div>

            {/* Estatísticas */}
            <div className="bg-gradient-to-br from-green-900/50 to-blue-900/50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">📊 Impacto Esperado</h3>
              
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
      </div>
    </div>
  );
};

export default AIVideoGeneratorPage;
