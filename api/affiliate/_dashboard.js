// 📊 API PARA DASHBOARD DO AFILIADO
import { affiliateSystem } from '../../lib/affiliateSystem.js';
import { authMiddleware } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // 🔐 VERIFICAR AUTENTICAÇÃO
    const user = await authMiddleware(req);
    if (!user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // 📊 OBTER DASHBOARD
    const result = await affiliateSystem.getDashboardAfiliado(user.id);

    if (!result.success) {
      return res.status(404).json({ error: result.message });
    }

    // ✅ RETORNAR DASHBOARD
    res.status(200).json({
      success: true,
      dashboard: result.dashboard
    });

  } catch (error) {
    console.error('🚨 Erro na API de dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
