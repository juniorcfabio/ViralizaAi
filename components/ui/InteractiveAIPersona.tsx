import React, { useState, useEffect, useRef, useCallback } from 'react';

// Roteiros reais para as funcionalidades
const features = [
    { key: 'campaigns', title: 'Campanhas de Crescimento', script: 'Com nosso motor de inteligência artificial, você recebe campanhas de marketing completas e personalizadas. Analisamos seu negócio profundamente e criamos estratégias com persona ideal, textos persuasivos e mídias prontas para publicação. Tudo otimizado para maximizar seu engajamento e converter seguidores em clientes reais.' },
    { key: 'media', title: 'Criação de Mídia com IA', script: 'Diga adeus aos bancos de imagem genéricos. Nossa inteligência artificial gera imagens, vídeos e carrosséis exclusivos para seus posts. Cada peça é criada sob medida para sua marca, com qualidade profissional e design que chama atenção no feed. Você economiza horas de trabalho e ainda tem resultados melhores.' },
    { key: 'funnels', title: 'Funis de Venda Automáticos', script: 'Converta seguidores em clientes com funis de venda completos. Criamos desde a isca digital, como e-books e mini-cursos, passando pela página de captura otimizada, até a sequência completa de e-mails para nutrir leads e fechar vendas. Tudo automatizado e funcionando vinte e quatro horas por dia.' },
    { key: 'analytics', title: 'Análise Inteligente', script: 'Nossa inteligência artificial monitora suas métricas em tempo real e identifica os melhores horários para postar, os formatos que mais engajam e as tendências do seu nicho. Receba relatórios detalhados com sugestões práticas para crescer mais rápido nas redes sociais.' },
    { key: 'viral', title: 'Previsão de Viralização', script: 'Antes mesmo de publicar, nossa tecnologia analisa seu conteúdo e prevê o potencial de viralização. Avaliamos título, apelo emocional, hashtags e formato para garantir que cada post tenha a maior chance possível de alcançar milhares de pessoas.' },
];

// Função para falar texto com voz humanizada usando Web Speech API
function speakText(text: string, onEnd?: () => void): SpeechSynthesisUtterance | null {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;

    window.speechSynthesis.cancel(); // Cancelar fala anterior

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95; // Velocidade ligeiramente mais lenta para parecer natural
    utterance.pitch = 1.05; // Tom levemente mais agudo (feminino)
    utterance.volume = 1;

    // Buscar melhor voz em português
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang === 'pt-BR' && v.name.toLowerCase().includes('female')) ||
                    voices.find(v => v.lang === 'pt-BR' && v.name.toLowerCase().includes('luciana')) ||
                    voices.find(v => v.lang === 'pt-BR' && v.name.toLowerCase().includes('google')) ||
                    voices.find(v => v.lang === 'pt-BR') ||
                    voices.find(v => v.lang.startsWith('pt'));
    if (ptVoice) utterance.voice = ptVoice;

    if (onEnd) utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
    return utterance;
}

const ViralizaLogo3D: React.FC<{ className?: string }> = ({ className }) => (
    <div 
        className={`${className} relative`} 
        style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
    >
        <div 
            className="absolute inset-0 w-full h-full animate-spin-3d" 
            style={{ transformStyle: 'preserve-3d' }}
        >
            {/* Back Layer */}
            <svg viewBox="0 0 24 24" fill="none" className="absolute inset-0 w-full h-full" style={{ transform: 'translateZ(-4px)' }}>
                <g transform="rotate(180 12 12)">
                    <path d="M12 2L2 22h7l3-6 3 6h7L12 2z" fill="#1e3a8a" />
                </g>
            </svg>
             {/* Middle Layer */}
            <svg viewBox="0 0 24 24" fill="none" className="absolute inset-0 w-full h-full" style={{ transform: 'translateZ(0px)' }}>
                <defs>
                    <linearGradient id="logo-gradient-interactive" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                </defs>
                <g transform="rotate(180 12 12)">
                    <path d="M12 2L2 22h7l3-6 3 6h7L12 2z" fill="url(#logo-gradient-interactive)" />
                    <path d="M12 11l-3.5 7.5h7L12 11z" fill="url(#logo-gradient-interactive)" opacity="0.7"/>
                </g>
            </svg>
             {/* Front Layer */}
            <svg viewBox="0 0 24 24" fill="none" className="absolute inset-0 w-full h-full" style={{ transform: 'translateZ(4px)', opacity: 0.4 }}>
                <g transform="rotate(180 12 12)">
                    <path d="M12 2L2 22h7l3-6 3 6h7L12 2z" fill="#93c5fd" />
                </g>
            </svg>
        </div>
    </div>
);

const welcomeText = 'Olá! Eu sou a estrategista de inteligência artificial do Viraliza.ai. Estou aqui para te ajudar a crescer nas redes sociais. Clique em uma das opções abaixo e eu vou explicar tudo com a minha voz!';

