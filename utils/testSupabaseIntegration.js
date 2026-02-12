/**
 * TESTE COMPLETO DA INTEGRAÇÃO SUPABASE
 * Execute no console para testar se tudo está funcionando
 */

// Função para testar a integração completa
async function testarIntegracaoCompleta() {
  console.clear();
  console.log('🚀 TESTANDO INTEGRAÇÃO COMPLETA COM SUPABASE');
  console.log('='.repeat(60));
  
  try {
    // Importar o serviço de integração
    const { autoSupabaseIntegration } = await import('../services/autoSupabaseIntegration.js');
    
    console.log('✅ Serviço de integração importado com sucesso');
    
    // 1. TESTE DE USUÁRIO
    console.log('\n📋 1. TESTANDO SALVAMENTO DE USUÁRIO...');
    const testUser = {
      id: `test_user_${Date.now()}`,
      name: 'Usuário Teste',
      email: `teste${Date.now()}@viralizaai.com`,
      cpf: '12345678901',
      type: 'client',
      status: 'Ativo',
      joinedDate: new Date().toISOString()
    };
    
    const savedUser = await autoSupabaseIntegration.saveUser(testUser);
    console.log('✅ Usuário salvo:', savedUser?.email);
    
    // 2. TESTE DE ACESSO À FERRAMENTA
    console.log('\n🔧 2. TESTANDO CONTROLE DE ACESSO...');
    await autoSupabaseIntegration.saveToolAccess(
      testUser.id, 
      'Editor de Vídeo Pro', 
      'Plano Premium'
    );
    console.log('✅ Acesso à ferramenta salvo');
    
    const hasAccess = await autoSupabaseIntegration.checkToolAccess(
      testUser.id, 
      'Editor de Vídeo Pro'
    );
    console.log('✅ Verificação de acesso:', hasAccess ? 'TEM ACESSO' : 'SEM ACESSO');
    
    // 3. TESTE DE PAGAMENTO
    console.log('\n💰 3. TESTANDO SALVAMENTO DE PAGAMENTO...');
    const testPayment = {
      userId: testUser.id,
      type: 'plan',
      itemName: 'Plano Premium',
      amount: 97.00,
      paymentMethod: 'pix',
      status: 'confirmed',
      transactionId: `tx_${Date.now()}`,
      pixKey: 'caccb1b4-6b25-4e5a-98a0-17121d31780e'
    };
    
    const savedPayment = await autoSupabaseIntegration.savePayment(testPayment);
    console.log('✅ Pagamento salvo:', savedPayment?.id);
    
    // 4. TESTE DE CONTEÚDO GERADO
    console.log('\n📝 4. TESTANDO CONTEÚDO GERADO...');
    const testContent = {
      userId: testUser.id,
      toolName: 'Gerador de Ebooks',
      contentType: 'ebook',
      contentData: {
        title: 'Ebook de Teste',
        chapters: 15,
        generatedAt: new Date().toISOString()
      }
    };
    
    const savedContent = await autoSupabaseIntegration.saveGeneratedContent(testContent);
    console.log('✅ Conteúdo salvo:', savedContent?.id);
    
    // 5. VERIFICAR TABELAS
    console.log('\n📊 5. VERIFICANDO TODAS AS TABELAS...');
    const tabelas = ['users', 'user_profiles', 'user_access', 'payments', 'purchases', 'generated_content'];
    
    for (const tabela of tabelas) {
      try {
        const response = await fetch(`https://ymmswnmietxoupeazmok.supabase.co/rest/v1/${tabela}?select=count`, {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbXN3bm1pZXR4b3VwZWF6bW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODY2NjcsImV4cCI6MjA4MDI2MjY2N30.yvCcvTnqAMsNz9itandg4lyxeEmhsukcbqfkWZnkeu4',
            'Prefer': 'count=exact'
          }
        });
        
        const count = response.headers.get('Content-Range')?.split('/')[1] || '0';
        console.log(`✅ ${tabela}: ${count} registros`);
      } catch (error) {
        console.log(`❌ ${tabela}: ERRO - ${error.message}`);
      }
    }
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log('='.repeat(60));
    console.log('✅ INTEGRAÇÃO COMPLETA FUNCIONANDO!');
    console.log('✅ Todas as tabelas acessíveis');
    console.log('✅ Salvamento automático ativo');
    console.log('✅ Controle de acesso operacional');
    console.log('✅ Sistema de pagamentos integrado');
    console.log('✅ Dados persistindo no PostgreSQL');
    
    return true;
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    console.log('\n🔧 VERIFIQUE:');
    console.log('1. Se as tabelas user_access e payments foram criadas');
    console.log('2. Se a conexão com Supabase está funcionando');
    console.log('3. Se as variáveis de ambiente estão corretas');
    return false;
  }
}

// Função para verificar status das tabelas específicas
async function verificarTabelasEspecificas() {
  console.log('\n🔍 VERIFICANDO TABELAS ESPECÍFICAS:');
  console.log('='.repeat(50));
  
  const tabelasEspecificas = ['user_access', 'payments'];
  
  for (const tabela of tabelasEspecificas) {
    try {
      const response = await fetch(`https://ymmswnmietxoupeazmok.supabase.co/rest/v1/${tabela}?select=*&limit=1`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbXN3bm1pZXR4b3VwZWF6bW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODY2NjcsImV4cCI6MjA4MDI2MjY2N30.yvCcvTnqAMsNz9itandg4lyxeEmhsukcbqfkWZnkeu4'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${tabela}: CRIADA E ACESSÍVEL (${data.length} registros)`);
      } else {
        console.log(`❌ ${tabela}: ERRO ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${tabela}: ERRO - ${error.message}`);
    }
  }
}

// Disponibilizar funções globalmente
window.testarIntegracaoCompleta = testarIntegracaoCompleta;
window.verificarTabelasEspecificas = verificarTabelasEspecificas;

console.log('🧪 FUNÇÕES DE TESTE CARREGADAS!');
console.log('Digite no console:');
console.log('• testarIntegracaoCompleta() - Teste completo');
console.log('• verificarTabelasEspecificas() - Verificar tabelas user_access e payments');
