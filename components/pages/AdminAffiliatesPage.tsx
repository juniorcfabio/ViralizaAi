import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';

// Icons
const GiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
const DollarSignIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const PercentIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle></svg>;
const BankIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v12"/><path d="M15 11v10"/></svg>;
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const ZapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;

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
    const { platformUsers, updateUser, deleteUsers } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState('');
    const [affiliateCommission, setAffiliateCommission] = useState<number>(20);
    const [selectedAffiliate, setSelectedAffiliate] = useState<User | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const storedRate = localStorage.getItem('viraliza_affiliate_commission_rate');
        if (storedRate) {
            setAffiliateCommission(Number(storedRate));
        }
    }, []);

    const affiliates = useMemo(() => {
        return platformUsers.filter(u => u.affiliateInfo);
    }, [platformUsers]);

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

    const handleViewDetails = (affiliate: User) => {
        setSelectedAffiliate(affiliate);
        setShowDetailsModal(true);
    };

    const handleDeleteAffiliate = (affiliateId: string) => {
        const affiliate = affiliates.find(a => a.id === affiliateId);
        if (affiliate) {
            if (window.confirm(`Tem certeza que deseja excluir o afiliado ${affiliate.name}? Esta ação não pode ser desfeita.`)) {
                deleteUsers([affiliateId]);
                showNotification(`Afiliado ${affiliate.name} excluído com sucesso.`);
            }
        }
    };

    const handleAutomaticPayment = async (affiliateId: string) => {
        const affiliate = affiliates.find(a => a.id === affiliateId);
        if (!affiliate || !affiliate.affiliateInfo) return;

        // Verificar se há configuração bancária do admin
        const adminBankConfig = localStorage.getItem('viraliza_admin_bank_config');
        if (!adminBankConfig) {
            showNotification('❌ Configure sua conta bancária primeiro em "Configuração Bancária"');
            return;
        }

        const bankConfig = JSON.parse(adminBankConfig);
        if (!bankConfig.isConfigured) {
            showNotification('❌ Finalize a configuração bancária antes de fazer pagamentos');
            return;
        }

        // Verificar se o afiliado tem dados bancários
        if (!affiliate.bankAccount?.bank && !affiliate.bankAccount?.pixKey) {
            showNotification('❌ Afiliado não possui dados bancários cadastrados');
            return;
        }

        const amount = affiliate.affiliateInfo.earnings;
        if (amount <= 0) {
            showNotification('❌ Não há valor a pagar para este afiliado');
            return;
        }

        // Modal de confirmação com validação
        const confirmed = window.confirm(
            `🏦 PAGAMENTO AUTOMÁTICO\n\n` +
            `Afiliado: ${affiliate.name}\n` +
            `Valor: R$ ${amount.toFixed(2)}\n` +
            `Destino: ${affiliate.bankAccount.pixKey ? 'PIX' : 'Transferência bancária'}\n\n` +
            `Confirma o pagamento automático?`
        );

        if (!confirmed) return;

        try {
            setIsSaving(true);
            showNotification('🔄 Processando pagamento automático...');

            // Simular processo de pagamento
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Simular validação bancária
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Simular transferência
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Registrar o pagamento (zerar ganhos)
            updateUser(affiliateId, {
                affiliateInfo: {
                    ...affiliate.affiliateInfo,
                    earnings: 0,
                }
            });

            showNotification(`✅ Pagamento de R$ ${amount.toFixed(2)} realizado com sucesso para ${affiliate.name}!`);

        } catch (error) {
            console.error('Erro no pagamento automático:', error);
            showNotification('❌ Erro no pagamento automático. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total de Afiliados" value={String(affiliates.length)} icon={UsersIcon} />
                <StatCard title="Total Ganhos Pendentes" value={`R$ ${totalPendingEarnings.toFixed(2)}`} icon={DollarSignIcon} />
                <StatCard title="Comissão Atual" value={`${affiliateCommission}%`} icon={PercentIcon} />
            </div>
            
            <div className="bg-secondary p-6 rounded-lg mb-8">
                <h3 className="text-xl font-bold mb-4">Ferramentas Administrativas</h3>
                <div className="flex items-center justify-between bg-primary p-4 rounded-lg">
                    <p className="text-gray-dark">Defina o percentual de comissão global para novos ganhos de afiliados.</p>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            value={affiliateCommission}
                            onChange={(e) => setAffiliateCommission(Number(e.target.value))}
                            className="w-24 bg-secondary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent text-center"
                        />
                        <span className="text-lg font-bold">%</span>
                        <button onClick={handleSaveCommission} className="bg-accent text-light font-semibold py-2 px-4 rounded-full hover:bg-blue-500 transition-colors">Salvar</button>
                    </div>
                </div>
            </div>

            <div className="bg-secondary p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <input
                        type="text"
                        placeholder="Buscar por afiliado ou código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent w-full md:w-1/3"
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
                                <th className="p-3">Dados Bancários</th>
                                <th className="p-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAffiliates.length === 0 ? (
                                 <tr>
                                    <td colSpan={6} className="text-center p-8 text-gray-dark">
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
                                            <div className="font-medium">{aff.name}</div>
                                            <div className="text-xs text-gray-dark">{aff.email}</div>
                                        </td>
                                        <td className="p-3 font-mono text-accent">{aff.affiliateInfo?.referralCode}</td>
                                        <td className="p-3 text-center">{aff.affiliateInfo?.referredUserIds.length || 0}</td>
                                        <td className="p-3 font-semibold text-green-400">{aff.affiliateInfo?.earnings.toFixed(2)}</td>
                                        <td className="p-3">
                                            {aff.bankAccount?.bank || aff.bankAccount?.pixKey ? (
                                                <div className="flex items-center gap-1">
                                                    <BankIcon className="w-4 h-4 text-green-400" />
                                                    <span className="text-xs text-green-400">Cadastrado</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <BankIcon className="w-4 h-4 text-gray-500" />
                                                    <span className="text-xs text-gray-500">Não cadastrado</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-1">
                                                <button 
                                                    onClick={() => handleViewDetails(aff)}
                                                    className="bg-blue-500 text-light p-1 rounded hover:bg-blue-400 transition-colors"
                                                    title="Ver detalhes"
                                                >
                                                    <EyeIcon className="w-3 h-3" />
                                                </button>
                                                <button 
                                                    onClick={() => handleAutomaticPayment(aff.id)} 
                                                    disabled={(aff.affiliateInfo?.earnings || 0) === 0 || isSaving}
                                                    className="bg-yellow-500 text-light p-1 rounded hover:bg-yellow-400 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                                                    title="Pagamento automático"
                                                >
                                                    <ZapIcon className="w-3 h-3" />
                                                </button>
                                                <button 
                                                    onClick={() => handleRegisterPayout(aff.id)} 
                                                    disabled={(aff.affiliateInfo?.earnings || 0) === 0}
                                                    className="bg-green-500 text-light p-1 rounded hover:bg-green-400 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                                                    title="Registrar pagamento manual"
                                                >
                                                    <DollarSignIcon className="w-3 h-3" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteAffiliate(aff.id)}
                                                    className="bg-red-500 text-light p-1 rounded hover:bg-red-400 transition-colors"
                                                    title="Excluir afiliado"
                                                >
                                                    <TrashIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalhes do Afiliado */}
            {showDetailsModal && selectedAffiliate && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-secondary p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Detalhes do Afiliado</h3>
                            <button 
                                onClick={() => setShowDetailsModal(false)}
                                className="text-gray-400 hover:text-light text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Informações Pessoais */}
                            <div className="bg-primary p-4 rounded-lg">
                                <h4 className="font-bold mb-3 flex items-center gap-2">
                                    <UsersIcon className="w-4 h-4" />
                                    Informações Pessoais
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-400">Nome:</span>
                                        <p className="text-light">{selectedAffiliate.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">E-mail:</span>
                                        <p className="text-light">{selectedAffiliate.email}</p>
                                    </div>
                                    {selectedAffiliate.cpf && (
                                        <div>
                                            <span className="text-gray-400">CPF:</span>
                                            <p className="text-light">{selectedAffiliate.cpf}</p>
                                        </div>
                                    )}
                                    {selectedAffiliate.cnpj && (
                                        <div>
                                            <span className="text-gray-400">CNPJ:</span>
                                            <p className="text-light">{selectedAffiliate.cnpj}</p>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-gray-400">Data de Cadastro:</span>
                                        <p className="text-light">{new Date(selectedAffiliate.joinedDate).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Dados de Afiliado */}
                            <div className="bg-primary p-4 rounded-lg">
                                <h4 className="font-bold mb-3 flex items-center gap-2">
                                    <GiftIcon className="w-4 h-4" />
                                    Dados de Afiliado
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-400">Código de Referência:</span>
                                        <p className="text-accent font-mono">{selectedAffiliate.affiliateInfo?.referralCode}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Usuários Indicados:</span>
                                        <p className="text-light">{selectedAffiliate.affiliateInfo?.referredUserIds.length || 0}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Ganhos Pendentes:</span>
                                        <p className="text-green-400 font-semibold">R$ {selectedAffiliate.affiliateInfo?.earnings.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Dados Bancários */}
                            <div className="bg-primary p-4 rounded-lg md:col-span-2">
                                <h4 className="font-bold mb-3 flex items-center gap-2">
                                    <BankIcon className="w-4 h-4" />
                                    Dados Bancários
                                </h4>
                                {selectedAffiliate.bankAccount?.bank || selectedAffiliate.bankAccount?.pixKey ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        {selectedAffiliate.bankAccount.bank && (
                                            <div>
                                                <span className="text-gray-400">Banco:</span>
                                                <p className="text-light">{selectedAffiliate.bankAccount.bank}</p>
                                            </div>
                                        )}
                                        {selectedAffiliate.bankAccount.agency && (
                                            <div>
                                                <span className="text-gray-400">Agência:</span>
                                                <p className="text-light">{selectedAffiliate.bankAccount.agency}</p>
                                            </div>
                                        )}
                                        {selectedAffiliate.bankAccount.account && (
                                            <div>
                                                <span className="text-gray-400">Conta ({selectedAffiliate.bankAccount.accountType}):</span>
                                                <p className="text-light">{selectedAffiliate.bankAccount.account}</p>
                                            </div>
                                        )}
                                        {selectedAffiliate.bankAccount.pixKey && (
                                            <div>
                                                <span className="text-gray-400">Chave PIX ({selectedAffiliate.bankAccount.pixKeyType}):</span>
                                                <p className="text-light">{selectedAffiliate.bankAccount.pixKey}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <BankIcon className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                                        <p className="text-gray-400">Nenhum dado bancário cadastrado</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="bg-gray-500 text-light px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                Fechar
                            </button>
                            {(selectedAffiliate.affiliateInfo?.earnings || 0) > 0 && (
                                <button
                                    onClick={() => {
                                        handleRegisterPayout(selectedAffiliate.id);
                                        setShowDetailsModal(false);
                                    }}
                                    className="bg-green-500 text-light px-4 py-2 rounded-lg hover:bg-green-400 transition-colors"
                                >
                                    Registrar Pagamento de R$ {selectedAffiliate.affiliateInfo?.earnings.toFixed(2)}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminAffiliatesPage;