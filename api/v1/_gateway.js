// 🌍 GATEWAY DA API GLOBAL - PONTO DE ENTRADA ÚNICO
import { globalAPI } from '../../lib/globalAPISystem.js';

export default async function handler(req, res) {
  try {
    // 🔑 EXTRAIR API KEY
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'API key obrigatória',
        message: 'Inclua sua API key no header X-API-Key ou Authorization'
      });
    }

    // ✅ VALIDAR API KEY
    const validation = await globalAPI.validateAPIKey(apiKey);
    if (!validation.valid) {
      return res.status(401).json({
        error: 'API key inválida',
        message: validation.error
      });
    }

    const client = validation.client;

    // 🔍 IDENTIFICAR ENDPOINT
    const path = req.url.replace('/api/v1', '');
    const endpointId = identifyEndpoint(path, req.method);
    
    if (!endpointId) {
      return res.status(404).json({
        error: 'Endpoint não encontrado',
        available_endpoints: '/api/v1/docs'
      });
    }

    // ⏱️ VERIFICAR RATE LIMIT
    const rateLimitCheck = await globalAPI.checkRateLimit(client.id, endpointId);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit excedido',
        message: rateLimitCheck.error,
        reset_time: rateLimitCheck.resetTime
      });
    }

    // 📝 EXTRAIR PARÂMETROS
    const parameters = {
      ...req.query,
      ...req.body
    };

    // 🚀 EXECUTAR ENDPOINT
    const result = await globalAPI.executeAPIEndpoint(endpointId, parameters, client.id);

    if (result.success) {
      // ✅ RESPOSTA DE SUCESSO
      res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          endpoint: result.endpoint,
          cost: result.cost,
          timestamp: result.timestamp,
          client_id: client.id,
          remaining_requests: getRemainingRequests(client)
        }
      });
    } else {
      // ❌ RESPOSTA DE ERRO
      res.status(400).json({
        success: false,
        error: result.error,
        endpoint: endpointId
      });
    }

  } catch (error) {
    console.error('🚨 Erro no gateway da API:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Tente novamente em alguns instantes'
    });
  }
}

// 🔍 IDENTIFICAR ENDPOINT PELA URL
function identifyEndpoint(path, method) {
  const endpointMap = {
    // 🤖 IA E CONTEÚDO
    'POST:/ai/generate-content': 'ai-content-generator',
    'POST:/social/hashtags/analyze': 'hashtag-analyzer',
    'POST:/ai/sentiment': 'sentiment-analysis',
    
    // 📊 ANALYTICS
    'GET:/analytics/social-metrics': 'social-metrics',
    'POST:/analytics/competitors': 'competitor-analysis',
    
    // 🎨 MÍDIA
    'POST:/media/generate-image': 'image-generator',
    'POST:/media/edit-video': 'video-editor',
    
    // 🛠️ FERRAMENTAS
    'POST:/tools/shorten-url': 'url-shortener',
    'POST:/tools/generate-qr': 'qr-generator'
  };

  const key = `${method}:${path}`;
  return endpointMap[key] || null;
}

// 📊 CALCULAR REQUESTS RESTANTES
function getRemainingRequests(client) {
  const limits = globalAPI.rateLimitTiers[client.tier];
  
  if (limits.requests_per_hour === 'unlimited') {
    return 'unlimited';
  }
  
  return Math.max(0, limits.requests_per_hour - client.usage.thisHour);
}
