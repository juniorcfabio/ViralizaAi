import { createClient } from '@supabase/supabase-js'

// Configuração Supabase com fallback garantido
const SUPABASE_URL = 'https://ymmswnmietxoupeazmok.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbXN3bm1pZXR4b3VwZWF6bW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODY2NjcsImV4cCI6MjA4MDI2MjY2N30.yvCcvTnqAMsNz9itandg4lyxeEmhsukcbqfkWZnkeu4'

console.log('🔍 Configurando Supabase com CORS correto')
console.log('🔍 URL:', SUPABASE_URL)
console.log('🔍 KEY válida:', SUPABASE_ANON_KEY.length > 100 ? 'SIM' : 'NÃO')

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token'
  },
  global: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
  }
})

// Inicializar sessão anônima se não existir
export const initializeAnonymousSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('🔄 Criando sessão anônima...');
      // Criar um usuário temporário para sessão anônima
      const anonymousEmail = `anonymous-${Date.now()}@viralizaai.temp`;
      const anonymousPassword = `temp-${Math.random().toString(36).substring(7)}`;
      
      const { data, error } = await supabase.auth.signUp({
        email: anonymousEmail,
        password: anonymousPassword,
        options: {
          data: {
            name: 'Usuário Anônimo',
            is_anonymous: true
          }
        }
      });
      
      if (error) {
        console.warn('⚠️ Erro ao criar sessão anônima:', error.message);
        return null;
      }
      
      console.log('✅ Sessão anônima criada:', data.user?.id);
      return data.user;
    }
    
    console.log('✅ Sessão existente encontrada:', session.user.id);
    return session.user;
  } catch (error) {
    console.error('❌ Erro ao inicializar sessão:', error);
    return null;
  }
}
