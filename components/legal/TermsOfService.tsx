// =======================
// 📜 TERMOS DE USO - PROTEÇÃO LEGAL COMPLETA
// =======================

import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📜 Termos de Uso e Serviço
          </h1>
          <p className="text-gray-600 text-lg">
            ViralizaAI - Plataforma de Automação de Marketing Digital
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="space-y-8 text-gray-700">
          {/* 1. ACEITAÇÃO DOS TERMOS */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">1</span>
              Aceitação dos Termos
            </h2>
            <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
              <p className="mb-4">
                Ao acessar e utilizar a plataforma ViralizaAI, você concorda integralmente com estes Termos de Uso e nossa Política de Privacidade. Se você não concorda com qualquer parte destes termos, não deve utilizar nossos serviços.
              </p>
              <p className="font-semibold text-purple-800">
                ⚠️ IMPORTANTE: O uso continuado da plataforma constitui aceitação automática de quaisquer atualizações destes termos.
              </p>
            </div>
          </section>

          {/* 2. RESPONSABILIDADE DO USUÁRIO */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-red-100 text-red-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">2</span>
              Responsabilidade do Usuário
            </h2>
            <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
              <h3 className="font-bold text-red-800 mb-3">🛡️ VOCÊ É TOTALMENTE RESPONSÁVEL POR:</h3>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span><strong>Uso das automações:</strong> Todo conteúdo gerado, postado ou enviado através da plataforma</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span><strong>Conformidade legal:</strong> Cumprimento das leis locais, nacionais e internacionais</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span><strong>Políticas das redes sociais:</strong> Respeitar os termos de uso de Instagram, TikTok, Facebook, etc.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span><strong>Conteúdo apropriado:</strong> Não publicar conteúdo ofensivo, ilegal ou que viole direitos autorais</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span><strong>Segurança da conta:</strong> Manter suas credenciais seguras e não compartilhar acesso</span>
                </li>
              </ul>
              <div className="bg-red-100 p-4 rounded-lg">
                <p className="font-bold text-red-800">
                  ⚖️ ISENÇÃO DE RESPONSABILIDADE: A ViralizaAI NÃO se responsabiliza por qualquer consequência decorrente do uso inadequado da plataforma, incluindo mas não limitado a: banimentos, suspensões, processos legais ou danos à reputação.
                </p>
              </div>
            </div>
          </section>

          {/* 3. LIMITAÇÕES E GARANTIAS */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-yellow-100 text-yellow-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">3</span>
              Limitações e Garantias
            </h2>
            <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
              <h3 className="font-bold text-yellow-800 mb-3">⚠️ LIMITAÇÕES IMPORTANTES:</h3>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span><strong>Sem garantia de aprovação:</strong> Não garantimos que suas contas não serão suspensas pelas redes sociais</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span><strong>Resultados variáveis:</strong> O desempenho das automações pode variar conforme algoritmos das plataformas</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span><strong>Disponibilidade:</strong> Serviços podem ter interrupções para manutenção ou atualizações</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span><strong>Mudanças nas APIs:</strong> Funcionalidades podem ser alteradas devido a mudanças nas redes sociais</span>
                </li>
              </ul>
              <div className="bg-yellow-100 p-4 rounded-lg">
                <p className="font-bold text-yellow-800">
                  🔧 MELHOR ESFORÇO: Fornecemos nossos serviços com base no "melhor esforço", utilizando as melhores práticas de segurança e automação disponíveis.
                </p>
              </div>
            </div>
          </section>

          {/* 4. PROTEÇÃO DE DADOS */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">4</span>
              Proteção de Dados e Privacidade
            </h2>
            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
              <h3 className="font-bold text-green-800 mb-3">🔒 SEGURANÇA DOS SEUS DADOS:</h3>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Criptografia AES-256:</strong> Todos os tokens e dados sensíveis são criptografados</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Conformidade LGPD:</strong> Cumprimos integralmente a Lei Geral de Proteção de Dados</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Não compartilhamento:</strong> Seus dados nunca são vendidos ou compartilhados com terceiros</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Direito ao esquecimento:</strong> Você pode solicitar a exclusão completa dos seus dados</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Auditoria completa:</strong> Mantemos logs detalhados para transparência e segurança</span>
                </li>
              </ul>
              <div className="bg-green-100 p-4 rounded-lg">
                <p className="font-bold text-green-800">
                  🛡️ COMPROMISSO: Utilizamos segurança de nível bancário para proteger suas informações e credenciais de redes sociais.
                </p>
              </div>
            </div>
          </section>

          {/* 5. POLÍTICA DE USO ACEITÁVEL */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">5</span>
              Política de Uso Aceitável
            </h2>
            <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-bold text-blue-800 mb-3">🚫 USOS PROIBIDOS:</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-blue-700 mb-2">Conteúdo Proibido:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Spam ou conteúdo não solicitado</li>
                    <li>• Material ofensivo ou discriminatório</li>
                    <li>• Violação de direitos autorais</li>
                    <li>• Conteúdo adulto ou inadequado</li>
                    <li>• Informações falsas ou enganosas</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-700 mb-2">Atividades Proibidas:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Automação excessiva (acima dos limites)</li>
                    <li>• Tentativas de burlar sistemas</li>
                    <li>• Compartilhamento de credenciais</li>
                    <li>• Uso para atividades ilegais</li>
                    <li>• Revenda não autorizada</li>
                  </ul>
                </div>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <p className="font-bold text-blue-800">
                  ⚡ SUSPENSÃO IMEDIATA: Reservamo-nos o direito de suspender contas que violem estas políticas sem aviso prévio.
                </p>
              </div>
            </div>
          </section>

          {/* 6. PLANOS E PAGAMENTOS */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-indigo-100 text-indigo-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">6</span>
              Planos e Pagamentos
            </h2>
            <div className="bg-indigo-50 p-6 rounded-lg border-l-4 border-indigo-500">
              <h3 className="font-bold text-indigo-800 mb-3">💳 POLÍTICA DE COBRANÇA:</h3>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  <span><strong>Cobrança recorrente:</strong> Planos são cobrados automaticamente conforme período escolhido</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  <span><strong>Cancelamento:</strong> Pode ser feito a qualquer momento, válido até o fim do período pago</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  <span><strong>Reembolso:</strong> Disponível em até 7 dias após a compra, conforme nossa política</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-600 mr-2">•</span>
                  <span><strong>Alteração de preços:</strong> Notificaremos com 30 dias de antecedência</span>
                </li>
              </ul>
              <div className="bg-indigo-100 p-4 rounded-lg">
                <p className="font-bold text-indigo-800">
                  🔒 PAGAMENTOS SEGUROS: Utilizamos Stripe para processamento seguro de pagamentos com certificação PCI DSS.
                </p>
              </div>
            </div>
          </section>

          {/* 7. PROPRIEDADE INTELECTUAL */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">7</span>
              Propriedade Intelectual
            </h2>
            <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
              <ul className="space-y-2 mb-4">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">©</span>
                  <span><strong>Plataforma ViralizaAI:</strong> Todos os direitos reservados à nossa empresa</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">©</span>
                  <span><strong>Seu conteúdo:</strong> Você mantém todos os direitos sobre o conteúdo que cria</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">©</span>
                  <span><strong>Licença de uso:</strong> Concedemos licença não exclusiva para usar nossa plataforma</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">©</span>
                  <span><strong>Marcas registradas:</strong> ViralizaAI e logos são marcas protegidas</span>
                </li>
              </ul>
            </div>
          </section>

          {/* 8. LIMITAÇÃO DE RESPONSABILIDADE */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-red-100 text-red-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">8</span>
              Limitação de Responsabilidade
            </h2>
            <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
              <div className="bg-red-100 p-4 rounded-lg mb-4">
                <p className="font-bold text-red-800 text-center">
                  ⚖️ CLÁUSULA IMPORTANTE DE LIMITAÇÃO DE RESPONSABILIDADE
                </p>
              </div>
              <p className="mb-4">
                <strong>A ViralizaAI, seus proprietários, funcionários e parceiros NÃO serão responsáveis por:</strong>
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span>Danos diretos, indiretos, incidentais ou consequenciais</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span>Perda de lucros, dados ou oportunidades de negócio</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span>Suspensão ou banimento de contas em redes sociais</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span>Falhas técnicas, interrupções ou indisponibilidade do serviço</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span>Ações de terceiros ou mudanças nas políticas das redes sociais</span>
                </li>
              </ul>
              <p className="font-bold text-red-800">
                Nossa responsabilidade máxima está limitada ao valor pago pelo serviço no período de 12 meses.
              </p>
            </div>
          </section>

          {/* 9. MODIFICAÇÕES DOS TERMOS */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-gray-100 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">9</span>
              Modificações dos Termos
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-gray-500">
              <p className="mb-4">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação na plataforma.
              </p>
              <p className="font-semibold">
                📧 Notificaremos usuários ativos sobre mudanças significativas por email com 15 dias de antecedência.
              </p>
            </div>
          </section>

          {/* 10. LEI APLICÁVEL */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">10</span>
              Lei Aplicável e Foro
            </h2>
            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
              <p className="mb-2">
                <strong>Lei Aplicável:</strong> Estes termos são regidos pelas leis brasileiras.
              </p>
              <p className="mb-2">
                <strong>Foro:</strong> Comarca de São Paulo/SP para resolução de disputas.
              </p>
              <p className="font-semibold text-green-800">
                🇧🇷 Conformidade total com LGPD, Marco Civil da Internet e Código de Defesa do Consumidor.
              </p>
            </div>
          </section>

          {/* CONTATO */}
          <section className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              📞 Contato e Suporte
            </h2>
            <div className="text-center space-y-2">
              <p><strong>Email:</strong> legal@viralizaai.com</p>
              <p><strong>Suporte:</strong> suporte@viralizaai.com</p>
              <p><strong>WhatsApp:</strong> +55 11 99999-9999</p>
              <p className="text-sm text-gray-600 mt-4">
                Horário de atendimento: Segunda a Sexta, 9h às 18h (horário de Brasília)
              </p>
            </div>
          </section>

          {/* ACEITAÇÃO */}
          <section className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-4">✅ Confirmação de Aceitação</h3>
            <p className="mb-4">
              Ao utilizar a plataforma ViralizaAI, você confirma que:
            </p>
            <ul className="text-left max-w-2xl mx-auto space-y-2 mb-4">
              <li>✓ Leu e compreendeu todos os termos acima</li>
              <li>✓ Concorda em ser legalmente vinculado por estes termos</li>
              <li>✓ Tem capacidade legal para aceitar este contrato</li>
              <li>✓ Utilizará a plataforma de forma responsável e legal</li>
            </ul>
            <p className="font-bold text-lg">
              🤝 Bem-vindo à ViralizaAI - Use com responsabilidade!
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
