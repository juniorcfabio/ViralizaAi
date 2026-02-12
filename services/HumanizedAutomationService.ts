// =======================
// 🤖 SERVIÇO DE AUTOMAÇÃO HUMANIZADA - NÍVEL PROFISSIONAL
// =======================

import DatabaseService from './database/DatabaseService';
import SecurityService from './securityService';

interface HumanBehaviorPattern {
  id: string;
  userId: string;
  platform: string;
  actionType: 'post' | 'dm' | 'follow' | 'like' | 'comment';
  patterns: {
    timeWindows: number[]; // Horários preferenciais (0-23)
    delays: { min: number; max: number }; // Delays em ms
    textVariations: string[]; // Variações de texto
    pauseAfterSequence: number; // Pausa após N ações
    maxActionsPerHour: number;
    maxActionsPerDay: number;
  };
  lastUsed: Date;
  effectiveness: number; // Score 0-100
}

interface EngagementPrediction {
  score: number; // 0-100
  factors: {
    timeOfDay: number;
    contentLength: number;
    hashtagCount: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    viralPotential: number;
  };
  recommendations: string[];
  bestPostTime: string;
}

interface RateLimit {
  action: string;
  perHour: number;
  perDay: number;
  currentHour: number;
  currentDay: number;
  lastReset: Date;
  violations: number;
}

class HumanizedAutomationService {
  private db: DatabaseService;
  private security: SecurityService;
  private behaviorPatterns: Map<string, HumanBehaviorPattern[]> = new Map();
  private rateLimits: Map<string, RateLimit> = new Map();
  private actionQueue: Map<string, any[]> = new Map();

  // Rate limits seguros por ação
  private readonly SAFE_LIMITS = {
    post: { perHour: 3, perDay: 12 },
    dm: { perHour: 8, perDay: 30 },
    follow: { perHour: 15, perDay: 50 },
    like: { perHour: 25, perDay: 100 },
    comment: { perHour: 10, perDay: 40 },
    story: { perHour: 5, perDay: 20 }
  };

  // Padrões de comportamento humano
  private readonly HUMAN_PATTERNS = {
    morningActive: [7, 8, 9, 10], // Manhã ativa
    lunchBreak: [12, 13], // Pausa almoço
    eveningPeak: [18, 19, 20, 21], // Pico noturno
    weekendRelaxed: [10, 11, 14, 15, 16, 17] // Final de semana
  };

  constructor() {
    this.db = DatabaseService.getInstance();
    this.security = SecurityService.getInstance();
    this.initializeRateLimits();
    this.startBehaviorLearning();
  }

