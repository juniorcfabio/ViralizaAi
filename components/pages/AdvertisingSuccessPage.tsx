import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface PartnerData {
  companyName: string;
  description: string;
  category: string;
  website: string;
  instagram: string;
  logo: string;
  contactEmail: string;
  contactPhone: string;
}

const AdvertisingSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<PartnerData>({
    companyName: '',
    description: '',
    category: '',
    website: '',
    instagram: '',
    logo: '',
    contactEmail: '',
    contactPhone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Verificar se o pagamento foi confirmado
    const planId = searchParams.get('plan');
    const pendingAdvertiser = localStorage.getItem('pending_advertiser');
    const selectedPlan = localStorage.getItem('selected_advertising_plan');

    if (!planId || !pendingAdvertiser || !selectedPlan) {
      navigate('/');
      return;
    }

    // Pré-preencher dados da empresa
    const advertiserData = JSON.parse(pendingAdvertiser);
    setFormData(prev => ({
      ...prev,
      companyName: advertiserData.companyName,
      contactEmail: advertiserData.email
    }));
  }, [searchParams, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    if (!formData.description.trim()) {
      setError('Descrição da empresa é obrigatória');
      return false;
    }
    if (!formData.category.trim()) {
      setError('Categoria é obrigatória');
      return false;
    }
    if (!formData.contactEmail.trim()) {
      setError('E-mail de contato é obrigatório');
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

    setIsSubmitting(true);

    try {
      const pendingAdvertiser = localStorage.getItem('pending_advertiser');
      const selectedPlan = localStorage.getItem('selected_advertising_plan');
      
      if (!pendingAdvertiser || !selectedPlan) {
        throw new Error('Dados não encontrados');
      }

      const advertiserData = JSON.parse(pendingAdvertiser);
      const planData = JSON.parse(selectedPlan);

      // Calcular data de expiração
      const startDate = new Date();
      const expirationDate = new Date();
      expirationDate.setDate(startDate.getDate() + planData.days);

      // Criar dados do parceiro para exibição na página inicial
      const partnerData = {
        id: `partner_${Date.now()}`,
        name: formData.companyName,
        category: formData.category,
        description: formData.description,
        website: formData.website,
        instagram: formData.instagram,
        logo: formData.logo || '/default-company-logo.png',
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        advertiserId: advertiserData.id,
        planId: planData.id,
        planName: planData.name,
        startDate: startDate.toISOString(),
        expirationDate: expirationDate.toISOString(),
        isActive: true,
        isPaid: true
      };

      // Salvar parceiro ativo
      const activePartners = JSON.parse(localStorage.getItem('active_partners') || '[]');
      activePartners.push(partnerData);
      localStorage.setItem('active_partners', JSON.stringify(activePartners));
      // SYNC COM SUPABASE
      import('../../src/lib/supabase').then(({ supabase }) => {
        supabase.from('system_settings').upsert({ key: 'active_partners', value: activePartners, updated_at: new Date().toISOString() }).then(() => {});
      });

      // Salvar histórico de anúncios
      const advertisingHistory = JSON.parse(localStorage.getItem('advertising_history') || '[]');
      advertisingHistory.push({
        ...partnerData,
        paymentDate: new Date().toISOString(),
        amount: planData.currentPrice
      });
      localStorage.setItem('advertising_history', JSON.stringify(advertisingHistory));

      // Limpar dados temporários
      localStorage.removeItem('pending_advertiser');
      localStorage.removeItem('selected_advertising_plan');

      // Mostrar sucesso e redirecionar
      alert('Anúncio cadastrado com sucesso! Sua empresa já está sendo exibida na página inicial.');
      navigate('/');

    } catch (error) {
      console.error('Erro ao cadastrar parceiro:', error);
      setError('Erro ao cadastrar anúncio. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-light">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold mb-2">Pagamento Confirmado!</h1>
            <p className="text-gray-400">
              Agora preencha os dados da sua empresa para aparecer na página inicial
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-secondary p-8 rounded-lg space-y-6">
            <h2 className="text-2xl font-bold mb-6">Dados do Parceiro</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-light focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Categoria *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-light focus:outline-none focus:border-accent"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="TECNOLOGIA">Tecnologia</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="EDUCAÇÃO">Educação</option>
                  <option value="SAÚDE">Saúde</option>
                  <option value="FINANÇAS">Finanças</option>
                  <option value="E-COMMERCE">E-commerce</option>
                  <option value="CONSULTORIA">Consultoria</option>
                  <option value="DESIGN">Design</option>
                  <option value="OUTROS">Outros</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descrição da Empresa *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-light focus:outline-none focus:border-accent resize-none"
                placeholder="Descreva brevemente sua empresa e seus serviços..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-light focus:outline-none focus:border-accent"
                  placeholder="https://www.suaempresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Instagram
                </label>
                <input
                  type="url"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-light focus:outline-none focus:border-accent"
                  placeholder="https://instagram.com/suaempresa"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL do Logo
              </label>
              <input
                type="url"
                name="logo"
                value={formData.logo}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-light focus:outline-none focus:border-accent"
                placeholder="https://exemplo.com/logo.png"
              />
              <p className="text-xs text-gray-400 mt-1">
                Deixe em branco para usar logo padrão
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  E-mail de Contato *
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-light focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefone de Contato
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-primary border border-gray-600 rounded-lg text-light focus:outline-none focus:border-accent"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-accent/80 text-primary font-bold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cadastrando Anúncio...
                </span>
              ) : (
                'Finalizar Cadastro do Anúncio'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdvertisingSuccessPage;
