
import React, { useState, useEffect, useRef } from 'react';
import { AdPartner, AdPricingConfig } from '../../types';
import { getRealPartnersDB, addPartnerDB, updatePartnerDB, deletePartnerDB, getAdPricingConfig, updateAdPricingConfig } from '../../services/dbService';

// Icons
const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const DollarSignIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;

const AdPartnerModal: React.FC<{ partner: AdPartner | null, onClose: () => void, onSave: () => void }> = ({ partner, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<AdPartner>>({
        companyName: '',
        role: '',
        websiteUrl: '',
        phone: '',
        instagram: '',
        status: 'Active',
        planType: 'Monthly',
        logo: ''
    });
    const [previewLogo, setPreviewLogo] = useState<string>('');

    useEffect(() => {
        if (partner) {
            setFormData(partner);
            setPreviewLogo(partner.logo);
        }
    }, [partner]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setFormData({ ...formData, logo: base64 });
                setPreviewLogo(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.companyName || !formData.logo || !formData.websiteUrl) {
            alert('Nome, Logo e Site são obrigatórios.');
            return;
        }

        const partnerData = {
            ...formData,
            id: partner ? partner.id : `ad_${Date.now()}`,
            joinedDate: partner ? partner.joinedDate : new Date().toISOString(),
            isMock: false, // Manually added ads are real
        } as AdPartner;

        if (partner) {
            await updatePartnerDB(partnerData);
        } else {
            await addPartnerDB(partnerData);
        }
        onSave();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary p-8 rounded-lg shadow-xl w-full max-w-lg relative border border-gray-700">
                <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-gray-dark hover:text-light">&times;</button>
                <h2 className="text-2xl font-bold mb-6 text-center">{partner ? 'Editar Parceiro' : 'Novo Parceiro'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-center mb-4">
                        <div className="relative w-24 h-24 bg-primary rounded-full overflow-hidden border-2 border-gray-600 flex items-center justify-center group cursor-pointer">
                            {previewLogo ? (
                                <img src={previewLogo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <UploadIcon className="w-8 h-8 text-gray-500" />
                            )}
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm text-gray-dark mb-1">Nome da Empresa</label>
                        <input required type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                    
                    <div>
                        <label className="block text-sm text-gray-dark mb-1">Cargo / Slogan</label>
                        <input type="text" name="role" value={formData.role || ''} onChange={handleChange} className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Ex: Fundador"/>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">Website (URL)</label>
                            <input required type="text" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} placeholder="https://..." className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">Instagram</label>
                            <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="@usuario" className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">Telefone / WhatsApp</label>
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-primary p-2 rounded border border-gray-600">
                                <option value="Active">Ativo</option>
                                <option value="Inactive">Inativo</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                         <label className="block text-sm text-gray-dark mb-1">Plano de Duração</label>
                         <select name="planType" value={formData.planType} onChange={handleChange} className="w-full bg-primary p-2 rounded border border-gray-600">
                            <option value="1_week">1 Semana</option>
                            <option value="15_days">15 Dias</option>
                            <option value="30_days">30 Dias</option>
                            <option value="Monthly">Mensal (Recorrente)</option>
                        </select>
                    </div>

                    <button type="submit" className="w-full bg-accent text-light font-semibold py-3 mt-4 rounded-full hover:bg-blue-500 transition-colors">
                        Salvar Parceiro
                    </button>
                </form>
            </div>
        </div>
    );
};

const AdminAdsPage: React.FC = () => {
    const [partners, setPartners] = useState<AdPartner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<AdPartner | null>(null);
    const [pricingConfig, setPricingConfig] = useState<AdPricingConfig>({ oneWeek: 0, fifteenDays: 0, thirtyDays: 0 });
    const [notification, setNotification] = useState('');

    const loadPartners = async () => {
        setIsLoading(true);
        // Only fetch real partners for admin management
        const data = await getRealPartnersDB();
        setPartners(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadPartners();
        setPricingConfig(getAdPricingConfig());
    }, []);

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja remover este parceiro?')) {
            await deletePartnerDB(id);
            loadPartners();
        }
    };

    const handleEdit = (partner: AdPartner) => {
        setEditingPartner(partner);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingPartner(null);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        setIsModalOpen(false);
        loadPartners();
    };
    
    const handlePricingChange = (key: keyof AdPricingConfig, value: string) => {
        setPricingConfig({ ...pricingConfig, [key]: parseFloat(value) });
    };

    const handleSavePricing = () => {
        updateAdPricingConfig(pricingConfig);
        showNotification('Preços dos anúncios atualizados com sucesso!');
    };

    return (
        <>
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold">Gestão de Publicidade</h2>
                    <p className="text-gray-dark">Gerencie os parceiros e configure os preços dos anúncios.</p>
                </div>
                <button onClick={handleAdd} className="bg-accent text-light font-semibold py-2 px-4 rounded-full hover:bg-blue-500 transition-colors flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Novo Parceiro
                </button>
            </header>

             {notification && (
                <div className="bg-green-500 bg-opacity-20 text-green-300 p-3 rounded-lg mb-6 text-center">
                    {notification}
                </div>
            )}
            
            {/* Pricing Configuration Section */}
            <div className="bg-secondary p-6 rounded-lg mb-8 border border-accent/20">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><DollarSignIcon className="w-5 h-5 text-accent"/> Configuração de Planos de Anúncio</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm text-gray-dark mb-1">1 Semana (R$)</label>
                        <input 
                            type="number" 
                            value={pricingConfig.oneWeek} 
                            onChange={(e) => handlePricingChange('oneWeek', e.target.value)} 
                            className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-dark mb-1">15 Dias (R$)</label>
                        <input 
                            type="number" 
                            value={pricingConfig.fifteenDays} 
                            onChange={(e) => handlePricingChange('fifteenDays', e.target.value)} 
                            className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-dark mb-1">30 Dias (R$)</label>
                        <input 
                            type="number" 
                            value={pricingConfig.thirtyDays} 
                            onChange={(e) => handlePricingChange('thirtyDays', e.target.value)} 
                            className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                    <div>
                        <button onClick={handleSavePricing} className="w-full bg-primary text-accent border border-accent font-semibold py-2 rounded hover:bg-accent hover:text-light transition-colors">
                            Atualizar Preços
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-secondary p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Parceiros Cadastrados</h3>
                {isLoading ? (
                    <div className="text-center p-8">Carregando...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-primary text-gray-dark text-sm uppercase">
                                <tr>
                                    <th className="p-4">Empresa</th>
                                    <th className="p-4">Plano</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Pagamento</th>
                                    <th className="p-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {partners.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center p-8 text-gray-dark">Nenhum parceiro real cadastrado. (Apenas mocks visíveis na home)</td>
                                    </tr>
                                )}
                                {partners.map(partner => (
                                    <tr key={partner.id} className="border-b border-primary hover:bg-primary/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={partner.logo} alt={partner.companyName} className="w-10 h-10 rounded-full object-cover bg-white" />
                                                <div>
                                                    <p className="font-bold">{partner.companyName}</p>
                                                    {partner.role && <p className="text-xs text-gray-dark">{partner.role}</p>}
                                                    <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">{partner.websiteUrl}</a>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm">
                                            {partner.planType === '1_week' ? '1 Semana' : 
                                             partner.planType === '15_days' ? '15 Dias' : 
                                             partner.planType === '30_days' ? '30 Dias' : 'Mensal'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${partner.status === 'Active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                                {partner.status === 'Active' ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-dark">
                                             {partner.paymentStatus === 'Paid' ? <span className="text-green-400">Pago</span> : <span className="text-yellow-400">Pendente</span>}
                                             <div className="text-xs">{partner.paymentMethod}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleEdit(partner)} className="text-blue-400 hover:text-blue-300 mr-3"><EditIcon className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(partner.id)} className="text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && <AdPartnerModal partner={editingPartner} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
        </>
    );
};

export default AdminAdsPage;
