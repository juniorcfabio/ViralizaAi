import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GoogleOAuthCallbackPage: React.FC = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processando login com Google...');
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 Iniciando processamento do callback Google OAuth');
        
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const state = urlParams.get('state');

        console.log('📋 Parâmetros recebidos:', { code: code?.substring(0, 10) + '...', error, state });

        if (error) {
          console.error('❌ Erro retornado pelo Google:', error);
          setStatus('error');
          setMessage(`Erro no login: ${error}`);
          return;
        }

        if (!code) {
          console.error('❌ Código de autorização não encontrado');
          setStatus('error');
          setMessage('Código de autorização não encontrado');
          return;
        }

        // Verificar state de segurança
        const savedState = localStorage.getItem('google_oauth_state');
        console.log('🔐 Verificando state:', { received: state, saved: savedState });
        
        if (state !== savedState) {
          console.error('❌ Estado de segurança inválido');
          setStatus('error');
          setMessage('Estado de segurança inválido');
          return;
        }

        console.log('🔄 Trocando código por token...');
        
        // Usar credenciais diretas (sem env vars que podem não estar carregando)
        const clientId = '158170096258-5bb00bb3jqjqjcv4r1no1ac5v3dc2e6.apps.googleusercontent.com';
        const clientSecret = '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';
        const redirectUri = `${window.location.origin}/auth/google/callback`;

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
          })
        });

        console.log('📡 Resposta do token:', tokenResponse.status);
        const tokenData = await tokenResponse.json();
        console.log('🎫 Dados do token:', { hasAccessToken: !!tokenData.access_token, error: tokenData.error });
        
        if (!tokenData.access_token) {
          console.error('❌ Token não recebido:', tokenData);
          throw new Error(`Token não recebido: ${tokenData.error || 'Erro desconhecido'}`);
        }

        console.log('🔄 Obtendo dados do usuário...');
        
        // Obter dados do usuário
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { 
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Accept': 'application/json'
          }
        });

        console.log('👤 Resposta do usuário:', userResponse.status);
        const userData = await userResponse.json();
        console.log('📋 Dados do usuário:', { id: userData.id, email: userData.email, name: userData.name });

        if (!userData.id || !userData.email) {
          throw new Error('Dados do usuário incompletos');
        }

        // Criar usuário no sistema
        const newUser = {
          id: `google_${userData.id}`,
          name: userData.name || userData.email,
          email: userData.email,
          type: 'client' as const,
          status: 'Ativo',
          joinedDate: new Date().toISOString().split('T')[0],
          avatar: userData.picture || '',
          socialAccounts: [{
            platform: 'Google',
            accountId: userData.id,
            username: userData.email
          }],
          paymentMethods: [],
          billingHistory: []
        };

        console.log('💾 Salvando usuário:', newUser.email);
        
        // Salvar usuário no localStorage
        localStorage.setItem('viraliza_ai_active_user_v1', JSON.stringify(newUser));
        localStorage.removeItem('google_oauth_state');
        localStorage.removeItem('google_oauth_redirect');

        console.log('✅ Login Google realizado com sucesso');
        setStatus('success');
        setMessage('Login realizado com sucesso! Redirecionando...');
        
        // Redirecionar para dashboard
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);

      } catch (error) {
        console.error('❌ Erro no callback OAuth:', error);
        setStatus('error');
        setMessage(`Erro ao processar login: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        
        // Redirecionar para home após erro
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
      <div className="bg-secondary p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-light mb-2">Processando Login</h2>
              <p className="text-gray-300">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-green-400 mb-2">Login Realizado!</h2>
              <p className="text-gray-300">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-red-400 mb-2">Erro no Login</h2>
              <p className="text-gray-300 mb-4">{message}</p>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-accent text-light px-6 py-2 rounded-lg hover:bg-blue-500 transition-colors"
              >
                Voltar ao Início
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleOAuthCallbackPage;
