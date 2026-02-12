// =======================
// 🧾 INTEGRAÇÃO DOS TERMOS DE USO NO SISTEMA
// =======================

import React, { useState } from 'react';
import TermsOfService from './TermsOfService';

interface TermsIntegrationProps {
  onAccept: () => void;
  onDecline: () => void;
  showModal?: boolean;
}

const TermsIntegration: React.FC<TermsIntegrationProps> = ({ 
  onAccept, 
  onDecline, 
  showModal = true 
}) => {
  const [accepted, setAccepted] = useState(false);
  const [hasRead, setHasRead] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isNearBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 100;
    if (isNearBottom && !hasRead) {
      setHasRead(true);
    }
  };

  const handleAccept = () => {
    if (!hasRead) {
      alert('Por favor, leia todos os termos antes de aceitar.');
      return;
    }
    
    // Salvar aceitação no localStorage
    const acceptanceData = {
      accepted: true,
      timestamp: new Date().toISOString(),
      version: '1.0',
      ip: 'user-ip', // Em produção, capturar IP real
      userAgent: navigator.userAgent
    };
    
    localStorage.setItem('viralizaai_terms_acceptance', JSON.stringify(acceptanceData));
    // SYNC COM SUPABASE
    import('../../src/lib/supabase').then(({ supabase }) => {
      supabase.from('activity_logs').insert({ action: 'terms_accepted', details: acceptanceData, created_at: new Date().toISOString() }).then(() => {});
    });
    setAccepted(true);
    onAccept();
  };

  if (!showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold mb-2">📋 Termos de Uso - ViralizaAI</h2>
          <p className="text-blue-100">
            Leia atentamente nossos termos antes de continuar
          </p>
        </div>

        {/* Conteúdo dos Termos */}
        <div 
          className="flex-1 overflow-y-auto p-6"
          onScroll={handleScroll}
        >
          <TermsOfService />
          
          {/* Indicador de Leitura */}
          {!hasRead && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <div className="animate-pulse text-yellow-600 mr-3">📖</div>
                <p className="text-yellow-800">
                  <strong>Role até o final</strong> para ler todos os termos e habilitar o botão de aceitar.
                </p>
              </div>
            </div>
          )}

          {/* Confirmação de Leitura */}
          {hasRead && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-green-600 mr-3">✅</div>
                <p className="text-green-800">
                  <strong>Termos lidos completamente.</strong> Agora você pode aceitar ou recusar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer com Ações */}
        <div className="border-t border-gray-200 p-6">
          
          {/* Checkbox de Confirmação */}
          <div className="mb-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                disabled={!hasRead}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <span className={`text-sm ${!hasRead ? 'text-gray-400' : 'text-gray-700'}`}>
                Eu li e aceito os <strong>Termos de Uso</strong>, <strong>Política de Privacidade</strong> e 
                <strong> Limitações de Responsabilidade</strong> da plataforma ViralizaAI. 
                Entendo que o uso de automação é por minha conta e risco, e que a plataforma 
                não se responsabiliza por bloqueios ou suspensões em redes sociais.
              </span>
            </label>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-between space-x-4">
            <button
              onClick={onDecline}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ❌ Recusar e Sair
            </button>
            
            <button
              onClick={handleAccept}
              disabled={!hasRead || !accepted}
              className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                hasRead && accepted
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              ✅ Aceitar e Continuar
            </button>
          </div>

          {/* Informações Legais */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>
              Ao aceitar, você concorda com o processamento de seus dados conforme nossa Política de Privacidade.
              <br />
              Versão dos Termos: 1.0 | Última atualização: Janeiro 2024
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook para verificar aceitação dos termos
export const useTermsAcceptance = () => {
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);

  React.useEffect(() => {
    const checkTermsAcceptance = () => {
      try {
        const acceptance = localStorage.getItem('viralizaai_terms_acceptance');
        if (acceptance) {
          const data = JSON.parse(acceptance);
          // Verificar se a aceitação ainda é válida (ex: não expirou)
          const acceptanceDate = new Date(data.timestamp);
          const now = new Date();
          const daysSinceAcceptance = (now.getTime() - acceptanceDate.getTime()) / (1000 * 60 * 60 * 24);
          
          // Termos válidos por 365 dias
          if (daysSinceAcceptance < 365 && data.accepted) {
            setTermsAccepted(true);
          } else {
            setTermsAccepted(false);
            localStorage.removeItem('viralizaai_terms_acceptance');
          }
        } else {
          setTermsAccepted(false);
        }
      } catch (error) {
        console.error('Erro ao verificar aceitação dos termos:', error);
        setTermsAccepted(false);
      }
    };

    checkTermsAcceptance();
  }, []);

  const acceptTerms = () => {
    setTermsAccepted(true);
  };

  const resetTerms = () => {
    localStorage.removeItem('viralizaai_terms_acceptance');
    setTermsAccepted(false);
  };

  return {
    termsAccepted,
    acceptTerms,
    resetTerms
  };
};

export default TermsIntegration;
