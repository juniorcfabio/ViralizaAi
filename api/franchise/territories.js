// 🌍 API PARA OBTER TERRITÓRIOS DISPONÍVEIS
import { franchiseSystem } from '../../lib/franchiseSystem.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // 🌍 OBTER TERRITÓRIOS DISPONÍVEIS
    const territories = franchiseSystem.getAvailableTerritories();
    
    // 📊 OBTER ESTATÍSTICAS
    const stats = franchiseSystem.getFranchiseStats();

    res.status(200).json({
      success: true,
      territories,
      stats: {
        availableTerritories: territories.length,
        totalFranchises: stats.totalFranchises,
        activeFranchises: stats.activeFranchises
      },
      packages: {
        starter: {
          name: 'Franquia Starter',
          price: 15000,
          royalty: '8%',
          features: ['Plataforma básica', 'Suporte email', 'Treinamento online']
        },
        professional: {
          name: 'Franquia Professional', 
          price: 35000,
          royalty: '12%',
          features: ['Plataforma completa', 'Suporte prioritário', 'Treinamento presencial']
        },
        enterprise: {
          name: 'Franquia Enterprise',
          price: 75000,
          royalty: '15%',
          features: ['Plataforma premium', 'Suporte 24/7', 'Customização total']
        }
      }
    });

  } catch (error) {
    console.error('🚨 Erro ao obter territórios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
