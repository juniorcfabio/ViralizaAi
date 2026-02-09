/**
 * Edge Function: stripe-webhook
 * - Receives Stripe webhooks and updates public.stripe_sessions, subscriptions/purchases as appropriate.
 * - Uses processed_webhook_events table to avoid duplicate processing.
 *
 * Env variables required:
 *  - STRIPE_SECRET
 *  - STRIPE_WEBHOOK_SECRET  (optional for signature validation; we use event fetch as fallback)
 *
 * Note:
 *  - For secure signature verification prefer using stripe-node to verify signatures.
 *  - This implementation fetches the event from Stripe by event id to validate the event server-side
 *    (avoids adding npm deps, functional for many use cases).
 */
declare const Deno: any;
Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET');
    // STRIPE_WEBHOOK_SECRET could be used with stripe-node to verify signatures; not used here.
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? null;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET) {
      return new Response('Missing environment variables', { status: 500 });
    }
    const rawBody = await req.text();
    let parsed;
    try {
      parsed = JSON.parse(rawBody);
    } catch (err) {
      return new Response('Invalid JSON', { status: 400 });
    }
    const eventId = parsed?.id;
    if (!eventId) return new Response('Missing event id', { status: 400 });
    // Idempotency: check if event already processed
    const checkResp = await fetch(`${SUPABASE_URL}/rest/v1/processed_webhook_events?id=eq.${encodeURIComponent(eventId)}`, {
      headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
    });
    if (checkResp.ok) {
      const rows = await checkResp.json();
      if (Array.isArray(rows) && rows.length > 0) {
        return new Response('Event already processed', { status: 200 });
      }
    }
    // Validate event with Stripe by fetching it by id (fallback to signature verification)
    const stripeEventRes = await fetch(`https://api.stripe.com/v1/events/${encodeURIComponent(eventId)}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET}` }
    });
    if (!stripeEventRes.ok) {
      const txt = await stripeEventRes.text();
      console.error('Stripe event fetch error:', stripeEventRes.status, txt);
      return new Response('Invalid event', { status: 400 });
    }
    const stripeEvent = await stripeEventRes.json();
    const type = stripeEvent.type;
    // Mark event as processed (insert into processed_webhook_events)
    await fetch(`${SUPABASE_URL}/rest/v1/processed_webhook_events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ id: eventId })
    });
    // Helper: update stripe_sessions by stripe_session_id
    const patchStripeSession = async (sessionId: string, patch: any) => {
      await fetch(`${SUPABASE_URL}/rest/v1/stripe_sessions?stripe_session_id=eq.${encodeURIComponent(sessionId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
        body: JSON.stringify(patch)
      });
    };
    // Process main events
    if (type === 'checkout.session.completed') {
      const session = stripeEvent.data.object;
      // Update stripe_sessions
      await patchStripeSession(session.id, {
        status: 'succeeded',
        stripe_payment_intent_id: session.payment_intent ?? null,
        stripe_customer_id: session.customer ?? null,
        stripe_subscription_id: session.subscription ?? null,
        raw_payload: session
      });
      // If subscription created, fetch subscription and upsert into subscriptions table
      if (session.subscription) {
        // Get subscription details
        const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(session.subscription)}`, {
          headers: { Authorization: `Bearer ${STRIPE_SECRET}` }
        });
        if (subRes.ok) {
          const sub = await subRes.json();
          // Try to get user_id from stripe_sessions where stripe_subscription_id or stripe_session_id
          let user_id: string | null = null;
          // first try find by stripe_session_id
          const findResp = await fetch(`${SUPABASE_URL}/rest/v1/stripe_sessions?stripe_session_id=eq.${encodeURIComponent(session.id)}`, {
            headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
          });
          if (findResp.ok) {
            const srows = await findResp.json();
            if (Array.isArray(srows) && srows.length > 0) user_id = srows[0].user_id ?? null;
          }
          const upsertSub = {
            user_id,
            plan_type: sub.items?.data?.[0]?.price?.nickname ?? null,
            status: sub.status,
            stripe_subscription_id: sub.id,
            stripe_customer_id: sub.customer,
            current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
            current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          // Insert subscription record (simple insert; adjust as required to avoid duplicates)
          await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
            body: JSON.stringify(upsertSub)
          });
        }
      }
      // If it's a one-time payment (payment mode), create a purchases record optionally
      if (session.mode === 'payment') {
        // Find stripe_sessions record to glean product_id and user_id
        const findResp2 = await fetch(`${SUPABASE_URL}/rest/v1/stripe_sessions?stripe_session_id=eq.${encodeURIComponent(session.id)}`, {
          headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
        });
        if (findResp2.ok) {
          const srows = await findResp2.json();
          if (Array.isArray(srows) && srows.length > 0) {
            const rec = srows[0];
            // Insert purchase
            const purchase = {
              user_id: rec.user_id ?? null,
              product_id: rec.product_id ?? null,
              stripe_payment_intent_id: session.payment_intent ?? null,
              stripe_customer_id: session.customer ?? null,
              amount: rec.amount ?? null,
              currency: rec.currency ?? 'BRL',
              status: 'completed',
              metadata: { stripe_session: session.id },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            await fetch(`${SUPABASE_URL}/rest/v1/purchases`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
              body: JSON.stringify(purchase)
            });
          }
        }
      }
    } else if (type === 'invoice.paid') {
      // Optionally update subscriptions/purchases: mark as paid
      const invoice = stripeEvent.data.object;
      // find by invoice.subscription or invoice.payment_intent
      if (invoice.subscription) {
        // Update subscriptions table where stripe_subscription_id = invoice.subscription
        await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?stripe_subscription_id=eq.${encodeURIComponent(invoice.subscription)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
          body: JSON.stringify({ status: 'active', updated_at: new Date().toISOString() })
        });
      }
    } else if (type.startsWith('customer.subscription.')) {
      // Handle subscription created/updated/deleted
      const sub = stripeEvent.data.object;
      // Upsert or update subscriptions table
      await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?stripe_subscription_id=eq.${encodeURIComponent(sub.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
        body: JSON.stringify({
          status: sub.status,
          current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
          current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          stripe_customer_id: sub.customer ?? null,
          updated_at: new Date().toISOString()
        })
      }).catch(async () => {
        // If PATCH fails (no existing record), create
        const upsert = {
          user_id: null,
          plan_type: sub.items?.data?.[0]?.price?.nickname ?? null,
          status: sub.status,
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer ?? null,
          current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
          current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        await fetch(`${SUPABASE_URL}/rest/v1/subscriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
          body: JSON.stringify(upsert)
        });
      });
    }
    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('stripe-webhook error', err);
    return new Response('internal error', { status: 500 });
  }
});
