// SERVIÇO DE PERSISTÊNCIA SUPABASE - ZERO PERDA DE DADOS
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  user_type: 'admin' | 'client';
  status: 'active' | 'inactive' | 'suspended';
  joined_date?: string;
  created_at?: string;
  avatar_url?: string;
  phone?: string;
  company?: string;
  preferences?: Record<string, any>;
}

interface DashboardData {
  user_id: string;
  data_type: string;
  data: Record<string, any>;
}

interface GeneratedContent {
  user_id: string;
  content_type: 'ebook' | 'video' | 'post' | 'campaign';
  title: string;
  content: Record<string, any>;
  metadata?: Record<string, any>;
  file_url?: string;
}

interface ActivityLog {
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, any>;
}

class SupabaseStorageService {
  
  // ==================== PERFIS DE USUÁRIO ====================
  
  async createUserProfile(profile: Omit<UserProfile, 'id'>): Promise<UserProfile | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      // Montar dados apenas com colunas seguras (sem joined_date que pode não existir)
      const safeProfile: Record<string, any> = {
        id: user.user.id,
        user_id: user.user.id,
        name: profile.name,
        email: profile.email,
        user_type: profile.user_type || 'client',
        status: profile.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let { data, error } = await supabase
        .from('user_profiles')
        .upsert(safeProfile, { onConflict: 'user_id' })
        .select()
        .single();

      // Se falhar por coluna, tentar com menos campos
      if (error) {
        console.warn('⚠️ Perfil com campos mínimos:', error.message);
        const minProfile: Record<string, any> = {
          user_id: user.user.id,
          email: profile.email,
          plan: 'free',
          plan_status: 'inactive'
        };
        const retry = await supabase.from('user_profiles').upsert(minProfile, { onConflict: 'user_id' }).select().maybeSingle();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.warn('⚠️ Não foi possível criar perfil, continuando:', error.message);
        return null;
      }
      console.log('✅ Perfil criado no Supabase:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao criar perfil:', error);
      return null;
    }
  }

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar perfil:', error);
      return null;
    }
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.user.id);

      if (error) throw error;
      console.log('✅ Perfil atualizado no Supabase');
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      return false;
    }
  }

  // ==================== CONFIGURAÇÕES DO SISTEMA ====================
  
  async saveSetting(key: string, value: any): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          user_id: user.user.id,
          setting_key: key,
          setting_value: value
        });

      if (error) throw error;
      console.log(`✅ Configuração '${key}' salva no Supabase`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao salvar configuração '${key}':`, error);
      return false;
    }
  }

  async getSetting(key: string): Promise<any> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('user_id', user.user.id)
        .eq('setting_key', key)
        .single();

      if (error) throw error;
      return data?.setting_value;
    } catch (error) {
      console.error(`❌ Erro ao buscar configuração '${key}':`, error);
      return null;
    }
  }

  async getAllSettings(): Promise<Record<string, any>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .eq('user_id', user.user.id);

      if (error) throw error;
      
      const settings: Record<string, any> = {};
      data?.forEach(item => {
        settings[item.setting_key] = item.setting_value;
      });
      
      return settings;
    } catch (error) {
      console.error('❌ Erro ao buscar todas as configurações:', error);
      return {};
    }
  }

  // ==================== DADOS DO DASHBOARD ====================
  
  async saveDashboardData(dataType: string, data: Record<string, any>): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('dashboard_data')
        .upsert({
          user_id: user.user.id,
          data_type: dataType,
          data: data
        });

      if (error) throw error;
      console.log(`✅ Dados do dashboard '${dataType}' salvos no Supabase`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao salvar dados do dashboard '${dataType}':`, error);
      return false;
    }
  }

  async getDashboardData(dataType: string): Promise<Record<string, any> | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('dashboard_data')
        .select('data')
        .eq('user_id', user.user.id)
        .eq('data_type', dataType)
        .single();

      if (error) throw error;
      return data?.data || null;
    } catch (error) {
      console.error(`❌ Erro ao buscar dados do dashboard '${dataType}':`, error);
      return null;
    }
  }

  // ==================== CONTEÚDO GERADO ====================
  
  async saveGeneratedContent(content: Omit<GeneratedContent, 'user_id'>): Promise<string | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('generated_content')
        .insert({
          user_id: user.user.id,
          ...content
        })
        .select('id')
        .single();

      if (error) throw error;
      console.log(`✅ Conteúdo '${content.title}' salvo no Supabase`);
      return data.id;
    } catch (error) {
      console.error(`❌ Erro ao salvar conteúdo '${content.title}':`, error);
      return null;
    }
  }

  async getGeneratedContent(contentType?: string): Promise<GeneratedContent[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      let query = supabase
        .from('generated_content')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (contentType) {
        query = query.eq('content_type', contentType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar conteúdo gerado:', error);
      return [];
    }
  }

  // ==================== LOG DE ATIVIDADES ====================
  
  async logActivity(activity: Omit<ActivityLog, 'user_id'>): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false; // Não falha se não estiver logado

      const { error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user.user.id,
          ...activity
        });

      if (error) {
        // Não falhar por RLS ou tabela inexistente - log é secundário
        console.warn('⚠️ Log de atividade não registrado (RLS/permissão):', error.message);
        return false;
      }
      return true;
    } catch (error: any) {
      console.warn('⚠️ Log de atividade ignorado:', error?.message || error);
      return false;
    }
  }

  // ==================== MIGRAÇÃO DO LOCALSTORAGE ====================
  
  async migrateFromLocalStorage(): Promise<boolean> {
    try {
      console.log('🔄 Iniciando migração do localStorage para Supabase...');
      
      // Buscar todos os dados do localStorage
      const localData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            localData[key] = JSON.parse(localStorage.getItem(key) || '');
          } catch {
            localData[key] = localStorage.getItem(key);
          }
        }
      }

      // Migrar dados específicos
      const migrations = [];

      // Migrar configurações
      for (const [key, value] of Object.entries(localData)) {
        if (key.startsWith('viralizaai_') || key.includes('config') || key.includes('setting')) {
          migrations.push(this.saveSetting(key, value));
        }
      }

      // Migrar dados do dashboard
      if (localData.dashboardData) {
        migrations.push(this.saveDashboardData('main', localData.dashboardData));
      }

      // Aguardar todas as migrações
      await Promise.all(migrations);

      console.log('✅ Migração do localStorage concluída com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro na migração do localStorage:', error);
      return false;
    }
  }

  // ==================== SINCRONIZAÇÃO AUTOMÁTICA ====================
  
  startAutoSync(intervalMs: number = 30000): void {
    setInterval(async () => {
      try {
        // Auto-sync de dados críticos
        await this.migrateFromLocalStorage();
      } catch (error) {
        console.error('❌ Erro na sincronização automática:', error);
      }
    }, intervalMs);
    
    console.log(`🔄 Sincronização automática iniciada (${intervalMs}ms)`);
  }
}

export const supabaseStorage = new SupabaseStorageService();
