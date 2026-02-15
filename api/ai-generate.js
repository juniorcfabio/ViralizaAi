// =============================================================
// 🧠 API CENTRALIZADA DE IA - MULTI-MODELO COM ROTEAMENTO INTELIGENTE
// =============================================================
// Claude Opus   → Cérebro analítico (Funnel, SEO, Trends, Analytics)
// Sonnet        → Copywriting fluido (Scripts, Copy, Ebook, Hashtags)
// Codex Medium  → Motor de automação (Código, Técnico, Integração)
// Kimi K2.5     → Criatividade multimodal (Avatares, Campanhas visuais)
// SWE-1.5       → Prototipagem rápida (Templates, Quick, General)
// Fallback      → OpenAI GPT-4o-mini se chave do modelo principal não configurada
// =============================================================
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// ==================== MAPEAMENTO FERRAMENTA → MODELO ====================
const MODEL_ROUTING = {
  // Claude Opus → Análise estratégica profunda
  'funnel':    { provider: 'anthropic', model: 'claude-opus-4-20250514',   department: 'strategy' },
  'seo':       { provider: 'anthropic', model: 'claude-opus-4-20250514',   department: 'strategy' },
  'trends':    { provider: 'anthropic', model: 'claude-opus-4-20250514',   department: 'strategy' },
  'analytics': { provider: 'anthropic', model: 'claude-opus-4-20250514',   department: 'strategy' },
  'strategy':  { provider: 'anthropic', model: 'claude-opus-4-20250514',   department: 'strategy' },

  // Sonnet → Copywriting e comunicação
  'copywriting': { provider: 'anthropic', model: 'claude-sonnet-4-20250514', department: 'copywriting' },
  'scripts':     { provider: 'anthropic', model: 'claude-sonnet-4-20250514', department: 'copywriting' },
  'ebook':       { provider: 'anthropic', model: 'claude-sonnet-4-20250514', department: 'copywriting' },
  'hashtags':    { provider: 'anthropic', model: 'claude-sonnet-4-20250514', department: 'copywriting' },
  'translate':   { provider: 'anthropic', model: 'claude-sonnet-4-20250514', department: 'copywriting' },

  // Codex Medium → Automação e programação
  'automation':  { provider: 'openai', model: 'gpt-4o', department: 'automation' },
  'code':        { provider: 'openai', model: 'gpt-4o', department: 'automation' },
  'technical':   { provider: 'openai', model: 'gpt-4o', department: 'automation' },
  'integration': { provider: 'openai', model: 'gpt-4o', department: 'automation' },

  // Kimi K2.5 → Criatividade multimodal
  'creative':  { provider: 'kimi', model: 'kimi-k2-0711', department: 'creative' },
  'avatar':    { provider: 'kimi', model: 'kimi-k2-0711', department: 'creative' },
  'visual':    { provider: 'kimi', model: 'kimi-k2-0711', department: 'creative' },
  'branding':  { provider: 'kimi', model: 'kimi-k2-0711', department: 'creative' },
  'campaign':  { provider: 'kimi', model: 'kimi-k2-0711', department: 'creative' },

  // SWE-1.5 → Prototipagem rápida (GPT-4o-mini como base leve)
  'prototype': { provider: 'openai', model: 'gpt-4o-mini', department: 'prototype' },
  'template':  { provider: 'openai', model: 'gpt-4o-mini', department: 'prototype' },
  'quick':     { provider: 'openai', model: 'gpt-4o-mini', department: 'prototype' },
  'general':   { provider: 'openai', model: 'gpt-4o-mini', department: 'prototype' },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verificar se pelo menos OpenAI está configurada (fallback obrigatório)
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey || openaiKey.includes('your-')) {
    return res.status(500).json({ error: 'OPENAI_API_KEY não configurada no servidor' });
  }

  try {
    const { tool, prompt, params = {} } = req.body;

    if (!tool || !prompt) {
      return res.status(400).json({ error: 'Campos obrigatórios: tool, prompt' });
    }

    const routing = MODEL_ROUTING[tool] || MODEL_ROUTING['general'];
    const maxTokens = params.maxTokens || getDefaultTokens(tool);
    const temperature = params.temperature || getDefaultTemperature(tool);
    const systemPrompt = getSystemPrompt(tool, params, routing.department);

    let result;
    let actualProvider = routing.provider;
    let actualModel = routing.model;

    // Tentar provider principal, fallback automático para OpenAI
    try {
      result = await callProvider(routing.provider, routing.model, systemPrompt, prompt, maxTokens, temperature);
    } catch (primaryError) {
      console.warn(`⚠️ ${routing.provider}/${routing.model} falhou: ${primaryError.message}. Usando fallback OpenAI.`);
      actualProvider = 'openai';
      actualModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      result = await callOpenAI(actualModel, systemPrompt, prompt, maxTokens, temperature);
    }

    console.log(`✅ AI [${routing.department}] ${tool}: provider=${actualProvider}, model=${actualModel}, tokens=${result.tokensUsed}`);

    // Log de uso no Supabase
    try {
      await supabase.from('activity_logs').insert({
        user_id: params.userId || 'anonymous',
        action: `ai_${routing.department}_${tool}`,
        details: JSON.stringify({
          tool, provider: actualProvider, model: actualModel,
          department: routing.department,
          tokens_used: result.tokensUsed || 0,
          prompt_preview: prompt.substring(0, 100)
        })
      });
    } catch (_) {}

    return res.status(200).json({
      success: true,
      content: result.content,
      provider: actualProvider,
      model: actualModel,
      department: routing.department,
      tokens_used: result.tokensUsed || 0
    });

  } catch (error) {
    console.error('🚨 Erro no AI Generate:', error);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}

