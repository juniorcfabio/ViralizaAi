// Teste simples de conexão com Supabase
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ymmswnmietxoupeazmok.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbXN3bm1pZXR4b3VwZWF6bW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODY2NjcsImV4cCI6MjA4MDI2MjY2N30.yvCcvTnqAMsNz9itandg4lyxeEmhsukcbqfkWZnkeu4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabase() {
  console.log('🔍 Testando conexão com Supabase...');
  
  try {
    // Teste 1: Verificar se consegue acessar a tabela de usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, type')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Erro ao acessar tabela users:', usersError);
    } else {
      console.log('✅ Tabela users acessível:', users.length, 'usuários');
    }
    
    // Teste 2: Verificar se consegue acessar auth
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Erro ao verificar sessão:', authError);
    } else {
      console.log('✅ Auth funcionando:', session ? 'Sessão ativa' : 'Sem sessão');
    }
    
    // Teste 3: Verificar se consegue fazer uma consulta simples
    const { data: testData, error: testError } = await supabase
      .from('activity_logs')
      .select('id, action')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro ao acessar activity_logs:', testError);
    } else {
      console.log('✅ Tabela activity_logs acessível:', testData.length, 'logs');
    }
    
    console.log('🎉 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

testSupabase();
