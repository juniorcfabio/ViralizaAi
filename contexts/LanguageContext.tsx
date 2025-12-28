import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import GeolocationService from '../services/geolocationService';
import { translations } from '../data/translations';

type Language = 'pt' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'ru' | 'zh' | 'ja' | 'ko' | 'hi' | 'ar';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');

    useEffect(() => {
        const detectLanguage = async () => {
            try {
                const geoService = GeolocationService.getInstance();
                const location = await geoService.detectUserLocation();
                const detectedLang = location.language as Language;
                
                const supportedLanguages: Language[] = ['pt', 'en', 'es', 'fr', 'de', 'it', 'ru', 'zh', 'ja', 'ko', 'hi', 'ar'];
                
                if (supportedLanguages.includes(detectedLang)) {
                    setLanguage(detectedLang);
                } else {
                    const browserLang = navigator.language.split('-')[0] as Language;
                    if (supportedLanguages.includes(browserLang)) {
                        setLanguage(browserLang);
                    } else {
                        setLanguage('en');
                    }
                }
            } catch (error) {
                console.warn('Language detection failed:', error);
                const browserLang = navigator.language.split('-')[0] as Language;
                setLanguage(['pt', 'en', 'es', 'fr', 'de', 'it', 'ru', 'zh', 'ja', 'ko', 'hi', 'ar'].includes(browserLang) ? browserLang : 'en');
            }
        };

        detectLanguage();
    }, []);

    const t = (key: string) => {
        // @ts-ignore
        return translations[language]?.[key] || key;
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