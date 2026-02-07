// 💸 API PARA SOLICITAR SAQUE
import { affiliateSystem } from '../../lib/affiliateSystem.js';
import { authMiddleware } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // 🔐 VERIFICAR AUTENTICAÇÃO
    const user = await authMiddleware(req);
    if (!user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // 📝 EXTRAIR DADOS
    const { dadosPagamento } = req.body;

    if (!dadosPagamento || !dadosPagamento.pixKey) {
      return res.status(400).json({ error: 'Dados de pagamento PIX obrigatórios' });
    }

    // 🔍 BUSCAR AFILIADO DO USUÁRIO
    const affiliateResult = await affiliateSystem.getDashboardAfiliado(user.id);
    if (!affiliateResult.success) {
      return res.status(404).json({ error: 'Afiliado não encontrado' });
    }

    const affiliateId = affiliateResult.dashboard.afiliado.id;

    // 💸 SOLICITAR SAQUE
    const result = await affiliateSystem.solicitarSaque(affiliateId, dadosPagamento);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    // ✅ RETORNAR SUCESSO
    res.status(200).json({
      success: true,
      saque: {
        id: result.saque.id,
        valor: result.valor,
        status: result.saque.status,
        previsaoProcessamento: result.previsaoProcessamento
      },
      message: 'Saque solicitado com sucesso!'
    });

  } catch (error) {
    console.error('🚨 Erro na API de saque:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
