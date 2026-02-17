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
  openai_model_key?: string;
  avg_tokens_per_use?: number;
  margin_percent?: number;
  usage_limit_plan?: number;
  credit_price_brl?: number;
  // enriched fields from extended API
  cost_per_use_usd?: number;
  cost_per_use_brl?: number;
  actual_margin_percent?: number | string;
  suggested_min_price?: string;
  openai_model?: any;
}

interface OpenAICost {
  id?: number;
  model_key: string;
  model_name: string;
  charge_type: string;
  cost_input_usd: number;
  cost_output_usd: number;
  notes: string;
  last_updated?: string;
}

interface PlatformConfig {
  usd_brl_rate: number;
  default_margin_percent: number;
  credit_markup_percent: number;
}

interface FinancialReport {
  period: string;
  usd_brl_rate: number;
  total_cost_usd: number;
  total_cost_brl: number;
  total_credit_revenue: number;
  total_sub_revenue: number;
  total_revenue: number;
  margin_brl: number;
  margin_percent: number | string;
  tool_breakdown: any[];
  usage_count: number;
  credit_transactions: number;
}

const PLAN_TIER_LABELS: Record<number, string> = { 1: 'Mensal', 2: 'Trimestral', 3: 'Semestral', 4: 'Anual' };

type TabKey = 'tools' | 'subscriptions' | 'ads' | 'openai' | 'financial';