// ==================== DISPATCHER ====================
function callProvider(provider, model, systemPrompt, prompt, maxTokens, temperature) {
  switch (provider) {
    case 'anthropic':
      return callAnthropic(model, systemPrompt, prompt, maxTokens, temperature);
    case 'kimi':
      return callKimi(model, systemPrompt, prompt, maxTokens, temperature);
    case 'openai':
    default:
      return callOpenAI(model, systemPrompt, prompt, maxTokens, temperature);
  }
}

// ==================== ANTHROPIC (Claude Opus + Sonnet) ====================
async function callAnthropic(model, systemPrompt, prompt, maxTokens, temperature) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic ${response.status}: ${err.substring(0, 200)}`);
  }

  const data = await response.json();
  return {
    content: data.content?.[0]?.text || '',
    tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
  };
}

// ==================== OPENAI (Codex Medium + SWE-1.5 + Fallback) ====================
async function callOpenAI(model, systemPrompt, prompt, maxTokens, temperature) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes('your-')) throw new Error('OPENAI_API_KEY não configurada');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI ${response.status}: ${err.substring(0, 200)}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    tokensUsed: data.usage?.total_tokens || 0
  };
}

// ==================== KIMI K2.5 (Moonshot - Criatividade Multimodal) ====================
async function callKimi(model, systemPrompt, prompt, maxTokens, temperature) {
  const apiKey = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;
  if (!apiKey) throw new Error('KIMI_API_KEY não configurada');

  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Kimi ${response.status}: ${err.substring(0, 200)}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    tokensUsed: data.usage?.total_tokens || 0
  };
}

// ==================== SYSTEM PROMPTS POR DEPARTAMENTO ====================
function getSystemPrompt(tool, params, department) {
  const lang = params.language || 'pt-BR';

  const departmentContext = {
    strategy: `[CLAUDE OPUS - Departamento de Estratégia e Análise]
Você é o cérebro analítico do sistema ViralizaAI. Use pensamento profundo, análise estratégica avançada, dados de mercado reais, e métricas acionáveis. Forneça insights com KPIs mensuráveis.`,
    copywriting: `[SONNET - Departamento de Copywriting e Comunicação]
Você é o motor de comunicação fluida do ViralizaAI. Crie textos envolventes, persuasivos e otimizados para conversão. Use storytelling, gatilhos mentais e linguagem natural que conecta com o público.`,
    automation: `[CODEX MEDIUM - Departamento de Automação e Programação]
Você é o motor de automação do ViralizaAI. Gere soluções técnicas precisas, código limpo, e automações eficientes. Foque em praticidade e implementação imediata.`,
    creative: `[KIMI K2.5 - Departamento de Criatividade Multimodal]
Você é o gênio criativo do ViralizaAI. Crie conceitos visuais inovadores, campanhas impactantes e identidades visuais memoráveis. Pense fora da caixa com referências culturais e tendências globais.`,
    prototype: `[SWE-1.5 - Departamento de Prototipagem Rápida]
