import React, { useState, useRef, useEffect } from 'react';

interface FloatingHelpIconProps {
  onToggle?: (isOpen: boolean) => void;
}

const FloatingHelpIcon: React.FC<FloatingHelpIconProps> = ({ onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const iconRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Limitar às bordas da tela
      const maxX = window.innerWidth - 60;
      const maxY = window.innerHeight - 60;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (!isDragging) {
      setIsOpen(!isOpen);
      onToggle?.(!isOpen);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <>
      {/* Ícone flutuante */}
      <div
        ref={iconRef}
        className={`fixed z-50 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg cursor-pointer select-none transition-all duration-300 ${
          isDragging ? 'scale-110' : 'hover:scale-105'
        } ${isOpen ? '' : 'animate-pulse'}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          animation: !isOpen && !isDragging ? 'pulse 2s infinite, bounce 3s infinite' : undefined
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
          ?
        </div>
        
        {/* Efeito de ondas piscantes */}
        {!isOpen && (
          <>
            <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30"></div>
            <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-20" style={{ animationDelay: '0.5s' }}></div>
          </>
        )}
      </div>

      {/* Modal de ajuda */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-secondary p-6 rounded-lg max-w-md w-full mx-4 border border-accent/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">💡 Central de Ajuda</h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onToggle?.(false);
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-primary/50 p-4 rounded-lg">
                <h4 className="font-bold text-accent mb-2">🚀 Como usar a plataforma?</h4>
                <p className="text-sm text-gray-300">
                  Navegue pelo dashboard para acessar todas as ferramentas de marketing digital. 
                  Cada ferramenta tem tutoriais integrados.
                </p>
              </div>
              
              <div className="bg-primary/50 p-4 rounded-lg">
                <h4 className="font-bold text-accent mb-2">💳 Dúvidas sobre pagamentos?</h4>
                <p className="text-sm text-gray-300">
                  Acesse a seção "Faturamento" no menu lateral para gerenciar assinaturas, 
                  métodos de pagamento e histórico.
                </p>
              </div>
              
              <div className="bg-primary/50 p-4 rounded-lg">
                <h4 className="font-bold text-accent mb-2">🎯 Precisa de suporte?</h4>
                <p className="text-sm text-gray-300">
                  Entre em contato conosco pelo WhatsApp: 
                  <a href="https://wa.me/5531994716433" className="text-accent hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                    (31) 99471-6433
                  </a>
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 p-4 rounded-lg border border-accent/30">
                <h4 className="font-bold text-white mb-2">✨ Dica Pro</h4>
                <p className="text-sm text-gray-300">
                  Este ícone de ajuda pode ser arrastado para qualquer lugar da tela! 
                  Posicione onde for mais conveniente para você.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onToggle?.(false);
                }}
                className="flex-1 bg-accent text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Entendi!
              </button>
              <a
                href="https://wa.me/5531994716433"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </>
  );
};

export default FloatingHelpIcon;
