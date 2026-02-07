import React, { useState, useRef, useEffect } from 'react';

interface HelpQuestion {
  id: string;
  question: string;
  answer: string;
  category: 'ferramentas' | 'planos' | 'pagamentos' | 'afiliados' | 'geral';
}

const helpQuestions: HelpQuestion[] = [
  {
    id: '1',
    question: 'Como funciona o Gerador de Ebooks Premium?',
    answer: 'O Gerador de Ebooks Premium cria ebooks profissionais com 15 capítulos, cada um com 1.5+ páginas de conteúdo ultra-técnico. Inclui fotos obrigatórias de alta qualidade, metodologias proprietárias exclusivas e conteúdo personalizado para seu nicho. O ebook é gerado em HTML profissional e pode ser baixado imediatamente.',
    category: 'ferramentas'
  },
  {
    id: '2',
    question: 'O que é o AI Funnel Builder e como usar?',
    answer: 'O AI Funnel Builder é uma ferramenta revolucionária que usa IA proprietária com análise de 500+ variáveis para criar funis de vendas com 97% de precisão. Aumenta conversões em 400-800% e gera ROI médio de 1200% em 60 dias. É a primeira ferramenta do tipo no mundo digital.',
    category: 'ferramentas'
  },
  {
    id: '3',
    question: 'Qual a diferença entre os planos?',
    answer: 'Plano Mensal (R$ 99): Ferramentas básicas. Trimestral (R$ 269): + Analytics avançados. Semestral (R$ 519): + Relatórios estratégicos. Anual (R$ 995): + Gerente dedicado + 2 meses grátis + API. Cada plano inclui diferentes níveis de acesso às ferramentas premium.',
    category: 'planos'
  },
  {
    id: '4',
    question: 'Como funciona o programa de afiliados?',
    answer: 'Ganhe 50% de comissão em todas as vendas! Plano Mensal = R$ 49,50, Trimestral = R$ 134,50, Anual = R$ 497,50. Pagamento em 3 dias úteis via PIX. Acesso a dashboard exclusivo, materiais de marketing e suporte VIP. Primeiros 100 afiliados ganham 60% nos primeiros 30 dias!',
    category: 'afiliados'
  },
  {
    id: '5',
    question: 'Como comprar ferramentas avulsas?',
    answer: 'Acesse a ferramenta desejada no dashboard. Se não tiver acesso, aparecerá a tela de compra com preços: Gerador de Ebooks Premium (R$ 297) e AI Funnel Builder (R$ 497). Pagamento via Stripe com acesso imediato após confirmação.',
    category: 'pagamentos'
  },
  {
    id: '6',
    question: 'Posso cancelar minha assinatura?',
    answer: 'Sim, você pode cancelar a qualquer momento no painel de Faturamento. Não há multas ou taxas de cancelamento. O acesso permanece ativo até o final do período pago.',
    category: 'planos'
  },
  {
    id: '7',
    question: 'Como funciona o Motor de Crescimento?',
    answer: 'O Motor de Crescimento analisa seu perfil e gera campanhas completas de marketing com persona, estratégia, posts prontos e cronograma de execução. Usa IA avançada para maximizar seu alcance orgânico e conversões.',
    category: 'ferramentas'
  },
  {
    id: '8',
    question: 'Qual o prazo para receber comissões de afiliado?',
    answer: 'As comissões são pagas em até 3 dias úteis após a confirmação da venda. Oferecemos PIX, transferência bancária ou boleto, sem taxas de processamento. Você pode acompanhar todos os ganhos no dashboard em tempo real.',
    category: 'afiliados'
  }
];

const DraggableHelpButton: React.FC = () => {
  // 🔒 PROTEÇÃO TOTAL SSR - Só executa no cliente
  if (typeof window === "undefined") {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ 
    x: window.innerWidth - 100, 
    y: window.innerHeight - 100 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 80),
        y: Math.min(prev.y, window.innerHeight - 80)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = Math.max(0, Math.min(e.clientX - dragStart.x, window.innerWidth - 80));
    const newY = Math.max(0, Math.min(e.clientY - dragStart.y, window.innerHeight - 80));
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const filteredQuestions = helpQuestions.filter(q => {
    const matchesCategory = selectedCategory === 'todas' || q.category === selectedCategory;
    const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'todas', name: 'Todas', icon: '🔍' },
    { id: 'ferramentas', name: 'Ferramentas', icon: '🛠️' },
    { id: 'planos', name: 'Planos', icon: '💎' },
    { id: 'pagamentos', name: 'Pagamentos', icon: '💳' },
    { id: 'afiliados', name: 'Afiliados', icon: '💰' },
    { id: 'geral', name: 'Geral', icon: '❓' }
  ];


  return (
    <>
      {/* Botão Flutuante */}
      <div
        ref={buttonRef}
        className={`fixed z-50 transition-all duration-300 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isOpen ? 'cursor-default' : ''}`}
        style={{ 
          left: position.x, 
          top: position.y,
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
      >
        <div 
          className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white text-2xl font-bold transition-all duration-300 hover:scale-110 ${isOpen ? 'scale-110' : ''} relative`}
          onClick={() => !isDragging && setIsOpen(!isOpen)}
        >
          {isOpen ? '✕' : '💡'}
          {!isOpen && (
            <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
          )}
          {!isOpen && (
            <div className="absolute top-0 right-0 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
          )}
        </div>
      </div>

      {/* Modal de Ajuda */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-secondary rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">🤖 Assistente Inteligente</h2>
                  <p className="text-blue-100 mt-2">Central de ajuda ultra-avançada do Viraliza.AI</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Busca e Filtros */}
            <div className="p-6 border-b border-gray-700">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="🔍 Digite sua dúvida..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-primary p-4 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-primary text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Perguntas e Respostas */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🤔</div>
                  <p className="text-gray-400 text-lg">Nenhuma pergunta encontrada</p>
                  <p className="text-gray-500 text-sm mt-2">Tente ajustar sua busca ou categoria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredQuestions.map(q => (
                    <div key={q.id} className="bg-primary/50 rounded-2xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          Q
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-3">{q.question}</h3>
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              A
                            </div>
                            <p className="text-gray-300 leading-relaxed">{q.answer}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-primary/30 p-6 border-t border-gray-700">
              <div className="text-center">
                <p className="text-gray-400 mb-2">Ainda tem dúvidas?</p>
                <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-full font-semibold hover:from-emerald-600 hover:to-green-600 transition-all">
                  💬 Falar com Suporte Humano
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DraggableHelpButton;
