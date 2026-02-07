// =======================
// 🔐 PÁGINA SEGURA DE FERRAMENTAS SOCIAIS
// =======================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import SecureAPIClient from '../../services/apiClient';
import SecurityService from '../../services/securityService';
import StripeService from '../../services/stripeService';

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
      <div className="mt-4 pt-4 border-t border-orange-200">
        <button className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium">
          🚀 Fazer Upgrade para {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
        </button>
      </div>
    )}
  </div>
);

const SocialMediaToolsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('automation');
  const [apiClient] = useState(() => SecureAPIClient.getInstance());
  const [securityService] = useState(() => SecurityService.getInstance());
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [csrfToken] = useState(() => SecurityService.getInstance().generateCSRFToken());

  const userPlan = user?.plan || 'mensal';
  const isAdmin = window.location.pathname.includes('/admin') || window.location.hash.includes('/admin');

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
      
      const stripeService = StripeService.getInstance();
      const appBaseUrl = window.location.origin;

      // Mapear planos para preços
      const planPrices = {
        'mensal': { price: 59.90, name: 'Mensal' },
        'trimestral': { price: 159.90, name: 'Trimestral' },
        'semestral': { price: 259.90, name: 'Semestral' },
        'anual': { price: 399.90, name: 'Anual' }
      };

      const planInfo = planPrices[requiredPlan];
      if (!planInfo) {
        alert('Plano não encontrado. Tente novamente.');
        return;
      }

      // Determinar ciclo de cobrança
      let billingCycle: 'monthly' | 'quarterly' | 'semiannual' | 'annual' = 'monthly';
      if (requiredPlan === 'trimestral') billingCycle = 'quarterly';
      else if (requiredPlan === 'semestral') billingCycle = 'semiannual';
      else if (requiredPlan === 'anual') billingCycle = 'annual';

      const subscriptionData = {
        mode: 'subscription',
        line_items: [{
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Assinatura ${planInfo.name} - ViralizaAI`
            },
            unit_amount: Math.round(planInfo.price * 100),
            recurring: {
              interval: billingCycle === 'monthly' ? 'month' : 
                       billingCycle === 'quarterly' ? 'month' :
                       billingCycle === 'semiannual' ? 'month' :
                       'year'
            }
          },
          quantity: 1
        }],
        success_url: `${appBaseUrl}/#/dashboard/social-tools?payment=success&plan=${encodeURIComponent(planInfo.name)}`,
        cancel_url: `${appBaseUrl}/#/dashboard/social-tools?payment=cancelled`,
        customer_email: user?.email || 'usuario@viralizaai.com',
        metadata: {
          productType: 'subscription',
          planName: planInfo.name,
          planId: requiredPlan,
          source: 'social_tools',
          billingCycle: billingCycle
        }
      };

      console.log('📋 Dados da assinatura (SocialTools):', subscriptionData);
      await stripeService.processSubscriptionPayment(subscriptionData);

    } catch (error) {
      console.error('❌ Erro ao processar checkout do plano:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    }
  };

  const handleToolAction = useCallback(async (action: string, toolId: string) => {
    // Validações de segurança
    if (!securityService.checkRateLimit(`${user?.id}_${action}`)) {
      alert('Muitas requisições. Aguarde um momento.');
      return;
    }

    // Encontrar a ferramenta para verificar se está disponível
    const currentCategory = toolCategories[activeTab];
    const tool = currentCategory.tools.find(t => t.action === action);
    
    if (!tool) {
      securityService.logSecurityEvent('tool_not_found', { action, toolId }, 'medium');
      alert('Ferramenta não encontrada.');
      return;
    }

    // Validar acesso ao plano
    const planValidation = await apiClient.validatePlan(tool.requiredPlan);
    if (!planValidation.success || !planValidation.data?.hasAccess) {
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
      securityService.logSecurityEvent('tool_action_started', { 
        action, 
        toolId, 
        userPlan,
        isAdmin 
      }, 'low');

      let result;
      
      switch (action) {
        case 'scheduleContent':
          result = await apiClient.callToolAPI(action, {
            text: 'Conteúdo de exemplo para agendamento',
            scheduledTime: new Date(Date.now() + 3600000).toISOString(),
            platforms: ['Instagram', 'TikTok', 'Facebook'],
            csrfToken
          });
          break;
          
        case 'generateCopy':
          result = await apiClient.callToolAPI(action, {
            prompt: 'Dicas de marketing digital para pequenas empresas',
            platform: 'Instagram',
            csrfToken
          });
          break;
          
        case 'translateContent':
          result = await apiClient.callToolAPI(action, {
            content: 'Transforme seu negócio com estratégias de marketing digital!',
            targetLanguages: ['en', 'es', 'fr'],
            csrfToken
          });
          break;
          
        case 'editVideo':
          result = await apiClient.callToolAPI(action, {
            duration: 30,
            transcript: 'Este é um vídeo sobre marketing digital...',
            mood: 'upbeat',
            csrfToken
          });
          break;
          
        case 'generateAnimation':
          result = await apiClient.callToolAPI(action, {
            imageUrl: 'https://example.com/image.jpg',
            animationType: '3d_transform',
            csrfToken
          });
          break;
          
        case 'generateMusic':
          result = await apiClient.callToolAPI(action, {
            style: 'upbeat_electronic',
            duration: 30,
            csrfToken
          });
          break;
          
        case 'generateThumbnails':
          result = await apiClient.callToolAPI(action, {
            title: 'Como Viralizar no TikTok',
            style: 'modern',
            colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
            csrfToken
          });
          break;
          
        case 'generateHashtags':
          result = await apiClient.callToolAPI(action, {
            content: 'Marketing digital para pequenas empresas',
            platform: 'Instagram',
            csrfToken
          });
          break;
          
        case 'createChatbot':
          result = await apiClient.callToolAPI(action, {
            platform: 'Telegram',
            responses: {
              welcome: 'Olá! Como posso ajudar?',
              fallback: 'Desculpe, não entendi. Pode reformular?'
            },
            csrfToken
          });
          break;
          
        case 'createGamification':
          result = await apiClient.callToolAPI(action, {
            type: 'quiz',
            content: {
              title: 'Qual seu perfil de empreendedor?',
              questions: ['Pergunta 1', 'Pergunta 2', 'Pergunta 3']
            },
            csrfToken
          });
          break;
          
        case 'showDashboard':
          result = await apiClient.callToolAPI(action, {
            platforms: ['Instagram', 'TikTok', 'Facebook', 'Twitter'],
            csrfToken
          });
          break;
          
        case 'detectTrends':
          result = await apiClient.callToolAPI(action, {
            niche: 'marketing',
            csrfToken
          });
          break;
          
        case 'generateSalesLinks':
          result = await apiClient.callToolAPI(action, {
            products: [
              { id: '1', name: 'Curso de Marketing', price: 197 },
              { id: '2', name: 'Consultoria 1:1', price: 497 }
            ],
            csrfToken
          });
          break;
          
        case 'setupLeadCapture':
          result = await apiClient.callToolAPI(action, {
            formType: 'popup',
            fields: ['name', 'email', 'phone'],
            integrations: ['mailchimp', 'hubspot'],
            csrfToken
          });
          break;
          
        case 'setupRemarketing':
          result = await apiClient.callToolAPI(action, {
            audience: { size: 1000, interests: ['marketing', 'business'] },
            csrfToken
          });
          break;
          
        case 'analyzeCompetitors':
          result = await apiClient.callToolAPI(action, {
            competitors: ['@concorrente1', '@concorrente2'],
            platforms: ['Instagram', 'TikTok'],
            csrfToken
          });
          break;
          
        default:
          result = { success: false, message: 'Ação não implementada' };
      }
      
      setResults(result);
      
      // Log de sucesso
      securityService.logSecurityEvent('tool_action_completed', { 
        action, 
        toolId, 
        success: result.success 
      }, 'low');
      
    } catch (error: any) {
      // Log de erro
      securityService.logSecurityEvent('tool_action_failed', { 
        action, 
        toolId, 
        error: error.message 
      }, 'medium');
      
      setResults({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  }, [user, activeTab, apiClient, securityService, csrfToken]);

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
    </div>
  );
};

export default SocialMediaToolsPage;
