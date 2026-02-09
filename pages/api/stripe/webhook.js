/* Conteúdo: webhook.js — usa @supabase/supabase-js */
import Stripe from "stripe";
import rawBody from "raw-body";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });

export const config = { api: { bodyParser: false } };

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    const buf = await rawBody(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const {
          id: sessionId,
          mode,
          metadata = {},
          payment_status,
          amount_total,
          currency,
          customer_email
        } = session;

        if (mode === "subscription") {
          const stripeSubscriptionId = session.subscription;
          const payload = {
            user_id: metadata.user_id || null,
            product_id: metadata.product_id || null,
            stripe_subscription_id: stripeSubscriptionId,
            status: payment_status === "paid" ? "active" : "pending",
            started_at: new Date().toISOString(),
            metadata,
          };
          const { error } = await supabase.from("subscriptions").insert(payload);
          if (error) console.error("Supabase insert subscription error:", error);
        } else {
          const payload = {
            user_id: metadata.user_id || null,
            product_id: metadata.product_id || null,
            stripe_session_id: sessionId,
            amount: amount_total || null,
            currency: currency || null,
            status: payment_status || "unknown",
            customer_email,
            metadata,
          };
          const { error } = await supabase.from("purchases").insert(payload);
          if (error) console.error("Supabase insert purchase error:", error);

          if (metadata.affiliate_id) {
            const commissionPercent = metadata.affiliate_commission_percent ? Number(metadata.affiliate_commission_percent) : 10;
            const commissionAmount = amount_total ? Math.round((amount_total * commissionPercent) / 100) : null;
            const affPayload = {
              affiliate_id: metadata.affiliate_id,
              purchase_session_id: sessionId,
              amount: commissionAmount,
              currency,
              status: commissionAmount ? "pending" : "none",
              metadata,
            };
            const { error: affError } = await supabase.from("affiliate_payments").insert(affPayload);
            if (affError) console.error("Supabase insert affiliate payment error:", affError);
          }
        }
        break;
      }
      case "invoice.paid":
        // handle recurring invoice paid
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Error handling webhook event:", err);
    res.status(500).send();
  }
}
