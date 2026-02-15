// Auth handler - self-contained (no transitive imports)
// Routes: /api/auth/login, /api/auth/register, /api/auth/profile
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action;

  try {
    switch (action) {
      case 'login': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' });
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return res.status(401).json({ success: false, error: error.message });
        return res.status(200).json({
          success: true, message: 'Login realizado!',
          user: { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name || data.user.email?.split('@')[0] },
          session: data.session
        });
      }
      case 'register': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Nome, email e senha obrigatórios' });
        if (password.length < 6) return res.status(400).json({ error: 'Senha mínimo 6 caracteres' });
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
        if (error) return res.status(400).json({ success: false, error: error.message });
        return res.status(201).json({
          success: true, message: 'Registrado com sucesso!',
          user: { id: data.user?.id, email: data.user?.email, name },
          session: data.session
        });
      }
      case 'profile': {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: 'Token obrigatório' });
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return res.status(401).json({ error: 'Token inválido' });
        const { data: profile } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single();
        return res.status(200).json({ success: true, user: { ...user, profile } });
      }
      default:
        return res.status(404).json({ error: `Auth route '${action}' not found` });
    }
  } catch (error) {
    console.error(`Auth ${action} error:`, error);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}
