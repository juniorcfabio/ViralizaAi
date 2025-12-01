
import React, { useState, useRef, useEffect } from 'react';
import { generatePersonaSpeech } from '../../services/geminiService';

// --- Funções de Decodificação de Áudio ---
// Converte uma string base64 para um Uint8Array.
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Decodifica dados de áudio PCM brutos para um AudioBuffer que pode ser tocado.
async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
): Promise<AudioBuffer> {
    // A API TTS retorna PCM bruto (16-bit, mono, 24kHz).
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000); // 1 canal (mono), 24000Hz sample rate
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0; // Normaliza para o range [-1.0, 1.0]
    }
    return buffer;
}
// --- Fim das Funções de Decodificação ---

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
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentTranscription, setCurrentTranscription] = useState('Olá! Sou a estrategista de IA do Viraliza.ai. Clique em uma das funcionalidades abaixo para eu explicar como posso transformar seu marketing.');
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    // Inicializa o AudioContext quando o componente é montado.
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        return () => {
            audioContextRef.current?.close();
        };
    }, []);

    const handleFeatureClick = async (script: string, title: string) => {
        if (isSpeaking || !audioContextRef.current) return;

        setIsSpeaking(true);
        setCurrentTranscription(`Gerando explicação sobre "${title}"...`);

        const audioData = await generatePersonaSpeech(script);

        if (audioData && audioContextRef.current) {
            try {
                if (audioSourceRef.current) {
                    audioSourceRef.current.stop(); // Para qualquer áudio anterior
                }

                const decoded = decode(audioData);
                const audioBuffer = await decodeAudioData(decoded, audioContextRef.current);

                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);

                source.onended = () => {
                    setIsSpeaking(false);
                    audioSourceRef.current = null;
                };

                setCurrentTranscription(script);
                source.start();
                audioSourceRef.current = source;

            } catch (error) {
                console.error('Erro ao tocar áudio:', error);
                setCurrentTranscription('Desculpe, tive um problema ao processar o áudio. Tente novamente.');
                setIsSpeaking(false);
            }
        } else {
            setCurrentTranscription('Desculpe, não consegui gerar a resposta em áudio no momento.');
            setIsSpeaking(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-secondary rounded-lg shadow-xl w-full max-w-3xl h-auto max-h-[90vh] flex flex-col animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-3xl text-gray-dark hover:text-light z-10">&times;</button>
                
                <div className="p-8 flex flex-col items-center">
                    {/* Avatar em Vídeo */}
                    <div className={`relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary shadow-lg mb-6 ${isSpeaking ? 'animate-pulse-ring' : ''}`}>
                         <video 
                            src="https://videos.pexels.com/video-files/8766782/8766782-sd_640_360_25fps.mp4" 
                            autoPlay 
                            loop 
                            muted
                            playsInline
                            className={`w-full h-full object-cover transition-all duration-500 ${isSpeaking ? 'filter brightness-50' : ''}`}
                        />
                        {isSpeaking && (
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
                                disabled={isSpeaking}
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
