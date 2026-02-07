// 🔧 API PARA USAR FERRAMENTAS DO MARKETPLACE
import { marketplace } from '../../lib/marketplaceSystem.js';
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

    const { toolId, parameters = {} } = req.body;

    if (!toolId) {
      return res.status(400).json({ error: 'toolId é obrigatório' });
    }

    // 🔒 VERIFICAR SE PLANO ESTÁ ATIVO
    if (!user.plano_ativo) {
      return res.status(403).json({ 
        error: 'Plano inativo',
        message: 'Você precisa de um plano ativo para usar ferramentas'
      });
    }

    // 🚀 USAR FERRAMENTA
    const result = await marketplace.useTool(user.id, toolId, parameters);

    if (result.success) {
      res.status(200).json({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('🚨 Erro ao usar ferramenta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
