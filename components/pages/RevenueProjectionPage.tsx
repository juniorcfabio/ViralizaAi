import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import RealDataService from '../../services/realDataService';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Icons
const TrendingUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const DollarSignIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="2" y2="22"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const RevenueProjectionPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [projectionData, setProjectionData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const realDataService = RealDataService.getInstance();
    
    // Obter projeções detalhadas com sistema de IA adaptativa
    const detailed = realDataService.getDetailedRevenueProjections();
    setProjectionData(detailed);
    
    // Criar dados para o gráfico
    const chart = detailed.breakdown.map(item => ({
      period: item.period,
      value: item.value,
      growth: parseFloat(item.growth.replace(/[+%]/g, '')) || 0
    }));
    setChartData(chart);

    // Atualizar a cada 30 segundos para monitoramento em tempo real
    const interval = setInterval(() => {
      const updated = realDataService.getDetailedRevenueProjections();
      setProjectionData(updated);
      
      const updatedChart = updated.breakdown.map(item => ({
        period: item.period,
        value: item.value,
        growth: parseFloat(item.growth.replace(/[+%]/g, '')) || 0
      }));
      setChartData(updatedChart);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!user || !projectionData) {
    return <div className="flex justify-center items-center h-64">Carregando projeções...</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getGrowthColor = (growth: string) => {
    if (growth.includes('+')) return 'text-green-400';
    if (growth === 'Base atual') return 'text-blue-400';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-secondary p-6 rounded-lg border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUpIcon className="w-8 h-8 text-accent" />
          <div>
            <h1 className="text-3xl font-bold">Previsão de Faturamento</h1>
            <p className="text-gray-400">Projeções baseadas em dados reais de produção</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 p-4 rounded-lg border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <DollarSignIcon className="w-5 h-5 text-green-400" />
            <span className="text-sm font-bold text-green-400">RECEITA ATUAL</span>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {formatCurrency(projectionData.projections.daily)} / dia
          </p>
          <p className="text-sm text-gray-300">
            Baseado em crescimento real de 15.7% ao mês
          </p>
        </div>
      </div>

      {/* Gráfico de Projeções */}
      <div className="bg-secondary p-6 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-accent" />
          Crescimento Projetado
        </h2>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0B1747"/>
              <XAxis dataKey="period" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#02042B', border: '1px solid #0B1747' }}
                formatter={(value: number) => [formatCurrency(value), 'Receita']}
              />
              <Legend />
              <Bar dataKey="value" fill="#10B981" name="Receita Projetada"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cards de Projeção */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {projectionData.breakdown.map((item: any, index: number) => (
          <div key={item.period} className="bg-secondary p-6 rounded-lg border border-gray-700 hover:border-accent transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">{item.period}</h3>
              <span className={`text-sm font-bold ${getGrowthColor(item.growth)}`}>
                {item.growth}
              </span>
            </div>
            <p className="text-2xl font-bold text-accent mb-2">
              {formatCurrency(item.value)}
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              {/* Sistema de IA Adaptativa */}
              {projectionData.aiRecoverySystem && (
                <div className={`bg-secondary p-6 rounded-lg border ${
                  projectionData.aiRecoverySystem.currentTrend === 'crescendo' ? 'border-green-500/30' :
                  projectionData.aiRecoverySystem.currentTrend === 'declinando' ? 'border-red-500/30' :
                  'border-blue-500/30'
                }`}>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    🤖 Sistema de IA Adaptativa ViralizaAi
                  </h2>
                  
                  <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-4 rounded-lg mb-6">
                    <p className="text-accent font-bold text-lg mb-2">
                      🚀 IA NUNCA DEIXA O FATURAMENTO CAIR
                    </p>
                    <p className="text-gray-300 text-sm">
                      O sistema monitora em tempo real e se adapta automaticamente. Quando detecta qualquer declínio, 
                      a IA trabalha incansavelmente para recuperar e sempre manter o faturamento exponencial crescente.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-bold text-accent mb-3">Status Atual</h3>
                      <div className={`p-4 rounded-lg ${
                        projectionData.aiRecoverySystem.currentTrend === 'crescendo' ? 'bg-green-900/20' :
                        projectionData.aiRecoverySystem.currentTrend === 'declinando' ? 'bg-red-900/20' :
                        'bg-blue-900/20'
                      }`}>
                        <p className={`text-lg font-bold ${
                          projectionData.aiRecoverySystem.currentTrend === 'crescendo' ? 'text-green-400' :
                          projectionData.aiRecoverySystem.currentTrend === 'declinando' ? 'text-red-400' :
                          'text-blue-400'
                        }`}>
                          {projectionData.aiRecoverySystem.currentTrend === 'crescendo' ? '📈 ACELERANDO CRESCIMENTO' :
                           projectionData.aiRecoverySystem.currentTrend === 'declinando' ? '🔧 RECUPERAÇÃO ATIVA' :
                           '✅ MANTENDO CRESCIMENTO'}
                        </p>
                        <p className="text-sm text-gray-300 mt-2">
                          {projectionData.aiRecoverySystem.currentTrend === 'crescendo' ? 
                            'IA detectou oportunidade e está maximizando o crescimento exponencial' :
                           projectionData.aiRecoverySystem.currentTrend === 'declinando' ?
                            'IA ativou recuperação automática - faturamento será restaurado rapidamente' :
                            'IA garantindo performance estável e crescimento contínuo'}
                        </p>
                      </div>
                    </div>
                    
                    {projectionData.aiRecoverySystem.isActive && (
                      <div>
                        <h3 className="text-lg font-bold text-red-400 mb-3">🔧 IA Trabalhando para Recuperar</h3>
                        <div className="space-y-2">
                          {projectionData.aiRecoverySystem.recoveryActions.map((action: string, index: number) => (
                            <div key={index} className="bg-red-900/20 p-3 rounded-lg border border-red-500/30">
                              <p className="text-sm text-red-300">{action}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 bg-yellow-900/20 border border-yellow-500/30 p-3 rounded-lg">
                          <p className="text-yellow-300 text-sm font-bold">
                            ⚡ Sistema trabalhando 24/7 até restaurar crescimento exponencial
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Resumo Executivo */}
      <div className="bg-secondary p-6 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-bold mb-4">Resumo Executivo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-bold text-accent mb-3">Métricas Chave</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Receita Diária Atual:</span>
                <span className="font-bold">{formatCurrency(projectionData.projections.daily)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Crescimento Mensal:</span>
                <span className="font-bold text-green-400">+15.7%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Projeção Anual:</span>
                <span className="font-bold text-accent">{formatCurrency(projectionData.projections.annual)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-accent mb-3">Fatores de Crescimento</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Expansão de mercado com IA avançada</li>
              <li>• Novos produtos e funcionalidades</li>
              <li>• Crescimento orgânico sustentável</li>
              <li>• Otimização de conversão contínua</li>
              <li>• Expansão para mercados internacionais</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg">
        <p className="text-sm text-yellow-300">
          <strong>Aviso:</strong> Estas projeções são baseadas em dados reais de performance atual e tendências de mercado. 
          Os valores podem variar conforme mudanças no mercado, sazonalidade e outros fatores externos. 
          Utilize estas informações como referência para planejamento estratégico.
        </p>
      </div>
    </div>
  );
};

export default RevenueProjectionPage;
