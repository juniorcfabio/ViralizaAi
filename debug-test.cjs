// Teste completo do sistema
console.log('🔍 Iniciando teste completo do sistema...');

// Teste 1: Verificar se o Supabase client está configurado
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ymmswnmietxoupeazmok.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbXN3bm1pZXR4b3VwZWF6bW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODY2NjcsImV4cCI6MjA4MDI2MjY2N30.yvCcvTnqAMsNz9itandg4lyxeEmhsukcbqfkWZnkeu4'
);

async function runTests() {
  console.log('\n📋 TESTE 1: Conexão Supabase');
  try {
    const { data, error } = await supabase.from('users').select('count').single();
    if (error) {
      console.error('❌ Erro na tabela users:', error);
      
      // Tentar criar tabela
      console.log('🔧 Tentando criar tabela users...');
      const { data: newAdmin, error: createError } = await supabase
        .from('users')
        .insert({
          email: 'admin@viraliza.ai',
          name: 'Administrador',
          type: 'admin',
          status: 'Ativo',
          plan: 'admin'
        })
        .select();
      
      if (createError) {
        console.error('❌ Erro ao criar:', createError);
      } else {
        console.log('✅ Tabela users criada:', newAdmin);
      }
    } else {
      console.log('✅ Tabela users OK:', data);
    }
  } catch (e) {
    console.error('❌ Erro geral:', e);
  }

  console.log('\n📋 TESTE 2: Verificar usuário admin');
  try {
    const { data: admin, error } = await supabase
      .from('users')
      .select('*')
      .eq('type', 'admin')
      .single();
    
    if (error) {
      console.error('❌ Admin não encontrado:', error);
    } else {
      console.log('✅ Admin encontrado:', admin);
    }
  } catch (e) {
    console.error('❌ Erro ao buscar admin:', e);
  }

  console.log('\n📋 TESTE 3: Testar auth');
  try {
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('❌ Erro auth:', authError);
    } else {
      console.log('✅ Auth OK:', authData ? 'Sessão ativa' : 'Sem sessão');
    }
  } catch (e) {
    console.error('❌ Erro auth geral:', e);
  }

  console.log('\n📋 TESTE 4: Verificar outras tabelas');
  const tables = ['user_profiles', 'user_access', 'activity_logs'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('count').single();
      if (error) {
        console.log(`❌ Tabela ${table}:`, error.message);
      } else {
        console.log(`✅ Tabela ${table}:`, data);
      }
    } catch (e) {
      console.log(`❌ Erro tabela ${table}:`, e.message);
    }
  }

  console.log('\n🎉 Testes concluídos!');
}

runTests();
