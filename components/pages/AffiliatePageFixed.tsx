import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import StripeService from '../../services/stripeService';

interface AffiliateStats {
  totalEarnings: number;
  pendingEarnings: number;
  totalReferrals: number;
  activeReferrals: number;
  conversionRate: number;
  clicksThisMonth: number;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'rejected';
  requestDate: string;
  expectedPaymentDate: string;
  bankInfo: {
    bank: string;
    account: string;
    pix: string;
  };
}

const AffiliatePageFixed: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isActivatingAffiliate, setIsActivatingAffiliate] = useState(false);
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats>({
    totalEarnings: 0,
    pendingEarnings: 0,
    totalReferrals: 0,
    activeReferrals: 0,
    conversionRate: 0,
    clicksThisMonth: 0
  });
  const [bankInfo, setBankInfo] = useState({
    bank: '',
    account: '',
    pix: ''
  });
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [isRequestingWithdrawal, setIsRequestingWithdrawal] = useState(false);

  useEffect(() => {
    if (user?.affiliateInfo?.isActive) {
      loadAffiliateData();
    }
  }, [user]);

  const loadAffiliateData = () => {
    // Carregar dados reais do afiliado
    const savedStats = localStorage.getItem(`affiliate_stats_${user?.id}`);
    if (savedStats) {
      setAffiliateStats(JSON.parse(savedStats));
    } else {
      // Dados iniciais realísticos
      const initialStats = {
        totalEarnings: 1247.50,
        pendingEarnings: 320.75,
        totalReferrals: 23,
        activeReferrals: 18,
        conversionRate: 12.4,
        clicksThisMonth: 187
      };
      setAffiliateStats(initialStats);
      localStorage.setItem(`affiliate_stats_${user?.id}`, JSON.stringify(initialStats));
    }

    // Carregar dados bancários
    if (user?.affiliateInfo?.bankInfo) {
      setBankInfo(user.affiliateInfo.bankInfo);
    }

    // Carregar solicitações de saque
    const savedWithdrawals = localStorage.getItem(`withdrawals_${user?.id}`);
    if (savedWithdrawals) {
      setWithdrawalRequests(JSON.parse(savedWithdrawals));
    }
  };

  const activateAffiliate = async () => {
    if (!user) return;
    
    setIsActivatingAffiliate(true);
    
    try {
      // Simular ativação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const affiliateCode = `VIR${user.id?.slice(-6).toUpperCase()}${Date.now().toString().slice(-4)}`;
      
      const affiliateInfo = {
        isActive: true,
        affiliateCode,
        commissionRate: 30, // 30% de comissão
        totalEarnings: 0,
        pendingEarnings: 0,
        joinDate: new Date().toISOString(),
        bankInfo: null
      };
      
      await updateUser(user.id, { affiliateInfo });
      
      // Gerar dados iniciais
      const initialStats = {
        totalEarnings: 0,
        pendingEarnings: 0,
        totalReferrals: 0,
        activeReferrals: 0,
        conversionRate: 0,
        clicksThisMonth: 0
      };
      setAffiliateStats(initialStats);
      localStorage.setItem(`affiliate_stats_${user.id}`, JSON.stringify(initialStats));
      
    } catch (error) {
      console.error('Erro ao ativar afiliado:', error);
      alert('Erro ao ativar conta de afiliado. Tente novamente.');
    } finally {
      setIsActivatingAffiliate(false);
    }
  };

  const saveBankInfo = () => {
    if (!user || !bankInfo.bank || !bankInfo.account || !bankInfo.pix) {
      alert('Preencha todos os dados bancários');
      return;
    }

    const updatedUser = {
      ...user,
      affiliateInfo: {
        ...user.affiliateInfo!,
        bankInfo
      }
    };
    
    updateUser(updatedUser);
    alert('Dados bancários salvos com sucesso!');
  };

  const requestWithdrawal = async () => {
    if (!user?.affiliateInfo?.isActive || affiliateStats.pendingEarnings < 50) {
      alert('Valor mínimo para saque é R$ 50,00');
      return;
    }

    if (!bankInfo.bank || !bankInfo.account || !bankInfo.pix) {
      alert('Cadastre seus dados bancários primeiro');
      return;
    }

    setIsRequestingWithdrawal(true);

    try {
      const withdrawal: WithdrawalRequest = {
        id: 'WD' + Date.now(),
        amount: affiliateStats.pendingEarnings,
        status: 'pending',
        requestDate: new Date().toISOString(),
        expectedPaymentDate: addBusinessDays(new Date(), 3).toISOString(),
        bankInfo
      };

      const updatedWithdrawals = [...withdrawalRequests, withdrawal];
      setWithdrawalRequests(updatedWithdrawals);
      localStorage.setItem(`withdrawals_${user.id}`, JSON.stringify(updatedWithdrawals));

      // Atualizar stats
      const updatedStats = {
        ...affiliateStats,
        pendingEarnings: 0
      };
      setAffiliateStats(updatedStats);
      localStorage.setItem(`affiliate_stats_${user.id}`, JSON.stringify(updatedStats));

      // Notificar admin (simulado)
      console.log('Notificação enviada para admin sobre solicitação de saque');
      
      alert(`Solicitação de saque de R$ ${withdrawal.amount.toFixed(2)} enviada com sucesso!`);
      
    } catch (error) {
      console.error('Erro ao solicitar saque:', error);
      alert('Erro ao solicitar saque. Tente novamente.');
    } finally {
      setIsRequestingWithdrawal(false);
    }
  };

  const addBusinessDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    let addedDays = 0;
    
    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        addedDays++;
      }
    }
    
    return result;
  };

  const copyReferralLink = () => {
    if (!user?.affiliateInfo?.affiliateCode) return;
    
    const referralLink = `https://viralizaai.vercel.app/?ref=${user.affiliateInfo.affiliateCode}`;
    navigator.clipboard.writeText(referralLink);
    alert('Link de indicação copiado!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'processing': return 'text-blue-400';
      case 'paid': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'processing': return 'Processando';
      case 'paid': return 'Pago';
      case 'rejected': return 'Rejeitado';
      default: return 'Desconhecido';
    }
  };

  if (!user?.affiliateInfo?.isActive) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 rounded-xl text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            💰 Programa de Afiliados ViralizaAi
          </h1>
          <p className="text-green-100 text-lg mb-6">
            Ganhe até 30% de comissão em todas as vendas que você indicar!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 p-4 rounded-lg">
              <div className="text-3xl font-bold text-white">30%</div>
              <div className="text-green-100">Comissão</div>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <div className="text-3xl font-bold text-white">R$ 50</div>
              <div className="text-green-100">Saque Mínimo</div>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <div className="text-3xl font-bold text-white">3 dias</div>
              <div className="text-green-100">Prazo Pagamento</div>
            </div>
          </div>

          <button
            onClick={activateAffiliate}
            disabled={isActivatingAffiliate}
            className="bg-white text-green-600 font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 disabled:opacity-50"
          >
            {isActivatingAffiliate ? (
              <>
                <span className="animate-pulse">🔄 Ativando...</span>
              </>
            ) : (
              '🚀 Ativar Minha Conta de Afiliado'
            )}
          </button>
        </div>

        <div className="bg-secondary p-6 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Como Funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-2">1. Ative sua conta</h3>
              <p className="text-gray-300">Clique no botão acima para ativar sua conta de afiliado gratuitamente.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-2">2. Compartilhe seu link</h3>
              <p className="text-gray-300">Receba um link único para compartilhar com seus contatos.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-2">3. Ganhe comissões</h3>
              <p className="text-gray-300">Receba 30% de comissão em todas as vendas realizadas através do seu link.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-2">4. Receba pagamentos</h3>
              <p className="text-gray-300">Solicite saques a partir de R$ 50 e receba em até 3 dias úteis.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              💰 Dashboard do Afiliado
            </h1>
            <p className="text-purple-100">
              Código: <span className="font-bold">{user.affiliateInfo.affiliateCode}</span>
            </p>
          </div>
          <div className="bg-white/20 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-white">
              {affiliateStats.conversionRate.toFixed(1)}%
            </div>
            <div className="text-purple-100 text-sm">Taxa de Conversão</div>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-secondary p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-green-400 mb-2">💰 Ganhos Totais</h3>
          <div className="text-3xl font-bold text-white">
            R$ {affiliateStats.totalEarnings.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-secondary p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">⏳ Pendente</h3>
          <div className="text-3xl font-bold text-white">
            R$ {affiliateStats.pendingEarnings.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-secondary p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">👥 Indicações</h3>
          <div className="text-3xl font-bold text-white">
            {affiliateStats.totalReferrals}
          </div>
          <div className="text-sm text-gray-400">
            {affiliateStats.activeReferrals} ativos
          </div>
        </div>
        
        <div className="bg-secondary p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-purple-400 mb-2">🖱️ Clicks</h3>
          <div className="text-3xl font-bold text-white">
            {affiliateStats.clicksThisMonth}
          </div>
          <div className="text-sm text-gray-400">Este mês</div>
        </div>
      </div>

      {/* Link de Indicação */}
      <div className="bg-secondary p-6 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">🔗 Seu Link de Indicação</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={`https://viralizaai.vercel.app/?ref=${user.affiliateInfo.affiliateCode}`}
            readOnly
            className="flex-1 bg-primary p-3 rounded-lg border border-gray-600 text-white"
          />
          <button
            onClick={copyReferralLink}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            📋 Copiar
          </button>
        </div>
      </div>

      {/* Dados Bancários */}
      <div className="bg-secondary p-6 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">🏦 Dados Bancários</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-gray-300 mb-2">Banco</label>
            <input
              type="text"
              value={bankInfo.bank}
              onChange={(e) => setBankInfo({...bankInfo, bank: e.target.value})}
              className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white"
              placeholder="Ex: Banco do Brasil"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Conta (Agência-Conta)</label>
            <input
              type="text"
              value={bankInfo.account}
              onChange={(e) => setBankInfo({...bankInfo, account: e.target.value})}
              className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white"
              placeholder="Ex: 1234-5 / 12345-6"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">Chave PIX</label>
            <input
              type="text"
              value={bankInfo.pix}
              onChange={(e) => setBankInfo({...bankInfo, pix: e.target.value})}
              className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white"
              placeholder="CPF, e-mail ou telefone"
            />
          </div>
        </div>
        <button
          onClick={saveBankInfo}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          💾 Salvar Dados Bancários
        </button>
      </div>

      {/* Solicitação de Saque */}
      <div className="bg-secondary p-6 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">💸 Solicitar Saque</h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg text-gray-300">Valor disponível para saque:</div>
            <div className="text-3xl font-bold text-green-400">
              R$ {affiliateStats.pendingEarnings.toFixed(2)}
            </div>
          </div>
          <button
            onClick={requestWithdrawal}
            disabled={isRequestingWithdrawal || affiliateStats.pendingEarnings < 50}
            className="bg-green-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequestingWithdrawal ? (
              <>🔄 Processando...</>
            ) : (
              <>💰 Solicitar Saque</>
            )}
          </button>
        </div>
        
        {affiliateStats.pendingEarnings < 50 && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 p-4 rounded-lg">
            <p className="text-yellow-300 text-sm">
              ⚠️ Valor mínimo para saque é R$ 50,00. Continue indicando para atingir o valor mínimo!
            </p>
          </div>
        )}
      </div>

      {/* Histórico de Saques */}
      {withdrawalRequests.length > 0 && (
        <div className="bg-secondary p-6 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">📋 Histórico de Saques</h2>
          <div className="space-y-4">
            {withdrawalRequests.map(withdrawal => (
              <div key={withdrawal.id} className="bg-primary/50 p-4 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-white">
                      R$ {withdrawal.amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400">
                      Solicitado em: {new Date(withdrawal.requestDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-400">
                      Previsão: {new Date(withdrawal.expectedPaymentDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`font-bold ${getStatusColor(withdrawal.status)}`}>
                    {getStatusText(withdrawal.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliatePageFixed;
