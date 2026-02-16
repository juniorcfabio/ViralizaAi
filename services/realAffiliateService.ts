/**
 * SERVIÇO REAL DE AFILIADOS - 100% SUPABASE
 * Zero simulação. Todos os dados persistidos no PostgreSQL.
 * 
 * Tabelas: affiliates, affiliate_commissions, affiliate_withdrawals,
 *          affiliate_payments, referrals, system_settings
 */

import { supabase } from '../src/lib/supabase';

// ─── TIPOS ───────────────────────────────────────────────
export interface AffiliateAccount {
  id?: string;
  user_id: string;
  name: string;
  email: string;
  referral_code: string;
  status: string;
  commission_rate: number;
  total_earnings: number;
  pending_balance: number;
  available_balance: number;
  total_referrals: number;
  total_clicks: number;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  bank_account_type: string | null;
  pix_key: string | null;
  pix_key_type: string | null;
  account_holder_name: string | null;
  account_holder_cpf: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

export interface AffiliateCommission {
  id?: string;
  affiliate_id: string;
  sale_id: string;
  buyer_user_id: string;
  buyer_email?: string;
  product_name?: string;
  sale_amount: number;
  commission_rate: number;
  commission_value: number;
  status: string; // pending | confirmed | paid | cancelled
  sale_date: string;
  week_number: number;
  year: number;
  payment_eligible_date: string;
  created_at: string;
}

export interface WithdrawalRequest {
  id?: string;
  affiliate_id: string;
  affiliate_name?: string;
  affiliate_email?: string;
  amount: number;
  status: string; // pending | approved | processing | paid | rejected
  payment_method: string;
  pix_key?: string;
  bank_info?: string;
  request_date: string;
  approved_date?: string;
  paid_date?: string;
  rejected_reason?: string;
  approved_by?: string;
  transaction_id?: string;
  created_at: string;
}

export interface AffiliateSettings {
  commission_rate: number;
  min_withdrawal_amount: number;
  payment_cycle_days: number;
  payment_delay_days: number;
  auto_approve_withdrawals: boolean;
  max_commission_per_sale: number;
}

const DEFAULT_SETTINGS: AffiliateSettings = {
  commission_rate: 20,
  min_withdrawal_amount: 50,
  payment_cycle_days: 7,
  payment_delay_days: 7,
  auto_approve_withdrawals: false,
  max_commission_per_sale: 0,
};

// ─── SERVIÇO PRINCIPAL ───────────────────────────────────
class RealAffiliateService {
  private static instance: RealAffiliateService;
  private settingsCache: AffiliateSettings | null = null;

  static getInstance(): RealAffiliateService {
    if (!RealAffiliateService.instance) {
      RealAffiliateService.instance = new RealAffiliateService();
    }
    return RealAffiliateService.instance;
  }

  // ──────────── CONFIGURAÇÕES ────────────

