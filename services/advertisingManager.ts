// SISTEMA DE GERENCIAMENTO DE ANÚNCIOS
// Controla expiração automática e renovação de anúncios

interface ActiveAdvertisement {
  id: string;
  name: string;
  category: string;
  description: string;
  website: string;
  instagram: string;
  logo: string;
  contactEmail: string;
  contactPhone: string;
  advertiserId: string;
  planId: string;
  planName: string;
  startDate: string;
  expirationDate: string;
  isActive: boolean;
  isPaid: boolean;
}

class AdvertisingManager {
  private static instance: AdvertisingManager;

  static getInstance(): AdvertisingManager {
    if (!AdvertisingManager.instance) {
      AdvertisingManager.instance = new AdvertisingManager();
    }
    return AdvertisingManager.instance;
  }

  // Obter anúncios ativos
  getActiveAdvertisements(): ActiveAdvertisement[] {
    try {
      const activePartners = localStorage.getItem('active_partners');
      if (!activePartners) return [];

      const partners: ActiveAdvertisement[] = JSON.parse(activePartners);
      const now = new Date();

      // Filtrar apenas anúncios ativos e não expirados
      return partners.filter(partner => {
        const expirationDate = new Date(partner.expirationDate);
        return partner.isActive && partner.isPaid && expirationDate > now;
      });
    } catch (error) {
      console.error('Erro ao obter anúncios ativos:', error);
      return [];
    }
  }

  // Verificar e remover anúncios expirados
  checkAndRemoveExpiredAds(): void {
    try {
      const activePartners = localStorage.getItem('active_partners');
      if (!activePartners) return;

      const partners: ActiveAdvertisement[] = JSON.parse(activePartners);
      const now = new Date();
      let hasExpiredAds = false;

      // Marcar anúncios expirados como inativos
      const updatedPartners = partners.map(partner => {
        const expirationDate = new Date(partner.expirationDate);
        if (partner.isActive && expirationDate <= now) {
          console.log(`📅 Anúncio expirado: ${partner.name} - Expirou em ${expirationDate.toLocaleDateString()}`);
          hasExpiredAds = true;
          return {
            ...partner,
            isActive: false
          };
        }
        return partner;
      });

      if (hasExpiredAds) {
        localStorage.setItem('active_partners', JSON.stringify(updatedPartners));
        // SYNC COM SUPABASE
        import('../src/lib/supabase').then(({ supabase }) => {
          supabase.from('system_settings').upsert({ key: 'active_partners', value: updatedPartners, updated_at: new Date().toISOString() }).then(() => {});
        });
        console.log('🔄 Anúncios expirados removidos e sincronizados');
      }
    } catch (error) {
      console.error('Erro ao verificar anúncios expirados:', error);
    }
  }

  // Obter anúncios próximos do vencimento (últimos 3 dias)
  getAdsNearExpiration(): ActiveAdvertisement[] {
    try {
      const activeAds = this.getActiveAdvertisements();
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

      return activeAds.filter(ad => {
        const expirationDate = new Date(ad.expirationDate);
        return expirationDate <= threeDaysFromNow;
      });
    } catch (error) {
      console.error('Erro ao obter anúncios próximos do vencimento:', error);
      return [];
    }
  }

  // Renovar anúncio
  renewAdvertisement(advertisementId: string, newPlanId: string, planDays: number): boolean {
    try {
      const activePartners = localStorage.getItem('active_partners');
      if (!activePartners) return false;

      const partners: ActiveAdvertisement[] = JSON.parse(activePartners);
      const partnerIndex = partners.findIndex(p => p.id === advertisementId);

      if (partnerIndex === -1) return false;

      const partner = partners[partnerIndex];
      const currentExpiration = new Date(partner.expirationDate);
      const now = new Date();

      // Se ainda não expirou, estender a partir da data de expiração atual
      // Se já expirou, começar a partir de agora
      const startDate = currentExpiration > now ? currentExpiration : now;
      const newExpirationDate = new Date(startDate.getTime() + (planDays * 24 * 60 * 60 * 1000));

      partners[partnerIndex] = {
        ...partner,
        planId: newPlanId,
        expirationDate: newExpirationDate.toISOString(),
        isActive: true,
        isPaid: true
      };

      localStorage.setItem('active_partners', JSON.stringify(partners));
      // SYNC COM SUPABASE
      import('../src/lib/supabase').then(({ supabase }) => {
        supabase.from('system_settings').upsert({ key: 'active_partners', value: partners, updated_at: new Date().toISOString() }).then(() => {});
      });

      // Registrar renovação no histórico
      this.addToHistory({
        ...partner,
        paymentDate: new Date().toISOString(),
        action: 'renewal'
      });

      console.log(`✅ Anúncio renovado: ${partner.name} até ${newExpirationDate.toLocaleDateString()}`);
      return true;
    } catch (error) {
      console.error('Erro ao renovar anúncio:', error);
      return false;
    }
  }

  // Adicionar ao histórico
  private addToHistory(record: any): void {
    try {
      const history = JSON.parse(localStorage.getItem('advertising_history') || '[]');
      history.push(record);
      localStorage.setItem('advertising_history', JSON.stringify(history));
      // SYNC COM SUPABASE
      import('../src/lib/supabase').then(({ supabase }) => {
        supabase.from('activity_logs').insert({ action: 'advertising_event', details: record, created_at: new Date().toISOString() }).then(() => {});
      });
    } catch (error) {
      console.error('Erro ao adicionar ao histórico:', error);
    }
  }

  // Obter estatísticas de anúncios
  getAdvertisingStats(): {
    total: number;
    active: number;
    expired: number;
    nearExpiration: number;
    totalRevenue: number;
  } {
    try {
      const allPartners = JSON.parse(localStorage.getItem('active_partners') || '[]');
      const history = JSON.parse(localStorage.getItem('advertising_history') || '[]');
      const now = new Date();

      const active = allPartners.filter((p: ActiveAdvertisement) => {
        const expirationDate = new Date(p.expirationDate);
        return p.isActive && p.isPaid && expirationDate > now;
      }).length;

      const expired = allPartners.filter((p: ActiveAdvertisement) => {
        const expirationDate = new Date(p.expirationDate);
        return expirationDate <= now;
      }).length;

      const nearExpiration = this.getAdsNearExpiration().length;

      const totalRevenue = history.reduce((sum: number, record: any) => {
        return sum + (record.amount || 0);
      }, 0);

      return {
        total: allPartners.length,
        active,
        expired,
        nearExpiration,
        totalRevenue
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        total: 0,
        active: 0,
        expired: 0,
        nearExpiration: 0,
        totalRevenue: 0
      };
    }
  }

  // Inicializar verificação automática de expiração
  startExpirationChecker(): void {
    // Verificar imediatamente
    this.checkAndRemoveExpiredAds();

    // Verificar a cada hora
    setInterval(() => {
      this.checkAndRemoveExpiredAds();
    }, 60 * 60 * 1000); // 1 hora

    console.log('🕐 Sistema de verificação de expiração de anúncios iniciado');
  }

  // Notificar anúncios próximos do vencimento
  notifyNearExpiration(): void {
    const nearExpiration = this.getAdsNearExpiration();
    
    if (nearExpiration.length > 0) {
      console.log(`⚠️ ${nearExpiration.length} anúncio(s) próximo(s) do vencimento:`);
      nearExpiration.forEach(ad => {
        const daysLeft = Math.ceil((new Date(ad.expirationDate).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
        console.log(`- ${ad.name}: ${daysLeft} dia(s) restante(s)`);
      });
    }
  }
}

export default AdvertisingManager;
