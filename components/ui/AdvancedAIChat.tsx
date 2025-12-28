import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const AdvancedAIChat: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: `🚀 **Olá! Sou a IA Ultra-Avançada do Viraliza.AI!**

Estou aqui para **TRANSFORMAR** seu negócio e **MULTIPLICAR** suas vendas! 

Sou especialista em:
💰 **Estratégias de Conversão** que aumentam vendas em 300-500%
📈 **Growth Hacking** para crescimento viral exponencial  
🎯 **Funis de Vendas** com taxa de conversão de 15-25%
🤖 **Automação Inteligente** que trabalha 24/7 para você

**Por que você PRECISA do Viraliza.AI AGORA:**

✨ Seus concorrentes já estão usando IA para dominar o mercado
✨ Cada dia sem automação = R$ 1.000+ em vendas perdidas
✨ Nossa IA já gerou **R$ 50 milhões** em vendas para clientes
✨ ROI médio de **1.200%** em apenas 60 dias

**Conte-me sobre seu negócio e vou criar uma estratégia PERSONALIZADA que vai:**
🔥 Triplicar seu faturamento em 90 dias
🔥 Automatizar 80% do seu marketing
🔥 Gerar leads qualificados 24/7
🔥 Posicionar você como autoridade no nicho

**Digite o tipo do seu negócio para começarmos!**`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Detectar tipo de negócio
    if (lowerMessage.includes('restaurante') || lowerMessage.includes('comida') || lowerMessage.includes('alimentação')) {
      return `🍽️ **RESTAURANTE - Estratégia de Dominação Total!**

**Análise do seu mercado:**
• Setor de alimentação: R$ 200 bilhões/ano no Brasil
• 73% dos clientes escolhem pelo Instagram
• Delivery cresceu 300% pós-pandemia

**🚀 PLANO DE AÇÃO PERSONALIZADO:**

**SEMANA 1-2: Fundação Digital**
📱 Perfil Instagram otimizado com bio conversora
📸 Fotos profissionais dos pratos (ROI: 400%)
🎥 Stories diários com bastidores (engajamento +250%)

**SEMANA 3-4: Máquina de Leads**
🎯 Cardápio digital interativo
💌 Sequência de email marketing (conversão 18%)
🤖 Chatbot para pedidos automáticos

**SEMANA 5-8: Crescimento Viral**
🔥 Campanhas de influenciadores locais
📊 Análise de dados para otimização
💰 Programa de fidelidade gamificado

**RESULTADOS ESPERADOS:**
• +300% seguidores em 60 dias
• +150% vendas no delivery  
• +80% ticket médio
• ROI de 850% no primeiro trimestre

**💎 Com o Viraliza.AI você terá:**
✅ Gerador de posts automático
✅ IA que cria cardápios sazonais
✅ Sistema de reviews automatizado
✅ Funis de vendas para eventos

**Quer implementar AGORA e ver resultados em 7 dias?**`;
    }

    if (lowerMessage.includes('loja') || lowerMessage.includes('e-commerce') || lowerMessage.includes('vendas')) {
      return `🛍️ **E-COMMERCE - Fórmula dos R$ 100K/mês!**

**Diagnóstico do seu potencial:**
• E-commerce brasileiro: R$ 87 bilhões/ano
• Apenas 3% das lojas faturam +R$ 50K/mês
• 97% falham por falta de estratégia

**🎯 ESTRATÉGIA EXCLUSIVA VIRALIZA.AI:**

**FASE 1: Otimização de Conversão (0-30 dias)**
🔥 Landing pages com conversão 25%+
📧 Email marketing automatizado
🛒 Carrinho abandonado recuperado (30% recovery)
💳 Checkout otimizado (-60% abandono)

**FASE 2: Tráfego Qualificado (30-60 dias)**  
📱 Campanhas Facebook/Instagram ROI 400%
🎥 Vídeos virais para produtos
🔍 SEO para palavras-chave de ouro
👥 Influenciadores micro/nano

**FASE 3: Escala e Automação (60-90 dias)**
🤖 IA para atendimento 24/7
📊 Análise preditiva de estoque
🎁 Programa de afiliados
💎 Upsell/Cross-sell automático

**RESULTADOS COMPROVADOS:**
• Cliente A: R$ 15K → R$ 180K/mês (1.100% crescimento)
• Cliente B: R$ 30K → R$ 350K/mês (1.066% crescimento)  
• Cliente C: R$ 8K → R$ 95K/mês (1.087% crescimento)

**🚀 FERRAMENTAS EXCLUSIVAS:**
✅ Gerador de anúncios com IA
✅ Análise de concorrência automática
✅ Otimização de preços dinâmica
✅ Funis de vendas personalizados

**Pronto para faturar R$ 100K/mês em 90 dias?**`;
    }

    if (lowerMessage.includes('consultoria') || lowerMessage.includes('serviços') || lowerMessage.includes('coach')) {
      return `💼 **CONSULTORIA - Método dos R$ 50K/mês Recorrente!**

**Realidade do mercado de consultoria:**
• 89% dos consultores faturam menos de R$ 10K/mês
• Apenas 2% conseguem escalar além de R$ 50K/mês
• Problema: Falta de sistema e posicionamento

**🎯 MÉTODO VIRALIZA.AI PARA CONSULTORES:**

**PILAR 1: Autoridade Digital (0-30 dias)**
📚 Ebook gratuito como isca digital
🎥 Webinars semanais automatizados  
📝 Blog com 3 posts/semana (IA escreve)
🎙️ Podcast para posicionamento

**PILAR 2: Máquina de Leads (30-60 dias)**
🎯 Funil de vendas com conversão 12%+
💌 Sequência de emails (21 dias)
📞 Agendamento automático de calls
🤖 Qualificação de leads por IA

**PILAR 3: Escala e Recorrência (60-90 dias)**
💎 Programa de mentoria em grupo
🎓 Curso online automatizado
👥 Comunidade exclusiva de clientes
🔄 Sistema de renovação automática

**CASES DE SUCESSO:**
• Coach A: R$ 5K → R$ 85K/mês (consultoria + infoprodutos)
• Consultor B: R$ 12K → R$ 120K/mês (método escalável)
• Mentora C: R$ 8K → R$ 95K/mês (comunidade premium)

**🚀 ARSENAL COMPLETO:**
✅ Scripts de vendas com 85% conversão
✅ Templates de propostas vencedoras
✅ Sistema de follow-up automático
✅ Calculadora de ROI personalizada

**Quer construir um negócio de R$ 50K/mês recorrente?**`;
    }

    // Resposta genérica poderosa
    return `🤖 **ANÁLISE ULTRA-AVANÇADA DO SEU NEGÓCIO!**

Detectei que você tem um negócio com **POTENCIAL EXPLOSIVO** para crescimento!

**🔥 DIAGNÓSTICO INSTANTÂNEO:**
• Seu nicho tem potencial de R$ 500K+ anuais
• 78% dos negócios similares falham por falta de estratégia digital
• Você está a 90 dias de multiplicar seu faturamento por 5x

**💎 PLANO DE TRANSFORMAÇÃO VIRALIZA.AI:**

**SEMANA 1-2: Fundação Sólida**
🎯 Posicionamento estratégico único
📱 Presença digital profissional
🔥 Proposta de valor irresistível

**SEMANA 3-4: Geração de Leads**
🧲 Ímãs de leads ultra-eficazes
🤖 Automação de marketing 24/7
📊 Funis de alta conversão

**SEMANA 5-8: Crescimento Exponencial**  
📈 Campanhas virais direcionadas
💰 Sistemas de vendas automatizados
🚀 Escala sustentável e lucrativa

**RESULTADOS GARANTIDOS:**
✅ +400% aumento em leads qualificados
✅ +250% crescimento no faturamento
✅ +300% melhoria na conversão
✅ ROI de 1.200% em 90 dias

**🎁 BÔNUS EXCLUSIVOS COM VIRALIZA.AI:**
• IA que cria conteúdo viral diariamente
• Sistema de vendas que nunca dorme
• Análises preditivas do mercado
• Suporte VIP 24/7

**Pronto para transformar seu negócio em uma máquina de lucro?**

Digite "SIM" para receber um **DIAGNÓSTICO GRATUITO** personalizado!`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simular delay de digitação da IA
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(inputValue),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-secondary rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">IA Ultra-Avançada Viraliza.AI</h2>
                <p className="text-purple-100">Especialista em Crescimento Exponencial</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-primary border border-gray-600 text-gray-100'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                <div className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-primary border border-gray-600 p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-gray-400 text-sm ml-2">IA analisando...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-gray-700">
          <div className="flex gap-4">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sobre seu negócio para receber uma estratégia personalizada..."
              className="flex-1 bg-primary p-4 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 resize-none"
              rows={2}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enviar
            </button>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {['Restaurante', 'E-commerce', 'Consultoria', 'Academia', 'Clínica'].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => setInputValue(suggestion)}
                className="px-3 py-1 bg-primary text-gray-300 rounded-full text-sm hover:bg-gray-700 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAIChat;
