
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const LockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);

const TrialExpiredOverlay: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const hadPlan = !!user?.plan;
    const title = hadPlan ? 'Sua Assinatura Expirou' : 'Seu Período de Teste Terminou';
    const description = hadPlan 
        ? 'Sua assinatura terminou. Para reativar seu acesso a todas as ferramentas e continuar impulsionando sua marca, por favor, renove seu plano.'
        : 'Obrigado por experimentar o Viraliza.ai! Para continuar usando nossas ferramentas e liberar todo o potencial da sua marca, por favor, escolha um de nossos planos.';
    const buttonText = hadPlan ? 'Renovar Assinatura' : 'Ver Planos e Assinar';

    return (
        <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-center p-4 animate-fade-in-right">
            <LockIcon className="w-16 h-16 text-accent mb-4" />
            <h2 className="text-3xl font-bold mb-2">{title}</h2>
            <p className="text-gray-dark max-w-md mb-6">
                {description}
            </p>
            <button 
                onClick={() => navigate('/dashboard/billing')}
                className="bg-accent text-light font-bold py-3 px-8 rounded-full hover:bg-blue-500 transition-transform transform hover:scale-105"
            >
                {buttonText}
            </button>
        </div>
    );
};

export default TrialExpiredOverlay;