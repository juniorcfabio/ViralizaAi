import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import PaymentActivationService from '../../services/paymentActivationService';

const PaymentSuccessPageUltraRobust: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [activationStatus, setActivationStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [toolName, setToolName] = useState('');
  const [activationService] = useState(() => PaymentActivationService.getInstance());

  useEffect(() => {
    const processPaymentSuccess = async () => {
      console.log('🎉 Página de sucesso carregada');
      
      try {
        // Obter parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id') || urlParams.get('sessionId');
        const userId = urlParams.get('userId') || user?.id;
        const toolId = urlParams.get('tool') || urlParams.get('toolId') || 'ai-video-generator';
        const amount = parseFloat(urlParams.get('amount') || '0');

        console.log('📋 Parâmetros do pagamento:', { sessionId, userId, toolId, amount });

        if (!sessionId || !userId) {
          console.error('❌ Parâmetros obrigatórios ausentes');
          setActivationStatus('error');
          setIsProcessing(false);
          return;
        }

        // Definir nome da ferramenta
        const toolNames = {
          'ai-video-generator': 'Gerador de Vídeo IA 8K',
          'ai_video_generator': 'Gerador de Vídeo IA 8K',
          'ebook-generator': 'Gerador de Ebooks Ultra',
          'ai-funnel-builder': 'AI Funnel Builder'
        };
        setToolName(toolNames[toolId as keyof typeof toolNames] || 'Ferramenta Premium');

        // ATIVAÇÃO ULTRA-ROBUSTA
        console.log('🚀 Iniciando ativação ultra-robusta...');
        
        // 1. ATIVAÇÃO IMEDIATA
        const success = await activationService.processPaymentSuccess(sessionId, userId, toolId, amount);
        
        if (success) {
          console.log('✅ Ativação bem-sucedida!');
          setActivationStatus('success');
          
          // 2. ATUALIZAR CONTEXTO DE AUTENTICAÇÃO
          if (user) {
            const updatedUser = {
              ...user,
              addOns: [...(user.addOns || []), toolId],
              purchasedTools: {
                ...user.purchasedTools,
                [toolId]: {
                  purchasedAt: new Date().toISOString(),
                  active: true,
                  sessionId: sessionId
                }
              }
            };
            
            await updateUser(user.id, updatedUser);
            console.log('✅ Contexto de usuário atualizado');
          }

          // 3. REDIRECIONAMENTO AUTOMÁTICO
          setTimeout(() => {
            const toolRoutes = {
              'ai-video-generator': '/dashboard/ai-video-generator',
              'ai_video_generator': '/dashboard/ai-video-generator',
              'ebook-generator': '/dashboard/ebook-generator',
              'ai-funnel-builder': '/dashboard/ai-funnel-builder'
            };
            
            const route = toolRoutes[toolId as keyof typeof toolRoutes] || '/dashboard';
            const redirectUrl = `${window.location.origin}/#${route}?activated=true&userId=${userId}&timestamp=${Date.now()}`;
            
            console.log('🔄 Redirecionando para:', redirectUrl);
            window.location.href = redirectUrl;
          }, 3000);
          
        } else {
          console.error('❌ Falha na ativação');
          setActivationStatus('error');
        }

      } catch (error) {
        console.error('❌ Erro no processamento:', error);
        setActivationStatus('error');
      } finally {
        setIsProcessing(false);
      }
    };

    processPaymentSuccess();
  }, [user, activationService, updateUser]);

  // Função de retry manual
  const handleRetry = async () => {
    setIsProcessing(true);
    setActivationStatus('processing');
    
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id') || urlParams.get('sessionId');
    const userId = urlParams.get('userId') || user?.id;
    const toolId = urlParams.get('tool') || urlParams.get('toolId') || 'ai-video-generator';
    
    if (sessionId && userId && toolId) {
      // Forçar ativação manual
      activationService.forceActivation(userId, toolId);
      
      setTimeout(() => {
        setActivationStatus('success');
        setIsProcessing(false);
        
        // Redirecionar
        const toolRoutes = {
          'ai-video-generator': '/dashboard/ai-video-generator',
          'ai_video_generator': '/dashboard/ai-video-generator',
          'ebook-generator': '/dashboard/ebook-generator',
          'ai-funnel-builder': '/dashboard/ai-funnel-builder'
        };
        
        const route = toolRoutes[toolId as keyof typeof toolRoutes] || '/dashboard';
        window.location.href = `${window.location.origin}/#${route}?activated=true&userId=${userId}`;
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-white flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-8">
        
        {/* Processing State */}
        {isProcessing && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full mb-6 animate-pulse">
              <span className="text-4xl">⚡</span>
            </div>
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Processando Pagamento
            </h1>
            <p className="text-gray-300 mb-6">
              Ativando sua ferramenta premium...
            </p>
            <div className="w-full bg-secondary rounded-full h-2 mb-4">
              <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
            </div>
            <p className="text-sm text-gray-400">
              Aguarde enquanto configuramos tudo para você
            </p>
          </div>
        )}

        {/* Success State */}
        {!isProcessing && activationStatus === 'success' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Pagamento Aprovado!
            </h1>
            <p className="text-gray-300 mb-6">
              <strong>{toolName}</strong> foi ativada com sucesso em sua conta!
            </p>
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6">
              <p className="text-green-300 text-sm">
                🎉 Ferramenta liberada e pronta para uso!<br/>
                Redirecionando automaticamente...
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/#/dashboard/ai-video-generator?activated=true'}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all"
              >
                Acessar Ferramenta Agora
              </button>
              <button
                onClick={() => window.location.href = '/#/dashboard'}
                className="w-full bg-secondary text-gray-300 py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Ir para Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isProcessing && activationStatus === 'error' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Processando Ativação
            </h1>
            <p className="text-gray-300 mb-6">
              Seu pagamento foi aprovado! Estamos finalizando a ativação da ferramenta.
            </p>
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">
                💳 Pagamento processado com sucesso<br/>
                🔄 Ativando ferramenta automaticamente
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                Ativar Ferramenta Agora
              </button>
              <button
                onClick={() => window.location.href = '/#/dashboard'}
                className="w-full bg-secondary text-gray-300 py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Ir para Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Debug Info (apenas em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-800 rounded-lg text-xs">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <p>User: {user?.email}</p>
            <p>Status: {activationStatus}</p>
            <p>Processing: {isProcessing ? 'true' : 'false'}</p>
            <p>URL: {window.location.href}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPageUltraRobust;
