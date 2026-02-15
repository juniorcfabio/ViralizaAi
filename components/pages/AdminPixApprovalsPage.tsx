import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';

interface PendingPayment {
  id: string;
  user_id: string;
  plan_type: string;
  amount: number;
  payment_id: string;
  created_at: string;
  user_email: string;
  user_name: string;
}

// Mapeamento de plano → ferramentas (igual ao accessControlService)
const PLAN_TOOLS: Record<string, string[]> = {
  mensal: [
    'Gerador de Scripts IA', 'Criador de Thumbnails', 'Analisador de Trends',
    'Otimizador de SEO', 'Gerador de Hashtags', 'Criador de Logos'
  ],
  trimestral: [
    'Gerador de Scripts IA', 'Criador de Thumbnails', 'Analisador de Trends',
    'Otimizador de SEO', 'Gerador de Hashtags', 'Criador de Logos',
    'Agendamento Multiplataforma', 'IA de Copywriting', 'Tradutor Automático'
  ],
  semestral: [
    'Gerador de Scripts IA', 'Criador de Thumbnails', 'Analisador de Trends',
    'Otimizador de SEO', 'Gerador de Hashtags', 'Criador de Logos',
    'Agendamento Multiplataforma', 'IA de Copywriting', 'Tradutor Automático',
    'Gerador de QR Code', 'Editor de Vídeo Pro', 'Gerador de Ebooks Premium'
  ],
  anual: [
    'Gerador de Scripts IA', 'Criador de Thumbnails', 'Analisador de Trends',
    'Otimizador de SEO', 'Gerador de Hashtags', 'Criador de Logos',
    'Agendamento Multiplataforma', 'IA de Copywriting', 'Tradutor Automático',
    'Gerador de QR Code', 'Editor de Vídeo Pro', 'Gerador de Ebooks Premium',
    'Gerador de Animações', 'IA Video Generator 8K', 'AI Funil Builder'
  ]
};

const getPlanKey = (planType: string): string => {
  const p = planType.toLowerCase();
  if (p.includes('anual') || p.includes('annual') || p.includes('yearly')) return 'anual';
  if (p.includes('semestral') || p.includes('semiannual')) return 'semestral';
  if (p.includes('trimestral') || p.includes('quarterly')) return 'trimestral';
  return 'mensal';
};

const calculateExpiry = (planKey: string): string => {
  const now = new Date();
  if (planKey === 'anual') now.setFullYear(now.getFullYear() + 1);
  else if (planKey === 'semestral') now.setMonth(now.getMonth() + 6);
  else if (planKey === 'trimestral') now.setMonth(now.getMonth() + 3);
  else now.setMonth(now.getMonth() + 1);
  return now.toISOString();
};

const AdminPixApprovalsPage: React.FC = () => {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [notification, setNotification] = useState('');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 5000);
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

      // Buscar info dos usuarios em user_profiles (NÃO usar admin API)
      const enriched = await Promise.all(
        (data || []).map(async (sub) => {
          let userName = 'Usuario';
          let userEmail = sub.user_id.substring(0, 10) + '...';

          // 1. Tentar buscar em user_profiles com user_id
          try {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('name, email, cpf, preferences')
              .eq('user_id', sub.user_id)
              .single();

            if (profile) {
              userName = profile.name || userName;
              userEmail = profile.email || userEmail;
            }
          } catch { /* silencioso */ }

          // 2. Fallback: buscar em users table
          if (userEmail.includes('...')) {
            try {
              const { data: userRow } = await supabase
                .from('users')
                .select('email')
                .eq('id', sub.user_id)
                .single();
              if (userRow?.email) userEmail = userRow.email;
            } catch { /* silencioso */ }
          }

          return {
            ...sub,
            user_email: userEmail,
            user_name: userName
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
    const interval = setInterval(loadPendingPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (payment: PendingPayment) => {
    setProcessing(payment.id);
    try {
      const planKey = getPlanKey(payment.plan_type);
      const tools = PLAN_TOOLS[planKey] || PLAN_TOOLS['mensal'];
      const validUntil = calculateExpiry(planKey);
      const now = new Date().toISOString();

      console.log(`Aprovando PIX: user=${payment.user_id}, plan=${planKey}, tools=${tools.length}`);

      // 1. Ativar subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({ status: 'active', updated_at: now })
        .eq('id', payment.id);
      if (subError) throw subError;

      // 2. Atualizar purchases
      await supabase
        .from('purchases')
        .update({ status: 'completed' })
        .eq('payment_id', payment.payment_id);

      // 3. Atualizar user_profiles com o plano
      await supabase
        .from('user_profiles')
        .update({
          plan: planKey,
          plan_status: 'active',
          updated_at: now
        })
        .eq('user_id', payment.user_id);

      // 4. CRITICO: Inserir acesso a TODAS as ferramentas do plano na tabela user_access
      for (const toolName of tools) {
        await supabase
          .from('user_access')
          .upsert({
            user_id: payment.user_id,
            tool_name: toolName,
            access_type: 'subscription',
            is_active: true,
            valid_until: validUntil,
            updated_at: now
          }, { onConflict: 'user_id,tool_name' });
      }

      // 5. Log
      await supabase.from('activity_logs').insert({
        user_id: payment.user_id,
        action: 'pix_payment_approved_by_admin',
        details: JSON.stringify({
          subscription_id: payment.id,
          plan_type: planKey,
          amount: payment.amount,
          tools_activated: tools.length,
          valid_until: validUntil
        })
      });

      console.log(`Plano ${planKey} ativado: ${tools.length} ferramentas liberadas ate ${validUntil}`);
      showNotification(`Pagamento aprovado! Plano ${planKey.toUpperCase()} ativado para ${payment.user_name} com ${tools.length} ferramentas.`);
      loadPendingPayments();
    } catch (err) {
      console.error('Erro ao aprovar:', err);
      showNotification('Erro ao aprovar pagamento. Verifique o console.');
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
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', payment.id);

      await supabase
        .from('purchases')
        .update({ status: 'rejected' })
        .eq('payment_id', payment.payment_id);

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
    try {
      return new Date(dateStr).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateStr; }
  };

  const getPlanLabel = (plan: string) => {
    const key = getPlanKey(plan);
    const labels: Record<string, string> = {
      mensal: 'Mensal',
      trimestral: 'Trimestral',
      semestral: 'Semestral',
      anual: 'Anual'
    };
    return labels[key] || plan;
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
        <div className="bg-green-500 bg-opacity-20 text-green-300 p-3 rounded-lg mb-6 text-center font-semibold">
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
                    <p className="text-xs text-blue-400 mt-1">
                      Ferramentas: {(PLAN_TOOLS[getPlanKey(payment.plan_type)] || []).length} incluidas
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(payment)}
                      disabled={processing === payment.id}
                      className="px-6 py-2 rounded-full font-semibold bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      {processing === payment.id ? '⏳ Ativando...' : '✅ Aprovar'}
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
