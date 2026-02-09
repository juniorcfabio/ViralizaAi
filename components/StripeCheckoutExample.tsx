import React from 'react';
import CheckoutButton from './CheckoutButton';

export default function StripeCheckoutExample() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h3 className="text-xl font-bold mb-4">Exemplo de Checkout Stripe</h3>
      
      <div className="space-y-4">
        {/* Exemplo de Pagamento Único */}
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-2">Pagamento Único - R$ 59,90</h4>
          <p className="text-gray-600 text-sm mb-3">Plano Mensal ViralizaAI</p>
          <CheckoutButton
            mode="payment"
            priceId="price_1234567890" // Substitua pelo ID real do Stripe
            quantity={1}
            metadata={{
              user_id: "user_123",
              product_id: "plan_mensal",
              origin: "landing_page"
            }}
            customerEmail="usuario@exemplo.com"
          />
        </div>

        {/* Exemplo de Assinatura */}
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-2">Assinatura - R$ 159,90/trimestre</h4>
          <p className="text-gray-600 text-sm mb-3">Plano Trimestral ViralizaAI</p>
          <CheckoutButton
            mode="subscription"
            priceId="price_0987654321" // Substitua pelo ID real do Stripe
            quantity={1}
            metadata={{
              user_id: "user_123",
              product_id: "plan_trimestral",
              origin: "landing_page",
              affiliate_id: "AFF123",
              affiliate_commission_percent: "10"
            }}
            customerEmail="usuario@exemplo.com"
          />
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Nota:</strong> Substitua os priceId pelos IDs reais dos produtos criados no Stripe Dashboard.
        </p>
      </div>
    </div>
  );
}
