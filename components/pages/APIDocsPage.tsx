// 🔌 PÁGINA DE DOCUMENTAÇÃO DA API - FUNCIONAL
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';

const APIDocsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Gerar API Key simulada
  const generateApiKey = () => {
    const key = `vz_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    setApiKey(key);
    setShowApiKey(true);
  };

  const sections = [
    { id: 'overview', name: '📋 Visão Geral', icon: '📋' },
    { id: 'auth', name: '🔐 Autenticação', icon: '🔐' },
    { id: 'endpoints', name: '🔌 Endpoints', icon: '🔌' },
    { id: 'examples', name: '💻 Exemplos', icon: '💻' },
    { id: 'sdks', name: '📦 SDKs', icon: '📦' },
    { id: 'limits', name: '⚡ Limites', icon: '⚡' }
  ];

  const endpoints = [
    {
      method: 'POST',
      path: '/api/v1/content/generate',
      description: 'Gerar conteúdo com IA',
      params: ['type', 'prompt', 'style']
    },
    {
      method: 'GET',
      path: '/api/v1/analytics/metrics',
      description: 'Obter métricas de performance',
      params: ['account_id', 'date_range', 'platform']
    },
    {
      method: 'POST',
      path: '/api/v1/posts/schedule',
      description: 'Agendar postagem',
      params: ['content', 'platforms', 'schedule_time']
    },
    {
      method: 'GET',
      path: '/api/v1/accounts/list',
      description: 'Listar contas conectadas',
      params: ['platform', 'status']
    },
    {
      method: 'POST',
      path: '/api/v1/automation/create',
      description: 'Criar automação',
      params: ['name', 'triggers', 'actions']
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-4">📋 API ViralizaAI</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                A API ViralizaAI permite integrar nossas funcionalidades de automação e IA em suas próprias aplicações. 
                Com nossa API REST, você pode gerar conteúdo, agendar posts, obter analytics e muito mais.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">🚀 Recursos Principais</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Geração de conteúdo com IA</li>
                  <li>• Agendamento de posts</li>
                  <li>• Analytics em tempo real</li>
                  <li>• Automação de interações</li>
                  <li>• Gestão de múltiplas contas</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">⚡ Especificações</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• <strong>Protocolo:</strong> HTTPS REST</li>
                  <li>• <strong>Formato:</strong> JSON</li>
                  <li>• <strong>Autenticação:</strong> API Key</li>
                  <li>• <strong>Rate Limit:</strong> 1000 req/hora</li>
                  <li>• <strong>Uptime:</strong> 99.9% SLA</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3">🎯 Base URL</h3>
              <code className="bg-black/30 px-4 py-2 rounded text-accent block">
                https://api.viralizaai.com/v1
              </code>
            </div>
          </div>
        );

      case 'auth':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-4">🔐 Autenticação</h2>
              <p className="text-gray-300 text-lg">
                A API ViralizaAI usa API Keys para autenticação. Inclua sua chave no header de todas as requisições.
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">🔑 Sua API Key</h3>
              {user ? (
                <div className="space-y-4">
                  {!showApiKey ? (
                    <button
                      onClick={generateApiKey}
                      className="bg-accent hover:bg-accent/80 text-white font-bold py-3 px-6 rounded-lg transition-all"
                    >
                      Gerar API Key
                    </button>
                  ) : (
                    <div className="bg-black/30 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <code className="text-accent">{apiKey}</code>
                        <button
                          onClick={() => navigator.clipboard.writeText(apiKey)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                        >
                          📋 Copiar
                        </button>
                      </div>
                      <p className="text-red-300 text-sm mt-2">
                        ⚠️ Guarde esta chave em local seguro. Ela não será exibida novamente.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-300">
                    🔒 Faça login para gerar sua API Key
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">📝 Como Usar</h3>
              <p className="text-gray-300 mb-4">Inclua o header de autorização em todas as requisições:</p>
              <div className="bg-black/30 p-4 rounded-lg">
                <code className="text-green-400">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">🛡️ Segurança</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Nunca exponha sua API Key no frontend</li>
                <li>• Use HTTPS para todas as requisições</li>
                <li>• Regenere a chave se comprometida</li>
                <li>• Monitore o uso através do dashboard</li>
              </ul>
            </div>
          </div>
        );

      case 'endpoints':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-4">🔌 Endpoints Disponíveis</h2>
              <p className="text-gray-300 text-lg">
                Lista completa de endpoints da API ViralizaAI com métodos, parâmetros e exemplos.
              </p>
            </div>

            <div className="space-y-4">
              {endpoints.map((endpoint, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-6">
                  <div className="flex items-center gap-4 mb-3">
                    <span className={`px-3 py-1 rounded text-sm font-bold ${
                      endpoint.method === 'GET' ? 'bg-green-600' : 'bg-blue-600'
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-accent">{endpoint.path}</code>
                  </div>
                  <p className="text-gray-300 mb-3">{endpoint.description}</p>
                  <div>
                    <h4 className="font-bold mb-2">Parâmetros:</h4>
                    <div className="flex flex-wrap gap-2">
                      {endpoint.params.map((param, i) => (
                        <span key={i} className="bg-gray-700 px-2 py-1 rounded text-sm">
                          {param}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'examples':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-4">💻 Exemplos de Código</h2>
              <p className="text-gray-300 text-lg">
                Exemplos práticos de como usar a API ViralizaAI em diferentes linguagens.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">🟨 JavaScript/Node.js</h3>
                <div className="bg-black/30 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-green-400 text-sm">
{`const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.viralizaai.com/v1',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

// Gerar conteúdo com IA
async function generateContent() {
  try {
    const response = await api.post('/content/generate', {
      type: 'post',
      prompt: 'Criar post sobre marketing digital',
      style: 'profissional'
    });
    
    console.log(response.data);
  } catch (error) {
    console.error('Erro:', error.response.data);
  }
}`}
                  </pre>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">🐍 Python</h3>
                <div className="bg-black/30 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-green-400 text-sm">
{`import requests
import json

class ViralizaAPI:
    def __init__(self, api_key):
        self.base_url = 'https://api.viralizaai.com/v1'
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def generate_content(self, prompt, content_type='post', style='casual'):
        endpoint = f'{self.base_url}/content/generate'
        data = {
            'type': content_type,
            'prompt': prompt,
            'style': style
        }
        
        response = requests.post(endpoint, headers=self.headers, json=data)
        return response.json()

# Uso
api = ViralizaAPI('YOUR_API_KEY')
result = api.generate_content('Criar post sobre IA')`}
                  </pre>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">🔵 cURL</h3>
                <div className="bg-black/30 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-green-400 text-sm">
{`# Gerar conteúdo
curl -X POST https://api.viralizaai.com/v1/content/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "post",
    "prompt": "Criar post sobre tecnologia",
    "style": "informal"
  }'

# Obter analytics
curl -X GET "https://api.viralizaai.com/v1/analytics/metrics?account_id=123&date_range=7d" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        );

      case 'sdks':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-4">📦 SDKs Oficiais</h2>
              <p className="text-gray-300 text-lg">
                SDKs oficiais para facilitar a integração com a API ViralizaAI.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-2xl">🟨</div>
                  <h3 className="text-xl font-bold">JavaScript SDK</h3>
                </div>
                <p className="text-gray-300 mb-4">SDK oficial para Node.js e browsers</p>
                <div className="bg-black/30 p-3 rounded mb-4">
                  <code className="text-green-400">npm install @viralizaai/sdk</code>
                </div>
                <button className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">
                  📥 Baixar
                </button>
              </div>

              <div className="bg-white/5 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-2xl">🐍</div>
                  <h3 className="text-xl font-bold">Python SDK</h3>
                </div>
                <p className="text-gray-300 mb-4">SDK oficial para Python 3.7+</p>
                <div className="bg-black/30 p-3 rounded mb-4">
                  <code className="text-green-400">pip install viralizaai</code>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  📥 Baixar
                </button>
              </div>

              <div className="bg-white/5 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-2xl">💎</div>
                  <h3 className="text-xl font-bold">Ruby SDK</h3>
                </div>
                <p className="text-gray-300 mb-4">SDK oficial para Ruby 2.7+</p>
                <div className="bg-black/30 p-3 rounded mb-4">
                  <code className="text-green-400">gem install viralizaai</code>
                </div>
                <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                  📥 Baixar
                </button>
              </div>

              <div className="bg-white/5 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-2xl">🔵</div>
                  <h3 className="text-xl font-bold">Go SDK</h3>
                </div>
                <p className="text-gray-300 mb-4">SDK oficial para Go 1.18+</p>
                <div className="bg-black/30 p-3 rounded mb-4">
                  <code className="text-green-400">go get github.com/viralizaai/go-sdk</code>
                </div>
                <button className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded">
                  📥 Baixar
                </button>
              </div>
            </div>
          </div>
        );

      case 'limits':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-4">⚡ Limites e Quotas</h2>
              <p className="text-gray-300 text-lg">
                Informações sobre limites de uso, rate limiting e quotas da API.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">📊 Rate Limits</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Requisições por minuto:</span>
                    <span className="font-bold text-accent">100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Requisições por hora:</span>
                    <span className="font-bold text-accent">1,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Requisições por dia:</span>
                    <span className="font-bold text-accent">10,000</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">💾 Quotas de Dados</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Upload máximo:</span>
                    <span className="font-bold text-accent">100 MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Geração de conteúdo/dia:</span>
                    <span className="font-bold text-accent">500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contas conectadas:</span>
                    <span className="font-bold text-accent">10</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">⚠️ Headers de Rate Limit</h3>
              <p className="text-gray-300 mb-4">
                Todas as respostas incluem headers com informações sobre seus limites:
              </p>
              <div className="bg-black/30 p-4 rounded-lg">
                <pre className="text-green-400 text-sm">
{`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200`}
                </pre>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">🚫 Resposta de Limite Excedido</h3>
              <div className="bg-black/30 p-4 rounded-lg">
                <pre className="text-red-400 text-sm">
{`HTTP/1.1 429 Too Many Requests
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "retry_after": 60
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">🔌 API ViralizaAI</h1>
            <p className="text-xl text-gray-300">Documentação completa da nossa API REST</p>
            <div className="text-sm text-gray-400 mt-2">
              Versão 1.0 | Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Sidebar */}
            <div className="lg:w-1/4">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sticky top-6">
                <h3 className="font-bold mb-4">📚 Navegação</h3>
                <nav className="space-y-2">
                  {sections.map(section => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                        activeSection === section.id
                          ? 'bg-accent text-white'
                          : 'text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {section.icon} {section.name}
                    </button>
                  ))}
                </nav>

                {/* Status */}
                <div className="mt-6 pt-6 border-t border-gray-600">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>API Status: Operacional</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Uptime: 99.9%
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="lg:w-3/4">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
                {renderContent()}
              </div>
            </div>
          </div>

          {/* Botão Voltar */}
          <div className="text-center mt-8">
            <button
              onClick={() => window.history.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-xl transition-all"
            >
              ← Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIDocsPage;
