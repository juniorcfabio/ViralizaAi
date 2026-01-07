import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { StatCardData, User } from '../../types';

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

const AdminDashboardPageReal: React.FC = () => {
    const { platformUsers } = useAuth();
    const [realData, setRealData] = useState<any>(null);

    // Função para calcular dados reais do localStorage e contexto
    const calculateRealMetrics = () => {
        try {
            // Usuários reais
            const activeUsers = platformUsers.filter(u => u.status === 'Ativo' && u.type === 'client');
            const totalUsers = platformUsers.filter(u => u.type === 'client');
            
            // Preços dos planos reais
            const planPrices: { [key: string]: number } = { 
                'Anual': 399.90, 
                'Semestral': 259.90, 
                'Trimestral': 159.90, 
                'Mensal': 59.90 
            };
            
            // Receita real baseada nos usuários ativos
            const mrr = activeUsers.reduce((total, user) => {
                const planPrice = planPrices[user.plan || 'Mensal'] || 0;
                return total + planPrice;
            }, 0);

            // Afiliados reais
            const affiliates = platformUsers.filter(u => u.type === 'affiliate');
            const activeAffiliates = affiliates.filter(a => a.status === 'Ativo');

            // Transações reais do localStorage
            let totalTransactions = 0;
            let totalRevenue = 0;
            let totalCommissions = 0;

            try {
                // Verificar transações de todos os usuários
                platformUsers.forEach(user => {
                    const userTransactions = localStorage.getItem(`transactions_${user.id}`);
                    if (userTransactions) {
                        const transactions = JSON.parse(userTransactions);
                        if (Array.isArray(transactions)) {
                            totalTransactions += transactions.length;
                            transactions.forEach((t: any) => {
                                if (t.status === 'completed' && t.amount) {
                                    totalRevenue += parseFloat(t.amount) || 0;
                                }
                            });
                        }
                    }

                    // Verificar comissões de afiliados
                    const userCommissions = localStorage.getItem(`commissions_${user.id}`);
                    if (userCommissions) {
                        const commissions = JSON.parse(userCommissions);
                        if (Array.isArray(commissions)) {
                            commissions.forEach((c: any) => {
                                if (c.status === 'paid' && c.amount) {
                                    totalCommissions += parseFloat(c.amount) || 0;
                                }
                            });
                        }
                    }
                });
            } catch (error) {
                console.log('Erro ao calcular transações:', error);
            }

            // Estratégias e funis reais (baseado em dados reais de uso)
            let strategiesGenerated = 0;
            let funnelsCreated = 0;

            try {
                // Contar estratégias e funis reais do localStorage
                platformUsers.forEach(user => {
                    const userStrategies = localStorage.getItem(`strategies_${user.id}`);
                    if (userStrategies) {
                        const strategies = JSON.parse(userStrategies);
                        if (Array.isArray(strategies)) {
                            strategiesGenerated += strategies.length;
                        }
                    }

                    const userFunnels = localStorage.getItem(`funnels_${user.id}`);
                    if (userFunnels) {
                        const funnels = JSON.parse(userFunnels);
                        if (Array.isArray(funnels)) {
                            funnelsCreated += funnels.length;
                        }
                    }
                });
            } catch (error) {
                console.log('Erro ao calcular estratégias/funis:', error);
            }

            return {
                users: {
                    total: totalUsers.length,
                    active: activeUsers.length,
                    new: 0, // Seria necessário implementar tracking de novos usuários
                    growth: 0
                },
                revenue: {
                    monthly: mrr,
                    total: totalRevenue,
                    transactions: totalTransactions
                },
                affiliates: {
                    total: affiliates.length,
                    active: activeAffiliates.length,
                    commissions: totalCommissions
                },
                engagement: {
                    strategies: strategiesGenerated,
                    funnels: funnelsCreated,
                    ctr: totalTransactions > 0 ? ((totalTransactions / Math.max(totalUsers.length, 1)) * 100) : 0
                }
            };
        } catch (error) {
            console.error('Erro ao calcular métricas reais:', error);
            return {
                users: { total: 0, active: 0, new: 0, growth: 0 },
                revenue: { monthly: 0, total: 0, transactions: 0 },
                affiliates: { total: 0, active: 0, commissions: 0 },
                engagement: { strategies: 0, funnels: 0, ctr: 0 }
            };
        }
    };

    useEffect(() => {
        const metrics = calculateRealMetrics();
        setRealData(metrics);

        // Atualizar dados a cada 30 segundos
        const interval = setInterval(() => {
            const updatedMetrics = calculateRealMetrics();
            setRealData(updatedMetrics);
        }, 30000);

        return () => clearInterval(interval);
    }, [platformUsers]);

    // Dados do gráfico baseados em dados reais - ZERADO até haver vendas reais
    const revenueData = useMemo(() => {
        if (!realData) return [];
        
        // Gerar dados dos últimos 12 meses - TODOS ZERADOS até haver vendas reais
        const months = [];
        const currentDate = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
            
            // DADOS REAIS: Se não há receita real, gráfico fica zerado
            // Só mostra valores quando houver vendas reais registradas
            const revenue = realData.revenue.monthly > 0 ? realData.revenue.monthly : 0;
            
            months.push({
                name: monthName,
                revenue: i === 0 ? revenue : 0 // Só o mês atual mostra receita real se houver
            });
        }
        
        return months;
    }, [realData]);

    const stats: StatCardData[] = realData ? [
        { 
            title: 'Receita Mensal (MRR)', 
            value: `R$ ${(realData.revenue.monthly / 1000).toFixed(1)}k`, 
            change: realData.revenue.monthly > 0 ? `${realData.revenue.transactions} transações` : 'Nenhuma venda ainda', 
            changeType: 'increase', 
            icon: DollarSignIcon 
        },
        { 
            title: 'Usuários Ativos', 
            value: realData.users.active.toString(), 
            change: `${realData.users.total} usuários totais`, 
            changeType: 'increase', 
            icon: UsersIcon 
        },
        { 
            title: 'Estratégias Geradas', 
            value: realData.engagement.strategies.toString(), 
            icon: BrainCircuitIcon 
        },
        { 
            title: 'Funis de Venda Criados', 
            value: realData.engagement.funnels.toString(), 
            icon: FilterIcon 
        },
        { 
            title: 'Taxa de Engajamento (IA)', 
            value: `${realData.engagement.ctr.toFixed(1)}%`, 
            icon: ZapIcon 
        },
    ] : [];

    const recentUsers = useMemo(() => {
        return [...platformUsers]
            .filter(u => u.type === 'client')
            .sort((a,b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime())
            .slice(0, 5)
            .map(u => ({
                ...u,
                churnRisk: 'Baixo' as const // Sem simulação de risco
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
                <p className="text-gray-dark">Visão geral da plataforma e métricas reais (sem simulação).</p>
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
                    {recentUsers.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400">Nenhum usuário cadastrado ainda</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-dark uppercase">
                                    <tr>
                                        <th scope="col" className="py-3 pr-3">Nome</th>
                                        <th scope="col" className="py-3 px-3">Plano</th>
                                        <th scope="col" className="py-3 pl-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentUsers.map(user => (
                                        <tr key={user.id} className="border-t border-primary">
                                            <td className="py-3 pr-3 font-medium">{user.name}</td>
                                            <td className="py-3 px-3">{user.plan || 'Não definido'}</td>
                                            <td className="py-3 pl-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${getChurnRiskChip('Baixo')}`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminDashboardPageReal;
