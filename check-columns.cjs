// Verificar colunas existentes na tabela users
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ymmswnmietxoupeazmok.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbXN3bm1pZXR4b3VwZWF6bW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODY2NjcsImV4cCI6MjA4MDI2MjY2N30.yvCcvTnqAMsNz9itandg4lyxeEmhsukcbqfkWZnkeu4'
);

async function checkColumns() {
  console.log('🔍 Verificando colunas da tabela users...');
  
  try {
    // Tentar buscar todas as colunas
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao buscar:', error);
    } else {
      console.log('✅ Dados encontrados:', data);
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('\n📋 Colunas encontradas:');
        columns.forEach(col => console.log(`  - ${col}`));
      } else {
        console.log('⚠️ Nenhum dado encontrado, mas tabela existe');
      }
    }
    
    // Tentar contar registros
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar:', countError);
    } else {
      console.log(`\n📊 Total de registros: ${count}`);
    }
    
    // Verificar se existe auth.users
    console.log('\n📋 Verificando auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Não tem acesso a auth.admin (esperado com anon key)');
    } else {
      console.log('✅ Auth users:', authUsers.users.length);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkColumns();
