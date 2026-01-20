// PÁGINA DE GERAÇÃO DE MÚSICA IA PARA ADMINISTRADORES
// Interface completa para criação de músicas originais

import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContextFixed';

const AdminMusicGeneratorPage: React.FC = () => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMusic, setGeneratedMusic] = useState<any>(null);
  const [musicStyle, setMusicStyle] = useState('');
  const [duration, setDuration] = useState(30);
  const [mood, setMood] = useState('');
  const [instruments, setInstruments] = useState<string[]>([]);
  const [lyrics, setLyrics] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  const musicStyles = [
    'Pop', 'Rock', 'Electronic', 'Hip Hop', 'Jazz', 'Classical',
    'Reggae', 'Country', 'Blues', 'Funk', 'Ambient', 'Lo-fi'
  ];

  const moods = [
    'Energético', 'Relaxante', 'Motivacional', 'Romântico', 
    'Melancólico', 'Alegre', 'Dramático', 'Misterioso'
  ];

  const availableInstruments = [
    'Piano', 'Guitarra', 'Bateria', 'Baixo', 'Violino', 'Saxofone',
    'Sintetizador', 'Flauta', 'Trompete', 'Violão'
  ];

  const handleInstrumentToggle = (instrument: string) => {
    setInstruments(prev => 
      prev.includes(instrument) 
        ? prev.filter(i => i !== instrument)
        : [...prev, instrument]
    );
  };

  const handleGenerateMusic = async () => {
    if (!musicStyle || !mood) {
      alert('Por favor, selecione o estilo e humor da música.');
      return;
    }

    setIsGenerating(true);
    try {
      // Simular geração de música
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const currentTime = new Date();
      const musicData = {
        id: `music_${Date.now()}`,
        title: `Música ${musicStyle} ${currentTime.toLocaleTimeString('pt-BR')}`,
        style: musicStyle,
        mood: mood,
        duration: duration,
        instruments: instruments,
        lyrics: lyrics,
        createdAt: currentTime.toISOString(),
        audioUrl: `https://example.com/generated-music-${Date.now()}.mp3`,
        waveform: generateWaveformData(),
        bpm: Math.floor(Math.random() * 60) + 80,
        key: ['C', 'D', 'E', 'F', 'G', 'A', 'B'][Math.floor(Math.random() * 7)] + (Math.random() > 0.5 ? ' Major' : ' Minor'),
        copyright: 'Livre de direitos autorais - ViralizaAI',
        downloadUrl: `https://viralizaai.com/download/music_${Date.now()}.mp3`
      };

      setGeneratedMusic(musicData);
    } catch (error) {
      console.error('Erro ao gerar música:', error);
      alert('Erro ao gerar música. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWaveformData = () => {
    return Array.from({ length: 100 }, () => Math.random() * 100);
  };

  const handleDownload = () => {
    if (generatedMusic) {
      // Simular download
      const link = document.createElement('a');
      link.href = generatedMusic.downloadUrl;
      link.download = `${generatedMusic.title}.mp3`;
      link.click();
      alert('Download iniciado!');
    }
  };

  return (
    <div className="min-h-screen bg-dark text-light p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent mb-4">
            🎵 Gerador de Música IA
          </h1>
          <p className="text-gray-300 text-lg">
            Crie músicas originais com inteligência artificial - Acesso gratuito para administradores
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configurações */}
          <div className="bg-secondary rounded-2xl p-6 border border-primary/30">
            <h2 className="text-2xl font-bold mb-6 text-accent">⚙️ Configurações da Música</h2>
            
            <div className="space-y-6">
              {/* Estilo Musical */}
              <div>
                <label className="block text-sm font-medium mb-3">Estilo Musical:</label>
                <div className="grid grid-cols-3 gap-2">
                  {musicStyles.map(style => (
                    <button
                      key={style}
                      onClick={() => setMusicStyle(style)}
                      className={`p-3 rounded-lg border transition-colors ${
                        musicStyle === style
                          ? 'bg-accent text-white border-accent'
                          : 'bg-dark border-primary/30 hover:border-accent/50'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Humor */}
              <div>
                <label className="block text-sm font-medium mb-3">Humor/Atmosfera:</label>
                <div className="grid grid-cols-2 gap-2">
                  {moods.map(moodOption => (
                    <button
                      key={moodOption}
                      onClick={() => setMood(moodOption)}
                      className={`p-3 rounded-lg border transition-colors ${
                        mood === moodOption
                          ? 'bg-primary text-white border-primary'
                          : 'bg-dark border-primary/30 hover:border-primary/50'
                      }`}
                    >
                      {moodOption}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duração */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Duração: {duration} segundos
                </label>
                <input
                  type="range"
                  min="15"
                  max="180"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>15s</span>
                  <span>3min</span>
                </div>
              </div>

              {/* Instrumentos */}
              <div>
                <label className="block text-sm font-medium mb-3">Instrumentos:</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableInstruments.map(instrument => (
                    <label key={instrument} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={instruments.includes(instrument)}
                        onChange={() => handleInstrumentToggle(instrument)}
                        className="mr-2"
                      />
                      {instrument}
                    </label>
                  ))}
                </div>
              </div>

              {/* Letra (Opcional) */}
              <div>
                <label className="block text-sm font-medium mb-3">Letra (Opcional):</label>
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  className="w-full p-3 bg-dark border border-primary/30 rounded-lg text-light"
                  rows={4}
                  placeholder="Digite a letra da música (opcional)..."
                />
              </div>

              {/* Botão Gerar */}
              <button
                onClick={handleGenerateMusic}
                disabled={isGenerating || !musicStyle || !mood}
                className="w-full bg-gradient-to-r from-accent to-primary text-white py-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Gerando Música...
                  </div>
                ) : (
                  '🎵 Gerar Música IA'
                )}
              </button>
            </div>
          </div>

          {/* Resultado */}
          <div className="bg-secondary rounded-2xl p-6 border border-primary/30">
            <h2 className="text-2xl font-bold mb-6 text-accent">🎼 Música Gerada</h2>
            
            {!generatedMusic ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎵</div>
                <p className="text-gray-400">Configure os parâmetros e clique em "Gerar Música IA"</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Info da Música */}
                <div className="bg-dark/50 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-accent mb-2">{generatedMusic.title}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Estilo:</span>
                      <span className="ml-2 text-light">{generatedMusic.style}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Humor:</span>
                      <span className="ml-2 text-light">{generatedMusic.mood}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Duração:</span>
                      <span className="ml-2 text-light">{generatedMusic.duration}s</span>
                    </div>
                    <div>
                      <span className="text-gray-400">BPM:</span>
                      <span className="ml-2 text-light">{generatedMusic.bpm}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Tom:</span>
                      <span className="ml-2 text-light">{generatedMusic.key}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Criado:</span>
                      <span className="ml-2 text-light">
                        {new Date(generatedMusic.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Waveform Simulado */}
                <div className="bg-dark/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Forma de Onda:</h4>
                  <div className="flex items-end space-x-1 h-20">
                    {generatedMusic.waveform.map((height: number, index: number) => (
                      <div
                        key={index}
                        className="bg-accent rounded-t"
                        style={{ height: `${height}%`, width: '2px' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Instrumentos Usados */}
                {generatedMusic.instruments.length > 0 && (
                  <div className="bg-dark/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Instrumentos:</h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedMusic.instruments.map((instrument: string) => (
                        <span
                          key={instrument}
                          className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm"
                        >
                          {instrument}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Letra */}
                {generatedMusic.lyrics && (
                  <div className="bg-dark/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Letra:</h4>
                    <p className="text-gray-300 whitespace-pre-line">{generatedMusic.lyrics}</p>
                  </div>
                )}

                {/* Copyright */}
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                  <p className="text-green-300 text-sm">
                    ✅ {generatedMusic.copyright}
                  </p>
                </div>

                {/* Ações */}
                <div className="flex gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex-1 bg-accent hover:bg-accent/80 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    📥 Download MP3
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(generatedMusic, null, 2));
                      alert('Dados da música copiados!');
                    }}
                    className="flex-1 bg-primary hover:bg-primary/80 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    📋 Copiar Dados
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMusicGeneratorPage;
