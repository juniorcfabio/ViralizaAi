// 🔑 API DE LOGIN DE USUÁRIO - MIGRADO PARA SUPABASE AUTH
import { supabase } from '../../src/lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { email, password } = req.body;

    // ✅ VALIDAR DADOS
    if (!email || !password) {
      return res.status(400).json({
        error: 'Dados obrigatórios',
        message: 'Email e senha são obrigatórios'
      });
    }

    // 🔑 FAZER LOGIN COM SUPABASE AUTH
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }

    if (data.user) {
      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso!',
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0]
        },
        session: data.session
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

  } catch (error) {
    console.error('🚨 Erro na API de login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Tente novamente em alguns instantes'
    });
  }
}
