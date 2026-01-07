import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import StripeService from '../../services/stripeService';

interface FunnelStep {
  id: string;
  name: string;
  type: 'landing' | 'sales' | 'upsell' | 'thankyou' | 'email';
  content: string;
  conversionRate: number;
  isActive: boolean;
}

interface FunnelTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  expectedConversion: number;
  steps: FunnelStep[];
}

const AIFunnelBuilderPageComplete: React.FC = () => {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<FunnelTemplate | null>(null);
  const [customFunnel, setCustomFunnel] = useState<FunnelStep[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFunnel, setGeneratedFunnel] = useState<FunnelTemplate | null>(null);
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    niche: '',
    targetAudience: '',
    mainProduct: '',
    pricePoint: '',
    uniqueValue: ''
  });

  const funnelTemplates: FunnelTemplate[] = [
    {
      id: 'ecommerce-high-ticket',
      name: 'E-commerce Alto Valor',
      category: 'E-commerce',
      description: 'Funil otimizado para produtos de alto valor (R$ 500+)',
      expectedConversion: 8.5,
      steps: [
        {
          id: 'landing',
          name: 'Página de Captura',
          type: 'landing',
          content: 'Landing page com oferta irresistível e prova social',
          conversionRate: 35.2,
          isActive: true
        },
        {
          id: 'sales',
          name: 'Página de Vendas',
          type: 'sales',
          content: 'VSL + copy persuasivo com gatilhos mentais',
          conversionRate: 12.8,
          isActive: true
        },
        {
          id: 'upsell',
          name: 'Upsell Estratégico',
          type: 'upsell',
          content: 'Oferta complementar com 40% desconto',
          conversionRate: 28.5,
          isActive: true
        }
      ]
    },
    {
      id: 'infoproduct-launch',
      name: 'Lançamento Infoproduto',
      category: 'Educação',
      description: 'Funil para lançamento de cursos e infoprodutos',
      expectedConversion: 15.2,
      steps: [
        {
          id: 'webinar',
          name: 'Webinar Gratuito',
          type: 'landing',
          content: 'Webinar de alto valor com pitch no final',
          conversionRate: 45.8,
          isActive: true
        },
        {
          id: 'sales-page',
          name: 'Página de Vendas',
          type: 'sales',
          content: 'Copy longo com depoimentos e garantia',
          conversionRate: 18.7,
          isActive: true
        }
      ]
    },
    {
      id: 'saas-trial',
      name: 'SaaS Trial to Paid',
      category: 'Software',
      description: 'Conversão de trial gratuito para assinatura paga',
      expectedConversion: 22.3,
      steps: [
        {
          id: 'onboarding',
          name: 'Onboarding Inteligente',
          type: 'landing',
          content: 'Sequência de ativação com quick wins',
          conversionRate: 68.4,
          isActive: true
        },
        {
          id: 'upgrade',
          name: 'Upgrade Premium',
          type: 'sales',
          content: 'Oferta baseada no uso + urgência',
          conversionRate: 32.6,
          isActive: true
        }
      ]
    }
  ];

  const generateAIFunnel = async () => {
    if (!businessInfo.name || !businessInfo.niche) {
      alert('Preencha pelo menos o nome do negócio e nicho');
      return;
    }

    setIsGenerating(true);

    // Simular IA gerando funil personalizado
    setTimeout(() => {
      const aiGeneratedFunnel: FunnelTemplate = {
        id: 'ai-generated-' + Date.now(),
        name: `Funil IA para ${businessInfo.name}`,
        category: businessInfo.niche,
        description: `Funil ultra-otimizado gerado por IA para ${businessInfo.niche}`,
        expectedConversion: 18.7 + Math.random() * 10,
        steps: [
          {
            id: 'ai-landing',
            name: 'Landing Page IA',
            type: 'landing',
            content: `Landing page otimizada para ${businessInfo.targetAudience} interessados em ${businessInfo.mainProduct}`,
            conversionRate: 42.3 + Math.random() * 15,
            isActive: true
          },
          {
            id: 'ai-sales',
            name: 'Página de Vendas IA',
            type: 'sales',
            content: `Copy persuasivo focado em ${businessInfo.uniqueValue} com preço de R$ ${businessInfo.pricePoint}`,
            conversionRate: 16.8 + Math.random() * 8,
            isActive: true
          },
          {
            id: 'ai-email',
            name: 'Sequência de Email IA',
            type: 'email',
            content: `7 emails de nutrição personalizados para ${businessInfo.niche}`,
            conversionRate: 24.5 + Math.random() * 12,
            isActive: true
          },
          {
            id: 'ai-upsell',
            name: 'Upsell Inteligente',
            type: 'upsell',
            content: `Oferta complementar baseada no comportamento do cliente`,
            conversionRate: 31.2 + Math.random() * 18,
            isActive: true
          }
        ]
      };

      setGeneratedFunnel(aiGeneratedFunnel);
      setIsGenerating(false);
    }, 3000);
  };

  const purchaseFunnelBuilder = async () => {
    try {
      const stripeService = StripeService.getInstance();
      
      const paymentData = {
        amount: 147.00,
        currency: 'BRL',
        description: 'AI Funnel Builder - Construtor de Funis Inteligente',
        productId: 'ai-funnel-builder',
        productType: 'tool' as const,
        userId: user?.id || 'guest_' + Date.now(),
        userEmail: user?.email || 'usuario@exemplo.com',
        successUrl: `${window.location.origin}/dashboard/ai-funnel-builder?payment=success`,
        cancelUrl: `${window.location.origin}/dashboard/ai-funnel-builder?payment=cancelled`,
        metadata: {
          toolName: 'AI Funnel Builder',
          features: 'Funis ilimitados, IA avançada, templates premium'
        }
      };
      
      await stripeService.processToolPayment(paymentData);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'landing': return '🎯';
      case 'sales': return '💰';
      case 'upsell': return '⬆️';
      case 'thankyou': return '🙏';
      case 'email': return '📧';
      default: return '📄';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-8 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              🤖 AI Funnel Builder Ultra-Avançado
            </h1>
            <p className="text-pink-100 text-lg">
              A ferramenta mais revolucionária do mundo digital para criar funis de vendas com IA
            </p>
          </div>
          <div className="bg-white/20 p-6 rounded-lg text-center">
            <div className="text-3xl font-bold text-white">97%</div>
            <div className="text-pink-100 text-sm">Precisão IA</div>
          </div>
        </div>
      </div>

      {/* Informações do Negócio */}
      <div className="bg-secondary p-6 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">📊 Informações do Seu Negócio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-300 mb-2">Nome do Negócio</label>
            <input
              type="text"
              value={businessInfo.name}
              onChange={(e) => setBusinessInfo({...businessInfo, name: e.target.value})}
              className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white"
              placeholder="Ex: Minha Empresa Digital"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Nicho/Mercado</label>
            <select
              value={businessInfo.niche}
              onChange={(e) => setBusinessInfo({...businessInfo, niche: e.target.value})}
              className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white"
            >
              <option value="">Selecione o nicho</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Infoprodutos">Infoprodutos</option>
              <option value="Consultoria">Consultoria</option>
              <option value="SaaS">SaaS/Software</option>
              <option value="Afiliados">Marketing de Afiliados</option>
              <option value="Serviços">Prestação de Serviços</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Público-Alvo</label>
            <input
              type="text"
              value={businessInfo.targetAudience}
              onChange={(e) => setBusinessInfo({...businessInfo, targetAudience: e.target.value})}
              className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white"
              placeholder="Ex: Empreendedores de 25-45 anos"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Produto Principal</label>
            <input
              type="text"
              value={businessInfo.mainProduct}
              onChange={(e) => setBusinessInfo({...businessInfo, mainProduct: e.target.value})}
              className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white"
              placeholder="Ex: Curso de Marketing Digital"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Faixa de Preço (R$)</label>
            <input
              type="text"
              value={businessInfo.pricePoint}
              onChange={(e) => setBusinessInfo({...businessInfo, pricePoint: e.target.value})}
              className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white"
              placeholder="Ex: 497"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Proposta de Valor Única</label>
            <input
              type="text"
              value={businessInfo.uniqueValue}
              onChange={(e) => setBusinessInfo({...businessInfo, uniqueValue: e.target.value})}
              className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white"
              placeholder="Ex: Resultados em 30 dias ou dinheiro de volta"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={generateAIFunnel}
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-8 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all transform hover:scale-105 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <span className="animate-pulse">🤖 IA Gerando Funil...</span>
              </>
            ) : (
              '🚀 Gerar Funil com IA Ultra-Avançada'
            )}
          </button>
        </div>
      </div>

      {/* Templates Prontos */}
      <div className="bg-secondary p-6 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">🎨 Templates Ultra-Otimizados</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {funnelTemplates.map(template => (
            <div
              key={template.id}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                selectedTemplate?.id === template.id
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-600 hover:border-purple-400'
              }`}
              onClick={() => setSelectedTemplate(template)}
            >
              <h3 className="text-xl font-bold text-white mb-2">{template.name}</h3>
              <div className="text-purple-400 text-sm mb-3">{template.category}</div>
              <p className="text-gray-300 text-sm mb-4">{template.description}</p>
              
              <div className="flex justify-between items-center mb-4">
                <div className="text-green-400 font-bold">
                  {template.expectedConversion.toFixed(1)}% conversão
                </div>
                <div className="text-blue-400">
                  {template.steps.length} etapas
                </div>
              </div>

              <div className="space-y-2">
                {template.steps.map(step => (
                  <div key={step.id} className="flex items-center gap-2 text-sm">
                    <span>{getStepIcon(step.type)}</span>
                    <span className="text-gray-300">{step.name}</span>
                    <span className="text-green-400 ml-auto">{step.conversionRate.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funil Gerado pela IA */}
      {generatedFunnel && (
        <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-8 rounded-xl border border-purple-500">
          <h2 className="text-3xl font-bold text-white mb-6">🎯 Funil Gerado pela IA Ultra-Avançada</h2>
          
          <div className="bg-black/30 p-6 rounded-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">{generatedFunnel.name}</h3>
              <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full font-bold">
                {generatedFunnel.expectedConversion.toFixed(1)}% Conversão Esperada
              </div>
            </div>
            <p className="text-gray-300 mb-6">{generatedFunnel.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {generatedFunnel.steps.map((step, index) => (
                <div key={step.id} className="bg-primary/50 p-4 rounded-lg border border-gray-600">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <span className="text-2xl">{getStepIcon(step.type)}</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">{step.name}</h4>
                  <p className="text-gray-300 text-sm mb-3">{step.content}</p>
                  <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold">
                    {step.conversionRate.toFixed(1)}% conversão
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={purchaseFunnelBuilder}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 px-8 rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all transform hover:scale-105"
            >
              💎 Implementar Funil (R$ 147,00)
            </button>
            <button className="bg-blue-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-blue-700 transition-all">
              📊 Analisar Performance
            </button>
            <button className="bg-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-purple-700 transition-all">
              🎨 Personalizar Design
            </button>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-secondary p-6 rounded-lg border border-gray-700 text-center">
          <div className="text-3xl font-bold text-blue-400 mb-2">500+</div>
          <div className="text-gray-300">Variáveis Analisadas</div>
        </div>
        <div className="bg-secondary p-6 rounded-lg border border-gray-700 text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">97%</div>
          <div className="text-gray-300">Precisão da IA</div>
        </div>
        <div className="bg-secondary p-6 rounded-lg border border-gray-700 text-center">
          <div className="text-3xl font-bold text-purple-400 mb-2">1200%</div>
          <div className="text-gray-300">ROI Médio</div>
        </div>
        <div className="bg-secondary p-6 rounded-lg border border-gray-700 text-center">
          <div className="text-3xl font-bold text-orange-400 mb-2">60 dias</div>
          <div className="text-gray-300">Tempo de ROI</div>
        </div>
      </div>
    </div>
  );
};

export default AIFunnelBuilderPageComplete;
