import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PaymentMethod, Plan } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

// Base da API do backend NestJS
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Icons
const CreditCardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24"
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

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const PixIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M7.83 7.83 11 4h2l3.17 3.17" />
        <path d="m16.17 7.83 3.17 3.17-2.34 2.34-3.17-3.17" />
        <path d="m4 11 3.17 3.17-3.17 3.17-2.34-2.34" />
        <path d="m7.83 16.17 3.17 3.17h2l3.17-3.17-2.34-2.34-3.17 3.17-3.17-3.17Z" />
    </svg>
);

const PayPalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M16.5 7.5a1.5 1.5 0 0 1-1-2.6 3 3 0 0 0-4-3.3 2 2 0 0 0-2.3 1.2A2.5 2.5 0 0 0 5 6.5a1 1 0 0 0 0 2h14a1 1 0 0 0 0-2z" />
        <path d="m3.5 11.5 3 8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l3-8a1 1 0 0 0-1-1h-14a1 1 0 0 0-1 1z" />
    </svg>
);

const BitcoinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M11.7679 19.2321C14.2835 21.7477 18.2819 21.7477 20.7975 19.2321C23.3131 16.7165 23.3131 12.7181 20.7975 10.2025L13.7975 3.2025C11.2819 0.686906 7.28347 0.686906 4.76787 3.2025C2.25228 5.7181 2.25228 9.71653 4.76787 12.2321L11.7679 19.2321Z" />
        <path d="M15 5H9" />
        <path d="M12 2v20" />
    </svg>
);

const BankIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M3 21h18M5 21v-7M19 21v-7M4 10h16v4H4zM12 2L2 7h20L12 2z" />
    </svg>
);

const FileTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

const paymentOptions = [
    { name: 'Cartão', icon: CreditCardIcon },
    { name: 'Pix', icon: PixIcon },
    { name: 'Paypal', icon: PayPalIcon },
    { name: 'Crypto Moeda', icon: BitcoinIcon },
    { name: 'Boleto', icon: FileTextIcon },
    { name: 'Deposito em Conta', icon: BankIcon }
];

