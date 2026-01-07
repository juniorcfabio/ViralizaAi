import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ConverseComigoAI: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Sou a IA do ViralizaAI. Posso te ajudar com informações sobre nossos planos, ferramentas avulsas e como nossa plataforma pode otimizar seu marketing digital em quase 100%. Como posso te ajudar hoje?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Respostas sobre planos
    if (message.includes('plano') || message.includes('assinatura') || message.includes('preço')) {
      return `Temos planos incríveis para transformar seu negócio! 🚀

**Plano Mensal - R$ 97/mês:**
- Todas as ferramentas de IA
- Automação de marketing inteligente
- Gerador de conteúdo ilimitado
- Suporte prioritário

**Plano Trimestral - R$ 247 (economize 15%):**
- Tudo do plano mensal
- Análises avançadas
- Templates premium
- Consultoria mensal

**Plano Anual - R$ 797 (economize 30%):**
- Tudo dos planos anteriores
- IA personalizada para seu nicho
- Automação completa
- ROI garantido de 300%+

Qual plano se encaixa melhor no seu negócio?`;
    }

    // Respostas sobre ferramentas
    if (message.includes('ferramenta') || message.includes('funcionalidade') || message.includes('recurso')) {
      return `Nossa plataforma oferece ferramentas ultra-avançadas! 🛠️

**Principais Ferramentas:**
- 🎬 **Gerador de Vídeo IA 8K**: Crie vídeos profissionais em minutos
- 📚 **Ebook Generator**: Ebooks de 1.5 páginas por capítulo, altamente técnicos
- 🔧 **AI Funnel Builder**: Funis de vendas que convertem 40%+ mais
- 🔧 **Ferramentas Avançadas**: Automação completa de marketing
- 📈 **Crescimento Inteligente**: Estratégias otimizadas por IA
- 📊 **Analytics Avançado**: Métricas reais, sem simulação

**Ferramentas Avulsas:**
- Gerador de Vídeo IA: R$ 47
- Ebook Generator Pro: R$ 37
- AI Funnel Builder: R$ 67
- Analytics Premium: R$ 27

Qual ferramenta te interessa mais?`;
    }

    // Respostas sobre resultados
    if (message.includes('resultado') || message.includes('funciona') || message.includes('garantia')) {
      return `Nossos resultados são REAIS e comprovados! 📈

**Resultados Típicos dos Clientes:**
- 🎯 **Aumento de seguidores**: 180% a 275% em 30 dias
- 💰 **ROI médio**: 340% a 420% no primeiro trimestre
- ⚡ **Otimização de tempo**: 95% menos tempo em marketing
- 🚀 **Conversões**: Aumento de 40% nas vendas

**Por que funciona:**
- IA adaptativa que nunca deixa o faturamento cair
- Dados 100% reais, sem simulação
- Sistema jamais visto no mundo
- Promoção automática 24/7 em múltiplos idiomas

**Garantia Total:**
- 7 dias para testar gratuitamente
- Suporte técnico ilimitado
- Resultados em até 30 dias ou seu dinheiro de volta

Quer começar seu teste gratuito agora?`;
    }

    // Respostas sobre nicho/segmento
    if (message.includes('nicho') || message.includes('segmento') || message.includes('área')) {
      return `Nossa IA funciona para QUALQUER nicho! 🎯

**Nichos com Maior Sucesso:**
- 🏪 **E-commerce**: Aumento médio de 250% nas vendas
- 💼 **Consultoria**: 300% mais leads qualificados  
- 🏥 **Saúde/Wellness**: 180% mais agendamentos
- 🎓 **Educação**: 220% mais matrículas
- 🏠 **Imóveis**: 190% mais visitas
- 🍕 **Restaurantes**: 160% mais pedidos

**Como Personalizamos:**
- IA analisa seu segmento específico
- Conteúdo adaptado ao seu público
- Horários otimizados por região
- Linguagem personalizada por nicho
- Estratégias exclusivas do seu mercado

**Metodologias Proprietárias:**
- ConversionMax Pro
- SmartFlow AI
- Emotional Trigger Mapping
- Value Stacking 3.0

Qual é o seu nicho? Posso dar dicas específicas!`;
    }

    // Respostas sobre como começar
    if (message.includes('começar') || message.includes('iniciar') || message.includes('teste')) {
      return `Vamos começar sua transformação digital AGORA! 🚀

**Passo a Passo Simples:**

1️⃣ **Teste Grátis (24h)**
   - Acesso completo à plataforma
   - Todas as ferramentas liberadas
   - Suporte técnico incluído

2️⃣ **Configuração Automática**
   - IA analisa seu negócio
   - Estratégia personalizada criada
   - Campanhas configuradas automaticamente

3️⃣ **Resultados Imediatos**
   - Primeiros leads em 24h
   - Aumento de engajamento em 48h
   - ROI positivo em 7 dias

**Para Começar:**
- Clique em "Começar Teste Grátis (24h)"
- Cadastre-se em 30 segundos
- Receba acesso instantâneo

**Bônus Exclusivo:**
- Consultoria gratuita de 30 min
- Templates premium liberados
- Suporte VIP no primeiro mês

Pronto para revolucionar seu marketing?`;
    }

    // Resposta padrão
    return `Entendo sua dúvida! Nossa plataforma ViralizaAI é a solução mais avançada do mercado para marketing digital. 

**Principais Benefícios:**
- ✅ Aumento de 180% a 275% em seguidores orgânicos
- ✅ ROI de 340% a 420% comprovado
- ✅ Otimização de 95% do tempo em marketing
- ✅ Automação completa 24/7
- ✅ IA ultra-avançada jamais vista

**Posso te ajudar com:**
- 📋 Informações sobre planos e preços
- 🛠️ Detalhes das ferramentas disponíveis
- 📈 Resultados e casos de sucesso
- 🎯 Estratégias para seu nicho específico
- 🚀 Como começar seu teste gratuito

O que você gostaria de saber especificamente?`;
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simular delay da IA e ativar áudio
    setTimeout(() => {
      const responseText = getAIResponse(inputText);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
      
      // Ativar síntese de voz para a resposta da IA
      setTimeout(() => {
        if ('speechSynthesis' in window) {
          // Limpar texto de markdown para áudio
          const cleanText = responseText
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/#{1,6}\s/g, '')
            .replace(/- /g, '')
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = 'pt-BR';
          utterance.rate = 0.9;
          utterance.pitch = 1.1;
          utterance.volume = 0.8;
          
          // Aguardar vozes carregarem
          const speakWithVoice = () => {
            const voices = speechSynthesis.getVoices();
            const portugueseVoice = voices.find(voice => 
              voice.lang.includes('pt-BR') || voice.lang.includes('pt')
            );
            
            if (portugueseVoice) {
              utterance.voice = portugueseVoice;
            }
            
            speechSynthesis.speak(utterance);
          };
          
          if (speechSynthesis.getVoices().length === 0) {
            speechSynthesis.addEventListener('voiceschanged', speakWithVoice, { once: true });
          } else {
            speakWithVoice();
          }
        }
      }, 500);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-secondary rounded-lg shadow-2xl w-80 h-96 flex flex-col border border-accent">
        {/* Header */}
        <div className="bg-accent text-light p-4 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-light rounded-full flex items-center justify-center">
              <span className="text-accent font-bold text-sm">AI</span>
            </div>
            <div>
              <h3 className="font-bold text-sm">Converse Comigo!</h3>
              <p className="text-xs opacity-90">IA ViralizaAI • Online</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  message.isUser
                    ? 'bg-accent text-light'
                    : 'bg-primary text-light border border-gray-600'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.text}</div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-primary text-light border border-gray-600 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-600">
          <div className="flex gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta..."
              className="flex-1 bg-primary text-light border border-gray-600 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="bg-accent text-light px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConverseComigoAI;
