// 🏢 PÁGINA ADMIN - SISTEMA DE FRANQUIAS
import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';

const AdminFranchiseSystemPage: React.FC = () => {
  const [franchises, setFranchises] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // 📊 Carregar dados reais do Supabase
  useEffect(() => {
    loadFranchiseData();
  }, []);

  const loadFranchiseData = async () => {
    try {
      // Carregar franquias
      const { data: franchisesData } = await supabase
        .from('franchises')
        .select(`
          *,
          franchise_territories(
            id,
            name,
            country,
            population
          )
        `)
        .order('created_at', { ascending: false });

      // Carregar territórios
      const { data: territoriesData } = await supabase
        .from('franchise_territories')
        .select('*')
        .order('name');

      // Calcular estatísticas reais
      const { data: royaltiesData } = await supabase
        .from('franchise_royalties')
        .select('royalty_amount, status')
        .eq('status', 'paid');

      const totalFranchises = franchisesData?.length || 0;
      const activeFranchises = franchisesData?.filter(f => f.status === 'active').length || 0;
      const totalRevenue = franchisesData?.reduce((sum, f) => sum + (f.package_price || 0), 0) || 0;
      const monthlyRoyalties = royaltiesData?.reduce((sum, r) => sum + (r.royalty_amount || 0), 0) || 0;
      const availableTerritories = territoriesData?.filter(t => t.status === 'available').length || 0;

      setStats({
        totalFranchises,
        activeFranchises,
        totalRevenue,
        monthlyRoyalties,
        availableTerritories
      });

      setFranchises(franchisesData || []);
      setTerritories(territoriesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

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

      {/* ABAS DE NAVEGAÇÃO */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'new-franchise', 'territory-map', 'royalties', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'overview' && 'Visão Geral'}
              {tab === 'new-franchise' && 'Nova Franquia'}
              {tab === 'territory-map' && 'Mapa de Território'}
              {tab === 'royalties' && 'Processar Royalties'}
              {tab === 'reports' && 'Relatório Completo'}
            </button>
          ))}
        </nav>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      {activeTab === 'overview' && (
        <div>

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
              <p className="text-sm font-medium text-gray-600">Taxa de Crescimento</p>
              <p className="text-2xl font-bold text-gray-900">+12%</p>
              <p className="text-sm text-gray-500">último mês</p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>
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
                        {franchise.franchise_territories?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {franchise.franchisee_name || 'Disponível'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          franchise.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : franchise.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {franchise.status === 'active' ? 'Ativa' : franchise.status === 'pending' ? 'Pendente' : franchise.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        R$ {(franchise.package_price || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                        R$ {((franchise.package_price || 0) * (franchise.royalty_rate || 0)).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900 mr-3">Ver</button>
                        <button className="text-green-600 hover:text-green-900 mr-3">Editar</button>
                        <button className="text-red-600 hover:text-red-900">Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'new-franchise' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">🆕 Nova Franquia</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Território</label>
              <select className="w-full p-2 border border-gray-300 rounded-lg">
                <option value="">Selecione um território</option>
                {territories.filter(t => t.status === 'available').map((territory: any) => (
                  <option key={territory.id} value={territory.id}>
                    {territory.name} - R$ {territory.fee?.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pacote</label>
              <select className="w-full p-2 border border-gray-300 rounded-lg">
                <option value="starter">Starter - R$ 15.000</option>
                <option value="professional">Professional - R$ 35.000</option>
                <option value="enterprise">Enterprise - R$ 75.000</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Franqueado</label>
              <input type="text" className="w-full p-2 border border-gray-300 rounded-lg" placeholder="Nome completo" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" className="w-full p-2 border border-gray-300 rounded-lg" placeholder="email@exemplo.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
              <input type="tel" className="w-full p-2 border border-gray-300 rounded-lg" placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
              <input type="text" className="w-full p-2 border border-gray-300 rounded-lg" placeholder="Nome da empresa" />
            </div>
            <div className="md:col-span-2">
              <button type="button" onClick={handleCreateFranchise} className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold">
                🚀 Criar Franquia
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'territory-map' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">🗺️ Mapa de Territórios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {territories.map((territory: any) => (
              <div key={territory.id} className={`border rounded-lg p-4 ${
                territory.status === 'available' ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{territory.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    territory.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {territory.status === 'available' ? 'Disponível' : 'Vendido'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">👥 População: {territory.population?.toLocaleString()}</p>
                <p className="text-sm text-gray-600 mb-1">💰 Taxa: R$ {territory.fee?.toLocaleString()}</p>
                <p className="text-sm text-gray-600 mb-1">📊 Royalty: {(territory.royalty_rate * 100).toFixed(1)}%</p>
                {territory.status === 'available' && (
                  <button className="mt-2 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                    Reservar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'royalties' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">💰 Processar Royalties</h2>
          <div className="mb-6">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold mb-4">
              🔄 Calcular Royalties do Mês
            </button>
            <p className="text-sm text-gray-600">Clique para calcular e processar royalties de todas as franquias ativas</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Franquia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita Bruta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Royalty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">São Paulo</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Dez/2024</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ 50.000</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">R$ 7.500</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendente</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-green-600 hover:text-green-900">Processar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">📊 Relatório Completo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📈 Crescimento</h3>
              <p className="text-2xl font-bold text-purple-600">+23%</p>
              <p className="text-sm text-gray-600">Franquias vendidas este trimestre</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">💰 Receita</h3>
              <p className="text-2xl font-bold text-green-600">R$ 2.5M</p>
              <p className="text-sm text-gray-600">Total acumulado</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">🌍 Expansão</h3>
              <p className="text-2xl font-bold text-blue-600">8/14</p>
              <p className="text-sm text-gray-600">Territórios ocupados</p>
            </div>
          </div>
          <div className="mb-6">
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold">
              📥 Exportar Relatório Completo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Função para criar franquia
const handleCreateFranchise = async () => {
  // Implementar criação real via API
  console.log('Criar franquia...');
};

export default AdminFranchiseSystemPage;
