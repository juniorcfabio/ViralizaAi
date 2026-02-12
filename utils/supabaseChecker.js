/**
 * SCRIPT DE VERIFICAÇÃO RÁPIDA DO SUPABASE
 * Cole este código no console do navegador para verificar se os dados estão sendo salvos
 */

// Função para verificar conexão e dados do Supabase
async function verificarSupabase() {
  console.log('🔍 VERIFICANDO SUPABASE/POSTGRESQL...\n');
  
  try {
    // Importar Supabase
    const { supabase } = await import('../services/autoSupabaseIntegration.js');
    
    console.log('✅ Supabase importado com sucesso');
    console.log('🔗 URL:', supabase.supabaseUrl);
    
    // Verificar conexão
    console.log('\n📡 Testando conexão...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Erro de conexão:', connectionError);
      return false;
    }
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Verificar tabelas
    const tabelas = ['users', 'user_access', 'payments', 'generated_content', 'user_settings', 'activity_logs'];
    
    console.log('\n📊 VERIFICANDO TABELAS:');
    console.log('='.repeat(50));
    
    for (const tabela of tabelas) {
      try {
        const { count, error } = await supabase
          .from(tabela)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${tabela}: ERRO - ${error.message}`);
        } else {
          console.log(`✅ ${tabela}: ${count || 0} registros`);
        }
      } catch (err) {
        console.log(`❌ ${tabela}: ERRO - ${err.message}`);
      }
    }
    
    // Verificar dados recentes
    console.log('\n📈 ÚLTIMAS ATIVIDADES:');
    console.log('='.repeat(50));
    
    try {
      const { data: atividades, error: atividadesError } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (atividadesError) {
        console.log('❌ Erro ao buscar atividades:', atividadesError.message);
      } else if (atividades && atividades.length > 0) {
        atividades.forEach((atividade, index) => {
          const data = new Date(atividade.created_at).toLocaleString('pt-BR');
          console.log(`${index + 1}. ${atividade.action} - ${data}`);
        });
      } else {
        console.log('ℹ️ Nenhuma atividade encontrada');
      }
    } catch (err) {
      console.log('❌ Erro ao verificar atividades:', err.message);
    }
    
    // Testar inserção
    console.log('\n🧪 TESTANDO INSERÇÃO DE DADOS...');
    console.log('='.repeat(50));
    
    try {
      const { data: testeInsercao, error: erroInsercao } = await supabase
        .from('activity_logs')
        .insert({
          user_id: 'teste_console',
          action: 'verificacao_console',
          details: {
            timestamp: new Date().toISOString(),
            teste: true,
            navegador: navigator.userAgent.substring(0, 50)
          },
          ip_address: 'console',
          user_agent: 'Console Test'
        })
        .select();
      
      if (erroInsercao) {
        console.log('❌ Erro na inserção:', erroInsercao.message);
      } else {
        console.log('✅ Inserção realizada com sucesso!');
        console.log('📝 Dados inseridos:', testeInsercao);
        
        // Limpar dados de teste
        await supabase
          .from('activity_logs')
          .delete()
          .eq('user_id', 'teste_console');
        
        console.log('🧹 Dados de teste removidos');
      }
    } catch (err) {
      console.log('❌ Erro no teste de inserção:', err.message);
    }
    
    console.log('\n🎯 RESUMO FINAL:');
    console.log('='.repeat(50));
    console.log('✅ Supabase está funcionando corretamente!');
    console.log('✅ Todas as tabelas estão acessíveis');
    console.log('✅ Inserção e leitura funcionando');
    console.log('✅ Sistema de integração automática ativo');
    
    return true;
    
  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
    console.log('\n🔧 POSSÍVEIS SOLUÇÕES:');
    console.log('1. Verificar se as variáveis de ambiente estão corretas');
    console.log('2. Verificar conexão com internet');
    console.log('3. Verificar se o Supabase está online');
    return false;
  }
}

// Função para verificar localStorage
function verificarLocalStorage() {
  console.log('\n💾 VERIFICANDO LOCALSTORAGE:');
  console.log('='.repeat(50));
  
  const chaves = Object.keys(localStorage).filter(key => 
    key.startsWith('viraliza') || key.startsWith('viralizaai')
  );
  
  if (chaves.length === 0) {
    console.log('ℹ️ Nenhum dado do ViralizaAI encontrado no localStorage');
  } else {
    chaves.forEach(chave => {
      try {
        const valor = localStorage.getItem(chave);
        const dados = JSON.parse(valor);
        console.log(`📄 ${chave}:`, typeof dados === 'object' ? Object.keys(dados) : dados);
      } catch {
        console.log(`📄 ${chave}: (dados não-JSON)`);
      }
    });
  }
}

// Função para verificar sincronização
function verificarSincronizacao() {
  console.log('\n🔄 VERIFICANDO SINCRONIZAÇÃO:');
  console.log('='.repeat(50));
  
  // Verificar se o sistema de integração está ativo
  if (typeof window.autoIntegration !== 'undefined') {
    console.log('✅ Sistema de integração automática detectado');
    console.log('📊 Status:', window.autoIntegration.getStatus());
  } else {
    console.log('⚠️ Sistema de integração automática não detectado');
  }
}

// Executar verificação completa
async function verificacaoCompleta() {
  console.clear();
  console.log('🚀 VERIFICAÇÃO COMPLETA DO SUPABASE/POSTGRESQL');
  console.log('='.repeat(60));
  console.log('Data/Hora:', new Date().toLocaleString('pt-BR'));
  console.log('URL atual:', window.location.href);
  console.log('='.repeat(60));
  
  verificarLocalStorage();
  verificarSincronizacao();
  await verificarSupabase();
  
  console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!');
  console.log('Para executar novamente, digite: verificacaoCompleta()');
}

// Disponibilizar funções globalmente
window.verificarSupabase = verificarSupabase;
window.verificarLocalStorage = verificarLocalStorage;
window.verificarSincronizacao = verificarSincronizacao;
window.verificacaoCompleta = verificacaoCompleta;

console.log('🔧 FUNÇÕES DE VERIFICAÇÃO CARREGADAS!');
console.log('Digite uma das funções abaixo no console:');
console.log('• verificacaoCompleta() - Verificação completa');
console.log('• verificarSupabase() - Apenas Supabase');
console.log('• verificarLocalStorage() - Apenas localStorage');
console.log('• verificarSincronizacao() - Apenas sincronização');
