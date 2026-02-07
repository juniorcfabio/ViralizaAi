// =======================
// 🛠️ PAINEL ADMIN - CONTROLE TOTAL
// =======================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';

interface User {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  plan: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  lastLogin?: string;
  usage: {
    posts: number;
    videos: number;
    analytics: number;
  };
}

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  apiCalls: number;
  errorRate: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    systemHealth: 'healthy',
    apiCalls: 0,
    errorRate: 0
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Verificar se é admin
  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen bg-red-900 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">🚫 Acesso Negado</h1>
          <p className="text-gray-600">Apenas administradores podem acessar este painel.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Simular carregamento de dados admin
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@email.com',
          cpf: '123.456.789-00',
          plan: 'anual',
          status: 'active',
          createdAt: '2024-01-15',
          lastLogin: '2024-01-28',
          usage: { posts: 150, videos: 45, analytics: 200 }
        },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria@email.com',
          plan: 'mensal',
          status: 'active',
          createdAt: '2024-01-20',
          lastLogin: '2024-01-27',
          usage: { posts: 80, videos: 20, analytics: 100 }
        },
        {
          id: '3',
          name: 'Pedro Costa',
          email: 'pedro@email.com',
          plan: 'trimestral',
          status: 'suspended',
          createdAt: '2024-01-10',
          lastLogin: '2024-01-25',
          usage: { posts: 300, videos: 100, analytics: 500 }
        }
      ];

      const mockMetrics: SystemMetrics = {
        totalUsers: 1247,
        activeUsers: 892,
        totalRevenue: 45780.50,
        systemHealth: 'healthy',
        apiCalls: 125000,
        errorRate: 0.02
      };

      setUsers(mockUsers);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Erro ao carregar dados admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'delete' | 'resetLimits') => {
    setLoading(true);
    try {
      console.log(`Executando ação ${action} para usuário ${userId}`);
      
      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          switch (action) {
            case 'suspend':
              return { ...u, status: 'suspended' as const };
            case 'activate':
              return { ...u, status: 'active' as const };
            case 'resetLimits':
              return { ...u, usage: { posts: 0, videos: 0, analytics: 0 } };
            default:
              return u;
          }
        }
        return u;
      }));

      if (action === 'delete') {
        setUsers(prev => prev.filter(u => u.id !== userId));
      }

      alert(`Ação ${action} executada com sucesso!`);
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      alert('Erro ao executar ação');
    } finally {
      setLoading(false);
    }
  };

  const changePlan = async (userId: string, newPlan: string) => {
    setLoading(true);
    try {
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, plan: newPlan } : u
      ));
      alert(`Plano alterado para ${newPlan} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar plano:', error);
      alert('Erro ao alterar plano');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">🛠️ Painel Administrativo</h1>
              <p className="text-gray-600">Controle total do sistema ViralizaAI</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Logado como:</p>
              <p className="font-bold text-gray-800">{user.name}</p>
            </div>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total de Usuários</p>
                <p className="text-3xl font-bold">{metrics.totalUsers.toLocaleString()}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-green-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Usuários Ativos</p>
                <p className="text-3xl font-bold">{metrics.activeUsers.toLocaleString()}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-purple-600 text-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Receita Total</p>
                <p className="text-3xl font-bold">R$ {metrics.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          <div className={`${metrics.systemHealth === 'healthy' ? 'bg-green-600' : 'bg-red-600'} text-white rounded-xl p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Status Sistema</p>
                <p className="text-xl font-bold">{metrics.systemHealth === 'healthy' ? 'Saudável' : 'Crítico'}</p>
              </div>
              <div className="text-4xl">{metrics.systemHealth === 'healthy' ? '💚' : '🚨'}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-2xl mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: '📊 Visão Geral', icon: '📊' },
                { id: 'users', label: '👥 Usuários', icon: '👥' },
                { id: 'system', label: '⚙️ Sistema', icon: '⚙️' },
                { id: 'logs', label: '📋 Logs', icon: '📋' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Tab: Visão Geral */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">📊 Dashboard Executivo</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Performance APIs</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Chamadas API (24h):</span>
                        <span className="font-bold">{metrics.apiCalls.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa de Erro:</span>
                        <span className="font-bold text-green-600">{(metrics.errorRate * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uptime:</span>
                        <span className="font-bold text-green-600">99.95%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">💳 Receita por Plano</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Mensal:</span>
                        <span className="font-bold">R$ 15.780</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trimestral:</span>
                        <span className="font-bold">R$ 12.450</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Anual:</span>
                        <span className="font-bold">R$ 17.550</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Usuários */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">👥 Gerenciamento de Usuários</h2>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    + Novo Usuário
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left">Nome</th>
                        <th className="px-4 py-3 text-left">Email</th>
                        <th className="px-4 py-3 text-left">Plano</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Último Login</th>
                        <th className="px-4 py-3 text-left">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{user.name}</td>
                          <td className="px-4 py-3">{user.email}</td>
                          <td className="px-4 py-3">
                            <select 
                              value={user.plan}
                              onChange={(e) => changePlan(user.id, e.target.value)}
                              className="border rounded px-2 py-1"
                            >
                              <option value="mensal">Mensal</option>
                              <option value="trimestral">Trimestral</option>
                              <option value="semestral">Semestral</option>
                              <option value="anual">Anual</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' :
                              user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">{user.lastLogin || 'Nunca'}</td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              {user.status === 'active' ? (
                                <button 
                                  onClick={() => handleUserAction(user.id, 'suspend')}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Suspender
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleUserAction(user.id, 'activate')}
                                  className="text-green-600 hover:text-green-800 text-sm"
                                >
                                  Ativar
                                </button>
                              )}
                              <button 
                                onClick={() => handleUserAction(user.id, 'resetLimits')}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Reset
                              </button>
                              <button 
                                onClick={() => setSelectedUser(user)}
                                className="text-purple-600 hover:text-purple-800 text-sm"
                              >
                                Detalhes
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Sistema */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">⚙️ Controle do Sistema</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">🔄 Operações</h3>
                    <div className="space-y-3">
                      <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                        🔄 Reiniciar Serviços
                      </button>
                      <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                        🧹 Limpar Cache
                      </button>
                      <button className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700">
                        📊 Gerar Relatório
                      </button>
                      <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                        💾 Backup Manual
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Monitoramento</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>CPU:</span>
                        <span className="font-bold text-green-600">45%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Memória:</span>
                        <span className="font-bold text-yellow-600">68%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Disco:</span>
                        <span className="font-bold text-green-600">32%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rede:</span>
                        <span className="font-bold text-green-600">15 MB/s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Logs */}
            {activeTab === 'logs' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">📋 Logs do Sistema</h2>
                
                <div className="bg-black text-green-400 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                  <div>[2024-01-28 18:57:23] INFO: Sistema iniciado com sucesso</div>
                  <div>[2024-01-28 18:57:24] INFO: Database conectado - PostgreSQL</div>
                  <div>[2024-01-28 18:57:25] INFO: Redis cache ativo</div>
                  <div>[2024-01-28 18:57:26] INFO: API Gateway rodando na porta 3001</div>
                  <div>[2024-01-28 18:57:27] INFO: Auth Service ativo</div>
                  <div>[2024-01-28 18:57:28] INFO: Billing Service conectado ao Stripe</div>
                  <div>[2024-01-28 18:57:29] INFO: Tools Service processando filas</div>
                  <div>[2024-01-28 18:57:30] INFO: Analytics Service coletando métricas</div>
                  <div>[2024-01-28 18:57:31] INFO: Notifications Service ativo</div>
                  <div>[2024-01-28 18:57:32] INFO: Health check: Todos os serviços OK</div>
                  <div>[2024-01-28 18:57:33] INFO: Auto-scaling: 3 instâncias ativas</div>
                  <div>[2024-01-28 18:57:34] INFO: Cloudflare CDN: Cache hit ratio 95%</div>
                  <div>[2024-01-28 18:57:35] INFO: Load balancer: Distribuindo carga</div>
                  <div>[2024-01-28 18:57:36] WARN: Rate limit atingido para IP 192.168.1.100</div>
                  <div>[2024-01-28 18:57:37] INFO: Backup automático concluído</div>
                  <div>[2024-01-28 18:57:38] INFO: Monitoramento 24/7 ativo</div>
                  <div className="text-yellow-400">[2024-01-28 18:57:39] LIVE: Sistema funcionando perfeitamente ✅</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Detalhes do Usuário */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">👤 Detalhes do Usuário</h3>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Informações Pessoais</h4>
                  <div className="space-y-2">
                    <p><strong>Nome:</strong> {selectedUser.name}</p>
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                    <p><strong>CPF:</strong> {selectedUser.cpf || 'Não informado'}</p>
                    <p><strong>Plano:</strong> {selectedUser.plan}</p>
                    <p><strong>Status:</strong> {selectedUser.status}</p>
                    <p><strong>Criado em:</strong> {selectedUser.createdAt}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Uso da Plataforma</h4>
                  <div className="space-y-2">
                    <p><strong>Posts criados:</strong> {selectedUser.usage.posts}</p>
                    <p><strong>Vídeos gerados:</strong> {selectedUser.usage.videos}</p>
                    <p><strong>Análises feitas:</strong> {selectedUser.usage.analytics}</p>
                    <p><strong>Último login:</strong> {selectedUser.lastLogin || 'Nunca'}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Fechar
                </button>
                <button 
                  onClick={() => handleUserAction(selectedUser.id, 'resetLimits')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Reset Limites
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Processando...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
