import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MarketingFormModal from '../ui/MarketingFormModal';
import SocialPostModal from '../ui/SocialPostModal';
import { Campaign, Coupon, CampaignStatus, CouponStatus, ScheduledPost, PostStatus } from '../../types';
import { generateMarketingVideo, editImageWithText } from '../../services/geminiService';

// Icons
const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);
const VideoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>;
const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);

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

// Helper to set time for initial mocked data relative to now
const getRelativeDateStr = (diffDays: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + diffDays);
    date.setHours(12, 0, 0, 0); // normalize to noon
    return date.toISOString();
};

const initialCampaigns: Campaign[] = [
    { id: 'camp_1', name: 'Lançamento Verão 2024', status: 'Ativa', budget: 5000, clicks: 1204, conversions: 89, startDate: getRelativeDateStr(-5), endDate: getRelativeDateStr(10) },
    { id: 'camp_2', name: 'Promoção Dia das Mães', status: 'Concluída', budget: 2500, clicks: 850, conversions: 152, startDate: getRelativeDateStr(-30), endDate: getRelativeDateStr(-10) },
    { id: 'camp_3', name: 'Black Friday Antecipada', status: 'Pausada', budget: 10000, clicks: 450, conversions: 12, startDate: getRelativeDateStr(-2), endDate: getRelativeDateStr(12) },
    { id: 'camp_4', name: 'Divulgação App Mobile', status: 'Planejada', budget: 7000, clicks: 0, conversions: 0, startDate: getRelativeDateStr(15), endDate: getRelativeDateStr(25) },
    { id: 'camp_5', name: 'Natal 2025', status: 'Planejada', budget: 15000, clicks: 0, conversions: 0, startDate: getRelativeDateStr(30), endDate: getRelativeDateStr(45) },
];

const initialCoupons: Coupon[] = [
    { id: 'coup_1', code: 'BEMVINDO10', discount: '10%', status: 'Ativo', uses: 142, startDate: getRelativeDateStr(-15), endDate: getRelativeDateStr(30) },
    { id: 'coup_2', code: 'VERAO20', discount: '20%', status: 'Ativo', uses: 54, startDate: getRelativeDateStr(-3), endDate: getRelativeDateStr(7) },
    { id: 'coup_3', code: 'FRETEGRATIS', discount: 'Frete Grátis', status: 'Expirado', uses: 587, startDate: getRelativeDateStr(-45), endDate: getRelativeDateStr(-15) },
];

const initialPosts: ScheduledPost[] = [
    { id: 'post_1', title: 'Dica do Dia', content: 'Confira nossas novidades...', platform: 'Instagram', scheduledAt: getRelativeDateStr(1), status: 'Agendado' },
    { id: 'post_2', title: 'Vídeo Novo', content: 'Acabamos de postar um tutorial...', platform: 'YouTube', scheduledAt: getRelativeDateStr(-1), status: 'Publicado' },
];

const formatDateStr = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatDateTimeDisplay = (isoString?: string): string => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const isDateInRange = (dateStr: string, startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return false;
    const checkDate = dateStr;
    const startDate = formatDateStr(new Date(startStr));
    const endDate = formatDateStr(new Date(endStr));
    return checkDate >= startDate && checkDate <= endDate;
};

interface MarketingCalendarProps {
    campaigns: Campaign[];
    coupons: Coupon[];
    posts: ScheduledPost[];
}

interface DayDetailsModalProps {
    date: Date;
    events: any[];
    onClose: () => void;
}

