import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { useNavigate } from 'react-router-dom';
import EbookGeneratorComponent from '../ui/EbookGenerator';
import { GeneratedEbook } from '../../services/ebookGenerator';
import { API_BASE_URL, getAuthHeaders } from '../../src/config/api';
import PixPaymentModalFixed from '../ui/PixPaymentModalFixed';
import AccessControlService from '../../services/accessControlService';

const EbookGeneratorPage: React.FC = () => {
  const { user, hasAccess } = useAuth();
  const navigate = useNavigate();
  const [businessType, setBusinessType] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [businessGoals, setBusinessGoals] = useState<string[]>([]);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatedEbooks, setGeneratedEbooks] = useState<GeneratedEbook[]>([]);
  const [purchasing, setPurchasing] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const hasEbookAccess = AccessControlService.hasToolAccess(
    user?.id || 'guest', 
    'Gerador de Ebooks Premium', 
    user?.type
  );

  const businessTypes = [
    { value: 'loja_massas', label: '🍝 Loja de Massas ao Vivo', description: 'Massas artesanais, delivery, eventos' },
    { value: 'restaurante', label: '🍽️ Restaurante', description: 'Gastronomia, experiência, fidelização' },
    { value: 'academia', label: '💪 Academia de Musculação', description: 'Fitness, personal, nutrição' },
    { value: 'consultoria', label: '💼 Consultoria Empresarial', description: 'Estratégia, processos, resultados' },
    { value: 'padaria', label: '🥖 Padaria', description: 'Panificação, café da manhã, tradição' },
    { value: 'loja_roupas', label: '👕 Loja de Roupas', description: 'Moda, estilo, tendências' },
    { value: 'salao_beleza', label: '💄 Salão de Beleza', description: 'Estética, cuidados, autoestima' },
    { value: 'clinica_medica', label: '🏥 Clínica Médica', description: 'Saúde, prevenção, tratamentos' },
    { value: 'escola_idiomas', label: '🗣️ Escola de Idiomas', description: 'Educação, fluência, certificação' },
    { value: 'pet_shop', label: '🐕 Pet Shop', description: 'Pets, cuidados, produtos' },
    { value: 'loja_doces', label: '🍰 Loja de Doces', description: 'Confeitaria, eventos, personalização' },
    { value: 'oficina_mecanica', label: '🔧 Oficina Mecânica', description: 'Automóveis, manutenção, confiança' },
    { value: 'farmacia', label: '💊 Farmácia', description: 'Medicamentos, saúde, orientação' },
    { value: 'loja_moveis', label: '🪑 Loja de Móveis', description: 'Decoração, ambientes, funcionalidade' },
    { value: 'curso_online', label: '💻 Curso Online', description: 'Educação digital, certificação, carreira' },
    { value: 'agencia_viagens', label: '✈️ Agência de Viagens', description: 'Turismo, experiências, destinos' },
    { value: 'loja_esportes', label: '⚽ Loja de Esportes', description: 'Equipamentos, performance, modalidades' },
    { value: 'studio_fotografia', label: '📸 Studio de Fotografia', description: 'Eventos, retratos, memórias' },
    { value: 'clinica_veterinaria', label: '🐾 Clínica Veterinária', description: 'Animais, saúde, cuidados' },
    { value: 'outro', label: '🏢 Outro Tipo de Negócio', description: 'Personalizado para seu segmento' }
  ];

  const goalOptions = [
    'Aumentar vendas online',
    'Fidelizar clientes',
    'Atrair novos clientes',
    'Melhorar presença digital',
    'Educar o mercado',
    'Posicionar como autoridade',
    'Gerar leads qualificados',
    'Aumentar ticket médio',
    'Expandir para novos mercados',
    'Criar comunidade engajada'
  ];

  const handleGoalToggle = (goal: string) => {
    setBusinessGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleStartGeneration = () => {
    if (businessType && businessName.trim() && targetAudience.trim() && businessGoals.length > 0) {
      setShowGenerator(true);
    }
  };

  const handleEbookGenerated = (ebook: GeneratedEbook) => {
    setGeneratedEbooks(prev => [ebook, ...prev]);
  };

  const resetForm = () => {
    setBusinessType('');
    setBusinessName('');
    setTargetAudience('');
    setBusinessGoals([]);
    setShowGenerator(false);
  };

  // 💳 MOSTRAR OPÇÕES DE PAGAMENTO
  const showPaymentOptionsModal = () => {
    setShowPaymentOptions(true);
  };

  // 💳 PAGAMENTO VIA STRIPE
  const purchaseWithStripe = async () => {
    if (!user) return;
    
    setPurchasing(true);
    try {
      // Registrar pagamento no sistema de controle
      const payment = AccessControlService.registerPayment({
        userId: user.id,
        type: 'tool',
        itemName: 'Gerador de Ebooks Premium',
        amount: 297.00,
        paymentMethod: 'stripe',
        status: 'pending'
      });

      console.log('💳 Pagamento Stripe registrado:', payment);

      // Usar API funcional stripe-test
      const paymentData = {
        planName: 'Gerador de Ebooks Premium - ViralizaAI',
        amount: Math.round(297.00 * 100), // Converter para centavos
        successUrl: `${window.location.origin}/dashboard/ebook-generator?payment=success&tool=Gerador%20de%20Ebooks%20Premium`,
        cancelUrl: `${window.location.origin}/dashboard/ebook-generator?payment=cancelled`
      };

      console.log('📋 Dados do pagamento Stripe:', paymentData);
      
      const response = await fetch('/api/stripe-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success && result.url) {
        console.log('🔄 Redirecionando para Stripe:', result.url);
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('❌ Erro ao processar pagamento Stripe:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setPurchasing(false);
    }
  };

  // 🏦 PAGAMENTO VIA PIX
  const purchaseWithPix = () => {
    // Registrar pagamento PIX no sistema de controle
    const payment = AccessControlService.registerPayment({
      userId: user?.id || 'guest',
      type: 'tool',
      itemName: 'Gerador de Ebooks Premium',
      amount: 297.00,
      paymentMethod: 'pix',
      status: 'pending'
    });

    console.log('🏦 Pagamento PIX registrado:', payment);
    
    setShowPaymentOptions(false);
    setShowPixModal(true);
  };

  // ✅ CONFIRMAR PAGAMENTO PIX
  const handlePixPaymentSuccess = () => {
    // Confirmar pagamento PIX e liberar acesso
    const payments = AccessControlService.getAllPayments();
    const pendingPayment = payments.find(p => 
      p.itemName === 'Gerador de Ebooks Premium' && 
      p.paymentMethod === 'pix' && 
      p.status === 'pending'
    );
    
    if (pendingPayment) {
      AccessControlService.confirmPayment(pendingPayment.id, `pix_${Date.now()}`);
      console.log('✅ Pagamento PIX confirmado e acesso liberado!');
    }
    
    setShowPixModal(false);
    alert('✅ Pagamento PIX confirmado! Gerador de Ebooks Premium ativado com sucesso.');
    
    // Recarregar página para atualizar interface
    window.location.reload();
  };

  // FUNÇÃO ANTIGA MANTIDA PARA COMPATIBILIDADE
  const handlePurchaseEbookGenerator = async () => {
    showPaymentOptionsModal();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header com botão voltar */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-primary px-4 py-2 rounded-lg border border-gray-600 hover:border-accent"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para Dashboard
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-light mb-6 bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent">
            📚 Gerador de Ebooks Premium Ultra-Avançado
          </h1>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto">
            Crie ebooks de <span className="text-accent font-bold">1.5+ páginas por capítulo</span> com 
            <span className="text-blue-400 font-bold"> fotos profissionais obrigatórias</span> e 
            <span className="text-green-400 font-bold"> conteúdo ultra-vendável</span>
          </p>
        </div>

        {user?.type !== 'admin' && !hasEbookAccess ? (
          <div className="bg-secondary/95 backdrop-blur-lg rounded-3xl shadow-2xl p-10 border border-gray-700 max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-accent/10"></div>
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 via-blue-500 to-accent rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <span className="text-4xl">🚀</span>
                </div>
                <h2 className="text-3xl font-bold text-light mb-4">Ferramenta Premium Exclusiva</h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  O mais avançado gerador de ebooks do mercado digital. Revolucionário e ultra-lucrativo.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-primary/60 rounded-2xl p-6 border border-accent/30">
                  <h3 className="text-xl font-bold text-accent mb-4 flex items-center gap-2">
                    <span className="text-2xl">⚡</span> Recursos Revolucionários
                  </h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-green-400 text-lg">✨</span>
                      <span><strong>15 capítulos ultra-técnicos</strong> com 1.5+ páginas cada</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-400 text-lg">📸</span>
                      <span><strong>Fotos profissionais obrigatórias</strong> em cada capítulo</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-400 text-lg">🎯</span>
                      <span><strong>Personalização por nicho</strong> com IA avançada</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-yellow-400 text-lg">💎</span>
                      <span><strong>Metodologias proprietárias</strong> exclusivas</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-primary/60 rounded-2xl p-6 border border-green-500/30">
                  <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                    <span className="text-2xl">💰</span> Potencial de Lucro
                  </h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-green-400 text-lg">📈</span>
                      <span><strong>Ebooks vendáveis</strong> de R$ 97 a R$ 497</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-400 text-lg">🔥</span>
                      <span><strong>ROI de 300-500%</strong> comprovado</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-400 text-lg">⚡</span>
                      <span><strong>Geração em 5 minutos</strong> - venda imediata</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-yellow-400 text-lg">🎯</span>
                      <span><strong>Nichos ilimitados</strong> - mercado infinito</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="text-center space-y-6">
                <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-2xl p-6 border border-green-500/30">
                  <h3 className="text-2xl font-bold text-green-400 mb-2">🎯 Oferta Especial de Lançamento</h3>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <span className="text-3xl text-gray-500 line-through">R$ 497,00</span>
                    <span className="text-5xl font-bold text-green-400">R$ 297,00</span>
                  </div>
                  <p className="text-gray-300">
                    <strong>40% OFF</strong> - Apenas para os primeiros 100 usuários!
                  </p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => navigate('/dashboard/billing')}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 text-xl"
                  >
                    🔥 Upgrade para Plano Anual (INCLUSO)
                  </button>
                  
                  <div className="flex items-center gap-2 justify-center text-sm text-gray-500 uppercase font-bold">
                    <div className="h-px bg-gray-600 flex-1"></div>
                    <span>OU COMPRE SEPARADAMENTE</span>
                    <div className="h-px bg-gray-600 flex-1"></div>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={purchaseWithStripe}
                      disabled={purchasing}
                      className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                    >
                      {purchasing ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          Processando...
                        </>
                      ) : (
                        <>
                          💳 Pagar com Cartão - R$ 297,00
                          <span className="text-sm bg-red-500 px-2 py-1 rounded-full">-40%</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={purchaseWithPix}
                      disabled={purchasing}
                      className="w-full bg-green-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-3"
                    >
                      🏦 Pagar com PIX - R$ 297,00
                      <span className="text-sm bg-red-500 px-2 py-1 rounded-full">-40%</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 text-sm text-gray-400 mt-6">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">🔒</span>
                    <span>Pagamento 100% Seguro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">⚡</span>
                    <span>Acesso Imediato</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">🎯</span>
                    <span>Garantia 7 dias</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : !showGenerator ? (
          <div className="bg-secondary/95 backdrop-blur-lg rounded-3xl shadow-2xl p-10 border border-gray-700 max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-light mb-4">🎯 Configure Seu Ebook Ultra-Personalizado</h2>
                <p className="text-gray-300 text-lg">
                  Quanto mais detalhes, mais vendável será seu ebook
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xl font-semibold text-light mb-4">
                    🏢 Tipo de Negócio
                  </label>
                  <div className="grid gap-3 max-h-80 overflow-y-auto pr-2">
                    {businessTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setBusinessType(type.value)}
                        className={`p-4 rounded-xl text-left transition-all duration-200 ${
                          businessType === type.value
                            ? 'bg-accent text-white shadow-xl transform scale-105 border-2 border-accent'
                            : 'bg-primary/50 text-gray-300 hover:bg-primary/70 hover:text-light border border-gray-600'
                        }`}
                      >
                        <div className="font-semibold">{type.label}</div>
                        <div className="text-sm opacity-75">{type.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xl font-semibold text-light mb-3">
                      🏪 Nome do Seu Negócio
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Ex: Massas da Nonna, Academia Strong Fitness..."
                      className="w-full bg-primary/50 border border-gray-600 rounded-xl px-4 py-4 text-light placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xl font-semibold text-light mb-3">
                      👥 Público-Alvo Principal
                    </label>
                    <textarea
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="Ex: Mulheres de 25-45 anos, classe média, que valorizam praticidade e qualidade..."
                      className="w-full bg-primary/50 border border-gray-600 rounded-xl px-4 py-4 text-light placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-lg h-24 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xl font-semibold text-light mb-4">
                      🎯 Objetivos do Negócio (selecione até 4)
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                      {goalOptions.map((goal) => (
                        <button
                          key={goal}
                          onClick={() => handleGoalToggle(goal)}
                          disabled={businessGoals.length >= 4 && !businessGoals.includes(goal)}
                          className={`p-3 rounded-lg text-left transition-all duration-200 text-sm ${
                            businessGoals.includes(goal)
                              ? 'bg-accent text-white shadow-lg'
                              : businessGoals.length >= 4
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-primary/50 text-gray-300 hover:bg-primary/70 hover:text-light'
                          }`}
                        >
                          {goal}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      {businessGoals.length}/4 objetivos selecionados
                    </p>
                  </div>
                </div>
              </div>

              {businessType && businessName.trim() && targetAudience.trim() && businessGoals.length > 0 && (
                <div className="bg-gradient-to-r from-accent/20 to-blue-600/20 border border-accent rounded-2xl p-6">
                  <h3 className="text-2xl font-semibold text-accent mb-4 flex items-center gap-2">
                    ✨ Prévia do Seu Ebook Premium
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-light mb-2">
                        <strong>Título:</strong> Guia Definitivo para Revolucionar {businessName}
                      </p>
                      <p className="text-gray-300 mb-2">
                        <strong>Nicho:</strong> {businessTypes.find(t => t.value === businessType)?.label}
                      </p>
                      <p className="text-gray-300">
                        <strong>Público:</strong> {targetAudience.slice(0, 100)}...
                      </p>
                    </div>
                    <div>
                      <p className="text-green-400 font-semibold mb-2">📊 Especificações Técnicas:</p>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• 15 capítulos ultra-detalhados</li>
                        <li>• 1.5+ páginas por capítulo (22+ páginas)</li>
                        <li>• 15 fotos profissionais incluídas</li>
                        <li>• Metodologias proprietárias exclusivas</li>
                        <li>• Conteúdo 100% vendável</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleStartGeneration}
                disabled={!businessType || !businessName.trim() || !targetAudience.trim() || businessGoals.length === 0}
                className="w-full bg-gradient-to-r from-accent to-blue-600 hover:from-blue-600 hover:to-accent text-white font-bold py-6 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-xl"
              >
                🚀 Gerar Ebook Premium Ultra-Avançado
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-secondary/90 rounded-2xl p-6 border border-gray-700">
              <div>
                <h2 className="text-3xl font-bold text-light">
                  Gerando para: {businessName}
                </h2>
                <p className="text-gray-300 text-lg">
                  {businessTypes.find(t => t.value === businessType)?.label}
                </p>
                <p className="text-accent font-semibold">
                  Público: {targetAudience.slice(0, 80)}...
                </p>
              </div>
              <button
                onClick={resetForm}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                🔄 Novo Ebook
              </button>
            </div>

            <EbookGeneratorComponent
              businessType={businessType}
              businessName={businessName}
              targetAudience={targetAudience}
              businessGoals={businessGoals}
              onEbookGenerated={handleEbookGenerated}
            />
          </div>
        )}

        {generatedEbooks.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-light mb-8 text-center">
              📚 Biblioteca de Ebooks Gerados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {generatedEbooks.map((ebook, index) => (
                <div key={index} className="bg-secondary/95 rounded-2xl p-6 border border-gray-700 hover:border-accent transition-colors">
                  <div className="aspect-video bg-gradient-to-br from-accent/20 to-blue-600/20 rounded-xl mb-6 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl mb-3">📖</div>
                      <div className="text-sm text-gray-300 font-semibold">{ebook.niche}</div>
                    </div>
                  </div>
                  <h3 className="font-bold text-light mb-3 text-lg line-clamp-2">
                    {ebook.title}
                  </h3>
                  <div className="text-sm text-gray-400 mb-6 space-y-1">
                    <div>{ebook.chapters.length} capítulos • {ebook.totalPages} páginas</div>
                    <div className="text-green-400">✨ Com fotos profissionais</div>
                  </div>
                  <button
                    onClick={() => {
                      // Implementação real de download do ebook
                      try {
                        console.log('🔄 Iniciando download do ebook da biblioteca...');
                        console.log('📊 Dados do ebook:', ebook);
                        
                        // Verificar se o ebook tem dados válidos
                        if (!ebook || !ebook.title || !ebook.chapters || ebook.chapters.length === 0) {
                          console.error('❌ Dados do ebook inválidos:', ebook);
                          alert('❌ Erro: Dados do ebook estão incompletos.\nTente gerar o ebook novamente.');
                          return;
                        }
                        
                        // Criar conteúdo HTML completo
                        const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${ebook.title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Georgia', serif; 
            line-height: 1.8; 
            color: #2c3e50; 
            background: #f8f9fa;
            padding: 40px 20px;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 20px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .cover { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 80px 40px; 
            text-align: center; 
        }
        .cover h1 { 
            font-size: 3.5em; 
            margin-bottom: 30px; 
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            line-height: 1.2;
        }
        .cover .subtitle { 
            font-size: 1.4em; 
            opacity: 0.9; 
            font-style: italic;
        }
        .content { padding: 60px 50px; }
        .chapter { 
            margin-bottom: 80px; 
            page-break-inside: avoid;
        }
        .chapter h2 { 
            font-size: 2.2em; 
            color: #667eea; 
            margin-bottom: 30px; 
            padding-bottom: 15px;
            border-bottom: 3px solid #667eea;
        }
        .chapter-content { 
            font-size: 1.1em; 
            text-align: justify; 
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .footer { 
            background: #2c3e50; 
            color: white; 
            padding: 40px; 
            text-align: center; 
        }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="cover">
            <h1>${ebook.title}</h1>
            <div class="subtitle">Guia Completo e Estratégico - ${ebook.niche}</div>
        </div>
        
        <div class="content">
            ${ebook.chapters.map(chapter => `
                <div class="chapter">
                    <h2>${chapter.title}</h2>
                    <div class="chapter-content">${chapter.content}</div>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
            <p>Gerado pela Viraliza.AI - Tecnologia Premium</p>
        </div>
    </div>
</body>
</html>`;

                        const fileName = `${ebook.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase()}`;
                        
                        // Download via Blob
                        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = fileName + '.html';
                        link.style.display = 'none';
                        
                        document.body.appendChild(link);
                        link.click();
                        
                        setTimeout(() => {
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          console.log('✅ Download da biblioteca concluído!');
                          alert('✅ Ebook baixado com sucesso!\n\n📋 Instruções:\n• Arquivo salvo como HTML\n• Abra o arquivo baixado\n• Use Ctrl+P para imprimir como PDF');
                        }, 100);
                        
                      } catch (error) {
                        console.error('❌ Erro no download da biblioteca:', error);
                        alert('❌ Erro ao baixar ebook.\nTente novamente ou contate o suporte.');
                      }
                    }}
                    className="w-full bg-accent hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                  >
                    📥 Baixar Ebook
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal PIX */}
        {showPixModal && (
          <PixPaymentModalFixed
            isOpen={showPixModal}
            onClose={() => setShowPixModal(false)}
            planName="Gerador de Ebooks Premium"
            amount={297.00}
            onPaymentSuccess={handlePixPaymentSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default EbookGeneratorPage;
