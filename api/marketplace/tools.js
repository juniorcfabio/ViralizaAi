// 🛒 API DO MARKETPLACE DE FERRAMENTAS
import { marketplace } from '../../lib/marketplaceSystem.js';
import { authMiddleware } from '../../lib/auth.js';

export default async function handler(req, res) {
  try {
    // 🔐 VERIFICAR AUTENTICAÇÃO
    const user = await authMiddleware(req);
    if (!user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    switch (req.method) {
      case 'GET':
        return await handleGetTools(req, res, user);
      case 'POST':
        return await handlePurchaseTool(req, res, user);
      default:
        return res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('🚨 Erro na API do marketplace:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// 📋 OBTER FERRAMENTAS
async function handleGetTools(req, res, user) {
  const {
    category,
    search,
    sortBy,
    maxPrice,
    userTools = false
  } = req.query;

  if (userTools === 'true') {
    // 👤 OBTER FERRAMENTAS DO USUÁRIO
    const result = await marketplace.getUserTools(user.id);
    return res.status(200).json(result);
  }

  // 🛒 OBTER TODAS AS FERRAMENTAS DO MARKETPLACE
  const filters = {
    category,
    search,
    sortBy,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    minPlan: user.plano
  };

  const result = await marketplace.getMarketplaceTools(filters);
  
  res.status(200).json({
    success: true,
    ...result,
    userPlan: user.plano
  });
}

// 💰 COMPRAR FERRAMENTA
async function handlePurchaseTool(req, res, user) {
  const { toolId } = req.body;

  if (!toolId) {
    return res.status(400).json({ error: 'toolId é obrigatório' });
  }

  // 🔒 VERIFICAR SE PLANO ESTÁ ATIVO
  if (!user.plano_ativo) {
    return res.status(403).json({ 
      error: 'Plano inativo',
      message: 'Você precisa de um plano ativo para comprar ferramentas'
    });
  }

  const result = await marketplace.purchaseTool(user.id, toolId, user.plano);
  
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
}
