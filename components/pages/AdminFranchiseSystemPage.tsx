// 🏢 PÁGINA ADMIN - SISTEMA DE FRANQUIAS
import React, { useState, useEffect } from 'react';

const AdminFranchiseSystemPage: React.FC = () => {
  const [franchises, setFranchises] = useState([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // 📊 DADOS MOCKADOS
  const mockStats = {
    totalFranchises: 8,
    activeFranchises: 6,
    totalRevenue: 125000,
    monthlyRoyalties: 8500,
    availableTerritories: 6
  };

  const mockFranchises = [
    { id: 1, territory: 'São Paulo', franchisee: 'João Silva', status: 'Ativa', revenue: 25000, royalties: 1250 },
    { id: 2, territory: 'Rio de Janeiro', franchisee: 'Maria Santos', status: 'Ativa', revenue: 22000, royalties: 1100 },
    { id: 3, territory: 'Minas Gerais', franchisee: null, status: 'Disponível', revenue: 0, royalties: 0 },
    { id: 4, territory: 'Bahia', franchisee: 'Pedro Costa', status: 'Ativa', revenue: 18000, royalties: 900 },
    { id: 5, territory: 'Paraná', franchisee: null, status: 'Disponível', revenue: 0, royalties: 0 },
    { id: 6, territory: 'Rio Grande do Sul', franchisee: 'Ana Lima', status: 'Ativa', revenue: 20000, royalties: 1000 }
  ];

  useEffect(() => {
    setTimeout(() => {
      setStats(mockStats);
      setFranchises(mockFranchises);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Carregando Sistema de Franquias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🏢 Sistema de Franquias</h1>
        <p className="text-gray-600">Gerencie franquias digitais e territórios disponíveis</p>
      </div>

      {/* ESTATÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Franquias Ativas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeFranchises}</p>
              <p className="text-sm text-gray-500">de {stats.totalFranchises} vendidas</p>
            </div>
            <div className="text-3xl">🏢</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">R$ {stats.totalRevenue?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Taxa de franquia</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Royalties Mensais</p>
              <p className="text-2xl font-bold text-gray-900">R$ {stats.monthlyRoyalties?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">5% das vendas</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Territórios Livres</p>
              <p className="text-2xl font-bold text-gray-900">{stats.availableTerritories}</p>
              <p className="text-sm text-gray-500">de 14 disponíveis</p>
            </div>
            <div className="text-3xl">🗺️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
              <p className="text-2xl font-bold text-gray-900">75%</p>
              <p className="text-sm text-gray-500">Franquias ativas</p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>
      </div>

      {/* AÇÕES RÁPIDAS */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold">
          ➕ Nova Franquia
        </button>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold">
          🗺️ Mapa de Territórios
        </button>
        <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold">
          💰 Processar Royalties
        </button>
        <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-semibold">
          📊 Relatório Completo
        </button>
      </div>

      {/* TABELA DE FRANQUIAS */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">🏢 Todas as Franquias</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Território</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Franqueado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Royalties</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {franchises.map((franchise: any) => (
                <tr key={franchise.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {franchise.territory}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {franchise.franchisee || 'Disponível'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      franchise.status === 'Ativa' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {franchise.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    R$ {franchise.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                    R$ {franchise.royalties.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">✏️</button>
                      <button className="text-green-600 hover:text-green-900">📊</button>
                      <button className="text-purple-600 hover:text-purple-900">💰</button>
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

export default AdminFranchiseSystemPage;
