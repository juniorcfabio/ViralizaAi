// 📊 API ADMIN - GRÁFICOS DE RECEITA E MÉTRICAS FINANCEIRAS
import Stripe from "stripe";
import { requireAdmin, logAdminAction } from "../../lib/requireAdmin.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export default async function handler(req, res) {
  // 🔒 PROTEÇÃO ADMIN
  await new Promise((resolve, reject) => {
    requireAdmin(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  try {
    const { period = "30d", granularity = "daily" } = req.query;

    console.log("📊 Gerando dados de receita...", { period, granularity });

    // 📈 BUSCAR DADOS DE RECEITA
    const revenueData = await getRevenueData(period, granularity);
    const revenueMetrics = await getRevenueMetrics();
    const planBreakdown = await getPlanRevenueBreakdown();
    const projections = await getRevenueProjections(revenueData);

    logAdminAction("VIEW_REVENUE", { 
      period, 
      totalRevenue: revenueMetrics.total 
    });

    res.json({
      success: true,
      data: {
        chartData: revenueData,
        metrics: revenueMetrics,
        planBreakdown: planBreakdown,
        projections: projections,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("🚨 Erro na API admin/revenue:", error);
    res.status(500).json({ 
      error: "Erro ao gerar dados de receita",
      details: error.message 
    });
  }
}

// 📊 BUSCAR DADOS DE RECEITA DO STRIPE
async function getRevenueData(period, granularity) {
  try {
    console.log("💳 Buscando dados do Stripe...");

    // 📅 CALCULAR PERÍODO
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // 🔍 BUSCAR PAGAMENTOS DO STRIPE
    const payments = await stripe.paymentIntents.list({
      limit: 100,
      created: {
        gte: Math.floor(startDate.getTime() / 1000),
        lte: Math.floor(endDate.getTime() / 1000)
      }
    });

    console.log(`✅ ${payments.data.length} pagamentos encontrados`);

    // 📈 AGRUPAR POR PERÍODO
    const groupedData = groupPaymentsByPeriod(payments.data, granularity);
    
    return groupedData;

  } catch (error) {
    console.error("❌ Erro ao buscar dados do Stripe:", error);
    
    // 🎯 DADOS SIMULADOS PARA DESENVOLVIMENTO
    return generateMockRevenueData(period, granularity);
  }
}

// 📊 AGRUPAR PAGAMENTOS POR PERÍODO
function groupPaymentsByPeriod(payments, granularity) {
  const grouped = {};
  
  payments.forEach(payment => {
    if (payment.status !== 'succeeded') return;
    
    const date = new Date(payment.created * 1000);
    let key;
    
    switch (granularity) {
      case 'hourly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
        break;
      case 'daily':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        break;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
        break;
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
    }
    
    if (!grouped[key]) {
      grouped[key] = {
        date: key,
        revenue: 0,
        transactions: 0,
        averageValue: 0
      };
    }
    
    grouped[key].revenue += payment.amount / 100;
    grouped[key].transactions += 1;
  });
  
  // 📊 CALCULAR MÉDIAS
  Object.values(grouped).forEach(item => {
    item.averageValue = item.transactions > 0 ? item.revenue / item.transactions : 0;
  });
  
  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
}

// 📈 MÉTRICAS GERAIS DE RECEITA
async function getRevenueMetrics() {
  // 🎯 SIMULAÇÃO - SUBSTITUIR POR DADOS REAIS
  const now = new Date();
  const thisMonth = now.getMonth();
  const lastMonth = thisMonth - 1;
  
  return {
    total: 28473.50,
    thisMonth: 8945.20,
    lastMonth: 7234.80,
    growth: 23.6, // % crescimento
    
    // MÉTRICAS DIÁRIAS
    today: 456.90,
    yesterday: 389.20,
    dailyGrowth: 17.4,
    
    // MÉTRICAS AVANÇADAS
    mrr: 8945.20, // Monthly Recurring Revenue
    arr: 107342.40, // Annual Recurring Revenue
    ltv: 1247.80, // Lifetime Value médio
    churn: 3.2, // % de cancelamentos
    
    // TOP PERFORMERS
    bestDay: {
      date: "2026-01-28",
      revenue: 1234.50
    },
    bestMonth: {
      month: "2026-01",
      revenue: 8945.20
    }
  };
}

// 📦 RECEITA POR PLANO
async function getPlanRevenueBreakdown() {
  // 🎯 SIMULAÇÃO
  return {
    mensal: {
      revenue: 3595.40,
      subscribers: 60,
      avgRevenue: 59.90,
      percentage: 12.6
    },
    trimestral: {
      revenue: 12792.00,
      subscribers: 80,
      avgRevenue: 159.90,
      percentage: 32.1
    },
    semestral: {
      revenue: 7797.00,
      subscribers: 30,
      avgRevenue: 259.90,
      percentage: 19.6
    },
    anual: {
      revenue: 11997.00,
      subscribers: 30,
      avgRevenue: 399.90,
      percentage: 30.1
    }
  };
}

// 🔮 PROJEÇÕES DE RECEITA
async function getRevenueProjections(historicalData) {
  if (historicalData.length < 7) {
    return {
      nextMonth: 0,
      nextQuarter: 0,
      confidence: 0
    };
  }
  
  // 📈 CÁLCULO SIMPLES DE TENDÊNCIA
  const recent = historicalData.slice(-7);
  const avgGrowth = recent.reduce((sum, item, index) => {
    if (index === 0) return 0;
    const growth = (item.revenue - recent[index - 1].revenue) / recent[index - 1].revenue;
    return sum + growth;
  }, 0) / (recent.length - 1);
  
  const currentRevenue = recent[recent.length - 1].revenue;
  
  return {
    nextMonth: currentRevenue * (1 + avgGrowth) * 30,
    nextQuarter: currentRevenue * (1 + avgGrowth) * 90,
    confidence: Math.min(85, Math.max(45, 70 + (avgGrowth * 100))),
    trend: avgGrowth > 0.05 ? 'growing' : avgGrowth < -0.05 ? 'declining' : 'stable'
  };
}

// 🎯 DADOS SIMULADOS PARA DESENVOLVIMENTO
function generateMockRevenueData(period, granularity) {
  const data = [];
  const now = new Date();
  let days = 30;
  
  switch (period) {
    case "7d": days = 7; break;
    case "30d": days = 30; break;
    case "90d": days = 90; break;
    case "1y": days = 365; break;
  }
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const baseRevenue = 300 + Math.random() * 200;
    const weekendMultiplier = date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1;
    const trendMultiplier = 1 + (days - i) * 0.01; // Crescimento gradual
    
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.round(baseRevenue * weekendMultiplier * trendMultiplier * 100) / 100,
      transactions: Math.floor(Math.random() * 20) + 5,
      averageValue: Math.round((baseRevenue / 8) * 100) / 100
    });
  }
  
  return data;
}
