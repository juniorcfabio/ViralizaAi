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
  payment_type?: 'subscription' | 'tool';
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
      // Buscar pagamentos de planos pendentes
      const { data: subs, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'pending_payment')
        .eq('payment_provider', 'pix')
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Buscar pagamentos de ferramentas avulsas pendentes
      const { data: tools, error: toolsError } = await supabase
        .from('purchases')
        .select('*')
        .eq('status', 'pending')
        .eq('payment_provider', 'pix')
        .order('created_at', { ascending: false });

      if (toolsError) throw toolsError;

      // Combinar ambos os tipos de pagamento
      const allPayments = [
        ...((subs || []).map(s => ({ ...s, payment_type: 'subscription' }))),
        ...((tools || []).map(t => ({ ...t, payment_type: 'tool', plan_type: t.tool_name || 'Ferramenta Avulsa' })))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const data = allPayments;

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
      if (payment.payment_type === 'tool') {
        // Aprovar ferramenta avulsa
        console.log(`Aprovando PIX ferramenta: user=${payment.user_id}, tool=${payment.plan_type}`);

        // Atualizar purchase para paid
        await supabase
          .from('purchases')
          .update({ 
            status: 'paid',
            confirmed_at: new Date().toISOString()
          })
          .eq('id', payment.id);

        // Liberar acesso à ferramenta
        await supabase
          .from('user_access')
          .upsert({
            user_id: payment.user_id,
            tool_name: payment.plan_type,
            access_type: 'purchase',
            source_id: payment.id,
            valid_until: null,
            is_active: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,tool_name' });

        // Atualizar auth.users metadata
        const { data: authUser } = await supabase.auth.admin.getUserById(payment.user_id);
        const currentTools = authUser?.user?.user_metadata?.purchased_tools || [];
        
        if (!currentTools.includes(payment.plan_type)) {
          await supabase.auth.admin.updateUserById(payment.user_id, {
            user_metadata: {
              ...authUser?.user?.user_metadata,
              purchased_tools: [...currentTools, payment.plan_type]
            }
          });
        }

        console.log(`Ferramenta ${payment.plan_type} ativada para ${payment.user_id}`);
        showNotification(`Pagamento aprovado! Ferramenta ${payment.plan_type} liberada para ${payment.user_name}.`);
      } else {
        // Aprovar assinatura de plano
        const planKey = getPlanKey(payment.plan_type);
        const tools = PLAN_TOOLS[planKey] || PLAN_TOOLS['mensal'];
        const validUntil = calculateExpiry(planKey);
        const now = new Date().toISOString();

        console.log(`Aprovando PIX: user=${payment.user_id}, plan=${planKey}, tools=${tools.length}`);

        // Atualizar purchases (best-effort, não bloqueia)
        try {
          await supabase
            .from('purchases')
            .update({ status: 'completed' })
            .eq('payment_id', payment.payment_id);
        } catch { /* silencioso */ }

        // CHAMAR API SERVER-SIDE para ativar plano COMPLETO
        const activateRes = await fetch('/api/activate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: payment.user_id,
            planType: planKey,
            amount: payment.amount,
            paymentMethod: 'pix',
            paymentId: payment.payment_id,
            subscriptionId: payment.id
          })
        });
        const activateData = await activateRes.json();
        if (!activateData.success) {
          console.error('Erro ao ativar plano via API:', activateData);
          throw new Error(activateData.error || 'Falha na ativação do plano');
        }
        console.log('API activate-plan respondeu:', activateData);

        console.log(`Plano ${planKey} ativado: ${tools.length} ferramentas liberadas ate ${validUntil}`);
        showNotification(`Pagamento aprovado! Plano ${planKey.toUpperCase()} ativado para ${payment.user_name} com ${tools.length} ferramentas.`);
      }
      loadPendingPayments();
    } catch (err) {
      console.error('Erro ao aprovar:', err);
      showNotification('Erro ao aprovar pagamento. Verifique o console.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (payment: PendingPayment) => {
    const paymentType = payment.payment_type === 'tool' ? 'Ferramenta' : 'Plano';
    if (!confirm(`Rejeitar pagamento PIX de ${payment.user_name}?\n${paymentType}: ${payment.plan_type}\nValor: R$ ${payment.amount?.toFixed(2)}`)) return;

    setProcessing(payment.id);
    try {
      if (payment.payment_type === 'tool') {
        // Rejeitar ferramenta avulsa
        await supabase
          .from('purchases')
          .update({ 
            status: 'rejected',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);
      } else {
        // Rejeitar assinatura
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', payment.id);

        await supabase
          .from('purchases')
          .update({ status: 'rejected' })
          .eq('payment_id', payment.payment_id);
      }

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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        payment.payment_type === 'tool' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {payment.payment_type === 'tool' ? '🔧 Ferramenta' : '📦 Assinatura'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-dark">{payment.user_email}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                      <span className="text-accent font-semibold">
                        {payment.payment_type === 'tool' ? payment.plan_type : getPlanLabel(payment.plan_type)}
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
                    {payment.payment_type === 'subscription' && (
                      <p className="text-xs text-blue-400 mt-1">
                        Ferramentas: {(PLAN_TOOLS[getPlanKey(payment.plan_type)] || []).length} incluidas
                      </p>
                    )}
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
