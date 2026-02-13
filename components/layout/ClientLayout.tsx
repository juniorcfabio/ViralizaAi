import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import ClientSidebar from '../ui/ClientSidebar';
import MobileNav from '../ui/MobileNav';
import { useAuth } from '../../contexts/AuthContextFixed';
import SubscriptionGate from '../guards/SubscriptionGate';
import { supabase } from '../../src/lib/supabase';

const ClientLayout: React.FC = () => {
    const { user, updateUser } = useAuth();
    const userPlan = user?.plan?.toLowerCase();
    const hasPlan = !!userPlan && user?.type !== 'admin';
    const location = useLocation();
    const navigate = useNavigate();
    const [checkoutProcessed, setCheckoutProcessed] = useState(false);

    // Rotas que NÃO precisam de assinatura (billing, affiliate, settings)
    const freeRoutes = ['/dashboard/billing', '/dashboard/affiliate', '/dashboard/settings', '/dashboard/targeting-areas'];
    const isFreePath = freeRoutes.some(r => location.pathname === r) || location.pathname === '/dashboard';

    // === HANDLER: Checkout Success ===
    // Detecta ?checkout=success na URL após retorno do Stripe
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const checkoutStatus = params.get('checkout');
        const planSlug = params.get('plan');

        if (checkoutStatus === 'success' && !checkoutProcessed) {
            setCheckoutProcessed(true);
            console.log('✅ Checkout success detectado, plano:', planSlug);

            // Buscar subscription ativa do usuário no Supabase
            const activateFromCheckout = async () => {
                try {
                    const { data: session } = await supabase.auth.getSession();
                    const userId = session?.session?.user?.id;

                    if (userId) {
                        // Buscar subscription ativa
                        const { data: subs } = await supabase
                            .from('subscriptions')
                            .select('*, subscription_plans(*)')
                            .eq('user_id', userId)
                            .eq('status', 'active')
                            .order('created_at', { ascending: false })
                            .limit(1);

                        if (subs?.length) {
                            const activePlan = subs[0].plan_type || planSlug || 'mensal';
                            console.log('✅ Plano ativo encontrado:', activePlan);

                            // Atualizar usuário no contexto
                            if (user && updateUser) {
                                await updateUser(user.id, { plan: activePlan });
                            }

                            // Redirecionar para ferramentas
                            navigate('/dashboard/ultra-tools', { replace: true });
                            return;
                        }
                    }

                    // Se não encontrou subscription ainda (webhook pode demorar)
                    // Tentar novamente após 3 segundos
                    setTimeout(async () => {
                        const { data: session2 } = await supabase.auth.getSession();
                        const uid2 = session2?.session?.user?.id;
                        if (uid2) {
                            const { data: subs2 } = await supabase
                                .from('subscriptions')
                                .select('*')
                                .eq('user_id', uid2)
                                .eq('status', 'active')
                                .limit(1);

                            if (subs2?.length) {
                                const plan = subs2[0].plan_type || planSlug || 'mensal';
                                if (user && updateUser) {
                                    await updateUser(user.id, { plan });
                                }
                                navigate('/dashboard/ultra-tools', { replace: true });
                            } else if (planSlug) {
                                // Fallback: ativar com planSlug da URL
                                if (user && updateUser) {
                                    await updateUser(user.id, { plan: planSlug });
                                }
                                navigate('/dashboard/ultra-tools', { replace: true });
                            }
                        }
                    }, 3000);

                } catch (err) {
                    console.error('Erro ao processar checkout success:', err);
                }
            };

            activateFromCheckout();
        }
    }, [location.search, checkoutProcessed]);

    // === AUTO-REDIRECT: Novo usuário sem plano → billing ===
    useEffect(() => {
        if (user && !hasPlan && user.type !== 'admin' && location.pathname === '/dashboard') {
            navigate('/dashboard/billing', { replace: true });
        }
    }, [user, hasPlan, location.pathname]);

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
