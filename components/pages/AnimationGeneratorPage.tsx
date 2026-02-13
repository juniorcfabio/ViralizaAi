// 🎭 GERADOR DE ANIMAÇÕES FUNCIONAL - REAL
// Sistema completo de geração de animações usando Canvas e CSS

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import AccessControlService from '../../services/accessControlService';
import PixPaymentModalFixed from '../ui/PixPaymentModalFixed';
import openaiService from '../../services/openaiService';

interface AnimationConfig {
  type: 'logo' | 'text' | 'shape' | 'particle';
  style: string;
  duration: number;
  easing: string;
  colors: string[];
  text?: string;
  elements: AnimationElement[];
}

interface AnimationElement {
  id: string;
  type: 'circle' | 'rectangle' | 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text?: string;
  animations: ElementAnimation[];
}

interface ElementAnimation {
  property: 'x' | 'y' | 'scale' | 'rotation' | 'opacity';
  from: number;
  to: number;
  duration: number;
  delay: number;
  easing: string;
}

const AnimationGeneratorPage: React.FC = () => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [config, setConfig] = useState<AnimationConfig>({
    type: 'logo',
    style: 'modern',
    duration: 3,
    easing: 'ease-in-out',
    colors: ['#4F46E5', '#10B981'],
    elements: []
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasAccess, setHasAccess] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [selectedElement, setSelectedElement] = useState<AnimationElement | null>(null);
  const [aiBrief, setAiBrief] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  // Verificar acesso
  useEffect(() => {
    const checkAccess = async () => {
      if (user) {
        const access = await AccessControlService.hasToolAccess(
          user.id,
          'Gerador de Animações',
          user.type
        );
        setHasAccess(access);
      }
    };
    checkAccess();
  }, [user]);

  // Inicializar elementos padrão
  useEffect(() => {
    if (hasAccess && config.elements.length === 0) {
      createDefaultElements();
    }
  }, [hasAccess]);

  // 🎨 CRIAR ELEMENTOS PADRÃO
  const createDefaultElements = () => {
    const defaultElements: AnimationElement[] = [
      {
        id: 'logo_circle',
        type: 'circle',
        x: 200,
        y: 150,
        width: 100,
        height: 100,
        color: config.colors[0],
        animations: [
          {
            property: 'scale',
            from: 0,
            to: 1,
            duration: 1,
            delay: 0,
            easing: 'ease-out'
          },
          {
            property: 'rotation',
            from: 0,
            to: 360,
            duration: 2,
            delay: 0.5,
            easing: 'linear'
          }
        ]
      },
      {
        id: 'brand_text',
        type: 'text',
        x: 300,
        y: 200,
        width: 200,
        height: 50,
        color: config.colors[1],
        text: 'ViralizaAI',
        animations: [
          {
            property: 'x',
            from: 500,
            to: 300,
            duration: 1.5,
            delay: 1,
            easing: 'ease-in-out'
          },
          {
            property: 'opacity',
            from: 0,
            to: 1,
            duration: 1,
            delay: 1.2,
            easing: 'ease-in'
          }
        ]
      }
    ];

    setConfig(prev => ({ ...prev, elements: defaultElements }));
  };

  // 🎬 RENDERIZAR FRAME DA ANIMAÇÃO
  const renderFrame = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Renderizar cada elemento
    config.elements.forEach(element => {
      renderElement(ctx, element, time);
    });
  };

  // 🎨 RENDERIZAR ELEMENTO
  const renderElement = (ctx: CanvasRenderingContext2D, element: AnimationElement, time: number) => {
    // Calcular propriedades animadas
    const props = calculateAnimatedProperties(element, time);
    
    ctx.save();
    
    // Aplicar transformações
    ctx.globalAlpha = props.opacity;
    ctx.translate(props.x + element.width / 2, props.y + element.height / 2);
    ctx.rotate((props.rotation * Math.PI) / 180);
    ctx.scale(props.scale, props.scale);
    ctx.translate(-element.width / 2, -element.height / 2);

    // Renderizar baseado no tipo
    switch (element.type) {
      case 'circle':
        ctx.fillStyle = element.color;
        ctx.beginPath();
        ctx.arc(element.width / 2, element.height / 2, element.width / 2, 0, 2 * Math.PI);
        ctx.fill();
        break;

      case 'rectangle':
        ctx.fillStyle = element.color;
        ctx.fillRect(0, 0, element.width, element.height);
        break;

      case 'text':
        ctx.fillStyle = element.color;
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(element.text || '', element.width / 2, element.height / 2 + 8);
        break;
    }

    ctx.restore();
  };

  // 📊 CALCULAR PROPRIEDADES ANIMADAS
  const calculateAnimatedProperties = (element: AnimationElement, time: number) => {
    const props = {
      x: element.x,
      y: element.y,
      scale: 1,
      rotation: 0,
      opacity: 1
    };

    element.animations.forEach(animation => {
      const startTime = animation.delay;
      const endTime = startTime + animation.duration;
      
      if (time >= startTime && time <= endTime) {
        const progress = (time - startTime) / animation.duration;
        const easedProgress = applyEasing(progress, animation.easing);
        const value = animation.from + (animation.to - animation.from) * easedProgress;
        
        props[animation.property] = value;
      } else if (time > endTime) {
        props[animation.property] = animation.to;
      }
    });

    return props;
  };

  // 📈 APLICAR EASING
  const applyEasing = (t: number, easing: string): number => {
    switch (easing) {
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return 1 - (1 - t) * (1 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      case 'bounce':
        return 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 4);
      default:
        return t; // linear
    }
  };

  // ▶️ REPRODUZIR ANIMAÇÃO
  const playAnimation = () => {
    setIsPlaying(true);
    setCurrentTime(0);
  };

  // ⏸️ PAUSAR ANIMAÇÃO
  const pauseAnimation = () => {
    setIsPlaying(false);
  };

  // ⏱️ LOOP DE ANIMAÇÃO
  useEffect(() => {
    let animationFrame: number;
    
    if (isPlaying) {
      const animate = () => {
        setCurrentTime(prev => {
          const newTime = prev + 0.016; // ~60fps
          if (newTime >= config.duration) {
            setIsPlaying(false);
            return config.duration;
          }
          return newTime;
        });
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, config.duration]);

  // 🎬 RENDERIZAR FRAME ATUAL
  useEffect(() => {
    renderFrame(currentTime);
  }, [currentTime, config]);

  // 💾 EXPORTAR ANIMAÇÃO
  const exportAnimation = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Verificar se APIs estão disponíveis no browser
    if (typeof window === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
      alert('❌ Exportação de animação não suportada neste browser');
      return;
    }

    const stream = canvas.captureStream(60);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'animacao-viralizaai.webm';
      a.click();
      
      URL.revokeObjectURL(url);
      alert('✅ Animação exportada com sucesso!');
    };

    // Gravar animação
    mediaRecorder.start();
    
    let recordTime = 0;
    const recordInterval = setInterval(() => {
      renderFrame(recordTime);
      recordTime += 0.016;
      
      if (recordTime >= config.duration) {
        clearInterval(recordInterval);
        mediaRecorder.stop();
      }
    }, 16);
  };

  // 🎨 ADICIONAR ELEMENTO
  const addElement = (type: 'circle' | 'rectangle' | 'text') => {
    const newElement: AnimationElement = {
      id: `element_${Date.now()}`,
      type,
      x: 100,
      y: 100,
      width: type === 'text' ? 150 : 80,
      height: type === 'text' ? 40 : 80,
      color: config.colors[0],
      text: type === 'text' ? 'Novo Texto' : undefined,
      animations: [
        {
          property: 'opacity',
          from: 0,
          to: 1,
          duration: 1,
          delay: 0,
          easing: 'ease-in'
        }
      ]
    };

    setConfig(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
  };

  // 💳 FUNÇÕES DE PAGAMENTO
  const purchaseWithStripe = async () => {
    try {
      const payment = AccessControlService.registerPayment({
        userId: user?.id || 'guest',
        type: 'tool',
        itemName: 'Gerador de Animações',
        amount: 67.00,
        paymentMethod: 'stripe',
        status: 'pending'
      });

      const paymentData = {
        planName: 'Gerador de Animações - ViralizaAI',
        amount: 6700,
        successUrl: `${window.location.origin}/dashboard/animation-generator?payment=success`,
        cancelUrl: `${window.location.origin}/dashboard/animation-generator?payment=cancelled`
      };

      const response = await fetch('/api/stripe-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      if (result.success && result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      alert('Erro ao processar pagamento.');
    }
  };

  const purchaseWithPix = () => {
    AccessControlService.registerPayment({
      userId: user?.id || 'guest',
      type: 'tool',
      itemName: 'Gerador de Animações',
      amount: 67.00,
      paymentMethod: 'pix',
      status: 'pending'
    });
    setShowPixModal(true);
  };

  const handlePixPaymentSuccess = () => {
    const payments = AccessControlService.getAllPayments();
    const pendingPayment = payments.find(p => 
      p.itemName === 'Gerador de Animações' && 
      p.paymentMethod === 'pix' && 
      p.status === 'pending'
    );
    
    if (pendingPayment) {
      AccessControlService.confirmPayment(pendingPayment.id, `pix_${Date.now()}`);
      setHasAccess(true);
    }
    
    setShowPixModal(false);
    alert('✅ Pagamento confirmado! Gerador de Animações ativado.');
    window.location.reload();
  };

  // Se não tem acesso, mostrar tela de compra
  if (user?.type !== 'admin' && !hasAccess) {
    return (
      <div className="min-h-screen bg-primary text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">🎭 Gerador de Animações</h1>
            <p className="text-xl mb-8">Ferramenta Premium - Acesso Restrito</p>
            
            <div className="bg-secondary rounded-2xl p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">🎭 Gerador de Animações Profissionais</h2>
              <p className="text-gray-300 mb-6">Crie animações incríveis para logos, textos e elementos visuais</p>
              
              <div className="bg-primary/50 rounded-lg p-4 mb-6">
                <div className="text-3xl font-bold text-green-400 mb-2">R$ 67,00</div>
                <div className="text-gray-300 text-sm">Acesso vitalício à ferramenta</div>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={purchaseWithStripe}
                  className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                >
                  💳 Pagar com Cartão (Stripe)
                </button>
                
                <button
                  onClick={purchaseWithPix}
                  className="w-full bg-green-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-3"
                >
                  🏦 Pagar com PIX
                </button>
              </div>
            </div>
          </div>
        </div>

        {showPixModal && (
          <PixPaymentModalFixed
            isOpen={showPixModal}
            onClose={() => setShowPixModal(false)}
            planName="Gerador de Animações"
            amount={67.00}
            onPaymentSuccess={undefined}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🎭 Gerador de Animações</h1>
          <div className="flex gap-4">
            <button
              onClick={playAnimation}
              className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700"
              disabled={isPlaying}
            >
              ▶️ Reproduzir
            </button>
            <button
              onClick={pauseAnimation}
              className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700"
              disabled={!isPlaying}
            >
              ⏸️ Pausar
            </button>
            <button
              onClick={exportAnimation}
              className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              💾 Exportar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Painel de Elementos */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-bold mb-4">🎨 Elementos</h3>
            <div className="space-y-2">
              <button
                onClick={() => addElement('circle')}
                className="w-full bg-blue-600 py-2 rounded hover:bg-blue-700"
              >
                ⭕ Círculo
              </button>
              <button
                onClick={() => addElement('rectangle')}
                className="w-full bg-purple-600 py-2 rounded hover:bg-purple-700"
              >
                ⬜ Retângulo
              </button>
              <button
                onClick={() => addElement('text')}
                className="w-full bg-green-600 py-2 rounded hover:bg-green-700"
              >
                ✏️ Texto
              </button>
              <button
                onClick={async () => {
                  setAiLoading(true);
                  try {
                    const brief = await openaiService.generate('scripts',
                      `Crie um briefing completo para animação promocional de marketing digital.\n\nInclua:\n- Conceito visual e narrativa\n- Estilo de animação (2D/3D/motion graphics)\n- Paleta de cores (códigos hex)\n- Sequência de cenas (5 cenas)\n- Texto animado para cada cena\n- Duração sugerida por cena\n- Efeitos e transições\n- Música/efeitos sonoros sugeridos`
                    );
                    setAiBrief(brief);
                  } catch (e: any) {
                    alert('Erro IA: ' + e.message);
                  } finally {
                    setAiLoading(false);
                  }
                }}
                disabled={aiLoading}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 py-2 rounded hover:from-yellow-600 hover:to-orange-600 font-semibold"
              >
                {aiLoading ? '⏳ Gerando...' : '🤖 Briefing IA'}
              </button>
            </div>
            {aiBrief && (
              <div className="mt-3 bg-gray-700 rounded p-3 text-xs max-h-48 overflow-y-auto whitespace-pre-wrap">
                {aiBrief}
              </div>
            )}

            <div className="mt-6">
              <h4 className="font-bold mb-2">Elementos na Cena:</h4>
              <div className="space-y-1">
                {config.elements.map(element => (
                  <div
                    key={element.id}
                    className={`p-2 rounded cursor-pointer ${
                      selectedElement?.id === element.id ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                    onClick={() => setSelectedElement(element)}
                  >
                    {element.type} - {element.text || element.id.split('_')[1]}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Canvas Principal */}
          <div className="col-span-2 bg-gray-800 rounded-lg p-4">
            <div className="bg-black rounded-lg p-4 mb-4">
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                className="w-full border border-gray-600 rounded"
              />
            </div>
            
            {/* Timeline */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-sm">Timeline:</span>
                <span className="text-sm">{currentTime.toFixed(2)}s / {config.duration}s</span>
              </div>
              <input
                type="range"
                min="0"
                max={config.duration}
                step="0.01"
                value={currentTime}
                onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Painel de Propriedades */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-bold mb-4">⚙️ Propriedades</h3>
            
            {/* Configurações Globais */}
            <div className="mb-6">
              <h4 className="font-bold mb-2">Animação:</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm mb-1">Duração (s):</label>
                  <input
                    type="number"
                    value={config.duration}
                    onChange={(e) => setConfig(prev => ({ ...prev, duration: parseFloat(e.target.value) }))}
                    className="w-full bg-gray-700 px-2 py-1 rounded"
                    min="1"
                    max="10"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Estilo:</label>
                  <select
                    value={config.style}
                    onChange={(e) => setConfig(prev => ({ ...prev, style: e.target.value }))}
                    className="w-full bg-gray-700 px-2 py-1 rounded"
                  >
                    <option value="modern">Moderno</option>
                    <option value="classic">Clássico</option>
                    <option value="minimal">Minimalista</option>
                    <option value="dynamic">Dinâmico</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Propriedades do Elemento Selecionado */}
            {selectedElement && (
              <div>
                <h4 className="font-bold mb-2">Elemento Selecionado:</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm mb-1">Cor:</label>
                    <input
                      type="color"
                      value={selectedElement.color}
                      onChange={(e) => {
                        const newElement = { ...selectedElement, color: e.target.value };
                        setSelectedElement(newElement);
                        setConfig(prev => ({
                          ...prev,
                          elements: prev.elements.map(el => el.id === newElement.id ? newElement : el)
                        }));
                      }}
                      className="w-full bg-gray-700 rounded"
                    />
                  </div>
                  
                  {selectedElement.type === 'text' && (
                    <div>
                      <label className="block text-sm mb-1">Texto:</label>
                      <input
                        type="text"
                        value={selectedElement.text || ''}
                        onChange={(e) => {
                          const newElement = { ...selectedElement, text: e.target.value };
                          setSelectedElement(newElement);
                          setConfig(prev => ({
                            ...prev,
                            elements: prev.elements.map(el => el.id === newElement.id ? newElement : el)
                          }));
                        }}
                        className="w-full bg-gray-700 px-2 py-1 rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimationGeneratorPage;
