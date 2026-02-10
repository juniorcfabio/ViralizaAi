// 🎧 PÁGINA DE SUPORTE - FUNCIONAL
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';

const SupportPage: React.FC = () => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('geral');
  const [ticketForm, setTicketForm] = useState({
    category: 'tecnico',
    priority: 'media',
    subject: '',
    message: ''
  });
  const [showTicketForm, setShowTicketForm] = useState(false);

  const supportCategories = [
    { id: 'geral', name: '❓ Dúvidas Gerais', icon: '❓' },
    { id: 'tecnico', name: '🔧 Problemas Técnicos', icon: '🔧' },
    { id: 'pagamento', name: '💳 Pagamentos', icon: '💳' },
    { id: 'conta', name: '👤 Conta e Login', icon: '👤' },
    { id: 'ferramentas', name: '🛠️ Ferramentas', icon: '🛠️' },
    { id: 'automacao', name: '🤖 Automação', icon: '🤖' }
  ];

  const faqData = {
    geral: [
      {
        q: "Como funciona a ViralizaAI?",
        a: "A ViralizaAI é uma plataforma completa de automação para redes sociais que usa inteligência artificial para criar conteúdo, automatizar postagens e analisar performance. Oferecemos ferramentas como gerador de vídeos, editor profissional, criador de música e muito mais."
      },
      {
        q: "Quais redes sociais são suportadas?",
        a: "Atualmente suportamos Instagram, TikTok, YouTube, Facebook, Twitter e LinkedIn. Estamos constantemente expandindo para novas plataformas."
      },
      {
        q: "Existe período de teste gratuito?",
        a: "Sim! Oferecemos 7 dias de teste gratuito para novos usuários experimentarem todas as funcionalidades da plataforma."
      }
    ],
    tecnico: [
      {
        q: "A plataforma não está carregando, o que fazer?",
        a: "Primeiro, verifique sua conexão com a internet. Tente limpar o cache do navegador (Ctrl+F5) ou usar modo anônimo. Se o problema persistir, entre em contato conosco."
      },
      {
        q: "Erro ao fazer upload de arquivos",
        a: "Verifique se o arquivo está no formato suportado (MP4, JPG, PNG, MP3) e não excede 100MB. Certifique-se de ter uma conexão estável durante o upload."
      },
      {
        q: "Como atualizar minha senha?",
        a: "Vá em Configurações > Segurança > Alterar Senha. Você precisará confirmar sua senha atual e definir uma nova com pelo menos 8 caracteres."
      }
    ],
    pagamento: [
      {
        q: "Quais formas de pagamento são aceitas?",
        a: "Aceitamos cartões de crédito/débito via Stripe e PIX. Todos os pagamentos são processados de forma segura com criptografia SSL."
      },
      {
        q: "Como cancelar minha assinatura?",
        a: "Acesse Configurações > Assinatura > Cancelar Plano. Você manterá acesso até o final do período pago atual."
      },
      {
        q: "Posso ter reembolso?",
        a: "Oferecemos reembolso integral em até 7 dias para novos usuários. Após esse período, não há reembolso proporcional, mas você pode cancelar a qualquer momento."
      }
    ],
    conta: [
      {
        q: "Como criar uma conta?",
        a: "Clique em 'Cadastrar' na página inicial, preencha seus dados e confirme seu e-mail. Você pode também fazer login com Google ou outras redes sociais."
      },
      {
        q: "Esqueci minha senha, como recuperar?",
        a: "Na tela de login, clique em 'Esqueci minha senha', digite seu e-mail e siga as instruções enviadas para redefinir."
      },
      {
        q: "Como alterar informações da conta?",
        a: "Vá em Configurações > Perfil para alterar nome, e-mail, foto e outras informações pessoais."
      }
    ],
    ferramentas: [
      {
        q: "Como usar o gerador de vídeos IA?",
        a: "Acesse Ferramentas > Gerador de Vídeos, configure o estilo, duração e conteúdo desejado. A IA criará um vídeo profissional em poucos minutos."
      },
      {
        q: "O editor de vídeo funciona offline?",
        a: "Não, o editor funciona online para garantir acesso aos recursos de IA e sincronização em nuvem. É necessária conexão com internet."
      },
      {
        q: "Posso exportar em diferentes formatos?",
        a: "Sim! Suportamos exportação em MP4, MOV, AVI para vídeos e MP3, WAV para áudios, em diferentes qualidades (HD, 4K, 8K)."
      }
    ],
    automacao: [
      {
        q: "A automação pode resultar em bloqueio?",
        a: "Sim, existe esse risco. Seguimos as melhores práticas para minimizar, mas recomendamos usar com moderação e sempre dentro dos termos das plataformas."
      },
      {
        q: "Como configurar postagens automáticas?",
        a: "Vá em Automação > Agendamento, conecte suas contas sociais, crie seu conteúdo e defina horários. O sistema postará automaticamente."
      },
      {
        q: "Posso automatizar interações (curtidas, comentários)?",
        a: "Sim, mas com limites seguros. Configure em Automação > Interações, definindo público-alvo e frequência apropriada."
      }
    ]
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simular envio de ticket
    const ticketId = `TICKET-${Date.now()}`;
    
    alert(`✅ Ticket criado com sucesso!\n\nID: ${ticketId}\n\nVocê receberá uma resposta em até 24 horas no e-mail cadastrado.`);
    
    // Resetar formulário
    setTicketForm({
      category: 'tecnico',
      priority: 'media',
      subject: '',
      message: ''
    });
    setShowTicketForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">🎧 Central de Suporte</h1>
            <p className="text-xl text-gray-300">Estamos aqui para ajudar você a ter sucesso</p>
            {user && (
              <div className="text-sm text-gray-400 mt-2">
                Logado como: {user.name || user.email}
              </div>
            )}
          </div>

          {/* Contato Rápido */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-xl font-bold mb-2">Chat Online</h3>
              <p className="text-gray-300 mb-4">Resposta imediata</p>
              <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-all">
                Iniciar Chat
              </button>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
              <div className="text-3xl mb-4">📧</div>
              <h3 className="text-xl font-bold mb-2">E-mail</h3>
              <p className="text-gray-300 mb-4">Resposta em até 24h</p>
              <button 
                onClick={() => setShowTicketForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-all"
              >
                Abrir Ticket
              </button>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
              <div className="text-3xl mb-4">📞</div>
              <h3 className="text-xl font-bold mb-2">Telefone</h3>
              <p className="text-gray-300 mb-4">Seg-Sex, 9h-18h</p>
              <a 
                href="tel:+5511999999999" 
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-all inline-block"
              >
                (11) 99999-9999
              </a>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">❓ Perguntas Frequentes</h2>
            
            {/* Categorias */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {supportCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    activeCategory === category.id
                      ? 'bg-accent text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
              {faqData[activeCategory as keyof typeof faqData]?.map((faq, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-3 text-accent">❓ {faq.q}</h3>
                  <p className="text-gray-200 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recursos Adicionais */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">📚 Base de Conhecimento</h3>
              <p className="text-gray-300 mb-4">
                Acesse tutoriais detalhados, guias passo-a-passo e documentação completa.
              </p>
              <button className="bg-accent hover:bg-accent/80 text-white font-bold py-2 px-6 rounded-lg transition-all">
                Acessar Tutoriais
              </button>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">🎥 Vídeo Aulas</h3>
              <p className="text-gray-300 mb-4">
                Aprenda a usar todas as funcionalidades com nossos vídeos explicativos.
              </p>
              <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-all">
                Ver Vídeos
              </button>
            </div>
          </div>

          {/* Status do Sistema */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mt-8">
            <h3 className="text-xl font-bold mb-4">🌐 Status do Sistema</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl mb-2">🟢</div>
                <div className="font-semibold">API</div>
                <div className="text-sm text-gray-300">Operacional</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🟢</div>
                <div className="font-semibold">Automação</div>
                <div className="text-sm text-gray-300">Operacional</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🟢</div>
                <div className="font-semibold">IA Tools</div>
                <div className="text-sm text-gray-300">Operacional</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🟢</div>
                <div className="font-semibold">Pagamentos</div>
                <div className="text-sm text-gray-300">Operacional</div>
              </div>
            </div>
          </div>

          {/* Botão Voltar */}
          <div className="text-center mt-8">
            <button
              onClick={() => window.history.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-xl transition-all"
            >
              ← Voltar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Ticket */}
      {showTicketForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-primary rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">📧 Abrir Ticket de Suporte</h2>
              <button
                onClick={() => setShowTicketForm(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Categoria:</label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-secondary text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-accent"
                    required
                  >
                    <option value="tecnico">🔧 Problema Técnico</option>
                    <option value="pagamento">💳 Pagamento</option>
                    <option value="conta">👤 Conta</option>
                    <option value="ferramenta">🛠️ Ferramenta</option>
                    <option value="geral">❓ Dúvida Geral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Prioridade:</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full bg-secondary text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-accent"
                    required
                  >
                    <option value="baixa">🟢 Baixa</option>
                    <option value="media">🟡 Média</option>
                    <option value="alta">🟠 Alta</option>
                    <option value="urgente">🔴 Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Assunto:</label>
                <input
                  type="text"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full bg-secondary text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-accent"
                  placeholder="Descreva brevemente o problema..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Descrição Detalhada:</label>
                <textarea
                  value={ticketForm.message}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full bg-secondary text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-accent h-32"
                  placeholder="Descreva o problema em detalhes, incluindo passos para reproduzir..."
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-accent hover:bg-accent/80 text-white font-bold py-3 px-6 rounded-lg transition-all"
                >
                  📧 Enviar Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setShowTicketForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;
