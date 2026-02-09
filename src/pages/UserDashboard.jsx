// 👤 PAINEL DO USUÁRIO - FERRAMENTAS E RECURSOS
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import PixPaymentModalFixed from '../../components/ui/PixPaymentModalFixed';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('tools');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPixModal, setShowPixModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);

  // 📊 DADOS REAIS DO USUÁRIO
  const realUserStats = {
    name: 'João Silva',
    email: 'joao@email.com',
    plano: 'Pro',
    plano_ativo: true,
    affiliate_code: 'JS123456',
    tools_purchased: 8,
    credits_remaining: 450,
    usage_this_month: 67
  };

  useEffect(() => {
    // Simular carregamento dos dados do usuário
    setTimeout(() => {
      setUser(realUserStats);
      setLoading(false);
    }, 1000);
  }, []);

  // 🛠️ FUNÇÕES PARA USAR E COMPRAR FERRAMENTAS
  const handleUseTool = (tool) => {
    switch(tool.id) {
      case 1: // Gerador de Scripts IA
        window.open('/dashboard/ai-script-generator', '_blank');
        break;
      case 2: // Criador de Thumbnails
        window.open('/dashboard/thumbnail-creator', '_blank');
        break;
      case 4: // Otimizador de SEO
        window.open('/dashboard/seo-optimizer', '_blank');
        break;
      default:
        alert(`🚀 Abrindo ${tool.name}...\n\nEsta ferramenta será aberta em uma nova aba com todas as funcionalidades disponíveis!`);
    }
  };

  const handlePurchaseTool = async (tool) => {
    const confirmed = confirm(`💰 Comprar ${tool.name}\n\nPreço: ${tool.price}\n\nDeseja prosseguir com a compra?`);
    if (confirmed) {
      try {
        console.log('🛠️ Iniciando compra ferramenta:', tool);

        // Extrair valor numérico do preço
        const priceValue = parseFloat(tool.price.replace('R$', '').replace(',', '.').trim());
        
        // Usar a API funcional stripe-test
        const paymentData = {
          planName: `${tool.name} - Ferramenta ViralizaAI`,
          amount: Math.round(priceValue * 100), // Converter para centavos
          successUrl: `${window.location.origin}/dashboard?payment=success&tool=${encodeURIComponent(tool.name)}`,
          cancelUrl: `${window.location.origin}/dashboard?payment=cancelled`
        };

        console.log('📋 Dados do pagamento da ferramenta:', paymentData);
        
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
        console.error('❌ Erro ao processar pagamento da ferramenta:', error);
        alert('Erro ao processar pagamento. Tente novamente.');
      }
    }
  };

  // 🏦 FUNÇÃO PIX PARA FERRAMENTAS
  const handlePixPurchase = (tool) => {
    setSelectedTool(tool);
    setShowPixModal(true);
  };

  // 🛠️ FERRAMENTAS DISPONÍVEIS
  const availableTools = [
    {
      id: 1,
      name: 'Gerador de Scripts IA',
      description: 'Crie scripts virais para seus vídeos usando inteligência artificial',
      price: 'R$ 29,90',
      category: 'IA',
      icon: '🤖',
      owned: true,
      popular: true
    },
    {
      id: 2,
      name: 'Criador de Thumbnails',
      description: 'Gere thumbnails atrativas automaticamente para seus vídeos',
      price: 'R$ 19,90',
      category: 'Design',
      icon: '🎨',
      owned: true,
      popular: false
    },
    {
      id: 3,
      name: 'Analisador de Trends',
      description: 'Descubra as tendências mais quentes do momento',
      price: 'R$ 39,90',
      category: 'Analytics',
      icon: '📈',
      owned: false,
      popular: true
    },
    {
      id: 4,
      name: 'Otimizador de SEO',
      description: 'Otimize seu conteúdo para os mecanismos de busca',
      price: 'R$ 24,90',
      category: 'SEO',
      icon: '🔍',
      owned: true,
      popular: false
    },
    {
      id: 5,
      name: 'Gerador de Hashtags',
      description: 'Encontre as hashtags perfeitas para seu conteúdo',
      price: 'R$ 14,90',
      category: 'Social',
      icon: '#️⃣',
      owned: false,
      popular: true
    },
    {
      id: 6,
      name: 'Criador de Logos',
      description: 'Crie logos profissionais em minutos',
      price: 'R$ 49,90',
      category: 'Design',
      icon: '🎯',
      owned: false,
      popular: false
    }
  ];

  // 📊 COMPONENTE DE ESTATÍSTICA
  const StatCard = ({ title, value, subtitle, color = 'blue', icon }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {icon && <div className="text-3xl">{icon}</div>}
      </div>
    </div>
  );

  // 🛠️ ABA FERRAMENTAS
  const ToolsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🛠️ Suas Ferramentas</h2>
        <div className="flex space-x-2">
          <select className="border rounded-lg px-3 py-2">
            <option>Todas as categorias</option>
            <option>IA</option>
            <option>Design</option>
            <option>Analytics</option>
            <option>SEO</option>
            <option>Social</option>
          </select>
        </div>
      </div>

      {/* ESTATÍSTICAS DO USUÁRIO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Ferramentas Adquiridas" 
          value={user?.tools_purchased} 
          subtitle="de 6 disponíveis"
          color="#4F46E5"
          icon="🛠️"
        />
        <StatCard 
          title="Créditos Restantes" 
          value={user?.credits_remaining} 
          subtitle="Renova em 15 dias"
          color="#10B981"
          icon="⚡"
        />
        <StatCard 
          title="Uso Este Mês" 
          value={`${user?.usage_this_month}%`}
          subtitle="do limite do plano"
          color="#F59E0B"
          icon="📊"
        />
        <StatCard 
          title="Plano Atual" 
          value={user?.plano}
          subtitle={user?.plano_ativo ? 'Ativo' : 'Inativo'}
          color="#8B5CF6"
          icon="👑"
        />
      </div>

      {/* GRID DE FERRAMENTAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableTools.map((tool) => (
          <div key={tool.id} className="bg-white rounded-lg shadow-md p-6 relative">
            {tool.popular && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                🔥 Popular
              </div>
            )}
            
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">{tool.icon}</div>
              <div>
                <h3 className="font-semibold text-lg">{tool.name}</h3>
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">{tool.category}</span>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">{tool.description}</p>
            
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-green-600">{tool.price}</span>
              {tool.owned ? (
                <button 
                  onClick={() => handleUseTool(tool)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  ✨ Usar Agora
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePurchaseTool(tool)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    💳 Cartão
                  </button>
                  <button 
                    onClick={() => handlePixPurchase(tool)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    🏦 PIX
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 🤝 ABA AFILIADOS
  const AffiliateTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🤝 Programa de Afiliados</h2>
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
          30% de Comissão
        </div>
      </div>

      {/* LINK DE AFILIADO */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-2">🎯 Seu Link de Afiliado</h3>
        <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <code className="text-sm">https://viralizaai.com/ref/{user?.affiliate_code}</code>
            <button className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100">
              📋 Copiar
            </button>
          </div>
        </div>
        <p className="text-sm opacity-90">
          Compartilhe este link e ganhe 30% de comissão sobre todas as vendas!
        </p>
      </div>

      {/* ESTATÍSTICAS DE AFILIADO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Cliques no Link" value="156" subtitle="+23 esta semana" color="#4F46E5" icon="👆" />
        <StatCard title="Conversões" value="12" subtitle="7.7% taxa" color="#10B981" icon="✅" />
        <StatCard title="Comissões Ganhas" value="R$ 890" subtitle="Este mês" color="#F59E0B" icon="💰" />
        <StatCard title="Saldo Disponível" value="R$ 340" subtitle="Para saque" color="#8B5CF6" icon="🏦" />
      </div>

      {/* HISTÓRICO DE COMISSÕES */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">📈 Histórico de Comissões</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={[
            { mes: 'Jan', comissoes: 120 },
            { mes: 'Fev', comissoes: 340 },
            { mes: 'Mar', comissoes: 560 },
            { mes: 'Abr', comissoes: 780 },
            { mes: 'Mai', comissoes: 890 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip formatter={(value) => [`R$ ${value}`, 'Comissões']} />
            <Line type="monotone" dataKey="comissoes" stroke="#4F46E5" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* BOTÃO DE SAQUE */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">💸 Solicitar Saque</h3>
            <p className="text-gray-600">Saldo disponível: R$ 340,00</p>
          </div>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold">
            Sacar via PIX
          </button>
        </div>
      </div>
    </div>
  );

  // 📊 ABA ESTATÍSTICAS
  const StatsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📊 Suas Estatísticas</h2>

      {/* RESUMO MENSAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Conteúdos Criados" value="89" subtitle="+12 esta semana" color="#4F46E5" icon="📝" />
        <StatCard title="Visualizações Geradas" value="45.6K" subtitle="+8.2K esta semana" color="#10B981" icon="👀" />
        <StatCard title="Engajamento Médio" value="12.4%" subtitle="+2.1% vs mês anterior" color="#F59E0B" icon="❤️" />
      </div>

      {/* GRÁFICO DE USO DAS FERRAMENTAS */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">🛠️ Uso das Ferramentas</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { ferramenta: 'Scripts IA', usos: 45 },
            { ferramenta: 'Thumbnails', usos: 32 },
            { ferramenta: 'SEO', usos: 28 },
            { ferramenta: 'Hashtags', usos: 23 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ferramenta" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="usos" fill="#4F46E5" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* PERFORMANCE DO CONTEÚDO */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">📈 Performance do Conteúdo</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={[
            { dia: 'Seg', views: 1200, likes: 89 },
            { dia: 'Ter', views: 1800, likes: 134 },
            { dia: 'Qua', views: 2400, likes: 178 },
            { dia: 'Qui', views: 1900, likes: 145 },
            { dia: 'Sex', views: 3200, likes: 234 },
            { dia: 'Sab', views: 2800, likes: 198 },
            { dia: 'Dom', views: 2100, likes: 156 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="views" stroke="#4F46E5" name="Visualizações" />
            <Line type="monotone" dataKey="likes" stroke="#10B981" name="Curtidas" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // 🎯 NAVEGAÇÃO
  const tabs = [
    { id: 'tools', label: '🛠️ Ferramentas', component: ToolsTab },
    { id: 'affiliate', label: '🤝 Afiliados', component: AffiliateTab },
    { id: 'stats', label: '📊 Estatísticas', component: StatsTab }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">👋 Olá, {user?.name}!</h1>
              <p className="text-sm text-gray-600">
                Plano {user?.plano} • {user?.plano_ativo ? '✅ Ativo' : '❌ Inativo'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">Créditos</p>
                <p className="text-xl font-bold text-blue-600">{user?.credits_remaining}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tabs.find(tab => tab.id === activeTab)?.component()}
      </div>

      {/* Modal PIX */}
      {showPixModal && selectedTool && (
        <PixPaymentModalFixed
          isOpen={showPixModal}
          onClose={() => {
            setShowPixModal(false);
            setSelectedTool(null);
          }}
          planName={selectedTool.name}
          amount={parseFloat(selectedTool.price.replace('R$', '').replace(',', '.'))}
          onPaymentSuccess={() => {
            setShowPixModal(false);
            setSelectedTool(null);
            alert('✅ Pagamento PIX realizado! Ferramenta ativada.');
          }}
        />
      )}
    </div>
  );
};

export default UserDashboard;
