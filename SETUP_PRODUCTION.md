# 🚀 GUIA DE CONFIGURAÇÃO PARA PRODUÇÃO - VIRALIZAAI ULTRA IMPÉRIO

## 📋 CHECKLIST DE CONFIGURAÇÃO

### 🗄️ 1. CONFIGURAR SUPABASE (BANCO DE DADOS)

#### 📝 Passo a Passo:
1. **Acesse:** https://supabase.com
2. **Crie um projeto** novo
3. **Anote as credenciais:**
   - `Project URL`
   - `anon/public key`
   - `service_role key` (secret)
   - `Database URL` (Settings > Database > Connection string)

#### 🔧 Configurar no Vercel:
```bash
# Adicionar as variáveis no Vercel Dashboard
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[password]@db.seu-projeto.supabase.co:5432/postgres
```

---

### 🤖 2. CONFIGURAR OPENAI API

#### 📝 Passo a Passo:
1. **Acesse:** https://platform.openai.com
2. **Crie uma API Key**
3. **Configure billing** (necessário para produção)

#### 🔧 Configurar no Vercel:
```bash
OPENAI_API_KEY=sk-proj-seu-token-aqui
```

---

### 🔐 3. CONFIGURAR VARIÁVEIS DE SEGURANÇA

#### 🔧 Gerar JWT Secret:
```bash
# Use um gerador online ou comando:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 🔧 Configurar no Vercel:
```bash
JWT_SECRET=sua-chave-super-secreta-de-64-caracteres-minimo
ADMIN_INIT_KEY=chave-para-inicializar-banco-em-producao
```

---

### 📧 4. CONFIGURAR EMAIL (OPCIONAL)

#### 🔧 Gmail App Password:
1. **Ative 2FA** na sua conta Google
2. **Gere App Password** em: https://myaccount.google.com/apppasswords

#### 🔧 Configurar no Vercel:
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-app-password
EMAIL_FROM=ViralizaAI <noreply@viralizaai.com>
```

---

## 🚀 DEPLOY E INICIALIZAÇÃO

### 1️⃣ **Deploy no Vercel:**
```bash
# No diretório do projeto
vercel --prod
```

### 2️⃣ **Inicializar Banco de Dados:**
```bash
# Fazer POST request para:
POST https://viralizaai.vercel.app/api/database/init
Headers: {
  "x-admin-key": "sua-admin-init-key"
}
```

### 3️⃣ **Testar APIs:**
```bash
# Testar registro
POST https://viralizaai.vercel.app/api/auth/register
{
  "name": "Teste",
  "email": "teste@email.com", 
  "password": "123456"
}

# Testar login
POST https://viralizaai.vercel.app/api/auth/login
{
  "email": "teste@email.com",
  "password": "123456"
}
```

---

## 🔧 CONFIGURAÇÃO COMPLETA NO VERCEL

### 📝 Todas as Variáveis Necessárias:

```bash
# 🗄️ BANCO DE DADOS
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[password]@db.seu-projeto.supabase.co:5432/postgres

# 🤖 OPENAI
OPENAI_API_KEY=sk-proj-seu-token-aqui
OPENAI_MODEL=gpt-4o-mini

# 🔐 SEGURANÇA
JWT_SECRET=sua-chave-super-secreta-de-64-caracteres-minimo
JWT_EXPIRES_IN=7d
ADMIN_INIT_KEY=chave-para-inicializar-banco

# 💳 STRIPE (JÁ CONFIGURADO)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 📧 EMAIL (OPCIONAL)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-app-password
EMAIL_FROM=ViralizaAI <noreply@viralizaai.com>

# 🌍 AMBIENTE
NODE_ENV=production
PORT=3000

# 🎯 FEATURES
ENABLE_AFFILIATE_SYSTEM=true
ENABLE_MARKETPLACE=true
ENABLE_FRANCHISE_SYSTEM=true
ENABLE_WHITELABEL=true
ENABLE_GLOBAL_API=true
ENABLE_AI_TOOL_CREATOR=true
```

---

## 🧪 TESTES DE FUNCIONALIDADE

### ✅ **Checklist de Testes:**

- [ ] **Banco conectado** - GET `/api/database/init`
- [ ] **Registro funciona** - POST `/api/auth/register`
- [ ] **Login funciona** - POST `/api/auth/login`
- [ ] **Perfil funciona** - GET `/api/auth/profile`
- [ ] **IA Support** - POST `/api/ai/support`
- [ ] **Marketplace** - GET `/api/marketplace/tools`
- [ ] **Preços dinâmicos** - POST `/api/pricing/dynamic`
- [ ] **API Global** - GET `/api/v1/docs`

---

## 🚨 TROUBLESHOOTING

### ❌ **Erro de Conexão com Banco:**
- Verifique `DATABASE_URL` no Vercel
- Teste conexão no Supabase Dashboard
- Confirme que IP está liberado

### ❌ **Erro de OpenAI:**
- Verifique `OPENAI_API_KEY`
- Confirme que billing está ativo
- Teste a key em: https://platform.openai.com/playground

### ❌ **Erro de JWT:**
- Gere novo `JWT_SECRET` com 32+ caracteres
- Redeploy no Vercel após alterar

---

## 🎊 SUCESSO!

### ✅ **Quando tudo estiver funcionando:**

1. **Frontend:** https://viralizaai.vercel.app ✅
2. **APIs:** https://viralizaai.vercel.app/api/* ✅
3. **Banco:** Conectado e com tabelas ✅
4. **IA:** OpenAI respondendo ✅
5. **Pagamentos:** Stripe configurado ✅

### 🌍 **Seu ULTRA IMPÉRIO está ONLINE!**

**Parabéns! Você agora tem um ecossistema tecnológico mundial operando em produção!** 🚀👑
