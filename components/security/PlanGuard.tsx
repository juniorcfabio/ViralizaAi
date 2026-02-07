// 🛡️ COMPONENTE DE PROTEÇÃO - BLOQUEIA FERRAMENTAS SEM PLANO ATIVO
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';

interface PlanGuardProps {
  children: React.ReactNode;
  requiredPlan?: string;
  fallback?: React.ReactNode;
}

interface PlanStatus {
  hasAccess: boolean;
  user?: {
    id: string;
    plan: string;
    planStatus: string;
    expiresAt: string;
  };
  planDetails?: {
    name: string;
    features: string[];
    limits: any;
  };
  reason?: string;
  message?: string;
}

const PlanGuard: React.FC<PlanGuardProps> = ({ 
  children, 
  requiredPlan, 
  fallback 
}) => {
  const { user } = useAuth();
  const [planStatus, setPlanStatus] = useState<PlanStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkUserPlan();
  }, [user]);

  const checkUserPlan = async () => {
    if (!user?.id) {
      setLoading(false);
      setPlanStatus({ hasAccess: false, reason: 'NO_USER' });
      return;
    }

    try {
      console.log('🔍 Verificando plano do usuário:', user.id);

      const response = await fetch('/api/check-user-plan', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        }
      });

      const data = await response.json();

      if (response.ok && data.hasAccess) {
        console.log('✅ Usuário tem acesso:', data.user.plan);
        setPlanStatus(data);
      } else {
        console.log('❌ Usuário sem acesso:', data.reason);
        setPlanStatus(data);
      }

    } catch (err) {
      console.error('🚨 Erro ao verificar plano:', err);
      setError('Erro ao verificar plano');
      setPlanStatus({ hasAccess: false, reason: 'ERROR' });
    } finally {
      setLoading(false);
    }
  };

  // 🔄 LOADING
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Verificando seu plano...</span>
      </div>
    );
  }

  // 🚨 ERRO
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 text-2xl mb-2">⚠️</div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Erro de Verificação</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button 
          onClick={checkUserPlan}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  // ❌ SEM ACESSO
  if (!planStatus?.hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <div className="text-yellow-600 text-4xl mb-4">🔒</div>
        <h3 className="text-xl font-bold text-yellow-800 mb-2">Acesso Restrito</h3>
        
        {planStatus.reason === 'NO_USER' && (
          <p className="text-yellow-700 mb-4">
            Você precisa estar logado para acessar esta ferramenta.
          </p>
        )}
        
        {planStatus.reason === 'USER_NOT_FOUND' && (
          <p className="text-yellow-700 mb-4">
            Usuário não encontrado no sistema. Entre em contato com o suporte.
          </p>
        )}
        
        {planStatus.reason === 'PLAN_INACTIVE' && (
          <div className="text-yellow-700 mb-4">
            <p className="mb-2">Seu plano está inativo.</p>
            <p className="text-sm">Faça um pagamento para ativar e acessar todas as ferramentas.</p>
          </div>
        )}
        
        {planStatus.reason === 'PLAN_EXPIRED' && (
          <div className="text-yellow-700 mb-4">
            <p className="mb-2">Seu plano expirou.</p>
            <p className="text-sm">Renove sua assinatura para continuar usando as ferramentas.</p>
          </div>
        )}

        <div className="space-y-2">
          <button 
            onClick={() => window.location.href = '/pricing'}
            className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 mr-2"
          >
            Ver Planos
          </button>
          <button 
            onClick={checkUserPlan}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Verificar Novamente
          </button>
        </div>
      </div>
    );
  }

  // ✅ ACESSO LIBERADO
  console.log('🔓 Acesso liberado para ferramenta');
  return (
    <div>
      {/* 📊 INFORMAÇÕES DO PLANO (OPCIONAL) */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-green-600 mr-2">✅</span>
            <span className="text-green-800 font-semibold">
              {planStatus.planDetails?.name} Ativo
            </span>
          </div>
          <div className="text-green-600 text-xs">
            Expira: {new Date(planStatus.user!.expiresAt).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>

      {/* 🔓 CONTEÚDO PROTEGIDO */}
      {children}
    </div>
  );
};

export default PlanGuard;
