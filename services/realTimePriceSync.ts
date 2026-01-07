// SISTEMA DE SINCRONIZAÇÃO EM TEMPO REAL ULTRA-ROBUSTO
// Garante sincronização instantânea entre módulos admin e usuário

interface PriceUpdate {
  toolId: string;
  toolName: string;
  newPrice: number;
  timestamp: number;
}

class RealTimePriceSyncService {
  private static instance: RealTimePriceSyncService;
  private listeners: Map<string, Set<(price: number) => void>> = new Map();
  private broadcastChannel: BroadcastChannel;
  private storageWatcher: number | null = null;
  private lastKnownPrices: Map<string, number> = new Map();

  constructor() {
    // Canal de comunicação entre abas/janelas
    this.broadcastChannel = new BroadcastChannel('viraliza_price_sync');
    this.setupBroadcastListener();
    this.setupStorageWatcher();
    this.loadInitialPrices();
  }

  static getInstance(): RealTimePriceSyncService {
    if (!RealTimePriceSyncService.instance) {
      RealTimePriceSyncService.instance = new RealTimePriceSyncService();
    }
    return RealTimePriceSyncService.instance;
  }

  // Configurar listener do BroadcastChannel
  private setupBroadcastListener(): void {
    this.broadcastChannel.onmessage = (event) => {
      const update: PriceUpdate = event.data;
      console.log('📡 Recebido via BroadcastChannel:', update);
      this.notifyListeners(update.toolId, update.newPrice);
    };
  }

  // Configurar watcher do localStorage
  private setupStorageWatcher(): void {
    this.storageWatcher = window.setInterval(() => {
      this.checkForPriceChanges();
    }, 50); // Verificar a cada 50ms para máxima responsividade
  }

  // Carregar preços iniciais
  private loadInitialPrices(): void {
    try {
      const savedPricing = localStorage.getItem('admin_tools_pricing');
      if (savedPricing) {
        const tools = JSON.parse(savedPricing);
        tools.forEach((tool: any) => {
          this.lastKnownPrices.set(tool.id, tool.currentPrice);
        });
      }
    } catch (error) {
      console.error('Erro ao carregar preços iniciais:', error);
    }
  }

  // Verificar mudanças de preços
  private checkForPriceChanges(): void {
    try {
      const savedPricing = localStorage.getItem('admin_tools_pricing');
      if (!savedPricing) return;

      const tools = JSON.parse(savedPricing);
      tools.forEach((tool: any) => {
        const lastPrice = this.lastKnownPrices.get(tool.id);
        const currentPrice = tool.currentPrice;

        if (lastPrice !== currentPrice) {
          console.log(`💰 Preço alterado detectado: ${tool.name} ${lastPrice} → ${currentPrice}`);
          this.lastKnownPrices.set(tool.id, currentPrice);
          
          // Notificar via BroadcastChannel
          this.broadcastChannel.postMessage({
            toolId: tool.id,
            toolName: tool.name,
            newPrice: currentPrice,
            timestamp: Date.now()
          });

          // Notificar listeners locais
          this.notifyListeners(tool.id, currentPrice);
        }
      });
    } catch (error) {
      console.error('Erro ao verificar mudanças de preços:', error);
    }
  }

  // Notificar listeners
  private notifyListeners(toolId: string, newPrice: number): void {
    const toolListeners = this.listeners.get(toolId);
    if (toolListeners) {
      toolListeners.forEach(callback => {
        try {
          callback(newPrice);
        } catch (error) {
          console.error('Erro ao notificar listener:', error);
        }
      });
    }
  }

  // Registrar listener para uma ferramenta específica
  public onPriceChange(toolId: string, callback: (price: number) => void): void {
    if (!this.listeners.has(toolId)) {
      this.listeners.set(toolId, new Set());
    }
    this.listeners.get(toolId)!.add(callback);
    
    // Enviar preço atual imediatamente
    const currentPrice = this.getCurrentPrice(toolId);
    if (currentPrice > 0) {
      callback(currentPrice);
    }
  }

  // Remover listener
  public removeListener(toolId: string, callback: (price: number) => void): void {
    const toolListeners = this.listeners.get(toolId);
    if (toolListeners) {
      toolListeners.delete(callback);
    }
  }

  // Obter preço atual
  public getCurrentPrice(toolId: string): number {
    try {
      const savedPricing = localStorage.getItem('admin_tools_pricing');
      if (savedPricing) {
        const tools = JSON.parse(savedPricing);
        const tool = tools.find((t: any) => t.id === toolId);
        return tool ? tool.currentPrice : 0;
      }
    } catch (error) {
      console.error('Erro ao obter preço atual:', error);
    }
    return 0;
  }

  // Forçar sincronização
  public forceSyncAll(): void {
    console.log('🔄 Forçando sincronização de todos os preços...');
    this.loadInitialPrices();
    this.checkForPriceChanges();
  }

  // Cleanup
  public destroy(): void {
    if (this.storageWatcher) {
      clearInterval(this.storageWatcher);
    }
    this.broadcastChannel.close();
    this.listeners.clear();
  }
}

export default RealTimePriceSyncService;
