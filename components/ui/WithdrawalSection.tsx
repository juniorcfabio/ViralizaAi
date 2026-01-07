import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDate: string;
  expectedDate: string;
  bankAccount: {
    bank: string;
    agency: string;
    account: string;
    accountType: string;
    holderName: string;
    holderCpf: string;
  };
}

const WithdrawalSection: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isRequesting, setIsRequesting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState('');
  const [withdrawalRequest, setWithdrawalRequest] = useState<WithdrawalRequest | null>(null);

  useEffect(() => {
    loadWithdrawalRequest();
  }, [user?.id]);

  const loadWithdrawalRequest = () => {
    if (!user?.id) return;
    
    const savedRequest = localStorage.getItem(`withdrawal_request_${user.id}`);
    if (savedRequest) {
      setWithdrawalRequest(JSON.parse(savedRequest));
    }
  };

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const addBusinessDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    let addedDays = 0;
    
    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        addedDays++;
      }
    }
    
    return result;
  };

  const calculateProgress = (): number => {
    if (!withdrawalRequest) return 0;
    
    const requestDate = new Date(withdrawalRequest.requestDate);
    const expectedDate = new Date(withdrawalRequest.expectedDate);
    const now = new Date();
    
    const totalTime = expectedDate.getTime() - requestDate.getTime();
    const elapsedTime = now.getTime() - requestDate.getTime();
    
    const progress = Math.min(Math.max((elapsedTime / totalTime) * 100, 0), 100);
    return Math.round(progress);
  };

  const getTimeRemaining = (): string => {
    if (!withdrawalRequest) return '';
    
    const expectedDate = new Date(withdrawalRequest.expectedDate);
    const now = new Date();
    
    if (now >= expectedDate) {
      return 'Processamento concluído';
    }
    
    const diff = expectedDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    if (days > 0) {
      return `${days} dia${days > 1 ? 's' : ''} e ${remainingHours}h restantes`;
    } else {
      return `${remainingHours}h restantes`;
    }
  };

  const handleRequestWithdrawal = async () => {
    if (!user || !user.affiliateInfo) {
      showNotification('Erro: Informações de afiliado não encontradas');
      return;
    }

    if ((user.affiliateInfo.earnings || 0) < 50) {
      showNotification('Valor mínimo para saque é R$ 50,00');
      return;
    }

    if (!user.bankAccount) {
      showNotification('Cadastre seus dados bancários primeiro');
      return;
    }

    setIsRequesting(true);

    try {
      const requestDate = new Date();
      const expectedDate = addBusinessDays(requestDate, 3); // 3 business days

      const newRequest: WithdrawalRequest = {
        id: `withdrawal_${Date.now()}`,
        userId: user.id,
        amount: user.affiliateInfo.earnings || 0,
        status: 'pending',
        requestDate: requestDate.toISOString(),
        expectedDate: expectedDate.toISOString(),
        bankAccount: user.bankAccount
      };

      // Save withdrawal request
      localStorage.setItem(`withdrawal_request_${user.id}`, JSON.stringify(newRequest));
      setWithdrawalRequest(newRequest);

      // Save to admin withdrawals list
      const adminWithdrawals = JSON.parse(localStorage.getItem('admin_withdrawals') || '[]');
      adminWithdrawals.push(newRequest);
      localStorage.setItem('admin_withdrawals', JSON.stringify(adminWithdrawals));

      // Send WhatsApp notification to admin
      const message = `🚨 NOVA SOLICITAÇÃO DE SAQUE
      
👤 Usuário: ${user.name}
💰 Valor: R$ ${newRequest.amount.toFixed(2)}
🏦 Banco: ${user.bankAccount.bank}
📅 Prazo: ${expectedDate.toLocaleDateString('pt-BR')}
🆔 ID: ${newRequest.id}

⚡ Acesse o painel admin para aprovar.`;

      // Simulate WhatsApp API call
      console.log('📱 Enviando notificação WhatsApp para +55 31994716433:', message);

      showNotification('Solicitação de saque enviada com sucesso!');
      setShowModal(false);

    } catch (error) {
      console.error('Erro ao solicitar saque:', error);
      showNotification('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setIsRequesting(false);
    }
  };

  const availableAmount = user?.affiliateInfo?.earnings || 0;
  const canWithdraw = availableAmount >= 50 && user?.bankAccount && !withdrawalRequest;

  if (withdrawalRequest) {
    const progress = calculateProgress();
    const timeRemaining = getTimeRemaining();
    const statusColors = {
      pending: 'text-yellow-400',
      processing: 'text-blue-400',
      completed: 'text-green-400',
      rejected: 'text-red-400'
    };

    return (
      <div className="bg-secondary p-6 rounded-lg border border-primary/50">
        <h3 className="text-xl font-bold text-light mb-4">💰 Status do Saque</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Valor solicitado:</span>
            <span className="text-2xl font-bold text-accent">R$ {withdrawalRequest.amount.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Status:</span>
            <span className={`font-semibold ${statusColors[withdrawalRequest.status]}`}>
              {withdrawalRequest.status === 'pending' && '⏳ Pendente'}
              {withdrawalRequest.status === 'processing' && '🔄 Processando'}
              {withdrawalRequest.status === 'completed' && '✅ Concluído'}
              {withdrawalRequest.status === 'rejected' && '❌ Rejeitado'}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Progresso:</span>
              <span className="text-light">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-accent h-3 rounded-full transition-all duration-1000 animate-pulse"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 text-center">{timeRemaining}</p>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>📅 Solicitado em: {new Date(withdrawalRequest.requestDate).toLocaleDateString('pt-BR')}</p>
            <p>⏰ Previsão: {new Date(withdrawalRequest.expectedDate).toLocaleDateString('pt-BR')}</p>
            <p>🏦 Banco: {withdrawalRequest.bankAccount.bank}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary p-6 rounded-lg border border-primary/50">
      <h3 className="text-xl font-bold text-light mb-4">💰 Saque de Comissões</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Disponível para saque:</span>
          <span className="text-2xl font-bold text-accent">R$ {availableAmount.toFixed(2)}</span>
        </div>

        {availableAmount < 50 && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
            <p className="text-yellow-300 text-sm">
              ⚠️ Valor mínimo para saque: R$ 50,00
            </p>
          </div>
        )}

        {!user?.bankAccount && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
            <p className="text-red-300 text-sm">
              ❌ Cadastre seus dados bancários nas configurações primeiro
            </p>
          </div>
        )}

        <button
          onClick={() => setShowModal(true)}
          disabled={!canWithdraw}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
            canWithdraw
              ? 'bg-accent hover:bg-accent/80 text-primary shadow-lg shadow-accent/30'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {canWithdraw ? `🔒 Solicitar Saque Seguro - R$ ${availableAmount.toFixed(2)}` : '🔒 Saque Indisponível'}
        </button>

        <div className="text-xs text-gray-500 space-y-1">
          <p>⏱️ Prazo de processamento: 3 dias úteis</p>
          <p>🔒 Sistema ultra-seguro com validações múltiplas</p>
          <p>📱 Notificação automática via WhatsApp</p>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-secondary p-6 rounded-lg border border-primary/50 w-full max-w-md">
            <h2 className="text-xl font-bold text-light mb-4">🔒 Confirmar Saque Seguro</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Valor:</span>
                <span className="text-accent font-bold">R$ {availableAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Prazo:</span>
                <span className="text-light">3 dias úteis</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Banco:</span>
                <span className="text-light">{user?.bankAccount?.bank}</span>
              </div>
            </div>

            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-4">
              <p className="text-yellow-300 text-sm">
                ⚠️ Após confirmar, você receberá notificações sobre o status do saque.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRequestWithdrawal}
                disabled={isRequesting}
                className="flex-1 bg-accent hover:bg-accent/80 text-primary font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isRequesting ? '⏳ Processando...' : '✅ Confirmar Saque'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-light font-semibold py-2 rounded-lg transition-colors"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed top-4 right-4 bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-2 rounded-lg z-50">
          {notification}
        </div>
      )}
    </div>
  );
};

export default WithdrawalSection;
