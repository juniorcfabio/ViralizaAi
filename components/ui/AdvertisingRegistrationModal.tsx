import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AdvertisingRegistrationModalProps {
  onClose: () => void;
}

interface CompanyData {
  companyName: string;
  cnpj: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const AdvertisingRegistrationModal: React.FC<AdvertisingRegistrationModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CompanyData>({
    companyName: '',
    cnpj: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.companyName.trim()) {
      setError('Nome da empresa é obrigatório');
      return false;
    }
    if (!formData.cnpj.trim()) {
      setError('CNPJ é obrigatório');
      return false;
    }
    if (!formData.email.trim()) {
      setError('E-mail é obrigatório');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Senha é obrigatória');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Senhas não coincidem');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Criar conta da empresa para anúncios
      const companyAccount = {
        id: `company_${Date.now()}`,
        type: 'advertiser',
        companyName: formData.companyName,
        cnpj: formData.cnpj,
        email: formData.email,
        password: formData.password,
        createdAt: new Date().toISOString(),
        status: 'pending_payment'
      };

      // Salvar no localStorage temporariamente
      localStorage.setItem('pending_advertiser', JSON.stringify(companyAccount));
      
      // Redirecionar para seleção de plano de anúncio
      onClose();
      navigate('/advertising-plans');
      
    } catch (error) {
      console.error('Erro ao cadastrar empresa:', error);
      setError('Erro ao cadastrar empresa. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-secondary p-8 rounded-lg shadow-xl w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-gray-dark hover:text-light transition-colors"
        >
          &times;
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-light mb-2">Anunciar Empresa</h2>
          <p className="text-gray-400 text-sm">Cadastre sua empresa para anunciar na página inicial</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              name="companyName"
              placeholder="Nome da Empresa"
              value={formData.companyName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-light placeholder-gray-400 focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>

          <div>
            <input
              type="text"
              name="cnpj"
              placeholder="CNPJ"
              value={formData.cnpj}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-light placeholder-gray-400 focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="E-mail"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-light placeholder-gray-400 focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>

          <div>
            <input
              type="password"
              name="password"
              placeholder="Senha"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-light placeholder-gray-400 focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>

          <div>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirmar Senha"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-light placeholder-gray-400 focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent hover:bg-accent/80 text-primary font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Cadastrando...' : 'Cadastrar e Iniciar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdvertisingRegistrationModal;
