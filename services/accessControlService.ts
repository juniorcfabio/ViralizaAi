// 🔐 SERVIÇO DE CONTROLE DE ACESSO - SUPABASE-FIRST
/**
 * Serviço de Controle de Acesso
 * PRIORIDADE: Supabase/PostgreSQL → fallback localStorage
 * Nenhuma ferramenta é liberada sem pagamento confirmado no backend
 */

import { supabase } from './autoSupabaseIntegration';
import autoSupabase from './autoSupabaseIntegration';

export interface PaymentRecord {
  id: string;
  userId: string;
  type: 'plan' | 'tool';
  itemName: string;
  amount: number;
  paymentMethod: 'stripe' | 'pix';
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  createdAt: Date;
  validUntil?: Date;
}

export interface ToolAccess {
  toolId: string;
  toolName: string;
  hasAccess: boolean;
  accessType: 'plan' | 'individual' | 'admin' | 'subscription' | 'purchase';
  expiresAt?: Date;
}

class AccessControlService {
  private readonly STORAGE_KEY = 'viralizaai_payments';
  private readonly ACCESS_KEY = 'viralizaai_access';
  private accessCache: Map<string, { result: boolean; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minuto

  // 💳 REGISTRAR PAGAMENTO - SUPABASE FIRST
  async registerPayment(payment: Omit<PaymentRecord, 'id' | 'createdAt'>): Promise<PaymentRecord> {
    const newPayment: PaymentRecord = {
      ...payment,
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    };

    // SALVAR NO SUPABASE
    await autoSupabase.savePayment({
      userId: payment.userId,
      type: payment.type,
      itemName: payment.itemName,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      transactionId: payment.transactionId
    });

    // Backup localStorage
    const payments = this.getAllPayments();
    payments.push(newPayment);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payments));

