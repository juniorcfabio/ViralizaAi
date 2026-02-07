// 🏢 API PARA CRIAR FRANQUIA DIGITAL
import { franchiseSystem } from '../../lib/franchiseSystem.js';
import { authMiddleware } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // 🔐 VERIFICAR AUTENTICAÇÃO
    const user = await authMiddleware(req);
    if (!user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const { 
      territoryId, 
      packageType, 
      franchiseeData 
    } = req.body;

    // ✅ VALIDAR DADOS
    if (!territoryId || !packageType) {
      return res.status(400).json({ 
        error: 'territoryId e packageType são obrigatórios' 
      });
    }

    // 👤 DADOS DO FRANQUEADO
    const fullFranchiseeData = {
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: franchiseeData?.phone,
      company: franchiseeData?.company,
      experience: franchiseeData?.experience,
      investment: franchiseeData?.investment,
      ...franchiseeData
    };

    // 🏢 CRIAR FRANQUIA
    const result = await franchiseSystem.createFranchise(
      fullFranchiseeData,
      territoryId,
      packageType
    );

    if (result.success) {
      res.status(201).json({
        success: true,
        ...result,
        message: 'Franquia criada com sucesso!'
      });
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('🚨 Erro na criação de franquia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
