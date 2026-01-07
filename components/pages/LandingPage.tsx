import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, RegistrationData } from '../../contexts/AuthContextFixed';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plan, Testimonial, AdPartner, TrustedCompany } from '../../types';
import { API_BASE_URL } from '../../src/config/api';
import Logo from '../ui/Logo';
import AIPersona from '../ui/AIPersona';
import InteractiveAIPersona from '../ui/InteractiveAIPersona';
import DraggableHelpButton from '../ui/DraggableHelpButton';
import { getPartnersDB, getTestimonialsDB, getTrustedCompaniesDB } from '../../services/dbService';
import AdminCredentialsFix from '../ui/AdminCredentialsFix';
import StripeService from '../../services/stripeService';

const CampaignIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <defs>
            <linearGradient id="g-campaign" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#8B5CF6"/><stop offset="100%" stopColor="#3B82F6"/></linearGradient>
        </defs>
        <path d="M12 5V3M12 9V7M12 13V11M12 17V15M12 21V19M19 12h2M17 12h-2M15 12h-2M11 12H9M7 12H5M3 12H1M12 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M5.64 5.64l-1.42-1.42M19.78 19.78l-1.42-1.42M5.64 18.36l-1.42 1.42M19.78 4.22l-1.42 1.42M18.36 18.36l1.42 1.42M4.22 4.22l1.42 1.42" stroke="url(#g-campaign)" strokeWidth="2.5"/>
    </svg>
);

const MediaIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <defs>
            <linearGradient id="g-media" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#8B5CF6"/><stop offset="100%" stopColor="#3B82F6"/></linearGradient>
        </defs>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="url(#g-media)" strokeWidth="2.5"></rect>
        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" opacity="0.7"></circle>
        <polyline points="21 15 16 10 5 21" stroke="currentColor" opacity="0.7"></polyline>
    </svg>
);

const FunnelIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <defs>
            <linearGradient id="g-funnel" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#8B5CF6"/><stop offset="100%" stopColor="#3B82F6"/></linearGradient>
        </defs>
        <path d="M3 3h18v4l-7 8v6l-4-2v-4L3 7V3z" stroke="url(#g-funnel)" strokeWidth="2.5"></path>
    </svg>
);

