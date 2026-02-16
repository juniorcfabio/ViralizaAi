// =======================
// 🔐 PÁGINA SEGURA DE FERRAMENTAS SOCIAIS
// =======================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { useCentralizedPricing } from '../../services/centralizedPricingService';
import openaiService from '../../services/openaiService';
import RealMusicGenerator from '../../services/realMusicGenerator';
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
  const [selectedTool, setSelectedTool] = useState<{id: string, action: string, title: string} | null>(null);
  const [formInputs, setFormInputs] = useState<Record<string, string>>({
    businessName: '',
    niche: '',
    platform: 'Instagram',
    content: '',
    targetAudience: '',
    languages: 'English, Spanish, French',
    style: 'profissional',
    duration: '30',
    objective: 'Gerar engajamento e conversões',
    musicGenre: 'pop',
    musicMood: 'energético',
    animStyle: '2D motion graphics',
    thumbnailTitle: '',
    audienceSize: '1000'
  });

  const updateInput = (key: string, value: string) => {
    setFormInputs(prev => ({ ...prev, [key]: value }));
  };

  // Campos de formulário por tool action
  const toolFormFields: Record<string, { label: string, key: string, type: 'text' | 'textarea' | 'select', placeholder?: string, options?: string[] }[]> = {
    scheduleContent: [
      { label: 'Nicho/Negócio', key: 'niche', type: 'text', placeholder: 'Ex: Marketing Digital, Gastronomia...' },
      { label: 'Plataformas', key: 'platform', type: 'select', options: ['Instagram, TikTok, Facebook', 'Instagram, TikTok, Twitter', 'Todas as plataformas', 'Instagram, Facebook, Threads'] },
      { label: 'Tom de comunicação', key: 'style', type: 'select', options: ['profissional', 'casual', 'divertido', 'sofisticado', 'educativo'] }
    ],
    generateCopy: [
      { label: 'Nome do Negócio', key: 'businessName', type: 'text', placeholder: 'Ex: Minha Loja Online' },
      { label: 'Plataforma', key: 'platform', type: 'select', options: ['Instagram', 'TikTok', 'Facebook', 'Twitter/X', 'LinkedIn', 'Threads'] },
      { label: 'Objetivo', key: 'objective', type: 'text', placeholder: 'Ex: Vender curso, Gerar leads...' },
      { label: 'Público-alvo', key: 'targetAudience', type: 'text', placeholder: 'Ex: Empreendedores 25-45 anos' }
    ],
    translateContent: [
      { label: 'Texto para traduzir', key: 'content', type: 'textarea', placeholder: 'Cole aqui o texto que deseja traduzir...' },
      { label: 'Idiomas de destino', key: 'languages', type: 'select', options: ['English, Spanish, French', 'English, Spanish', 'English, German, Italian', 'Chinese, Japanese, Korean', 'English, Arabic, Hindi'] },
      { label: 'Contexto/Nicho', key: 'niche', type: 'text', placeholder: 'Ex: Marketing digital para empreendedores' }
    ],
    editVideo: [
      { label: 'Nicho/Tema', key: 'niche', type: 'text', placeholder: 'Ex: Tecnologia, Fitness, Culinária...' },
      { label: 'Duração (segundos)', key: 'duration', type: 'select', options: ['15', '30', '60', '90'] },
      { label: 'Estilo do vídeo', key: 'style', type: 'select', options: ['profissional', 'dinâmico', 'minimalista', 'cinemático', 'tutorial'] }
    ],
    generateAnimation: [
      { label: 'Descrição da animação', key: 'content', type: 'textarea', placeholder: 'Descreva o que deseja animar...' },
      { label: 'Estilo', key: 'animStyle', type: 'select', options: ['2D motion graphics', '3D render', 'Flat design', 'Isométrico', 'Cartoon'] },
      { label: 'Nicho', key: 'niche', type: 'text', placeholder: 'Ex: Tecnologia, Educação...' }
    ],
    generateMusic: [
      { label: 'Gênero musical', key: 'musicGenre', type: 'select', options: ['pop', 'electronic', 'hip-hop', 'lo-fi', 'corporate', 'cinematic', 'acoustic', 'jazz'] },
      { label: 'Humor/Atmosfera', key: 'musicMood', type: 'select', options: ['energético', 'calmo', 'inspirador', 'misterioso', 'alegre', 'dramático', 'relaxante'] },
      { label: 'Duração (segundos)', key: 'duration', type: 'select', options: ['15', '30', '60'] },
      { label: 'Uso pretendido', key: 'niche', type: 'text', placeholder: 'Ex: Vídeo de marketing, Podcast intro...' }
    ],
    generateThumbnails: [
      { label: 'Título/Tema do vídeo', key: 'thumbnailTitle', type: 'text', placeholder: 'Ex: Como Viralizar no TikTok em 2025' },
      { label: 'Estilo visual', key: 'style', type: 'select', options: ['vibrante', 'minimalista', 'dark mode', 'neon', 'profissional'] },
      { label: 'Nicho', key: 'niche', type: 'text', placeholder: 'Ex: Marketing, Tecnologia, Fitness...' }
    ],
    generateHashtags: [
      { label: 'Nicho', key: 'niche', type: 'text', placeholder: 'Ex: Marketing digital, Fitness, Culinária...' },
      { label: 'Plataforma', key: 'platform', type: 'select', options: ['Instagram', 'TikTok', 'Twitter/X', 'LinkedIn', 'YouTube'] },
      { label: 'Tipo de conteúdo', key: 'style', type: 'select', options: ['post educativo', 'reels/shorts', 'carrossel', 'stories', 'vídeo longo'] }
    ],
    createChatbot: [
      { label: 'Tipo de Negócio', key: 'niche', type: 'text', placeholder: 'Ex: E-commerce de moda, Consultoria...' },
      { label: 'Objetivo do chatbot', key: 'objective', type: 'select', options: ['Atendimento ao cliente', 'Captura de leads', 'Vendas automáticas', 'Agendamento', 'Suporte técnico'] },
      { label: 'Plataforma', key: 'platform', type: 'select', options: ['Instagram DM', 'Telegram', 'WhatsApp', 'Facebook Messenger'] }
    ],
    createGamification: [
      { label: 'Nicho', key: 'niche', type: 'text', placeholder: 'Ex: Marketing, Educação, Saúde...' },
      { label: 'Plataforma', key: 'platform', type: 'select', options: ['Instagram', 'TikTok', 'Todas'] },
      { label: 'Tipo de gamificação', key: 'style', type: 'select', options: ['Quiz interativo', 'Desafio de 7 dias', 'Enquetes e votações', 'Sistema de pontos', 'Concurso'] }
    ],
    showDashboard: [
      { label: 'Nicho do negócio', key: 'niche', type: 'text', placeholder: 'Ex: Marketing digital, E-commerce...' },
      { label: 'Plataformas', key: 'platform', type: 'select', options: ['Instagram, TikTok, Facebook, Twitter', 'Instagram, TikTok', 'YouTube, TikTok', 'Todas as plataformas'] }
    ],
    detectTrends: [
      { label: 'Nicho', key: 'niche', type: 'text', placeholder: 'Ex: Tecnologia, Moda, Fitness...' },
      { label: 'Plataforma', key: 'platform', type: 'select', options: ['Instagram', 'TikTok', 'Twitter/X', 'YouTube', 'LinkedIn'] }
    ],
    analyzeCompetitors: [
      { label: 'Nicho', key: 'niche', type: 'text', placeholder: 'Ex: Marketing digital, SaaS...' },
      { label: 'Plataforma', key: 'platform', type: 'select', options: ['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Twitter/X'] }
    ],
    generateSalesLinks: [
      { label: 'Nome do Negócio', key: 'businessName', type: 'text', placeholder: 'Ex: Meu Curso Online' },
      { label: 'Produtos e preços', key: 'content', type: 'textarea', placeholder: 'Ex:\nCurso Marketing - R$197\nConsultoria 1:1 - R$497' },
      { label: 'Público-alvo', key: 'targetAudience', type: 'text', placeholder: 'Ex: Empreendedores digitais' }
    ],
    setupLeadCapture: [
      { label: 'Nicho', key: 'niche', type: 'text', placeholder: 'Ex: Marketing digital, Coaching...' },
      { label: 'Objetivo', key: 'objective', type: 'select', options: ['Capturar emails', 'Agendar reuniões', 'Vender produto', 'Crescer lista', 'Gerar downloads'] },
      { label: 'Plataforma principal', key: 'platform', type: 'select', options: ['Instagram', 'Landing Page', 'Facebook', 'Blog', 'YouTube'] }
    ],
    setupRemarketing: [
      { label: 'Nicho', key: 'niche', type: 'text', placeholder: 'Ex: E-commerce, Cursos online...' },
      { label: 'Tamanho da audiência', key: 'audienceSize', type: 'select', options: ['500', '1000', '5000', '10000', '50000+'] },
      { label: 'Objetivo principal', key: 'objective', type: 'select', options: ['Recuperar carrinhos abandonados', 'Reengajar seguidores', 'Converter visitantes', 'Upsell para clientes'] }
    ]
  };

  const userPlan = user?.plan || 'mensal';
  const isAdmin = window.location.pathname.includes('/admin') || window.location.hash.includes('/admin');

  // Função para salvar resultados no Supabase
  const saveToSupabase = async (toolAction: string, content: any, success: boolean) => {
    try {
      const truncatedContent = typeof content?.data?.content === 'string' 
        ? { ...content, data: { ...content.data, content: content.data.content.substring(0, 5000) } }
        : content;
      
      const { error } = await supabase.from('generated_content').insert({
        user_id: user?.id,
        content_type: 'social_tool_result',
        title: `Resultado: ${toolAction}`,
        content: {
          tool_action: toolAction,
          result: truncatedContent,
          generated_at: new Date().toISOString(),
          success
        },
        metadata: {
          user_plan: userPlan,
          is_admin: isAdmin,
          tool_category: activeTab
        }
      });
      
      if (error) {
        console.warn('⚠️ Supabase save warning:', error.message);
      } else {
        console.log('✅ Resultado salvo no Supabase:', toolAction);
      }
    } catch (error) {
      console.warn('⚠️ Supabase save falhou (não crítico):', error);
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
      
      const fi = formInputs;
      
      switch (action) {
        case 'scheduleContent':
          try {
            const scheduleContent = await openaiService.generate('copywriting',
              `Crie 3 posts otimizados para agendamento simultâneo em ${fi.platform || 'Instagram, TikTok, Facebook'}.\n\nPara cada plataforma, inclua:\n- Legenda otimizada (com emojis, hashtags, CTA)\n- Melhor horário para publicar\n- Formato ideal (carrossel, reels, stories)\n- Tamanho de imagem recomendado\n\nNicho: ${fi.niche || 'Marketing Digital'}. Tom: ${fi.style || 'profissional'}.`
            );
            result = { success: true, data: { content: scheduleContent }, message: 'Conteúdo para agendamento gerado com IA' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'generateCopy':
          try {
            const copyContent = await openaiService.generateCopywriting(
              fi.businessName || user?.name || 'Meu Negócio',
              fi.platform || 'Instagram',
              fi.objective || 'Gerar engajamento e conversões',
              fi.targetAudience || 'Empreendedores e pequenas empresas'
            );
            result = { success: true, data: { content: copyContent }, message: 'Copy gerada com IA real' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'translateContent':
          try {
            const textToTranslate = fi.content || 'Transforme seu negócio com estratégias de marketing digital! Descubra como crescer nas redes sociais.';
            const translated = await openaiService.translateContent(
              textToTranslate,
              fi.languages || 'English, Spanish, French',
              fi.niche || 'Marketing digital'
            );
            result = { success: true, data: { content: translated }, message: 'Tradução gerada com IA real' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'editVideo':
          try {
            // 1) Gerar roteiro com IA
            const videoScript = await openaiService.generate('scripts',
              `Crie um roteiro completo de vídeo de ${fi.duration || '30'} segundos sobre ${fi.niche || 'marketing digital'}. Estilo: ${fi.style || 'profissional'}.\n\nInclua:\n- Storyboard (cena por cena com descrição visual)\n- Narração/falas\n- Música sugerida\n- Efeitos visuais\n- Texto na tela\n- Transições recomendadas\n- Duração de cada cena`
            );
            // 2) Gerar frame visual com DALL-E (storyboard key frame)
            let storyboardImage = '';
            try {
              const frameRes = await fetch(`${window.location.origin}/api/ai-generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tool: 'image',
                  prompt: `Professional video storyboard frame, cinematic ${fi.style || 'profissional'} style, topic: ${fi.niche || 'marketing digital'}, high quality, vibrant colors, 16:9 aspect ratio`,
                  params: { size: '1792x1024', quality: 'standard', style: 'vivid' }
                })
              });
              const frameData = await frameRes.json();
              if (frameData.success && frameData.imageUrl) {
                storyboardImage = frameData.imageUrl;
              }
            } catch (imgErr) {
              console.warn('⚠️ Storyboard image fallback:', imgErr);
            }
            result = {
              success: true,
              data: { content: videoScript, imageUrl: storyboardImage || undefined },
              message: storyboardImage ? 'Roteiro + Storyboard visual gerado com IA' : 'Roteiro de vídeo gerado com IA'
            };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'generateAnimation':
          try {
            const animDesc = fi.content || 'Logo animado com motion graphics';
            const animStyle = fi.animStyle || '2D motion graphics';
            const animNiche = fi.niche || 'Tecnologia';

            // 1) Tentar gerar VÍDEO REAL com Sora-2
            let videoGenerated = false;
            let videoUrl = '';
            try {
              const soraPrompt = `Create a professional ${animStyle} promotional animation. Subject: ${animDesc}. Theme: ${animNiche}. Style: ${animStyle.includes('3D') ? 'photorealistic 3D rendered animation' : 'clean 2D motion graphics animation'}. Vibrant colors, smooth transitions, engaging visuals, high production quality.`;

              // Mostrar progresso ao usuário
              setResults({ success: true, data: { content: '⏳ Iniciando geração de vídeo com Sora-2... Aguarde.' }, message: 'Conectando ao Sora-2...' });

              const createRes = await fetch(`${window.location.origin}/api/ai-generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tool: 'sora-create',
                  prompt: soraPrompt,
                  params: { size: '1280x720', seconds: 5 }
                })
              });
              const createData = await createRes.json();

              if (createData.success && createData.videoId) {
                const videoId = createData.videoId;
                console.log('🎬 Sora-2 job criado:', videoId);

                // Poll para status
                let videoReady = false;
                let attempts = 0;
                const maxAttempts = 60; // 5 min max

                while (!videoReady && attempts < maxAttempts) {
                  await new Promise(resolve => setTimeout(resolve, 5000));
                  attempts++;

                  const statusRes = await fetch(`${window.location.origin}/api/ai-generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tool: 'sora-status', prompt: 'status', params: { videoId } })
                  });
                  const statusData = await statusRes.json();
                  const progress = statusData.progress || 0;

                  setResults({
                    success: true,
                    data: { content: `⏳ Gerando vídeo com Sora-2... ${progress}%\n\nTentativa ${attempts}/${maxAttempts}\nStatus: ${statusData.status || 'processando'}` },
                    message: `Gerando vídeo: ${progress}%`
                  });

                  if (statusData.status === 'completed') {
                    videoReady = true;
                  } else if (statusData.status === 'failed' || statusData.error) {
                    throw new Error(statusData.error || 'Geração de vídeo falhou no servidor');
                  }
                }

                if (!videoReady) {
                  throw new Error('Timeout: geração demorou mais de 5 minutos');
                }

                // Download do vídeo
                setResults({ success: true, data: { content: '⬇️ Baixando vídeo gerado...' }, message: 'Baixando vídeo...' });

                const dlRes = await fetch(`${window.location.origin}/api/ai-generate`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tool: 'sora-download', prompt: 'download', params: { videoId } })
                });

                if (dlRes.ok) {
                  const contentType = dlRes.headers.get('content-type') || '';
                  if (contentType.includes('video')) {
                    const videoBlob = await dlRes.blob();
                    videoUrl = URL.createObjectURL(videoBlob);
                    videoGenerated = true;
                    console.log('✅ Vídeo Sora-2 baixado:', videoBlob.size, 'bytes');
                  } else {
                    const errData = await dlRes.json();
                    throw new Error(errData.error || 'Download retornou formato inesperado');
                  }
                } else {
                  throw new Error(`Download falhou: HTTP ${dlRes.status}`);
                }
              } else {
                throw new Error(createData.error || createData.details || 'Sora-2 não disponível');
              }
            } catch (soraErr: any) {
              console.warn('⚠️ Sora-2 falhou, usando DALL-E como fallback:', soraErr.message);
            }

            // 2) Gerar briefing completo com IA
            const animScript = await openaiService.generate('scripts',
              `Crie um briefing completo para animação ${animStyle} promocional.\n\nDescrição: ${animDesc}\nNicho: ${animNiche}\n\nInclua:\n- Conceito visual detalhado\n- Estilo de animação: ${animStyle}\n- Paleta de cores (hex codes)\n- Sequência de cenas (5 cenas mínimo com timecodes)\n- Texto animado para cada cena\n- Duração total e de cada cena\n- Referências visuais\n- Música/efeitos sonoros\n- Especificações técnicas (resolução, FPS, formato)`
            );

            if (videoGenerated && videoUrl) {
              // Sucesso com vídeo real
              result = {
                success: true,
                data: {
                  content: `🎬 Vídeo de Animação ${animStyle} Gerado com Sora-2!\n\nDescrição: ${animDesc}\nNicho: ${animNiche}\nDuração: 5 segundos\nResolução: 1280x720\nFormato: MP4\n\n✅ Use o player acima para assistir e o botão para baixar.\n\n---\n\n${animScript}`,
                  videoUrl,
                  videoDownloadUrl: videoUrl
                },
                message: 'Vídeo de animação gerado com Sora-2'
              };
            } else {
              // Fallback: DALL-E concept art + briefing
              let animImage = '';
              try {
                const animImgRes = await fetch(`${window.location.origin}/api/ai-generate`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    tool: 'image',
                    prompt: `${animStyle} animation key frame, ${animDesc}, ${animNiche} theme, vibrant colors, professional ${animStyle.includes('3D') ? '3D rendered' : '2D flat design'} style, clean composition`,
                    params: { size: '1792x1024', quality: 'standard', style: 'vivid' }
                  })
                });
                const animImgData = await animImgRes.json();
                if (animImgData.success && animImgData.imageUrl) {
                  animImage = animImgData.imageUrl;
                }
              } catch (imgErr) {
                console.warn('⚠️ DALL-E fallback also failed:', imgErr);
              }
              result = {
                success: true,
                data: { content: `⚠️ Sora-2 indisponível. Concept art gerado com DALL-E + briefing completo.\n\n${animScript}`, imageUrl: animImage || undefined },
                message: animImage ? 'Concept art + Briefing (Sora-2 indisponível)' : 'Briefing de animação gerado com IA'
              };
            }
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'generateMusic':
          try {
            // Mapear gênero → instrumentos e BPM
            const genreMap: Record<string, { instruments: string[], tempo: number, key: string }> = {
              'pop': { instruments: ['piano', 'bateria', 'sintetizador'], tempo: 120, key: 'C' },
              'electronic': { instruments: ['sintetizador', 'bateria'], tempo: 128, key: 'A' },
              'hip-hop': { instruments: ['bateria', 'baixo', 'sintetizador'], tempo: 90, key: 'G' },
              'lo-fi': { instruments: ['piano', 'guitarra'], tempo: 75, key: 'E' },
              'corporate': { instruments: ['piano', 'sintetizador'], tempo: 110, key: 'C' },
              'cinematic': { instruments: ['sintetizador', 'piano', 'bateria'], tempo: 80, key: 'D' },
              'acoustic': { instruments: ['guitarra', 'piano'], tempo: 100, key: 'G' },
              'jazz': { instruments: ['piano', 'baixo', 'bateria'], tempo: 95, key: 'F' }
            };
            const genre = genreMap[fi.musicGenre || 'pop'] || genreMap['pop'];
            
            // Gerar áudio real com Web Audio API
            const musicGen = RealMusicGenerator.getInstance();
            const musicResult = await musicGen.generateMusic({
              style: fi.musicGenre || 'pop',
              mood: fi.musicMood || 'energético',
              duration: parseInt(fi.duration) || 30,
              instruments: genre.instruments,
              tempo: genre.tempo,
              key: genre.key
            });
            
            const musicInfo = `🎵 Música Original Gerada com IA\n\n` +
              `Gênero: ${fi.musicGenre || 'pop'}\n` +
              `Atmosfera: ${fi.musicMood || 'energético'}\n` +
              `Duração: ${fi.duration || '30'} segundos\n` +
              `BPM: ${genre.tempo}\n` +
              `Tonalidade: ${genre.key}\n` +
              `Instrumentos: ${genre.instruments.join(', ')}\n` +
              `Uso: ${fi.niche || 'Vídeo de marketing'}\n\n` +
              `✅ Áudio WAV gerado com sucesso! Use o player acima para ouvir e o botão para baixar.`;

            result = {
              success: true,
              data: {
                content: musicInfo,
                audioUrl: musicResult.audioUrl,
                downloadUrl: musicResult.downloadUrl
              },
              message: 'Música original gerada com IA'
            };
          } catch (e: any) {
            result = { success: false, message: `Erro ao gerar música: ${e.message}` };
          }
          break;
          
        case 'generateThumbnails':
          try {
            const thumbTitle = fi.thumbnailTitle || 'Como Viralizar no TikTok em 2025';
            // Usar /api/ai-generate com tool='image' que retorna data:image/png;base64
            const thumbResponse = await fetch(`${window.location.origin}/api/ai-generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tool: 'image',
                prompt: `Create a vibrant, eye-catching YouTube/social media thumbnail. Bold colors, high contrast, engaging composition. Title: "${thumbTitle}", niche: ${fi.niche || 'Marketing'}, style: ${fi.style || 'vibrante'}. Professional design that drives clicks.`,
                params: { size: '1792x1024', quality: 'standard', style: 'vivid' }
              })
            });
            const thumbData = await thumbResponse.json();
            if (thumbData.success && thumbData.imageUrl) {
              result = {
                success: true,
                data: { content: `Thumbnail gerada com DALL-E 3 para: "${thumbTitle}"\n\nPrompt revisado: ${thumbData.revisedPrompt || 'N/A'}`, imageUrl: thumbData.imageUrl },
                message: 'Thumbnail gerada com DALL-E 3'
              };
            } else {
              result = { success: false, message: thumbData.error || thumbData.details || 'Erro ao gerar thumbnail' };
            }
          } catch (e: any) {
            result = { success: false, message: `Erro: ${e.message}` };
          }
          break;
          
        case 'generateHashtags':
          try {
            const hashtags = await openaiService.generateHashtags(
              fi.niche || 'marketing digital',
              fi.platform || 'Instagram',
              fi.style || 'post educativo'
            );
            result = { success: true, data: { content: hashtags }, message: 'Hashtags geradas com IA real' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'createChatbot':
          try {
            const chatbot = await openaiService.generate('general',
              `Crie um chatbot completo para ${fi.objective || 'atendimento ao cliente'} via ${fi.platform || 'Instagram DM'} para um negócio de ${fi.niche || 'marketing digital'}.\n\nInclua:\n- Mensagem de boas-vindas personalizada\n- 10 perguntas frequentes com respostas\n- Fluxo de captura de leads (nome, email, telefone)\n- Mensagens de promoção\n- Respostas para objeções comuns\n- Fluxo de agendamento\n- Mensagem de fallback\n- Gatilhos de palavras-chave\n\nFormate como fluxograma de conversação pronto para implementar.`
            );
            result = { success: true, data: { content: chatbot }, message: 'Chatbot gerado com IA' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'createGamification':
          try {
            const quiz = await openaiService.generate('general',
              `Crie conteúdo gamificado completo para redes sociais de ${fi.niche || 'marketing digital'} na plataforma ${fi.platform || 'Instagram'}.\nTipo: ${fi.style || 'Quiz interativo'}\n\nInclua:\n1. Quiz completo (10 perguntas com 4 opções + 4 resultados)\n2. Desafio de 7 dias para engajamento\n3. 5 enquetes interativas prontas\n4. Sistema de pontos e recompensas\n5. Ranking de engajamento\n\nFormate tudo pronto para copiar e usar.`
            );
            result = { success: true, data: { content: quiz }, message: 'Gamificação gerada com IA' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'showDashboard':
          try {
            const dashInsights = await openaiService.generate('trends',
              `Gere um relatório de insights de mídias sociais para um negócio de ${fi.niche || 'marketing digital'}.\n\nPlataformas: ${fi.platform || 'Instagram, TikTok, Facebook, Twitter'}\n\nInclua:\n- Métricas-chave para acompanhar (KPIs)\n- Benchmarks do setor para cada plataforma\n- Análise de melhor horário para publicar\n- Tipos de conteúdo com maior ROI\n- Estratégias de crescimento para cada plataforma\n- Metas sugeridas para 30/60/90 dias\n- Template de relatório semanal`
            );
            result = { success: true, data: { content: dashInsights }, message: 'Insights do dashboard gerados com IA' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'detectTrends':
          try {
            const trends = await openaiService.analyzeTrends(fi.niche || 'marketing digital', fi.platform || 'Instagram');
            result = { success: true, data: { content: trends }, message: 'Tendências analisadas com IA real' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'generateSalesLinks':
          try {
            const products = fi.content || 'Curso de Marketing Digital - R$197\nConsultoria 1:1 - R$497';
            const salesCopy = await openaiService.generate('funnel',
              `Crie uma estratégia completa de links de vendas para ${fi.businessName || 'negócio digital'}.\n\nProdutos:\n${products}\n\nPúblico-alvo: ${fi.targetAudience || 'Empreendedores digitais'}\n\nInclua:\n- Copy de venda para cada produto\n- Estrutura da página de vendas\n- Sequência de emails (5 emails)\n- CTAs otimizados\n- Estratégia de upsell/downsell\n- Textos para links na bio\n- Modelo de link tree otimizado`
            );
            result = { success: true, data: { content: salesCopy }, message: 'Estratégia de vendas gerada com IA' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'setupLeadCapture':
          try {
            const leadStrategy = await openaiService.generate('funnel',
              `Crie uma estratégia completa de captura de leads para ${fi.niche || 'marketing digital'}.\nObjetivo: ${fi.objective || 'Capturar emails'}\nPlataforma: ${fi.platform || 'Instagram'}\n\nInclua:\n- 3 modelos de popup (headline + copy + CTA)\n- 5 ideias de lead magnet (ebook, checklist, webinar, etc.)\n- Sequência de nurturing (7 emails)\n- Campos do formulário otimizados\n- Integrações recomendadas\n- Estratégia de segmentação\n- A/B tests sugeridos\n- Métricas de acompanhamento`
            );
            result = { success: true, data: { content: leadStrategy }, message: 'Estratégia de leads gerada com IA' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'setupRemarketing':
          try {
            const remarketing = await openaiService.generate('general',
              `Crie uma estratégia completa de remarketing para ${fi.niche || 'negócio digital'}.\n\nAudiência: ${fi.audienceSize || '1000'} visitantes.\nObjetivo: ${fi.objective || 'Converter visitantes'}\n\nInclua:\n- Segmentos de audiência (quente, morna, fria)\n- Copy de anúncios para cada segmento (5 variações)\n- Estratégia de retargeting por plataforma\n- Orçamento sugerido (diário/mensal)\n- Frequência ideal de exibição\n- Públicos lookalike\n- Métricas de acompanhamento (CPA, ROAS, CTR)\n- Sequência de anúncios (7 dias)`
            );
            result = { success: true, data: { content: remarketing }, message: 'Estratégia de remarketing gerada com IA' };
          } catch (e: any) {
            result = { success: false, message: `Erro na IA: ${e.message}` };
          }
          break;
          
        case 'analyzeCompetitors':
          try {
            const analysis = await openaiService.generate('trends',
              `Analise a estratégia de concorrentes no nicho de ${fi.niche || 'marketing digital'} na plataforma ${fi.platform || 'Instagram'}.\n\nForneça:\n1. Estratégias mais comuns dos top players\n2. Tipos de conteúdo que mais engajam\n3. Frequência ideal de postagem\n4. Oportunidades não exploradas\n5. Recomendações para se diferenciar\n6. Análise de pontos fortes e fracos\n7. Estratégias de conteúdo vencedoras`
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
              onClick={() => {
                setSelectedTool({ id: tool.id, action: tool.action, title: tool.title });
                setResults(null);
              }}
              onUpgrade={() => handleSecureCheckout(tool.requiredPlan)}
            />
          ))}
        </div>

        {/* Input Form for Selected Tool */}
        {selectedTool && (
          <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-200 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                🛠️ {selectedTool.title}
              </h3>
              <button
                onClick={() => { setSelectedTool(null); setResults(null); }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >×</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {(toolFormFields[selectedTool.action] || []).map((field) => (
                <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={formInputs[field.key] || (field.options?.[0] || '')}
                      onChange={(e) => updateInput(field.key, e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    >
                      {(field.options || []).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={formInputs[field.key] || ''}
                      onChange={(e) => updateInput(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={4}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formInputs[field.key] || ''}
                      onChange={(e) => updateInput(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => handleToolAction(selectedTool.action, selectedTool.id)}
              disabled={loading}
              className={`w-full py-3 px-6 rounded-lg font-bold text-lg transition-all ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  Processando com IA...
                </span>
              ) : (
                `🚀 Gerar ${selectedTool.title}`
              )}
            </button>
          </div>
        )}

        {/* Results */}
        {loading && !selectedTool && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Processando com IA...</span>
            </div>
          </div>
        )}

        {results && (
          <div className={`rounded-xl p-6 shadow-lg mb-8 ${results.success ? 'bg-white border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {results.success ? '✅ Resultado' : '❌ Erro'}
              </h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                {results.message}
              </span>
            </div>

            {/* Video player for Sora-2 animations */}
            {results.data?.videoUrl && (
              <div className="mb-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-indigo-200">
                <h4 className="text-lg font-bold text-gray-800 mb-3">🎬 Player de Vídeo</h4>
                <video
                  controls
                  autoPlay
                  muted
                  loop
                  src={results.data.videoUrl}
                  className="w-full max-w-2xl rounded-lg shadow-md border border-gray-200 mb-3"
                  style={{ maxHeight: '480px' }}
                >
                  Seu navegador não suporta o elemento de vídeo.
                </video>
                <div className="flex gap-3">
                  <a
                    href={results.data.videoDownloadUrl || results.data.videoUrl}
                    download={`animacao_ia_${Date.now()}.mp4`}
                    className="inline-flex items-center bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-md"
                  >
                    📥 Baixar Vídeo MP4
                  </a>
                </div>
              </div>
            )}

            {/* Audio player for music */}
            {results.data?.audioUrl && (
              <div className="mb-5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-200">
                <h4 className="text-lg font-bold text-gray-800 mb-3">🎵 Player de Áudio</h4>
                <audio
                  controls
                  src={results.data.audioUrl}
                  className="w-full mb-3"
                  style={{ height: '50px' }}
                >
                  Seu navegador não suporta o elemento de áudio.
                </audio>
                <div className="flex gap-3">
                  <a
                    href={results.data.downloadUrl || results.data.audioUrl}
                    download={`musica_ia_${Date.now()}.wav`}
                    className="inline-flex items-center bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors shadow-md"
                  >
                    📥 Baixar Música WAV
                  </a>
                </div>
              </div>
            )}

            {/* Image display for thumbnails/storyboard/animation */}
            {results.data?.imageUrl && (
              <div className="mb-5">
                <img
                  src={results.data.imageUrl}
                  alt="Imagem gerada com IA"
                  className="w-full max-w-2xl rounded-lg shadow-md border border-gray-200"
                />
                <a
                  href={results.data.imageUrl}
                  download={`imagem_ia_${Date.now()}.png`}
                  className="inline-block mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  📥 Baixar Imagem
                </a>
              </div>
            )}

            {/* Formatted text content */}
            {results.data?.content && (
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 max-h-[600px] overflow-y-auto">
                <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed" style={{ fontSize: '14px', lineHeight: '1.7' }}>
                  {results.data.content}
                </div>
              </div>
            )}

            {/* Error message */}
            {!results.success && !results.data?.content && (
              <div className="bg-red-100 rounded-lg p-4 text-red-700 font-medium">
                {results.message}
              </div>
            )}

            {/* Copy and action buttons */}
            {results.success && results.data?.content && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(results.data.content);
                    alert('✅ Conteúdo copiado para a área de transferência!');
                  }}
                  className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-md"
                >
                  📋 Copiar Resultado
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([results.data.content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedTool?.action || 'resultado'}_${Date.now()}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-md"
                >
                  💾 Salvar como Arquivo
                </button>
              </div>
            )}
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
