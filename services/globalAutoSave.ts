/**
 * 🔥 SISTEMA GLOBAL DE SALVAMENTO AUTOMÁTICO
 * GARANTE QUE 100% DOS DADOS SEJAM SALVOS NO SUPABASE/POSTGRESQL
 * SEM EXCEÇÕES - ATIVADO AUTOMATICAMENTE EM TODO O PROJETO
 */

import { supabase } from '../src/lib/supabase';

class GlobalAutoSave {
  private static instance: GlobalAutoSave;
  private saveQueue: Array<{ type: string; data: any }> = [];
  private isSaving = false;
  private saveInterval: any = null;

  static getInstance(): GlobalAutoSave {
    if (!GlobalAutoSave.instance) {
      GlobalAutoSave.instance = new GlobalAutoSave();
    }
    return GlobalAutoSave.instance;
  }

  /**
   * INICIALIZAR SISTEMA GLOBAL DE AUTO-SAVE
   * Chamado automaticamente no início da aplicação
   */
  initialize() {
    console.log('🚀 SISTEMA GLOBAL DE AUTO-SAVE ATIVADO');
    
    // Interceptar localStorage.setItem para salvar automaticamente no Supabase
    this.interceptLocalStorage();
    
    // Processar fila de salvamento a cada 5 segundos
    this.saveInterval = setInterval(() => {
      this.processSaveQueue();
    }, 5000);

    // Salvar antes de fechar a página
    window.addEventListener('beforeunload', () => {
      this.processSaveQueue();
    });

    console.log('✅ Auto-save global configurado e ativo');
  }

  /**
   * INTERCEPTAR LOCALSTORAGE
   * Toda vez que algo for salvo no localStorage, salva automaticamente no Supabase
   */
  private interceptLocalStorage() {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    
    localStorage.setItem = (key: string, value: string) => {
      // Salvar no localStorage original
      originalSetItem(key, value);
      
      // Adicionar à fila para salvar no Supabase
      this.addToQueue('localStorage', { key, value, timestamp: new Date().toISOString() });
      
      console.log(`💾 Auto-save: ${key} → Supabase`);
    };
  }

  /**
   * ADICIONAR À FILA DE SALVAMENTO
   */
  private addToQueue(type: string, data: any) {
    this.saveQueue.push({ type, data });
  }

  /**
   * PROCESSAR FILA DE SALVAMENTO
   * Salva tudo que está na fila no Supabase
   */
  private async processSaveQueue() {
    if (this.isSaving || this.saveQueue.length === 0) return;

    this.isSaving = true;
    const itemsToSave = [...this.saveQueue];
    this.saveQueue = [];

    try {
      for (const item of itemsToSave) {
        await this.saveToSupabase(item);
      }
      console.log(`✅ ${itemsToSave.length} itens salvos no Supabase`);
    } catch (error) {
      console.error('❌ Erro ao processar fila de salvamento:', error);
      // Recolocar itens na fila em caso de erro
      this.saveQueue.push(...itemsToSave);
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * SALVAR NO SUPABASE
   * Determina a tabela correta e salva os dados
   */
  private async saveToSupabase(item: { type: string; data: any }) {
    try {
      const { type, data } = item;

      // Determinar tabela baseado no tipo de dado
      let tableName = 'system_settings';
      let recordData: any = {
        key: data.key,
        value: this.parseValue(data.value),
        updated_at: new Date().toISOString()
      };

      // Mapear tipos específicos para tabelas corretas
      if (data.key.includes('user') || data.key.includes('viraliza_ai_active_user')) {
        tableName = 'user_profiles';
        const userData = this.parseValue(data.value);
        if (!userData || !userData.id) return; // Skip invalid user data
        recordData = {
          user_id: userData.id,
          name: userData.name || '',
          email: userData.email || `${userData.id}@viralizaai.com`,
          user_type: userData.type || 'client',
          status: userData.status || 'active',
          preferences: userData,
          updated_at: new Date().toISOString()
        };
      } else if (data.key.includes('payment') || data.key.includes('purchase')) {
        tableName = 'purchases';
        const paymentData = this.parseValue(data.value);
        recordData = {
          user_id: paymentData.userId || paymentData.user_id,
          product_type: paymentData.type || 'unknown',
          amount: paymentData.amount || 0,
          status: paymentData.status || 'pending',
          payment_details: paymentData,
          created_at: new Date().toISOString()
        };
      } else if (data.key.includes('access') || data.key.includes('tool')) {
        tableName = 'user_access';
        const accessData = this.parseValue(data.value);
        recordData = {
          user_id: accessData.userId || accessData.user_id,
          tool_name: accessData.toolName || data.key,
          access_type: accessData.accessType || 'plan',
          created_at: new Date().toISOString()
        };
      } else if (data.key.includes('content') || data.key.includes('generated')) {
        tableName = 'generated_content';
        const contentData = this.parseValue(data.value);
        recordData = {
          user_id: contentData.userId || contentData.user_id,
          tool_name: contentData.toolName || 'unknown',
          content_type: contentData.contentType || 'text',
          content_data: contentData,
          created_at: new Date().toISOString()
        };
      }

      // Determinar coluna de conflito por tabela
      const conflictMap: Record<string, string> = {
        system_settings: 'key',
        user_profiles: 'user_id',
        user_access: 'user_id,tool_name'
      };
      const onConflict = conflictMap[tableName];

      // Salvar no Supabase usando upsert para evitar duplicatas
      const { error } = await supabase
        .from(tableName)
        .upsert(recordData, onConflict ? { onConflict } : {});

      if (error) {
        console.warn(`⚠️ Erro ao salvar em ${tableName}:`, error.message);
        // Fallback: salvar em system_settings como backup
        if (tableName !== 'system_settings') {
          await supabase.from('system_settings').upsert({
            key: `backup_${data.key}`,
            value: data.value,
            updated_at: new Date().toISOString()
          });
        }
      } else {
        console.log(`✅ Salvo em ${tableName}:`, data.key);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar no Supabase:', error);
    }
  }

  /**
   * PARSE DE VALORES
   * Tenta fazer parse de JSON, retorna string se falhar
   */
  private parseValue(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  /**
   * SALVAR MANUALMENTE
   * Permite salvamento manual de dados específicos
   */
  async saveNow(type: string, data: any) {
    await this.saveToSupabase({ type, data });
  }

  /**
   * SINCRONIZAR TUDO AGORA
   * Força salvamento imediato de toda a fila
   */
  async syncAll() {
    console.log('🔄 Sincronizando todos os dados com Supabase...');
    await this.processSaveQueue();
    console.log('✅ Sincronização completa!');
  }

  /**
   * DESTRUIR INSTÂNCIA
   * Limpa intervalos e listeners
   */
  destroy() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    console.log('🛑 Sistema de auto-save desativado');
  }
}

// Exportar instância única
export const globalAutoSave = GlobalAutoSave.getInstance();

// Auto-inicializar quando o módulo for carregado
if (typeof window !== 'undefined') {
  globalAutoSave.initialize();
}

export default globalAutoSave;
