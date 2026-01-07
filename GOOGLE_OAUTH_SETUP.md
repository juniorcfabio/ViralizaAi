# CONFIGURAÇÃO GOOGLE OAUTH - ViralizaAI

## ✅ PASSOS REALIZADOS:

### 1. Projeto Criado no Google Cloud Console
- Nome: ViralizaAI
- URL: https://console.cloud.google.com

### 2. APIs Ativadas
- Google+ API ✅

### 3. OAuth Consent Screen Configurado
- Tipo: External
- App name: ViralizaAI
- Domínio autorizado: viralizaai.vercel.app

### 4. Credenciais OAuth 2.0 Criadas
- Tipo: Web application
- Nome: ViralizaAI Web Client

### 5. URLs Autorizadas Configuradas
**JavaScript origins:**
- https://viralizaai.vercel.app
- http://localhost:5173

**Redirect URIs:**
- https://viralizaai.vercel.app/auth/google/callback
- http://localhost:5173/auth/google/callback

## 🔑 PRÓXIMOS PASSOS:

1. **Copie suas credenciais do Google Cloud Console:**
   - Client ID: `SEU_CLIENT_ID_AQUI`
   - Client Secret: `SEU_CLIENT_SECRET_AQUI`

2. **Configure no Vercel:**
   - Vá em: https://vercel.com/seu-projeto/settings/environment-variables
   - Adicione:
     ```
     VITE_GOOGLE_CLIENT_ID = seu_client_id_real
     VITE_GOOGLE_CLIENT_SECRET = seu_client_secret_real
     ```

3. **Para desenvolvimento local, crie arquivo .env.local:**
   ```
   VITE_GOOGLE_CLIENT_ID=seu_client_id_real
   VITE_GOOGLE_CLIENT_SECRET=seu_client_secret_real
   ```

## 🧪 TESTE:

Após configurar, teste o login Google em:
- Desenvolvimento: http://localhost:5173
- Produção: https://viralizaai.vercel.app

O login Google estará 100% funcional!
