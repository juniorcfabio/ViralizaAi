import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface TargetingArea {
  id: string;
  name: string;
  description: string;
  metrics: {
    reach: number;
    engagement: number;
    conversion: number;
    cost: number;
  };
  suggestions: string[];
  isActive: boolean;
}

const TargetingAreasPage: React.FC = () => {
  const { user } = useAuth();
  const [targetingAreas, setTargetingAreas] = useState<TargetingArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<TargetingArea | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadTargetingAreas();
  }, []);

  const loadTargetingAreas = () => {
    const areas: TargetingArea[] = [
      {
        id: 'social-media',
        name: '📱 Redes Sociais',
        description: 'Otimização para Instagram, Facebook, TikTok e YouTube',
        metrics: {
          reach: 2500000,
          engagement: 8.7,
          conversion: 3.2,
          cost: 0.45
        },
        suggestions: [
          'Focar em conteúdo visual de alta qualidade',
          'Usar hashtags estratégicas para seu nicho',
          'Postar nos horários de maior engajamento',
          'Criar stories interativos para aumentar alcance',
          'Implementar User Generated Content (UGC)'
        ],
        isActive: true
      },
      {
        id: 'search-engines',
        name: '🔍 Mecanismos de Busca',
        description: 'SEO e SEM para Google, Bing e outros buscadores',
        metrics: {
          reach: 1800000,
          engagement: 12.4,
          conversion: 5.8,
          cost: 0.78
        },
        suggestions: [
          'Otimizar palavras-chave de cauda longa',
          'Melhorar velocidade de carregamento do site',
          'Criar conteúdo relevante e atualizado',
          'Implementar schema markup',
          'Focar em featured snippets'
        ],
        isActive: true
      },
      {
        id: 'email-marketing',
        name: '📧 Email Marketing',
        description: 'Campanhas de email segmentadas e personalizadas',
        metrics: {
          reach: 850000,
          engagement: 24.6,
          conversion: 8.9,
          cost: 0.12
        },
        suggestions: [
          'Segmentar lista por comportamento',
          'Personalizar assunto e conteúdo',
          'Implementar automação de nutrição',
          'Testar diferentes horários de envio',
          'Criar sequências de onboarding'
        ],
        isActive: true
      },
      {
        id: 'content-marketing',
        name: '📝 Marketing de Conteúdo',
        description: 'Blogs, vídeos, podcasts e materiais educativos',
        metrics: {
          reach: 1200000,
          engagement: 15.3,
          conversion: 4.7,
          cost: 0.32
        },
        suggestions: [
          'Criar conteúdo evergreen de qualidade',
          'Desenvolver série de conteúdos temáticos',
          'Usar storytelling para engajar audiência',
          'Implementar call-to-actions estratégicos',
          'Reutilizar conteúdo em diferentes formatos'
        ],
        isActive: true
      },
      {
        id: 'paid-advertising',
        name: '💰 Publicidade Paga',
        description: 'Google Ads, Facebook Ads, LinkedIn Ads e outras plataformas',
        metrics: {
          reach: 3200000,
          engagement: 6.8,
          conversion: 7.2,
          cost: 1.25
        },
        suggestions: [
          'Criar campanhas segmentadas por persona',
          'Testar diferentes criativos e copies',
          'Implementar remarketing estratégico',
          'Otimizar landing pages para conversão',
          'Usar lookalike audiences'
        ],
        isActive: true
      },
      {
        id: 'influencer-marketing',
        name: '🌟 Marketing de Influência',
        description: 'Parcerias com influenciadores e criadores de conteúdo',
        metrics: {
          reach: 950000,
          engagement: 18.9,
          conversion: 6.4,
          cost: 0.89
        },
        suggestions: [
          'Identificar micro-influenciadores do nicho',
          'Criar campanhas autênticas e relevantes',
          'Estabelecer métricas claras de performance',
          'Desenvolver relacionamentos de longo prazo',
          'Usar códigos de desconto únicos'
        ],
        isActive: false
      }
    ];

    setTargetingAreas(areas);
  };

  const analyzeArea = async (area: TargetingArea) => {
    setSelectedArea(area);
    setIsAnalyzing(true);

    // Simular análise IA
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  const toggleAreaStatus = (areaId: string) => {
    setTargetingAreas(prev => 
      prev.map(area => 
        area.id === areaId 
          ? { ...area, isActive: !area.isActive }
          : area
      )
    );
  };

  const getMetricColor = (value: number, type: string) => {
    if (type === 'cost') {
      return value < 0.5 ? 'text-green-400' : value < 1.0 ? 'text-yellow-400' : 'text-red-400';
    }
    return value > 10 ? 'text-green-400' : value > 5 ? 'text-yellow-400' : 'text-red-400';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-xl">
        <h1 className="text-4xl font-bold text-white mb-2">
          🎯 Áreas para Melhorar seu Direcionamento
        </h1>
        <p className="text-indigo-100 text-lg">
          Análise inteligente das melhores oportunidades para otimizar suas campanhas
        </p>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-secondary p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">📊 Alcance Total</h3>
          <div className="text-3xl font-bold text-white">
            {(targetingAreas.reduce((sum, area) => sum + area.metrics.reach, 0) / 1000000).toFixed(1)}M
          </div>
          <div className="text-sm text-gray-400">Pessoas alcançadas</div>
        </div>

        <div className="bg-secondary p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-green-400 mb-2">💚 Engajamento Médio</h3>
          <div className="text-3xl font-bold text-white">
            {(targetingAreas.reduce((sum, area) => sum + area.metrics.engagement, 0) / targetingAreas.length).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400">Taxa média</div>
        </div>

        <div className="bg-secondary p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-purple-400 mb-2">🎯 Conversão Média</h3>
          <div className="text-3xl font-bold text-white">
            {(targetingAreas.reduce((sum, area) => sum + area.metrics.conversion, 0) / targetingAreas.length).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400">Taxa média</div>
        </div>

        <div className="bg-secondary p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-orange-400 mb-2">💰 CPC Médio</h3>
          <div className="text-3xl font-bold text-white">
            R$ {(targetingAreas.reduce((sum, area) => sum + area.metrics.cost, 0) / targetingAreas.length).toFixed(2)}
          </div>
          <div className="text-sm text-gray-400">Custo por clique</div>
        </div>
      </div>

      {/* Áreas de Direcionamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">🎯 Áreas de Oportunidade</h2>
          
          {targetingAreas.map(area => (
            <div
              key={area.id}
              className={`bg-secondary p-6 rounded-lg border transition-all cursor-pointer ${
                selectedArea?.id === area.id 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-gray-700 hover:border-purple-400'
              }`}
              onClick={() => analyzeArea(area)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{area.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAreaStatus(area.id);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      area.isActive ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      area.isActive ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </button>
                  <span className={`text-sm font-semibold ${
                    area.isActive ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {area.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              <p className="text-gray-300 mb-4">{area.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Alcance</div>
                  <div className="text-lg font-bold text-blue-400">
                    {(area.metrics.reach / 1000000).toFixed(1)}M
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Engajamento</div>
                  <div className={`text-lg font-bold ${getMetricColor(area.metrics.engagement, 'engagement')}`}>
                    {area.metrics.engagement}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Conversão</div>
                  <div className={`text-lg font-bold ${getMetricColor(area.metrics.conversion, 'conversion')}`}>
                    {area.metrics.conversion}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">CPC</div>
                  <div className={`text-lg font-bold ${getMetricColor(area.metrics.cost, 'cost')}`}>
                    R$ {area.metrics.cost.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Análise Detalhada */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">🔍 Análise Detalhada</h2>
          
          {selectedArea ? (
            <div className="bg-secondary p-6 rounded-lg border border-gray-700">
              {isAnalyzing ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-purple-400 font-semibold">🤖 IA analisando oportunidades...</p>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-white mb-4">{selectedArea.name}</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-purple-400 mb-3">💡 Sugestões de Melhoria</h4>
                    <div className="space-y-3">
                      {selectedArea.suggestions.map((suggestion, index) => (
                        <div key={index} className="bg-primary/50 p-4 rounded-lg border border-gray-600">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <p className="text-gray-300">{suggestion}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-primary/30 p-4 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Potencial de Melhoria</div>
                      <div className="text-2xl font-bold text-green-400">
                        +{(Math.random() * 40 + 10).toFixed(0)}%
                      </div>
                    </div>
                    <div className="bg-primary/30 p-4 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">ROI Estimado</div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {(Math.random() * 300 + 150).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button className="flex-1 bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors">
                      🚀 Implementar Sugestões
                    </button>
                    <button className="flex-1 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                      📊 Ver Relatório Completo
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-secondary p-12 rounded-lg border border-gray-700 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white mb-2">Selecione uma Área</h3>
              <p className="text-gray-400">
                Clique em uma das áreas ao lado para ver análise detalhada e sugestões personalizadas
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Plano de Ação */}
      <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 p-8 rounded-xl border border-green-500/30">
        <h2 className="text-3xl font-bold text-white mb-6">📋 Plano de Ação Recomendado</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-black/30 p-6 rounded-lg">
            <div className="text-2xl font-bold text-green-400 mb-2">Semana 1-2</div>
            <h4 className="text-lg font-semibold text-white mb-3">🎯 Foco Imediato</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Otimizar campanhas de email marketing</li>
              <li>• Melhorar SEO das páginas principais</li>
              <li>• Ajustar segmentação das redes sociais</li>
            </ul>
          </div>

          <div className="bg-black/30 p-6 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400 mb-2">Semana 3-4</div>
            <h4 className="text-lg font-semibold text-white mb-3">🚀 Expansão</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Implementar marketing de conteúdo</li>
              <li>• Testar novas plataformas pagas</li>
              <li>• Desenvolver parcerias com influenciadores</li>
            </ul>
          </div>

          <div className="bg-black/30 p-6 rounded-lg">
            <div className="text-2xl font-bold text-purple-400 mb-2">Mês 2+</div>
            <h4 className="text-lg font-semibold text-white mb-3">📈 Otimização</h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Automatizar processos bem-sucedidos</li>
              <li>• Escalar campanhas de maior ROI</li>
              <li>• Implementar testes A/B avançados</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TargetingAreasPage;
