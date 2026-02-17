// API para inicializar banco de dados com service role
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ymmswnmietxoupeazmok.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbXN3bm1pZXR4b3VwZWF6bW9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY4NjY2NywiZXhwIjoyMDgwMjYyNjY3fQ.5k2qJ8m5Q6Y7m8F9k3J2e4L6p9K8n7R4w3X2Y6Z8c9V0';

const supabase = createClient(supabaseUrl, serviceKey);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 Inicializando banco de dados...');

    // 1. Criar tabela users se não existir
    const { error: usersError } = await supabase
      .from('users')
      .select('count')
      .single();

    if (usersError && usersError.code === 'PGRST116') {
      // Tabela não existe, vamos criar um registro para forçar a criação
      console.log('📝 Criando tabela users...');
      
      // Criar usuário admin
      const { data: adminUser, error: createError } = await supabase
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
        console.error('❌ Erro ao criar tabela users:', createError);
      } else {
        console.log('✅ Tabela users criada com admin:', adminUser);
      }
    } else {
      console.log('✅ Tabela users já existe');
    }

    // 2. Criar tabela user_profiles se não existir
    const { error: profilesError } = await supabase
      .from('user_profiles')
      .select('count')
      .single();

    if (profilesError && profilesError.code === 'PGRST116') {
      console.log('📝 Criando tabela user_profiles...');
      
      const { data: profile, error: createProfileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // ID temporário
          name: 'Temp',
          email: 'temp@temp.com',
          plan: 'mensal'
        })
        .select();

      if (createProfileError) {
        console.error('❌ Erro ao criar tabela user_profiles:', createProfileError);
      } else {
        console.log('✅ Tabela user_profiles criada');
      }
    } else {
      console.log('✅ Tabela user_profiles já existe');
    }

    // 3. Criar tabela user_access se não existir
    const { error: accessError } = await supabase
      .from('user_access')
      .select('count')
      .single();

    if (accessError && accessError.code === 'PGRST116') {
      console.log('📝 Criando tabela user_access...');
      
      const { data: access, error: createAccessError } = await supabase
        .from('user_access')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // ID temporário
          tool_name: 'temp',
          has_access: false
        })
        .select();

      if (createAccessError) {
        console.error('❌ Erro ao criar tabela user_access:', createAccessError);
      } else {
        console.log('✅ Tabela user_access criada');
      }
    } else {
      console.log('✅ Tabela user_access já existe');
    }

    // 4. Verificar tabelas
    const checks = [];
    
    try {
      const { data: users } = await supabase.from('users').select('count').single();
      checks.push({ table: 'users', status: '✅ OK', count: users?.count || 0 });
    } catch (e) {
      checks.push({ table: 'users', status: '❌ Error', error: e.message });
    }

    try {
      const { data: profiles } = await supabase.from('user_profiles').select('count').single();
      checks.push({ table: 'user_profiles', status: '✅ OK', count: profiles?.count || 0 });
    } catch (e) {
      checks.push({ table: 'user_profiles', status: '❌ Error', error: e.message });
    }

    try {
      const { data: access } = await supabase.from('user_access').select('count').single();
      checks.push({ table: 'user_access', status: '✅ OK', count: access?.count || 0 });
    } catch (e) {
      checks.push({ table: 'user_access', status: '❌ Error', error: e.message });
    }

    console.log('✅ Verificação concluída:', checks);

    return res.status(200).json({
      success: true,
      message: 'Banco de dados inicializado com sucesso',
      checks
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
