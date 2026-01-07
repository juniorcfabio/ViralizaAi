import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/pages/LandingPage';
import AdminDashboardPageReal from './components/pages/AdminDashboardPageReal';
import AdminPaymentsPage from './components/pages/AdminPaymentsPage';
import AdminAdsPage from './components/pages/AdminAdsPage';
import AdminTrustedCompaniesPage from './components/pages/AdminTrustedCompaniesPage';
import AdminGrowthEngineConfigPage from './components/pages/AdminGrowthEngineConfigPage';
import AutonomousPromotionPage from './components/pages/AutonomousPromotionPage';
import { AuthProvider, useAuth } from './contexts/AuthContextFixed';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AdminFinancialPageReal from './components/pages/AdminFinancialPageReal';
import SocialAccountsPage from './components/pages/SocialAccountsPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import BillingPage from './components/pages/BillingPage';
import TargetingAreasPage from './components/pages/TargetingAreasPage';
import AdminUsersPage from './components/pages/AdminUsersPage';
import AdminWithdrawalsPageFixed from './components/pages/AdminWithdrawalsPageFixed';
import AdminMarketingPage from './components/pages/AdminMarketingPage';
import AdminSettingsPage from './components/pages/AdminSettingsPage';
import AffiliatePage from './components/pages/AffiliatePage';
import AffiliatePageFixed from './components/pages/AffiliatePageFixed';
import AdminAffiliatesPage from './components/pages/AdminAffiliatesPage';
import ClientLayout from './components/layout/ClientLayout';
import AdminLayout from './components/layout/AdminLayout';
import AdminMaintenancePage from './components/pages/AdminMaintenancePage';
import ViralizaAutopilotPage from './components/pages/ViralizaAutopilotPage';
import EbookGeneratorPage from './components/pages/EbookGeneratorPage';
import AIFunnelBuilderPage from './components/pages/AIFunnelBuilderPage';
import AIFunnelBuilderPageComplete from './components/pages/AIFunnelBuilderPageComplete';
import AIVideoGeneratorPage from './components/pages/AIVideoGeneratorPage';
import AdvertisePage from './components/pages/AdvertisePage';
import { getSystemVersion } from './services/dbService';
import UserGrowthEnginePage from './components/pages/UserGrowthEnginePage';
import ResetPasswordPage from './components/pages/ResetPasswordPage';
import DashboardPage from './components/pages/DashboardPage';
import RevenueProjectionPage from './components/pages/RevenueProjectionPage';
import GlobalPromotionPage from './components/pages/GlobalPromotionPage';
import ViralMarketingPage from './components/pages/ViralMarketingPage';
import AdminToolsPricingPage from './components/pages/AdminToolsPricingPage';
import TaskMonitoringPage from './components/pages/TaskMonitoringPage';
import AdminTaskMonitoringPage from './components/pages/AdminTaskMonitoringPage';
import PaymentSuccessPageUltraRobust from './components/pages/PaymentSuccessPageUltraRobust';
import GoogleOAuthCallbackPage from './components/pages/GoogleOAuthCallbackPage';
import StripeReturnHandler from './services/stripeReturnHandler';
import EmergencyPaymentFix from './services/emergencyPaymentFix';

