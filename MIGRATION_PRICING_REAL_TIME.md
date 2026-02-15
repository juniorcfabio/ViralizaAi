# 🔥 MIGRAÇÃO COMPLETA - PREÇOS EM TEMPO REAL

## ✅ **ARQUIVOS JÁ CORRIGIDOS:**
1. ✅ **BillingPage.tsx** - Usando `useCentralizedPricing()`
2. ✅ **PricingPage.tsx** - Usando `useCentralizedPricing()`
3. ✅ **LandingPage.tsx** - Usando `useCentralizedPricing()` (já estava)

## ❌ **ARQUIVOS QUE PRECISAM SER CORRIGIDOS:**

### 1. **SocialMediaToolsPage.tsx** (2 ocorrências)
**Linha 151-156:**
```typescript
const planPrices = {
  'mensal': { price: 59.90, name: 'Mensal' },
  'trimestral': { price: 159.90, name: 'Trimestral' },
  'semestral': { price: 259.90, name: 'Semestral' },
  'anual': { price: 399.90, name: 'Anual' }
};
```

**CORREÇÃO:**
```typescript
// No topo do componente, adicionar:
const { pricing } = useCentralizedPricing();

// Substituir planPrices por:
const planPrices = Object.fromEntries(
  pricing?.subscriptionPlans.map(p => [
    p.id,
    { price: p.price, name: p.name }
  ]) || []
);
```

**Linha 372-377:** (mesma correção)

### 2. **AdminSettingsPage.tsx**
**Linha 31-35:**
```typescript
const initialPlans: Plan[] = [
  { id: 'p1', name: 'Mensal', price: 59.90, features: '...' },
  { id: 'p2', name: 'Trimestral', price: 159.90, features: '...' },
  { id: 'p3', name: 'Semestral', price: 259.90, features: '...' },
  { id: 'p4', name: 'Anual', price: 399.90, features: '...' },
];
```

**CORREÇÃO:**
```typescript
// Usar useCentralizedPricing() e carregar do Supabase
const { pricing, loading } = useCentralizedPricing();
const initialPlans = pricing?.subscriptionPlans || [];
```

### 3. **AdminMarketplacePage.tsx**
**Linha 28-34:** Ferramentas com preços hardcoded

**CORREÇÃO:**
Criar tabela `tool_pricing` no Supabase e buscar de lá.

### 4. **AdminDashboardPage.tsx**
**Linha 75:**
```typescript
const planPrices: { [key: string]: number } = { 
  'Anual': 399.90, 
  'Semestral': 259.90, 
  'Trimestral': 159.90, 
  'Mensal': 59.90 
};
```

**CORREÇÃO:**
```typescript
const { pricing } = useCentralizedPricing();
const planPrices = Object.fromEntries(
  pricing?.subscriptionPlans.map(p => [p.name, p.price]) || []
);
```

## 📋 **CHECKLIST DE VALIDAÇÃO:**

- [ ] Todos os preços de assinaturas vêm do Supabase
- [ ] Todos os preços de ferramentas avulsas vêm do Supabase
- [ ] Todos os preços de anúncios vêm do Supabase
- [ ] Comissões de afiliados vêm do Supabase
- [ ] Mudanças no admin refletem em TODOS os módulos
- [ ] Sincronização em tempo real via BroadcastChannel
- [ ] Build sem erros
- [ ] Deploy realizado

## 🎯 **PRÓXIMOS PASSOS:**

1. Criar tabela `pricing_config` no Supabase (se não existir)
2. Migrar todos os preços atuais para o Supabase
3. Corrigir os 4 arquivos listados acima
4. Testar alteração de preço no admin
5. Validar que reflete em todos os módulos
6. Build e deploy final

## 🔥 **COMANDO PARA TESTAR:**

```bash
# 1. Alterar preço no admin
# 2. Verificar console: "💰 Preços salvos e sincronizados em TODOS os módulos"
# 3. Abrir Landing Page - deve mostrar novo preço
# 4. Abrir Billing Page - deve mostrar novo preço
# 5. Abrir Pricing Page - deve mostrar novo preço
# 6. Fazer checkout - deve cobrar novo preço
```

## ✅ **GARANTIA:**

Após esta migração, **QUALQUER ALTERAÇÃO** no admin (preços, comissões, etc.) 
refletirá **AUTOMATICAMENTE** em **TODO O PROJETO** em **TEMPO REAL**.

**ZERO HARDCODE. 100% SUPABASE. TEMPO REAL.**
