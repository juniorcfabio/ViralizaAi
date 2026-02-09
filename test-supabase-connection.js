// 🧪 TESTE DE CONEXÃO SUPABASE
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymmswnmietxoupeazmok.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbXN3bm1pZXR4b3VwZWF6bW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODY2NjcsImV4cCI6MjA4MDI2MjY2N30.yvCcvTnqAMsNz9itandg4lyxeEmhsukcbqfkWZnkeu4';

async function testSupabaseConnection() {
    console.log('🔍 TESTANDO CONEXÃO COM SUPABASE...\n');
    
    try {
        // 1. Criar cliente
        console.log('1️⃣ Criando cliente Supabase...');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Cliente criado com sucesso\n');
        
        // 2. Testar conexão básica
        console.log('2️⃣ Testando conexão básica...');
        const { data, error } = await supabase.from('users').select('count').limit(1);
        
        if (error) {
            console.log('❌ Erro na conexão:', error.message);
            console.log('🔍 Detalhes do erro:', error);
            
            // Verificar se é erro de CORS ou autenticação
            if (error.message.includes('CORS')) {
                console.log('\n🚨 PROBLEMA DE CORS DETECTADO');
                console.log('💡 Solução: Configurar CORS no Supabase Dashboard');
            } else if (error.message.includes('JWT') || error.message.includes('auth')) {
                console.log('\n🚨 PROBLEMA DE AUTENTICAÇÃO DETECTADO');
                console.log('💡 Solução: Verificar chaves de API');
            } else if (error.message.includes('relation') || error.message.includes('table')) {
                console.log('\n🚨 TABELA NÃO EXISTE');
                console.log('💡 Solução: Criar tabelas no banco de dados');
            }
        } else {
            console.log('✅ Conexão bem-sucedida!');
            console.log('📊 Dados retornados:', data);
        }
        
        // 3. Testar listagem de tabelas (se possível)
        console.log('\n3️⃣ Tentando listar estrutura do banco...');
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');
            
        if (tablesError) {
            console.log('⚠️ Não foi possível listar tabelas:', tablesError.message);
        } else {
            console.log('📋 Tabelas encontradas:', tables?.map(t => t.table_name) || 'Nenhuma');
        }
        
    } catch (error) {
        console.log('💥 ERRO CRÍTICO:', error.message);
        console.log('🔍 Stack trace:', error.stack);
    }
    
    console.log('\n🏁 TESTE CONCLUÍDO');
}

// Executar teste
testSupabaseConnection();
