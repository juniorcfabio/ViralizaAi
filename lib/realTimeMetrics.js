// 📈 SISTEMA DE MÉTRICAS EM TEMPO REAL
// Monitoramento avançado para SaaS profissional

export class RealTimeMetricsSystem {
  constructor() {
    this.metrics = {
      // 👥 USUÁRIOS ONLINE
      onlineUsers: new Set(),
      
      // 📊 CONTADORES EM TEMPO REAL
      counters: {
        requestsPerMinute: 0,
        toolsUsedToday: 0,
        revenueToday: 0,
        blockedAttempts: 0,
        activeSubscriptions: 0
      },
      
      // 📈 HISTÓRICO RECENTE
      history: {
        requests: [],
        revenue: [],
        users: [],
        errors: []
      },
      
      // 🚨 ALERTAS ATIVOS
      alerts: [],
      
      // ⏰ TIMESTAMPS
      lastUpdate: new Date(),
      startTime: new Date()
    };

    // 🔄 INICIAR LIMPEZA AUTOMÁTICA
    this.startCleanupInterval();
  }

  // 👤 REGISTRAR USUÁRIO ONLINE
  registerUserOnline(userId, metadata = {}) {
    const userInfo = {
      userId,
      lastSeen: new Date(),
      ip: metadata.ip,
      userAgent: metadata.userAgent,
      location: metadata.location
    };

    this.metrics.onlineUsers.set(userId, userInfo);
    
    console.log(`👤 Usuário online: ${userId} (Total: ${this.metrics.onlineUsers.size})`);
    
    // 📊 ATUALIZAR HISTÓRICO
    this.updateUserHistory();
  }

  // 👋 REMOVER USUÁRIO OFFLINE
  removeUserOffline(userId) {
    if (this.metrics.onlineUsers.has(userId)) {
      this.metrics.onlineUsers.delete(userId);
      console.log(`👋 Usuário offline: ${userId} (Total: ${this.metrics.onlineUsers.size})`);
    }
  }

  // 📊 REGISTRAR USO DE FERRAMENTA
  async logToolUsage(data) {
    const logEntry = {
      userId: data.userId,
      tool: data.tool,
      timestamp: new Date(),
      ip: data.ip,
      duration: data.duration || 0,
      success: data.success !== false,
      metadata: data.metadata || {}
    };

    // 📈 INCREMENTAR CONTADORES
    this.metrics.counters.toolsUsedToday++;
    
    // 📝 SALVAR LOG
    await this.saveUsageLog(logEntry);
    
    // 🔍 VERIFICAR PADRÕES SUSPEITOS
    await this.checkSuspiciousActivity(data.userId, logEntry);
    
    console.log(`🛠️ Ferramenta usada: ${data.tool} por ${data.userId}`);
  }

  // 💰 REGISTRAR RECEITA
  logRevenue(amount, metadata = {}) {
    const revenueEntry = {
      amount,
      timestamp: new Date(),
      source: metadata.source || 'unknown',
      userId: metadata.userId,
      planType: metadata.planType
    };

    // 📈 INCREMENTAR CONTADOR
    this.metrics.counters.revenueToday += amount;
    
    // 📊 ADICIONAR AO HISTÓRICO
    this.metrics.history.revenue.push(revenueEntry);
    
    // 🧹 MANTER APENAS ÚLTIMAS 1000 ENTRADAS
    if (this.metrics.history.revenue.length > 1000) {
      this.metrics.history.revenue = this.metrics.history.revenue.slice(-1000);
    }

    console.log(`💰 Receita registrada: R$ ${amount.toFixed(2)}`);
  }

  // 📊 REGISTRAR REQUEST
  logRequest(req, res, duration) {
    const requestEntry = {
      method: req.method,
      url: req.url,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      statusCode: res.statusCode,
      duration,
      timestamp: new Date()
    };

    // 📈 INCREMENTAR CONTADOR POR MINUTO
    this.incrementRequestCounter();
    
    // 📊 ADICIONAR AO HISTÓRICO
    this.metrics.history.requests.push(requestEntry);
    
    // 🧹 MANTER APENAS ÚLTIMAS 1000 ENTRADAS
    if (this.metrics.history.requests.length > 1000) {
      this.metrics.history.requests = this.metrics.history.requests.slice(-1000);
    }

    // 🚨 VERIFICAR RATE LIMITING
    this.checkRateLimit(requestEntry.ip);
  }

