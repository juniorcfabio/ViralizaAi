// Catch-all router - self-contained (no transitive imports)
// Handles all routes not covered by individual API files
// Also handles activate-plan (moved here due to Vercel compilation issue)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

var PLAN_TOOLS = {
  mensal: ['Gerador de Scripts IA','Criador de Thumbnails','Analisador de Trends','Otimizador de SEO','Gerador de Hashtags','Criador de Logos'],
  trimestral: ['Gerador de Scripts IA','Criador de Thumbnails','Analisador de Trends','Otimizador de SEO','Gerador de Hashtags','Criador de Logos','Agendamento Multiplataforma','IA de Copywriting','Tradutor Automático'],
  semestral: ['Gerador de Scripts IA','Criador de Thumbnails','Analisador de Trends','Otimizador de SEO','Gerador de Hashtags','Criador de Logos','Agendamento Multiplataforma','IA de Copywriting','Tradutor Automático','Gerador de QR Code','Editor de Vídeo Pro','Gerador de Ebooks Premium'],
  anual: ['Gerador de Scripts IA','Criador de Thumbnails','Analisador de Trends','Otimizador de SEO','Gerador de Hashtags','Criador de Logos','Agendamento Multiplataforma','IA de Copywriting','Tradutor Automático','Gerador de QR Code','Editor de Vídeo Pro','Gerador de Ebooks Premium','Gerador de Animações','IA Video Generator 8K','AI Funil Builder']
};

function getPlanKey(pt) {
  var p = (pt || '').toLowerCase();
  if (p.includes('anual') || p.includes('annual') || p.includes('yearly')) return 'anual';
  if (p.includes('semestral') || p.includes('semiannual')) return 'semestral';
  if (p.includes('trimestral') || p.includes('quarterly')) return 'trimestral';
  return 'mensal';
}

