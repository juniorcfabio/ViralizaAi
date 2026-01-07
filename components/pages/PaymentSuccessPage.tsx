import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const PaymentSuccessPage: React.FC = () => {
  const { user, login } = useAuth();
  const [isActivating, setIsActivating] = useState(true);
  const [activationComplete, setActivationComplete] = useState(false);

  useEffect(() => {
    const activateToolAndRedirect = async () => {
      try {
        // Obter parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        const sessionId = urlParams.get('session_id');
        const tool = urlParams.get('tool');
        
        console.log('🎉 Página de sucesso do pagamento carregada');
        console.log('👤 UserId:', userId);
        console.log('💳 SessionId:', sessionId);
        console.log('🛠️ Tool:', tool);
        
        if (userId) {
          // Buscar dados do usuário existente ou criar novo
          let userData = null;
          const savedUser = localStorage.getItem('viraliza_ai_active_user_v1');
          
          if (savedUser) {
            try {
              userData = JSON.parse(savedUser);
              console.log('👤 Usuário encontrado no localStorage:', userData);
            } catch (e) {
              console.log('❌ Erro ao parsear usuário salvo, criando novo');
              userData = null;
            }
          }
          
          // Se não há usuário salvo, criar um novo
          if (!userData) {
            userData = {
              id: userId,
              email: `user-${userId}@viralizaai.com`,
              name: 'Usuário ViralizaAI',
              type: 'client',
              plan: 'free',
              isActive: true,
              addOns: [],
              purchasedTools: {},
              createdAt: new Date().toISOString(),
              // Dados essenciais para manter sessão
              authToken: `token_${userId}_${Date.now()}`,
              sessionActive: true
            };
            console.log('👤 Novo usuário criado:', userData);
          }
          
          // Garantir que o usuário tenha ID correto
          userData.id = userId;
          userData.sessionActive = true;
          userData.authToken = userData.authToken || `token_${userId}_${Date.now()}`;
          
          // Ativar ferramenta de vídeo
          if (!userData.addOns?.includes('ai_video_generator')) {
            userData.addOns = [...(userData.addOns || []), 'ai_video_generator'];
            userData.purchasedTools = {
              ...userData.purchasedTools,
              ai_video_generator: {
                purchasedAt: new Date().toISOString(),
                active: true,
                sessionId: sessionId,
                paymentConfirmed: true
              }
            };
            console.log('✅ Ferramenta ai_video_generator ativada');
          }
          
          // Salvar dados atualizados com múltiplas chaves para garantir persistência
          localStorage.setItem('viraliza_ai_active_user_v1', JSON.stringify(userData));
          localStorage.setItem('viraliza_ai_auth_token_v1', userData.authToken);
          localStorage.setItem('user_session_active', 'true');
          localStorage.setItem(`user_${userId}_tools`, JSON.stringify(userData.addOns));
          
          console.log('💾 Dados salvos no localStorage');
          console.log('✅ Ferramenta ativada com sucesso:', userData);
          
          // Aguardar um pouco e marcar como completo
          setTimeout(() => {
            setActivationComplete(true);
            setIsActivating(false);
            
            // Redirecionar para a ferramenta após 2 segundos
            setTimeout(() => {
              // Usar window.location.href para garantir que a sessão seja mantida
              window.location.href = `${window.location.origin}/#/dashboard/ai-video-generator?activated=true&userId=${userId}`;
            }, 2000);
          }, 1500);
        } else {
          console.error('❌ UserId não encontrado na URL');
          setIsActivating(false);
        }
      } catch (error) {
        console.error('❌ Erro ao ativar ferramenta:', error);
        setIsActivating(false);
      }
    };

    activateToolAndRedirect();
  }, []);

  return (
    <div className="min-h-screen bg-primary text-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        {isActivating ? (
          <>
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full mb-6 animate-pulse">
                <span className="text-4xl">🎬</span>
              </div>
              <h1 className="text-3xl font-bold text-green-400 mb-4">
                Pagamento Confirmado!
              </h1>
              <p className="text-gray-300 mb-6">
                Ativando sua ferramenta IA Video Generator...
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
              </div>
            </div>
          </>
        ) : activationComplete ? (
          <>
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full mb-6">
                <span className="text-4xl">✅</span>
              </div>
              <h1 className="text-3xl font-bold text-green-400 mb-4">
                Ferramenta Ativada!
              </h1>
              <p className="text-gray-300 mb-6">
                Sua ferramenta IA Video Generator foi ativada com sucesso!
              </p>
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
                <div className="text-green-300 text-sm">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-green-400 mr-2">✓</span>
                    Vídeos ilimitados em 8K
                  </div>
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-green-400 mr-2">✓</span>
                    15+ avatares profissionais
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Acesso vitalício
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                Redirecionando para a ferramenta em 3 segundos...
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full mb-6">
                <span className="text-4xl">❌</span>
              </div>
              <h1 className="text-3xl font-bold text-red-400 mb-4">
                Erro na Ativação
              </h1>
              <p className="text-gray-300 mb-6">
                Houve um problema ao ativar sua ferramenta. Entre em contato com o suporte.
              </p>
              <button
                onClick={() => window.location.href = '/#/dashboard'}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
