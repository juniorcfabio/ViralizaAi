// 📊 DASHBOARD DE MÉTRICAS EM TEMPO REAL - NÍVEL ENTERPRISE
import React, { useState, useEffect } from 'react';

interface Metrics {
  current: {
    onlineUsers: number;
    requestsPerMinute: number;
    toolsUsedToday: number;
    revenueToday: number;
    blockedAttempts: number;
    averageResponseTime: number;
    errorRate: number;
    systemHealth: {
      status: string;
      score: number;
    };
  };
  fraud: {
    totalFraudAttempts: number;
    blockedToday: number;
    usersAtRisk: Array<{
      userId: string;
      riskScore: number;
      riskLevel: string;
    }>;
  };
  alerts: {
    total: number;
    unresolved: number;
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
    };
  };
}

const RealTimeDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const ADMIN_KEY = "super_chave_admin_123";

  useEffect(() => {
    loadMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(loadMetrics, 30000); // Atualizar a cada 30s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/admin/real-time-metrics', {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      
      const data = await response.json();
      if (data.success) {
        setMetrics(data.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRÍTICO': return 'text-red-600 bg-red-100';
      case 'ALTO': return 'text-orange-600 bg-orange-100';
      case 'MÉDIO': return 'text-yellow-600 bg-yellow-100';
      case 'BAIXO': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Carregando métricas em tempo real...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Erro ao Carregar Métricas</h3>
        <p className="text-red-700">Não foi possível carregar as métricas em tempo real.</p>
        <button
          onClick={loadMetrics}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          🔄 Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER COM CONTROLES */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 Métricas em Tempo Real</h2>
          <p className="text-gray-600">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Auto-refresh (30s)</span>
          </label>
          <button
            onClick={loadMetrics}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* USUÁRIOS ONLINE */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Usuários Online</p>
              <p className="text-3xl font-bold text-green-600">{metrics.current.onlineUsers}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
          <div className="mt-2">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-xs text-gray-600">Tempo real</span>
            </div>
          </div>
        </div>

        {/* REQUESTS POR MINUTO */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Requests/min</p>
              <p className="text-3xl font-bold text-blue-600">{metrics.current.requestsPerMinute.toLocaleString()}</p>
            </div>
            <div className="text-4xl">⚡</div>
          </div>
          <div className="mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              metrics.current.requestsPerMinute > 1000 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
            }`}>
              {metrics.current.requestsPerMinute > 1000 ? 'Alto tráfego' : 'Normal'}
            </span>
          </div>
        </div>

        {/* RECEITA HOJE */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Receita Hoje</p>
              <p className="text-3xl font-bold text-yellow-600">R$ {metrics.current.revenueToday.toFixed(2)}</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-gray-600">
              {metrics.current.toolsUsedToday} ferramentas usadas
            </span>
          </div>
        </div>

        {/* TENTATIVAS BLOQUEADAS */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Bloqueadas</p>
              <p className="text-3xl font-bold text-red-600">{metrics.current.blockedAttempts}</p>
            </div>
            <div className="text-4xl">🚫</div>
          </div>
          <div className="mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              metrics.current.blockedAttempts > 20 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
            }`}>
              {metrics.current.blockedAttempts > 20 ? 'Alto risco' : 'Seguro'}
            </span>
          </div>
        </div>
      </div>

      {/* SAÚDE DO SISTEMA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* STATUS GERAL */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🏥 Saúde do Sistema</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status Geral:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(metrics.current.systemHealth.status)}`}>
                {metrics.current.systemHealth.status.toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score de Saúde:</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className={`h-2 rounded-full ${
                      metrics.current.systemHealth.score > 80 ? 'bg-green-500' :
                      metrics.current.systemHealth.score > 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${metrics.current.systemHealth.score}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold">{metrics.current.systemHealth.score}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tempo de Resposta:</span>
              <span className={`text-sm font-semibold ${
                metrics.current.averageResponseTime < 500 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metrics.current.averageResponseTime}ms
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Taxa de Erro:</span>
              <span className={`text-sm font-semibold ${
                metrics.current.errorRate < 1 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metrics.current.errorRate}%
              </span>
            </div>
          </div>
        </div>

        {/* ALERTAS ATIVOS */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🚨 Alertas Ativos</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total de Alertas:</span>
              <span className="text-lg font-bold">{metrics.alerts.total}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Não Resolvidos:</span>
              <span className={`font-bold ${metrics.alerts.unresolved > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {metrics.alerts.unresolved}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs">Críticos:</span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-semibold">
                  {metrics.alerts.bySeverity.critical}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Altos:</span>
                <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-semibold">
                  {metrics.alerts.bySeverity.high}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Médios:</span>
                <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded text-xs font-semibold">
                  {metrics.alerts.bySeverity.medium}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETECÇÃO DE FRAUDE */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🚨 Sistema Antifraude</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{metrics.fraud.totalFraudAttempts}</div>
            <div className="text-sm text-gray-600">Tentativas de Fraude</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{metrics.fraud.blockedToday}</div>
            <div className="text-sm text-gray-600">Bloqueados Hoje</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{metrics.fraud.usersAtRisk?.length || 0}</div>
            <div className="text-sm text-gray-600">Usuários em Risco</div>
          </div>
        </div>

        {/* USUÁRIOS EM RISCO */}
        {metrics.fraud.usersAtRisk && metrics.fraud.usersAtRisk.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-800 mb-3">⚠️ Usuários em Risco:</h4>
            <div className="space-y-2">
              {metrics.fraud.usersAtRisk.slice(0, 5).map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">{user.userId}</span>
                    <span className="text-sm text-gray-600 ml-2">Score: {user.riskScore}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskColor(user.riskLevel)}`}>
                    {user.riskLevel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* GRÁFICO SIMPLES DE ATIVIDADE */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Atividade em Tempo Real</h3>
        
        <div className="h-64 flex items-end justify-between space-x-2">
          {/* GRÁFICO SIMPLES COM BARRAS CSS */}
          {Array.from({ length: 24 }, (_, i) => {
            const height = Math.random() * 80 + 20; // Altura aleatória para simulação
            const hour = i;
            const isCurrentHour = new Date().getHours() === hour;
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full rounded-t ${isCurrentHour ? 'bg-blue-500' : 'bg-gray-300'} transition-all duration-300`}
                  style={{ height: `${height}%` }}
                ></div>
                <div className="text-xs text-gray-500 mt-1">
                  {hour.toString().padStart(2, '0')}h
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          Atividade por hora (últimas 24h) - Hora atual destacada em azul
        </div>
      </div>
    </div>
  );
};

export default RealTimeDashboard;
