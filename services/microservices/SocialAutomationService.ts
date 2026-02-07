// =======================
// 🤖 SERVIÇO DE AUTOMAÇÃO SOCIAL - MICROSERVIÇO
// =======================

import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Bull from 'bull';
import DatabaseService from '../database/DatabaseService';
import SecurityService from '../securityService';

interface SocialRequest extends express.Request {
  user?: any;
}

interface SocialPost {
  id: string;
  userId: string;
  content: string;
  platforms: string[];
  scheduledTime: Date;
  status: 'pending' | 'processing' | 'posted' | 'failed';
  mediaUrls?: string[];
  hashtags?: string[];
}

class SocialAutomationService {
  private app: express.Application;
  private db: DatabaseService;
  private security: SecurityService;
  private postQueue: Bull.Queue;
  private contentQueue: Bull.Queue;

  constructor() {
    this.app = express();
    this.db = DatabaseService.getInstance();
    this.security = SecurityService.getInstance();
    
    // Configurar filas Redis
    this.postQueue = new Bull('social-posts', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      }
    });

    this.contentQueue = new Bull('content-generation', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      }
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupQueueProcessors();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(express.json({ limit: '50mb' }));

    // Rate limiting específico para automação
    const automationLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minuto
      max: 30, // máximo 30 posts por minuto
      message: {
        error: 'Limite de automação excedido. Aguarde 1 minuto.',
        code: 'AUTOMATION_RATE_LIMIT'
      }
    });

    this.app.use('/schedule', automationLimiter);
    this.app.use('/bulk', rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // máximo 5 operações bulk por 15 min
      message: { error: 'Limite de operações em massa excedido' }
    }));
  }

  private setupRoutes(): void {
    // =======================
    // 📅 AGENDAR POST
    // =======================
    this.app.post('/schedule', async (req: SocialRequest, res) => {
      try {
        const { userId, content, platforms, scheduledTime, mediaUrls, hashtags } = req.body;

        // Validações
        if (!userId || !content || !platforms || !scheduledTime) {
          return res.status(400).json({
            success: false,
            error: 'Dados obrigatórios não fornecidos'
          });
        }

        // Verificar limites de uso
        const usageCheck = await this.db.checkUsageLimit(userId, 'scheduleContent');
        if (!usageCheck.allowed) {
          return res.status(429).json({
            success: false,
            error: 'Limite mensal de agendamentos atingido',
            resetAt: usageCheck.resetAt
          });
        }

        // Sanitizar conteúdo
        const sanitizedContent = this.security.sanitizeInput(content);
        const sanitizedHashtags = hashtags ? this.security.sanitizeInput(hashtags) : [];

        // Criar job na fila
        const jobData = {
          userId,
          content: sanitizedContent,
          platforms: Array.isArray(platforms) ? platforms : [platforms],
          scheduledTime: new Date(scheduledTime),
          mediaUrls: mediaUrls || [],
          hashtags: sanitizedHashtags
        };

        const job = await this.postQueue.add('schedule-post', jobData, {
          delay: new Date(scheduledTime).getTime() - Date.now(),
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        });

        // Incrementar uso
        await this.db.incrementUsage(userId, 'scheduleContent');

        // Log da ação
        await this.db.createAuditLog({
          user_id: userId,
          action: 'post_scheduled',
          resource_type: 'social_post',
          resource_id: job.id.toString(),
          success: true,
          severity: 'info',
          request_data: { platforms, scheduledTime }
        });

        res.json({
          success: true,
          data: {
            jobId: job.id,
            scheduledTime: jobData.scheduledTime,
            platforms: jobData.platforms,
            status: 'scheduled'
          }
        });

      } catch (error: any) {
        console.error('❌ Erro ao agendar post:', error);
        
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });

    // =======================
    // 📊 GERAR CONTEÚDO COM IA
    // =======================
    this.app.post('/generate-content', async (req: SocialRequest, res) => {
      try {
        const { userId, prompt, platform, contentType, tone } = req.body;

        // Verificar limites
        const usageCheck = await this.db.checkUsageLimit(userId, 'generateCopy');
        if (!usageCheck.allowed) {
          return res.status(429).json({
            success: false,
            error: 'Limite mensal de geração de conteúdo atingido',
            resetAt: usageCheck.resetAt
          });
        }

        // Sanitizar prompt
        const sanitizedPrompt = this.security.sanitizeInput(prompt);

        // Gerar conteúdo usando IA (simulação realista)
        const generatedContent = await this.generateAIContent({
          prompt: sanitizedPrompt,
          platform: platform || 'instagram',
          contentType: contentType || 'post',
          tone: tone || 'professional'
        });

        // Incrementar uso
        await this.db.incrementUsage(userId, 'generateCopy');

        // Log da geração
        await this.db.createAuditLog({
          user_id: userId,
          action: 'content_generated',
          resource_type: 'ai_content',
          success: true,
          severity: 'info',
          request_data: { platform, contentType, tone }
        });

        res.json({
          success: true,
          data: {
            content: generatedContent.text,
            hashtags: generatedContent.hashtags,
            suggestions: generatedContent.suggestions,
            platform: platform,
            estimatedReach: generatedContent.estimatedReach,
            viralScore: generatedContent.viralScore
          }
        });

      } catch (error: any) {
        console.error('❌ Erro ao gerar conteúdo:', error);
        
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });

    // =======================
    // 📱 CONECTAR PLATAFORMA
    // =======================
    this.app.post('/connect-platform', async (req: SocialRequest, res) => {
      try {
        const { userId, platform, accessToken, refreshToken, accountData } = req.body;

        // Validar token (simulação)
        const isValidToken = await this.validatePlatformToken(platform, accessToken);
        if (!isValidToken) {
          return res.status(401).json({
            success: false,
            error: 'Token de acesso inválido'
          });
        }

        // Salvar token criptografado
        await this.db.saveSocialToken(userId, platform, accessToken, {
          refresh_token: refreshToken,
          account_id: accountData?.id,
          account_name: accountData?.name,
          expires_at: accountData?.expires_at
        });

        // Log da conexão
        await this.db.createAuditLog({
          user_id: userId,
          action: 'platform_connected',
          resource_type: 'social_platform',
          resource_id: platform,
          success: true,
          severity: 'info'
        });

        res.json({
          success: true,
          data: {
            platform,
            accountName: accountData?.name,
            connected: true,
            permissions: this.getPlatformPermissions(platform)
          }
        });

      } catch (error: any) {
        console.error('❌ Erro ao conectar plataforma:', error);
        
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });

    // =======================
    // 📈 ANALYTICS DE POSTS
    // =======================
    this.app.get('/analytics/:userId', async (req: SocialRequest, res) => {
      try {
        const { userId } = req.params;
        const { period = '30d', platform } = req.query;

        // Buscar métricas do usuário (simulação com dados realistas)
        const analytics = await this.getPostAnalytics(userId, period as string, platform as string);

        res.json({
          success: true,
          data: analytics
        });

      } catch (error: any) {
        console.error('❌ Erro ao buscar analytics:', error);
        
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });

    // =======================
    // 🔄 OPERAÇÕES EM MASSA
    // =======================
    this.app.post('/bulk/schedule', async (req: SocialRequest, res) => {
      try {
        const { userId, posts } = req.body;

        if (!Array.isArray(posts) || posts.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Lista de posts inválida'
          });
        }

        if (posts.length > 50) {
          return res.status(400).json({
            success: false,
            error: 'Máximo 50 posts por operação'
          });
        }

        const results = [];

        for (const post of posts) {
          try {
            const job = await this.postQueue.add('schedule-post', {
              userId,
              ...post,
              scheduledTime: new Date(post.scheduledTime)
            }, {
              delay: new Date(post.scheduledTime).getTime() - Date.now(),
              attempts: 3
            });

            results.push({
              success: true,
              jobId: job.id,
              scheduledTime: post.scheduledTime
            });

            await this.db.incrementUsage(userId, 'scheduleContent');
          } catch (error: any) {
            results.push({
              success: false,
              error: error.message,
              content: post.content.substring(0, 50) + '...'
            });
          }
        }

        res.json({
          success: true,
          data: {
            total: posts.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
          }
        });

      } catch (error: any) {
        console.error('❌ Erro em operação bulk:', error);
        
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });

    // =======================
    // 📊 HEALTH CHECK
    // =======================
    this.app.get('/health', async (req, res) => {
      try {
        const dbHealth = await this.db.healthCheck();
        const queueHealth = await this.checkQueueHealth();

        res.json({
          success: true,
          service: 'social-automation-service',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: dbHealth ? 'connected' : 'disconnected',
          queues: queueHealth,
          stats: {
            pendingPosts: await this.postQueue.count(),
            processingPosts: await this.postQueue.getActive(),
            completedToday: await this.getCompletedJobsToday()
          }
        });
      } catch (error) {
        res.status(503).json({
          success: false,
          service: 'social-automation-service',
          status: 'unhealthy'
        });
      }
    });
  }

  // =======================
  // 🔄 PROCESSADORES DE FILA
  // =======================
  private setupQueueProcessors(): void {
    // Processar posts agendados
    this.postQueue.process('schedule-post', 10, async (job) => {
      const { userId, content, platforms, mediaUrls, hashtags } = job.data;
      
      console.log(`📤 Processando post para usuário ${userId}`);

      const results = [];

      for (const platform of platforms) {
        try {
          // Buscar token da plataforma
          const token = await this.db.getSocialToken(userId, platform);
          if (!token) {
            throw new Error(`Token não encontrado para ${platform}`);
          }

          // Postar na plataforma (simulação)
          const postResult = await this.postToPlatform(platform, {
            content,
            mediaUrls,
            hashtags,
            token
          });

          results.push({
            platform,
            success: true,
            postId: postResult.id,
            url: postResult.url
          });

          console.log(`✅ Post enviado para ${platform}: ${postResult.id}`);

        } catch (error: any) {
          console.error(`❌ Erro ao postar no ${platform}:`, error.message);
          
          results.push({
            platform,
            success: false,
            error: error.message
          });
        }
      }

      // Log do resultado
      await this.db.createAuditLog({
        user_id: userId,
        action: 'post_executed',
        resource_type: 'social_post',
        resource_id: job.id.toString(),
        success: results.some(r => r.success),
        severity: results.every(r => r.success) ? 'info' : 'warn',
        response_data: { results }
      });

      return results;
    });

    // Processar geração de conteúdo
    this.contentQueue.process('generate-content', 5, async (job) => {
      const { userId, prompt, platform, contentType } = job.data;
      
      console.log(`🤖 Gerando conteúdo para usuário ${userId}`);

      const content = await this.generateAIContent({
        prompt,
        platform,
        contentType,
        tone: 'professional'
      });

      return content;
    });

    // Event handlers para monitoramento
    this.postQueue.on('completed', (job, result) => {
      console.log(`✅ Job ${job.id} concluído`);
    });

    this.postQueue.on('failed', (job, err) => {
      console.error(`❌ Job ${job.id} falhou:`, err.message);
    });
  }

  // =======================
  // 🤖 GERAÇÃO DE CONTEÚDO IA
  // =======================
  private async generateAIContent(params: any): Promise<any> {
    const { prompt, platform, contentType, tone } = params;

    // Simulação de IA avançada com dados realistas
    const templates = {
      instagram: {
        post: [
          "🚀 {prompt}\n\n✨ Descubra como transformar sua presença digital!\n\n#marketing #digital #sucesso #empreendedorismo #instagram",
          "💡 {prompt}\n\nVocê sabia que 73% das empresas que usam marketing digital crescem 2x mais rápido?\n\n👆 Salve este post!\n\n#dicas #negócios #crescimento",
          "🎯 {prompt}\n\nPasso a passo para resultados incríveis:\n1️⃣ Planeje sua estratégia\n2️⃣ Crie conteúdo de valor\n3️⃣ Engaje com sua audiência\n\n#estratégia #marketing"
        ],
        story: [
          "🔥 {prompt} - Swipe up para saber mais!",
          "💫 {prompt} - Não perca essa oportunidade!",
          "⚡ {prompt} - Clique no link da bio!"
        ]
      },
      tiktok: {
        post: [
          "🎵 {prompt} #fyp #viral #trending #brasil #dicas",
          "💥 {prompt} - Parte 1/3 #tutorial #aprenda #sucesso",
          "🚀 {prompt} - Você não vai acreditar no resultado! #incrível #resultado"
        ]
      },
      linkedin: {
        post: [
          "{prompt}\n\nNo mercado atual, profissionais que dominam marketing digital têm 40% mais oportunidades de carreira.\n\nQual sua experiência com isso?\n\n#LinkedIn #CarreiraProfissional #MarketingDigital",
          "Reflexão sobre {prompt}:\n\nApós 5 anos no mercado, percebi que...\n\n🔹 A consistência supera a perfeição\n🔹 Dados guiam melhores decisões\n🔹 Relacionamentos são fundamentais\n\nConcorda?\n\n#Networking #Crescimento"
        ]
      }
    };

    const platformTemplates = templates[platform] || templates.instagram;
    const typeTemplates = platformTemplates[contentType] || platformTemplates.post;
    const template = typeTemplates[Math.floor(Math.random() * typeTemplates.length)];

    const content = template.replace('{prompt}', prompt);

    // Gerar hashtags relevantes
    const hashtagSets = {
      marketing: ['#marketing', '#digital', '#estrategia', '#vendas', '#empreendedorismo'],
      tecnologia: ['#tech', '#inovacao', '#futuro', '#digital', '#tecnologia'],
      negócios: ['#negocios', '#empreender', '#sucesso', '#lideranca', '#gestao'],
      educação: ['#educacao', '#aprendizado', '#conhecimento', '#desenvolvimento', '#crescimento']
    };

    const category = this.detectContentCategory(prompt);
    const hashtags = hashtagSets[category] || hashtagSets.marketing;

    // Calcular métricas estimadas
    const baseReach = Math.floor(Math.random() * 5000) + 1000;
    const viralScore = Math.floor(Math.random() * 40) + 60; // 60-100

    return {
      text: content,
      hashtags: hashtags.slice(0, 5),
      suggestions: [
        'Adicione uma call-to-action no final',
        'Considere usar emojis para mais engajamento',
        'Poste no horário de pico da sua audiência'
      ],
      estimatedReach: baseReach,
      viralScore,
      category,
      platform
    };
  }

  // =======================
  // 📱 INTEGRAÇÃO COM PLATAFORMAS
  // =======================
  private async postToPlatform(platform: string, data: any): Promise<any> {
    // Simulação realista de postagem
    const delay = Math.random() * 2000 + 1000; // 1-3 segundos
    await new Promise(resolve => setTimeout(resolve, delay));

    const postId = `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: postId,
      url: `https://${platform}.com/post/${postId}`,
      timestamp: new Date().toISOString(),
      platform
    };
  }

  private async validatePlatformToken(platform: string, token: string): Promise<boolean> {
    // Simulação de validação de token
    return token && token.length > 10;
  }

  private getPlatformPermissions(platform: string): string[] {
    const permissions = {
      instagram: ['read_insights', 'publish_content', 'manage_comments'],
      facebook: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
      twitter: ['tweet.read', 'tweet.write', 'users.read'],
      tiktok: ['video.publish', 'video.list', 'user.info.basic'],
      linkedin: ['r_liteprofile', 'w_member_social', 'r_organization_social']
    };

    return permissions[platform] || [];
  }

  // =======================
  // 📊 ANALYTICS E MÉTRICAS
  // =======================
  private async getPostAnalytics(userId: string, period: string, platform?: string): Promise<any> {
    // Simulação de analytics realistas
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    
    const baseMetrics = {
      posts: Math.floor(Math.random() * days * 2) + days,
      impressions: Math.floor(Math.random() * 50000) + 10000,
      reach: Math.floor(Math.random() * 30000) + 5000,
      engagement: Math.floor(Math.random() * 2000) + 500,
      clicks: Math.floor(Math.random() * 1000) + 100,
      shares: Math.floor(Math.random() * 200) + 50
    };

    const engagementRate = ((baseMetrics.engagement / baseMetrics.reach) * 100).toFixed(2);
    const ctr = ((baseMetrics.clicks / baseMetrics.impressions) * 100).toFixed(2);

    return {
      period,
      platform: platform || 'all',
      metrics: baseMetrics,
      rates: {
        engagement: `${engagementRate}%`,
        clickThrough: `${ctr}%`,
        growth: `+${Math.floor(Math.random() * 20) + 5}%`
      },
      topPosts: [
        {
          id: 'post_1',
          content: 'Como aumentar vendas em 300%...',
          platform: 'instagram',
          impressions: 15420,
          engagement: 892,
          date: new Date(Date.now() - Math.random() * days * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'post_2',
          content: 'Estratégias de marketing que funcionam...',
          platform: 'linkedin',
          impressions: 8750,
          engagement: 445,
          date: new Date(Date.now() - Math.random() * days * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      bestTimes: ['09:00', '12:00', '18:00', '21:00'],
      demographics: {
        age: { '18-24': 25, '25-34': 40, '35-44': 25, '45+': 10 },
        gender: { male: 45, female: 55 },
        location: { 'São Paulo': 30, 'Rio de Janeiro': 20, 'Outros': 50 }
      }
    };
  }

  private async checkQueueHealth(): Promise<any> {
    return {
      postQueue: {
        waiting: await this.postQueue.getWaiting().then(jobs => jobs.length),
        active: await this.postQueue.getActive().then(jobs => jobs.length),
        completed: await this.postQueue.getCompleted().then(jobs => jobs.length),
        failed: await this.postQueue.getFailed().then(jobs => jobs.length)
      },
      contentQueue: {
        waiting: await this.contentQueue.getWaiting().then(jobs => jobs.length),
        active: await this.contentQueue.getActive().then(jobs => jobs.length)
      }
    };
  }

  private async getCompletedJobsToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completed = await this.postQueue.getCompleted();
    return completed.filter(job => 
      job.finishedOn && new Date(job.finishedOn) >= today
    ).length;
  }

  private detectContentCategory(prompt: string): string {
    const categories = {
      marketing: ['marketing', 'vendas', 'cliente', 'campanha', 'anúncio'],
      tecnologia: ['tech', 'tecnologia', 'software', 'app', 'digital'],
      negócios: ['negócio', 'empresa', 'empreender', 'lucro', 'gestão'],
      educação: ['curso', 'aprender', 'ensinar', 'educação', 'conhecimento']
    };

    const lowerPrompt = prompt.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
        return category;
      }
    }
    
    return 'marketing';
  }

  // =======================
  // 🚀 INICIAR SERVIÇO
  // =======================
  public start(port: number = 3003): void {
    this.app.listen(port, () => {
      console.log(`🤖 Social Automation Service rodando na porta ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default SocialAutomationService;
