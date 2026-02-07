// 👑 PAINEL ADMINISTRATIVO COMPLETO - ULTRA IMPÉRIO
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // 📊 DADOS MOCKADOS PARA DEMONSTRAÇÃO
  const mockStats = {
    users: { total: 1247, active: 892, new_today: 23 },
    revenue: { total: 45670, monthly: 12340, daily: 890 },
    affiliates: { total: 156, active: 89, commissions_pending: 2340 },
    marketplace: { tools: 24, sales: 456, revenue: 8900 },
    franchises: { total: 8, active: 6, revenue: 125000 },
    whitelabel: { clients: 12, active: 9, revenue: 15600 },
    api: { requests: 45670, clients: 234, revenue: 3400 }
  };

  useEffect(() => {
    // Simular carregamento de dados
    setTimeout(() => {
      setStats(mockStats);
      setLoading(false);
    }, 1000);
  }, []);

  // 🎨 CORES PARA GRÁFICOS
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // 📊 COMPONENTE DE ESTATÍSTICA
  const StatCard = ({ title, value, subtitle, color = 'blue', icon }) => (
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

  // 🏠 ABA OVERVIEW
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* ESTATÍSTICAS PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Usuários Totais" 
          value={stats.users?.total?.toLocaleString()} 
          subtitle={`${stats.users?.active} ativos`}
          color="#4F46E5"
          icon="👥"
        />
        <StatCard 
          title="Receita Total" 
          value={`R$ ${stats.revenue?.total?.toLocaleString()}`}
          subtitle={`R$ ${stats.revenue?.monthly} este mês`}
          color="#10B981"
          icon="💰"
        />
        <StatCard 
          title="Afiliados" 
          value={stats.affiliates?.total}
          subtitle={`${stats.affiliates?.active} ativos`}
          color="#F59E0B"
          icon="🤝"
        />
        <StatCard 
          title="Ferramentas" 
          value={stats.marketplace?.tools}
          subtitle={`${stats.marketplace?.sales} vendas`}
          color="#EF4444"
          icon="🛠️"
        />
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RECEITA MENSAL */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">📈 Receita Mensal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={[
              { month: 'Jan', receita: 8400 },
              { month: 'Fev', receita: 9200 },
              { month: 'Mar', receita: 10100 },
              { month: 'Abr', receita: 11300 },
              { month: 'Mai', receita: 12340 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`R$ ${value}`, 'Receita']} />
              <Line type="monotone" dataKey="receita" stroke="#4F46E5" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* DISTRIBUIÇÃO DE RECEITA */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">🥧 Distribuição de Receita</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Assinaturas', value: 45, color: '#4F46E5' },
                  { name: 'Marketplace', value: 20, color: '#10B981' },
                  { name: 'Franquias', value: 25, color: '#F59E0B' },
                  { name: 'White-label', value: 10, color: '#EF4444' }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {[
                  { name: 'Assinaturas', value: 45, color: '#4F46E5' },
                  { name: 'Marketplace', value: 20, color: '#10B981' },
                  { name: 'Franquias', value: 25, color: '#F59E0B' },
                  { name: 'White-label', value: 10, color: '#EF4444' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // 🤝 ABA AFILIADOS
  const AffiliatesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🤝 Gestão de Afiliados</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Novo Afiliado
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total de Afiliados" value="156" subtitle="89 ativos" color="#4F46E5" />
        <StatCard title="Comissões Pendentes" value="R$ 2.340" subtitle="12 pagamentos" color="#F59E0B" />
        <StatCard title="Comissões Pagas" value="R$ 15.670" subtitle="Este mês" color="#10B981" />
      </div>

      {/* TABELA DE AFILIADOS */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Top Afiliados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comissão</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { nome: 'João Silva', codigo: 'JS123', vendas: 45, comissao: 'R$ 1.350', status: 'Ativo' },
                { nome: 'Maria Santos', codigo: 'MS456', vendas: 32, comissao: 'R$ 960', status: 'Ativo' },
                { nome: 'Pedro Costa', codigo: 'PC789', vendas: 28, comissao: 'R$ 840', status: 'Ativo' }
              ].map((afiliado, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{afiliado.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{afiliado.codigo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{afiliado.vendas}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{afiliado.comissao}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {afiliado.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // 🛒 ABA MARKETPLACE
  const MarketplaceTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🛒 Marketplace de Ferramentas</h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          + Nova Ferramenta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Ferramentas Ativas" value="24" subtitle="6 criadas pela IA" color="#10B981" />
        <StatCard title="Vendas Totais" value="456" subtitle="89 este mês" color="#4F46E5" />
        <StatCard title="Receita" value="R$ 8.900" subtitle="R$ 2.340 este mês" color="#F59E0B" />
      </div>

      {/* GRID DE FERRAMENTAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { nome: 'Gerador de Scripts', preco: 'R$ 29,90', vendas: 89, categoria: 'IA' },
          { nome: 'Criador de Thumbnails', preco: 'R$ 19,90', vendas: 67, categoria: 'Design' },
          { nome: 'Analisador de Trends', preco: 'R$ 39,90', vendas: 45, categoria: 'Analytics' },
          { nome: 'Otimizador de SEO', preco: 'R$ 24,90', vendas: 78, categoria: 'SEO' },
          { nome: 'Gerador de Hashtags', preco: 'R$ 14,90', vendas: 123, categoria: 'Social' },
          { nome: 'Criador de Logos', preco: 'R$ 49,90', vendas: 34, categoria: 'Design' }
        ].map((ferramenta, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg">{ferramenta.nome}</h3>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{ferramenta.categoria}</span>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-green-600">{ferramenta.preco}</p>
              <p className="text-sm text-gray-600">{ferramenta.vendas} vendas</p>
            </div>
            <div className="mt-4 flex space-x-2">
              <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700">
                Editar
              </button>
              <button className="flex-1 bg-gray-600 text-white py-2 px-3 rounded text-sm hover:bg-gray-700">
                Estatísticas
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 🏢 ABA FRANQUIAS
  const FranchisesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🏢 Sistema de Franquias</h2>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
          + Nova Franquia
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Franquias Ativas" value="6" subtitle="de 8 vendidas" color="#8B5CF6" />
        <StatCard title="Receita Inicial" value="R$ 125K" subtitle="Taxa de franquia" color="#10B981" />
        <StatCard title="Royalties Mensais" value="R$ 8.5K" subtitle="5% das vendas" color="#F59E0B" />
        <StatCard title="Territórios Livres" value="6" subtitle="de 14 disponíveis" color="#06B6D4" />
      </div>

      {/* MAPA DE TERRITÓRIOS */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">🗺️ Mapa de Territórios</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { territorio: 'São Paulo', status: 'Ativa', franqueado: 'João Silva' },
            { territorio: 'Rio de Janeiro', status: 'Ativa', franqueado: 'Maria Santos' },
            { territorio: 'Minas Gerais', status: 'Disponível', franqueado: null },
            { territorio: 'Bahia', status: 'Ativa', franqueado: 'Pedro Costa' },
            { territorio: 'Paraná', status: 'Disponível', franqueado: null },
            { territorio: 'Rio Grande do Sul', status: 'Ativa', franqueado: 'Ana Lima' },
            { territorio: 'Ceará', status: 'Disponível', franqueado: null },
            { territorio: 'Pernambuco', status: 'Ativa', franqueado: 'Carlos Oliveira' }
          ].map((item, index) => (
            <div key={index} className={`p-4 rounded-lg border-2 ${
              item.status === 'Ativa' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <h4 className="font-semibold">{item.territorio}</h4>
              <p className={`text-sm ${item.status === 'Ativa' ? 'text-green-600' : 'text-gray-600'}`}>
                {item.status}
              </p>
              {item.franqueado && (
                <p className="text-xs text-gray-500 mt-1">{item.franqueado}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 🎨 ABA WHITE-LABEL
  const WhiteLabelTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🎨 Sistema White-Label</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          + Novo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Clientes Ativos" value="9" subtitle="de 12 total" color="#4F46E5" />
        <StatCard title="Receita Mensal" value="R$ 15.6K" subtitle="R$ 1.73K por cliente" color="#10B981" />
        <StatCard title="Subdomínios" value="9" subtitle="Configurados" color="#F59E0B" />
      </div>

      {/* LISTA DE CLIENTES WHITE-LABEL */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Clientes White-Label</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subdomínio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receita</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { cliente: 'TechCorp', subdominio: 'techcorp.viralizaai.com', plano: 'Enterprise', receita: 'R$ 599', status: 'Ativo' },
                { cliente: 'MarketPro', subdominio: 'marketpro.viralizaai.com', plano: 'Professional', receita: 'R$ 299', status: 'Ativo' },
                { cliente: 'DigitalMax', subdominio: 'digitalmax.viralizaai.com', plano: 'Basic', receita: 'R$ 99', status: 'Ativo' }
              ].map((cliente, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cliente.cliente}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{cliente.subdominio}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.plano}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.receita}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {cliente.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // 🌍 ABA API GLOBAL
  const ApiTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🌍 API Global</h2>
        <button className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700">
          + Nova API Key
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Requests Hoje" value="45.6K" subtitle="+12% vs ontem" color="#06B6D4" />
        <StatCard title="Clientes API" value="234" subtitle="89 ativos" color="#10B981" />
        <StatCard title="Receita API" value="R$ 3.4K" subtitle="Este mês" color="#F59E0B" />
        <StatCard title="Uptime" value="99.9%" subtitle="30 dias" color="#10B981" />
      </div>

      {/* ENDPOINTS MAIS USADOS */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Endpoints Mais Usados</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { endpoint: '/ai/generate', requests: 12500 },
            { endpoint: '/tools/analyze', requests: 8900 },
            { endpoint: '/content/create', requests: 6700 },
            { endpoint: '/seo/optimize', requests: 4500 },
            { endpoint: '/social/hashtags', requests: 3200 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="endpoint" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="requests" fill="#06B6D4" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // 🎯 NAVEGAÇÃO PRINCIPAL
  const tabs = [
    { id: 'overview', label: '📊 Overview', component: OverviewTab },
    { id: 'affiliates', label: '🤝 Afiliados', component: AffiliatesTab },
    { id: 'marketplace', label: '🛒 Marketplace', component: MarketplaceTab },
    { id: 'franchises', label: '🏢 Franquias', component: FranchisesTab },
    { id: 'whitelabel', label: '🎨 White-Label', component: WhiteLabelTab },
    { id: 'api', label: '🌍 API Global', component: ApiTab }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Carregando Ultra Império...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">👑 Admin - Ultra Império</h1>
              <p className="text-sm text-gray-600">Painel de controle completo</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">Receita Total</p>
                <p className="text-xl font-bold text-green-600">R$ {stats.revenue?.total?.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                A
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tabs.find(tab => tab.id === activeTab)?.component()}
      </div>
    </div>
  );
};

export default AdminDashboard;
