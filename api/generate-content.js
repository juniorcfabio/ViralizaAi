// 🔒 API PROTEGIDA - EXEMPLO DE FERRAMENTA BLOQUEADA
import { requireActivePlan } from "../lib/requirePlan.js";

export default async function handler(req, res) {
  // 🛡️ PROTEÇÃO TOTAL - VERIFICAR PLANO ATIVO
  await new Promise((resolve, reject) => {
    requireActivePlan(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  // 🔓 SÓ ENTRA AQUI SE O PLANO ESTIVER ATIVO
  console.log("🎉 Usuário autorizado:", req.user.userId);
  console.log("📦 Plano ativo:", req.user.plan);

  try {
    // 🎯 LÓGICA DA FERRAMENTA (EXEMPLO)
    const { prompt, type } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        error: "Prompt é obrigatório" 
      });
    }

    // 🤖 SIMULAÇÃO DE GERAÇÃO DE CONTEÚDO
    const generatedContent = await generateContent(prompt, type, req.user.plan);

    res.status(200).json({
      success: true,
      content: generatedContent,
      user: {
        id: req.user.userId,
        plan: req.user.plan,
        expiresAt: req.user.planExpiresAt
      },
      message: "Conteúdo gerado com sucesso!"
    });

  } catch (error) {
    console.error("🚨 Erro ao gerar conteúdo:", error);
    res.status(500).json({ 
      error: "Erro ao gerar conteúdo",
      details: error.message 
    });
  }
}

// 🤖 SIMULAÇÃO DE GERAÇÃO DE CONTEÚDO
async function generateContent(prompt, type, userPlan) {
  console.log(`🤖 Gerando conteúdo para plano: ${userPlan}`);
  
  // 📊 LIMITES POR PLANO
  const planLimits = {
    mensal: { maxWords: 500, features: ["basic"] },
    trimestral: { maxWords: 1000, features: ["basic", "advanced"] },
    semestral: { maxWords: 2000, features: ["basic", "advanced", "premium"] },
    anual: { maxWords: 5000, features: ["basic", "advanced", "premium", "enterprise"] }
  };

  const limits = planLimits[userPlan] || planLimits.mensal;

  // 🎯 SIMULAÇÃO DE IA
  const content = {
    type: type || "text",
    prompt: prompt,
    result: `Conteúdo gerado para: "${prompt}"\n\nEste é um exemplo de conteúdo gerado pela IA com base no seu plano ${userPlan}.\n\nLimites do seu plano:\n- Máximo de palavras: ${limits.maxWords}\n- Recursos disponíveis: ${limits.features.join(", ")}`,
    wordCount: Math.floor(Math.random() * limits.maxWords),
    planUsed: userPlan,
    generatedAt: new Date().toISOString()
  };

  // ⏱️ SIMULAR TEMPO DE PROCESSAMENTO
  await new Promise(resolve => setTimeout(resolve, 1000));

  return content;
}
