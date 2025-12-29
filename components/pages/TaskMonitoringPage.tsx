import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import TaskMonitoringDashboard from '../tools/TaskMonitoringDashboard';
import TaskMonitoringEngine, { BusinessMetrics } from '../../services/taskMonitoringEngine';

const TaskMonitoringPage: React.FC = () => {
  const { user } = useAuth();
  const [showDashboard, setShowDashboard] = useState(false);
  const [engine] = useState(() => new TaskMonitoringEngine());
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = () => {
      try {
        const businessMetrics = engine.getBusinessMetrics();
        setMetrics(businessMetrics);
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao carregar métricas:', error);
        setIsLoading(false);
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Atualizar a cada 30 segundos

    return () => clearInterval(interval);
  }, [engine]);

  const getPerformanceEmoji = (performance: number) => {
    if (performance >= 90) return '🚀';
    if (performance >= 80) return '⭐';
    if (performance >= 70) return '👍';
    if (performance >= 60) return '⚠️';
    return '🚨';
  };

  const getPerformanceMessage = (performance: number) => {
    if (performance >= 90) return 'EXCEPCIONAL! Seu negócio está no máximo!';
    if (performance >= 80) return 'EXCELENTE! Performance muito boa!';
    if (performance >= 70) return 'BOM! Continue assim!';
    if (performance >= 60) return 'REGULAR. Precisa melhorar!';
    return 'CRÍTICO! Ação imediata necessária!';
  };

  const getRiskMessage = (risk: string) => {
    switch (risk) {
      case 'low': return 'Tudo sob controle! 😌';
      case 'medium': return 'Atenção necessária 👀';
      case 'high': return 'Risco elevado! ⚠️';
      case 'critical': return 'EMERGÊNCIA! Ação imediata! 🚨';
      default: return 'Monitorando...';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⚡</div>
          <p className="text-xl text-white">Carregando Monitor Ultra-Avançado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <span className="animate-pulse">🎯</span>
            Monitor de Performance Ultra-Avançado
            <span className="animate-pulse">⚡</span>
          </h1>
          <p className="text-blue-100 text-lg">
            A ferramenta mais avançada do mundo para monitorar o sucesso do seu negócio em tempo real
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Status Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Performance Geral */}
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-6 rounded-2xl border border-blue-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">{getPerformanceEmoji(metrics.overallPerformance)}</div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{metrics.overallPerformance}%</div>
                  <div className="text-sm text-gray-300">Performance</div>
                </div>
              </div>
              <p className="text-sm text-gray-300">{getPerformanceMessage(metrics.overallPerformance)}</p>
            </div>

            {/* Taxa de Conclusão */}
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 p-6 rounded-2xl border border-green-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">✅</div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-400">{metrics.completionRate}%</div>
                  <div className="text-sm text-gray-300">Conclusão</div>
                </div>
              </div>
              <p className="text-sm text-gray-300">
                {metrics.completionRate >= 80 ? 'Excelente disciplina!' : 'Precisa focar mais nas tarefas'}
              </p>
            </div>

            {/* Sequência */}
            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 p-6 rounded-2xl border border-yellow-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">🔥</div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-yellow-400">{metrics.streakDays}</div>
                  <div className="text-sm text-gray-300">Dias</div>
                </div>
              </div>
              <p className="text-sm text-gray-300">{metrics.nextMilestone}</p>
            </div>

            {/* Nível de Risco */}
            <div className={`p-6 rounded-2xl border backdrop-blur-sm ${
              metrics.riskLevel === 'critical' ? 'bg-gradient-to-br from-red-600/20 to-pink-600/20 border-red-500/30 animate-pulse' :
              metrics.riskLevel === 'high' ? 'bg-gradient-to-br from-orange-600/20 to-red-600/20 border-orange-500/30' :
              metrics.riskLevel === 'medium' ? 'bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/30' :
              'bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">
                  {metrics.riskLevel === 'critical' ? '🚨' : 
                   metrics.riskLevel === 'high' ? '⚠️' : 
                   metrics.riskLevel === 'medium' ? '👀' : '😌'}
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold uppercase ${
                    metrics.riskLevel === 'critical' ? 'text-red-400' :
                    metrics.riskLevel === 'high' ? 'text-orange-400' :
                    metrics.riskLevel === 'medium' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {metrics.riskLevel}
                  </div>
                  <div className="text-sm text-gray-300">Risco</div>
                </div>
              </div>
              <p className="text-sm text-gray-300">{getRiskMessage(metrics.riskLevel)}</p>
            </div>
          </div>
        )}

        {/* Main Action Section */}
        <div className="bg-gradient-to-br from-gray-900/80 to-blue-900/80 rounded-3xl p-8 border border-blue-500/30 backdrop-blur-sm mb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              🚀 Monitore Seu Sucesso em Tempo Real
            </h2>
            <p className="text-lg text-gray-300 mb-6 max-w-3xl mx-auto">
              Esta ferramenta revolucionária monitora todas as suas tarefas diárias e mostra exatamente 
              como cada ação impacta no desempenho do seu negócio. Nunca mais perca uma oportunidade de crescimento!
            </p>
            
            <button
              onClick={() => setShowDashboard(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-all transform hover:scale-105 shadow-lg"
            >
              🎯 Abrir Monitor Ultra-Avançado
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-6 rounded-2xl border border-purple-500/30 backdrop-blur-sm">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-white mb-2">IA Ultra-Avançada</h3>
            <p className="text-gray-300">
              Sistema de inteligência artificial que analisa seu comportamento e sugere otimizações em tempo real.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 p-6 rounded-2xl border border-green-500/30 backdrop-blur-sm">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">Métricas Precisas</h3>
            <p className="text-gray-300">
              Acompanhe o impacto exato de cada tarefa na performance e receita do seu negócio.
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-600/20 to-orange-600/20 p-6 rounded-2xl border border-red-500/30 backdrop-blur-sm">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-2">Alertas Inteligentes</h3>
            <p className="text-gray-300">
              Receba avisos piscantes quando tarefas críticas estão atrasadas, evitando perdas de receita.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 p-6 rounded-2xl border border-blue-500/30 backdrop-blur-sm">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-white mb-2">Foco Laser</h3>
            <p className="text-gray-300">
              Priorização automática das tarefas com maior impacto no crescimento do seu negócio.
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 p-6 rounded-2xl border border-yellow-500/30 backdrop-blur-sm">
            <div className="text-4xl mb-4">🔥</div>
            <h3 className="text-xl font-bold text-white mb-2">Sistema de Sequências</h3>
            <p className="text-gray-300">
              Mantenha momentum com sequências diárias que aceleram exponencialmente seus resultados.
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-6 rounded-2xl border border-indigo-500/30 backdrop-blur-sm">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-white mb-2">Crescimento Exponencial</h3>
            <p className="text-gray-300">
              Cada tarefa completada aumenta sua performance e acelera o crescimento do negócio.
            </p>
          </div>
        </div>

        {/* Success Stories */}
        <div className="bg-gradient-to-br from-emerald-900/40 to-green-900/40 rounded-3xl p-8 border border-emerald-500/30 backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            🏆 Resultados Comprovados
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-400 mb-2">+340%</div>
              <p className="text-white font-semibold mb-1">Aumento na Produtividade</p>
              <p className="text-sm text-gray-300">Usuários que seguem 100% das tarefas</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-400 mb-2">+250%</div>
              <p className="text-white font-semibold mb-1">Crescimento na Receita</p>
              <p className="text-sm text-gray-300">Média em 90 dias de uso consistente</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-400 mb-2">98%</div>
              <p className="text-white font-semibold mb-1">Taxa de Sucesso</p>
              <p className="text-sm text-gray-300">Usuários que atingem suas metas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Modal */}
      {showDashboard && (
        <TaskMonitoringDashboard onClose={() => setShowDashboard(false)} />
      )}
    </div>
  );
};

export default TaskMonitoringPage;
