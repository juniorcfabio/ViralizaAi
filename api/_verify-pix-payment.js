/**
 * API para verificar pagamentos PIX reais
 * Simula integração com sistema bancário BTG Pactual
 */

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { pixKey, amount, userId, planName } = req.body;

    console.log('🔍 Verificando pagamento PIX:', {
      pixKey: pixKey?.substring(0, 8) + '...',
      amount,
      userId,
      planName
    });

    // Validações básicas
    if (!pixKey || !amount || !userId || !planName) {
      return res.status(400).json({
        error: 'Dados obrigatórios: pixKey, amount, userId, planName'
      });
    }

    // Verificar se é a chave PIX correta
    const VALID_PIX_KEY = 'caccb1b4-6b25-4e5a-98a0-17121d31780e';
    if (pixKey !== VALID_PIX_KEY) {
      return res.status(400).json({
        error: 'Chave PIX inválida'
      });
    }

    // SIMULAÇÃO: Em produção real, aqui faria chamada para API do BTG Pactual
    // Por enquanto, simula que pagamento está pendente por 5 minutos
    const now = new Date();
    const paymentTime = new Date(now.getTime() + (5 * 60 * 1000)); // 5 minutos no futuro

    // Simular verificação no sistema bancário
    // Em produção real: consultar API do BTG Pactual
    const paymentStatus = {
      id: `pix_${Date.now()}`,
      status: 'pending', // pending, confirmed, failed
      amount: parseFloat(amount),
      pixKey: VALID_PIX_KEY,
      userId,
      planName,
      createdAt: now.toISOString(),
      estimatedConfirmation: paymentTime.toISOString(),
      message: 'Pagamento registrado. Aguardando confirmação bancária em até 5 minutos.'
    };

    console.log('✅ Pagamento PIX registrado:', paymentStatus);

    return res.status(200).json({
      success: true,
      payment: paymentStatus,
      message: 'Pagamento registrado com sucesso. Aguarde confirmação.'
    });

  } catch (error) {
    console.error('❌ Erro ao verificar pagamento PIX:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}
