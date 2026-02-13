import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';

interface PendingPayment {
  id: string;
  user_id: string;
  plan_type: string;
  amount: number;
  payment_id: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

const AdminPixApprovalsPage: React.FC = () => {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [notification, setNotification] = useState('');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const loadPendingPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'pending_payment')
        .eq('payment_provider', 'pix')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar emails dos usuarios
      const enriched = await Promise.all(
        (data || []).map(async (sub) => {
          // Tentar buscar perfil do usuario
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('name, email')
            .eq('user_id', sub.user_id)
            .single();

          return {
            ...sub,
            user_email: profile?.email || sub.user_id.substring(0, 8) + '...',
            user_name: profile?.name || 'Usuario'
          };
        })
      );

      setPayments(enriched);
    } catch (err) {
      console.error('Erro ao carregar pagamentos pendentes:', err);
      showNotification('Erro ao carregar pagamentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingPayments();
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(loadPendingPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (payment: PendingPayment) => {
    setProcessing(payment.id);
    try {
      // 1. Ativar subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      if (subError) throw subError;

      // 2. Atualizar purchase para completed
      await supabase
        .from('purchases')
        .update({ status: 'completed' })
        .eq('payment_id', payment.payment_id);

      // 3. Atualizar user_profiles
      await supabase
        .from('user_profiles')
        .update({
          plan: payment.plan_type,
          plan_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', payment.user_id);

      // 4. Atualizar metadata do usuario
      // (O polling no frontend do usuario vai detectar a mudanca)

      // 5. Log
      await supabase.from('activity_logs').insert({
        user_id: payment.user_id,
        action: 'pix_payment_approved_by_admin',
        details: JSON.stringify({
          subscription_id: payment.id,
          plan_type: payment.plan_type,
          amount: payment.amount
        })
      });

      showNotification(`Pagamento de ${payment.user_name} aprovado! Plano ${payment.plan_type} ativado.`);
      loadPendingPayments();
    } catch (err) {
      console.error('Erro ao aprovar:', err);
      showNotification('Erro ao aprovar pagamento.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (payment: PendingPayment) => {
    if (!confirm(`Rejeitar pagamento PIX de ${payment.user_name}?\nPlano: ${payment.plan_type}\nValor: R$ ${payment.amount?.toFixed(2)}`)) return;

    setProcessing(payment.id);
    try {
      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      await supabase
        .from('purchases')
        .update({ status: 'rejected' })
        .eq('payment_id', payment.payment_id);

      await supabase.from('activity_logs').insert({
        user_id: payment.user_id,
        action: 'pix_payment_rejected_by_admin',
        details: JSON.stringify({ subscription_id: payment.id })
      });

      showNotification(`Pagamento de ${payment.user_name} rejeitado.`);
      loadPendingPayments();
    } catch (err) {
      console.error('Erro ao rejeitar:', err);
      showNotification('Erro ao rejeitar pagamento.');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = {
      mensal: 'Mensal - R$ 59,90',
      trimestral: 'Trimestral - R$ 159,90',
      semestral: 'Semestral - R$ 259,90',
      anual: 'Anual - R$ 399,90'
    };
    return labels[plan] || plan;
  };

  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-bold">Pagamentos PIX Pendentes</h2>
        <p className="text-gray-dark">
          Aprove ou rejeite pagamentos PIX realizados pelos usuarios.
          Atualizacao automatica a cada 30 segundos.
        </p>
      </header>

      {notification && (
        <div className="bg-green-500 bg-opacity-20 text-green-300 p-3 rounded-lg mb-6 text-center">
          {notification}
        </div>
      )}

      <div className="bg-secondary rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">
            Pendentes ({payments.length})
          </h3>
          <button
            onClick={loadPendingPayments}
            className="text-sm bg-accent/20 text-accent px-4 py-2 rounded-full hover:bg-accent/30"
          >
            🔄 Atualizar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-dark">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
            Carregando...
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-gray-dark">
            <span className="text-4xl mb-4 block">✅</span>
            Nenhum pagamento PIX pendente.
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="bg-primary p-5 rounded-lg border border-gray-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold">{payment.user_name}</span>
                      <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">
                        Pendente
                      </span>
                    </div>
                    <p className="text-sm text-gray-dark">{payment.user_email}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                      <span className="text-accent font-semibold">
                        {getPlanLabel(payment.plan_type)}
                      </span>
                      <span className="text-green-400 font-bold">
                        R$ {payment.amount?.toFixed(2)}
                      </span>
                      <span className="text-gray-dark">
                        {formatDate(payment.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-dark mt-1">
                      ID: {payment.payment_id}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(payment)}
                      disabled={processing === payment.id}
                      className="px-6 py-2 rounded-full font-semibold bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      {processing === payment.id ? '...' : '✅ Aprovar'}
                    </button>
                    <button
                      onClick={() => handleReject(payment)}
                      disabled={processing === payment.id}
                      className="px-6 py-2 rounded-full font-semibold bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      {processing === payment.id ? '...' : '❌ Rejeitar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminPixApprovalsPage;
