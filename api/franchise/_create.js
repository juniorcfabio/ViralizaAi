// 🏢 API PARA CRIAR FRANQUIA DIGITAL - SUPABASE INTEGRATION
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { 
      territoryId, 
      packageType, 
      franchiseeData 
    } = req.body;

    // ✅ VALIDAR DADOS
    if (!territoryId || !packageType || !franchiseeData) {
      return res.status(400).json({ 
        error: 'territoryId, packageType e franchiseeData são obrigatórios' 
      });
    }

    // �️ VERIFICAR DISPONIBILIDADE DO TERRITÓRIO
    const { data: territory, error: territoryError } = await supabase
      .from('franchise_territories')
      .select('*')
      .eq('id', territoryId)
      .eq('status', 'available')
      .single();

    if (territoryError || !territory) {
      return res.status(400).json({ 
        error: 'Território não encontrado ou não disponível' 
      });
    }

    // 💰 DEFINIR PREÇO E ROYALTY PELO PACOTE
    const packagePrices = {
      starter: 15000,
      professional: 35000,
      enterprise: 75000
    };

    const packageRoyalties = {
      starter: 0.08,
      professional: 0.12,
      enterprise: 0.15
    };

    const packagePrice = packagePrices[packageType];
    const royaltyRate = packageRoyalties[packageType];

    if (!packagePrice || !royaltyRate) {
      return res.status(400).json({ 
        error: 'Pacote inválido' 
      });
    }

    // 🏢 CRIAR FRANQUIA NO SUPABASE
    const { data: franchise, error: franchiseError } = await supabase
      .from('franchises')
      .insert({
        territory_id: territoryId,
        franchisee_id: franchiseeData.userId || 'temp_' + Date.now(),
        franchisee_name: franchiseeData.name,
        franchisee_email: franchiseeData.email,
        franchisee_phone: franchiseeData.phone,
        company_name: franchiseeData.company,
        package_type: packageType,
        package_price: packagePrice,
        royalty_rate: royaltyRate,
        status: 'pending',
        contract_signed: false,
        payment_status: 'pending'
      })
      .select()
      .single();

    if (franchiseError) {
      console.error('Erro ao criar franquia:', franchiseError);
      return res.status(500).json({ 
        error: 'Erro ao criar franquia',
        details: franchiseError.message 
      });
    }

    // 🗺️ ATUALIZAR STATUS DO TERRITÓRIO
    await supabase
      .from('franchise_territories')
      .update({ 
        status: 'sold',
        franchisee_id: franchiseeData.userId || 'temp_' + Date.now(),
        franchise_package: packageType
      })
      .eq('id', territoryId);

    // 📊 REGISTRAR ATIVIDADE
    await supabase.from('activity_logs').insert({
      user_id: franchiseeData.userId || 'system',
      action: 'franchise_created',
      details: {
        franchise_id: franchise.id,
        territory_id: territoryId,
        package_type: packageType,
        package_price: packagePrice
      }
    });

    res.status(201).json({
      success: true,
      franchise,
      territory,
      message: 'Franquia criada com sucesso!'
    });

  } catch (error) {
    console.error('🚨 Erro na criação de franquia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
