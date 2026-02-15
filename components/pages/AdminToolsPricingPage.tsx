import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { supabase } from '../../src/lib/supabase';
import { centralizedPricingService, PlanPrice, PricingData } from '../../services/centralizedPricingService';

const AdminToolsPricingPage: React.FC = () => {
  const { user } = useAuth();
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [notification, setNotification] = useState('');
  const [editingPlan, setEditingPlan] = useState<PlanPrice | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPricingData();
    
    // Listener para mudanças em tempo real
    const handlePricingUpdate = (newPricing: PricingData) => {
      setPricingData(newPricing);
      showNotification('Preços atualizados em tempo real!');
    };

    centralizedPricingService.addListener(handlePricingUpdate);

    return () => {
      centralizedPricingService.removeListener(handlePricingUpdate);
    };
  }, []);

  const loadPricingData = async () => {
    try {
      setLoading(true);
      const data = await centralizedPricingService.loadPricing();
      setPricingData(data);
    } catch (error) {
      console.error('Erro ao carregar preços:', error);
      showNotification('Erro ao carregar preços');
    } finally {
      setLoading(false);
    }
  };


  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleEditPrice = (plan: PlanPrice) => {
    setEditingPlan(plan);
    setNewPrice(plan.price.toString());
  };

  const handleSavePrice = async () => {
    if (!editingPlan || !newPrice || !pricingData) return;

    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      showNotification('Preço inválido!');
      return;
    }

    try {
      // Atualizar usando o serviço centralizado
      await centralizedPricingService.updatePrice(editingPlan.id, price, editingPlan.category);
      
      showNotification(`Preço de ${editingPlan.name} atualizado para R$ ${price.toFixed(2)}`);
      setEditingPlan(null);
      setNewPrice('');
      
      console.log('💰 Preço atualizado com sucesso:', {
        plan: editingPlan.name,
        oldPrice: editingPlan.price,
        newPrice: price,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao salvar preço:', error);
      showNotification('Erro ao salvar preço!');
    }
  };

  const handleToggleActive = async (planId: string) => {
    if (!pricingData) return;
    
    try {
      const updatedPricing = { ...pricingData };
      
      // Atualizar em planos de assinatura
      updatedPricing.subscriptionPlans = updatedPricing.subscriptionPlans.map(plan => 
        plan.id === planId ? { ...plan, isActive: !plan.isActive } : plan
      );
      
      // Atualizar em planos de anúncio
      updatedPricing.advertisingPlans = updatedPricing.advertisingPlans.map(plan => 
        plan.id === planId ? { ...plan, isActive: !plan.isActive } : plan
      );
      
      await centralizedPricingService.savePricing(updatedPricing);
      
      const allPlans = [...updatedPricing.subscriptionPlans, ...updatedPricing.advertisingPlans];
      const plan = allPlans.find(p => p.id === planId);
      showNotification(`${plan?.name} ${plan?.isActive ? 'ativado' : 'desativado'}`);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      showNotification('Erro ao alterar status!');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Marketing': 'bg-blue-500/20 text-blue-300',
      'IA': 'bg-purple-500/20 text-purple-300',
      'Conteúdo': 'bg-green-500/20 text-green-300',
      'Crescimento': 'bg-orange-500/20 text-orange-300',
      'Assinatura': 'bg-yellow-500/20 text-yellow-300',
      'Plano de Anúncio': 'bg-pink-500/20 text-pink-300'
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
        <h1 className="text-3xl font-bold text-light mb-2">💰 Gerenciar Preços</h1>
        <p className="text-gray-400">Controle os preços das assinaturas e planos de anúncio</p>
      </div>

      {notification && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300">
          {notification}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando preços...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pricingData && [...pricingData.subscriptionPlans, ...pricingData.advertisingPlans].map((plan) => (
            <div key={plan.id} className="bg-secondary p-6 rounded-lg border border-primary/50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-light mb-2">{plan.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(plan.category)}`}>
                    {plan.category === 'subscription' ? 'Assinatura' : 'Plano de Anúncio'}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleActive(plan.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    plan.isActive 
                      ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' 
                      : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
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
                  onClick={() => handleEditPrice(plan)}
                  className="bg-accent hover:bg-accent/80 text-primary font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Editar Preço
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edição */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-secondary p-6 rounded-lg border border-primary/50 w-full max-w-md">
            <h2 className="text-xl font-bold text-light mb-4">
              Editar Preço - {editingPlan.name}
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
                  setEditingPlan(null);
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
      {pricingData && (
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="bg-secondary p-4 rounded-lg border border-primary/50">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Total de Planos</h3>
            <p className="text-2xl font-bold text-light">{pricingData.subscriptionPlans.length + pricingData.advertisingPlans.length}</p>
          </div>
          <div className="bg-secondary p-4 rounded-lg border border-primary/50">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Planos Ativos</h3>
            <p className="text-2xl font-bold text-green-400">
              {[...pricingData.subscriptionPlans, ...pricingData.advertisingPlans].filter(p => p.isActive).length}
            </p>
          </div>
          <div className="bg-secondary p-4 rounded-lg border border-primary/50">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Preço Médio</h3>
            <p className="text-2xl font-bold text-accent">
              R$ {(
                [...pricingData.subscriptionPlans, ...pricingData.advertisingPlans]
                  .reduce((sum, plan) => sum + plan.price, 0) / 
                (pricingData.subscriptionPlans.length + pricingData.advertisingPlans.length)
              ).toFixed(2)}
            </p>
          </div>
          <div className="bg-secondary p-4 rounded-lg border border-primary/50">
            <h3 className="text-sm font-medium text-gray-400 mb-1">Receita Potencial</h3>
            <p className="text-2xl font-bold text-purple-400">
              R$ {[...pricingData.subscriptionPlans, ...pricingData.advertisingPlans]
                .filter(p => p.isActive)
                .reduce((sum, plan) => sum + plan.price, 0)
                .toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminToolsPricingPage;
