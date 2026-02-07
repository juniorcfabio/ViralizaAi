// 🛡️ GERENCIADOR DE SEGURANÇA GLOBAL - PROTEÇÃO ENTERPRISE
// Sistema avançado de detecção de ataques e proteção automática

import { SECURITY_CONFIG } from "./globalConfig.js";
import { realTimeMetrics } from "./realTimeMetrics.js";

export class SecurityManager {
  constructor() {
    this.config = SECURITY_CONFIG;
    this.blockedIPs = new Set();
    this.suspiciousIPs = new Map(); // IP -> { count, firstSeen, lastSeen }
    this.rateLimitCache = new Map(); // IP -> { count, resetTime }
    this.attackPatterns = new Map(); // Padrões de ataque detectados
    
    // 🧹 LIMPEZA AUTOMÁTICA A CADA 5 MINUTOS
    setInterval(() => this.cleanup(), 300000);
  }

  // 🚨 VERIFICAR SE IP ESTÁ BLOQUEADO
  isIPBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  // 🔍 ANALISAR REQUEST PARA DETECTAR ATAQUES
  async analyzeRequest(req, res, next) {
    const ip = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    const url = req.url;
    const method = req.method;

    console.log(`🔍 Analisando request: ${method} ${url} de ${ip}`);

    try {
      // 🚫 VERIFICAR IP BLOQUEADO
      if (this.isIPBlocked(ip)) {
        console.log(`🚫 IP bloqueado tentando acesso: ${ip}`);
        return res.status(403).json({
          error: "Acesso negado - IP bloqueado",
          code: "IP_BLOCKED"
        });
      }

      // 📊 VERIFICAR RATE LIMITING
      const rateLimitResult = this.checkRateLimit(ip, url);
      if (!rateLimitResult.allowed) {
        console.log(`⚡ Rate limit excedido: ${ip} (${rateLimitResult.count}/${rateLimitResult.limit})`);
        
        // 🚨 BLOQUEAR IP SE MUITO ABUSIVO
        if (rateLimitResult.count > rateLimitResult.limit * 2) {
          await this.blockIP(ip, 'Rate limit severely exceeded');
        }
        
        return res.status(429).json({
          error: "Muitas requisições",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: rateLimitResult.retryAfter
        });
      }

      // 🤖 DETECTAR BOTS MALICIOSOS
      const botAnalysis = this.analyzeBotBehavior(ip, userAgent, url);
      if (botAnalysis.isMalicious) {
        console.log(`🤖 Bot malicioso detectado: ${ip}`);
        await this.blockIP(ip, `Malicious bot: ${botAnalysis.reason}`);
        
        return res.status(403).json({
          error: "Acesso negado - Bot malicioso detectado",
          code: "MALICIOUS_BOT"
        });
      }

      // 🌍 VERIFICAR GEO-BLOCKING
      const geoCheck = await this.checkGeoBlocking(req);
      if (geoCheck.blocked) {
        console.log(`🌍 País bloqueado: ${geoCheck.country}`);
        return res.status(403).json({
          error: "Acesso não disponível em sua região",
          code: "GEO_BLOCKED"
        });
      }

      // 🔍 DETECTAR PADRÕES DE ATAQUE
      const attackPattern = this.detectAttackPattern(ip, url, method);
      if (attackPattern.detected) {
        console.log(`⚔️ Padrão de ataque detectado: ${attackPattern.type}`);
        
        if (attackPattern.severity === 'high') {
          await this.blockIP(ip, `Attack pattern: ${attackPattern.type}`);
          return res.status(403).json({
            error: "Atividade suspeita detectada",
            code: "ATTACK_DETECTED"
          });
        }
      }

      // 📊 REGISTRAR MÉTRICAS
      this.recordMetrics(ip, url, method);

      // ✅ REQUEST APROVADO
      console.log(`✅ Request aprovado: ${ip}`);
      next();

    } catch (error) {
      console.error("🚨 Erro na análise de segurança:", error);
      // Em caso de erro, permitir acesso mas logar
      next();
    }
  }

  // ⚡ VERIFICAR RATE LIMITING
  checkRateLimit(ip, url) {
    const now = Date.now();
    const windowMs = 60000; // 1 minuto
    
    // 🎯 DETERMINAR LIMITE BASEADO NA URL
    let limit = this.config.rateLimits.global;
    
    if (url.includes('/api/auth/')) {
      limit = this.config.rateLimits.auth;
    } else if (url.includes('/api/admin/')) {
      limit = this.config.rateLimits.api;
    } else if (url.includes('/api/')) {
      limit = this.config.rateLimits.api;
    } else {
      limit = this.config.rateLimits.perIP;
    }

    // 📊 OBTER OU CRIAR ENTRADA DO CACHE
    const key = `${ip}:${Math.floor(now / windowMs)}`;
    const current = this.rateLimitCache.get(key) || { count: 0, resetTime: now + windowMs };

    // 📈 INCREMENTAR CONTADOR
    current.count++;
    this.rateLimitCache.set(key, current);

    // 🔍 VERIFICAR SE EXCEDEU LIMITE
    const allowed = current.count <= limit;
    const retryAfter = Math.ceil((current.resetTime - now) / 1000);

    return {
      allowed,
      count: current.count,
      limit,
      retryAfter: allowed ? 0 : retryAfter
    };
  }

