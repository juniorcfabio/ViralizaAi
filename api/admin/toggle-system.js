// 🎛️ API PARA CONTROLE GLOBAL DO SISTEMA
// Ligar/Desligar Automação Total e IA Executiva

export default async function handler(req, res) {
  console.log('🎛️ Toggle System API iniciada');
  
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Retornar status atual do sistema
      const controles = getSystemControls();
      return res.status(200).json({
        success: true,
        controles,
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === 'POST') {
      const { automacao_total, ia_executiva, admin_id } = req.body;

      console.log('🔧 Alterando controles do sistema:', {
        automacao_total,
        ia_executiva,
        admin_id
      });

      // Validação de segurança
      if (!admin_id) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado: ID do admin necessário'
        });
      }

      // Atualizar controles do sistema
      const novosControles = updateSystemControls({
        automacao_total: automacao_total ?? false,
        ia_executiva: ia_executiva ?? false,
        atualizado_por: admin_id,
        atualizado_em: new Date().toISOString()
      });

      // Log de segurança
      logSystemChange({
        admin_id,
        acao: 'toggle_system',
        automacao_total,
        ia_executiva,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Sistema atualizado:', novosControles);

      return res.status(200).json({
        success: true,
        message: 'Sistema atualizado com sucesso',
        controles: novosControles,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });

  } catch (error) {
    console.error('❌ Erro na API toggle-system:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
}

// 🗄️ SIMULAÇÃO DE BANCO DE DADOS (localStorage em produção real)
let systemControls = {
  id: 1,
  automacao_total: false,
  ia_executiva: false,
  atualizado_por: null,
  atualizado_em: new Date().toISOString()
};

let systemLogs = [];

function getSystemControls() {
  return systemControls;
}

function updateSystemControls(newControls) {
  systemControls = { ...systemControls, ...newControls };
  return systemControls;
}

function logSystemChange(logEntry) {
  systemLogs.push(logEntry);
  
  // Manter apenas os últimos 100 logs
  if (systemLogs.length > 100) {
    systemLogs = systemLogs.slice(-100);
  }
  
  console.log('📝 Log registrado:', logEntry);
}
