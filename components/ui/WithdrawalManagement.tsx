import React, { useState, useEffect } from 'react';
import AffiliatePaymentService, { WithdrawalRequest } from '../../services/affiliatePaymentService';

interface WithdrawalManagementProps {
  adminId: string;
}

const WithdrawalManagement: React.FC<WithdrawalManagementProps> = ({ adminId }) => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid' | 'rejected'>('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const paymentService = AffiliatePaymentService.getInstance();

  useEffect(() => {
    loadWithdrawals();
  }, [filter]);

  const loadWithdrawals = () => {
    const allWithdrawals = paymentService.getAllWithdrawalRequests();
    
    let filtered = allWithdrawals;
    if (filter !== 'all') {
      filtered = allWithdrawals.filter(w => w.status === filter);
    }

    // Ordenar por data mais recente
    filtered.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    
    setWithdrawals(filtered);
  };

  const handleApprove = async (requestId: string) => {
    setIsLoading(true);
    try {
      const success = await paymentService.approveWithdrawal(requestId, adminId);
      if (success) {
        alert('✅ Saque aprovado e pagamento processado automaticamente!');
        loadWithdrawals();
      } else {
        alert('❌ Erro ao aprovar saque. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ Erro ao aprovar saque:', error);
      alert('❌ Erro ao aprovar saque. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (!selectedWithdrawal || !rejectionReason.trim()) {
      alert('❌ Informe o motivo da rejeição');
      return;
    }

    const success = paymentService.rejectWithdrawal(
      selectedWithdrawal.id,
      rejectionReason,
      adminId
    );

    if (success) {
      alert('❌ Saque rejeitado com sucesso');
      loadWithdrawals();
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedWithdrawal(null);
    } else {
      alert('❌ Erro ao rejeitar saque. Tente novamente.');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      approved: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      paid: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      processing: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };

    const labels = {
      pending: '⏳ Pendente',
      approved: '✅ Aprovado',
      paid: '💰 Pago',
      rejected: '❌ Rejeitado',
      processing: '🔄 Processando'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const stats = paymentService.getPaymentStats();

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-secondary rounded-lg p-4 border border-accent/20">
          <div className="text-2xl font-bold text-green-400">{formatCurrency(stats.totalPaid)}</div>
          <div className="text-sm text-gray-300">Total Pago</div>
        </div>
        <div className="bg-secondary rounded-lg p-4 border border-accent/20">
          <div className="text-2xl font-bold text-yellow-400">{formatCurrency(stats.totalPending)}</div>
          <div className="text-sm text-gray-300">Pendente</div>
        </div>
        <div className="bg-secondary rounded-lg p-4 border border-accent/20">
          <div className="text-2xl font-bold text-blue-400">{stats.totalRequests}</div>
          <div className="text-sm text-gray-300">Total Solicitações</div>
        </div>
        <div className="bg-secondary rounded-lg p-4 border border-accent/20">
          <div className="text-2xl font-bold text-purple-400">{formatCurrency(stats.averageAmount)}</div>
          <div className="text-sm text-gray-300">Valor Médio</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'pending', label: 'Pendentes' },
          { key: 'approved', label: 'Aprovados' },
          { key: 'paid', label: 'Pagos' },
          { key: 'rejected', label: 'Rejeitados' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === key
                ? 'bg-accent text-white'
                : 'bg-secondary text-gray-300 hover:bg-accent/20'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista de Saques */}
      <div className="bg-secondary rounded-lg border border-accent/20 overflow-hidden">
        <div className="p-4 border-b border-accent/20">
          <h3 className="text-lg font-semibold text-light">
            💸 Gerenciar Saques ({withdrawals.length})
          </h3>
        </div>

        {withdrawals.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-4xl mb-4">📭</div>
            <p>Nenhuma solicitação de saque encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary/50">
                <tr>
                  <th className="text-left p-4 text-gray-300 font-medium">Afiliado</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Valor</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Data</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Dados Bancários</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-b border-accent/10 hover:bg-primary/20">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-light">{withdrawal.affiliateName}</div>
                        <div className="text-sm text-gray-400">{withdrawal.affiliateEmail}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-green-400 text-lg">
                        {formatCurrency(withdrawal.amount)}
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">
                      {formatDate(withdrawal.requestDate)}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(withdrawal.status)}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-300">
                        <div><strong>Banco:</strong> {withdrawal.bankingData.bank}</div>
                        <div><strong>Ag:</strong> {withdrawal.bankingData.agency}</div>
                        <div><strong>Conta:</strong> {withdrawal.bankingData.account}</div>
                        {withdrawal.bankingData.pixKey && (
                          <div><strong>PIX:</strong> {withdrawal.bankingData.pixKey}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {withdrawal.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(withdrawal.id)}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            ✅ Aprovar
                          </button>
                          <button
                            onClick={() => handleReject(withdrawal)}
                            disabled={isLoading}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            ❌ Rejeitar
                          </button>
                        </div>
                      )}
                      {withdrawal.status === 'paid' && withdrawal.transactionId && (
                        <div className="text-xs text-gray-400">
                          ID: {withdrawal.transactionId}
                        </div>
                      )}
                      {withdrawal.status === 'rejected' && withdrawal.rejectionReason && (
                        <div className="text-xs text-red-400">
                          {withdrawal.rejectionReason}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Rejeição */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-secondary rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-light mb-4">
                ❌ Rejeitar Saque
              </h3>
              <p className="text-gray-300 mb-4">
                Informe o motivo da rejeição para <strong>{selectedWithdrawal?.affiliateName}</strong>:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-primary border border-accent/30 rounded-lg px-4 py-3 text-light focus:border-accent focus:outline-none resize-none"
                rows={4}
                placeholder="Ex: Dados bancários incompletos, documentação pendente..."
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setSelectedWithdrawal(null);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmReject}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Confirmar Rejeição
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalManagement;