  // =======================
  // 🎯 DELAY HUMANIZADO
  // =======================
  private randomDelay(min: number = 2000, max: number = 7000): number {
    // Adicionar variação baseada no horário
    const hour = new Date().getHours();
    const isRushHour = [8, 9, 12, 13, 18, 19, 20].includes(hour);
    
    if (isRushHour) {
      // Mais rápido em horários de pico
      min = Math.max(1000, min * 0.7);
      max = Math.max(3000, max * 0.8);
    }

    // Variação baseada no dia da semana
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (isWeekend) {
      // Mais lento no final de semana
      min = min * 1.3;
      max = max * 1.5;
    }

    return Math.floor((max + min) / 2);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async humanizedAction<T>(action: () => Promise<T>, actionType: string = 'general'): Promise<T> {
    // Calcular delay baseado no tipo de ação
    const baseDelay = this.getActionDelay(actionType);
    const delay = this.randomDelay(baseDelay.min, baseDelay.max);
    
    console.log(`⏳ Aguardando ${delay}ms antes de executar ${actionType}...`);
    await this.sleep(delay);
    
    // Simular digitação para ações de texto
    if (['post', 'comment', 'dm'].includes(actionType)) {
      await this.simulateTyping();
    }
    
    return await action();
  }

  private getActionDelay(actionType: string): { min: number; max: number } {
    const delays = {
      post: { min: 3000, max: 8000 },
      dm: { min: 2000, max: 5000 },
      follow: { min: 1000, max: 3000 },
      like: { min: 500, max: 2000 },
      comment: { min: 2500, max: 6000 },
      story: { min: 2000, max: 4000 }
    };

    return delays[actionType] || { min: 2000, max: 7000 };
  }

  private async simulateTyping(): Promise<void> {
    // Simular tempo de digitação humana (40-80 WPM)
    const wordsPerMinute = 60;
    const charactersPerSecond = (wordsPerMinute * 5) / 60;
    const typingDelay = 200;
    
    await this.sleep(typingDelay);
  }

  // =======================
  // 📊 RATE LIMITING INTELIGENTE
  // =======================
  private initializeRateLimits(): void {
    Object.entries(this.SAFE_LIMITS).forEach(([action, limits]) => {
      this.rateLimits.set(action, {
        action,
        perHour: limits.perHour,
        perDay: limits.perDay,
        currentHour: 0,
        currentDay: 0,
        lastReset: new Date(),
        violations: 0
      });
    });
  }

  public async checkRateLimit(userId: string, action: string): Promise<{ allowed: boolean; waitTime?: number; reason?: string }> {
    const limit = this.rateLimits.get(action);
    if (!limit) {
      return { allowed: true };
    }

    // Reset contadores se necessário
    await this.resetCountersIfNeeded(limit);

    // Verificar limite por hora
    if (limit.currentHour >= limit.perHour) {
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      const waitTime = nextHour.getTime() - Date.now();
      
      return {
        allowed: false,
        waitTime,
        reason: `Limite de ${limit.perHour} ${action}s por hora atingido`
      };
    }

    // Verificar limite por dia
    if (limit.currentDay >= limit.perDay) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const waitTime = tomorrow.getTime() - Date.now();
      
      return {
        allowed: false,
        waitTime,
        reason: `Limite de ${limit.perDay} ${action}s por dia atingido`
      };
    }

    return { allowed: true };
  }

  private async resetCountersIfNeeded(limit: RateLimit): Promise<void> {
    const now = new Date();
    const lastReset = new Date(limit.lastReset);

    // Reset contador por hora
    if (now.getHours() !== lastReset.getHours()) {
      limit.currentHour = 0;
    }

    // Reset contador por dia
    if (now.getDate() !== lastReset.getDate()) {
      limit.currentDay = 0;
    }

    limit.lastReset = now;
  }

  public async incrementRateLimit(userId: string, action: string): Promise<void> {
    const limit = this.rateLimits.get(action);
    if (limit) {
      limit.currentHour++;
      limit.currentDay++;
      
      // Log da ação para auditoria
      await this.db.createAuditLog({
        user_id: userId,
        action: `rate_limit_increment_${action}`,
        resource_type: 'automation',
        success: true,
        severity: 'info',
        request_data: {
          action,
          currentHour: limit.currentHour,
          currentDay: limit.currentDay
        }
      });
    }
  }

  // =======================
  // 🎭 ROTAÇÃO DE COMPORTAMENTO
  // =======================
  public async getBehaviorPattern(userId: string, platform: string, actionType: string): Promise<HumanBehaviorPattern | null> {
    const userPatterns = this.behaviorPatterns.get(userId) || [];
    const pattern = userPatterns.find(p => p.platform === platform && p.actionType === actionType);
    
    if (!pattern) {
      // Criar padrão inicial baseado em comportamento humano típico
      return this.createInitialPattern(userId, platform, actionType);
    }

    return pattern;
  }

  private async createInitialPattern(userId: string, platform: string, actionType: string): Promise<HumanBehaviorPattern> {
    const pattern: HumanBehaviorPattern = {
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      platform,
      actionType: actionType as any,
      patterns: {
        timeWindows: this.getOptimalTimeWindows(platform),
        delays: this.getActionDelay(actionType),
        textVariations: await this.generateTextVariations(actionType),
        pauseAfterSequence: this.calculateOptimalPause(actionType),
        maxActionsPerHour: this.SAFE_LIMITS[actionType]?.perHour || 5,
        maxActionsPerDay: this.SAFE_LIMITS[actionType]?.perDay || 20
      },
      lastUsed: new Date(),
      effectiveness: 75 // Score inicial
    };

    // Salvar padrão
    const userPatterns = this.behaviorPatterns.get(userId) || [];
    userPatterns.push(pattern);
    this.behaviorPatterns.set(userId, userPatterns);

    return pattern;
  }

