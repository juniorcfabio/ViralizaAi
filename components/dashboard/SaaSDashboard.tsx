// 📊 DASHBOARD SAAS PROFISSIONAL - LIMITES E USO
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { getPlanRules } from '../../lib/planRules.js';

interface UsageData {
  hasAccess: boolean;
  user?: {
    id: string;
    plan: string;
    planStatus: string;
    expiresAt: string;
    dailyUsage: number;
    monthlyUsage: {
      aiGenerations: number;
      videos: number;
      ebooks: number;
    };
  };
  planDetails?: {
    name: string;
    features: string[];
    limits: any;
  };
}

const SaaSDashboard: React.FC = () => {
  const { user } = useAuth();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageData();
  }, [user]);

  const loadUsageData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/check-user-plan', {
        headers: { 'x-user-id': user.id }
      });

      const data = await response.json();
      setUsageData(data);
    } catch (error) {
      console.error('Erro ao carregar dados de uso:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Carregando dashboard...</span>
      </div>
    );
  }

  if (!usageData?.hasAccess || !usageData.user) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Acesso Negado</h3>
        <p className="text-red-700">Você precisa de um plano ativo para acessar o dashboard.</p>
      </div>
    );
  }

  const planRules = getPlanRules(usageData.user.plan);
  const dailyUsage = usageData.user.dailyUsage || 0;
  const monthlyUsage = usageData.user.monthlyUsage || {
    aiGenerations: 0,
    videos: 0,
    ebooks: 0
  };

  // 📊 CALCULAR PERCENTUAIS
  const dailyPercent = planRules.toolsPerDay === Infinity ? 0 : 
    Math.min(100, (dailyUsage / planRules.toolsPerDay) * 100);
  
  const aiPercent = planRules.aiGenerations === Infinity ? 0 :
    Math.min(100, (monthlyUsage.aiGenerations / planRules.aiGenerations) * 100);

  const videoPercent = planRules.videosPerMonth === Infinity ? 0 :
    Math.min(100, (monthlyUsage.videos / planRules.videosPerMonth) * 100);

  const ebookPercent = planRules.ebooksPerMonth === Infinity ? 0 :
    Math.min(100, (monthlyUsage.ebooks / planRules.ebooksPerMonth) * 100);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* HEADER DO PLANO */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{planRules.name}</h1>
            <p className="opacity-90">Usuário: {usageData.user.id}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">R$ {planRules.price}</div>
            <div className="text-sm opacity-90">
              Expira: {new Date(usageData.user.expiresAt).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>
      </div>

      {/* CARDS DE USO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* USO DIÁRIO */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Ferramentas Hoje</h3>
            <span className="text-2xl">🛠️</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usado:</span>
              <span className="font-semibold">
                {dailyUsage} / {planRules.toolsPerDay === Infinity ? '∞' : planRules.toolsPerDay}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${dailyPercent > 80 ? 'bg-red-500' : dailyPercent > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(100, dailyPercent)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-600">
              Restante: {planRules.toolsPerDay === Infinity ? '∞' : Math.max(0, planRules.toolsPerDay - dailyUsage)}
            </div>
          </div>
        </div>

        {/* IA GERAÇÕES */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">IA Este Mês</h3>
            <span className="text-2xl">🤖</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usado:</span>
              <span className="font-semibold">
                {monthlyUsage.aiGenerations || 0} / {planRules.aiGenerations === Infinity ? '∞' : planRules.aiGenerations}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${aiPercent > 80 ? 'bg-red-500' : aiPercent > 60 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, aiPercent)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-600">
              Restante: {planRules.aiGenerations === Infinity ? '∞' : Math.max(0, planRules.aiGenerations - (monthlyUsage.aiGenerations || 0))}
            </div>
          </div>
        </div>

        {/* VÍDEOS */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Vídeos Este Mês</h3>
            <span className="text-2xl">🎬</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usado:</span>
              <span className="font-semibold">
                {monthlyUsage.videos || 0} / {planRules.videosPerMonth === Infinity ? '∞' : planRules.videosPerMonth}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${videoPercent > 80 ? 'bg-red-500' : videoPercent > 60 ? 'bg-yellow-500' : 'bg-purple-500'}`}
                style={{ width: `${Math.min(100, videoPercent)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-600">
              Restante: {planRules.videosPerMonth === Infinity ? '∞' : Math.max(0, planRules.videosPerMonth - (monthlyUsage.videos || 0))}
            </div>
          </div>
        </div>

        {/* EBOOKS */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Ebooks Este Mês</h3>
            <span className="text-2xl">📚</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usado:</span>
              <span className="font-semibold">
                {monthlyUsage.ebooks || 0} / {planRules.ebooksPerMonth === Infinity ? '∞' : planRules.ebooksPerMonth}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${ebookPercent > 80 ? 'bg-red-500' : ebookPercent > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(100, ebookPercent)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-600">
              Restante: {planRules.ebooksPerMonth === Infinity ? '∞' : Math.max(0, planRules.ebooksPerMonth - (monthlyUsage.ebooks || 0))}
            </div>
          </div>
        </div>
      </div>

      {/* RECURSOS DO PLANO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RECURSOS INCLUSOS */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">✨ Recursos Inclusos</h3>
          <div className="space-y-2">
            {planRules.features.map((feature, index) => (
              <div key={index} className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PERMISSÕES */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🔐 Permissões</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Ferramentas Básicas</span>
              <span className={`text-sm font-semibold ${planRules.permissions.basicTools ? 'text-green-600' : 'text-red-600'}`}>
                {planRules.permissions.basicTools ? '✓ Ativo' : '✗ Bloqueado'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Ferramentas Avançadas</span>
              <span className={`text-sm font-semibold ${planRules.permissions.advancedTools ? 'text-green-600' : 'text-red-600'}`}>
                {planRules.permissions.advancedTools ? '✓ Ativo' : '✗ Bloqueado'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Ferramentas Premium</span>
              <span className={`text-sm font-semibold ${planRules.permissions.premiumTools ? 'text-green-600' : 'text-red-600'}`}>
                {planRules.permissions.premiumTools ? '✓ Ativo' : '✗ Bloqueado'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Acesso à API</span>
              <span className={`text-sm font-semibold ${planRules.permissions.apiAccess ? 'text-green-600' : 'text-red-600'}`}>
                {planRules.permissions.apiAccess ? '✓ Ativo' : '✗ Bloqueado'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">White Label</span>
              <span className={`text-sm font-semibold ${planRules.permissions.whiteLabel ? 'text-green-600' : 'text-red-600'}`}>
                {planRules.permissions.whiteLabel ? '✓ Ativo' : '✗ Bloqueado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AÇÕES */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">⚡ Ações Rápidas</h3>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={loadUsageData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            🔄 Atualizar Dados
          </button>
          <button 
            onClick={() => window.location.href = '/pricing'}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            ⬆️ Fazer Upgrade
          </button>
          <button 
            onClick={() => window.location.href = '/tools'}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            🛠️ Usar Ferramentas
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaaSDashboard;
