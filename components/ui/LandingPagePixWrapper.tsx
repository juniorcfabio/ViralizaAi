import React, { useState } from 'react';
import SimplePixModal from './SimplePixModal';

interface Plan {
  id?: string;
  name: string;
  price: string | number;
  period?: string;
  features: string[];
  highlight?: boolean;
}

interface LandingPagePixWrapperProps {
  children: React.ReactNode;
}

const LandingPagePixWrapper: React.FC<LandingPagePixWrapperProps> = ({ children }) => {
  const [showPixModal, setShowPixModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  // Função global para abrir PIX modal
  const openPixModal = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPixModal(true);
  };

  // Adicionar função global ao window
  React.useEffect(() => {
    (window as any).openPixModal = openPixModal;
    return () => {
      delete (window as any).openPixModal;
    };
  }, []);

  return (
    <>
      {children}
      
      {/* Modal PIX Global */}
      {showPixModal && selectedPlan && (
        <SimplePixModal
          isOpen={showPixModal}
          onClose={() => {
            setShowPixModal(false);
            setSelectedPlan(null);
          }}
          planName={selectedPlan.name}
          amount={parseFloat(String(selectedPlan.price).replace(',', '.'))}
          onPaymentSuccess={() => {
            setShowPixModal(false);
            setSelectedPlan(null);
            alert('✅ Pagamento PIX realizado! Seu plano será ativado em breve.');
          }}
        />
      )}
    </>
  );
};

export default LandingPagePixWrapper;
