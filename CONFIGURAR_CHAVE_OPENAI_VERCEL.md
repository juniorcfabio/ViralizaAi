# 🔑 CONFIGURAR CHAVE DA OPENAI NO VERCEL (PASSO A PASSO)

## ✅ VOCÊ JÁ TEM A CHAVE DA OPENAI!

Você mencionou que já passou a chave anteriormente. Agora só precisa configurá-la no Vercel para funcionar em produção.

---

## 📋 PASSO A PASSO SIMPLES:

### **1️⃣ Acesse as Configurações do Vercel:**

Clique neste link:
👉 **https://vercel.com/junior-s-projects-fb93559c/viralizaai/settings/environment-variables**

---

### **2️⃣ Adicione a Variável de Ambiente:**

Na página que abrir, clique em **"Add New"** e preencha:

**Campo 1 - Name:**
```
OPENAI_API_KEY
```

**Campo 2 - Value:**
```
(Cole aqui sua chave da OpenAI que começa com sk-proj-... ou sk-...)
```

**Campo 3 - Environments:**
- ✅ Marque: **Production**
- ✅ Marque: **Preview**
- ✅ Marque: **Development**

Clique em **"Save"**

---

### **3️⃣ Fazer Novo Deploy:**

Após salvar, você precisa fazer um novo deploy para aplicar a configuração.

**Opção A - Via Terminal (Recomendado):**
```bash
npm run build
vercel --prod
```

**Opção B - Via Vercel Dashboard:**
1. Vá em: https://vercel.com/junior-s-projects-fb93559c/viralizaai
2. Clique em **"Deployments"**
3. Clique nos 3 pontinhos do último deploy
4. Clique em **"Redeploy"**

---

## 🎯 ONDE ESTÁ SUA CHAVE DA OPENAI?

Se você não lembra onde salvou, pode:

1. **Verificar seu email** - A OpenAI envia a chave por email quando você cria
2. **Criar uma nova chave** em: https://platform.openai.com/api-keys
3. **Verificar suas notas** - Você mencionou que já passou antes

---

## ✅ COMO SABER SE FUNCIONOU?

Após o deploy:

1. Acesse: **https://viralizaai.vercel.app**
2. Faça login com o usuário Victor
3. Tente usar qualquer ferramenta (Criador de Logos, Gerador de Ebooks, etc.)
4. Se funcionar = **SUCESSO!** ✅
5. Se continuar com erro = Verifique se a chave está correta

---

## 🔍 VERIFICAR SE A CHAVE ESTÁ CONFIGURADA:

Após adicionar no Vercel, você pode verificar se foi salva:

1. Vá em: https://vercel.com/junior-s-projects-fb93559c/viralizaai/settings/environment-variables
2. Procure por **OPENAI_API_KEY**
3. Deve aparecer: `OPENAI_API_KEY = sk-proj-••••••••••••••••` (com asteriscos)

---

## ⚠️ IMPORTANTE:

- A chave da OpenAI começa com `sk-proj-` ou `sk-`
- **NÃO** compartilhe a chave publicamente
- Se não tiver mais a chave, crie uma nova em: https://platform.openai.com/api-keys
- Após configurar, **TODAS as ferramentas funcionarão**!

---

## 💰 VERIFICAR CRÉDITOS:

Certifique-se de ter créditos disponíveis:
👉 https://platform.openai.com/usage

Se não tiver créditos:
👉 https://platform.openai.com/account/billing/overview

---

## 🆘 PRECISA DE AJUDA?

Se não encontrar sua chave antiga:

1. Acesse: https://platform.openai.com/api-keys
2. Clique em **"Create new secret key"**
3. Dê um nome: "ViralizaAI Production"
4. Copie a chave (ela só aparece uma vez!)
5. Cole no Vercel conforme o passo 2 acima

---

**🚀 Pronto! Após configurar, todas as ferramentas funcionarão perfeitamente!**