const DayDetailsModal: React.FC<DayDetailsModalProps> = ({ date, events, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary p-6 rounded-lg shadow-xl w-full max-w-md relative max-h-[80vh] flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-gray-dark hover:text-light">&times;</button>
                <h3 className="text-xl font-bold mb-4">
                    Eventos em {date.toLocaleDateString('pt-BR')}
                </h3>
                <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                    {events.length === 0 ? (
                        <p className="text-gray-dark">Nenhum evento agendado para este dia.</p>
                    ) : (
                        events.map((event, index) => {
                            let bgColor = 'bg-primary';
                            let title = '';
                            let typeLabel = '';
                            let borderColor = 'border-primary';
                            
                            if (event.type === 'campaign') {
                                title = event.name;
                                typeLabel = 'Campanha';
                                bgColor = 'bg-blue-500/20 text-blue-300';
                                borderColor = 'border-blue-500';
                            } else if (event.type === 'coupon') {
                                title = `Cupom: ${event.code}`;
                                typeLabel = 'Cupom';
                                bgColor = 'bg-green-500/20 text-green-300';
                                borderColor = 'border-green-500';
                            } else if (event.type === 'post') {
                                title = event.title;
                                typeLabel = `Post (${event.platform})`;
                                bgColor = 'bg-purple-500/20 text-purple-300';
                                borderColor = 'border-purple-500';
                            }

                            return (
                                <div key={`${event.type}-${event.id}-${index}`} className={`bg-primary p-3 rounded-lg border-l-4 ${borderColor}`}>
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold">{title}</h4>
                                        <span className={`text-xs px-2 py-1 rounded-full ${bgColor}`}>
                                            {typeLabel}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-dark mt-1">
                                        Status: <span className="text-light">{event.status}</span>
                                    </p>
                                    <p className="text-xs text-gray-dark mt-2">
                                        Início: {formatDateTimeDisplay(event.startDate || event.scheduledAt)}
                                    </p>
                                    {event.endDate && (
                                        <p className="text-xs text-gray-dark">
                                            Fim: {formatDateTimeDisplay(event.endDate)}
                                        </p>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
                <button onClick={onClose} className="w-full bg-accent text-light font-semibold py-2 mt-4 rounded-full hover:bg-blue-500 transition-colors">
                    Fechar
                </button>
            </div>
        </div>
    );
};

const MarketingCalendar: React.FC<MarketingCalendarProps> = ({ campaigns, coupons, posts }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvents, setSelectedEvents] = useState<any[]>([]);
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const changeMonth = (increment: number) => {
        setCurrentDate(new Date(year, month + increment, 1));
    };

    const handleDayClick = (date: Date, events: any[]) => {
        setSelectedDate(date);
        setSelectedEvents(events);
    };

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const calendarDays = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(new Date(year, month, i));
    }

    return (
        <>
            <div className="bg-secondary p-6 rounded-lg mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center"><CalendarIcon className="w-6 h-6 mr-2 text-accent" /> Calendário de Marketing</h3>
                    <div className="flex items-center space-x-4 mt-4 md:mt-0">
                        <button onClick={() => changeMonth(-1)} className="bg-primary px-3 py-1 rounded hover:bg-gray-700 transition-colors">&lt;</button>
                        <span className="font-semibold text-lg min-w-[140px] text-center">{monthNames[month]} {year}</span>
                        <button onClick={() => changeMonth(1)} className="bg-primary px-3 py-1 rounded hover:bg-gray-700 transition-colors">&gt;</button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="text-center font-semibold text-gray-dark py-2">{day}</div>
                    ))}
                    {calendarDays.map((date, index) => {
                        if (!date) return <div key={`empty-${index}`} className="bg-primary/30 rounded-lg h-24 md:h-32 hidden sm:block"></div>;
                        
                        const dateStr = formatDateStr(date);
                        const dayCampaigns = campaigns.filter(c => isDateInRange(dateStr, c.startDate, c.endDate)).map(c => ({ type: 'campaign', ...c }));
                        const dayCoupons = coupons.filter(c => isDateInRange(dateStr, c.startDate, c.endDate)).map(c => ({ type: 'coupon', ...c }));
                        const dayPosts = posts.filter(p => isDateInRange(dateStr, p.scheduledAt, p.scheduledAt)).map(p => ({ type: 'post', ...p }));
                        const dayEvents = [...dayCampaigns, ...dayCoupons, ...dayPosts];

                        const isToday = dateStr === formatDateStr(new Date());

                        return (
                            <div 
                                key={dateStr} 
                                onClick={() => handleDayClick(date, dayEvents)}
                                className={`bg-primary rounded-lg h-24 md:h-32 p-1 overflow-hidden transition-all border cursor-pointer hover:bg-primary/80 hover:border-gray-500 ${isToday ? 'border-accent' : 'border-primary'}`}
                            >
                                <div className={`text-right text-sm mb-1 mr-1 ${isToday ? 'text-accent font-bold' : 'text-gray-dark'}`}>{date.getDate()}</div>
                                <div className="space-y-1 max-h-[calc(100%-1.5rem)] overflow-y-hidden px-1">
                                    {dayEvents.slice(0, 3).map((event: any) => {
                                        let bgColor = 'bg-primary';
                                        let label = '';
                                        if (event.type === 'campaign') {
                                            bgColor = 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30';
                                            label = event.name;
                                        } else if (event.type === 'coupon') {
                                            bgColor = 'bg-green-500/20 text-green-300 hover:bg-green-500/30';
                                            label = event.code;
                                        } else {
                                            bgColor = 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30';
                                            label = event.title;
                                        }
                                        return (
                                            <div 
                                                key={`${event.type}-${event.id}`} 
                                                className={`text-xs px-2 py-1 rounded truncate transition-colors ${bgColor}`} 
                                                title={label}
                                            >
                                                {label}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {selectedDate && <DayDetailsModal date={selectedDate} events={selectedEvents} onClose={() => setSelectedDate(null)} />}
        </>
    );
};

const AdminMarketingPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'calendar' | 'tools'>('calendar');
    const [campaigns, setCampaigns] = useState<Campaign[]>(() => getFromStorage('viraliza_campaigns', initialCampaigns));
    const [coupons, setCoupons] = useState<Coupon[]>(() => getFromStorage('viraliza_coupons', initialCoupons));
    const [posts, setPosts] = useState<ScheduledPost[]>(() => getFromStorage('viraliza_posts', initialPosts));
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'campaign' | 'coupon'>('campaign');
    const [editingItem, setEditingItem] = useState<Campaign | Coupon | null>(null);

    // AI Tools State
    const [generatingVideo, setGeneratingVideo] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [videoPrompt, setVideoPrompt] = useState('');
    const [apiKeySelected, setApiKeySelected] = useState<boolean | null>(null);
    const [apiKeyError, setApiKeyError] = useState('');

    const [selectedImage, setSelectedImage] = useState<{file: File, base64: string} | null>(null);
    const [editPrompt, setEditPrompt] = useState('');
    const [editingImage, setEditingImage] = useState(false);
    const [editedImage, setEditedImage] = useState<string | null>(null);

    useEffect(() => { saveToStorage('viraliza_campaigns', campaigns) }, [campaigns]);
    useEffect(() => { saveToStorage('viraliza_coupons', coupons) }, [coupons]);
    useEffect(() => { saveToStorage('viraliza_posts', posts) }, [posts]);
    
    useEffect(() => {
        // @ts-ignore
        if (typeof window.aistudio?.hasSelectedApiKey === 'function') {
            const checkKey = async () => {
                 // @ts-ignore
                setApiKeySelected(await window.aistudio.hasSelectedApiKey());
            };
            checkKey();
        } else {
            setApiKeySelected(true); // Fallback if aistudio object is not available
        }
    }, []);

    const handleOpenFormModal = (type: 'campaign' | 'coupon', item: Campaign | Coupon | null = null) => {
        setModalType(type);
        setEditingItem(item);
        setIsFormModalOpen(true);
    };

    const handleSaveItem = (data: any) => {
        if (modalType === 'campaign') {
            if (data.id) {
                setCampaigns(campaigns.map(c => c.id === data.id ? data : c));
            } else {
                setCampaigns([...campaigns, { ...data, id: `camp_${Date.now()}`, clicks: 0, conversions: 0 }]);
            }
        } else {
            if (data.id) {
                setCoupons(coupons.map(c => c.id === data.id ? data : c));
            } else {
                setCoupons([...coupons, { ...data, id: `coup_${Date.now()}`, uses: 0 }]);
            }
        }
        setIsFormModalOpen(false);
        setEditingItem(null);
    };

    const handleSavePost = (post: ScheduledPost) => {
        setPosts([...posts, post]);
        setIsPostModalOpen(false);
    };

    const getStatusChip = (status: CampaignStatus | CouponStatus | PostStatus) => {
        switch (status) {
            case 'Ativa': case 'Ativo': case 'Publicado': return 'bg-green-500/20 text-green-300';
            case 'Pausada': case 'Agendado': return 'bg-yellow-500/20 text-yellow-300';
            case 'Planejada': return 'bg-blue-500/20 text-blue-300';
            case 'Concluída': case 'Expirado': return 'bg-gray-500/20 text-gray-300';
            case 'Falha': return 'bg-red-500/20 text-red-300';
        }
    };
    
    const handleSelectApiKey = async () => {
        setApiKeyError('');
        try {
             // @ts-ignore
            await window.aistudio.openSelectKey();
            setApiKeySelected(true); 
        } catch (e) {
            console.error("Error opening API key selection:", e);
            setApiKeyError('Não foi possível abrir a seleção de chave de API.');
        }
    };

    const handleGenerateVideo = async () => {
        if (!videoPrompt.trim()) return;
        setGeneratingVideo(true);
        setGeneratedVideoUrl(null);
        setApiKeyError('');
        
        try {
            const url = await generateMarketingVideo(videoPrompt);
            if (url) {
                setGeneratedVideoUrl(url);
            } else {
                 setApiKeyError('A geração do vídeo falhou. Tente novamente.');
            }
        } catch (e: any) {
            console.error("Caught error in component:", e);
            if (e.message && e.message.includes("Requested entity was not found.")) {
                setApiKeySelected(false);
                setApiKeyError('Sua chave de API é inválida ou não foi encontrada. Por favor, selecione uma nova chave.');
            } else {
                setApiKeyError(`Ocorreu um erro inesperado: ${e.message}`);
            }
        } finally {
            setGeneratingVideo(false);
        }
    };

    const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setSelectedImage({file, base64: (event.target?.result as string).split(',')[1]});
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditImage = async () => {
        if(!selectedImage || !editPrompt.trim()) return;
        setEditingImage(true);
        setEditedImage(null);
        const result = await editImageWithText(selectedImage.base64, selectedImage.file.type, editPrompt);
        setEditedImage(result);
        setEditingImage(false);
    }

    return (
        <>
            <header className="mb-8">
                <h2 className="text-3xl font-bold">Marketing & Campanhas</h2>
                <p className="text-gray-dark">Gerencie suas campanhas, cupons, posts e crie mídias com IA.</p>
            </header>

            <div className="mb-6 border-b border-primary">
                 <nav className="flex space-x-4">
                    <button onClick={() => setActiveTab('calendar')} className={`py-2 px-4 font-semibold border-b-2 ${activeTab === 'calendar' ? 'border-accent text-accent' : 'border-transparent text-gray-dark hover:border-gray-500'}`}>
                        Calendário & Listas
                    </button>
                    <button onClick={() => setActiveTab('tools')} className={`py-2 px-4 font-semibold border-b-2 ${activeTab === 'tools' ? 'border-accent text-accent' : 'border-transparent text-gray-dark hover:border-gray-500'}`}>
                        Ferramentas IA
                    </button>
                 </nav>
            </div>

            {activeTab === 'calendar' && (
                <div>
                    <MarketingCalendar campaigns={campaigns} coupons={coupons} posts={posts} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Campaigns & Coupons Table */}
                        <div className="bg-secondary p-6 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Campanhas e Cupons</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenFormModal('coupon')} className="text-sm bg-primary hover:bg-gray-700 text-light py-1 px-3 rounded-lg">Criar Cupom</button>
                                    <button onClick={() => handleOpenFormModal('campaign')} className="text-sm bg-accent hover:bg-blue-500 text-light py-1 px-3 rounded-lg">Criar Campanha</button>
                                </div>
                            </div>
                            <div className="overflow-auto max-h-96">
                                <h4 className="font-bold my-2">Campanhas</h4>
                                {campaigns.map(c => (
                                    <div key={c.id} onClick={() => handleOpenFormModal('campaign', c)} className="bg-primary p-2 rounded mb-2 cursor-pointer hover:bg-gray-700">
                                        <div className="flex justify-between items-center"><span className="font-semibold">{c.name}</span> <span className={`text-xs px-2 py-1 rounded-full ${getStatusChip(c.status)}`}>{c.status}</span></div>
                                    </div>
                                ))}
                                <h4 className="font-bold my-2 pt-2 border-t border-primary">Cupons</h4>
                                {coupons.map(c => (
                                    <div key={c.id} onClick={() => handleOpenFormModal('coupon', c)} className="bg-primary p-2 rounded mb-2 cursor-pointer hover:bg-gray-700">
                                        <div className="flex justify-between items-center"><span className="font-semibold">{c.code}</span> <span className={`text-xs px-2 py-1 rounded-full ${getStatusChip(c.status)}`}>{c.status}</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Scheduled Posts Table */}
                        <div className="bg-secondary p-6 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Posts Agendados</h3>
                                <button onClick={() => setIsPostModalOpen(true)} className="text-sm bg-accent hover:bg-blue-500 text-light py-1 px-3 rounded-lg">Agendar Post</button>
                            </div>
                            <div className="overflow-auto max-h-96">
                                {posts.map(p => (
                                    <div key={p.id} className="bg-primary p-2 rounded mb-2">
                                        <div className="flex justify-between items-center"><span className="font-semibold">{p.title} ({p.platform})</span><span className={`text-xs px-2 py-1 rounded-full ${getStatusChip(p.status)}`}>{p.status}</span></div>
                                        <p className="text-xs text-gray-dark">Agendado para: {formatDateTimeDisplay(p.scheduledAt)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'tools' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* AI Video Generator */}
                    <div className="bg-secondary p-6 rounded-lg">
                         <h3 className="text-xl font-bold mb-4 flex items-center"><VideoIcon className="w-6 h-6 mr-2 text-accent"/>Gerador de Vídeo Promocional (IA)</h3>
                         
                         {apiKeySelected === null && <div className="text-center p-4">Verificando chave de API...</div>}
                         
                         {apiKeySelected === false && (
                            <div className="text-center bg-primary/50 p-4 rounded-lg">
                                <h4 className="font-semibold">Chave de API Necessária</h4>
                                <p className="text-sm text-gray-dark my-2">Para gerar vídeos, você precisa selecionar uma chave de API do Google AI Studio.</p>
                                <p className="text-xs text-gray-500 mb-4">
                                    Custos de uso podem ser aplicados. Consulte a <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-accent underline">documentação de preços</a>.
                                </p>
                                {apiKeyError && <p className="text-red-400 text-sm mb-4">{apiKeyError}</p>}
                                <button onClick={handleSelectApiKey} className="w-full bg-blue-600 text-light font-semibold py-2 rounded-full hover:bg-blue-500">
                                    Selecionar Chave de API
                                </button>
                            </div>
                         )}

                         {apiKeySelected === true && (
                            <div>
                                <textarea value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)} rows={3} placeholder="Ex: Um carro esportivo vermelho em alta velocidade em uma estrada deserta à noite, com neon." className="w-full bg-primary p-2 rounded border border-gray-600 mb-2"></textarea>
                                <button onClick={handleGenerateVideo} disabled={generatingVideo || !videoPrompt.trim()} className="w-full bg-accent text-light font-semibold py-2 rounded-full hover:bg-blue-500 disabled:bg-gray-600">
                                    {generatingVideo ? 'Gerando, isso pode levar alguns minutos...' : 'Gerar Vídeo'}
                                </button>
                                {apiKeyError && <p className="text-red-400 text-sm mt-2 text-center">{apiKeyError}</p>}
                                {generatedVideoUrl && <video src={generatedVideoUrl} controls className="mt-4 w-full rounded-lg"></video>}
                            </div>
                         )}
                    </div>

                    {/* AI Image Editor */}
                    <div className="bg-secondary p-6 rounded-lg">
                        <h3 className="text-xl font-bold mb-4">Editor de Imagem com IA</h3>
                        <div className="h-40 bg-primary border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center relative mb-2">
                            {selectedImage ? (
                                <img src={`data:${selectedImage.file.type};base64,${selectedImage.base64}`} alt="Preview" className="max-h-full max-w-full rounded"/>
                            ) : (
                                <div className="text-center">
                                    <UploadIcon className="w-8 h-8 mx-auto text-gray-500"/>
                                    <p className="text-gray-500 text-sm">Arraste uma imagem ou clique para enviar</p>
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={onImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                        </div>
                        <textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)} rows={2} placeholder="Ex: Adicione um logo da Viraliza.ai no canto superior direito." className="w-full bg-primary p-2 rounded border border-gray-600 mb-2"></textarea>
                        <button onClick={handleEditImage} disabled={!selectedImage || editingImage || !editPrompt.trim()} className="w-full bg-accent text-light font-semibold py-2 rounded-full hover:bg-blue-500 disabled:bg-gray-600">
                            {editingImage ? 'Editando imagem...' : 'Aplicar Edição com IA'}
                        </button>
                        {editedImage && <img src={`data:image/png;base64,${editedImage}`} alt="Edited" className="mt-4 w-full rounded-lg"/>}
                    </div>
                </div>
            )}
            
            {isFormModalOpen && <MarketingFormModal type={modalType} item={editingItem} onClose={() => setIsFormModalOpen(false)} onSave={handleSaveItem} />}
            {isPostModalOpen && <SocialPostModal onClose={() => setIsPostModalOpen(false)} onSave={handleSavePost} />}
        </>
    );
};

export default AdminMarketingPage;