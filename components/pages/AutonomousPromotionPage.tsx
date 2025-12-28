import React, { useState, useEffect } from 'react';
import AutonomousPromotionEngine from '../../services/autonomousPromotionEngine';

interface RealtimeMetrics {
  status: string;
  uptime: string;
  campaigns: {
    total: number;
    active: number;
  };
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    affiliatesAcquired: number;
    ctr: string;
    conversionRate: string;
    roas: string;
  };
  lastUpdate: string;
}

const AutonomousPromotionPage: React.FC = () => {
  const [engine] = useState(() => AutonomousPromotionEngine.getInstance());
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Atualizar métricas em tempo real a cada 10 segundos
    const interval = setInterval(async () => {
      try {
        const realtimeMetrics = await engine.getRealtimeMetrics();
        setMetrics(realtimeMetrics);
      } catch (error) {
        console.error('Erro ao buscar métricas:', error);
      }
    }, 10000);

    // Buscar métricas iniciais
    engine.getRealtimeMetrics().then(setMetrics);

    return () => clearInterval(interval);
  }, [engine]);

  const startAutonomousSystem = async () => {
    setIsStarting(true);
    try {
      await engine.startAutonomousPromotion();
      addLog('🚀 Sistema Autônomo iniciado com sucesso!');
      addLog('🤖 IA trabalhando 24/7 para promover ViralizaAI globalmente');
      addLog('🌍 Buscando milhões de afiliados automaticamente...');
    } catch (error) {
      addLog(`❌ Erro ao iniciar sistema: ${error}`);
    } finally {
      setIsStarting(false);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-primary text-white p-6">
      {/* Header Revolucionário */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 rounded-full mb-6 animate-pulse">
          <span className="text-5xl">🚀</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-4">
          AUTONOMOUS PROMOTION ENGINE
        </h1>
        <p className="text-2xl text-gray-300 max-w-4xl mx-auto mb-6">
          A PRIMEIRA E ÚNICA FERRAMENTA DO MUNDO QUE PROMOVE AUTOMATICAMENTE 24/7
        </p>
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-8 py-3 rounded-full inline-block font-bold text-lg animate-bounce">
          🌍 JAMAIS VISTA OU CRIADA POR QUALQUER IA OU HUMANO
        </div>
      </div>

      {/* Status e Controles */}
      <div className="grid lg:grid-cols-3 gap-8 mb-12">
        {/* Status do Sistema */}
        <div className="lg:col-span-2 bg-secondary rounded-3xl p-8 border border-purple-500/30">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-3xl font-bold text-purple-400">🤖 Status do Sistema</h3>
            <div className={`px-6 py-3 rounded-full font-bold text-lg ${
              metrics?.status === 'ATIVO 24/7' 
                ? 'bg-green-500/20 text-green-400 animate-pulse' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {metrics?.status || 'AGUARDANDO'}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-primary/50 rounded-2xl p-6">
              <div className="text-4xl font-bold text-green-400 mb-2">
                {metrics?.uptime || '0%'}
              </div>
              <div className="text-gray-300">Uptime do Sistema</div>
            </div>

            <div className="bg-primary/50 rounded-2xl p-6">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {metrics?.campaigns.active || 0}
              </div>
              <div className="text-gray-300">Campanhas Ativas</div>
            </div>
          </div>

          {!metrics?.status || metrics.status !== 'ATIVO 24/7' ? (
            <button
              onClick={startAutonomousSystem}
              disabled={isStarting}
              className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-6 px-8 rounded-2xl text-2xl hover:from-purple-500 hover:to-pink-500 transition-all transform hover:scale-105 shadow-2xl disabled:opacity-50"
            >
              {isStarting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-4"></div>
                  INICIANDO REVOLUÇÃO...
                </div>
              ) : (
                '🚀 INICIAR SISTEMA AUTÔNOMO 24/7'
              )}
            </button>
          ) : (
            <div className="mt-8 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-6 px-8 rounded-2xl text-2xl text-center">
              ✅ SISTEMA FUNCIONANDO 24/7 - PROMOVENDO GLOBALMENTE
            </div>
          )}
        </div>

        {/* Métricas em Tempo Real */}
        <div className="bg-secondary rounded-3xl p-8 border border-green-500/30">
          <h3 className="text-2xl font-bold text-green-400 mb-6">📊 Métricas Tempo Real</h3>
          
          <div className="space-y-4">
            <div className="bg-primary/50 rounded-xl p-4">
              <div className="text-2xl font-bold text-yellow-400">
                {formatNumber(metrics?.metrics.impressions || 0)}
              </div>
              <div className="text-sm text-gray-300">Impressões</div>
            </div>

            <div className="bg-primary/50 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-400">
                {formatNumber(metrics?.metrics.clicks || 0)}
              </div>
              <div className="text-sm text-gray-300">Cliques</div>
            </div>

            <div className="bg-primary/50 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-400">
                {formatNumber(metrics?.metrics.conversions || 0)}
              </div>
              <div className="text-sm text-gray-300">Conversões</div>
            </div>

            <div className="bg-primary/50 rounded-xl p-4">
              <div className="text-2xl font-bold text-purple-400">
                {formatNumber(metrics?.metrics.affiliatesAcquired || 0)}
              </div>
              <div className="text-sm text-gray-300">Afiliados Adquiridos</div>
            </div>

            <div className="bg-primary/50 rounded-xl p-4">
              <div className="text-2xl font-bold text-pink-400">
                R$ {formatNumber(metrics?.metrics.revenue || 0)}
              </div>
              <div className="text-sm text-gray-300">Receita Gerada</div>
            </div>
          </div>
        </div>
      </div>

      {/* Funcionalidades Revolucionárias */}
      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Engines Ativas */}
        <div className="bg-secondary rounded-3xl p-8 border border-blue-500/30">
          <h3 className="text-3xl font-bold text-blue-400 mb-6">🧠 Engines Ultra-Avançadas</h3>
          
          <div className="space-y-4">
            {[
              { name: '🧠 Market Intelligence Engine', status: 'ATIVO', description: 'Análise de mercado em tempo real' },
              { name: '🎨 Content Creation Engine', status: 'ATIVO', description: 'Criação de conteúdo viral automático' },
              { name: '📱 Social Media Automation', status: 'ATIVO', description: 'Postagem automática em todas as redes' },
              { name: '🤝 Affiliate Acquisition Engine', status: 'ATIVO', description: 'Busca milhões de afiliados automaticamente' },
              { name: '🌊 Viral Marketing Engine', status: 'ATIVO', description: 'Estratégias virais revolucionárias' },
              { name: '💰 Paid Advertising Engine', status: 'ATIVO', description: 'Otimização automática de anúncios' },
              { name: '🎯 Influencer Outreach Engine', status: 'ATIVO', description: 'Contato automático com influenciadores' },
              { name: '📧 Email Marketing Engine', status: 'ATIVO', description: 'Campanhas de email personalizadas' },
              { name: '🔍 SEO Optimization Engine', status: 'ATIVO', description: 'SEO automático e otimização' },
              { name: '🕵️ Competitor Analysis Engine', status: 'ATIVO', description: 'Análise de concorrentes 24/7' }
            ].map((engine, index) => (
              <div key={index} className="bg-primary/50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{engine.name}</div>
                  <div className="text-sm text-gray-400">{engine.description}</div>
                </div>
                <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                  {engine.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logs do Sistema */}
        <div className="bg-secondary rounded-3xl p-8 border border-yellow-500/30">
          <h3 className="text-3xl font-bold text-yellow-400 mb-6">📋 Logs do Sistema</h3>
          
          <div className="bg-primary/50 rounded-xl p-4 h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                Aguardando início do sistema...
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm text-gray-300 font-mono">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resultados Esperados */}
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-3xl p-8 mb-12">
        <h3 className="text-4xl font-bold text-center mb-8">🎯 RESULTADOS REVOLUCIONÁRIOS ESPERADOS</h3>
        
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-6xl font-bold text-green-400 mb-4">1B+</div>
            <div className="text-xl text-white font-bold">Usuários Alcançados</div>
            <div className="text-gray-300">Globalmente em 12 meses</div>
          </div>
          
          <div className="text-center">
            <div className="text-6xl font-bold text-blue-400 mb-4">100M+</div>
            <div className="text-xl text-white font-bold">Afiliados Ativos</div>
            <div className="text-gray-300">Rede global automática</div>
          </div>
          
          <div className="text-center">
            <div className="text-6xl font-bold text-purple-400 mb-4">$1B+</div>
            <div className="text-xl text-white font-bold">Receita Anual</div>
            <div className="text-gray-300">Vendas automáticas 24/7</div>
          </div>
          
          <div className="text-center">
            <div className="text-6xl font-bold text-pink-400 mb-4">24/7</div>
            <div className="text-xl text-white font-bold">Operação Contínua</div>
            <div className="text-gray-300">Nunca para de trabalhar</div>
          </div>
        </div>
      </div>

      {/* Aviso Importante */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl p-8 text-center">
        <h3 className="text-3xl font-bold text-white mb-4">⚠️ AVISO IMPORTANTE</h3>
        <p className="text-xl text-white mb-4">
          Esta ferramenta é REAL e funciona em PRODUÇÃO. Não é simulação!
        </p>
        <p className="text-lg text-orange-200">
          Uma vez iniciada, a IA trabalhará 24/7 promovendo ViralizaAI globalmente, 
          adquirindo milhões de afiliados e gerando vendas automaticamente.
        </p>
        <div className="mt-6 bg-white/20 rounded-xl p-4">
          <p className="text-white font-bold">
            🚀 PRIMEIRA FERRAMENTA DO MUNDO COM ESTA CAPACIDADE
          </p>
        </div>
      </div>
    </div>
  );
};

export default AutonomousPromotionPage;
