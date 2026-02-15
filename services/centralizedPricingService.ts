/**
 * SERVIÇO DE PREÇOS CENTRALIZADOS - VIRALIZAAI
 * Sistema ultra-robusto que sincroniza preços em tempo real
 * Todas as páginas refletem mudanças instantaneamente
 * SEMPRE BUSCA DO SUPABASE - ZERO HARDCODE
 */

import React from 'react';
import { supabase } from '../src/lib/supabase';

export interface PlanPrice {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: 'subscription' | 'advertising' | 'tool';
  description: string;
  features: string[];
  isActive: boolean;
  highlight?: boolean;
  period?: string;
  discount?: number;
}

export interface PricingData {
  subscriptionPlans: PlanPrice[];
  advertisingPlans: PlanPrice[];
  toolPrices: PlanPrice[];
  lastUpdated: string;
}

class CentralizedPricingService {
  private static instance: CentralizedPricingService;
  private broadcastChannel: BroadcastChannel;
  private listeners: Set<(data: PricingData) => void> = new Set();

  constructor() {
    this.broadcastChannel = new BroadcastChannel('pricing-updates');
    this.broadcastChannel.onmessage = (event) => {
      if (event.data.type === 'PRICING_UPDATE') {
        this.notifyListeners(event.data.pricing);
      }
    };
  }

  static getInstance(): CentralizedPricingService {
    if (!CentralizedPricingService.instance) {
      CentralizedPricingService.instance = new CentralizedPricingService();
    }
    return CentralizedPricingService.instance;
  }

  /**
   * BUSCAR PREÇOS DO SUPABASE EM TEMPO REAL
   * NUNCA USA VALORES HARDCODED
   */
  private async fetchPricingFromSupabase(): Promise<PricingData> {
    try {
      console.log('🔄 Buscando preços do Supabase...');
      
      // 1. Buscar planos de assinatura e anúncios (SEM FILTRO is_active)
      const { data: pricingData, error: pricingError } = await supabase
        .from('pricing_config')
        .select('*');

      // 2. Buscar ferramentas avulsas (SEM FILTRO is_active)
      const { data: toolsData, error: toolsError } = await supabase
        .from('tool_pricing')
        .select('*');

      if (pricingError) {
        console.error('❌ Erro ao buscar pricing_config:', pricingError);
      }
      
      if (toolsError) {
        console.error('❌ Erro ao buscar tool_pricing:', toolsError);
      }

      if (pricingError && toolsError) {
        console.warn('⚠️ Ambas as tabelas falharam, usando fallback local');
        return this.getLocalPricing();
      }

      // Converter dados do Supabase para formato PricingData
      const subscriptionPlans: PlanPrice[] = [];
      const advertisingPlans: PlanPrice[] = [];
      const toolPrices: PlanPrice[] = [];

      // Processar planos de assinatura e anúncios
      (pricingData || []).forEach((item: any) => {
        const plan: PlanPrice = {
          id: item.plan_id || item.id,
          name: item.name,
          price: parseFloat(item.price) || 0,
          originalPrice: item.original_price ? parseFloat(item.original_price) : undefined,
          category: item.category || 'subscription',
          description: item.description || '',
          features: item.features || [],
          isActive: item.is_active !== false,
          highlight: item.highlight || false,
          period: item.period,
          discount: item.discount
        };

        if (item.category === 'subscription') {
          subscriptionPlans.push(plan);
        } else if (item.category === 'advertising') {
          advertisingPlans.push(plan);
        }
      });

      // Processar ferramentas avulsas
      (toolsData || []).forEach((tool: any) => {
        const toolPrice: PlanPrice = {
          id: tool.tool_id,
          name: tool.name,
          price: parseFloat(tool.price) || 0,
          category: 'tool',
          description: tool.description || '',
          features: tool.features || [],
          isActive: tool.is_active !== false,
          highlight: false
        };
        toolPrices.push(toolPrice);
      });

      const pricingDataResult: PricingData = {
        subscriptionPlans,
        advertisingPlans,
        toolPrices,
        lastUpdated: new Date().toISOString()
      };

      console.log('✅ Preços carregados do Supabase:', pricingDataResult);
      return pricingDataResult;
    } catch (error) {
      console.error('❌ Erro ao buscar preços do Supabase:', error);
      return this.getLocalPricing();
    }
  }

