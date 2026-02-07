// 📚 DOCUMENTAÇÃO DA API GLOBAL
import { globalAPI } from '../../lib/globalAPISystem.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // 📋 OBTER ENDPOINTS DISPONÍVEIS
    const endpoints = globalAPI.getAvailableEndpoints();
    
    // 💰 OBTER PLANOS DE PREÇOS
    const pricingTiers = globalAPI.pricingTiers;
    
    // ⏱️ OBTER LIMITES DE TAXA
    const rateLimits = globalAPI.rateLimitTiers;

    // 📚 DOCUMENTAÇÃO COMPLETA
    const documentation = {
      title: "ViralizaAI Global API",
      version: "1.0.0",
      description: "API global para ferramentas de IA e marketing digital",
      base_url: "https://api.viralizaai.com/v1",
      
      authentication: {
        type: "API Key",
        header: "X-API-Key",
        alternative: "Authorization: Bearer {api_key}",
        example: "X-API-Key: vir_1234567890_abcdef123456"
      },
      
      rate_limits: {
        description: "Limites baseados no seu plano",
        tiers: rateLimits
      },
      
      pricing: {
        description: "Planos e preços da API",
        tiers: pricingTiers,
        billing: "Mensal com cobrança por uso excedente"
      },
      
      endpoints: endpoints.map(endpoint => ({
        id: endpoint.id,
        path: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        category: endpoint.category,
        cost: `$${endpoint.cost.toFixed(4)} por request`,
        rate_limit: endpoint.rateLimit,
        
        // 📝 EXEMPLOS DE USO
        examples: getEndpointExamples(endpoint.id)
      })),
      
      response_format: {
        success: {
          success: true,
          data: "{ resultado do endpoint }",
          meta: {
            endpoint: "/api/v1/endpoint",
            cost: 0.10,
            timestamp: "2024-01-01T00:00:00Z",
            client_id: "api_1234567890",
            remaining_requests: 950
          }
        },
        error: {
          success: false,
          error: "Descrição do erro",
          endpoint: "endpoint-id"
        }
      },
      
      error_codes: {
        400: "Bad Request - Parâmetros inválidos",
        401: "Unauthorized - API key inválida ou ausente",
        403: "Forbidden - Acesso negado",
        404: "Not Found - Endpoint não encontrado",
        429: "Too Many Requests - Rate limit excedido",
        500: "Internal Server Error - Erro interno"
      },
      
      getting_started: {
        step1: "Crie uma conta em https://viralizaai.com/api",
        step2: "Obtenha sua API key no dashboard",
        step3: "Faça sua primeira requisição",
        example_request: {
          curl: `curl -X POST https://api.viralizaai.com/v1/ai/generate-content \\
  -H "X-API-Key: sua_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"topic": "marketing digital", "style": "viral"}'`
        }
      },
      
      sdks: {
        javascript: "npm install @viralizaai/api-client",
        python: "pip install viralizaai-api",
        php: "composer require viralizaai/api-client",
        curl: "Exemplos em cURL disponíveis para cada endpoint"
      },
      
      support: {
        documentation: "https://docs.viralizaai.com/api",
        community: "https://community.viralizaai.com",
        email: "api-support@viralizaai.com",
        status: "https://status.viralizaai.com"
      }
    };

    // 🎨 RETORNAR DOCUMENTAÇÃO FORMATADA
    res.status(200).json(documentation);

  } catch (error) {
    console.error('🚨 Erro na documentação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// 📝 OBTER EXEMPLOS DE USO PARA CADA ENDPOINT
function getEndpointExamples(endpointId) {
  const examples = {
    'ai-content-generator': {
      request: {
        topic: "marketing digital",
        style: "viral",
        length: "medium"
      },
      response: {
        content: "🔥 Descubra os 5 segredos do marketing digital que 99% ignora!",
        hashtags: ["#marketing", "#digital", "#viral"],
        engagement_score: 8.5
      }
    },
    
    'hashtag-analyzer': {
      request: {
        hashtags: ["#marketing", "#digital", "#viral"]
      },
      response: {
        analysis: {
          reach_potential: "500K - 1M",
          competition: "Medium",
          trending_score: 7.2
        }
      }
    },
    
    'sentiment-analysis': {
      request: {
        text: "Adorei este produto! Recomendo muito!"
      },
      response: {
        sentiment: "positive",
        confidence: 0.95,
        emotions: ["joy", "satisfaction"]
      }
    },
    
    'image-generator': {
      request: {
        prompt: "Logo moderno para empresa de tecnologia",
        style: "minimalist",
        dimensions: "1024x1024"
      },
      response: {
        image_url: "https://api.viralizaai.com/generated/image_123.jpg",
        style: "minimalist",
        dimensions: "1024x1024"
      }
    }
  };

  return examples[endpointId] || {
    request: "Parâmetros específicos do endpoint",
    response: "Resposta específica do endpoint"
  };
}
