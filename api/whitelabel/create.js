// 🎨 API PARA CRIAR CLIENTE WHITE-LABEL
import { whiteLabelSystem } from '../../lib/whiteLabelSystem.js';
import { authMiddleware } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // 🔐 VERIFICAR AUTENTICAÇÃO (ADMIN APENAS)
    const user = await authMiddleware(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado - Admin necessário' });
    }

    const clientData = req.body;

    // ✅ VALIDAR DADOS OBRIGATÓRIOS
    if (!clientData.name || !clientData.email || !clientData.company) {
      return res.status(400).json({ 
        error: 'name, email e company são obrigatórios' 
      });
    }

    // 🎨 CRIAR CLIENTE WHITE-LABEL
    const result = await whiteLabelSystem.createWhiteLabelClient(clientData);

    if (result.success) {
      res.status(201).json({
        success: true,
        ...result,
        message: 'Cliente White-Label criado com sucesso!'
      });
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('🚨 Erro na criação de cliente white-label:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
