
import React from 'react';
import { useNavigate } from 'react-router-dom';

const LockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);

interface FeatureLockedOverlayProps {
    featureName: string;
    requiredPlan: string;
}

const FeatureLockedOverlay: React.FC<FeatureLockedOverlayProps> = ({ featureName, requiredPlan }) => {
    const navigate = useNavigate();

    return (
        <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm flex flex-col items-center justify-center z-40 text-center p-4 m-6 rounded-lg">
            <LockIcon className="w-16 h-16 text-accent mb-4" />
            <h2 className="text-3xl font-bold mb-2">Funcionalidade Bloqueada</h2>
            <p className="text-gray-dark max-w-md mb-6">
                A ferramenta <strong>{featureName}</strong> está disponível a partir do <strong>{requiredPlan}</strong>. Faça um upgrade para desbloquear esta e outras funcionalidades avançadas.
            </p>
            <button 
                onClick={() => navigate('/dashboard/billing')}
                className="bg-accent text-light font-bold py-3 px-8 rounded-full hover:bg-blue-500 transition-transform transform hover:scale-105"
            >
                Fazer Upgrade do Plano
            </button>
        </div>
    );
};

export default FeatureLockedOverlay;