import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import RealAffiliateService from '../../services/realAffiliateService';
import type { AffiliateAccount, AffiliateCommission, WithdrawalRequest as WR, AffiliateSettings } from '../../services/realAffiliateService';

const svc = RealAffiliateService.getInstance();

const AdminAffiliatesPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'affiliates' | 'commissions' | 'withdrawals' | 'settings'>('overview');
  const [affiliates, setAffiliates] = useState<AffiliateAccount[]>([]);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [withdrawals, setWithdrawals] = useState<WR[]>([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState('all');
  const [adminStats, setAdminStats] = useState({ totalAffiliates: 0, activeAffiliates: 0, totalCommissions: 0, pendingCommissions: 0, totalPaid: 0, pendingWithdrawals: 0, pendingWithdrawalsAmount: 0 });
  const [settings, setSettings] = useState<AffiliateSettings>({ commission_rate: 20, min_withdrawal_amount: 50, payment_cycle_days: 7, payment_delay_days: 7, auto_approve_withdrawals: false, max_commission_per_sale: 0 });
  const [savingSettings, setSavingSettings] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [affs, comms, wds, st, sett] = await Promise.all([
        svc.getAllAffiliates(),
        svc.getAllCommissions(),
        svc.getAllWithdrawals(withdrawalFilter),
        svc.getAdminStats(),
        svc.getSettings()
      ]);
      setAffiliates(affs);
      setCommissions(comms);
      setWithdrawals(wds);
      setAdminStats(st);
      setSettings(sett);
    } catch (e) {
      console.error('Erro ao carregar dados admin:', e);
    } finally {
      setLoading(false);
    }
  }, [withdrawalFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveSettings = async () => {
    if (!user?.id) return;
    setSavingSettings(true);
    try {
      const ok = await svc.saveSettings(settings, user.id);
      if (ok) alert('Configurações salvas com sucesso!');
      else alert('Erro ao salvar configurações.');
    } catch { alert('Erro ao salvar configurações.'); }
    finally { setSavingSettings(false); }
  };

  const handleApproveWithdrawal = async (id: string) => {
    if (!user?.id) return;
    setProcessingId(id);
    try {
      const ok = await svc.approveWithdrawal(id, user.id);
      if (ok) {
        alert('Saque aprovado! Marque como pago após efetuar o pagamento.');
        await loadData();
      } else alert('Erro ao aprovar.');
    } catch { alert('Erro ao aprovar saque.'); }
    finally { setProcessingId(null); }
  };

  const handleMarkPaid = async (id: string) => {
    setProcessingId(id);
    try {
      const txnId = `TXN_${Date.now()}`;
      const ok = await svc.markWithdrawalPaid(id, txnId);
      if (ok) { alert(`Pagamento registrado! Transação: ${txnId}`); await loadData(); }
      else alert('Erro ao registrar pagamento.');
    } catch { alert('Erro ao registrar pagamento.'); }
    finally { setProcessingId(null); }
  };

  const handleRejectWithdrawal = async (id: string) => {
    if (!user?.id || !rejectReason.trim()) { alert('Informe o motivo da rejeição.'); return; }
    setProcessingId(id);
    try {
      const ok = await svc.rejectWithdrawal(id, rejectReason, user.id);
      if (ok) { alert('Saque rejeitado. Valor devolvido ao saldo do afiliado.'); setRejectingId(null); setRejectReason(''); await loadData(); }
      else alert('Erro ao rejeitar.');
    } catch { alert('Erro ao rejeitar saque.'); }
    finally { setProcessingId(null); }
  };

  const handleSuspend = async (id: string) => {
    const ok = await svc.suspendAffiliate(id);
    if (ok) { alert('Afiliado suspenso.'); await loadData(); }
  };

  const handleReactivate = async (id: string) => {
    const ok = await svc.reactivateAffiliate(id);
    if (ok) { alert('Afiliado reativado.'); await loadData(); }
  };

  const handleRunWeeklyCycle = async () => {
    setProcessingId('cycle');
    try {
      const result = await svc.runWeeklyPaymentCycle();
      alert(`Ciclo semanal executado!\n${result.confirmed} comissões confirmadas\n${result.processed} saques processados`);
      await loadData();
    } catch { alert('Erro ao executar ciclo semanal.'); }
    finally { setProcessingId(null); }
  };

  const getStatusColor = (s: string) => {
    const m: Record<string, string> = { active: 'text-green-400', inactive: 'text-gray-400', suspended: 'text-red-400', pending: 'text-yellow-400', approved: 'text-blue-400', processing: 'text-blue-400', paid: 'text-green-400', rejected: 'text-red-400', confirmed: 'text-green-300' };
    return m[s] || 'text-gray-400';
  };
  const getStatusBadge = (s: string) => {
    const m: Record<string, string> = { active: 'bg-green-500/20 border-green-500/30', inactive: 'bg-gray-500/20 border-gray-500/30', suspended: 'bg-red-500/20 border-red-500/30', pending: 'bg-yellow-500/20 border-yellow-500/30', approved: 'bg-blue-500/20 border-blue-500/30', processing: 'bg-blue-500/20 border-blue-500/30', paid: 'bg-green-500/20 border-green-500/30', rejected: 'bg-red-500/20 border-red-500/30', confirmed: 'bg-green-500/20 border-green-500/30' };
    return m[s] || 'bg-gray-500/20 border-gray-500/30';
  };
  const getStatusText = (s: string) => {
    const m: Record<string, string> = { active: 'Ativo', inactive: 'Inativo', suspended: 'Suspenso', pending: 'Pendente', approved: 'Aprovado', processing: 'Processando', paid: 'Pago', rejected: 'Rejeitado', confirmed: 'Confirmado', cancelled: 'Cancelado' };
    return m[s] || s;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="text-xl text-gray-400 animate-pulse">Carregando dados de afiliados...</div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-700 p-6 rounded-xl">
        <h1 className="text-3xl font-bold text-white mb-2">Gerenciamento de Afiliados</h1>
        <p className="text-green-100">Controle completo do programa de afiliados - dados reais do Supabase</p>
      </div>

      {/* Abas */}
      <div className="flex gap-2 flex-wrap">
        {(['overview', 'affiliates', 'commissions', 'withdrawals', 'settings'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${activeTab === tab ? 'bg-green-600 text-white' : 'bg-secondary text-gray-300 hover:bg-green-600/20'}`}>
            {tab === 'overview' && 'Visão Geral'}
            {tab === 'affiliates' && `Afiliados (${affiliates.length})`}
            {tab === 'commissions' && `Comissões (${commissions.length})`}
            {tab === 'withdrawals' && `Saques (${withdrawals.length})`}
            {tab === 'settings' && 'Configurações'}
          </button>
        ))}
      </div>

      {/* ──── VISÃO GERAL ──── */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-secondary p-5 rounded-lg border border-gray-700">
              <div className="text-sm text-green-400 font-semibold mb-1">Afiliados Ativos</div>
              <div className="text-2xl font-bold text-white">{adminStats.activeAffiliates} / {adminStats.totalAffiliates}</div>
            </div>
            <div className="bg-secondary p-5 rounded-lg border border-gray-700">
              <div className="text-sm text-blue-400 font-semibold mb-1">Total Comissões</div>
              <div className="text-2xl font-bold text-white">R$ {adminStats.totalCommissions.toFixed(2)}</div>
            </div>
            <div className="bg-secondary p-5 rounded-lg border border-gray-700">
              <div className="text-sm text-yellow-400 font-semibold mb-1">Comissões Pendentes</div>
              <div className="text-2xl font-bold text-white">R$ {adminStats.pendingCommissions.toFixed(2)}</div>
            </div>
            <div className="bg-secondary p-5 rounded-lg border border-gray-700">
              <div className="text-sm text-purple-400 font-semibold mb-1">Total Pago</div>
              <div className="text-2xl font-bold text-white">R$ {adminStats.totalPaid.toFixed(2)}</div>
            </div>
          </div>

          {adminStats.pendingWithdrawals > 0 && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 p-4 rounded-lg">
              <p className="text-yellow-300 font-semibold">{adminStats.pendingWithdrawals} saque(s) pendente(s) totalizando R$ {adminStats.pendingWithdrawalsAmount.toFixed(2)}</p>
              <button onClick={() => setActiveTab('withdrawals')} className="text-yellow-200 underline text-sm mt-1">Ver saques pendentes</button>
            </div>
          )}

          <div className="bg-secondary p-5 rounded-lg border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-3">Ciclo Semanal de Pagamento</h3>
            <p className="text-gray-400 text-sm mb-4">Confirma comissões elegíveis e processa saques aprovados. Executar manualmente ou configurar via cron job.</p>
            <button onClick={handleRunWeeklyCycle} disabled={processingId === 'cycle'} className="bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50">
              {processingId === 'cycle' ? 'Processando...' : 'Executar Ciclo Semanal Agora'}
            </button>
          </div>
        </>
      )}

      {/* ──── AFILIADOS ──── */}
      {activeTab === 'affiliates' && (
        <div className="bg-secondary p-5 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Todos os Afiliados</h2>
          {affiliates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum afiliado cadastrado ainda.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase bg-primary">
                  <tr>
                    <th className="p-3">Nome</th>
                    <th className="p-3">Código</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Comissão</th>
                    <th className="p-3">Ganhos</th>
                    <th className="p-3">Saldo Disp.</th>
                    <th className="p-3">Indicações</th>
                    <th className="p-3">Pagamento</th>
                    <th className="p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map(a => (
                    <tr key={a.id} className="border-t border-gray-700">
                      <td className="p-3">
                        <div className="text-white font-semibold">{a.name}</div>
                        <div className="text-xs text-gray-500">{a.email}</div>
                      </td>
                      <td className="p-3 text-gray-300 font-mono text-xs">{a.referral_code}</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusBadge(a.status)} ${getStatusColor(a.status)}`}>{getStatusText(a.status)}</span></td>
                      <td className="p-3 text-white">{a.commission_rate}%</td>
                      <td className="p-3 text-green-400 font-semibold">R$ {(a.total_earnings || 0).toFixed(2)}</td>
                      <td className="p-3 text-blue-400">R$ {(a.available_balance || 0).toFixed(2)}</td>
                      <td className="p-3 text-white">{a.total_referrals || 0}</td>
                      <td className="p-3 text-gray-300 text-xs">{a.payment_method === 'pix' ? `PIX` : a.payment_method === 'deposit' ? 'Depósito' : 'Não config.'}</td>
                      <td className="p-3">
                        {a.status === 'active' ? (
                          <button onClick={() => handleSuspend(a.id!)} className="text-red-400 hover:text-red-300 text-xs font-semibold">Suspender</button>
                        ) : (
                          <button onClick={() => handleReactivate(a.id!)} className="text-green-400 hover:text-green-300 text-xs font-semibold">Reativar</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ──── COMISSÕES ──── */}
      {activeTab === 'commissions' && (
        <div className="bg-secondary p-5 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Todas as Comissões</h2>
          {commissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma comissão registrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase bg-primary">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Afiliado</th>
                    <th className="p-3">Produto</th>
                    <th className="p-3">Valor Venda</th>
                    <th className="p-3">Taxa</th>
                    <th className="p-3">Comissão</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Elegível em</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map(c => (
                    <tr key={c.id} className="border-t border-gray-700">
                      <td className="p-3 text-gray-300">{new Date(c.sale_date).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3 text-white text-xs">{c.affiliate_id?.slice(0, 8)}...</td>
                      <td className="p-3 text-white">{c.product_name || 'Assinatura'}</td>
                      <td className="p-3 text-gray-300">R$ {c.sale_amount.toFixed(2)}</td>
                      <td className="p-3 text-gray-300">{c.commission_rate}%</td>
                      <td className="p-3 text-green-400 font-bold">R$ {c.commission_value.toFixed(2)}</td>
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

      {/* ──── SAQUES ──── */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'approved', 'paid', 'rejected'].map(f => (
              <button key={f} onClick={() => setWithdrawalFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${withdrawalFilter === f ? 'bg-green-600 text-white' : 'bg-primary text-gray-300 border border-gray-600'}`}>
                {f === 'all' ? 'Todos' : getStatusText(f)}
              </button>
            ))}
          </div>

          <div className="bg-secondary p-5 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Solicitações de Saque</h2>
            {withdrawals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum saque com este filtro.</div>
            ) : (
              <div className="space-y-4">
                {withdrawals.map(w => (
                  <div key={w.id} className="bg-primary/50 p-5 rounded-lg border border-gray-600">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="text-xl font-bold text-white">R$ {w.amount.toFixed(2)}</div>
                        <div className="text-sm text-gray-300">{w.affiliate_name} ({w.affiliate_email})</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Solicitado: {new Date(w.request_date).toLocaleDateString('pt-BR')} | Via: {w.payment_method === 'pix' ? `PIX (${w.pix_key || ''})` : `Depósito (${w.bank_info || ''})`}
                        </div>
                        {w.paid_date && <div className="text-xs text-green-400">Pago em: {new Date(w.paid_date).toLocaleDateString('pt-BR')}</div>}
                        {w.transaction_id && <div className="text-xs text-gray-500 font-mono">Transação: {w.transaction_id}</div>}
                        {w.rejected_reason && <div className="text-xs text-red-400">Motivo: {w.rejected_reason}</div>}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(w.status)} ${getStatusColor(w.status)}`}>{getStatusText(w.status)}</span>
                        <div className="flex gap-2">
                          {w.status === 'pending' && (
                            <>
                              <button onClick={() => handleApproveWithdrawal(w.id!)} disabled={processingId === w.id} className="bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50">
                                {processingId === w.id ? '...' : 'Aprovar'}
                              </button>
                              {rejectingId === w.id ? (
                                <div className="flex gap-1">
                                  <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Motivo" className="bg-primary text-white text-xs p-1.5 rounded border border-gray-600 w-32" />
                                  <button onClick={() => handleRejectWithdrawal(w.id!)} disabled={processingId === w.id} className="bg-red-600 text-white text-xs px-2 py-1.5 rounded">OK</button>
                                  <button onClick={() => { setRejectingId(null); setRejectReason(''); }} className="text-gray-400 text-xs px-2 py-1.5">X</button>
                                </div>
                              ) : (
                                <button onClick={() => setRejectingId(w.id!)} className="bg-red-600/20 text-red-400 text-xs font-semibold px-3 py-1.5 rounded hover:bg-red-600/40 border border-red-500/30">
                                  Rejeitar
                                </button>
                              )}
                            </>
                          )}
                          {w.status === 'approved' && (
                            <button onClick={() => handleMarkPaid(w.id!)} disabled={processingId === w.id} className="bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50">
                              {processingId === w.id ? '...' : 'Marcar como Pago'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──── CONFIGURAÇÕES ──── */}
      {activeTab === 'settings' && (
        <div className="bg-secondary p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-6">Configurações do Programa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-300 mb-2 font-semibold">Taxa de Comissão (%)</label>
              <input type="number" value={settings.commission_rate} onChange={e => setSettings({ ...settings, commission_rate: Number(e.target.value) })} className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white" min={1} max={100} />
              <p className="text-xs text-gray-500 mt-1">Percentual global de comissão para afiliados</p>
            </div>
            <div>
              <label className="block text-gray-300 mb-2 font-semibold">Valor Mínimo para Saque (R$)</label>
              <input type="number" value={settings.min_withdrawal_amount} onChange={e => setSettings({ ...settings, min_withdrawal_amount: Number(e.target.value) })} className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white" min={1} />
              <p className="text-xs text-gray-500 mt-1">Valor mínimo que o afiliado precisa ter para solicitar saque</p>
            </div>
            <div>
              <label className="block text-gray-300 mb-2 font-semibold">Ciclo de Pagamento (dias)</label>
              <input type="number" value={settings.payment_cycle_days} onChange={e => setSettings({ ...settings, payment_cycle_days: Number(e.target.value) })} className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white" min={1} />
              <p className="text-xs text-gray-500 mt-1">Período de acumulação de vendas (7 = semanal)</p>
            </div>
            <div>
              <label className="block text-gray-300 mb-2 font-semibold">Prazo para Pagamento (dias)</label>
              <input type="number" value={settings.payment_delay_days} onChange={e => setSettings({ ...settings, payment_delay_days: Number(e.target.value) })} className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white" min={1} />
              <p className="text-xs text-gray-500 mt-1">Dias após o ciclo para liberar pagamento (7 = 1 semana)</p>
            </div>
            <div>
              <label className="block text-gray-300 mb-2 font-semibold">Teto de Comissão por Venda (R$)</label>
              <input type="number" value={settings.max_commission_per_sale} onChange={e => setSettings({ ...settings, max_commission_per_sale: Number(e.target.value) })} className="w-full bg-primary p-3 rounded-lg border border-gray-600 text-white" min={0} />
              <p className="text-xs text-gray-500 mt-1">0 = sem teto. Define valor máximo de comissão por venda</p>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="autoApprove" checked={settings.auto_approve_withdrawals} onChange={e => setSettings({ ...settings, auto_approve_withdrawals: e.target.checked })} className="w-5 h-5 rounded" />
              <label htmlFor="autoApprove" className="text-gray-300 font-semibold">Aprovar saques automaticamente</label>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button onClick={handleSaveSettings} disabled={savingSettings} className="bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50">
              {savingSettings ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>

          <div className="mt-6 bg-primary/50 p-4 rounded-lg border border-gray-600">
            <h3 className="text-white font-semibold mb-2">Resumo do Ciclo</h3>
            <p className="text-gray-400 text-sm">
              Comissão: <span className="text-white font-bold">{settings.commission_rate}%</span> |
              Ciclo: <span className="text-white font-bold">{settings.payment_cycle_days} dias</span> de vendas +
              <span className="text-white font-bold"> {settings.payment_delay_days} dias</span> para pagamento |
              Saque mínimo: <span className="text-white font-bold">R$ {settings.min_withdrawal_amount.toFixed(2)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAffiliatesPage;