  // 🤖 ANALISAR COMPORTAMENTO DE BOT
  analyzeBotBehavior(ip, userAgent, url) {
    const suspiciousPatterns = [
      /curl/i,
      /wget/i,
      /python/i,
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i
    ];

    const maliciousPatterns = [
      /sqlmap/i,
      /nikto/i,
      /nmap/i,
      /masscan/i,
      /zap/i,
      /burp/i
    ];

    // 🚨 VERIFICAR PADRÕES MALICIOSOS
    for (const pattern of maliciousPatterns) {
      if (pattern.test(userAgent)) {
        return {
          isMalicious: true,
          reason: `Malicious tool detected in User-Agent: ${userAgent}`
        };
      }
    }

    // 🔍 VERIFICAR PADRÕES SUSPEITOS
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    
    if (isSuspicious) {
      // 📊 INCREMENTAR CONTADOR DE SUSPEITAS
      const suspicious = this.suspiciousIPs.get(ip) || { count: 0, firstSeen: Date.now() };
      suspicious.count++;
      suspicious.lastSeen = Date.now();
      this.suspiciousIPs.set(ip, suspicious);

      // 🚨 BLOQUEAR SE MUITO SUSPEITO
      if (suspicious.count > 10) {
        return {
          isMalicious: true,
          reason: `Suspicious bot behavior: ${suspicious.count} requests`
        };
      }
    }

    return { isMalicious: false };
  }

  // 🌍 VERIFICAR GEO-BLOCKING
  async checkGeoBlocking(req) {
    const country = req.headers['cf-ipcountry'] || 
                   req.headers['x-country'] || 
                   'BR';

    const blocked = this.config.blockedCountries.includes(country);

    return {
      blocked,
      country,
      reason: blocked ? 'Country in blocked list' : null
    };
  }

  // ⚔️ DETECTAR PADRÕES DE ATAQUE
  detectAttackPattern(ip, url, method) {
    const now = Date.now();
    const key = `${ip}:pattern`;
    
    // 📊 OBTER HISTÓRICO DE REQUESTS
    const pattern = this.attackPatterns.get(key) || {
      requests: [],
      sqlInjection: 0,
      xss: 0,
      pathTraversal: 0,
      bruteForce: 0
    };

    // 📝 ADICIONAR REQUEST ATUAL
    pattern.requests.push({ url, method, timestamp: now });
    
    // 🧹 MANTER APENAS ÚLTIMOS 100 REQUESTS
    if (pattern.requests.length > 100) {
      pattern.requests = pattern.requests.slice(-100);
    }

    // 🔍 ANALISAR PADRÕES ESPECÍFICOS
    
    // 💉 SQL INJECTION
    if (this.containsSQLInjection(url)) {
      pattern.sqlInjection++;
    }

    // 🔗 XSS
    if (this.containsXSS(url)) {
      pattern.xss++;
    }

    // 📁 PATH TRAVERSAL
    if (this.containsPathTraversal(url)) {
      pattern.pathTraversal++;
    }

    // 🔓 BRUTE FORCE
    if (url.includes('/login') || url.includes('/auth')) {
      const recentAuth = pattern.requests.filter(r => 
        r.timestamp > now - 300000 && // Últimos 5 minutos
        (r.url.includes('/login') || r.url.includes('/auth'))
      );
      
      if (recentAuth.length > 10) {
        pattern.bruteForce++;
      }
    }

    // 💾 SALVAR PADRÃO ATUALIZADO
    this.attackPatterns.set(key, pattern);

    // 🚨 DETERMINAR SE É ATAQUE
    const totalSuspicious = pattern.sqlInjection + pattern.xss + pattern.pathTraversal + pattern.bruteForce;
    
    if (totalSuspicious > 5) {
      return {
        detected: true,
        type: 'Multiple attack patterns',
        severity: 'high',
        details: pattern
      };
    } else if (totalSuspicious > 2) {
      return {
        detected: true,
        type: 'Suspicious activity',
        severity: 'medium',
        details: pattern
      };
    }

    return { detected: false };
  }

  // 💉 VERIFICAR SQL INJECTION
  containsSQLInjection(url) {
    const sqlPatterns = [
      /union\s+select/i,
      /or\s+1\s*=\s*1/i,
      /and\s+1\s*=\s*1/i,
      /'\s*or\s*'/i,
      /'\s*and\s*'/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i
    ];

    return sqlPatterns.some(pattern => pattern.test(decodeURIComponent(url)));
  }

