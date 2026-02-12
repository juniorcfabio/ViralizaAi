import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { FeatureKey } from '../../types';
import { hasToolAccess, TOOL_DESCRIPTIONS } from '../../data/plansConfig';

interface ToolAccessControlProps {
  toolKey: FeatureKey;
  toolName?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeMessage?: boolean;
}

const ToolAccessControl: React.FC<ToolAccessControlProps> = ({
  toolKey,
  toolName,
  children,
  fallback,
  showUpgradeMessage = true
}) => {
  const { user } = useAuth();
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAccess = async () => {
      if (!user) {
        if (mounted) { setAccessGranted(false); setChecking(false); }
        return;
      }

      // Admin sempre tem acesso
      if (user.type === 'admin') {
        if (mounted) { setAccessGranted(true); setChecking(false); }
        return;
      }

      // 1. VERIFICAR NO SUPABASE (fonte primária)
      try {
        const { supabase } = await import('../../services/autoSupabaseIntegration');
        const nameToCheck = toolName || toolKey;

        const { data, error } = await supabase
          .from('user_access')
          .select('id, valid_until, is_active')
          .eq('user_id', user.id)
          .eq('tool_name', nameToCheck)
          .eq('is_active', true)
          .maybeSingle();

        if (!error && data) {
          // Verificar expiração
          if (data.valid_until && new Date(data.valid_until) < new Date()) {
            if (mounted) { setAccessGranted(false); setChecking(false); }
            return;
          }
          if (mounted) { setAccessGranted(true); setChecking(false); }
          return;
        }
      } catch {
        // Supabase indisponível, fallback abaixo
      }

      // 2. FALLBACK: verificação local (plansConfig)
      const localAccess = hasToolAccess(user.plan, toolKey, user.addOns, user.type, user.trialStartDate);
      if (mounted) { setAccessGranted(localAccess); setChecking(false); }
    };

    checkAccess();

    return () => { mounted = false; };
  }, [user, toolKey, toolName]);

  // Loading state
  if (checking) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return fallback ? <>{fallback}</> : null;
  }

  if (accessGranted) {
    return <>{children}</>;
  }

  if (!showUpgradeMessage) {
    return fallback ? <>{fallback}</> : null;
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
          {toolInfo?.description || 'Esta ferramenta requer pagamento confirmado para acesso.'}
        </p>
      </div>
      
      <div className="bg-primary/50 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-300 mb-2">Valor individual:</p>
        <p className="text-2xl font-bold text-accent">
          R$ {toolInfo?.value || 0}
        </p>
      </div>

      <button
        onClick={() => window.location.href = '/dashboard/billing'}
        className="w-full bg-accent hover:bg-accent/80 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        Ver Planos e Liberar Acesso
      </button>
      
      <p className="text-xs text-gray-400 mt-3">
        Incluso nos planos superiores sem custo adicional
      </p>
    </div>
  );
};

export default ToolAccessControl;
