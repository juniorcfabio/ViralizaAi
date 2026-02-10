// 🔒 PÁGINA DE POLÍTICA DE PRIVACIDADE - FUNCIONAL
import React from 'react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">🔒 Política de Privacidade</h1>
            <p className="text-xl text-gray-300">ViralizaAI - Proteção e Transparência de Dados</p>
            <div className="text-sm text-gray-400 mt-2">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 space-y-8">
            
            {/* Introdução */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">📋 1. Introdução</h2>
              <p className="text-gray-200 leading-relaxed">
                A ViralizaAI está comprometida em proteger sua privacidade e dados pessoais. Esta Política de Privacidade 
                explica como coletamos, usamos, armazenamos e protegemos suas informações quando você utiliza nossa plataforma 
                de automação e crescimento de redes sociais.
              </p>
            </section>

            {/* Dados Coletados */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">📊 2. Dados Coletados</h2>
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2">👤 Informações Pessoais:</h3>
                  <ul className="list-disc list-inside text-gray-200 space-y-1">
                    <li>Nome completo e CPF</li>
                    <li>Endereço de e-mail</li>
                    <li>Informações de pagamento (processadas via Stripe)</li>
                    <li>Dados de acesso às redes sociais (com sua autorização)</li>
                  </ul>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2">📈 Dados de Uso:</h3>
                  <ul className="list-disc list-inside text-gray-200 space-y-1">
                    <li>Métricas de performance das campanhas</li>
                    <li>Histórico de interações na plataforma</li>
                    <li>Preferências e configurações</li>
                    <li>Logs de atividade e segurança</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Como Usamos */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">🎯 3. Como Usamos Seus Dados</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-bold mb-2">🚀 Funcionalidades:</h3>
                  <ul className="text-gray-200 space-y-1">
                    <li>• Automação de redes sociais</li>
                    <li>• Análise de performance</li>
                    <li>• Geração de conteúdo IA</li>
                    <li>• Relatórios personalizados</li>
                  </ul>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-bold mb-2">🔧 Melhorias:</h3>
                  <ul className="text-gray-200 space-y-1">
                    <li>• Otimização de algoritmos</li>
                    <li>• Desenvolvimento de recursos</li>
                    <li>• Suporte técnico</li>
                    <li>• Prevenção de fraudes</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Compartilhamento */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">🤝 4. Compartilhamento de Dados</h2>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <h3 className="font-bold text-red-300 mb-2">🚫 Nunca Compartilhamos:</h3>
                <p className="text-gray-200">
                  Seus dados pessoais NUNCA são vendidos, alugados ou compartilhados com terceiros para fins comerciais. 
                  Compartilhamos apenas quando:
                </p>
                <ul className="list-disc list-inside text-gray-200 mt-2 space-y-1">
                  <li>Você autoriza expressamente</li>
                  <li>Exigido por lei ou ordem judicial</li>
                  <li>Para processamento de pagamentos (Stripe/PIX)</li>
                  <li>Com provedores de serviços essenciais (sob contrato de confidencialidade)</li>
                </ul>
              </div>
            </section>

            {/* Segurança */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">🔐 5. Segurança dos Dados</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🔒</div>
                  <h3 className="font-bold mb-2">Criptografia</h3>
                  <p className="text-sm text-gray-200">SSL/TLS para todas as transmissões</p>
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🛡️</div>
                  <h3 className="font-bold mb-2">Proteção</h3>
                  <p className="text-sm text-gray-200">Firewalls e monitoramento 24/7</p>
                </div>
                
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🔑</div>
                  <h3 className="font-bold mb-2">Acesso</h3>
                  <p className="text-sm text-gray-200">Controle rigoroso de permissões</p>
                </div>
              </div>
            </section>

            {/* Seus Direitos */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">⚖️ 6. Seus Direitos (LGPD)</h2>
              <div className="bg-white/5 rounded-lg p-6">
                <p className="text-gray-200 mb-4">
                  Conforme a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✅</span>
                      <span>Confirmação da existência de tratamento</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✅</span>
                      <span>Acesso aos dados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✅</span>
                      <span>Correção de dados incompletos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✅</span>
                      <span>Anonimização ou eliminação</span>
                    </li>
                  </ul>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✅</span>
                      <span>Portabilidade dos dados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✅</span>
                      <span>Eliminação de dados tratados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✅</span>
                      <span>Informação sobre compartilhamento</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-400">✅</span>
                      <span>Revogação do consentimento</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">🍪 7. Cookies e Tecnologias</h2>
              <p className="text-gray-200 mb-4">
                Utilizamos cookies e tecnologias similares para melhorar sua experiência:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                  <span className="text-blue-400">🔧</span>
                  <div>
                    <strong>Cookies Essenciais:</strong> Necessários para funcionamento básico
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                  <span className="text-green-400">📊</span>
                  <div>
                    <strong>Cookies Analíticos:</strong> Para entender como você usa a plataforma
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                  <span className="text-purple-400">🎯</span>
                  <div>
                    <strong>Cookies de Personalização:</strong> Para adaptar conteúdo às suas preferências
                  </div>
                </div>
              </div>
            </section>

            {/* Contato */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">📞 8. Contato e Dúvidas</h2>
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-6">
                <p className="text-gray-200 mb-4">
                  Para exercer seus direitos ou esclarecer dúvidas sobre esta política:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-bold mb-2">📧 E-mail:</h3>
                    <p className="text-accent">privacidade@viralizaai.com</p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">⏰ Prazo de Resposta:</h3>
                    <p className="text-gray-200">Até 15 dias úteis</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Atualizações */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-accent">🔄 9. Atualizações</h2>
              <p className="text-gray-200">
                Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas 
                por e-mail ou através da plataforma. O uso continuado após as alterações constitui aceitação 
                dos novos termos.
              </p>
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

export default PrivacyPolicyPage;
