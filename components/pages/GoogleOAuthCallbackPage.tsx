import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';

const GoogleOAuthCallbackPage: React.FC = () => {
  const { } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processando login com Google...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const state = urlParams.get('state');

        if (error) {
          setStatus('error');
          setMessage(`Erro no login: ${error}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('Código de autorização não encontrado');
          return;
        }

        // Verificar state
        const savedState = localStorage.getItem('google_oauth_state');
        if (state !== savedState) {
          setStatus('error');
          setMessage('Estado de segurança inválido');
          return;
        }

        // Trocar código por token
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
        const redirectUri = `${window.location.origin}/auth/google/callback`;

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
          })
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenData.access_token) {
          throw new Error('Token não recebido');
        }

        // Obter dados do usuário
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });

        const userData = await userResponse.json();

        // Criar usuário no sistema
        const newUser = {
          id: `google_${userData.id}`,
          name: userData.name,
          email: userData.email,
          type: 'client' as const,
          status: 'Ativo',
          joinedDate: new Date().toISOString().split('T')[0],
          avatar: userData.picture,
          socialAccounts: [],
          paymentMethods: [],
          billingHistory: []
        };

        // Salvar usuário
        localStorage.setItem('viraliza_ai_active_user_v1', JSON.stringify(newUser));
        localStorage.removeItem('google_oauth_state');

        setStatus('success');
        setMessage('Login realizado com sucesso! Redirecionando...');
        
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);

      } catch (error) {
        console.error('❌ Erro no callback OAuth:', error);
        setStatus('error');
        setMessage('Erro ao processar login com Google');
      }
    };

    handleCallback();
  }, []);

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
