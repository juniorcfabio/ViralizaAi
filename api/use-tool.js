// 🛠️ API PARA USAR FERRAMENTAS COM CONTROLE DE LIMITE
import { requireActivePlan, incrementUsage } from "../lib/requirePlan.js";
import { getPlanRules } from "../lib/planRules.js";

export default async function handler(req, res) {
  // 🛡️ PROTEÇÃO TOTAL - VERIFICAR PLANO E LIMITES
  await new Promise((resolve, reject) => {
    requireActivePlan(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  console.log("🛠️ Usuário autorizado para usar ferramenta:", req.user.userId);

  try {
    const { toolType, toolData } = req.body;

    if (!toolType) {
      return res.status(400).json({ 
        error: "Tipo de ferramenta é obrigatório" 
      });
    }

    // 📊 OBTER REGRAS DO PLANO
    const planRules = getPlanRules(req.user.plan);
    
    console.log("🔧 Executando ferramenta:", {
      userId: req.user.userId,
      plan: req.user.plan,
      toolType: toolType,
      currentUsage: req.user.dailyUsage || 0,
      limit: planRules.toolsPerDay
    });

    // 🎯 EXECUTAR FERRAMENTA BASEADA NO TIPO
    let result;
    switch (toolType) {
      case 'content_generation':
        result = await executeContentGeneration(toolData, req.user.plan);
        break;
      case 'video_generation':
        result = await executeVideoGeneration(toolData, req.user.plan);
        break;
      case 'ebook_generation':
        result = await executeEbookGeneration(toolData, req.user.plan);
        break;
      case 'ai_chat':
        result = await executeAIChat(toolData, req.user.plan);
        break;
      default:
        return res.status(400).json({ 
          error: "Tipo de ferramenta não suportado",
          supportedTypes: ['content_generation', 'video_generation', 'ebook_generation', 'ai_chat']
        });
    }

    // 📈 INCREMENTAR USO APÓS SUCESSO
    await incrementUsage(req.user.userId, 'dailyUsage');

    // 📊 CALCULAR ESTATÍSTICAS DE USO
    const newUsage = (req.user.dailyUsage || 0) + 1;
    const remaining = planRules.toolsPerDay === Infinity ? 
      Infinity : 
      Math.max(0, planRules.toolsPerDay - newUsage);

    res.status(200).json({
      success: true,
      result: result,
      usage: {
        current: newUsage,
        limit: planRules.toolsPerDay,
        remaining: remaining,
        resetTime: getNextResetTime()
      },
      user: {
        id: req.user.userId,
        plan: req.user.plan,
        planName: planRules.name
      },
      message: "Ferramenta executada com sucesso!"
    });

  } catch (error) {
    console.error("🚨 Erro ao executar ferramenta:", error);
    res.status(500).json({ 
      error: "Erro ao executar ferramenta",
      details: error.message 
    });
  }
}

// 🤖 EXECUTAR GERAÇÃO DE CONTEÚDO
async function executeContentGeneration(data, userPlan) {
  console.log(`🤖 Gerando conteúdo para plano: ${userPlan}`);
  
  const planRules = getPlanRules(userPlan);
  
  // ⏱️ SIMULAR TEMPO DE PROCESSAMENTO
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    type: 'content_generation',
    prompt: data.prompt,
    result: `Conteúdo gerado para: "${data.prompt}"\n\nEste é um conteúdo de alta qualidade gerado pela IA para o plano ${planRules.name}.\n\nRecursos disponíveis: ${planRules.features.join(", ")}`,
    wordCount: Math.floor(Math.random() * 500) + 100,
    planUsed: userPlan,
    quality: planRules.name.includes('Premium') ? 'premium' : planRules.name.includes('Gold') ? 'advanced' : 'standard',
    generatedAt: new Date().toISOString()
  };
}

// 🎬 EXECUTAR GERAÇÃO DE VÍDEO
async function executeVideoGeneration(data, userPlan) {
  console.log(`🎬 Gerando vídeo para plano: ${userPlan}`);
  
  const planRules = getPlanRules(userPlan);
  
  // ⏱️ SIMULAR TEMPO DE PROCESSAMENTO
  await new Promise(resolve => setTimeout(resolve, 5000));

  return {
    type: 'video_generation',
    script: data.script,
    duration: Math.min(data.duration || 30, planRules.maxVideoLength),
    quality: userPlan === 'premium' ? '4K' : userPlan === 'gold' ? '1080p' : '720p',
    url: `https://example.com/videos/video_${Date.now()}.mp4`,
    thumbnail: `https://example.com/thumbnails/thumb_${Date.now()}.jpg`,
    planUsed: userPlan,
    generatedAt: new Date().toISOString()
  };
}

// 📚 EXECUTAR GERAÇÃO DE EBOOK
async function executeEbookGeneration(data, userPlan) {
  console.log(`📚 Gerando ebook para plano: ${userPlan}`);
  
  const planRules = getPlanRules(userPlan);
  
  // ⏱️ SIMULAR TEMPO DE PROCESSAMENTO
  await new Promise(resolve => setTimeout(resolve, 8000));

  const pages = Math.min(data.chapters * 5, planRules.maxEbookPages);

  return {
    type: 'ebook_generation',
    title: data.title,
    chapters: data.chapters,
    pages: pages,
    format: data.format || 'PDF',
    downloadUrl: `https://example.com/ebooks/ebook_${Date.now()}.pdf`,
    coverUrl: `https://example.com/covers/cover_${Date.now()}.jpg`,
    planUsed: userPlan,
    generatedAt: new Date().toISOString()
  };
}

// 💬 EXECUTAR CHAT IA
async function executeAIChat(data, userPlan) {
  console.log(`💬 Processando chat IA para plano: ${userPlan}`);
  
  const planRules = getPlanRules(userPlan);
  
  // ⏱️ SIMULAR TEMPO DE PROCESSAMENTO
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    type: 'ai_chat',
    message: data.message,
    response: `Resposta da IA para: "${data.message}"\n\nComo usuário do ${planRules.name}, você tem acesso a respostas ${planRules.support === 'vip' ? 'premium com suporte VIP' : planRules.support === 'priority' ? 'avançadas com suporte prioritário' : 'padrão'}.`,
    planUsed: userPlan,
    responseTime: '1.5s',
    generatedAt: new Date().toISOString()
  };
}

// ⏰ FUNÇÃO AUXILIAR PARA PRÓXIMO RESET
function getNextResetTime() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}
