/**
 * Serviço de Persistência de Dados do Usuário
 * Garante que todos os trabalhos e dados cadastrais sejam salvos
 */

export interface UserWorkData {
  userId: string;
  ebooks: any[];
  videos: any[];
  funnels: any[];
  campaigns: any[];
  analytics: any[];
  socialPosts: any[];
  affiliateData: any;
  createdAt: string;
  updatedAt: string;
}

class UserDataPersistenceService {
  private static instance: UserDataPersistenceService;
  private readonly STORAGE_KEY = 'viraliza_user_work_data_v2';

  static getInstance(): UserDataPersistenceService {
    if (!UserDataPersistenceService.instance) {
      UserDataPersistenceService.instance = new UserDataPersistenceService();
    }
    return UserDataPersistenceService.instance;
  }

  /**
   * Salva dados de trabalho do usuário
   */
  saveUserWork(userId: string, workType: string, data: any): void {
    try {
      const existingData = this.getUserWorkData(userId);
      
      // Atualizar dados específicos do tipo de trabalho
      switch (workType) {
        case 'ebook':
          existingData.ebooks.push({
            ...data,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
          });
          break;
        case 'video':
          existingData.videos.push({
            ...data,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
          });
          break;
        case 'funnel':
          existingData.funnels.push({
            ...data,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
          });
          break;
        case 'campaign':
          existingData.campaigns.push({
            ...data,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
          });
          break;
        case 'analytics':
          existingData.analytics.push({
            ...data,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
          });
          break;
        case 'socialPost':
          existingData.socialPosts.push({
            ...data,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
          });
          break;
        case 'affiliate':
          existingData.affiliateData = {
            ...existingData.affiliateData,
            ...data,
            updatedAt: new Date().toISOString()
          };
          break;
      }

      existingData.updatedAt = new Date().toISOString();
      
      // Salvar no localStorage com backup
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingData));
      
      // Backup adicional no sessionStorage
      sessionStorage.setItem(`${this.STORAGE_KEY}_backup`, JSON.stringify(existingData));
      
      console.log(`✅ Dados de ${workType} salvos para usuário ${userId}`);
      
    } catch (error) {
      console.error('❌ Erro ao salvar dados do usuário:', error);
      this.emergencyBackup(userId, workType, data);
    }
  }

  /**
   * Recupera todos os dados de trabalho do usuário
   */
  getUserWorkData(userId: string): UserWorkData {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.userId === userId) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('❌ Erro ao recuperar dados:', error);
    }

    // Retornar estrutura vazia se não encontrar dados
    return {
      userId,
      ebooks: [],
      videos: [],
      funnels: [],
      campaigns: [],
      analytics: [],
      socialPosts: [],
      affiliateData: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Backup de emergência em caso de falha
   */
  private emergencyBackup(userId: string, workType: string, data: any): void {
    try {
      const backupKey = `viraliza_emergency_backup_${userId}_${workType}_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify({
        userId,
        workType,
        data,
        timestamp: new Date().toISOString()
      }));
      console.log(`🚨 Backup de emergência criado: ${backupKey}`);
    } catch (error) {
      console.error('❌ Falha no backup de emergência:', error);
    }
  }

  /**
   * Restaura dados após confirmação de pagamento
   */
  restoreUserDataAfterPayment(userId: string): UserWorkData {
    const userData = this.getUserWorkData(userId);
    console.log(`🔄 Dados restaurados para usuário ${userId} após pagamento`);
    return userData;
  }

  /**
   * Limpa dados de usuários não pagantes (apenas trial expirado)
   */
  cleanupExpiredTrialData(userId: string): void {
    try {
      // Manter apenas dados de afiliados (sempre liberado)
      const userData = this.getUserWorkData(userId);
      const cleanedData: UserWorkData = {
        userId,
        ebooks: [],
        videos: [],
        funnels: [],
        campaigns: [],
        analytics: [],
        socialPosts: [],
        affiliateData: userData.affiliateData, // Preservar dados de afiliados
        createdAt: userData.createdAt,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanedData));
      console.log(`🧹 Dados de trial expirado limpos para usuário ${userId}`);
      
    } catch (error) {
      console.error('❌ Erro ao limpar dados de trial:', error);
    }
  }

  /**
   * Exporta dados do usuário para backup
   */
  exportUserData(userId: string): string {
    const userData = this.getUserWorkData(userId);
    return JSON.stringify(userData, null, 2);
  }

  /**
   * Importa dados do usuário de backup
   */
  importUserData(userId: string, backupData: string): boolean {
    try {
      const data = JSON.parse(backupData);
      data.userId = userId;
      data.updatedAt = new Date().toISOString();
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log(`📥 Dados importados para usuário ${userId}`);
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao importar dados:', error);
      return false;
    }
  }
}

export default UserDataPersistenceService;
