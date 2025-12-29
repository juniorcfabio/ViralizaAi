import React, { useState, useEffect } from 'react';
import ViralMarketingEngine from '../../services/viralMarketingEngine';

const ViralMarketingPage: React.FC = () => {
  const [engine] = useState(() => ViralMarketingEngine.getInstance());
  const [metrics, setMetrics] = useState<any>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Atualizar métricas em tempo real a cada 10 segundos
    const interval = setInterval(async () => {
      try {
        const viralMetrics = await engine.getViralMetrics();
        setMetrics(viralMetrics);
      } catch (error) {
        console.error('Erro ao buscar métricas:', error);
      }
    }, 10000);

    // Buscar métricas iniciais
    engine.getViralMetrics().then(setMetrics);

    return () => clearInterval(interval);
  }, [engine]);

  const startViralSystem = async () => {
    setIsStarting(true);
    try {
      await engine.startViralMarketing();
      addLog('🚀 Sistema de Marketing Viral iniciado com sucesso!');
      addLog('🎨 Gerando 1000+ conteúdos virais por dia');
      addLog('💰 Programa de afiliados ultra-agressivo ativado');
      addLog('🔍 SEO para 500k+ buscas mensais implementado');
      addLog('🤝 Outreach para 500+ influenciadores iniciado');
      addLog('🎁 Programa de referência viral com R$ 50k em prêmios');
      
      // Ativar estratégia bilionária
      await engine.implementBillionDollarStrategy();
      addLog('💎 ESTRATÉGIA BILIONÁRIA ATIVADA!');
      addLog('🎯 Meta: R$ 3.1B+ anuais sem investimento');
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

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            🚀 Marketing Viral Ultra-Avançado
          </h1>
          <p className="text-xl text-blue-200 mb-6">
            Sistema GRATUITO para faturar BILHÕES sem investimento
          </p>
          
          <button
            onClick={startViralSystem}
            disabled={isStarting || metrics?.status === 'VIRAL ATIVO 24/7'}
            className={`px-8 py-4 rounded-xl font-bold text-xl transition-all duration-300 ${
              metrics?.status === 'VIRAL ATIVO 24/7'
                ? 'bg-green-600 text-white cursor-not-allowed'
                : isStarting
                ? 'bg-yellow-600 text-white cursor-wait'
                : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700 transform hover:scale-105'
            }`}
          >
            {metrics?.status === 'VIRAL ATIVO 24/7' ? (
              '✅ SISTEMA VIRAL ATIVO 24/7'
            ) : isStarting ? (
              '⏳ INICIANDO SISTEMA BILIONÁRIO...'
            ) : (
              '💎 INICIAR SISTEMA BILIONÁRIO GRATUITO'
            )}
          </button>
        </div>

        {/* Status Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Status do Sistema</p>
                  <p className="text-2xl font-bold">{metrics.status}</p>
                </div>
                <div className="text-4xl">🔥</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Conteúdos Virais</p>
                  <p className="text-2xl font-bold">{formatNumber(metrics.content?.total || 0)}</p>
                  <p className="text-blue-200 text-xs">Score: {metrics.content?.avgScore || 0}</p>
                </div>
                <div className="text-4xl">🎨</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Alcance Total</p>
                  <p className="text-2xl font-bold">{formatNumber(metrics.reach?.total || 0)}</p>
                  <p className="text-purple-200 text-xs">Diário: {formatNumber(metrics.reach?.daily || 0)}</p>
                </div>
                <div className="text-4xl">📈</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Receita Estimada</p>
                  <p className="text-2xl font-bold">{formatCurrency(metrics.conversions?.estimatedRevenue || 0)}</p>
                  <p className="text-yellow-200 text-xs">100% Orgânico</p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>
          </div>
        )}

        {/* Projeção de Receita Gratuita */}
        {metrics?.revenueProjection && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              💎 Projeção de Receita GRATUITA
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">📊 Tráfego Mensal</h3>
                <p className="text-3xl font-bold text-green-400">
                  {formatNumber(metrics.revenueProjection.traffic.monthly)}
                </p>
                <p className="text-green-200 text-sm">
                  {formatNumber(metrics.revenueProjection.traffic.daily)} visitantes/dia
                </p>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">SEO:</span>
                    <span className="text-white">{formatNumber(metrics.revenueProjection.traffic.sources.seo)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Viral:</span>
                    <span className="text-white">{formatNumber(metrics.revenueProjection.traffic.sources.viral)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Social:</span>
                    <span className="text-white">{formatNumber(metrics.revenueProjection.traffic.sources.social)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">🎯 Vendas Mensais</h3>
                <p className="text-3xl font-bold text-blue-400">
                  {formatNumber(metrics.revenueProjection.sales.monthly)}
                </p>
                <p className="text-blue-200 text-sm">
                  {formatNumber(metrics.revenueProjection.sales.daily)} vendas/dia
                </p>
                <p className="text-blue-300 text-sm mt-2">
                  Taxa: {metrics.revenueProjection.sales.conversionRate}
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">💰 Receita</h3>
                <p className="text-3xl font-bold text-purple-400">
                  {formatCurrency(metrics.revenueProjection.revenue.monthly)}
                </p>
                <p className="text-purple-200 text-sm">
                  {formatCurrency(metrics.revenueProjection.revenue.daily)}/dia
                </p>
                <p className="text-purple-300 text-sm mt-2">
                  Anual: {formatCurrency(metrics.revenueProjection.revenue.yearly)}
                </p>
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">📈 Crescimento Exponencial</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-yellow-400">{metrics.revenueProjection.growth.monthlyGrowthRate}</p>
                  <p className="text-yellow-200 text-sm">Crescimento Mensal</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-400">{metrics.revenueProjection.growth.compoundAnnualGrowth}</p>
                  <p className="text-orange-200 text-sm">Crescimento Anual</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">{metrics.revenueProjection.growth.breakEvenPoint}</p>
                  <p className="text-red-200 text-sm">Break Even</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estratégias Gratuitas Ativas */}
        {metrics?.freeStrategies && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              🎯 Estratégias Gratuitas Ativas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(metrics.freeStrategies).map(([key, value]) => (
                <div key={key} className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-indigo-200 text-sm">{value}</p>
                    </div>
                    <div className="text-2xl">✅</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Programa de Afiliados Ultra-Agressivo */}
        {metrics?.affiliates && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              🤝 Programa de Afiliados Ultra-Agressivo
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4 text-center">
                <p className="text-green-400 text-3xl font-bold">{metrics.affiliates.baseCommission}</p>
                <p className="text-green-200 text-sm">Comissão Base</p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg p-4 text-center">
                <p className="text-blue-400 text-3xl font-bold">{metrics.affiliates.maxCommission}</p>
                <p className="text-blue-200 text-sm">Comissão Máxima</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 text-center">
                <p className="text-purple-400 text-3xl font-bold">{metrics.affiliates.firstSaleBonus}</p>
                <p className="text-purple-200 text-sm">Bônus 1ª Venda</p>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 text-center">
                <p className="text-yellow-400 text-3xl font-bold">{metrics.affiliates.monthlyLeaderPrize}</p>
                <p className="text-yellow-200 text-sm">Prêmio Mensal</p>
              </div>
            </div>
          </div>
        )}

        {/* Alcance por Plataforma */}
        {metrics?.reach?.platforms && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              📱 Alcance por Plataforma
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(metrics.reach.platforms).map(([platform, reach]) => (
                <div key={platform} className="bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">
                    {platform === 'tiktok' && '🎵'}
                    {platform === 'instagram' && '📸'}
                    {platform === 'youtube' && '🎥'}
                    {platform === 'twitter' && '🐦'}
                    {platform === 'linkedin' && '💼'}
                    {platform === 'facebook' && '👥'}
                  </div>
                  <p className="text-white font-semibold capitalize">{platform}</p>
                  <p className="text-blue-200 text-sm">{formatNumber(reach as number)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs do Sistema */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            📋 Logs do Sistema Viral
          </h2>
          
          <div className="bg-black/30 rounded-lg p-4 h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                Clique em "INICIAR SISTEMA BILIONÁRIO" para ver os logs...
              </p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-green-400 text-sm font-mono">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Aviso Importante */}
        <div className="mt-8 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Sistema 100% Gratuito</h3>
              <p className="text-red-200 text-sm leading-relaxed">
                Este sistema utiliza APENAS estratégias gratuitas para gerar receita massiva. 
                Não há custos de publicidade paga. Todo o tráfego é orgânico através de:
                SEO, conteúdo viral, influenciadores, programa de referência e automação de redes sociais.
                <br /><br />
                <strong>Meta realística:</strong> R$ 3.1B+ anuais em 12-18 meses usando apenas métodos gratuitos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViralMarketingPage;
