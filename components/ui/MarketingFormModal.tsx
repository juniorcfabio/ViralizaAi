
import React, { useState, useEffect } from 'react';
import { Campaign, Coupon, CampaignStatus, CouponStatus } from '../../types';

interface MarketingFormModalProps {
    type: 'campaign' | 'coupon';
    item?: Campaign | Coupon | null;
    onClose: () => void;
    onSave: (data: any) => void;
}

const MarketingFormModal: React.FC<MarketingFormModalProps> = ({ type, item, onClose, onSave }) => {
    const [formData, setFormData] = useState<any>({
        name: '',
        code: '',
        budget: '',
        discount: '',
        status: type === 'campaign' ? 'Planejada' : 'Agendado',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        if (item) {
            setFormData({
                ...item,
                // Ensure datetime-local format (YYYY-MM-DDTHH:mm)
                startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 16) : '',
                endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 16) : ''
            });
        }
    }, [item]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Auto-calculate status based on schedule
        const now = new Date();
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        
        let newStatus;
        if (now < start) {
            newStatus = type === 'campaign' ? 'Planejada' : 'Agendado';
        } else if (now > end) {
            newStatus = type === 'campaign' ? 'Concluída' : 'Expirado';
        } else {
            newStatus = type === 'campaign' ? 'Ativa' : 'Ativo';
        }

        // Preserve manual 'Pausada' status if set manually during edit and time valid
        if (item && item.status === 'Pausada' && newStatus === 'Ativa') {
             newStatus = 'Pausada';
        }
        
        onSave({
            ...formData,
            status: newStatus,
            // If budget/discount are numeric string, convert them
            budget: formData.budget ? Number(formData.budget) : undefined,
            startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
            endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary p-8 rounded-lg shadow-xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-gray-dark hover:text-light">&times;</button>
                <h2 className="text-2xl font-bold mb-6 text-center">
                    {item ? `Editar ${type === 'campaign' ? 'Campanha' : 'Cupom'}` : `Adicionar ${type === 'campaign' ? 'Campanha' : 'Cupom'}`}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {type === 'campaign' ? (
                        <>
                            <div>
                                <label className="block text-sm text-gray-dark mb-1">Nome da Campanha</label>
                                <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-dark mb-1">Orçamento (R$)</label>
                                <input type="number" name="budget" value={formData.budget || ''} onChange={handleChange} required className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm text-gray-dark mb-1">Código do Cupom</label>
                                <input type="text" name="code" value={formData.code || ''} onChange={handleChange} required className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-dark mb-1">Desconto (ex: 10% ou Frete Grátis)</label>
                                <input type="text" name="discount" value={formData.discount || ''} onChange={handleChange} required className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">Data Início</label>
                            <input 
                                type="datetime-local" 
                                name="startDate" 
                                value={formData.startDate} 
                                onChange={handleChange} 
                                required 
                                className="w-full bg-primary p-2 rounded border border-gray-600 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">Data Fim</label>
                            <input 
                                type="datetime-local" 
                                name="endDate" 
                                value={formData.endDate} 
                                onChange={handleChange} 
                                required 
                                className="w-full bg-primary p-2 rounded border border-gray-600 text-sm"
                            />
                        </div>
                    </div>

                    {type === 'campaign' && (
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-primary p-2 rounded border border-gray-600">
                                <option value="Ativa">Ativa</option>
                                <option value="Pausada">Pausada</option>
                                <option value="Planejada">Planejada</option>
                                <option value="Concluída">Concluída</option>
                            </select>
                             <p className="text-xs text-gray-500 mt-1">*O status será atualizado automaticamente com base nas datas.</p>
                        </div>
                    )}
                    
                     {type === 'coupon' && (
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-primary p-2 rounded border border-gray-600">
                                <option value="Ativo">Ativo</option>
                                <option value="Expirado">Expirado</option>
                                <option value="Agendado">Agendado</option>
                            </select>
                             <p className="text-xs text-gray-500 mt-1">*O status será atualizado automaticamente com base nas datas.</p>
                        </div>
                    )}

                    <button type="submit" className="w-full bg-accent text-light font-semibold py-3 mt-4 rounded-full hover:bg-blue-500 transition-colors">
                        Salvar Agendamento
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MarketingFormModal;
