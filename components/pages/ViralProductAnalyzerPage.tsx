// PÁGINA DE ANÁLISE VIRAL DE PRODUTOS IA
// Interface para upload de foto e análise completa

import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';
import ViralProductAnalyzer, { ProductAnalysis } from '../../services/viralProductAnalyzer';

const ViralProductAnalyzerPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [niche, setNiche] = useState('');
  const [productName, setProductName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [showReport, setShowReport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const niches = [
    'Tecnologia', 'Beleza', 'Fitness', 'Moda', 'Casa', 'Alimentação',
    'Educação', 'Saúde', 'Automóveis', 'Viagem', 'Arte', 'Música'
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !niche || !productName) {
      alert('Por favor, preencha todos os campos e selecione uma imagem.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const analyzer = ViralProductAnalyzer.getInstance();
      const result = await analyzer.analyzeProduct(selectedFile, niche, productName);
      setAnalysis(result);
      setShowReport(true);
    } catch (error) {
      console.error('Erro na análise:', error);
      alert('Erro ao analisar o produto. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateDetailedReport = () => {
    if (!analysis) return '';
    const analyzer = ViralProductAnalyzer.getInstance();
    return analyzer.generateDetailedReport(analysis);
  };

  const resetAnalysis = () => {
    setSelectedFile(null);
    setNiche('');
    setProductName('');
    setAnalysis(null);
    setShowReport(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-dark text-light p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-4">
            🚀 Analisador Viral de Produtos IA
          </h1>
          <p className="text-gray-300 text-lg">
            Faça upload da foto do seu produto e descubra como viralizar globalmente e alcançar bilhões de usuários
          </p>
        </div>

        {!showReport ? (
          /* Upload Form */
          <div className="bg-secondary rounded-2xl p-8 border border-primary/30">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Upload Area */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-accent">📸 Upload da Imagem do Produto</h3>
                <div 
                  className="border-2 border-dashed border-primary/50 rounded-xl p-8 text-center cursor-pointer hover:border-accent transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div>
                      <img 
                        src={URL.createObjectURL(selectedFile)} 
                        alt="Preview" 
                        className="max-w-full max-h-64 mx-auto rounded-lg mb-4"
                      />
                      <p className="text-accent font-semibold">{selectedFile.name}</p>
                      <p className="text-sm text-gray-400">Clique para alterar</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-6xl mb-4">📷</div>
                      <p className="text-lg font-semibold mb-2">Clique para fazer upload</p>
                      <p className="text-sm text-gray-400">PNG, JPG, JPEG até 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-accent">
                    🎯 Nome do Produto/Serviço
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ex: Smartphone XYZ, Creme Anti-Idade..."
                    className="w-full p-3 bg-dark border border-primary/30 rounded-lg focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-accent">
                    🏷️ Nicho de Mercado
                  </label>
                  <select
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="w-full p-3 bg-dark border border-primary/30 rounded-lg focus:border-accent focus:outline-none"
                  >
                    <option value="">Selecione o nicho...</option>
                    {niches.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-dark/50 rounded-lg p-4 border border-accent/20">
                  <h4 className="font-semibold text-accent mb-2">🧠 O que a IA vai analisar:</h4>
                  <ul className="text-sm space-y-1 text-gray-300">
                    <li>• Elementos visuais e cores</li>
                    <li>• Potencial viral do produto</li>
                    <li>• Estratégias de marketing global</li>
                    <li>• Projeções de vendas bilionárias</li>
                    <li>• Plano de expansão mundial</li>
                    <li>• Hashtags e influencers ideais</li>
                  </ul>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || !niche || !productName || isAnalyzing}
                  className="w-full bg-gradient-to-r from-accent to-primary text-white font-bold py-4 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Analisando com IA...
                    </div>
                  ) : (
                    '🚀 Analisar e Gerar Estratégia Viral'
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Analysis Results */
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-4 border border-green-500/30">
                <div className="text-2xl font-bold text-green-400">{analysis?.viralPotential}%</div>
                <div className="text-sm text-green-300">Potencial Viral</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-4 border border-blue-500/30">
                <div className="text-2xl font-bold text-blue-400">
                  {analysis?.salesProjection.globalPotential.toLocaleString()}
                </div>
                <div className="text-sm text-blue-300">Vendas Potenciais</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-4 border border-purple-500/30">
                <div className="text-2xl font-bold text-purple-400">
                  {analysis?.globalStrategy.primaryPlatforms.length}
                </div>
                <div className="text-sm text-purple-300">Plataformas</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl p-4 border border-orange-500/30">
                <div className="text-2xl font-bold text-orange-400">
                  {analysis?.marketingPlan.expectedReach.toLocaleString()}
                </div>
                <div className="text-sm text-orange-300">Alcance Esperado</div>
              </div>
            </div>

            {/* Detailed Report */}
            <div className="bg-secondary rounded-2xl p-6 border border-primary/30">
              <h3 className="text-2xl font-bold mb-4 text-accent">📊 Relatório Completo de Análise</h3>
              <div className="bg-dark rounded-lg p-4 font-mono text-sm whitespace-pre-line overflow-auto max-h-96">
                {generateDetailedReport()}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={resetAnalysis}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                🔄 Nova Análise
              </button>
              <button
                onClick={() => {
                  const report = generateDetailedReport();
                  navigator.clipboard.writeText(report);
                  alert('Relatório copiado para a área de transferência!');
                }}
                className="flex-1 bg-gradient-to-r from-accent to-primary text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
              >
                📋 Copiar Relatório
              </button>
            </div>
          </div>
        )}

        {/* Features Info */}
        <div className="mt-12 bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl p-6 border border-accent/20">
          <h3 className="text-xl font-bold mb-4 text-accent">🌟 Recursos da Análise Viral IA</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-primary mb-2">🎯 Análise Visual</h4>
              <ul className="space-y-1 text-gray-300">
                <li>• Reconhecimento de objetos</li>
                <li>• Análise de cores e estilo</li>
                <li>• Avaliação de qualidade</li>
                <li>• Appeal visual</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-2">🚀 Estratégia Global</h4>
              <ul className="space-y-1 text-gray-300">
                <li>• Plataformas ideais</li>
                <li>• Tipos de conteúdo</li>
                <li>• Hashtags estratégicas</li>
                <li>• Expansão mundial</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-2">💰 Projeções</h4>
              <ul className="space-y-1 text-gray-300">
                <li>• Vendas por período</li>
                <li>• Alcance esperado</li>
                <li>• ROI estimado</li>
                <li>• Potencial bilionário</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViralProductAnalyzerPage;
