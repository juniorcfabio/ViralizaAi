
import React, { useState, useRef, useEffect } from 'react';
import { getChatbotResponse } from '../../services/geminiService';
import { ChatMessage } from '../../types';

// Icons
const MessageSquareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);
const SendIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);
const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const CHAT_STORAGE_KEY = 'viraliza_ai_chatbot_history';

const TypingIndicator: React.FC = () => (
    <div className="flex justify-start">
        <div className="bg-primary text-gray-light p-3 rounded-lg flex items-center space-x-1.5">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0s', animationDuration: '1s' }}></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s', animationDuration: '1s' }}></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s', animationDuration: '1s' }}></div>
        </div>
    </div>
);


const SupportChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const stored = localStorage.getItem(CHAT_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Ensure we don't load an empty array, always have the welcome message if empty
                return parsed.length > 0 ? parsed : [{ id: 1, text: "Olá! Sou o assistente virtual do Viraliza.ai. Como posso ajudar?", sender: 'bot' }];
            }
        } catch (e) {
            console.error("Erro ao carregar o histórico do chat:", e);
        }
        return [{ id: 1, text: "Olá! Sou o assistente virtual do Viraliza.ai. Como posso ajudar?", sender: 'bot' }];
    });
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to bottom when new messages are added or chat opens
        if (isOpen && chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isOpen]);
    
    useEffect(() => {
        try {
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
        } catch (e) {
            console.error("Erro ao salvar o histórico do chat:", e);
        }
    }, [messages]);


    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const newUserMessage: ChatMessage = {
            id: Date.now(),
            text,
            sender: 'user',
        };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);

        const chatHistory = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
        const botResponseText = await getChatbotResponse(text, chatHistory);

        const newBotMessage: ChatMessage = {
            id: Date.now() + 1,
            text: botResponseText,
            sender: 'bot',
        };
        setMessages(prev => [...prev, newBotMessage]);
        setIsLoading(false);
    };
    
    const quickQuestions = [
        "Como funciona o gerador de conteúdo?",
        "O que significa 'engajamento'?",
        "Como mudo meu plano?",
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Modal */}
            {isOpen && (
                <div className="bg-secondary rounded-lg shadow-2xl w-80 h-96 flex flex-col mb-4 transition-all duration-300 ease-in-out">
                    {/* Header */}
                    <div className="flex justify-between items-center p-3 bg-primary rounded-t-lg">
                        <h3 className="font-bold text-light">Suporte Rápido</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-dark hover:text-light">
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-2 rounded-lg text-sm ${
                                    msg.sender === 'user'
                                        ? 'bg-accent text-white'
                                        : 'bg-primary text-gray-light'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && <TypingIndicator />}
                        {!isLoading && messages.length > 0 && messages[messages.length - 1].sender === 'bot' && (
                             <div className="space-y-2 pt-2">
                                <p className="text-xs text-gray-dark">Ou clique em uma das perguntas:</p>
                                {quickQuestions.map(q => (
                                    <button 
                                        key={q}
                                        onClick={() => handleSendMessage(q)}
                                        className="w-full text-left text-sm bg-primary p-2 rounded-lg hover:bg-accent hover:text-white transition-colors"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                         )}
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-primary">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage(userInput);
                            }}
                            className="flex items-center space-x-2"
                        >
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Digite sua dúvida..."
                                className="flex-1 bg-primary p-2 rounded-full border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                                disabled={isLoading}
                            />
                            <button type="submit" className="bg-accent p-2 rounded-full text-light" disabled={isLoading || !userInput.trim()}>
                                <SendIcon className="w-5 h-5"/>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-accent text-light w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-500 transition-transform transform hover:scale-110"
                aria-label="Abrir chat de suporte"
            >
                <MessageSquareIcon className="w-7 h-7" />
            </button>
        </div>
    );
};

export default SupportChatbot;