  private getOptimalTimeWindows(platform: string): number[] {
    const platformOptimal = {
      instagram: [9, 10, 11, 14, 15, 19, 20, 21],
      tiktok: [6, 7, 8, 19, 20, 21, 22],
      facebook: [9, 10, 13, 14, 15, 20, 21],
      twitter: [8, 9, 12, 13, 17, 18, 19],
      linkedin: [8, 9, 10, 11, 12, 17, 18],
      youtube: [14, 15, 16, 20, 21, 22]
    };

    return platformOptimal[platform] || [9, 12, 15, 18, 21];
  }

  private async generateTextVariations(actionType: string): Promise<string[]> {
    const variations = {
      post: [
        "🚀 Descobri algo incrível hoje!",
        "💡 Compartilhando uma dica valiosa:",
        "✨ Momento de inspiração:",
        "🎯 Foco no que realmente importa:",
        "🔥 Conteúdo que pode mudar sua perspectiva:"
      ],
      comment: [
        "Adorei seu conteúdo! 👏",
        "Muito inspirador! 💪",
        "Excelente ponto de vista! 🎯",
        "Concordo totalmente! ✅",
        "Obrigado por compartilhar! 🙏"
      ],
      dm: [
        "Oi! Vi seu perfil e achei muito interessante.",
        "Olá! Gostaria de trocar uma ideia sobre...",
        "Oi! Seu conteúdo é incrível, parabéns!",
        "Olá! Tenho uma proposta que pode te interessar."
      ]
    };

    return variations[actionType] || ["Ótimo conteúdo!", "Muito bom!", "Parabéns!"];
  }

  private calculateOptimalPause(actionType: string): number {
    const pauseMap = {
      post: 3, // Pausa após 3 posts
      dm: 5, // Pausa após 5 DMs
      follow: 10, // Pausa após 10 follows
      like: 15, // Pausa após 15 likes
      comment: 7 // Pausa após 7 comentários
    };

    return pauseMap[actionType] || 5;
  }

  // =======================
  // 🧠 IA PREDITIVA DE ENGAJAMENTO
  // =======================
  public async predictEngagement(content: any): Promise<EngagementPrediction> {
    const factors = {
      timeOfDay: this.calculateTimeScore(),
      contentLength: this.calculateLengthScore(content.text?.length || 0),
      hashtagCount: this.calculateHashtagScore(content.hashtags?.length || 0),
      sentiment: this.analyzeSentiment(content.text || ''),
      viralPotential: this.calculateViralPotential(content)
    };

    // Algoritmo de predição baseado em machine learning simulado
    const score = this.calculateEngagementScore(factors);
    
    const prediction: EngagementPrediction = {
      score,
      factors,
      recommendations: this.generateRecommendations(factors, score),
      bestPostTime: this.calculateBestPostTime(factors)
    };

    return prediction;
  }

  private calculateTimeScore(): number {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // Horários de pico: 8-10h, 12-14h, 18-22h
    const peakHours = [8, 9, 10, 12, 13, 14, 18, 19, 20, 21, 22];
    const isPeakHour = peakHours.includes(hour);
    
    // Final de semana tem padrão diferente
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    let score = isPeakHour ? 80 : 40;
    if (isWeekend && [10, 11, 14, 15, 16, 17].includes(hour)) {
      score += 20;
    }
    
    return Math.min(100, score);
  }

  private calculateLengthScore(length: number): number {
    // Comprimento ideal: 100-300 caracteres
    if (length >= 100 && length <= 300) return 100;
    if (length >= 50 && length < 100) return 80;
    if (length > 300 && length <= 500) return 70;
    if (length > 500) return 50;
    return 30; // Muito curto
  }

