// 🎵 GERADOR DE MÚSICA REAL - FUNCIONAL
// Sistema completo de geração de música usando Web Audio API

export interface MusicConfig {
  style: string;
  mood: string;
  duration: number;
  instruments: string[];
  tempo: number;
  key: string;
}

export interface GeneratedMusic {
  id: string;
  audioUrl: string;
  duration: number;
  config: MusicConfig;
  createdAt: string;
  downloadUrl: string;
}

class RealMusicGenerator {
  private static instance: RealMusicGenerator;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.initAudioContext();
  }

  static getInstance(): RealMusicGenerator {
    if (!RealMusicGenerator.instance) {
      RealMusicGenerator.instance = new RealMusicGenerator();
    }
    return RealMusicGenerator.instance;
  }

  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Erro ao inicializar AudioContext:', error);
    }
  }

  // 🎵 GERAR MÚSICA REAL
  async generateMusic(config: MusicConfig): Promise<GeneratedMusic> {
    console.log('🎵 Gerando música real:', config);

    if (!this.audioContext) {
      throw new Error('AudioContext não disponível');
    }

    // Criar música usando Web Audio API
    const audioBuffer = await this.createMusicBuffer(config);
    const audioBlob = await this.bufferToBlob(audioBuffer);
    const audioUrl = URL.createObjectURL(audioBlob);

    const music: GeneratedMusic = {
      id: `music_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      audioUrl,
      duration: config.duration,
      config,
      createdAt: new Date().toISOString(),
      downloadUrl: audioUrl
    };

    // Salvar música gerada
    this.saveGeneratedMusic(music);

    console.log('✅ Música gerada com sucesso!');
    return music;
  }

  // 🎼 CRIAR BUFFER DE ÁUDIO
  private async createMusicBuffer(config: MusicConfig): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext não disponível');
    }

    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * config.duration;
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);

    // Gerar música baseada na configuração
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < length; i++) {
        let sample = 0;
        
        // Adicionar instrumentos baseados na configuração
        config.instruments.forEach((instrument, index) => {
          sample += this.generateInstrumentSample(instrument, i, config, index);
        });
        
        // Aplicar efeitos baseados no mood
        sample = this.applyMoodEffects(sample, config.mood, i, length);
        
        channelData[i] = sample * 0.1; // Volume baixo para evitar distorção
      }
    }

    return buffer;
  }

  // 🎹 GERAR SAMPLE DE INSTRUMENTO
  private generateInstrumentSample(instrument: string, sample: number, config: MusicConfig, instrumentIndex: number): number {
    const time = sample / (this.audioContext?.sampleRate || 44100);
    const frequency = this.getInstrumentFrequency(instrument, time, config);
    
    switch (instrument.toLowerCase()) {
      case 'piano':
        return this.generatePianoSample(frequency, time);
      case 'guitarra':
        return this.generateGuitarSample(frequency, time);
      case 'bateria':
        return this.generateDrumSample(time, config.tempo);
      case 'baixo':
        return this.generateBassSample(frequency * 0.5, time);
      case 'sintetizador':
        return this.generateSynthSample(frequency, time);
      default:
        return this.generateBasicTone(frequency, time);
    }
  }

  // 🎹 GERAR SAMPLE DE PIANO
  private generatePianoSample(frequency: number, time: number): number {
    const envelope = Math.exp(-time * 2); // Decay exponencial
    return Math.sin(2 * Math.PI * frequency * time) * envelope;
  }

  // 🎸 GERAR SAMPLE DE GUITARRA
  private generateGuitarSample(frequency: number, time: number): number {
    const envelope = Math.exp(-time * 1.5);
    const harmonics = Math.sin(2 * Math.PI * frequency * time) + 
                     0.5 * Math.sin(2 * Math.PI * frequency * 2 * time) +
                     0.25 * Math.sin(2 * Math.PI * frequency * 3 * time);
    return harmonics * envelope;
  }

  // 🥁 GERAR SAMPLE DE BATERIA
  private generateDrumSample(time: number, tempo: number): number {
    const beatInterval = 60 / tempo; // Intervalo entre batidas
    const beatTime = time % beatInterval;
    
    if (beatTime < 0.1) {
      // Kick drum
      return Math.sin(2 * Math.PI * 60 * beatTime) * Math.exp(-beatTime * 20);
    } else if (beatTime > beatInterval / 2 && beatTime < beatInterval / 2 + 0.05) {
      // Snare
      return (Math.random() - 0.5) * Math.exp(-(beatTime - beatInterval / 2) * 30);
    }
    
    return 0;
  }

  // 🎸 GERAR SAMPLE DE BAIXO
  private generateBassSample(frequency: number, time: number): number {
    const envelope = Math.exp(-time * 1);
    return Math.sin(2 * Math.PI * frequency * time) * envelope;
  }

  // 🎛️ GERAR SAMPLE DE SINTETIZADOR
  private generateSynthSample(frequency: number, time: number): number {
    const lfo = Math.sin(2 * Math.PI * 5 * time); // Low Frequency Oscillator
    const modFreq = frequency * (1 + 0.1 * lfo);
    return Math.sin(2 * Math.PI * modFreq * time);
  }

  // 🎵 GERAR TOM BÁSICO
  private generateBasicTone(frequency: number, time: number): number {
    return Math.sin(2 * Math.PI * frequency * time);
  }

  // 🎼 OBTER FREQUÊNCIA DO INSTRUMENTO
  private getInstrumentFrequency(instrument: string, time: number, config: MusicConfig): number {
    // Progressão de acordes simples baseada na tonalidade
    const baseFreq = this.getKeyFrequency(config.key);
    const chordProgression = [1, 1.25, 1.5, 1.33]; // I-V-vi-IV
    const chordIndex = Math.floor((time * config.tempo / 60) % 4);
    
    return baseFreq * chordProgression[chordIndex];
  }

  // 🎹 OBTER FREQUÊNCIA DA TONALIDADE
  private getKeyFrequency(key: string): number {
    const frequencies: Record<string, number> = {
      'C': 261.63,
      'D': 293.66,
      'E': 329.63,
      'F': 349.23,
      'G': 392.00,
      'A': 440.00,
      'B': 493.88
    };
    
    return frequencies[key] || frequencies['C'];
  }

  // 🎭 APLICAR EFEITOS DE MOOD
  private applyMoodEffects(sample: number, mood: string, sampleIndex: number, totalSamples: number): number {
    switch (mood.toLowerCase()) {
      case 'energético':
        return sample * (1 + 0.2 * Math.sin(sampleIndex * 0.01));
      case 'relaxante':
        return sample * 0.7 * (1 - sampleIndex / totalSamples * 0.3);
      case 'dramático':
        return sample * (1 + 0.5 * Math.sin(sampleIndex * 0.005));
      case 'alegre':
        return sample * (1 + 0.3 * Math.sin(sampleIndex * 0.02));
      default:
        return sample;
    }
  }

  // 💾 CONVERTER BUFFER PARA BLOB
  private async bufferToBlob(buffer: AudioBuffer): Promise<Blob> {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Audio data
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  // 💾 SALVAR MÚSICA GERADA
  private saveGeneratedMusic(music: GeneratedMusic): void {
    const musics = this.getGeneratedMusics();
    musics.push(music);
    localStorage.setItem('generated_musics', JSON.stringify(musics));
  }

  // 📋 OBTER MÚSICAS GERADAS
  getGeneratedMusics(): GeneratedMusic[] {
    const stored = localStorage.getItem('generated_musics');
    return stored ? JSON.parse(stored) : [];
  }

  // 🗑️ LIMPAR MÚSICAS ANTIGAS
  clearOldMusics(): void {
    const musics = this.getGeneratedMusics();
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const recentMusics = musics.filter(music => 
      new Date(music.createdAt).getTime() > oneWeekAgo
    );
    
    localStorage.setItem('generated_musics', JSON.stringify(recentMusics));
  }
}

export default RealMusicGenerator;
