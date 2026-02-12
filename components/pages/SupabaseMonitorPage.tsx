/**
 * PÁGINA DE MONITORAMENTO DO SUPABASE
 * Permite verificar se todos os dados estão sendo salvos no PostgreSQL
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/autoSupabaseIntegration';

interface TableStats {
  tableName: string;
  count: number;
  lastUpdate: string;
  status: 'success' | 'error' | 'loading';
}

const SupabaseMonitorPage: React.FC = () => {
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [lastSync, setLastSync] = useState<string>('');
  const [realTimeData, setRealTimeData] = useState<any[]>([]);

  // Verificar conexão com Supabase
  const checkConnection = async () => {
    try {
      setConnectionStatus('checking');
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        console.error('❌ Erro de conexão Supabase:', error);
        setConnectionStatus('disconnected');
      } else {
        console.log('✅ Conexão Supabase OK');
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar conexão:', error);
      setConnectionStatus('disconnected');
    }
  };

  // Obter estatísticas das tabelas
  const getTableStats = async () => {
    const tables = [
      'users', 'user_profiles', 'user_access', 'payments', 'purchases', 'subscriptions', 
      'plans', 'products', 'affiliates', 'affiliate_payments', 'affiliate_withdrawals', 
      'generated_content', 'activity_logs', 'dashboard_data', 'campaigns', 'referrals', 
      'stripe_sessions', 'system_settings', 'user_files'
    ];
    const stats: TableStats[] = [];

    for (const tableName of tables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          stats.push({
            tableName,
            count: 0,
            lastUpdate: 'Erro',
            status: 'error'
          });
        } else {
          // Obter último registro
          const { data: lastRecord } = await supabase
            .from(tableName)
            .select('created_at, updated_at')
            .order('created_at', { ascending: false })
            .limit(1);

          const lastUpdate = lastRecord?.[0]?.updated_at || lastRecord?.[0]?.created_at || 'N/A';

          stats.push({
            tableName,
            count: count || 0,
            lastUpdate: lastUpdate ? new Date(lastUpdate).toLocaleString('pt-BR') : 'N/A',
            status: 'success'
          });
        }
      } catch (error) {
        console.error(`❌ Erro ao obter stats da tabela ${tableName}:`, error);
        stats.push({
          tableName,
          count: 0,
          lastUpdate: 'Erro',
          status: 'error'
        });
      }
    }

    setTableStats(stats);
    setLastSync(new Date().toLocaleString('pt-BR'));
  };

  // Testar inserção de dados
  const testDataInsertion = async () => {
    try {
      console.log('🧪 Testando inserção de dados...');
      
      // Testar log de atividade
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: 'test_user',
          action: 'monitor_test',
          details: {
            timestamp: new Date().toISOString(),
            test: true,
            message: 'Teste de monitoramento do Supabase'
          },
          ip_address: 'localhost',
          user_agent: navigator.userAgent
        })
        .select();

      if (error) {
        console.error('❌ Erro no teste de inserção:', error);
        alert('❌ Erro ao testar inserção: ' + error.message);
      } else {
        console.log('✅ Teste de inserção bem-sucedido:', data);
        alert('✅ Teste de inserção realizado com sucesso!');
        getTableStats(); // Atualizar estatísticas
      }
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      alert('❌ Erro no teste: ' + error);
    }
  };

  // Obter dados em tempo real
  const getRealTimeData = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Erro ao obter dados em tempo real:', error);
      } else {
        setRealTimeData(data || []);
      }
    } catch (error) {
      console.error('❌ Erro ao obter dados em tempo real:', error);
    }
  };

  // Limpar dados de teste
  const clearTestData = async () => {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('user_id', 'test_user');

      if (error) {
        console.error('❌ Erro ao limpar dados de teste:', error);
        alert('❌ Erro ao limpar dados de teste: ' + error.message);
      } else {
        console.log('✅ Dados de teste limpos');
        alert('✅ Dados de teste removidos com sucesso!');
        getTableStats();
        getRealTimeData();
      }
    } catch (error) {
      console.error('❌ Erro ao limpar dados:', error);
    }
  };

  useEffect(() => {
    checkConnection();
    getTableStats();
    getRealTimeData();

    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      getTableStats();
      getRealTimeData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔍 Monitor Supabase/PostgreSQL
          </h1>
          <p className="text-gray-600">
            Monitore se todos os dados estão sendo salvos corretamente no banco de dados
          </p>
        </div>

        {/* Status de Conexão */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-3">🔗 Status da Conexão</h3>
            <div className="flex items-center">
              {connectionStatus === 'connected' && (
                <div className="flex items-center text-green-600">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Conectado
                </div>
              )}
              {connectionStatus === 'disconnected' && (
                <div className="flex items-center text-red-600">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Desconectado
                </div>
              )}
              {connectionStatus === 'checking' && (
                <div className="flex items-center text-yellow-600">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2 animate-spin"></div>
                  Verificando...
                </div>
              )}
            </div>
            <button 
              onClick={checkConnection}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Verificar Conexão
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-3">⏰ Última Sincronização</h3>
            <p className="text-gray-600">{lastSync || 'Nunca'}</p>
            <button 
              onClick={getTableStats}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Atualizar Agora
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-3">🧪 Teste de Inserção</h3>
            <p className="text-gray-600 text-sm mb-3">Testar se dados estão sendo salvos</p>
            <div className="flex gap-2">
              <button 
                onClick={testDataInsertion}
                className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
              >
                Testar
              </button>
              <button 
                onClick={clearTestData}
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas das Tabelas */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">📊 Estatísticas das Tabelas PostgreSQL</h3>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Tabela</th>
                  <th className="px-4 py-2 text-left">Registros</th>
                  <th className="px-4 py-2 text-left">Última Atualização</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {tableStats.map((stat) => (
                  <tr key={stat.tableName} className="border-b">
                    <td className="px-4 py-2 font-medium">{stat.tableName}</td>
                    <td className="px-4 py-2">{stat.count}</td>
                    <td className="px-4 py-2">{stat.lastUpdate}</td>
                    <td className="px-4 py-2">
                      {stat.status === 'success' && (
                        <span className="text-green-600">✅ OK</span>
                      )}
                      {stat.status === 'error' && (
                        <span className="text-red-600">❌ Erro</span>
                      )}
                      {stat.status === 'loading' && (
                        <span className="text-yellow-600">⏳ Carregando</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dados em Tempo Real */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">📡 Últimas Atividades (Tempo Real)</h3>
          <div className="space-y-3">
            {realTimeData.length === 0 ? (
              <p className="text-gray-500">Nenhuma atividade recente encontrada</p>
            ) : (
              realTimeData.map((activity, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-gray-600">
                        Usuário: {activity.user_id}
                      </p>
                      {activity.details && (
                        <p className="text-xs text-gray-500 mt-1">
                          {JSON.stringify(activity.details, null, 2)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(activity.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseMonitorPage;
