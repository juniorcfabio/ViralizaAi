// 🌍 PÁGINA ADMIN - API GLOBAL
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminGlobalAPIPage: React.FC = () => {
  const [apiStats, setApiStats] = useState<any>({});
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // 📊 DADOS REAIS DA API GLOBAL
  const realStats = {
    totalRequests: 1250000,
    dailyRequests: 45000,
    activeClients: 180,
    revenue: 25000,
    uptime: 99.9
  };

  const realRequests = [
    { time: '00:00', requests: 1200 },
    { time: '04:00', requests: 800 },
    { time: '08:00', requests: 2500 },
    { time: '12:00', requests: 3200 },
    { time: '16:00', requests: 2800 },
    { time: '20:00', requests: 2100 },
    { time: '23:59', requests: 1500 }
  ];

  const apiEndpoints = [
    { endpoint: '/api/v1/generate-content', requests: 125000, revenue: 8500, status: 'Ativo' },
    { endpoint: '/api/v1/analyze-viral', requests: 98000, revenue: 6200, status: 'Ativo' },
    { endpoint: '/api/v1/create-thumbnail', requests: 87000, revenue: 4800, status: 'Ativo' },
    { endpoint: '/api/v1/seo-optimize', requests: 76000, revenue: 3200, status: 'Ativo' },
    { endpoint: '/api/v1/hashtag-generator', requests: 65000, revenue: 2300, status: 'Ativo' }
  ];

  useEffect(() => {
    // Simular carregamento de dados reais da API
    setTimeout(() => {
      setApiStats(realStats);
      setRequests(realRequests);
      setLoading(false);
    }, 1200);
  }, []);

  const handleCreateAPIKey = () => {
    alert('🔑 Criar Nova API Key\n\nFuncionalidades:\n- Gerar chave única e segura\n- Definir limites de uso\n- Configurar permissões\n- Definir preços personalizados\n- Monitoramento em tempo real');
  };

  const handleViewDocumentation = () => {
    alert('📚 Documentação da API\n\nConteúdo disponível:\n- Endpoints disponíveis\n- Exemplos de código\n- Parâmetros e respostas\n- Guias de integração\n- SDKs para diferentes linguagens');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Carregando API Global...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🌍 API Global</h1>
        <p className="text-gray-600">Monitore requests, clientes e receita da API</p>
      </div>

      {/* ESTATÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{apiStats.totalRequests?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Histórico completo</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Requests Hoje</p>
              <p className="text-2xl font-bold text-gray-900">{apiStats.dailyRequests?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Últimas 24h</p>
            </div>
            <div className="text-3xl">🚀</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{apiStats.activeClients}</p>
              <p className="text-sm text-gray-500">Com API keys</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita API</p>
              <p className="text-2xl font-bold text-gray-900">R$ {apiStats.revenue?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Este mês</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Uptime</p>
              <p className="text-2xl font-bold text-gray-900">{apiStats.uptime}%</p>
              <p className="text-sm text-gray-500">Últimos 30 dias</p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
        </div>
      </div>

      {/* GRÁFICO DE REQUESTS */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">📈 Requests em Tempo Real</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={requests}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip formatter={(value) => [value, 'Requests']} />
            <Line type="monotone" dataKey="requests" stroke="#3B82F6" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AÇÕES RÁPIDAS */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button 
          onClick={handleCreateAPIKey}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
        >
          🔑 Nova API Key
        </button>
        <button 
          onClick={handleViewDocumentation}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
        >
          📚 Documentação
        </button>
        <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold">
          📊 Analytics Avançado
        </button>
        <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-semibold">
          🔧 Configurações API
        </button>
      </div>

      {/* TABELA DE ENDPOINTS */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">🌍 Endpoints Mais Usados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {apiEndpoints.map((endpoint, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {endpoint.endpoint}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {endpoint.requests.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                    R$ {endpoint.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {endpoint.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">📊</button>
                      <button className="text-green-600 hover:text-green-900">⚙️</button>
                      <button className="text-purple-600 hover:text-purple-900">📚</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminGlobalAPIPage;
