import React from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';

interface AccessControlProps {
  children: React.ReactNode;
  requiredTool: string;
  planRequired?: string;
  fallbackComponent?: React.ReactNode;
}

const AccessControl: React.FC<AccessControlProps> = ({
  children,
  requiredTool,
  planRequired,
  fallbackComponent
}) => {
  const { user, hasToolAccess, getPlanPermissions, isSubscriptionActive } = useAuth();

  // 🔒 VERIFICAÇÕES DE SEGURANÇA TOTAL
  
  // 1. Usuário não logado
  if (!user) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-bold text-red-800 mb-2">Acesso Negado</h3>
        <p className="text-red-700 mb-4">Você precisa estar logado para acessar esta ferramenta.</p>
        <button 
          onClick={() => window.location.href = '#/login'}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
        >
          Fazer Login
        </button>
      </div>
    );
  }

  // 2. Admin tem acesso total
  if (user.type === 'admin') {
    return <>{children}</>;
  }

  // 3. Verificar se tem assinatura ativa
  if (!isSubscriptionActive()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-yellow-800 mb-2">Assinatura Necessária</h3>
        <p className="text-yellow-700 mb-4">
          Você precisa de uma assinatura ativa para acessar esta ferramenta.
        </p>
        <button 
          onClick={() => window.location.href = '#/pricing'}
          className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700"
        >
          Ver Planos
        </button>
      </div>
    );
  }

  // 4. Verificar acesso específico à ferramenta
  if (!hasToolAccess(requiredTool)) {
    const permissions = getPlanPermissions();
    const currentPlan = user.plan || 'nenhum';
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 text-6xl mb-4">🚫</div>
        <h3 className="text-xl font-bold text-red-800 mb-2">Ferramenta Bloqueada</h3>
        <p className="text-red-700 mb-2">
          Esta ferramenta não está disponível no seu plano atual: <strong>{currentPlan.toUpperCase()}</strong>
        </p>
        <p className="text-red-600 text-sm mb-4">
          Ferramenta requerida: <code className="bg-red-100 px-2 py-1 rounded">{requiredTool}</code>
        </p>
        
        {permissions && (
          <div className="bg-white border border-red-200 rounded p-4 mb-4 text-left">
            <p className="font-semibold text-red-800 mb-2">🔓 Suas ferramentas disponíveis:</p>
            <ul className="text-sm text-red-700 space-y-1">
              {permissions.tools.map((tool: string, index: number) => (
                <li key={index}>✓ {tool}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="space-y-2">
          <button 
            onClick={() => window.location.href = '#/pricing'}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 w-full"
          >
            Fazer Upgrade do Plano
          </button>
          <p className="text-xs text-red-600">
            Acesso liberado APENAS após confirmação de pagamento
          </p>
        </div>
      </div>
    );
  }

  // 5. Verificar plano específico se requerido
  if (planRequired && user.plan !== planRequired) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
        <div className="text-orange-600 text-6xl mb-4">⬆️</div>
        <h3 className="text-xl font-bold text-orange-800 mb-2">Upgrade Necessário</h3>
        <p className="text-orange-700 mb-4">
          Esta ferramenta requer o plano <strong>{planRequired.toUpperCase()}</strong> ou superior.
        </p>
        <p className="text-orange-600 text-sm mb-4">
          Seu plano atual: <strong>{user.plan?.toUpperCase() || 'NENHUM'}</strong>
        </p>
        <button 
          onClick={() => window.location.href = '#/pricing'}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
        >
          Fazer Upgrade
        </button>
      </div>
    );
  }

  // ✅ ACESSO LIBERADO
  return <>{children}</>;
};

export default AccessControl;
