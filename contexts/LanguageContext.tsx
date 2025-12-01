
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type Language = 'pt' | 'en' | 'es';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations = {
    pt: {
        'hero.title': 'Transforme sua Presença Digital com Inteligência Artificial',
        'hero.subtitle': 'Crescimento orgânico, marketing automatizado e vendas exponenciais. Deixe nossa IA trabalhar 24h por dia para viralizar sua marca.',
        'hero.cta': 'Começar Teste Grátis (24h)',
        'hero.generating': 'Gerando apresentação personalizada...',
        'nav.features': 'Funcionalidades',
        'nav.testimonials': 'Depoimentos',
        'nav.pricing': 'Ver Planos',
        'nav.login': 'Entrar',
        'nav.dashboard': 'Dashboard',
        'nav.register': 'Cadastre-se',
        'plan.mensal': 'Plano Mensal',
        'plan.trimestral': 'Plano Trimestral',
        'plan.semestral': 'Plano Semestral',
        'plan.anual': 'Plano Anual',
        'plan.period.month': '/mês',
        'plan.period.quarter': '/trimestre',
        'plan.period.semester': '/semestre',
        'plan.period.year': '/ano',
        'plan.buy': 'Assinar Agora',
        'plan.feature.conversion_tags': 'Radar de Hashtags de Conversão',
        'plan.feature.retention_audio': 'Detector de Áudios de Alta Retenção',
        'plan.feature.competitor_spy': 'Espião Tático de Concorrência',
        'plan.feature.future_trends': 'IA Preditiva de Tendências (Futuro)',
        'feature.growth': 'Crescimento Acelerado com IA',
        'feature.content': 'Criação de Conteúdo Inteligente',
        'feature.sales': 'Impulso de Vendas Direto',
        'footer.rights': 'Todos os direitos reservados.',
        'ads.title': 'Nossos Parceiros Premium',
        'ads.subtitle': 'Empresas que confiam e crescem com o Viraliza.ai',
        'ads.visit': 'Visitar Site',
        'ads.contact': 'Contato',
        
        // Sidebar Client
        'sidebar.dashboard': 'Dashboard',
        'sidebar.social': 'Perfis de Marca',
        'sidebar.analytics': 'Analytics',
        'sidebar.billing': 'Faturamento',
        'sidebar.affiliate': 'Afiliados',
        'sidebar.autopilot': 'Autopromoção',
        'sidebar.settings': 'Configurações',
        'sidebar.logout': 'Sair',
        'sidebar.change_photo': 'Trocar',
        'sidebar.advertise': 'Anuncie Aqui',

        // Sidebar Admin
        'sidebar.admin_users': 'Usuários',
        'sidebar.admin_financial': 'Financeiro',
        'sidebar.admin_payments': 'Pagamentos',
        'sidebar.admin_marketing': 'Marketing',
        'sidebar.admin_maintenance': 'Engenheiro de IA',
        'sidebar.admin_autopilot': 'Autopromoção IA',
        'sidebar.admin_ads': 'Publicidade',
    },
    en: {
        'hero.title': 'Transform Your Digital Presence with Artificial Intelligence',
        'hero.subtitle': 'Organic growth, automated marketing, and exponential sales. Let our AI work 24/7 to make your brand go viral.',
        'hero.cta': 'Start Free Trial (24h)',
        'hero.generating': 'Generating personalized presentation...',
        'nav.features': 'Features',
        'nav.testimonials': 'Testimonials',
        'nav.pricing': 'View Plans',
        'nav.login': 'Login',
        'nav.dashboard': 'Dashboard',
        'nav.register': 'Sign Up',
        'plan.mensal': 'Monthly Plan',
        'plan.trimestral': 'Quarterly Plan',
        'plan.semestral': 'Semiannual Plan',
        'plan.anual': 'Annual Plan',
        'plan.period.month': '/mo',
        'plan.period.quarter': '/qtr',
        'plan.period.semester': '/sem',
        'plan.period.year': '/yr',
        'plan.buy': 'Subscribe Now',
        'plan.feature.conversion_tags': 'Conversion Hashtag Radar',
        'plan.feature.retention_audio': 'High Retention Audio Detector',
        'plan.feature.competitor_spy': 'Tactical Competitor Spy',
        'plan.feature.future_trends': 'Predictive Trend AI (Future)',
        'feature.growth': 'Accelerated Growth with AI',
        'feature.content': 'Smart Content Creation',
        'feature.sales': 'Direct Sales Boost',
        'footer.rights': 'All rights reserved.',
        'ads.title': 'Our Premium Partners',
        'ads.subtitle': 'Companies that trust and grow with Viraliza.ai',
        'ads.visit': 'Visit Website',
        'ads.contact': 'Contact',

        // Sidebar Client
        'sidebar.dashboard': 'Dashboard',
        'sidebar.social': 'Brand Profiles',
        'sidebar.analytics': 'Analytics',
        'sidebar.billing': 'Billing',
        'sidebar.affiliate': 'Affiliates',
        'sidebar.autopilot': 'Autopilot',
        'sidebar.settings': 'Settings',
        'sidebar.logout': 'Logout',
        'sidebar.change_photo': 'Change',
        'sidebar.advertise': 'Advertise Here',

        // Sidebar Admin
        'sidebar.admin_users': 'Users',
        'sidebar.admin_financial': 'Financial',
        'sidebar.admin_payments': 'Payments',
        'sidebar.admin_marketing': 'Marketing',
        'sidebar.admin_maintenance': 'AI Engineer',
        'sidebar.admin_autopilot': 'AI Autopilot',
        'sidebar.admin_ads': 'Advertising',
    },
    es: {
        'hero.title': 'Transforma tu Presencia Digital con Inteligencia Artificial',
        'hero.subtitle': 'Crecimiento orgánico, marketing automatizado y ventas exponenciales. Deja que nuestra IA trabaje 24/7 para viralizar tu marca.',
        'hero.cta': 'Comenzar Prueba Gratis (24h)',
        'hero.generating': 'Generando presentación personalizada...',
        'nav.features': 'Funcionalidades',
        'nav.testimonials': 'Testimonios',
        'nav.pricing': 'Ver Planes',
        'nav.login': 'Acceder',
        'nav.dashboard': 'Panel',
        'nav.register': 'Regístrate',
        'plan.mensal': 'Plan Mensual',
        'plan.trimestral': 'Plan Trimestral',
        'plan.semestral': 'Plan Semestral',
        'plan.anual': 'Plan Anual',
        'plan.period.month': '/mes',
        'plan.period.quarter': '/trim',
        'plan.period.semester': '/sem',
        'plan.period.year': '/año',
        'plan.buy': 'Suscribirse Ahora',
        'plan.feature.conversion_tags': 'Radar de Hashtags de Conversión',
        'plan.feature.retention_audio': 'Detector de Audios de Alta Retención',
        'plan.feature.competitor_spy': 'Espía Táctico de Competencia',
        'plan.feature.future_trends': 'IA Predictiva de Tendencias (Futuro)',
        'feature.growth': 'Crecimiento Acelerado con IA',
        'feature.content': 'Creación de Contenido Inteligente',
        'feature.sales': 'Impulso de Ventas Directo',
        'footer.rights': 'Todos los derechos reservados.',
        'ads.title': 'Nuestros Socios Premium',
        'ads.subtitle': 'Empresas que confían y crecen con Viraliza.ai',
        'ads.visit': 'Visitar Sitio',
        'ads.contact': 'Contacto',

        // Sidebar Client
        'sidebar.dashboard': 'Panel',
        'sidebar.social': 'Perfiles de Marca',
        'sidebar.analytics': 'Analítica',
        'sidebar.billing': 'Facturación',
        'sidebar.affiliate': 'Afiliados',
        'sidebar.autopilot': 'Piloto Automático',
        'sidebar.settings': 'Ajustes',
        'sidebar.logout': 'Salir',
        'sidebar.change_photo': 'Cambiar',
        'sidebar.advertise': 'Anunciar Aquí',

        // Sidebar Admin
        'sidebar.admin_users': 'Usuarios',
        'sidebar.admin_financial': 'Financiero',
        'sidebar.admin_payments': 'Pagos',
        'sidebar.admin_marketing': 'Marketing',
        'sidebar.admin_maintenance': 'Ingeniero IA',
        'sidebar.admin_autopilot': 'Autopiloto IA',
        'sidebar.admin_ads': 'Publicidad',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en'); // Default to English for global reach

    useEffect(() => {
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'pt') setLanguage('pt');
        else if (browserLang === 'es') setLanguage('es');
        else setLanguage('en'); // Fallback to English for any other language
    }, []);

    const t = (key: string) => {
        // @ts-ignore
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
