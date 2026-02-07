import { Plan, FeatureKey } from '../types';

/**
 * Configuração dos planos de assinatura com ferramentas incluídas
 * Redistribuição baseada em relevância e valor por plano
 */

export const SUBSCRIPTION_PLANS: Plan[] = [
  {
    id: 'mensal',
    name: 'Mensal',
    price: 59.90,
    period: 'mês',
    features: [
      'Dashboard Principal',
      'Contas Sociais (básico)',
      'Gerador de Ebook (básico)',
      'Detector de Áudio Viral',
      'Sistema de Afiliados'
    ],
    includedTools: ['audioDetector', 'affiliate'],
    highlight: false,
    description: 'Degustação 24h + Afiliados sempre liberado'
  },
  {
    id: 'trimestral',
    name: 'Trimestral',
    price: 159.90,
    period: 'trimestre',
    features: [
      'Tudo do Mensal',
      'Analytics (básico)',
      'Preditor de Tendências',
      'Ferramentas de Mídia Social',
      'Sistema de Afiliados Premium'
    ],
    includedTools: ['audioDetector', 'affiliate', 'analytics', 'trendPredictor'],
    highlight: true,
    description: 'Áudios de Retenção IA + Predição de Tendências'
  },
  {
    id: 'semestral',
    name: 'Semestral',
    price: 259.90,
    period: 'semestre',
    features: [
      'Tudo do Trimestral',
      'Analytics Avançado',
      'Espião de Concorrentes',
      'Radar de Conversão',
      'AI Video Generator',
      'Analisador Viral'
    ],
    includedTools: ['audioDetector', 'affiliate', 'analytics', 'trendPredictor', 'competitorSpy', 'conversionRadar'],
    highlight: false,
    description: 'Espião de Concorrentes + Radar de Conversão + IA Avançada'
  },
  {
    id: 'anual',
    name: 'Anual',
    price: 399.90,
    period: 'ano',
    highlight: false,
    features: [
      'Tudo do Semestral',
      'Crescimento Avançado',
      'Predição Viral IA',
      'Piloto Automático',
      'Motor de Crescimento',
      'AI Funil Builder Completo',
      'Projeção de Receita',
      'Publicidade Avançada'
    ],
    includedTools: ['audioDetector', 'affiliate', 'analytics', 'trendPredictor', 'competitorSpy', 'conversionRadar', 'advancedGrowth', 'viralPrediction', 'autopilot', 'growthEngine'],
    description: 'Todas as ferramentas + Motor de Crescimento + Piloto Automático'
  }
];

/**
 * Mapeamento de ferramentas com suas descrições e valores
 */
export const TOOL_DESCRIPTIONS: Record<FeatureKey, { name: string; description: string; value: number }> = {
  analytics: {
    name: 'Analytics Avançado',
    description: 'Análises detalhadas de performance e métricas',
    value: 47
  },
  affiliate: {
    name: 'Sistema de Afiliados',
    description: 'Programa completo de afiliados com comissões',
    value: 67
  },
  autopilot: {
    name: 'Piloto Automático',
    description: 'Automação completa de crescimento e engajamento',
    value: 127
  },
  advancedGrowth: {
    name: 'Crescimento Avançado',
    description: 'Estratégias premium de crescimento orgânico',
    value: 97
  },
  conversionRadar: {
    name: 'Radar de Conversão',
    description: 'Detecção e otimização de oportunidades de conversão',
    value: 87
  },
  audioDetector: {
    name: 'Detector de Áudio Viral',
    description: 'Identifica áudios com potencial viral',
    value: 57
  },
  competitorSpy: {
    name: 'Espião de Concorrentes',
    description: 'Análise estratégica da concorrência',
    value: 77
  },
  trendPredictor: {
    name: 'Preditor de Tendências',
    description: 'Previsão de tendências e conteúdos virais',
    value: 67
  },
  viralPrediction: {
    name: 'Predição Viral IA',
    description: 'IA avançada para prever potencial viral',
    value: 107
  },
  growthEngine: {
    name: 'Motor de Crescimento',
    description: 'Engine completo de crescimento automatizado',
    value: 147
  }
};

/**
 * Ferramentas sempre liberadas (sem necessidade de assinatura)
 */
export const ALWAYS_FREE_TOOLS: FeatureKey[] = ['affiliate'];

/**
 * Ferramentas disponíveis na degustação de 24h
 */
export const TRIAL_TOOLS: FeatureKey[] = ['audioDetector'];

/**
 * Função para verificar se o período de degustação de 24h ainda está ativo
 */
export function isTrialActive(trialStartDate?: string): boolean {
  if (!trialStartDate) return false;
  
  const trialStart = new Date(trialStartDate);
  const now = new Date();
  const hoursDiff = (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60);
  
  return hoursDiff < 24;
}

/**
 * Função para verificar se usuário tem acesso a uma ferramenta
 */
export function hasToolAccess(userPlan: string | undefined, toolKey: FeatureKey, userAddOns?: FeatureKey[], userType?: string, trialStartDate?: string): boolean {
  // Admin sempre tem acesso total a todas as ferramentas gratuitamente
  if (userType === 'admin') return true;
  
  // Ferramentas sempre liberadas (Sistema de Afiliados)
  if (ALWAYS_FREE_TOOLS.includes(toolKey)) return true;
  
  // Verificar degustação de 24h para ferramentas do plano mensal
  if (TRIAL_TOOLS.includes(toolKey) && isTrialActive(trialStartDate)) {
    return true;
  }
  
  // Sem plano = sem acesso (exceto ferramentas sempre liberadas)
  if (!userPlan) return false;
  
  // Verificar se tem como add-on
  if (userAddOns && userAddOns.includes(toolKey)) {
    return true;
  }
  
  // Verificar se está incluído no plano
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === userPlan);
  return plan?.includedTools?.includes(toolKey) || false;
}

/**
 * Função para obter ferramentas disponíveis por plano
 */
export function getAvailableTools(userPlan: string | undefined, userAddOns?: FeatureKey[], userType?: string): FeatureKey[] {
  // Admin tem acesso a TODAS as ferramentas gratuitamente
  if (userType === 'admin') {
    return Object.keys(TOOL_DESCRIPTIONS) as FeatureKey[];
  }
  
  if (!userPlan) return [];
  
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === userPlan);
  const planTools = plan?.includedTools || [];
  const addOnTools = userAddOns || [];
  
  return [...new Set([...planTools, ...addOnTools])];
}

/**
 * Função para calcular valor total das ferramentas incluídas
 */
export function calculateIncludedToolsValue(planId: string): number {
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
  if (!plan?.includedTools) return 0;
  
  return plan.includedTools.reduce((total, toolKey) => {
    return total + (TOOL_DESCRIPTIONS[toolKey]?.value || 0);
  }, 0);
}
