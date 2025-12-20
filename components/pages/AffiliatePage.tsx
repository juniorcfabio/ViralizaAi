import React, { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import FeatureLockedOverlay from '../ui/FeatureLockedOverlay';

import { API_BASE_URL, getAuthHeaders } from '../../src/config/api';

// Icons
const GiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
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
    <path d="M3 21h18" />
    <path d="M5 21V7l8-4v18" />
    <path d="M19 21V11l-6-4" />
    <path d="M9 9v12" />
    <path d="M15 11v10" />
  </svg>
);

const BankAccountSection: React.FC<{ user: any }> = ({ user }) => {
  const { updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [bankData, setBankData] = useState({
    bank: user?.bankAccount?.bank || '',
    agency: user?.bankAccount?.agency || '',
    account: user?.bankAccount?.account || '',
    accountType: user?.bankAccount?.accountType || 'corrente',
    pixKey: user?.bankAccount?.pixKey || '',
    pixKeyType: user?.bankAccount?.pixKeyType || 'cpf'
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validar se pelo menos um campo obrigatório está preenchido
      if (!bankData.bank && !bankData.pixKey) {
        alert('Preencha pelo menos o banco ou a chave PIX.');
        return;
      }

      // Salvar no contexto (que já faz a persistência no banco local)
      await updateUser(user.id, { bankAccount: bankData });
      
      setIsEditing(false);
      alert('✅ Dados bancários salvos com sucesso!');
      console.log('✅ [BANK] Conta bancária salva com sucesso!');
    } catch (error) {
      console.error('❌ [BANK] Erro ao salvar conta bancária:', error);
      alert('❌ Erro ao salvar dados bancários. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasBankData = user?.bankAccount?.bank || user?.bankAccount?.pixKey;

  return (
    <div className="bg-secondary p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BankIcon className="w-5 h-5 text-green-400" />
          <h3 className="text-xl font-bold">Dados Bancários</h3>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-accent text-light px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors text-sm"
          >
            {hasBankData ? 'Editar' : 'Cadastrar'}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-500 text-light px-4 py-2 rounded-lg hover:bg-green-400 transition-colors text-sm disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setBankData({
                  bank: user?.bankAccount?.bank || '',
                  agency: user?.bankAccount?.agency || '',
                  account: user?.bankAccount?.account || '',
                  accountType: user?.bankAccount?.accountType || 'corrente',
                  pixKey: user?.bankAccount?.pixKey || '',
                  pixKeyType: user?.bankAccount?.pixKeyType || 'cpf'
                });
              }}
              className="bg-gray-500 text-light px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors text-sm"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-3">
          {hasBankData ? (
            <>
              {bankData.bank && (
                <div>
                  <span className="text-gray-400 text-sm">Banco:</span>
                  <p className="text-light">{bankData.bank}</p>
                </div>
              )}
              {bankData.agency && (
                <div>
                  <span className="text-gray-400 text-sm">Agência:</span>
                  <p className="text-light">{bankData.agency}</p>
                </div>
              )}
              {bankData.account && (
                <div>
                  <span className="text-gray-400 text-sm">Conta ({bankData.accountType}):</span>
                  <p className="text-light">{bankData.account}</p>
                </div>
              )}
              {bankData.pixKey && (
                <div>
                  <span className="text-gray-400 text-sm">Chave PIX ({bankData.pixKeyType}):</span>
                  <p className="text-light">{bankData.pixKey}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <BankIcon className="w-12 h-12 mx-auto text-gray-500 mb-3" />
              <p className="text-gray-400">Nenhum dado bancário cadastrado</p>
              <p className="text-gray-500 text-sm mt-1">
                Cadastre seus dados para receber os pagamentos das comissões
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Banco</label>
            <input
              type="text"
              value={bankData.bank}
              onChange={(e) => setBankData({ ...bankData, bank: e.target.value })}
              placeholder="Ex: Banco do Brasil, Itaú, Nubank..."
              className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Agência</label>
            <input
              type="text"
              value={bankData.agency}
              onChange={(e) => setBankData({ ...bankData, agency: e.target.value })}
              placeholder="0000"
              className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Conta</label>
            <input
              type="text"
              value={bankData.account}
              onChange={(e) => setBankData({ ...bankData, account: e.target.value })}
              placeholder="00000-0"
              className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Tipo de Conta</label>
            <select
              value={bankData.accountType}
              onChange={(e) => setBankData({ ...bankData, accountType: e.target.value })}
              className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="corrente">Conta Corrente</option>
              <option value="poupanca">Poupança</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Chave PIX</label>
            <input
              type="text"
              value={bankData.pixKey}
              onChange={(e) => setBankData({ ...bankData, pixKey: e.target.value })}
              placeholder="Sua chave PIX"
              className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Tipo da Chave PIX</label>
            <select
              value={bankData.pixKeyType}
              onChange={(e) => setBankData({ ...bankData, pixKeyType: e.target.value })}
              className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="telefone">Telefone</option>
              <option value="aleatoria">Chave Aleatória</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

const AffiliatePage: React.FC = () => {
  const { user, activateAffiliate, platformUsers, hasAccess } = useAuth();
  const [linkCopied, setLinkCopied] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totals, setTotals] = useState<{ pending: number; paid: number } | null>(null);
  const [referredUserIds, setReferredUserIds] = useState<string[]>([]);
  const [referredUsersFromApi, setReferredUsersFromApi] = useState<any[]>([]);

  // Permitir acesso ao programa de afiliados mesmo sem plano ativo
  // if (!hasAccess('affiliate')) {
  //   return (
  //     <div className="relative h-full">
  //       <header className="mb-8">
  //         <h2 className="text-3xl font-bold">Programa de Afiliados</h2>
  //         <p className="text-gray-dark">
  //           Ganhe comissões indicando novos clientes para a Viraliza.ai.
  //         </p>
  //       </header>
  //       <FeatureLockedOverlay
  //         featureName="Programa de Afiliados"
  //         requiredPlan="Plano Semestral"
  //       />
  //     </div>
  //   );
  // }

  const isAffiliate = useMemo(() => !!user?.affiliateInfo, [user]);

  const referralLink = useMemo(() => {
    if (isAffiliate && user?.affiliateInfo) {
      // Ensures link points to the root path with correct hash params
      const origin = window.location.origin;
      const pathname = window.location.pathname === '/' ? '' : window.location.pathname;
      return `${origin}${pathname}/#/?ref=${user.affiliateInfo.referralCode}`;
    }
    return '';
  }, [isAffiliate, user]);

  const referredUsers = useMemo(() => {
    if (!isAffiliate) return [];
    if (Array.isArray(referredUsersFromApi) && referredUsersFromApi.length > 0) {
      return referredUsersFromApi;
    }
    // fallback para versão antiga (quando backend ainda não retornava detalhes)
    if (referredUserIds.length === 0) return [];
    return platformUsers.filter((u) => referredUserIds.includes(u.id));
  }, [isAffiliate, referredUsersFromApi, referredUserIds, platformUsers]);

  const joinWithAnd = (items: string[]) => {
    const cleaned = items
      .map((x) => (typeof x === 'string' ? x.trim() : ''))
      .filter(Boolean);
    if (cleaned.length <= 1) return cleaned.join('');
    return `${cleaned.slice(0, -1).join(', ')} e ${cleaned[cleaned.length - 1]}`;
  };

  useEffect(() => {
    if (!isAffiliate || !user?.affiliateInfo?.referralCode) {
      setReferredUserIds([]);
      return;
    }

    const fetchReferredUsers = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/affiliates/me/referred-users?affiliateCode=${encodeURIComponent(
            user.affiliateInfo!.referralCode
          )}`,
          {
            headers: {
              ...getAuthHeaders(),
            },
          }
        );

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        const ids = Array.isArray(data?.referredUserIds) ? data.referredUserIds : [];
        const detailed = Array.isArray(data?.referredUsers) ? data.referredUsers : [];

        setReferredUserIds(ids);
        setReferredUsersFromApi(detailed);
      } catch (err) {
        // console.error('Erro ao carregar usuários indicados:', err);
        setReferredUserIds([]);
        setReferredUsersFromApi([]);
      }
    };

    fetchReferredUsers();
  }, [isAffiliate, user?.affiliateInfo?.referralCode]);

  useEffect(() => {
    if (!isAffiliate || !user?.affiliateInfo?.referralCode) {
      setChartData([]);
      setTotals(null);
      return;
    }

    const fetchCommissions = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `${API_BASE_URL}/affiliates/me/commissions?affiliateCode=${encodeURIComponent(
            user.affiliateInfo!.referralCode
          )}`,
          {
            headers: {
              ...getAuthHeaders(),
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Erro ao carregar comissões: ${res.status}`);
        }

        const data = await res.json();
        const commissions = Array.isArray(data.commissions) ? data.commissions : [];
        const totalsFromApi = data.totals || { pending: 0, paid: 0 };
        setTotals({
          pending: Number(totalsFromApi.pending || 0),
          paid: Number(totalsFromApi.paid || 0),
        });

        // Agrupar com base na data da comissão
        const byMonth: Record<
          string,
          { totalReferrals: number; convertedReferrals: number; monthlyEarnings: number }
        > = {};

        commissions.forEach((c: any) => {
          const createdAt = new Date(c.createdAt || c.updatedAt || new Date());
          const monthKey = `${createdAt.getFullYear()}-${String(
            createdAt.getMonth() + 1
          ).padStart(2, '0')}`;

          if (!byMonth[monthKey]) {
            byMonth[monthKey] = {
              totalReferrals: 0,
              convertedReferrals: 0,
              monthlyEarnings: 0,
            };
          }

          byMonth[monthKey].totalReferrals += 1;
          byMonth[monthKey].convertedReferrals += 1;

          const amount =
            typeof c.amount === 'string' ? parseFloat(c.amount) : Number(c.amount || 0);
          if (!Number.isNaN(amount)) {
            byMonth[monthKey].monthlyEarnings += amount;
          }
        });

        const sortedMonths = Object.keys(byMonth).sort();
        let cumulative = 0;
        const formatted = sortedMonths.map((monthKey) => {
          const monthData = byMonth[monthKey];
          cumulative += monthData.monthlyEarnings;
          const [year, month] = monthKey.split('-');
          const monthName = new Date(Number(year), Number(month) - 1).toLocaleString('pt-BR', {
            month: 'short',
          });

          return {
            name: monthName,
            'Total Indicados': monthData.totalReferrals,
            Convertidos: monthData.convertedReferrals,
            'Ganhos Mensais': Number(monthData.monthlyEarnings.toFixed(2)),
            'Ganhos Acumulados': Number(cumulative.toFixed(2)),
          };
        });

        if (formatted.length === 0) {
          setChartData([]);
          return;
        }

        setChartData(formatted);
      } catch (err) {
        // console.error(err);
        setChartData([]);
        setTotals(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommissions();
  }, [isAffiliate, user]);

  const handleActivate = async () => {
    try {
      if (!user) {
        alert('Erro: Usuário não encontrado');
        return;
      }

      // Ativação direta via função do AuthContext
      await activateAffiliate(user.id);
      
      // Redirecionamento simples
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error) {
      console.error('Erro na ativação:', error);
      alert('Erro ao ativar conta de afiliado. Tente novamente.');
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    const target = e.currentTarget.previousSibling as HTMLInputElement;
    target.select();
    navigator.clipboard.writeText(referralLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-bold">Programa de Afiliados</h2>
        <p className="text-gray-dark">
          Ganhe comissões indicando novos clientes para a Viraliza.ai.
        </p>
        {isAffiliate && totals && (
          <p className="text-gray-400 text-sm mt-2">
            Ganhos pendentes: <span className="text-green-400 font-semibold">R$ {totals.pending.toFixed(2)}</span> 
            Ganhos pagos: <span className="text-blue-400 font-semibold">R$ {totals.paid.toFixed(2)}</span>
          </p>
        )}
      </header>

      {!isAffiliate ? (
        <div className="bg-secondary p-8 rounded-lg text-center max-w-2xl mx-auto">
          <GiftIcon className="w-16 h-16 mx-auto text-accent mb-4" />
          <h3 className="text-2xl font-bold mb-2">Torne-se um Afiliado</h3>
          <p className="text-gray-dark mb-6">
            Ative sua conta de afiliado para receber um link exclusivo e comece a ganhar
            comissões por cada novo cliente que você indicar.
          </p>
          <button
            onClick={handleActivate}
            className="bg-accent text-light font-semibold py-3 px-8 rounded-full hover:bg-blue-500 transition-colors"
          >
            Ativar Minha Conta de Afiliado
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-secondary p-6 rounded-lg max-w-sm ml-auto">
            <p className="text-sm text-gray-dark font-medium mb-2">Seu Link de Indicação</p>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={referralLink}
                onClick={(e) => e.currentTarget.select()}
                className="w-full bg-primary p-2 rounded border border-gray-600 pr-10 text-xs cursor-text focus:border-accent focus:ring-1 focus:ring-accent outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-dark hover:text-light"
              >
                <CopyIcon className="w-4 h-4" />
              </button>
            </div>
            {linkCopied && (
              <p className="text-green-400 text-xs mt-1 text-center">Link copiado!</p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="lg:col-span-2 bg-secondary p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Ganhos Totais (Acumulado)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0B1747" />
                  <XAxis dataKey="name" stroke="#94A3B8" />
                  <YAxis
                    stroke="#94A3B8"
                    tickFormatter={(value) => `R$${value}`}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#02042B',
                      border: '1px solid #0B1747'
                    }}
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Ganhos Acumulados"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Ganhos Mensais"
                    stroke="#818CF8"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-secondary p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Indicações Convertidas (Mensal)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0B1747" />
                  <XAxis dataKey="name" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#02042B',
                      border: '1px solid #0B1747'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Convertidos" fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-secondary p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Total de Usuários Indicados (Mensal)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0B1747" />
                  <XAxis dataKey="name" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#02042B',
                      border: '1px solid #0B1747'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Total Indicados" fill="#A5B4FC" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Seção de Conta Bancária */}
          <BankAccountSection user={user} />

          <div className="bg-secondary p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Usuários Indicados por Você</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-dark uppercase bg-primary">
                  <tr>
                    <th className="p-3">Usuário</th>
                    <th className="p-3">Compras</th>
                    <th className="p-3">Primeira Conversão</th>
                    <th className="p-3">Última Conversão</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {referredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center p-6 text-gray-dark">
                        Nenhum usuário indicado ainda. Compartilhe seu link!
                      </td>
                    </tr>
                  )}
                  {referredUsers.map((refUser: any) => {
                    const id = refUser.referredUserId || refUser.id;
                    const displayName =
                      (typeof refUser.referredUserName === 'string' && refUser.referredUserName) ||
                      (typeof refUser.name === 'string' && refUser.name) ||
                      null;
                    const displayEmail =
                      (typeof refUser.referredUserEmail === 'string' && refUser.referredUserEmail) ||
                      (typeof refUser.email === 'string' && refUser.email) ||
                      null;
                    const purchases = Number(refUser.purchases || 0);
                    const firstSeenAt = refUser.firstSeenAt || refUser.joinedDate;
                    const lastSeenAt = refUser.lastSeenAt || refUser.joinedDate;

                    const hasPlan = Boolean(refUser.hasPlan || refUser.plan);
                    const hasGrowthEngine = Boolean(refUser.hasGrowthEngine);
                    const hasAds = Boolean(refUser.hasAds);

                    const purchasedPlans: string[] = Array.isArray(refUser.purchasedPlans)
                      ? refUser.purchasedPlans
                      : [];
                    const purchasedAddons: string[] = Array.isArray(refUser.purchasedAddons)
                      ? refUser.purchasedAddons
                      : [];
                    const purchasedItems: { itemType?: string; itemId?: string }[] =
                      Array.isArray(refUser.purchasedItems) ? refUser.purchasedItems : [];

                    const isPaidLike =
                      purchases > 0 || hasPlan || hasGrowthEngine || hasAds;

                    const statusLabel = isPaidLike ? 'Pago' : 'Pendente';

                    return (
                      <tr key={id} className="border-t border-primary">
                        <td className="p-3">
                          <div className="font-medium">{displayName || id}</div>
                          {displayEmail && (
                            <div className="text-xs text-gray-dark">{displayEmail}</div>
                          )}
                          {!displayName && !displayEmail && (
                            <div className="text-xs text-gray-dark font-mono">{id}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2 items-center">
                            {purchasedPlans.length > 0 ? (
                              <span className="text-gray-300">
                                {purchasedPlans.length}{' '}
                                {purchasedPlans.length === 1 ? 'Plano' : 'Planos'}{' '}
                                {joinWithAnd(purchasedPlans)}
                              </span>
                            ) : (
                              <span className="text-gray-300">{purchases}</span>
                            )}
                            {purchasedAddons.length > 0 && (
                              <div className="flex flex-wrap gap-2 items-center">
                                {purchasedAddons.map((addonName) => (
                                  <span
                                    key={`addon-${id}-${addonName}`}
                                    className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300"
                                    title={addonName}
                                  >
                                    {addonName}
                                  </span>
                                ))}
                              </div>
                            )}
                            {purchasedItems.length > 0 && purchasedPlans.length === 0 && purchasedAddons.length === 0 && (
                              <div className="flex flex-wrap gap-2 items-center">
                                {purchasedItems.map((it, idx) => {
                                  const label = it?.itemId || `${it?.itemType || 'item'} #${idx + 1}`;
                                  const type = it?.itemType;
                                  const cls =
                                    type === 'plan'
                                      ? 'bg-green-500/20 text-green-300'
                                      : type === 'addon'
                                      ? 'bg-blue-500/20 text-blue-300'
                                      : 'bg-gray-500/20 text-gray-300';
                                  return (
                                    <span
                                      key={`item-${id}-${idx}`}
                                      className={`px-2 py-1 text-xs rounded-full ${cls}`}
                                      title={label}
                                    >
                                      {label}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                            {hasPlan && (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-300">
                                Plano
                              </span>
                            )}
                            {hasGrowthEngine && (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300">
                                Growth Engine
                              </span>
                            )}
                            {hasAds && (
                              <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300">
                                Ads
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          {firstSeenAt
                            ? new Date(firstSeenAt).toLocaleDateString('pt-BR')
                            : '-'}
                        </td>
                        <td className="p-3">
                          {lastSeenAt
                            ? new Date(lastSeenAt).toLocaleDateString('pt-BR')
                            : '-'}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              statusLabel === 'Pago'
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AffiliatePage;