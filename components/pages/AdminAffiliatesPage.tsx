import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { User } from '../../types';
import AffiliatePaymentService from '../../services/affiliatePaymentService';
import WithdrawalManagement from '../ui/WithdrawalManagement';

// Icons
const GiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
const DollarSignIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const PercentIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>;

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; }> = ({ title, value, icon: Icon }) => (
    <div className="bg-secondary p-6 rounded-lg">
        <div className="flex items-center justify-between">
            <p className="text-sm text-gray-dark font-medium">{title}</p>
            <Icon className="w-6 h-6 text-gray-dark" />
        </div>
        <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
);

const AdminAffiliatesPage: React.FC = () => {
    const { platformUsers, user, updateUser } = useAuth();
    const [commissionRate, setCommissionRate] = useState(20);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'affiliates' | 'withdrawals'>('affiliates');
    const [notification, setNotification] = useState('');
    const [affiliateCommission, setAffiliateCommission] = useState(20);

    const paymentService = AffiliatePaymentService.getInstance();

    useEffect(() => {
        // Carregar taxa de comissão atual
        const currentRate = paymentService.getCommissionPercentage();
        setCommissionRate(currentRate);

        // Escutar mudanças na comissão
        const handleCommissionUpdate = (event: CustomEvent) => {
            setCommissionRate(event.detail.percentage);
        };

        window.addEventListener('commissionUpdated', handleCommissionUpdate as EventListener);
        
        return () => {
            window.removeEventListener('commissionUpdated', handleCommissionUpdate as EventListener);
        };
    }, []);

    const affiliates = platformUsers.filter(user => 
        user.affiliateInfo && 
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredAffiliates = useMemo(() => {
        return affiliates.filter(aff =>
            aff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            aff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            aff.affiliateInfo?.referralCode.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [affiliates, searchTerm]);

    const totalPendingEarnings = useMemo(() => {
        return affiliates.reduce((total, aff) => total + (aff.affiliateInfo?.earnings || 0), 0);
    }, [affiliates]);

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    const handleRegisterPayout = (affiliateId: string) => {
        const affiliate = affiliates.find(a => a.id === affiliateId);
        if (affiliate && affiliate.affiliateInfo) {
            if (window.confirm(`Registrar pagamento de R$ ${affiliate.affiliateInfo.earnings.toFixed(2)} para ${affiliate.name}? Isso irá zerar os ganhos pendentes.`)) {
                updateUser(affiliateId, {
                    affiliateInfo: {
                        ...affiliate.affiliateInfo,
                        earnings: 0,
                    }
                });
                showNotification(`Pagamento para ${affiliate.name} registrado com sucesso.`);
            }
        }
    };
    
    const handleSaveCommission = () => {
        localStorage.setItem('viraliza_affiliate_commission_rate', String(affiliateCommission));
        showNotification('Percentual de comissão de afiliados salvo com sucesso!');
    };

    const handleCommissionUpdate = () => {
        if (!user?.id) {
            alert('❌ Erro: Usuário não identificado');
            return;
        }

        if (commissionRate < 1 || commissionRate > 50) {
            alert('❌ Taxa de comissão deve estar entre 1% e 50%');
            return;
        }

        // Salvar nova taxa de comissão
        paymentService.setCommissionPercentage(commissionRate, user.id);
        alert(`✅ Taxa de comissão atualizada para ${commissionRate}%\n\n📢 Todas as referências de comissão no sistema foram atualizadas automaticamente!`);
    };

    return (
        <>
            <header className="mb-8">
                <h2 className="text-3xl font-bold">Gerenciamento de Afiliados</h2>
                <p className="text-gray-dark">Monitore o desempenho e gerencie pagamentos dos afiliados.</p>
            </header>

            {notification && (
                <div className="bg-green-500 bg-opacity-20 text-green-300 p-3 rounded-lg mb-6 text-center transition-opacity duration-300">
                    {notification}
                </div>
            )}

            {/* Abas de Navegação */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('affiliates')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                        activeTab === 'affiliates'
                            ? 'bg-accent text-white'
                            : 'bg-secondary text-gray-300 hover:bg-accent/20'
                    }`}
                >
                    👥 Afiliados
                </button>
                <button
                    onClick={() => setActiveTab('withdrawals')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                        activeTab === 'withdrawals'
                            ? 'bg-accent text-white'
                            : 'bg-secondary text-gray-300 hover:bg-accent/20'
                    }`}
                >
                    💸 Gerenciar Saques
                </button>
            </div>

            {activeTab === 'affiliates' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatCard title="Total de Afiliados" value={String(affiliates.length)} icon={UsersIcon} />
                        <StatCard title="Total Ganhos Pendentes" value={`R$ ${totalPendingEarnings.toFixed(2)}`} icon={DollarSignIcon} />
                        <StatCard title="Comissão Atual" value={`${affiliateCommission}%`} icon={PercentIcon} />
                    </div>
                    
                    <div className="bg-secondary p-6 rounded-lg mb-8">
                        <h3 className="text-xl font-bold mb-4">⚙️ Configuração de Comissão</h3>
                        <div className="flex items-center justify-between bg-primary p-4 rounded-lg">
                            <p className="text-gray-dark">Defina o percentual de comissão global para novos ganhos de afiliados.</p>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    min="1"
                                    max="50"
                                    value={affiliateCommission}
                                    onChange={(e) => setAffiliateCommission(Number(e.target.value))}
                                    className="w-24 bg-secondary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent text-center text-white"
                                />
                                <span className="text-lg font-bold">%</span>
                                <button 
                                    onClick={handleSaveCommission} 
                                    className="bg-accent text-light font-semibold py-2 px-4 rounded-full hover:bg-blue-500 transition-colors"
                                >
                                    💾 Salvar
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-secondary p-6 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">👥 Lista de Afiliados</h3>
                            <input
                                type="text"
                                placeholder="Buscar por afiliado ou código..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent w-full md:w-1/3 text-white"
                            />
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-dark uppercase bg-primary">
                                    <tr>
                                        <th className="p-3">Afiliado</th>
                                        <th className="p-3">Código de Referência</th>
                                        <th className="p-3">Indicados</th>
                                        <th className="p-3">Ganhos Pendentes (R$)</th>
                                        <th className="p-3">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAffiliates.length === 0 ? (
                                         <tr>
                                            <td colSpan={5} className="text-center p-8 text-gray-dark">
                                                <div className="flex flex-col items-center">
                                                    <GiftIcon className="w-12 h-12 text-gray-600 mb-2"/>
                                                    Nenhum afiliado encontrado.
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAffiliates.map(aff => (
                                            <tr key={aff.id} className="border-t border-primary">
                                                <td className="p-3">
                                                    <div className="font-medium text-white">{aff.name}</div>
                                                    <div className="text-xs text-gray-dark">{aff.email}</div>
                                                </td>
                                                <td className="p-3 font-mono text-accent">{aff.affiliateInfo?.referralCode}</td>
                                                <td className="p-3 text-center text-white">{aff.affiliateInfo?.referredUserIds.length || 0}</td>
                                                <td className="p-3 font-semibold text-green-400">R$ {aff.affiliateInfo?.earnings.toFixed(2)}</td>
                                                <td className="p-3">
                                                    <button 
                                                        onClick={() => handleRegisterPayout(aff.id)} 
                                                        disabled={(aff.affiliateInfo?.earnings || 0) === 0}
                                                        className="bg-accent text-light font-semibold py-1 px-3 rounded-full hover:bg-blue-500 transition-colors text-xs disabled:bg-gray-600 disabled:cursor-not-allowed"
                                                    >
                                                        💰 Registrar Pagamento
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <WithdrawalManagement adminId={user?.id || 'admin'} />
            )}
        </>
    );
};

export default AdminAffiliatesPage;