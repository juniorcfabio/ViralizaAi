import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { useLanguage } from '../../contexts/LanguageContext';
import RealDataService from '../../services/realDataService';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [realMetrics, setRealMetrics] = useState<any>(null);

  // Inicializa dados reais
  useEffect(() => {
    const realDataService = RealDataService.getInstance();
    const metrics = realDataService.getRealMetrics();
    setRealMetrics(metrics);

    // Atualiza métricas a cada 30 segundos
    const interval = setInterval(() => {
      const updatedMetrics = realDataService.getRealMetrics();
      setRealMetrics(updatedMetrics);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header com métricas reais */}
      <div className="bg-secondary p-6 rounded-lg border border-gray-700">
        <h1 className="text-3xl font-bold mb-6">Dashboard - Dados Reais em Tempo Real</h1>
        
        {realMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-primary p-4 rounded-lg">
              <h3 className="text-sm text-gray-400 uppercase">Usuários Totais</h3>
              <p className="text-2xl font-bold text-accent">{realMetrics.users.total.toLocaleString()}</p>
              <p className="text-xs text-green-400">+{realMetrics.users.growth}% este mês</p>
            </div>
            
            <div className="bg-primary p-4 rounded-lg">
              <h3 className="text-sm text-gray-400 uppercase">Receita Mensal</h3>
              <p className="text-2xl font-bold text-green-400">R$ {realMetrics.revenue.monthly.toLocaleString()}</p>
              <p className="text-xs text-gray-300">R$ {realMetrics.revenue.daily.toLocaleString()} hoje</p>
            </div>
            
            <div className="bg-primary p-4 rounded-lg">
              <h3 className="text-sm text-gray-400 uppercase">Afiliados Ativos</h3>
              <p className="text-2xl font-bold text-blue-400">{realMetrics.affiliates.active.toLocaleString()}</p>
              <p className="text-xs text-gray-300">R$ {realMetrics.affiliates.commissions.toLocaleString()} em comissões</p>
            </div>
            
            <div className="bg-primary p-4 rounded-lg">
              <h3 className="text-sm text-gray-400 uppercase">Taxa de Conversão</h3>
              <p className="text-2xl font-bold text-purple-400">{realMetrics.engagement.ctr.toFixed(1)}%</p>
              <p className="text-xs text-gray-300">{realMetrics.engagement.conversions.toLocaleString()} conversões</p>
            </div>
          </div>
        )}
      </div>

      {/* Ferramentas de IA */}
      <div className="bg-secondary p-6 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-bold mb-4">Ferramentas de IA Avançadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/dashboard/ebook-generator')}
            className="bg-primary p-4 rounded-lg border border-accent hover:bg-accent/10 transition-colors text-left"
          >
            <h3 className="font-bold text-accent mb-2">📚 Gerador de Ebooks</h3>
            <p className="text-sm text-gray-300">Crie ebooks profissionais com IA</p>
          </button>
          
          <button
            onClick={() => navigate('/dashboard/ai-video-generator')}
            className="bg-primary p-4 rounded-lg border border-green-500 hover:bg-green-500/10 transition-colors text-left"
          >
            <h3 className="font-bold text-green-400 mb-2">🎥 Gerador de Vídeos IA</h3>
            <p className="text-sm text-gray-300">Vídeos ultra-realísticos com avatares</p>
          </button>
          
          <button
            onClick={() => navigate('/dashboard/ai-funnel-builder')}
            className="bg-primary p-4 rounded-lg border border-purple-500 hover:bg-purple-500/10 transition-colors text-left"
          >
            <h3 className="font-bold text-purple-400 mb-2">🔧 AI Funnel Builder</h3>
            <p className="text-sm text-gray-300">Funis de vendas inteligentes</p>
          </button>
        </div>
      </div>

      {/* Gráficos com dados reais */}
      <div className="bg-secondary p-6 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-bold mb-4">Análise de Performance - Dados Reais</h2>
        {realMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-primary p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-3 text-accent">Crescimento de Usuários</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Hoje</span>
                  <span className="text-sm font-bold text-green-400">+{realMetrics.users.dailyGrowth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Esta semana</span>
                  <span className="text-sm font-bold text-blue-400">+{realMetrics.users.weeklyGrowth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Este mês</span>
                  <span className="text-sm font-bold text-purple-400">+{realMetrics.users.growth}%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-primary p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-3 text-accent">Performance de Receita</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Receita Diária</span>
                  <span className="text-sm font-bold text-green-400">R$ {realMetrics.revenue.daily.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Receita Semanal</span>
                  <span className="text-sm font-bold text-blue-400">R$ {realMetrics.revenue.weekly.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Receita Mensal</span>
                  <span className="text-sm font-bold text-purple-400">R$ {realMetrics.revenue.monthly.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;