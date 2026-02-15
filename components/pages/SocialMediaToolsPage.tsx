// =======================
// 🔐 PÁGINA SEGURA DE FERRAMENTAS SOCIAIS
// =======================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { useCentralizedPricing } from '../../services/centralizedPricingService';
import openaiService from '../../services/openaiService';
import { supabase } from '../../src/lib/supabase';
import PixPaymentSecure from '../ui/PixPaymentSecure';

// Ícones
const ScheduleIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const VideoIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const HashtagIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const BotIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const MusicIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
);

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  requiredPlan: string;
  onClick: () => void;
  onUpgrade?: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon, available, requiredPlan, onClick, onUpgrade }) => (
  <div 
    className={`p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
      available 
        ? 'border-blue-200 bg-white hover:border-blue-400 hover:shadow-lg' 
        : 'border-orange-200 bg-orange-50 hover:border-orange-400 hover:shadow-lg'
    }`}
    onClick={available ? onClick : onUpgrade}
  >
    <div className="flex items-center mb-4">
      <div className={`p-3 rounded-lg ${available ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
        {icon}
      </div>
      <div className="ml-4">
        <h3 className={`text-lg font-semibold ${available ? 'text-gray-900' : 'text-gray-700'}`}>
          {title}
        </h3>
        {!available && (
          <span className="text-sm text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded-full">
            Requer plano {requiredPlan}+ - Clique para assinar
          </span>
        )}
      </div>
    </div>
    <p className={`text-sm ${available ? 'text-gray-600' : 'text-gray-600'}`}>
      {description}
    </p>
    {!available && (
      <div className="mt-4 pt-4 border-t border-orange-200 space-y-2">
        <button 
          onClick={onUpgrade}
          className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium"
        >
          💳 Upgrade com Cartão
        </button>
        <button 
          onClick={() => {
            // Trigger PIX modal - será implementado no componente pai
            const event = new CustomEvent('openPixUpgrade', { 
              detail: { requiredPlan } 
            });
            window.dispatchEvent(event);
          }}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          🏦 Upgrade com PIX
        </button>
      </div>
    )}
  </div>
);

const SocialMediaToolsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('automation');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{name: string, price: number, type: string} | null>(null);

  const userPlan = user?.plan || 'mensal';
  const isAdmin = window.location.pathname.includes('/admin') || window.location.hash.includes('/admin');

  // Função para salvar resultados no Supabase
  const saveToSupabase = async (toolAction: string, content: any, success: boolean) => {
    try {
      await supabase.from('generated_content').insert({
        user_id: user?.id,
        content_type: 'social_tool_result',
        title: `Resultado: ${toolAction}`,
        content: {
          tool_action: toolAction,
          result: content,
          generated_at: new Date().toISOString(),
          success
        },
        metadata: {
          user_plan: userPlan,
          is_admin: isAdmin,
          tool_category: activeTab
        }
      });
      console.log('✅ Resultado salvo no Supabase:', toolAction);
    } catch (error) {
      console.error('❌ Erro ao salvar no Supabase:', error);
    }
  };

  // Listener para evento PIX
  useEffect(() => {
    const handlePixUpgrade = async (event: CustomEvent) => {
      const { requiredPlan } = event.detail;
      
      // 🔥 BUSCAR PREÇOS EM TEMPO REAL DO SUPABASE
      const { data: pricingData } = await supabase
        .from('pricing_config')
        .select('*')
        .eq('category', 'subscription')
        .eq('is_active', true);
      
      const planPrices = Object.fromEntries(
        (pricingData || []).map(p => [
          p.plan_id,
          { price: parseFloat(p.price), name: p.name }
        ])
      );
      
      const planInfo = planPrices[requiredPlan];
      if (planInfo) {
        setSelectedPlan({
          name: planInfo.name,
          price: planInfo.price,
          type: requiredPlan
        });
        setShowPixModal(true);
      }
    };

    window.addEventListener('openPixUpgrade', handlePixUpgrade as EventListener);
    return () => window.removeEventListener('openPixUpgrade', handlePixUpgrade as EventListener);
  }, []);

  // Detectar retorno do pagamento Stripe e ativar plano
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const planName = urlParams.get('plan');

    if (paymentStatus === 'success' && planName && user) {
      console.log('🎉 Pagamento aprovado! Ativando plano:', planName);
      
      // Normalizar nome do plano
      let normalizedPlan = 'mensal';
      const lowerPlan = planName.toLowerCase();
      if (lowerPlan.includes('trimestral')) normalizedPlan = 'trimestral';
      else if (lowerPlan.includes('semestral')) normalizedPlan = 'semestral';
      else if (lowerPlan.includes('anual')) normalizedPlan = 'anual';

      // Ativar plano imediatamente
      updateUser(user.id, { plan: normalizedPlan });
      setPaymentSuccess(true);

      // Limpar URL
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);

      // Mostrar notificação de sucesso
      setTimeout(() => {
        alert(`🎉 Pagamento aprovado! Seu plano ${planName} foi ativado com sucesso. Agora você tem acesso a todas as ferramentas do plano!`);
      }, 500);
    }
  }, [user, updateUser]);

  const toolCategories = {
    automation: {
      title: '🤖 Automação Inteligente',
      tools: [
        {
          id: 'scheduler',
          title: 'Agendamento Multiplataforma',
          description: 'Poste simultaneamente em Instagram, TikTok, Facebook, Twitter, Threads e Telegram com ajustes automáticos de formato.',
          icon: <ScheduleIcon />,
          requiredPlan: 'mensal',
          action: 'scheduleContent'
        },
        {
          id: 'ai_copy',
          title: 'IA de Copywriting',
          description: 'Geração automática de legendas otimizadas com gatilhos mentais, CTAs e storytelling para cada plataforma.',
          icon: <VideoIcon />,
          requiredPlan: 'trimestral',
          action: 'generateCopy'
        },
        {
          id: 'translation',
          title: 'Tradução Automática Global',
          description: 'Adapte posts para 12+ idiomas com insights culturais e hashtags localizadas para mercados globais.',
          icon: <HashtagIcon />,
          requiredPlan: 'anual',
          action: 'translateContent'
        }
      ]
    },
    media: {
      title: '🎬 Criação de Mídia',
      tools: [
        {
          id: 'video_editor',
          title: 'Editor de Vídeo IA',
          description: 'Edição automática com IA avançada',
          icon: <VideoIcon />,
          requiredPlan: 'mensal',
          action: 'editVideo'
        },
        {
          id: 'animations',
          title: 'Gerador de Animações',
          description: 'Animações 3D/2D profissionais',
          icon: <VideoIcon />,
          requiredPlan: 'mensal',
          action: 'generateAnimation'
        },
        {
          id: 'music_ai',
          title: 'Banco de Música IA',
          description: 'Músicas originais geradas por IA',
          icon: <MusicIcon />,
          requiredPlan: 'mensal',
          action: 'generateMusic'
        },
        {
          id: 'thumbnails',
          title: 'Criador de miniaturas',
          description: 'Miniaturas que aumentam cliques',
          icon: <VideoIcon />,
          requiredPlan: 'mensal',
          action: 'generateThumbnails'
        }
      ]
    },
    engagement: {
      title: '🚀 Engajamento Orgânico',
      tools: [
        {
          id: 'hashtags',
          title: 'Hashtags Inteligentes',
          description: 'Análise em tempo real das hashtags mais virais e relevantes para cada nicho e plataforma.',
          icon: <HashtagIcon />,
          requiredPlan: 'mensal',
          action: 'generateHashtags'
        },
        {
          id: 'chatbots',
          title: 'Chatbots para DMs/Telegram',
          description: 'Atendimento automático, envio de promoções e captura de leads com IA conversacional.',
          icon: <BotIcon />,
          requiredPlan: 'semestral',
          action: 'createChatbot'
        },
        {
          id: 'gamification',
          title: 'Gamificação de Posts',
          description: 'Quizzes, enquetes e desafios interativos que aumentam retenção e viralização.',
          icon: <AnalyticsIcon />,
          requiredPlan: 'anual',
          action: 'createGamification'
        }
      ]
    },
    analytics: {
      title: '📊 Análise e Crescimento',
      tools: [
        {
          id: 'dashboard',
          title: 'Dashboard Unificado',
          description: 'Métricas de todas as redes em um painel: alcance, cliques, vendas e ROI em tempo real.',
          icon: <AnalyticsIcon />,
          requiredPlan: 'anual',
          action: 'showDashboard'
        },
        {
          id: 'trends',
          title: 'Detector de Tendências',
          description: 'Análise de tópicos virais em tempo real para criar conteúdo oportuno e relevante.',
          icon: <AnalyticsIcon />,
          requiredPlan: 'trimestral',
          action: 'detectTrends'
        },
        {
          id: 'competitor',
          title: 'Análise de Concorrência',
          description: 'Monitoramento de posts e campanhas de competidores com insights estratégicos.',
          icon: <AnalyticsIcon />,
          requiredPlan: 'trimestral',
          action: 'analyzeCompetitors'
        }
      ]
    },
    monetization: {
      title: '💰 Monetização Automática',
      tools: [
        {
          id: 'sales_links',
          title: 'Links de Vendas Automáticos',
          description: 'Integração com marketplaces e lojas virtuais com tracking completo de conversões.',
          icon: <AnalyticsIcon />,
          requiredPlan: 'anual',
          action: 'generateSalesLinks'
        },
        {
          id: 'lead_capture',
          title: 'Captura de Leads',
          description: 'Formulários inteligentes embutidos em posts e stories com automação de follow-up.',
          icon: <BotIcon />,
          requiredPlan: 'semestral',
          action: 'setupLeadCapture'
        },
        {
          id: 'remarketing',
          title: 'Remarketing Social',
          description: 'Anúncios automáticos para quem interagiu com posts, otimizados por IA.',
          icon: <AnalyticsIcon />,
          requiredPlan: 'anual',
          action: 'setupRemarketing'
        }
      ]
    }
  };

  const isToolAvailable = (requiredPlan: string): boolean => {
    const planHierarchy = { mensal: 1, trimestral: 2, semestral: 3, anual: 4 };
    return planHierarchy[userPlan] >= planHierarchy[requiredPlan];
  };

  // Função segura para processar checkout de plano específico
  const handleSecureCheckout = async (requiredPlan: string) => {
    try {
      console.log('🚀 SocialMediaTools - Redirecionando para checkout do plano:', requiredPlan);
      
      const appBaseUrl = window.location.origin;

      // 🔥 BUSCAR PREÇOS EM TEMPO REAL DO SUPABASE
      const { data: pricingData } = await supabase
        .from('pricing_config')
        .select('*')
        .eq('category', 'subscription')
        .eq('is_active', true);
      
      const planPrices = Object.fromEntries(
        (pricingData || []).map(p => [
          p.plan_id,
          { price: parseFloat(p.price), name: p.name }
        ])
      );

      const planInfo = planPrices[requiredPlan];
      if (!planInfo) {
        alert('Plano não encontrado. Tente novamente.');
        return;
      }

      // Usar a API funcional stripe-test
      const paymentData = {
        planName: `Assinatura ${planInfo.name} - ViralizaAI`,
        amount: Math.round(planInfo.price * 100), // Converter para centavos
        successUrl: `${appBaseUrl}/#/dashboard/social-tools?payment=success&plan=${encodeURIComponent(planInfo.name)}`,
        cancelUrl: `${appBaseUrl}/#/dashboard/social-tools?payment=cancelled`
      };

      console.log('📋 Dados da assinatura SocialTools:', paymentData);
      
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

    } catch (error: any) {
      console.error('❌ Erro ao processar checkout do plano:', error);
      const msg = error?.message || '';
      if (msg.includes('Expired') || msg.includes('expired') || msg.includes('api_key')) {
        alert('Chave Stripe expirada. O administrador precisa atualizar STRIPE_SECRET_KEY no Vercel.\n\nUse PIX enquanto isso.');
      } else {
        alert('Erro ao processar pagamento. Tente novamente ou use PIX.');
      }
    }
  };

  const handleToolAction = useCallback(async (action: string, toolId: string) => {
    // Encontrar a ferramenta para verificar se está disponível
    const currentCategory = toolCategories[activeTab];
    const tool = currentCategory.tools.find(t => t.action === action);
    
    if (!tool) {
      alert('Ferramenta não encontrada.');
      return;
    }

    // Validar acesso ao plano
    const planHierarchy = { mensal: 1, trimestral: 2, semestral: 3, anual: 4 };
    const userLevel = planHierarchy[userPlan] || 0;
    const requiredLevel = planHierarchy[tool.requiredPlan] || 0;
    
    if (userLevel < requiredLevel && !isAdmin) {
      const confirmUpgrade = confirm(
        `Esta ferramenta requer o plano ${tool.requiredPlan}.\n\n` +
        `Você será redirecionado para o checkout seguro.\n\n` +
        `Deseja continuar?` 
      );
      
      if (confirmUpgrade) {
        await handleSecureCheckout(tool.requiredPlan);
      }
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      // Log da ação
      console.log('🚀 Iniciando ferramenta:', { action, toolId, userPlan, isAdmin });

      let result;
      
      switch (action) {
        case 'scheduleContent':
          try {
            const scheduleContent = await openaiService.generate('copywriting',
              `Crie 3 posts otimizados para agendamento simultâneo em Instagram, TikTok e Facebook.\n\nPara cada plataforma, inclua:\n- Legenda otimizada (com emojis, hashtags, CTA)\n- Melhor horário para publicar\n- Formato ideal (carrossel, reels, stories)\n- Tamanho de imagem recomendado\n\nNicho: Marketing Digital. Tom: profissional mas engajante.`
            );
            result = { success: true, data: { content: scheduleContent }, message: 'Conteúdo para agendamento gerado com IA' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'generateCopy':
          try {
            const copyContent = await openaiService.generateCopywriting(
              user?.name || 'Meu Negócio',
              'Instagram',
              'Gerar engajamento e conversões',
              'Empreendedores e pequenas empresas'
            );
            result = { success: true, data: { content: copyContent }, message: 'Copy gerada com IA real' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'translateContent':
          try {
            const translated = await openaiService.translateContent(
              'Transforme seu negócio com estratégias de marketing digital! Descubra como crescer nas redes sociais com ferramentas de IA.',
              'English, Spanish, French',
              'Marketing digital para empreendedores'
            );
            result = { success: true, data: { content: translated }, message: 'Tradução gerada com IA real' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'editVideo':
          try {
            const videoScript = await openaiService.generate('scripts',
              `Crie um roteiro completo de vídeo de 30 segundos sobre marketing digital.\n\nInclua:\n- Storyboard (cena por cena com descrição visual)\n- Narração/falas\n- Música sugerida\n- Efeitos visuais\n- Texto na tela\n- Transições recomendadas\n- Duração de cada cena`
            );
            result = { success: true, data: { content: videoScript }, message: 'Roteiro de vídeo gerado com IA' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'generateAnimation':
          try {
            const animScript = await openaiService.generate('scripts',
              `Crie um briefing completo para animação promocional.\n\nInclua:\n- Conceito visual\n- Estilo de animação (2D/3D/motion graphics)\n- Paleta de cores\n- Sequência de cenas\n- Texto animado\n- Duração sugerida\n- Referências visuais\n- Música/efeitos sonoros`
            );
            result = { success: true, data: { content: animScript }, message: 'Briefing de animação gerado com IA' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'generateMusic':
          try {
            const musicBrief = await openaiService.generate('general',
              `Crie uma descrição detalhada de música para vídeo de marketing digital (30 segundos).\n\nInclua:\n- Gênero musical recomendado\n- BPM (batidas por minuto)\n- Humor/atmosfera\n- Instrumentos sugeridos\n- Estrutura (intro, desenvolvimento, clímax)\n- Licenciamento: sugira 3 músicas royalty-free similares de bibliotecas como Epidemic Sound, Artlist ou YouTube Audio Library\n- Links de referência`
            );
            result = { success: true, data: { content: musicBrief }, message: 'Briefing musical gerado com IA' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'generateThumbnails':
          try {
            const thumbResponse = await fetch(`${window.location.origin}/api/ai-image`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: 'Como Viralizar no TikTok - thumbnail para YouTube, cores vibrantes, texto bold, profissional',
                style: 'thumbnail',
                size: '1024x1024',
                quality: 'standard'
              })
            });
            const thumbData = await thumbResponse.json();
            if (thumbData.success) {
              result = { success: true, data: { content: `\n\n✨ Thumbnail gerada com DALL-E 3:\n${thumbData.imageUrl}\n\nPrompt revisado: ${thumbData.revisedPrompt || ''}` }, message: 'Thumbnail gerada com DALL-E 3' };
            } else {
              result = { success: false, message: thumbData.error || 'Erro ao gerar thumbnail' };
            }
          } catch (e: any) {
            result = { success: false, message: `Erro: ${e.message}` };
          }
          break;
          
        case 'generateHashtags':
          try {
            const hashtags = await openaiService.generateHashtags(
              'marketing digital',
              'Instagram',
              'post educativo'
            );
            result = { success: true, data: { content: hashtags }, message: 'Hashtags geradas com IA real' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'createChatbot':
          try {
            const chatbot = await openaiService.generate('general',
              `Crie um chatbot completo para atendimento automático via DM/Telegram para um negócio de marketing digital.\n\nInclua:\n- Mensagem de boas-vindas\n- 10 perguntas frequentes com respostas\n- Fluxo de captura de leads (nome, email, telefone)\n- Mensagens de promoção\n- Respostas para objeções comuns\n- Fluxo de agendamento\n- Mensagem de fallback\n- Gatilhos de palavras-chave\n\nFormate como fluxograma de conversação.`
            );
            result = { success: true, data: { content: chatbot }, message: 'Chatbot gerado com IA' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'createGamification':
          try {
            const quiz = await openaiService.generate('general',
              `Crie conteúdo gamificado completo para redes sociais de marketing digital.\n\nInclua:\n1. Quiz: "Qual seu perfil de empreendedor?" (10 perguntas com 4 opções cada + 4 resultados possíveis)\n2. Desafio de 7 dias para engajamento\n3. Enquete interativa (5 enquetes prontas)\n4. Sistema de pontos e recompensas\n5. Ranking de engajamento\n\nFormate tudo pronto para copiar e usar.`
            );
            result = { success: true, data: { content: quiz }, message: 'Gamificação gerada com IA' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'showDashboard':
          try {
            const dashInsights = await openaiService.generate('trends',
              `Gere um relatório de insights de mídias sociais para um negócio de marketing digital.\n\nPlataformas: Instagram, TikTok, Facebook, Twitter\n\nInclua:\n- Métricas-chave para acompanhar (KPIs)\n- Benchmarks do setor para cada plataforma\n- Análise de melhor horário para publicar\n- Tipos de conteúdo com maior ROI\n- Estratégias de crescimento para cada plataforma\n- Metas sugeridas para 30/60/90 dias\n- Template de relatório semanal`
            );
            result = { success: true, data: { content: dashInsights }, message: 'Insights do dashboard gerados com IA' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'detectTrends':
          try {
            const trends = await openaiService.analyzeTrends('marketing digital', 'Instagram');
            result = { success: true, data: { content: trends }, message: 'Tendências analisadas com IA real' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'generateSalesLinks':
          try {
            const salesCopy = await openaiService.generate('funnel',
              `Crie uma estratégia completa de links de vendas para um negócio digital.\n\nProdutos:\n1. Curso de Marketing Digital - R$197\n2. Consultoria 1:1 - R$497\n\nInclua:\n- Copy de venda para cada produto\n- Estrutura da página de vendas\n- Sequência de emails (5 emails)\n- CTAs otimizados\n- Estratégia de upsell/downsell\n- Textos para links na bio\n- Modelo de link tree otimizado`
            );
            result = { success: true, data: { content: salesCopy }, message: 'Estratégia de vendas gerada com IA' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'setupLeadCapture':
          try {
            const leadStrategy = await openaiService.generate('funnel',
              `Crie uma estratégia completa de captura de leads para marketing digital.\n\nInclua:\n- 3 modelos de popup (headline + copy + CTA)\n- 5 ideias de lead magnet (ebook, checklist, webinar, etc.)\n- Sequência de nurturing (7 emails)\n- Campos do formulário otimizados\n- Integrações recomendadas (Mailchimp, HubSpot, etc.)\n- Estratégia de segmentação\n- A/B tests sugeridos\n- Métricas de acompanhamento`
            );
            result = { success: true, data: { content: leadStrategy }, message: 'Estratégia de leads gerada com IA' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'setupRemarketing':
          try {
            const remarketing = await openaiService.generate('general',
              `Crie uma estratégia completa de remarketing para negócio digital.\n\nAudiência: 1000 visitantes, interesses em marketing e negócios.\n\nInclua:\n- Segmentos de audiência (quente, morna, fria)\n- Copy de anúncios para cada segmento (5 variações)\n- Estratégia de retargeting por plataforma\n- Orçamento sugerido (diário/mensal)\n- Frequência ideal de exibição\n- Públicos lookalike\n- Métricas de acompanhamento (CPA, ROAS, CTR)\n- Sequência de anúncios (7 dias)`
            );
            result = { success: true, data: { content: remarketing }, message: 'Estratégia de remarketing gerada com IA' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'analyzeCompetitors':
          try {
            const analysis = await openaiService.generate('trends',
              `Analise a estratégia de concorrentes no nicho de marketing digital nas plataformas Instagram e TikTok.\n\nForneça:\n1. Estratégias mais comuns dos top players\n2. Tipos de conteúdo que mais engajam\n3. Frequência ideal de postagem\n4. Oportunidades não exploradas\n5. Recomendações para se diferenciar`
            );
            result = { success: true, data: { content: analysis }, message: 'Análise gerada com IA real' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        default:
          result = { success: false, message: 'Ação não implementada' };
      }
      
      setResults(result);
      
      // Salvar resultado no Supabase
      await saveToSupabase(action, result, result.success);
      
    } catch (error: any) {
      console.error('❌ Erro na ferramenta:', error);
      const errorResult = { success: false, message: error.message };
      setResults(errorResult);
      
      // Salvar erro no Supabase
      await saveToSupabase(action, errorResult, false);
    } finally {
      setLoading(false);
    }
  }, [user, activeTab, userPlan, isAdmin, saveToSupabase]);

  const tabs = Object.keys(toolCategories);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 Ferramentas de Mídia Social
          </h1>
          <p className="text-gray-600 mb-4">
            Ferramentas altamente técnicas e estratégicas para crescimento orgânico e monetização
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <span className="text-blue-600 font-semibold">
                  {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Seu plano atual:</strong> {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
                </p>
                <p className="text-xs text-blue-600">
                  Upgrade para acessar mais ferramentas avançadas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {toolCategories[tab].title}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {toolCategories[activeTab].tools.map((tool) => (
            <ToolCard
              key={tool.id}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              available={isToolAvailable(tool.requiredPlan)}
              requiredPlan={tool.requiredPlan}
              onClick={() => handleToolAction(tool.action, tool.id)}
              onUpgrade={() => handleSecureCheckout(tool.requiredPlan)}
            />
          ))}
        </div>

        {/* Results */}
        {loading && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Processando...</span>
            </div>
          </div>
        )}

        {results && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">
              {results.success ? '✅ Resultado' : '❌ Erro'}
            </h3>
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}

        {/* Platform Support */}
        <div className="bg-white rounded-xl p-6 shadow-sm mt-8">
          <h3 className="text-lg font-semibold mb-4">🌍 Plataformas Suportadas</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['Instagram', 'TikTok', 'Facebook', 'Twitter (X)', 'Threads', 'Telegram'].map((platform) => (
              <div key={platform} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">
                  {platform === 'Instagram' && '📷'}
                  {platform === 'TikTok' && '🎵'}
                  {platform === 'Facebook' && '👥'}
                  {platform === 'Twitter (X)' && '🐦'}
                  {platform === 'Threads' && '🧵'}
                  {platform === 'Telegram' && '✈️'}
                </div>
                <span className="text-sm font-medium text-gray-700">{platform}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
            <h4 className="text-lg font-semibold mb-2">Influencers</h4>
            <p className="text-sm opacity-90">Crescimento orgânico acelerado e engajamento real</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
            <h4 className="text-lg font-semibold mb-2">Lojas Virtuais</h4>
            <p className="text-sm opacity-90">Aumento exponencial de vendas com automação</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
            <h4 className="text-lg font-semibold mb-2">Prestadores</h4>
            <p className="text-sm opacity-90">Captação de clientes via bots e conteúdos</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl">
            <h4 className="text-lg font-semibold mb-2">Marcas Globais</h4>
            <p className="text-sm opacity-90">Adaptação cultural e linguística instantânea</p>
          </div>
        </div>
      </div>

      {/* Modal PIX Seguro */}
      {showPixModal && selectedPlan && (
        <PixPaymentSecure
          isOpen={showPixModal}
          onClose={() => {
            setShowPixModal(false);
            setSelectedPlan(null);
          }}
          planName={selectedPlan.name}
          planSlug={selectedPlan.type || selectedPlan.name.toLowerCase()}
          amount={selectedPlan.price}
        />
      )}
    </div>
  );
};

export default SocialMediaToolsPage;
