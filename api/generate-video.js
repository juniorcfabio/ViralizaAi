// 🎬 API PROTEGIDA - GERAÇÃO DE VÍDEOS
import { requireActivePlan } from "../lib/requirePlan.js";

export default async function handler(req, res) {
  // 🛡️ PROTEÇÃO TOTAL - VERIFICAR PLANO ATIVO
  await new Promise((resolve, reject) => {
    requireActivePlan(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  console.log("🎬 Usuário autorizado para geração de vídeo:", req.user.userId);

  try {
    const { script, style, duration } = req.body;

    if (!script) {
      return res.status(400).json({ 
        error: "Script do vídeo é obrigatório" 
      });
    }

    // 🎯 VERIFICAR LIMITES DO PLANO
    const planLimits = {
      mensal: { maxVideos: 5, maxDuration: 30, quality: "720p" },
      trimestral: { maxVideos: 15, maxDuration: 60, quality: "1080p" },
      semestral: { maxVideos: 30, maxDuration: 120, quality: "1080p" },
      anual: { maxVideos: 100, maxDuration: 300, quality: "4K" }
    };

    const limits = planLimits[req.user.plan] || planLimits.mensal;

    if (duration && duration > limits.maxDuration) {
      return res.status(403).json({
        error: `Duração máxima para seu plano ${req.user.plan}: ${limits.maxDuration}s`,
        code: "DURATION_LIMIT_EXCEEDED",
        maxDuration: limits.maxDuration
      });
    }

    // 🎬 SIMULAÇÃO DE GERAÇÃO DE VÍDEO
    const video = await generateVideo(script, style, duration, req.user.plan);

    res.status(200).json({
      success: true,
      video: video,
      user: {
        id: req.user.userId,
        plan: req.user.plan,
        limits: limits
      },
      message: "Vídeo gerado com sucesso!"
    });

  } catch (error) {
    console.error("🚨 Erro ao gerar vídeo:", error);
    res.status(500).json({ 
      error: "Erro ao gerar vídeo",
      details: error.message 
    });
  }
}

async function generateVideo(script, style, duration, userPlan) {
  console.log(`🎬 Gerando vídeo para plano: ${userPlan}`);
  
  // ⏱️ SIMULAR TEMPO DE PROCESSAMENTO
  await new Promise(resolve => setTimeout(resolve, 3000));

  return {
    id: `video_${Date.now()}`,
    script: script,
    style: style || "default",
    duration: duration || 30,
    quality: userPlan === "anual" ? "4K" : userPlan === "mensal" ? "720p" : "1080p",
    status: "generated",
    url: `https://example.com/videos/video_${Date.now()}.mp4`,
    thumbnail: `https://example.com/thumbnails/thumb_${Date.now()}.jpg`,
    planUsed: userPlan,
    generatedAt: new Date().toISOString()
  };
}
