import React, { useState } from 'react';

// Roteiros para as funcionalidades que a IA irá explicar
const features = [
    { key: 'campaigns', title: 'Campanhas de Crescimento', script: 'Com nosso motor de IA, você recebe campanhas de marketing completas. Analisamos seu negócio e criamos uma estratégia com persona, texto e mídias prontas para você executar e crescer.' },
    { key: 'media', title: 'Criação de Mídia com IA', script: 'Diga adeus aos bancos de imagem genéricos. Nossa IA gera imagens e vídeos exclusivos para seus posts, garantindo um visual profissional e 100% alinhado com sua marca.' },
    { key: 'funnels', title: 'Gerador de Funis de Venda', script: 'Converta seguidores em clientes. Criamos funis de venda completos, desde a isca digital, passando pela página de captura, até a sequência de e-mails para nutrir e vender.' }
];

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

const InteractiveAIPersona: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentTranscription, setCurrentTranscription] = useState('Olá! Sou a estrategista de IA do Viraliza.ai. Clique em uma das funcionalidades abaixo para eu explicar como posso transformar seu marketing.');

    const handleFeatureClick = (script: string, title: string) => {
        if (isProcessing) return;

        setIsProcessing(true);
        setCurrentTranscription(`${title}: ${script}`);

        // Simular processamento
        setTimeout(() => {
            setIsProcessing(false);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-secondary rounded-lg shadow-xl w-full max-w-3xl h-auto max-h-[90vh] flex flex-col animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-3xl text-gray-dark hover:text-light z-10">&times;</button>
                
                <div className="p-8 flex flex-col items-center">
                    {/* Avatar em Vídeo */}
                    <div className={`relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary shadow-lg mb-6 ${isProcessing ? 'animate-pulse-ring' : ''}`}>
                         <video 
                            src="https://videos.pexels.com/video-files/8766782/8766782-sd_640_360_25fps.mp4" 
                            autoPlay 
                            loop 
                            muted
                            playsInline
                            className={`w-full h-full object-cover transition-all duration-500 ${isProcessing ? 'filter brightness-50' : ''}`}
                        />
                        {isProcessing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                <ViralizaLogo3D className="w-24 h-24" />
                            </div>
                        )}
                    </div>
                    
                    {/* Transcrição */}
                    <div className="bg-primary p-4 rounded-lg w-full min-h-[100px] text-center flex items-center justify-center">
                        <p className="text-light">{currentTranscription}</p>
                    </div>

                    {/* Botões de Funcionalidades */}
                    <div className="mt-6 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                        {features.map(feature => (
                             <button 
                                key={feature.key}
                                onClick={() => handleFeatureClick(feature.script, feature.title)}
                                disabled={isProcessing}
                                className="bg-accent text-light font-semibold py-3 px-4 rounded-full hover:bg-blue-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                             >
                                 {feature.title}
                             </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InteractiveAIPersona;
