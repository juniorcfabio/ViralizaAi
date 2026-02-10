// 📜 PÁGINA DE TERMOS DE USO - FUNCIONAL
import React from 'react';

const TermsOfUsePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">📜 Termos de Uso</h1>
            <p className="text-xl text-gray-300">ViralizaAI - Condições de Utilização da Plataforma</p>
            <div className="text-sm text-gray-400 mt-2">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 space-y-8">
            
            {/* Aceitação */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">✅ 1. Aceitação dos Termos</h2>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-gray-200 leading-relaxed">
                  Ao acessar e utilizar a plataforma ViralizaAI, você concorda integralmente com estes Termos de Uso 
                  e nossa Política de Privacidade. Se você não concorda com qualquer parte destes termos, 
                  não deve utilizar nossos serviços.
                </p>
                <p className="font-semibold text-yellow-300 mt-2">
                  ⚠️ IMPORTANTE: O uso continuado da plataforma constitui aceitação automática de quaisquer atualizações destes termos.
                </p>
              </div>
            </section>

            {/* Descrição do Serviço */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">🚀 2. Descrição do Serviço</h2>
              <p className="text-gray-200 mb-4">
                A ViralizaAI é uma plataforma de automação e crescimento para redes sociais que oferece:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2">🤖 Automação:</h3>
                  <ul className="list-disc list-inside text-gray-200 space-y-1">
                    <li>Postagens automáticas</li>
                    <li>Interações programadas</li>
                    <li>Análise de performance</li>
                    <li>Geração de conteúdo IA</li>
                  </ul>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2">📊 Ferramentas:</h3>
                  <ul className="list-disc list-inside text-gray-200 space-y-1">
                    <li>Editor de vídeos</li>
                    <li>Gerador de música</li>
                    <li>Criador de thumbnails</li>
                    <li>Análise de tendências</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Responsabilidades do Usuário */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">👤 3. Responsabilidades do Usuário</h2>
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h3 className="font-bold text-red-300 mb-2">🚫 É PROIBIDO:</h3>
                  <ul className="list-disc list-inside text-gray-200 space-y-1">
                    <li>Usar a plataforma para atividades ilegais ou fraudulentas</li>
                    <li>Violar termos de serviço das redes sociais</li>
                    <li>Compartilhar credenciais de acesso com terceiros</li>
                    <li>Tentar hackear, reverter ou comprometer a segurança</li>
                    <li>Criar conteúdo ofensivo, discriminatório ou prejudicial</li>
                  </ul>
                </div>
                
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h3 className="font-bold text-green-300 mb-2">✅ VOCÊ DEVE:</h3>
                  <ul className="list-disc list-inside text-gray-200 space-y-1">
                    <li>Fornecer informações verdadeiras e atualizadas</li>
                    <li>Manter suas credenciais seguras</li>
                    <li>Respeitar direitos autorais e propriedade intelectual</li>
                    <li>Usar a plataforma de forma ética e responsável</li>
                    <li>Cumprir todas as leis aplicáveis</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Pagamentos */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">💳 4. Pagamentos e Assinaturas</h2>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-bold mb-2">💰 Planos e Preços:</h3>
                  <ul className="text-gray-200 space-y-1">
                    <li>• Os preços são exibidos em Reais (BRL) incluindo impostos</li>
                    <li>• Pagamentos via Stripe (cartão) ou PIX</li>
                    <li>• Cobrança automática para assinaturas recorrentes</li>
                    <li>• Preços sujeitos a alteração com aviso prévio de 30 dias</li>
                  </ul>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-bold mb-2">🔄 Cancelamentos e Reembolsos:</h3>
                  <ul className="text-gray-200 space-y-1">
                    <li>• Cancelamento a qualquer momento pelo painel do usuário</li>
                    <li>• Reembolso de 7 dias para novos usuários</li>
                    <li>• Sem reembolso proporcional para cancelamentos</li>
                    <li>• Acesso mantido até o final do período pago</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Limitações */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">⚠️ 5. Limitações e Riscos</h2>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                <h3 className="font-bold text-red-300 mb-4">🚨 AVISO IMPORTANTE SOBRE AUTOMAÇÃO:</h3>
                <p className="text-gray-200 mb-4">
                  O uso de automação em redes sociais pode resultar em:
                </p>
                <ul className="list-disc list-inside text-gray-200 space-y-2">
                  <li><strong>Bloqueios temporários</strong> ou permanentes de contas</li>
                  <li><strong>Suspensão de recursos</strong> pelas plataformas sociais</li>
                  <li><strong>Perda de seguidores</strong> ou engajamento</li>
                  <li><strong>Violação de termos</strong> das redes sociais</li>
                </ul>
                <div className="bg-red-600/20 rounded-lg p-4 mt-4">
                  <p className="font-bold text-red-200">
                    🛡️ A ViralizaAI NÃO SE RESPONSABILIZA por bloqueios, suspensões ou penalidades 
                    aplicadas pelas redes sociais. O uso é por sua conta e risco.
                  </p>
                </div>
              </div>
            </section>

            {/* Propriedade Intelectual */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">©️ 6. Propriedade Intelectual</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-bold mb-2">🏢 Nossa Propriedade:</h3>
                  <ul className="text-gray-200 space-y-1">
                    <li>• Código-fonte da plataforma</li>
                    <li>• Algoritmos e IA</li>
                    <li>• Design e interface</li>
                    <li>• Marca e logotipos</li>
                  </ul>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-bold mb-2">👤 Sua Propriedade:</h3>
                  <ul className="text-gray-200 space-y-1">
                    <li>• Conteúdo criado por você</li>
                    <li>• Dados da sua conta</li>
                    <li>• Materiais enviados</li>
                    <li>• Configurações personalizadas</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Disponibilidade */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">🌐 7. Disponibilidade do Serviço</h2>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-200 mb-4">
                  Nos esforçamos para manter a plataforma disponível 24/7, mas não garantimos:
                </p>
                <ul className="list-disc list-inside text-gray-200 space-y-1">
                  <li>Disponibilidade ininterrupta (meta: 99.9% uptime)</li>
                  <li>Ausência de bugs ou erros</li>
                  <li>Compatibilidade com todas as versões de navegadores</li>
                  <li>Funcionamento durante manutenções programadas</li>
                </ul>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-4">
                  <p className="text-blue-200">
                    📅 Manutenções programadas são comunicadas com 48h de antecedência
                  </p>
                </div>
              </div>
            </section>

            {/* Privacidade */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">🔒 8. Privacidade e Dados</h2>
              <p className="text-gray-200 mb-4">
                O tratamento de seus dados pessoais é regido por nossa Política de Privacidade, que faz parte 
                integrante destes termos. Principais pontos:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🛡️</div>
                  <h3 className="font-bold mb-2">Proteção</h3>
                  <p className="text-sm text-gray-200">Criptografia e segurança avançada</p>
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🚫</div>
                  <h3 className="font-bold mb-2">Não Vendemos</h3>
                  <p className="text-sm text-gray-200">Seus dados nunca são comercializados</p>
                </div>
                
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">⚖️</div>
                  <h3 className="font-bold mb-2">LGPD</h3>
                  <p className="text-sm text-gray-200">Conformidade total com a lei</p>
                </div>
              </div>
            </section>

            {/* Modificações */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">🔄 9. Modificações dos Termos</h2>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-gray-200">
                  Reservamo-nos o direito de modificar estes termos a qualquer momento. Mudanças significativas 
                  serão comunicadas por:
                </p>
                <ul className="list-disc list-inside text-gray-200 mt-2 space-y-1">
                  <li>E-mail para todos os usuários ativos</li>
                  <li>Notificação na plataforma</li>
                  <li>Atualização da data nesta página</li>
                </ul>
                <p className="text-yellow-200 font-semibold mt-3">
                  📅 Prazo de 30 dias para contestar mudanças significativas
                </p>
              </div>
            </section>

            {/* Lei Aplicável */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">⚖️ 10. Lei Aplicável e Foro</h2>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-200">
                  Estes termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida no 
                  foro da comarca de São Paulo/SP, com renúncia expressa a qualquer outro foro, 
                  por mais privilegiado que seja.
                </p>
              </div>
            </section>

            {/* Contato */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">📞 11. Contato</h2>
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-6">
                <p className="text-gray-200 mb-4">
                  Dúvidas sobre estes termos? Entre em contato:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-bold mb-2">📧 E-mail:</h3>
                    <p className="text-accent">suporte@viralizaai.com</p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">⏰ Horário:</h3>
                    <p className="text-gray-200">Segunda a Sexta, 9h às 18h</p>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Botão Voltar */}
          <div className="text-center mt-8">
            <button
              onClick={() => window.history.back()}
              className="bg-accent hover:bg-accent/80 text-white font-bold py-3 px-8 rounded-xl transition-all"
            >
              ← Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUsePage;