function calcExpiry(pk) {
  var d = new Date();
  if (pk === 'anual') d.setFullYear(d.getFullYear() + 1);
  else if (pk === 'semestral') d.setMonth(d.getMonth() + 6);
  else if (pk === 'trimestral') d.setMonth(d.getMonth() + 3);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

async function handleActivatePlanGET(req, res) {
  var userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  var subR = await supabase.from('subscriptions').select('*').eq('user_id', userId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
  var profR = await supabase.from('user_profiles').select('plan, plan_status').eq('user_id', userId).maybeSingle();
  var toolsR = await supabase.from('user_access').select('tool_name, access_type, valid_until, is_active').eq('user_id', userId).eq('is_active', true);
  var sub = subR.data; var prof = profR.data; var tls = toolsR.data || [];
  var ap = (sub && sub.plan_type) || (prof && prof.plan) || null;
  var ia = !!(sub && sub.status === 'active') || (prof && prof.plan_status === 'active');
  return res.status(200).json({ success: true, plan: ap, planStatus: ia ? 'active' : 'inactive', subscription: sub || null, tools: tls.map(function(t){return t.tool_name}), toolsCount: tls.length, expiresAt: sub ? sub.end_date : null });
}

async function handleActivatePlanPOST(req, res) {
  var b = req.body || {};
  if (!b.userId) return res.status(400).json({ error: 'userId obrigatorio' });
  var now = new Date().toISOString();

  // Compra avulsa de ferramenta
  if (b.toolName) {
    await supabase.from('user_access').upsert({ user_id: b.userId, tool_name: b.toolName, access_type: 'purchase', is_active: true, valid_until: null, updated_at: now }, { onConflict: 'user_id,tool_name' });
    try {
      var auR = await supabase.auth.admin.getUserById(b.userId);
      var ct = (auR.data && auR.data.user && auR.data.user.user_metadata && auR.data.user.user_metadata.purchased_tools) || [];
      if (!ct.includes(b.toolName)) { await supabase.auth.admin.updateUserById(b.userId, { user_metadata: Object.assign({}, (auR.data && auR.data.user && auR.data.user.user_metadata) || {}, { purchased_tools: ct.concat([b.toolName]) }) }); }
    } catch(e) { console.error('auth meta tool err:', e); }
    await supabase.from('activity_logs').insert({ user_id: b.userId, action: 'tool_activated', details: JSON.stringify({ tool_name: b.toolName, amount: b.amount }) });
    return res.status(200).json({ success: true, message: 'Ferramenta ' + b.toolName + ' ativada', tool: b.toolName });
  }

  // Ativacao de plano
  if (!b.planType) return res.status(400).json({ error: 'planType obrigatorio' });
  var pk = getPlanKey(b.planType);
  var tools = PLAN_TOOLS[pk] || PLAN_TOOLS['mensal'];
  var vu = calcExpiry(pk);
  console.log('Ativando plano:', b.userId, pk, tools.length, 'ferramentas');

  var errors = [];
  // 1. Cancel ALL old subscriptions for this user (except the one we're activating)
  var cancelRes = await supabase.from('subscriptions').update({ status: 'cancelled', updated_at: now }).eq('user_id', b.userId).in('status', ['active', 'pending_payment']).neq('id', b.subscriptionId || '00000000-0000-0000-0000-000000000000').select();
  if (cancelRes.error) errors.push('cancel: ' + cancelRes.error.message);

  // 2. Activate the specific subscription
  if (b.subscriptionId) {
    var actRes = await supabase.from('subscriptions').update({ status: 'active', plan_type: pk, end_date: vu, updated_at: now }).eq('id', b.subscriptionId).select();
    if (actRes.error) errors.push('sub_activate: ' + actRes.error.message);
    else console.log('Sub activated:', actRes.data);
  }

  // 3. user_profiles - try update first, fallback to upsert with email
  var profRes = await supabase.from('user_profiles').update({ plan: pk, plan_status: 'active', updated_at: now }).eq('user_id', b.userId).select();
  if (profRes.error || !profRes.data || profRes.data.length === 0) {
    // Profile doesn't exist yet - get email from auth and create
    var email = b.userEmail || 'user@viralizaai.com';
    try { var au = await supabase.auth.admin.getUserById(b.userId); if (au.data && au.data.user) email = au.data.user.email || email; } catch(e) {}
    var profRes2 = await supabase.from('user_profiles').upsert({ user_id: b.userId, email: email, name: email.split('@')[0], plan: pk, plan_status: 'active', updated_at: now }, { onConflict: 'user_id' }).select();
    if (profRes2.error) errors.push('profile: ' + profRes2.error.message);
  }

  // 4. Deactivate old user_access
  await supabase.from('user_access').update({ is_active: false, updated_at: now }).eq('user_id', b.userId).eq('access_type', 'subscription');

  // 5. Create tool access
  for (var i = 0; i < tools.length; i++) {
    var toolRes = await supabase.from('user_access').upsert({ user_id: b.userId, tool_name: tools[i], access_type: 'subscription', is_active: true, valid_until: vu, updated_at: now }, { onConflict: 'user_id,tool_name' });
    if (toolRes.error) errors.push('tool_' + i + ': ' + toolRes.error.message);
  }

  // 6. Auth metadata
  try { await supabase.auth.admin.updateUserById(b.userId, { user_metadata: { plan: pk, plan_status: 'active', plan_expires: vu } }); } catch(ae) { errors.push('auth_meta: ' + ae.message); }

  // 7. Activity log
  await supabase.from('activity_logs').insert({ user_id: b.userId, action: 'plan_activated', details: JSON.stringify({ plan_type: pk, tools_count: tools.length, valid_until: vu, amount: b.amount, payment_method: b.paymentMethod || 'pix' }) });

  return res.status(200).json({ success: true, message: 'Plano ' + pk + ' ativado com ' + tools.length + ' ferramentas', plan: pk, tools: tools, toolsCount: tools.length, expiresAt: vu, errors: errors });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const routeKey = req.query.route || '';

  try {
    switch (routeKey) {
      // ==================== ACTIVATE-PLAN ====================
      case 'activate-plan': {
        if (req.method === 'GET') return handleActivatePlanGET(req, res);
        if (req.method === 'POST') return handleActivatePlanPOST(req, res);
        return res.status(405).json({ error: 'GET or POST required' });
      }

      case 'health/check': {
        return res.status(200).json({
          success: true, status: 'healthy', timestamp: new Date().toISOString(),
          environment: {
            openai: !!process.env.OPENAI_API_KEY,
            anthropic: !!process.env.ANTHROPIC_API_KEY,
            kimi: !!(process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY),
            supabase: !!process.env.SUPABASE_URL,
            stripe: !!process.env.STRIPE_SECRET_KEY
          }
        });
      }
      case 'affiliate/activate': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        var aUserId = req.body?.userId;
        var aName = req.body?.name || 'Afiliado';
        var aEmail = req.body?.email || '';
        if (!aUserId) return res.status(400).json({ error: 'userId required' });

        // Verificar se já é afiliado via user_metadata
        var existingUser = await supabase.auth.admin.getUserById(aUserId);
        var existingMeta = existingUser?.data?.user?.user_metadata || {};
        if (existingMeta.affiliate_active && existingMeta.affiliate_referral_code) {
          return res.status(200).json({
            success: true, message: 'Afiliado já ativo',
            storage: { metadata: true, database: true },
            affiliate: {
              id: aUserId, user_id: aUserId, name: existingMeta.affiliate_name || aName,
              email: existingMeta.affiliate_email || aEmail,
              referral_code: existingMeta.affiliate_referral_code,
              status: 'active', commission_rate: existingMeta.affiliate_commission_rate || 0.20,
              total_earnings: existingMeta.affiliate_total_earnings || 0,
              pending_balance: existingMeta.affiliate_pending_balance || 0,
              available_balance: existingMeta.affiliate_available_balance || 0,
              total_referrals: existingMeta.affiliate_total_referrals || 0,
              total_clicks: existingMeta.affiliate_total_clicks || 0,
              created_at: existingMeta.affiliate_created_at || new Date().toISOString()
            }
          });
        }

        // Gerar código de referência
        var refCode = 'VIR' + aUserId.slice(-6).toUpperCase() + Date.now().toString().slice(-4);
        var nowISO = new Date().toISOString();
        var dbSaved = false;
        var dbMethod = 'none';
        var dbError = null;

        // ═══════ PERSISTÊNCIA 1: PostgreSQL via SQL direto (bypass schema cache) ═══════
        try {
          var sqlInsert = `INSERT INTO affiliates (user_id, code, status, name, email, referral_code, commission_rate, total_earnings, pending_balance, available_balance, total_referrals, total_clicks, created_at, updated_at) VALUES ('${aUserId}', '${refCode}', 'active', '${aName.replace(/'/g, "''")}', '${aEmail.replace(/'/g, "''")}', '${refCode}', 0.20, 0, 0, 0, 0, 0, '${nowISO}', '${nowISO}') ON CONFLICT (user_id) DO UPDATE SET status = 'active', name = '${aName.replace(/'/g, "''")}', email = '${aEmail.replace(/'/g, "''")}', updated_at = '${nowISO}' RETURNING id, user_id, code, status, name, email;`;
          var { data: rpcData, error: rpcErr } = await supabase.rpc('exec_sql', { sql: sqlInsert });
          if (!rpcErr) {
            dbSaved = true;
            dbMethod = 'rpc_exec_sql';
            console.log('✅ Afiliado salvo no PostgreSQL via exec_sql');
          } else {
            console.warn('⚠️ exec_sql falhou:', rpcErr.message);
            dbError = rpcErr.message;
          }
        } catch (e) {
          console.warn('⚠️ exec_sql exception:', e.message);
          dbError = e.message;
        }

        // ═══════ PERSISTÊNCIA 2: Fallback via PostgREST com colunas mínimas ═══════
        if (!dbSaved) {
          var columnSets = [
            { user_id: aUserId, code: refCode, status: 'active', name: aName, email: aEmail },
            { user_id: aUserId, code: refCode, status: 'active' },
            { user_id: aUserId, code: refCode },
            { user_id: aUserId }
          ];
          for (var ci = 0; ci < columnSets.length; ci++) {
            try {
              var { error: pgErr } = await supabase.from('affiliates').upsert(columnSets[ci], { onConflict: 'user_id' });
              if (!pgErr) {
                dbSaved = true;
                dbMethod = 'postgrest_attempt_' + (ci + 1);
                dbError = null;
                console.log('✅ Afiliado salvo no PostgreSQL via PostgREST tentativa ' + (ci + 1));
                break;
              }
              dbError = pgErr.message;
              console.warn('⚠️ PostgREST tentativa ' + (ci + 1) + ' falhou:', pgErr.message);
            } catch (e2) {
              dbError = e2.message;
            }
          }
        }

        // ═══════ PERSISTÊNCIA 3: Auth user_metadata (backup garantido) ═══════
        var affiliateData = {
          affiliate_active: true,
          affiliate_name: aName,
          affiliate_email: aEmail,
          affiliate_referral_code: refCode,
          affiliate_commission_rate: 0.20,
          affiliate_total_earnings: 0,
          affiliate_pending_balance: 0,
          affiliate_available_balance: 0,
          affiliate_total_referrals: 0,
          affiliate_total_clicks: 0,
          affiliate_created_at: nowISO,
          affiliate_db_saved: dbSaved,
          affiliate_db_method: dbMethod
        };

        var { error: metaErr } = await supabase.auth.admin.updateUserById(aUserId, {
          user_metadata: Object.assign({}, existingMeta, affiliateData)
        });

        if (metaErr) {
          console.error('Erro ao salvar affiliate metadata:', metaErr);
          return res.status(500).json({ error: 'Erro ao ativar afiliado', details: metaErr.message });
        }

        console.log('✅ Afiliado ativado | DB:', dbSaved ? dbMethod : 'FALHOU', '| Metadata: OK | Code:', refCode);
        return res.status(201).json({
          success: true,
          message: 'Afiliado ativado com sucesso',
          storage: {
            metadata: true,
            database: dbSaved,
            db_method: dbMethod,
            db_error: dbSaved ? null : dbError
          },
          affiliate: {
            id: aUserId, user_id: aUserId, name: aName, email: aEmail,
            referral_code: refCode, status: 'active', commission_rate: 0.20,
            total_earnings: 0, pending_balance: 0, available_balance: 0,
            total_referrals: 0, total_clicks: 0,
            created_at: nowISO, updated_at: nowISO
          }
        });
      }
      case 'affiliate/get': {
        var gUserId = req.query.userId || req.body?.userId;
        if (!gUserId) return res.status(400).json({ error: 'userId required' });

        var gUser = await supabase.auth.admin.getUserById(gUserId);
        var gMeta = gUser?.data?.user?.user_metadata || {};

        if (!gMeta.affiliate_active) {
          return res.status(200).json({ success: true, affiliate: null });
        }

        return res.status(200).json({
          success: true,
          affiliate: {
            id: gUserId, user_id: gUserId,
            name: gMeta.affiliate_name || '', email: gMeta.affiliate_email || '',
            referral_code: gMeta.affiliate_referral_code || '',
            status: 'active', commission_rate: gMeta.affiliate_commission_rate || 0.20,
            total_earnings: gMeta.affiliate_total_earnings || 0,
            pending_balance: gMeta.affiliate_pending_balance || 0,
            available_balance: gMeta.affiliate_available_balance || 0,
            total_referrals: gMeta.affiliate_total_referrals || 0,
            total_clicks: gMeta.affiliate_total_clicks || 0,
            bank_name: gMeta.affiliate_bank_name || null,
            bank_agency: gMeta.affiliate_bank_agency || null,
            bank_account: gMeta.affiliate_bank_account || null,
            bank_account_type: gMeta.affiliate_bank_account_type || null,
            pix_key: gMeta.affiliate_pix_key || null,
            pix_key_type: gMeta.affiliate_pix_key_type || null,
            account_holder_name: gMeta.affiliate_account_holder_name || null,
            account_holder_cpf: gMeta.affiliate_account_holder_cpf || null,
            payment_method: gMeta.affiliate_payment_method || null,
            created_at: gMeta.affiliate_created_at || '', updated_at: new Date().toISOString()
          }
        });
      }
      case 'affiliate/update-banking': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        var bUserId = req.body?.userId;
        if (!bUserId) return res.status(400).json({ error: 'userId required' });

        var bUser = await supabase.auth.admin.getUserById(bUserId);
        var bMeta = bUser?.data?.user?.user_metadata || {};

        var bankingData = {};
        if (req.body.bank_name !== undefined) bankingData.affiliate_bank_name = req.body.bank_name;
        if (req.body.bank_agency !== undefined) bankingData.affiliate_bank_agency = req.body.bank_agency;
        if (req.body.bank_account !== undefined) bankingData.affiliate_bank_account = req.body.bank_account;
        if (req.body.bank_account_type !== undefined) bankingData.affiliate_bank_account_type = req.body.bank_account_type;
        if (req.body.pix_key !== undefined) bankingData.affiliate_pix_key = req.body.pix_key;
        if (req.body.pix_key_type !== undefined) bankingData.affiliate_pix_key_type = req.body.pix_key_type;
        if (req.body.account_holder_name !== undefined) bankingData.affiliate_account_holder_name = req.body.account_holder_name;
        if (req.body.account_holder_cpf !== undefined) bankingData.affiliate_account_holder_cpf = req.body.account_holder_cpf;
        if (req.body.payment_method !== undefined) bankingData.affiliate_payment_method = req.body.payment_method;

        await supabase.auth.admin.updateUserById(bUserId, {
          user_metadata: Object.assign({}, bMeta, bankingData)
        });

        return res.status(200).json({ success: true, message: 'Dados bancários atualizados' });
      }
      case 'affiliate/dashboard': {
        const userId = req.query.userId || req.body?.userId;
        if (!userId) return res.status(400).json({ error: 'userId required' });

        // Buscar dados do user_metadata
        var dUser = await supabase.auth.admin.getUserById(userId);
        var dMeta = dUser?.data?.user?.user_metadata || {};

        return res.status(200).json({
          success: true,
          data: {
            clicks: dMeta.affiliate_total_clicks || 0,
            conversions: dMeta.affiliate_total_referrals || 0,
            earnings: dMeta.affiliate_total_earnings || 0,
            referral_code: dMeta.affiliate_referral_code || ''
          }
        });
      }
      case 'affiliate/create': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        // Redirecionar para activate
        var cUserId = req.body?.userId;
        var cCode = req.body?.code || '';
        if (!cUserId) return res.status(400).json({ error: 'userId required' });

        var cUser = await supabase.auth.admin.getUserById(cUserId);
        var cMeta = cUser?.data?.user?.user_metadata || {};
        var cRef = cCode || cMeta.affiliate_referral_code || 'VIR' + cUserId.slice(-6).toUpperCase() + Date.now().toString().slice(-4);

        await supabase.auth.admin.updateUserById(cUserId, {
          user_metadata: Object.assign({}, cMeta, {
            affiliate_active: true,
            affiliate_referral_code: cRef,
            affiliate_created_at: cMeta.affiliate_created_at || new Date().toISOString()
          })
        });

        return res.status(201).json({ success: true, affiliate: { user_id: cUserId, code: cRef, status: 'active', referral_code: cRef } });
      }
      case 'affiliate/track-click': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { code } = req.body;
        // Tentar registrar click na tabela (best-effort)
        try { await supabase.from('affiliate_clicks').insert({ affiliate_code: code, ip: req.headers['x-forwarded-for'] || 'unknown' }); } catch(e) {}
        return res.status(200).json({ success: true });
      }
      case 'affiliate/list-all': {
        // Listar TODOS os afiliados do sistema (via auth users metadata)
        try {
          var page = 1;
          var allAffiliates = [];
          var hasMore = true;
          while (hasMore && page <= 10) {
            var { data: listData, error: listErr } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
            if (listErr || !listData?.users?.length) { hasMore = false; break; }
            for (var u of listData.users) {
              var m = u.user_metadata || {};
              if (m.affiliate_active) {
                allAffiliates.push({
                  id: u.id, user_id: u.id,
                  name: m.affiliate_name || m.name || u.email?.split('@')[0] || '',
                  email: m.affiliate_email || u.email || '',
                  referral_code: m.affiliate_referral_code || '',
                  status: 'active',
                  commission_rate: m.affiliate_commission_rate || 0.20,
                  total_earnings: m.affiliate_total_earnings || 0,
                  pending_balance: m.affiliate_pending_balance || 0,
                  available_balance: m.affiliate_available_balance || 0,
                  total_referrals: m.affiliate_total_referrals || 0,
                  total_clicks: m.affiliate_total_clicks || 0,
                  created_at: m.affiliate_created_at || u.created_at || '',
                  updated_at: new Date().toISOString()
                });
              }
            }
            hasMore = listData.users.length === 100;
            page++;
          }
          return res.status(200).json({ success: true, affiliates: allAffiliates, total: allAffiliates.length });
        } catch (e) {
          console.error('Erro ao listar afiliados:', e);
          return res.status(500).json({ error: 'Erro ao listar afiliados', details: e.message });
        }
      }
      case 'admin/users': {
        // Listar TODOS os usuários do Supabase auth
        try {
          var uPage = 1;
          var allUsers = [];
          var uHasMore = true;
          while (uHasMore && uPage <= 10) {
            var { data: uListData, error: uListErr } = await supabase.auth.admin.listUsers({ page: uPage, perPage: 100 });
            if (uListErr || !uListData?.users?.length) { uHasMore = false; break; }
            for (var au of uListData.users) {
              var um = au.user_metadata || {};
              allUsers.push({
                id: au.id,
                name: um.name || au.email?.split('@')[0] || '',
                email: au.email || '',
                plan: um.plan || null,
                status: au.email_confirmed_at ? 'Ativo' : 'Pendente',
                created_at: au.created_at || '',
                last_sign_in: au.last_sign_in_at || null,
                is_affiliate: !!um.affiliate_active,
                affiliate_code: um.affiliate_referral_code || null
              });
            }
            uHasMore = uListData.users.length === 100;
            uPage++;
          }
          return res.status(200).json({ success: true, users: allUsers, total: allUsers.length });
        } catch (e) {
          console.error('Erro ao listar usuarios:', e);
          return res.status(500).json({ error: 'Erro ao listar usuarios', details: e.message });
        }
      }
      case 'admin/dashboard-stats': {
        try {
          // 1. Listar todos os users
          var dsPage = 1; var dsUsers = []; var dsMore = true;
          while (dsMore && dsPage <= 10) {
            var { data: dsData, error: dsErr } = await supabase.auth.admin.listUsers({ page: dsPage, perPage: 100 });
            if (dsErr || !dsData?.users?.length) { dsMore = false; break; }
            dsUsers = dsUsers.concat(dsData.users);
            dsMore = dsData.users.length === 100;
            dsPage++;
          }
          var totalUsers = dsUsers.length;
          var activeUsers = dsUsers.filter(u => u.email_confirmed_at).length;
          var affiliateUsers = dsUsers.filter(u => u.user_metadata?.affiliate_active).length;

          // 2. Buscar assinaturas ativas do banco
          var { data: subs } = await supabase.from('subscriptions').select('*').eq('status', 'active');
          var activeSubscriptions = (subs || []).length;

          // Calcular receita por plano
          var planPrices = { 'Anual': 399.90, 'anual': 399.90, 'Semestral': 259.90, 'semestral': 259.90, 'Trimestral': 159.90, 'trimestral': 159.90, 'Mensal': 59.90, 'mensal': 59.90 };
          var mrr = 0;
          var planDistribution = {};
          (subs || []).forEach(function(s) {
            var plan = s.plan_name || s.plan || 'mensal';
            var price = planPrices[plan] || 59.90;
            mrr += price;
            planDistribution[plan] = (planDistribution[plan] || 0) + 1;
          });

          // Also count plans from user_metadata for users without subscriptions table entries
          dsUsers.forEach(function(u) {
            var um = u.user_metadata || {};
            if (um.plan && !subs?.find(s => s.user_id === u.id)) {
              var price = planPrices[um.plan] || 0;
              mrr += price;
              planDistribution[um.plan] = (planDistribution[um.plan] || 0) + 1;
            }
          });

          // 3. Buscar pagamentos PIX pendentes
          var { data: pixPending } = await supabase.from('subscriptions').select('id').eq('status', 'pending_payment');
          var pendingPayments = (pixPending || []).length;

          // 4. Últimos 5 users cadastrados
          var recentUsers = dsUsers
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
            .map(u => ({
              id: u.id,
              name: u.user_metadata?.name || u.email?.split('@')[0] || '',
              email: u.email || '',
              plan: u.user_metadata?.plan || null,
              created_at: u.created_at,
              is_affiliate: !!u.user_metadata?.affiliate_active
            }));

          return res.status(200).json({
            success: true,
            stats: {
              totalUsers, activeUsers, affiliateUsers, activeSubscriptions, pendingPayments,
              mrr, arr: mrr * 12, ltv: mrr > 0 ? (mrr * 12 / Math.max(activeSubscriptions, 1)) : 0,
              planDistribution
            },
            recentUsers
          });
        } catch (e) {
          console.error('Erro dashboard-stats:', e);
          return res.status(500).json({ error: 'Erro ao buscar stats', details: e.message });
        }
      }
      case 'admin/financial': {
        try {
          // Buscar todas as subscriptions
          var { data: allSubs } = await supabase.from('subscriptions').select('*').order('created_at', { ascending: false });
          var transactions = (allSubs || []).map(function(s) {
            var fPlanPrices = { 'Anual': 399.90, 'anual': 399.90, 'Semestral': 259.90, 'semestral': 259.90, 'Trimestral': 159.90, 'trimestral': 159.90, 'Mensal': 59.90, 'mensal': 59.90 };
            return {
              id: s.id,
              userId: s.user_id,
              amount: s.amount || fPlanPrices[s.plan_name || s.plan || 'mensal'] || 0,
              plan: s.plan_name || s.plan || 'N/A',
              status: s.status || 'pending',
              date: s.created_at || s.updated_at || '',
              paymentMethod: s.payment_method || 'pix',
              description: 'Assinatura ' + (s.plan_name || s.plan || '')
            };
          });

          var totalRevenue = transactions.filter(t => t.status === 'active' || t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
          var pendingRevenue = transactions.filter(t => t.status === 'pending' || t.status === 'pending_payment').reduce((sum, t) => sum + t.amount, 0);

          return res.status(200).json({
            success: true,
            transactions,
            totalRevenue,
            pendingRevenue,
            totalTransactions: transactions.length
          });
        } catch (e) {
          console.error('Erro financial:', e);
          return res.status(500).json({ error: 'Erro ao buscar dados financeiros', details: e.message });
        }
      }
      case 'admin/payment-configs': {
        // Buscar configs de pagamento do banco
        try {
          var { data: payConfigs } = await supabase.from('system_settings').select('*').in('key', ['payment_stripe', 'payment_paypal', 'payment_pix', 'payment_crypto']);
          var configMap = {};
          (payConfigs || []).forEach(function(c) {
            var k = c.key.replace('payment_', '');
            configMap[k] = c.value || {};
          });
          return res.status(200).json(configMap);
        } catch (e) {
          return res.status(200).json({ stripe: null, paypal: null, pix: null, crypto: null });
        }
      }
      case 'admin/tool-pricing': {
        if (req.method === 'POST') {
          // SAVE tool pricing
          try {
            var toolBody = req.body || {};
            if (!toolBody.tools || !Array.isArray(toolBody.tools)) {
              return res.status(400).json({ error: 'tools array required' });
            }
            for (var ti = 0; ti < toolBody.tools.length; ti++) {
              var t = toolBody.tools[ti];
              await supabase.from('tool_pricing').upsert({
                tool_id: t.tool_id || t.id,
                name: t.name,
                price: parseFloat(t.price) || 0,
                category: t.category || 'tool',
                description: t.description || '',
                plan_tier: t.planTier || t.plan_tier || 1,
                icon: t.icon || '',
                popular: t.popular || false,
                is_active: t.is_active !== false,
                updated_at: new Date().toISOString()
              }, { onConflict: 'tool_id' });
            }
            return res.status(200).json({ success: true, message: 'Tool pricing saved', count: toolBody.tools.length });
          } catch (e) {
            console.error('Erro ao salvar tool pricing:', e);
            return res.status(500).json({ error: e.message });
          }
        }
        // GET tool pricing
        try {
          var { data: toolRows, error: toolErr } = await supabase.from('tool_pricing').select('*').order('tool_id', { ascending: true });
          if (toolErr) {
            console.error('Erro tool_pricing:', toolErr);
            return res.status(200).json({ success: true, tools: [] });
          }
          return res.status(200).json({ success: true, tools: toolRows || [] });
        } catch (e) {
          return res.status(200).json({ success: true, tools: [] });
        }
      }
      // ============================================================
      // OPENAI COSTS + CREDITS + USAGE SYSTEM
      // ============================================================
      case 'admin/openai-costs': {
        if (req.method === 'POST') {
          try {
            var costBody = req.body || {};
            if (!costBody.costs || !Array.isArray(costBody.costs)) {
              return res.status(400).json({ error: 'costs array required' });
            }
            for (var ci = 0; ci < costBody.costs.length; ci++) {
              var c = costBody.costs[ci];
              await supabase.from('openai_unit_costs').upsert({
                id: c.id || undefined,
                model_key: c.model_key,
                model_name: c.model_name,
                charge_type: c.charge_type,
                cost_input_usd: parseFloat(c.cost_input_usd) || 0,
                cost_output_usd: parseFloat(c.cost_output_usd) || 0,
                notes: c.notes || '',
                last_updated: new Date().toISOString()
              }, { onConflict: 'model_key' });
            }
            return res.status(200).json({ success: true, message: 'OpenAI costs saved', count: costBody.costs.length });
          } catch (e) {
            console.error('Erro ao salvar openai costs:', e);
            return res.status(500).json({ error: e.message });
          }
        }
        // GET
        try {
          var { data: costRows, error: costErr } = await supabase.from('openai_unit_costs').select('*').order('id', { ascending: true });
          if (costErr) {
            // Table may not exist yet - return defaults
            return res.status(200).json({ success: true, costs: [], needsInit: true });
          }
          return res.status(200).json({ success: true, costs: costRows || [] });
        } catch (e) {
          return res.status(200).json({ success: true, costs: [], needsInit: true });
        }
      }
      case 'admin/platform-config': {
        if (req.method === 'POST') {
          try {
            var pcBody = req.body || {};
            var configItems = [];
            if (pcBody.usd_brl_rate !== undefined) configItems.push({ key: 'usd_brl_rate', value: JSON.stringify(pcBody.usd_brl_rate), updated_at: new Date().toISOString() });
            if (pcBody.default_margin_percent !== undefined) configItems.push({ key: 'default_margin_percent', value: JSON.stringify(pcBody.default_margin_percent), updated_at: new Date().toISOString() });
            if (pcBody.credit_markup_percent !== undefined) configItems.push({ key: 'credit_markup_percent', value: JSON.stringify(pcBody.credit_markup_percent), updated_at: new Date().toISOString() });
            if (configItems.length > 0) {
              await supabase.from('system_settings').upsert(configItems, { onConflict: 'key' });
            }
            return res.status(200).json({ success: true, message: 'Platform config saved' });
          } catch (e) {
            return res.status(500).json({ error: e.message });
          }
        }
        // GET
        try {
          var { data: pcRows } = await supabase.from('system_settings').select('key, value').in('key', ['usd_brl_rate', 'default_margin_percent', 'credit_markup_percent']);
          var pcResult = { usd_brl_rate: 5.40, default_margin_percent: 300, credit_markup_percent: 300 };
          (pcRows || []).forEach(function(r) {
            try { pcResult[r.key] = JSON.parse(r.value); } catch(e) { pcResult[r.key] = r.value; }
          });
          return res.status(200).json({ success: true, config: pcResult });
        } catch (e) {
          return res.status(200).json({ success: true, config: { usd_brl_rate: 5.40, default_margin_percent: 300, credit_markup_percent: 300 } });
        }
      }
      case 'user/credits': {
        var credUserId = req.query.userId || req.body?.userId;
        if (!credUserId) return res.status(400).json({ error: 'userId required' });

        // PUT = Admin approve pending PIX credit purchase
        if (req.method === 'PUT') {
          try {
            var approveBody = req.body || {};
            var txId = approveBody.transaction_id;
            if (!txId) return res.status(400).json({ error: 'transaction_id required' });
            // Get pending transaction
            var { data: pendingTx } = await supabase.from('credit_transactions').select('*').eq('id', txId).eq('status', 'pending_pix').maybeSingle();
            if (!pendingTx) return res.status(404).json({ error: 'Transação pendente não encontrada' });
            // Approve: add credits to user balance
            var approveUserId = pendingTx.user_id;
            var approveAmount = pendingTx.amount || 0;
            var { data: existCredApprove } = await supabase.from('user_credits').select('*').eq('user_id', approveUserId).maybeSingle();
            var newBalApprove = (existCredApprove?.balance || 0) + approveAmount;
            await supabase.from('user_credits').upsert({
              user_id: approveUserId,
              balance: newBalApprove,
              total_purchased: (existCredApprove?.total_purchased || 0) + approveAmount,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
            // Update transaction status
            await supabase.from('credit_transactions').update({ status: 'completed', approved_at: new Date().toISOString() }).eq('id', txId);
            return res.status(200).json({ success: true, balance: newBalApprove, message: `${approveAmount} créditos liberados` });
          } catch (e) {
            return res.status(500).json({ error: e.message });
          }
        }

        if (req.method === 'POST') {
          // Purchase extra credits
          try {
            var credBody = req.body || {};
            var credAmount = parseFloat(credBody.amount) || 0;
            var credToolId = credBody.tool_id || 'general';
            var credPayMethod = credBody.payment_method || 'stripe';
            var credStatus = credBody.status || 'completed';

            // PIX: create PENDING transaction, do NOT add credits yet
            if (credStatus === 'pending_pix' || credPayMethod === 'pix') {
              await supabase.from('credit_transactions').insert({
                user_id: credUserId,
                type: 'purchase',
                amount: credAmount,
                price_brl: parseFloat(credBody.price_brl) || 0,
                tool_id: credToolId,
                payment_method: 'pix',
                status: 'pending_pix',
                created_at: new Date().toISOString()
              });
              return res.status(200).json({ success: true, message: 'Pedido PIX registrado. Aguardando aprovação do admin.', pending: true });
            }

            // Stripe/completed: add credits immediately (called by webhook)
            var { data: existCred } = await supabase.from('user_credits').select('*').eq('user_id', credUserId).maybeSingle();
            var newBalance = (existCred?.balance || 0) + credAmount;
            await supabase.from('user_credits').upsert({
              user_id: credUserId,
              balance: newBalance,
              total_purchased: (existCred?.total_purchased || 0) + credAmount,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
            // Log transaction
            await supabase.from('credit_transactions').insert({
              user_id: credUserId,
              type: 'purchase',
              amount: credAmount,
              price_brl: parseFloat(credBody.price_brl) || 0,
              tool_id: credToolId,
              payment_method: credPayMethod,
              status: 'completed',
              created_at: new Date().toISOString()
            });
            return res.status(200).json({ success: true, balance: newBalance });
          } catch (e) {
            return res.status(500).json({ error: e.message });
          }
        }
        // GET credits balance
        try {
          var { data: userCred } = await supabase.from('user_credits').select('*').eq('user_id', credUserId).maybeSingle();
          var { data: userUsage } = await supabase.from('usage_log').select('tool_id, tool_name, tokens_used, images_generated, audio_minutes').eq('user_id', credUserId).gte('created_at', new Date(new Date().setDate(1)).toISOString());
          // Also get pending PIX transactions
          var { data: pendingTxs } = await supabase.from('credit_transactions').select('*').eq('user_id', credUserId).eq('status', 'pending_pix').order('created_at', { ascending: false });
          return res.status(200).json({
            success: true,
            credits: userCred || { balance: 0, total_purchased: 0 },
            usage_this_month: userUsage || [],
            pending_purchases: pendingTxs || []
          });
        } catch (e) {
          return res.status(200).json({ success: true, credits: { balance: 0, total_purchased: 0 }, usage_this_month: [], pending_purchases: [] });
        }
      }
      case 'user/usage': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        try {
          var usageBody = req.body || {};
          var usageUserId = usageBody.userId;
          if (!usageUserId) return res.status(400).json({ error: 'userId required' });
          // Log usage
          await supabase.from('usage_log').insert({
            user_id: usageUserId,
            tool_id: usageBody.tool_id,
            tool_name: usageBody.tool_name || '',
            tokens_used: parseInt(usageBody.tokens_used) || 0,
            images_generated: parseInt(usageBody.images_generated) || 0,
            audio_minutes: parseFloat(usageBody.audio_minutes) || 0,
            openai_model: usageBody.openai_model || 'gpt-4o',
            cost_usd: parseFloat(usageBody.cost_usd) || 0,
            cost_brl: parseFloat(usageBody.cost_brl) || 0,
            created_at: new Date().toISOString()
          });
          // Deduct from credits if not on plan
          if (usageBody.deduct_credits) {
            var deductAmt = parseFloat(usageBody.credits_to_deduct) || 1;
            var { data: uc } = await supabase.from('user_credits').select('balance').eq('user_id', usageUserId).maybeSingle();
            if (uc) {
              await supabase.from('user_credits').update({
                balance: Math.max(0, (uc.balance || 0) - deductAmt),
                updated_at: new Date().toISOString()
              }).eq('user_id', usageUserId);
            }
          }
          return res.status(200).json({ success: true, message: 'Usage logged' });
        } catch (e) {
          return res.status(500).json({ error: e.message });
        }
      }
      case 'user/check-limit': {
        var limitUserId = req.query.userId;
        var limitToolId = req.query.toolId;
        if (!limitUserId) return res.status(400).json({ error: 'userId required' });
        try {
          // Get user plan
          var { data: limitSub } = await supabase.from('subscriptions').select('plan_type, status').eq('user_id', limitUserId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
          var userPlanKey = limitSub ? getPlanKey(limitSub.plan_type) : null;
          // Get tool limits
          var { data: limitTool } = await supabase.from('tool_pricing').select('*').eq('tool_id', limitToolId).maybeSingle();
          // Get usage this month
          var monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
          var { data: monthUsage } = await supabase.from('usage_log').select('tokens_used, images_generated, audio_minutes').eq('user_id', limitUserId).eq('tool_id', limitToolId).gte('created_at', monthStart);
          var totalTokens = (monthUsage || []).reduce(function(s, u) { return s + (u.tokens_used || 0); }, 0);
          var totalImages = (monthUsage || []).reduce(function(s, u) { return s + (u.images_generated || 0); }, 0);
          var totalAudio = (monthUsage || []).reduce(function(s, u) { return s + (u.audio_minutes || 0); }, 0);
          var usageLimit = (limitTool?.usage_limit_plan) || 50000;
          var limitReached = totalTokens >= usageLimit;
          // Check credits
          var { data: limitCred } = await supabase.from('user_credits').select('balance').eq('user_id', limitUserId).maybeSingle();
          return res.status(200).json({
            success: true,
            has_plan: !!userPlanKey,
            plan: userPlanKey,
            tool_id: limitToolId,
            usage: { tokens: totalTokens, images: totalImages, audio_minutes: totalAudio },
            limit: usageLimit,
            limit_reached: limitReached,
            credits_balance: limitCred?.balance || 0,
            can_use: !limitReached || (limitCred?.balance || 0) > 0
          });
        } catch (e) {
          return res.status(200).json({ success: true, can_use: true, limit_reached: false, credits_balance: 0 });
        }
      }
      case 'admin/financial-report': {
        // Financial dashboard: revenue vs OpenAI cost vs margin
        try {
          var reportPeriod = req.query.period || 'month';
          var reportStart;
          var now = new Date();
          if (reportPeriod === 'week') reportStart = new Date(now.getTime() - 7 * 86400000).toISOString();
          else if (reportPeriod === 'month') reportStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          else if (reportPeriod === 'year') reportStart = new Date(now.getFullYear(), 0, 1).toISOString();
          else reportStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          // Usage costs
          var { data: usageLogs } = await supabase.from('usage_log').select('tool_id, tool_name, tokens_used, images_generated, audio_minutes, cost_usd, cost_brl, openai_model').gte('created_at', reportStart);
          // Revenue from credit purchases
          var { data: creditTxns } = await supabase.from('credit_transactions').select('amount, price_brl, tool_id, type').gte('created_at', reportStart);
          // Revenue from subscriptions
          var { data: subRevenue } = await supabase.from('subscriptions').select('plan_type, amount, status').gte('created_at', reportStart).eq('status', 'active');
          // Platform config for rate
          var { data: rateRow } = await supabase.from('system_settings').select('value').eq('key', 'usd_brl_rate').maybeSingle();
          var rate = 5.40;
          try { rate = JSON.parse(rateRow?.value) || 5.40; } catch(e) {}
          var totalCostUsd = (usageLogs || []).reduce(function(s, u) { return s + (u.cost_usd || 0); }, 0);
          var totalCostBrl = totalCostUsd * rate;
          var totalCreditRevenue = (creditTxns || []).filter(function(t) { return t.type === 'purchase'; }).reduce(function(s, t) { return s + (t.price_brl || 0); }, 0);
          var totalSubRevenue = (subRevenue || []).reduce(function(s, t) { return s + (parseFloat(t.amount) || 0); }, 0);
          var totalRevenue = totalCreditRevenue + totalSubRevenue;
          var margin = totalRevenue - totalCostBrl;
          var marginPercent = totalRevenue > 0 ? ((margin / totalRevenue) * 100).toFixed(1) : 0;
          // Per-tool breakdown
          var toolBreakdown = {};
          (usageLogs || []).forEach(function(u) {
            var key = u.tool_name || u.tool_id || 'unknown';
            if (!toolBreakdown[key]) toolBreakdown[key] = { tool: key, cost_usd: 0, tokens: 0, images: 0, audio: 0, uses: 0 };
            toolBreakdown[key].cost_usd += (u.cost_usd || 0);
            toolBreakdown[key].tokens += (u.tokens_used || 0);
            toolBreakdown[key].images += (u.images_generated || 0);
            toolBreakdown[key].audio += (u.audio_minutes || 0);
            toolBreakdown[key].uses += 1;
          });
          return res.status(200).json({
            success: true,
            period: reportPeriod,
            usd_brl_rate: rate,
            total_cost_usd: totalCostUsd,
            total_cost_brl: totalCostBrl,
            total_credit_revenue: totalCreditRevenue,
            total_sub_revenue: totalSubRevenue,
            total_revenue: totalRevenue,
            margin_brl: margin,
            margin_percent: marginPercent,
            tool_breakdown: Object.values(toolBreakdown),
            usage_count: (usageLogs || []).length,
            credit_transactions: (creditTxns || []).length
          });
        } catch (e) {
          console.error('Financial report error:', e);
          return res.status(200).json({ success: true, total_revenue: 0, total_cost_brl: 0, margin_brl: 0 });
        }
      }
      case 'database/init-credits': {
        // Initialize all credit/costs tables
        var initResults = [];
        var sqlStatements = [
          `CREATE TABLE IF NOT EXISTS openai_unit_costs (
            id serial primary key,
            model_key text unique not null,
            model_name text not null,
            charge_type text not null default 'tokens',
            cost_input_usd numeric default 0,
            cost_output_usd numeric default 0,
            notes text default '',
            last_updated timestamptz default now()
          )`,
          `CREATE TABLE IF NOT EXISTS user_credits (
            user_id text primary key,
            balance numeric default 0,
            total_purchased numeric default 0,
            updated_at timestamptz default now()
          )`,
          `CREATE TABLE IF NOT EXISTS credit_transactions (
            id serial primary key,
            user_id text not null,
            type text not null default 'purchase',
            amount numeric default 0,
            price_brl numeric default 0,
            tool_id text,
            payment_method text default 'pix',
            status text default 'pending',
            created_at timestamptz default now()
          )`,
          `CREATE TABLE IF NOT EXISTS usage_log (
            id serial primary key,
            user_id text not null,
            tool_id text,
            tool_name text,
            tokens_used integer default 0,
            images_generated integer default 0,
            audio_minutes numeric default 0,
            openai_model text default 'gpt-4o',
            cost_usd numeric default 0,
            cost_brl numeric default 0,
            created_at timestamptz default now()
          )`,
          `ALTER TABLE tool_pricing ADD COLUMN IF NOT EXISTS openai_model_key text default 'gpt-4o'`,
          `ALTER TABLE tool_pricing ADD COLUMN IF NOT EXISTS avg_tokens_per_use integer default 2000`,
          `ALTER TABLE tool_pricing ADD COLUMN IF NOT EXISTS margin_percent numeric default 300`,
          `ALTER TABLE tool_pricing ADD COLUMN IF NOT EXISTS usage_limit_plan integer default 50000`,
          `ALTER TABLE tool_pricing ADD COLUMN IF NOT EXISTS credit_price_brl numeric default 0`
        ];
        for (var si = 0; si < sqlStatements.length; si++) {
          try {
            var { error: sqlErr } = await supabase.rpc('exec_sql', { sql: sqlStatements[si] });
            initResults.push({ sql: sqlStatements[si].substring(0, 60), status: sqlErr ? 'rpc_error' : 'ok', error: sqlErr?.message });
          } catch (sqlE) {
            initResults.push({ sql: sqlStatements[si].substring(0, 60), status: 'error', error: sqlE.message });
          }
        }
        // Seed default OpenAI costs
        var defaultCosts = [
          { model_key: 'gpt-4o', model_name: 'GPT-4o', charge_type: '1000 tokens', cost_input_usd: 0.005, cost_output_usd: 0.015, notes: 'Modelo principal' },
          { model_key: 'gpt-4-turbo', model_name: 'GPT-4 Turbo', charge_type: '1000 tokens', cost_input_usd: 0.01, cost_output_usd: 0.03, notes: 'Alta performance' },
          { model_key: 'gpt-3.5-turbo', model_name: 'GPT-3.5 Turbo', charge_type: '1000 tokens', cost_input_usd: 0.0005, cost_output_usd: 0.0015, notes: 'Econômico' },
          { model_key: 'dall-e-3', model_name: 'DALL·E 3', charge_type: 'por imagem', cost_input_usd: 0.04, cost_output_usd: 0, notes: 'Geração de imagens' },
          { model_key: 'dall-e-2', model_name: 'DALL·E 2', charge_type: 'por imagem', cost_input_usd: 0.02, cost_output_usd: 0, notes: 'Imagens econômicas' },
          { model_key: 'whisper-1', model_name: 'Whisper', charge_type: 'por minuto', cost_input_usd: 0.006, cost_output_usd: 0, notes: 'Speech-to-text' },
          { model_key: 'tts-1', model_name: 'TTS-1', charge_type: 'por 1M caracteres', cost_input_usd: 15.0, cost_output_usd: 0, notes: 'Text-to-speech' },
          { model_key: 'tts-1-hd', model_name: 'TTS-1 HD', charge_type: 'por 1M caracteres', cost_input_usd: 30.0, cost_output_usd: 0, notes: 'Text-to-speech HD' }
        ];
        for (var di = 0; di < defaultCosts.length; di++) {
          try {
            await supabase.from('openai_unit_costs').upsert({
              ...defaultCosts[di],
              last_updated: new Date().toISOString()
            }, { onConflict: 'model_key' });
            initResults.push({ seed: defaultCosts[di].model_key, status: 'ok' });
          } catch (seedE) {
            initResults.push({ seed: defaultCosts[di].model_key, status: 'error', error: seedE.message });
          }
        }
        // Seed platform config defaults
        var defaultConfigs = [
          { key: 'usd_brl_rate', value: JSON.stringify(5.40) },
          { key: 'default_margin_percent', value: JSON.stringify(300) },
          { key: 'credit_markup_percent', value: JSON.stringify(300) }
        ];
        for (var dci = 0; dci < defaultConfigs.length; dci++) {
          try {
            await supabase.from('system_settings').upsert({
              ...defaultConfigs[dci],
              updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
          } catch(e) {}
        }
        // Update tool_pricing with OpenAI model mappings
        var toolModelMap = [
          { tool_id: '1', openai_model_key: 'gpt-4o', avg_tokens_per_use: 3000, usage_limit_plan: 50000 },
          { tool_id: '2', openai_model_key: 'dall-e-3', avg_tokens_per_use: 1, usage_limit_plan: 100 },
          { tool_id: '3', openai_model_key: 'gpt-4o', avg_tokens_per_use: 2000, usage_limit_plan: 40000 },
          { tool_id: '4', openai_model_key: 'gpt-4o', avg_tokens_per_use: 2500, usage_limit_plan: 40000 },
          { tool_id: '5', openai_model_key: 'gpt-3.5-turbo', avg_tokens_per_use: 1000, usage_limit_plan: 60000 },
          { tool_id: '6', openai_model_key: 'dall-e-3', avg_tokens_per_use: 1, usage_limit_plan: 80 },
          { tool_id: '7', openai_model_key: 'gpt-3.5-turbo', avg_tokens_per_use: 500, usage_limit_plan: 50000 },
          { tool_id: '8', openai_model_key: 'gpt-4o', avg_tokens_per_use: 4000, usage_limit_plan: 60000 },
          { tool_id: '9', openai_model_key: 'gpt-4o', avg_tokens_per_use: 3000, usage_limit_plan: 50000 },
          { tool_id: '10', openai_model_key: 'gpt-3.5-turbo', avg_tokens_per_use: 500, usage_limit_plan: 40000 },
          { tool_id: '11', openai_model_key: 'gpt-4o', avg_tokens_per_use: 5000, usage_limit_plan: 80000 },
          { tool_id: '12', openai_model_key: 'gpt-4o', avg_tokens_per_use: 8000, usage_limit_plan: 100000 },
          { tool_id: '13', openai_model_key: 'dall-e-3', avg_tokens_per_use: 2, usage_limit_plan: 60 },
          { tool_id: '14', openai_model_key: 'gpt-4o', avg_tokens_per_use: 6000, usage_limit_plan: 80000 },
          { tool_id: '15', openai_model_key: 'gpt-4o', avg_tokens_per_use: 5000, usage_limit_plan: 60000 }
        ];
        for (var tmi = 0; tmi < toolModelMap.length; tmi++) {
          try {
            await supabase.from('tool_pricing').update({
              openai_model_key: toolModelMap[tmi].openai_model_key,
              avg_tokens_per_use: toolModelMap[tmi].avg_tokens_per_use,
              usage_limit_plan: toolModelMap[tmi].usage_limit_plan,
              margin_percent: 300
            }).eq('tool_id', toolModelMap[tmi].tool_id);
          } catch(e) {}
        }
        return res.status(200).json({ success: true, message: 'Credit system tables initialized', results: initResults });
      }
      case 'database/sync-pricing': {
        // Sync all subscription plan prices + credits + tool prices to Supabase
        var syncResults = [];
        // 1. Add credit columns to pricing_config if not exist
        var alterCols = [
          'ALTER TABLE pricing_config ADD COLUMN IF NOT EXISTS gpt4o_tokens BIGINT DEFAULT 0',
          'ALTER TABLE pricing_config ADD COLUMN IF NOT EXISTS gpt4turbo_tokens BIGINT DEFAULT 0',
          'ALTER TABLE pricing_config ADD COLUMN IF NOT EXISTS gpt35_tokens BIGINT DEFAULT 0',
          'ALTER TABLE pricing_config ADD COLUMN IF NOT EXISTS dalle3_images INTEGER DEFAULT 0',
          'ALTER TABLE pricing_config ADD COLUMN IF NOT EXISTS whisper_minutes INTEGER DEFAULT 0'
        ];
        for (var aci = 0; aci < alterCols.length; aci++) {
          try {
            await supabase.rpc('exec_sql', { sql: alterCols[aci] });
            syncResults.push({ step: 'alter_col', status: 'ok' });
          } catch(e) { syncResults.push({ step: 'alter_col', status: 'fallback', error: e.message }); }
        }
        // 2. Upsert subscription plans with prices + credits
        var subPlans = [
          { plan_id: 'mensal', name: 'Mensal', price: 59.90, original_price: 99.90, category: 'subscription', period: 'mês', discount: 40, highlight: false, gpt4o_tokens: 887000, gpt4turbo_tokens: 444000, gpt35_tokens: 8800000, dalle3_images: 111, whisper_minutes: 740, description: 'Plano mensal com acesso completo', features: JSON.stringify(['6 Ferramentas de IA','Gerador de Scripts IA','Criador de Thumbnails','Analisador de Trends','Otimizador de SEO','Gerador de Hashtags','Criador de Logos']) },
          { plan_id: 'trimestral', name: 'Trimestral', price: 159.90, original_price: 299.70, category: 'subscription', period: 'trimestre', discount: 47, highlight: true, gpt4o_tokens: 2370000, gpt4turbo_tokens: 1180000, gpt35_tokens: 23700000, dalle3_images: 296, whisper_minutes: 1975, description: 'Plano trimestral com desconto', features: JSON.stringify(['Tudo do Mensal +','Agendamento Multiplataforma','IA de Copywriting','Tradutor Automático','9 Ferramentas no total']) },
          { plan_id: 'semestral', name: 'Semestral', price: 259.90, original_price: 599.40, category: 'subscription', period: 'semestre', discount: 57, highlight: false, gpt4o_tokens: 3850000, gpt4turbo_tokens: 1920000, gpt35_tokens: 38500000, dalle3_images: 481, whisper_minutes: 3210, description: 'Plano semestral com maior desconto', features: JSON.stringify(['Tudo do Trimestral +','Gerador de QR Code','Editor de Vídeo Pro','Gerador de Ebooks Premium','12 Ferramentas no total']) },
          { plan_id: 'anual', name: 'Anual', price: 399.90, original_price: 1198.80, category: 'subscription', period: 'ano', discount: 67, highlight: false, gpt4o_tokens: 5990000, gpt4turbo_tokens: 2960000, gpt35_tokens: 59900000, dalle3_images: 747, whisper_minutes: 4930, description: 'Plano anual com máximo desconto', features: JSON.stringify(['Tudo do Semestral +','Gerador de Animações','IA Video Generator 8K','AI Funil Builder','15 Ferramentas no total']) }
        ];
        for (var spi = 0; spi < subPlans.length; spi++) {
          try {
            var { error: spErr } = await supabase.from('pricing_config').upsert({ ...subPlans[spi], is_active: true, updated_at: new Date().toISOString() }, { onConflict: 'plan_id' });
            syncResults.push({ plan: subPlans[spi].plan_id, status: spErr ? 'error' : 'ok', error: spErr?.message });
          } catch(e) { syncResults.push({ plan: subPlans[spi].plan_id, status: 'error', error: e.message }); }
        }
        // 3. Upsert tool prices (add-ons + standalone tools)
        var toolPriceUpdates = [
          { name: 'GPT-4o 1M tokens', price: 67.50 },
          { name: 'GPT-4 Turbo 1M tokens', price: 135.00 },
          { name: 'GPT-3.5 Turbo 1M tokens', price: 6.75 },
          { name: 'DALL·E 3 100 imagens', price: 54.00 },
          { name: 'DALL·E 2 100 imagens', price: 27.00 },
          { name: 'Whisper 100 minutos', price: 8.10 },
          { name: 'TTS-1 1M caracteres', price: 202.50 },
          { name: 'TTS-1 HD 1M caracteres', price: 405.00 },
          { name: 'Gerador de Scripts IA', price: 29.90 },
          { name: 'Criador de Thumbnails', price: 19.90 },
          { name: 'Analisador de Trends', price: 39.90 },
          { name: 'Otimizador de SEO', price: 24.90 },
          { name: 'Gerador de Hashtags', price: 14.90 },
          { name: 'Criador de Logos', price: 49.90 },
          { name: 'Agendamento Multiplataforma', price: 39.90 },
          { name: 'IA de Copywriting', price: 34.90 },
          { name: 'Tradutor Automático', price: 29.90 },
          { name: 'Gerador de QR Code', price: 19.90 },
          { name: 'Editor de Vídeo Pro', price: 97.00 },
          { name: 'Gerador de Ebooks Premium', price: 49.90 },
          { name: 'Gerador de Animações', price: 67.00 },
          { name: 'IA Video Generator 8K', price: 79.90 },
          { name: 'AI Funil Builder', price: 89.90 }
        ];
        for (var tpi = 0; tpi < toolPriceUpdates.length; tpi++) {
          try {
            var { error: tpErr } = await supabase.from('tool_pricing').update({ price: toolPriceUpdates[tpi].price, updated_at: new Date().toISOString() }).eq('name', toolPriceUpdates[tpi].name);
            syncResults.push({ tool: toolPriceUpdates[tpi].name, status: tpErr ? 'error' : 'ok', error: tpErr?.message });
          } catch(e) { syncResults.push({ tool: toolPriceUpdates[tpi].name, status: 'error', error: e.message }); }
        }
        return res.status(200).json({ success: true, message: 'Pricing synced to Supabase', results: syncResults });
      }
      case 'admin/tool-pricing-extended': {
        // Extended tool pricing with OpenAI cost info
        try {
          var { data: extTools } = await supabase.from('tool_pricing').select('*').order('tool_id', { ascending: true });
          var { data: extCosts } = await supabase.from('openai_unit_costs').select('*');
          var { data: rateR } = await supabase.from('system_settings').select('value').eq('key', 'usd_brl_rate').maybeSingle();
          var extRate = 5.40;
          try { extRate = JSON.parse(rateR?.value) || 5.40; } catch(e) {}
          var enrichedTools = (extTools || []).map(function(tool) {
            var model = (extCosts || []).find(function(c) { return c.model_key === tool.openai_model_key; });
            var costPerUse = 0;
            if (model) {
              if (model.charge_type.includes('token')) {
                costPerUse = ((tool.avg_tokens_per_use || 2000) / 1000) * ((model.cost_input_usd || 0) + (model.cost_output_usd || 0));
              } else if (model.charge_type.includes('imagem') || model.charge_type.includes('image')) {
                costPerUse = (tool.avg_tokens_per_use || 1) * (model.cost_input_usd || 0);
              } else if (model.charge_type.includes('minuto') || model.charge_type.includes('minute')) {
                costPerUse = (tool.avg_tokens_per_use || 1) * (model.cost_input_usd || 0);
              }
            }
            var costPerUseBrl = costPerUse * extRate;
            var toolPrice = parseFloat(tool.price) || 0;
            var actualMargin = toolPrice > 0 ? (((toolPrice - costPerUseBrl) / toolPrice) * 100).toFixed(1) : 0;
            return {
              ...tool,
              openai_model: model || null,
              cost_per_use_usd: costPerUse,
              cost_per_use_brl: costPerUseBrl,
              actual_margin_percent: actualMargin,
              suggested_min_price: (costPerUseBrl * ((tool.margin_percent || 300) / 100)).toFixed(2)
            };
          });
          return res.status(200).json({ success: true, tools: enrichedTools, usd_brl_rate: extRate });
        } catch (e) {
          return res.status(200).json({ success: true, tools: [], usd_brl_rate: 5.40 });
        }
      }
      // ============================================================
      // END OPENAI COSTS + CREDITS + USAGE SYSTEM
      // ============================================================
      case 'admin/marketing/load': {
        try {
          var { data: mktData } = await supabase.from('system_settings').select('key, value').in('key', ['viraliza_campaigns', 'viraliza_coupons', 'viraliza_posts']);
          var mktResult = { campaigns: [], coupons: [], posts: [] };
          (mktData || []).forEach(function(row) {
            if (row.key === 'viraliza_campaigns' && row.value) mktResult.campaigns = row.value;
            if (row.key === 'viraliza_coupons' && row.value) mktResult.coupons = row.value;
            if (row.key === 'viraliza_posts' && row.value) mktResult.posts = row.value;
          });
          return res.status(200).json({ success: true, ...mktResult });
        } catch (e) {
          return res.status(200).json({ success: true, campaigns: [], coupons: [], posts: [] });
        }
      }
      case 'admin/marketing/save': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        try {
          var mktBody = req.body || {};
          var upserts = [];
          if (mktBody.campaigns !== undefined) upserts.push({ key: 'viraliza_campaigns', value: mktBody.campaigns, updated_at: new Date().toISOString() });
          if (mktBody.coupons !== undefined) upserts.push({ key: 'viraliza_coupons', value: mktBody.coupons, updated_at: new Date().toISOString() });
          if (mktBody.posts !== undefined) upserts.push({ key: 'viraliza_posts', value: mktBody.posts, updated_at: new Date().toISOString() });
          if (upserts.length > 0) {
            await supabase.from('system_settings').upsert(upserts, { onConflict: 'key' });
          }
          return res.status(200).json({ success: true, message: 'Marketing data saved' });
        } catch (e) {
          console.error('Erro ao salvar marketing:', e);
          return res.status(500).json({ error: 'Erro ao salvar', details: e.message });
        }
      }
      case 'affiliate/payout':
        return res.status(200).json({ success: true, message: 'Payout endpoint active' });
      case 'create-pix-checkout': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { amount, planName } = req.body;
        return res.status(200).json({ success: true, pixCode: `pix_${Date.now()}`, amount, planName });
      }
      case 'create-subscription':
      case 'create-tool-payment':
      case 'create-ad-payment':
      case 'global-payment':
      case 'stripe-checkout':
      case 'stripe-payment-unified':
      case 'stripe-secure-payment':
        return res.status(200).json({ success: true, message: 'Use /api/stripe-test for payments' });
      case 'verify-pix-payment': {
        const paymentId = req.query.paymentId || req.body?.paymentId;
        const { data } = await supabase.from('subscriptions').select('status').eq('payment_id', paymentId).single();
        return res.status(200).json({ success: true, status: data?.status || 'pending' });
      }
      case 'stripe-webhook':
      case 'webhook-stripe':
      case 'webhook-pix':
      case 'webhook/stripe-affiliate':
      case 'webhooks/stripe':
      case 'webhooks/pix':
        console.log(`Webhook received: ${routeKey}`, req.body?.type || '');
        return res.status(200).json({ received: true });
      case 'cron-jobs':
      case 'cron-jobs-affiliate':
        return res.status(200).json({ success: true, message: 'Cron executed', timestamp: new Date().toISOString() });
      case 'generate-content':
      case 'generate-ebook':
      case 'generate-video':
        return res.status(200).json({ success: true, message: 'Use /api/ai-generate for AI content generation' });
      case 'ai/support': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { message } = req.body;
        const aiRes = await fetch(`https://${process.env.VERCEL_URL || 'viralizaai.vercel.app'}/api/ai-generate`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tool: 'general', prompt: message || 'Ajuda', params: {} })
        });
        const aiData = await aiRes.json();
        return res.status(200).json({ success: true, response: aiData.content });
      }
      case 'pricing/dynamic':
        return res.status(200).json({
          success: true, pricing: {
            mensal: { price: 59.90, discount: 0 }, trimestral: { price: 159.90, discount: 11 },
            semestral: { price: 259.90, discount: 28 }, anual: { price: 399.90, discount: 45 }
          }
        });
      case 'v1/docs':
        return res.status(200).json({ success: true, version: 'v1', docs: 'https://viralizaai.vercel.app/api-docs' });
      case 'v1/gateway':
        return res.status(200).json({ success: true, gateway: 'active', version: 'v1' });
      case 'database/init':
        return res.status(200).json({ success: true, message: 'Database connected via Supabase' });
      case 'database/init-affiliates': {
        // Add missing columns to affiliates table
        const columnsToAdd = [
          { name: 'total_earnings', type: 'numeric default 0' },
          { name: 'pending_balance', type: 'numeric default 0' },
          { name: 'available_balance', type: 'numeric default 0' },
          { name: 'total_referrals', type: 'integer default 0' },
          { name: 'total_clicks', type: 'integer default 0' },
          { name: 'payment_method', type: 'text' },
          { name: 'bank_name', type: 'text' },
          { name: 'bank_agency', type: 'text' },
          { name: 'bank_account', type: 'text' },
          { name: 'bank_account_type', type: 'text' },
          { name: 'pix_key', type: 'text' },
          { name: 'pix_key_type', type: 'text' },
          { name: 'account_holder_name', type: 'text' },
          { name: 'account_holder_cpf', type: 'text' }
        ];
        var results = [];
        for (var col of columnsToAdd) {
          try {
            var { error: colErr } = await supabase.rpc('exec_sql', {
              sql: `ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`
            });
            if (colErr) {
              // Try direct approach if rpc doesn't exist
              results.push({ column: col.name, status: 'rpc_failed', error: colErr.message });
            } else {
              results.push({ column: col.name, status: 'ok' });
            }
          } catch (colE) {
            results.push({ column: col.name, status: 'error', error: colE.message });
          }
        }
        // Also create chatbot_configs and chatbot_messages tables if they don't exist
        try {
          await supabase.rpc('exec_sql', {
            sql: `CREATE TABLE IF NOT EXISTS chatbot_configs (
              id uuid default gen_random_uuid() primary key,
              user_id text not null,
              business_name text,
              business_type text,
              objective text,
              tone text,
              platform text default 'whatsapp',
              phone_number_id text,
              whatsapp_token text,
              custom_instructions text,
              faq text,
              bot_name text,
              active boolean default true,
              created_at timestamptz default now(),
              updated_at timestamptz default now()
            );
            CREATE TABLE IF NOT EXISTS chatbot_messages (
              id uuid default gen_random_uuid() primary key,
              phone_number_id text,
              sender_phone text,
              sender_name text,
              recipient_phone text,
              role text,
              content text,
              platform text default 'whatsapp',
              created_at timestamptz default now()
            );`
          });
          results.push({ table: 'chatbot_configs', status: 'ok' });
          results.push({ table: 'chatbot_messages', status: 'ok' });
        } catch (tblE) {
          results.push({ table: 'chatbot_tables', status: 'error', error: tblE.message });
        }
        return res.status(200).json({ success: true, message: 'Affiliate DB init attempted', results });
      }
      case 'franchise/create':
      case 'franchise/territories':
      case 'marketplace/tools':
      case 'marketplace/use-tool':
      case 'whitelabel/create':
        return res.status(200).json({ success: true, message: `${routeKey} endpoint active` });
      default:
        return res.status(404).json({ error: `Route '/api/${routeKey}' not found` });
    }
  } catch (error) {
    console.error(`Catch-all ${routeKey} error:`, error);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}
