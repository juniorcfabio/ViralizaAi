/* Conteúdo: create-checkout-session.js */
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      mode, // "subscription" or "payment"
      priceId,
      quantity = 1,
      metadata = {}, // ex: { user_id, affiliate_id, product_id, origin }
      customerEmail,
    } = req.body;

    if (!mode || !priceId) return res.status(400).json({ error: "Missing mode or priceId" });

    const successUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: mode === "subscription" ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity }],
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
}
