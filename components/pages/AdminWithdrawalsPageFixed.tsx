import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { supabase } from '../../src/lib/supabase';

interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  bankData: {
    bank: string;
    agency: string;
    account: string;
    accountType: string;
    cpf: string;
  };
  status: 'pending' | 'processing' | 'paid' | 'rejected';
  requestDate: Date;
  processedDate?: Date;
  rejectionReason?: string;
}

const AdminWithdrawalsPageFixed: React.FC = () => {
  const { platformUsers: users } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'paid' | 'rejected'>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWithdrawals = () => {
      try {
        setLoading(true);
        setError(null);
        
        const allWithdrawals: WithdrawalRequest[] = [];
        
        // Verificar se users existe e é um array
        if (!users || !Array.isArray(users)) {
          console.log('Users não disponível ainda, aguardando...');
          setLoading(false);
          return;
        }

        users.forEach(user => {
          try {
            const userWithdrawalsData = localStorage.getItem(`withdrawals_${user.id}`);
            if (userWithdrawalsData) {
              const userWithdrawals = JSON.parse(userWithdrawalsData);
              if (Array.isArray(userWithdrawals)) {
                userWithdrawals.forEach((withdrawal: any) => {
                  allWithdrawals.push({
                    ...withdrawal,
                    userId: user.id,
                    userName: user.name || 'Nome não disponível',
                    userEmail: user.email || 'Email não disponível',
                    requestDate: new Date(withdrawal.requestDate),
                    processedDate: withdrawal.processedDate ? new Date(withdrawal.processedDate) : undefined
                  });
                });
              }
            }
          } catch (userError) {
            console.error(`Erro ao carregar saques do usuário ${user.id}:`, userError);
          }
        });

        // Ordenar por data de solicitação (mais recentes primeiro)
        allWithdrawals.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime());
        setWithdrawals(allWithdrawals);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar saques:', err);
        setError('Erro ao carregar solicitações de saque');
        setLoading(false);
      }
    };

    loadWithdrawals();
  }, [users]);

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    if (filter === 'all') return true;
    return withdrawal.status === filter;
  });

  const updateWithdrawalStatus = (withdrawalId: string, newStatus: 'processing' | 'paid' | 'rejected', reason?: string) => {
    try {
      const withdrawal = withdrawals.find(w => w.id === withdrawalId);
      if (!withdrawal) return;

      // Atualizar no localStorage do usuário
      const userWithdrawalsData = localStorage.getItem(`withdrawals_${withdrawal.userId}`);
      if (userWithdrawalsData) {
        const userWithdrawals = JSON.parse(userWithdrawalsData);
        const updatedUserWithdrawals = userWithdrawals.map((w: any) => {
          if (w.id === withdrawalId) {
            return {
              ...w,
              status: newStatus,
              processedDate: new Date().toISOString(),
              rejectionReason: reason || undefined
            };
          }
          return w;
        });

        localStorage.setItem(`withdrawals_${withdrawal.userId}`, JSON.stringify(updatedUserWithdrawals));
        // SYNC COM SUPABASE
        import('../../src/lib/supabase').then(({ supabase }) => {
          supabase.from('affiliate_withdrawals').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', withdrawal.id).then(() => {});
        });
      }

      // Atualizar estado local
      setWithdrawals(prev => prev.map(w => {
        if (w.id === withdrawalId) {
          return {
            ...w,
            status: newStatus,
            processedDate: new Date(),
            rejectionReason: reason
          };
        }
        return w;
      }));

      setSelectedWithdrawal(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Erro ao atualizar status do saque:', err);
      setError('Erro ao atualizar status do saque');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'processing': return 'bg-blue-500/20 text-blue-400';
      case 'paid': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'processing': return 'Processando';
      case 'paid': return 'Pago';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const maskBankData = (data: string) => {
    if (!data || data.length <= 4) return data;
    return data.substring(0, 2) + '*'.repeat(data.length - 4) + data.substring(data.length - 2);
  };

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter(w => w.status === 'pending').length,
    processing: withdrawals.filter(w => w.status === 'processing').length,
    paid: withdrawals.filter(w => w.status === 'paid').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
    totalAmount: withdrawals.reduce((sum, w) => sum + w.amount, 0),
    paidAmount: withdrawals.filter(w => w.status === 'paid').reduce((sum, w) => sum + w.amount, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Carregando solicitações de saque...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🛡️ Gerenciar Saques
          </h1>
          <p className="text-blue-200">
            Painel administrativo para gerenciar solicitações de saque dos afiliados
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total de Solicitações</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Pendentes</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Valor Total</p>
                <p className="text-3xl font-bold text-green-400">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Já Pagos</p>
                <p className="text-3xl font-bold text-blue-400">{formatCurrency(stats.paidAmount)}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Pendentes ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('processing')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'processing' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Processando ({stats.processing})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'paid' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Pagos ({stats.paid})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Rejeitados ({stats.rejected})
            </button>
          </div>
        </div>

        {/* Lista de Saques */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Solicitações de Saque</h2>
          
          {filteredWithdrawals.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-300 text-lg">Nenhuma solicitação encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-3 px-4 text-gray-300">Usuário</th>
                    <th className="text-left py-3 px-4 text-gray-300">Valor</th>
                    <th className="text-left py-3 px-4 text-gray-300">Banco</th>
                    <th className="text-left py-3 px-4 text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 text-gray-300">Data</th>
                    <th className="text-left py-3 px-4 text-gray-300">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b border-gray-700 hover:bg-white/5">
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-white font-semibold">{withdrawal.userName}</p>
                          <p className="text-gray-400 text-sm">{withdrawal.userEmail}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-green-400 font-bold">{formatCurrency(withdrawal.amount)}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <p className="text-white">{withdrawal.bankData?.bank || 'N/A'}</p>
                          <p className="text-gray-400">Ag: {maskBankData(withdrawal.bankData?.agency || '')}</p>
                          <p className="text-gray-400">Cc: {maskBankData(withdrawal.bankData?.account || '')}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(withdrawal.status)}`}>
                          {getStatusText(withdrawal.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-gray-300 text-sm">
                          {withdrawal.requestDate.toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {withdrawal.requestDate.toLocaleTimeString('pt-BR')}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        {withdrawal.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateWithdrawalStatus(withdrawal.id, 'processing')}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              Processar
                            </button>
                            <button
                              onClick={() => setSelectedWithdrawal(withdrawal)}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                            >
                              Rejeitar
                            </button>
                          </div>
                        )}
                        {withdrawal.status === 'processing' && (
                          <button
                            onClick={() => updateWithdrawalStatus(withdrawal.id, 'paid')}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Marcar como Pago
                          </button>
                        )}
                        {withdrawal.status === 'rejected' && withdrawal.rejectionReason && (
                          <p className="text-red-400 text-xs">{withdrawal.rejectionReason}</p>
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
        {selectedWithdrawal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Rejeitar Saque</h3>
              <p className="text-gray-300 mb-4">
                Rejeitar saque de {formatCurrency(selectedWithdrawal.amount)} para {selectedWithdrawal.userName}?
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Motivo da rejeição..."
                className="w-full p-3 bg-gray-700 text-white rounded-lg mb-4 resize-none"
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (rejectionReason.trim()) {
                      updateWithdrawalStatus(selectedWithdrawal.id, 'rejected', rejectionReason);
                    }
                  }}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Confirmar Rejeição
                </button>
                <button
                  onClick={() => {
                    setSelectedWithdrawal(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWithdrawalsPageFixed;