Você é o motor de prototipagem do ViralizaAI. Forneça respostas diretas, templates prontos e soluções rápidas. Priorize velocidade e praticidade.`
  };

  const toolPrompts = {
    'scripts': `Gere scripts de vídeos virais. Formato: GANCHO (3s), DESENVOLVIMENTO (storytelling), CTA. Inclua [CENA], [NARRAÇÃO], [TEXTO NA TELA]. Sempre em ${lang}.`,
    'copywriting': `Crie textos persuasivos com gatilhos mentais (escassez, prova social, autoridade). CTAs fortes. Variações A/B. Sempre em ${lang}.`,
    'seo': `Analise e otimize para SEO: palavras-chave, meta description, heading structure, score, sugestões. Sempre em ${lang}.`,
    'hashtags': `Gere hashtags: alta competição (alcance), média (engajamento), nicho (conversão), trending. Volume estimado. Sempre em ${lang}.`,
    'ebook': `Escreva capítulos profissionais: introdução envolvente, estratégias práticas, dados, cases, plano de ação. Mín. 800 palavras. Sempre em ${lang}.`,
    'funnel': `Crie copy para funis: headlines, problema/solução, benefícios, depoimentos, FAQ, garantia, CTAs. Sempre em ${lang}.`,
    'trends': `Analise tendências: TOP 5, potencial viral, ideias de conteúdo, timing, formatos, previsões. Sempre em ${lang}.`,
    'translate': `Traduza mantendo tom, nuances culturais e expressões idiomáticas. Mantenha formatação.`,
    'creative': `Crie conceitos visuais: composição, paleta, tipografia, elementos gráficos, mood board, referências. Sempre em ${lang}.`,
    'avatar': `Crie avatares/personagens: aparência, personalidade, tom de voz, cenários, aplicações em mídias. Sempre em ${lang}.`,
    'visual': `Briefings visuais: conceito, paleta, layout, tipografia, imagens de referência, adaptações por plataforma. Sempre em ${lang}.`,
    'branding': `Identidade de marca: posicionamento, valores, tom de voz, paleta, tipografia, guia de estilo. Sempre em ${lang}.`,
    'campaign': `Campanhas completas: conceito, cronograma, plataformas, formatos, budget, KPIs, conteúdo por fase. Sempre em ${lang}.`,
    'automation': `Fluxos de automação: triggers, condições, ações, integrações. Código quando aplicável. Sempre em ${lang}.`,
    'code': `Código limpo, documentado, testável. Comentários, tratamento de erros, exemplos. Sempre em ${lang}.`,
    'technical': `Documentação técnica: arquitetura, APIs, fluxos, diagramas, guias. Sempre em ${lang}.`,
    'prototype': `Protótipos rápidos: wireframes, fluxos de navegação, especificações funcionais. Sempre em ${lang}.`,
    'template': `Templates prontos: estrutura, variáveis, exemplos preenchidos, instruções. Sempre em ${lang}.`,
    'general': `Responda profissionalmente sobre marketing digital, conteúdo e crescimento de negócios. Sempre em ${lang}.`
  };

  const ctx = departmentContext[department] || departmentContext.prototype;
  const tp = toolPrompts[tool] || toolPrompts['general'];
  return `${ctx}\n\n${tp}`;
}

function getDefaultTokens(tool) {
  const t = {
    'scripts': 2000, 'copywriting': 1500, 'seo': 2000, 'hashtags': 800,
    'ebook': 4000, 'funnel': 3000, 'trends': 2000, 'translate': 2000,
    'creative': 2000, 'avatar': 1500, 'visual': 2000, 'branding': 2500,
    'campaign': 3000, 'automation': 2000, 'code': 3000, 'technical': 2500,
    'prototype': 1500, 'template': 1500, 'general': 1500, 'analytics': 2000,
    'strategy': 2500, 'quick': 800, 'integration': 2000
  };
  return t[tool] || 1500;
}

function getDefaultTemperature(tool) {
  const t = {
    'scripts': 0.8, 'copywriting': 0.7, 'seo': 0.3, 'hashtags': 0.6,
    'ebook': 0.7, 'funnel': 0.6, 'trends': 0.5, 'translate': 0.2,
    'creative': 0.9, 'avatar': 0.85, 'visual': 0.85, 'branding': 0.7,
    'campaign': 0.7, 'automation': 0.3, 'code': 0.2, 'technical': 0.3,
    'prototype': 0.5, 'template': 0.4, 'general': 0.7, 'analytics': 0.3,
    'strategy': 0.5, 'quick': 0.5, 'integration': 0.3
  };
  return t[tool] || 0.7;
}