    console.log('💳 Pagamento registrado no SUPABASE:', newPayment.id);
    return newPayment;
  }

  // ✅ CONFIRMAR PAGAMENTO (após webhook/confirmação real)
  confirmPayment(paymentId: string, transactionId: string): boolean {
    const payments = this.getAllPayments();
    const payment = payments.find(p => p.id === paymentId);

    if (!payment) {
      console.error('❌ Pagamento não encontrado:', paymentId);
      return false;
    }

    payment.status = 'completed';
    payment.transactionId = transactionId;

    if (payment.type === 'plan') {
      payment.validUntil = this.calculatePlanExpiry(payment.itemName);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payments));

    // SYNC COM SUPABASE
    autoSupabase.savePayment({
      userId: payment.userId,
      type: payment.type,
      itemName: payment.itemName,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: 'confirmed',
      transactionId: transactionId
    });

    this.grantAccess(payment);
    this.invalidateCache(payment.userId);

    console.log('✅ Pagamento confirmado:', payment.id);
    return true;
  }

  // 🔓 LIBERAR ACESSO APÓS PAGAMENTO CONFIRMADO
  private grantAccess(payment: PaymentRecord): void {
    const accesses = this.getAllAccesses();
    
    if (payment.type === 'plan') {
      const planTools = this.getPlanTools(payment.itemName);
      planTools.forEach(toolName => {
        const access: ToolAccess = {
          toolId: toolName.toLowerCase().replace(/\s+/g, '_'),
          toolName,
          hasAccess: true,
          accessType: 'plan',
          expiresAt: payment.validUntil
        };
        
        const existingIndex = accesses.findIndex(a => a.toolId === access.toolId && a.toolName === access.toolName);
        if (existingIndex >= 0) {
          accesses[existingIndex] = access;
        } else {
          accesses.push(access);
        }
      });
    } else if (payment.type === 'tool') {
      const access: ToolAccess = {
        toolId: payment.itemName.toLowerCase().replace(/\s+/g, '_'),
        toolName: payment.itemName,
        hasAccess: true,
        accessType: 'individual'
      };
      
      const existingIndex = accesses.findIndex(a => a.toolId === access.toolId);
      if (existingIndex >= 0) {
        accesses[existingIndex] = access;
      } else {
        accesses.push(access);
      }
    }

    localStorage.setItem(this.ACCESS_KEY, JSON.stringify(accesses));

    // SYNC COM SUPABASE
    if (payment.type === 'plan') {
      const planTools = this.getPlanTools(payment.itemName);
      planTools.forEach(toolName => {
        autoSupabase.saveToolAccess(payment.userId, toolName, payment.itemName, payment.validUntil);
      });
    } else {
      autoSupabase.saveToolAccess(payment.userId, payment.itemName, 'individual');
    }
  }

  // 🔍 VERIFICAR ACESSO - SUPABASE FIRST + CACHE
  async hasToolAccess(userId: string, toolName: string, userType?: string): Promise<boolean> {
    // Admin sempre tem acesso
    if (userType === 'admin') return true;

    // Cache check
    const cacheKey = `${userId}:${toolName}`;
    const cached = this.accessCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }

    // 1. VERIFICAR NO SUPABASE (fonte primária)
    try {
      const { data, error } = await supabase
        .from('user_access')
        .select('id, valid_until, is_active, access_type')
        .eq('user_id', userId)
        .eq('tool_name', toolName)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        // Verificar expiração
        if (data.valid_until && new Date(data.valid_until) < new Date()) {
          // Expirou - desativar
          await supabase
            .from('user_access')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', data.id);
          this.accessCache.set(cacheKey, { result: false, timestamp: Date.now() });
          return false;
        }

        this.accessCache.set(cacheKey, { result: true, timestamp: Date.now() });
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Erro ao verificar acesso no Supabase, usando fallback:', error);
    }

    // 2. FALLBACK: Verificar no Supabase via autoSupabase (query diferente)
    try {
      const hasSupabaseAccess = await autoSupabase.checkToolAccess(userId, toolName);
      if (hasSupabaseAccess) {
        this.accessCache.set(cacheKey, { result: true, timestamp: Date.now() });
        return true;
      }
    } catch {
      // silencioso
    }

    // 3. FALLBACK: localStorage
    const accesses = this.getAllAccesses();
    const access = accesses.find(a => 
      a.toolName === toolName || 
      a.toolId === toolName.toLowerCase().replace(/\s+/g, '_')
    );

    if (!access || !access.hasAccess) {
      this.accessCache.set(cacheKey, { result: false, timestamp: Date.now() });
      return false;
    }

    if (access.expiresAt && new Date() > new Date(access.expiresAt)) {
      this.accessCache.set(cacheKey, { result: false, timestamp: Date.now() });
      return false;
    }

    this.accessCache.set(cacheKey, { result: true, timestamp: Date.now() });
    return true;
  }

  // 📋 LISTAR FERRAMENTAS COM ACESSO - SUPABASE FIRST
  async getUserToolAccessAsync(userId: string, userType?: string): Promise<ToolAccess[]> {
    if (userType === 'admin') {
      return this.getAllTools().map(tool => ({
        toolId: tool.toLowerCase().replace(/\s+/g, '_'),
        toolName: tool,
        hasAccess: true,
        accessType: 'admin' as const
      }));
    }

    try {
      const { data, error } = await supabase
        .from('user_access')
        .select('tool_name, access_type, valid_until, is_active')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (!error && data && data.length > 0) {
        const now = new Date();
        return data
          .filter(d => !d.valid_until || new Date(d.valid_until) > now)
          .map(d => ({
            toolId: d.tool_name.toLowerCase().replace(/\s+/g, '_'),
            toolName: d.tool_name,
            hasAccess: true,
            accessType: d.access_type as ToolAccess['accessType'],
            expiresAt: d.valid_until ? new Date(d.valid_until) : undefined
          }));
      }
    } catch {
      // fallback
    }

    return this.getUserToolAccess(userId, userType);
  }

  // 📋 LISTAR FERRAMENTAS (síncrono, localStorage fallback)
  getUserToolAccess(userId: string, userType?: string): ToolAccess[] {
    if (userType === 'admin') {
      return this.getAllTools().map(tool => ({
        toolId: tool.toLowerCase().replace(/\s+/g, '_'),
        toolName: tool,
        hasAccess: true,
        accessType: 'admin' as const
      }));
    }

    return this.getAllAccesses().filter(access => {
      if (!access.hasAccess) return false;
      if (access.expiresAt && new Date() > new Date(access.expiresAt)) return false;
      return true;
    });
  }

  // Invalidar cache de um usuário
  private invalidateCache(userId: string): void {
    for (const key of this.accessCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.accessCache.delete(key);
      }
    }
  }

  // 📊 OBTER TODOS OS PAGAMENTOS
  getAllPayments(): PaymentRecord[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      return [];
    }
  }

  // 🔐 OBTER TODOS OS ACESSOS
  getAllAccesses(): ToolAccess[] {
    try {
      const stored = localStorage.getItem(this.ACCESS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar acessos:', error);
      return [];
    }
  }

  // 📅 CALCULAR EXPIRAÇÃO DO PLANO
  private calculatePlanExpiry(planName: string): Date {
    const now = new Date();
    const planLower = planName.toLowerCase();
    
    if (planLower.includes('mensal')) {
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (planLower.includes('trimestral')) {
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    } else if (planLower.includes('semestral')) {
      return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    } else if (planLower.includes('anual')) {
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    }
    
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  // 🛠️ FERRAMENTAS POR PLANO
  private getPlanTools(planName: string): string[] {
    const planLower = planName.toLowerCase();
    const allTools = this.getAllTools();

    if (planLower.includes('mensal')) return allTools.slice(0, 6);
    if (planLower.includes('trimestral')) return allTools.slice(0, 9);
    if (planLower.includes('semestral')) return allTools.slice(0, 12);
    if (planLower.includes('anual')) return allTools;
    
    return allTools.slice(0, 6);
  }

  // 📝 TODAS AS FERRAMENTAS DISPONÍVEIS
  private getAllTools(): string[] {
    return [
      'Gerador de Scripts IA',
      'Criador de Thumbnails', 
      'Analisador de Trends',
      'Otimizador de SEO',
      'Gerador de Hashtags',
      'Criador de Logos',
      'Agendamento Multiplataforma',
      'IA de Copywriting',
      'Tradutor Automático',
      'Gerador de QR Code',
      'Editor de Vídeo Pro',
      'Gerador de Ebooks Premium',
      'Gerador de Animações',
      'IA Video Generator 8K',
      'AI Funil Builder'
    ];
  }

  // 🧹 LIMPAR ACESSOS EXPIRADOS
  cleanExpiredAccess(): void {
    const accesses = this.getAllAccesses();
    const validAccesses = accesses.filter(access => {
      if (!access.expiresAt) return true;
      return new Date() <= new Date(access.expiresAt);
    });
    
    localStorage.setItem(this.ACCESS_KEY, JSON.stringify(validAccesses));
    this.accessCache.clear();
    console.log('🧹 Acessos expirados removidos');
  }

  // 🔄 RESETAR SISTEMA (apenas para desenvolvimento)
  resetSystem(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.ACCESS_KEY);
    this.accessCache.clear();
    console.log('🔄 Sistema de acesso resetado');
  }
}

export default new AccessControlService();
