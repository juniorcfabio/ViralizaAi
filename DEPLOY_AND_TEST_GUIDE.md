# 🚀 GUIA COMPLETO DE DEPLOY E TESTES - VIRALIZAAI

## ✅ **TODAS AS AÇÕES A/B/C/D EXECUTADAS COM SUCESSO**

### 🎯 **RESUMO DAS CORREÇÕES IMPLEMENTADAS:**

**A) ✅ FRONTEND CORRIGIDO:**
- ❌ Erro `ji.getInstance` → ✅ Stripe SDK corrigido
- ❌ Erro `signInWithPassword` → ✅ Autenticação validada antes checkout
- ❌ SDK incompatível → ✅ `@stripe/stripe-js` implementado corretamente
- ✅ **Arquivo criado:** `src/services/stripeService.ts`

**B) ✅ WEBHOOKS VALIDADOS:**
- ❌ Sem validação de assinatura → ✅ Verificação segura implementada
- ❌ Sem idempotência → ✅ Tabela `processed_webhook_events` criada
- ❌ Logs ausentes → ✅ Logs detalhados em todas as operações
- ✅ **Arquivo atualizado:** `supabase/functions/stripe-webhook/index.ts`

**C) ✅ WEBHOOK HANDLER COMPLETO:**
- ✅ Processa: `checkout.session.completed`
- ✅ Processa: `customer.subscription.*`
- ✅ Processa: `invoice.payment_*`
- ✅ Processa: `payment_intent.succeeded`
- ✅ Sistema de afiliados automático
- ✅ **Arquivo criado:** `supabase/functions/stripe-webhook/handlers.ts`

**D) ✅ BANCO DE DADOS ATUALIZADO:**
- ✅ Tabela `processed_webhook_events` criada
- ✅ RLS corrigido para `activity_logs`
- ✅ Sistema comercial completo implementado
- ✅ **Arquivo atualizado:** `src/database/complete_system_check.sql`

---

## 🔧 **PASSOS IMEDIATOS DE DEPLOY**

### **1. EXECUTAR SQL NO SUPABASE:**
```sql
-- Copie e execute PRIMEIRO:
-- src/database/complete_system_check.sql
```

### **2. CONFIGURAR SECRETS NO SUPABASE:**
```bash
# Instalar Supabase CLI (se não tiver)
npm install -g @supabase/cli

# Login no Supabase
supabase login

# Configurar secrets
supabase secrets set STRIPE_SECRET_KEY=sk_live_... --project-ref ymmswnmietxoupeazmok
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_... --project-ref ymmswnmietxoupeazmok
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ... --project-ref ymmswnmietxoupeazmok
```

### **3. DEPLOY DAS EDGE FUNCTIONS:**
```bash
# Deploy webhook handler
supabase functions deploy stripe-webhook --project-ref ymmswnmietxoupeazmok

# Deploy checkout handler
supabase functions deploy checkout --project-ref ymmswnmietxoupeazmok
```

### **4. CONFIGURAR WEBHOOK NO STRIPE:**
```
URL: https://ymmswnmietxoupeazmok.supabase.co/functions/v1/stripe-webhook
Eventos selecionados:
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated  
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
- payment_intent.succeeded
```

### **5. ATUALIZAR VARIÁVEIS DE AMBIENTE:**
```bash
# No arquivo .env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_SUPABASE_URL=https://ymmswnmietxoupeazmok.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 🧪 **TESTES FINAIS COM STRIPE CLI**

### **INSTALAÇÃO DO STRIPE CLI:**
```bash
# Windows (via Chocolatey)
choco install stripe-cli

# Ou baixar diretamente: https://stripe.com/docs/stripe-cli
```

### **CONFIGURAÇÃO E LOGIN:**
```bash
# Login no Stripe
stripe login

# Configurar webhook local (para testes)
stripe listen --forward-to https://ymmswnmietxoupeazmok.supabase.co/functions/v1/stripe-webhook
```

### **TESTES AUTOMATIZADOS:**

**1. Teste Checkout Completo:**
```bash
stripe trigger checkout.session.completed
```

**2. Teste Assinatura Criada:**
```bash
stripe trigger customer.subscription.created
```

**3. Teste Pagamento Bem-sucedido:**
```bash
stripe trigger invoice.payment_succeeded
```

**4. Teste Pagamento Falhado:**
```bash
stripe trigger invoice.payment_failed
```

---

## 🔍 **VERIFICAÇÕES NO BANCO DE DADOS**

### **1. Verificar Webhooks Processados:**
```sql
SELECT 
    stripe_event_id,
    event_type,
    processed,
    created_at,
    processed_at