const InteractiveAIPersona: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentText, setCurrentText] = useState(welcomeText);
    const [displayedText, setDisplayedText] = useState('');
    const [activeFeature, setActiveFeature] = useState<string | null>(null);
    const [voicesLoaded, setVoicesLoaded] = useState(false);
    const typewriterRef = useRef<NodeJS.Timeout | null>(null);

    // Carregar vozes do browser
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis?.getVoices();
            if (voices && voices.length > 0) setVoicesLoaded(true);
        };
        loadVoices();
        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
        return () => {
            window.speechSynthesis?.cancel();
            if (typewriterRef.current) clearTimeout(typewriterRef.current);
        };
    }, []);

    // Falar boas-vindas ao abrir
    useEffect(() => {
        if (voicesLoaded) {
            const timer = setTimeout(() => {
                startSpeaking(welcomeText);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [voicesLoaded]);

    const startSpeaking = useCallback((text: string) => {
        setIsSpeaking(true);
        setCurrentText(text);
        setDisplayedText('');

        // Efeito typewriter sincronizado
        let idx = 0;
        const charDelay = Math.max(30, Math.min(60, (text.length > 200 ? 30 : 50)));
        const typeNext = () => {
            if (idx <= text.length) {
                setDisplayedText(text.substring(0, idx));
                idx++;
                typewriterRef.current = setTimeout(typeNext, charDelay);
            }
        };
        if (typewriterRef.current) clearTimeout(typewriterRef.current);
        typeNext();

        // Falar com voz
        speakText(text, () => {
            setIsSpeaking(false);
            setDisplayedText(text);
            if (typewriterRef.current) clearTimeout(typewriterRef.current);
        });
    }, []);

    const handleFeatureClick = (feature: typeof features[0]) => {
        if (isSpeaking) {
            window.speechSynthesis?.cancel();
            if (typewriterRef.current) clearTimeout(typewriterRef.current);
            setIsSpeaking(false);
        }
        setActiveFeature(feature.key);
        startSpeaking(feature.script);
    };

    const handleClose = () => {
        window.speechSynthesis?.cancel();
        if (typewriterRef.current) clearTimeout(typewriterRef.current);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={handleClose}>
            <div className="bg-secondary rounded-lg shadow-xl w-full max-w-3xl h-auto max-h-[90vh] flex flex-col animate-fade-in-up overflow-y-auto" onClick={e => e.stopPropagation()}>
                <button onClick={handleClose} className="absolute top-4 right-4 text-3xl text-gray-dark hover:text-light z-10">&times;</button>
                
                <div className="p-6 md:p-8 flex flex-col items-center">
                    {/* Avatar com Logo 3D e anéis */}
                    <div className="relative mb-6" style={{ width: '140px', height: '140px' }}>
                        <div className={`relative w-full h-full rounded-full overflow-hidden border-4 ${isSpeaking ? 'border-accent' : 'border-primary'} shadow-lg transition-colors`}>
                            <video 
                                src="https://videos.pexels.com/video-files/8766782/8766782-sd_640_360_25fps.mp4" 
                                autoPlay loop muted playsInline
                                className="w-full h-full object-cover"
                            />
                            {isSpeaking && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                    <ViralizaLogo3D className="w-16 h-16" />
                                </div>
                            )}
                        </div>
                        {/* Anéis magnéticos */}
                        <div className="absolute inset-[-8px] border-[3px] border-cyan-400/60 rounded-full animate-magnetic-ring-1 pointer-events-none"></div>
                        <div className="absolute inset-[-8px] border-[3px] border-purple-500/60 rounded-full animate-magnetic-ring-2 pointer-events-none"></div>
                        {/* Indicador de fala */}
                        {isSpeaking && (
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                            </div>
                        )}
                    </div>
                    
                    {/* Transcrição com efeito typewriter */}
                    <div className="bg-primary p-5 rounded-lg w-full min-h-[100px] text-center flex items-center justify-center mb-6">
                        <p className="text-light leading-relaxed">
                            {displayedText || currentText}
                            {isSpeaking && <span className="animate-pulse ml-1">|</span>}
                        </p>
                    </div>

                    {/* Botões de Funcionalidades */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {features.map(feature => (
                            <button 
                                key={feature.key}
                                onClick={() => handleFeatureClick(feature)}
                                className={`font-semibold py-3 px-4 rounded-full transition-all text-sm ${
                                    activeFeature === feature.key 
                                        ? 'bg-accent text-light ring-2 ring-accent/50 scale-105' 
                                        : 'bg-primary text-light hover:bg-accent/80 border border-gray-700'
                                } ${isSpeaking && activeFeature !== feature.key ? 'opacity-60' : ''}`}
                            >
                                {feature.title}
                            </button>
                        ))}
                    </div>

                    {!voicesLoaded && (
                        <p className="text-xs text-gray-500 mt-4">Carregando voz...</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InteractiveAIPersona;
