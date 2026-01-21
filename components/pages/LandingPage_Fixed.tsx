import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { useLanguage } from '../../contexts/LanguageContext';
import { StripeService } from '../../services/stripeService';
import { getTrustedCompaniesDB } from '../../services/dbService';
import { TrustedCompany, Plan, Testimonial, AdPartner } from '../../types';
import { 
    CampaignIcon, 
    MediaIcon, 
    FunnelIcon, 
    GoogleIcon, 
    FacebookIcon, 
    AppleIcon,
    FeedUserIcon,
    FeedDownloadIcon,
    FeedStarIcon
} from '../ui/Icons';
import Logo from '../ui/Logo';
import AIPersona from '../ui/AIPersona';
import InteractiveAIPersona from '../ui/InteractiveAIPersona';
import AdminCredentialsFix from '../ui/AdminCredentialsFix';
import DraggableHelpButton from '../ui/DraggableHelpButton';

// Componente de logos 3D ultra-realistas
const ClientLogos: React.FC = () => {
    const [isPaused, setIsPaused] = useState(false);

    // Logos com cores das marcas para exibição visual 3D ultra-realista
    const logos = [
        { id: '1', name: 'Microsoft', url: 'https://microsoft.com', color: '#00BCF2' },
        { id: '2', name: 'Google', url: 'https://google.com', color: '#4285F4' },
        { id: '3', name: 'Amazon', url: 'https://amazon.com', color: '#FF9900' },
        { id: '4', name: 'Meta', url: 'https://meta.com', color: '#1877F2' },
        { id: '5', name: 'Apple', url: 'https://apple.com', color: '#000000' },
        { id: '6', name: 'Tesla', url: 'https://tesla.com', color: '#CC0000' },
        { id: '7', name: 'Netflix', url: 'https://netflix.com', color: '#E50914' },
        { id: '8', name: 'Spotify', url: 'https://spotify.com', color: '#1DB954' },
        { id: '9', name: 'Adobe', url: 'https://adobe.com', color: '#FF0000' },
        { id: '10', name: 'Salesforce', url: 'https://salesforce.com', color: '#00A1E0' },
        { id: '11', name: 'Oracle', url: 'https://oracle.com', color: '#F80000' },
        { id: '12', name: 'IBM', url: 'https://ibm.com', color: '#1261FE' },
        { id: '13', name: 'Intel', url: 'https://intel.com', color: '#0071C5' },
        { id: '14', name: 'NVIDIA', url: 'https://nvidia.com', color: '#76B900' },
        { id: '15', name: 'Samsung', url: 'https://samsung.com', color: '#1428A0' },
        { id: '16', name: 'Sony', url: 'https://sony.com', color: '#000000' },
        { id: '17', name: 'Uber', url: 'https://uber.com', color: '#000000' },
        { id: '18', name: 'Airbnb', url: 'https://airbnb.com', color: '#FF5A5F' },
        { id: '19', name: 'PayPal', url: 'https://paypal.com', color: '#003087' },
        { id: '20', name: 'Shopify', url: 'https://shopify.com', color: '#96BF48' },
        { id: '21', name: 'Zoom', url: 'https://zoom.us', color: '#2D8CFF' },
        { id: '22', name: 'Slack', url: 'https://slack.com', color: '#4A154B' },
        { id: '23', name: 'Dropbox', url: 'https://dropbox.com', color: '#0061FF' },
        { id: '24', name: 'Twitter', url: 'https://twitter.com', color: '#1DA1F2' },
        { id: '25', name: 'LinkedIn', url: 'https://linkedin.com', color: '#0077B5' },
        { id: '26', name: 'TikTok', url: 'https://tiktok.com', color: '#000000' },
        { id: '27', name: 'Instagram', url: 'https://instagram.com', color: '#E4405F' },
        { id: '28', name: 'WhatsApp', url: 'https://whatsapp.com', color: '#25D366' },
        { id: '29', name: 'YouTube', url: 'https://youtube.com', color: '#FF0000' },
        { id: '30', name: 'Discord', url: 'https://discord.com', color: '#5865F2' },
    ];

    // Triplicar logos para carrossel infinito suave
    const extendedLogos = [...logos, ...logos, ...logos];

    return (
        <div className="w-full overflow-hidden relative">
            {/* Gradientes laterais para efeito fade */}
            <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-secondary to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-secondary to-transparent z-10 pointer-events-none"></div>
            
            {/* Container do carrossel */}
            <div 
                className={`flex w-max ${isPaused ? 'pause-animation' : 'animate-infinite-scroll'}`}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {extendedLogos.map((logo, index) => (
                    <div 
                        key={`${logo.id}-${index}`} 
                        className="flex-shrink-0 mx-6 sm:mx-8 lg:mx-12 group"
                    >
                        <a 
                            href={logo.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block transform transition-all duration-500 ease-out group-hover:scale-110"
                        >
                            {/* Logo com efeitos visuais 3D ultra-realistas */}
                            <div className="relative">
                                {/* Glow effect dinâmico */}
                                <div 
                                    className="absolute inset-0 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    style={{
                                        background: `radial-gradient(circle, ${logo.color}40, ${logo.color}20, transparent)`
                                    }}
                                ></div>
                                
                                {/* Logo 3D Ultra-Realista com cores das marcas */}
                                <div 
                                    className="relative backdrop-blur-sm px-8 py-6 rounded-2xl border-2 transition-all duration-700 min-w-[140px] h-20 flex items-center justify-center shadow-2xl transform group-hover:scale-105 group-hover:rotate-1"
                                    style={{
                                        background: `linear-gradient(135deg, ${logo.color}15, ${logo.color}25, rgba(255,255,255,0.1))`,
                                        borderColor: `${logo.color}50`,
                                        boxShadow: `0 8px 32px ${logo.color}20, 0 0 0 1px ${logo.color}30`
                                    }}
                                >
                                    {/* Efeito 3D de profundidade */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 rounded-2xl"></div>
                                    
                                    <span 
                                        className="text-xl font-bold transition-all duration-700 transform group-hover:scale-110 relative z-10"
                                        style={{
                                            color: logo.color,
                                            textShadow: `0 2px 4px ${logo.color}60, 0 0 20px ${logo.color}30, 0 4px 8px rgba(0,0,0,0.5)`,
                                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                                        }}
                                    >
                                        {logo.name}
                                    </span>
                                    
                                    {/* Reflexo 3D */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/15 rounded-2xl pointer-events-none"></div>
                                    
                                    {/* Borda interna brilhante */}
                                    <div 
                                        className="absolute inset-0 rounded-2xl pointer-events-none opacity-50"
                                        style={{
                                            background: `linear-gradient(45deg, transparent 30%, ${logo.color}20 50%, transparent 70%)`
                                        }}
                                    ></div>
                                </div>
                                
                                {/* Shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out rounded-2xl"></div>
                            </div>
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientLogos;
