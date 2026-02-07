import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Método não permitido" });

  try {
    const { userId, userEmail, planType } = req.body;

    if (!userId || !userEmail || !planType)
      return res.status(400).json({ error: "Dados obrigatórios faltando" });

    // 🔐 VALORES DEFINIDOS SOMENTE NO SERVIDOR
    const plans = {
      mensal: { price: 59.9, name: "Plano Mensal" },
      trimestral: { price: 149.9, name: "Plano Trimestral" },
      semestral: { price: 279.9, name: "Plano Semestral" },
      anual: { price: 499.9, name: "Plano Anual" },
    };

    const plan = plans[planType];
    if (!plan) return res.status(400).json({ error: "Plano inválido" });

    console.log(`🔐 Criando PIX seguro: ${plan.name} - R$ ${plan.price}`);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100),
      currency: "brl",
      payment_method_types: ["pix"],
      receipt_email: userEmail,
      description: plan.name,
      metadata: { userId, planType },
    });

    console.log('✅ PaymentIntent seguro criado:', paymentIntent.id);

    const pix = paymentIntent.next_action.pix_display_qr_code;

    res.json({
      paymentIntentId: paymentIntent.id,
      qrCode: pix.image_url_png,
      pixCode: pix.emv_code,
      planName: plan.name,
      amount: plan.price
    });
  } catch (err) {
    console.error("🚨 Erro ao gerar PIX:", err);
    res.status(500).json({ error: "Erro ao gerar PIX" });
  }
}
