// SISTEMA DE CONTROLE DE ACESSO POR PLANO
// Gerencia permissões e restrições baseadas no plano do usuário

import { User } from '../types';
import { SUBSCRIPTION_PLANS } from '../data/plansConfig';

export interface PlanFeatures {
  name: string;
  price: number;
  features: string[];
  limits: {
    postsPerDay: number;
    platformsSupported: number;
    aiGenerations: number;
    videoEditing: number;
    musicGeneration: number;
    chatbots: number;
    analytics: boolean;
    remarketing: boolean;
    globalTranslation: boolean;
  };
}

export interface FeatureAccess {
  hasAccess: boolean;
  requiredPlan?: string;
  currentUsage?: number;
  limit?: number;
  upgradeMessage?: string;
}

class PlanAccessControl {
  private static instance: PlanAccessControl;
  
  private planHierarchy = {
    'mensal': 1,
    'trimestral': 2,
    'semestral': 3,
    'anual': 4
  };

  private planFeatures: Record<string, PlanFeatures> = {
    mensal: {
      name: 'Plano Mensal',
      price: 59.90,
      features: [
        'Agendamento básico multiplataforma',
        'Hashtags inteligentes básicas',
        'Analytics básico',
        'Suporte por email'
      ],
      limits: {
        postsPerDay: 10,
        platformsSupported: 3,
        aiGenerations: 50,
        videoEditing: 5,
        musicGeneration: 0,
        chatbots: 0,
        analytics: true,
        remarketing: false,
        globalTranslation: false
      }
    },
    trimestral: {
      name: 'Plano Trimestral',
      price: 159.90,
      features: [
        'Tudo do Mensal +',
        'IA de Copywriting avançada',
        'Detector de tendências',
        'Análise de concorrência',
        'Suporte prioritário'
      ],
      limits: {
        postsPerDay: 25,
        platformsSupported: 5,
        aiGenerations: 150,
        videoEditing: 15,
        musicGeneration: 0,
        chatbots: 0,
        analytics: true,
        remarketing: false,
        globalTranslation: false
      }
    },
    semestral: {
      name: 'Plano Semestral',
      price: 259.90,
      features: [
        'Tudo do Trimestral +',
        'Editor de vídeo com IA',
        'Gerador de animações 3D/2D',
        'Chatbots inteligentes',
        'Captura de leads automática',
        'Suporte via WhatsApp'
      ],
      limits: {
        postsPerDay: 50,
        platformsSupported: 6,
        aiGenerations: 300,
        videoEditing: 50,
        musicGeneration: 0,
        chatbots: 3,
        analytics: true,
        remarketing: false,
        globalTranslation: false
      }
    },
    anual: {
      name: 'Plano Anual',
      price: 399.90,
      features: [
        'Acesso TOTAL a todas as ferramentas',
        'Tradução automática global (12+ idiomas)',
        'Gerador de música IA original',
        'Dashboard unificado completo',
        'Sistema de remarketing automático',
        'Gamificação avançada',
        'Integrações personalizadas',
        'Suporte 24/7 dedicado'
      ],
      limits: {
        postsPerDay: -1, // Ilimitado
        platformsSupported: -1, // Todas
        aiGenerations: -1, // Ilimitado
        videoEditing: -1, // Ilimitado
        musicGeneration: -1, // Ilimitado
        chatbots: -1, // Ilimitado
        analytics: true,
        remarketing: true,
        globalTranslation: true
      }
    }
  };

  // Método para sincronizar preços com plansConfig
  private syncPricesWithConfig(): void {
    try {
      SUBSCRIPTION_PLANS.forEach(plan => {
        const key = plan.name.toLowerCase();
        if (this.planFeatures[key]) {
          this.planFeatures[key].price = typeof plan.price === 'number' ? plan.price : parseFloat(String(plan.price));
          this.planFeatures[key].name = plan.name;
        }
      });
    } catch (error) {
      console.warn('Erro ao sincronizar preços com plansConfig:', error);
    }
  }

