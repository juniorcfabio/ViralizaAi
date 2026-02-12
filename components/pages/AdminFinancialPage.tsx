import React, { useMemo, useState, useEffect } from 'react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { useAuth } from '../../contexts/AuthContextFixed';
import { Transaction, TransactionStatus, User, AdminPayoutConfig } from '../../types';

// Icons
const DollarSignIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="12" x2="12" y1="2" y2="22" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);
const TrendingUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);
const TrendingDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
        <polyline points="17 18 23 18 23 12" />
    </svg>
);
const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
const CreditCardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
        <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
);
const BankIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M3 21h18M5 21v-7M19 21v-7M4 10h16v4H4zM12 2L2 7h20L12 2z" />
    </svg>
);

const planPrices: { [key: string]: number } = {
    Anual: 399.9,
    Semestral: 259.9,
    Trimestral: 159.9,
    Mensal: 59.9
};
const gateways: ('Stripe' | 'PayPal' | 'Mock')[] = ['Stripe', 'PayPal', 'Mock'];
const transactionStatuses: TransactionStatus[] = ['completed', 'failed', 'refunded', 'pending'];

const loadRealTransactions = (users: User[]): Transaction[] => {
    // Carregar transações reais do localStorage (salvas pelo sistema de pagamentos)
    try {
        const stored = localStorage.getItem('viraliza_real_transactions');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());
            }
        }
    } catch (e) {
        console.warn('Erro ao carregar transações reais:', e);
    }
    // Se não houver transações reais, retornar array vazio (dados reais = sem simulação)
    return [];
};

const FinancialStatCard: React.FC<{ title: string; value: string; icon: React.ElementType }> = ({
    title,
    value,
    icon: Icon
}) => (
    <div className="bg-secondary p-6 rounded-lg">
        <div className="flex items-center justify-between">
            <p className="text-sm text-gray-dark font-medium">{title}</p>
            <Icon className="w-6 h-6 text-gray-dark" />
        </div>
        <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
);

const PayoutConfigModal: React.FC<{
    onClose: () => void;
    onSave: (config: AdminPayoutConfig) => void;
    initialData: AdminPayoutConfig | null;
}> = ({ onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState<AdminPayoutConfig>(
        initialData || {
            holderName: '',
            document: '',
            bankName: '',
            accountType: 'Corrente',
            agency: '',
            accountNumber: '',
            pixKey: ''
        }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary p-8 rounded-lg shadow-xl w-full max-w-lg relative border border-gray-700">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-2xl text-gray-dark hover:text-light"
                >
                    &times;
                </button>
                <h2 className="text-2xl font-bold mb-6 text-center">Dados de Recebimento</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-dark mb-1">
                            Nome do Titular (Razão Social)
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.holderName}
                            onChange={(e) =>
                                setFormData({ ...formData, holderName: e.target.value })
                            }
                            className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">CNPJ / CPF</label>
                            <input
                                required
                                type="text"
                                value={formData.document}
                                onChange={(e) =>
                                    setFormData({ ...formData, document: e.target.value })
                                }
                                className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">Banco</label>
                            <input
                                required
                                type="text"
                                placeholder="Ex: Banco do Brasil"
                                value={formData.bankName}
                                onChange={(e) =>
                                    setFormData({ ...formData, bankName: e.target.value })
                                }
                                className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">Agência</label>
                            <input
                                required
                                type="text"
                                value={formData.agency}
                                onChange={(e) =>
                                    setFormData({ ...formData, agency: e.target.value })
                                }
                                className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm text-gray-dark mb-1">
                                Conta com Dígito
                            </label>
                            <input
                                required
                                type="text"
                                value={formData.accountNumber}
                                onChange={(e) =>
                                    setFormData({ ...formData, accountNumber: e.target.value })
                                }
                                className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-dark mb-1">
                            Chave PIX (Opcional)
                        </label>
                        <input
                            type="text"
                            placeholder="E-mail, CPF ou Chave Aleatória"
                            value={formData.pixKey}
                            onChange={(e) =>
                                setFormData({ ...formData, pixKey: e.target.value })
                            }
                            className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>

                    <div className="bg-primary p-3 rounded text-xs text-gray-400 mt-4">
                        * Os valores das assinaturas serão transferidos automaticamente para esta
                        conta todo dia 05.
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-accent text-light font-semibold py-3 mt-4 rounded-full hover:bg-blue-500 transition-colors"
                    >
                        Salvar Dados Bancários
                    </button>
                </form>
            </div>
        </div>
    );
};

