
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AppTheme, ThemeColors } from '../types';

const DEFAULT_COLORS: ThemeColors = {
    primary: '#02042B',
    secondary: '#0B1747',
    light: '#E2E8F0',
    grayDark: '#94A3B8',
    accent: '#4F46E5'
};

export const PRESET_THEMES: AppTheme[] = [
    {
        id: 'default',
        name: 'Padrão (Viraliza)',
        colors: DEFAULT_COLORS
    },
    {
        id: 'light',
        name: 'Dia (Claro)',
        colors: {
            primary: '#FFFFFF',
            secondary: '#F0F2F5',
            light: '#111827', // Text becomes dark
            grayDark: '#4B5563',
            accent: '#4F46E5'
        }
    },
    {
        id: 'dark',
        name: 'Noite (Escuro)',
        colors: {
            primary: '#000000',
            secondary: '#121212',
            light: '#E5E7EB',
            grayDark: '#9CA3AF',
            accent: '#6366F1'
        }
    },
    {
        id: 'mothers_day',
        name: 'Dia das Mães',
        colors: {
            primary: '#3D0C18', // Dark Rose
            secondary: '#5F1729',
            light: '#FFE4E6',
            grayDark: '#FDA4AF',
            accent: '#EC4899' // Pink
        }
    },
    {
        id: 'fathers_day',
        name: 'Dia dos Pais',
        colors: {
            primary: '#0F172A',
            secondary: '#1E293B',
            light: '#E2E8F0',
            grayDark: '#94A3B8',
            accent: '#D97706' // Gold/Amber
        }
    },
    {
        id: 'valentines',
        name: 'Dia dos Namorados',
        colors: {
            primary: '#2C0206',
            secondary: '#450A0A',
            light: '#FECACA',
            grayDark: '#FCA5A5',
            accent: '#EF4444' // Red
        }
    },
    {
        id: 'sao_joao',
        name: 'São João',
        colors: {
            primary: '#291202', // Brown
            secondary: '#431407',
            light: '#FEF3C7',
            grayDark: '#FDE68A',
            accent: '#F59E0B' // Orange/Fire
        }
    },
    {
        id: 'black_friday',
        name: 'Black Friday',
        colors: {
            primary: '#000000',
            secondary: '#111111',
            light: '#FFFFFF',
            grayDark: '#CCCCCC',
            accent: '#84CC16' // Neon Green
        }
    },
    {
        id: 'christmas',
        name: 'Natal',
        colors: {
            primary: '#062C16', // Dark Green
            secondary: '#0B3D22',
            light: '#FEF2F2',
            grayDark: '#BBF7D0',
            accent: '#DC2626' // Red
        }
    }
];

interface ThemeContextType {
    currentTheme: AppTheme;
    setCurrentTheme: (theme: AppTheme) => void;
    isAutoMode: boolean;
    setIsAutoMode: (isAuto: boolean) => void;
    customColors: ThemeColors;
    setCustomColors: (colors: ThemeColors) => void;
    applyTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Load from localStorage or defaults
    const [isAutoMode, setIsAutoModeState] = useState<boolean>(() => {
        const saved = localStorage.getItem('viraliza_theme_auto');
        return saved ? JSON.parse(saved) : true; // Default to Auto
    });

    const [customColors, setCustomColorsState] = useState<ThemeColors>(() => {
        const saved = localStorage.getItem('viraliza_theme_custom');
        return saved ? JSON.parse(saved) : DEFAULT_COLORS;
    });

    const [currentTheme, setCurrentThemeState] = useState<AppTheme>(() => {
        const savedId = localStorage.getItem('viraliza_theme_id');
        const found = PRESET_THEMES.find(t => t.id === savedId);
        return found || PRESET_THEMES[0];
    });

    // Helpers to persist state
    const setIsAutoMode = (val: boolean) => {
        setIsAutoModeState(val);
        localStorage.setItem('viraliza_theme_auto', JSON.stringify(val));
    };

    const setCustomColors = (val: ThemeColors) => {
        setCustomColorsState(val);
        localStorage.setItem('viraliza_theme_custom', JSON.stringify(val));
    };

    const setCurrentTheme = (val: AppTheme) => {
        setCurrentThemeState(val);
        localStorage.setItem('viraliza_theme_id', val.id);
    };

    const applyTheme = (themeId: string) => {
        if (themeId === 'custom') {
            setCurrentTheme({ id: 'custom', name: 'Personalizado', colors: customColors });
        } else {
            const theme = PRESET_THEMES.find(t => t.id === themeId);
            if (theme) setCurrentTheme(theme);
        }
    };

    // Effect to handle Auto Day/Night Mode
    useEffect(() => {
        const checkTime = () => {
            if (!isAutoMode) return;

            const hour = new Date().getHours();
            // Day: 6:00 to 17:59 -> Default (Viraliza)
            // Night: 18:00 to 05:59 -> Dark
            if (hour >= 6 && hour < 18) {
                // Apply Default Theme (Viraliza)
                if (currentTheme.id !== 'default') {
                    const defaultTheme = PRESET_THEMES.find(t => t.id === 'default');
                    if (defaultTheme) setCurrentThemeState(defaultTheme);
                }
            } else {
                // Apply Dark Theme (Night)
                if (currentTheme.id !== 'dark') {
                    const nightTheme = PRESET_THEMES.find(t => t.id === 'dark');
                    if (nightTheme) setCurrentThemeState(nightTheme);
                }
            }
        };

        checkTime(); // Check immediately
        const interval = setInterval(checkTime, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [isAutoMode, currentTheme.id]);

    // Effect to apply CSS variables to DOM
    useEffect(() => {
        const root = document.documentElement;
        const colors = currentTheme.colors;

        root.style.setProperty('--color-primary', colors.primary);
        root.style.setProperty('--color-secondary', colors.secondary);
        root.style.setProperty('--color-light', colors.light);
        root.style.setProperty('--color-gray-dark', colors.grayDark);
        root.style.setProperty('--color-accent', colors.accent);

    }, [currentTheme]);

    return (
        <ThemeContext.Provider value={{ currentTheme, setCurrentTheme, isAutoMode, setIsAutoMode, customColors, setCustomColors, applyTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
