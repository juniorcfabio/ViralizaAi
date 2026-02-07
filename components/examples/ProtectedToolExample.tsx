// 🛠️ EXEMPLO DE FERRAMENTA PROTEGIDA
import React, { useState } from 'react';
import PlanGuard from '../security/PlanGuard';
import { useAuth } from '../../contexts/AuthContextFixed';

const ProtectedToolExample: React.FC = () => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateContent = async () => {
    if (!prompt.trim()) {
      setError('Digite um prompt para gerar conteúdo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🤖 Chamando API protegida...');

      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          prompt: prompt,
          type: 'text'
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Conteúdo gerado com sucesso');
        setContent(data.content.result);
      } else {
        console.error('❌ Erro da API:', data.error);
        setError(data.error || 'Erro ao gerar conteúdo');
      }

    } catch (err) {
      console.error('🚨 Erro de rede:', err);
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim()) {
      setError('Digite um script para gerar vídeo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🎬 Chamando API de vídeo protegida...');

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          script: prompt,
          style: 'modern',
          duration: 30
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Vídeo gerado com sucesso');
        setContent(`Vídeo gerado: ${data.video.url}\nQualidade: ${data.video.quality}\nDuração: ${data.video.duration}s`);
      } else {
        console.error('❌ Erro da API:', data.error);
        setError(data.error || 'Erro ao gerar vídeo');
      }

    } catch (err) {
      console.error('🚨 Erro de rede:', err);
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const generateEbook = async () => {
    if (!prompt.trim()) {
      setError('Digite um título para gerar ebook');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📚 Chamando API de ebook protegida...');

      const response = await fetch('/api/generate-ebook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          title: prompt,
          topic: 'Marketing Digital',
          chapters: 5,
          format: 'PDF'
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Ebook gerado com sucesso');
        setContent(`Ebook gerado: ${data.ebook.title}\nPáginas: ${data.ebook.pages}\nFormato: ${data.ebook.format}\nDownload: ${data.ebook.downloadUrl}`);
      } else {
        console.error('❌ Erro da API:', data.error);
        setError(data.error || 'Erro ao gerar ebook');
      }

    } catch (err) {
      console.error('🚨 Erro de rede:', err);
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        🛠️ Ferramentas Protegidas - Exemplo
      </h1>

      {/* 🛡️ PROTEÇÃO TOTAL - SÓ FUNCIONA COM PLANO ATIVO */}
      <PlanGuard>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🤖 Gerador de Conteúdo IA
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt / Script / Título:
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Digite seu prompt aqui..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">❌ {error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={generateContent}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Gerando...' : '📝 Gerar Texto'}
              </button>

              <button
                onClick={generateVideo}
                disabled={loading}
                className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Gerando...' : '🎬 Gerar Vídeo'}
              </button>

              <button
                onClick={generateEbook}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Gerando...' : '📚 Gerar Ebook'}
              </button>
            </div>

            {content && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">✅ Resultado:</h3>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {content}
                </pre>
              </div>
            )}
          </div>
        </div>
      </PlanGuard>

      {/* 📊 INFORMAÇÕES DE SEGURANÇA */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          🔒 Sistema de Proteção Ativo
        </h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p>✅ <strong>Backend valida plano</strong> em todas as chamadas</p>
          <p>✅ <strong>Frontend nunca decide acesso</strong> - só exibe interface</p>
          <p>✅ <strong>APIs protegidas</strong> com middleware requireActivePlan</p>
          <p>✅ <strong>Webhook seguro</strong> do Stripe libera planos automaticamente</p>
          <p>✅ <strong>Impossível hackear</strong> - toda validação no servidor</p>
        </div>
      </div>
    </div>
  );
};

export default ProtectedToolExample;
