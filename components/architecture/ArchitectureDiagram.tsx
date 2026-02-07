// =======================
// 📦 DIAGRAMA VISUAL DA ARQUITETURA - ENTERPRISE
// =======================

import React, { useState } from 'react';

const ArchitectureDiagram: React.FC = () => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const components = {
    user: {
      title: 'USUÁRIO (APP/WEB)',
      description: 'Interface React/TypeScript responsiva com PWA',
      tech: 'React 18, TypeScript, Tailwind CSS, Vite',
      metrics: '10k+ usuários simultâneos'
    },
    cloudflare: {
      title: 'Cloudflare',
      description: 'Firewall + CDN + Proteção DDoS + SSL',
      tech: 'Edge Computing, WAF, Bot Protection',
      metrics: '99.99% uptime, <25ms latência'
    },
    loadbalancer: {
      title: 'Load Balancer',
      description: 'Distribuição inteligente de carga',
      tech: 'Round-robin, Health checks, Auto-scaling',
      metrics: '1M+ req/min, Auto-failover'
    },
    gateway: {
      title: 'API GATEWAY',
      description: 'Orquestração central de microserviços',
      tech: 'Node.js, Express, JWT, Rate Limiting',
      metrics: 'Auth, Routing, Security, Monitoring'
    },
    auth: {
      title: 'Auth Service',
      description: 'Autenticação e autorização segura',
      tech: 'JWT, bcrypt, 2FA, Session Management',
      metrics: 'Login, Register, Permissions'
    },
    billing: {
      title: 'Billing Service',
      description: 'Pagamentos e assinaturas Stripe',
      tech: 'Stripe API, Webhooks, Subscriptions',
      metrics: 'Checkout, Invoices, Refunds'
    },
    tools: {
      title: 'Tools Service',
      description: 'Automação social e geração de conteúdo',
      tech: 'AI APIs, Social APIs, Queue Processing',
      metrics: 'Posts, Videos, Analytics, Scheduling'
    },
    analytics: {
      title: 'Analytics Service',
      description: 'Métricas e relatórios em tempo real',
      tech: 'Data Processing, ML Models, Dashboards',
      metrics: 'KPIs, Insights, Predictions'
    },
    notifications: {
      title: 'Notifications Service',
      description: 'Alertas e comunicação multicanal',
      tech: 'Email, SMS, Push, Webhooks',
      metrics: 'Real-time, Templates, Tracking'
    },
    redis: {
      title: 'Redis Queue',
      description: 'Filas de processamento assíncrono',
      tech: 'Bull Queue, Job Processing, Caching',
      metrics: '1000+ jobs/sec, Retry Logic'
    },
    ai: {
      title: 'AI APIs',
      description: 'Inteligência artificial e ML',
      tech: 'OpenAI, Google AI, Custom Models',
      metrics: 'Content Gen, Predictions, Analysis'
    },
    social: {
      title: 'Social APIs',
      description: 'Integração com redes sociais',
      tech: 'Instagram, TikTok, Facebook, Twitter',
      metrics: 'OAuth, Rate Limits, Webhooks'
    },
    database: {
      title: 'PostgreSQL',
      description: 'Banco de dados principal',
      tech: 'ACID, Encryption, Backups, Replication',
      metrics: '99.95% uptime, <50ms queries'
    },
    stripe: {
      title: 'Stripe',
      description: 'Processamento de pagamentos',
      tech: 'PCI DSS, Anti-fraud, Global',
      metrics: 'Secure, Compliant, Real-time'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🏗️ Arquitetura ViralizaAI Enterprise
          </h1>
          <p className="text-gray-300 text-lg">
            Microserviços distribuídos com auto-scaling e alta disponibilidade
          </p>
        </div>

        {/* Diagrama Principal */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-8 overflow-x-auto">
          <div className="min-w-[1200px]">
            
            {/* Usuário */}
            <div className="text-center mb-8">
              <div 
                className={`inline-block bg-blue-600 text-white px-6 py-4 rounded-lg cursor-pointer transition-all hover:bg-blue-500 ${selectedComponent === 'user' ? 'ring-4 ring-blue-300' : ''}`}
                onClick={() => setSelectedComponent('user')}
              >
                <div className="font-bold">👤 USUÁRIO (APP/WEB)</div>
                <div className="text-sm">React + TypeScript</div>
              </div>
              <div className="text-white text-2xl mt-2">↓</div>
            </div>

            {/* Cloudflare */}
            <div className="text-center mb-8">
              <div 
                className={`inline-block bg-orange-600 text-white px-6 py-4 rounded-lg cursor-pointer transition-all hover:bg-orange-500 ${selectedComponent === 'cloudflare' ? 'ring-4 ring-orange-300' : ''}`}
                onClick={() => setSelectedComponent('cloudflare')}
              >
                <div className="font-bold">🛡️ Cloudflare</div>
                <div className="text-sm">Firewall + CDN + DDoS</div>
              </div>
              <div className="text-white text-2xl mt-2">↓</div>
            </div>

            {/* Load Balancer */}
            <div className="text-center mb-8">
              <div 
                className={`inline-block bg-green-600 text-white px-6 py-4 rounded-lg cursor-pointer transition-all hover:bg-green-500 ${selectedComponent === 'loadbalancer' ? 'ring-4 ring-green-300' : ''}`}
                onClick={() => setSelectedComponent('loadbalancer')}
              >
                <div className="font-bold">⚖️ Load Balancer</div>
                <div className="text-sm">Auto-scaling</div>
              </div>
              <div className="text-white text-2xl mt-2">↓</div>
            </div>

            {/* API Gateway */}
            <div className="text-center mb-8">
              <div 
                className={`inline-block bg-purple-600 text-white px-8 py-4 rounded-lg cursor-pointer transition-all hover:bg-purple-500 ${selectedComponent === 'gateway' ? 'ring-4 ring-purple-300' : ''}`}
                onClick={() => setSelectedComponent('gateway')}
              >
                <div className="font-bold">🚪 API GATEWAY</div>
                <div className="text-sm">Node.js + Express</div>
              </div>
            </div>

            {/* Microserviços */}
            <div className="flex justify-center mb-8">
              <div className="grid grid-cols-5 gap-4 max-w-4xl">
                {/* Auth Service */}
                <div className="text-center">
                  <div className="text-white text-2xl mb-2">↓</div>
                  <div 
                    className={`bg-indigo-600 text-white px-4 py-3 rounded-lg cursor-pointer transition-all hover:bg-indigo-500 ${selectedComponent === 'auth' ? 'ring-4 ring-indigo-300' : ''}`}
                    onClick={() => setSelectedComponent('auth')}
                  >
                    <div className="font-bold text-sm">🔐 Auth</div>
                    <div className="text-xs">Service</div>
                  </div>
                </div>

                {/* Billing Service */}
                <div className="text-center">
                  <div className="text-white text-2xl mb-2">↓</div>
                  <div 
                    className={`bg-yellow-600 text-white px-4 py-3 rounded-lg cursor-pointer transition-all hover:bg-yellow-500 ${selectedComponent === 'billing' ? 'ring-4 ring-yellow-300' : ''}`}
                    onClick={() => setSelectedComponent('billing')}
                  >
                    <div className="font-bold text-sm">💳 Billing</div>
                    <div className="text-xs">Service</div>
                  </div>
                </div>

                {/* Tools Service */}
                <div className="text-center">
                  <div className="text-white text-2xl mb-2">↓</div>
                  <div 
                    className={`bg-red-600 text-white px-4 py-3 rounded-lg cursor-pointer transition-all hover:bg-red-500 ${selectedComponent === 'tools' ? 'ring-4 ring-red-300' : ''}`}
                    onClick={() => setSelectedComponent('tools')}
                  >
                    <div className="font-bold text-sm">🛠️ Tools</div>
                    <div className="text-xs">Service</div>
                  </div>
                </div>

                {/* Analytics Service */}
                <div className="text-center">
                  <div className="text-white text-2xl mb-2">↓</div>
                  <div 
                    className={`bg-teal-600 text-white px-4 py-3 rounded-lg cursor-pointer transition-all hover:bg-teal-500 ${selectedComponent === 'analytics' ? 'ring-4 ring-teal-300' : ''}`}
                    onClick={() => setSelectedComponent('analytics')}
                  >
                    <div className="font-bold text-sm">📊 Analytics</div>
                    <div className="text-xs">Service</div>
                  </div>
                </div>

                {/* Notifications Service */}
                <div className="text-center">
                  <div className="text-white text-2xl mb-2">↓</div>
                  <div 
                    className={`bg-pink-600 text-white px-4 py-3 rounded-lg cursor-pointer transition-all hover:bg-pink-500 ${selectedComponent === 'notifications' ? 'ring-4 ring-pink-300' : ''}`}
                    onClick={() => setSelectedComponent('notifications')}
                  >
                    <div className="font-bold text-sm">📢 Notifications</div>
                    <div className="text-xs">Service</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Camada de Integração */}
            <div className="flex justify-center mb-8">
              <div className="grid grid-cols-3 gap-8 max-w-2xl">
                {/* Redis Queue */}
                <div className="text-center">
                  <div className="text-white text-2xl mb-2">↓</div>
                  <div 
                    className={`bg-red-700 text-white px-4 py-3 rounded-lg cursor-pointer transition-all hover:bg-red-600 ${selectedComponent === 'redis' ? 'ring-4 ring-red-300' : ''}`}
                    onClick={() => setSelectedComponent('redis')}
                  >
                    <div className="font-bold text-sm">⚡ Redis</div>
                    <div className="text-xs">Queue</div>
                  </div>
                </div>

                {/* AI APIs */}
                <div className="text-center">
                  <div className="text-white text-2xl mb-2">↓</div>
                  <div 
                    className={`bg-violet-700 text-white px-4 py-3 rounded-lg cursor-pointer transition-all hover:bg-violet-600 ${selectedComponent === 'ai' ? 'ring-4 ring-violet-300' : ''}`}
                    onClick={() => setSelectedComponent('ai')}
                  >
                    <div className="font-bold text-sm">🤖 AI</div>
                    <div className="text-xs">APIs</div>
                  </div>
                </div>

                {/* Email/SMS */}
                <div className="text-center">
                  <div className="text-white text-2xl mb-2">↓</div>
                  <div className="bg-cyan-700 text-white px-4 py-3 rounded-lg">
                    <div className="font-bold text-sm">📧 Email</div>
                    <div className="text-xs">SMS</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social APIs */}
            <div className="text-center mb-8">
              <div className="text-white text-2xl mb-2">↓</div>
              <div 
                className={`inline-block bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-4 rounded-lg cursor-pointer transition-all hover:from-pink-500 hover:to-purple-500 ${selectedComponent === 'social' ? 'ring-4 ring-pink-300' : ''}`}
                onClick={() => setSelectedComponent('social')}
              >
                <div className="font-bold">📱 Social APIs</div>
                <div className="text-sm">Instagram, TikTok, Facebook, Twitter</div>
              </div>
            </div>

            {/* Camada de Dados */}
            <div className="flex justify-center">
              <div className="grid grid-cols-2 gap-8">
                {/* Database */}
                <div className="text-center">
                  <div className="text-white text-2xl mb-2">↓</div>
                  <div 
                    className={`bg-blue-800 text-white px-6 py-4 rounded-lg cursor-pointer transition-all hover:bg-blue-700 ${selectedComponent === 'database' ? 'ring-4 ring-blue-300' : ''}`}
                    onClick={() => setSelectedComponent('database')}
                  >
                    <div className="font-bold">🗄️ PostgreSQL</div>
                    <div className="text-sm">Database</div>
                  </div>
                </div>

                {/* Stripe */}
                <div className="text-center">
                  <div className="text-white text-2xl mb-2">↓</div>
                  <div 
                    className={`bg-purple-800 text-white px-6 py-4 rounded-lg cursor-pointer transition-all hover:bg-purple-700 ${selectedComponent === 'stripe' ? 'ring-4 ring-purple-300' : ''}`}
                    onClick={() => setSelectedComponent('stripe')}
                  >
                    <div className="font-bold">💰 Stripe</div>
                    <div className="text-sm">Payments</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detalhes do Componente Selecionado */}
        {selectedComponent && (
          <div className="bg-gray-800 rounded-2xl p-6 mb-8">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-white">
                {components[selectedComponent].title}
              </h3>
              <button 
                onClick={() => setSelectedComponent(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-blue-400 mb-2">Descrição</h4>
                <p className="text-gray-300">{components[selectedComponent].description}</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-green-400 mb-2">Tecnologia</h4>
                <p className="text-gray-300">{components[selectedComponent].tech}</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-yellow-400 mb-2">Métricas</h4>
                <p className="text-gray-300">{components[selectedComponent].metrics}</p>
              </div>
            </div>
          </div>
        )}

        {/* Especificações Técnicas */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Características da Arquitetura */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <h3 className="text-2xl font-bold text-white mb-6">🏗️ Características da Arquitetura</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="text-green-400 text-xl mr-3">✅</span>
                <span className="text-gray-300"><strong>Microserviços:</strong> Escalabilidade independente</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-400 text-xl mr-3">✅</span>
                <span className="text-gray-300"><strong>Auto-scaling:</strong> Kubernetes + Docker</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-400 text-xl mr-3">✅</span>
                <span className="text-gray-300"><strong>Alta disponibilidade:</strong> 99.9% uptime</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-400 text-xl mr-3">✅</span>
                <span className="text-gray-300"><strong>Segurança:</strong> Nível bancário</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-400 text-xl mr-3">✅</span>
                <span className="text-gray-300"><strong>Monitoramento:</strong> 24/7 com alertas</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-400 text-xl mr-3">✅</span>
                <span className="text-gray-300"><strong>Backup:</strong> Automático e redundante</span>
              </div>
            </div>
          </div>

          {/* Métricas de Performance */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <h3 className="text-2xl font-bold text-white mb-6">📊 Métricas de Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-300">Latência média:</span>
                <span className="text-green-400 font-bold">&lt; 150ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Throughput:</span>
                <span className="text-green-400 font-bold">10k+ req/min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Uptime:</span>
                <span className="text-green-400 font-bold">99.95%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Usuários simultâneos:</span>
                <span className="text-green-400 font-bold">100k+</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Processamento IA:</span>
                <span className="text-green-400 font-bold">1k+ req/sec</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Storage:</span>
                <span className="text-green-400 font-bold">Ilimitado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fluxo de Dados */}
        <div className="bg-gray-800 rounded-2xl p-6">
          <h3 className="text-2xl font-bold text-white mb-6">🔄 Fluxo de Dados</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-400 mb-3">1. Entrada</h4>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Usuário faz requisição</li>
                <li>• Cloudflare filtra tráfego</li>
                <li>• Load Balancer distribui</li>
                <li>• API Gateway autentica</li>
              </ul>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-green-400 mb-3">2. Processamento</h4>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Microserviço processa</li>
                <li>• IA gera conteúdo</li>
                <li>• Queue executa tarefas</li>
                <li>• Database persiste dados</li>
              </ul>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-yellow-400 mb-3">3. Saída</h4>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Resultado processado</li>
                <li>• Notificações enviadas</li>
                <li>• Métricas atualizadas</li>
                <li>• Logs registrados</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureDiagram;
