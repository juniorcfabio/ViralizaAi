
import React from 'react';
import { useNavigate } from 'react-router-dom';

const LockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);

interface PaywallModalProps {
    onClose: () => void;
}

const PaywallModal: React.FC<PaywallModalProps> = ({ onClose }) => {
    const navigate = useNavigate();

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in-up">
            <div className="bg-secondary p-8 rounded-xl shadow-2xl w-full max-w-md border border-accent/50 text-center relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    &times;
                </button>
                
                <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <LockIcon className="w-10 h-10 text-accent" />
                </div>
                
                <h2 className="text-2xl font-bold mb-3 text-light">Acesso Restrito</h2>
                <p className="text-gray-300 mb-8 leading-relaxed">
                    Seu período de degustação de 24h encerrou. <br/>
                    Para continuar criando campanhas, gerando vídeos e usando a IA, escolha um plano que combine com seu negócio.
                </p>
                
                <div className="space-y-3">
                    <button 
                        onClick={() => navigate('/dashboard/billing')}
                        className="w-full bg-accent text-light font-bold py-4 rounded-full hover:bg-blue-600 transition-all transform hover:scale-105 shadow-lg shadow-accent/25"
                    >
                        Ver Planos e Liberar Acesso
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full bg-transparent text-gray-500 font-semibold py-2 hover:text-gray-300 text-sm"
                    >
                        Apenas visualizar meus dados
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaywallModal;
