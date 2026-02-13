import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContextFixed';
import { hasRouteAccess } from '../guards/SubscriptionGate';

// Icons
const LayoutGridIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const BarChart3Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>;
const CreditCardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const MoreHorizontalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>;

const MobileNav: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useAuth();

    const navClass = ({ isActive }: { isActive: boolean }) => 
        `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-accent' : 'text-gray-dark'}`;

    const lockedClass = 'flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-700 opacity-40';

    const canSocial = hasRouteAccess('/dashboard/social', user?.plan, user?.type);
    const canAnalytics = hasRouteAccess('/dashboard/analytics', user?.plan, user?.type);

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-secondary border-t border-primary h-16 z-50 flex items-center justify-around px-2 pb-safe">
            <NavLink to="/dashboard" end className={navClass}>
                <LayoutGridIcon className="w-6 h-6" />
                <span className="text-[10px] font-medium">{t('sidebar.dashboard')}</span>
            </NavLink>
            {canSocial ? (
                <NavLink to="/dashboard/social" className={navClass}>
                    <UsersIcon className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Social</span>
                </NavLink>
            ) : (
                <div className={lockedClass}>
                    <UsersIcon className="w-6 h-6" />
                    <span className="text-[10px] font-medium">🔒</span>
                </div>
            )}
            <div className="relative -top-5">
                <NavLink to="/dashboard/billing" className="flex items-center justify-center w-14 h-14 rounded-full bg-accent text-white shadow-lg border-4 border-primary">
                    <CreditCardIcon className="w-7 h-7" />
                </NavLink>
            </div>
            {canAnalytics ? (
                <NavLink to="/dashboard/analytics" className={navClass}>
                    <BarChart3Icon className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Dados</span>
                </NavLink>
            ) : (
                <div className={lockedClass}>
                    <BarChart3Icon className="w-6 h-6" />
                    <span className="text-[10px] font-medium">🔒</span>
                </div>
            )}
            <NavLink to="/dashboard/settings" className={navClass}>
                <MoreHorizontalIcon className="w-6 h-6" />
                <span className="text-[10px] font-medium">Menu</span>
            </NavLink>
        </div>
    );
};

export default MobileNav;
