import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { centralizedPricingService, PlanPrice, PricingData } from '../../services/centralizedPricingService';

interface ToolPriceItem {
  tool_id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  plan_tier: number;
  icon: string;
  popular: boolean;
  is_active: boolean;
}

const PLAN_TIER_LABELS: Record<number, string> = { 1: 'Mensal', 2: 'Trimestral', 3: 'Semestral', 4: 'Anual' };

const AdminToolsPricingPage: React.FC = () => {
  const { user } = useAuth();
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [toolPrices, setToolPrices] = useState<ToolPriceItem[]>([]);
  const [notification, setNotification] = useState('');
  const [editingPlan, setEditingPlan] = useState<PlanPrice | null>(null);
  const [editingTool, setEditingTool] = useState<ToolPriceItem | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tools' | 'subscriptions' | 'ads'>('tools');
  const [savingTool, setSavingTool] = useState(false);

  useEffect(() => {
    loadAllData();
    const handlePricingUpdate = (newPricing: PricingData) => {
      setPricingData(newPricing);
    };
    centralizedPricingService.addListener(handlePricingUpdate);
    return () => { centralizedPricingService.removeListener(handlePricingUpdate); };
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [pData, toolRes] = await Promise.all([
        centralizedPricingService.loadPricing(),
        fetch('/api/admin/tool-pricing').then(r => r.json()).catch(() => ({ success: false, tools: [] }))
      ]);
      setPricingData(pData);
      if (toolRes.success && toolRes.tools?.length > 0) {
        setToolPrices(toolRes.tools);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleSavePrice = async () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) { showNotification('Preço inválido!'); return; }

    try {
      if (editingPlan && pricingData) {
        await centralizedPricingService.updatePrice(editingPlan.id, price, editingPlan.category);
        showNotification(`✅ ${editingPlan.name} → R$ ${price.toFixed(2)}`);
        setEditingPlan(null);
        await loadAllData();
      } else if (editingTool) {
        setSavingTool(true);
        await fetch('/api/admin/tool-pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tools: [{
            tool_id: editingTool.tool_id,
            name: editingTool.name,
            price: price,
            category: editingTool.category,
            description: editingTool.description,
            planTier: editingTool.plan_tier,
            icon: editingTool.icon,
            popular: editingTool.popular,
            is_active: editingTool.is_active
          }] })
        });
        setToolPrices(prev => prev.map(t => t.tool_id === editingTool.tool_id ? { ...t, price } : t));
        showNotification(`✅ ${editingTool.name} → R$ ${price.toFixed(2)}`);
        setEditingTool(null);
        setSavingTool(false);
      }
      setNewPrice('');
    } catch (error) {
      console.error('Erro ao salvar preço:', error);
      showNotification('❌ Erro ao salvar preço!');
      setSavingTool(false);
    }
  };

  const handleToggleActive = async (planId: string) => {
    if (!pricingData) return;
    try {
      const updatedPricing = { ...pricingData };
      updatedPricing.subscriptionPlans = updatedPricing.subscriptionPlans.map(plan =>
        plan.id === planId ? { ...plan, isActive: !plan.isActive } : plan
      );
      updatedPricing.advertisingPlans = updatedPricing.advertisingPlans.map(plan =>
        plan.id === planId ? { ...plan, isActive: !plan.isActive } : plan
      );
      await centralizedPricingService.savePricing(updatedPricing);
      const allPlans = [...updatedPricing.subscriptionPlans, ...updatedPricing.advertisingPlans];
      const plan = allPlans.find(p => p.id === planId);
      showNotification(`${plan?.name} ${plan?.isActive ? 'ativado' : 'desativado'}`);
    } catch (error) {
      showNotification('Erro ao alterar status!');
    }
  };

  const getToolCatColor = (cat: string) => {
    const c: Record<string, string> = {
      'IA': 'bg-purple-500/20 text-purple-300',
      'Design': 'bg-pink-500/20 text-pink-300',
      'Analytics': 'bg-cyan-500/20 text-cyan-300',
      'SEO': 'bg-teal-500/20 text-teal-300',
      'Social': 'bg-blue-500/20 text-blue-300',
      'Marketing': 'bg-orange-500/20 text-orange-300',
      'Vídeo': 'bg-red-500/20 text-red-300',
      'Conteúdo': 'bg-green-500/20 text-green-300',
    };
    return c[cat] || 'bg-gray-500/20 text-gray-300';
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

  const editingName = editingPlan?.name || editingTool?.name || '';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-light mb-2">💰 Gerenciar Preços</h1>
        <p className="text-gray-400">Controle preços das 15 ferramentas, assinaturas e anúncios — tudo salvo no Supabase</p>
      </div>

      {notification && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 font-medium">
          {notification}
        </div>
      )}

      {/* TABS */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'tools' as const, label: `🛠️ Ferramentas (${toolPrices.length || 15})` },
          { key: 'subscriptions' as const, label: `📋 Assinaturas (${pricingData?.subscriptionPlans.length || 0})` },
          { key: 'ads' as const, label: `📢 Anúncios (${pricingData?.advertisingPlans.length || 0})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-accent text-primary'
                : 'bg-secondary text-gray-400 hover:text-light hover:bg-secondary/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando preços do Supabase...</p>
          </div>
        </div>
      ) : (
        <>
          {/* ===== ABA FERRAMENTAS (15) ===== */}
          {activeTab === 'tools' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {toolPrices.map((tool) => (
                <div key={tool.tool_id} className="bg-secondary p-5 rounded-lg border border-primary/50 hover:border-accent/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{tool.icon}</span>
                      <div>
                        <h3 className="text-lg font-bold text-light">{tool.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getToolCatColor(tool.category)}`}>
                            {tool.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300">
                            Plano {PLAN_TIER_LABELS[tool.plan_tier] || tool.plan_tier}+
                          </span>
                          {tool.popular && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
                              🔥 Popular
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{tool.description}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-accent">R$ {parseFloat(String(tool.price)).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Preço avulso</p>
                    </div>
                    <button
                      onClick={() => { setEditingTool(tool); setEditingPlan(null); setNewPrice(String(tool.price)); }}
                      className="bg-accent hover:bg-accent/80 text-primary font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      ✏️ Editar
                    </button>
                  </div>
                </div>
              ))}

              {toolPrices.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400">
                  <p className="text-lg mb-2">Nenhuma ferramenta encontrada no Supabase</p>
                  <p className="text-sm">As ferramentas serão criadas automaticamente quando um usuário acessar o dashboard.</p>
                </div>
              )}
            </div>
          )}

          {/* ===== ABA ASSINATURAS ===== */}
          {activeTab === 'subscriptions' && pricingData && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pricingData.subscriptionPlans.map((plan) => (
                <div key={plan.id} className="bg-secondary p-6 rounded-lg border border-primary/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-light mb-2">{plan.name}</h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
                        Assinatura
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleActive(plan.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        plan.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {plan.isActive ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-accent">R$ {plan.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Preço atual</p>
                    </div>
                    <button
                      onClick={() => { setEditingPlan(plan); setEditingTool(null); setNewPrice(plan.price.toString()); }}
                      className="bg-accent hover:bg-accent/80 text-primary font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      Editar Preço
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== ABA ANÚNCIOS ===== */}
          {activeTab === 'ads' && pricingData && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pricingData.advertisingPlans.map((plan) => (
                <div key={plan.id} className="bg-secondary p-6 rounded-lg border border-primary/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-light mb-2">{plan.name}</h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-pink-500/20 text-pink-300">
                        Plano de Anúncio
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleActive(plan.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        plan.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {plan.isActive ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-accent">R$ {plan.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Preço atual</p>
                    </div>
                    <button
                      onClick={() => { setEditingPlan(plan); setEditingTool(null); setNewPrice(plan.price.toString()); }}
                      className="bg-accent hover:bg-accent/80 text-primary font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      Editar Preço
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de Edição */}
      {(editingPlan || editingTool) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-secondary p-6 rounded-lg border border-primary/50 w-full max-w-md">
            <h2 className="text-xl font-bold text-light mb-4">
              ✏️ Editar Preço — {editingName}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Novo Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full px-3 py-2 bg-primary border border-gray-600 rounded-lg text-light focus:outline-none focus:border-accent text-lg"
                placeholder="0.00"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSavePrice}
                disabled={savingTool}
                className="flex-1 bg-accent hover:bg-accent/80 text-primary font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {savingTool ? 'Salvando...' : '💾 Salvar no Supabase'}
              </button>
              <button
                onClick={() => { setEditingPlan(null); setEditingTool(null); setNewPrice(''); }}
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
          <h3 className="text-sm font-medium text-gray-400 mb-1">Ferramentas</h3>
          <p className="text-2xl font-bold text-light">{toolPrices.length}</p>
        </div>
        <div className="bg-secondary p-4 rounded-lg border border-primary/50">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Assinaturas</h3>
          <p className="text-2xl font-bold text-yellow-400">{pricingData?.subscriptionPlans.length || 0}</p>
        </div>
        <div className="bg-secondary p-4 rounded-lg border border-primary/50">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Planos de Anúncio</h3>
          <p className="text-2xl font-bold text-pink-400">{pricingData?.advertisingPlans.length || 0}</p>
        </div>
        <div className="bg-secondary p-4 rounded-lg border border-primary/50">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Receita Potencial</h3>
          <p className="text-2xl font-bold text-accent">
            R$ {(
              (toolPrices.reduce((s, t) => s + (parseFloat(String(t.price)) || 0), 0)) +
              ([...(pricingData?.subscriptionPlans || []), ...(pricingData?.advertisingPlans || [])]
                .filter(p => p.isActive).reduce((s, p) => s + p.price, 0))
            ).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminToolsPricingPage;