  private featureRequirements = {
    // Automação
    'basic_scheduler': 'mensal',
    'ai_copywriting': 'trimestral',
    'global_translation': 'anual',
    
    // Mídia
    'video_editor_ai': 'semestral',
    'animation_generator': 'semestral',
    'music_generator': 'anual',
    
    // Engajamento
    'simple_hashtags': 'mensal',
    'smart_hashtags': 'trimestral',
    'chatbot_builder': 'semestral',
    'gamification': 'anual',
    
    // Analytics
    'basic_analytics': 'mensal',
    'trend_detector': 'trimestral',
    'competitor_analysis': 'trimestral',
    'unified_dashboard': 'anual',
    
    // Monetização
    'lead_capture': 'semestral',
    'sales_automation': 'anual',
    'remarketing': 'anual'
  };

  public static getInstance(): PlanAccessControl {
    if (!PlanAccessControl.instance) {
      PlanAccessControl.instance = new PlanAccessControl();
      PlanAccessControl.instance.syncPricesWithConfig();
    }
    return PlanAccessControl.instance;
  }

  public checkFeatureAccess(feature: string, userPlan: string): FeatureAccess {
    const requiredPlan = this.featureRequirements[feature];
    
    if (!requiredPlan) {
      return {
        hasAccess: false,
        upgradeMessage: 'Funcionalidade não encontrada'
      };
    }

    const userPlanLevel = this.planHierarchy[userPlan] || 0;
    const requiredPlanLevel = this.planHierarchy[requiredPlan] || 999;

    const hasAccess = userPlanLevel >= requiredPlanLevel;

    if (!hasAccess) {
      return {
        hasAccess: false,
        requiredPlan,
        upgradeMessage: this.getUpgradeMessage(feature, requiredPlan, userPlan)
      };
    }

    return {
      hasAccess: true,
      currentUsage: this.getCurrentUsage(feature, userPlan),
      limit: this.getFeatureLimit(feature, userPlan)
    };
  }

  public getPlanFeatures(planName: string): PlanFeatures | null {
    return this.planFeatures[planName] || null;
  }

  public getAllPlans(): PlanFeatures[] {
    return Object.values(this.planFeatures);
  }

  public getUpgradeRecommendation(currentPlan: string, desiredFeatures: string[]): {
    recommendedPlan: string;
    additionalFeatures: string[];
    savings: number;
  } {
    let recommendedPlan = currentPlan;
    let maxRequiredLevel = this.planHierarchy[currentPlan] || 0;

    // Encontrar o plano mínimo necessário
    for (const feature of desiredFeatures) {
      const requiredPlan = this.featureRequirements[feature];
      if (requiredPlan) {
        const requiredLevel = this.planHierarchy[requiredPlan] || 0;
        if (requiredLevel > maxRequiredLevel) {
          maxRequiredLevel = requiredLevel;
          recommendedPlan = requiredPlan;
        }
      }
    }

    // Calcular funcionalidades adicionais
    const currentFeatures = this.getAvailableFeatures(currentPlan);
    const recommendedFeatures = this.getAvailableFeatures(recommendedPlan);
    const additionalFeatures = recommendedFeatures.filter(f => !currentFeatures.includes(f));

    // Calcular economia (exemplo: plano anual vs mensal)
    const currentPrice = this.planFeatures[currentPlan]?.price || 0;
    const recommendedPrice = this.planFeatures[recommendedPlan]?.price || 0;
    const savings = recommendedPlan === 'anual' ? (59.90 * 12) - 399.90 : 0;

    return {
      recommendedPlan,
      additionalFeatures,
      savings
    };
  }

  public trackFeatureUsage(feature: string, userPlan: string, userId: string): boolean {
    const access = this.checkFeatureAccess(feature, userPlan);
    
    if (!access.hasAccess) {
      return false;
    }

    // Verificar limites de uso
    const currentUsage = this.getCurrentUsage(feature, userPlan, userId);
    const limit = this.getFeatureLimit(feature, userPlan);

    if (limit > 0 && currentUsage >= limit) {
      return false; // Limite excedido
    }

    // Incrementar uso (em produção, salvaria no banco de dados)
    this.incrementUsage(feature, userId);
    
    return true;
  }

  public getUsageStats(userPlan: string, userId: string): {
    feature: string;
    used: number;
    limit: number;
    percentage: number;
  }[] {
    const features = this.getAvailableFeatures(userPlan);
    
    return features.map(feature => {
      const used = this.getCurrentUsage(feature, userPlan, userId);
      const limit = this.getFeatureLimit(feature, userPlan);
      const percentage = limit > 0 ? (used / limit) * 100 : 0;

      return {
        feature,
        used,
        limit,
        percentage
      };
    });
  }

