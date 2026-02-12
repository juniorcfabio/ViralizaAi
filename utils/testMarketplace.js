/**
 * TESTE COMPLETO DO MARKETPLACE DE FERRAMENTAS
 * Execute no console para verificar se tudo está funcionando
 */

// Função para testar o marketplace completo
async function testarMarketplaceCompleto() {
  console.clear();
  console.log('🛒 TESTANDO MARKETPLACE DE FERRAMENTAS COMPLETO');
  console.log('='.repeat(60));
  
  const resultados = {
    acessoAdmin: false,
    ferramentasCarregadas: false,
    integracaoSupabase: false,
    criacaoFerramenta: false,
    iaCreadora: false,
    botoesFuncionais: false,
    dadosPersistentes: false
  };

  try {
    // 1. TESTAR ACESSO À PÁGINA ADMIN
    console.log('\n🔐 1. TESTANDO ACESSO À PÁGINA ADMIN...');
    const currentUrl = window.location.href;
    if (currentUrl.includes('/admin/marketplace')) {
      console.log('✅ Página admin acessível');
      resultados.acessoAdmin = true;
    } else {
      console.log('❌ Não está na página admin do marketplace');
      console.log('📍 URL atual:', currentUrl);
      console.log('🔗 Acesse: https://viralizaai.vercel.app/admin/marketplace');
      return resultados;
    }

    // 2. VERIFICAR SE AS FERRAMENTAS ESTÃO CARREGADAS
    console.log('\n🛠️ 2. VERIFICANDO FERRAMENTAS CARREGADAS...');
    
    // Aguardar um pouco para o React carregar
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const toolRows = document.querySelectorAll('tbody tr');
    if (toolRows.length >= 24) {
      console.log(`✅ ${toolRows.length} ferramentas encontradas na tabela`);
      resultados.ferramentasCarregadas = true;
      
      // Listar algumas ferramentas
      console.log('📋 Primeiras 5 ferramentas:');
      for (let i = 0; i < Math.min(5, toolRows.length); i++) {
        const toolName = toolRows[i].querySelector('td:first-child')?.textContent?.trim();
        const toolPrice = toolRows[i].querySelector('td:nth-child(3)')?.textContent?.trim();
        console.log(`  ${i + 1}. ${toolName} - ${toolPrice}`);
      }
    } else {
      console.log(`❌ Apenas ${toolRows.length} ferramentas encontradas (esperado: 24)`);
    }

    // 3. TESTAR INTEGRAÇÃO COM SUPABASE
    console.log('\n📡 3. TESTANDO INTEGRAÇÃO COM SUPABASE...');
    try {
      const response = await fetch('https://ymmswnmietxoupeazmok.supabase.co/rest/v1/generated_content?select=count', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltbXN3bm1pZXR4b3VwZWF6bW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODY2NjcsImV4cCI6MjA4MDI2MjY2N30.yvCcvTnqAMsNz9itandg4lyxeEmhsukcbqfkWZnkeu4',
          'Prefer': 'count=exact'
        }
      });
      
      if (response.ok) {
        console.log('✅ Conexão com Supabase funcionando');
        resultados.integracaoSupabase = true;
      } else {
        console.log('❌ Erro na conexão com Supabase:', response.status);
      }
    } catch (error) {
      console.log('❌ Erro ao conectar com Supabase:', error.message);
    }

    // 4. TESTAR BOTÃO CRIAR FERRAMENTA
    console.log('\n➕ 4. TESTANDO BOTÃO CRIAR FERRAMENTA...');
    const createButton = document.querySelector('button:contains("Criar Nova Ferramenta")') || 
                        Array.from(document.querySelectorAll('button')).find(btn => 
                          btn.textContent.includes('Criar Nova Ferramenta'));
    
    if (createButton) {
      console.log('✅ Botão "Criar Nova Ferramenta" encontrado');
      
      // Simular clique
      try {
        createButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const modal = document.querySelector('[role="dialog"]') || 
                     document.querySelector('.fixed.inset-0') ||
                     document.querySelector('div:contains("Criar Nova Ferramenta")');
        
        if (modal) {
          console.log('✅ Modal de criação abriu corretamente');
          resultados.criacaoFerramenta = true;
          
          // Fechar modal
          const cancelButton = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent.includes('Cancelar'));
          if (cancelButton) cancelButton.click();
        } else {
          console.log('❌ Modal de criação não abriu');
        }
      } catch (error) {
        console.log('❌ Erro ao testar botão criar:', error.message);
      }
    } else {
      console.log('❌ Botão "Criar Nova Ferramenta" não encontrado');
    }

    // 5. TESTAR IA CRIADORA
    console.log('\n🤖 5. TESTANDO IA CRIADORA...');
    const aiButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Ativar IA Criadora'));
    
    if (aiButton) {
      console.log('✅ Botão "Ativar IA Criadora" encontrado');
      resultados.iaCreadora = true;
    } else {
      console.log('❌ Botão "Ativar IA Criadora" não encontrado');
    }

    // 6. TESTAR BOTÕES DE AÇÃO
    console.log('\n⚙️ 6. TESTANDO BOTÕES DE AÇÃO...');
    const actionButtons = document.querySelectorAll('button[title]');
    const editButtons = Array.from(actionButtons).filter(btn => btn.title?.includes('Editar'));
    const deleteButtons = Array.from(actionButtons).filter(btn => btn.title?.includes('Deletar'));
    const reportButtons = Array.from(actionButtons).filter(btn => btn.title?.includes('relatório'));
    
    if (editButtons.length > 0 && deleteButtons.length > 0) {
      console.log(`✅ Botões de ação encontrados: ${editButtons.length} editar, ${deleteButtons.length} deletar`);
      resultados.botoesFuncionais = true;
    } else {
      console.log('❌ Botões de ação não encontrados');
    }

    // 7. VERIFICAR ESTATÍSTICAS
    console.log('\n📊 7. VERIFICANDO ESTATÍSTICAS...');
    const statCards = document.querySelectorAll('.bg-white.rounded-lg.shadow-md');
    if (statCards.length >= 5) {
      console.log(`✅ ${statCards.length} cards de estatísticas encontrados`);
      
      // Extrair valores das estatísticas
      statCards.forEach((card, index) => {
        const title = card.querySelector('.text-sm.font-medium')?.textContent;
        const value = card.querySelector('.text-2xl.font-bold')?.textContent;
        if (title && value) {
          console.log(`  📈 ${title}: ${value}`);
        }
      });
    } else {
      console.log('❌ Cards de estatísticas não encontrados');
    }

    // 8. VERIFICAR GRÁFICO
    console.log('\n📊 8. VERIFICANDO GRÁFICO DE VENDAS...');
    const chart = document.querySelector('.recharts-wrapper') || 
                 document.querySelector('svg[class*="recharts"]');
    
    if (chart) {
      console.log('✅ Gráfico de vendas encontrado');
    } else {
      console.log('❌ Gráfico de vendas não encontrado');
    }

  } catch (error) {
    console.error('❌ ERRO GERAL NO TESTE:', error);
  }

  // RESUMO FINAL
  console.log('\n🎯 RESUMO DOS TESTES:');
  console.log('='.repeat(50));
  
  const totalTestes = Object.keys(resultados).length;
  const testesPassaram = Object.values(resultados).filter(Boolean).length;
  const porcentagem = Math.round((testesPassaram / totalTestes) * 100);
  
  Object.entries(resultados).forEach(([teste, passou]) => {
    const status = passou ? '✅' : '❌';
    const nomeFormatado = teste.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`${status} ${nomeFormatado}`);
  });
  
  console.log('\n📊 RESULTADO FINAL:');
  console.log(`${testesPassaram}/${totalTestes} testes passaram (${porcentagem}%)`);
  
  if (porcentagem >= 80) {
    console.log('🎉 MARKETPLACE FUNCIONANDO CORRETAMENTE!');
  } else if (porcentagem >= 60) {
    console.log('⚠️ MARKETPLACE PARCIALMENTE FUNCIONAL - PRECISA AJUSTES');
  } else {
    console.log('❌ MARKETPLACE COM PROBLEMAS CRÍTICOS');
  }
  
  return resultados;
}

