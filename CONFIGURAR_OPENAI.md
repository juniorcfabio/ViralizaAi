# 🔑 COMO CONFIGURAR A CHAVE DA OPENAI

## ❌ PROBLEMA ATUAL:
Todas as ferramentas estão dando erro: `"Unexpected token 'A', "An error o"... is not valid JSON"`

**CAUSA:** A chave da OpenAI no arquivo `.env` está com valor placeholder inválido.

---

## ✅ SOLUÇÃO - PASSO A PASSO:

### 1️⃣ **OBTER SUA CHAVE DA OPENAI:**

1. Acesse: https://platform.openai.com/api-keys
2. Faça login na sua conta OpenAI
3. Clique em **"Create new secret key"**
4. Copie a chave (começa com `sk-proj-...` ou `sk-...`)
5. **IMPORTANTE:** Guarde em local seguro, ela só aparece uma vez!

---

### 2️⃣ **CONFIGURAR NO PROJETO:**

Abra o arquivo `.env` na raiz do projeto e substitua a linha:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

Por:

```env
OPENAI_API_KEY=sk-proj-SUA_CHAVE_REAL_AQUI
```

**Exemplo:**
```env
OPENAI_API_KEY=sk-proj-fGh9KlMnOpQrStUvWxYz1234567890abcdefghijklmnopqrstuvwxyz
```

---

### 3️⃣ **CONFIGURAR NO VERCEL (PRODUÇÃO):**

1. Acesse: https://vercel.com/junior-s-projects-fb93559c/viralizaai/settings/environment-variables
2. Adicione a variável:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** `sk-proj-SUA_CHAVE_REAL_AQUI`
   - **Environment:** Production, Preview, Development
3. Clique em **Save**
4. Faça um novo deploy para aplicar

---

### 4️⃣ **VERIFICAR SE TEM CRÉDITOS:**

1. Acesse: https://platform.openai.com/usage
2. Verifique se você tem créditos disponíveis
3. Se não tiver, adicione um método de pagamento em: https://platform.openai.com/account/billing/overview

---

## 🔧 APÓS CONFIGURAR:

1. **Localmente:** Reinicie o servidor de desenvolvimento
2. **Produção:** Faça um novo deploy no Vercel
3. **Teste:** Tente usar qualquer ferramenta novamente

---

## 📊 FERRAMENTAS QUE USAM OPENAI:

- ✅ Criador de Logos IA
- ✅ Gerador de Ebooks
- ✅ Gerador de Vídeos IA
- ✅ Criador de Funis
- ✅ Gerador de Animações
- ✅ Editor de Vídeo IA
- ✅ Ferramentas de Redes Sociais
- ✅ IA Conversacional
- ✅ Todas as Ultra Tools

---

## ⚠️ IMPORTANTE:

- **NÃO compartilhe sua chave da OpenAI publicamente**
- **NÃO faça commit da chave no Git** (o `.env` já está no `.gitignore`)
- **Configure limites de uso** na OpenAI para evitar gastos excessivos
- **Monitore o uso** regularmente em https://platform.openai.com/usage

---

## 🆘 SE CONTINUAR COM ERRO:

1. Verifique se a chave está correta (sem espaços extras)
2. Confirme que tem créditos na conta OpenAI
3. Teste a chave em: https://platform.openai.com/playground
4. Verifique os logs do console para mais detalhes

---

**Após configurar, todas as ferramentas funcionarão perfeitamente! 🚀**
