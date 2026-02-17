import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextFixed';
import { useLanguage } from '../../contexts/LanguageContext';

// Icons
const BellIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
);

const ServerCogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12H3V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8h-2" />
        <path d="M3 12a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M21 12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const RocketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.09-3.1a2.47 2.47 0 0 0-3.46-.22c-.44.22-.66.66-.77 1.12z" />
        <path d="m12 15-3-3a2.47 2.47 0 0 0-3.5 0c-.44.44-.66 1.03-.77 1.57" />
        <path d="m9 12 3 3" />
    </svg>
);

const MegaphoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 11 18-5v12L3 14v-3z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
);

const BriefcaseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
);

const ShieldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
);

const mockNotifications = [
    { id: 1, text: 'Novo usuário "Empresa Beta" cadastrado.', time: '5 min atrás' },
    { id: 2, text: 'Pagamento de R$ 399,90 recebido de "Loja Top".', time: '28 min atrás' },
    { id: 3, text: 'Plano "Influencer Digital" foi atualizado para Anual.', time: '2 horas atrás' },
    { id: 4, text: 'Novo usuário "Café Aconchego" cadastrado.', time: '5 horas atrás' }
];

interface AdminSidebarProps {
    onClose?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onClose }) => {
    const { logout, user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `flex items-center p-3 rounded-lg transition-colors space-x-3 ${
            isActive ? 'bg-accent text-light' : 'hover:bg-primary text-gray-dark hover:text-light'
        }`;

    const handleNavClick = () => {
        if (onClose) {
            onClose();
        }
    };

    return (
        <aside className="w-64 bg-secondary p-4 sm:p-6 flex flex-col justify-between h-full overflow-y-auto">
            {/* Close button for mobile */}
            <div className="lg:hidden flex justify-end mb-4">
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white p-2"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div>
                {/* Informações do Usuário no Topo */}
                <div className="mb-6 border-b border-primary/50 pb-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-light">
                            <span>{user?.name?.charAt(0)?.toUpperCase() || 'J'}</span>
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-semibold text-sm truncate text-light">{user?.name || 'Junior Viralizaai'}</p>
                            <p className="text-xs text-gray-dark truncate">{user?.email || 'juniorviralizaai@gmail.com'}</p>
                        </div>
                        <button className="text-gray-dark hover:text-light transition-colors ml-auto">
                            <span className="text-xs">📷</span>
                        </button>
                    </div>
                </div>

                <div className="mb-10 relative" ref={notificationRef}>
                    <div className="flex justify-between items-center">
                        <h1 className="text-xl font-bold text-light">Painel Administrativo</h1>
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className="relative text-gray-dark hover:text-light transition-colors"
                        >
                            <BellIcon className="w-6 h-6" />
                            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-secondary"></span>
                        </button>
                    </div>
                    {isNotificationsOpen && (
                        <div className="absolute top-full right-0 mt-2 w-full bg-primary rounded-lg shadow-xl z-20 border border-gray-700">
                            <div className="p-3 border-b border-secondary">
                                <h4 className="font-semibold">Notificações</h4>
                            </div>
                            <div className="divide-y divide-secondary max-h-80 overflow-y-auto">
                                {mockNotifications.map((notification) => (
                                    <div key={notification.id} className="p-3 hover:bg-secondary/50">
                                        <p className="text-sm text-gray-light break-words">{notification.text}</p>
                                        <p className="text-xs text-gray-dark mt-1">{notification.time}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="p-2 bg-primary rounded-b-lg text-center">
                                <a href="#" className="text-sm text-accent hover:underline">Ver todas as notificações</a>
                            </div>
                        </div>
                    )}
                </div>

                <nav className="space-y-1">
                    {/* PAINEL PRINCIPAL */}
                    <NavLink to="/admin" end className={navLinkClasses} onClick={handleNavClick}>
                        <span className="text-lg">📊</span>
                        <span className="font-medium">Dashboard</span>
                    </NavLink>
                    
                    {/* GESTÃO DE USUÁRIOS */}
                    <div className="pt-3">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">Gestão de Usuários</h3>
                        <NavLink to="/admin/users" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">👥</span>
                            <span className="font-medium">Usuários</span>
                        </NavLink>
                        <NavLink to="/admin/affiliates" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">🤝</span>
                            <span className="font-medium">Afiliados</span>
                        </NavLink>
                    </div>

                    {/* ULTRA IMPÉRIO - SISTEMA COMPLETO */}
                    <div className="pt-3">
                        <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 px-3">👑 Ultra Império</h3>
                        <NavLink to="/admin/marketplace" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">🛒</span>
                            <span className="font-medium">Marketplace de Ferramentas</span>
                        </NavLink>
                        <NavLink to="/admin/franchise-system" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">🏢</span>
                            <span className="font-medium">Sistema de Franquias</span>
                        </NavLink>
                        <NavLink to="/admin/whitelabel-system" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">🎨</span>
                            <span className="font-medium">White-Label Automático</span>
                        </NavLink>
                        <NavLink to="/admin/global-api" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">🌍</span>
                            <span className="font-medium">API Global</span>
                        </NavLink>
                        <NavLink to="/admin/ai-tool-creator" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">🤖</span>
                            <span className="font-medium">IA Criadora de Ferramentas</span>
                        </NavLink>
                        <NavLink to="/admin/ai-support" className={navLinkClasses}>
                            <span className="text-lg mr-3">🎧</span>
                            <span>IA de Suporte 24h</span>
                        </NavLink>
                    </div>

                    {/* CENTRO DE COMANDO SUPREMO */}
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 px-3">
                            🚀 Centro de Comando
                        </h3>
                        <div className="space-y-1">
                            <NavLink to="/admin/command-center" className={navLinkClasses}>
                                <span className="text-lg mr-3">🎛️</span>
                                <span>Centro de Comando</span>
                            </NavLink>
                        </div>
                    </div>

                    {/* MARKETING E PROMOÇÃO */}
                    <div className="pt-3">
                        <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2 px-3">Marketing & Promoção</h3>
                        <NavLink to="/admin/autonomous-promotion" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">⚡</span>
                            <span className="font-medium">Promoção Autônoma 24/7</span>
                        </NavLink>
                        <NavLink to="/admin/viral-marketing" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">📈</span>
                            <span className="font-medium">Marketing Viral Gratuito</span>
                        </NavLink>
                        <NavLink to="/admin/global-promotion" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">🌍</span>
                            <span className="font-medium">Promoção Global</span>
                        </NavLink>
                        <NavLink to="/admin/ads" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">📢</span>
                            <span className="font-medium">Gestão de Anúncios</span>
                        </NavLink>
                    </div>

                    {/* FINANCEIRO */}
                    <div className="pt-3">
                        <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2 px-3">Financeiro</h3>
                        <NavLink to="/admin/financial" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">💰</span>
                            <span className="font-medium">Relatórios Financeiros</span>
                        </NavLink>
                        <NavLink to="/admin/payments" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">💳</span>
                            <span className="font-medium">Pagamentos</span>
                        </NavLink>
                        <NavLink to="/admin/pix-approvals" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">✅</span>
                            <span className="font-medium">Aprovar PIX</span>
                        </NavLink>
                        <NavLink to="/admin/tools-pricing" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">🏷️</span>
                            <span className="font-medium">Gerenciar Preços</span>
                        </NavLink>
                        <NavLink to="/admin/openai-costs" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">🧠</span>
                            <span className="font-medium">Custos OpenAI</span>
                        </NavLink>
                        <NavLink to="/admin/withdrawals" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">🏦</span>
                            <span className="font-medium">Gerenciar Saques</span>
                        </NavLink>
                    </div>

                    {/* SISTEMA */}
                    <div className="pt-3">
                        <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2 px-3">Sistema</h3>
                        <NavLink to="/admin/task-monitoring" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">🤖</span>
                            <span className="font-medium">Monitor Ultra-Avançado</span>
                        </NavLink>
                        <NavLink to="/admin/maintenance" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">🔧</span>
                            <span className="font-medium">Manutenção</span>
                        </NavLink>
                        <NavLink to="/admin/settings" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">⚙️</span>
                            <span className="font-medium">Configurações</span>
                        </NavLink>
                    </div>

                    {/* PARCERIAS */}
                    <div className="pt-3">
                        <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2 px-3">Parcerias</h3>
                        <NavLink to="/admin/trusted-companies" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">🏢</span>
                            <span className="font-medium">Empresas Parceiras</span>
                        </NavLink>
                        <NavLink to="/admin/advertise" className={navLinkClasses} onClick={handleNavClick}>
                            <span className="text-lg">📺</span>
                            <span className="font-medium">Anuncie no Viraliza.ai</span>
                        </NavLink>
                    </div>
                </nav>
            </div>
            
            <button
                onClick={handleLogout}
                className="w-full bg-red-600 text-light font-semibold py-2 px-4 rounded-full hover:bg-red-500 transition-colors"
            >
                Sair
            </button>
        </aside>
    );
};

export default AdminSidebar;
