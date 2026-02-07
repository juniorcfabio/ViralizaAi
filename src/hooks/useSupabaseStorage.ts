// HOOK REACT PARA PERSISTÊNCIA SUPABASE - ZERO PERDA DE DADOS
import { useState, useEffect, useCallback } from 'react';
import { supabaseStorage } from '../services/supabaseStorage';

// Hook para configurações
export function useSupabaseSetting<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar valor inicial
  useEffect(() => {
    const loadSetting = async () => {
      try {
        setLoading(true);
        const savedValue = await supabaseStorage.getSetting(key);
        if (savedValue !== null) {
          setValue(savedValue);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar configuração');
        console.error(`❌ Erro ao carregar configuração '${key}':`, err);
      } finally {
        setLoading(false);
      }
    };

    loadSetting();
  }, [key]);

  // Salvar valor
  const updateValue = useCallback(async (newValue: T) => {
    try {
      setError(null);
      setValue(newValue);
      
      const success = await supabaseStorage.saveSetting(key, newValue);
      if (!success) {
        throw new Error('Falha ao salvar no Supabase');
      }
      
      console.log(`✅ Configuração '${key}' salva automaticamente`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configuração');
      console.error(`❌ Erro ao salvar configuração '${key}':`, err);
    }
  }, [key]);

  return {
    value,
    setValue: updateValue,
    loading,
    error
  };
}

// Hook para dados do dashboard
export function useSupabaseDashboard<T>(dataType: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const savedData = await supabaseStorage.getDashboardData(dataType);
        if (savedData !== null) {
          setData(savedData as T);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        console.error(`❌ Erro ao carregar dados do dashboard '${dataType}':`, err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dataType]);

  // Salvar dados
  const updateData = useCallback(async (newData: T) => {
    try {
      setError(null);
      setData(newData);
      
      const success = await supabaseStorage.saveDashboardData(dataType, newData as Record<string, any>);
      if (!success) {
        throw new Error('Falha ao salvar no Supabase');
      }
      
      console.log(`✅ Dados do dashboard '${dataType}' salvos automaticamente`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar dados');
      console.error(`❌ Erro ao salvar dados do dashboard '${dataType}':`, err);
    }
  }, [dataType]);

  return {
    data,
    setData: updateData,
    loading,
    error
  };
}

// Hook para perfil do usuário
export function useUserProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar perfil
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const userProfile = await supabaseStorage.getUserProfile();
        setProfile(userProfile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar perfil');
        console.error('❌ Erro ao carregar perfil:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Atualizar perfil
  const updateProfile = useCallback(async (updates: any) => {
    try {
      setError(null);
      const success = await supabaseStorage.updateUserProfile(updates);
      if (success) {
        setProfile((prev: any) => ({ ...prev, ...updates }));
        console.log('✅ Perfil atualizado automaticamente');
      } else {
        throw new Error('Falha ao atualizar perfil');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perfil');
      console.error('❌ Erro ao atualizar perfil:', err);
    }
  }, []);

  return {
    profile,
    updateProfile,
    loading,
    error
  };
}

// Hook para conteúdo gerado
export function useGeneratedContent(contentType?: string) {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar conteúdo
  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      const generatedContent = await supabaseStorage.getGeneratedContent(contentType);
      setContent(generatedContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar conteúdo');
      console.error('❌ Erro ao carregar conteúdo gerado:', err);
    } finally {
      setLoading(false);
    }
  }, [contentType]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Salvar novo conteúdo
  const saveContent = useCallback(async (newContent: any) => {
    try {
      setError(null);
      const contentId = await supabaseStorage.saveGeneratedContent(newContent);
      if (contentId) {
        await loadContent(); // Recarregar lista
        console.log('✅ Conteúdo salvo automaticamente');
        return contentId;
      } else {
        throw new Error('Falha ao salvar conteúdo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar conteúdo');
      console.error('❌ Erro ao salvar conteúdo:', err);
      return null;
    }
  }, [loadContent]);

  return {
    content,
    saveContent,
    loadContent,
    loading,
    error
  };
}

// Hook para log de atividades
export function useActivityLogger() {
  const logActivity = useCallback(async (action: string, details?: Record<string, any>) => {
    try {
      await supabaseStorage.logActivity({
        action,
        details: details || {},
        resource_type: 'user_action'
      });
    } catch (err) {
      console.error('❌ Erro ao registrar atividade:', err);
    }
  }, []);

  return { logActivity };
}

// Hook para migração automática
export function useAutoMigration() {
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'completed' | 'error'>('idle');

  useEffect(() => {
    const performMigration = async () => {
      try {
        setMigrationStatus('migrating');
        console.log('🔄 Iniciando migração automática...');
        
        const success = await supabaseStorage.migrateFromLocalStorage();
        if (success) {
          setMigrationStatus('completed');
          console.log('✅ Migração automática concluída');
          
          // Iniciar sincronização automática
          supabaseStorage.startAutoSync(30000); // 30 segundos
        } else {
          setMigrationStatus('error');
        }
      } catch (err) {
        console.error('❌ Erro na migração automática:', err);
        setMigrationStatus('error');
      }
    };

    // Executar migração apenas uma vez
    if (migrationStatus === 'idle') {
      performMigration();
    }
  }, [migrationStatus]);

  return { migrationStatus };
}
