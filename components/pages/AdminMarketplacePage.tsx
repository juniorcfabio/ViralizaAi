// 🛒 PÁGINA ADMIN - MARKETPLACE DE FERRAMENTAS
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminMarketplacePage: React.FC = () => {
  const [tools, setTools] = useState([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // 📊 DADOS MOCKADOS
  const mockStats = {
    totalTools: 24,
    totalSales: 456,
    totalRevenue: 8900,
    monthlyRevenue: 2340,
    aiCreatedTools: 6
  };

  const mockTools = [
    { id: 1, name: 'Gerador de Scripts IA', price: 29.90, sales: 89, revenue: 2671.10, category: 'IA', status: 'Ativo', created_by: 'IA' },
    { id: 2, name: 'Criador de Thumbnails', price: 19.90, sales: 67, revenue: 1333.30, category: 'Design', status: 'Ativo', created_by: 'Admin' },
    { id: 3, name: 'Analisador de Trends', price: 39.90, sales: 45, revenue: 1795.50, category: 'Analytics', status: 'Ativo', created_by: 'IA' },
    { id: 4, name: 'Otimizador de SEO', price: 24.90, sales: 78, revenue: 1942.20, category: 'SEO', status: 'Ativo', created_by: 'Admin' },
    { id: 5, name: 'Gerador de Hashtags', price: 14.90, sales: 123, revenue: 1832.70, category: 'Social', status: 'Ativo', created_by: 'IA' },
    { id: 6, name: 'Criador de Logos', price: 49.90, sales: 34, revenue: 1696.60, category: 'Design', status: 'Ativo', created_by: 'IA' }
  ];

  useEffect(() => {
    // Simular carregamento
    setTimeout(() => {
      setStats(mockStats);
      setTools(mockTools);
      setLoading(false);
    }, 1000);
  }, []);

  // 📊 COMPONENTE DE ESTATÍSTICA
  const StatCard = ({ title, value, subtitle, color = '#4F46E5', icon }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {icon && <div className="text-3xl">{icon}</div>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Carregando Marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🛒 Marketplace de Ferramentas</h1>
        <p className="text-gray-600">Gerencie todas as ferramentas disponíveis no marketplace</p>
      </div>

      {/* ESTATÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard 
          title="Total de Ferramentas" 
          value={stats.totalTools} 
          subtitle={`${stats.aiCreatedTools} criadas pela IA`}
          color="#10B981"
          icon="🛠️"
        />
        <StatCard 
          title="Vendas Totais" 
          value={stats.totalSales} 
          subtitle="Todas as ferramentas"
          color="#4F46E5"
          icon="📊"
        />
        <StatCard 
          title="Receita Total" 
          value={`R$ ${stats.totalRevenue?.toLocaleString()}`}
          subtitle="Histórico completo"
          color="#F59E0B"
          icon="💰"
        />
        <StatCard 
          title="Receita Mensal" 
          value={`R$ ${stats.monthlyRevenue?.toLocaleString()}`}
          subtitle="Este mês"
          color="#8B5CF6"
          icon="📈"
        />
        <StatCard 
          title="IA Criadora" 
          value={`${stats.aiCreatedTools} ferramentas`}
          subtitle="Criadas automaticamente"
          color="#EF4444"
          icon="🤖"
        />
      </div>

      {/* GRÁFICO DE VENDAS */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">📊 Vendas por Ferramenta</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mockTools}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip formatter={(value) => [value, 'Vendas']} />
            <Bar dataKey="sales" fill="#4F46E5" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AÇÕES RÁPIDAS */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold">
          ➕ Criar Nova Ferramenta
        </button>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold">
          🤖 Ativar IA Criadora
        </button>
        <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold">
          📊 Relatório Completo
        </button>
        <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-semibold">
          🎯 Campanhas de Marketing
        </button>
      </div>

      {/* TABELA DE FERRAMENTAS */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">🛠️ Todas as Ferramentas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ferramenta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado por</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tools.map((tool) => (
                <tr key={tool.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {tool.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    R$ {tool.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tool.sales}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                    R$ {tool.revenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      tool.created_by === 'IA' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {tool.created_by === 'IA' ? '🤖 IA' : '👤 Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {tool.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">✏️</button>
                      <button className="text-green-600 hover:text-green-900">📊</button>
                      <button className="text-red-600 hover:text-red-900">🗑️</button>
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

export default AdminMarketplacePage;
