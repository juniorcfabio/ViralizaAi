import React, { useState, useEffect } from 'react';
import AffiliatePaymentService, { BankingData } from '../../services/affiliatePaymentService';

interface BankingDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  affiliateId: string;
  onSave: (data: BankingData) => void;
}

const BankingDataModal: React.FC<BankingDataModalProps> = ({
  isOpen,
  onClose,
  affiliateId,
  onSave
}) => {
  const [formData, setFormData] = useState<BankingData>({
    bank: '',
    agency: '',
    account: '',
    pixKey: '',
    accountType: 'corrente',
    accountHolder: '',
    cpf: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const paymentService = AffiliatePaymentService.getInstance();

  useEffect(() => {
    if (isOpen && affiliateId) {
      // Carregar dados bancários existentes
      const existingData = paymentService.getBankingData(affiliateId);
      if (existingData) {
        setFormData(existingData);
      }
    }
  }, [isOpen, affiliateId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validações básicas
      if (!formData.bank || !formData.agency || !formData.account || !formData.accountHolder || !formData.cpf) {
        alert('❌ Preencha todos os campos obrigatórios');
        return;
      }

      if (!formData.pixKey && !formData.account) {
        alert('❌ Informe pelo menos a chave PIX ou dados da conta');
        return;
      }

      // Salvar dados bancários
      paymentService.saveBankingData(affiliateId, formData);
      onSave(formData);
      onClose();

      alert('✅ Dados bancários salvos com sucesso!');

    } catch (error) {
      console.error('❌ Erro ao salvar dados bancários:', error);
      alert('❌ Erro ao salvar dados bancários. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-secondary rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-accent/20">
          <h2 className="text-2xl font-bold text-light flex items-center gap-3">
            🏦 Dados Bancários
          </h2>
          <p className="text-gray-300 mt-2">
            Configure seus dados bancários para receber os pagamentos de comissão
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-light border-b border-accent/20 pb-2">
              📋 Dados Pessoais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Titular *
                </label>
                <input
                  type="text"
                  name="accountHolder"
                  value={formData.accountHolder}
                  onChange={handleInputChange}
                  className="w-full bg-primary border border-accent/30 rounded-lg px-4 py-3 text-light focus:border-accent focus:outline-none"
                  placeholder="Nome completo do titular"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CPF *
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  className="w-full bg-primary border border-accent/30 rounded-lg px-4 py-3 text-light focus:border-accent focus:outline-none"
                  placeholder="000.000.000-00"
                  required
                />
              </div>
            </div>
          </div>

          {/* Dados Bancários */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-light border-b border-accent/20 pb-2">
              🏛️ Dados Bancários
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Banco *
                </label>
                <input
                  type="text"
                  name="bank"
                  value={formData.bank}
                  onChange={handleInputChange}
                  className="w-full bg-primary border border-accent/30 rounded-lg px-4 py-3 text-light focus:border-accent focus:outline-none"
                  placeholder="Ex: 208 - Banco BTG Pactual"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Conta *
                </label>
                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleInputChange}
                  className="w-full bg-primary border border-accent/30 rounded-lg px-4 py-3 text-light focus:border-accent focus:outline-none"
                  required
                >
                  <option value="corrente">Conta Corrente</option>
                  <option value="poupanca">Conta Poupança</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Agência *
                </label>
                <input
                  type="text"
                  name="agency"
                  value={formData.agency}
                  onChange={handleInputChange}
                  className="w-full bg-primary border border-accent/30 rounded-lg px-4 py-3 text-light focus:border-accent focus:outline-none"
                  placeholder="0000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Conta *
                </label>
                <input
                  type="text"
                  name="account"
                  value={formData.account}
                  onChange={handleInputChange}
                  className="w-full bg-primary border border-accent/30 rounded-lg px-4 py-3 text-light focus:border-accent focus:outline-none"
                  placeholder="00000-0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Chave PIX */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-light border-b border-accent/20 pb-2">
              📱 Chave PIX (Opcional)
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Chave PIX
              </label>
              <input
                type="text"
                name="pixKey"
                value={formData.pixKey}
                onChange={handleInputChange}
                className="w-full bg-primary border border-accent/30 rounded-lg px-4 py-3 text-light focus:border-accent focus:outline-none"
                placeholder="CPF, e-mail, telefone ou chave aleatória"
              />
              <p className="text-xs text-gray-400 mt-1">
                A chave PIX acelera o processamento dos pagamentos
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-6 border-t border-accent/20">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-accent hover:bg-accent/80 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? '💾 Salvando...' : '💾 Salvar Dados'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankingDataModal;
