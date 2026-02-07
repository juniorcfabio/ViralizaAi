// 💰 API DE PREÇOS DINÂMICOS
import { smartPricing } from '../../lib/smartPricingEngine.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { 
      planType, 
      userContext = {},
      getAllPlans = false 
    } = req.body;

    // 🌍 DETECTAR PAÍS PELO IP
    const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const country = await detectCountryFromIP(userIP);

    // 👤 CONTEXTO COMPLETO DO USUÁRIO
    const fullContext = {
      country,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer,
      timestamp: new Date(),
      ...userContext
    };

    let result;

    if (getAllPlans) {
      // 📊 OBTER PREÇOS PARA TODOS OS PLANOS
      result = await smartPricing.getAllPlanPrices(fullContext);
    } else {
      // 💰 OBTER PREÇO PARA PLANO ESPECÍFICO
      if (!planType) {
        return res.status(400).json({ error: 'planType é obrigatório' });
      }
      result = await smartPricing.calculateDynamicPrice(planType, fullContext);
    }

    res.status(200).json({
      success: true,
      pricing: result,
      context: {
        country,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('🚨 Erro na API de preços dinâmicos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// 🌍 DETECTAR PAÍS PELO IP
async function detectCountryFromIP(ip) {
  try {
    // EM PRODUÇÃO: Usar serviço como MaxMind ou ipapi.co
    // const response = await fetch(`http://ipapi.co/${ip}/country_code/`);
    // return await response.text();
    
    // Simulação para desenvolvimento
    return 'BR';
  } catch (error) {
    return 'BR'; // Default para Brasil
  }
}
