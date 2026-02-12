// SERVIÇO DE SINCRONIZAÇÃO DE PREÇOS EM TEMPO REAL
// Garante que alterações no painel admin sejam refletidas instantaneamente no módulo usuário

interface ToolPrice {
  id: string;
  name: string;
  currentPrice: number;
  category: string;
  description: string;
  isActive: boolean;
}

class PriceSyncService {
  private static instance: PriceSyncService;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Monitorar mudanças no localStorage
    this.setupStorageListener();
  }

  static getInstance(): PriceSyncService {
    if (!PriceSyncService.instance) {
      PriceSyncService.instance = new PriceSyncService();
    }
    return PriceSyncService.instance;
  }

  // Configurar listener para mudanças no localStorage
  private setupStorageListener(): void {
    window.addEventListener('storage', (e) => {
      if (e.key === 'admin_tools_pricing' || e.key === 'pricing_updated') {
        console.log('🔄 Preços atualizados, sincronizando...');
        this.notifyListeners();
      }
    });

    // Também monitorar mudanças na mesma aba
    setInterval(() => {
      const lastUpdate = localStorage.getItem('pricing_updated');
      const currentUpdate = localStorage.getItem('current_pricing_timestamp');
      
      if (lastUpdate && lastUpdate !== currentUpdate) {
        localStorage.setItem('current_pricing_timestamp', lastUpdate);
        this.notifyListeners();
      }
    }, 1000);
  }

  // Obter preços atualizados
  getUpdatedPrices(): ToolPrice[] {
    const savedPricing = localStorage.getItem('admin_tools_pricing');
    if (savedPricing) {
      return JSON.parse(savedPricing);
    }
    return [];
  }

  // Método para obter preço de uma ferramenta específica
  getToolPrice(toolId: string): number {
    try {
      const savedPricing = localStorage.getItem('admin_tools_pricing');
      if (!savedPricing) return 0;
      
      const tools = JSON.parse(savedPricing);
      
      // Tentar diferentes variações do ID
      const possibleIds = [
        toolId,
        toolId.replace('-', '_'),
        toolId.replace('_', '-'),
        'ai-video-generator',
        'ai_video_generator',
        'gerador-video-ia-8k',
        'gerador_video_ia_8k'
      ];
      
      let tool = null;
      for (const id of possibleIds) {
        tool = tools.find((t: any) => t.id === id);
        if (tool) break;
      }
      
      // Se não encontrou, procurar por nome
      if (!tool) {
        tool = tools.find((t: any) => 
          t.name?.toLowerCase().includes('video') || 
          t.name?.toLowerCase().includes('gerador')
        );
      }
      
      const price = tool ? tool.currentPrice : 0;
      console.log(` Preço obtido para ${toolId}:`, price, 'Tool encontrada:', tool);
      
      return price;
    } catch (error) {
      console.error('Erro ao obter preço da ferramenta:', error);
      return 0;
    }
  }

  // Verificar se ferramenta está ativa
  isToolActive(toolId: string): boolean {
    const prices = this.getUpdatedPrices();
    const tool = prices.find(t => t.id === toolId);
    return tool ? tool.isActive : true;
  }

  // Registrar listener para mudanças de preço
  onPriceUpdate(callback: () => void): void {
    this.listeners.add(callback);
  }

  // Remover listener
  removePriceListener(callback: () => void): void {
    this.listeners.delete(callback);
  }

  // Notificar todos os listeners
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Erro ao notificar listener de preço:', error);
      }
    });
  }

  // Forçar atualização de preços
  forcePriceUpdate(): void {
    localStorage.setItem('pricing_updated', Date.now().toString());
    // SYNC COM SUPABASE
    import('../src/lib/supabase').then(({ supabase }) => {
      supabase.from('system_settings').upsert({ key: 'pricing_updated', value: { timestamp: Date.now() }, updated_at: new Date().toISOString() }).then(() => {});
    });
    this.notifyListeners();
  }

  // Obter preços formatados para exibição
  getFormattedPrice(toolId: string): string {
    const price = this.getToolPrice(toolId);
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  }

  // Obter dados completos da ferramenta
  getToolData(toolId: string): ToolPrice | null {
    const prices = this.getUpdatedPrices();
    return prices.find(t => t.id === toolId) || null;
  }
}

export default PriceSyncService;
export type { ToolPrice };
