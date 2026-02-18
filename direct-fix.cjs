// Correção direta via Supabase SQL
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ymmswnmietxoupeazmok.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbXN3bm1pZXR4b3VwZWF6bW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODY2NjcsImV4cCI6MjA4MDI2MjY2N30.yvCcvTnqAMsNz9itandg4lyxeEmhsukcbqfkWZnkeu4'
);

async function fixDatabase() {
  console.log('🔧 Iniciando correção direta do banco...');
  
  try {
    // 1. Verificar estrutura atual
    console.log('\n📋 Verificando estrutura atual...');
    const { data: currentUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Erro na verificação:', checkError);
      
      if (checkError.code === '42703') {
        console.log('🔧 Coluna type não existe, criando nova tabela...');
        
        // Criar nova tabela com estrutura correta
        const { data: newTable, error: newError } = await supabase
          .rpc('exec_sql', {
            sql: `
              CREATE TABLE IF NOT EXISTS public.users_fixed (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'client',
                status TEXT NOT NULL DEFAULT 'Ativo',
                plan TEXT,
                joined_date DATE DEFAULT CURRENT_DATE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
              
              INSERT INTO public.users_fixed (email, name, type, status, plan)
              VALUES ('admin@viraliza.ai', 'Administrador', 'admin', 'Ativo', 'admin')
              ON CONFLICT (email) DO NOTHING;
            `
          });
        
        if (newError) {
          console.error('❌ Erro ao criar tabela:', newError);
        } else {
          console.log('✅ Tabela users_fixed criada');
        }
      }
    } else {
      console.log('✅ Estrutura atual OK');
    }
    
    // 2. Tentar inserir admin na tabela original
    console.log('\n📋 Tentando inserir admin...');
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .upsert({
        email: 'admin@viraliza.ai',
        name: 'Administrador',
        type: 'admin',
        status: 'Ativo',
        plan: 'admin',
        joined_date: new Date().toISOString().split('T')[0]
      })
      .select();
    
    if (adminError) {
      console.error('❌ Erro ao inserir admin:', adminError);
      
      // Tentar versão simplificada
      console.log('🔧 Tentando inserção simplificada...');
      const { data: simpleAdmin, error: simpleError } = await supabase
        .from('users')
        .upsert({
          email: 'admin@viraliza.ai',
          name: 'Administrador'
        })
        .select();
      
      if (simpleError) {
        console.error('❌ Erro na inserção simplificada:', simpleError);
      } else {
        console.log('✅ Admin inserido (simples):', simpleAdmin);
      }
    } else {
      console.log('✅ Admin inserido (completo):', admin);
    }
    
    // 3. Verificação final
    console.log('\n📋 Verificação final...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@viraliza.ai')
      .single();
    
    if (finalError) {
      console.error('❌ Erro na verificação final:', finalError);
    } else {
      console.log('✅ Verificação final OK:', finalCheck);
    }
    
    // 4. Testar se podemos buscar por type
    console.log('\n📋 Testando busca por type...');
    try {
      const { data: typeTest, error: typeError } = await supabase
        .from('users')
        .select('*')
        .eq('type', 'admin');
      
      if (typeError) {
        console.error('❌ Erro ao buscar por type:', typeError);
      } else {
        console.log('✅ Busca por type OK:', typeTest);
      }
    } catch (e) {
      console.error('❌ Erro geral ao buscar por type:', e);
    }
    
    console.log('\n🎉 Correção concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixDatabase();
