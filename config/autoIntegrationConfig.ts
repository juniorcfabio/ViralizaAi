/**
 * CONFIGURAÇÃO DE INTEGRAÇÃO AUTOMÁTICA
 * Garante que TODA correção e revisão seja automaticamente integrada com:
 * - Supabase (PostgreSQL)
 * - Vercel (Deploy automático)
 * - Sistema de backup e sincronização
 */

import autoSupabase from '../services/autoSupabaseIntegration';

interface IntegrationConfig {
  supabase: {
    enabled: boolean;
    autoSync: boolean;
    syncInterval: number; // em milissegundos
    fallbackToLocalStorage: boolean;
  };
  vercel: {
    enabled: boolean;
    autoDeploy: boolean;
    deployOnChanges: boolean;
  };
  backup: {
    enabled: boolean;
    autoBackup: boolean;
    backupInterval: number; // em milissegundos
  };
}

class AutoIntegrationManager {
  private static instance: AutoIntegrationManager;
  private config: IntegrationConfig;
  private isInitialized = false;

  constructor() {
    this.config = {
      supabase: {
        enabled: true,
        autoSync: true,
        syncInterval: 30000, // 30 segundos
        fallbackToLocalStorage: true
      },
      vercel: {
        enabled: true,
        autoDeploy: false, // Controlado manualmente por segurança
        deployOnChanges: false
      },
      backup: {
        enabled: true,
        autoBackup: true,
        backupInterval: 300000 // 5 minutos
      }
    };
  }

  static getInstance(): AutoIntegrationManager {
    if (!AutoIntegrationManager.instance) {
      AutoIntegrationManager.instance = new AutoIntegrationManager();
    }
    return AutoIntegrationManager.instance;
  }

  /**
   * INICIALIZAÇÃO AUTOMÁTICA DO SISTEMA
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Inicializando sistema de integração automática...');

      // Inicializar Supabase
      if (this.config.supabase.enabled) {
        await autoSupabase.initialize();
        console.log('✅ Supabase inicializado');

        if (this.config.supabase.autoSync) {
          this.startAutoSync();
        }
      }

      // Inicializar sistema de backup
      if (this.config.backup.enabled && this.config.backup.autoBackup) {
        this.startAutoBackup();
      }

      // Interceptar mudanças no localStorage para sincronização automática
      this.interceptLocalStorageChanges();

      this.isInitialized = true;
      console.log('✅ Sistema de integração automática inicializado com sucesso!');

    } catch (error) {
      console.error('❌ Erro ao inicializar sistema de integração:', error);
    }
  }

  /**
   * SINCRONIZAÇÃO AUTOMÁTICA COM SUPABASE
   */
  private startAutoSync(): void {
    setInterval(async () => {
      try {
        await this.syncAllData();
      } catch (error) {
        console.error('❌ Erro na sincronização automática:', error);
      }
    }, this.config.supabase.syncInterval);

    console.log(`🔄 Sincronização automática iniciada (${this.config.supabase.syncInterval / 1000}s)`);
  }

  /**
   * BACKUP AUTOMÁTICO
   */
  private startAutoBackup(): void {
    setInterval(async () => {
      try {
        await this.createBackup();
      } catch (error) {
        console.error('❌ Erro no backup automático:', error);
      }
    }, this.config.backup.backupInterval);

    console.log(`💾 Backup automático iniciado (${this.config.backup.backupInterval / 1000}s)`);
  }

  /**
   * INTERCEPTAR MUDANÇAS NO LOCALSTORAGE
   * Sincroniza automaticamente quando dados são alterados
   */
  private interceptLocalStorageChanges(): void {
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    const originalClear = localStorage.clear;

    // Interceptar setItem
    localStorage.setItem = (key: string, value: string) => {
      originalSetItem.call(localStorage, key, value);
      
      // Sincronizar automaticamente se for dado do ViralizaAI
      if (key.startsWith('viraliza') || key.startsWith('viralizaai')) {
        this.syncSpecificData(key, value);
      }
    };

    // Interceptar removeItem
    localStorage.removeItem = (key: string) => {
      originalRemoveItem.call(localStorage, key);
      
      if (key.startsWith('viraliza') || key.startsWith('viralizaai')) {
        console.log('🗑️ Dado removido do localStorage:', key);
      }
    };

    // Interceptar clear
    localStorage.clear = () => {
      console.log('🗑️ localStorage limpo - fazendo backup antes...');
      this.createBackup();
      originalClear.call(localStorage);
    };

    console.log('👁️ Interceptação de localStorage configurada');
  }

  /**
   * SINCRONIZAR DADO ESPECÍFICO
   */
  private async syncSpecificData(key: string, value: string): Promise<void> {
    try {
      const data = JSON.parse(value);

      switch (key) {
        case 'viraliza_ai_active_user_v1':
          await autoSupabase.saveUser(data);
          break;
        
        case 'viralizaai_payments':
          if (Array.isArray(data)) {
            for (const payment of data) {
              await autoSupabase.savePayment(payment);
            }
          }
          break;
        
        case 'viralizaai_access':
          if (Array.isArray(data)) {
            for (const access of data) {
              await autoSupabase.saveToolAccess(
                access.userId || 'unknown',
                access.toolName,
                access.planName || 'individual',
                access.expiresAt ? new Date(access.expiresAt) : undefined
              );
            }
          }
          break;
        
        case 'viraliza_ai_generated_content':
          if (Array.isArray(data)) {
            for (const content of data) {
              await autoSupabase.saveGeneratedContent(
                content.userId,
                content.toolName,
                content.contentType,
                content.contentData
              );
            }
          }
          break;
      }

      console.log('🔄 Sincronizado automaticamente:', key);
    } catch (error) {
      console.error('❌ Erro ao sincronizar dado específico:', error);
    }
  }

  /**
   * SINCRONIZAR TODOS OS DADOS
   */
  private async syncAllData(): Promise<void> {
    const keys = Object.keys(localStorage);
    const viralizaKeys = keys.filter(key => 
      key.startsWith('viraliza') || key.startsWith('viralizaai')
    );

    for (const key of viralizaKeys) {
      const value = localStorage.getItem(key);
      if (value) {
        await this.syncSpecificData(key, value);
      }
    }

    console.log('🔄 Sincronização completa realizada');
  }

  /**
   * CRIAR BACKUP
   */
  private async createBackup(): Promise<void> {
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        localStorage: { ...localStorage },
        version: '1.0'
      };

      // Salvar backup no Supabase
      await autoSupabase.saveGeneratedContent(
        'system',
        'backup',
        'full_backup',
        backupData
      );

      console.log('💾 Backup criado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar backup:', error);
    }
  }

  /**
   * FORÇAR SINCRONIZAÇÃO MANUAL
   */
  async forcSync(): Promise<void> {
    console.log('🔄 Forçando sincronização manual...');
    await this.syncAllData();
    console.log('✅ Sincronização manual concluída');
  }

  /**
   * VERIFICAR STATUS DA INTEGRAÇÃO
   */
  getStatus(): any {
    return {
      initialized: this.isInitialized,
      config: this.config,
      supabaseConnected: true, // TODO: verificar conexão real
      lastSync: new Date().toISOString()
    };
  }

  /**
   * ATUALIZAR CONFIGURAÇÃO
   */
  updateConfig(newConfig: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuração atualizada:', this.config);
  }
}

// Instância global
export const autoIntegration = AutoIntegrationManager.getInstance();

// Auto-inicialização quando o módulo é carregado
if (typeof window !== 'undefined') {
  autoIntegration.initialize();
}

export default autoIntegration;
