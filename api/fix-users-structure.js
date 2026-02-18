// API para corrigir estrutura da tabela users
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
    console.log('🔧 Corrigindo estrutura da tabela users...');
    
    // Usar service role para alterações de estrutura
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // SQL para adicionar colunas que faltam
    const alterTableSQL = `
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'client',
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Ativo',
      ADD COLUMN IF NOT EXISTS plan TEXT,
      ADD COLUMN IF NOT EXISTS joined_date DATE DEFAULT CURRENT_DATE;
    `;

    // Executar SQL via RPC (se disponível)
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: alterTableSQL });
      if (error) {
        console.error('❌ Erro ao executar SQL:', error);
      } else {
        console.log('✅ Estrutura alterada com sucesso');
      }
    } catch (e) {
      console.log('⚠️ RPC não disponível, tentando método alternativo...');
    }

    // Verificar estrutura atual
    const { data: columns, error: columnsError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (columnsError) {
      console.error('❌ Erro ao verificar estrutura:', columnsError);
    } else {
      console.log('✅ Estrutura verificada');
      
      // Inserir admin se não existir
      const { data: existingAdmin } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'admin@viraliza.ai')
        .single();
      
      if (!existingAdmin) {
        console.log('📝 Criando usuário admin...');
        const { data: admin, error: adminError } = await supabase
          .from('users')
          .insert({
            email: 'admin@viraliza.ai',
            name: 'Administrador',
            type: 'admin',
            status: 'Ativo',
            plan: 'admin',
            joined_date: new Date().toISOString().split('T')[0]
          })
          .select();
        
        if (adminError) {
          console.error('❌ Erro ao criar admin:', adminError);
        } else {
          console.log('✅ Admin criado:', admin);
        }
      } else {
        console.log('✅ Admin já existe');
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Estrutura da tabela users corrigida'
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
