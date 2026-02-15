import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const PLAN_TOOLS = {
  mensal: [
    'Gerador de Scripts IA', 'Criador de Thumbnails', 'Analisador de Trends',
    'Otimizador de SEO', 'Gerador de Hashtags', 'Criador de Logos'
  ],
  trimestral: [
    'Gerador de Scripts IA', 'Criador de Thumbnails', 'Analisador de Trends',
    'Otimizador de SEO', 'Gerador de Hashtags', 'Criador de Logos',
    'Agendamento Multiplataforma', 'IA de Copywriting', 'Tradutor Automatico'
  ],
  semestral: [
    'Gerador de Scripts IA', 'Criador de Thumbnails', 'Analisador de Trends',
    'Otimizador de SEO', 'Gerador de Hashtags', 'Criador de Logos',
    'Agendamento Multiplataforma', 'IA de Copywriting', 'Tradutor Automatico',
    'Gerador de QR Code', 'Editor de Video Pro', 'Gerador de Ebooks Premium'
  ],
  anual: [
    'Gerador de Scripts IA', 'Criador de Thumbnails', 'Analisador de Trends',
    'Otimizador de SEO', 'Gerador de Hashtags', 'Criador de Logos',
    'Agendamento Multiplataforma', 'IA de Copywriting', 'Tradutor Automatico',
    'Gerador de QR Code', 'Editor de Video Pro', 'Gerador de Ebooks Premium',
    'Gerador de Animacoes', 'IA Video Generator 8K', 'AI Funil Builder'
  ]
};

function getPlanKey(planType) {
  var p = (planType || '').toLowerCase();
  if (p.includes('anual') || p.includes('annual') || p.includes('yearly')) return 'anual';
  if (p.includes('semestral') || p.includes('semiannual')) return 'semestral';
  if (p.includes('trimestral') || p.includes('quarterly')) return 'trimestral';
  return 'mensal';
}

function calculateExpiry(planKey) {
  var now = new Date();
  if (planKey === 'anual') now.setFullYear(now.getFullYear() + 1);
  else if (planKey === 'semestral') now.setMonth(now.getMonth() + 6);
  else if (planKey === 'trimestral') now.setMonth(now.getMonth() + 3);
  else now.setMonth(now.getMonth() + 1);
  return now.toISOString();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET: Buscar plano ativo do usuario
  if (req.method === 'GET') {
    var userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    try {
      var subResult = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      var profileResult = await supabase
        .from('user_profiles')
        .select('plan, plan_status')
        .eq('user_id', userId)
        .maybeSingle();

      var toolsResult = await supabase
        .from('user_access')
        .select('tool_name, access_type, valid_until, is_active')
        .eq('user_id', userId)
        .eq('is_active', true);

      var sub = subResult.data;
      var profile = profileResult.data;
      var toolsData = toolsResult.data || [];

      var activePlan = (sub && sub.plan_type) || (profile && profile.plan) || null;
      var isActive = !!(sub && sub.status === 'active') || (profile && profile.plan_status === 'active');

      return res.status(200).json({
        success: true,
        plan: activePlan,
        planStatus: isActive ? 'active' : 'inactive',
        subscription: sub || null,
        tools: toolsData.map(function(t) { return t.tool_name; }),
        toolsCount: toolsData.length,
        expiresAt: sub ? sub.end_date : null
      });
    } catch (error) {
      console.error('Erro ao buscar plano:', error);
      return res.status(500).json({ error: 'Erro ao buscar plano', details: error.message });
    }
  }

  // POST: Ativar plano
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    var body = req.body || {};
    var userId = body.userId;
    var planType = body.planType;
    var amount = body.amount;
    var paymentMethod = body.paymentMethod;
    var paymentId = body.paymentId;
    var subscriptionId = body.subscriptionId;
    var toolName = body.toolName;

    if (!userId) return res.status(400).json({ error: 'userId obrigatorio' });

    var now = new Date().toISOString();

    // COMPRA AVULSA DE FERRAMENTA
    if (toolName) {
      console.log('Ativando ferramenta avulsa:', userId, toolName);

      await supabase.from('user_access').upsert({
        user_id: userId,
        tool_name: toolName,
        access_type: 'purchase',
        is_active: true,
        valid_until: null,
        updated_at: now
      }, { onConflict: 'user_id,tool_name' });

      try {
        var authUserRes = await supabase.auth.admin.getUserById(userId);
        var authUser = authUserRes.data;
        var currentTools = (authUser && authUser.user && authUser.user.user_metadata && authUser.user.user_metadata.purchased_tools) || [];
        if (!currentTools.includes(toolName)) {
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: Object.assign({}, (authUser && authUser.user && authUser.user.user_metadata) || {}, {
              purchased_tools: currentTools.concat([toolName])
            })
          });
        }
      } catch (e) { console.error('Erro auth metadata tool:', e); }

      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'tool_activated',
        details: JSON.stringify({ tool_name: toolName, amount: amount, payment_method: paymentMethod })
      });

      return res.status(200).json({ success: true, message: 'Ferramenta ' + toolName + ' ativada', tool: toolName });
    }

    // ATIVACAO DE PLANO/ASSINATURA
    if (!planType) return res.status(400).json({ error: 'planType obrigatorio' });

    var planKey = getPlanKey(planType);
    var tools = PLAN_TOOLS[planKey] || PLAN_TOOLS['mensal'];
    var validUntil = calculateExpiry(planKey);

    console.log('Ativando plano:', userId, planKey, tools.length, 'ferramentas ate', validUntil);

    // 1. Se subscriptionId fornecido, ativar essa subscription
    if (subscriptionId) {
      await supabase
        .from('subscriptions')
        .update({ status: 'active', start_date: now, end_date: validUntil, updated_at: now })
        .eq('id', subscriptionId);
    }

    // 2. Atualizar user_profiles
    await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        plan: planKey,
        plan_status: 'active',
        updated_at: now
      }, { onConflict: 'user_id' });

    // 3. Desativar acessos antigos por subscription
    await supabase
      .from('user_access')
      .update({ is_active: false, updated_at: now })
      .eq('user_id', userId)
      .eq('access_type', 'subscription');

    // 4. Criar acessos para TODAS as ferramentas do plano
    for (var i = 0; i < tools.length; i++) {
      await supabase.from('user_access').upsert({
        user_id: userId,
        tool_name: tools[i],
        access_type: 'subscription',
        is_active: true,
        valid_until: validUntil,
        updated_at: now
      }, { onConflict: 'user_id,tool_name' });
    }

    // 5. CRITICO: Atualizar auth.users metadata (SERVICE_ROLE_KEY)
    try {
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { plan: planKey, plan_status: 'active', plan_expires: validUntil }
      });
      console.log('Auth metadata atualizado com plano:', planKey);
    } catch (authErr) {
      console.error('Erro ao atualizar auth metadata:', authErr);
    }

    // 6. Log
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'plan_activated',
      details: JSON.stringify({
        plan_type: planKey,
        tools_count: tools.length,
        valid_until: validUntil,
        amount: amount,
        payment_method: paymentMethod || 'pix'
      })
    });

    console.log('Plano ' + planKey + ' ativado: ' + tools.length + ' ferramentas ate ' + validUntil);

    return res.status(200).json({
      success: true,
      message: 'Plano ' + planKey + ' ativado com ' + tools.length + ' ferramentas',
      plan: planKey,
      tools: tools,
      toolsCount: tools.length,
      expiresAt: validUntil
    });

  } catch (error) {
    console.error('Erro na ativacao:', error);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}