const AddPaymentMethodModal: React.FC<{
    onClose: () => void;
    onAdd: (method: PaymentMethod) => void;
}> = ({ onClose, onAdd }) => {
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [cardNumber, setCardNumber] = useState('');

    const handleSubmitCard = (e: React.FormEvent) => {
        e.preventDefault();
        if (cardNumber.length < 16) {
            alert('Número do cartão inválido.');
            return;
        }
        const newMethod: PaymentMethod = {
            id: `card_${Date.now()}`,
            type: 'Cartão de Crédito',
            last4: cardNumber.slice(-4),
            default: false
        };
        onAdd(newMethod);
        onClose();
    };

    const renderContent = () => {
        if (!selectedMethod) {
            return (
                <div className="grid grid-cols-2 gap-4">
                    {paymentOptions.map((opt) => (
                        <button
                            key={opt.name}
                            onClick={() => setSelectedMethod(opt.name)}
                            className="flex flex-col items-center justify-center p-4 bg-primary rounded-lg h-24 text-gray-dark hover:bg-gray-700 hover:text-light transition-colors"
                        >
                            <opt.icon className="w-8 h-8 mb-2" />
                            <span className="text-sm font-semibold">{opt.name}</span>
                        </button>
                    ))}
                </div>
            );
        }

        switch (selectedMethod) {
            case 'Cartão':
                return (
                    <form onSubmit={handleSubmitCard} className="space-y-4">
                        <div className="flex items-center space-x-2 text-sm">
                            <input
                                type="radio"
                                id="credito"
                                name="cardType"
                                value="credito"
                                defaultChecked
                                className="h-4 w-4 text-accent bg-primary border-gray-600 focus:ring-accent"
                            />
                            <label htmlFor="credito">Crédito</label>
                            <input
                                type="radio"
                                id="debito"
                                name="cardType"
                                value="debito"
                                className="h-4 w-4 text-accent bg-primary border-gray-600 focus:ring-accent"
                            />
                            <label htmlFor="debito">Débito</label>
                        </div>
                        <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) =>
                                setCardNumber(e.target.value.replace(/\D/g, ''))
                            }
                            maxLength={16}
                            placeholder="Número do Cartão"
                            required
                            className="w-full bg-primary p-2 rounded border border-gray-600"
                        />
                        <input
                            type="text"
                            placeholder="Nome no Cartão"
                            required
                            className="w-full bg-primary p-2 rounded border border-gray-600"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Validade (MM/AA)"
                                required
                                className="w-full bg-primary p-2 rounded border border-gray-600"
                            />
                            <input
                                type="text"
                                placeholder="CVC"
                                required
                                className="w-full bg-primary p-2 rounded border border-gray-600"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-accent text-light font-semibold py-3 mt-4 rounded-full hover:bg-blue-500"
                        >
                            Adicionar Cartão
                        </button>
                    </form>
                );
            case 'Pix':
                return (
                    <div className="text-center">
                        <p className="text-gray-dark mb-4">
                            Escaneie o QR Code ou copie a chave para pagar com Pix.
                        </p>
                        <div className="w-40 h-40 bg-gray-300 mx-auto mb-4 flex items-center justify-center text-black font-bold text-xs">
                            [QR Code Fictício]
                        </div>
                        <button className="w-full bg-primary text-gray-dark font-semibold py-2 rounded-full hover:bg-gray-700">
                            Copiar Chave Pix
                        </button>
                    </div>
                );
            case 'Paypal':
                return (
                    <div className="text-center">
                        <p className="text-gray-dark mb-4">
                            Você será redirecionado para o PayPal para concluir a conexão
                            de forma segura.
                        </p>
                        <button className="w-full bg-blue-600 text-light font-bold py-3 rounded-full hover:bg-blue-500">
                            Conectar com PayPal
                        </button>
                    </div>
                );
            case 'Crypto Moeda':
                return (
                    <div className="text-center">
                        <p className="text-gray-dark mb-2">
                            Envie o pagamento para o endereço abaixo (Rede ERC-20).
                        </p>
                        <div className="bg-primary p-2 rounded font-mono text-xs break-all mb-4">
                            0x123...AbC...789
                        </div>
                        <button className="w-full bg-primary text-gray-dark font-semibold py-2 rounded-full hover:bg-gray-700">
                            Copiar Endereço
                        </button>
                    </div>
                );
            default:
                return (
                    <p className="text-gray-dark text-center">
                        Instruções para {selectedMethod} apareceriam aqui.
                    </p>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary p-8 rounded-lg shadow-xl w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-2xl text-gray-dark hover:text-light"
                >
                    &times;
                </button>
                <h2 className="text-2xl font-bold mb-6 text-center">
                    {selectedMethod
                        ? `Adicionar ${selectedMethod}`
                        : 'Adicionar Método de Pagamento'}
                </h2>
                {selectedMethod && (
                    <button
                        onClick={() => setSelectedMethod(null)}
                        className="text-accent text-sm mb-4 hover:underline"
                    >
                        ← Voltar
                    </button>
                )}
                {renderContent()}
            </div>
        </div>
    );
};

