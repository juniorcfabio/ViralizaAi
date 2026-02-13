# ViralizaAI — Setup Stripe + PIX (Supabase Edge Functions)

## Pré-requisitos
- Supabase CLI instalado (`npm i -g supabase`)
- Conta Stripe ativa (test ou live)
- Projeto Supabase configurado

---

## 1. Executar Migrações SQL

No **Supabase SQL Editor**, execute na ordem:

```
supabase/migrations/002_create_subscription_schema.sql
supabase/migrations/003_seed_subscription_plans.sql
```

Ou via CLI:
```bash
supabase db push
```

---

## 2. Configurar Secrets no Supabase

```bash
supabase secrets set \
  STRIPE_API_KEY=sk_live_XXXX \
  STRIPE_WEBHOOK_SIGNING_SECRET=whsec_XXXX \
  APP_URL=https://viralizaai.vercel.app
```

> `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem automaticamente.

---

## 3. Deploy das Edge Functions

```bash
# Webhook: sem verificação JWT (Stripe envia direto)
supabase functions deploy stripe-webhook --no-verify-jwt

# Checkout: com verificação JWT (usuário autenticado)
supabase functions deploy create-checkout-session
```

---

## 4. Configurar Webhook no Stripe Dashboard

1. Acesse: **Stripe Dashboard > Developers > Webhooks**
2. Clique em **Add endpoint**
3. URL: `https://ymmswnmietxoupeazmok.supabase.co/functions/v1/stripe-webhook`
4. Eventos recomendados:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded` (para PIX/Boleto)
5. Copie o **Signing secret** (whsec_...) e atualize no Supabase:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SIGNING_SECRET=whsec_XXXX
   ```

---

## 5. Criar Preços no Stripe (opcional)

Se quiser usar Stripe Subscriptions (recorrente):

1. No Stripe Dashboard, crie **Products** para cada plano
2. Crie **Prices** com os valores:
   - Mensal: R$ 59,90/mês
   - Trimestral: R$ 159,90/3 meses
   - Semestral: R$ 259,90/6 meses
   - Anual: R$ 399,90/ano
3. Copie os `price_xxx` IDs
4. Atualize no Supabase SQL Editor:

```sql
UPDATE subscription_plans SET stripe_price_id = 'price_XXXX' WHERE slug = 'mensal';
UPDATE subscription_plans SET stripe_price_id = 'price_XXXX' WHERE slug = 'trimestral';
UPDATE subscription_plans SET stripe_price_id = 'price_XXXX' WHERE slug = 'semestral';
UPDATE subscription_plans SET stripe_price_id = 'price_XXXX' WHERE slug = 'anual';
```

> Sem `stripe_price_id`, o checkout usa modo "payment" (pagamento único).
> Com `stripe_price_id`, usa modo "subscription" (recorrente).

---

## 6. Habilitar PIX no Stripe (Brasil)

1. Stripe Dashboard > Settings > Payment methods
2. Ative: **Pix**, **Boleto** (se disponível)
3. No checkout, passe `payment_method_types: ["card", "pix"]`

---

## 7. Fluxo Completo

```
1. Usuário faz signup (Supabase Auth)
2. Escolhe plano na BillingPage
3. Clica "Cartão" → chama Edge Function create-checkout-session com JWT + plan_slug
4. Recebe URL do Stripe Checkout → redireciona
5. Usuário paga (Card/PIX/Boleto)
6. Stripe envia webhook → stripe-webhook Edge Function
7. Webhook valida assinatura, atualiza subscriptions + user_profiles
8. Frontend verifica subscription.status = 'active' → libera ferramentas
```

---

## 8. Testar Localmente

```bash
# Terminal 1: Servir Edge Functions
supabase functions serve

# Terminal 2: Stripe CLI para webhooks locais
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Terminal 3: Enviar webhook de teste
stripe trigger checkout.session.completed
```

---

## Variáveis de Ambiente Resumo

| Variável | Onde definir | Descrição |
|---|---|---|
| `STRIPE_API_KEY` | Supabase Secrets | `sk_live_...` ou `sk_test_...` |
| `STRIPE_WEBHOOK_SIGNING_SECRET` | Supabase Secrets | `whsec_...` do webhook endpoint |
| `APP_URL` | Supabase Secrets | `https://viralizaai.vercel.app` |
| `SUPABASE_URL` | Automático | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Automático | Service role key |
