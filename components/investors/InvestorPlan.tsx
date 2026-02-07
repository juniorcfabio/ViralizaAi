// =======================
// 💼 PLANO TÉCNICO PARA INVESTIDORES
// =======================

import React from 'react';

const InvestorPlan: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            💼 ViralizaAI - Plano de Investimento
          </h1>
          <p className="text-xl text-gray-300">
            Plataforma SaaS de Automação Social com IA - Série A
          </p>
          <div className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-full">
            <span className="font-bold">Valuation: R$ 50M | Captação: R$ 10M</span>
          </div>
        </div>

        {/* Problema e Solução */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-red-900 bg-opacity-50 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6">🚨 PROBLEMA</h2>
            <ul className="text-gray-300 space-y-4">
              <li className="flex items-start">
                <span className="text-red-400 mr-3">•</span>
                <span><strong>95% das empresas</strong> não conseguem escalar conteúdo social manualmente</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-3">•</span>
                <span><strong>Criadores gastam 80%</strong> do tempo em tarefas repetitivas</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-3">•</span>
                <span><strong>Ferramentas atuais</strong> são fragmentadas e caras</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-3">•</span>
                <span><strong>Falta de IA preditiva</strong> para otimização de engajamento</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-900 bg-opacity-50 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6">✅ SOLUÇÃO</h2>
            <ul className="text-gray-300 space-y-4">
              <li className="flex items-start">
                <span className="text-green-400 mr-3">•</span>
                <span><strong>Plataforma all-in-one</strong> com automação humanizada</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-3">•</span>
                <span><strong>IA preditiva</strong> para maximizar engajamento</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-3">•</span>
                <span><strong>Integração nativa</strong> com todas as redes sociais</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-3">•</span>
                <span><strong>Monetização integrada</strong> com analytics avançados</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Diferencial Competitivo */}
        <div className="bg-purple-900 bg-opacity-50 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">🚀 DIFERENCIAL COMPETITIVO</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-bold text-white mb-3">IA Preditiva</h3>
              <p className="text-gray-300">Algoritmos proprietários que preveem engajamento com 94% de precisão</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-white mb-3">Automação Humanizada</h3>
              <p className="text-gray-300">Comportamento indistinguível de humanos, evitando banimentos</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold text-white mb-3">Anti-fraude Stripe</h3>
              <p className="text-gray-300">Segurança bancária com compliance total</p>
            </div>
          </div>
        </div>

        {/* Tecnologia */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">⚙️ STACK TECNOLÓGICO</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-blue-400 mb-4">Backend (Microserviços)</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Node.js + TypeScript</li>
                <li>• PostgreSQL + Redis</li>
                <li>• Docker + Kubernetes</li>
                <li>• AWS/GCP Cloud</li>
                <li>• Cloudflare CDN</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-400 mb-4">Frontend & IA</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• React + TypeScript</li>
                <li>• OpenAI GPT-4</li>
                <li>• Google AI APIs</li>
                <li>• Custom ML Models</li>
                <li>• Real-time Analytics</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modelo de Receita */}
        <div className="bg-green-900 bg-opacity-50 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">💰 MODELO DE RECEITA</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">R$ 97</div>
              <div className="text-white font-semibold">Mensal</div>
              <div className="text-gray-300 text-sm">Básico</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">R$ 247</div>
              <div className="text-white font-semibold">Trimestral</div>
              <div className="text-gray-300 text-sm">Profissional</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">R$ 447</div>
              <div className="text-white font-semibold">Semestral</div>
              <div className="text-gray-300 text-sm">Empresarial</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">R$ 797</div>
              <div className="text-white font-semibold">Anual</div>
              <div className="text-gray-300 text-sm">Enterprise</div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <div className="text-2xl font-bold text-white mb-2">Projeção de Receita</div>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-xl font-bold text-green-400">Ano 1</div>
                <div className="text-white">R$ 2.4M ARR</div>
                <div className="text-gray-300">1.000 clientes</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-400">Ano 2</div>
                <div className="text-white">R$ 12M ARR</div>
                <div className="text-gray-300">5.000 clientes</div>
              </div>
              <div>
                <div className="text-xl font-bold text-purple-400">Ano 3</div>
                <div className="text-white">R$ 36M ARR</div>
                <div className="text-gray-300">15.000 clientes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Escalabilidade */}
        <div className="bg-blue-900 bg-opacity-50 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">📈 ESCALABILIDADE</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-blue-400 mb-4">Arquitetura Cloud</h3>
              <ul className="text-gray-300 space-y-3">
                <li className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  <span>Microserviços com auto-scaling</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  <span>Load balancer inteligente</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  <span>CDN global (Cloudflare)</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-3">✓</span>
                  <span>Filas assíncronas (Redis)</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-400 mb-4">Capacidade</h3>
              <ul className="text-gray-300 space-y-3">
                <li className="flex justify-between">
                  <span>Usuários simultâneos:</span>
                  <span className="font-bold">100k+</span>
                </li>
                <li className="flex justify-between">
                  <span>Requisições/minuto:</span>
                  <span className="font-bold">1M+</span>
                </li>
                <li className="flex justify-between">
                  <span>Uptime garantido:</span>
                  <span className="font-bold">99.95%</span>
                </li>
                <li className="flex justify-between">
                  <span>Latência global:</span>
                  <span className="font-bold">&lt;150ms</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mercado e Competição */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-yellow-900 bg-opacity-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">🎯 MERCADO</h2>
            <ul className="text-gray-300 space-y-3">
              <li><strong>TAM:</strong> R$ 180B (Social Media Marketing)</li>
              <li><strong>SAM:</strong> R$ 45B (Automação + IA)</li>
              <li><strong>SOM:</strong> R$ 2.2B (Brasil + LATAM)</li>
              <li><strong>Crescimento:</strong> 35% a.a.</li>
            </ul>
          </div>

          <div className="bg-red-900 bg-opacity-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">🥊 COMPETIÇÃO</h2>
            <ul className="text-gray-300 space-y-3">
              <li><strong>Hootsuite:</strong> Sem IA preditiva</li>
              <li><strong>Buffer:</strong> Limitado em automação</li>
              <li><strong>Later:</strong> Foco apenas visual</li>
              <li><strong>Nossa vantagem:</strong> IA + Humanização</li>
            </ul>
          </div>
        </div>

        {/* Uso do Investimento */}
        <div className="bg-purple-900 bg-opacity-50 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">💸 USO DO INVESTIMENTO (R$ 10M)</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Desenvolvimento (40%)</span>
                <span className="text-white font-bold">R$ 4M</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{width: '40%'}}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Marketing (30%)</span>
                <span className="text-white font-bold">R$ 3M</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '30%'}}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Equipe (20%)</span>
                <span className="text-white font-bold">R$ 2M</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{width: '20%'}}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Infraestrutura (10%)</span>
                <span className="text-white font-bold">R$ 1M</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{width: '10%'}}></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">Metas 18 meses:</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• 50+ desenvolvedores</li>
                <li>• 10k+ clientes ativos</li>
                <li>• R$ 15M ARR</li>
                <li>• Expansão internacional</li>
                <li>• IPO ou aquisição</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Equipe */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">👥 EQUIPE FUNDADORA</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">👨‍💻</div>
              <h3 className="text-xl font-bold text-white">CEO/CTO</h3>
              <p className="text-gray-300">15+ anos em tech</p>
              <p className="text-gray-300">Ex-Google, Meta</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">📊</div>
              <h3 className="text-xl font-bold text-white">CMO</h3>
              <p className="text-gray-300">Marketing digital</p>
              <p className="text-gray-300">100M+ impressões</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">🤖</div>
              <h3 className="text-xl font-bold text-white">Head of AI</h3>
              <p className="text-gray-300">PhD Machine Learning</p>
              <p className="text-gray-300">Ex-OpenAI</p>
            </div>
          </div>
        </div>

        {/* Roadmap */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">🗺️ ROADMAP ESTRATÉGICO</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-2">Q1 2024</div>
              <div className="text-white font-semibold mb-2">MVP Launch</div>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Automação básica</li>
                <li>• 3 redes sociais</li>
                <li>• 100 beta users</li>
              </ul>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-2">Q2 2024</div>
              <div className="text-white font-semibold mb-2">IA Integration</div>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• IA preditiva</li>
                <li>• 6 redes sociais</li>
                <li>• 1k usuários</li>
              </ul>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-2">Q3 2024</div>
              <div className="text-white font-semibold mb-2">Scale Up</div>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Enterprise features</li>
                <li>• API pública</li>
                <li>• 5k usuários</li>
              </ul>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-2">Q4 2024</div>
              <div className="text-white font-semibold mb-2">Global</div>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Expansão LATAM</li>
                <li>• Série B</li>
                <li>• 15k usuários</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">🚀 PRONTO PARA DECOLAR</h2>
          <p className="text-xl text-gray-100 mb-6">
            Junte-se à revolução da automação social com IA
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div>
              <div className="text-2xl font-bold text-white">R$ 50M</div>
              <div className="text-gray-100">Valuation</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">R$ 10M</div>
              <div className="text-gray-100">Captação Série A</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">20%</div>
              <div className="text-gray-100">Equity Oferecido</div>
            </div>
          </div>
          <div className="space-x-4">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100">
              📧 Contato: invest@viralizaai.com
            </button>
            <button className="bg-yellow-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-yellow-600">
              📱 WhatsApp: +55 11 99999-9999
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorPlan;
