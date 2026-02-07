// 🤖 API DE SUPORTE AUTOMÁTICO 24H
import { aiSupport } from '../../lib/aiSupport24h.js';
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

    const { mensagem, contexto } = req.body;

    if (!mensagem || mensagem.trim().length === 0) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    // 👤 CONTEXTO DO USUÁRIO
    const contextoUsuario = {
      plano: user.plano,
      plano_ativo: user.plano_ativo,
      created_at: user.created_at,
      ultimo_pagamento: user.ultimo_pagamento,
      ...contexto
    };

    // 🤖 GERAR RESPOSTA COM IA
    const resultado = await aiSupport.gerarResposta(
      mensagem, 
      user.id, 
      contextoUsuario
    );

    // 📊 LOG DA INTERAÇÃO
    console.log(`💬 Suporte IA - Usuário ${user.id}: ${mensagem.substring(0, 50)}...`);

    // ✅ RETORNAR RESPOSTA
    res.status(200).json({
      success: true,
      ...resultado,
      user_id: user.id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Erro na API de suporte:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      fallback: 'Entre em contato com suporte@viralizaai.com'
    });
  }
}
