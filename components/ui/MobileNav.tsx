
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

// Icons
const LayoutGridIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const BarChart3Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>;
const RocketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.09-3.1a2.47 2.47 0 0 0-3.46-.22c-.44.22-.66.66-.77 1.12z"/><path d="m12 15-3-3a2.47 2.47 0 0 0-3.5 0c-.44.44-.66 1.03-.77 1.57"/><path d="m9 12 3 3"/><path d="M11.6 7.8c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.09-3.1a2.47 2.47 0 0 0-3.46-.22c-.44.22-.66.66-.77 1.12z"/><path d="m19.5 4.5-3-3a2.47 2.47 0 0 0-3.5 0c-.44.44-.66 1.03-.77 1.57"/><path d="m16.5 7.5 3 3"/></svg>;
const MoreHorizontalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>;

const MobileNav: React.FC = () => {
    const { t } = useLanguage();

    const navClass = ({ isActive }: { isActive: boolean }) => 
        `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-accent' : 'text-gray-dark'}`;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-secondary border-t border-primary h-16 z-50 flex items-center justify-around px-2 pb-safe">
            <NavLink to="/dashboard" end className={navClass}>
                <LayoutGridIcon className="w-6 h-6" />
                <span className="text-[10px] font-medium">{t('sidebar.dashboard')}</span>
            </NavLink>
            <NavLink to="/dashboard/autopilot" className={navClass}>
                <RocketIcon className="w-6 h-6" />
                <span className="text-[10px] font-medium">Auto</span>
            </NavLink>
            <div className="relative -top-5">
                <NavLink to="/dashboard" className="flex items-center justify-center w-14 h-14 rounded-full bg-accent text-white shadow-lg border-4 border-primary">
                    <img src="https://img.icons8.com/fluency/48/artificial-intelligence.png" alt="AI" className="w-8 h-8" />
                </NavLink>
            </div>
            <NavLink to="/dashboard/analytics" className={navClass}>
                <BarChart3Icon className="w-6 h-6" />
                <span className="text-[10px] font-medium">Dados</span>
            </NavLink>
            <NavLink to="/dashboard/settings" className={navClass}>
                <MoreHorizontalIcon className="w-6 h-6" />
                <span className="text-[10px] font-medium">Menu</span>
            </NavLink>
        </div>
    );
};

export default MobileNav;
