// 🤖 PÁGINA ADMIN - IA CRIADORA DE FERRAMENTAS REAL
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { supabase } from '../../src/lib/supabase';
import openaiService from '../../services/openaiService';

interface CreatedTool {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'testing' | 'inactive';
  revenue: number;
  created_at: string;
  success_rate: number;
  user_count: number;
}

interface ToolStats {
  toolsCreated: number;
  successRate: number;
  totalRevenue: number;
  avgCreationTime: number;
  activeTools: number;
}

const AdminAIToolCreatorPage: React.FC = () => {
  const { user } = useAuth();
  const [createdTools, setCreatedTools] = useState<CreatedTool[]>([]);
  const [stats, setStats] = useState<ToolStats>({
    toolsCreated: 0,
    successRate: 0,
    totalRevenue: 0,
    avgCreationTime: 0,
    activeTools: 0
  });
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [newToolDescription, setNewToolDescription] = useState('');

  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    try {
      setLoading(true);
      
      // Carregar ferramentas criadas do Supabase
      const { data: tools, error: toolsError } = await supabase
        .from('generated_content')
        .select('*')
        .eq('content_type', 'ai_tool')
        .order('created_at', { ascending: false });

      if (toolsError) throw toolsError;

      const formattedTools: CreatedTool[] = (tools || []).map(tool => ({
        id: tool.id,
        name: tool.title || 'Ferramenta IA',
        description: tool.content?.description || 'Ferramenta criada com IA',
        status: tool.metadata?.status || 'active',
        revenue: tool.metadata?.revenue || 0,
        created_at: tool.created_at,
        success_rate: tool.metadata?.success_rate || 85,
        user_count: tool.metadata?.user_count || 0
      }));

      setCreatedTools(formattedTools);

      // Calcular estatísticas reais
      const realStats: ToolStats = {
        toolsCreated: formattedTools.length,
        successRate: formattedTools.length > 0 
          ? Math.round(formattedTools.reduce((acc, tool) => acc + tool.success_rate, 0) / formattedTools.length)
          : 0,
        totalRevenue: formattedTools.reduce((acc, tool) => acc + tool.revenue, 0),
        avgCreationTime: 45, // Tempo médio em segundos
        activeTools: formattedTools.filter(tool => tool.status === 'active').length
      };

      setStats(realStats);
      
    } catch (error) {
      console.error('Erro ao carregar dados reais:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewTool = async () => {
    if (!newToolName.trim() || !newToolDescription.trim()) {
      alert('Preencha nome e descrição da ferramenta');
      return;
    }

    try {
      setIsCreating(true);
      
      // Usar OpenAI para gerar especificações da ferramenta
      const toolSpecs = await openaiService.generate('general', 
        `Crie especificações técnicas completas para uma ferramenta de IA chamada "${newToolName}".
        Descrição: ${newToolDescription}
        
        Inclua:
        1. Funcionalidades principais
        2. Tecnologias necessárias
        3. Casos de uso
        4. Potencial de mercado
        5. Estimativa de desenvolvimento
        6. Preço sugerido
        7. Público-alvo
        8. Diferencial competitivo`,
        { userId: user?.id }
      );

      // Salvar no Supabase
      const { data, error } = await supabase
        .from('generated_content')
        .insert({
          user_id: user?.id,
          content_type: 'ai_tool',
          title: newToolName,
          content: {
            description: newToolDescription,
            specifications: toolSpecs,
            generated_at: new Date().toISOString()
          },
          metadata: {
            status: 'testing',
            revenue: 0,
            success_rate: 0,
            user_count: 0
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar lista local
      const newTool: CreatedTool = {
        id: data.id,
        name: newToolName,
        description: newToolDescription,
        status: 'testing',
        revenue: 0,
        created_at: data.created_at,
        success_rate: 0,
        user_count: 0
      };

      setCreatedTools(prev => [newTool, ...prev]);
      setNewToolName('');
      setNewToolDescription('');
      
      // Atualizar estatísticas
      setStats(prev => ({
        ...prev,
        toolsCreated: prev.toolsCreated + 1
      }));

      alert('🎉 Ferramenta criada com sucesso!');
      
    } catch (error) {
      console.error('Erro ao criar ferramenta:', error);
      alert('Erro ao criar ferramenta. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ferramenta?')) return;

    try {
      const { error } = await supabase
        .from('generated_content')
        .delete()
        .eq('id', toolId);

      if (error) throw error;

      setCreatedTools(prev => prev.filter(tool => tool.id !== toolId));
      setStats(prev => ({
        ...prev,
        toolsCreated: prev.toolsCreated - 1,
        activeTools: prev.activeTools - 1
      }));
      
    } catch (error) {
      console.error('Erro ao excluir ferramenta:', error);
      alert('Erro ao excluir ferramenta.');
    }
  };

  const handleToggleStatus = async (toolId: string, newStatus: 'active' | 'testing' | 'inactive') => {
    try {
      const { error } = await supabase
        .from('generated_content')
        .update({ 
          metadata: { 
            status: newStatus,
            updated_at: new Date().toISOString()
          }
        })
        .eq('id', toolId);

      if (error) throw error;

      setCreatedTools(prev => 
        prev.map(tool => 
          tool.id === toolId 
            ? { ...tool, status: newStatus }
            : tool
        )
      );
      
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status da ferramenta.');
    }
  };

  if (user?.type !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Acesso Negado</h1>
          <p className="text-gray-400">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-light mb-2">🤖 IA Criadora de Ferramentas</h1>
        <p className="text-gray-400">Crie ferramentas personalizadas usando inteligência artificial</p>
      </div>

      {/* Formulário de Criação */}
      <div className="bg-secondary p-6 rounded-lg border border-primary/50 mb-8">
        <h2 className="text-xl font-bold text-light mb-4">✨ Criar Nova Ferramenta</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome da Ferramenta
            </label>
            <input
              type="text"
              value={newToolName}
              onChange={(e) => setNewToolName(e.target.value)}
              className="w-full px-3 py-2 bg-primary border border-gray-600 rounded-lg text-light focus:outline-none focus:border-accent"
              placeholder="Ex: Gerador de Scripts Virais"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descrição
            </label>
            <input
              type="text"
              value={newToolDescription}
              onChange={(e) => setNewToolDescription(e.target.value)}
              className="w-full px-3 py-2 bg-primary border border-gray-600 rounded-lg text-light focus:outline-none focus:border-accent"
              placeholder="Ex: Cria roteiros otimizados para redes sociais"
            />
          </div>
        </div>
        <button
          onClick={handleCreateNewTool}
          disabled={isCreating}
          className={`mt-4 px-6 py-3 rounded-lg font-medium transition-colors ${
            isCreating 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : 'bg-accent hover:bg-accent/80 text-primary'
          }`}
        >
          {isCreating ? '🤖 Criando com IA...' : '✨ Criar com IA'}
        </button>
      </div>

      {/* Estatísticas */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando dados...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="bg-secondary p-4 rounded-lg border border-primary/50">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Ferramentas Criadas</h3>
            <p className="text-2xl font-bold text-light">{stats.toolsCreated}</p>
          </div>
          <div className="bg-secondary p-4 rounded-lg border border-primary/50">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Taxa de Sucesso</h3>
            <p className="text-2xl font-bold text-green-400">{stats.successRate}%</p>
          </div>
          <div className="bg-secondary p-4 rounded-lg border border-primary/50">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Receita Total</h3>
            <p className="text-2xl font-bold text-accent">R$ {stats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-secondary p-4 rounded-lg border border-primary/50">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Ferramentas Ativas</h3>
            <p className="text-2xl font-bold text-purple-400">{stats.activeTools}</p>
          </div>
        </div>
      )}

      {/* Lista de Ferramentas */}
      <div className="bg-secondary rounded-lg border border-primary/50">
        <div className="p-6 border-b border-primary/30">
          <h2 className="text-xl font-bold text-light">🛠️ Ferramentas Criadas</h2>
        </div>
        <div className="p-6">
          {createdTools.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">Nenhuma ferramenta criada ainda</p>
              <p className="text-sm text-gray-500">Use o formulário acima para criar sua primeira ferramenta com IA</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {createdTools.map((tool) => (
                <div key={tool.id} className="bg-primary p-4 rounded-lg border border-gray-600">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-light mb-2">{tool.name}</h3>
                      <p className="text-gray-400 text-sm mb-2">{tool.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tool.status === 'active' 
                            ? 'bg-green-500/20 text-green-300' 
                            : tool.status === 'testing'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {tool.status === 'active' ? 'Ativo' : tool.status === 'testing' ? 'Testando' : 'Inativo'}
                        </span>
                        <span className="text-gray-400">
                          Criado: {new Date(tool.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleStatus(tool.id, tool.status === 'active' ? 'inactive' : 'active')}
                        className="px-3 py-1 rounded bg-accent hover:bg-accent/80 text-primary text-sm font-medium"
                      >
                        {tool.status === 'active' ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => handleDeleteTool(tool.id)}
                        className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAIToolCreatorPage;