  // 🚫 REGISTRAR TENTATIVA BLOQUEADA
  logBlockedAttempt(reason, metadata = {}) {
    const blockedEntry = {
      reason,
      timestamp: new Date(),
      ip: metadata.ip,
      userId: metadata.userId,
      details: metadata.details
    };

    // 📈 INCREMENTAR CONTADOR
    this.metrics.counters.blockedAttempts++;
    
    console.log(`🚫 Tentativa bloqueada: ${reason}`);
    
    // 🚨 CRIAR ALERTA SE MUITOS BLOQUEIOS
    if (this.metrics.counters.blockedAttempts > 50) {
      this.createAlert('high_blocked_attempts', 'Muitas tentativas bloqueadas detectadas');
    }
  }

  // 📊 OBTER MÉTRICAS ATUAIS
  getCurrentMetrics() {
    const now = new Date();
    const uptime = Math.floor((now - this.metrics.startTime) / 1000);

    return {
      // 👥 USUÁRIOS
      onlineUsers: this.metrics.onlineUsers.size,
      onlineUsersList: Array.from(this.metrics.onlineUsers.values()),
      
      // 📊 CONTADORES
      requestsPerMinute: this.getRequestsPerMinute(),
      toolsUsedToday: this.metrics.counters.toolsUsedToday,
      revenueToday: this.metrics.counters.revenueToday,
      blockedAttempts: this.metrics.counters.blockedAttempts,
      
      // 📈 ESTATÍSTICAS
      averageResponseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate(),
      topTools: this.getTopTools(),
      topIPs: this.getTopIPs(),
      
      // 🚨 ALERTAS
      activeAlerts: this.metrics.alerts.length,
      alerts: this.metrics.alerts,
      
      // ⏰ SISTEMA
      uptime,
      lastUpdate: this.metrics.lastUpdate,
      systemHealth: this.getSystemHealth()
    };
  }

  // 📊 CALCULAR REQUESTS POR MINUTO
  getRequestsPerMinute() {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentRequests = this.metrics.history.requests.filter(
      req => req.timestamp > oneMinuteAgo
    );
    return recentRequests.length;
  }

  // ⏱️ TEMPO MÉDIO DE RESPOSTA
  getAverageResponseTime() {
    const recentRequests = this.metrics.history.requests.slice(-100);
    if (recentRequests.length === 0) return 0;
    
    const totalDuration = recentRequests.reduce((sum, req) => sum + (req.duration || 0), 0);
    return Math.round(totalDuration / recentRequests.length);
  }

  // ❌ TAXA DE ERRO
  getErrorRate() {
    const recentRequests = this.metrics.history.requests.slice(-100);
    if (recentRequests.length === 0) return 0;
    
    const errorRequests = recentRequests.filter(req => req.statusCode >= 400);
    return Math.round((errorRequests.length / recentRequests.length) * 100);
  }

  // 🛠️ FERRAMENTAS MAIS USADAS
  getTopTools() {
    // 🎯 SIMULAÇÃO - EM PRODUÇÃO BUSCAR DO BANCO
    return [
      { tool: 'AI Generator', count: 1247, percentage: 35.2 },
      { tool: 'Video Creator', count: 892, percentage: 25.1 },
      { tool: 'Ebook Generator', count: 634, percentage: 17.9 },
      { tool: 'Content Writer', count: 445, percentage: 12.6 },
      { tool: 'Image Creator', count: 327, percentage: 9.2 }
    ];
  }

