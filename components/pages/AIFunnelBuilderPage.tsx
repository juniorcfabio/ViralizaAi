import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import { useNavigate } from 'react-router-dom';

const AIFunnelBuilderPage: React.FC = () => {
  const { user, hasAccess } = useAuth();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  const hasFunnelAccess = hasAccess('aiFunnelBuilder');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary p-4">
      <div className="max-w-7xl mx-auto">
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
          <h1 className="text-6xl font-bold text-light mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
            🚀 AI Funnel Builder Ultra-Avançado
          </h1>
          <p className="text-3xl text-gray-300 max-w-5xl mx-auto">
            A ferramenta mais revolucionária do mundo digital para criar funis de vendas com IA
          </p>
        </div>

        {user?.type !== 'admin' && !hasFunnelAccess ? (
          <div className="bg-secondary/95 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-gray-700 max-w-6xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-red-600/10"></div>
            <div className="relative z-10">
              <div className="text-center mb-10">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                  <span className="text-6xl">🤖</span>
                </div>
                <h2 className="text-4xl font-bold text-light mb-6">Ferramenta Revolucionária Exclusiva</h2>
                <p className="text-2xl text-gray-300 max-w-4xl mx-auto">
                  O primeiro construtor de funis com IA verdadeiramente inteligente do mundo. 
                  Jamais visto antes no mercado digital.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 mb-10">
                <div className="bg-primary/60 rounded-2xl p-8 border border-purple-500/30">
                  <h3 className="text-2xl font-bold text-purple-400 mb-6 flex items-center gap-3">
                    <span className="text-4xl">🧠</span> IA Ultra-Avançada
                  </h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-purple-400 text-xl">✨</span>
                      <span><strong>Análise comportamental em tempo real</strong> de milhões de usuários</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-pink-400 text-xl">🎯</span>
                      <span><strong>Personalização dinâmica</strong> baseada em 500+ variáveis</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-400 text-xl">⚡</span>
                      <span><strong>Otimização automática</strong> com machine learning</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-primary/60 rounded-2xl p-8 border border-pink-500/30">
                  <h3 className="text-2xl font-bold text-pink-400 mb-6 flex items-center gap-3">
                    <span className="text-4xl">💎</span> Recursos Únicos
                  </h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-purple-400 text-xl">🔮</span>
                      <span><strong>Predição de conversão</strong> com 97% de precisão</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-pink-400 text-xl">🎨</span>
                      <span><strong>Design automático</strong> baseado em psicologia</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-400 text-xl">📊</span>
                      <span><strong>Analytics preditivos</strong> em tempo real</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-primary/60 rounded-2xl p-8 border border-red-500/30">
                  <h3 className="text-2xl font-bold text-red-400 mb-6 flex items-center gap-3">
                    <span className="text-4xl">💰</span> Resultados Garantidos
                  </h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-purple-400 text-xl">📈</span>
                      <span><strong>Aumento de 400-800%</strong> nas conversões</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-pink-400 text-xl">💎</span>
                      <span><strong>ROI médio de 1200%</strong> em 60 dias</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-400 text-xl">🚀</span>
                      <span><strong>Redução de 90%</strong> no tempo de criação</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-red-600/20 rounded-3xl p-10 border border-purple-500/30 mb-10">
                <h3 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  🌟 Oferta Exclusiva de Lançamento Mundial
                </h3>
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-6 mb-6">
                    <span className="text-4xl text-gray-500 line-through">R$ 1.997,00</span>
                    <span className="text-7xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">R$ 497,00</span>
                  </div>
                  <p className="text-2xl text-gray-300">
                    <strong>75% OFF</strong> - Apenas para os primeiros 50 usuários no mundo!
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-purple-400">🎯 O que está incluído:</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li>• IA proprietária com 500M+ dados de conversão</li>
                      <li>• Templates de funis que converteram R$ 100M+</li>
                      <li>• Integração com 200+ ferramentas</li>
                      <li>• Suporte VIP 24/7 por 1 ano</li>
                      <li>• Garantia de resultados ou dinheiro de volta</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-pink-400">⚡ Bônus exclusivos:</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li>• Curso completo de funis (R$ 497)</li>
                      <li>• 100 templates premium (R$ 297)</li>
                      <li>• Consultoria estratégica (R$ 997)</li>
                      <li>• Acesso vitalício a atualizações</li>
                      <li>• Comunidade VIP exclusiva</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-6">
                <button
                  onClick={() => navigate('/dashboard/billing')}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-red-600 hover:via-pink-600 hover:to-purple-600 text-white font-bold py-6 px-12 rounded-3xl transition-all duration-500 transform hover:scale-105 text-2xl shadow-2xl"
                >
                  🔥 Upgrade para Plano Anual (INCLUSO)
                </button>
                
                <div className="flex items-center gap-2 justify-center text-lg text-gray-500 uppercase font-bold">
                  <div className="h-px bg-gray-600 flex-1"></div>
                  <span>OU ADQUIRA SEPARADAMENTE</span>
                  <div className="h-px bg-gray-600 flex-1"></div>
                </div>

                <button
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-6 px-12 rounded-3xl transition-all duration-500 transform hover:scale-105 text-2xl shadow-2xl flex items-center justify-center gap-4"
                >
                  💳 Comprar Agora por R$ 497,00
                  <span className="text-lg bg-red-500 px-3 py-1 rounded-full">-75%</span>
                </button>

                <div className="flex items-center justify-center gap-8 text-lg text-gray-400 mt-8">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-2xl">🔒</span>
                    <span>Pagamento 100% Seguro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 text-2xl">⚡</span>
                    <span>Acesso Imediato</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 text-2xl">🎯</span>
                    <span>Garantia 30 dias</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-secondary/95 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border border-gray-700">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="text-6xl">🤖</span>
              </div>
              <h2 className="text-4xl font-bold text-light mb-6">
                AI Funnel Builder Ativado!
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Ferramenta em desenvolvimento - Lançamento em breve
              </p>
              <div className="bg-accent/20 border border-accent rounded-2xl p-6">
                <p className="text-accent font-semibold">
                  🚀 Esta ferramenta revolucionária está sendo finalizada e será lançada em breve!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIFunnelBuilderPage;
