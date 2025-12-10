import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

// Icon
const BellIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
);
const ServerCogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M5 12H3V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8h-2" />
        <path d="M3 12a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M21 12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);
const RocketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.09-3.1a2.47 2.47 0 0 0-3.46-.22c-.44.22-.66.66-.77 1.12z" />
        <path d="m12 15-3-3a2.47 2.47 0 0 0-3.5 0c-.44.44-.66 1.03-.77 1.57" />
        <path d="m9 12 3 3" />
        <path d="M11.6 7.8c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.09-3.1a2.47 2.47 0 0 0-3.46-.22c-.44.22-.66.66-.77 1.12z" />
        <path d="m19.5 4.5-3-3a2.47 2.47 0 0 0-3.5 0c-.44.44-.66 1.03-.77 1.57" />
        <path d="m16.5 7.5 3 3" />
    </svg>
);
const MegaphoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="m3 11 18-5v12L3 14v-3z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
);
const BriefcaseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
);

const mockNotifications = [
    { id: 1, text: 'Novo usuário "Empresa Beta" cadastrado.', time: '5 min atrás' },
    { id: 2, text: 'Pagamento de R$ 399,90 recebido de "Loja Top".', time: '28 min atrás' },
    { id: 3, text: 'Plano "Influencer Digital" foi atualizado para Anual.', time: '2 horas atrás' },
    { id: 4, text: 'Novo usuário "Café Aconchego" cadastrado.', time: '5 horas atrás' }
];

const AdminSidebar: React.FC = () => {
    const { logout } = useAuth();
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
            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target as Node)
            ) {
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

    return (
        <aside className="w-64 bg-secondary p-6 hidden md:flex flex-col justify-between">
            <div>
                <div className="mb-10 relative" ref={notificationRef}>
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-light">Viraliza.ai [Admin]</h1>
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
                                    <div
                                        key={notification.id}
                                        className="p-3 hover:bg-secondary/50"
                                    >
                                        <p className="text-sm text-gray-light break-words">
                                            {notification.text}
                                        </p>
                                        <p className="text-xs text-gray-dark mt-1">
                                            {notification.time}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="p-2 bg-primary rounded-b-lg text-center">
                                <a
                                    href="#"
                                    className="text-sm text-accent hover:underline"
                                >
                                    Ver todas as notificações
                                </a>
                            </div>
                        </div>
                    )}
                </div>
                <nav className="space-y-2">
                    <NavLink to="/admin" end className={navLinkClasses}>
                        <span>{t('sidebar.dashboard')}</span>
                    </NavLink>
                    <NavLink to="/admin/users" className={navLinkClasses}>
                        <span>{t('sidebar.admin_users')}</span>
                    </NavLink>
                    <NavLink to="/admin/financial" className={navLinkClasses}>
                        <span>{t('sidebar.admin_financial')}</span>
                    </NavLink>
                    <NavLink to="/admin/payments" className={navLinkClasses}>
                        <span>{t('sidebar.admin_payments')}</span>
                    </NavLink>
                    <NavLink to="/admin/marketing" className={navLinkClasses}>
                        <span>{t('sidebar.admin_marketing')}</span>
                    </NavLink>
                    <NavLink to="/admin/affiliates" className={navLinkClasses}>
                        <span>{t('sidebar.affiliate')}</span>
                    </NavLink>
                    <NavLink to="/admin/ads" className={navLinkClasses}>
                        <MegaphoneIcon className="w-5 h-5" />
                        <span>{t('sidebar.admin_ads')}</span>
                    </NavLink>
                    <NavLink to="/admin/trusted-companies" className={navLinkClasses}>
                        <BriefcaseIcon className="w-5 h-5" />
                        <span>Empresas Parceiras</span>
                    </NavLink>
                    <NavLink to="/admin/growth-engine" className={navLinkClasses}>
                        <RocketIcon className="w-5 h-5" />
                        <span>Motor de Crescimento</span>
                    </NavLink>
                    <NavLink to="/admin/settings" className={navLinkClasses}>
                        <span>{t('sidebar.settings')}</span>
                    </NavLink>
                    <div className="pt-2 mt-2 border-t border-primary/50">
                        <NavLink to="/admin/maintenance" className={navLinkClasses}>
                            <ServerCogIcon className="w-5 h-5" />
                            <span>{t('sidebar.admin_maintenance')}</span>
                        </NavLink>
                        <NavLink to="/admin/autopilot" className={navLinkClasses}>
                            <RocketIcon className="w-5 h-5" />
                            <span>{t('sidebar.admin_autopilot')}</span>
                        </NavLink>
                    </div>
                </nav>
            </div>
            <button
                onClick={handleLogout}
                className="w-full bg-red-600 text-light font-semibold py-2 px-4 rounded-full hover:bg-red-500 transition-colors"
            >
                {t('sidebar.logout')}
            </button>
        </aside>
    );
};

export default AdminSidebar;