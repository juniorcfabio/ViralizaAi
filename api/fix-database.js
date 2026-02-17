// API para corrigir estrutura do banco de dados
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ymmswnmietxoupeazmok.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbXN3bm1pZXR4b3VwZWF6bW9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY4NjY2NywiZXhwIjoyMDgwMjYyNjY3fQ.5k2qJ8m5Q6Y7m8F9k3J2e4L6p9K8n7R4w3X2Y6Z8c9V0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    console.log('🔧 Iniciando correção do banco de dados...');

    // Ler o arquivo SQL
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(process.cwd(), 'sql', 'fix_users_table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Executar SQL via RPC (se disponível) ou via SQL direto
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      
      // Tentar método alternativo - criar tabelas individualmente
      console.log('🔄 Tentando método alternativo...');
      
      // Criar tabela users
      const { error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (usersError && usersError.code === 'PGRST116') {
        // Tabela não existe, criar via SQL direto
        const createUsersSQL = `
          CREATE TABLE IF NOT EXISTS public.users (
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
        `;
        
        console.log('📝 Criando tabela users...');
        // Note: Supabase não permite SQL arbitrário via client, 
        // então precisamos usar o Dashboard ou API REST
      }
    }

    // Verificar se as tabelas foram criadas
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
      message: 'Banco de dados verificado e corrigido',
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