  private calculateHashtagScore(count: number): number {
    // Número ideal: 3-7 hashtags
    if (count >= 3 && count <= 7) return 100;
    if (count >= 1 && count <= 2) return 70;
    if (count >= 8 && count <= 10) return 60;
    if (count > 10) return 30;
    return 40; // Sem hashtags
  }

  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['ótimo', 'incrível', 'maravilhoso', 'excelente', 'fantástico', 'amor', 'feliz', 'sucesso'];
    const negativeWords = ['ruim', 'péssimo', 'terrível', 'ódio', 'triste', 'fracasso', 'problema'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateViralPotential(content: any): number {
    let score = 50; // Base score
    
    // Fatores que aumentam viralidade
    if (content.hasImage) score += 20;
    if (content.hasVideo) score += 30;
    if (content.hasCall2Action) score += 15;
    if (content.isQuestion) score += 10;
    if (content.hasTrending) score += 25;
    
    // Emojis aumentam engajamento
    const emojiCount = (content.text?.match(/[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}]/gu) || []).length;
    score += Math.min(20, emojiCount * 2);
    
    return Math.min(100, score);
  }

  private calculateEngagementScore(factors: any): number {
    const weights = {
      timeOfDay: 0.25,
      contentLength: 0.15,
      hashtagCount: 0.15,
      sentiment: 0.20,
      viralPotential: 0.25
    };

    let score = 0;
    score += factors.timeOfDay * weights.timeOfDay;
    score += factors.contentLength * weights.contentLength;
    score += factors.hashtagCount * weights.hashtagCount;
    score += (factors.sentiment === 'positive' ? 90 : factors.sentiment === 'neutral' ? 60 : 30) * weights.sentiment;
    score += factors.viralPotential * weights.viralPotential;

    return Math.round(score);
  }

  private generateRecommendations(factors: any, score: number): string[] {
    const recommendations = [];

    if (factors.timeOfDay < 60) {
      recommendations.push("⏰ Considere postar em horários de pico (8-10h, 12-14h, 18-22h)");
    }

    if (factors.contentLength < 70) {
      recommendations.push("📝 Ajuste o tamanho do texto (ideal: 100-300 caracteres)");
    }

    if (factors.hashtagCount < 70) {
      recommendations.push("🏷️ Use 3-7 hashtags relevantes para maior alcance");
    }

    if (factors.sentiment !== 'positive') {
      recommendations.push("😊 Conteúdo positivo gera mais engajamento");
    }

    if (factors.viralPotential < 60) {
      recommendations.push("🚀 Adicione elementos visuais ou call-to-action");
    }

    if (score > 80) {
      recommendations.push("✨ Ótimo conteúdo! Probabilidade alta de engajamento");
    }

    return recommendations;
  }

  private calculateBestPostTime(factors: any): string {
    const hour = new Date().getHours();
    
    if (hour < 8) return "08:00";
    if (hour >= 8 && hour < 12) return "12:00";
    if (hour >= 12 && hour < 18) return "19:00";
    return "21:00";
  }

  // =======================
  // 🔄 SISTEMA DE FALLBACK
  // =======================
  public async executeWithFallback<T>(
    primaryAction: () => Promise<T>,
    fallbackAction: () => Promise<T>,
    actionName: string
  ): Promise<T> {
    try {
      console.log(`🎯 Executando ação principal: ${actionName}`);
      return await primaryAction();
    } catch (error: any) {
      console.warn(`⚠️ Ação principal falhou, usando fallback: ${error.message}`);
      
      // Log da falha
      await this.db.createAuditLog({
        action: `fallback_${actionName}`,
        resource_type: 'automation',
        success: false,
        error_message: error.message,
        severity: 'warn'
      });

      return await fallbackAction();
    }
  }

  // =======================
  // 📊 APRENDIZADO COMPORTAMENTAL
  // =======================
  private startBehaviorLearning(): void {
    // Analisar padrões a cada hora
    setInterval(async () => {
      await this.analyzeBehaviorPatterns();
    }, 60 * 60 * 1000);

    console.log("🧠 Sistema de aprendizado comportamental iniciado");
  }

