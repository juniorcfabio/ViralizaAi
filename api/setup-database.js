// API simplificada para setup do banco via Supabase REST
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
    console.log('🔧 Configurando banco de dados...');
    
    // URL da API REST do Supabase
    const supabaseUrl = 'https://ymmswnmietxoupeazmok.supabase.co';
    const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbXN3bm1pZXR4b3VwZWF6bW9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY4NjY2NywiZXhwIjoyMDgwMjYyNjY3fQ.5k2qJ8m5Q6Y7m8F9k3J2e4L6p9K8n7R4w3X2Y6Z8c9V0';

    // SQL para criar as tabelas
    const createUsersTable = `
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

    const createUserProfilesTable = `
      CREATE TABLE IF NOT EXISTS public.user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        cpf TEXT UNIQUE,
        plan TEXT DEFAULT 'mensal',
        plan_status TEXT DEFAULT 'active',
        trial_start_date TIMESTAMP WITH TIME ZONE,
        trial_end_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const createUserAccessTable = `
      CREATE TABLE IF NOT EXISTS public.user_access (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        tool_name TEXT NOT NULL,
        has_access BOOLEAN DEFAULT false,
        granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, tool_name)
      );
    `;

    // Executar SQL via API REST do Supabase
    const executeSQL = async (sql) => {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceKey
        },
        body: JSON.stringify({ sql })
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Erro SQL:', error);
        return { success: false, error };
      }
      
      return { success: true, data: await response.json() };
    };

    // Tentar criar as tabelas
    const results = [];
    
    try {
      const result1 = await executeSQL(createUsersTable);
      results.push({ table: 'users', ...result1 });
    } catch (e) {
      results.push({ table: 'users', success: false, error: e.message });
    }

    try {
      const result2 = await executeSQL(createUserProfilesTable);
      results.push({ table: 'user_profiles', ...result2 });
    } catch (e) {
      results.push({ table: 'user_profiles', success: false, error: e.message });
    }

    try {
      const result3 = await executeSQL(createUserAccessTable);
      results.push({ table: 'user_access', ...result3 });
    } catch (e) {
      results.push({ table: 'user_access', success: false, error: e.message });
    }

    // Verificar se as tabelas existem agora
    const checks = [];
    
    // Usar a API REST para verificar
    const checkTable = async (tableName) => {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=count&limit=1`, {
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return { exists: true, count: data[0]?.count || 0 };
        }
        return { exists: false };
      } catch (e) {
        return { exists: false, error: e.message };
      }
    };

    const usersCheck = await checkTable('users');
    const profilesCheck = await checkTable('user_profiles');
    const accessCheck = await checkTable('user_access');

    checks.push(
      { table: 'users', ...usersCheck },
      { table: 'user_profiles', ...profilesCheck },
      { table: 'user_access', ...accessCheck }
    );

    return res.status(200).json({
      success: true,
      message: 'Configuração do banco concluída',
      results,
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
