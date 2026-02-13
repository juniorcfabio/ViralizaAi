import React, { useState, useRef, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextFixed';
import { useLanguage } from '../../contexts/LanguageContext';
import { hasRouteAccess, getPlanNamePt } from '../guards/SubscriptionGate';
import Logo from './Logo';

// Icons for navigation
const LayoutGridIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const BarChart3Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);

const CreditCardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const GiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

const RocketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    viewBox="0 0 24 24"
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

const BookOpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const BrainIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
    <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
    <path d="M6 18a4 4 0 0 1-1.967-.516" />
    <path d="M19.967 17.484A4 4 0 0 1 18 18" />
  </svg>
);

const VideoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="m22 8-6 4 6 4V8Z" />
    <rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
  </svg>
);

const SocialMediaIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const ViralIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

interface NavItem {
  path: string;
  labelKey: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  end?: boolean;
}

const navItems: NavItem[] = [
  { path: '/dashboard', labelKey: 'sidebar.dashboard', icon: LayoutGridIcon, end: true },
  { path: '/dashboard/ultra-tools', labelKey: 'sidebar.ultraTools', icon: RocketIcon },
  { path: '/dashboard/social', labelKey: 'sidebar.social', icon: UsersIcon },
  { path: '/dashboard/social-media-tools', labelKey: 'sidebar.socialMediaTools', icon: SocialMediaIcon },
  { path: '/dashboard/analytics', labelKey: 'sidebar.analytics', icon: BarChart3Icon },
  { path: '/dashboard/growth-engine', labelKey: 'sidebar.growthEngine', icon: RocketIcon },
  { path: '/dashboard/ebook-generator', labelKey: 'sidebar.ebookGenerator', icon: BookOpenIcon },
  { path: '/dashboard/ai-funnel-builder', labelKey: 'sidebar.aiFunnelBuilder', icon: BrainIcon },
  { path: '/dashboard/ai-video-generator', labelKey: 'sidebar.aiVideoGenerator', icon: VideoIcon },
  { path: '/dashboard/advertise', labelKey: 'sidebar.advertise', icon: MegaphoneIcon },
  { path: '/dashboard/viral-analyzer', labelKey: 'sidebar.viralAnalyzer', icon: ViralIcon },
  { path: '/dashboard/billing', labelKey: 'sidebar.billing', icon: CreditCardIcon },
  { path: '/dashboard/affiliate', labelKey: 'sidebar.affiliate', icon: GiftIcon },
  { path: '/dashboard/settings', labelKey: 'sidebar.settings', icon: SettingsIcon }
];

const ClientSidebar: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState('');

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUser(user.id, { avatar: reader.result as string });
        showNotification('Foto atualizada!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtrar itens de navegação com base no plano do usuário
  const filteredNavItems = useMemo(() => {
    return navItems.map(item => ({
      ...item,
      locked: !hasRouteAccess(item.path, user?.plan, user?.type)
    }));
  }, [user?.plan, user?.type]);

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center p-3 rounded-lg transition-colors space-x-3 ${
      isActive
        ? 'bg-accent text-light shadow-lg shadow-accent/30'
        : 'hover:bg-primary text-gray-dark hover:text-light'
    }`;

  return (
    <aside className="w-64 bg-secondary p-6 hidden md:flex flex-col justify-between border-r border-primary">
      <div>
        {/* Nome, Email e Foto na primeira linha */}
        <div className="mb-6 border-b border-primary/50 pb-4">
          <div className="flex items-center gap-3 mb-4 relative">
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarChange}
              className="hidden"
              accept="image/*"
            />
            <button
              onClick={handleAvatarClick}
              className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-light ring-2 ring-primary overflow-hidden relative group cursor-pointer animate-pulse-ring"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name.charAt(0).toUpperCase()}</span>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all">
                <span className="text-white text-xs opacity-0 group-hover:opacity-100">
                  {t('sidebar.change_photo')}
                </span>
              </div>
            </button>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate text-light">{user?.name}</p>
              <p className="text-xs text-gray-dark truncate">{user?.email}</p>
            </div>
            {notification && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full animate-fade-in-right whitespace-nowrap">
                {notification}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-light">Painel</h1>
          {user?.plan && (
            <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-bold uppercase">
              {getPlanNamePt(user.plan)}
            </span>
          )}
        </div>

        <nav className="space-y-2">
          {filteredNavItems.map(({ path, labelKey, icon: Icon, end, locked }) => (
            locked ? (
              <div key={path} className="flex items-center p-3 rounded-lg text-gray-600 cursor-not-allowed space-x-3 opacity-40" title="Faça upgrade para acessar">
                <Icon className="w-5 h-5" />
                <span className="font-semibold text-sm">{t(labelKey)}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
            ) : (
              <NavLink key={path} to={path} end={end} className={navLinkClasses}>
                <Icon className="w-5 h-5" />
                <span className="font-semibold">{t(labelKey)}</span>
              </NavLink>
            )
          ))}
        </nav>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-light font-semibold py-2 px-4 rounded-full hover:bg-red-500 transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  );
};

export default ClientSidebar;