import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import AffiliatePaymentService, { BankingData } from '../../services/affiliatePaymentService';
import BankingDataModal from './BankingDataModal';

const WithdrawalSection: React.FC = () => {
  const { user } = useAuth();
  const [isRequesting, setIsRequesting] = useState(false);
  const [showBankingModal, setShowBankingModal] = useState(false);
  const [notification, setNotification] = useState('');
  const [commissionRate, setCommissionRate] = useState(20);
  const [bankingData, setBankingData] = useState<BankingData | null>(null);

  const paymentService = AffiliatePaymentService.getInstance();

  useEffect(() => {
    if (user?.id) {
      // Carregar taxa de comissão atual
      const currentRate = paymentService.getCommissionPercentage();
      setCommissionRate(currentRate);

      // Carregar dados bancários
      const banking = paymentService.getBankingData(user.id);
      setBankingData(banking);

      // Escutar mudanças na comissão
      const handleCommissionUpdate = (event: CustomEvent) => {
        setCommissionRate(event.detail.percentage);
      };

      window.addEventListener('commissionUpdated', handleCommissionUpdate as EventListener);
      
      return () => {
        window.removeEventListener('commissionUpdated', handleCommissionUpdate as EventListener);
      };
    }
  }, [user?.id]);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleRequestWithdrawal = () => {
    if (!user?.id || !user?.affiliateInfo) {
      showNotification('❌ Erro: Dados do usuário não encontrados');
      return;
    }

    const earnings = user.affiliateInfo.earnings || 0;
    
    if (earnings < 50) {
      showNotification('❌ Valor mínimo para saque é R$ 50,00');
      return;
    }

    if (!bankingData) {
      showNotification('❌ Configure seus dados bancários primeiro');
      setShowBankingModal(true);
      return;
    }

    setIsRequesting(true);

    try {
      const request = paymentService.createWithdrawalRequest(
        user.id,
        user.name,
        user.email,
        earnings
      );

      if (request) {
        showNotification('✅ Solicitação de saque enviada com sucesso! Aguarde aprovação do admin.');
      } else {
        showNotification('❌ Erro ao criar solicitação de saque');
      }
    } catch (error) {
      console.error('Erro ao solicitar saque:', error);
      showNotification('❌ Erro ao processar solicitação');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleBankingDataSave = (data: BankingData) => {
    setBankingData(data);
    showNotification('✅ Dados bancários salvos com sucesso!');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const pendingEarnings = user?.affiliateInfo?.earnings || 0;
  const canWithdraw = pendingEarnings >= 50;
  const hasBankingData = !!bankingData;

  return (
    <div className="bg-secondary p-6 rounded-lg">
      {notification && (
        <div className="bg-green-500 bg-opacity-20 text-green-300 p-3 rounded-lg mb-4 text-center">
          {notification}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold">💸 Solicitar Saque</h3>
          <p className="text-gray-dark text-sm">
            Valor disponível: <span className="text-green-400 font-semibold">{formatCurrency(pendingEarnings)}</span>
          </p>
          <p className="text-gray-dark text-xs mt-1">
            Comissão atual: <span className="text-accent font-semibold">{commissionRate}%</span> • 
            Valor mínimo: R$ 50,00 • Processamento automático após aprovação
          </p>
        </div>
        
        <div className="flex gap-3">
          {!hasBankingData && (
            <button
              onClick={() => setShowBankingModal(true)}
              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              🏦 Configurar Dados Bancários
            </button>
          )}
          
          <button
            onClick={handleRequestWithdrawal}
            disabled={!canWithdraw || !hasBankingData || isRequesting}
            className="bg-accent text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
          >
            {isRequesting ? '⏳ Processando...' : '💰 Solicitar Saque'}
          </button>
        </div>
      </div>

      {!canWithdraw && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 p-4 rounded-lg mb-4">
          <p className="text-sm">
            ⚠️ Você precisa ter pelo menos R$ 50,00 em comissões para solicitar um saque.
          </p>
        </div>
      )}

      {!hasBankingData && (
        <div className="bg-blue-500/20 border border-blue-500/30 text-blue-300 p-4 rounded-lg mb-4">
          <p className="text-sm">
            ℹ️ Configure seus dados bancários para poder solicitar saques.
          </p>
        </div>
      )}

      {hasBankingData && (
        <div className="bg-primary p-4 rounded-lg border border-gray-600">
          <h4 className="font-semibold mb-2">📋 Dados Bancários Configurados</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-dark">Banco:</p>
              <p>{bankingData.bank}</p>
            </div>
            <div>
              <p className="text-gray-dark">Agência:</p>
              <p>{bankingData.agency}</p>
            </div>
            <div>
              <p className="text-gray-dark">Conta:</p>
              <p>{bankingData.account} ({bankingData.accountType})</p>
            </div>
            <div>
              <p className="text-gray-dark">Titular:</p>
              <p>{bankingData.accountHolder}</p>
            </div>
            {bankingData.pixKey && (
              <div className="col-span-2">
                <p className="text-gray-dark">Chave PIX:</p>
                <p className="text-accent">{bankingData.pixKey}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowBankingModal(true)}
            className="mt-3 text-accent hover:text-blue-400 text-sm underline"
          >
            ✏️ Editar dados bancários
          </button>
        </div>
      )}

      {/* Modal de Dados Bancários */}
      <BankingDataModal
        isOpen={showBankingModal}
        onClose={() => setShowBankingModal(false)}
        affiliateId={user?.id || ''}
        onSave={handleBankingDataSave}
      />
    </div>
  );
};

export default WithdrawalSection;
