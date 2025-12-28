
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ServiceAreaSelector from '../ui/ServiceAreaSelector';
import { addTestimonialDB } from '../../services/dbService';
import { Testimonial } from '../../types';

// Icons
const StarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;

const SettingsPage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
    const [password, setPassword] = useState({ current: '', new: '', confirm: '' });
    const [notifications, setNotifications] = useState({ weeklyReports: true, newFeatures: true });
    const [notification, setNotification] = useState('');
    
    // Review State
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword({ ...password, [e.target.name]: e.target.value });
    };

    const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNotifications({ ...notifications, [e.target.name]: e.target.checked });
    };

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };
    
    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (user) {
            updateUser(user.id, { name: profile.name, email: profile.email });
            showNotification('Perfil atualizado com sucesso!');
        }
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password.new !== password.confirm) {
            alert("A nova senha e a confirmação não coincidem.");
            return;
        }
        if (user && password.new) {
            updateUser(user.id, { password: password.new });
            showNotification('Senha alterada com sucesso!');
            setPassword({ current: '', new: '', confirm: '' });
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !reviewText.trim()) return;

        const testimonial: Testimonial = {
            name: user.name,
            role: 'Membro',
            company: 'Viraliza.ai User',
            avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`,
            text: reviewText,
            rating: rating
        };

        await addTestimonialDB(testimonial);
        setReviewSubmitted(true);
        showNotification('Obrigado! Seu depoimento foi enviado e aparecerá na página inicial.');
    };


    return (
        <>
            <header className="mb-8">
                <h2 className="text-3xl font-bold">Configurações</h2>
                <p className="text-gray-dark">Gerencie as informações da sua conta.</p>
            </header>

            {notification && (
                <div className="bg-green-500 bg-opacity-20 text-green-300 p-3 rounded-lg mb-6 text-center">
                    {notification}
                </div>
            )}
            
            <div className="space-y-8 max-w-2xl">
                {/* Profile Settings */}
                <div className="bg-secondary p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Perfil</h3>
                    <form className="space-y-4" onSubmit={handleProfileSubmit}>
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">Nome</label>
                            <input type="text" name="name" value={profile.name} onChange={handleProfileChange} className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">Email</label>
                            <input type="email" name="email" value={profile.email} onChange={handleProfileChange} className="w-full bg-primary p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                        <div className="text-right">
                            <button type="submit" className="bg-accent text-light font-semibold py-2 px-6 rounded-full hover:bg-blue-500 transition-colors">Salvar Perfil</button>
                        </div>
                    </form>
                </div>
                
                 {/* Rate Us Module */}
                <div className="bg-secondary p-6 rounded-lg border border-accent/20">
                    <h3 className="text-xl font-bold mb-2 text-accent">Avalie nossa Plataforma</h3>
                    <p className="text-sm text-gray-dark mb-4">Sua opinião é muito importante! Seu depoimento aparecerá na nossa página principal.</p>
                    
                    {!reviewSubmitted ? (
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`text-2xl transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
                                    >
                                        ★
                                    </button>
                                ))}
                                <span className="text-sm text-gray-400 ml-2">({rating} estrelas)</span>
                            </div>
                            
                            <textarea
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                placeholder="Conte sua experiência com o Viraliza.ai..."
                                className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent h-24"
                                required
                            />
                            
                            <div className="text-right">
                                <button type="submit" className="bg-green-600 text-light font-semibold py-2 px-6 rounded-full hover:bg-green-500 transition-colors shadow-lg shadow-green-600/20">
                                    Enviar Avaliação
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="bg-green-500/20 p-4 rounded-lg text-center text-green-300">
                            <p className="font-bold">Obrigado pela sua avaliação!</p>
                            <p className="text-sm mt-1">Você ajuda a construir uma comunidade mais forte.</p>
                        </div>
                    )}
                </div>

                {/* Password Settings */}
                <div className="bg-secondary p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Alterar Senha</h3>
                    <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">Senha Atual</label>
                            <input type="password" name="current" value={password.current} onChange={handlePasswordChange} className="w-full bg-primary p-2 rounded border border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-dark mb-1">Nova Senha</label>
                            <input type="password" name="new" value={password.new} onChange={handlePasswordChange} className="w-full bg-primary p-2 rounded border border-gray-600" />
                        </div>
                         <div>
                            <label className="block text-sm text-gray-dark mb-1">Confirmar Nova Senha</label>
                            <input type="password" name="confirm" value={password.confirm} onChange={handlePasswordChange} className="w-full bg-primary p-2 rounded border border-gray-600" />
                        </div>
                        <div className="text-right">
                            <button type="submit" className="bg-accent text-light font-semibold py-2 px-6 rounded-full hover:bg-blue-500 transition-colors">Alterar Senha</button>
                        </div>
                    </form>
                </div>

                {/* Notification Settings */}
                <div className="bg-secondary p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Notificações por E-mail</h3>
                    <div className="space-y-3">
                        <label className="flex items-center">
                            <input type="checkbox" name="weeklyReports" checked={notifications.weeklyReports} onChange={handleNotificationChange} className="h-4 w-4 rounded bg-primary border-gray-600 text-accent focus:ring-accent" />
                            <span className="ml-3 text-gray-dark">Receber relatórios semanais de desempenho.</span>
                        </label>
                        <label className="flex items-center">
                            <input type="checkbox" name="newFeatures" checked={notifications.newFeatures} onChange={handleNotificationChange} className="h-4 w-4 rounded bg-primary border-gray-600 text-accent focus:ring-accent" />
                            <span className="ml-3 text-gray-dark">Ser notificado sobre novas funcionalidades e atualizações.</span>
                        </label>
                    </div>
                     <div className="text-right mt-4">
                        <button onClick={() => showNotification('Preferências de notificação salvas!')} className="bg-accent text-light font-semibold py-2 px-6 rounded-full hover:bg-blue-500 transition-colors">Salvar Preferências</button>
                    </div>
                </div>
            </div>

            {/* Área de Atendimento */}
            <ServiceAreaSelector />
        </>
    );
};

export default SettingsPage;
