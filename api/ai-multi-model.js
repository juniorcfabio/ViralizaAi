// =============================================================
// 🧠 API MULTI-MODELO DE IA - ROTEAMENTO INTELIGENTE POR DEPARTAMENTO
// =============================================================
// Claude Opus   → Cérebro analítico (Funnel, SEO, Trends, Analytics)
// Sonnet        → Copywriting fluido (Scripts, Copy, Ebook, Hashtags)
// Codex Medium  → Motor de programação (Automação, Código, Técnico)
// Kimi K2.5     → Criatividade multimodal (Avatares, Campanhas visuais)
// SWE-1.5       → Prototipagem rápida (Templates, Quick responses)
// =============================================================

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// ==================== MAPEAMENTO FERRAMENTA → MODELO ====================
const MODEL_ROUTING = {
  // Claude Opus → Análise estratégica profunda
  'funnel':    { provider: 'anthropic', model: 'claude-opus-4-20250514',  department: 'strategy' },
  'seo':       { provider: 'anthropic', model: 'claude-opus-4-20250514',  department: 'strategy' },
  'trends':    { provider: 'anthropic', model: 'claude-opus-4-20250514',  department: 'strategy' },
  'analytics': { provider: 'anthropic', model: 'claude-opus-4-20250514',  department: 'strategy' },
  'strategy':  { provider: 'anthropic', model: 'claude-opus-4-20250514',  department: 'strategy' },

  // Sonnet → Copywriting e comunicação fluida
  'copywriting': { provider: 'anthropic', model: 'claude-sonnet-4-20250514', department: 'copywriting' },
  'scripts':     { provider: 'anthropic', model: 'claude-sonnet-4-20250514', department: 'copywriting' },
  'ebook':       { provider: 'anthropic', model: 'claude-sonnet-4-20250514', department: 'copywriting' },
  'hashtags':    { provider: 'anthropic', model: 'claude-sonnet-4-20250514', department: 'copywriting' },
  'translate':   { provider: 'anthropic', model: 'claude-sonnet-4-20250514', department: 'copywriting' },

  // Codex Medium → Automação e programação
  'automation':  { provider: 'openai', model: 'gpt-4o',     department: 'automation' },
  'code':        { provider: 'openai', model: 'gpt-4o',     department: 'automation' },
  'technical':   { provider: 'openai', model: 'gpt-4o',     department: 'automation' },
  'integration': { provider: 'openai', model: 'gpt-4o',     department: 'automation' },

  // Kimi K2.5 → Criatividade multimodal
  'creative':  { provider: 'kimi', model: 'kimi-k2-0711', department: 'creative' },
  'avatar':    { provider: 'kimi', model: 'kimi-k2-0711', department: 'creative' },
  'visual':    { provider: 'kimi', model: 'kimi-k2-0711', department: 'creative' },
  'branding':  { provider: 'kimi', model: 'kimi-k2-0711', department: 'creative' },
  'campaign':  { provider: 'kimi', model: 'kimi-k2-0711', department: 'creative' },

  // SWE-1.5 → Prototipagem rápida
  'prototype': { provider: 'openai', model: 'gpt-4o-mini', department: 'prototype' },
  'template':  { provider: 'openai', model: 'gpt-4o-mini', department: 'prototype' },
  'quick':     { provider: 'openai', model: 'gpt-4o-mini', department: 'prototype' },
  'general':   { provider: 'openai', model: 'gpt-4o-mini', department: 'prototype' },
};

// ==================== HANDLER PRINCIPAL ====================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { tool, prompt, params = {} } = req.body;

    if (!tool || !prompt) {
      return res.status(400).json({ error: 'Campos obrigatórios: tool, prompt' });
    }

    // Resolver roteamento
    const routing = MODEL_ROUTING[tool] || MODEL_ROUTING['general'];
    const maxTokens = params.maxTokens || getDefaultTokens(tool);
    const temperature = params.temperature || getDefaultTemperature(tool);
    const systemPrompt = getSystemPrompt(tool, params, routing.department);

    // Tentar provider principal, fallback para OpenAI
    let result;
    let actualProvider = routing.provider;
    let actualModel = routing.model;

    try {
      result = await callProvider(routing.provider, routing.model, systemPrompt, prompt, maxTokens, temperature);
    } catch (providerError) {
      console.warn(`⚠️ ${routing.provider}/${routing.model} falhou, usando fallback OpenAI:`, providerError.message);
      actualProvider = 'openai';
      actualModel = 'gpt-4o-mini';
      result = await callOpenAI(actualModel, systemPrompt, prompt, maxTokens, temperature);
    }

    // Log de uso no Supabase
    try {
      await supabase.from('ai_usage_logs').insert({
        user_id: params.userId || 'anonymous',
        tool,
        provider: actualProvider,
        model: actualModel,
        department: routing.department,
        tokens_used: result.tokensUsed || 0,
        prompt_preview: prompt.substring(0, 200),
        created_at: new Date().toISOString()
      });
    } catch (_) {
      // Fallback: salvar em activity_logs se ai_usage_logs não existir
      try {
        await supabase.from('activity_logs').insert({
          user_id: params.userId || 'anonymous',
          action: `ai_${routing.department}_${tool}`,
          details: JSON.stringify({
            tool, provider: actualProvider, model: actualModel,
            department: routing.department,
            tokens_used: result.tokensUsed || 0
          })
        });
      } catch (__) {}
    }

    return res.status(200).json({
      success: true,
      content: result.content,
      provider: actualProvider,
      model: actualModel,
      department: routing.department,
      tokens_used: result.tokensUsed || 0
    });

  } catch (error) {
    console.error('🚨 Erro no AI Multi-Model:', error);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}

