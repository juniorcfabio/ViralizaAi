import { createClient } from '@supabase/supabase-js'

// Configuração Supabase com headers CORS corretos
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
    flowType: 'pkce'
  },
  global: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }
  }
})