const AdminToolsPricingPage: React.FC = () => {
  const { user } = useAuth();
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [toolPrices, setToolPrices] = useState<ToolPriceItem[]>([]);
  const [openaiCosts, setOpenaiCosts] = useState<OpenAICost[]>([]);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>({ usd_brl_rate: 5.40, default_margin_percent: 300, credit_markup_percent: 300 });
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [notification, setNotification] = useState('');
  const [editingPlan, setEditingPlan] = useState<PlanPrice | null>(null);
  const [editingTool, setEditingTool] = useState<ToolPriceItem | null>(null);
  const [editingCost, setEditingCost] = useState<OpenAICost | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('tools');
  const [savingTool, setSavingTool] = useState(false);
  const [initializingDB, setInitializingDB] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('month');
  // Editing cost fields
  const [costInputUsd, setCostInputUsd] = useState('');
  const [costOutputUsd, setCostOutputUsd] = useState('');
  // Config editing
  const [editingConfig, setEditingConfig] = useState(false);
  const [tempConfig, setTempConfig] = useState<PlatformConfig>({ usd_brl_rate: 5.40, default_margin_percent: 300, credit_markup_percent: 300 });

  useEffect(() => {
    loadAllData();
    const handlePricingUpdate = (newPricing: PricingData) => { setPricingData(newPricing); };
    centralizedPricingService.addListener(handlePricingUpdate);
    return () => { centralizedPricingService.removeListener(handlePricingUpdate); };
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [pData, toolExtRes, costsRes, configRes] = await Promise.all([
        centralizedPricingService.loadPricing(),
        fetch('/api/admin/tool-pricing-extended').then(r => r.json()).catch(() => ({ success: false, tools: [] })),
        fetch('/api/admin/openai-costs').then(r => r.json()).catch(() => ({ success: false, costs: [] })),
        fetch('/api/admin/platform-config').then(r => r.json()).catch(() => ({ success: false, config: { usd_brl_rate: 5.40, default_margin_percent: 300, credit_markup_percent: 300 } }))
      ]);
      setPricingData(pData);
      if (toolExtRes.success && toolExtRes.tools?.length > 0) {
        setToolPrices(toolExtRes.tools);
      } else {
        // Fallback to basic tool pricing
        const basicRes = await fetch('/api/admin/tool-pricing').then(r => r.json()).catch(() => ({ tools: [] }));
        if (basicRes.tools?.length > 0) setToolPrices(basicRes.tools);
      }
      if (costsRes.success) setOpenaiCosts(costsRes.costs || []);
      if (configRes.success && configRes.config) {
        setPlatformConfig(configRes.config);
        setTempConfig(configRes.config);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialReport = async (period: string) => {
    try {
      const res = await fetch(`/api/admin/financial-report?period=${period}`);
      const data = await res.json();
      if (data.success) setFinancialReport(data);
    } catch (e) {
      console.error('Erro report:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'financial') loadFinancialReport(reportPeriod);
  }, [activeTab, reportPeriod]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // ====== INIT DATABASE TABLES ======
  const handleInitDB = async () => {
    setInitializingDB(true);
    try {
      const res = await fetch('/api/database/init-credits');
      const data = await res.json();
      if (data.success) {
        showNotification('✅ Tabelas de créditos/custos criadas e dados seed inseridos!');
        await loadAllData();
      } else {
        showNotification('⚠️ Init parcial: ' + JSON.stringify(data.results?.slice(0, 3)));
      }
    } catch (e) {
      showNotification('❌ Erro ao inicializar: ' + (e as Error).message);
    } finally {
      setInitializingDB(false);
    }
  };

  // ====== SAVE TOOL PRICE ======
  const handleSavePrice = async () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) { showNotification('❌ Preço inválido!'); return; }
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
            tool_id: editingTool.tool_id, name: editingTool.name, price, category: editingTool.category,
            description: editingTool.description, planTier: editingTool.plan_tier, icon: editingTool.icon,
            popular: editingTool.popular, is_active: editingTool.is_active
          }] })
        });
        setToolPrices(prev => prev.map(t => t.tool_id === editingTool.tool_id ? { ...t, price } : t));
        showNotification(`✅ ${editingTool.name} → R$ ${price.toFixed(2)}`);
        setEditingTool(null);
        setSavingTool(false);
      }
      setNewPrice('');
    } catch (error) {
      showNotification('❌ Erro ao salvar preço!');
      setSavingTool(false);
    }
  };

  // ====== SAVE OPENAI COST ======
  const handleSaveCost = async () => {
    if (!editingCost) return;
    try {
      const updated = {
        ...editingCost,
        cost_input_usd: parseFloat(costInputUsd) || 0,
        cost_output_usd: parseFloat(costOutputUsd) || 0,
      };
      await fetch('/api/admin/openai-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ costs: [updated] })
      });
      setOpenaiCosts(prev => prev.map(c => c.model_key === editingCost.model_key ? { ...c, ...updated } : c));
      showNotification(`✅ Custo ${editingCost.model_name} atualizado`);
      setEditingCost(null);
    } catch (e) {
      showNotification('❌ Erro ao salvar custo OpenAI');
    }
  };

  // ====== SAVE PLATFORM CONFIG ======
  const handleSaveConfig = async () => {
    try {
      await fetch('/api/admin/platform-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempConfig)
      });
      setPlatformConfig(tempConfig);
      setEditingConfig(false);
      showNotification('✅ Configuração da plataforma salva!');
      await loadAllData();
    } catch (e) {
      showNotification('❌ Erro ao salvar configuração');
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
      const plan = [...updatedPricing.subscriptionPlans, ...updatedPricing.advertisingPlans].find(p => p.id === planId);
      showNotification(`${plan?.name} ${plan?.isActive ? 'ativado' : 'desativado'}`);
    } catch (error) {
      showNotification('Erro ao alterar status!');
    }
  };

  const getToolCatColor = (cat: string) => {
    const c: Record<string, string> = {
      'IA': 'bg-purple-500/20 text-purple-300', 'Design': 'bg-pink-500/20 text-pink-300',
      'Analytics': 'bg-cyan-500/20 text-cyan-300', 'SEO': 'bg-teal-500/20 text-teal-300',
      'Social': 'bg-blue-500/20 text-blue-300', 'Marketing': 'bg-orange-500/20 text-orange-300',
      'Vídeo': 'bg-red-500/20 text-red-300', 'Conteúdo': 'bg-green-500/20 text-green-300',
    };
    return c[cat] || 'bg-gray-500/20 text-gray-300';
  };

  const fmtBrl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
  const fmtUsd = (v: number) => `$ ${v.toFixed(4)}`;

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-light mb-2">💰 Gerenciar Preços & Custos</h1>
          <p className="text-gray-400">Ferramentas, assinaturas, anúncios, custos OpenAI e dashboard financeiro</p>
        </div>
        <button
          onClick={handleInitDB}
          disabled={initializingDB}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {initializingDB ? '⏳ Inicializando...' : '🗄️ Init Tabelas Créditos'}
        </button>
      </div>

      {notification && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 font-medium">
          {notification}
        </div>
      )}

      {/* TABS */}
      <div className="flex flex-wrap gap-2 mb-6">
        {([
          { key: 'tools' as TabKey, label: `🛠️ Ferramentas (${toolPrices.length || 15})` },
          { key: 'subscriptions' as TabKey, label: `📋 Assinaturas` },
          { key: 'ads' as TabKey, label: `📢 Anúncios` },
          { key: 'openai' as TabKey, label: `⚙️ Custos OpenAI (${openaiCosts.length})` },
          { key: 'financial' as TabKey, label: `📊 Dashboard Financeiro` },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
              activeTab === tab.key ? 'bg-accent text-primary' : 'bg-secondary text-gray-400 hover:text-light hover:bg-secondary/80'
            }`}>{tab.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando dados do Supabase...</p>
          </div>
        </div>
      ) : (
        <>
          {/* ===== ABA FERRAMENTAS COM CUSTO/MARGEM ===== */}
          {activeTab === 'tools' && (
            <>
              {/* Config bar */}
              <div className="mb-4 p-4 bg-secondary rounded-lg border border-primary/50 flex flex-wrap gap-6 items-center">
                <div><span className="text-gray-400 text-sm">Cotação USD→BRL:</span> <span className="text-light font-bold ml-1">R$ {platformConfig.usd_brl_rate.toFixed(2)}</span></div>
                <div><span className="text-gray-400 text-sm">Margem padrão:</span> <span className="text-green-400 font-bold ml-1">{platformConfig.default_margin_percent}%</span></div>
                <div><span className="text-gray-400 text-sm">Markup crédito extra:</span> <span className="text-yellow-400 font-bold ml-1">{platformConfig.credit_markup_percent}%</span></div>
                <button onClick={() => { setEditingConfig(true); setTempConfig({ ...platformConfig }); }}
                  className="ml-auto bg-gray-700 hover:bg-gray-600 text-light px-3 py-1 rounded text-sm">⚙️ Editar Configuração</button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {toolPrices.map((tool) => (
                  <div key={tool.tool_id} className="bg-secondary p-5 rounded-lg border border-primary/50 hover:border-accent/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{tool.icon}</span>
                        <div>
                          <h3 className="text-lg font-bold text-light">{tool.name}</h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getToolCatColor(tool.category)}`}>{tool.category}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300">Plano {PLAN_TIER_LABELS[tool.plan_tier] || tool.plan_tier}+</span>
                            {tool.popular && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300">🔥</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs mb-3 line-clamp-1">{tool.description}</p>

                    {/* Cost/margin info */}
                    <div className="bg-primary/50 rounded-lg p-3 mb-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Modelo OpenAI:</span>
                        <p className="text-cyan-400 font-medium">{tool.openai_model_key || 'gpt-4o'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Consumo/uso:</span>
                        <p className="text-light font-medium">{tool.avg_tokens_per_use || '~2000'} {tool.openai_model_key?.includes('dall') ? 'imgs' : 'tokens'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Custo/uso (USD):</span>
                        <p className="text-red-400 font-medium">{tool.cost_per_use_usd !== undefined ? fmtUsd(tool.cost_per_use_usd) : '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Custo/uso (BRL):</span>
                        <p className="text-red-400 font-medium">{tool.cost_per_use_brl !== undefined ? fmtBrl(tool.cost_per_use_brl) : '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Margem real:</span>
                        <p className={`font-bold ${Number(tool.actual_margin_percent) > 80 ? 'text-green-400' : Number(tool.actual_margin_percent) > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {tool.actual_margin_percent !== undefined ? `${tool.actual_margin_percent}%` : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Limite plano:</span>
                        <p className="text-light font-medium">{(tool.usage_limit_plan || 50000).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-accent">{fmtBrl(parseFloat(String(tool.price)) || 0)}</p>
                        <p className="text-xs text-gray-500">Preço avulso</p>
                      </div>
                      <button onClick={() => { setEditingTool(tool); setEditingPlan(null); setNewPrice(String(tool.price)); }}
                        className="bg-accent hover:bg-accent/80 text-primary font-medium px-4 py-2 rounded-lg transition-colors text-sm">✏️ Editar</button>
                    </div>
                  </div>
                ))}
                {toolPrices.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-400">
                    <p className="text-lg mb-2">Nenhuma ferramenta encontrada</p>
                    <p className="text-sm">Clique em "Init Tabelas Créditos" para criar as tabelas e dados iniciais.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ===== ABA ASSINATURAS ===== */}
          {activeTab === 'subscriptions' && pricingData && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pricingData.subscriptionPlans.map((plan) => (
                <div key={plan.id} className="bg-secondary p-6 rounded-lg border border-primary/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-light mb-2">{plan.name}</h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">Assinatura</span>
                    </div>
                    <button onClick={() => handleToggleActive(plan.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${plan.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      {plan.isActive ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-accent">R$ {plan.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Preço atual</p>
                    </div>
                    <button onClick={() => { setEditingPlan(plan); setEditingTool(null); setNewPrice(plan.price.toString()); }}
                      className="bg-accent hover:bg-accent/80 text-primary font-medium px-4 py-2 rounded-lg transition-colors">Editar Preço</button>
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
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-pink-500/20 text-pink-300">Plano de Anúncio</span>
                    </div>
                    <button onClick={() => handleToggleActive(plan.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${plan.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      {plan.isActive ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-accent">R$ {plan.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Preço atual</p>
                    </div>
                    <button onClick={() => { setEditingPlan(plan); setEditingTool(null); setNewPrice(plan.price.toString()); }}
                      className="bg-accent hover:bg-accent/80 text-primary font-medium px-4 py-2 rounded-lg transition-colors">Editar Preço</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== ABA CUSTOS OPENAI ===== */}
          {activeTab === 'openai' && (
            <div>
              {/* Platform Config */}
              <div className="mb-6 p-5 bg-secondary rounded-lg border border-primary/50">
                <h3 className="text-lg font-bold text-light mb-4">⚙️ Configuração da Plataforma</h3>
                {editingConfig ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Cotação USD → BRL</label>
                      <input type="number" step="0.01" value={tempConfig.usd_brl_rate}
                        onChange={(e) => setTempConfig({ ...tempConfig, usd_brl_rate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-primary border border-gray-600 rounded-lg text-light" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Margem padrão (%)</label>
                      <input type="number" step="1" value={tempConfig.default_margin_percent}
                        onChange={(e) => setTempConfig({ ...tempConfig, default_margin_percent: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-primary border border-gray-600 rounded-lg text-light" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Markup crédito extra (%)</label>
                      <input type="number" step="1" value={tempConfig.credit_markup_percent}
                        onChange={(e) => setTempConfig({ ...tempConfig, credit_markup_percent: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-primary border border-gray-600 rounded-lg text-light" />
                    </div>
                    <div className="md:col-span-3 flex gap-2">
                      <button onClick={handleSaveConfig} className="bg-accent hover:bg-accent/80 text-primary px-6 py-2 rounded-lg font-medium">💾 Salvar Config</button>
                      <button onClick={() => setEditingConfig(false)} className="bg-gray-600 hover:bg-gray-500 text-light px-4 py-2 rounded-lg">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-8 items-center">
                    <div>
                      <span className="text-gray-400 text-sm block">Cotação USD→BRL</span>
                      <span className="text-2xl font-bold text-light">R$ {platformConfig.usd_brl_rate.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm block">Margem padrão</span>
                      <span className="text-2xl font-bold text-green-400">{platformConfig.default_margin_percent}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm block">Markup crédito extra</span>
                      <span className="text-2xl font-bold text-yellow-400">{platformConfig.credit_markup_percent}%</span>
                    </div>
                    <button onClick={() => { setEditingConfig(true); setTempConfig({ ...platformConfig }); }}
                      className="ml-auto bg-accent hover:bg-accent/80 text-primary px-4 py-2 rounded-lg font-medium text-sm">✏️ Editar</button>
                  </div>
                )}
              </div>

              {/* OpenAI Cost Table */}
              <h3 className="text-lg font-bold text-light mb-4">🧠 Custos Unitários OpenAI (USD)</h3>
              {openaiCosts.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-lg mb-2">Nenhum custo OpenAI encontrado</p>
                  <p className="text-sm mb-4">Clique em "Init Tabelas Créditos" para criar e popular as tabelas.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-gray-700">
                        <th className="pb-3 text-gray-400 font-medium">Modelo</th>
                        <th className="pb-3 text-gray-400 font-medium">Tipo Cobrança</th>
                        <th className="pb-3 text-gray-400 font-medium text-right">Custo Input (USD)</th>
                        <th className="pb-3 text-gray-400 font-medium text-right">Custo Output (USD)</th>
                        <th className="pb-3 text-gray-400 font-medium text-right">Input (BRL)</th>
                        <th className="pb-3 text-gray-400 font-medium">Notas</th>
                        <th className="pb-3 text-gray-400 font-medium text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openaiCosts.map((cost) => (
                        <tr key={cost.model_key} className="border-b border-gray-800 hover:bg-secondary/50">
                          <td className="py-3 text-light font-medium">{cost.model_name}</td>
                          <td className="py-3 text-gray-300">{cost.charge_type}</td>
                          <td className="py-3 text-right text-red-400 font-mono">${cost.cost_input_usd}</td>
                          <td className="py-3 text-right text-red-400 font-mono">${cost.cost_output_usd}</td>
                          <td className="py-3 text-right text-yellow-400 font-mono">R$ {(cost.cost_input_usd * platformConfig.usd_brl_rate).toFixed(4)}</td>
                          <td className="py-3 text-gray-500 text-xs">{cost.notes}</td>
                          <td className="py-3 text-right">
                            <button onClick={() => { setEditingCost(cost); setCostInputUsd(String(cost.cost_input_usd)); setCostOutputUsd(String(cost.cost_output_usd)); }}
                              className="text-accent hover:text-accent/80 text-xs font-medium">✏️ Editar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-4 text-xs text-gray-500">Referência: <a href="https://openai.com/pricing" target="_blank" rel="noopener noreferrer" className="text-accent underline">openai.com/pricing</a> — Atualize os custos sempre que a OpenAI alterar a tabela.</p>
            </div>
          )}

          {/* ===== ABA DASHBOARD FINANCEIRO ===== */}
          {activeTab === 'financial' && (
            <div>
              <div className="flex gap-2 mb-6">
                {['week', 'month', 'year'].map(p => (
                  <button key={p} onClick={() => setReportPeriod(p)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${reportPeriod === p ? 'bg-accent text-primary' : 'bg-secondary text-gray-400'}`}>
                    {p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Ano'}
                  </button>
                ))}
              </div>

              {financialReport ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    <div className="bg-secondary p-5 rounded-lg border border-primary/50">
                      <h4 className="text-sm text-gray-400 mb-1">Receita Total</h4>
                      <p className="text-3xl font-bold text-green-400">{fmtBrl(financialReport.total_revenue)}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        <p>Assinaturas: {fmtBrl(financialReport.total_sub_revenue)}</p>
                        <p>Créditos: {fmtBrl(financialReport.total_credit_revenue)}</p>
                      </div>
                    </div>
                    <div className="bg-secondary p-5 rounded-lg border border-primary/50">
                      <h4 className="text-sm text-gray-400 mb-1">Custo OpenAI</h4>
                      <p className="text-3xl font-bold text-red-400">{fmtBrl(financialReport.total_cost_brl)}</p>
                      <p className="text-xs text-gray-500 mt-2">USD: ${financialReport.total_cost_usd.toFixed(4)}</p>
                      <p className="text-xs text-gray-500">Taxa: R$ {financialReport.usd_brl_rate.toFixed(2)}/USD</p>
                    </div>
                    <div className="bg-secondary p-5 rounded-lg border border-primary/50">
                      <h4 className="text-sm text-gray-400 mb-1">Lucro Líquido</h4>
                      <p className={`text-3xl font-bold ${financialReport.margin_brl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {fmtBrl(financialReport.margin_brl)}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Margem: {financialReport.margin_percent}%</p>
                    </div>
                    <div className="bg-secondary p-5 rounded-lg border border-primary/50">
                      <h4 className="text-sm text-gray-400 mb-1">Uso Total</h4>
                      <p className="text-3xl font-bold text-cyan-400">{financialReport.usage_count}</p>
                      <p className="text-xs text-gray-500 mt-2">{financialReport.credit_transactions} transações de crédito</p>
                    </div>
                  </div>

                  {/* Tool breakdown */}
                  {financialReport.tool_breakdown.length > 0 && (
                    <div className="bg-secondary rounded-lg border border-primary/50 p-5">
                      <h4 className="text-lg font-bold text-light mb-4">📊 Custo por Ferramenta</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-700 text-left">
                            <th className="pb-2 text-gray-400">Ferramenta</th>
                            <th className="pb-2 text-gray-400 text-right">Usos</th>
                            <th className="pb-2 text-gray-400 text-right">Tokens</th>
                            <th className="pb-2 text-gray-400 text-right">Imagens</th>
                            <th className="pb-2 text-gray-400 text-right">Custo (USD)</th>
                            <th className="pb-2 text-gray-400 text-right">Custo (BRL)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financialReport.tool_breakdown.map((tb, i) => (
                            <tr key={i} className="border-b border-gray-800">
                              <td className="py-2 text-light">{tb.tool}</td>
                              <td className="py-2 text-right text-gray-300">{tb.uses}</td>
                              <td className="py-2 text-right text-gray-300">{tb.tokens.toLocaleString()}</td>
                              <td className="py-2 text-right text-gray-300">{tb.images}</td>
                              <td className="py-2 text-right text-red-400 font-mono">${tb.cost_usd.toFixed(4)}</td>
                              <td className="py-2 text-right text-red-400 font-mono">{fmtBrl(tb.cost_usd * financialReport.usd_brl_rate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {financialReport.tool_breakdown.length === 0 && (
                    <div className="bg-secondary rounded-lg border border-primary/50 p-8 text-center text-gray-400">
                      <p className="text-lg mb-2">📊 Nenhum uso registrado no período</p>
                      <p className="text-sm">O dashboard será preenchido conforme os usuários utilizarem as ferramentas.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
                  <p>Carregando relatório financeiro...</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal de Edição de Preço (ferramenta/plano) */}
      {(editingPlan || editingTool) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-secondary p-6 rounded-lg border border-primary/50 w-full max-w-md">
            <h2 className="text-xl font-bold text-light mb-4">✏️ Editar Preço — {editingName}</h2>
            {editingTool && editingTool.cost_per_use_brl !== undefined && (
              <div className="mb-3 p-3 bg-primary/50 rounded-lg text-xs">
                <p className="text-gray-400">Custo real por uso: <span className="text-red-400 font-bold">{fmtBrl(editingTool.cost_per_use_brl)}</span></p>
                <p className="text-gray-400">Preço mínimo sugerido ({editingTool.margin_percent || 300}% margem): <span className="text-yellow-400 font-bold">R$ {editingTool.suggested_min_price}</span></p>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Novo Preço (R$)</label>
              <input type="number" step="0.01" min="0" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
                className="w-full px-3 py-2 bg-primary border border-gray-600 rounded-lg text-light focus:outline-none focus:border-accent text-lg" placeholder="0.00" autoFocus />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSavePrice} disabled={savingTool}
                className="flex-1 bg-accent hover:bg-accent/80 text-primary font-medium py-2 rounded-lg transition-colors disabled:opacity-50">
                {savingTool ? 'Salvando...' : '💾 Salvar'}
              </button>
              <button onClick={() => { setEditingPlan(null); setEditingTool(null); setNewPrice(''); }}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-light font-medium py-2 rounded-lg transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Custo OpenAI */}
      {editingCost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-secondary p-6 rounded-lg border border-primary/50 w-full max-w-md">
            <h2 className="text-xl font-bold text-light mb-4">⚙️ Editar Custo — {editingCost.model_name}</h2>
            <p className="text-xs text-gray-400 mb-3">Tipo: {editingCost.charge_type}</p>
            <div className="mb-3">
              <label className="block text-sm text-gray-300 mb-1">Custo Input (USD)</label>
              <input type="number" step="0.0001" min="0" value={costInputUsd} onChange={(e) => setCostInputUsd(e.target.value)}
                className="w-full px-3 py-2 bg-primary border border-gray-600 rounded-lg text-light" />
              <p className="text-xs text-gray-500 mt-1">= R$ {((parseFloat(costInputUsd) || 0) * platformConfig.usd_brl_rate).toFixed(4)}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-1">Custo Output (USD)</label>
              <input type="number" step="0.0001" min="0" value={costOutputUsd} onChange={(e) => setCostOutputUsd(e.target.value)}
                className="w-full px-3 py-2 bg-primary border border-gray-600 rounded-lg text-light" />
              <p className="text-xs text-gray-500 mt-1">= R$ {((parseFloat(costOutputUsd) || 0) * platformConfig.usd_brl_rate).toFixed(4)}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSaveCost} className="flex-1 bg-accent hover:bg-accent/80 text-primary font-medium py-2 rounded-lg">💾 Salvar</button>
              <button onClick={() => setEditingCost(null)} className="flex-1 bg-gray-600 hover:bg-gray-500 text-light font-medium py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Config Edit Modal */}
      {editingConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-secondary p-6 rounded-lg border border-primary/50 w-full max-w-lg">
            <h2 className="text-xl font-bold text-light mb-4">⚙️ Configuração da Plataforma</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Cotação USD → BRL</label>
                <input type="number" step="0.01" value={tempConfig.usd_brl_rate}
                  onChange={(e) => setTempConfig({ ...tempConfig, usd_brl_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-primary border border-gray-600 rounded-lg text-light" />
                <p className="text-xs text-gray-500 mt-1">Consulte: <a href="https://www.google.com/finance/quote/USD-BRL" target="_blank" className="text-accent">Google Finance</a></p>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Margem padrão sobre custo OpenAI (%)</label>
                <input type="number" step="1" value={tempConfig.default_margin_percent}
                  onChange={(e) => setTempConfig({ ...tempConfig, default_margin_percent: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-primary border border-gray-600 rounded-lg text-light" />
                <p className="text-xs text-gray-500 mt-1">Ex: 300% = preço de venda é 3x o custo</p>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Markup para créditos extras (%)</label>
                <input type="number" step="1" value={tempConfig.credit_markup_percent}
                  onChange={(e) => setTempConfig({ ...tempConfig, credit_markup_percent: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-primary border border-gray-600 rounded-lg text-light" />
                <p className="text-xs text-gray-500 mt-1">Aplicado quando o usuário compra créditos extras</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveConfig} className="flex-1 bg-accent hover:bg-accent/80 text-primary font-medium py-2 rounded-lg">💾 Salvar no Supabase</button>
              <button onClick={() => setEditingConfig(false)} className="flex-1 bg-gray-600 hover:bg-gray-500 text-light font-medium py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas Resumo */}
      <div className="mt-8 grid gap-4 md:grid-cols-5">
        <div className="bg-secondary p-4 rounded-lg border border-primary/50">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Ferramentas</h3>
          <p className="text-2xl font-bold text-light">{toolPrices.length}</p>
        </div>
        <div className="bg-secondary p-4 rounded-lg border border-primary/50">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Assinaturas</h3>
          <p className="text-2xl font-bold text-yellow-400">{pricingData?.subscriptionPlans.length || 0}</p>
        </div>
        <div className="bg-secondary p-4 rounded-lg border border-primary/50">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Anúncios</h3>
          <p className="text-2xl font-bold text-pink-400">{pricingData?.advertisingPlans.length || 0}</p>
        </div>
        <div className="bg-secondary p-4 rounded-lg border border-primary/50">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Modelos OpenAI</h3>
          <p className="text-2xl font-bold text-cyan-400">{openaiCosts.length}</p>
        </div>
        <div className="bg-secondary p-4 rounded-lg border border-primary/50">
          <h3 className="text-sm font-medium text-gray-400 mb-1">Cotação USD/BRL</h3>
          <p className="text-2xl font-bold text-accent">R$ {platformConfig.usd_brl_rate.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminToolsPricingPage;
