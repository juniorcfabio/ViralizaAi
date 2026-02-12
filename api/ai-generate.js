// 🤖 API CENTRALIZADA DE IA - OpenAI GPT
// Endpoint único para todas as ferramentas que usam IA generativa
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes('your-')) {
    return res.status(500).json({ error: 'OPENAI_API_KEY não configurada no servidor' });
  }

  try {
    const { tool, prompt, params = {} } = req.body;

    if (!tool || !prompt) {
      return res.status(400).json({ error: 'Campos obrigatórios: tool, prompt' });
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const maxTokens = params.maxTokens || getDefaultTokens(tool);
    const temperature = params.temperature || getDefaultTemperature(tool);

    console.log(`🤖 AI Generate: tool=${tool}, model=${model}, maxTokens=${maxTokens}`);

    const systemPrompt = getSystemPrompt(tool, params);

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
      console.error('❌ OpenAI error:', err);
      return res.status(response.status).json({ error: 'Erro na API OpenAI', details: err });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Log de uso no Supabase
    try {
      await supabase.from('activity_logs').insert({
        user_id: params.userId || 'anonymous',
        action: `ai_generate_${tool}`,
        details: {
          tool,
          model,
          tokens_used: data.usage?.total_tokens || 0,
          prompt_preview: prompt.substring(0, 100)
        }
      });
    } catch (_) {}

    return res.status(200).json({
      success: true,
      content,
      model,
      tokens_used: data.usage?.total_tokens || 0
    });

  } catch (error) {
    console.error('🚨 Erro no AI Generate:', error);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}

// ==================== SYSTEM PROMPTS POR FERRAMENTA ====================
function getSystemPrompt(tool, params) {
  const lang = params.language || 'pt-BR';

  const prompts = {
    'scripts': `Você é um roteirista profissional de vídeos virais para redes sociais. Gere scripts envolventes, com ganchos fortes nos primeiros 3 segundos, storytelling, e call-to-action. Sempre em ${lang}. Formate com marcações de cena, narração, e texto na tela.`,

    'copywriting': `Você é um copywriter de elite especializado em marketing digital. Crie textos persuasivos com gatilhos mentais (escassez, prova social, autoridade, reciprocidade). Use storytelling, CTAs fortes, e adapte o tom para a plataforma indicada. Sempre em ${lang}.`,

    'seo': `Você é um especialista em SEO e marketing digital. Analise e otimize conteúdo para mecanismos de busca. Forneça: palavras-chave primárias e secundárias, meta description, heading structure, sugestões de internal linking, e score de otimização. Sempre em ${lang}.`,

    'hashtags': `Você é um especialista em crescimento orgânico nas redes sociais. Gere hashtags estratégicas divididas em: alta competição (alcance), média competição (engajamento), nicho específico (conversão), e trending. Inclua volume estimado e relevância. Sempre em ${lang}.`,

    'ebook': `Você é um autor e estrategista de negócios. Escreva conteúdo detalhado e profissional para ebooks de marketing e negócios. Cada capítulo deve ter: introdução envolvente, estratégias práticas com exemplos reais, dados estatísticos, cases de sucesso, e plano de ação. Mínimo 800 palavras por capítulo. Sempre em ${lang}.`,

    'funnel': `Você é um especialista em funis de vendas e conversão. Crie copy persuasiva para páginas de vendas, landing pages, e sequências de email. Use gatilhos mentais, storytelling, depoimentos estruturados, e CTAs otimizados. Sempre em ${lang}.`,

    'trends': `Você é um analista de tendências digitais. Identifique e analise tendências atuais do mercado, comportamento do consumidor, e oportunidades de conteúdo viral. Forneça dados concretos e recomendações acionáveis. Sempre em ${lang}.`,

    'translate': `Você é um tradutor profissional e especialista em localização. Traduza o conteúdo mantendo o tom, nuances culturais, e adaptando expressões idiomáticas para o mercado-alvo. Mantenha formatação original.`,

    'general': `Você é um assistente de IA especializado em marketing digital, criação de conteúdo, e crescimento de negócios. Responda de forma profissional e acionável. Sempre em ${lang}.`
  };

  return prompts[tool] || prompts['general'];
}

function getDefaultTokens(tool) {
  const tokens = {
    'scripts': 2000,
    'copywriting': 1500,
    'seo': 1500,
    'hashtags': 800,
    'ebook': 4000,
    'funnel': 3000,
    'trends': 1500,
    'translate': 2000,
    'general': 1500
  };
  return tokens[tool] || 1500;
}

function getDefaultTemperature(tool) {
  const temps = {
    'scripts': 0.8,
    'copywriting': 0.7,
    'seo': 0.3,
    'hashtags': 0.6,
    'ebook': 0.7,
    'funnel': 0.7,
    'trends': 0.5,
    'translate': 0.2,
    'general': 0.7
  };
  return temps[tool] || 0.7;
}
