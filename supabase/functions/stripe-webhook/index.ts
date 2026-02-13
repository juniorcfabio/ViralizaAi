/* =====================================================
 * Edge Function: stripe-webhook
 * Recebe webhooks do Stripe, valida assinatura e atualiza subscriptions.
 * 
 * Secrets necessários:
 *  - STRIPE_SECRET (sk_live_... ou sk_test_...)
 *  - STRIPE_WEBHOOK_SIGNING_SECRET (whsec_...)
 *  - SUPABASE_URL (automático)
 *  - SUPABASE_SERVICE_ROLE_KEY (automático)
 *
 * Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
 * ===================================================== */
import Stripe from "npm:stripe@11.26.0";
import { createClient } from "npm:@supabase/supabase-js@2.32.0";

const STRIPE_API_KEY = Deno.env.get("STRIPE_SECRET")!;
const STRIPE_WEBHOOK_SIGNING_SECRET = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_API_KEY, { apiVersion: "2024-11-20" });
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

console.log("stripe-webhook function started");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const sig = req.headers.get("Stripe-Signature") ?? "";
  const body = await req.text();

  // 1. Validar assinatura do webhook
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body, sig, STRIPE_WEBHOOK_SIGNING_SECRET, undefined, cryptoProvider
    );
  } catch (err: any) {
    console.error("Stripe signature verification failed:", err?.message ?? err);
    return new Response(`Signature verification failed: ${err?.message ?? err}`, { status: 400 });
  }

  console.log("Received Stripe event:", event.type, event.id);

  try {
    const payload = event.data.object as any;
    const eventType = event.type;

    // ─── CHECKOUT SESSION COMPLETED ───
    if (eventType === "checkout.session.completed") {
      const session = payload;
      const providerSubId = session.subscription ?? null;
      const metadata = session.metadata ?? {};
      const authUserId = metadata.auth_user_id ?? null;
      const planSlug = metadata.plan_slug ?? null;

      console.log("checkout.session.completed:", { providerSubId, authUserId, planSlug });

      if (providerSubId && authUserId) {
        // Buscar plan_id pelo slug
        let plan_id = null;
        let planType = planSlug;
        if (planSlug) {
          const { data: plans } = await supabase
            .from("subscription_plans")
            .select("id, slug")
            .eq("slug", planSlug)
            .limit(1);
          plan_id = plans?.[0]?.id ?? null;
        }

        // Verificar se já existe subscription para este provider_subscription_id
        const { data: existing } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("provider_subscription_id", providerSubId)
          .limit(1);

        if (existing?.length) {
          // Atualizar existente
          await supabase.from("subscriptions").update({
            status: "active",
            plan_id,
            plan_type: planType,
            metadata: session,
            updated_at: new Date().toISOString()
          }).eq("id", existing[0].id);
        } else {
          // Cancelar subscriptions ativas anteriores do usuário
          await supabase
            .from("subscriptions")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("user_id", authUserId)
            .eq("status", "active");

          // Criar nova subscription
          await supabase.from("subscriptions").insert({
            user_id: authUserId,
            plan_id,
            plan_type: planType,
            status: "active",
            payment_provider: "stripe",
            provider_subscription_id: providerSubId,
            stripe_subscription_id: providerSubId,
            stripe_customer_id: session.customer ?? null,
            metadata: session,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }

        // Atualizar user_profiles com plano ativo
        await supabase
          .from("user_profiles")
          .update({
            plan: planType,
            plan_status: "active",
            updated_at: new Date().toISOString()
          })
          .eq("user_id", authUserId);

        console.log("✅ Subscription activated:", authUserId, planType);
      }
    }

    // ─── INVOICE PAID ───
    else if (eventType === "invoice.paid" || eventType === "invoice.payment_succeeded") {
      const invoice = payload;
      const providerSubId = invoice.subscription ?? null;
      const periodStart = invoice.current_period_start
        ? new Date(invoice.current_period_start * 1000).toISOString()
        : null;
      const periodEnd = invoice.current_period_end
        ? new Date(invoice.current_period_end * 1000).toISOString()
        : null;

      if (providerSubId) {
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("id, user_id")
          .or(`provider_subscription_id.eq.${providerSubId},stripe_subscription_id.eq.${providerSubId}`)
          .limit(1);

        if (subs?.length) {
          await supabase.from("subscriptions").update({
            status: "active",
            current_period_start: periodStart,
            current_period_end: periodEnd,
            start_date: periodStart,
            end_date: periodEnd,
            updated_at: new Date().toISOString()
          }).eq("id", subs[0].id);

          // Atualizar user_profiles
          if (subs[0].user_id) {
            await supabase
              .from("user_profiles")
              .update({ plan_status: "active", plan_expires_at: periodEnd, updated_at: new Date().toISOString() })
              .eq("user_id", subs[0].user_id);
          }
        }
        console.log("✅ Invoice paid, subscription renewed");
      }
    }

    // ─── SUBSCRIPTION UPDATED / DELETED ───
    else if (eventType === "customer.subscription.updated" || eventType === "customer.subscription.deleted") {
      const sub = payload;
      const providerSubId = sub.id;
      const status = sub.status ?? (eventType === "customer.subscription.deleted" ? "canceled" : null);
      const periodStart = sub.current_period_start
        ? new Date(sub.current_period_start * 1000).toISOString()
        : null;
      const periodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null;

      if (providerSubId) {
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("id, user_id")
          .or(`provider_subscription_id.eq.${providerSubId},stripe_subscription_id.eq.${providerSubId}`)
          .limit(1);

        if (subs?.length) {
          await supabase.from("subscriptions").update({
            status,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
            metadata: sub,
            updated_at: new Date().toISOString()
          }).eq("id", subs[0].id);

          // Se cancelado, atualizar user_profiles
          if (status === "canceled" && subs[0].user_id) {
            await supabase
              .from("user_profiles")
              .update({ plan_status: "canceled", updated_at: new Date().toISOString() })
              .eq("user_id", subs[0].user_id);
          }
        }
        console.log("✅ Subscription", eventType, status);
      }
    }

    // ─── PAYMENT INTENT SUCCEEDED (PIX/Boleto) ───
    else if (eventType === "payment_intent.succeeded") {
      const pi = payload;
      const metadata = pi.metadata ?? {};
      const authUserId = metadata.auth_user_id ?? null;
      const planSlug = metadata.plan_slug ?? null;

      if (authUserId && planSlug) {
        // Buscar plan_id
        let plan_id = null;
        if (planSlug) {
          const { data: plans } = await supabase
            .from("subscription_plans")
            .select("id")
            .eq("slug", planSlug)
            .limit(1);
          plan_id = plans?.[0]?.id ?? null;
        }

        // Calcular expiração
        const now = new Date();
        const endDate = new Date(now);
        if (planSlug.includes("anual")) endDate.setFullYear(endDate.getFullYear() + 1);
        else if (planSlug.includes("semestral")) endDate.setMonth(endDate.getMonth() + 6);
        else if (planSlug.includes("trimestral")) endDate.setMonth(endDate.getMonth() + 3);
        else endDate.setMonth(endDate.getMonth() + 1);

        // Cancelar ativas anteriores
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled", updated_at: now.toISOString() })
          .eq("user_id", authUserId)
          .eq("status", "active");

        // Criar subscription
        await supabase.from("subscriptions").insert({
          user_id: authUserId,
          plan_id,
          plan_type: planSlug,
          status: "active",
          payment_provider: "stripe_pix",
          payment_id: pi.id,
          amount: (pi.amount ?? 0) / 100,
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          metadata: pi
        });

        // Atualizar user_profiles
        await supabase
          .from("user_profiles")
          .update({
            plan: planSlug,
            plan_status: "active",
            plan_expires_at: endDate.toISOString(),
            updated_at: now.toISOString()
          })
          .eq("user_id", authUserId);

        console.log("✅ PIX/Boleto payment_intent succeeded, plan activated:", planSlug);
      }
    }

    // ─── LOG DO EVENTO ───
    const providerEventId = event.id;
    const possibleProviderSubId = payload?.subscription ?? payload?.id;

    let subscription_id = null;
    if (possibleProviderSubId) {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id")
        .or(`provider_subscription_id.eq.${possibleProviderSubId},stripe_subscription_id.eq.${possibleProviderSubId}`)
        .limit(1);
      subscription_id = subs?.[0]?.id ?? null;
    }

    await supabase.from("subscription_events").insert({
      subscription_id,
      provider_event_id: providerEventId,
      event_type: event.type,
      payload: event as any
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Processing error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
