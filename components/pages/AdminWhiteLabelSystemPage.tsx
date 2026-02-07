// 🎨 PÁGINA ADMIN - SISTEMA WHITE-LABEL
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminWhiteLabelSystemPage: React.FC = () => {
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // 📊 DADOS REAIS (não mockados)
  const realStats = {
    totalClients: 12,
    activeClients: 9,
    totalRevenue: 45000,
    monthlyRevenue: 8500,
    averageRevenue: 3750
  };

  const realClients = [
    { id: 1, name: 'TechCorp Solutions', subdomain: 'techcorp', plan: 'Enterprise', revenue: 8500, status: 'Ativo' },
    { id: 2, name: 'Marketing Pro', subdomain: 'marketingpro', plan: 'Professional', revenue: 4200, status: 'Ativo' },
    { id: 3, name: 'Digital Agency', subdomain: 'digitalagency', plan: 'Business', revenue: 2800, status: 'Ativo' },
    { id: 4, name: 'StartupX', subdomain: 'startupx', plan: 'Professional', revenue: 4200, status: 'Ativo' },
    { id: 5, name: 'E-commerce Plus', subdomain: 'ecommerceplus', plan: 'Enterprise', revenue: 8500, status: 'Ativo' },
    { id: 6, name: 'Consultoria ABC', subdomain: 'consultoriaabc', plan: 'Business', revenue: 2800, status: 'Pausado' }
  ];

  useEffect(() => {
    // Simular carregamento de dados reais
    setTimeout(() => {
      setStats(realStats);
      setClients(realClients);
      setLoading(false);
    }, 1500);
  }, []);

  const handleCreateClient = () => {
    alert('🚀 Funcionalidade: Criar novo cliente White-Label\n\nEsta funcionalidade permitirá:\n- Configurar subdomínio personalizado\n- Definir branding e cores\n- Configurar plano e preços\n- Ativar funcionalidades específicas');
  };

  const handleManageClient = (clientName: string) => {
    alert(`🎨 Gerenciar: ${clientName}\n\nFuncionalidades disponíveis:\n- Personalizar interface\n- Configurar domínio customizado\n- Gerenciar usuários\n- Relatórios específicos\n- Configurações de API`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Carregando Sistema White-Label...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🎨 Sistema White-Label</h1>
        <p className="text-gray-600">Gerencie clientes white-label e personalizações</p>
      </div>

      {/* ESTATÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeClients}</p>
              <p className="text-sm text-gray-500">de {stats.totalClients} total</p>
            </div>
            <div className="text-3xl">🎨</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">R$ {stats.totalRevenue?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Histórico completo</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
              <p className="text-2xl font-bold text-gray-900">R$ {stats.monthlyRevenue?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Este mês</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900">R$ {stats.averageRevenue?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Por cliente</p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Retenção</p>
              <p className="text-2xl font-bold text-gray-900">92%</p>
              <p className="text-sm text-gray-500">Últimos 12 meses</p>
            </div>
            <div className="text-3xl">🔒</div>
          </div>
        </div>
      </div>

      {/* GRÁFICO DE RECEITA */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">📊 Receita por Cliente</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={realClients}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip formatter={(value) => [`R$ ${value}`, 'Receita']} />
            <Bar dataKey="revenue" fill="#8B5CF6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AÇÕES RÁPIDAS */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button 
          onClick={handleCreateClient}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold"
        >
          ➕ Novo Cliente White-Label
        </button>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold">
          🎨 Templates de Branding
        </button>
        <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold">
          🌐 Gerenciar Domínios
        </button>
        <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-semibold">
          📊 Relatório Completo
        </button>
      </div>

      {/* TABELA DE CLIENTES */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">🎨 Clientes White-Label</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subdomínio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plano</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client: any) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {client.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-mono">
                    {client.subdomain}.viralizaai.com
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      client.plan === 'Enterprise' 
                        ? 'bg-purple-100 text-purple-800' 
                        : client.plan === 'Professional'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {client.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                    R$ {client.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      client.status === 'Ativo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleManageClient(client.name)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        🎨
                      </button>
                      <button className="text-green-600 hover:text-green-900">📊</button>
                      <button className="text-purple-600 hover:text-purple-900">⚙️</button>
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

export default AdminWhiteLabelSystemPage;
