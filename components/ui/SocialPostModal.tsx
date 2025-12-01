
import React, { useState } from 'react';
import { PostIdea, ScheduledPost, BusinessReach, LocationConfig } from '../../types';
// FIX: Import 'generatePostIdeas' which is now correctly exported from geminiService.
import { generatePostIdeas } from '../../services/geminiService';

interface SocialPostModalProps {
    onClose: () => void;
    onSave: (post: ScheduledPost) => void;
}

const SocialPostModal: React.FC<SocialPostModalProps> = ({ onClose, onSave }) => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [postIdeas, setPostIdeas] = useState<PostIdea[]>([]);
    
    // AI Form State
    const [businessInfo, setBusinessInfo] = useState('');
    const [platform, setPlatform] = useState('Instagram');
    const [toneOfVoice, setToneOfVoice] = useState('Professional');
    
    // Location State
    const [reach, setReach] = useState<BusinessReach>('National');
    const [city, setCity] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    
    // Selection & Scheduling State
    const [selectedIdea, setSelectedIdea] = useState<PostIdea | null>(null);
    const [scheduledTime, setScheduledTime] = useState('');

    const handleGenerate = async () => {
        setIsLoading(true);
        
        const locationConfig: LocationConfig = {
            reach,
            city: reach === 'Local' ? city : undefined,
            neighborhood: reach === 'Local' ? neighborhood : undefined
        };

        try {
            const ideas = await generatePostIdeas(businessInfo, platform, toneOfVoice, locationConfig);
            // Assign mock IDs to avoid issues with key props
            const ideasWithIds = ideas.map((idea, index) => ({
                ...idea,
                id: Date.now() + index,
                comments: []
            }));
            setPostIdeas(ideasWithIds);
            setStep(2);
        } catch (error) {
            console.error("Erro ao gerar ideias:", error);
            // Fallback simples caso a geração falhe
            setPostIdeas([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSchedule = () => {
        if (!selectedIdea || !scheduledTime) return;

        const scheduledPost: ScheduledPost = {
            id: `post_${Date.now()}`,
            title: selectedIdea.title,
            content: selectedIdea.content,
            platform: selectedIdea.platform,
            scheduledAt: new Date(scheduledTime).toISOString(),
            status: 'Agendado'
        };
        onSave(scheduledPost);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary p-8 rounded-lg shadow-xl w-full max-w-2xl relative max-h-[80vh] flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-gray-dark hover:text-light">&times;</button>
                <h2 className="text-2xl font-bold mb-4 text-center">Agendar Novo Post</h2>

                {step === 1 && (
                    <div className="flex flex-col space-y-4 flex-1 overflow-y-auto p-1">
                        <p className="text-gray-dark">Use nossa IA para criar conteúdo e agende sua publicação.</p>
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">Sobre o Negócio/Campanha:</label>
                            <textarea
                                rows={3}
                                value={businessInfo}
                                onChange={(e) => setBusinessInfo(e.target.value)}
                                className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                                placeholder="Ex: Promoção de verão em loja de roupas femininas, com descontos de até 50%."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-dark mb-1">Plataforma:</label>
                                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full bg-primary p-2 rounded border border-gray-600">
                                    <option>Instagram</option>
                                    <option>TikTok</option>
                                    <option>X</option>
                                    <option>YouTube</option>
                                    <option>LinkedIn</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-dark mb-1">Tom de Voz:</label>
                                <select value={toneOfVoice} onChange={(e) => setToneOfVoice(e.target.value)} className="w-full bg-primary p-2 rounded border border-gray-600">
                                    <option value="Professional">Profissional</option>
                                    <option value="Casual">Casual</option>
                                    <option value="Fun">Divertido</option>
                                    <option value="Urgent">Urgente</option>
                                </select>
                            </div>
                        </div>

                        {/* Location Configuration */}
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">Alcance de Atendimento:</label>
                            <select 
                                value={reach} 
                                onChange={(e) => setReach(e.target.value as BusinessReach)} 
                                className="w-full bg-primary p-2 rounded border border-gray-600"
                            >
                                <option value="Local">Local (Bairro/Cidade)</option>
                                <option value="National">Nacional (Brasil)</option>
                                <option value="Global">Global (Mundial)</option>
                            </select>
                            {reach === 'Local' && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <input 
                                        type="text" 
                                        placeholder="Cidade" 
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full bg-primary p-2 rounded border border-gray-600 text-sm"
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Bairro" 
                                        value={neighborhood}
                                        onChange={(e) => setNeighborhood(e.target.value)}
                                        className="w-full bg-primary p-2 rounded border border-gray-600 text-sm"
                                    />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || !businessInfo.trim()}
                            className="w-full bg-accent text-light font-semibold py-3 rounded-full hover:bg-blue-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Gerando com IA...' : 'Gerar Ideias'}
                        </button>
                    </div>
                )}
                 {step === 2 && (
                    <div className="flex flex-col space-y-4 flex-1 overflow-y-auto p-1">
                        <p className="text-gray-dark">Selecione uma das ideias geradas pela IA:</p>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {postIdeas.map(idea => (
                                <div 
                                    key={idea.id} 
                                    onClick={() => setSelectedIdea(idea)}
                                    className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${selectedIdea?.id === idea.id ? 'border-accent bg-primary' : 'border-primary hover:border-gray-600'}`}
                                >
                                    <h4 className="font-bold">{idea.title}</h4>
                                    <p className="text-sm text-gray-dark mt-1 line-clamp-2">{idea.content}</p>
                                </div>
                            ))}
                        </div>
                        
                        {selectedIdea && (
                            <div className="pt-4 border-t border-primary">
                                <label className="block text-sm text-gray-dark mb-1">Data e Hora do Agendamento:</label>
                                <input 
                                    type="datetime-local" 
                                    value={scheduledTime}
                                    onChange={e => setScheduledTime(e.target.value)}
                                    className="w-full bg-primary p-2 rounded border border-gray-600"
                                />
                            </div>
                        )}

                        <div className="flex items-center space-x-4 pt-4">
                            <button
                                onClick={() => { setStep(1); setPostIdeas([]); setSelectedIdea(null); }}
                                className="w-full bg-primary text-gray-dark font-semibold py-3 rounded-full hover:bg-gray-700 transition-colors"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleSchedule}
                                disabled={!selectedIdea || !scheduledTime}
                                className="w-full bg-accent text-light font-semibold py-3 rounded-full hover:bg-blue-500 transition-colors disabled:bg-gray-600"
                            >
                                Agendar Post
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default SocialPostModal;