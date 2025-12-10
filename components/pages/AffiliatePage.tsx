import React, { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import FeatureLockedOverlay from '../ui/FeatureLockedOverlay';

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

const AffiliatePage: React.FC = () => {
  const { user, activateAffiliate, platformUsers, hasAccess } = useAuth();
  const [linkCopied, setLinkCopied] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  if (!hasAccess('affiliate')) {
    return (
      <div className="relative h-full">
        <header className="mb-8">
          <h2 className="text-3xl font-bold">Programa de Afiliados</h2>
          <p className="text-gray-dark">
            Ganhe comissões indicando novos clientes para a Viraliza.ai.
          </p>
        </header>
        <FeatureLockedOverlay
          featureName="Programa de Afiliados"
          requiredPlan="Plano Semestral"
        />
      </div>
    );
  }

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
    if (!isAffiliate || !user?.affiliateInfo?.referredUserIds) return [];
    return platformUsers.filter((u) => user.affiliateInfo!.referredUserIds.includes(u.id));
  }, [isAffiliate, user, platformUsers]);

  useEffect(() => {
    if (!isAffiliate) {
      setChartData([]);
      return;
    }

    const planPrices: { [key: string]: number } = {
      Anual: 399.9,
      Semestral: 259.9,
      Trimestral: 159.9,
      Mensal: 59.9
    };
    const commissionRate =
      parseFloat(localStorage.getItem('viraliza_affiliate_commission_rate') || '20') / 100;

    // Se já existem indicados reais, usa dados reais
    if (referredUsers.length > 0) {
      const dataByMonth: {
        [key: string]: { totalReferrals: number; convertedReferrals: number; monthlyEarnings: number };
      } = {};

      referredUsers.forEach((refUser) => {
        const joinedDate = new Date(refUser.joinedDate);
        const monthKey = `${joinedDate.getFullYear()}-${String(
          joinedDate.getMonth() + 1
        ).padStart(2, '0')}`;

        if (!dataByMonth[monthKey]) {
          dataByMonth[monthKey] = {
            totalReferrals: 0,
            convertedReferrals: 0,
            monthlyEarnings: 0
          };
        }

        dataByMonth[monthKey].totalReferrals += 1;
        if (refUser.plan) {
          dataByMonth[monthKey].convertedReferrals += 1;
          const planPrice = planPrices[refUser.plan] || 0;
          dataByMonth[monthKey].monthlyEarnings += planPrice * commissionRate;
        }
      });

      const sortedMonths = Object.keys(dataByMonth).sort();
      let cumulativeEarnings = 0;
      const formattedData = sortedMonths.map((monthKey) => {
        const monthData = dataByMonth[monthKey];
        cumulativeEarnings += monthData.monthlyEarnings;
        const [year, month] = monthKey.split('-');
        const monthName = new Date(Number(year), Number(month) - 1).toLocaleString('pt-BR', {
          month: 'short'
        });

        return {
          name: monthName,
          'Total Indicados': monthData.totalReferrals,
          Convertidos: monthData.convertedReferrals,
          'Ganhos Mensais': parseFloat(monthData.monthlyEarnings.toFixed(2)),
          'Ganhos Acumulados': parseFloat(cumulativeEarnings.toFixed(2))
        };
      });

      setChartData(formattedData);
      return;
    }

    // Nenhum indicado ainda → gera cenário DEMO inteligente
    const baseMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    let cumulative = 0;
    const demoData = baseMonths.map((label, index) => {
      // Crescimento leve mês a mês
      const totalReferrals = 2 + index; // 2,3,4,5...
      const converted = 1 + Math.floor(index / 2); // 1,1,2,2,3,3...
      const avgTicket = planPrices.Trimestral; // usa um plano médio
      const monthlyEarnings = converted * avgTicket * commissionRate;
      cumulative += monthlyEarnings;

      return {
        name: label,
        'Total Indicados': totalReferrals,
        Convertidos: converted,
        'Ganhos Mensais': parseFloat(monthlyEarnings.toFixed(2)),
        'Ganhos Acumulados': parseFloat(cumulative.toFixed(2))
      };
    });

    setChartData(demoData);
  }, [isAffiliate, referredUsers]);

  const handleActivate = () => {
    if (user) {
      activateAffiliate(user.id);
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

          <div className="bg-secondary p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Usuários Indicados por Você</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-dark uppercase bg-primary">
                  <tr>
                    <th className="p-3">Nome</th>
                    <th className="p-3">Plano Assinado</th>
                    <th className="p-3">Data de Inscrição</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {referredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center p-6 text-gray-dark">
                        Nenhum usuário indicado ainda. Compartilhe seu link!
                      </td>
                    </tr>
                  )}
                  {referredUsers.map((refUser) => (
                    <tr key={refUser.id} className="border-t border-primary">
                      <td className="p-3 font-medium">{refUser.name}</td>
                      <td className="p-3">
                        {refUser.plan || 'Aguardando Assinatura'}
                      </td>
                      <td className="p-3">
                        {new Date(refUser.joinedDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            refUser.plan
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}
                        >
                          {refUser.plan ? 'Assinante' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  ))}
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