  private async analyzeBehaviorPatterns(): Promise<void> {
    for (const [userId, patterns] of this.behaviorPatterns.entries()) {
      for (const pattern of patterns) {
        // Analisar efetividade do padrão
        const effectiveness = await this.calculatePatternEffectiveness(pattern);
        
        // Ajustar padrão se necessário
        if (effectiveness < pattern.effectiveness) {
          await this.adjustPattern(pattern);
        }
        
        pattern.effectiveness = effectiveness;
      }
    }
  }

  private async calculatePatternEffectiveness(pattern: HumanBehaviorPattern): Promise<number> {
    // Simular análise de efetividade baseada em métricas reais
    const baseScore = 75;
    return baseScore;
  }

  private async adjustPattern(pattern: HumanBehaviorPattern): Promise<void> {
    // Ajustar horários se efetividade baixa
    if (pattern.effectiveness < 60) {
      pattern.patterns.timeWindows = this.getOptimalTimeWindows(pattern.platform);
      pattern.patterns.delays.min = Math.max(1000, pattern.patterns.delays.min * 0.8);
      pattern.patterns.delays.max = Math.min(10000, pattern.patterns.delays.max * 1.2);
    }

    console.log(`🔧 Padrão ajustado para usuário ${pattern.userId} - ${pattern.platform}`);
  }

  // =======================
  // 📈 MÉTRICAS E RELATÓRIOS
  // =======================
  public async getAutomationMetrics(userId: string): Promise<any> {
    const userPatterns = this.behaviorPatterns.get(userId) || [];
    const userLimits = Array.from(this.rateLimits.values());

    return {
      patterns: {
        total: userPatterns.length,
        avgEffectiveness: userPatterns.reduce((sum, p) => sum + p.effectiveness, 0) / userPatterns.length || 0,
        platforms: [...new Set(userPatterns.map(p => p.platform))],
        actions: [...new Set(userPatterns.map(p => p.actionType))]
      },
      rateLimits: {
        daily: userLimits.map(limit => ({
          action: limit.action,
          used: limit.currentDay,
          total: limit.perDay,
          percentage: (limit.currentDay / limit.perDay) * 100
        })),
        hourly: userLimits.map(limit => ({
          action: limit.action,
          used: limit.currentHour,
          total: limit.perHour,
          percentage: (limit.currentHour / limit.perHour) * 100
        }))
      },
      recommendations: [
        "🎯 Mantenha consistência nos horários de postagem",
        "📊 Monitore métricas de engajamento regularmente",
        "🔄 Varie o conteúdo para evitar detecção de bot",
        "⏰ Respeite os limites de segurança das plataformas"
      ]
    };
  }

  // =======================
  // 🛡️ PROTEÇÃO ANTI-DETECÇÃO
  // =======================
  public async isActionSafe(userId: string, action: string, platform: string): Promise<{ safe: boolean; reason?: string; waitTime?: number }> {
    // Verificar rate limits
    const rateLimitCheck = await this.checkRateLimit(userId, action);
    if (!rateLimitCheck.allowed) {
      return {
        safe: false,
        reason: rateLimitCheck.reason,
        waitTime: rateLimitCheck.waitTime
      };
    }

    // Verificar padrão comportamental
    const pattern = await this.getBehaviorPattern(userId, platform, action);
    if (pattern) {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Verificar se está em horário seguro
      if (!pattern.patterns.timeWindows.includes(currentHour)) {
        const nextSafeHour = this.getNextSafeHour(pattern.patterns.timeWindows, currentHour);
        const waitTime = this.calculateWaitTime(nextSafeHour);
        
        return {
          safe: false,
          reason: `Horário não otimizado. Próximo horário seguro: ${nextSafeHour}:00`,
          waitTime
        };
      }
    }

    return { safe: true };
  }

  private getNextSafeHour(safeHours: number[], currentHour: number): number {
    const nextHours = safeHours.filter(h => h > currentHour);
    return nextHours.length > 0 ? nextHours[0] : safeHours[0];
  }

  private calculateWaitTime(targetHour: number): number {
    const now = new Date();
    const target = new Date();
    target.setHours(targetHour, 0, 0, 0);
    
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    
    return target.getTime() - now.getTime();
  }
}

export default HumanizedAutomationService;