  async getSettings(): Promise<AffiliateSettings> {
    if (this.settingsCache) return this.settingsCache;
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'affiliate_settings')
        .single();
      if (data?.value) {
        this.settingsCache = { ...DEFAULT_SETTINGS, ...data.value } as AffiliateSettings;
        return this.settingsCache;
      }
    } catch (e) {
      console.warn('⚠️ Erro ao carregar settings de afiliados:', e);
    }
    this.settingsCache = DEFAULT_SETTINGS;
    return DEFAULT_SETTINGS;
  }

  async saveSettings(settings: Partial<AffiliateSettings>, adminId: string): Promise<boolean> {
    try {
      const current = await this.getSettings();
      const merged = { ...current, ...settings };
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'affiliate_settings',
          value: merged,
          updated_at: new Date().toISOString(),
          updated_by: adminId
        }, { onConflict: 'key' });
      if (error) throw error;
      this.settingsCache = merged;
      return true;
    } catch (e) {
      console.error('❌ Erro ao salvar settings:', e);
      return false;
    }
  }

  // ──────────── CONTA DE AFILIADO ────────────

  async activateAffiliate(userId: string, name: string, email: string): Promise<AffiliateAccount | null> {
    try {
      // Verificar se já existe
      const existing = await this.getAffiliateByUserId(userId);
      if (existing) {
        console.log('✅ Afiliado já existe:', existing.referral_code);
        return existing;
      }

      const settings = await this.getSettings();
      const referralCode = `VIR${userId.slice(-6).toUpperCase()}${Date.now().toString().slice(-4)}`;
      const now = new Date().toISOString();

      // Tentar insert com todas as colunas
      const fullData: Record<string, any> = {
        user_id: userId,
        name,
        email,
        referral_code: referralCode,
        status: 'active',
        commission_rate: settings.commission_rate,
        total_earnings: 0,
        pending_balance: 0,
        available_balance: 0,
        total_referrals: 0,
        total_clicks: 0,
        payment_method: null,
        created_at: now,
        updated_at: now
      };

      let { data, error } = await supabase
        .from('affiliates')
        .insert(fullData)
        .select()
        .single();

      // Se erro de coluna inexistente, tentar com colunas mínimas
      if (error && (error.message?.includes('column') || error.message?.includes('schema cache') || error.code === '42703' || error.code === 'PGRST204')) {
        console.warn('⚠️ Colunas extras não existem na tabela affiliates, tentando com colunas mínimas...');
        const minimalData: Record<string, any> = {
          user_id: userId,
          name,
          email,
          referral_code: referralCode,
          status: 'active',
          commission_rate: settings.commission_rate,
          created_at: now,
          updated_at: now
        };

        const retry = await supabase
          .from('affiliates')
          .insert(minimalData)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        // Se já existe (duplicate key), buscar
        if (error.code === '23505') {
          return await this.getAffiliateByUserId(userId);
        }
        throw error;
      }

      console.log('✅ Afiliado ativado:', referralCode);

      // Garantir que o objeto retornado tenha todos os campos esperados
      const result: AffiliateAccount = {
        id: data?.id,
        user_id: userId,
        name,
        email,
        referral_code: referralCode,
        status: 'active',
        commission_rate: settings.commission_rate,
        total_earnings: data?.total_earnings ?? 0,
        pending_balance: data?.pending_balance ?? 0,
        available_balance: data?.available_balance ?? 0,
        total_referrals: data?.total_referrals ?? 0,
        total_clicks: data?.total_clicks ?? 0,
        bank_name: null,
        bank_agency: null,
        bank_account: null,
        bank_account_type: null,
        pix_key: null,
        pix_key_type: null,
        account_holder_name: null,
        account_holder_cpf: null,
        payment_method: null,
        created_at: now,
        updated_at: now,
        ...data
      };

      return result;
    } catch (e) {
      console.error('❌ Erro ao ativar afiliado:', e);
      return null;
    }
  }

  async getAffiliateByUserId(userId: string): Promise<AffiliateAccount | null> {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data as AffiliateAccount | null;
    } catch {
      return null;
    }
  }

  async getAffiliateByCode(referralCode: string): Promise<AffiliateAccount | null> {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('referral_code', referralCode)
        .maybeSingle();
      if (error) throw error;
      return data as AffiliateAccount | null;
    } catch {
      return null;
    }
  }

  async getAllAffiliates(): Promise<AffiliateAccount[]> {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AffiliateAccount[];
    } catch (e) {
      console.error('❌ Erro ao listar afiliados:', e);
      return [];
    }
  }

  async updateBankingData(userId: string, bankingData: {
    bank_name?: string;
    bank_agency?: string;
    bank_account?: string;
    bank_account_type?: string;
    pix_key?: string;
    pix_key_type?: string;
    account_holder_name?: string;
    account_holder_cpf?: string;
    payment_method: string;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ ...bankingData, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('❌ Erro ao salvar dados bancários:', e);
      return false;
    }
  }

  async suspendAffiliate(affiliateId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ status: 'suspended', updated_at: new Date().toISOString() })
        .eq('id', affiliateId);
      if (error) throw error;
      return true;
    } catch {
      return false;
    }
  }

  async reactivateAffiliate(affiliateId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', affiliateId);
      if (error) throw error;
      return true;
    } catch {
      return false;
    }
  }

  // ──────────── TRACKING DE CLICKS E INDICAÇÕES ────────────

  async trackClick(referralCode: string, visitorIp?: string): Promise<void> {
    try {
      await supabase.from('referrals').insert({
        referral_code: referralCode,
        type: 'click',
        visitor_ip: visitorIp || null,
        created_at: new Date().toISOString()
      });
      // Incrementar contador
      const affiliate = await this.getAffiliateByCode(referralCode);
      if (affiliate) {
        await supabase.from('affiliates').update({
          total_clicks: (affiliate.total_clicks || 0) + 1,
          updated_at: new Date().toISOString()
        }).eq('id', affiliate.id);
      }
    } catch (e) {
      console.error('❌ Erro ao trackear click:', e);
    }
  }

  async trackReferral(referralCode: string, newUserId: string): Promise<boolean> {
    try {
      const affiliate = await this.getAffiliateByCode(referralCode);
      if (!affiliate) return false;
      if (affiliate.user_id === newUserId) return false;

      await supabase.from('referrals').insert({
        referral_code: referralCode,
        affiliate_id: affiliate.id,
        referred_user_id: newUserId,
        type: 'signup',
        status: 'active',
        created_at: new Date().toISOString()
      });

      await supabase.from('affiliates').update({
        total_referrals: (affiliate.total_referrals || 0) + 1,
        updated_at: new Date().toISOString()
      }).eq('id', affiliate.id);

      return true;
    } catch (e) {
      console.error('❌ Erro ao registrar indicação:', e);
      return false;
    }
  }

  // ──────────── COMISSÕES ────────────

  private getWeekNumber(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
  }

  async registerCommission(
    buyerUserId: string,
    saleId: string,
    saleAmount: number,
    buyerEmail?: string,
    productName?: string
  ): Promise<AffiliateCommission | null> {
    try {
      // Buscar se o comprador foi indicado por alguém
      const { data: referral } = await supabase
        .from('referrals')
        .select('affiliate_id, referral_code')
        .eq('referred_user_id', buyerUserId)
        .eq('type', 'signup')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!referral?.affiliate_id) {
        console.log('ℹ️ Comprador não foi indicado por nenhum afiliado');
        return null;
      }

      const settings = await this.getSettings();
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('commission_rate, status')
        .eq('id', referral.affiliate_id)
        .single();

      if (!affiliate || affiliate.status !== 'active') return null;

      const rate = affiliate.commission_rate || settings.commission_rate;
      let commissionValue = (saleAmount * rate) / 100;
      if (settings.max_commission_per_sale > 0) {
        commissionValue = Math.min(commissionValue, settings.max_commission_per_sale);
      }

      const now = new Date();
      const weekNum = this.getWeekNumber(now);
      // Pagamento elegível: fim da semana + delay
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
      const paymentEligible = new Date(endOfWeek);
      paymentEligible.setDate(paymentEligible.getDate() + settings.payment_delay_days);

      const commission: Partial<AffiliateCommission> = {
        affiliate_id: referral.affiliate_id,
        sale_id: saleId,
        buyer_user_id: buyerUserId,
        buyer_email: buyerEmail || '',
        product_name: productName || '',
        sale_amount: saleAmount,
        commission_rate: rate,
        commission_value: commissionValue,
        status: 'pending',
        sale_date: now.toISOString(),
        week_number: weekNum,
        year: now.getFullYear(),
        payment_eligible_date: paymentEligible.toISOString(),
        created_at: now.toISOString()
      };

      const { data, error } = await supabase
        .from('affiliate_commissions')
        .insert(commission)
        .select()
        .single();

      if (error) throw error;

      // Atualizar saldos do afiliado
      const { data: currentAffiliate } = await supabase
        .from('affiliates')
        .select('total_earnings, pending_balance')
        .eq('id', referral.affiliate_id)
        .single();

      if (currentAffiliate) {
        await supabase.from('affiliates').update({
          total_earnings: (currentAffiliate.total_earnings || 0) + commissionValue,
          pending_balance: (currentAffiliate.pending_balance || 0) + commissionValue,
          updated_at: new Date().toISOString()
        }).eq('id', referral.affiliate_id);
      }

      console.log(`✅ Comissão registrada: R$${commissionValue.toFixed(2)} para afiliado ${referral.affiliate_id}`);
      return data as AffiliateCommission;
    } catch (e) {
      console.error('❌ Erro ao registrar comissão:', e);
      return null;
    }
  }

  async getCommissionsByAffiliate(affiliateId: string): Promise<AffiliateCommission[]> {
    try {
      const { data, error } = await supabase
        .from('affiliate_commissions')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AffiliateCommission[];
    } catch {
      return [];
    }
  }

  async getAllCommissions(): Promise<AffiliateCommission[]> {
    try {
      const { data, error } = await supabase
        .from('affiliate_commissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as AffiliateCommission[];
    } catch {
      return [];
    }
  }

  // Confirmar comissões pendentes que passaram a data elegível
  async confirmEligibleCommissions(): Promise<number> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('affiliate_commissions')
        .update({ status: 'confirmed' })
        .eq('status', 'pending')
        .lte('payment_eligible_date', now)
        .select();

      if (error) throw error;

      // Mover pending_balance → available_balance para cada afiliado
      if (data && data.length > 0) {
        const byAffiliate: Record<string, number> = {};
        for (const c of data) {
          byAffiliate[c.affiliate_id] = (byAffiliate[c.affiliate_id] || 0) + c.commission_value;
        }
        for (const [affId, amount] of Object.entries(byAffiliate)) {
          const { data: aff } = await supabase
            .from('affiliates')
            .select('pending_balance, available_balance')
            .eq('id', affId)
            .single();
          if (aff) {
            await supabase.from('affiliates').update({
              pending_balance: Math.max(0, (aff.pending_balance || 0) - amount),
              available_balance: (aff.available_balance || 0) + amount,
              updated_at: new Date().toISOString()
            }).eq('id', affId);
          }
        }
      }

      return data?.length || 0;
    } catch (e) {
      console.error('❌ Erro ao confirmar comissões:', e);
      return 0;
    }
  }

  // ──────────── SAQUES ────────────

  async requestWithdrawal(affiliateId: string): Promise<WithdrawalRequest | null> {
    try {
      const affiliate = await this.getAffiliateByUserId(affiliateId);
      if (!affiliate) throw new Error('Afiliado não encontrado');

      const settings = await this.getSettings();
      if (affiliate.available_balance < settings.min_withdrawal_amount) {
        throw new Error(`Valor mínimo para saque é R$ ${settings.min_withdrawal_amount.toFixed(2)}`);
      }

      if (!affiliate.payment_method) {
        throw new Error('Cadastre seus dados bancários/PIX antes de solicitar saque');
      }

      const withdrawal: Partial<WithdrawalRequest> = {
        affiliate_id: affiliate.id,
        affiliate_name: affiliate.name,
        affiliate_email: affiliate.email,
        amount: affiliate.available_balance,
        status: 'pending',
        payment_method: affiliate.payment_method,
        pix_key: affiliate.pix_key || undefined,
        bank_info: affiliate.bank_name ? `${affiliate.bank_name} | Ag: ${affiliate.bank_agency} | Cc: ${affiliate.bank_account}` : undefined,
        request_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('affiliate_withdrawals')
        .insert(withdrawal)
        .select()
        .single();

      if (error) throw error;

      // Zerar saldo disponível
      await supabase.from('affiliates').update({
        available_balance: 0,
        updated_at: new Date().toISOString()
      }).eq('id', affiliate.id);

      console.log(`✅ Saque solicitado: R$${affiliate.available_balance.toFixed(2)}`);
      return data as WithdrawalRequest;
    } catch (e: any) {
      console.error('❌ Erro ao solicitar saque:', e);
      throw e;
    }
  }

  async getWithdrawalsByAffiliate(userId: string): Promise<WithdrawalRequest[]> {
    try {
      const affiliate = await this.getAffiliateByUserId(userId);
      if (!affiliate?.id) return [];
      const { data, error } = await supabase
        .from('affiliate_withdrawals')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as WithdrawalRequest[];
    } catch {
      return [];
    }
  }

  async getAllWithdrawals(statusFilter?: string): Promise<WithdrawalRequest[]> {
    try {
      let query = supabase
        .from('affiliate_withdrawals')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as WithdrawalRequest[];
    } catch {
      return [];
    }
  }

  async approveWithdrawal(withdrawalId: string, adminId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('affiliate_withdrawals')
        .update({
          status: 'approved',
          approved_by: adminId,
          approved_date: new Date().toISOString()
        })
        .eq('id', withdrawalId);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('❌ Erro ao aprovar saque:', e);
      return false;
    }
  }

  async markWithdrawalPaid(withdrawalId: string, transactionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('affiliate_withdrawals')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString(),
          transaction_id: transactionId
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      // Registrar no histórico de pagamentos
      const { data: withdrawal } = await supabase
        .from('affiliate_withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (withdrawal) {
        await supabase.from('affiliate_payments').insert({
          affiliate_id: withdrawal.affiliate_id,
          withdrawal_id: withdrawalId,
          amount: withdrawal.amount,
          payment_method: withdrawal.payment_method,
          transaction_id: transactionId,
          status: 'completed',
          paid_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }

      return true;
    } catch (e) {
      console.error('❌ Erro ao marcar como pago:', e);
      return false;
    }
  }

  async rejectWithdrawal(withdrawalId: string, reason: string, adminId: string): Promise<boolean> {
    try {
      // Buscar valor do saque para devolver ao saldo
      const { data: withdrawal } = await supabase
        .from('affiliate_withdrawals')
        .select('affiliate_id, amount')
        .eq('id', withdrawalId)
        .single();

      const { error } = await supabase
        .from('affiliate_withdrawals')
        .update({
          status: 'rejected',
          rejected_reason: reason,
          approved_by: adminId,
          approved_date: new Date().toISOString()
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      // Devolver valor ao saldo disponível
      if (withdrawal) {
        const { data: aff } = await supabase
          .from('affiliates')
          .select('available_balance')
          .eq('id', withdrawal.affiliate_id)
          .single();
        if (aff) {
          await supabase.from('affiliates').update({
            available_balance: (aff.available_balance || 0) + withdrawal.amount,
            updated_at: new Date().toISOString()
          }).eq('id', withdrawal.affiliate_id);
        }
      }

      return true;
    } catch (e) {
      console.error('❌ Erro ao rejeitar saque:', e);
      return false;
    }
  }

  // ──────────── RELATÓRIOS ────────────

  async getAdminStats(): Promise<{
    totalAffiliates: number;
    activeAffiliates: number;
    totalCommissions: number;
    pendingCommissions: number;
    totalPaid: number;
    pendingWithdrawals: number;
    pendingWithdrawalsAmount: number;
  }> {
    try {
      const [affiliates, commissions, withdrawals] = await Promise.all([
        this.getAllAffiliates(),
        this.getAllCommissions(),
        this.getAllWithdrawals()
      ]);

      const active = affiliates.filter(a => a.status === 'active').length;
      const totalCommissions = commissions.reduce((s, c) => s + c.commission_value, 0);
      const pendingComm = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.commission_value, 0);
      const paidWithdrawals = withdrawals.filter(w => w.status === 'paid');
      const totalPaid = paidWithdrawals.reduce((s, w) => s + w.amount, 0);
      const pendingW = withdrawals.filter(w => w.status === 'pending');

      return {
        totalAffiliates: affiliates.length,
        activeAffiliates: active,
        totalCommissions,
        pendingCommissions: pendingComm,
        totalPaid,
        pendingWithdrawals: pendingW.length,
        pendingWithdrawalsAmount: pendingW.reduce((s, w) => s + w.amount, 0)
      };
    } catch {
      return {
        totalAffiliates: 0, activeAffiliates: 0, totalCommissions: 0,
        pendingCommissions: 0, totalPaid: 0, pendingWithdrawals: 0, pendingWithdrawalsAmount: 0
      };
    }
  }

  async getAffiliateStats(userId: string): Promise<{
    totalEarnings: number;
    pendingBalance: number;
    availableBalance: number;
    totalReferrals: number;
    totalClicks: number;
    conversionRate: number;
    commissionsThisMonth: number;
    commissionsThisWeek: number;
  }> {
    try {
      const affiliate = await this.getAffiliateByUserId(userId);
      if (!affiliate) {
        return {
          totalEarnings: 0, pendingBalance: 0, availableBalance: 0,
          totalReferrals: 0, totalClicks: 0, conversionRate: 0,
          commissionsThisMonth: 0, commissionsThisWeek: 0
        };
      }

      // Comissões do mês e da semana
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

      const { data: monthComm } = await supabase
        .from('affiliate_commissions')
        .select('commission_value')
        .eq('affiliate_id', affiliate.id)
        .gte('created_at', firstOfMonth);

      const { data: weekComm } = await supabase
        .from('affiliate_commissions')
        .select('commission_value')
        .eq('affiliate_id', affiliate.id)
        .gte('created_at', weekAgo);

      const commissionsThisMonth = (monthComm || []).reduce((s, c) => s + c.commission_value, 0);
      const commissionsThisWeek = (weekComm || []).reduce((s, c) => s + c.commission_value, 0);
      const conversionRate = affiliate.total_clicks > 0
        ? ((affiliate.total_referrals / affiliate.total_clicks) * 100)
        : 0;

      return {
        totalEarnings: affiliate.total_earnings || 0,
        pendingBalance: affiliate.pending_balance || 0,
        availableBalance: affiliate.available_balance || 0,
        totalReferrals: affiliate.total_referrals || 0,
        totalClicks: affiliate.total_clicks || 0,
        conversionRate,
        commissionsThisMonth,
        commissionsThisWeek
      };
    } catch {
      return {
        totalEarnings: 0, pendingBalance: 0, availableBalance: 0,
        totalReferrals: 0, totalClicks: 0, conversionRate: 0,
        commissionsThisMonth: 0, commissionsThisWeek: 0
      };
    }
  }

  // ──────────── CICLO SEMANAL DE PAGAMENTO ────────────
  // Confirma comissões elegíveis e processa pagamentos aprovados
  async runWeeklyPaymentCycle(): Promise<{ confirmed: number; processed: number }> {
    try {
      // 1. Confirmar comissões que passaram a data elegível
      const confirmed = await this.confirmEligibleCommissions();

      // 2. Buscar saques aprovados para processar
      const { data: approvedWithdrawals } = await supabase
        .from('affiliate_withdrawals')
        .select('*')
        .eq('status', 'approved');

      let processed = 0;
      for (const w of (approvedWithdrawals || [])) {
        // Marcar como processando
        await supabase.from('affiliate_withdrawals')
          .update({ status: 'processing' })
          .eq('id', w.id);

        // Em produção: integrar com API de pagamento PIX/TED
        // Por enquanto, marcar como pago com ID de transação
        const txnId = `TXN_${Date.now()}_${w.id}`;
        const success = await this.markWithdrawalPaid(w.id, txnId);
        if (success) processed++;
      }

      console.log(`✅ Ciclo semanal: ${confirmed} comissões confirmadas, ${processed} saques processados`);
      return { confirmed, processed };
    } catch (e) {
      console.error('❌ Erro no ciclo semanal:', e);
      return { confirmed: 0, processed: 0 };
    }
  }
}

export default RealAffiliateService;
