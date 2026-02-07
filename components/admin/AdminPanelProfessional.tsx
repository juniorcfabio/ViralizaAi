// 🖥️ PAINEL ADMIN PROFISSIONAL - CONTROLE TOTAL DA PLATAFORMA
import React, { useState, useEffect } from 'react';
import RealTimeDashboard from './RealTimeDashboard';
import GlobalInfrastructureDashboard from './GlobalInfrastructureDashboard';
import EmpireMonitoringDashboard from './EmpireMonitoringDashboard';

interface User {
  userId: string;
  email: string;
  name: string;
  plan: string;
  planStatus: string;
  planExpiresAt: string;
  dailyUsage: number;
  monthlyUsage: {
    aiGenerations: number;
    videos: number;
    ebooks: number;
  };
  totalSpent: number;
  daysUntilExpiry: number;
  planDetails: {
    name: string;
    price: number;
  };
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: string;
  userId: string;
  userEmail: string;
  planType: string;
  systemStatus: string;
}

interface Stats {
  users: {
    total: number;
    active: number;
    blocked: number;
    expired: number;
    newUsers: number;
  };
  revenue: {
    totalRevenue: number;
    monthlyRevenue: number;
    dailyRevenue: number;
  };
  usage: {
    totalToolsUsed: number;
    todayTools: number;
  };
}

const AdminPanelProfessional: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('empire');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const ADMIN_KEY = "super_chave_admin_123"; // EM PRODUÇÃO: usar variável de ambiente

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadPayments(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const loadPayments = async () => {
    try {
      const response = await fetch('/api/admin/payments', {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      const data = await response.json();
      if (data.success) {
        setPayments(data.payments);
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const blockUser = async (userId: string, reason: string) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/block-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_KEY
        },
        body: JSON.stringify({
          userId,
          action: 'block',
          reason
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Usuário ${userId} bloqueado com sucesso!`);
        await loadUsers();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao bloquear usuário:', error);
      alert('Erro ao bloquear usuário');
    } finally {
      setActionLoading(false);
    }
  };

  const changePlan = async (userId: string, newPlan: string, reason: string) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_KEY
        },
        body: JSON.stringify({
          userId,
          planType: newPlan,
          reason
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Plano alterado para ${data.changes.newPlan.name}!`);
        await loadUsers();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao alterar plano:', error);
      alert('Erro ao alterar plano');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'blocked': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium': return 'text-purple-600 bg-purple-100';
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'mensal': return 'text-blue-600 bg-blue-100';
      case 'free': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-lg">Carregando painel admin...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🔒 Painel Administrativo</h1>
              <p className="text-gray-600">Controle total da plataforma ViralizaAI</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadAllData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                🔄 Atualizar
              </button>
              <div className="text-sm text-gray-500">
                Último update: {new Date().toLocaleTimeString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'empire', name: '👑 Império', icon: '👑' },
              { id: 'overview', name: '📊 Visão Geral', icon: '📊' },
              { id: 'realtime', name: '📈 Tempo Real', icon: '📈' },
              { id: 'global', name: '🌍 Global', icon: '🌍' },
              { id: 'users', name: '👥 Usuários', icon: '👥' },
              { id: 'payments', name: '💳 Pagamentos', icon: '💳' },
              { id: 'actions', name: '⚡ Ações', icon: '⚡' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* EMPIRE TAB */}
        {activeTab === 'empire' && (
          <EmpireMonitoringDashboard />
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* CARDS DE ESTATÍSTICAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Usuários</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.users.total}</p>
                    <p className="text-sm text-green-600">+{stats.users.newUsers} novos</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Usuários Ativos</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.users.active}</p>
                    <p className="text-sm text-gray-600">{stats.users.blocked} bloqueados</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Receita Total</p>
                    <p className="text-2xl font-semibold text-gray-900">R$ {stats.revenue.totalRevenue.toFixed(2)}</p>
                    <p className="text-sm text-green-600">R$ {stats.revenue.dailyRevenue.toFixed(2)} hoje</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🛠️</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Ferramentas Usadas</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.usage.totalToolsUsed}</p>
                    <p className="text-sm text-blue-600">{stats.usage.todayTools} hoje</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REAL TIME TAB */}
        {activeTab === 'realtime' && (
          <RealTimeDashboard />
        )}

        {/* GLOBAL TAB */}
        {activeTab === 'global' && (
          <GlobalInfrastructureDashboard />
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">👥 Gerenciar Usuários ({users.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uso Diário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expira em</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">{user.userId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(user.plan)}`}>
                          {user.planDetails.name}
                        </span>
                        <div className="text-xs text-gray-500">R$ {user.planDetails.price}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.planStatus)}`}>
                          {user.planStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.dailyUsage}
                        <div className="text-xs text-gray-500">
                          IA: {user.monthlyUsage.aiGenerations} | Vídeos: {user.monthlyUsage.videos}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.daysUntilExpiry} dias
                        <div className="text-xs text-gray-500">
                          {new Date(user.planExpiresAt).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          ⚡ Ações
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">💳 Histórico de Pagamentos ({payments.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {payment.id.substring(0, 20)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payment.userEmail}</div>
                        <div className="text-xs text-gray-500">{payment.userId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        R$ {payment.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(payment.planType)}`}>
                          {payment.planType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payment.created).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ACTIONS TAB */}
        {activeTab === 'actions' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">⚡ Ações Administrativas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={loadAllData}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="text-lg">🔄</div>
                  <div className="font-medium">Atualizar Dados</div>
                  <div className="text-sm text-gray-500">Recarregar todas as informações</div>
                </button>
                
                <button
                  onClick={() => alert('Funcionalidade em desenvolvimento')}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="text-lg">📊</div>
                  <div className="font-medium">Relatório Completo</div>
                  <div className="text-sm text-gray-500">Gerar relatório detalhado</div>
                </button>
                
                <button
                  onClick={() => alert('Funcionalidade em desenvolvimento')}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="text-lg">📧</div>
                  <div className="font-medium">Notificar Usuários</div>
                  <div className="text-sm text-gray-500">Enviar notificações em massa</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE AÇÕES DO USUÁRIO */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Ações para {selectedUser.name}
            </h3>
            
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Plano:</strong> {selectedUser.planDetails.name}</p>
                <p><strong>Status:</strong> {selectedUser.planStatus}</p>
              </div>
              
              <div className="space-y-2">
                {selectedUser.planStatus !== 'blocked' && (
                  <button
                    onClick={() => {
                      const reason = prompt('Motivo do bloqueio:');
                      if (reason) {
                        blockUser(selectedUser.userId, reason);
                        setSelectedUser(null);
                      }
                    }}
                    disabled={actionLoading}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    🚫 Bloquear Usuário
                  </button>
                )}
                
                <button
                  onClick={() => {
                    const newPlan = prompt('Novo plano (free, mensal, gold, premium):');
                    if (newPlan && ['free', 'mensal', 'gold', 'premium'].includes(newPlan)) {
                      const reason = prompt('Motivo da alteração:') || 'Alteração manual';
                      changePlan(selectedUser.userId, newPlan, reason);
                      setSelectedUser(null);
                    } else if (newPlan) {
                      alert('Plano inválido!');
                    }
                  }}
                  disabled={actionLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  🔄 Alterar Plano
                </button>
              </div>
              
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanelProfessional;
