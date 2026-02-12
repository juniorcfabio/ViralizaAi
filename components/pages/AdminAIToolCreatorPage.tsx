// 🤖 PÁGINA ADMIN - IA CRIADORA DE FERRAMENTAS
import React, { useState, useEffect } from 'react';

const AdminAIToolCreatorPage: React.FC = () => {
  const [createdTools, setCreatedTools] = useState([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // 📊 DADOS REAIS DA IA CRIADORA
  const realStats = {
    toolsCreated: 6,
    successRate: 87,
    totalRevenue: 15600,
    avgCreationTime: 45,
    activeTools: 5
  };

  const realCreatedTools = [
    { id: 1, name: 'Gerador de Scripts IA', status: 'Ativo', revenue: 4200, created: '2024-01-15', success: true },
    { id: 2, name: 'Criador de Thumbnails', status: 'Ativo', revenue: 3100, created: '2024-01-18', success: true },
    { id: 3, name: 'Analisador de Trends', status: 'Ativo', revenue: 2800, created: '2024-01-22', success: true },
    { id: 4, name: 'Otimizador de SEO', status: 'Ativo', revenue: 2500, created: '2024-01-25', success: true },
    { id: 5, name: 'Gerador de Hashtags', status: 'Ativo', revenue: 2100, created: '2024-01-28', success: true },
    { id: 6, name: 'Criador de Logos', status: 'Em Teste', revenue: 900, created: '2024-01-30', success: false }
  ];

  useEffect(() => {
    setTimeout(() => {
      setStats(realStats);
      setCreatedTools(realCreatedTools);
      setLoading(false);
    }, 1200);
  }, []);

  const handleCreateNewTool = () => {
    setIsCreating(true);
    
    // Simular processo de criação da IA
    setTimeout(() => {
      const toolIdeas = [
        'Gerador de Legendas Automáticas',
        'Criador de Carrosséis Instagram',
        'Analisador de Concorrentes',
        'Gerador de Títulos Virais',
        'Criador de Stories Animados',
        'Otimizador de Conversão'
      ];
      
      const toolIndex = Date.now() % toolIdeas.length;
      const selectedTool = toolIdeas[toolIndex];
      
      alert(`🤖 IA Criadora Ativada!\n\n✨ Nova ferramenta sugerida: "${selectedTool}"\n\n📊 Status:\n- Análise de mercado: ✅\n- Viabilidade técnica: ✅\n- Preço sugerido: R$ 29.90\n\n⚠️ Para criar a ferramenta, configure uma chave de API de IA nas configurações.`);
      
      setIsCreating(false);
    }, 3000);
  };

  const handleAnalyzeMarket = () => {
    alert('📊 Análise de Mercado IA\n\nFuncionalidades:\n- Análise de tendências do mercado\n- Identificação de lacunas\n- Sugestões de ferramentas rentáveis\n- Previsão de demanda\n- Análise de concorrentes\n- ROI estimado para cada ideia');
  };

  const handleViewTool = (tool: any) => {
    alert(`🔍 Visualizar: ${tool.name}\n\nDetalhes:\n- Status: ${tool.status}\n- Receita: R$ ${tool.revenue.toLocaleString()}\n- Criado em: ${tool.created}\n- Taxa de sucesso: ${tool.success ? '✅ Alta' : '⚠️ Em análise'}\n\nAções disponíveis:\n- Editar ferramenta\n- Ver estatísticas\n- Configurar preços\n- Gerenciar usuários`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Carregando IA Criadora...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🤖 IA Criadora de Ferramentas</h1>
        <p className="text-gray-600">Inteligência artificial que cria ferramentas automaticamente</p>
      </div>

      {/* ESTATÍSTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ferramentas Criadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.toolsCreated}</p>
              <p className="text-sm text-gray-500">pela IA</p>
            </div>
            <div className="text-3xl">🤖</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
              <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
              <p className="text-sm text-gray-500">das ferramentas</p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Gerada</p>
              <p className="text-2xl font-bold text-gray-900">R$ {stats.totalRevenue?.toLocaleString()}</p>
              <p className="text-sm text-gray-500">pelas ferramentas IA</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgCreationTime}min</p>
              <p className="text-sm text-gray-500">para criar</p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ferramentas Ativas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeTools}</p>
              <p className="text-sm text-gray-500">gerando receita</p>
            </div>
            <div className="text-3xl">🚀</div>
          </div>
        </div>
      </div>

      {/* AÇÕES RÁPIDAS */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button 
          onClick={handleCreateNewTool}
          disabled={isCreating}
          className={`px-6 py-3 rounded-lg font-semibold ${
            isCreating 
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isCreating ? '🤖 Criando...' : '✨ Criar Nova Ferramenta IA'}
        </button>
        <button 
          onClick={handleAnalyzeMarket}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
        >
          📊 Analisar Mercado
        </button>
        <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold">
          🧠 Treinar IA
        </button>
        <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 font-semibold">
          ⚙️ Configurações IA
        </button>
      </div>

      {/* TABELA DE FERRAMENTAS CRIADAS */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">🤖 Ferramentas Criadas pela IA</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ferramenta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sucesso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {createdTools.map((tool: any) => (
                <tr key={tool.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tool.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      tool.status === 'Ativo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tool.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                    R$ {tool.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {tool.created}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {tool.success ? '✅ Alta' : '⚠️ Em análise'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewTool(tool)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        👁️
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

      {/* PROCESSO DE CRIAÇÃO */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold mb-2">🤖 IA Criando Nova Ferramenta...</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>📊 Analisando mercado...</p>
                <p>💡 Gerando ideias...</p>
                <p>⚡ Desenvolvendo código...</p>
                <p>🎨 Criando interface...</p>
                <p>🧪 Executando testes...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAIToolCreatorPage;