const COLORS = ['#4F46E5', '#6366F1', '#818CF8', '#A5B4FC'];

const AdminFinancialPage: React.FC = () => {
    const { platformUsers } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<TransactionStatus | ''>('');
    const [payoutConfig, setPayoutConfig] = useState<AdminPayoutConfig | null>(null);
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [notification, setNotification] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('viraliza_admin_payout');
        if (stored) {
            try {
                setPayoutConfig(JSON.parse(stored));
            } catch (e) {
                console.error('Error loading payout config');
            }
        }
    }, []);

    const transactions = useMemo(
        () => loadRealTransactions(platformUsers),
        [platformUsers]
    );

    const paidTransactions = useMemo(
        () => transactions.filter((t) => t.status === 'completed'),
        [transactions]
    );

    const financialSummary = useMemo(() => {
        const activeUsers = platformUsers.filter(
            (u) => u.status === 'Ativo' && u.type === 'client'
        );
        const mrr = activeUsers.reduce(
            (total, user) => total + (planPrices[user.plan || 'Mensal'] || 0),
            0
        );
        const ltv = (mrr * 12) / 0.021; // Simplified LTV based on MRR and a mock 2.1% churn
        return {
            mrr,
            arr: mrr * 12,
            ltv,
            churnRate: 2.1
        };
    }, [platformUsers]);

    const granularForecast = useMemo(() => {
        if (paidTransactions.length === 0) {
            const base = financialSummary.mrr || 0;
            const daily = base / 30;
            const weekly = base / 4;
            const fortnight = base / 2;
            return {
                day: daily,
                week: weekly,
                fortnight,
                month: base,
                quarter: base * 3,
                semester: base * 6,
                year: base * 12
            };
        }

        const now = new Date();
        const windowDays = 90;
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - windowDays + 1);

        let totalInWindow = 0;

        paidTransactions.forEach((t) => {
            const d = new Date(t.date);
            if (d >= startDate && d <= now) {
                totalInWindow += t.amount;
            }
        });

        const effectiveDays = windowDays;
        const dailyAvg = effectiveDays > 0 ? totalInWindow / effectiveDays : 0;

        const monthAvg = dailyAvg * 30;
        return {
            day: dailyAvg,
            week: dailyAvg * 7,
            fortnight: dailyAvg * 15,
            month: monthAvg,
            quarter: monthAvg * 3,
            semester: monthAvg * 6,
            year: monthAvg * 12
        };
    }, [paidTransactions, financialSummary.mrr]);

    const forecastData = useMemo(() => {
        if (paidTransactions.length === 0) {
            const data: { name: string; 'Previsão (IA)'?: number }[] = [];
            let lastMonthRevenue = financialSummary.mrr;
            const growthRate = 1.05;
            const monthNames = [
                'Jan',
                'Fev',
                'Mar',
                'Abr',
                'Mai',
                'Jun',
                'Jul',
                'Ago',
                'Set',
                'Out',
                'Nov',
                'Dez'
            ];
            const currentMonth = new Date().getMonth();

            for (let i = 0; i < 6; i++) {
                const monthIndex = (currentMonth + i) % 12;
                lastMonthRevenue *= growthRate;
                data.push({
                    name: monthNames[monthIndex],
                    'Previsão (IA)': lastMonthRevenue
                });
            }
            return data;
        }

        const monthsBack = 6;
        const monthTotals: Record<string, number> = {};
        const now = new Date();

        for (let i = monthsBack - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setMonth(now.getMonth() - i);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            monthTotals[key] = 0;
        }

        paidTransactions.forEach((t) => {
            const d = new Date(t.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (key in monthTotals) {
                monthTotals[key] += t.amount;
            }
        });

        const existingMonths = Object.entries(monthTotals).filter(
            ([, total]) => total > 0
        );

        let growthRate = 1.03;
        if (existingMonths.length >= 2) {
            const first = existingMonths[0][1];
            const last = existingMonths[existingMonths.length - 1][1];
            if (first > 0 && last > 0) {
                const periods = existingMonths.length - 1;
                growthRate = Math.pow(last / first, 1 / periods);
            }
        }

        const monthNames = [
            'Jan',
            'Fev',
            'Mar',
            'Abr',
            'Mai',
            'Jun',
            'Jul',
            'Ago',
            'Set',
            'Out',
            'Nov',
            'Dez'
        ];
        const currentMonth = now.getMonth();
        let lastReal = existingMonths.length
            ? existingMonths[existingMonths.length - 1][1]
            : financialSummary.mrr || 0;

        const data: { name: string; 'Previsão (IA)'?: number }[] = [];

        for (let i = 1; i <= 6; i++) {
            const monthIndex = (currentMonth + i) % 12;
            lastReal *= growthRate;
            data.push({
                name: monthNames[monthIndex],
                'Previsão (IA)': lastReal
            });
        }

        return data;
    }, [paidTransactions, financialSummary.mrr]);

    const planDistributionData = useMemo(() => {
        const distribution = platformUsers
            .filter((u) => u.type === 'client' && u.plan)
            .reduce((acc, user) => {
                const plan = user.plan!;
                acc[plan] = (acc[plan] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

        return Object.entries(distribution).map(([name, value]) => ({ name, value }));
    }, [platformUsers]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter((t) => {
            const matchesSearch =
                searchTerm === '' ||
                t.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === '' || t.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [transactions, searchTerm, statusFilter]);

    const getStatusChip = (status: TransactionStatus) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500 bg-opacity-20 text-green-300';
            case 'failed':
                return 'bg-red-500 bg-opacity-20 text-red-300';
            case 'refunded':
                return 'bg-purple-500 bg-opacity-20 text-purple-300';
            case 'pending':
                return 'bg-yellow-500 bg-opacity-20 text-yellow-300';
        }
    };

    const handleSavePayout = (config: AdminPayoutConfig) => {
        setPayoutConfig(config);
        localStorage.setItem('viraliza_admin_payout', JSON.stringify(config));
        import('../../src/lib/supabase').then(({ supabase }) => {
            supabase.from('system_settings').upsert({ key: 'admin_payout_config', value: config, updated_at: new Date().toISOString() }).then(() => {});
        });
        setIsPayoutModalOpen(false);
        setNotification('Dados bancários atualizados com sucesso!');
        setTimeout(() => setNotification(''), 3000);
    };

    const formatCurrency = (value: number) =>
        `R$ ${value.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    return (
        <>
            <header className="mb-8">
                <h2 className="text-3xl font-bold">Hub Financeiro</h2>
                <p className="text-gray-dark">
                    Análise de métricas, previsões e transações.
                </p>
            </header>

            {notification && (
                <div className="bg-green-500 bg-opacity-20 text-green-300 p-3 rounded-lg mb-6 text-center">
                    {notification}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <FinancialStatCard
                    title="MRR"
                    value={`R$ ${(financialSummary.mrr / 1000).toFixed(1)}k`}
                    icon={DollarSignIcon}
                />
                <FinancialStatCard
                    title="LTV"
                    value={`R$ ${financialSummary.ltv.toFixed(2)}`}
                    icon={UsersIcon}
                />
                <FinancialStatCard
                    title="Taxa de Churn (IA)"
                    value={`${financialSummary.churnRate}%`}
                    icon={TrendingDownIcon}
                />
                <FinancialStatCard
                    title="ARR"
                    value={`R$ ${(financialSummary.arr / 1000).toFixed(1)}k`}
                    icon={TrendingUpIcon}
                />
            </div>

            <div className="bg-secondary p-6 rounded-lg border border-gray-800 mb-8">
                <h3 className="text-xl font-bold mb-2">
                    Previsão de Faturamento por Período (Modo Real)
                </h3>
                <p className="text-gray-dark text-sm mb-4">
                    Baseado no histórico real de transações pagas (últimos 90 dias). Ideal para
                    simular caixa e metas de curto, médio e longo prazo.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                    <div className="bg-primary p-3 rounded-lg border border-gray-700">
                        <p className="text-gray-400 text-xs uppercase">Dia</p>
                        <p className="font-bold text-light mt-1">
                            {formatCurrency(granularForecast.day)}
                        </p>
                    </div>
                    <div className="bg-primary p-3 rounded-lg border border-gray-700">
                        <p className="text-gray-400 text-xs uppercase">Semana (7 dias)</p>
                        <p className="font-bold text-light mt-1">
                            {formatCurrency(granularForecast.week)}
                        </p>
                    </div>
                    <div className="bg-primary p-3 rounded-lg border border-gray-700">
                        <p className="text-gray-400 text-xs uppercase">Quinzena</p>
                        <p className="font-bold text-light mt-1">
                            {formatCurrency(granularForecast.fortnight)}
                        </p>
                    </div>
                    <div className="bg-primary p-3 rounded-lg border border-gray-700">
                        <p className="text-gray-400 text-xs uppercase">Mês</p>
                        <p className="font-bold text-light mt-1">
                            {formatCurrency(granularForecast.month)}
                        </p>
                    </div>
                    <div className="bg-primary p-3 rounded-lg border border-gray-700">
                        <p className="text-gray-400 text-xs uppercase">Trimestre</p>
                        <p className="font-bold text-light mt-1">
                            {formatCurrency(granularForecast.quarter)}
                        </p>
                    </div>
                    <div className="bg-primary p-3 rounded-lg border border-gray-700">
                        <p className="text-gray-400 text-xs uppercase">Semestre</p>
                        <p className="font-bold text-light mt-1">
                            {formatCurrency(granularForecast.semester)}
                        </p>
                    </div>
                    <div className="bg-primary p-3 rounded-lg border border-gray-700">
                        <p className="text-gray-400 text-xs uppercase">Anual</p>
                        <p className="font-bold text-light mt-1">
                            {formatCurrency(granularForecast.year)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 bg-secondary p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">
                        Previsão de Receita (Próximos 6 meses - IA Histórico Real)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={forecastData}>
                            <defs>
                                <linearGradient
                                    id="colorRevenue"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#4F46E5"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#4F46E5"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#0B1747"
                            />
                            <XAxis dataKey="name" stroke="#94A3B8" />
                            <YAxis
                                stroke="#94A3B8"
                                tickFormatter={(value) =>
                                    `R$${(Number(value) / 1000).toFixed(0)}k`
                                }
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#02042B',
                                    border: '1px solid #0B1747'
                                }}
                                formatter={(value: number) =>
                                    `R$ ${value.toFixed(2)}`
                                }
                            />
                            <Area
                                type="monotone"
                                dataKey="Previsão (IA)"
                                stroke="#4F46E5"
                                fill="url(#colorRevenue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-secondary p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Distribuição de Planos</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={planDistributionData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                label
                            >
                                {planDistributionData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#02042B',
                                    border: '1px solid #0B1747'
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-secondary p-6 rounded-lg">
                <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
                    <h3 className="text-xl font-bold">Transações Recentes</h3>
                    <button
                        onClick={() => setIsPayoutModalOpen(true)}
                        className="bg-accent text-light font-semibold py-2 px-4 rounded-full hover:bg-blue-500 transition-colors text-sm flex items-center gap-2"
                    >
                        <BankIcon className="w-4 h-4" /> Configurar Recebimento
                    </button>
                </div>
                <div className="flex gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Buscar por nome ou ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-primary p-2 rounded border border-gray-600 w-full md:w-1/3"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value as TransactionStatus | '')
                        }
                        className="bg-primary p-2 rounded border border-gray-600"
                    >
                        <option value="">Todos Status</option>
                        {transactionStatuses.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-dark uppercase bg-primary">
                            <tr>
                                <th className="p-3">ID da Transação</th>
                                <th className="p-3">Usuário</th>
                                <th className="p-3">Plano</th>
                                <th className="p-3">Valor</th>
                                <th className="p-3">Data</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.slice(0, 10).map((t) => (
                                <tr key={t.id} className="border-t border-primary">
                                    <td className="p-3 font-mono text-xs">{t.id}</td>
                                    <td className="p-3 font-medium">{t.userName}</td>
                                    <td className="p-3">{t.plan}</td>
                                    <td className="p-3 font-semibold text-green-400">
                                        R$ {t.amount.toFixed(2)}
                                    </td>
                                    <td className="p-3">
                                        {new Date(t.date).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="p-3">
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${getStatusChip(
                                                t.status
                                            )}`}
                                        >
                                            {t.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isPayoutModalOpen && (
                <PayoutConfigModal
                    onClose={() => setIsPayoutModalOpen(false)}
                    onSave={handleSavePayout}
                    initialData={payoutConfig}
                />
            )}
        </>
    );
};

export default AdminFinancialPage;