  public canUpgrade(currentPlan: string, targetPlan: string): {
    canUpgrade: boolean;
    priceDifference: number;
    newFeatures: string[];
  } {
    const currentLevel = this.planHierarchy[currentPlan] || 0;
    const targetLevel = this.planHierarchy[targetPlan] || 0;
    
    const canUpgrade = targetLevel > currentLevel;
    
    const currentPrice = this.planFeatures[currentPlan]?.price || 0;
    const targetPrice = this.planFeatures[targetPlan]?.price || 0;
    const priceDifference = targetPrice - currentPrice;

    const currentFeatures = this.getAvailableFeatures(currentPlan);
    const targetFeatures = this.getAvailableFeatures(targetPlan);
    const newFeatures = targetFeatures.filter(f => !currentFeatures.includes(f));

    return {
      canUpgrade,
      priceDifference,
      newFeatures
    };
  }

  private getUpgradeMessage(feature: string, requiredPlan: string, currentPlan: string): string {
    const featureNames = {
      'ai_copywriting': 'IA de Copywriting',
      'video_editor_ai': 'Editor de Vídeo IA',
      'global_translation': 'Tradução Global',
      'music_generator': 'Gerador de Música IA',
      'unified_dashboard': 'Dashboard Unificado',
      'remarketing': 'Sistema de Remarketing'
    };

    const featureName = featureNames[feature] || feature;
    const planName = this.planFeatures[requiredPlan]?.name || requiredPlan;

    return `Para acessar ${featureName}, faça upgrade para o ${planName} ou superior.`;
  }

  private getAvailableFeatures(planName: string): string[] {
    const planLevel = this.planHierarchy[planName] || 0;
    
    return Object.entries(this.featureRequirements)
      .filter(([_, requiredPlan]) => {
        const requiredLevel = this.planHierarchy[requiredPlan] || 999;
        return planLevel >= requiredLevel;
      })
      .map(([feature, _]) => feature);
  }

  private getCurrentUsage(feature: string, userPlan: string, userId?: string): number {
    // Em produção, buscaria do banco de dados
    // Por agora, retorna valores simulados baseados no localStorage
    const usageKey = `usage_${feature}_${userId || 'anonymous'}`;
    const stored = localStorage.getItem(usageKey);
    return stored ? parseInt(stored) : 0;
  }

  private getFeatureLimit(feature: string, userPlan: string): number {
    const planFeatures = this.planFeatures[userPlan];
    if (!planFeatures) return 0;

    // Mapear features para limites específicos
    const featureLimits = {
      'basic_scheduler': planFeatures.limits.postsPerDay,
      'ai_copywriting': planFeatures.limits.aiGenerations,
      'video_editor_ai': planFeatures.limits.videoEditing,
      'music_generator': planFeatures.limits.musicGeneration,
      'chatbot_builder': planFeatures.limits.chatbots
    };

    return featureLimits[feature] || -1; // -1 = ilimitado
  }

  private incrementUsage(feature: string, userId: string): void {
    const usageKey = `usage_${feature}_${userId}`;
    const current = this.getCurrentUsage(feature, 'mensal', userId);
    localStorage.setItem(usageKey, (current + 1).toString());
    // SYNC COM SUPABASE
    import('../src/lib/supabase').then(({ supabase }) => {
      supabase.from('user_data').upsert({ user_id: userId, data: { [usageKey]: current + 1 }, updated_at: new Date().toISOString() }).then(() => {});
    });
  }

  public resetDailyUsage(userId: string): void {
    // Reset diário dos contadores (seria executado por um cron job)
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(`usage_`) && key.endsWith(`_${userId}`)
    );
    
    keys.forEach(key => localStorage.removeItem(key));
  }

  public generateUpgradeUrl(currentPlan: string, targetPlan: string, userId: string): string {
    const baseUrl = 'https://viralizaai.vercel.app';
    const upgradeParams = new URLSearchParams({
      from: currentPlan,
      to: targetPlan,
      user: userId,
      source: 'feature_limit'
    });

    return `${baseUrl}/dashboard/billing?${upgradeParams.toString()}`;
  }
}

export default PlanAccessControl;
