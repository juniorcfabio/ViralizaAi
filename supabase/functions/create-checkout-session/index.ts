/**
 * Edge Function: create-checkout-session
 * - Creates a Stripe Checkout Session (payment or subscription)
 * - Persists a draft record in public.stripe_sessions via Supabase REST using SERVICE_ROLE key
 *
 * Env variables required (set via supabase secrets):
 *  - STRIPE_SECRET
 *
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are available automatically in Supabase Edge runtime.
 *
 * Endpoint:
 *  POST body JSON:
 *   {
 *     "mode":"payment" | "subscription",
 *     "priceId": "<stripe price id>",             // optional for subscription
 *     "planName": "Plano XYZ",                    // used if priceId missing
 *     "amount": 5000,                             // integer cents, required if no priceId
 *     "currency": "brl",
 *     "successUrl": "https://your.com/success?session_id={CHECKOUT_SESSION_ID}",
 *     "cancelUrl": "https://your.com/cancel",
 *     "productId": "<optional product uuid>"
 *   }
 *
 * Provide Authorization: Bearer <USER_JWT> to allow function to get user_id automatically.
 */
declare const Deno: any;
Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET) {
      return new Response(JSON.stringify({ error: 'Missing environment variables' }), { status: 500 });
    }
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }
    const body = await req.json();
    const {
      mode = 'payment',
      priceId,
      planName,
      amount,
      currency = 'brl',
      successUrl,
      cancelUrl,
      productId
    } = body;
    if (!successUrl || !cancelUrl) {
      return new Response(JSON.stringify({ error: 'successUrl and cancelUrl are required' }), { status: 400 });
    }
    // Try to extract user_id from Authorization header (Bearer <jwt>)
    let user_id: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwt = authHeader.split(' ')[1];
      // Supabase exposes /auth/v1/user to fetch user by JWT
      const uResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (uResp.ok) {
        const uJson = await uResp.json();
        user_id = uJson?.id ?? null;
      }
    }
    // Build Stripe checkout session params
    const params = new URLSearchParams();
    params.append('mode', mode);
    params.append('success_url', successUrl);
    params.append('cancel_url', cancelUrl);
    params.append('payment_method_types[0]', 'card');
    if (priceId && mode === 'subscription') {
      params.append('line_items[0][price]', priceId);
      params.append('line_items[0][quantity]', '1');
    } else if (amount != null) {
      params.append('line_items[0][price_data][currency]', (currency || 'brl').toLowerCase());
      params.append('line_items[0][price_data][product_data][name]', planName ?? 'Purchase');
      params.append('line_items[0][price_data][unit_amount]', Math.round(Number(amount)).toString());
      params.append('line_items[0][quantity]', '1');
    } else {
      return new Response(JSON.stringify({ error: 'Either priceId (for subscription) or amount required' }), { status: 400 });
    }
    // Create Stripe Checkout Session
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    const stripeText = await stripeRes.text();
    if (!stripeRes.ok) {
      console.error('Stripe error:', stripeText);
      return new Response(JSON.stringify({ error: 'Stripe API error', details: stripeText }), { status: 502 });
    }
    const session = JSON.parse(stripeText);
    // Persist a record in public.stripe_sessions using service role via REST
    const insertBody = {
      user_id,
      product_id: productId ?? null,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent ?? null,
      stripe_customer_id: session.customer ?? null,
      stripe_subscription_id: session.subscription ?? null,
      mode,
      amount: amount ?? null,
      currency: (currency || 'brl').toUpperCase(),
      status: 'created',
      raw_payload: session
    };
    try {
      const sbResp = await fetch(`${SUPABASE_URL}/rest/v1/stripe_sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` 
        },
        body: JSON.stringify(insertBody)
      });
      if (![200, 201].includes(sbResp.status)) {
        const txt = await sbResp.text();
        console.warn('Warning: could not persist stripe_session:', sbResp.status, txt);
      }
    } catch (err) {
      console.warn('Warning: error persisting stripe_session:', String(err));
    }
    return new Response(JSON.stringify({ success: true, url: session.url, sessionId: session.id }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (err) {
    console.error('create-checkout-session error', err);
    return new Response(JSON.stringify({ error: 'internal_error', details: String(err) }), { status: 500 });
  }
});
