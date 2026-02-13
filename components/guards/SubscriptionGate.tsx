import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextFixed';

// ─── MAPEAMENTO DE ROTAS → PLANO MÍNIMO ───
// 'any' = qualquer plano ativo basta
// 'mensal','trimestral','semestral','anual' = plano mínimo necessário
// Rotas não listadas aqui requerem 'any' por padrão.

export const PLAN_HIERARCHY: Record<string, number> = {
  mensal: 1,
  trimestral: 2,
  semestral: 3,
  anual: 4,
};

export type PlanLevel = 'any' | 'mensal' | 'trimestral' | 'semestral' | 'anual';

export interface RoutePermission {
  path: string;
  requiredPlan: PlanLevel;
  label: string;
}

// Todas as rotas do dashboard com seu plano mínimo
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Sempre acessível (qualquer plano)
  { path: '/dashboard',              requiredPlan: 'any',         label: 'Dashboard' },
  { path: '/dashboard/billing',      requiredPlan: 'any',         label: 'Faturamento' },
  { path: '/dashboard/affiliate',    requiredPlan: 'any',         label: 'Afiliados' },
  { path: '/dashboard/settings',     requiredPlan: 'any',         label: 'Configurações' },
  { path: '/dashboard/targeting-areas', requiredPlan: 'any',      label: 'Configurações' },

  // Mensal
  { path: '/dashboard/social',             requiredPlan: 'mensal',      label: 'Contas Sociais' },
  { path: '/dashboard/ebook-generator',    requiredPlan: 'mensal',      label: 'Gerador de Ebook' },
  { path: '/dashboard/ultra-tools',        requiredPlan: 'mensal',      label: 'Ferramentas' },
  { path: '/dashboard/qr-generator',       requiredPlan: 'mensal',      label: 'Gerador QR Code' },

  // Trimestral
  { path: '/dashboard/analytics',           requiredPlan: 'trimestral',  label: 'Analytics' },
  { path: '/dashboard/social-media-tools',  requiredPlan: 'trimestral',  label: 'Mídia Social' },

  // Semestral
  { path: '/dashboard/ai-video-generator',  requiredPlan: 'semestral',   label: 'Gerador de Vídeo IA' },
  { path: '/dashboard/viral-analyzer',      requiredPlan: 'semestral',   label: 'Analisador Viral' },

  // Anual
  { path: '/dashboard/growth-engine',       requiredPlan: 'anual',       label: 'Motor de Crescimento' },
  { path: '/dashboard/ai-funnel-builder',   requiredPlan: 'anual',       label: 'Funil de Vendas IA' },
  { path: '/dashboard/advertise',           requiredPlan: 'anual',       label: 'Publicidade' },
  { path: '/dashboard/revenue-projection',  requiredPlan: 'anual',       label: 'Projeção de Receita' },
];

// ─── UTILIDADES ───

export function getUserPlanLevel(userPlan?: string): number {
  if (!userPlan) return 0;
  return PLAN_HIERARCHY[userPlan.toLowerCase()] || 0;
}

export function hasRouteAccess(routePath: string, userPlan?: string, userType?: string): boolean {
  if (userType === 'admin') return true;
  if (!userPlan) return false;

  const perm = ROUTE_PERMISSIONS.find(r => r.path === routePath);
  if (!perm) return getUserPlanLevel(userPlan) > 0; // rota desconhecida → qualquer plano
  if (perm.requiredPlan === 'any') return getUserPlanLevel(userPlan) > 0;

  return getUserPlanLevel(userPlan) >= (PLAN_HIERARCHY[perm.requiredPlan] || 0);
}

export function getAccessibleRoutes(userPlan?: string, userType?: string): RoutePermission[] {
  if (userType === 'admin') return ROUTE_PERMISSIONS;
  if (!userPlan) return [];

  const level = getUserPlanLevel(userPlan);
  return ROUTE_PERMISSIONS.filter(r => {
    if (r.requiredPlan === 'any') return true;
    return level >= (PLAN_HIERARCHY[r.requiredPlan] || 0);
  });
}

export function getPlanNamePt(plan: string): string {
  const names: Record<string, string> = {
    mensal: 'Mensal',
    trimestral: 'Trimestral',
    semestral: 'Semestral',
    anual: 'Anual',
  };
  return names[plan.toLowerCase()] || plan;
}

// ─── COMPONENTE: Gate de Assinatura ───
// Redireciona para /pricing se o usuário não tiver assinatura ativa

const SubscriptionGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/" replace />;
  if (user.type === 'admin') return <>{children}</>;

  const userPlan = user.plan?.toLowerCase();

  // Sem plano → redirecionar para página de planos
  if (!userPlan) {
    return <NoSubscriptionPage />;
  }

  // Verificar se a rota atual é permitida para o plano do usuário
  const currentPath = location.pathname;
  const isAllowed = hasRouteAccess(currentPath, userPlan, user.type);

  if (!isAllowed) {
    return <UpgradeRequiredPage currentPlan={userPlan} requiredPath={currentPath} />;
  }

  return <>{children}</>;
};

// ─── Página: Sem Assinatura ───

const NoSubscriptionPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center max-w-lg mx-auto p-8">
        <div className="text-6xl mb-6">🔒</div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Assinatura Necessária
        </h2>
        <p className="text-gray-400 mb-6">
          Para acessar as ferramentas do Viraliza.ai, você precisa de uma assinatura ativa.
          Escolha o plano ideal para o seu negócio.
        </p>
        <div className="space-y-3">
          <a
            href="/dashboard/billing"
            className="block w-full bg-accent text-white font-bold py-3 px-6 rounded-full hover:bg-blue-500 transition-colors"
          >
            Ver Planos e Assinar
          </a>
          <a
            href="/"
            className="block w-full bg-gray-700 text-gray-300 font-semibold py-3 px-6 rounded-full hover:bg-gray-600 transition-colors"
          >
            Voltar para Início
          </a>
        </div>
      </div>
    </div>
  );
};

// ─── Página: Upgrade Necessário ───

const UpgradeRequiredPage: React.FC<{ currentPlan: string; requiredPath: string }> = ({ currentPlan, requiredPath }) => {
  const perm = ROUTE_PERMISSIONS.find(r => r.path === requiredPath);
  const requiredPlan = perm?.requiredPlan || 'anual';

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center max-w-lg mx-auto p-8">
        <div className="text-6xl mb-6">⬆️</div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Upgrade Necessário
        </h2>
        <p className="text-gray-400 mb-2">
          A ferramenta <strong className="text-white">{perm?.label || 'solicitada'}</strong> requer
          o plano <strong className="text-accent">{getPlanNamePt(requiredPlan as string)}</strong> ou superior.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Seu plano atual: <span className="text-yellow-400 font-semibold">{getPlanNamePt(currentPlan)}</span>
        </p>
        <div className="space-y-3">
          <a
            href="/dashboard/billing"
            className="block w-full bg-accent text-white font-bold py-3 px-6 rounded-full hover:bg-blue-500 transition-colors"
          >
            Fazer Upgrade Agora
          </a>
          <a
            href="/dashboard"
            className="block w-full bg-gray-700 text-gray-300 font-semibold py-3 px-6 rounded-full hover:bg-gray-600 transition-colors"
          >
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionGate;
