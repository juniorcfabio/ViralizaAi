import React, { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import FeatureLockedOverlay from '../ui/FeatureLockedOverlay';
import WithdrawalSection from '../ui/WithdrawalSection';
import AffiliateRegistrationModal from '../ui/AffiliateRegistrationModal';

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

const AffiliatePage: React.FC = () => {
  const { user, activateAffiliate, platformUsers, hasAccess } = useAuth();
  const navigate = useNavigate();
  const [linkCopied, setLinkCopied] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totals, setTotals] = useState<{ pending: number; paid: number } | null>(null);
  const [referredUserIds, setReferredUserIds] = useState<string[]>([]);
  const [referredUsersFromApi, setReferredUsersFromApi] = useState<any[]>([]);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  if (!hasAccess('affiliate')) {
    return (
      <div className="relative h-full">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-primary px-4 py-2 rounded-lg border border-gray-600 hover:border-accent"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar para Dashboard
            </button>
          </div>
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

  const handleActivate = () => {
    setShowRegistrationModal(true);
  };

  const handleRegistrationSuccess = () => {
    // Recarregar dados do usuário ou atualizar estado
    window.location.reload();
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
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-primary px-4 py-2 rounded-lg border border-gray-600 hover:border-accent"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Dashboard
          </button>
        </div>
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
          {/* Sistema de Saque */}
          <WithdrawalSection />

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

          <div className="bg-secondary p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Usuários Indicados por Você</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-dark uppercase bg-primary">
                  <tr>
                    <th className="p-3">Usuário</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {referredUsers.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center p-6 text-gray-dark">
                        Nenhum usuário indicado ainda. Compartilhe seu link!
                      </td>
                    </tr>
                  )}
                  {referredUsers.map((refUser: any) => {
                    const id = refUser.referredUserId || refUser.id;
                    const displayName = refUser.referredUserName || refUser.name || id;
                    const displayEmail = refUser.referredUserEmail || refUser.email;

                    return (
                      <tr key={id} className="border-t border-primary">
                        <td className="p-3">
                          <div className="font-medium">{displayName}</div>
                          {displayEmail && (
                            <div className="text-xs text-gray-dark">{displayEmail}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-300">
                            Ativo
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

      {/* Modal de Cadastro de Afiliado */}
      {showRegistrationModal && (
        <AffiliateRegistrationModal
          onClose={() => setShowRegistrationModal(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </>
  );
};

export default AffiliatePage;
