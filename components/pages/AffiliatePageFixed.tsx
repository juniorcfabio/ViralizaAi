import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import RealAffiliateService from '../../services/realAffiliateService';
import type { AffiliateAccount, AffiliateCommission, WithdrawalRequest as WR } from '../../services/realAffiliateService';

const svc = RealAffiliateService.getInstance();

const AffiliatePageFixed: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [affiliate, setAffiliate] = useState<AffiliateAccount | null>(null);
  const [stats, setStats] = useState({ totalEarnings: 0, pendingBalance: 0, availableBalance: 0, totalReferrals: 0, totalClicks: 0, conversionRate: 0, commissionsThisMonth: 0, commissionsThisWeek: 0 });
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [withdrawals, setWithdrawals] = useState<WR[]>([]);
  const [minWithdrawal, setMinWithdrawal] = useState(50);
  const [commissionRate, setCommissionRate] = useState(20);
  const [isRequestingWithdrawal, setIsRequestingWithdrawal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'commissions' | 'withdrawals' | 'banking'>('dashboard');
  const [savingBank, setSavingBank] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankAgency, setBankAgency] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountType, setBankAccountType] = useState('corrente');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [holderName, setHolderName] = useState('');
  const [holderCpf, setHolderCpf] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'deposit'>('pix');

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [aff, sett] = await Promise.all([
        svc.getAffiliateByUserId(user.id),
        svc.getSettings()
      ]);
      setAffiliate(aff);
      setMinWithdrawal(sett.min_withdrawal_amount);
      setCommissionRate(sett.commission_rate);
      if (aff?.id) {
        const [st, comms, wds] = await Promise.all([
          svc.getAffiliateStats(user.id),
          svc.getCommissionsByAffiliate(aff.id),
          svc.getWithdrawalsByAffiliate(user.id)
        ]);
        setStats(st);
        setCommissions(comms);
        setWithdrawals(wds);
        if (aff.bank_name) setBankName(aff.bank_name);
        if (aff.bank_agency) setBankAgency(aff.bank_agency);
        if (aff.bank_account) setBankAccount(aff.bank_account);
        if (aff.bank_account_type) setBankAccountType(aff.bank_account_type);
        if (aff.pix_key) setPixKey(aff.pix_key);
        if (aff.pix_key_type) setPixKeyType(aff.pix_key_type);
        if (aff.account_holder_name) setHolderName(aff.account_holder_name);
        if (aff.account_holder_cpf) setHolderCpf(aff.account_holder_cpf);
        if (aff.payment_method) setPaymentMethod(aff.payment_method as 'pix' | 'deposit');
      }
    } catch (e) {
      console.error('Erro ao carregar dados do afiliado:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const activateAffiliate = async () => {
    if (!user?.id) return;
    setIsActivating(true);
    try {
      const result = await svc.activateAffiliate(user.id, user.name || 'Afiliado', user.email || '');
      if (result) {
        setAffiliate(result);
        await updateUser(user.id, {
          affiliateInfo: { isActive: true, referralCode: result.referral_code, earnings: 0, referredUserIds: [] }
        });
        alert('Conta de afiliado ativada com sucesso!');
        await loadData();
      } else {
        alert('Erro ao ativar conta. Tente novamente.');
      }
    } catch (e) {
      console.error('Erro:', e);
      alert('Erro ao ativar conta de afiliado.');
    } finally {
      setIsActivating(false);
    }
  };

  const saveBankInfoHandler = async () => {
    if (!user?.id) return;
    if (paymentMethod === 'pix' && !pixKey) { alert('Informe sua chave PIX'); return; }
    if (paymentMethod === 'deposit' && (!bankName || !bankAgency || !bankAccount)) { alert('Preencha todos os dados bancários'); return; }
    if (!holderName || !holderCpf) { alert('Preencha nome do titular e CPF'); return; }
    setSavingBank(true);
    try {
      const ok = await svc.updateBankingData(user.id, {
        bank_name: bankName, bank_agency: bankAgency, bank_account: bankAccount,
        bank_account_type: bankAccountType, pix_key: pixKey, pix_key_type: pixKeyType,
        account_holder_name: holderName, account_holder_cpf: holderCpf, payment_method: paymentMethod
      });
      if (ok) { alert('Dados bancários salvos com sucesso!'); await loadData(); }
      else alert('Erro ao salvar dados bancários.');
    } catch { alert('Erro ao salvar dados bancários.'); }
    finally { setSavingBank(false); }
  };

  const requestWithdrawal = async () => {
    if (!user?.id) return;
    if (!affiliate?.payment_method) { alert('Cadastre seus dados bancários/PIX antes'); setActiveTab('banking'); return; }
    setIsRequestingWithdrawal(true);
    try {
      const result = await svc.requestWithdrawal(user.id);
      if (result) {
        alert(`Saque de R$ ${result.amount.toFixed(2)} solicitado! Pagamento via ${result.payment_method === 'pix' ? 'PIX' : 'Depósito'}. Prazo: 1 semana.`);
        await loadData();
      }
    } catch (e: any) { alert(e.message || 'Erro ao solicitar saque.'); }
    finally { setIsRequestingWithdrawal(false); }
  };

  const copyReferralLink = () => {
    if (!affiliate?.referral_code) return;
    navigator.clipboard.writeText(`https://viralizaai.vercel.app/?ref=${affiliate.referral_code}`);
    alert('Link copiado!');
  };

  const getStatusColor = (s: string) => {
    const m: Record<string, string> = { pending: 'text-yellow-400', approved: 'text-blue-400', processing: 'text-blue-400', paid: 'text-green-400', rejected: 'text-red-400', confirmed: 'text-green-300', cancelled: 'text-red-300' };
    return m[s] || 'text-gray-400';
  };
  const getStatusText = (s: string) => {
    const m: Record<string, string> = { pending: 'Pendente', approved: 'Aprovado', processing: 'Processando', paid: 'Pago', rejected: 'Rejeitado', confirmed: 'Confirmado', cancelled: 'Cancelado' };
    return m[s] || s;
  };

  // ──── TELA DE ATIVAÇÃO ────
  if (!affiliate) {
    return (
      <div className="space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-xl text-gray-400 animate-pulse">Carregando...</div>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 rounded-xl text-center">
              <h1 className="text-4xl font-bold text-white mb-4">Programa de Afiliados ViralizaAi</h1>
              <p className="text-green-100 text-lg mb-6">Ganhe {commissionRate}% de comissão em todas as vendas que indicar!</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/10 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-white">{commissionRate}%</div>
                  <div className="text-green-100">Comissão</div>
                </div>
                <div className="bg-white/10 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-white">R$ {minWithdrawal}</div>
                  <div className="text-green-100">Saque Mínimo</div>
                </div>
                <div className="bg-white/10 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-white">Semanal</div>
                  <div className="text-green-100">Ciclo Pagamento</div>
                </div>
              </div>
              <button onClick={activateAffiliate} disabled={isActivating} className="bg-white text-green-600 font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 disabled:opacity-50">
                {isActivating ? 'Ativando...' : 'Ativar Minha Conta de Afiliado'}
              </button>
            </div>
            <div className="bg-secondary p-6 rounded-lg border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">Como Funciona</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><h3 className="text-lg font-semibold text-green-400 mb-2">1. Ative sua conta</h3><p className="text-gray-300">Clique no botão acima para ativar gratuitamente.</p></div>
                <div><h3 className="text-lg font-semibold text-green-400 mb-2">2. Compartilhe seu link</h3><p className="text-gray-300">Receba um link único para compartilhar.</p></div>
                <div><h3 className="text-lg font-semibold text-green-400 mb-2">3. Ganhe comissões</h3><p className="text-gray-300">Receba {commissionRate}% de comissão em cada venda.</p></div>
                <div><h3 className="text-lg font-semibold text-green-400 mb-2">4. Receba pagamentos</h3><p className="text-gray-300">Pagamentos semanais via PIX ou depósito bancário.</p></div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ──── DASHBOARD PRINCIPAL DO AFILIADO ────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Dashboard do Afiliado</h1>
            <p className="text-purple-100">Código: <span className="font-bold font-mono">{affiliate.referral_code}</span></p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/20 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-white">{stats.conversionRate.toFixed(1)}%</div>
              <div className="text-purple-100 text-xs">Conversão</div>
            </div>
            <div className="bg-white/20 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-white">{affiliate.commission_rate}%</div>
              <div className="text-purple-100 text-xs">Comissão</div>
            </div>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-2 flex-wrap">
        {(['dashboard', 'commissions', 'withdrawals', 'banking'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-lg font-semibold transition-colors text-sm ${activeTab === tab ? 'bg-accent text-white' : 'bg-secondary text-gray-300 hover:bg-accent/20'}`}>
            {tab === 'dashboard' && 'Resumo'}
            {tab === 'commissions' && 'Comissões'}
            {tab === 'withdrawals' && 'Saques'}
            {tab === 'banking' && 'Dados Bancários'}
          </button>
        ))}
      </div>

      {/* ──── ABA RESUMO ──── */}
      {activeTab === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-secondary p-5 rounded-lg border border-gray-700">
              <div className="text-sm text-green-400 font-semibold mb-1">Ganhos Totais</div>
              <div className="text-2xl font-bold text-white">R$ {stats.totalEarnings.toFixed(2)}</div>
            </div>
            <div className="bg-secondary p-5 rounded-lg border border-gray-700">
              <div className="text-sm text-yellow-400 font-semibold mb-1">Saldo Pendente</div>
              <div className="text-2xl font-bold text-white">R$ {stats.pendingBalance.toFixed(2)}</div>
              <div className="text-xs text-gray-500">Aguardando período de confirmação</div>
            </div>
            <div className="bg-secondary p-5 rounded-lg border border-gray-700">
              <div className="text-sm text-blue-400 font-semibold mb-1">Disponível p/ Saque</div>
              <div className="text-2xl font-bold text-white">R$ {stats.availableBalance.toFixed(2)}</div>
            </div>
            <div className="bg-secondary p-5 rounded-lg border border-gray-700">
              <div className="text-sm text-purple-400 font-semibold mb-1">Indicações / Clicks</div>
              <div className="text-2xl font-bold text-white">{stats.totalReferrals} / {stats.totalClicks}</div>
            </div>
          </div>

          {/* Link */}
          <div className="bg-secondary p-5 rounded-lg border border-gray-700">
            <h2 className="text-lg font-bold text-white mb-3">Seu Link de Indicação</h2>
            <div className="flex gap-3">
              <input type="text" value={`https://viralizaai.vercel.app/?ref=${affiliate.referral_code}`} readOnly className="flex-1 bg-primary p-3 rounded-lg border border-gray-600 text-white text-sm font-mono" />
              <button onClick={copyReferralLink} className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">Copiar</button>
            </div>
          </div>

          {/* Resumo semanal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-secondary p-5 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Comissões esta semana</div>
              <div className="text-2xl font-bold text-green-400">R$ {stats.commissionsThisWeek.toFixed(2)}</div>
            </div>
            <div className="bg-secondary p-5 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Comissões este mês</div>
              <div className="text-2xl font-bold text-green-400">R$ {stats.commissionsThisMonth.toFixed(2)}</div>
            </div>
          </div>

          {/* Solicitar saque rápido */}
          <div className="bg-secondary p-5 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-300">Disponível para saque:</div>
                <div className="text-2xl font-bold text-green-400">R$ {stats.availableBalance.toFixed(2)}</div>
                <div className="text-xs text-gray-500">Mínimo: R$ {minWithdrawal.toFixed(2)}</div>
              </div>
              <button onClick={requestWithdrawal} disabled={isRequestingWithdrawal || stats.availableBalance < minWithdrawal} className="bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                {isRequestingWithdrawal ? 'Processando...' : 'Solicitar Saque'}
              </button>
            </div>
            {!affiliate.payment_method && (
              <div className="mt-3 bg-yellow-500/20 border border-yellow-500/30 p-3 rounded-lg">
                <p className="text-yellow-300 text-sm">Cadastre seus dados bancários na aba "Dados Bancários" para poder solicitar saques.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ──── ABA COMISSÕES ──── */}
      {activeTab === 'commissions' && (
        <div className="bg-secondary p-5 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Histórico de Comissões</h2>
          {commissions.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p className="text-lg">Nenhuma comissão registrada ainda.</p>
              <p className="text-sm mt-2">Compartilhe seu link para começar a ganhar!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase bg-primary">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Produto</th>
                    <th className="p-3">Valor Venda</th>
                    <th className="p-3">Comissão</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Elegível em</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map(c => (
                    <tr key={c.id} className="border-t border-gray-700">
                      <td className="p-3 text-gray-300">{new Date(c.sale_date).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3 text-white">{c.product_name || 'Assinatura'}</td>
                      <td className="p-3 text-gray-300">R$ {c.sale_amount.toFixed(2)}</td>
                      <td className="p-3 font-bold text-green-400">R$ {c.commission_value.toFixed(2)}</td>
                      <td className={`p-3 font-semibold ${getStatusColor(c.status)}`}>{getStatusText(c.status)}</td>
                      <td className="p-3 text-gray-400 text-xs">{new Date(c.payment_eligible_date).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ──── ABA SAQUES ──── */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="bg-secondary p-5 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Meus Saques</h2>
              <button onClick={requestWithdrawal} disabled={isRequestingWithdrawal || stats.availableBalance < minWithdrawal || !affiliate.payment_method} className="bg-green-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                {isRequestingWithdrawal ? 'Processando...' : `Solicitar Saque (R$ ${stats.availableBalance.toFixed(2)})`}
              </button>
            </div>
            <div className="bg-primary/50 p-3 rounded-lg mb-4 text-sm text-gray-400">
              Ciclo: 1 semana de vendas + 1 semana para pagamento. Pagamento via {affiliate.payment_method === 'pix' ? 'PIX' : affiliate.payment_method === 'deposit' ? 'Depósito' : 'não configurado'}.
            </div>
            {withdrawals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum saque solicitado ainda.</div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map(w => (
                  <div key={w.id} className="bg-primary/50 p-4 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold text-white">R$ {w.amount.toFixed(2)}</div>
                        <div className="text-xs text-gray-400">Solicitado: {new Date(w.request_date).toLocaleDateString('pt-BR')}</div>
                        {w.paid_date && <div className="text-xs text-green-400">Pago em: {new Date(w.paid_date).toLocaleDateString('pt-BR')}</div>}
                        {w.rejected_reason && <div className="text-xs text-red-400">Motivo: {w.rejected_reason}</div>}
                        {w.transaction_id && <div className="text-xs text-gray-500 font-mono">ID: {w.transaction_id}</div>}
                      </div>
                      <span className={`font-bold text-sm ${getStatusColor(w.status)}`}>{getStatusText(w.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──── ABA DADOS BANCÁRIOS ──── */}
      {activeTab === 'banking' && (
        <div className="bg-secondary p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Dados para Recebimento</h2>

          {/* Método de pagamento */}
          <div className="mb-6">
            <label className="block text-gray-300 mb-2 font-semibold">Método de Pagamento</label>
            <div className="flex gap-4">
              <button onClick={() => setPaymentMethod('pix')} className={`px-6 py-3 rounded-lg font-semibold transition-colors ${paymentMethod === 'pix' ? 'bg-green-600 text-white' : 'bg-primary text-gray-300 border border-gray-600'}`}>
                PIX
              </button>
              <button onClick={() => setPaymentMethod('deposit')} className={`px-6 py-3 rounded-lg font-semibold transition-colors ${paymentMethod === 'deposit' ? 'bg-blue-600 text-white' : 'bg-primary text-gray-300 border border-gray-600'}`}>
                Depósito Bancário
              </button>
            </div>
          </div>

          {/* Titular */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-300 mb-2">Nome do Titular</label>
              <input type="text" value={holderName} onChange={e => setHolderName(e.target.value)} className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white" placeholder="Nome completo" />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">CPF do Titular</label>
              <input type="text" value={holderCpf} onChange={e => setHolderCpf(e.target.value)} className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white" placeholder="000.000.000-00" />
            </div>
          </div>

          {/* PIX */}
          {paymentMethod === 'pix' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-300 mb-2">Tipo da Chave PIX</label>
                <select value={pixKeyType} onChange={e => setPixKeyType(e.target.value)} className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white">
                  <option value="cpf">CPF</option>
                  <option value="email">E-mail</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Chave Aleatória</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Chave PIX</label>
                <input type="text" value={pixKey} onChange={e => setPixKey(e.target.value)} className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white" placeholder="Sua chave PIX" />
              </div>
            </div>
          )}

          {/* Depósito */}
          {paymentMethod === 'deposit' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-300 mb-2">Banco</label>
                <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white" placeholder="Ex: Banco do Brasil" />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Agência</label>
                <input type="text" value={bankAgency} onChange={e => setBankAgency(e.target.value)} className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white" placeholder="Ex: 1234-5" />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Conta</label>
                <input type="text" value={bankAccount} onChange={e => setBankAccount(e.target.value)} className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white" placeholder="Ex: 12345-6" />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Tipo de Conta</label>
                <select value={bankAccountType} onChange={e => setBankAccountType(e.target.value)} className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white">
                  <option value="corrente">Corrente</option>
                  <option value="poupanca">Poupança</option>
                </select>
              </div>
            </div>
          )}

          <button onClick={saveBankInfoHandler} disabled={savingBank} className="bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
            {savingBank ? 'Salvando...' : 'Salvar Dados Bancários'}
          </button>

          {affiliate.payment_method && (
            <div className="mt-4 bg-green-500/20 border border-green-500/30 p-3 rounded-lg">
              <p className="text-green-300 text-sm">Dados configurados: {affiliate.payment_method === 'pix' ? `PIX (${affiliate.pix_key})` : `Depósito (${affiliate.bank_name} - Ag: ${affiliate.bank_agency} - Cc: ${affiliate.bank_account})`}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AffiliatePageFixed;
