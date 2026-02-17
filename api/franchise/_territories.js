// 🌍 API PARA OBTER TERRITÓRIOS DISPONÍVEIS - SUPABASE INTEGRATION
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // 🌍 OBTER TERRITÓRIOS DO SUPABASE
    const { data: territories, error: territoriesError } = await supabase
      .from('franchise_territories')
      .select('*')
      .order('name');

    if (territoriesError) {
      console.error('Erro ao buscar territórios:', territoriesError);
      return res.status(500).json({ error: 'Erro ao buscar territórios' });
    }

    // 📊 OBTER ESTATÍSTICAS REAIS
    const { data: franchises, error: franchisesError } = await supabase
      .from('franchises')
      .select('status');

    if (franchisesError) {
      console.error('Erro ao buscar franquias:', franchisesError);
    }

    const totalFranchises = franchises?.length || 0;
    const activeFranchises = franchises?.filter(f => f.status === 'active').length || 0;
    const availableTerritories = territories?.filter(t => t.status === 'available').length || 0;

    res.status(200).json({
      success: true,
      territories: territories || [],
      stats: {
        availableTerritories,
        totalFranchises,
        activeFranchises
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
