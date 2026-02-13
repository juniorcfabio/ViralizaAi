import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { SUBSCRIPTION_PLANS } from '../../data/plansConfig';
import PixPaymentModalFixed from '../ui/PixPaymentModalFixed';
import { supabase } from '../../src/lib/supabase';

interface Plan {
    id: string;
    name: string;
    price: number | string;
    period: string;
    features: string[];
}

interface PaymentMethod {
    id: string;
    type: string;
    last4: string;
    default: boolean;
}

interface BillingRecord {
    id: string;
    date: string;
    description: string;
    amount: string;
    status: 'Pago' | 'Pendente';
}

const BillingPage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null);
    const [buyingGrowthEngine, setBuyingGrowthEngine] = useState<string | null>(null);
    const [growthEnginePlan, setGrowthEnginePlan] = useState<string | null>(null);
    const [pixModalOpen, setPixModalOpen] = useState(false);
    const [pixSelectedPlan, setPixSelectedPlan] = useState<Plan | null>(null);
    const [pixGrowthEngineOpen, setPixGrowthEngineOpen] = useState(false);
    const [pixGrowthEngineData, setPixGrowthEngineData] = useState<{label: string, price: number} | null>(null);

    // Supabase Edge Function URL
    const SUPABASE_URL = 'https://ymmswnmietxoupeazmok.supabase.co';
    const EDGE_FN_URL = `${SUPABASE_URL}/functions/v1/create-checkout-session`;

    // Usar planos dinâmicos do plansConfig.ts
    const plans: Plan[] = SUBSCRIPTION_PLANS.map(plan => ({
        id: plan.id || plan.name.toLowerCase(),
        name: plan.name,
        price: plan.price,
        period: plan.period || (plan.name.toLowerCase().includes('mensal') ? '/mês' : 
                               plan.name.toLowerCase().includes('trimestral') ? '/trimestre' :
                               plan.name.toLowerCase().includes('semestral') ? '/semestre' : '/ano'),
        features: Array.isArray(plan.features) ? plan.features : [plan.features]
    }));

    const growthEnginePricing = {
        quinzenal: 49.90,
        mensal: 89.90,
        anual: 799.90
    };

    const currentPlan = plans.find(p => p.id === user?.plan);
    const hasGrowthEngine = user?.addOns?.includes('growthEngine');

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 5000);
    };

    const ensurePaymentMethod = () => {
        return true; // Simplificado para o teste
    };

    const buildAppBaseUrl = () => {
        const origin = window.location.origin;
        const path = window.location.pathname;
        const hasViralizaPath = path.includes('/ViralizaAi');
        return hasViralizaPath ? `${origin}/ViralizaAi` : origin;
    };

    const handleSubscribe = async (plan: Plan) => {
        if (!ensurePaymentMethod()) return;

        setSubscribingPlan(plan.name);

        try {
            // Mapear nome do plano para slug
            const planSlug = plan.id || plan.name.toLowerCase()
                .replace('mensal', 'mensal')
                .replace('trimestral', 'trimestral')
                .replace('semestral', 'semestral')
                .replace('anual', 'anual');

            const appBaseUrl = buildAppBaseUrl();

            // Obter JWT do Supabase para autenticação
            const { data: sessionData } = await supabase.auth.getSession();
            const jwt = sessionData?.session?.access_token;

            if (!jwt) {
                showNotification('Erro: Sessão não encontrada. Faça login novamente.');
                return;
            }

            console.log('💳 Criando checkout via Supabase Edge Function:', planSlug);
            showNotification('Redirecionando para o pagamento seguro...');
            
            const response = await fetch(EDGE_FN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                    plan_slug: planSlug,
                    payment_method_types: ['card'],
                    success_url: `${appBaseUrl}/#/dashboard?checkout=success&plan=${encodeURIComponent(planSlug)}`,
                    cancel_url: `${appBaseUrl}/#/dashboard/billing?checkout=cancel`,
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Erro: ${response.status}`);
            }
            
            if (result.success && result.url) {
                console.log('🔄 Redirecionando para Stripe Checkout:', result.url);
                window.location.href = result.url;
            } else {
                throw new Error(result.error || 'URL de checkout não retornada');
            }

        } catch (error) {
            console.error('Erro no pagamento:', error);
            showNotification('Houve um erro ao iniciar o pagamento. Tente novamente.');
        } finally {
            setSubscribingPlan(null);
        }
    };

    const handlePlansScroll = () => {
        document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleAddMethod = (method: PaymentMethod) => {
        setPaymentMethods([...paymentMethods, method]);
        setIsModalOpen(false);
        showNotification('Método de pagamento adicionado com sucesso!');
    };

    const handleRemoveMethod = (id: string) => {
        setPaymentMethods(paymentMethods.filter(m => m.id !== id));
        showNotification('Método de pagamento removido!');
    };

    const handleSetDefault = (id: string) => {
        setPaymentMethods(paymentMethods.map(m => ({ ...m, default: m.id === id })));
        showNotification('Método padrão atualizado!');
    };

    const handlePurchaseGrowthEngine = async (label: string, price: number) => {
        setBuyingGrowthEngine(label);
        try {
            console.log('🚀 BillingPage - Processando compra Motor de Crescimento:', label, price);
            
            const appBaseUrl = buildAppBaseUrl();

            // Obter JWT
            const { data: sessionData } = await supabase.auth.getSession();
            const jwt = sessionData?.session?.access_token;

            if (!jwt) {
                showNotification('Erro: Sessão não encontrada. Faça login novamente.');
                return;
            }

            showNotification('Redirecionando para pagamento...');
            
            // Usar Edge Function com plano especial growth-engine
            const response = await fetch(EDGE_FN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                    plan_slug: 'growth-engine',
                    payment_method_types: ['card'],
                    success_url: `${appBaseUrl}/#/dashboard/growth-engine?checkout=success&addon=${encodeURIComponent(label)}`,
                    cancel_url: `${appBaseUrl}/#/dashboard/billing?checkout=cancel`,
                })
            });

            const result = await response.json();
            
            if (result.success && result.url) {
                console.log('🔄 Redirecionando para Stripe:', result.url);
                window.location.href = result.url;
            } else {
                throw new Error(result.error || 'Erro desconhecido');
            }

        } catch (error) {
            console.error('❌ Erro ao processar compra Motor de Crescimento:', error);
            showNotification('Erro ao processar compra. Tente novamente.');
        } finally {
            setBuyingGrowthEngine(null);
        }
    };

    const handlePixPayment = (plan: Plan) => {
        setPixSelectedPlan(plan);
        setPixModalOpen(true);
    };

    const handlePixGrowthEngine = (label: string, price: number) => {
        setPixGrowthEngineData({label, price});
        setPixGrowthEngineOpen(true);
    };

    const getStatusChip = (status: 'Pago' | 'Pendente') => {
        switch (status) {
            case 'Pago':
                return 'bg-green-500/20 text-green-300';
            case 'Pendente':
                return 'bg-yellow-500/20 text-yellow-300';
        }
    };

    return (
        <>
            <header className="mb-8">
                <h2 className="text-3xl font-bold">Faturamento & Assinatura</h2>
                <p className="text-gray-dark">
                    Gerencie seu plano, métodos de pagamento e ferramentas avulsas.
                </p>
            </header>

            {notification && (
                <div className="bg-green-500 bg-opacity-20 text-green-300 p-3 rounded-lg mb-6 text-center">
                    {notification}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-secondary p-6 rounded-lg">
                        <h3 className="text-xl font-bold mb-4">Seu Plano Atual</h3>
                        {currentPlan ? (
                            <>
                                <p className="text-2xl font-bold text-accent">
                                    {currentPlan.name}
                                </p>
                                <p className="text-lg text-gray-dark">
                                    R$ {currentPlan.price}{currentPlan.period}
                                </p>
                                <div className="mt-6 flex space-x-2">
                                    <button
                                        onClick={handlePlansScroll}
                                        className="flex-1 bg-accent text-light font-semibold py-2 px-4 rounded-full hover:bg-blue-500"
                                    >
                                        Alterar Plano
                                    </button>
                                    <button className="flex-1 bg-primary text-gray-dark font-semibold py-2 px-4 rounded-full hover:bg-red-600/20 hover:text-red-400">
                                        Cancelar
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-dark mb-4">
                                    Você não possui um plano ativo.
                                </p>
                                <button
                                    onClick={handlePlansScroll}
                                    className="w-full bg-accent text-light font-semibold py-2 px-4 rounded-full hover:bg-blue-500"
                                >
                                    Assine Agora
                                </button>
                            </>
                        )}
                    </div>

                    <div className="bg-secondary p-6 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Métodos de Pagamento</h3>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-accent text-light font-semibold py-2 px-4 rounded-full hover:bg-blue-500 text-sm flex items-center gap-2"
                            >
                                + Adicionar
                            </button>
                        </div>
                        <div className="space-y-3">
                            {paymentMethods.length === 0 && (
                                <p className="text-center text-gray-dark p-4">
                                    Nenhum método de pagamento.
                                </p>
                            )}
                            {paymentMethods.map((method) => (
                                <div
                                    key={method.id}
                                    className="bg-primary p-4 rounded-lg flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 bg-accent rounded flex items-center justify-center text-xs">💳</div>
                                        <div>
                                            <p className="font-semibold">
                                                {method.type} ...{method.last4}
                                            </p>
                                            {method.default && (
                                                <span className="text-xs text-green-400">
                                                    Padrão
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!method.default && (
                                            <button
                                                onClick={() => handleSetDefault(method.id)}
                                                className="text-accent hover:underline text-xs"
                                            >
                                                Padrão
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleRemoveMethod(method.id)}
                                            className="text-red-500 hover:text-red-400"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-secondary p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Histórico de Faturamento</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-primary">
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Descrição</th>
                                    <th className="p-4">Valor</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {billingHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center p-8 text-gray-dark">
                                            Nenhum histórico de faturamento.
                                        </td>
                                    </tr>
                                )}
                                {billingHistory.map((record) => (
                                    <tr key={record.id} className="border-b border-primary hover:bg-primary">
                                        <td className="p-4">
                                            {new Date(record.date).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="p-4">{record.description}</td>
                                        <td className="p-4 font-semibold">{record.amount}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusChip(record.status)}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div id="plans-section" className="mt-12">
                <h2 className="text-2xl font-bold text-center mb-2">Planos de Assinatura</h2>
                <p className="text-center text-gray-dark mb-6">
                    Escolha o plano ideal para suas necessidades.
                </p>

                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className="bg-secondary p-6 rounded-lg border border-gray-700 flex flex-col">
                            <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                            <p className="text-2xl font-bold mb-2">R$ {plan.price}</p>
                            <p className="text-xs text-gray-dark mb-4">{plan.period}</p>
                            <ul className="text-xs text-gray-dark mb-4 flex-1 space-y-1">
                                {plan.features.map((feature, index) => (
                                    <li key={index}>• {feature}</li>
                                ))}
                            </ul>
                            <div className="space-y-2">
                                <button
                                    disabled={subscribingPlan === plan.name}
                                    onClick={() => handleSubscribe(plan)}
                                    className="w-full py-2 rounded-full font-semibold transition-colors bg-accent text-light hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed"
                                >
                                    {subscribingPlan === plan.name ? 'Processando...' : '💳 Cartão/Boleto'}
                                </button>
                                <button
                                    onClick={() => handlePixPayment(plan)}
                                    className="w-full py-2 rounded-full font-semibold transition-colors bg-green-600 text-white hover:bg-green-700"
                                >
                                    ⚡ PIX
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-12">
                <h2 className="text-2xl font-bold text-center mb-2">Ferramentas Avulsas</h2>
                <p className="text-center text-gray-dark mb-6">
                    Ative módulos extras para turbinar ainda mais seus resultados.
                </p>

                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Quinzenal (15 dias)', price: growthEnginePricing.quinzenal },
                        { label: 'Mensal', price: growthEnginePricing.mensal },
                        { label: 'Anual', price: growthEnginePricing.anual }
                    ].map((opt) => {
                        const isCurrent = hasGrowthEngine && growthEnginePlan === opt.label;
                        return (
                            <div key={opt.label} className="bg-secondary p-6 rounded-lg border border-gray-700 flex flex-col">
                                <h3 className="text-lg font-bold mb-1">Motor de Crescimento Viraliza</h3>
                                <p className="text-xs text-gray-dark mb-3">Período: {opt.label}</p>
                                <p className="text-2xl font-bold mb-2">R$ {opt.price.toFixed(2)}</p>
                                <p className="text-xs text-gray-dark mb-4 flex-1">
                                    Acesso completo ao motor de crescimento para gerar estratégias, 
                                    ideias virais e roteiros avançados de conteúdo para suas redes sociais, sites e lojas.
                                </p>
                                {isCurrent && (
                                    <span className="inline-block mb-2 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">
                                        Ativo para esta conta ({opt.label})
                                    </span>
                                )}
                                <div className="space-y-2 mt-2">
                                    <button
                                        disabled={buyingGrowthEngine === opt.label || isCurrent}
                                        onClick={() => handlePurchaseGrowthEngine(opt.label, opt.price)}
                                        className="w-full py-2 rounded-full font-semibold transition-colors bg-accent text-light hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed"
                                    >
                                        {buyingGrowthEngine === opt.label
                                            ? 'Processando...'
                                            : isCurrent
                                            ? 'Ativo'
                                            : '💳 Cartão/Boleto'}
                                    </button>
                                    {!isCurrent && (
                                        <button
                                            onClick={() => handlePixGrowthEngine(opt.label, opt.price)}
                                            className="w-full py-2 rounded-full font-semibold transition-colors bg-green-600 text-white hover:bg-green-700"
                                        >
                                            ⚡ PIX
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal PIX para Planos */}
            {pixModalOpen && pixSelectedPlan && (
                <PixPaymentModalFixed
                    isOpen={pixModalOpen}
                    onClose={() => setPixModalOpen(false)}
                    amount={typeof pixSelectedPlan.price === 'number' ? pixSelectedPlan.price : parseFloat(String(pixSelectedPlan.price))}
                    planName={`Assinatura ${pixSelectedPlan.name} - ViralizaAI`}
                    onPaymentSuccess={undefined}
                />
            )}

            {/* Modal PIX para Ferramentas Avulsas */}
            {pixGrowthEngineOpen && pixGrowthEngineData && (
                <PixPaymentModalFixed
                    isOpen={pixGrowthEngineOpen}
                    onClose={() => setPixGrowthEngineOpen(false)}
                    amount={pixGrowthEngineData.price}
                    planName={`Motor de Crescimento Viraliza - ${pixGrowthEngineData.label}`}
                    onPaymentSuccess={undefined}
                />
            )}
        </>
    );
};

export default BillingPage;