const StarRating: React.FC<{ rating: number; starClassName?: string; containerClassName?: string }> = ({ rating, starClassName = 'w-5 h-5', containerClassName = '' }) => {
    return (
        <div className={`flex items-center ${containerClassName}`}>
            {[...Array(5)].map((_, i) => {
                const ratingValue = i + 1;
                const isFilled = ratingValue <= rating;
                return (
                    <svg
                        key={i}
                        className={`${starClassName} ${isFilled ? 'text-yellow-400' : 'text-gray-600'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                        style={isFilled ? { filter: 'drop-shadow(0 0 2px rgba(251, 191, 36, 0.6))' } : {}}
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                );
            })}
        </div>
    );
};

const FeedUserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const FeedDownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const FeedStarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);
const GlobeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const PhoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;
const WhatsAppIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>;
const InstagramIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;

const GoogleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.347.533 12S5.867 24 12.48 24c3.44 0 6.013-1.133 8.053-3.24 2.08-2.08 2.72-5.013 2.72-7.427 0-.733-.053-1.44-.16-2.133h-10.613z" />
    </svg>
);
const FacebookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);
const AppleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-.93 3.69-.93.95 0 1.77.32 2.45.91-.8.5-1.38 1.18-1.38 2.24 0 1.6.96 2.18 1.38 2.35-.74 2.65-2.13 5.3-3.66 7.66zm-3.27-14.06c-.25-.01-.57.07-.89.24-1.2.62-1.65 1.73-1.6 2.95 1.23.13 2.32-.48 2.85-1.43.53-.97.17-1.7-.36-1.76z" />
    </svg>
);

const LoginModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [loginField, setLoginField] = useState('');
    const [password, setPassword] = useState('');
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotMessage, setForgotMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const { login, loginWithGoogle, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Initialize Google Sign-In button when modal opens
        const initGoogleButton = () => {
            if (typeof window.google !== 'undefined' && window.google.accounts) {
                const buttonElement = document.getElementById('google-signin-button');
                if (buttonElement) {
                    window.google.accounts.id.initialize({
                        client_id: '158170096258-5bb00bb3jqjqjcv4r1no1ac5v3dc2e6.apps.googleusercontent.com',
                        callback: (response: any) => {
                            console.log('🔄 Google callback recebido:', response);
                            
                            if (response.credential) {
                                try {
                                    const payload = JSON.parse(atob(response.credential.split('.')[1]));
                                    console.log('👤 Dados do usuário:', payload);
                                    
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
                                            username: payload.email
                                        }],
                                        paymentMethods: [],
                                        billingHistory: []
                                    };
                                    
                                    localStorage.setItem('viraliza_ai_active_user_v1', JSON.stringify(newUser));
                                    console.log('✅ Login Google realizado com sucesso');
                                    
                                    onClose();
                                    navigate('/dashboard');
                                    
                                } catch (error) {
                                    console.error('❌ Erro ao processar token Google:', error);
                                    setError('Erro ao processar login com Google');
                                }
                            }
                        },
                        auto_select: false,
                        cancel_on_tap_outside: true
                    });

                    window.google.accounts.id.renderButton(buttonElement, {
                        theme: 'outline',
                        size: 'large',
                        text: 'signin_with',
                        shape: 'rectangular',
                        logo_alignment: 'left',
                        width: '100%'
                    });
                }
            } else {
                setTimeout(initGoogleButton, 100);
            }
        };

        initGoogleButton();
    }, [navigate, onClose]);

    const handleForgotPassword = async () => {
        setError('');
        setForgotMessage('');

        const email = forgotEmail.trim().toLowerCase();
        if (!email) {
            setError('Informe seu e-mail para receber o link de redefinição.');
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await res.json().catch(() => null);
            const message = (data && (data.message || data.error)) || 'Se o e-mail existir, enviaremos um link para redefinir a senha.';

            if (!res.ok) {
                setError(String(message));
                return;
            }

            setForgotMessage(String(message));
        } catch (err) {
            setError('Erro ao solicitar redefinição de senha. Tente novamente.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        setIsLoggingIn(true);

        try {
            const user = await login(loginField, password);
            if (user && typeof user === 'object' && 'error' in user) {
                setError((user as any).error || 'Erro ao processar login. Tente novamente.');
                return;
            }

            if (user) {
                navigate(user.type === 'admin' ? '/admin' : '/dashboard');
            } else {
                setError('Credenciais inválidas. Por favor, tente novamente.');
            }
        } catch (err) {
            setError('Erro ao processar login. Tente novamente.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleSocialLogin = async (platform: string) => {
        if (platform === 'Google') {
            setIsLoggingIn(true);
            const handleGoogleLogin = () => {
                console.log('🔄 Iniciando Google OAuth...');
                
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
                
                console.log('🔗 URL de autenticação:', authUrl);
                console.log('🔐 State gerado:', state);
                
                localStorage.setItem('google_oauth_state', state);
                localStorage.setItem('google_oauth_redirect', window.location.pathname);
                
                window.location.href = authUrl;
            };
            try {
                await handleGoogleLogin();
            } catch (err) {
                setError('Erro ao fazer login com Google.');
            } finally {
                setIsLoggingIn(false);
            }
        } else {
            alert(`Login com ${platform} em breve! Por favor, use o Google ou login padrão.`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary p-8 rounded-lg shadow-xl w-full max-w-sm relative animate-fade-in-right">
                <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-gray-dark hover:text-light">&times;</button>
                <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
                
                <div className="mb-6">
                    <div id="google-signin-button" className="w-full"></div>
                    <div className="flex justify-center gap-4 mt-4">
                        <button onClick={() => handleSocialLogin('Facebook')} className="p-2 bg-primary rounded-full hover:bg-gray-700 transition-colors" title="Facebook">
                            <FacebookIcon className="w-6 h-6" />
                        </button>
                        <button onClick={() => handleSocialLogin('Apple')} className="p-2 bg-primary rounded-full hover:bg-gray-700 transition-colors" title="Apple">
                            <AppleIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-secondary text-gray-500">Entre com CPF ou E-mail</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="CPF ou E-mail" 
                        value={loginField} 
                        onChange={e => setLoginField(e.target.value)} 
                        required 
                        className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                        disabled={isLoading || isLoggingIn}
                    />
                    <input 
                        type="password" 
                        placeholder="Senha" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                        disabled={isLoading || isLoggingIn}
                    />
                    
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button 
                        type="submit" 
                        className="w-full bg-accent text-light font-semibold py-3 mt-2 rounded-full hover:bg-blue-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                        disabled={isLoggingIn || isLoading} 
                    >
                        {isLoggingIn ? 'Verificando...' : (isLoading ? 'Carregando...' : 'Entrar')}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsForgotPasswordOpen((v) => !v);
                            setForgotMessage('');
                            setError('');
                        }}
                        className="w-full text-sm text-gray-dark hover:text-light"
                        disabled={isLoggingIn || isLoading}
                    >
                        Esqueci minha senha
                    </button>

                    {isForgotPasswordOpen && (
                        <div className="space-y-3 pt-2">
                            <input
                                type="email"
                                placeholder="Seu e-mail"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                                disabled={isLoggingIn || isLoading}
                            />

                            {forgotMessage && (
                                <p className="text-green-500 text-sm text-center">{forgotMessage}</p>
                            )}

                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="w-full bg-primary text-light font-semibold py-3 rounded-full hover:bg-gray-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                                disabled={isLoggingIn || isLoading}
                            >
                                Enviar link de redefinição
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

const RegisterModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [formData, setFormData] = useState<Omit<RegistrationData, 'plan'>>({ 
        name: '', 
        email: '', 
        password: '',
        cnpj: '',
        cpf: ''
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [accountType, setAccountType] = useState<'individual' | 'business'>('business');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { register, loginWithGoogle, isLoading } = useAuth();

    const formatCPF = (value: string) => {
        const v = value.replace(/\D/g, '').slice(0, 11);
        return v
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (e.target.name === 'cpf') {
            value = formatCPF(value);
        }
        setFormData({ ...formData, [e.target.name]: value });
        setError('');
    };

    const handleAccountTypeChange = (type: 'individual' | 'business') => {
        setAccountType(type);
        setFormData({ ...formData, cnpj: '', cpf: '' });
    };

    const handleSocialRegister = async (platform: string) => {
        if (platform === 'Google') {
            try {
                const user = await loginWithGoogle();
                if (user && typeof user === 'object' && 'error' in user) {
                    setError((user as any).error || 'Erro ao fazer cadastro com Google.');
                    return;
                }
                
                if (user) {
                    setSuccessMessage('Cadastro/Login com Google realizado com sucesso!');
                    setTimeout(() => onClose(), 2000);
                }
            } catch (err) {
                setError('Erro ao fazer cadastro com Google.');
            }
        } else {
            alert(`Cadastro com ${platform} em breve! Por favor, use o Google ou preencha o formulário.`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }

        if (accountType === 'individual') {
            const plainCPF = formData.cpf?.replace(/\D/g, '') || '';
            if (plainCPF.length !== 11) {
                setError("O CPF deve conter 11 dígitos.");
                return;
            }
        }

        const dataToRegister: any = { ...formData };
        if (accountType === 'individual') {
            delete dataToRegister.cnpj;
        } else {
            delete dataToRegister.cpf;
        }

        const result = await register(dataToRegister);
        if (result.success) {
            setSuccessMessage('Cadastro realizado! Verifique seu e-mail para confirmar a conta e depois faça login.');
        } else {
            setError(result.message || 'Ocorreu um erro no cadastro.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary p-8 rounded-lg shadow-xl w-full max-w-md relative animate-fade-in-right max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-gray-dark hover:text-light">&times;</button>
                <h2 className="text-2xl font-bold mb-6 text-center">Criar Conta</h2>
                
                <div className="flex justify-center gap-4 mb-6">
                    <button 
                        onClick={() => handleSocialRegister('Google')} 
                        className="p-2 bg-primary rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50" 
                        title="Google"
                        disabled={isLoading}
                    >
                        <GoogleIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => handleSocialRegister('Facebook')} className="p-2 bg-primary rounded-full hover:bg-gray-700 transition-colors" title="Facebook">
                        <FacebookIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => handleSocialRegister('Apple')} className="p-2 bg-primary rounded-full hover:bg-gray-700 transition-colors" title="Apple">
                        <AppleIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-secondary text-gray-500">Ou preencha os dados</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex bg-primary rounded-lg p-1 border border-gray-700">
                        <button type="button" onClick={() => handleAccountTypeChange('business')} className={`flex-1 py-1 rounded-md text-sm transition-colors ${accountType === 'business' ? 'bg-accent text-white shadow' : 'text-gray-dark hover:bg-secondary'}`}>Empresa</button>
                        <button type="button" onClick={() => handleAccountTypeChange('individual')} className={`flex-1 py-1 rounded-md text-sm transition-colors ${accountType === 'individual' ? 'bg-accent text-white shadow' : 'text-gray-dark hover:bg-secondary'}`}>Pessoa Física</button>
                    </div>

                    <input type="text" name="name" placeholder={accountType === 'business' ? "Nome da Empresa" : "Nome Completo"} value={formData.name} onChange={handleChange} required className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                    
                    {accountType === 'business' ? (
                         <input type="text" name="cnpj" placeholder="CNPJ" value={formData.cnpj} onChange={handleChange} required className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                    ) : (
                         <input type="text" name="cpf" placeholder="CPF (000.000.000-00)" value={formData.cpf} onChange={handleChange} required className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                    )}

                    <input type="email" name="email" placeholder="E-mail" value={formData.email} onChange={handleChange} required className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                    
                    <input type="password" name="password" placeholder="Senha" value={formData.password} onChange={handleChange} required className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                    
                    <input type="password" name="confirmPassword" placeholder="Confirmar Senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent" />
                    
                    {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button type="submit" className="w-full bg-accent text-light font-semibold py-3 mt-2 rounded-full hover:bg-blue-500 transition-colors">Cadastrar e Iniciar Teste</button>
                </form>
            </div>
        </div>
    );
};

const initialTestimonials: Testimonial[] = [
    {
        name: 'Julia Santos',
        role: 'CEO',
        company: 'Moda & Estilo',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        text: 'A Viraliza.ai revolucionou nossa presença online. Em 3 meses, nosso engajamento cresceu 300% e as vendas seguiram o mesmo ritmo. É como ter uma equipe de marketing inteira trabalhando 24/7.',
        rating: 5,
    },
    {
        name: 'Carlos Oliveira',
        role: 'Fundador',
        company: 'Café Grão Nobre',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        text: 'Nossa cafeteria era um segredo local. Com a IA da Viraliza, alcançamos um público que jamais imaginaríamos. O conteúdo gerado é criativo e sempre alinhado com nossa marca.',
        rating: 5,
    },
    {
        name: 'Beatriz Lima',
        role: 'Influencer Digital',
        company: 'Fitness Life',
        avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        text: 'Manter a constância nas redes sociais era meu maior desafio. Agora, tenho um fluxo infinito de ideias e posts agendados, me permitindo focar no que mais amo: criar conteúdo de valor.',
        rating: 5,
    },
    {
        name: 'Ricardo Mendes',
        role: 'Gerente de Marketing',
        company: 'Tech Solutions',
        avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
        text: 'A plataforma é incrivelmente intuitiva. A funcionalidade de piloto automático global nos economiza dezenas de horas por semana e os resultados de alcance são impressionantes.',
        rating: 4,
    },
    {
        name: 'Fernanda Costa',
        role: 'Proprietária',
        company: 'Doce Sonho Brigaderia',
        avatar: 'https://randomuser.me/api/portraits/women/50.jpg',
        text: 'Como um pequeno negócio, eu não tinha orçamento para uma agência. A Viraliza.ai me deu as ferramentas de grandes empresas por um preço justo. Meu faturamento dobrou!',
        rating: 5,
    },
    {
        name: 'Lucas Almeida',
        role: 'Fotógrafo',
        company: 'Almeida Studios',
        avatar: 'https://randomuser.me/api/portraits/men/56.jpg',
        text: 'A geração de ideias de conteúdo é fantástica. Ele entende meu nicho de fotografia e sugere posts que realmente engajam meu público. Recomendo para qualquer criativo.',
        rating: 5,
    },
    {
        name: 'Mariana Gonçalves',
        role: 'Consultora de Imagem',
        company: 'Estilo Pessoal',
        avatar: 'https://randomuser.me/api/portraits/women/60.jpg',
        text: 'Os relatórios de analytics são claros e me ajudam a entender o que funciona. Consegui ajustar minha estratégia e triplicar o número de seguidores qualificados em 6 meses.',
        rating: 5,
    },
    {
        name: 'Gustavo Pereira',
        role: 'CEO',
        company: 'Startup Inova',
        avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
        text: 'Testamos várias ferramentas de automação, mas nenhuma se compara à Viraliza.ai. A inteligência por trás da plataforma é nítida. O crescimento é real e orgânico.',
        rating: 5,
    },
    {
        name: 'Ana Carolina',
        role: 'Arquiteta',
        company: 'AC Arquitetura',
        avatar: 'https://randomuser.me/api/portraits/women/76.jpg',
        text: 'A funcionalidade de agendamento de posts e o calendário de marketing me ajudaram a organizar minha comunicação de forma profissional, o que atraiu projetos maiores.',
        rating: 4,
    },
];

const Header: React.FC<{ onLogin: () => void; onRegister: () => void }> = ({ onLogin, onRegister }) => {
    const { t } = useLanguage();
    
    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleAffiliateClick = () => {
        const affiliateSection = document.getElementById('affiliate');
        if (affiliateSection) {
            affiliateSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-40 bg-primary/80 backdrop-blur-sm border-b border-gray-800">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Logo />
                <nav className="hidden md:flex items-center space-x-6 text-gray-dark">
                    <a href="#features" onClick={(e) => handleNavClick(e, 'features')} className="hover:text-light">{t('nav.features')}</a>
                    <a href="#testimonials" onClick={(e) => handleNavClick(e, 'testimonials')} className="hover:text-light">{t('nav.testimonials')}</a>
                    <a href="#pricing" onClick={(e) => handleNavClick(e, 'pricing')} className="hover:text-light">{t('nav.pricing')}</a>
                    <button onClick={handleAffiliateClick} className="hover:text-light transition-colors">Afiliados</button>
                </nav>
                <div className="flex items-center space-x-4">
                    <button onClick={onLogin} className="text-gray-dark hover:text-light">{t('nav.login')}</button>
                    <button onClick={onRegister} className="bg-accent text-light font-semibold py-2 px-4 rounded-full hover:bg-blue-500 transition-colors">
                        {t('nav.register')}
                    </button>
                </div>
            </div>
        </header>
    );
};

const Hero: React.FC<{ onRegister: () => void; onPersonaClick: () => void }> = ({ onRegister, onPersonaClick }) => {
    const { t } = useLanguage();

    return (
        <section className="pt-32 pb-16 text-center">
            <div className="container mx-auto px-6">
                <h1 className="text-4xl md:text-6xl font-extrabold text-light mb-4 leading-tight">
                   {t('hero.title')}
                </h1>
                <p className="text-lg md:text-xl text-gray-dark max-w-3xl mx-auto mb-8">
                   {t('hero.subtitle')}
                </p>
                <div className="flex justify-center mb-8">
                    <AIPersona onClick={onPersonaClick} />
                </div>
                <button onClick={onRegister} className="bg-accent text-light font-bold py-4 px-8 rounded-full hover:bg-blue-500 transition-transform transform hover:scale-105">
                    {t('hero.cta')}
                </button>
            </div>
        </section>
    );
};

const Features: React.FC = () => {
    const { t } = useLanguage();
    return (
        <section id="features" className="py-20 bg-secondary">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-3 gap-12 text-center">
                    <div className="p-6">
                        <CampaignIcon className="w-16 h-16 mx-auto mb-4 text-accent" />
                        <h3 className="text-2xl font-bold mb-2">{t('feature.growth')}</h3>
                        <p className="text-gray-dark">Receba planos de marketing completos com persona, estratégia e posts prontos para executar.</p>
                    </div>
                    <div className="p-6">
                        <MediaIcon className="w-16 h-16 mx-auto mb-4 text-accent" />
                        <h3 className="text-2xl font-bold mb-2">{t('feature.content')}</h3>
                        <p className="text-gray-dark">Gere imagens e vídeos exclusivos para seus posts, garantindo um visual profissional e único para sua marca.</p>
                    </div>
                    <div className="p-6">
                        <FunnelIcon className="w-16 h-16 mx-auto mb-4 text-accent" />
                        <h3 className="text-2xl font-bold mb-2">{t('feature.sales')}</h3>
                        <p className="text-gray-dark">Crie funis de venda completos, desde a isca digital até a sequência de e-mails, para converter seguidores em clientes.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

interface PulsingDot {
    id: number;
    x: number;
    y: number;
    type: 'follower' | 'download' | 'subscription';
    city: string;
    state: string;
    country: string;
}

interface EventFeedItem {
    id: number;
    type: 'follower' | 'download' | 'subscription';
    city: string;
    state: string;
    country: string;
}

const locations = [
    { city: 'São Paulo', state: 'SP', country: 'Brasil', x: 37, y: 72 },
    { city: 'New York', state: 'NY', country: 'USA', x: 28, y: 42 },
    { city: 'London', state: 'England', country: 'UK', x: 49.5, y: 38 },
    { city: 'Tokyo', state: 'Tokyo', country: 'Japan', x: 85, y: 44 },
    { city: 'Sydney', state: 'NSW', country: 'Australia', x: 88, y: 78 },
    { city: 'Lagos', state: 'Lagos', country: 'Nigeria', x: 50.5, y: 58 },
    { city: 'Mexico City', state: 'CDMX', country: 'Mexico', x: 22, y: 51 },
    { city: 'Lisbon', state: 'Lisbon', country: 'Portugal', x: 46, y: 43 },
    { city: 'Buenos Aires', state: 'CABA', country: 'Argentina', x: 34, y: 78 },
    { city: 'New Delhi', state: 'Delhi', country: 'India', x: 67, y: 48 },
    { city: 'Beijing', state: 'Beijing', country: 'China', x: 78, y:42 },
];

const WorldMap: React.FC = () => {
    const [downloads, setDownloads] = useState(134567);
    const [followers, setFollowers] = useState(890123);
    const [subscriptions, setSubscriptions] = useState(45678);
    const [pulsingDots, setPulsingDots] = useState<PulsingDot[]>([]);
    const [eventFeed, setEventFeed] = useState<EventFeedItem[]>([]);
    
    useEffect(() => {
        const interval = setInterval(() => {
            const randomLocation = locations[Math.floor(Math.random() * locations.length)];
            const eventType = ['follower', 'download', 'subscription'][Math.floor(Math.random() * 3)] as PulsingDot['type'];
            const eventId = Date.now() + Math.random();

            if (eventType === 'follower') {
                setFollowers(prev => prev + 1);
            } else if (eventType === 'download') {
                setDownloads(prev => prev + 1);
            } else {
                setSubscriptions(prev => prev + 1);
            }

            const newDot: PulsingDot = {
                id: eventId,
                ...randomLocation,
                type: eventType,
            };

            const newEvent: EventFeedItem = {
                id: eventId,
                type: eventType,
                city: randomLocation.city,
                state: randomLocation.state,
                country: randomLocation.country,
            };

            setPulsingDots(prevDots => [...prevDots, newDot]);
            setEventFeed(prevFeed => [newEvent, ...prevFeed].slice(0, 3));

            setTimeout(() => {
                setPulsingDots(prevDots => prevDots.filter(d => d.id !== newDot.id));
            }, 4000);
            
            setTimeout(() => {
                setEventFeed(prevFeed => prevFeed.filter(e => e.id !== newEvent.id));
            }, 5000);

        }, 1500);

        return () => clearInterval(interval);
    }, []);

    const mapImageUrl = "https://images.pexels.com/photos/41949/earth-earth-at-night-night-lights-41949.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";

    const dotClasses: { [key in PulsingDot['type']]: string } = {
        follower: 'pulse-blue',
        download: 'pulse-cyan',
        subscription: 'pulse-green',
    };
    
    const eventDetails: { [key in EventFeedItem['type']]: { text: string; icon: React.FC<any>; color: string } } = {
        follower: { text: 'Novo Seguidor', icon: FeedUserIcon, color: 'text-blue-400' },
        download: { text: 'Novo Download', icon: FeedDownloadIcon, color: 'text-cyan-400' },
        subscription: { text: 'Nova Assinatura', icon: FeedStarIcon, color: 'text-green-400' },
    };

    return (
        <section className="py-20 relative bg-primary text-center overflow-hidden">
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-20" 
                style={{ backgroundImage: `url(${mapImageUrl})` }}
            ></div>

            <div className="absolute inset-0 z-10">
                {pulsingDots.map(dot => (
                    <div
                        key={dot.id}
                        className={`absolute rounded-full w-2 h-2 ${dotClasses[dot.type]}`}
                        style={{
                            left: `${dot.x}%`,
                            top: `${dot.y}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                        title={`${dot.city}, ${dot.state}`}
                    ></div>
                ))}
            </div>
            <div className="container mx-auto px-6 relative z-20">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Conectando o Mundo</h2>
                <p className="text-gray-dark max-w-2xl mx-auto mb-12">Nossa plataforma opera globalmente, impulsionando marcas em todos os continentes.</p>
                <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    <div>
                        <p className="text-4xl font-bold text-accent">{followers.toLocaleString('pt-BR')}</p>
                        <p className="text-gray-dark">Seguidores Conquistados</p>
                    </div>
                    <div>
                        <p className="text-4xl font-bold text-accent">{downloads.toLocaleString('pt-BR')}</p>
                        <p className="text-gray-dark">Conteúdos Gerados</p>
                    </div>
                    <div>
                        <p className="text-4xl font-bold text-accent">{subscriptions.toLocaleString('pt-BR')}</p>
                        <p className="text-gray-dark">Contas Gerenciadas</p>
                    </div>
                </div>

                <div className="mt-12 mx-auto max-w-5xl flex flex-wrap justify-center gap-4">
                    {eventFeed.map(event => {
                        const details = eventDetails[event.type];
                        return (
                            <div key={event.id} className="bg-primary/80 backdrop-blur-sm p-3 rounded-lg shadow-lg flex items-start space-x-3 text-left animate-fade-in-right min-w-[240px]">
                                <details.icon className={`w-5 h-5 mt-1 flex-shrink-0 ${details.color}`} />
                                <div>
                                    <p className={`font-bold text-sm ${details.color}`}>{details.text}</p>
                                    <p className="text-xs text-gray-300">{event.city}, {event.state}, {event.country}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

const PartnerAdsSection: React.FC<{ onRegister: () => void }> = ({ onRegister }) => {
    const { t } = useLanguage();
    const [partners, setPartners] = useState<AdPartner[]>([]);
    const [visiblePartners, setVisiblePartners] = useState<AdPartner[]>([]);
    const [fadingSlot, setFadingSlot] = useState<number | null>(null);
    
    const currentSlotRef = useRef(0);
    const nextDataIndexRef = useRef(4);

    const fallbackPartners: AdPartner[] = [
        {
            id: 'ad_demo_1',
            companyName: 'TechStart Solutions',
            role: 'Inovação & TI',
            logo: 'https://cdn-icons-png.flaticon.com/512/3094/3094826.png', 
            websiteUrl: '#',
            status: 'Active',
            planType: 'Monthly',
            joinedDate: new Date().toISOString(),
            isMock: true
        },
        {
            id: 'ad_demo_2',
            companyName: 'Bella Vita Moda',
            role: 'Estilo Sustentável',
            logo: 'https://cdn-icons-png.flaticon.com/512/3531/3531759.png',
            websiteUrl: '#',
            status: 'Active',
            planType: 'Monthly',
            joinedDate: new Date().toISOString(),
            isMock: true
        },
        {
            id: 'ad_demo_3',
            companyName: 'FitLife Academy',
            role: 'Alta Performance',
            logo: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png',
            websiteUrl: '#',
            status: 'Active',
            planType: 'Monthly',
            joinedDate: new Date().toISOString(),
            isMock: true
        },
        {
            id: 'ad_demo_4',
            companyName: 'Gourmet Express',
            role: 'Gastronomia',
            logo: 'https://cdn-icons-png.flaticon.com/512/706/706164.png',
            websiteUrl: '#',
            status: 'Active',
            planType: 'Monthly',
            joinedDate: new Date().toISOString(),
            isMock: true
        },
        {
            id: 'ad_demo_5',
            companyName: 'Solar Energy',
            role: 'Energia Limpa',
            logo: 'https://cdn-icons-png.flaticon.com/512/861/861099.png',
            websiteUrl: '#',
            status: 'Active',
            planType: 'Monthly',
            joinedDate: new Date().toISOString(),
            isMock: true
        }
    ];

    useEffect(() => {
        const loadPartners = async () => {
            const data = await getPartnersDB();
            let active = data.filter(p => p.status === 'Active');

            if (active.length === 0) {
                active = fallbackPartners;
            }

            active.sort((a, b) => {
                if (a.isMock === b.isMock) return 0;
                return a.isMock ? 1 : -1;
            });
            
            let partnerPool = [...active];
            if (partnerPool.length > 0) {
                while (partnerPool.length < 8) {
                    partnerPool = [...partnerPool, ...partnerPool];
                }
            }

            setPartners(partnerPool);
            setVisiblePartners(partnerPool.slice(0, 4));
        };
        loadPartners();
    }, []);

    useEffect(() => {
        if (partners.length === 0) return;

        const interval = setInterval(() => {
            const slotToFade = currentSlotRef.current;
            const nextIndex = nextDataIndexRef.current;

            setFadingSlot(slotToFade);

            setTimeout(() => {
                setVisiblePartners(prev => {
                    const newArr = [...prev];
                    if (partners.length > 0) {
                        newArr[slotToFade] = partners[nextIndex % partners.length];
                    }
                    return newArr;
                });

                setFadingSlot(null);

                currentSlotRef.current = (slotToFade + 1) % 4; 
                nextDataIndexRef.current = (nextIndex + 1);
            }, 1000);

        }, 5000);

        return () => clearInterval(interval);
    }, [partners]);

    if (partners.length === 0) return null;

    return (
        <section className="py-20 bg-gradient-to-b from-secondary to-primary overflow-hidden min-h-[500px]">
            <div className="container mx-auto px-6 text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    {t('ads.title')}
                </h2>
                <p className="text-gray-dark">{t('ads.subtitle')}</p>
            </div>

            <div className="container mx-auto px-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {visiblePartners.map((partner, index) => (
                        <div 
                            key={index} 
                            className={`
                                bg-primary/50 backdrop-blur-md border border-gray-700 p-6 rounded-xl 
                                flex flex-col items-center text-center 
                                transition-all duration-1000 ease-in-out 
                                hover:border-accent hover:shadow-lg hover:shadow-accent/20 h-full
                                ${index === fadingSlot 
                                    ? 'opacity-0 -translate-y-8 scale-95 blur-sm' 
                                    : 'opacity-100 translate-y-0 scale-100 blur-0'}
                            `}
                        >
                            <div className={`w-24 h-24 mb-4 rounded-full overflow-hidden border-2 p-1 bg-white ${partner.isMock ? 'border-gray-500/30' : 'border-accent shadow-lg shadow-accent/30'}`}>
                                <img src={partner.logo} alt={partner.companyName} className="w-full h-full object-cover rounded-full" />
                            </div>
                            <h3 className="text-xl font-bold text-light mb-1 truncate w-full">{partner.companyName}</h3>
                            
                            {partner.role && (
                                <p className="text-xs text-gray-400 font-medium mb-4 uppercase tracking-wide">{partner.role}</p>
                            )}

                            <div className="mt-auto w-full">
                                            <InstagramIcon className="w-3 h-3" /> Instagram
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="mt-10 text-center relative z-10">
                    <button onClick={onRegister} className="inline-flex items-center gap-2 text-accent hover:text-light transition-colors border-b border-accent/50 hover:border-light pb-0.5 group">
                        <span className="text-sm font-semibold">Quero anunciar minha empresa aqui</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </button>
                </div>
            </div>
        </section>
    );
};

const TestimonialModal: React.FC<{ testimonial: Testimonial; onClose: () => void }> = ({ testimonial, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-secondary p-8 rounded-lg shadow-xl w-full max-w-lg relative transition-transform transform scale-100" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-gray-dark hover:text-light">&times;</button>
                <div className="flex items-center mb-6">
                    <img src={testimonial.avatar} alt={testimonial.name} className="w-16 h-16 rounded-full mr-4 border-2 border-accent" />
                    <div>
                        <p className="text-xl font-bold">{testimonial.name}</p>
                        <p className="text-gray-dark">{testimonial.role}, {testimonial.company}</p>
                    </div>
                </div>
                <p className="text-lg text-gray-dark mb-6">"{testimonial.text}"</p>
                <StarRating rating={testimonial.rating} starClassName="w-6 h-6" />
            </div>
        </div>
    );
};

const Testimonials: React.FC = () => {
    const [expandedTestimonial, setExpandedTestimonial] = useState<Testimonial | null>(null);
    const { t } = useLanguage();
    
    const [allTestimonials, setAllTestimonials] = useState<Testimonial[]>(initialTestimonials);

    useEffect(() => {
        const loadDynamicTestimonials = async () => {
            try {
                const dbTestimonials = await getTestimonialsDB();
                if (dbTestimonials.length > 0) {
                    setAllTestimonials([...dbTestimonials, ...initialTestimonials]);
                }
            } catch (e) {
                console.error("Failed to load testimonials", e);
            }
        };
        loadDynamicTestimonials();
    }, []);

    const extendedTestimonials = [...allTestimonials, ...allTestimonials];

    return (
        <section id="testimonials" className="py-20 bg-secondary">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-12">{t('nav.testimonials')}</h2>
            </div>
            <div className="w-full overflow-hidden [mask-image:_linear_gradient(to_right,transparent_0,_black_48px,_black_calc(100%-48px),transparent_100%)]">
                <ul className="flex animate-scroll-testimonials w-max group hover:[animation-play-state:paused]">
                    {extendedTestimonials.map((testimonial, index) => (
                        <li 
                            key={`${testimonial.id || index}-${index}`}
                            className="flex-shrink-0 w-80 md:w-96 mx-4 cursor-pointer"
                            onClick={() => setExpandedTestimonial(testimonial)}
                        >
                            <div className="bg-primary p-8 rounded-lg h-full flex flex-col justify-between transition-transform transform hover:-translate-y-2">
                                <p className="text-gray-dark mb-6 text-left">"{testimonial.text}"</p>
                                <div>
                                    <div className="flex items-center mb-4">
                                        <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full mr-4 object-cover" />
                                        <div className="text-left">
                                            <p className="font-bold">{testimonial.name}</p>
                                            <p className="text-sm text-gray-dark">{testimonial.role}, {testimonial.company}</p>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-800 pt-4">
                                        <StarRating rating={testimonial.rating} starClassName="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {expandedTestimonial && <TestimonialModal testimonial={expandedTestimonial} onClose={() => setExpandedTestimonial(null)} />}
        </section>
    );
};

const Pricing: React.FC<{ onRegister: () => void }> = ({ onRegister }) => {
    const { t } = useLanguage();
    
    // Função para processar compra de plano via Stripe
    const handlePlanPurchase = async (plan: Plan) => {
        try {
            const stripeService = StripeService.getInstance();
            
            const billingCycle = plan.name.toLowerCase().includes('mensal') ? 'monthly' :
                               plan.name.toLowerCase().includes('trimestral') ? 'quarterly' :
                               plan.name.toLowerCase().includes('semestral') ? 'semiannual' : 'annual';
            
            const subscriptionData = {
                amount: parseFloat(String(plan.price).replace(',', '.')),
                currency: 'BRL',
                description: `Assinatura ${plan.name} - ViralizaAI`,
                productId: plan.id || 'plan_' + Date.now(),
                productType: 'subscription' as const,
                userId: 'guest_' + Date.now(),
                userEmail: 'usuario@exemplo.com',
                successUrl: `${window.location.origin}/dashboard?payment=success`,
                cancelUrl: `${window.location.origin}/?payment=cancelled`,
                planId: plan.id || 'plan_' + Date.now(),
                planName: plan.name,
                billingCycle: billingCycle as 'monthly' | 'quarterly' | 'semiannual' | 'annual',
                metadata: {
                    planFeatures: Array.isArray(plan.features) ? plan.features.join(', ') : String(plan.features || '')
                }
            };
            
            await stripeService.processSubscriptionPayment(subscriptionData);
        } catch (error) {
            console.error('Erro ao processar pagamento:', error);
            alert('Erro ao processar pagamento. Tente novamente.');
        }
    };

    const defaultPlans: Plan[] = [
        { id: 'p1', name: t('plan.mensal'), price: '59.90', period: t('plan.period.month'), features: ['Crescimento Orgânico', 'Gestão de Conteúdo', 'Análises Básicas', t('plan.feature.conversion_tags')] },
        { id: 'p2', name: t('plan.trimestral'), price: '159.90', period: t('plan.period.quarter'), features: ['Tudo do Mensal', 'Análises Avançadas', 'IA Otimizada', t('plan.feature.retention_audio')] },
        { id: 'p3', name: t('plan.semestral'), price: '259.90', period: t('plan.period.semester'), features: ['Tudo do Trimestral', 'Relatórios Estratégicos', 'Acesso Beta', t('plan.feature.competitor_spy')], highlight: true },
        { id: 'p4', name: t('plan.anual'), price: '399.90', period: t('plan.period.year'), features: ['Tudo do Semestral', 'Gerente Dedicado', 'API de Integração', '2 Meses Grátis', t('plan.feature.future_trends')] },
    ];

    const [plans, setPlans] = useState<Plan[]>(defaultPlans);
    const [plansSource, setPlansSource] = useState<'default' | 'admin'>('default');

    useEffect(() => {
        try {
            const raw = localStorage.getItem('viraliza_plans');
            if (!raw) return;

            const stored: Plan[] = JSON.parse(raw);

            const metaById: Record<string, { period?: string; highlight?: boolean }> = {};
            defaultPlans.forEach((p) => {
                if (p.id) {
                    metaById[p.id] = {
                        period: p.period,
                        highlight: p.highlight
                    };
                }
            });

            const mapped: Plan[] = stored.map((p, index) => {
                const meta =
                    (p.id && metaById[p.id]) || metaById[`p${index + 1}`] || {};
                const period = meta.period || defaultPlans[index]?.period || '';
                const highlight =
                    typeof p.highlight === 'boolean'
                        ? p.highlight
                        : meta.highlight;

                return {
                    ...p,
                    price:
                        typeof p.price === 'number'
                            ? p.price.toFixed(2)
                            : p.price,
                    period,
                    features: Array.isArray(p.features)
                        ? p.features
                        : String(p.features || '')
                              .split(',')
                              .map((f) => f.trim())
                              .filter(Boolean),
                    highlight
                };
            });

            if (mapped.length > 0) {
                setPlans(mapped);
                setPlansSource('admin');
            }
        } catch (err) {
            console.error('Erro ao carregar planos do admin para a LandingPage:', err);
            setPlans(defaultPlans);
            setPlansSource('default');
        }
    }, [t]);

    return (
        <section id="pricing" className="py-20">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">Planos Flexíveis para Todos</h2>
                {plansSource === 'default' ? (
                    <p className="text-center text-gray-dark mb-9 text-sm">
                        Planos padrão de demonstração. O administrador pode ajustar os valores no painel.
                    </p>
                ) : (
                    <p className="text-center text-gray-dark mb-9 text-sm">
                        Valores atualizados em tempo real pelo painel administrativo.
                    </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     {plans.map((plan) => (
                        <div key={plan.name} className={`bg-secondary p-6 rounded-lg border flex flex-col transition-transform hover:-translate-y-2 ${plan.highlight ? 'border-accent shadow-lg shadow-accent/20' : 'border-gray-700'}`}>
                            {plan.highlight && <div className="bg-accent text-xs text-white px-2 py-1 rounded-full self-start mb-2 font-bold animate-pulse-badge">Recomendado</div>}
                            <h3 className="text-xl font-bold">{plan.name}</h3>
                            <p className="text-3xl font-bold mt-2">R$ {plan.price}<span className="text-base font-normal text-gray-dark">{plan.period}</span></p>
                            <ul className="mt-4 mb-6 space-y-2 text-sm text-gray-dark flex-grow">
                                {(Array.isArray(plan.features) ? plan.features : String(plan.features || '').split(',').map(f => f.trim()).filter(Boolean)).map((feat, i) => (
                                    <li key={i} className="flex items-start">
                                        {[t('plan.feature.conversion_tags'), t('plan.feature.retention_audio'), t('plan.feature.competitor_spy'), t('plan.feature.future_trends')].includes(feat) ? (
                                            <span className="text-yellow-400 mr-2 mt-1">★</span>
                                        ) : (
                                            <span className="text-accent mr-2 mt-1">✓</span>
                                        )}
                                        <span className={[t('plan.feature.conversion_tags'), t('plan.feature.retention_audio'), t('plan.feature.competitor_spy'), t('plan.feature.future_trends')].includes(feat) ? 'text-light font-semibold' : ''}>
                                            {feat}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <button 
                                onClick={() => handlePlanPurchase(plan)} 
                                className="w-full bg-accent text-light font-semibold py-3 mt-2 rounded-full hover:bg-blue-500 transition-colors"
                            >
                                Assine Agora
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const AffiliateSection: React.FC<{ onRegister: () => void }> = ({ onRegister }) => {
    return (
        <section id="affiliate" className="py-20 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    💰 Programa de Afiliados ViralizaAi
                </h2>
                <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
                    Ganhe até <span className="text-yellow-400 font-bold">40% de comissão</span> indicando nossos planos! 
                    Sistema de pagamento automático e suporte completo para afiliados.
                </p>
                
                <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
                        <div className="text-4xl mb-4">🎯</div>
                        <h3 className="text-xl font-bold text-white mb-2">Comissões Altas</h3>
                        <p className="text-gray-300">Até 40% de comissão recorrente em todos os planos vendidos</p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
                        <div className="text-4xl mb-4">⚡</div>
                        <h3 className="text-xl font-bold text-white mb-2">Pagamento Rápido</h3>
                        <p className="text-gray-300">Receba suas comissões automaticamente a cada 15 dias</p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
                        <div className="text-4xl mb-4">📊</div>
                        <h3 className="text-xl font-bold text-white mb-2">Dashboard Completo</h3>
                        <p className="text-gray-300">Acompanhe suas vendas, comissões e performance em tempo real</p>
                    </div>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-8 rounded-2xl max-w-2xl mx-auto">
                    <h3 className="text-2xl font-bold text-black mb-4">
                        🚀 Comece Agora e Ganhe Dinheiro!
                    </h3>
                    <p className="text-black/80 mb-6">
                        Cadastre-se gratuitamente e comece a ganhar comissões hoje mesmo
                    </p>
                    <button 
                        onClick={onRegister}
                        className="bg-black text-white font-bold py-4 px-8 rounded-full hover:bg-gray-800 transition-all transform hover:scale-105 shadow-lg"
                    >
                        Quero Ser Afiliado Agora!
                    </button>
                </div>
            </div>
        </section>
    );
};

const ClientLogos: React.FC = () => {
    const [logos, setLogos] = useState<TrustedCompany[]>([]);

    useEffect(() => {
        const loadLogos = async () => {
            const data = await getTrustedCompaniesDB();
            setLogos(data.filter(c => c.status === 'Active'));
        };
        loadLogos();
    }, []);

    if (logos.length === 0) return null;

    const extendedLogos = [...logos, ...logos];

    return (
        <div className="w-full overflow-hidden [mask-image:_linear_gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
            <ul className="flex animate-scroll w-max">
                {extendedLogos.map((logo, index) => (
                    <li key={`${logo.id}-${index}`} className="flex-shrink-0 mx-8">
                        <a 
                            href={logo.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-2xl font-bold text-gray-500 filter grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer"
                        >
                            {logo.name}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const Footer: React.FC = () => {
    const { t } = useLanguage();
    return (
        <footer className="bg-secondary py-12">
            <div className="container mx-auto px-6 text-center text-gray-dark flex flex-col items-center">
                 <div className="w-full mb-10">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-6">
                        CONFIADO POR EMPRESAS GLOBAIS
                    </h3>
                    <ClientLogos />
                </div>
                <Logo />
                <p className="mt-4">&copy; 2025 ViralizaAi. {t('footer.rights')}</p>
            </div>
        </footer>
    );
};

const LandingPage: React.FC = () => {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
    const [bannerMessage, setBannerMessage] = useState('');

    useEffect(() => {
        const href = window.location.href;
        let refCode = null;

        // email verification redirect: https://viralizaai.vercel.app/#/?emailVerified=1
        if (href.includes('emailVerified=1')) {
            setBannerMessage('E-mail confirmado! Agora você pode fazer login.');
        }

        if (href.includes('ref=')) {
            const urlParams = new URLSearchParams(href.split('?')[1]);
            refCode = urlParams.get('ref');
            
            if (!refCode && href.includes('#')) {
                 const hashParts = href.split('#')[1];
                 if (hashParts.includes('?')) {
                     const hashParams = new URLSearchParams(hashParts.split('?')[1]);
                     refCode = hashParams.get('ref');
                 }
            }
        }

        if (refCode) {
            sessionStorage.setItem('referralCode', refCode);
            setTimeout(() => {
                const pricingSection = document.getElementById('pricing');
                if (pricingSection) {
                    pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 500);
        }
    }, []);

    return (
        <div className="bg-primary min-h-screen">
            <Header onLogin={() => setIsLoginOpen(true)} onRegister={() => setIsRegisterOpen(true)} />
            <main>
                {bannerMessage && (
                    <div className="container mx-auto px-6 pt-6">
                        <div className="bg-green-500 bg-opacity-20 text-green-300 p-3 rounded-lg text-center">
                            {bannerMessage}
                        </div>
                    </div>
                )}
                
                {/* Ferramenta de Correção de Credenciais Admin - Apenas em desenvolvimento */}
                {window.location.hostname === 'localhost' && (
                    <div className="container mx-auto px-6 pt-6">
                        <AdminCredentialsFix />
                    </div>
                )}
                
                <Hero onRegister={() => setIsRegisterOpen(true)} onPersonaClick={() => setIsPersonaModalOpen(true)} />
                <Features />
                <WorldMap />
                <Testimonials />
                <Pricing onRegister={() => setIsRegisterOpen(true)} />
                <AffiliateSection onRegister={() => setIsRegisterOpen(true)} />
                <PartnerAdsSection onRegister={() => setIsRegisterOpen(true)} />
            </main>
            <Footer />

            {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
            {isRegisterOpen && <RegisterModal onClose={() => setIsRegisterOpen(false)} />}
            {isPersonaModalOpen && <InteractiveAIPersona onClose={() => setIsPersonaModalOpen(false)} />}
            
            {/* Botão de Auto Ajuda Flutuante e Arrastável */}
            <DraggableHelpButton />
        </div>
    );
};

export default LandingPage;