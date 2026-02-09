// 🔍 VERIFICAR TABELAS NO SUPABASE
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ymmswnmietxoupeazmok.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbXN3bm1pZXR4b3VwZWF6bW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODY2NjcsImV4cCI6MjA4MDI2MjY2N30.yvCcvTnqAMsNz9itandg4lyxeEmhsukcbqfkWZnkeu4';

async function checkTables() {
    console.log('🔍 VERIFICANDO TABELAS NO SUPABASE...\n');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Lista de tabelas que esperamos encontrar
    const expectedTables = [
        'users',
        'stripe_sessions', 
        'processed_webhook_events',
        'user_subscriptions',
        'payment_history'
    ];
    
    console.log('📋 Testando tabelas esperadas:\n');
    
    for (const table of expectedTables) {
        try {
            console.log(`🔍 Testando tabela: ${table}`);
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
                
            if (error) {
                if (error.message.includes('relation') || error.message.includes('does not exist')) {
                    console.log(`❌ Tabela '${table}' NÃO EXISTE`);
                } else {
                    console.log(`⚠️ Tabela '${table}' existe mas erro: ${error.message}`);
                }
            } else {
                console.log(`✅ Tabela '${table}' EXISTE e acessível`);
                console.log(`   📊 Registros encontrados: ${data?.length || 0}`);
            }
        } catch (err) {
            console.log(`💥 Erro ao testar '${table}': ${err.message}`);
        }
        console.log('');
    }
    
    console.log('🏁 VERIFICAÇÃO CONCLUÍDA');
}

checkTables();
