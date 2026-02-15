// =============================================================
// 📊 API DE STATUS DOS MODELOS DE IA
// Verifica quais modelos estão configurados e funcionais
// =============================================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const models = {
    'claude_opus': {
      name: 'Claude Opus 4',
      provider: 'Anthropic',
      department: 'Estratégia e Análise',
      tools: ['funnel', 'seo', 'trends', 'analytics', 'strategy'],
      configured: !!process.env.ANTHROPIC_API_KEY,
      fallback: 'OpenAI GPT-4o-mini'
    },
    'sonnet': {
      name: 'Claude Sonnet 4',
      provider: 'Anthropic',
      department: 'Copywriting e Comunicação',
      tools: ['copywriting', 'scripts', 'ebook', 'hashtags', 'translate'],
      configured: !!process.env.ANTHROPIC_API_KEY,
      fallback: 'OpenAI GPT-4o-mini'
    },
    'codex_medium': {
      name: 'GPT-4o (Codex Medium)',
      provider: 'OpenAI',
      department: 'Automação e Programação',
      tools: ['automation', 'code', 'technical', 'integration'],
      configured: !!process.env.OPENAI_API_KEY,
      fallback: null
    },
    'kimi_k25': {
      name: 'Kimi K2.5',
      provider: 'Moonshot AI',
      department: 'Criatividade Multimodal',
      tools: ['creative', 'avatar', 'visual', 'branding', 'campaign'],
      configured: !!(process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY),
      fallback: 'OpenAI GPT-4o-mini'
    },
    'swe_15': {
      name: 'GPT-4o-mini (SWE-1.5)',
      provider: 'OpenAI',
      department: 'Prototipagem Rápida',
      tools: ['prototype', 'template', 'quick', 'general'],
      configured: !!process.env.OPENAI_API_KEY,
      fallback: null
    }
  };

  const totalConfigured = Object.values(models).filter(m => m.configured).length;
  const totalModels = Object.keys(models).length;

  return res.status(200).json({
    success: true,
    system: 'ViralizaAI Multi-Model AI Engine',
    version: '2.0',
    status: totalConfigured === totalModels ? 'all_active' : 'partial',
    configured: `${totalConfigured}/${totalModels}`,
    models,
    environment: {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      kimi: !!(process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY),
      supabase: !!process.env.SUPABASE_URL
    }
  });
}