  // 🔗 VERIFICAR XSS
  containsXSS(url) {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /alert\s*\(/i,
      /document\.cookie/i
    ];

    return xssPatterns.some(pattern => pattern.test(decodeURIComponent(url)));
  }

  // 📁 VERIFICAR PATH TRAVERSAL
  containsPathTraversal(url) {
    const traversalPatterns = [
      /\.\.\//,
      /\.\.\\/,
      /%2e%2e%2f/i,
      /%2e%2e%5c/i,
      /etc\/passwd/i,
      /windows\/system32/i
    ];

    return traversalPatterns.some(pattern => pattern.test(url));
  }

  // 🚫 BLOQUEAR IP
  async blockIP(ip, reason) {
    console.log(`🚫 Bloqueando IP: ${ip} - Motivo: ${reason}`);
    
    this.blockedIPs.add(ip);
    
    // 📝 LOG DO BLOQUEIO
    const blockLog = {
      ip,
      reason,
      timestamp: new Date().toISOString(),
      blockedBy: 'security_manager'
    };

    console.log("📝 IP bloqueado:", blockLog);

    // 📊 REGISTRAR MÉTRICA
    realTimeMetrics.logBlockedAttempt(reason, { ip });

    // 🔍 EM PRODUÇÃO: SALVAR NO BANCO E NOTIFICAR
    // await database.blockedIPs.insertOne(blockLog);
    // await sendSecurityAlert(blockLog);
  }

  // 🔓 DESBLOQUEAR IP
  async unblockIP(ip, reason) {
    console.log(`🔓 Desbloqueando IP: ${ip} - Motivo: ${reason}`);
    
    this.blockedIPs.delete(ip);
    this.suspiciousIPs.delete(ip);
    this.attackPatterns.delete(`${ip}:pattern`);

    console.log(`✅ IP ${ip} desbloqueado`);
  }

  // 📊 REGISTRAR MÉTRICAS
  recordMetrics(ip, url, method) {
    // Registrar no sistema de métricas em tempo real
    realTimeMetrics.logRequest({
      method,
      url,
      ip
    }, { statusCode: 200 }, 0);
  }

  // 🌐 OBTER IP REAL DO CLIENT
  getClientIP(req) {
    return req.headers['cf-connecting-ip'] ||     // Cloudflare
           req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           '127.0.0.1';
  }

  // 🧹 LIMPEZA AUTOMÁTICA
  cleanup() {
    const now = Date.now();
    const oneHour = 3600000;

    // 🧹 LIMPAR RATE LIMIT CACHE
    for (const [key, data] of this.rateLimitCache.entries()) {
      if (data.resetTime < now) {
        this.rateLimitCache.delete(key);
      }
    }

    // 🧹 LIMPAR IPs SUSPEITOS ANTIGOS
    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (now - data.lastSeen > oneHour) {
        this.suspiciousIPs.delete(ip);
      }
    }

    // 🧹 LIMPAR PADRÕES DE ATAQUE ANTIGOS
    for (const [key, pattern] of this.attackPatterns.entries()) {
      pattern.requests = pattern.requests.filter(r => 
        now - r.timestamp < oneHour
      );
      
      if (pattern.requests.length === 0) {
        this.attackPatterns.delete(key);
      }
    }

    console.log("🧹 Limpeza de segurança concluída");
  }

  // 📊 OBTER ESTATÍSTICAS DE SEGURANÇA
  getSecurityStats() {
    return {
      blockedIPs: this.blockedIPs.size,
      suspiciousIPs: this.suspiciousIPs.size,
      activePatterns: this.attackPatterns.size,
      rateLimitEntries: this.rateLimitCache.size,
      
      // 📈 DETALHES
      topSuspiciousIPs: Array.from(this.suspiciousIPs.entries())
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 10)
        .map(([ip, data]) => ({ ip, ...data })),
        
      recentBlocks: Array.from(this.blockedIPs).slice(-20)
    };
  }
}

// 🚀 INSTÂNCIA GLOBAL DO GERENCIADOR
export const securityManager = new SecurityManager();

// 🔧 MIDDLEWARE EXPORTADO
export const securityMiddleware = (req, res, next) => {
  return securityManager.analyzeRequest(req, res, next);
};

// 🛡️ FUNÇÕES AUXILIARES
export const blockIP = (ip, reason) => securityManager.blockIP(ip, reason);
export const unblockIP = (ip, reason) => securityManager.unblockIP(ip, reason);
export const isIPBlocked = (ip) => securityManager.isIPBlocked(ip);
export const getSecurityStats = () => securityManager.getSecurityStats();

console.log("🛡️ Gerenciador de segurança carregado - Proteção enterprise ativa");
