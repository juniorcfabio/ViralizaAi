// =======================
// 🔒 SERVIÇO DE SEGURANÇA
// =======================

import CryptoJS from 'crypto-js';

interface SecurityConfig {
  encryptionKey: string;
  jwtSecret: string;
  sessionTimeout: number;
  maxRequestsPerMinute: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class SecurityService {
  private static instance: SecurityService;
  private config: SecurityConfig;
  private rateLimitMap: Map<string, RateLimitEntry> = new Map();

  constructor() {
    this.config = {
      encryptionKey: process.env.REACT_APP_ENCRYPTION_KEY || 'default-key-change-in-production',
      jwtSecret: process.env.REACT_APP_JWT_SECRET || 'default-jwt-secret',
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas
      maxRequestsPerMinute: 60
    };
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // =======================
  // 🔐 CRIPTOGRAFIA
  // =======================
  
  encrypt(text: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(text, this.config.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      console.error('❌ Erro na criptografia:', error);
      throw new Error('Falha na criptografia');
    }
  }

  decrypt(encryptedText: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, this.config.encryptionKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Falha na descriptografia');
      }
      
      return decrypted;
    } catch (error) {
      console.error('❌ Erro na descriptografia:', error);
      throw new Error('Falha na descriptografia');
    }
  }

  // =======================
  // 🛡️ VALIDAÇÃO DE SESSÃO
  // =======================

  validateSession(token: string): boolean {
    try {
      if (!token) return false;

      // Verificar se o token não está expirado
      const tokenData = this.parseJWT(token);
      if (!tokenData || !tokenData.exp) return false;

      const currentTime = Math.floor(Date.now() / 1000);
      if (tokenData.exp < currentTime) {
        console.warn('🔐 Token expirado');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erro na validação de sessão:', error);
      return false;
    }
  }

  private parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('❌ Erro ao parsear JWT:', error);
      return null;
    }
  }

  // =======================
  // 🚦 RATE LIMITING
  // =======================

  checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minuto

    // Limpar entradas antigas
    this.cleanupRateLimit(windowStart);

    const entry = this.rateLimitMap.get(identifier);
    
    if (!entry) {
      this.rateLimitMap.set(identifier, { count: 1, resetTime: now + 60000 });
      return true;
    }

    if (entry.resetTime <= now) {
      // Reset da janela
      this.rateLimitMap.set(identifier, { count: 1, resetTime: now + 60000 });
      return true;
    }

    if (entry.count >= this.config.maxRequestsPerMinute) {
      console.warn(`🚦 Rate limit excedido para: ${identifier}`);
      return false;
    }

    entry.count++;
    return true;
  }

  private cleanupRateLimit(windowStart: number): void {
    for (const [key, entry] of this.rateLimitMap.entries()) {
      if (entry.resetTime <= windowStart) {
        this.rateLimitMap.delete(key);
      }
    }
  }

  // =======================
  // 🔍 VALIDAÇÃO DE INPUT
  // =======================

  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }

  validateToolParameters(action: string, parameters: any): boolean {
    try {
      // Validações específicas por ação
      const validations: Record<string, (params: any) => boolean> = {
        scheduleContent: (params) => {
          return params && 
                 typeof params.text === 'string' && 
                 params.text.length > 0 && 
                 params.text.length <= 5000;
        },
        generateCopy: (params) => {
          return params && 
                 typeof params.prompt === 'string' && 
                 params.prompt.length > 0 && 
                 params.prompt.length <= 1000;
        },
        editVideo: (params) => {
          return params && 
                 typeof params.duration === 'number' && 
                 params.duration > 0 && 
                 params.duration <= 300;
        }
      };

      const validator = validations[action];
      if (validator) {
        return validator(parameters);
      }

      // Validação genérica
      return parameters !== null && parameters !== undefined;
    } catch (error) {
      console.error('❌ Erro na validação de parâmetros:', error);
      return false;
    }
  }

  // =======================
  // 🔐 GERAÇÃO DE TOKENS
  // =======================

  generateSecureToken(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 15);
    const combined = `${timestamp}_${random}`;
    return this.encrypt(combined);
  }

  generateCSRFToken(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }

  // =======================
  // 🛡️ VALIDAÇÃO DE PLANOS
  // =======================

  validatePlanAccess(userPlan: string, requiredPlan: string, isAdmin: boolean = false): boolean {
    if (isAdmin) return true;

    const planHierarchy: Record<string, number> = {
      'mensal': 1,
      'trimestral': 2,
      'semestral': 3,
      'anual': 4
    };

    const userLevel = planHierarchy[userPlan] || 0;
    const requiredLevel = planHierarchy[requiredPlan] || 0;

    return userLevel >= requiredLevel;
  }

  // =======================
  // 📊 LOGS DE SEGURANÇA
  // =======================

  logSecurityEvent(event: string, details: any, severity: 'low' | 'medium' | 'high' = 'medium'): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details: this.sanitizeInput(details),
      severity,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log(`🔒 [${severity.toUpperCase()}] ${event}:`, logEntry);

    // Em produção, enviar para serviço de logs
    if (process.env.NODE_ENV === 'production') {
      this.sendToSecurityLog(logEntry);
    }
  }

  private async sendToSecurityLog(logEntry: any): Promise<void> {
    try {
      // Implementar envio para serviço de logs (ex: Sentry, LogRocket, etc.)
      await fetch('/api/security/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      console.error('❌ Erro ao enviar log de segurança:', error);
    }
  }

  // =======================
  // 🔍 DETECÇÃO DE AMEAÇAS
  // =======================

  detectSuspiciousActivity(userId: string, action: string): boolean {
    const key = `${userId}_${action}`;
    const now = Date.now();
    const window = 60000; // 1 minuto

    // Verificar se há muitas ações do mesmo tipo
    const entry = this.rateLimitMap.get(key);
    if (entry && entry.count > 10) {
      this.logSecurityEvent('suspicious_activity_detected', {
        userId,
        action,
        count: entry.count
      }, 'high');
      return true;
    }

    return false;
  }

  // =======================
  // 🛡️ PROTEÇÃO CSRF
  // =======================

  validateCSRFToken(token: string, storedToken: string): boolean {
    return token === storedToken && token.length > 0;
  }

  // =======================
  // 🔐 HASH SEGURO
  // =======================

  createSecureHash(data: string): string {
    return CryptoJS.SHA256(data + this.config.jwtSecret).toString();
  }

  verifyHash(data: string, hash: string): boolean {
    const computedHash = this.createSecureHash(data);
    return computedHash === hash;
  }
}

export default SecurityService;
