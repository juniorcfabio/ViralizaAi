import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AffiliateRegistrationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AffiliateRegistrationModal: React.FC<AffiliateRegistrationModalProps> = ({ onClose, onSuccess }) => {
  const { user, activateAffiliate } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    cpf: '',
    bankName: '',
    bankAgency: '',
    bankAccount: '',
    accountType: 'corrente',
    pixKey: '',
    pixType: 'cpf',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Nome completo é obrigatório';
    if (!formData.email.trim()) newErrors.email = 'E-mail é obrigatório';
    if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
    if (!formData.cpf.trim()) newErrors.cpf = 'CPF é obrigatório';
    if (!formData.pixKey.trim()) newErrors.pixKey = 'Chave PIX é obrigatória';
    if (!formData.address.trim()) newErrors.address = 'Endereço é obrigatório';
    if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
    if (!formData.state.trim()) newErrors.state = 'Estado é obrigatório';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'CEP é obrigatório';

    // Validação de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    // Validação de CPF (básica)
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
    if (formData.cpf && !cpfRegex.test(formData.cpf)) {
      newErrors.cpf = 'CPF deve ter formato 000.000.000-00 ou 11 dígitos';
    }

    // Validação de telefone
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Telefone deve ter formato (00) 00000-0000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Gerar código de referência único
      const referralCode = `${user?.name?.replace(/\s+/g, '').toLowerCase() || 'user'}_${Date.now().toString(36)}`;
      
      // Dados do afiliado para salvar
      const affiliateData = {
        referralCode,
        personalInfo: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          cpf: formData.cpf,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        bankingInfo: {
          bankName: formData.bankName,
          bankAgency: formData.bankAgency,
          bankAccount: formData.bankAccount,
          accountType: formData.accountType,
          pixKey: formData.pixKey,
          pixType: formData.pixType
        },
        commissionRate: 0.30, // 30% de comissão
        status: 'active',
        createdAt: new Date().toISOString()
      };

      // Ativar afiliado com dados completos
      if (user) {
        await activateAffiliate(user.id, affiliateData);
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Erro ao ativar conta de afiliado:', error);
      setErrors({ general: 'Erro ao ativar conta. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-secondary rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Ativar Conta de Afiliado</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-gray-400 mt-2">
            Preencha seus dados para ativar sua conta de afiliado e começar a ganhar comissões
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded">
              {errors.general}
            </div>
          )}

          {/* Dados Pessoais */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">📋 Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={`w-full bg-primary border rounded-lg px-3 py-2 text-white ${
                    errors.fullName ? 'border-red-500' : 'border-gray-600'
                  } focus:border-accent focus:outline-none`}
                  placeholder="Seu nome completo"
                />
                {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  E-mail *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full bg-primary border rounded-lg px-3 py-2 text-white ${
                    errors.email ? 'border-red-500' : 'border-gray-600'
                  } focus:border-accent focus:outline-none`}
                  placeholder="seu@email.com"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefone *
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full bg-primary border rounded-lg px-3 py-2 text-white ${
                    errors.phone ? 'border-red-500' : 'border-gray-600'
                  } focus:border-accent focus:outline-none`}
                  placeholder="(11) 99999-9999"
                />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
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
                  className={`w-full bg-primary border rounded-lg px-3 py-2 text-white ${
                    errors.cpf ? 'border-red-500' : 'border-gray-600'
                  } focus:border-accent focus:outline-none`}
                  placeholder="000.000.000-00"
                />
                {errors.cpf && <p className="text-red-400 text-xs mt-1">{errors.cpf}</p>}
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">📍 Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`w-full bg-primary border rounded-lg px-3 py-2 text-white ${
                    errors.address ? 'border-red-500' : 'border-gray-600'
                  } focus:border-accent focus:outline-none`}
                  placeholder="Rua, número, bairro"
                />
                {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cidade *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`w-full bg-primary border rounded-lg px-3 py-2 text-white ${
                    errors.city ? 'border-red-500' : 'border-gray-600'
                  } focus:border-accent focus:outline-none`}
                  placeholder="Sua cidade"
                />
                {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estado *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className={`w-full bg-primary border rounded-lg px-3 py-2 text-white ${
                    errors.state ? 'border-red-500' : 'border-gray-600'
                  } focus:border-accent focus:outline-none`}
                  placeholder="SP"
                />
                {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CEP *
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  className={`w-full bg-primary border rounded-lg px-3 py-2 text-white ${
                    errors.zipCode ? 'border-red-500' : 'border-gray-600'
                  } focus:border-accent focus:outline-none`}
                  placeholder="00000-000"
                />
                {errors.zipCode && <p className="text-red-400 text-xs mt-1">{errors.zipCode}</p>}
              </div>
            </div>
          </div>

          {/* Dados Bancários */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">🏦 Dados Bancários (Opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Banco
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  className="w-full bg-primary border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-accent focus:outline-none"
                  placeholder="Nome do banco"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Agência
                </label>
                <input
                  type="text"
                  name="bankAgency"
                  value={formData.bankAgency}
                  onChange={handleInputChange}
                  className="w-full bg-primary border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-accent focus:outline-none"
                  placeholder="0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Conta
                </label>
                <input
                  type="text"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleInputChange}
                  className="w-full bg-primary border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-accent focus:outline-none"
                  placeholder="00000-0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Conta
                </label>
                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleInputChange}
                  className="w-full bg-primary border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-accent focus:outline-none"
                >
                  <option value="corrente">Conta Corrente</option>
                  <option value="poupanca">Poupança</option>
                </select>
              </div>
            </div>
          </div>

          {/* PIX */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">💳 Dados PIX *</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo da Chave PIX
                </label>
                <select
                  name="pixType"
                  value={formData.pixType}
                  onChange={handleInputChange}
                  className="w-full bg-primary border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-accent focus:outline-none"
                >
                  <option value="cpf">CPF</option>
                  <option value="email">E-mail</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Chave Aleatória</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Chave PIX *
                </label>
                <input
                  type="text"
                  name="pixKey"
                  value={formData.pixKey}
                  onChange={handleInputChange}
                  className={`w-full bg-primary border rounded-lg px-3 py-2 text-white ${
                    errors.pixKey ? 'border-red-500' : 'border-gray-600'
                  } focus:border-accent focus:outline-none`}
                  placeholder="Sua chave PIX"
                />
                {errors.pixKey && <p className="text-red-400 text-xs mt-1">{errors.pixKey}</p>}
              </div>
            </div>
          </div>

          {/* Informações sobre comissão */}
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 p-4 rounded-lg border border-accent/30">
            <h4 className="text-lg font-semibold text-white mb-2">💰 Informações sobre Comissões</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• <strong>Taxa de comissão:</strong> 30% sobre todas as vendas</li>
              <li>• <strong>Pagamento:</strong> A cada 3 dias úteis via PIX</li>
              <li>• <strong>Valor mínimo:</strong> R$ 50,00 para saque</li>
              <li>• <strong>Acompanhamento:</strong> Dashboard em tempo real</li>
            </ul>
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-accent text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Ativando...' : 'Ativar Conta de Afiliado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AffiliateRegistrationModal;
