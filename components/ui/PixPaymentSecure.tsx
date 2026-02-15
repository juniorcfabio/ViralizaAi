import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { supabase } from '../../src/lib/supabase';

interface PixPaymentSecureProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planSlug: string;
  amount: number;
}

const PIX_KEY = 'caccb1b4-6b25-4e5a-98a0-17121d31780e';

const generatePixEMVCode = (amount: number, description: string): string => {
  const merchantName = 'VIRALIZAAI';
  const merchantCity = 'SAO PAULO';
  const txid = `VIR${Date.now().toString().slice(-8)}`;

  const f = (id: string, value: string) => {
    if (!value) return '';
    return id + value.length.toString().padStart(2, '0') + value;
  };

  const crc16 = (str: string) => {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= (str.charCodeAt(i) << 8);
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  };

  const gui = f('00', 'br.gov.bcb.pix');
  const key = f('01', PIX_KEY);
  const desc = f('02', description.substring(0, 25));

  const payload =
    f('00', '01') +
    f('01', '12') +
    f('26', gui + key + desc) +
    f('52', '0000') +
    f('53', '986') +
    f('54', amount.toFixed(2)) +
    f('58', 'BR') +
    f('59', merchantName) +
    f('60', merchantCity) +
    f('62', f('05', txid)) +
    '6304';

  return payload + crc16(payload);
};

const PixPaymentSecure: React.FC<PixPaymentSecureProps> = ({
  isOpen,
  onClose,
  planName,
  planSlug,
  amount
}) => {
  const { user, updateUser } = useAuth();
  const [pixCode, setPixCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dbSaved, setDbSaved] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [approved, setApproved] = useState(false);

  // PASSO 1: Gerar QR Code IMEDIATAMENTE (sem banco)
  useEffect(() => {
    if (!isOpen || amount <= 0) return;

    const emv = generatePixEMVCode(amount, planName);
    setPixCode(emv);
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(emv)}`);
    setCopied(false);
    setApproved(false);
    setPendingId(null);
    setDbSaved(false);
  }, [isOpen, amount, planName]);

  // Normalizar plan_type para o formato padrao (mensal/trimestral/semestral/anual)
  const getNormalizedPlanType = (): string => {
    const combined = (planSlug + ' ' + planName).toLowerCase();
    if (combined.includes('anual') || combined.includes('annual') || combined.includes('yearly')) return 'anual';
    if (combined.includes('semestral') || combined.includes('semiannual')) return 'semestral';
    if (combined.includes('trimestral') || combined.includes('quarterly')) return 'trimestral';
    if (combined.includes('mensal') || combined.includes('monthly')) return 'mensal';
    return planSlug; // fallback
  };

  // PASSO 2: Salvar no Supabase como best-effort (nao bloqueia QR Code)
  useEffect(() => {
    if (!isOpen || !user || !pixCode || dbSaved) return;

    const savePendingPayment = async () => {
      const paymentId = `pix_${Date.now()}`;
      const normalizedPlan = getNormalizedPlanType();
      try {
        // Tentar inserir na tabela subscriptions
        const { data: sub, error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_type: normalizedPlan,
            status: 'pending_payment',
            payment_provider: 'pix',
            payment_id: paymentId,
            amount: amount,
          })
          .select('id')
          .single();

        if (!error && sub) {
          setPendingId(sub.id);
          setDbSaved(true);
          console.log('PIX pendente salvo no Supabase:', sub.id, 'plan:', normalizedPlan);
        } else {
          console.warn('Supabase insert falhou, tentando via user metadata:', error?.message);
          // Fallback: salvar como metadata do usuario
          await supabase.auth.updateUser({
            data: {
              pending_pix: {
                payment_id: paymentId,
                plan: normalizedPlan,
                plan_name: planName,
                amount: amount,
                status: 'pending_payment',
                created_at: new Date().toISOString()
              }
            }
          });
          setDbSaved(true);
          console.log('PIX pendente salvo via user metadata');
        }
      } catch (err) {
        console.warn('Erro ao salvar PIX pendente (QR Code continua funcionando):', err);
        setDbSaved(true);
      }
    };

    savePendingPayment();
  }, [isOpen, user, pixCode, dbSaved]);

  // PASSO 3: Polling para verificar aprovacao admin
  useEffect(() => {
    if (!isOpen || !pendingId || approved) return;

    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('id', pendingId)
          .single();

        if (data?.status === 'active') {
          setApproved(true);
          if (user && updateUser) {
            await updateUser(user.id, { plan: planSlug });
          }
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch {
        // Silencioso
      }
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, pendingId, approved]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = pixCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏦</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Pagamento via PIX</h2>
            <p className="text-gray-600">{planName}</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              R$ {amount.toFixed(2)}
            </p>
          </div>

          {approved ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h3 className="text-xl font-bold text-green-700 mb-2">Pagamento Confirmado!</h3>
              <p className="text-gray-600 mb-4">
                Seu plano <strong>{planName}</strong> foi ativado com sucesso.
              </p>
              <button
                onClick={() => { onClose(); window.location.reload(); }}
                className="w-full py-3 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700"
              >
                Acessar Ferramentas
              </button>
            </div>
          ) : (
            <>
              {/* QR Code */}
              {qrCodeUrl ? (
                <div className="text-center mb-6">
                  <h3 className="font-bold text-green-800 mb-4">📱 QR Code PIX</h3>
                  <div className="bg-white p-4 rounded-lg border-2 border-green-200 inline-block">
                    <img src={qrCodeUrl} alt="QR Code PIX" className="w-64 h-64" />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Escaneie com o app do seu banco</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-gray-600">Gerando QR Code...</p>
                </div>
              )}

              {/* Codigo PIX */}
              {pixCode && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-green-800 mb-3">🔐 Codigo PIX Copia e Cola</h3>
                  <div className="bg-white border rounded p-3 mb-3 max-h-24 overflow-y-auto">
                    <code className="text-xs font-mono text-gray-800 break-all">{pixCode}</code>
                  </div>
                  <button
                    onClick={copyPixCode}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                      copied ? 'bg-green-700' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {copied ? '✅ Copiado!' : '📋 Copiar Codigo PIX'}
                  </button>
                </div>
              )}

              {/* Instrucoes */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-bold text-blue-800 mb-2">📋 Como pagar:</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Copie o codigo PIX ou escaneie o QR Code</li>
                  <li>2. Abra o app do seu banco</li>
                  <li>3. Escolha "PIX" &rarr; "Colar codigo"</li>
                  <li>4. Confirme o valor: <strong>R$ {amount.toFixed(2)}</strong></li>
                  <li>5. Finalize o pagamento</li>
                  <li>6. Seu plano sera ativado automaticamente</li>
                </ol>
              </div>

              {/* Status Pendente */}
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="animate-spin w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
                  <div>
                    <h4 className="font-bold text-yellow-800">Aguardando confirmacao</h4>
                    <p className="text-sm text-yellow-700">
                      Apos o pagamento, seu plano sera ativado em ate 15 minutos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Chave PIX */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="font-bold text-gray-800 mb-2">🔑 Chave PIX:</h4>
                <p className="text-sm font-mono text-gray-700 break-all">{PIX_KEY}</p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-lg font-semibold text-gray-600 bg-gray-200 hover:bg-gray-300"
              >
                Fechar (pagamento continua pendente)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PixPaymentSecure;
