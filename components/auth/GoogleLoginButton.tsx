import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface GoogleLoginButtonProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  className = ''
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeGoogle = () => {
      if (typeof window.google !== 'undefined' && window.google.accounts) {
        console.log('🔄 Google Identity Services detectado, inicializando...');
        
        try {
          window.google.accounts.id.initialize({
            client_id: '158170096258-5bb00bb3jqjqjcv4r1no1ac5v3dc2e6.apps.googleusercontent.com',
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: true
          });

          setIsGoogleLoaded(true);
          console.log('✅ Google Identity Services inicializado');
          
          // Render button if ref is available
          if (buttonRef.current) {
            renderGoogleButton();
          }
        } catch (error) {
          console.error('❌ Erro ao inicializar Google Identity Services:', error);
          setIsGoogleLoaded(false);
        }
      } else {
        console.log('⏳ Aguardando Google Identity Services...');
        setTimeout(initializeGoogle, 100);
      }
    };

    initializeGoogle();
  }, []);

  useEffect(() => {
    if (isGoogleLoaded && buttonRef.current) {
      renderGoogleButton();
    }
  }, [isGoogleLoaded]);

  const renderGoogleButton = () => {
    if (!buttonRef.current || !window.google) return;

    try {
      // Clear previous button
      buttonRef.current.innerHTML = '';
      
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: '100%'
      });
      
      console.log('✅ Botão Google renderizado');
    } catch (error) {
      console.error('❌ Erro ao renderizar botão Google:', error);
    }
  };

  const handleCredentialResponse = (response: any) => {
    console.log('🔄 Processando resposta do Google...');
    setIsLoading(true);

    try {
      if (!response.credential) {
        throw new Error('Credential não recebido do Google');
      }

      // Decode JWT token
      const payload = decodeJWT(response.credential);
      console.log('👤 Dados do usuário decodificados:', {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        verified: payload.email_verified
      });

      // Validate required fields
      if (!payload.sub || !payload.email) {
        throw new Error('Dados do usuário incompletos');
      }

      // Create user object
      const newUser = {
        id: `google_${payload.sub}`,
        name: payload.name || payload.email,
        email: payload.email,
        type: 'client' as const,
        status: 'Ativo',
        joinedDate: new Date().toISOString().split('T')[0],
        avatar: payload.picture || '',
        socialAccounts: [{
          platform: 'Google',
          accountId: payload.sub,
          username: payload.email,
          verified: payload.email_verified || false
        }],
        paymentMethods: [],
        billingHistory: [],
        googleData: {
          sub: payload.sub,
          iss: payload.iss,
          aud: payload.aud,
          exp: payload.exp,
          iat: payload.iat,
          loginTimestamp: Date.now()
        }
      };

      // Save user to localStorage
      localStorage.setItem('viraliza_ai_active_user_v1', JSON.stringify(newUser));
      localStorage.setItem('google_login_timestamp', Date.now().toString());

      console.log('✅ Login Google realizado com sucesso:', newUser.email);

      // Call success callback
      if (onSuccess) {
        onSuccess(newUser);
      }

      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);

    } catch (error) {
      console.error('❌ Erro ao processar login Google:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const decodeJWT = (token: string): any => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('❌ Erro ao decodificar JWT:', error);
      throw new Error('Token JWT inválido');
    }
  };

  const handleFallbackClick = () => {
    if (disabled || isLoading) return;

    console.log('🔄 Fallback: redirecionamento manual para Google OAuth');
    setIsLoading(true);

    try {
      const clientId = '158170096258-5bb00bb3jqjqjcv4r1no1ac5v3dc2e6.apps.googleusercontent.com';
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const scope = 'email profile openid';
      const responseType = 'code';
      const state = Math.random().toString(36).substring(7);
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=${responseType}&` +
        `state=${state}&` +
        `access_type=offline&` +
        `prompt=consent`;
      
      localStorage.setItem('google_oauth_state', state);
      window.location.href = authUrl;
    } catch (error) {
      console.error('❌ Erro no fallback OAuth:', error);
      setIsLoading(false);
      if (onError) {
        onError('Erro ao iniciar login com Google');
      }
    }
  };

  return (
    <div className={`google-login-container ${className}`}>
      {isGoogleLoaded ? (
        <div 
          ref={buttonRef}
          className={`google-signin-button ${disabled || isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        />
      ) : (
        <button
          onClick={handleFallbackClick}
          disabled={disabled || isLoading}
          className="flex items-center justify-center w-full px-4 py-3 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {isLoading ? 'Carregando...' : 'Entrar com Google'}
        </button>
      )}
    </div>
  );
};

export default GoogleLoginButton;
