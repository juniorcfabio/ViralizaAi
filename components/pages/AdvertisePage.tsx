
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AdPartner, AdPricingConfig } from '../../types';
import { addPartnerDB, getAdPricingConfig } from '../../services/dbService';
import { useNavigate } from 'react-router-dom';

// Icons
const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;

const AdvertisePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [pricing, setPricing] = useState<AdPricingConfig>(getAdPricingConfig());
    const [selectedPlan, setSelectedPlan] = useState<'1_week' | '15_days' | '30_days' | null>(null);
    
    const [formData, setFormData] = useState<Partial<AdPartner>>({
        companyName: user?.name || '',
        role: '',
        websiteUrl: '',
        phone: '',
        instagram: '',
        logo: ''
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const getPrice = (plan: '1_week' | '15_days' | '30_days') => {
        if (plan === '1_week') return pricing.oneWeek;
        if (plan === '15_days') return pricing.fifteenDays;
        return pricing.thirtyDays;
    };

    const handlePayment = async () => {
        if (!selectedPlan || !user) return;

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        if (selectedPlan === '1_week') endDate.setDate(startDate.getDate() + 7);
        if (selectedPlan === '15_days') endDate.setDate(startDate.getDate() + 15);
        if (selectedPlan === '30_days') endDate.setDate(startDate.getDate() + 30);

        const newAd: AdPartner = {
            id: `ad_${Date.now()}`,
            companyName: formData.companyName!,
            role: formData.role,
            logo: formData.logo!,
            websiteUrl: formData.websiteUrl!,
            phone: formData.phone,
            instagram: formData.instagram,
            status: 'Active',
            planType: selectedPlan,
            planStartDate: startDate.toISOString(),
            planEndDate: endDate.toISOString(),
            paymentStatus: 'Paid',
            paymentMethod: 'Credit Card (Simulated)',
            joinedDate: startDate.toISOString(),
            isMock: false,
            userId: user.id
        };

        await addPartnerDB(newAd);
        setStep(3); // Success screen
    };

    return (
        <div className="max-w-4xl mx-auto">
             <header className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-light">Anuncie no Viraliza.ai</h2>
                <p className="text-gray-dark mt-2">Destaque sua empresa na nossa página inicial e alcance milhares de visitantes diários.</p>
            </header>

            {step === 1 && (
                <div className="bg-secondary p-8 rounded-lg border border-gray-700 animate-fade-in-up">
                    <h3 className="text-xl font-bold mb-6">1. Dados do Anúncio</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                             <div className="flex justify-center mb-4">
                                <div className="relative w-32 h-32 bg-primary rounded-full overflow-hidden border-2 border-gray-600 flex items-center justify-center group cursor-pointer hover:border-accent transition-colors">
                                    {formData.logo ? (
                                        <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center">
                                            <UploadIcon className="w-8 h-8 text-gray-500 mx-auto mb-1" />
                                            <span className="text-xs text-gray-500">Upload Logo</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-dark mb-1">Nome da Empresa / Profissional</label>
                                <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full bg-primary p-3 rounded border border-gray-600 focus:border-accent focus:outline-none" placeholder="Ex: Tech Solutions" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-dark mb-1">Cargo / Slogan (Aparece abaixo do nome)</label>
                                <input type="text" value={formData.role || ''} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-primary p-3 rounded border border-gray-600 focus:border-accent focus:outline-none" placeholder="Ex: CEO & Founder" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-dark mb-1">Website (Link de Destino)</label>
                                <input type="text" placeholder="https://seusite.com.br" value={formData.websiteUrl} onChange={e => setFormData({...formData, websiteUrl: e.target.value})} className="w-full bg-primary p-3 rounded border border-gray-600 focus:border-accent focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-dark mb-1">Instagram (Opcional)</label>
                                <input type="text" placeholder="@seuinstagram" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} className="w-full bg-primary p-3 rounded border border-gray-600 focus:border-accent focus:outline-none" />
                            </div>
                             <div>
                                <label className="block text-sm text-gray-dark mb-1">WhatsApp (Opcional)</label>
                                <input type="text" placeholder="11999999999" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-primary p-3 rounded border border-gray-600 focus:border-accent focus:outline-none" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 text-right">
                        <button 
                            disabled={!formData.companyName || !formData.logo || !formData.websiteUrl}
                            onClick={() => setStep(2)} 
                            className="bg-accent text-light font-bold py-3 px-8 rounded-full hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Escolher Plano &rarr;
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="animate-fade-in-up">
                    <h3 className="text-xl font-bold mb-6 text-center">2. Escolha o Período de Exposição</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div 
                            onClick={() => setSelectedPlan('1_week')}
                            className={`bg-secondary p-6 rounded-lg border-2 cursor-pointer transition-all transform hover:-translate-y-1 ${selectedPlan === '1_week' ? 'border-accent shadow-lg shadow-accent/20' : 'border-gray-700 hover:border-gray-500'}`}
                        >
                            <h4 className="text-lg font-bold text-gray-300">1 Semana</h4>
                            <p className="text-3xl font-bold text-light mt-2">R$ {pricing.oneWeek.toFixed(2)}</p>
                            <p className="text-sm text-gray-500 mt-2">Visibilidade rápida para promoções.</p>
                        </div>
                        <div 
                            onClick={() => setSelectedPlan('15_days')}
                            className={`bg-secondary p-6 rounded-lg border-2 cursor-pointer transition-all transform hover:-translate-y-1 ${selectedPlan === '15_days' ? 'border-accent shadow-lg shadow-accent/20' : 'border-gray-700 hover:border-gray-500'}`}
                        >
                             <div className="bg-accent text-white text-xs px-2 py-1 rounded-full inline-block mb-2">Popular</div>
                            <h4 className="text-lg font-bold text-gray-300">15 Dias</h4>
                            <p className="text-3xl font-bold text-light mt-2">R$ {pricing.fifteenDays.toFixed(2)}</p>
                            <p className="text-sm text-gray-500 mt-2">Ideal para campanhas de médio prazo.</p>
                        </div>
                        <div 
                            onClick={() => setSelectedPlan('30_days')}
                            className={`bg-secondary p-6 rounded-lg border-2 cursor-pointer transition-all transform hover:-translate-y-1 ${selectedPlan === '30_days' ? 'border-accent shadow-lg shadow-accent/20' : 'border-gray-700 hover:border-gray-500'}`}
                        >
                            <h4 className="text-lg font-bold text-gray-300">30 Dias</h4>
                            <p className="text-3xl font-bold text-light mt-2">R$ {pricing.thirtyDays.toFixed(2)}</p>
                            <p className="text-sm text-gray-500 mt-2">Máxima exposição e autoridade.</p>
                        </div>
                    </div>

                    {selectedPlan && (
                        <div className="bg-primary p-6 rounded-lg border border-gray-700 text-center">
                            <p className="mb-4 text-gray-dark">Resumo: Anúncio de <strong>{formData.companyName}</strong> por <strong>{selectedPlan === '1_week' ? '7 dias' : selectedPlan === '15_days' ? '15 dias' : '30 dias'}</strong>.</p>
                            <button 
                                onClick={handlePayment} 
                                className="w-full md:w-auto bg-green-600 text-white font-bold py-3 px-12 rounded-full hover:bg-green-500 transition-colors shadow-lg shadow-green-600/20"
                            >
                                Pagar R$ {getPrice(selectedPlan).toFixed(2)} e Ativar
                            </button>
                            <p className="text-xs text-gray-500 mt-2">Pagamento seguro processado via Stripe/PayPal.</p>
                            <button onClick={() => setStep(1)} className="text-sm text-gray-400 mt-4 hover:text-white">← Voltar</button>
                        </div>
                    )}
                </div>
            )}

            {step === 3 && (
                <div className="bg-secondary p-12 rounded-lg border border-green-500/30 text-center animate-fade-in-up">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircleIcon className="w-10 h-10 text-green-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">Parabéns! Anúncio Ativado.</h3>
                    <p className="text-gray-300 max-w-md mx-auto mb-8">
                        Seu anúncio foi configurado com sucesso e já está na fila de exibição da página inicial do Viraliza.ai.
                    </p>
                    <button onClick={() => navigate('/')} className="bg-primary border border-gray-600 text-light font-semibold py-3 px-8 rounded-full hover:bg-gray-700 transition-colors">
                        Ver na Página Inicial
                    </button>
                    <br />
                    <button onClick={() => navigate('/dashboard')} className="text-accent mt-6 hover:underline">
                        Voltar ao Dashboard
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdvertisePage;
