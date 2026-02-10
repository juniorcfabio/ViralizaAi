// 🎬 EDITOR DE VÍDEO FUNCIONAL - REAL
// Sistema completo de edição de vídeo usando HTML5 Canvas e Web APIs

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import AccessControlService from '../../services/accessControlService';
import PixPaymentModalFixed from '../ui/PixPaymentModalFixed';

interface VideoProject {
  id: string;
  name: string;
  duration: number;
  clips: VideoClip[];
  effects: VideoEffect[];
  createdAt: string;
}

interface VideoClip {
  id: string;
  type: 'video' | 'image' | 'text';
  src?: string;
  text?: string;
  startTime: number;
  duration: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VideoEffect {
  id: string;
  type: 'fade' | 'zoom' | 'blur' | 'color';
  startTime: number;
  duration: number;
  intensity: number;
}

const VideoEditorPage: React.FC = () => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [project, setProject] = useState<VideoProject | null>(null);
  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showPixModal, setShowPixModal] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  // Verificar acesso
  useEffect(() => {
    if (user) {
      const access = AccessControlService.hasToolAccess(
        user.id,
        'Editor de Vídeo Pro',
        user.type
      );
      setHasAccess(access);
    }
  }, [user]);

  // Inicializar projeto
  useEffect(() => {
    if (hasAccess && !project) {
      createNewProject();
    }
  }, [hasAccess]);

  // 🎬 CRIAR NOVO PROJETO
  const createNewProject = () => {
    const newProject: VideoProject = {
      id: `project_${Date.now()}`,
      name: 'Novo Projeto',
      duration: 30,
      clips: [],
      effects: [],
      createdAt: new Date().toISOString()
    };
    setProject(newProject);
  };

  // 📁 ADICIONAR ARQUIVO DE VÍDEO
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !project) return;

    const url = URL.createObjectURL(file);
    const newClip: VideoClip = {
      id: `clip_${Date.now()}`,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      src: url,
      startTime: 0,
      duration: file.type.startsWith('video/') ? 10 : 5,
      x: 0,
      y: 0,
      width: 640,
      height: 360
    };

    setProject({
      ...project,
      clips: [...project.clips, newClip]
    });
  };

  // ✏️ ADICIONAR TEXTO
  const addTextClip = () => {
    if (!project) return;

    const textClip: VideoClip = {
      id: `text_${Date.now()}`,
      type: 'text',
      text: 'Novo Texto',
      startTime: currentTime,
      duration: 3,
      x: 100,
      y: 100,
      width: 200,
      height: 50
    };

    setProject({
      ...project,
      clips: [...project.clips, textClip]
    });
  };

  // 🎨 RENDERIZAR FRAME
  const renderFrame = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !project) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Renderizar clips ativos no tempo atual
    project.clips.forEach(clip => {
      if (time >= clip.startTime && time <= clip.startTime + clip.duration) {
        renderClip(ctx, clip, time - clip.startTime);
      }
    });

    // Aplicar efeitos
    project.effects.forEach(effect => {
      if (time >= effect.startTime && time <= effect.startTime + effect.duration) {
        applyEffect(ctx, effect, time - effect.startTime);
      }
    });
  };

  // 🎬 RENDERIZAR CLIP
  const renderClip = (ctx: CanvasRenderingContext2D, clip: VideoClip, clipTime: number) => {
    switch (clip.type) {
      case 'video':
        if (videoRef.current && clip.src) {
          videoRef.current.src = clip.src;
          videoRef.current.currentTime = clipTime;
          ctx.drawImage(videoRef.current, clip.x, clip.y, clip.width, clip.height);
        }
        break;
      
      case 'image':
        if (clip.src) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, clip.x, clip.y, clip.width, clip.height);
          };
          img.src = clip.src;
        }
        break;
      
      case 'text':
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px Arial';
        ctx.fillText(clip.text || '', clip.x, clip.y + 24);
        break;
    }
  };

  // ✨ APLICAR EFEITO
  const applyEffect = (ctx: CanvasRenderingContext2D, effect: VideoEffect, effectTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    switch (effect.type) {
      case 'fade':
        ctx.globalAlpha = Math.sin((effectTime / effect.duration) * Math.PI) * effect.intensity;
        break;
      
      case 'blur':
        ctx.filter = `blur(${effect.intensity * (effectTime / effect.duration)}px)`;
        break;
      
      case 'color':
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = `rgba(255, 0, 0, ${effect.intensity * 0.3})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
        break;
    }
  };

  // ▶️ REPRODUZIR/PAUSAR
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  // ⏱️ ATUALIZAR TEMPO
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && project) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= project.duration) {
            setIsPlaying(false);
            return 0;
          }
          return newTime;
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [isPlaying, project]);

  // 🎬 RENDERIZAR FRAME ATUAL
  useEffect(() => {
    renderFrame(currentTime);
  }, [currentTime, project]);

  // 💾 EXPORTAR VÍDEO
  const exportVideo = async () => {
    if (!project || !canvasRef.current) return;

    // Verificar se APIs estão disponíveis no browser
    if (typeof window === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
      alert('❌ Exportação de vídeo não suportada neste browser');
      return;
    }

    const canvas = canvasRef.current;
    const stream = canvas.captureStream(30); // 30 FPS
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
      a.download = `${project.name}.webm`;
      a.click();
      
      URL.revokeObjectURL(url);
      alert('✅ Vídeo exportado com sucesso!');
    };

    // Renderizar e gravar
    mediaRecorder.start();
    
    // Simular reprodução para gravação
    let recordTime = 0;
    const recordInterval = setInterval(() => {
      renderFrame(recordTime);
      recordTime += 0.1;
      
      if (recordTime >= project.duration) {
        clearInterval(recordInterval);
        mediaRecorder.stop();
      }
    }, 100);
  };

  // 💳 FUNÇÕES DE PAGAMENTO
  const purchaseWithStripe = async () => {
    try {
      const payment = AccessControlService.registerPayment({
        userId: user?.id || 'guest',
        type: 'tool',
        itemName: 'Editor de Vídeo Pro',
        amount: 97.00,
        paymentMethod: 'stripe',
        status: 'pending'
      });

      const paymentData = {
        planName: 'Editor de Vídeo Pro - ViralizaAI',
        amount: 9700,
        successUrl: `${window.location.origin}/dashboard/video-editor?payment=success`,
        cancelUrl: `${window.location.origin}/dashboard/video-editor?payment=cancelled`
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
      itemName: 'Editor de Vídeo Pro',
      amount: 97.00,
      paymentMethod: 'pix',
      status: 'pending'
    });
    setShowPixModal(true);
  };

  const handlePixPaymentSuccess = () => {
    const payments = AccessControlService.getAllPayments();
    const pendingPayment = payments.find(p => 
      p.itemName === 'Editor de Vídeo Pro' && 
      p.paymentMethod === 'pix' && 
      p.status === 'pending'
    );
    
    if (pendingPayment) {
      AccessControlService.confirmPayment(pendingPayment.id, `pix_${Date.now()}`);
      setHasAccess(true);
    }
    
    setShowPixModal(false);
    alert('✅ Pagamento confirmado! Editor de Vídeo ativado.');
    window.location.reload();
  };

  // Se não tem acesso, mostrar tela de compra
  if (user?.type !== 'admin' && !hasAccess) {
    return (
      <div className="min-h-screen bg-primary text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">🎬 Editor de Vídeo Pro</h1>
            <p className="text-xl mb-8">Ferramenta Premium - Acesso Restrito</p>
            
            <div className="bg-secondary rounded-2xl p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">🎬 Editor de Vídeo Profissional</h2>
              <p className="text-gray-300 mb-6">Edite vídeos com ferramentas avançadas, efeitos e exportação em alta qualidade</p>
              
              <div className="bg-primary/50 rounded-lg p-4 mb-6">
                <div className="text-3xl font-bold text-green-400 mb-2">R$ 97,00</div>
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
            planName="Editor de Vídeo Pro"
            amount={97.00}
            onPaymentSuccess={handlePixPaymentSuccess}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🎬 Editor de Vídeo Pro</h1>
          <div className="flex gap-4">
            <button
              onClick={createNewProject}
              className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              📁 Novo Projeto
            </button>
            <button
              onClick={exportVideo}
              className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700"
              disabled={!project}
            >
              💾 Exportar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Painel de Mídia */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-bold mb-4">📁 Mídia</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-blue-600 py-2 rounded mb-4 hover:bg-blue-700"
            >
              📤 Adicionar Arquivo
            </button>
            <button
              onClick={addTextClip}
              className="w-full bg-purple-600 py-2 rounded hover:bg-purple-700"
            >
              ✏️ Adicionar Texto
            </button>
          </div>

          {/* Canvas Principal */}
          <div className="col-span-2 bg-gray-800 rounded-lg p-4">
            <div className="bg-black rounded-lg p-4 mb-4">
              <canvas
                ref={canvasRef}
                width={640}
                height={360}
                className="w-full border border-gray-600 rounded"
              />
              <video ref={videoRef} className="hidden" />
            </div>
            
            {/* Controles de Reprodução */}
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlayback}
                className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max={project?.duration || 30}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <span className="text-sm">
                {currentTime.toFixed(1)}s / {project?.duration || 0}s
              </span>
            </div>
          </div>

          {/* Painel de Propriedades */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-bold mb-4">⚙️ Propriedades</h3>
            {selectedClip ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Posição X:</label>
                  <input
                    type="number"
                    value={selectedClip.x}
                    onChange={(e) => {
                      const newClip = { ...selectedClip, x: parseInt(e.target.value) };
                      setSelectedClip(newClip);
                      if (project) {
                        setProject({
                          ...project,
                          clips: project.clips.map(c => c.id === newClip.id ? newClip : c)
                        });
                      }
                    }}
                    className="w-full bg-gray-700 px-3 py-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Posição Y:</label>
                  <input
                    type="number"
                    value={selectedClip.y}
                    onChange={(e) => {
                      const newClip = { ...selectedClip, y: parseInt(e.target.value) };
                      setSelectedClip(newClip);
                      if (project) {
                        setProject({
                          ...project,
                          clips: project.clips.map(c => c.id === newClip.id ? newClip : c)
                        });
                      }
                    }}
                    className="w-full bg-gray-700 px-3 py-2 rounded"
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-400">Selecione um clip para editar</p>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-gray-800 rounded-lg p-4 mt-6">
          <h3 className="text-lg font-bold mb-4">📽️ Timeline</h3>
          <div className="relative h-20 bg-gray-700 rounded">
            {project?.clips.map((clip) => (
              <div
                key={clip.id}
                className={`absolute h-16 bg-blue-600 rounded cursor-pointer ${
                  selectedClip?.id === clip.id ? 'ring-2 ring-yellow-400' : ''
                }`}
                style={{
                  left: `${(clip.startTime / (project.duration || 30)) * 100}%`,
                  width: `${(clip.duration / (project.duration || 30)) * 100}%`,
                  top: '8px'
                }}
                onClick={() => setSelectedClip(clip)}
              >
                <div className="p-2 text-xs truncate">
                  {clip.type === 'text' ? clip.text : clip.type}
                </div>
              </div>
            ))}
            
            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500"
              style={{
                left: `${(currentTime / (project?.duration || 30)) * 100}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditorPage;
