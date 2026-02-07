// 📚 API PROTEGIDA - GERAÇÃO DE EBOOKS
import { requireActivePlan } from "../lib/requirePlan.js";

export default async function handler(req, res) {
  // 🛡️ PROTEÇÃO TOTAL - VERIFICAR PLANO ATIVO
  await new Promise((resolve, reject) => {
    requireActivePlan(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  console.log("📚 Usuário autorizado para geração de ebook:", req.user.userId);

  try {
    const { title, topic, chapters, format } = req.body;

    if (!title || !topic) {
      return res.status(400).json({ 
        error: "Título e tópico são obrigatórios" 
      });
    }

    // 🎯 VERIFICAR LIMITES DO PLANO
    const planLimits = {
      mensal: { maxEbooks: 2, maxPages: 20, formats: ["PDF"] },
      trimestral: { maxEbooks: 5, maxPages: 50, formats: ["PDF", "EPUB"] },
      semestral: { maxEbooks: 10, maxPages: 100, formats: ["PDF", "EPUB", "MOBI"] },
      anual: { maxEbooks: 50, maxPages: 500, formats: ["PDF", "EPUB", "MOBI", "HTML"] }
    };

    const limits = planLimits[req.user.plan] || planLimits.mensal;

    if (format && !limits.formats.includes(format.toUpperCase())) {
      return res.status(403).json({
        error: `Formato ${format} não disponível para seu plano ${req.user.plan}`,
        code: "FORMAT_NOT_ALLOWED",
        availableFormats: limits.formats
      });
    }

    // 📚 SIMULAÇÃO DE GERAÇÃO DE EBOOK
    const ebook = await generateEbook(title, topic, chapters, format, req.user.plan);

    res.status(200).json({
      success: true,
      ebook: ebook,
      user: {
        id: req.user.userId,
        plan: req.user.plan,
        limits: limits
      },
      message: "Ebook gerado com sucesso!"
    });

  } catch (error) {
    console.error("🚨 Erro ao gerar ebook:", error);
    res.status(500).json({ 
      error: "Erro ao gerar ebook",
      details: error.message 
    });
  }
}

async function generateEbook(title, topic, chapters, format, userPlan) {
  console.log(`📚 Gerando ebook para plano: ${userPlan}`);
  
  // ⏱️ SIMULAR TEMPO DE PROCESSAMENTO
  await new Promise(resolve => setTimeout(resolve, 5000));

  const planLimits = {
    mensal: { maxPages: 20 },
    trimestral: { maxPages: 50 },
    semestral: { maxPages: 100 },
    anual: { maxPages: 500 }
  };

  const limits = planLimits[userPlan] || planLimits.mensal;
  const pageCount = Math.min(chapters * 5, limits.maxPages);

  return {
    id: `ebook_${Date.now()}`,
    title: title,
    topic: topic,
    chapters: chapters || 5,
    pages: pageCount,
    format: format || "PDF",
    status: "generated",
    downloadUrl: `https://example.com/ebooks/ebook_${Date.now()}.${(format || 'pdf').toLowerCase()}`,
    coverUrl: `https://example.com/covers/cover_${Date.now()}.jpg`,
    size: `${Math.floor(pageCount * 0.5)}MB`,
    planUsed: userPlan,
    generatedAt: new Date().toISOString()
  };
}
