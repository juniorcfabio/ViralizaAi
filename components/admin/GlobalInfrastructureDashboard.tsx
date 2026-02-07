// 🌍 DASHBOARD DE INFRAESTRUTURA GLOBAL - MONITORAMENTO MUNDIAL
import React, { useState, useEffect } from 'react';

interface GlobalMetrics {
  regions: {
    [key: string]: {
      name: string;
      status: 'healthy' | 'degraded' | 'critical';
      responseTime: number;
      requests: number;
      errors: number;
    };
  };
  security: {
    blockedIPs: number;
    suspiciousActivity: number;
    attacksBlocked: number;
    topThreats: Array<{
      type: string;
      count: number;
      severity: string;
    }>;
  };
  payments: {
    gateways: {
      [key: string]: {
        status: 'healthy' | 'degraded' | 'critical';
        successRate: number;
        avgResponseTime: number;
      };
    };
    currencies: {
      [key: string]: {
        volume: number;
        revenue: number;
      };
    };
  };
}

const GlobalInfrastructureDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  const ADMIN_KEY = "super_chave_admin_123";

  useEffect(() => {
    loadGlobalMetrics();
    const interval = setInterval(loadGlobalMetrics, 60000); // Atualizar a cada minuto
    return () => clearInterval(interval);
  }, []);

  const loadGlobalMetrics = async () => {
    try {
      // 🎯 SIMULAÇÃO - EM PRODUÇÃO BUSCAR DE MÚLTIPLAS APIs
      const mockMetrics: GlobalMetrics = {
        regions: {
          'sa-east-1': {
            name: 'São Paulo',
            status: 'healthy',
            responseTime: 145,
            requests: 12450,
            errors: 23
          },
          'us-east-1': {
            name: 'Virginia',
            status: 'healthy',
            responseTime: 89,
            requests: 8920,
            errors: 12
          },
          'eu-west-1': {
            name: 'Dublin',
            status: 'degraded',
            responseTime: 234,
            requests: 5670,
            errors: 45
          },
          'ap-southeast-2': {
            name: 'Sydney',
            status: 'healthy',
            responseTime: 178,
            requests: 3240,
            errors: 8
          }
        },
        security: {
          blockedIPs: 1247,
          suspiciousActivity: 89,
          attacksBlocked: 156,
          topThreats: [
            { type: 'SQL Injection', count: 45, severity: 'high' },
            { type: 'XSS Attempt', count: 32, severity: 'medium' },
            { type: 'Brute Force', count: 28, severity: 'high' },
            { type: 'Bot Traffic', count: 51, severity: 'low' }
          ]
        },
        payments: {
          gateways: {
            stripe: {
              status: 'healthy',
              successRate: 98.5,
              avgResponseTime: 1200
            },
            mercadopago: {
              status: 'healthy',
              successRate: 96.2,
              avgResponseTime: 2100
            },
            paypal: {
              status: 'degraded',
              successRate: 94.8,
              avgResponseTime: 1800
            }
          },
          currencies: {
            brl: { volume: 1247, revenue: 74820.50 },
            usd: { volume: 892, revenue: 11509.80 },
            eur: { volume: 456, revenue: 5434.40 },
            gbp: { volume: 234, revenue: 2551.60 }
          }
        }
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Erro ao carregar métricas globais:', error);
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Carregando infraestrutura global...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Erro ao Carregar Métricas</h3>
        <p className="text-red-700">Não foi possível carregar as métricas da infraestrutura global.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🌍 Infraestrutura Global</h2>
          <p className="text-gray-600">Monitoramento mundial em tempo real</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="all">Todas as Regiões</option>
            {Object.entries(metrics.regions).map(([key, region]) => (
              <option key={key} value={key}>{region.name}</option>
            ))}
          </select>
          <button
            onClick={loadGlobalMetrics}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* MAPA MUNDIAL DE STATUS */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🗺️ Status Global das Regiões</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(metrics.regions).map(([regionId, region]) => (
            <div key={regionId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800">{region.name}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(region.status)}`}>
                  {region.status.toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Latência:</span>
                  <span className={region.responseTime > 200 ? 'text-red-600' : 'text-green-600'}>
                    {region.responseTime}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Requests:</span>
                  <span>{region.requests.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Erros:</span>
                  <span className={region.errors > 30 ? 'text-red-600' : 'text-green-600'}>
                    {region.errors}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEGURANÇA GLOBAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* MÉTRICAS DE SEGURANÇA */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🛡️ Segurança Global</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{metrics.security.blockedIPs}</div>
              <div className="text-sm text-gray-600">IPs Bloqueados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.security.suspiciousActivity}</div>
              <div className="text-sm text-gray-600">Atividade Suspeita</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.security.attacksBlocked}</div>
              <div className="text-sm text-gray-600">Ataques Bloqueados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">99.8%</div>
              <div className="text-sm text-gray-600">Taxa de Proteção</div>
            </div>
          </div>

          {/* TOP AMEAÇAS */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">🚨 Principais Ameaças</h4>
            <div className="space-y-2">
              {metrics.security.topThreats.map((threat, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{threat.type}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{threat.count}</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(threat.severity)}`}>
                      {threat.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GATEWAYS DE PAGAMENTO */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">💳 Gateways de Pagamento</h3>
          
          <div className="space-y-4">
            {Object.entries(metrics.payments.gateways).map(([gateway, data]) => (
              <div key={gateway} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800 capitalize">{gateway}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(data.status)}`}>
                    {data.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Taxa de Sucesso:</span>
                    <div className="font-semibold text-green-600">{data.successRate}%</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Tempo Médio:</span>
                    <div className="font-semibold">{data.avgResponseTime}ms</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECEITA POR MOEDA */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">💱 Receita por Moeda</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(metrics.payments.currencies).map(([currency, data]) => (
            <div key={currency} className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold mb-1">{currency.toUpperCase()}</div>
              <div className="text-lg font-semibold text-green-600 mb-1">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: currency === 'brl' ? 'BRL' : 'USD' 
                }).format(data.revenue)}
              </div>
              <div className="text-sm text-gray-600">{data.volume} transações</div>
            </div>
          ))}
        </div>
      </div>

      {/* ALERTAS E NOTIFICAÇÕES */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🚨 Alertas Ativos</h3>
        
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex-shrink-0">
              <span className="text-yellow-600">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                Latência elevada na região Europa (Dublin)
              </p>
              <p className="text-xs text-yellow-700">
                Tempo de resposta: 234ms (normal: &lt;200ms)
              </p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex-shrink-0">
              <span className="text-blue-600">ℹ️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                Gateway PayPal com performance degradada
              </p>
              <p className="text-xs text-blue-700">
                Taxa de sucesso: 94.8% (normal: &gt;96%)
              </p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex-shrink-0">
              <span className="text-green-600">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Todos os sistemas principais operacionais
              </p>
              <p className="text-xs text-green-700">
                Uptime: 99.98% nas últimas 24h
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalInfrastructureDashboard;
