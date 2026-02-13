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
  const [status, setStatus] = useState<'generating' | 'waiting' | 'approved' | 'error'>('generating');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const PIX_KEY = 'caccb1b4-6b25-4e5a-98a0-17121d31780e';

  const generatePixEMVCode = (amount: number, description: string) => {
    const merchantName = 'VIRALIZAAI';
    const merchantCity = 'SAO PAULO';
    const txid = `VIR${Date.now().toString().slice(-8)}`;

    const createEMVField = (id: string, value: string) => {
      if (!value) return '';
      const length = value.length.toString().padStart(2, '0');
      return id + length + value;
    };

    const calculateCRC16 = (str: string) => {
      let crc = 0xFFFF;
      for (let i = 0; i < str.length; i++) {
        crc ^= (str.charCodeAt(i) << 8);
        for (let j = 0; j < 8; j++) {
          crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
        }
      }
      return crc.toString(16).toUpperCase().padStart(4, '0');
    };

    const payloadFormatIndicator = createEMVField('00', '01');
    const pointOfInitiationMethod = createEMVField('01', '12');
    const gui = createEMVField('00', 'br.gov.bcb.pix');
    const key = createEMVField('01', PIX_KEY);
    const desc = createEMVField('02', description.substring(0, 25));
    const merchantAccountInfo = createEMVField('26', gui + key + desc);
    const merchantCategoryCode = createEMVField('52', '0000');
    const transactionCurrency = createEMVField('53', '986');
    const transactionAmount = createEMVField('54', amount.toFixed(2));
    const countryCode = createEMVField('58', 'BR');
    const merchantNameField = createEMVField('59', merchantName);
    const merchantCityField = createEMVField('60', merchantCity);
    const txidField = createEMVField('05', txid);
    const additionalDataField = createEMVField('62', txidField);

    const payloadWithoutCRC = payloadFormatIndicator +
      pointOfInitiationMethod +
      merchantAccountInfo +
      merchantCategoryCode +
      transactionCurrency +
      transactionAmount +
      countryCode +
      merchantNameField +
      merchantCityField +
      additionalDataField +
      '6304';

    const crc = calculateCRC16(payloadWithoutCRC);
    return payloadWithoutCRC + crc;
  };

  useEffect(() => {
    if (!isOpen || !user || amount <= 0) return;

    const initPixPayment = async () => {
      try {
        setStatus('generating');

        const emvCode = generatePixEMVCode(amount, planName);
        setPixCode(emvCode);
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(emvCode)}`);

        const paymentId = `pix_${Date.now()}`;

        const now = new Date();
        const endDate = new Date(now);
        const planLower = planSlug.toLowerCase();
        if (planLower.includes('anual')) endDate.setFullYear(endDate.getFullYear() + 1);
        else if (planLower.includes('semestral')) endDate.setMonth(endDate.getMonth() + 6);
        else if (planLower.includes('trimestral')) endDate.setMonth(endDate.getMonth() + 3);
        else endDate.setMonth(endDate.getMonth() + 1);

        // Criar subscription PENDENTE no Supabase
        const { data: sub, error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_type: planSlug,
            status: 'pending_payment',
            payment_provider: 'pix',
            payment_id: paymentId,
            amount: amount,
            start_date: now.toISOString(),
            end_date: endDate.toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Erro ao criar subscription pendente:', error);
          setStatus('error');
          return;
        }

        setPendingId(sub.id);
        setStatus('waiting');

        // Registrar compra pendente
        await supabase.from('purchases').insert({
          user_id: user.id,
          item_type: 'plan',
          item_name: planName,
          amount: amount,
          payment_method: 'pix',
          payment_id: paymentId,
          status: 'pending',
          created_at: now.toISOString()
        });

        // Log
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'pix_payment_initiated',
          details: JSON.stringify({ plan_type: planSlug, amount, payment_id: paymentId })
        });

        console.log('PIX pendente criado:', sub.id);

      } catch (err) {
        console.error('Erro ao iniciar PIX:', err);
        setStatus('error');
      }
    };

    initPixPayment();
  }, [isOpen, user, amount]);

  // Polling: verificar se admin aprovou o pagamento
  useEffect(() => {
    if (status !== 'waiting' || !pendingId) return;

    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('id', pendingId)
          .single();

        if (data?.status === 'active') {
          setStatus('approved');
          if (user && updateUser) {
            await updateUser(user.id, { plan: planSlug });
          }
          // Parar polling
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch (err) {
        // Silencioso
      }
    }, 5000); // Verifica a cada 5 segundos

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [status, pendingId]);

  // Cleanup polling ao fechar
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      alert('Codigo PIX copiado! Cole no seu app bancario para pagar.');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = pixCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Codigo PIX copiado!');
    }
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

          {status === 'approved' ? (
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
          ) : status === 'error' ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Erro ao gerar PIX. Tente novamente.</p>
              <button onClick={onClose} className="py-2 px-6 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">
                Fechar
              </button>
            </div>
          ) : (
            <>
              {/* QR Code */}
              {qrCodeUrl && (
                <div className="text-center mb-6">
                  <h3 className="font-bold text-green-800 mb-4">📱 QR Code PIX</h3>
                  <div className="bg-white p-4 rounded-lg border-2 border-green-200 inline-block">
                    <img src={qrCodeUrl} alt="QR Code PIX" className="w-64 h-64" />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Escaneie com o app do seu banco</p>
                </div>
              )}

              {/* Codigo PIX */}
              {pixCode && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-green-800 mb-3">🔐 Codigo PIX EMV</h3>
                  <div className="bg-white border rounded p-3 mb-3 max-h-24 overflow-y-auto">
                    <code className="text-xs font-mono text-gray-800 break-all">{pixCode}</code>
                  </div>
                  <button
                    onClick={copyPixCode}
                    className="w-full py-3 px-4 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white"
                  >
                    📋 Copiar Codigo PIX
                  </button>
                </div>
              )}

              {/* Instrucoes */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-bold text-blue-800 mb-2">📋 Como pagar:</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Copie o codigo PIX ou escaneie o QR Code</li>
                  <li>2. Abra o app do seu banco</li>
                  <li>3. Escolha "PIX" → "Colar codigo"</li>
                  <li>4. Confirme o valor: <strong>R$ {amount.toFixed(2)}</strong></li>
                  <li>5. Finalize o pagamento</li>
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
                      Esta pagina atualiza automaticamente.
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