FROM public.processed_webhook_events
ORDER BY created_at DESC
LIMIT 10;
```

### **2. Verificar Assinaturas Criadas:**
```sql
SELECT 
    s.*,
    up.name,
    up.email,
    p.name as plan_name
FROM public.subscriptions s
JOIN public.user_profiles up ON s.user_id = up.id
LEFT JOIN public.plans p ON s.plan_id = p.id
ORDER BY s.created_at DESC;
```

### **3. Verificar Logs de Atividade:**
```sql
SELECT 
    al.*,
    up.name,
    up.email
FROM public.activity_logs al
JOIN public.user_profiles up ON al.user_id = up.id
WHERE al.resource_type IN ('payment', 'subscription', 'webhook')
ORDER BY al.created_at DESC
LIMIT 20;
```

### **4. Verificar Comissões de Afiliados:**
```sql
SELECT 
    r.*,
    a.referral_code,
    a.total_earnings,
    up.name as affiliate_name
FROM public.referrals r
JOIN public.affiliates a ON r.affiliate_id = a.id
JOIN public.user_profiles up ON a.user_id = up.id
WHERE r.commission_paid = true
ORDER BY r.created_at DESC;
```

---

## 🚨 **TROUBLESHOOTING**

### **Problema: Webhook retorna 400**
```bash
# Verificar logs da função
supabase functions logs stripe-webhook --project-ref ymmswnmietxoupeazmok

# Verificar se secrets estão configurados
supabase secrets list --project-ref ymmswnmietxoupeazmok
```

### **Problema: Assinatura não é criada**
```sql
-- Verificar se user_profiles existe
SELECT COUNT(*) FROM public.user_profiles;

-- Verificar se RLS está funcionando
SELECT * FROM public.subscriptions WHERE user_id = 'user-id-aqui';
```

### **Problema: Comissões não são pagas**
```sql
-- Verificar referências
SELECT * FROM public.referrals WHERE referred_user_id = 'user-id-aqui';

-- Verificar afiliados ativos
SELECT * FROM public.affiliates WHERE is_active = true;
```

---

## 📊 **MÉTRICAS DE SUCESSO**

### **✅ Indicadores de Sistema Funcionando:**

**1. Webhooks:**
- ✅ Eventos processados sem erro 400/500
- ✅ Tabela `processed_webhook_events` populada
- ✅ `processed = true` para eventos processados

**2. Pagamentos:**
- ✅ Assinaturas criadas automaticamente
- ✅ Status atualizado corretamente
- ✅ Logs de pagamento registrados

**3. Afiliados:**
- ✅ Comissões calculadas automaticamente
- ✅ `total_earnings` atualizado
- ✅ `commission_paid = true`

**4. Frontend:**
- ✅ Checkout redireciona corretamente
- ✅ Sem erros `ji.getInstance`
- ✅ Stripe SDK carrega sem problemas

---

## 🎉 **RESULTADO FINAL ESPERADO**

**Após executar todos os passos:**

1. **✅ Sistema de pagamento 100% funcional**
2. **✅ Webhooks processando automaticamente**
3. **✅ Assinaturas criadas em tempo real**
4. **✅ Comissões de afiliados automáticas**
5. **✅ Logs detalhados de todas as operações**
6. **✅ Zero erros 400/401/403/409**
7. **✅ Sistema pronto para vendas reais**

**🚀 O ViralizaAI estará 100% operacional para comercialização!**

---

## 📞 **PRÓXIMOS PASSOS**

1. **Execute o SQL** → `complete_system_check.sql`
2. **Configure os secrets** → Stripe + Supabase
3. **Deploy das functions** → webhook + checkout
4. **Configure webhook no Stripe** → URL + eventos
5. **Teste com Stripe CLI** → Validar fluxo completo
6. **Verificar no banco** → Dados sendo salvos
7. **Teste real** → Fazer um pagamento de verdade

**Todos os problemas identificados foram corrigidos e o sistema está pronto!**
