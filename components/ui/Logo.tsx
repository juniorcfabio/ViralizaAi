
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = 'h-8 w-8' }) => {
    // Ensure width is set if only height is provided, to maintain aspect ratio for 3D container
    const sizeClass = className.includes('w-') ? className : `${className} w-8`;

    return (
        <div className="flex items-center space-x-2">
            {/* 3D Logo Container */}
            <div 
                className={`${sizeClass} relative flex-shrink-0`} 
                style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
            >
                <div 
                    className="absolute inset-0 w-full h-full animate-spin-3d" 
                    style={{ 
                        transformStyle: 'preserve-3d',
                        animation: 'spin 8s linear infinite'
                    }}
                >
                    {/* Camada Traseira (Sombra/Profundidade) */}
                    <svg 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="absolute inset-0 w-full h-full"
                        style={{ transform: 'translateZ(-3px)' }}
                    >
                         <g transform="rotate(180 12 12)">
                            <path d="M12 2L2 22h7l3-6 3 6h7L12 2z" fill="#1e3a8a" /> {/* Dark Blue */}
                         </g>
                    </svg>

                    {/* Camada Central (Principal com Gradiente) */}
                    <svg 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="absolute inset-0 w-full h-full"
                        style={{ transform: 'translateZ(0px)', filter: 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.5))' }}
                    >
                        <defs>
                            <linearGradient id="logo-gradient-header" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3B82F6" />
                                <stop offset="100%" stopColor="#8B5CF6" />
                            </linearGradient>
                        </defs>
                        <g transform="rotate(180 12 12)">
                            <path d="M12 2L2 22h7l3-6 3 6h7L12 2z" fill="url(#logo-gradient-header)" />
                            <path d="M12 11l-3.5 7.5h7L12 11z" fill="url(#logo-gradient-header)" opacity="0.7"/>
                        </g>
                    </svg>

                    {/* Camada Frontal (Brilho/Vidro) */}
                    <svg 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="absolute inset-0 w-full h-full"
                        style={{ transform: 'translateZ(3px)', opacity: 0.4 }}
                    >
                         <g transform="rotate(180 12 12)">
                            <path d="M12 2L2 22h7l3-6 3 6h7L12 2z" fill="#93c5fd" /> {/* Light Blue */}
                         </g>
                    </svg>
                </div>
            </div>

            <div className="flex flex-col">
                <span className="text-xl font-bold text-light leading-none">Viraliza.ai</span>
                <div className="flex items-center space-x-1 mt-1 opacity-60">
                    {/* Instagram */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                    {/* TikTok */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                    </svg>
                    {/* X (formerly Twitter) */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                        <path d="M18 6 6 18"></path>
                        <path d="m6 6 12 12"></path>
                    </svg>
                    {/* YouTube */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                    </svg>
                     {/* Facebook */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                    {/* Telegram */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default Logo;
