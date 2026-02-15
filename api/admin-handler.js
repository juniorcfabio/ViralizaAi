// Admin handler - self-contained (no transitive imports)
// Routes: /api/admin/stats, /api/admin/users, /api/admin/payments, etc.
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action;

  try {
    switch (action) {
      case 'stats': {
        const { count: usersCount } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
        const { count: subsCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active');
        const { data: recentLogs } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(10);
        return res.status(200).json({
          success: true, stats: {
            totalUsers: usersCount || 0, activeSubscriptions: subsCount || 0,
            recentActivity: recentLogs || [], generatedAt: new Date().toISOString()
          }
        });
      }
      case 'users': {
        const { data: users, error } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false }).limit(100);
        if (error) throw error;
        return res.status(200).json({ success: true, users: users || [] });
      }
      case 'payments': {
        const { data: payments, error } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false }).limit(50);
        if (error) throw error;
        return res.status(200).json({ success: true, payments: payments || [] });
      }
      case 'revenue': {
        const { data: subs } = await supabase.from('subscriptions').select('amount, status, created_at').eq('status', 'active');
        const totalRevenue = (subs || []).reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
        return res.status(200).json({ success: true, revenue: { total: totalRevenue, activeCount: subs?.length || 0 } });
      }
      case 'block-user': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { userId, blocked } = req.body;
        const { error } = await supabase.from('user_profiles').update({ blocked: !!blocked }).eq('user_id', userId);
        if (error) throw error;
        return res.status(200).json({ success: true, message: blocked ? 'Usuário bloqueado' : 'Usuário desbloqueado' });
      }
      case 'change-plan': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { userId, plan } = req.body;
        const { error } = await supabase.from('user_profiles').update({ plan_type: plan }).eq('user_id', userId);
        if (error) throw error;
        return res.status(200).json({ success: true, message: `Plano alterado para ${plan}` });
      }
      case 'command-center': {
        const { data: logs } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50);
        return res.status(200).json({ success: true, logs: logs || [] });
      }
      case 'real-time-metrics': {
        const now = new Date();
        const hourAgo = new Date(now - 3600000).toISOString();
        const { count: activeNow } = await supabase.from('activity_logs').select('*', { count: 'exact', head: true }).gte('created_at', hourAgo);
        return res.status(200).json({ success: true, metrics: { activeLastHour: activeNow || 0, timestamp: now.toISOString() } });
      }
      case 'toggle-system': {
        return res.status(200).json({ success: true, message: 'System toggle acknowledged' });
      }
      case 'ia-executiva': {
        return res.status(200).json({ success: true, message: 'IA Executiva endpoint', status: 'active' });
      }
      default:
        return res.status(404).json({ error: `Admin route '${action}' not found` });
    }
  } catch (error) {
    console.error(`Admin ${action} error:`, error);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}
