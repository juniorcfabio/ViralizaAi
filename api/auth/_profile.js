// 👤 API DE PERFIL DO USUÁRIO
import { authMiddleware, getUserProfile } from '../../lib/auth.js';
import { initializeDatabase } from '../../lib/database.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // 🗄️ GARANTIR QUE BANCO ESTÁ CONECTADO
    await initializeDatabase();

    // 🔐 VERIFICAR AUTENTICAÇÃO
    const user = await authMiddleware(req);
    if (!user) {
      return res.status(401).json({
        error: 'Não autorizado',
        message: 'Token inválido ou expirado'
      });
    }

    // 👤 OBTER PERFIL COMPLETO
    const result = await getUserProfile(user.id);

    if (result.success) {
      res.status(200).json({
        success: true,
        user: result.user
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.message
      });
    }

  } catch (error) {
    console.error('🚨 Erro na API de perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Tente novamente em alguns instantes'
    });
  }
}
