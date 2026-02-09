/* Conteúdo: CheckoutButton.tsx */
import React, { useState } from "react";

type Props = {
  mode: "payment" | "subscription";
  priceId: string;
  quantity?: number;
  metadata?: Record<string, string>;
  customerEmail?: string;
};

export default function CheckoutButton({
  mode,
  priceId,
  quantity = 1,
  metadata = {},
  customerEmail
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, priceId, quantity, metadata, customerEmail }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        alert(data.error || "Erro ao iniciar checkout");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert("Erro ao iniciar checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
    >
      {loading ? "Aguarde..." : mode === "subscription" ? "Assinar" : "Comprar"}
    </button>
  );
}