const UpdateModal: React.FC = () => {
    const [hasUpdate, setHasUpdate] = useState(false);
    const [versionInfo, setVersionInfo] = useState<any>(null);
    const currentVersion = '1.0.0';

    useEffect(() => {
        const checkUpdate = () => {
            const latest = getSystemVersion();
            if (latest.version !== currentVersion) {
                setVersionInfo(latest);
                setHasUpdate(true);
            }
        };
        const interval = setInterval(checkUpdate, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleUpdate = () => {
        window.location.reload();
    };

    if (!hasUpdate) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
            <div className="bg-secondary p-6 rounded-xl shadow-2xl max-w-sm w-full border border-accent animate-fade-in-up">
                <h3 className="text-xl font-bold mb-2">Nova Versão Disponível! 🚀</h3>
                <p className="text-sm text-gray-dark mb-4">
                    Uma nova atualização do Viraliza.ai está pronta para instalação.
                </p>
                <div className="bg-primary p-3 rounded mb-4 text-xs text-gray-300">
                    <p className="font-bold">v{versionInfo.version}</p>
                    <p>{versionInfo.description}</p>
                </div>
                <button
                    onClick={handleUpdate}
                    className="w-full bg-accent text-light font-bold py-3 rounded-full hover:bg-blue-500"
                >
                    Baixar e Atualizar Agora
                </button>
            </div>
        </div>
    );
};

const AppRoutes: React.FC = () => {
    const { user, isLoading } = useAuth();

    console.log('🔍 AppRoutes - Estado atual:', { 
        user: user?.email, 
        userType: user?.type, 
        isLoading,
        currentPath: window.location.pathname 
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-primary">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Client Routes */}
            <Route
                path="/dashboard"
                element={user?.type === 'client' ? <ClientLayout /> : <Navigate to="/" />}
            >
                <Route index element={<DashboardPage />} />
                <Route path="social" element={<SocialAccountsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="affiliate" element={<AffiliatePageFixed />} />
                <Route path="settings" element={<TargetingAreasPage />} />
                <Route path="targeting-areas" element={<TargetingAreasPage />} />
                <Route path="growth-engine" element={<UserGrowthEnginePage />} />
                <Route path="advertise" element={<AdvertisePage />} />
                <Route path="ebook-generator" element={<EbookGeneratorPage />} />
                <Route path="ai-funnel-builder" element={<AIFunnelBuilderPageComplete />} />
                <Route path="ai-video-generator" element={<AIVideoGeneratorPage />} />
                <Route path="revenue-projection" element={<RevenueProjectionPage />} />
            </Route>

            {/* Admin Routes */}
            <Route
                path="/admin"
                element={user?.type === 'admin' ? <AdminLayout /> : <Navigate to="/" />}
            >
                <Route index element={<AdminDashboardPageReal />} />
                <Route path="financial" element={<AdminFinancialPageReal />} />
                <Route path="autonomous-promotion" element={<AutonomousPromotionPage />} />
                <Route path="payments" element={<AdminPaymentsPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="withdrawals" element={<AdminWithdrawalsPageFixed />} />
                <Route path="marketing" element={<AdminMarketingPage />} />
                <Route path="affiliates" element={<AdminAffiliatesPage />} />
                <Route path="ads" element={<AdminAdsPage />} />
                <Route path="trusted-companies" element={<AdminTrustedCompaniesPage />} />
                <Route path="growth-engine" element={<AdminGrowthEngineConfigPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="maintenance" element={<AdminMaintenancePage />} />
                <Route path="tools-pricing" element={<AdminToolsPricingPage />} />
                <Route path="autopilot" element={<ViralizaAutopilotPage />} />
                <Route path="task-monitoring" element={<AdminTaskMonitoringPage />} />
                <Route path="viral-marketing" element={<ViralMarketingPage />} />
                <Route path="global-promotion" element={<GlobalPromotionPage />} />
                <Route path="ai-video-generator" element={<AIVideoGeneratorPage />} />
                <Route path="ai-funnel-builder" element={<AIFunnelBuilderPage />} />
                <Route path="ebook-generator" element={<EbookGeneratorPage />} />
                <Route path="advertise" element={<AdvertisePage />} />
            </Route>

            {/* Payment Success Route */}
            <Route path="/payment-success" element={<PaymentSuccessPageUltraRobust />} />
            
            {/* Google OAuth Callback Route */}
            <Route path="/auth/google/callback" element={<GoogleOAuthCallbackPage />} />
            
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

const App: React.FC = () => {
    useEffect(() => {
        try {
            // Inicializar sistema de correção emergencial
            const emergencyFix = EmergencyPaymentFix.getInstance();
            console.log('🚨 Sistema de correção emergencial ativado:', emergencyFix.isSystemActive());
            
            // Inicializar interceptador de retorno do Stripe
            const stripeHandler = StripeReturnHandler.getInstance();
            stripeHandler.checkPendingReturns();
            
            // Suporte a links sem hash (ex.: tracking do e-mail remove o fragment '#').
            // Se chegar em /reset-password?token=..., reescreve para HashRouter.
            if (
                typeof window !== 'undefined' &&
                window.location.pathname.endsWith('/reset-password') &&
                !window.location.hash
            ) {
                const search = window.location.search || '';
                window.location.hash = `#/reset-password${search}`;
            }
        } catch {
            // noop
        }
    }, []);

    return (
        <AuthProvider>
            <LanguageProvider>
                <ThemeProvider>
                    <BrowserRouter>
                        <AppRoutes />
                        <UpdateModal />
                    </BrowserRouter>
                </ThemeProvider>
            </LanguageProvider>
        </AuthProvider>
    );
};

export default App;