import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, RegistrationData } from '../../contexts/AuthContextFixed';

const AppleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-.93 3.69-.93.95 0 1.77.32 2.45.91-.8.5-1.38 1.18-1.38 2.24 0 1.6.96 2.18 1.38 2.35-.74 2.65-2.13 5.3-3.66 7.66zm-3.27-14.06c-.25-.01-.57.07-.89.24-1.2.62-1.65 1.73-1.6 2.95 1.23.13 2.32-.48 2.85-1.43.53-.97.17-1.7-.36-1.76z" />
    </svg>
);

const LoginModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const navigate = useNavigate();

    const handleSupabaseLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);

        try {
            const { loginUser } = await import('../../src/services/auth');
            const data = await loginUser(email, password);
            
            console.log('✅ Login Supabase realizado com sucesso');
            onClose();
            navigate('/dashboard');
            
        } catch (error: any) {
            console.error('❌ Erro no login Supabase:', error);
            setError(error.message || 'Erro ao fazer login');
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary p-8 rounded-lg shadow-xl w-full max-w-sm relative animate-fade-in-right">
                <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-gray-dark hover:text-light">&times;</button>
                <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
                
                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                
                <form onSubmit={handleSupabaseLogin} className="space-y-4">
                    <input 
                        type="email" 
                        placeholder="E-mail" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                        disabled={isLoggingIn}
                    />
                    <input 
                        type="password" 
                        placeholder="Senha" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        className="w-full bg-primary p-3 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent"
                        disabled={isLoggingIn}
                    />
                    
                    <button 
                        type="submit" 
                        disabled={isLoggingIn}
                        className="w-full bg-accent text-light font-semibold py-3 rounded hover:bg-blue-500 transition-colors disabled:opacity-50"
                    >
                        {isLoggingIn ? 'Entrando...' : 'Entrar'}
                    </button>
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
    const { register, isLoading } = useAuth();
    const navigate = useNavigate();

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
            setSuccessMessage('Cadastro realizado! Redirecionando para escolher seu plano...');
            // Redirecionar para billing após 1.5s
            setTimeout(() => {
                onClose();
                navigate('/dashboard/billing');
            }, 1500);
        } else {
            setError(result.message || 'Ocorreu um erro no cadastro.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary p-8 rounded-lg shadow-xl w-full max-w-md relative animate-fade-in-right max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-2xl text-gray-dark hover:text-light">&times;</button>
                <h2 className="text-2xl font-bold mb-6 text-center">Criar Conta</h2>
                
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

const LandingPageClean: React.FC = () => {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    return (
        <div className="min-h-screen bg-primary text-light">
            <header className="bg-secondary shadow-lg">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-accent">Viraliza.AI</h1>
                    <div className="space-x-4">
                        <button 
                            onClick={() => setShowLoginModal(true)}
                            className="bg-accent text-light px-4 py-2 rounded hover:bg-blue-500 transition-colors"
                        >
                            Login
                        </button>
                        <button 
                            onClick={() => setShowRegisterModal(true)}
                            className="bg-primary text-light px-4 py-2 rounded border border-accent hover:bg-accent transition-colors"
                        >
                            Cadastrar
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-16">
                <div className="text-center">
                    <h2 className="text-4xl font-bold mb-6">Sistema de Autenticação Supabase</h2>
                    <p className="text-xl mb-8">Teste o novo sistema de login e cadastro com Supabase Auth</p>
                    
                    <div className="space-y-4">
                        <p className="text-lg">✅ Login com supabase.auth.signInWithPassword</p>
                        <p className="text-lg">✅ Cadastro com supabase.auth.signUp</p>
                        <p className="text-lg">✅ Sessão gerenciada por supabase.auth.getSession</p>
                        <p className="text-lg">❌ Removido localStorage para login</p>
                        <p className="text-lg">❌ Removida comparação manual de senha</p>
                        <p className="text-lg">❌ Removidas consultas à tabela users manual</p>
                    </div>
                </div>
            </main>

            {showLoginModal && (
                <LoginModal onClose={() => setShowLoginModal(false)} />
            )}

            {showRegisterModal && (
                <RegisterModal onClose={() => setShowRegisterModal(false)} />
            )}
        </div>
    );
};

export default LandingPageClean;
