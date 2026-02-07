// =======================
// 💰 PÁGINA DE PREÇOS COM STRIPE FUNCIONANDO PERFEITAMENTE
// Restaurado da versão F323zcAzv que funcionava 100%
// =======================

import React from 'react';
import PlanCard from '../ui/PlanCard';

const PricingPage: React.FC = () => {
  const plans = [
    {
      planType: 'mensal',
      planName: 'Plano Mensal',
      price: 59.90,
      features: [
        'Todas as ferramentas de IA',
        'Geração ilimitada de conteúdo',
        'Automação de redes sociais',
        'Analytics avançados',
        'Suporte prioritário',
        'Atualizações gratuitas'
      ]
    },
    {
      planType: 'trimestral',
      planName: 'Plano Trimestral',
      price: 149.90,
      originalPrice: 179.70,
      discount: '-17%',
      isPopular: true,
      features: [
        'Todas as funcionalidades do mensal',
        'Desconto de 17%',
        'Consultoria estratégica mensal',
        'Templates exclusivos',
        'Prioridade no suporte',
        'Relatórios personalizados'
      ]
    },
    {
      planType: 'semestral',
      planName: 'Plano Semestral',
      price: 279.90,
      originalPrice: 359.40,
      discount: '-22%',
      features: [
        'Todas as funcionalidades anteriores',
        'Desconto de 22%',
        'Consultoria quinzenal',
        'Acesso antecipado a novidades',
        'Integração personalizada',
        'Suporte dedicado'
      ]
    },
    {
      planType: 'anual',
      planName: 'Plano Anual',
      price: 499.90,
      originalPrice: 718.80,
      discount: '-30%',
      features: [
        'Todas as funcionalidades anteriores',
        'Desconto de 30%',
        'Consultoria semanal',
        'Desenvolvimento de features customizadas',
        'Suporte 24/7',
        'Garantia de satisfação'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Escolha Seu Plano
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Transforme seu marketing digital com IA avançada
          </p>
          
          {/* Badge PIX */}
          <div className="inline-flex items-center bg-green-500 text-white px-6 py-3 rounded-full font-semibold">
            <span className="mr-2">🏦</span>
            Pagamento via PIX - Ativação Instantânea
          </div>
        </div>

        {/* Grid de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan, index) => (
            <PlanCard
              key={index}
              planType={plan.planType}
              planName={plan.planName}
              price={plan.price}
              originalPrice={plan.originalPrice}
              features={plan.features}
              isPopular={plan.isPopular}
              discount={plan.discount}
            />
          ))}
        </div>

        {/* Ferramentas Avulsas */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            🛠️ Ferramentas Avulsas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PlanCard
              planType="ebook"
              planName="Gerador de Ebook"
              price={29.90}
              features={[
                'Ebook profissional',
                'Design automático',
                'Conteúdo otimizado',
                'Download imediato'
              ]}
            />
            
            <PlanCard
              planType="video"
              planName="Gerador de Vídeo"
              price={19.90}
              features={[
                'Vídeo com IA',
                'Múltiplos formatos',
                'Narração automática',
                'Qualidade HD'
              ]}
            />
            
            <PlanCard
              planType="funnel"
              planName="Funil de Vendas"
              price={39.90}
              features={[
                'Funil completo',
                'Landing pages',
                'Automação de email',
                'Analytics integrado'
              ]}
            />
            
            <PlanCard
              planType="anuncio"
              planName="Criador de Anúncios"
              price={99.90}
              features={[
                'Anúncios otimizados',
                'Múltiplas plataformas',
                'A/B testing',
                'ROI tracking'
              ]}
            />
          </div>
        </div>

        {/* Garantias e Benefícios */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-3xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-6">
            🛡️ Garantias e Benefícios
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
            <div className="bg-white bg-opacity-20 rounded-xl p-6">
              <div className="text-3xl mb-4">⚡</div>
              <h4 className="font-bold mb-2">Ativação Instantânea</h4>
              <p className="text-sm">Pagou via PIX? Seu plano é ativado automaticamente em segundos</p>
            </div>
            
            <div className="bg-white bg-opacity-20 rounded-xl p-6">
              <div className="text-3xl mb-4">🔒</div>
              <h4 className="font-bold mb-2">100% Seguro</h4>
              <p className="text-sm">Pagamentos processados pelo Stripe com máxima segurança</p>
            </div>
            
            <div className="bg-white bg-opacity-20 rounded-xl p-6">
              <div className="text-3xl mb-4">💰</div>
              <h4 className="font-bold mb-2">Melhor Preço</h4>
              <p className="text-sm">Descontos progressivos e sem taxas adicionais no PIX</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
