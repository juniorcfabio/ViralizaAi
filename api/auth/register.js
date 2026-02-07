// 📝 API DE REGISTRO DE USUÁRIO - MIGRADO PARA SUPABASE AUTH
import { supabase } from '../../src/lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { name, email, password } = req.body;

    // ✅ VALIDAR DADOS
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Dados obrigatórios',
        message: 'Nome, email e senha são obrigatórios'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Senha muito curta',
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
    }

    // 📝 REGISTRAR USUÁRIO COM SUPABASE AUTH
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    if (data.user) {
      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso!',
        user: {
          id: data.user.id,
          email: data.user.email,
          name: name
        },
        session: data.session
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Erro no registro'
      });
    }

  } catch (error) {
    console.error('🚨 Erro na API de registro:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Tente novamente em alguns instantes'
    });
  }
}
