// 📈 API ADMIN - MÉTRICAS EM TEMPO REAL
import { requireAdmin, logAdminAction } from "../../lib/requireAdmin.js";
import { realTimeMetrics } from "../../lib/realTimeMetrics.js";
import { fraudDetection } from "../../lib/fraudDetection.js";

export default async function handler(req, res) {
  // 🔒 PROTEÇÃO ADMIN
  await new Promise((resolve, reject) => {
    requireAdmin(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  try {
    const { action, period = "1h" } = req.query;

    console.log("📊 Buscando métricas em tempo real...", { action, period });

    let responseData = {};

    switch (action) {
      case 'current':
        responseData = await getCurrentMetrics();
        break;
      case 'fraud':
        responseData = await getFraudMetrics();
        break;
      case 'performance':
        responseData = await getPerformanceMetrics();
        break;
      case 'alerts':
        responseData = await getActiveAlerts();
        break;
      default:
        responseData = await getAllMetrics();
    }

    logAdminAction("VIEW_REAL_TIME_METRICS", { 
      action,
      onlineUsers: responseData.current?.onlineUsers || 0
    });

    res.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("🚨 Erro na API admin/real-time-metrics:", error);
    res.status(500).json({ 
      error: "Erro ao buscar métricas em tempo real",
      details: error.message 
    });
  }
}

// 📊 MÉTRICAS ATUAIS
async function getCurrentMetrics() {
  const metrics = realTimeMetrics.getCurrentMetrics();
  
  return {
    // 👥 USUÁRIOS EM TEMPO REAL
    onlineUsers: metrics.onlineUsers,
    onlineUserDetails: metrics.onlineUsersList.slice(0, 10), // Primeiros 10
    
    // 📊 ATIVIDADE ATUAL
    requestsPerMinute: metrics.requestsPerMinute,
    toolsUsedToday: metrics.toolsUsedToday,
    revenueToday: metrics.revenueToday,
    
    // 🚫 SEGURANÇA
    blockedAttempts: metrics.blockedAttempts,
    activeAlerts: metrics.activeAlerts,
    
    // 📈 PERFORMANCE
    averageResponseTime: metrics.averageResponseTime,
    errorRate: metrics.errorRate,
    systemHealth: metrics.systemHealth,
    
    // ⏰ SISTEMA
    uptime: metrics.uptime,
    lastUpdate: metrics.lastUpdate
  };
}

// 🚨 MÉTRICAS DE FRAUDE
async function getFraudMetrics() {
  // 🎯 SIMULAÇÃO - EM PRODUÇÃO BUSCAR DO BANCO
  const mockFraudData = {
    // 📊 ESTATÍSTICAS DE FRAUDE
    totalFraudAttempts: 47,
    blockedToday: 12,
    suspendedUsers: 3,
    flaggedUsers: 8,
    
    // 🔍 TIPOS DE FRAUDE DETECTADOS
    fraudTypes: [
      { type: 'Uso extremo', count: 18, percentage: 38.3 },
      { type: 'Padrão de bot', count: 12, percentage: 25.5 },
      { type: 'IP suspeito', count: 9, percentage: 19.1 },
      { type: 'Pagamento fraudulento', count: 5, percentage: 10.6 },
      { type: 'Atividade noturna', count: 3, percentage: 6.4 }
    ],
    
    // 📈 TENDÊNCIA DE FRAUDE
    fraudTrend: [
      { date: '2026-01-24', attempts: 8 },
      { date: '2026-01-25', attempts: 12 },
      { date: '2026-01-26', attempts: 15 },
      { date: '2026-01-27', attempts: 9 },
      { date: '2026-01-28', attempts: 18 },
      { date: '2026-01-29', attempts: 14 },
      { date: '2026-01-30', attempts: 12 }
    ],
    
    // 🚨 USUÁRIOS EM RISCO
    usersAtRisk: [
      {
        userId: 'USER456',
        riskScore: 75,
        riskLevel: 'ALTO',
        reasons: ['Uso extremo', 'Mudanças de IP'],
        lastActivity: '2026-01-30T16:30:00Z'
      },
      {
        userId: 'USER789',
        riskScore: 65,
        riskLevel: 'MÉDIO',
        reasons: ['Padrão repetitivo', 'Atividade noturna'],
        lastActivity: '2026-01-30T15:45:00Z'
      }
    ],
    
    // 🌍 PAÍSES COM MAIS FRAUDE
    fraudByCountry: [
      { country: 'Brasil', attempts: 28, percentage: 59.6 },
      { country: 'Desconhecido', attempts: 12, percentage: 25.5 },
      { country: 'Argentina', attempts: 4, percentage: 8.5 },
      { country: 'México', attempts: 3, percentage: 6.4 }
    ]
  };

  return mockFraudData;
}

// ⚡ MÉTRICAS DE PERFORMANCE
async function getPerformanceMetrics() {
  const metrics = realTimeMetrics.getCurrentMetrics();
  
  return {
    // 📊 PERFORMANCE ATUAL
    responseTime: {
      current: metrics.averageResponseTime,
      target: 500, // ms
      status: metrics.averageResponseTime < 500 ? 'good' : 'slow'
    },
    
    // 📈 THROUGHPUT
    throughput: {
      requestsPerMinute: metrics.requestsPerMinute,
      requestsPerHour: metrics.requestsPerMinute * 60,
      peakToday: 2341 // Simulado
    },
    
    // ❌ TAXA DE ERRO
    errorRate: {
      current: metrics.errorRate,
      target: 1, // %
      status: metrics.errorRate < 1 ? 'good' : 'high'
    },
    
    // 🛠️ FERRAMENTAS MAIS USADAS
    topTools: metrics.topTools,
    
    // 🌐 IPs MAIS ATIVOS
    topIPs: metrics.topIPs,
    
    // 📊 DISTRIBUIÇÃO DE STATUS CODES
    statusCodes: {
      '200': 1847,
      '201': 234,
      '400': 12,
      '401': 8,
      '403': 15,
      '404': 3,
      '500': 2
    },
    
    // 🏥 SAÚDE DOS ENDPOINTS
    endpointHealth: [
      { endpoint: '/api/use-tool', avgTime: 245, errorRate: 0.2, status: 'healthy' },
      { endpoint: '/api/pix-payment', avgTime: 1200, errorRate: 0.8, status: 'healthy' },
      { endpoint: '/api/check-payment', avgTime: 180, errorRate: 0.1, status: 'healthy' },
      { endpoint: '/api/stripe-webhook', avgTime: 95, errorRate: 0.0, status: 'healthy' },
      { endpoint: '/api/admin/users', avgTime: 320, errorRate: 0.0, status: 'healthy' }
    ]
  };
}

// 🚨 ALERTAS ATIVOS
async function getActiveAlerts() {
  const metrics = realTimeMetrics.getCurrentMetrics();
  
  // 🎯 COMBINAR ALERTAS DO SISTEMA COM ALERTAS PERSONALIZADOS
  const systemAlerts = metrics.alerts;
  
  const customAlerts = [
    {
      id: 'revenue_spike',
      type: 'revenue',
      message: 'Pico de receita detectado: +45% nas últimas 2 horas',
      severity: 'info',
      timestamp: new Date(Date.now() - 7200000), // 2 horas atrás
      resolved: false
    },
    {
      id: 'new_user_surge',
      type: 'users',
      message: '12 novos usuários registrados na última hora',
      severity: 'info',
      timestamp: new Date(Date.now() - 3600000), // 1 hora atrás
      resolved: false
    }
  ];

  const allAlerts = [...systemAlerts, ...customAlerts]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return {
    total: allAlerts.length,
    unresolved: allAlerts.filter(a => !a.resolved).length,
    bySeverity: {
      critical: allAlerts.filter(a => a.severity === 'critical').length,
      high: allAlerts.filter(a => a.severity === 'high').length,
      medium: allAlerts.filter(a => a.severity === 'medium').length,
      low: allAlerts.filter(a => a.severity === 'low').length,
      info: allAlerts.filter(a => a.severity === 'info').length
    },
    alerts: allAlerts.slice(0, 20) // Últimos 20 alertas
  };
}

// 📊 TODAS AS MÉTRICAS
async function getAllMetrics() {
  const [current, fraud, performance, alerts] = await Promise.all([
    getCurrentMetrics(),
    getFraudMetrics(),
    getPerformanceMetrics(),
    getActiveAlerts()
  ]);

  return {
    current,
    fraud,
    performance,
    alerts,
    summary: {
      status: current.systemHealth.status,
      score: current.systemHealth.score,
      criticalAlerts: alerts.bySeverity.critical,
      onlineUsers: current.onlineUsers,
      revenueToday: current.revenueToday,
      blockedAttempts: current.blockedAttempts
    }
  };
}
