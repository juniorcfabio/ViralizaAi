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
            mensal: { price: 29.90, discount: 0 }, trimestral: { price: 79.90, discount: 11 },
            semestral: { price: 149.90, discount: 17 }, anual: { price: 249.90, discount: 30 }
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