const BillingPage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    if (!user) return null;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState('');
    const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null);
    const [buyingGrowthEngine, setBuyingGrowthEngine] = useState<string | null>(null);

    const availablePlans: Plan[] = [
        {
            name: t('plan.mensal'),
            price: '59.90',
            period: t('plan.period.month'),
            features: [
                'Crescimento Orgânico',
                'Gestão de Conteúdo',
                'Análises Básicas',
                t('plan.feature.conversion_tags')
            ]
        },
        {
            name: t('plan.trimestral'),
            price: '159.90',
            period: t('plan.period.quarter'),
            features: [
                'Tudo do Mensal',
                'Análises Avançadas',
                'IA Otimizada',
                t('plan.feature.retention_audio')
            ]
        },
        {
            name: t('plan.semestral'),
            price: '259.90',
            period: t('plan.period.semester'),
            features: [
                'Tudo do Trimestral',
                'Relatórios Estratégicos',
                'Acesso Beta',
                t('plan.feature.competitor_spy')
            ],
            highlight: true
        },
        {
            name: t('plan.anual'),
            price: '399.90',
            period: t('plan.period.year'),
            features: [
                'Tudo do Semestral',
                'Gerente Dedicado',
                'API de Integração',
                '2 Meses Grátis',
                t('plan.feature.future_trends')
            ]
        }
    ];

    const currentPlan = availablePlans.find((p) => p.name === user.plan);
    const paymentMethods = user.paymentMethods || [];
    const [billingHistory, setBillingHistory] = useState<
        { id: string; date: string; description: string; amount: string; status: 'Pago' | 'Pendente' }[]
    >(user.billingHistory || []);
    const hasGrowthEngine = (user.addOns || []).includes('growthEngine');

    const [growthEnginePlan, setGrowthEnginePlan] = useState<string | null>(() => {
        try {
            return localStorage.getItem(`growthEngine_plan_${user.id}`) || null;
        } catch {
            return null;
        }
    });

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 4000);
    };

    const ensurePaymentMethod = (): boolean => {
        if (paymentMethods.length === 0) {
            alert(
                'Por favor, adicione um método de pagamento antes de concluir uma compra.'
            );
            setIsModalOpen(true);
            return false;
        }
        return true;
    };

    const handleAddMethod = (method: PaymentMethod) => {
        const updatedMethods = [...paymentMethods, method];
        if (updatedMethods.length === 1) {
            updatedMethods[0].default = true;
        }
        updateUser(user.id, { paymentMethods: updatedMethods });
        showNotification('Método de pagamento adicionado!');
    };

    const handleRemoveMethod = (id: string) => {
        if (
            !window.confirm('Tem certeza que deseja remover este método de pagamento?')
        )
            return;
        const updatedMethods = paymentMethods.filter((m) => m.id !== id);
        updateUser(user.id, { paymentMethods: updatedMethods });
        showNotification('Método de pagamento removido.');
    };

    const handleSetDefault = (id: string) => {
        const updatedMethods = paymentMethods.map((m) => ({
            ...m,
            default: m.id === id
        }));
        updateUser(user.id, { paymentMethods: updatedMethods });
        showNotification('Método padrão atualizado.');
    };

    const buildAppBaseUrl = () => {
        const origin = window.location.origin;
        const path = window.location.pathname;
        const hasViralizaPath = path.includes('/ViralizaAi');
        return hasViralizaPath ? `${origin}/ViralizaAi` : origin;
    };

    // Confirma pagamento quando volta do checkout com ?txId=... (em HashRouter)
    useEffect(() => {
        // Exemplo de URL:
        // http://localhost:5174/ViralizaAi/#/dashboard/billing?txId=123
        // Aqui o ?txId está dentro do hash.
        const { hash } = window.location;
        const queryIndex = hash.indexOf('?');
        if (queryIndex === -1) return;

        const queryString = hash.substring(queryIndex + 1); // "txId=..."
        const params = new URLSearchParams(queryString);
        const txId = params.get('txId');

        if (!txId) return;

        const confirmPayment = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/payments/confirm`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ txId })
                });

                if (!res.ok) {
                    console.error('Erro ao confirmar pagamento:', res.status);
                    showNotification(
                        'Pagamento recebido, mas não foi possível confirmar automaticamente. Se o plano não atualizar, contate o suporte.'
                    );
                    return;
                }

                const tx = await res.json();

                if (tx.status === 'paid') {
                    if (tx.itemType === 'plan') {
                        updateUser(user.id, { plan: tx.itemId });
                        showNotification(
                            `Pagamento confirmado! Seu plano "${tx.itemId}" foi ativado.`
                        );
                    }

                    if (tx.itemType === 'addon' && typeof tx.itemId === 'string') {
                        const isGrowthEngine =
                            tx.itemId.toLowerCase().includes('motor de crescimento');

                        if (isGrowthEngine) {
                            const addOns = Array.from(
                                new Set([...(user.addOns || []), 'growthEngine'])
                            );
                            updateUser(user.id, { addOns });

                            const label = tx.itemId.replace(
                                /^Motor de Crescimento\s*-\s*/i,
                                ''
                            );
                            try {
                                localStorage.setItem(
                                    `growthEngine_plan_${user.id}`,
                                    label
                                );
                            } catch {
                            }
                            setGrowthEnginePlan(label);
                            showNotification(
                                `Pagamento confirmado! ${tx.itemId} foi ativado para sua conta.`
                            );
                        }
                    }
                }
            } catch (err) {
                console.error(err);
                showNotification(
                    'Ocorreu um erro ao confirmar o pagamento. Se o problema persistir, contate o suporte.'
                );
            } finally {
                // Remove ?txId do hash para não repetir confirmação
                const baseHash = hash.substring(0, queryIndex); // "#/dashboard/billing"
                window.location.hash = baseHash;
            }
        };

        confirmPayment();
    }, [user, updateUser]);

    // Carrega histórico real de faturamento a partir do backend
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/payments/list`);
                if (!res.ok) return;

                const txs = await res.json();
                const userTxs = (Array.isArray(txs) ? txs : []).filter(
                    (tx: any) => tx.userId === user.id
                );

                const mapped = userTxs.map((tx: any) => ({
                    id: tx.id,
                    date: tx.createdAt,
                    description: tx.itemId,
                    amount: `R$ ${tx.amount}`,
                    status: tx.status === 'paid' ? 'Pago' : 'Pendente'
                }));

                setBillingHistory(mapped);
            } catch (err) {
                console.error('Erro ao carregar histórico de faturamento:', err);
            }
        };

        loadHistory();
    }, [user.id]);

    const handleSubscribe = async (plan: Plan) => {
        if (!ensurePaymentMethod()) return;

        setSubscribingPlan(plan.name);

        try {
            const amount = parseFloat(plan.price.replace(',', '.'));
            const appBaseUrl = buildAppBaseUrl();

            const response = await fetch(`${API_BASE_URL}/payments/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.id,
                    itemType: 'plan',
                    itemId: plan.name,
                    amount,
                    currency: 'BRL',
                    provider: 'stripe',
                    successUrl: `${appBaseUrl}/#/dashboard/billing`,
                    cancelUrl: `${appBaseUrl}/#/dashboard/billing`
                })
            });

            if (!response.ok) {
                throw new Error(`Erro ao iniciar checkout: ${response.status}`);
            }

            const data = await response.json();

            if (data.checkoutUrl) {
                showNotification('Redirecionando para o pagamento seguro...');
                window.location.href = data.checkoutUrl;
                return;
            } else {
                throw new Error('Resposta sem checkoutUrl');
            }
        } catch (error) {
            console.error(error);
            showNotification(
                `Houve um erro ao iniciar o pagamento da assinatura. Tente novamente.`
            );
        } finally {
            setSubscribingPlan(null);
        }
    };

    const handlePlansScroll = () => {
        document
            .getElementById('plans-section')
            ?.scrollIntoView({ behavior: 'smooth' });
    };

    const handlePurchaseGrowthEngine = async (
        label: string,
        price: number
    ): Promise<void> => {
        if (!ensurePaymentMethod()) return;

        setBuyingGrowthEngine(label);

        try {
            const appBaseUrl = buildAppBaseUrl();

            const response = await fetch(`${API_BASE_URL}/payments/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.id,
                    itemType: 'addon',
                    itemId: `Motor de Crescimento - ${label}`,
                    amount: price,
                    currency: 'BRL',
                    provider: 'stripe',
                    successUrl: `${appBaseUrl}/#/dashboard/billing`,
                    cancelUrl: `${appBaseUrl}/#/dashboard/billing`
                })
            });

            if (!response.ok) {
                throw new Error(`Erro ao iniciar checkout: ${response.status}`);
            }

            const data = await response.json();

            if (data.checkoutUrl) {
                showNotification(
                    'Redirecionando para o pagamento do Motor de Crescimento...'
                );
                window.location.href = data.checkoutUrl;
                return;
            } else {
                throw new Error('Resposta sem checkoutUrl');
            }
        } catch (error) {
            console.error(error);
            showNotification(
                'Não foi possível iniciar o pagamento do Motor de Crescimento. Tente novamente.'
            );
        } finally {
            setBuyingGrowthEngine(null);
        }
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
                                    R$ {currentPlan.price}
                                    {currentPlan.period}
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
                                <PlusIcon className="w-4 h-4" /> Adicionar
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
                                        <CreditCardIcon className="w-8 h-8 text-accent" />
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
                                                onClick={() =>
                                                    handleSetDefault(method.id)
                                                }
                                                className="text-accent hover:underline text-xs"
                                            >
                                                Padrão
                                            </button>
                                        )}
                                        <button
                                            onClick={() =>
                                                handleRemoveMethod(method.id)
                                            }
                                            className="text-red-500 hover:text-red-400"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-secondary p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">
                        Histórico de Faturamento
                    </h3>
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
                                        <td
                                            colSpan={4}
                                            className="text-center p-8 text-gray-dark"
                                        >
                                            Nenhum histórico de faturamento.
                                        </td>
                                    </tr>
                                )}
                                {billingHistory.map((record) => (
                                    <tr
                                        key={record.id}
                                        className="border-b border-primary hover:bg-primary"
                                    >
                                        <td className="p-4">
                                            {new Date(
                                                record.date
                                            ).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="p-4">
                                            {record.description}
                                        </td>
                                        <td className="p-4 font-semibold">
                                            {record.amount}
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${getStatusChip(
                                                    record.status
                                                )}`}
                                            >
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

            <div className="mt-12">
                <h2 className="text-2xl font-bold text-center mb-2">
                    Ferramentas Avulsas
                </h2>
                <p className="text-center text-gray-dark mb-6">
                    Ative módulos extras para turbinar ainda mais seus resultados.
                </p>

                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Quinzenal (15 dias)', price: 49.9 },
                        { label: 'Mensal', price: 79.9 },
                        { label: 'Anual', price: 199.9 }
                    ].map((opt) => {
                        const isCurrent =
                            hasGrowthEngine && growthEnginePlan === opt.label;
                        return (
                            <div
                                key={opt.label}
                                className="bg-secondary p-6 rounded-lg border border-gray-700 flex flex-col"
                            >
                                <h3 className="text-lg font-bold mb-1">
                                    Motor de Crescimento Viraliza
                                </h3>
                                <p className="text-xs text-gray-dark mb-3">
                                    Período: {opt.label}
                                </p>
                                <p className="text-2xl font-bold mb-2">
                                    R$ {opt.price.toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-dark mb-4 flex-1">
                                    Acesso completo ao motor de crescimento para gerar
                                    estratégias, ideias virais e roteiros avançados de
                                    conteúdo para suas redes sociais, sites e lojas.
                                </p>
                                {isCurrent && (
                                    <span className="inline-block mb-2 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">
                                        Ativo para esta conta ({opt.label})
                                    </span>
                                )}
                                <button
                                    disabled={
                                        buyingGrowthEngine === opt.label || isCurrent
                                    }
                                    onClick={() =>
                                        handlePurchaseGrowthEngine(
                                            opt.label,
                                            opt.price
                                        )
                                    }
                                    className="w-full py-2 rounded-full font-semibold transition-colors bg-accent text-light hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed mt-2"
                                >
                                    {buyingGrowthEngine === opt.label
                                        ? 'Processando...'
                                        : isCurrent
                                        ? 'Ativo'
                                        : 'Ativar Motor de Crescimento'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div id="plans-section" className="mt-12">
    <h2 className="text-2xl font-bold text-center mb-8">
        Nossos Planos
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {availablePlans.map((plan) => (
            <div
                key={plan.name}
                className={`bg-secondary p-6 rounded-lg border flex flex-col transition-transform hover:-translate-y-2 ${
                    plan.highlight
                        ? 'border-accent shadow-lg shadow-accent/20'
                        : 'border-gray-700'
                }`}
            >
                {plan.highlight && (
                    <div className="bg-accent text-xs text-white px-2 py-1 rounded-full self-start mb-2 font-bold animate-pulse-badge">
                        Recomendado
                    </div>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-3xl font-bold mt-2">
                    R$ {plan.price}
                    <span className="text-base font-normal text-gray-dark">
                        {plan.period}
                    </span>
                </p>
                <ul className="mt-4 mb-6 space-y-2 text-sm text-gray-dark flex-grow">
                    {(Array.isArray(plan.features)
                        ? plan.features
                        : (plan.features as any).split(',')).map(
                        (feat: string, i: number) => (
                            <li key={i} className="flex items-start">
                                {[
                                    t('plan.feature.conversion_tags'),
                                    t('plan.feature.retention_audio'),
                                    t('plan.feature.competitor_spy'),
                                    t('plan.feature.future_trends')
                                ].includes(feat) ? (
                                    <span className="text-yellow-400 mr-2 mt-1">
                                        ★
                                    </span>
                                ) : (
                                    <span className="text-accent mr-2 mt-1">
                                        ✓
                                    </span>
                                )}
                                <span
                                    className={
                                        [
                                            t('plan.feature.conversion_tags'),
                                            t('plan.feature.retention_audio'),
                                            t('plan.feature.competitor_spy'),
                                            t('plan.feature.future_trends')
                                        ].includes(feat)
                                            ? 'text-light font-semibold'
                                            : ''
                                    }
                                >
                                    {feat}
                                </span>
                            </li>
                        )
                    )}
                </ul>
                <button
                    onClick={() => handleSubscribe(plan)}
                    className="w-full py-2 rounded-full font-semibold transition-colors bg-accent text-light hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed"
                    disabled={
                        currentPlan?.name === plan.name || !!subscribingPlan
                    }
                >
                    {subscribingPlan === plan.name
                        ? 'Processando...'
                        : currentPlan?.name === plan.name
                        ? 'Plano Atual'
                        : 'Assine Agora'}
                </button>
            </div>
        ))}
    </div>
</div>

            {isModalOpen && (
                <AddPaymentMethodModal
                    onClose={() => setIsModalOpen(false)}
                    onAdd={handleAddMethod}
                />
            )}
        </>
    );
};

export default BillingPage;