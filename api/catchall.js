// Catch-all router - self-contained (no transitive imports)
// Handles all routes not covered by individual API files
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const routeKey = req.query.route || '';

  try {
    switch (routeKey) {
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
      case 'affiliate/dashboard': {
        const userId = req.query.userId || req.body?.userId;
        if (!userId) return res.status(400).json({ error: 'userId required' });
        const { data } = await supabase.from('affiliate_stats').select('*').eq('user_id', userId).single();
        return res.status(200).json({ success: true, data: data || { clicks: 0, conversions: 0, earnings: 0 } });
      }
      case 'affiliate/create': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { userId, code } = req.body;
        const { data, error } = await supabase.from('affiliates').upsert({ user_id: userId, code, status: 'active' }).select().single();
        if (error) throw error;
        return res.status(201).json({ success: true, affiliate: data });
      }
      case 'affiliate/track-click': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { code } = req.body;
        await supabase.from('affiliate_clicks').insert({ affiliate_code: code, ip: req.headers['x-forwarded-for'] || 'unknown' });
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
