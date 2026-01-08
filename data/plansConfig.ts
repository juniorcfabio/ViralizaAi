import { Plan, FeatureKey } from '../types';

/**
 * Configuração dos planos de assinatura com ferramentas incluídas
 * Redistribuição baseada em relevância e valor por plano
 */

export const SUBSCRIPTION_PLANS: Plan[] = [
  {
    id: 'mensal',
    name: 'Plano Mensal',
    price: 97,
    period: 'mensal',
    highlight: false,
    features: [
      'Análises básicas de performance',
      'Geração de conteúdo com IA',
      'Agendamento de posts',
      'Suporte por email',
      '2 ferramentas avançadas incluídas'
    ],
    includedTools: [
      'analytics',
      'trendPredictor'
    ]
  },
  {
    id: 'trimestral',
    name: 'Plano Trimestral',
    price: 247,
    period: 'trimestral',
    highlight: false,
    features: [
      'Tudo do plano mensal',
      'Análises avançadas de crescimento',
      'Sistema de afiliados',
      'Detector de áudio viral',
      'Suporte prioritário',
      '4 ferramentas avançadas incluídas'
    ],
    includedTools: [
      'analytics',
      'trendPredictor',
      'affiliate',
      'audioDetector'
    ]
  },
  {
    id: 'semestral',
    name: 'Plano Semestral',
    price: 447,
    period: 'semestral',
    highlight: true,
    features: [
      'Tudo do plano trimestral',
      'Piloto automático de crescimento',
      'Radar de conversão avançado',
      'Espião de concorrentes',
      'Predição viral com IA',
      'Suporte VIP',
      '7 ferramentas avançadas incluídas'
    ],
    includedTools: [
      'analytics',
      'trendPredictor',
      'affiliate',
      'audioDetector',
      'autopilot',
      'conversionRadar',
      'competitorSpy'
    ]
  },
  {
    id: 'anual',
    name: 'Plano Anual',
    price: 797,
    period: 'anual',
    highlight: false,
    features: [
      'Tudo do plano semestral',
      'Motor de crescimento completo',
      'Predição viral avançada',
      'Crescimento avançado premium',
      'Consultoria estratégica mensal',
      'Suporte 24/7 dedicado',
      'TODAS as ferramentas incluídas'
    ],
    includedTools: [
      'analytics',
      'affiliate',
      'autopilot',
      'advancedGrowth',
      'conversionRadar',
      'audioDetector',
      'competitorSpy',
      'trendPredictor',
      'viralPrediction',
      'growthEngine'
    ]
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
 * Função para verificar se usuário tem acesso a uma ferramenta
 */
export function hasToolAccess(userPlan: string | undefined, toolKey: FeatureKey, userAddOns?: FeatureKey[], userType?: string): boolean {
  // Admin sempre tem acesso total a todas as ferramentas gratuitamente
  if (userType === 'admin') return true;
  
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
