import { useAuth } from '../contexts/AuthContextFixed';

export interface AccessResult {
  hasAccess: boolean;
  reason?: string;
  requiredPlan?: string;
  currentPlan?: string;
  availableTools?: string[];
}

export const useAccessControl = () => {
  const { user, hasToolAccess, getPlanPermissions, isSubscriptionActive } = useAuth();

  const checkToolAccess = (toolName: string): AccessResult => {
    // 1. Usuário não logado
    if (!user) {
      return {
        hasAccess: false,
        reason: 'Usuário não autenticado',
        currentPlan: 'nenhum'
      };
    }

    // 2. Admin tem acesso total
    if (user.type === 'admin') {
      return {
        hasAccess: true,
        currentPlan: 'admin'
      };
    }

    // 3. Verificar assinatura ativa
    if (!isSubscriptionActive()) {
      return {
        hasAccess: false,
        reason: 'Assinatura inativa ou expirada',
        currentPlan: user.plan || 'nenhum'
      };
    }

    // 4. Verificar acesso específico
    const hasAccess = hasToolAccess(toolName);
    const permissions = getPlanPermissions();

    if (!hasAccess) {
      return {
        hasAccess: false,
        reason: `Ferramenta '${toolName}' não disponível no plano atual`,
        currentPlan: user.plan || 'nenhum',
        availableTools: permissions?.tools || []
      };
    }

    // ✅ Acesso liberado
    return {
      hasAccess: true,
      currentPlan: user.plan || 'nenhum',
      availableTools: permissions?.tools || []
    };
  };

  const checkPlanAccess = (requiredPlan: string): AccessResult => {
    if (!user) {
      return {
        hasAccess: false,
        reason: 'Usuário não autenticado'
      };
    }

    if (user.type === 'admin') {
      return { hasAccess: true };
    }

    const planHierarchy = ['mensal', 'trimestral', 'semestral', 'anual'];
    const currentPlanIndex = planHierarchy.indexOf(user.plan?.toLowerCase() || '');
    const requiredPlanIndex = planHierarchy.indexOf(requiredPlan.toLowerCase());

    if (currentPlanIndex < requiredPlanIndex) {
      return {
        hasAccess: false,
        reason: `Plano ${requiredPlan.toUpperCase()} ou superior necessário`,
        requiredPlan: requiredPlan,
        currentPlan: user.plan || 'nenhum'
      };
    }

    return {
      hasAccess: true,
      currentPlan: user.plan || 'nenhum'
    };
  };

  const getBlockedMessage = (result: AccessResult): string => {
    if (!result.hasAccess) {
      switch (result.reason) {
        case 'Usuário não autenticado':
          return '🔒 Faça login para acessar esta ferramenta';
        case 'Assinatura inativa ou expirada':
          return '⚠️ Assinatura necessária para acessar esta ferramenta';
        default:
          return `🚫 ${result.reason}`;
      }
    }
    return '';
  };

  return {
    checkToolAccess,
    checkPlanAccess,
    getBlockedMessage,
    user,
    isAuthenticated: !!user,
    isAdmin: user?.type === 'admin',
    currentPlan: user?.plan || 'nenhum',
    hasActiveSubscription: isSubscriptionActive()
  };
};

export default useAccessControl;
