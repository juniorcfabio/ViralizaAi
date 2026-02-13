/* =====================================================
 * Edge Function: create-checkout-session
 * Cria sessão de Checkout no Stripe (card + PIX/boleto).
 * 
 * POST body JSON:
 *   { "plan_slug": "mensal", "payment_method_types": ["card"] }
 *   ou { "plan_slug": "trimestral", "payment_method_types": ["card", "boleto"] }
 *
 * Exige autenticação: Authorization: Bearer <JWT>
 * Retorna: { url } para redirecionar ao Stripe Checkout
 *
 * Secrets: STRIPE_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APP_URL
 * Deploy: supabase functions deploy create-checkout-session
 * ===================================================== */
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const STRIPE_API_KEY = Deno.env.get("STRIPE_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://viralizaai.vercel.app";

const stripe = new Stripe(STRIPE_API_KEY, { apiVersion: "2024-11-20" });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    // 1. Verificar autenticação via JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    const { data: userResp, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userResp?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const authUser = userResp.user;

    // 2. Parse body
    const body = await req.json().catch(() => ({}));
    const planSlug = body.plan_slug;
    const paymentMethodTypes = body.payment_method_types ?? ["card"];
    const successUrl = body.success_url ?? `${APP_URL}/#/dashboard?checkout=success&plan=${planSlug}`;
    const cancelUrl = body.cancel_url ?? `${APP_URL}/#/dashboard/billing?checkout=cancel`;

    if (!planSlug) {
      return new Response(JSON.stringify({ error: "plan_slug required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. Buscar plano no DB
    const { data: plans, error: planErr } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("slug", planSlug)
      .eq("is_active", true)
      .limit(1);

    if (planErr || !plans?.length) {
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const plan = plans[0];

    // 4. Metadata para mapear no webhook
    const metadata = {
      auth_user_id: authUser.id,
      plan_slug: plan.slug,
      plan_name: plan.name,
    };

    // 5. Criar sessão de Checkout
    let session;

    if (plan.stripe_price_id) {
      // Subscription mode com Price ID do Stripe
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: paymentMethodTypes as any[],
        line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
        metadata,
        subscription_data: { metadata },
        success_url: successUrl,
        cancel_url: cancelUrl,
        locale: "pt-BR",
      });
    } else {
      // Payment mode (one-time) — fallback se não tiver stripe_price_id
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: paymentMethodTypes as any[],
        line_items: [{
          price_data: {
            currency: (plan.currency ?? "BRL").toLowerCase(),
            product_data: { name: `${plan.name} - ViralizaAI` },
            unit_amount: plan.price_cents,
          },
          quantity: 1,
        }],
        metadata,
        payment_intent_data: { metadata },
        success_url: successUrl,
        cancel_url: cancelUrl,
        locale: "pt-BR",
      });
    }

    // 6. Registrar sessão no stripe_sessions (opcional)
    try {
      await supabase.from("stripe_sessions").insert({
        user_id: authUser.id,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent ?? null,
        stripe_subscription_id: session.subscription ?? null,
        mode: plan.stripe_price_id ? "subscription" : "payment",
        amount: plan.price_cents,
        currency: (plan.currency ?? "BRL").toUpperCase(),
        status: "created",
        raw_payload: session,
      });
    } catch (err) {
      console.warn("Warning: could not persist stripe_session:", String(err));
    }

    // 7. Log de atividade
    await supabase.from("activity_logs").insert({
      user_id: authUser.id,
      action: "checkout_initiated",
      details: JSON.stringify({
        plan_slug: plan.slug,
        plan_name: plan.name,
        session_id: session.id,
        amount: plan.price_cents,
      }),
    });

    console.log("✅ Checkout session created:", session.id, "for user:", authUser.id);

    return new Response(JSON.stringify({ success: true, url: session.url, sessionId: session.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("create-checkout-session error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
