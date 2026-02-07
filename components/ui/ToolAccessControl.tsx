import React from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { FeatureKey } from '../../types';
import { hasToolAccess, TOOL_DESCRIPTIONS } from '../../data/plansConfig';

interface ToolAccessControlProps {
  toolKey: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeMessage?: boolean;
}

const ToolAccessControl: React.FC<ToolAccessControlProps> = ({
  toolKey,
  children,
  fallback,
  showUpgradeMessage = true
}) => {
  const { user } = useAuth();

  if (!user) {
    return fallback || null;
  }

  // Admin sempre tem acesso
  if (user.type === 'admin') {
    return <>{children}</>;
  }

  const hasAccess = hasToolAccess(user.plan, toolKey, user.addOns, user.type, user.trialStartDate);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (!showUpgradeMessage) {
    return fallback || null;
  }

  const toolInfo = TOOL_DESCRIPTIONS[toolKey];

  return (
    <div className="bg-secondary/50 border border-accent/30 rounded-lg p-6 text-center">
      <div className="mb-4">
        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-light mb-2">
          {toolInfo?.name || 'Ferramenta Premium'}
        </h3>
        <p className="text-gray-300 mb-4">
          {toolInfo?.description || 'Esta ferramenta está disponível apenas em planos superiores.'}
        </p>
      </div>
      
      <div className="bg-primary/50 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-300 mb-2">Valor individual:</p>
        <p className="text-2xl font-bold text-accent">
          R$ {toolInfo?.value || 0}
        </p>
      </div>

      <button
        onClick={() => window.location.href = '/billing'}
        className="w-full bg-accent hover:bg-accent/80 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        Fazer Upgrade do Plano
      </button>
      
      <p className="text-xs text-gray-400 mt-3">
        Incluso nos planos superiores sem custo adicional
      </p>
    </div>
  );
};

export default ToolAccessControl;
