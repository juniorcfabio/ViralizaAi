import React, { useState } from 'react';
import { generateEbook, GeneratedEbook } from '../../services/ebookGenerator';

interface EbookGeneratorProps {
  businessType: string;
  businessName: string;
  targetAudience: string;
  businessGoals: string[];
  onEbookGenerated: (ebook: GeneratedEbook) => void;
}

const EbookGenerator: React.FC<EbookGeneratorProps> = ({
  businessType,
  businessName,
  targetAudience,
  businessGoals,
  onEbookGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [generatedEbook, setGeneratedEbook] = useState<GeneratedEbook | null>(null);

  const generateSteps = [
    'Analisando nicho e público-alvo...',
    'Criando estrutura personalizada...',
    'Gerando conteúdo ultra-técnico...',
    'Selecionando fotos profissionais...',
    'Aplicando metodologias proprietárias...',
    'Otimizando para vendas...',
    'Finalizando ebook premium...'
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      for (let i = 0; i < generateSteps.length; i++) {
        setCurrentStep(generateSteps[i]);
        setProgress(((i + 1) / generateSteps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      const ebook = await generateEbook({
        businessType,
        businessName,
        targetAudience,
        businessGoals
      });

      setGeneratedEbook(ebook);
      onEbookGenerated(ebook);
    } catch (error) {
      console.error('Erro ao gerar ebook:', error);
      alert('Erro ao gerar ebook. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadEbook = async () => {
    if (!generatedEbook) {
      alert('Erro: Nenhum ebook gerado para download.');
      return;
    }

    try {
      // Mostrar feedback visual
      const button = document.querySelector('[data-download-btn]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.innerHTML = '⏳ Preparando download...';
      }

      // Aguardar um momento para garantir que o DOM esteja pronto
      await new Promise(resolve => setTimeout(resolve, 500));

      const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${generatedEbook.title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Georgia', serif; 
            line-height: 1.8; 
            color: #2c3e50; 
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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
        .chapter-image { 
            width: 100%; 
            height: 300px; 
            object-fit: cover; 
            border-radius: 15px; 
            margin: 30px 0; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .chapter-content { 
            font-size: 1.1em; 
            text-align: justify; 
            margin-bottom: 30px;
        }
        .methodology { 
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
            color: white; 
            padding: 30px; 
            border-radius: 15px; 
            margin: 30px 0;
        }
        .methodology h3 { 
            font-size: 1.4em; 
            margin-bottom: 15px; 
        }
        .tips { 
            background: #f8f9fa; 
            border-left: 5px solid #28a745; 
            padding: 25px; 
            margin: 25px 0; 
            border-radius: 0 10px 10px 0;
        }
        .tips h4 { 
            color: #28a745; 
            margin-bottom: 15px; 
            font-size: 1.2em;
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
            <h1>${generatedEbook.title}</h1>
            <div class="subtitle">Guia Completo e Estratégico para ${businessName}</div>
        </div>
        
        <div class="content">
            ${generatedEbook.chapters.map(chapter => `
                <div class="chapter">
                    <h2>${chapter.title}</h2>
                    <img src="${chapter.imageUrl}" alt="${chapter.title}" class="chapter-image" onerror="this.style.display='none'" />
                    <div class="chapter-content">${chapter.content}</div>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} ${businessName} - Todos os direitos reservados</p>
            <p>Gerado pela Viraliza.AI - Tecnologia Premium</p>
        </div>
    </div>
</body>
</html>`;

      // Criar o blob e fazer o download
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Criar link de download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${generatedEbook.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase()}.html`;
      link.style.display = 'none';
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      
      // Limpar recursos
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      // Restaurar botão e mostrar sucesso
      if (button) {
        button.disabled = false;
        button.innerHTML = '📥 Baixar Ebook Premium';
      }

      // Mostrar confirmação
      alert('✅ Download do ebook iniciado com sucesso!');

    } catch (error) {
      console.error('Erro no download do ebook:', error);
      
      // Restaurar botão em caso de erro
      const button = document.querySelector('[data-download-btn]') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.innerHTML = '📥 Baixar Ebook Premium';
      }
      
      // Tentar método alternativo de download
      try {
        const fallbackContent = `
EBOOK: ${generatedEbook.title}

${generatedEbook.chapters.map((chapter, index) => `
CAPÍTULO ${index + 1}: ${chapter.title}

${chapter.content}

---
`).join('')}

© ${new Date().getFullYear()} ${businessName} - Gerado pela Viraliza.AI
        `;
        
        const fallbackBlob = new Blob([fallbackContent], { type: 'text/plain;charset=utf-8' });
        const fallbackUrl = URL.createObjectURL(fallbackBlob);
        const fallbackLink = document.createElement('a');
        fallbackLink.href = fallbackUrl;
        fallbackLink.download = `${generatedEbook.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase()}.txt`;
        fallbackLink.click();
        URL.revokeObjectURL(fallbackUrl);
        
        alert('✅ Download realizado em formato texto (TXT) como alternativa!');
      } catch (fallbackError) {
        alert('❌ Erro no download. Tente novamente ou use outro navegador.');
      }
    }
  };

  if (!isGenerating && !generatedEbook) {
    return (
      <div className="bg-secondary/95 backdrop-blur-lg rounded-3xl shadow-2xl p-10 border border-gray-700">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-accent to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-4xl">🚀</span>
          </div>
          <h3 className="text-2xl font-bold text-light mb-4">
            Pronto para Gerar Seu Ebook Premium?
          </h3>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Vamos criar um ebook ultra-técnico e altamente vendável com 15 capítulos, 
            fotos profissionais e metodologias proprietárias exclusivas.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-primary/50 rounded-xl p-4 border border-accent/30">
              <div className="text-2xl mb-2">📚</div>
              <div className="font-semibold text-accent">15 Capítulos</div>
              <div className="text-sm text-gray-400">1.5+ páginas cada</div>
            </div>
            <div className="bg-primary/50 rounded-xl p-4 border border-blue-500/30">
              <div className="text-2xl mb-2">📸</div>
              <div className="font-semibold text-blue-400">Fotos Profissionais</div>
              <div className="text-sm text-gray-400">Alta qualidade</div>
            </div>
            <div className="bg-primary/50 rounded-xl p-4 border border-green-500/30">
              <div className="text-2xl mb-2">💎</div>
              <div className="font-semibold text-green-400">Metodologias Exclusivas</div>
              <div className="text-sm text-gray-400">Proprietárias</div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="bg-gradient-to-r from-accent to-blue-600 hover:from-blue-600 hover:to-accent text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 text-xl"
          >
            ✨ Iniciar Geração do Ebook Premium
          </button>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="bg-secondary/95 backdrop-blur-lg rounded-3xl shadow-2xl p-10 border border-gray-700">
        <div className="text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-accent to-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-spin">
            <span className="text-5xl">⚡</span>
          </div>
          
          <h3 className="text-3xl font-bold text-light mb-4">
            Gerando Seu Ebook Premium...
          </h3>
          
          <div className="max-w-md mx-auto mb-8">
            <div className="bg-primary/50 rounded-full h-4 mb-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-accent to-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xl text-accent font-semibold">{Math.round(progress)}% Concluído</p>
          </div>

          <div className="bg-primary/30 rounded-2xl p-6 border border-accent/30">
            <p className="text-lg text-gray-300 mb-4">{currentStep}</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary/95 backdrop-blur-lg rounded-3xl shadow-2xl p-10 border border-gray-700">
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✅</span>
        </div>
        <h3 className="text-3xl font-bold text-light mb-4">
          Ebook Premium Gerado com Sucesso!
        </h3>
        <p className="text-xl text-gray-300">
          Seu ebook ultra-técnico está pronto para venda
        </p>
      </div>

      {generatedEbook && (
        <div className="space-y-6">
          <div className="bg-primary/50 rounded-2xl p-6 border border-green-500/30">
            <h4 className="text-2xl font-bold text-light mb-4">{generatedEbook.title}</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-300 mb-2"><strong>Nicho:</strong> {generatedEbook.niche}</p>
                <p className="text-gray-300 mb-2"><strong>Capítulos:</strong> {generatedEbook.chapters.length}</p>
                <p className="text-gray-300 mb-2"><strong>Páginas Totais:</strong> {generatedEbook.totalPages}</p>
              </div>
              <div>
                <p className="text-green-400 font-semibold mb-2">✨ Recursos Premium:</p>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Fotos profissionais incluídas</li>
                  <li>• Metodologias proprietárias</li>
                  <li>• Conteúdo ultra-vendável</li>
                  <li>• Design profissional</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={downloadEbook}
              data-download-btn
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              📥 Baixar Ebook Premium
            </button>
            <button
              onClick={() => window.open('https://wa.me/?text=Acabei de criar um ebook incrível com a Viraliza.AI!', '_blank')}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              📱 Compartilhar no WhatsApp
            </button>
          </div>

          <div className="bg-accent/20 border border-accent rounded-2xl p-6">
            <h5 className="text-xl font-bold text-accent mb-3">💡 Dicas de Monetização</h5>
            <ul className="text-gray-300 space-y-2">
              <li>• <strong>Preço sugerido:</strong> R$ 97 - R$ 297 (baseado no nicho)</li>
              <li>• <strong>Canais de venda:</strong> Instagram, Facebook, WhatsApp, Site próprio</li>
              <li>• <strong>Estratégia:</strong> Use como lead magnet ou produto principal</li>
              <li>• <strong>ROI esperado:</strong> 300-500% em 30 dias</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default EbookGenerator;