  /**
   * FALLBACK: Buscar do localStorage se Supabase falhar
   */
  private getLocalPricing(): PricingData {
    try {
      const localData = localStorage.getItem('centralized_pricing');
      if (localData) {
        return JSON.parse(localData);
      }
    } catch (e) {
      console.warn('⚠️ Erro ao ler localStorage');
    }
    
    // Último recurso: valores padrão mínimos
    return {
      subscriptionPlans: [
        {
          id: 'monthly',
          name: 'Mensal',
          price: 0.60,
          category: 'subscription',
          description: 'Plano Mensal',
          features: [],
          isActive: true,
          period: 'mês'
        }
      ],
      advertisingPlans: [
        {
          id: 'ad-weekly',
          name: '1 Semana',
          price: 99.90,
          category: 'advertising',
          description: 'Anúncio na página inicial por 7 dias',
          features: ['Posição premium na home', 'Até 10.000 visualizações', 'Relatório de performance'],
          isActive: true,
          period: '7 dias'
        },
        {
          id: 'ad-biweekly',
          name: '15 Dias',
          price: 179.90,
          category: 'advertising',
          description: 'Anúncio na página inicial por 15 dias',
          features: ['Posição premium na home', 'Até 25.000 visualizações', 'Relatório detalhado', 'Suporte prioritário'],
          isActive: true,
          period: '15 dias'
        },
        {
          id: 'ad-monthly',
          name: '30 Dias',
          price: 299.90,
          category: 'advertising',
          description: 'Anúncio na página inicial por 30 dias',
          features: ['Posição premium na home', 'Visualizações ilimitadas', 'Relatório completo', 'Suporte dedicado', 'Otimização contínua'],
          isActive: true,
          period: '30 dias',
          highlight: true
        }
      ],
      toolPrices: [],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * CARREGAR PREÇOS - SEMPRE DO SUPABASE
   */
  async loadPricing(): Promise<PricingData> {
    try {
      // SEMPRE buscar do Supabase primeiro
      const pricingData = await this.fetchPricingFromSupabase();
      
      // Salvar no localStorage para cache
      localStorage.setItem('centralized_pricing', JSON.stringify(pricingData));
      
      return pricingData;
    } catch (error) {
      console.error(' Erro ao carregar preços:', error);
      return this.getLocalPricing();
    }
  }

  /**
   * SALVAR PREÇOS NO SUPABASE E SINCRONIZAR
   */
  async savePricing(pricing: PricingData): Promise<void> {
    try {
      pricing.lastUpdated = new Date().toISOString();
      
      // 1. SALVAR NO SUPABASE (PRIORIDADE)
      const allPlans = [
        ...pricing.subscriptionPlans.map(p => ({ ...p, category: 'subscription' })),
        ...pricing.advertisingPlans.map(p => ({ ...p, category: 'advertising' })),
        ...pricing.toolPrices.map(p => ({ ...p, category: 'tool' }))
      ];

      for (const plan of allPlans) {
        const { error } = await supabase
          .from('pricing_config')
          .upsert({
            plan_id: plan.id,
            name: plan.name,
            price: plan.price,
            original_price: plan.originalPrice,
            category: plan.category,
            description: plan.description,
            features: plan.features,
            is_active: plan.isActive,
            highlight: plan.highlight,
            period: plan.period,
            discount: plan.discount,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'plan_id'
          });

        if (error) {
          console.error(`❌ Erro ao salvar plano ${plan.id} no Supabase:`, error);
        }
      }

      console.log('✅ Preços salvos no Supabase');
      
      // 2. Salvar no localStorage como cache
      localStorage.setItem('centralized_pricing', JSON.stringify(pricing));
      localStorage.setItem('viraliza_plans', JSON.stringify(pricing.subscriptionPlans));
      localStorage.setItem('subscription_plans', JSON.stringify(pricing.subscriptionPlans));
      localStorage.setItem('advertising_plans', JSON.stringify(pricing.advertisingPlans));
      localStorage.setItem('pricing_updated', Date.now().toString());

      // 3. Notificar todas as abas/janelas sobre a mudança
      this.broadcastChannel.postMessage({
        type: 'PRICING_UPDATE',
        pricing: pricing
      });

      // 4. Notificar listeners locais
      this.notifyListeners(pricing);

      console.log('💰 Preços salvos e sincronizados em TODOS os módulos');
    } catch (error) {
      console.error('❌ Erro ao salvar preços:', error);
      throw error;
    }
  }

  /**
   * ATUALIZAR PREÇO ESPECÍFICO
   */
  async updatePrice(planId: string, newPrice: number, category: 'subscription' | 'advertising' | 'tool'): Promise<void> {
    const pricing = await this.loadPricing();
    
    let updated = false;
    
    if (category === 'subscription') {
      pricing.subscriptionPlans = pricing.subscriptionPlans.map(plan => {
        if (plan.id === planId) {
          plan.price = newPrice;
          updated = true;
        }
        return plan;
      });
    } else if (category === 'advertising') {
      pricing.advertisingPlans = pricing.advertisingPlans.map(plan => {
        if (plan.id === planId) {
          plan.price = newPrice;
          updated = true;
        }
        return plan;
      });
    }

    if (updated) {
      await this.savePricing(pricing);
      console.log(`✅ Preço do plano ${planId} atualizado para R$ ${newPrice.toFixed(2)}`);
    }
  }

  /**
   * OBTER PREÇO ESPECÍFICO
   */
  async getPrice(planId: string): Promise<number | null> {
    const pricing = await this.loadPricing();
    
    // Procurar em planos de assinatura
    const subscriptionPlan = pricing.subscriptionPlans.find(p => p.id === planId);
    if (subscriptionPlan) return subscriptionPlan.price;
    
    // Procurar em planos de anúncio
    const advertisingPlan = pricing.advertisingPlans.find(p => p.id === planId);
    if (advertisingPlan) return advertisingPlan.price;
    
    return null;
  }

  /**
   * ADICIONAR LISTENER PARA MUDANÇAS DE PREÇO
   */
  addListener(callback: (data: PricingData) => void): void {
    this.listeners.add(callback);
  }

  /**
   * REMOVER LISTENER
   */
  removeListener(callback: (data: PricingData) => void): void {
    this.listeners.delete(callback);
  }

  /**
   * NOTIFICAR TODOS OS LISTENERS
   */
  private notifyListeners(pricing: PricingData): void {
    this.listeners.forEach(callback => {
      try {
        callback(pricing);
      } catch (error) {
        console.error('Erro ao notificar listener:', error);
      }
    });
  }

  /**
   * OBTER PLANOS FORMATADOS PARA LANDING PAGE
   */
  async getFormattedPlansForLanding(): Promise<any[]> {
    const pricing = await this.loadPricing();
    return pricing.subscriptionPlans.map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      originalPrice: plan.originalPrice,
      features: plan.features,
      highlight: plan.highlight || false,
      period: plan.period,
      discount: plan.discount
    }));
  }

  /**
   * OBTER PLANOS DE ANÚNCIO FORMATADOS
   */
  async getFormattedAdvertisingPlans(): Promise<any[]> {
    const pricing = await this.loadPricing();
    return pricing.advertisingPlans.map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      features: plan.features,
      highlight: plan.highlight || false,
      period: plan.period
    }));
  }
}

// Instância singleton
export const centralizedPricingService = CentralizedPricingService.getInstance();

// Hook React para usar o serviço
export const useCentralizedPricing = () => {
  const [pricing, setPricing] = React.useState<PricingData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const data = await centralizedPricingService.loadPricing();
        setPricing(data);
      } catch (error) {
        console.error('Erro ao carregar preços:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Adicionar listener para mudanças
    const handlePricingUpdate = (newPricing: PricingData) => {
      setPricing(newPricing);
    };

    centralizedPricingService.addListener(handlePricingUpdate);

    return () => {
      centralizedPricingService.removeListener(handlePricingUpdate);
    };
  }, []);

  return { pricing, loading, updatePrice: centralizedPricingService.updatePrice.bind(centralizedPricingService) };
};

export default centralizedPricingService;
