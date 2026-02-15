
import React, { useState, useEffect } from 'react';
import { Plan, SystemVersion } from '../../types';
import { updateSystemVersion } from '../../services/dbService';
import { useTheme, PRESET_THEMES } from '../../contexts/ThemeContext';
import { useCentralizedPricing } from '../../services/centralizedPricingService';

// Icons
const SunIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>;
const MoonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>;
const PaletteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>;

const getFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        return defaultValue;
    }
}

const saveToStorage = <T,>(key: string, data: T) => {
    localStorage.setItem(key, JSON.stringify(data));
    // SYNC COM SUPABASE
    import('../../src/lib/supabase').then(({ supabase }) => {
        supabase.from('system_settings').upsert({ key, value: data, updated_at: new Date().toISOString() }).then(() => {});
    });
}


// 🔥 REMOVIDO: Planos agora vêm do Supabase em tempo real


const AdminSettingsPage: React.FC = () => {
    const { pricing, loading: pricingLoading } = useCentralizedPricing(); // 🔥 PREÇOS EM TEMPO REAL
    const [isMaintenance, setIsMaintenance] = useState<boolean>(() => getFromStorage('viraliza_maintenance', false));
    const [plans, setPlans] = useState<Plan[]>([]);
    
    // 🔥 CARREGAR PLANOS DO SUPABASE
    useEffect(() => {
        if (pricing?.subscriptionPlans) {
            const formattedPlans = pricing.subscriptionPlans.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                features: p.features.join(',')
            }));
            setPlans(formattedPlans);
        }
    }, [pricing]);
    const [notification, setNotification] = useState('');
    const [versionData, setVersionData] = useState<SystemVersion>({
        version: '1.0.0',
        description: 'Versão inicial',
        releaseDate: new Date().toISOString().slice(0, 10),
        isMandatory: false
    });

    // Theme Context Hooks
    const { currentTheme, applyTheme, isAutoMode, setIsAutoMode, customColors, setCustomColors } = useTheme();

    useEffect(() => { saveToStorage('viraliza_maintenance', isMaintenance) }, [isMaintenance]);

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    const handlePlanChange = (id: string, field: keyof Plan, value: string | number) => {
        setPlans(plans.map(p => p.id === id ? {...p, [field]: value} : p));
    }
    
    const handleSavePlans = () => {
        saveToStorage('viraliza_plans', plans);
        showNotification('Planos atualizados com sucesso!');
    }
    
    const handleRemovePlan = (id: string) => {
        if(window.confirm('Tem certeza que deseja remover este plano?')) {
            setPlans(plans.filter(p => p.id !== id));
        }
    }

    const handleDeployUpdate = () => {
        updateSystemVersion({
            ...versionData,
            releaseDate: new Date().toISOString()
        });
        showNotification('Nova versão lançada para todos os usuários!');
    }

    const handleCustomColorChange = (key: keyof typeof customColors, value: string) => {
        const newColors = { ...customColors, [key]: value };
        setCustomColors(newColors);
        if (currentTheme.id === 'custom') {
            applyTheme('custom');
        }
    }

    return (
        <>
            <header className="mb-8">
                <h2 className="text-3xl font-bold">Configurações da Plataforma</h2>
                <p className="text-gray-dark">Gerencie as configurações globais do Viraliza.ai.</p>
            </header>

            {notification && (
                <div className="bg-green-500 bg-opacity-20 text-green-300 p-3 rounded-lg mb-6 text-center">
                    {notification}
                </div>
            )}

            <div className="space-y-8">
                {/* Theme Manager */}
                <div className="bg-secondary p-6 rounded-lg border border-accent/30">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <PaletteIcon className="w-6 h-6 text-accent" />
                        Gerenciador de Temas e Cores
                    </h3>
                    
                    <div className="mb-6 bg-primary p-4 rounded-lg">
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                {isAutoMode ? <SunIcon className="w-5 h-5 text-yellow-400"/> : <MoonIcon className="w-5 h-5 text-gray-400"/>}
                                <div>
                                    <p className="font-semibold">Modo Automático (Dia/Noite)</p>
                                    <p className="text-xs text-gray-dark">Muda o tema com base no nascer (06:00) e pôr do sol (18:00).</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isAutoMode} onChange={(e) => setIsAutoMode(e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                            </label>
                        </div>
                    </div>

                    <h4 className="font-bold mb-3 text-sm text-gray-dark uppercase">Temas Sazonais e Padrões</h4>
                    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 ${isAutoMode ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        {PRESET_THEMES.map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => applyTheme(theme.id)}
                                className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${currentTheme.id === theme.id ? 'border-accent bg-accent/10 scale-105' : 'border-gray-700 bg-primary hover:border-gray-500'}`}
                            >
                                <div className="flex gap-1">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.secondary }}></div>
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.accent }}></div>
                                </div>
                                <span className="text-sm font-medium">{theme.name}</span>
                            </button>
                        ))}
                        {/* Custom Theme Button */}
                        <button
                            onClick={() => applyTheme('custom')}
                            className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${currentTheme.id === 'custom' ? 'border-accent bg-accent/10 scale-105' : 'border-gray-700 bg-primary hover:border-gray-500'}`}
                        >
                             <div className="flex gap-1">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: customColors.primary }}></div>
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: customColors.secondary }}></div>
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: customColors.accent }}></div>
                            </div>
                            <span className="text-sm font-medium">Personalizado</span>
                        </button>
                    </div>

                    <h4 className="font-bold mb-3 text-sm text-gray-dark uppercase">Editor de Cor Manual</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-primary p-4 rounded-lg">
                        <div>
                            <label className="block text-xs text-gray-dark mb-1">Cor Primária (Fundo)</label>
                            <div className="flex gap-2">
                                <input type="color" value={customColors.primary} onChange={(e) => handleCustomColorChange('primary', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-none bg-transparent" />
                                <input type="text" value={customColors.primary} onChange={(e) => handleCustomColorChange('primary', e.target.value)} className="flex-1 bg-secondary p-1 rounded text-xs border border-gray-600" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-dark mb-1">Cor Secundária (Cartões)</label>
                            <div className="flex gap-2">
                                <input type="color" value={customColors.secondary} onChange={(e) => handleCustomColorChange('secondary', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-none bg-transparent" />
                                <input type="text" value={customColors.secondary} onChange={(e) => handleCustomColorChange('secondary', e.target.value)} className="flex-1 bg-secondary p-1 rounded text-xs border border-gray-600" />
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs text-gray-dark mb-1">Cor de Destaque (Botões/Links)</label>
                            <div className="flex gap-2">
                                <input type="color" value={customColors.accent} onChange={(e) => handleCustomColorChange('accent', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-none bg-transparent" />
                                <input type="text" value={customColors.accent} onChange={(e) => handleCustomColorChange('accent', e.target.value)} className="flex-1 bg-secondary p-1 rounded text-xs border border-gray-600" />
                            </div>
                        </div>
                        <div className="col-span-full mt-2">
                             <button onClick={() => applyTheme('custom')} className="text-xs bg-primary border border-gray-600 hover:bg-gray-700 px-3 py-1 rounded">Aplicar Manualmente</button>
                        </div>
                    </div>
                </div>

                {/* System Updates */}
                <div className="bg-secondary p-6 rounded-lg border border-accent/30">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        Central de Atualizações
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">Nova Versão (Semântica)</label>
                            <input type="text" value={versionData.version} onChange={e => setVersionData({...versionData, version: e.target.value})} className="w-full bg-primary p-2 rounded border border-gray-600" placeholder="Ex: 1.2.0" />
                        </div>
                        <div className="flex items-center mt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={versionData.isMandatory} onChange={e => setVersionData({...versionData, isMandatory: e.target.checked})} className="h-4 w-4 text-accent bg-primary border-gray-600 focus:ring-accent rounded" />
                                <span className="text-sm">Atualização Obrigatória?</span>
                            </label>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm text-gray-dark mb-1">Notas da Versão</label>
                        <textarea value={versionData.description} onChange={e => setVersionData({...versionData, description: e.target.value})} className="w-full bg-primary p-2 rounded border border-gray-600" rows={3} placeholder="Descreva as melhorias..." />
                    </div>
                    <button onClick={handleDeployUpdate} className="w-full bg-accent text-light font-semibold py-3 rounded-full hover:bg-blue-500 transition-colors">
                        Lançar Atualização via Nuvem
                    </button>
                </div>

                {/* Maintenance Mode */}
                <div className="bg-secondary p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Modo Manutenção</h3>
                    <div className="flex items-center justify-between">
                        <p className="text-gray-dark">Ativar o modo manutenção para todos os usuários clientes.</p>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={isMaintenance} onChange={(e) => setIsMaintenance(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-primary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                            <span className="ml-3 text-sm font-medium">{isMaintenance ? 'Ativado' : 'Desativado'}</span>
                        </label>
                    </div>
                </div>

                {/* Plan Management - REMOVIDO */}
                {/* Gerenciamento de planos movido para "Gerenciar Preços" para evitar duplicação */}
                <div className="bg-secondary p-6 rounded-lg border border-yellow-500/30">
                    <h3 className="text-xl font-bold mb-4 text-yellow-400">⚠️ Gerenciamento de Planos</h3>
                    <p className="text-gray-300 mb-4">
                        O gerenciamento de planos e preços foi movido para a seção <strong>"Gerenciar Preços"</strong> 
                        para centralizar todas as configurações de preços em um só local.
                    </p>
                    <p className="text-sm text-gray-400">
                        Acesse: <span className="text-accent">Painel Administrativo → Gerenciar Preços</span>
                    </p>
                </div>
            </div>
        </>
    );
};

export default AdminSettingsPage;