  // 🌐 IPs MAIS ATIVOS
  getTopIPs() {
    const ipCounts = {};
    this.metrics.history.requests.slice(-500).forEach(req => {
      ipCounts[req.ip] = (ipCounts[req.ip] || 0) + 1;
    });

    return Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, requests: count }));
  }

  // 🏥 SAÚDE DO SISTEMA
  getSystemHealth() {
    const errorRate = this.getErrorRate();
    const avgResponseTime = this.getAverageResponseTime();
    const requestsPerMinute = this.getRequestsPerMinute();

    let status = 'healthy';
    let score = 100;

    // 📊 AVALIAR MÉTRICAS
    if (errorRate > 10) {
      status = 'degraded';
      score -= 30;
    }
    
    if (avgResponseTime > 2000) {
      status = 'slow';
      score -= 20;
    }
    
    if (requestsPerMinute > 1000) {
      status = 'overloaded';
      score -= 25;
    }

    if (score < 50) status = 'critical';

    return {
      status,
      score,
      metrics: {
        errorRate,
        avgResponseTime,
        requestsPerMinute
      }
    };
  }

  // 🚨 CRIAR ALERTA
  createAlert(type, message, severity = 'medium') {
    const alert = {
      id: Date.now().toString(),
      type,
      message,
      severity,
      timestamp: new Date(),
      resolved: false
    };

    this.metrics.alerts.push(alert);
    
    // 🧹 MANTER APENAS ÚLTIMOS 50 ALERTAS
    if (this.metrics.alerts.length > 50) {
      this.metrics.alerts = this.metrics.alerts.slice(-50);
    }

    console.log(`🚨 ALERTA ${severity.toUpperCase()}: ${message}`);
  }

  // ✅ RESOLVER ALERTA
  resolveAlert(alertId) {
    const alert = this.metrics.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      console.log(`✅ Alerta resolvido: ${alert.message}`);
    }
  }

  // 📈 INCREMENTAR CONTADOR DE REQUESTS
  incrementRequestCounter() {
    // Implementação simples - em produção usar Redis ou similar
    this.metrics.counters.requestsPerMinute++;
  }

  // 🚨 VERIFICAR RATE LIMITING
  checkRateLimit(ip) {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const requestsFromIP = this.metrics.history.requests.filter(
      req => req.ip === ip && req.timestamp > oneMinuteAgo
    );

    if (requestsFromIP.length > 100) {
      this.createAlert('rate_limit_exceeded', `IP ${ip} excedeu rate limit`, 'high');
      return false;
    }

    return true;
  }

  // 🔍 VERIFICAR ATIVIDADE SUSPEITA
  async checkSuspiciousActivity(userId, logEntry) {
    // Verificar uso muito rápido
    const lastMinute = new Date(Date.now() - 60000);
    const recentActivity = this.metrics.history.requests.filter(
      req => req.timestamp > lastMinute && req.url.includes(userId)
    );

    if (recentActivity.length > 30) {
      this.createAlert('suspicious_activity', `Usuário ${userId} com atividade suspeita`, 'high');
      this.logBlockedAttempt('Atividade suspeita', { userId });
    }
  }

  // 📝 SALVAR LOG DE USO
  async saveUsageLog(logEntry) {
    // 🔍 EM PRODUÇÃO: SALVAR NO BANCO
    // await database.usageLogs.insertOne(logEntry);
    
    console.log(`📝 Log salvo: ${logEntry.tool} - ${logEntry.userId}`);
  }

  // 📊 ATUALIZAR HISTÓRICO DE USUÁRIOS
  updateUserHistory() {
    this.metrics.history.users.push({
      count: this.metrics.onlineUsers.size,
      timestamp: new Date()
    });

    // 🧹 MANTER APENAS ÚLTIMAS 1000 ENTRADAS
    if (this.metrics.history.users.length > 1000) {
      this.metrics.history.users = this.metrics.history.users.slice(-1000);
    }
  }

  // 🧹 LIMPEZA AUTOMÁTICA
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupOldData();
      this.removeInactiveUsers();
      this.metrics.lastUpdate = new Date();
    }, 60000); // A cada minuto
  }

  // 🧹 LIMPAR DADOS ANTIGOS
  cleanupOldData() {
    const oneHourAgo = new Date(Date.now() - 3600000);
    
    // Limpar requests antigos
    this.metrics.history.requests = this.metrics.history.requests.filter(
      req => req.timestamp > oneHourAgo
    );
    
    // Limpar alertas resolvidos antigos
    this.metrics.alerts = this.metrics.alerts.filter(
      alert => !alert.resolved || (new Date() - alert.resolvedAt) < 3600000
    );
  }

  // 👋 REMOVER USUÁRIOS INATIVOS
  removeInactiveUsers() {
    const fiveMinutesAgo = new Date(Date.now() - 300000);
    
    for (const [userId, userInfo] of this.metrics.onlineUsers.entries()) {
      if (userInfo.lastSeen < fiveMinutesAgo) {
        this.metrics.onlineUsers.delete(userId);
        console.log(`👋 Usuário removido por inatividade: ${userId}`);
      }
    }
  }
}

// 📊 INSTÂNCIA GLOBAL DO SISTEMA
export const realTimeMetrics = new RealTimeMetricsSystem();

// 🚀 FUNÇÕES AUXILIARES PARA USO FÁCIL
export const trackUser = (userId, metadata) => realTimeMetrics.registerUserOnline(userId, metadata);
export const trackTool = (data) => realTimeMetrics.logToolUsage(data);
export const trackRevenue = (amount, metadata) => realTimeMetrics.logRevenue(amount, metadata);
export const trackRequest = (req, res, duration) => realTimeMetrics.logRequest(req, res, duration);
export const getMetrics = () => realTimeMetrics.getCurrentMetrics();
