import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Método não permitido" });

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: "PaymentIntent ID obrigatório" });
    }

    console.log("🔍 Consultando status do pagamento:", id);

    // 🔍 FRONTEND SÓ CONSULTA, NUNCA LIBERA
    const pi = await stripe.paymentIntents.retrieve(id);
    
    console.log(`📊 Status atual: ${pi.status}`);

    res.json({ 
      status: pi.status,
      paymentIntentId: id,
      amount: pi.amount / 100,
      metadata: pi.metadata
    });
  } catch (err) {
    console.error("🚨 Erro ao consultar pagamento:", err);
    res.status(500).json({ error: "Erro ao consultar status" });
  }
}