// ==================== DISPATCHER ====================
async function callProvider(provider, model, systemPrompt, prompt, maxTokens, temperature) {
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

  console.log(`🧠 Anthropic: model=${model}, maxTokens=${maxTokens}`);

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
    console.error(`❌ Anthropic error (${response.status}):`, err);
    throw new Error(`Anthropic ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || '';
  const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

  return { content, tokensUsed };
}

// ==================== OPENAI (Codex Medium + SWE-1.5 fallback) ====================
async function callOpenAI(model, systemPrompt, prompt, maxTokens, temperature) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes('your-')) throw new Error('OPENAI_API_KEY não configurada');

  console.log(`🤖 OpenAI: model=${model}, maxTokens=${maxTokens}`);

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
    console.error(`❌ OpenAI error (${response.status}):`, err);
    throw new Error(`OpenAI ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const tokensUsed = data.usage?.total_tokens || 0;

  return { content, tokensUsed };
}

// ==================== KIMI K2.5 (Moonshot - Criatividade Multimodal) ====================
async function callKimi(model, systemPrompt, prompt, maxTokens, temperature) {
  const apiKey = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;
  if (!apiKey) throw new Error('KIMI_API_KEY não configurada');

  console.log(`🎨 Kimi K2.5: model=${model}, maxTokens=${maxTokens}`);

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
    console.error(`❌ Kimi error (${response.status}):`, err);
    throw new Error(`Kimi ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const tokensUsed = data.usage?.total_tokens || 0;

  return { content, tokensUsed };
}

// ==================== SYSTEM PROMPTS POR DEPARTAMENTO ====================
function getSystemPrompt(tool, params, department) {
  const lang = params.language || 'pt-BR';

  // Prompts enriquecidos por departamento + ferramenta
  const departmentContext = {
    strategy: `[CLAUDE OPUS - Departamento de Estratégia e Análise]
Você é o cérebro analítico do sistema ViralizaAI. Use pensamento profundo, dados de mercado, e análise estratégica avançada. Sempre forneça insights acionáveis com métricas e KPIs.`,
    
    copywriting: `[SONNET - Departamento de Copywriting e Comunicação]
Você é o motor de comunicação fluida do ViralizaAI. Crie textos envolventes, persuasivos, e otimizados para conversão. Use storytelling, gatilhos mentais, e linguagem natural.`,
    
    automation: `[CODEX MEDIUM - Departamento de Automação e Programação]
Você é o motor de automação do ViralizaAI. Gere soluções técnicas precisas, código limpo, e automações eficientes. Foque em praticidade e implementação imediata.`,
    
    creative: `[KIMI K2.5 - Departamento de Criatividade Multimodal]
Você é o gênio criativo do ViralizaAI. Crie conceitos visuais inovadores, campanhas impactantes, e identidades visuais memoráveis. Pense fora da caixa com referências culturais e tendências globais.`,
    
    prototype: `[SWE-1.5 - Departamento de Prototipagem Rápida]
Você é o motor de prototipagem rápida do ViralizaAI. Forneça respostas diretas, templates prontos, e soluções rápidas. Priorize velocidade e praticidade.`
  };

  const toolPrompts = {
    'scripts': `Gere scripts de vídeos virais para redes sociais. Formato: GANCHO (3s), DESENVOLVIMENTO (storytelling), CTA. Inclua [CENA], [NARRAÇÃO], [TEXTO NA TELA]. Sempre em ${lang}.`,
    'copywriting': `Crie textos persuasivos com gatilhos mentais (escassez, prova social, autoridade). Use storytelling, CTAs fortes. Inclua variações A/B. Sempre em ${lang}.`,
    'seo': `Analise e otimize conteúdo para SEO. Forneça: palavras-chave, meta description, heading structure, score de otimização, e sugestões específicas. Sempre em ${lang}.`,
    'hashtags': `Gere hashtags estratégicas: alta competição (alcance), média (engajamento), nicho (conversão), trending. Inclua volume estimado. Sempre em ${lang}.`,
    'ebook': `Escreva conteúdo profissional para ebooks. Cada capítulo: introdução envolvente, estratégias práticas, dados estatísticos, cases reais, plano de ação. Mínimo 800 palavras. Sempre em ${lang}.`,
    'funnel': `Crie copy para funis de vendas: headlines, seções de problema/solução, benefícios, depoimentos, FAQ, garantia, CTAs otimizados. Sempre em ${lang}.`,
    'trends': `Analise tendências digitais: TOP 5 tendências, potencial viral, ideias de conteúdo, timing, formatos recomendados, previsões. Sempre em ${lang}.`,
    'translate': `Traduza mantendo tom, nuances culturais, e expressões idiomáticas. Mantenha formatação.`,
    'creative': `Crie conceitos criativos para campanhas visuais. Descreva composição, paleta de cores, tipografia, elementos gráficos, mood board, e referências visuais. Sempre em ${lang}.`,
    'avatar': `Crie descrições detalhadas de avatares e personagens para campanhas. Inclua: aparência, personalidade, tom de voz, cenários, e aplicações em diferentes mídias. Sempre em ${lang}.`,
    'visual': `Crie briefings visuais completos: conceito, paleta, layout, tipografia, imagens de referência, e adaptações por plataforma (feed, stories, reels). Sempre em ${lang}.`,
    'branding': `Desenvolva identidade de marca completa: posicionamento, valores, tom de voz, paleta de cores, tipografia, aplicações, e guia de estilo. Sempre em ${lang}.`,
    'campaign': `Planeje campanhas de marketing digital completas: conceito, cronograma, plataformas, formatos, budget, KPIs, e conteúdo para cada fase. Sempre em ${lang}.`,
    'automation': `Crie fluxos de automação: triggers, condições, ações, integrações, e monitoramento. Forneça código ou pseudocódigo quando aplicável. Sempre em ${lang}.`,
    'code': `Gere código limpo, bem documentado, e testável. Inclua comentários, tratamento de erros, e exemplos de uso. Sempre em ${lang}.`,
    'technical': `Crie documentação técnica: arquitetura, APIs, fluxos de dados, diagramas, e guias de implementação. Sempre em ${lang}.`,
    'prototype': `Crie protótipos rápidos: wireframes em texto, fluxos de navegação, e especificações funcionais. Sempre em ${lang}.`,
    'template': `Gere templates prontos para uso: estrutura, variáveis, exemplos preenchidos, e instruções de customização. Sempre em ${lang}.`,
    'general': `Responda de forma profissional e acionável sobre marketing digital, criação de conteúdo, e crescimento de negócios. Sempre em ${lang}.`
  };

  const context = departmentContext[department] || departmentContext.prototype;
  const toolPrompt = toolPrompts[tool] || toolPrompts['general'];

  return `${context}\n\n${toolPrompt}`;
}

// ==================== CONFIGURAÇÕES DE TOKENS ====================
function getDefaultTokens(tool) {
  const tokens = {
    'scripts': 2000, 'copywriting': 1500, 'seo': 2000,
    'hashtags': 800, 'ebook': 4000, 'funnel': 3000,
    'trends': 2000, 'translate': 2000, 'creative': 2000,
    'avatar': 1500, 'visual': 2000, 'branding': 2500,
    'campaign': 3000, 'automation': 2000, 'code': 3000,
    'technical': 2500, 'prototype': 1500, 'template': 1500,
    'general': 1500, 'analytics': 2000, 'strategy': 2500,
    'quick': 800, 'integration': 2000
  };
  return tokens[tool] || 1500;
}

function getDefaultTemperature(tool) {
  const temps = {
    'scripts': 0.8, 'copywriting': 0.7, 'seo': 0.3,
    'hashtags': 0.6, 'ebook': 0.7, 'funnel': 0.6,
    'trends': 0.5, 'translate': 0.2, 'creative': 0.9,
    'avatar': 0.85, 'visual': 0.85, 'branding': 0.7,
    'campaign': 0.7, 'automation': 0.3, 'code': 0.2,
    'technical': 0.3, 'prototype': 0.5, 'template': 0.4,
    'general': 0.7, 'analytics': 0.3, 'strategy': 0.5,
    'quick': 0.5, 'integration': 0.3
  };
  return temps[tool] || 0.7;
}