// Função para testar funcionalidades específicas
async function testarFuncionalidadeEspecifica(funcionalidade) {
  console.log(`🔍 TESTANDO: ${funcionalidade.toUpperCase()}`);
  
  switch (funcionalidade.toLowerCase()) {
    case 'criar':
      const createBtn = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Criar Nova Ferramenta'));
      if (createBtn) {
        createBtn.click();
        console.log('✅ Modal de criação ativado');
      } else {
        console.log('❌ Botão criar não encontrado');
      }
      break;
      
    case 'ia':
      const aiBtn = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Ativar IA Criadora'));
      if (aiBtn) {
        aiBtn.click();
        console.log('✅ IA Criadora ativada');
      } else {
        console.log('❌ Botão IA não encontrado');
      }
      break;
      
    case 'relatorio':
      const reportBtn = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Relatório Completo'));
      if (reportBtn) {
        reportBtn.click();
        console.log('✅ Relatório gerado');
      } else {
        console.log('❌ Botão relatório não encontrado');
      }
      break;
      
    default:
      console.log('❌ Funcionalidade não reconhecida');
  }
}

// Disponibilizar funções globalmente
window.testarMarketplaceCompleto = testarMarketplaceCompleto;
window.testarFuncionalidadeEspecifica = testarFuncionalidadeEspecifica;

console.log('🧪 FUNÇÕES DE TESTE DO MARKETPLACE CARREGADAS!');
console.log('Digite no console:');
console.log('• testarMarketplaceCompleto() - Teste completo');
console.log('• testarFuncionalidadeEspecifica("criar") - Testar criação');
console.log('• testarFuncionalidadeEspecifica("ia") - Testar IA');
console.log('• testarFuncionalidadeEspecifica("relatorio") - Testar relatório');
