// 👤 API PARA CRIAR AFILIADO
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

    // 👤 CRIAR AFILIADO
    const result = await affiliateSystem.criarAfiliado(user.id, {
      dadosPagamento
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error || result.message });
    }

    // ✅ RETORNAR SUCESSO
    res.status(200).json({
      success: true,
      affiliate: {
        codigo: result.codigo,
        link: result.link,
        comissaoRate: result.comissaoRate,
        minimumPayout: result.minimumPayout
      },
      message: 'Afiliado criado com sucesso!'
    });

  } catch (error) {
    console.error('🚨 Erro na API de criação de afiliado:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
