
import React from 'react';

const AIPersona: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="flex items-center justify-center gap-6 group cursor-pointer"
            style={{ perspective: '1000px' }}
        >
            {/* Container Principal do Avatar com tamanho fixo */}
            <div 
                className="relative flex items-center justify-center" 
                style={{ width: '96px', height: '96px' }}
            >
                {/* Container Rotativo 3D (Eixo Y) */}
                <div 
                    className="absolute inset-0 w-full h-full animate-spin-3d" 
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {/* Camada Traseira (Profundidade) */}
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" style={{ transform: 'translateZ(-4px) rotate(180deg)', opacity: 0.5, backfaceVisibility: 'visible' }}>
                        <path d="M12 2L2 22h7l3-6 3 6h7L12 2z" fill="#1E40AF" />
                        <path d="M12 11l-3.5 7.5h7L12 11z" fill="#1E40AF" opacity="0.8"/>
                    </svg>
                    
                    {/* Camada Central (Principal com Brilho) */}
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" style={{ transform: 'translateZ(0px) rotate(180deg)', filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))', backfaceVisibility: 'visible' }}>
                        <path d="M12 2L2 22h7l3-6 3 6h7L12 2z" fill="#3B82F6" />
                        <path d="M12 11l-3.5 7.5h7L12 11z" fill="#8B5CF6" opacity="0.9"/>
                    </svg>

                    {/* Camada Frontal (Efeito de Vidro) */}
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" style={{ transform: 'translateZ(4px) rotate(180deg)', opacity: 0.4, backfaceVisibility: 'visible' }}>
                         <path d="M12 2L2 22h7l3-6 3 6h7L12 2z" fill="#93C5FD" />
                         <path d="M12 11l-3.5 7.5h7L12 11z" fill="#C4B5FD" opacity="0.8"/>
                    </svg>
                </div>
               
                {/* Anéis Magnéticos Externos */}
                <div className="absolute inset-0 border-[3px] border-cyan-400/60 rounded-full animate-magnetic-ring-1 pointer-events-none"></div>
                <div className="absolute inset-0 border-[3px] border-purple-500/60 rounded-full animate-magnetic-ring-2 pointer-events-none"></div>
            </div>

            {/* Botão de Ação */}
            <div className="bg-secondary px-6 py-3 rounded-lg text-base text-light font-semibold transition-transform group-hover:scale-105 shadow-lg border border-primary/50 whitespace-nowrap">
                Converse Comigo!
            </div>
        </div>
    );
};

export default AIPersona;
