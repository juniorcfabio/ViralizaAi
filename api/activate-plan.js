// =======================
// 🔐 API ATIVAÇÃO DE PLANO ESPECÍFICO
// =======================

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('🔐 ATIVAÇÃO DE PLANO - Iniciando...');
    
    const { 
      userId, 
      planType, 
      planName, 
      amount, 
      paymentMethod, 
      pixKey, 
      userEmail 
    } = req.body;

    // Validações
    if (!userId || !planType || !planName || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dados obrigatórios: userId, planType, planName, amount' 
      });
    }

    // 📋 DEFINIR PERMISSÕES POR PLANO
    const planPermissions = {
      'mensal': {
        tools: ['basic_tools', 'social_media', 'content_generator'],
        features: ['basic_analytics', 'standard_support'],
        limits: { videos_per_month: 10, ebooks_per_month: 5 }
      },
      'trimestral': {
        tools: ['basic_tools', 'social_media', 'content_generator', 'advanced_analytics'],
        features: ['advanced_analytics', 'priority_support', 'custom_templates'],
        limits: { videos_per_month: 30, ebooks_per_month: 15 }
      },
      'semestral': {
        tools: ['basic_tools', 'social_media', 'content_generator', 'advanced_analytics', 'ai_tools'],
        features: ['advanced_analytics', 'priority_support', 'custom_templates', 'white_label'],
        limits: { videos_per_month: 60, ebooks_per_month: 30 }
      },
      'anual': {
        tools: ['all_tools', 'premium_features', 'enterprise_tools'],
        features: ['all_features', 'dedicated_support', 'custom_integrations', 'api_access'],
        limits: { videos_per_month: 'unlimited', ebooks_per_month: 'unlimited' }
      }
    };

    const selectedPlan = planPermissions[planType.toLowerCase()];
    
    if (!selectedPlan) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tipo de plano inválido' 
      });
    }

    // 📅 CALCULAR DATA DE EXPIRAÇÃO
    const now = new Date();
    let expirationDate;
    
    switch (planType.toLowerCase()) {
      case 'mensal':
        expirationDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 dias
        break;
      case 'trimestral':
        expirationDate = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 dias
        break;
      case 'semestral':
        expirationDate = new Date(now.getTime() + (180 * 24 * 60 * 60 * 1000)); // 180 dias
        break;
      case 'anual':
        expirationDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 365 dias
        break;
      default:
        expirationDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // Padrão 30 dias
    }

    // 💾 DADOS DA ASSINATURA ATIVA
    const subscriptionData = {
      userId: userId,
      planType: planType,
      planName: planName,
      amount: amount,
      paymentMethod: paymentMethod,
      pixKey: pixKey,
      userEmail: userEmail,
      activatedAt: now.toISOString(),
      expiresAt: expirationDate.toISOString(),
      status: 'active',
      permissions: selectedPlan,
      paymentConfirmed: true
    };

    console.log('📋 Dados da assinatura:', subscriptionData);

    // 🔄 ATUALIZAR USUÁRIO NO LOCALSTORAGE (SIMULAÇÃO)
    // Em produção, isso seria salvo no banco de dados
    console.log('✅ Plano ativado com sucesso!');
    console.log(`🔓 Ferramentas liberadas: ${selectedPlan.tools.join(', ')}`);
    console.log(`📅 Válido até: ${expirationDate.toLocaleDateString('pt-BR')}`);

    return res.status(200).json({
      success: true,
      message: 'Plano ativado com sucesso',
      subscription: subscriptionData,
      permissions: selectedPlan,
      expiresAt: expirationDate.toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na ativação do plano:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
}
