import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { useNavigate } from 'react-router-dom';

// Interface para configuração do funil
interface FunnelConfig {
  businessType: string;
  businessName: string;
  targetAudience: string;
  mainGoal: string;
  budget: string;
  timeline: string;
  funnelType: string;
  industry: string;
}

// Interface para etapas do funil
interface FunnelStep {
  id: string;
  name: string;
  type: 'landing' | 'capture' | 'sales' | 'upsell' | 'thank-you';
  content: string;
  design: string;
  conversion: number;
}

// Interface para funil gerado
interface GeneratedFunnel {
  id: string;
  name: string;
  steps: FunnelStep[];
  analytics: {
    totalViews: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
  };
  createdAt: string;
  status: 'draft' | 'active' | 'paused';
}

// Componente principal da interface do AI Funnel Builder
const AIFunnelBuilderInterface: React.FC<{
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
}> = ({ isGenerating, setIsGenerating }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [funnelConfig, setFunnelConfig] = useState<FunnelConfig>({
    businessType: '',
    businessName: '',
    targetAudience: '',
    mainGoal: '',
    budget: '',
    timeline: '',
    funnelType: '',
    industry: ''
  });
  const [generatedFunnel, setGeneratedFunnel] = useState<GeneratedFunnel | null>(null);
  const [savedFunnels, setSavedFunnels] = useState<GeneratedFunnel[]>([]);

  // Função para gerar funil com IA
  const generateFunnel = async () => {
    setIsGenerating(true);
    
    try {
      // Simular geração com IA (em produção seria uma API real)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newFunnel: GeneratedFunnel = {
        id: `funnel_${Date.now()}`,
        name: `${funnelConfig.businessName} - ${funnelConfig.funnelType}`,
        steps: [
          {
            id: 'step_1',
            name: 'Página de Captura',
            type: 'capture',
            content: `Página otimizada para capturar leads interessados em ${funnelConfig.businessType}`,
            design: 'Moderno e responsivo com foco em conversão',
            conversion: 35.7
          },
          {
            id: 'step_2',
            name: 'Página de Vendas',
            type: 'sales',
            content: `Apresentação persuasiva do produto/serviço para ${funnelConfig.targetAudience}`,
            design: 'Layout otimizado com prova social e urgência',
            conversion: 12.3
          },
          {
            id: 'step_3',
            name: 'Upsell',
            type: 'upsell',
            content: 'Oferta complementar de alto valor',
            design: 'Design focado em maximizar receita por cliente',
            conversion: 28.9
          },
          {
            id: 'step_4',
            name: 'Obrigado',
            type: 'thank-you',
            content: 'Página de confirmação e próximos passos',
            design: 'Design de retenção e engajamento',
            conversion: 100
          }
        ],
        analytics: {
          totalViews: 0,
          conversions: 0,
          revenue: 0,
          conversionRate: 0
        },
        createdAt: new Date().toISOString(),
        status: 'draft'
      };
      
      setGeneratedFunnel(newFunnel);
      setCurrentStep(3);
    } catch (error) {
      console.error('Erro ao gerar funil:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Função para salvar funil
  const saveFunnel = () => {
    if (generatedFunnel) {
      setSavedFunnels(prev => [...prev, { ...generatedFunnel, status: 'active' }]);
      alert('Funil salvo com sucesso!');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-32 h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
          <span className="text-6xl">🚀</span>
        </div>
        <h2 className="text-4xl font-bold text-light mb-4">
          AI Funnel Builder Ultra-Avançado
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          Crie funis de vendas de alta conversão em minutos com IA
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-secondary/95 backdrop-blur-lg rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-300">Progresso</span>
          <span className="text-sm font-medium text-gray-300">{currentStep}/3</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span className={currentStep >= 1 ? 'text-purple-400' : ''}>Configuração</span>
          <span className={currentStep >= 2 ? 'text-purple-400' : ''}>Geração IA</span>
          <span className={currentStep >= 3 ? 'text-purple-400' : ''}>Resultado</span>
        </div>
      </div>

      {/* Step 1: Configuração */}
      {currentStep === 1 && (
        <div className="bg-secondary/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-gray-700">
          <h3 className="text-2xl font-bold text-light mb-6 flex items-center gap-3">
            <span className="text-3xl">⚙️</span>
            Configuração do Funil
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome do Negócio
              </label>
              <input
                type="text"
                value={funnelConfig.businessName}
                onChange={(e) => setFunnelConfig(prev => ({ ...prev, businessName: e.target.value }))}
                className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-white focus:border-accent focus:outline-none"
                placeholder="Ex: Minha Empresa Digital"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Negócio
              </label>
              <select
                value={funnelConfig.businessType}
                onChange={(e) => setFunnelConfig(prev => ({ ...prev, businessType: e.target.value }))}
                className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-white focus:border-accent focus:outline-none"
              >
                <option value="">Selecione...</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Consultoria">Consultoria</option>
                <option value="Curso Online">Curso Online</option>
                <option value="SaaS">Software (SaaS)</option>
                <option value="Serviços">Prestação de Serviços</option>
                <option value="Afiliados">Marketing de Afiliados</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Público-Alvo
              </label>
              <input
                type="text"
                value={funnelConfig.targetAudience}
                onChange={(e) => setFunnelConfig(prev => ({ ...prev, targetAudience: e.target.value }))}
                className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-white focus:border-accent focus:outline-none"
                placeholder="Ex: Empreendedores digitais de 25-45 anos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Objetivo Principal
              </label>
              <select
                value={funnelConfig.mainGoal}
                onChange={(e) => setFunnelConfig(prev => ({ ...prev, mainGoal: e.target.value }))}
                className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-white focus:border-accent focus:outline-none"
              >
                <option value="">Selecione...</option>
                <option value="Gerar Leads">Gerar Leads</option>
                <option value="Vender Produto">Vender Produto</option>
                <option value="Aumentar Receita">Aumentar Receita</option>
                <option value="Construir Lista">Construir Lista de Email</option>
                <option value="Webinar">Promover Webinar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Orçamento Mensal
              </label>
              <select
                value={funnelConfig.budget}
                onChange={(e) => setFunnelConfig(prev => ({ ...prev, budget: e.target.value }))}
                className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-white focus:border-accent focus:outline-none"
              >
                <option value="">Selecione...</option>
                <option value="Até R$ 1.000">Até R$ 1.000</option>
                <option value="R$ 1.000 - R$ 5.000">R$ 1.000 - R$ 5.000</option>
                <option value="R$ 5.000 - R$ 10.000">R$ 5.000 - R$ 10.000</option>
                <option value="R$ 10.000 - R$ 50.000">R$ 10.000 - R$ 50.000</option>
                <option value="Acima de R$ 50.000">Acima de R$ 50.000</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Funil
              </label>
              <select
                value={funnelConfig.funnelType}
                onChange={(e) => setFunnelConfig(prev => ({ ...prev, funnelType: e.target.value }))}
                className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-white focus:border-accent focus:outline-none"
              >
                <option value="">Selecione...</option>
                <option value="Lead Magnet">Lead Magnet</option>
                <option value="Vendas Diretas">Vendas Diretas</option>
                <option value="Webinar">Webinar</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Tripwire">Tripwire</option>
                <option value="Membership">Membership</option>
              </select>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!funnelConfig.businessName || !funnelConfig.businessType || !funnelConfig.targetAudience}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-pink-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 text-lg"
            >
              Continuar para Geração IA 🚀
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Geração com IA */}
      {currentStep === 2 && (
        <div className="bg-secondary/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-gray-700">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-light mb-6 flex items-center justify-center gap-3">
              <span className="text-3xl">🧠</span>
              Geração com IA Ultra-Avançada
            </h3>
            
            {!isGenerating ? (
              <div className="space-y-6">
                <div className="bg-primary/60 rounded-2xl p-6 border border-purple-500/30">
                  <h4 className="text-xl font-bold text-purple-400 mb-4">Configuração Atual:</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-left">
                    <div><strong>Negócio:</strong> {funnelConfig.businessName}</div>
                    <div><strong>Tipo:</strong> {funnelConfig.businessType}</div>
                    <div><strong>Público:</strong> {funnelConfig.targetAudience}</div>
                    <div><strong>Objetivo:</strong> {funnelConfig.mainGoal}</div>
                    <div><strong>Orçamento:</strong> {funnelConfig.budget}</div>
                    <div><strong>Funil:</strong> {funnelConfig.funnelType}</div>
                  </div>
                </div>
                
                <button
                  onClick={generateFunnel}
                  className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-red-600 hover:via-pink-600 hover:to-purple-600 text-white font-bold py-6 px-12 rounded-3xl transition-all duration-500 transform hover:scale-105 text-xl shadow-2xl"
                >
                  🚀 Gerar Funil com IA Ultra-Avançada
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto animate-spin">
                  <span className="text-6xl">🧠</span>
                </div>
                <h4 className="text-2xl font-bold text-light">IA Processando...</h4>
                <div className="space-y-2 text-gray-300">
                  <p>🔍 Analisando seu negócio e público-alvo</p>
                  <p>📊 Processando dados de conversão de 500M+ funis</p>
                  <p>🎯 Otimizando estratégia para máxima conversão</p>
                  <p>🚀 Gerando funil personalizado ultra-avançado</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Resultado */}
      {currentStep === 3 && generatedFunnel && (
        <div className="space-y-6">
          <div className="bg-secondary/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-gray-700">
            <h3 className="text-2xl font-bold text-light mb-6 flex items-center gap-3">
              <span className="text-3xl">✨</span>
              Funil Gerado com Sucesso!
            </h3>
            
            <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-2xl p-6 border border-green-500/30 mb-6">
              <h4 className="text-xl font-bold text-green-400 mb-2">{generatedFunnel.name}</h4>
              <p className="text-gray-300">Funil otimizado com IA para máxima conversão</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {generatedFunnel.steps.map((step, index) => (
                <div key={step.id} className="bg-primary/60 rounded-xl p-4 border border-purple-500/30">
                  <div className="text-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold">{index + 1}</span>
                    </div>
                    <h5 className="font-bold text-light">{step.name}</h5>
                  </div>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p><strong>Tipo:</strong> {step.type}</p>
                    <p><strong>Conversão:</strong> {step.conversion}%</p>
                    <p className="text-xs">{step.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={saveFunnel}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                💾 Salvar Funil
              </button>
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setGeneratedFunnel(null);
                  setFunnelConfig({
                    businessType: '',
                    businessName: '',
                    targetAudience: '',
                    mainGoal: '',
                    budget: '',
                    timeline: '',
                    funnelType: '',
                    industry: ''
                  });
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                🔄 Criar Novo Funil
              </button>
            </div>
          </div>

          {/* Funis Salvos */}
          {savedFunnels.length > 0 && (
            <div className="bg-secondary/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-gray-700">
              <h3 className="text-2xl font-bold text-light mb-6 flex items-center gap-3">
                <span className="text-3xl">📊</span>
                Seus Funis Salvos ({savedFunnels.length})
              </h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedFunnels.map((funnel) => (
                  <div key={funnel.id} className="bg-primary/60 rounded-xl p-4 border border-gray-600">
                    <h4 className="font-bold text-light mb-2">{funnel.name}</h4>
                    <div className="space-y-1 text-sm text-gray-300">
                      <p><strong>Etapas:</strong> {funnel.steps.length}</p>
                      <p><strong>Status:</strong> <span className="text-green-400">{funnel.status}</span></p>
                      <p><strong>Criado:</strong> {new Date(funnel.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded">
                        Editar
                      </button>
                      <button className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded">
                        Ativar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AIFunnelBuilderPage: React.FC = () => {
  const { user, hasAccess } = useAuth();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  const hasFunnelAccess = hasAccess('aiFunnelBuilder');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-primary px-4 py-2 rounded-lg border border-gray-600 hover:border-accent"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Dashboard
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-light mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
            🚀 AI Funnel Builder Ultra-Avançado
          </h1>
          <p className="text-3xl text-gray-300 max-w-5xl mx-auto">
            A ferramenta mais revolucionária do mundo digital para criar funis de vendas com IA
          </p>
        </div>

        {user?.type !== 'admin' && !hasFunnelAccess ? (
          <div className="bg-secondary/95 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-gray-700 max-w-6xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-red-600/10"></div>
            <div className="relative z-10">
              <div className="text-center mb-10">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                  <span className="text-6xl">🤖</span>
                </div>
                <h2 className="text-4xl font-bold text-light mb-6">Ferramenta Revolucionária Exclusiva</h2>
                <p className="text-2xl text-gray-300 max-w-4xl mx-auto">
                  O primeiro construtor de funis com IA verdadeiramente inteligente do mundo. 
                  Jamais visto antes no mercado digital.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 mb-10">
                <div className="bg-primary/60 rounded-2xl p-8 border border-purple-500/30">
                  <h3 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-3">
                    <span className="text-4xl">🧠</span> IA Ultra-Avançada
                  </h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-purple-400 text-xl">✨</span>
                      <span><strong>Análise comportamental em tempo real</strong> de milhões de usuários</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-pink-400 text-xl">🎯</span>
                      <span><strong>Personalização dinâmica</strong> baseada em 500+ variáveis</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-400 text-xl">⚡</span>
                      <span><strong>Otimização automática</strong> com machine learning</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-primary/60 rounded-2xl p-8 border border-pink-500/30">
                  <h3 className="text-2xl font-bold text-pink-400 mb-6 flex items-center gap-3">
                    <span className="text-4xl">💎</span> Recursos Únicos
                  </h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-purple-400 text-xl">🔮</span>
                      <span><strong>Predição de conversão</strong> com 97% de precisão</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-pink-400 text-xl">🎨</span>
                      <span><strong>Design automático</strong> baseado em psicologia</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-400 text-xl">📊</span>
                      <span><strong>Analytics preditivos</strong> em tempo real</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-primary/60 rounded-2xl p-8 border border-red-500/30">
                  <h3 className="text-2xl font-bold text-red-400 mb-6 flex items-center gap-3">
                    <span className="text-4xl">💰</span> Resultados Garantidos
                  </h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-purple-400 text-xl">📈</span>
                      <span><strong>Aumento de 400-800%</strong> nas conversões</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-pink-400 text-xl">💎</span>
                      <span><strong>ROI médio de 1200%</strong> em 60 dias</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-400 text-xl">🚀</span>
                      <span><strong>Redução de 90%</strong> no tempo de criação</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-red-600/20 rounded-3xl p-10 border border-purple-500/30 mb-10">
                <h3 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  🌟 Oferta Exclusiva de Lançamento Mundial
                </h3>
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-6 mb-6">
                    <span className="text-4xl text-gray-500 line-through">R$ 1.997,00</span>
                    <span className="text-7xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">R$ 497,00</span>
                  </div>
                  <p className="text-2xl text-gray-300">
                    <strong>75% OFF</strong> - Apenas para os primeiros 50 usuários no mundo!
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-purple-400">🎯 O que está incluído:</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li>• IA proprietária com 500M+ dados de conversão</li>
                      <li>• Templates de funis que converteram R$ 100M+</li>
                      <li>• Integração com 200+ ferramentas</li>
                      <li>• Suporte VIP 24/7 por 1 ano</li>
                      <li>• Garantia de resultados ou dinheiro de volta</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-pink-400">⚡ Bônus exclusivos:</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li>• Curso completo de funis (R$ 497)</li>
                      <li>• 100 templates premium (R$ 297)</li>
                      <li>• Consultoria estratégica (R$ 997)</li>
                      <li>• Acesso vitalício a atualizações</li>
                      <li>• Comunidade VIP exclusiva</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-6">
                <button
                  onClick={() => navigate('/dashboard/billing')}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-red-600 hover:via-pink-600 hover:to-purple-600 text-white font-bold py-6 px-12 rounded-3xl transition-all duration-500 transform hover:scale-105 text-2xl shadow-2xl"
                >
                  🔥 Upgrade para Plano Anual (INCLUSO)
                </button>
                
                <div className="flex items-center gap-2 justify-center text-lg text-gray-500 uppercase font-bold">
                  <div className="h-px bg-gray-600 flex-1"></div>
                  <span>OU ADQUIRA SEPARADAMENTE</span>
                  <div className="h-px bg-gray-600 flex-1"></div>
                </div>

                <button
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-6 px-12 rounded-3xl transition-all duration-500 transform hover:scale-105 text-2xl shadow-2xl flex items-center justify-center gap-4"
                >
                  💳 Comprar Agora por R$ 497,00
                  <span className="text-lg bg-red-500 px-3 py-1 rounded-full">-75%</span>
                </button>

                <div className="flex items-center justify-center gap-8 text-lg text-gray-400 mt-8">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-2xl">🔒</span>
                    <span>Pagamento 100% Seguro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 text-2xl">⚡</span>
                    <span>Acesso Imediato</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 text-2xl">🎯</span>
                    <span>Garantia 30 dias</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <AIFunnelBuilderInterface isGenerating={isGenerating} setIsGenerating={setIsGenerating} />
        )}
      </div>
    </div>
  );
};

export default AIFunnelBuilderPage;
