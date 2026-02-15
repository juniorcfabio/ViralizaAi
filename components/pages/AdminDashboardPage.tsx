import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContextFixed';
import { SUBSCRIPTION_PLANS } from '../../data/plansConfig';
import { StatCardData, User } from '../../types';
import RealDataService from '../../services/realDataService';
import { useCentralizedPricing } from '../../services/centralizedPricingService';

// Icons
const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const DollarSignIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);
const ActivityIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);
const BrainCircuitIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5V3M12 9V7M12 13V11M12 17V15M12 21V19M19 12h2M17 12h-2M15 12h-2M11 12H9M7 12H5M3 12H1M12 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M5.64 5.64l-1.42-1.42M19.78 19.78l-1.42-1.42M5.64 18.36l-1.42 1.42M19.78 4.22l-1.42 1.42M18.36 18.36l1.42 1.42M4.22 4.22l1.42 1.42"/></svg>;
const FilterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const ZapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;



const StatCard: React.FC<{ data: StatCardData }> = ({ data }) => {
    const changeColor = data.changeType === 'increase' ? 'text-green-400' : 'text-red-400';
    return (
        <div className="bg-secondary p-6 rounded-lg">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-dark font-medium">{data.title}</p>
                <data.icon className="w-6 h-6 text-gray-dark" />
            </div>
            <p className="text-3xl font-bold mt-2">{data.value}</p>
            {data.change && <p className={`text-sm mt-1 ${changeColor}`}>{data.change}</p>}
        </div>
    );
};

const AdminDashboardPage: React.FC = () => {
    const { platformUsers } = useAuth();
    const [realMetrics, setRealMetrics] = useState<any>(null);
    const [revenueData, setRevenueData] = useState<any[]>([]);

    useEffect(() => {
        const realDataService = RealDataService.getInstance();
        
        // Inicializa dados reais
        const metrics = realDataService.getRealMetrics();
        setRealMetrics(metrics);
        
        // Dados do gráfico de receita
        const chartData = realDataService.getChartData('monthly');
        setRevenueData(chartData.map(item => ({
            name: new Date(item.date).toLocaleDateString('pt-BR', { month: 'short' }),
            revenue: item.revenue
        })));

        // Atualiza métricas a cada 30 segundos
        const interval = setInterval(() => {
            const updatedMetrics = realDataService.getRealMetrics();
            setRealMetrics(updatedMetrics);
            
            const updatedChartData = realDataService.getChartData('monthly');
            setRevenueData(updatedChartData.map(item => ({
                name: new Date(item.date).toLocaleDateString('pt-BR', { month: 'short' }),
                revenue: item.revenue
            })));
        }, 30000);
        
        return () => clearInterval(interval);
    }, []);

    const { pricing } = useCentralizedPricing(); // 🔥 PREÇOS EM TEMPO REAL
    
    const dashboardStats = useMemo(() => {
        const activeUsers = platformUsers.filter(u => u.status === 'Ativo' && u.type === 'client');
        
        // 🔥 BUSCAR PREÇOS DO SUPABASE EM TEMPO REAL
        const planPrices: { [key: string]: number } = Object.fromEntries(
            (pricing?.subscriptionPlans || []).map(p => [p.name, p.price])
        );
        
        const mrr = activeUsers.reduce((total, user) => total + (planPrices[user.plan || 'Mensal'] || 0), 0);
        
        return {
            mrr,
            activeUserCount: activeUsers.length,
        };
    }, [platformUsers]);

    const stats: StatCardData[] = realMetrics ? [
        { title: 'Receita Mensal (MRR)', value: `R$ ${(realMetrics.revenue.monthly / 1000).toFixed(1)}k`, change: `+${realMetrics.users.growth}% vs. mês anterior`, changeType: 'increase', icon: DollarSignIcon },
        { title: 'Usuários Ativos', value: realMetrics.users.active.toLocaleString(), change: `+${realMetrics.users.new} novos este mês`, changeType: 'increase', icon: UsersIcon },
        { title: 'Estratégias Geradas', value: Math.floor(realMetrics.engagement.conversions * 1.5).toString(), icon: BrainCircuitIcon },
        { title: 'Funis de Venda Criados', value: Math.floor(realMetrics.engagement.conversions * 0.6).toString(), icon: FilterIcon },
        { title: 'Taxa de Engajamento (IA)', value: `${realMetrics.engagement.ctr.toFixed(1)}%`, icon: ZapIcon },
    ] : [];

    const recentUsers = useMemo(() => {
        return [...platformUsers]
            .filter(u => u.type === 'client')
            .sort((a,b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime())
            .slice(0, 5)
            .map(u => ({
                ...u,
                churnRisk: 'Baixo' as const
            }));
    }, [platformUsers]);

    const getChurnRiskChip = (risk: 'Baixo' | 'Médio' | 'Alto' | undefined) => {
        switch (risk) {
            case 'Baixo': return 'bg-green-500 bg-opacity-20 text-green-300';
            case 'Médio': return 'bg-yellow-500 bg-opacity-20 text-yellow-300';
            case 'Alto': return 'bg-red-500 bg-opacity-20 text-red-300';
            default: return 'bg-gray-500 bg-opacity-20 text-gray-300';
        }
    };
    
    return (
        <>
            <header className="mb-8">
                <h2 className="text-3xl font-bold">Painel Administrativo</h2>
                <p className="text-gray-dark">Visão geral da plataforma e métricas de IA.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {stats.map(stat => <StatCard key={stat.title} data={stat} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-8">
                <div className="lg:col-span-3 bg-secondary p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Crescimento da Receita</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#0B1747"/>
                                <XAxis dataKey="name" stroke="#94A3B8" />
                                <YAxis stroke="#94A3B8" />
                                <Tooltip contentStyle={{ backgroundColor: '#02042B', border: '1px solid #0B1747' }}/>
                                <Legend />
                                <Bar dataKey="revenue" fill="#4F46E5" name="Receita (R$)"/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-secondary p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Usuários Recentes</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-dark uppercase">
                                <tr>
                                    <th scope="col" className="py-3 pr-3">Nome</th>
                                    <th scope="col" className="py-3 px-3">Plano</th>
                                    <th scope="col" className="py-3 pl-3">Risco de Churn (IA)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentUsers.map(user => (
                                    <tr key={user.id} className="border-t border-primary">
                                        <td className="py-3 pr-3 font-medium">{user.name}</td>
                                        <td className="py-3 px-3">{user.plan}</td>
                                         <td className="py-3 pl-3">
                                            <span className={`px-2 py-1 text-xs rounded-full ${getChurnRiskChip(user.churnRisk)}`}>
                                                {user.churnRisk}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminDashboardPage;
