import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';

interface ToolPrice {
  id: string;
  name: string;
  currentPrice: number;
  category: string;
  description: string;
  isActive: boolean;
}

const AdminToolsPricingPage: React.FC = () => {
  const { user } = useAuth();
  const [tools, setTools] = useState<ToolPrice[]>([]);
  const [notification, setNotification] = useState('');
  const [editingTool, setEditingTool] = useState<ToolPrice | null>(null);
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    loadToolsPricing();
  }, []);

  const loadToolsPricing = () => {
    // Carregar preços das ferramentas do localStorage ou usar padrões
    const savedPricing = localStorage.getItem('admin_tools_pricing');
    const defaultTools: ToolPrice[] = [
      {
        id: 'viral-marketing',
        name: 'Marketing Viral Gratuito',
        currentPrice: 297.00,
        category: 'Marketing',
        description: 'Sistema de marketing viral automatizado 24/7',
        isActive: true
      },
      {
        id: 'global-promotion',
        name: 'Promoção Global',
        currentPrice: 497.00,
        category: 'Marketing',
        description: 'Promoção mundial em 19 países e 12 idiomas',
        isActive: true
      },
      {
        id: 'ai-video-generator',
        name: 'Gerador de Vídeo IA 8K',
        currentPrice: 197.00,
        category: 'IA',
        description: 'Geração de vídeos profissionais em 8K',
        isActive: true
      },
      {
        id: 'ai-funnel-builder',
        name: 'AI Funnel Builder',
        currentPrice: 147.00,
        category: 'IA',
        description: 'Construtor de funis inteligente',
        isActive: true
      },
      {
        id: 'ebook-generator',
        name: 'Ebook Generator Ultra',
        currentPrice: 97.00,
        category: 'Conteúdo',
        description: 'Gerador de ebooks ultra-técnico',
        isActive: true
      },
      {
        id: 'growth-engine',
        name: 'Motor de Crescimento',
        currentPrice: 397.00,
        category: 'Crescimento',
        description: 'Sistema de crescimento exponencial',
        isActive: true
      }
    ];

    // Planos de assinatura
    const subscriptionPlans = [
      {
        id: 'monthly',
        name: 'Mensal',
        currentPrice: 59.90,
        category: 'Assinatura',
        description: 'Crescimento Orgânico, Gestão de Conteúdo, Análises Básicas',
        isActive: true
      },
      {
        id: 'quarterly',
        name: 'Trimestral',
        currentPrice: 159.90,
        category: 'Assinatura',
        description: 'Tudo do Mensal + Análises Avançadas + IA Otimizada',
        isActive: true
      },
      {
        id: 'semiannual',
        name: 'Semestral',
        currentPrice: 259.90,
        category: 'Assinatura',
        description: 'Tudo do Trimestral + Relatórios Estratégicos + Acesso Beta',
        isActive: true
      },
      {
        id: 'annual',
        name: 'Anual',
        currentPrice: 399.90,
        category: 'Assinatura',
        description: 'Tudo do Semestral + Gerente Dedicado + API + 2 Meses Grátis',
        isActive: true
      }
    ];

    if (savedPricing) {
      const savedTools = JSON.parse(savedPricing);
      // Combinar ferramentas e planos de assinatura
      const allItems = [...savedTools, ...subscriptionPlans];
      setTools(allItems);
    } else {
      const allItems = [...defaultTools, ...subscriptionPlans];
      setTools(allItems);
      localStorage.setItem('admin_tools_pricing', JSON.stringify(allItems));
    }
    
    // Salvar planos para a landing page e billing
    const plansForLanding = subscriptionPlans.map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.currentPrice,
      features: plan.description.split(' + '),
      highlight: plan.id === 'semiannual'
    }));
    
    localStorage.setItem('viraliza_plans', JSON.stringify(plansForLanding));
    localStorage.setItem('subscription_plans', JSON.stringify(plansForLanding));
    localStorage.setItem('pricing_updated', Date.now().toString());
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleEditPrice = (tool: ToolPrice) => {
    setEditingTool(tool);
    setNewPrice(tool.currentPrice.toString());
  };

  const handleSavePrice = () => {
    if (!editingTool || !newPrice) return;

    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      showNotification('Preço inválido!');
      return;
    }

    const updatedTools = tools.map(tool => 
      tool.id === editingTool.id 
        ? { ...tool, currentPrice: price }
        : tool
    );

    // Atualizar estado local PRIMEIRO
    setTools(updatedTools);
    
    // Salvar no localStorage
    localStorage.setItem('admin_tools_pricing', JSON.stringify(updatedTools));
    
    // Atualizar preços para usuários em tempo real
    localStorage.setItem('tools_pricing_updated', Date.now().toString());
    
    // Se for plano de assinatura, atualizar também os dados específicos
    if (editingTool.category === 'Assinatura') {
      const subscriptionPlans = updatedTools.filter(tool => tool.category === 'Assinatura');
      const plansForLanding = subscriptionPlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.currentPrice,
        features: plan.description.split(' + '),
        highlight: plan.id === 'semiannual'
      }));
      
      localStorage.setItem('viraliza_plans', JSON.stringify(plansForLanding));
      localStorage.setItem('subscription_plans', JSON.stringify(plansForLanding));
    }
    
    // SISTEMA DE SINCRONIZAÇÃO ULTRA-ROBUSTO
    console.log('🚀 Ativando sincronização ultra-robusta para:', editingTool.name);
    
    // O novo sistema RealTimePriceSyncService detectará automaticamente
    // as mudanças no localStorage e propagará via BroadcastChannel
    // para todas as abas/janelas em tempo real (50ms de latência)
    
    console.log('💰 Preço atualizado:', {
      tool: editingTool.name,
      oldPrice: editingTool.currentPrice,
      newPrice: price,
      timestamp: new Date().toISOString()
    });
    
    showNotification(`Preço de ${editingTool.name} atualizado para R$ ${price.toFixed(2)}`);
    setEditingTool(null);
    setNewPrice('');
  };

  const handleToggleActive = (toolId: string) => {
    const updatedTools = tools.map(tool => 
      tool.id === toolId 
        ? { ...tool, isActive: !tool.isActive }
        : tool
    );

    setTools(updatedTools);
    localStorage.setItem('admin_tools_pricing', JSON.stringify(updatedTools));
    
    const tool = tools.find(t => t.id === toolId);
    showNotification(`${tool?.name} ${tool?.isActive ? 'desativada' : 'ativada'}`);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Marketing': 'bg-blue-500/20 text-blue-300',
      'IA': 'bg-purple-500/20 text-purple-300',
      'Conteúdo': 'bg-green-500/20 text-green-300',
      'Crescimento': 'bg-orange-500/20 text-orange-300',
      'Assinatura': 'bg-yellow-500/20 text-yellow-300'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500/20 text-gray-300';
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
        <h1 className="text-3xl font-bold text-light mb-2">💰 Gerenciar Preços das Ferramentas</h1>
        <p className="text-gray-400">Controle os preços das ferramentas vendidas avulsamente para usuários</p>
      </div>

      {notification && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300">
          {notification}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <div key={tool.id} className="bg-secondary p-6 rounded-lg border border-primary/50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-light mb-2">{tool.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(tool.category)}`}>
                  {tool.category}
                </span>
              </div>
              <button
                onClick={() => handleToggleActive(tool.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  tool.isActive 
                    ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' 
                    : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                }`}
              >
                {tool.isActive ? 'Ativo' : 'Inativo'}
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-4">{tool.description}</p>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-accent">R$ {tool.currentPrice.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Preço atual</p>
              </div>
              <button
                onClick={() => handleEditPrice(tool)}
                className="bg-accent hover:bg-accent/80 text-primary font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Editar Preço
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Edição */}
      {editingTool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-secondary p-6 rounded-lg border border-primary/50 w-full max-w-md">
            <h2 className="text-xl font-bold text-light mb-4">
              Editar Preço - {editingTool.name}
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Novo Preço (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full px-3 py-2 bg-primary border border-gray-600 rounded-lg text-light focus:outline-none focus:border-accent"
                placeholder="0.00"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSavePrice}
                className="flex-1 bg-accent hover:bg-accent/80 text-primary font-medium py-2 rounded-lg transition-colors"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setEditingTool(null);
                  setNewPrice('');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-light font-medium py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="bg-secondary p-4 rounded-lg border border-primary/50">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Total de Ferramentas</h3>
          <p className="text-2xl font-bold text-light">{tools.length}</p>
        </div>
        <div className="bg-secondary p-4 rounded-lg border border-primary/50">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Ferramentas Ativas</h3>
          <p className="text-2xl font-bold text-green-400">{tools.filter(t => t.isActive).length}</p>
        </div>
        <div className="bg-secondary p-4 rounded-lg border border-primary/50">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Preço Médio</h3>
          <p className="text-2xl font-bold text-accent">
            R$ {(tools.reduce((sum, tool) => sum + tool.currentPrice, 0) / tools.length).toFixed(2)}
          </p>
        </div>
        <div className="bg-secondary p-4 rounded-lg border border-primary/50">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Receita Potencial</h3>
          <p className="text-2xl font-bold text-purple-400">
            R$ {tools.filter(t => t.isActive).reduce((sum, tool) => sum + tool.currentPrice, 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminToolsPricingPage;
