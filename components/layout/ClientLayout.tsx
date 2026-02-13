import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import ClientSidebar from '../ui/ClientSidebar';
import MobileNav from '../ui/MobileNav';
import { useAuth } from '../../contexts/AuthContextFixed';
import SubscriptionGate from '../guards/SubscriptionGate';

const ClientLayout: React.FC = () => {
    const { user } = useAuth();
    const userPlan = user?.plan?.toLowerCase();
    const hasPlan = !!userPlan && user?.type !== 'admin';
    const location = useLocation();

    // Rotas que NÃO precisam de assinatura (billing, affiliate, settings)
    const freeRoutes = ['/dashboard/billing', '/dashboard/affiliate', '/dashboard/settings', '/dashboard/targeting-areas'];
    const isFreePath = freeRoutes.some(r => location.pathname === r) || location.pathname === '/dashboard';

    return (
        <div className="flex h-screen bg-primary text-light flex-col md:flex-row">
            <ClientSidebar />
            
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Banner: sem assinatura */}
                {!hasPlan && user?.type !== 'admin' && (
                    <div className="bg-red-500/10 border-b border-red-500/30 p-3 text-center backdrop-blur-md z-40">
                        <p className="text-xs sm:text-sm text-red-200 font-medium flex items-center justify-center gap-2 flex-wrap">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <span className="text-center">Você precisa de uma assinatura ativa para acessar as ferramentas.</span>
                            <Link to="/dashboard/billing" className="underline font-bold hover:text-white">Escolher Plano</Link>
                        </p>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto relative pb-20 md:pb-0">
                    <main className="p-3 sm:p-4 md:p-6 lg:p-10">
                        <div className="flex-1 overflow-y-auto scroll-smooth" style={{scrollBehavior: 'smooth'}}>
                            {isFreePath || user?.type === 'admin' ? (
                                <Outlet />
                            ) : (
                                <SubscriptionGate>
                                    <Outlet />
                                </SubscriptionGate>
                            )}
                        </div>
                    </main>
                </div>
            </div>
            <MobileNav />
        </div>
    );
};

export default ClientLayout;
