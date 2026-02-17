// � SERVIÇO MULTI-MODELO DE IA - CLIENTE FRONTEND
// =============================================================
// Roteamento Inteligente por Departamento:
// Claude Opus   → Estratégia (funnel, seo, trends, analytics)
// Sonnet        → Copywriting (scripts, copy, ebook, hashtags)
// Codex Medium  → Automação (code, technical, automation)
// Kimi K2.5     → Criativo (avatar, visual, branding, campaign)
// SWE-1.5       → Prototipagem (template, prototype, quick, general)
// =============================================================

class OpenAIService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = `${window.location.origin}/api/ai-generate`;
  }

  private async getUserId(): Promise<string | null> {
    try {
      const { supabase } = await import('../src/lib/supabase');
      const { data } = await supabase.auth.getSession();
      return data?.session?.user?.id || null;
    } catch {
      return null;
    }
  }

  async generate(tool: string, prompt: string, params: Record<string, any> = {}, retryCount = 0): Promise<string> {
    try {
      // Injetar userId automaticamente para verificação de créditos/limites
      if (!params.userId) {
        const uid = await this.getUserId();
        if (uid) params.userId = uid;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, prompt, params })
      });

      if (!response.ok) {
        let err;
        try {
          err = await response.json();
        } catch (parseError) {
          const textError = await response.text();
          console.error(`❌ AI ${tool} parse error:`, textError);
          throw new Error(`Erro de conexão: ${textError.substring(0, 100)}...`);
        }
        
        if (response.status === 429 && retryCount < 2) {
          const waitTime = (retryCount + 1) * 3000;
          console.log(`⏳ Rate limit. Aguardando ${waitTime/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return this.generate(tool, prompt, params, retryCount + 1);
        }
        
        console.error(`❌ AI ${tool} error:`, err);
        
        if (response.status === 429) {
          throw new Error('Limite de requisições atingido. Aguarde alguns segundos e tente novamente.');
        }

        if (response.status === 403 && err?.blocked) {
          throw new Error(err.message || 'Seus créditos acabaram. Compre créditos extras para continuar usando as ferramentas.');
        }
        
        throw new Error(err.details || err.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const providerInfo = data.provider ? ` [${data.provider}/${data.model}]` : '';
      const deptInfo = data.department ? ` dept=${data.department}` : '';
      console.log(`✅ AI ${tool}${providerInfo}${deptInfo}: ${data.tokens_used} tokens`);
      return data.content;
    } catch (error) {
      console.error(`❌ AI ${tool} falhou:`, error);
      throw error;
    }
  }

  // ==================== MÉTODOS ESPECÍFICOS POR FERRAMENTA ====================

  async generateScript(businessName: string, platform: string, style: string, topic: string): Promise<string> {
    const prompt = `Crie um script de vídeo viral para ${platform}.
Negócio: ${businessName}
Estilo: ${style}
Tema: ${topic}

Formate com:
- GANCHO (primeiros 3 segundos)
- DESENVOLVIMENTO (storytelling)
- CTA (call to action)
Inclua marcações de [CENA], [NARRAÇÃO], [TEXTO NA TELA].`;

    return this.generate('scripts', prompt);
  }

  async generateCopywriting(businessName: string, platform: string, objective: string, targetAudience: string): Promise<string> {
    const prompt = `Crie uma copy persuasiva para ${platform}.
Negócio: ${businessName}
Objetivo: ${objective}
Público-alvo: ${targetAudience}

Inclua:
- Headline com gatilho mental
- Corpo com storytelling
- Bullet points de benefícios
- CTA forte
- 3 variações de headline para teste A/B`;

    return this.generate('copywriting', prompt);
  }

  async optimizeSEO(content: string, keywords: string, businessType: string): Promise<string> {
    const prompt = `Analise e otimize este conteúdo para SEO.
Tipo de negócio: ${businessType}
Palavras-chave alvo: ${keywords}
Conteúdo: ${content}

Forneça:
1. Score de SEO atual (0-100)
2. Palavras-chave primárias recomendadas
3. Palavras-chave secundárias (long-tail)
4. Meta title otimizado (máx 60 chars)
5. Meta description otimizada (máx 160 chars)
6. Heading structure (H1, H2, H3)
7. Sugestões de melhoria específicas
8. Conteúdo reescrito e otimizado`;

    return this.generate('seo', prompt);
  }

  async generateHashtags(niche: string, platform: string, contentType: string): Promise<string> {
    const prompt = `Gere hashtags estratégicas para ${platform}.
Nicho: ${niche}
Tipo de conteúdo: ${contentType}

Divida em categorias:
1. 🔥 ALTA COMPETIÇÃO (5 hashtags) - alto alcance, muito usadas
2. 📈 MÉDIA COMPETIÇÃO (10 hashtags) - bom engajamento
3. 🎯 NICHO ESPECÍFICO (10 hashtags) - alta conversão
4. ⚡ TRENDING (5 hashtags) - tendências atuais

Para cada hashtag inclua volume estimado de posts.
Total: 30 hashtags otimizadas.`;

    return this.generate('hashtags', prompt);
  }

  async generateEbookChapter(
    chapterTitle: string,
    businessName: string,
    businessType: string,
    targetAudience: string,
    chapterNumber: number,
    totalChapters: number
  ): Promise<string> {
    const prompt = `Escreva o capítulo ${chapterNumber} de ${totalChapters} de um ebook profissional.

Título do capítulo: ${chapterTitle}
Negócio: ${businessName} (${businessType})
Público-alvo: ${targetAudience}

O capítulo deve conter:
- Introdução envolvente (2 parágrafos)
- 3-4 seções com subtítulos
- Exemplos práticos e cases reais
- Dados estatísticos relevantes
- Dicas acionáveis numeradas
- Conclusão com plano de ação de 7 dias

Mínimo 800 palavras. Tom profissional mas acessível.`;

    return this.generate('ebook', prompt, { maxTokens: 4000 });
  }

  async generateFunnelCopy(
    businessName: string,
    niche: string,
    targetAudience: string,
    pageType: string,
    productPrice: string
  ): Promise<string> {
    const prompt = `Crie a copy completa para uma página de ${pageType} de funil de vendas.

Negócio: ${businessName}
Nicho: ${niche}
Público-alvo: ${targetAudience}
Preço: ${productPrice}

Inclua:
- Headline principal (com gatilho mental)
- Sub-headline
- Seção de problema/dor
- Seção de solução
- 5 benefícios com ícones
- 3 depoimentos estruturados
- FAQ (5 perguntas)
- Garantia
- CTA principal e secundário
- Urgência/escassez`;

    return this.generate('funnel', prompt, { maxTokens: 3000 });
  }

  async analyzeTrends(niche: string, platform: string): Promise<string> {
    const prompt = `Analise as tendências atuais para o nicho "${niche}" na plataforma ${platform}.

Forneça:
1. 🔥 TOP 5 tendências do momento
2. 📊 Análise de cada tendência (potencial viral, duração estimada, nível de competição)
3. 💡 5 ideias de conteúdo baseadas nessas tendências
4. 📅 Melhor timing para publicar
5. 🎯 Formatos recomendados (reels, carrossel, story, etc.)
6. ⚡ Previsão de tendências para as próximas 2 semanas`;

    return this.generate('trends', prompt);
  }

  async generateLogo(
    businessName: string,
    businessType: string,
    style: string,
    colors: string,
    imageStyle: string = 'logo',
    retryCount = 0
  ): Promise<{ imageUrl: string; revisedPrompt: string }> {
    const prompt = `Logo for "${businessName}", a ${businessType} business. Style: ${style}. Colors: ${colors}. Modern, professional, memorable.`;

    // Injetar userId para verificação de créditos
    const uid = await this.getUserId();

    const response = await fetch(`${window.location.origin}/api/ai-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        style: imageStyle,
        size: '1024x1024',
        quality: 'standard',
        userId: uid || undefined
      })
    });

    if (!response.ok) {
      let err;
      try {
        err = await response.json();
      } catch (parseError) {
        const textError = await response.text();
        console.error(`❌ DALL-E parse error:`, textError);
        throw new Error(`Erro de conexão: ${textError.substring(0, 100)}...`);
      }
      
      // Se for rate limit (429) e ainda temos tentativas, aguardar e tentar novamente
      if (response.status === 429 && retryCount < 2) {
        const waitTime = (retryCount + 1) * 5000; // 5s, 10s (DALL-E é mais lento)
        console.log(`⏳ Rate limit atingido. Aguardando ${waitTime/1000}s antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.generateLogo(businessName, businessType, style, colors, imageStyle, retryCount + 1);
      }
      
      console.error(`❌ DALL-E error:`, err);

      if (response.status === 403 && err?.blocked) {
        throw new Error(err.message || 'Seus créditos acabaram. Compre créditos extras para continuar.');
      }
      
      // Mensagem mais amigável para rate limit
      if (response.status === 429) {
        throw new Error('Limite de requisições atingido. Por favor, aguarde alguns segundos e tente novamente.');
      }
      
      throw new Error(err.details || err.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return { imageUrl: data.imageUrl, revisedPrompt: data.revisedPrompt };
  }

  async translateContent(content: string, targetLanguage: string, context: string): Promise<string> {
    const prompt = `Traduza o seguinte conteúdo para ${targetLanguage}.
Contexto: ${context}

Conteúdo:
${content}

Regras:
- Mantenha o tom e estilo original
- Adapte expressões idiomáticas para o mercado-alvo
- Mantenha formatação (negrito, listas, etc.)
- Inclua nota de localização se necessário`;

    return this.generate('translate', prompt, { language: targetLanguage });
  }

  // ==================== KIMI K2.5 - CRIATIVIDADE MULTIMODAL ====================

  async generateCreativeCampaign(businessName: string, niche: string, objective: string, platforms: string[]): Promise<string> {
    const prompt = `Crie um conceito criativo completo de campanha para ${businessName}.
Nicho: ${niche}
Objetivo: ${objective}
Plataformas: ${platforms.join(', ')}

Inclua:
- Conceito central e moodboard descritivo
- Paleta de cores (hex codes) e tipografia
- 5 peças visuais detalhadas (composição, elementos, texto)
- Adaptações para cada plataforma (feed, stories, reels, tiktok)
- Cronograma de 30 dias com frequência de posts
- KPIs esperados por plataforma`;

    return this.generate('campaign', prompt, { maxTokens: 3000 });
  }

  async generateAvatarConcept(businessName: string, brandPersonality: string, targetAudience: string): Promise<string> {
    const prompt = `Crie um avatar/personagem de marca para ${businessName}.
Personalidade da marca: ${brandPersonality}
Público-alvo: ${targetAudience}

Descreva detalhadamente:
- Aparência visual (rosto, corpo, roupas, acessórios, cores)
- Personalidade e tom de voz (3 exemplos de falas)
- Expressões e poses para diferentes situações (feliz, pensativo, animado)
- Cenários ideais para cada plataforma
- Nome e backstory do personagem
- Aplicações: stories, thumbnails, posts, vídeos`;

    return this.generate('avatar', prompt, { maxTokens: 2000 });
  }

  async generateVisualBriefing(businessName: string, contentType: string, platform: string, objective: string): Promise<string> {
    const prompt = `Crie um briefing visual completo para ${contentType} de ${businessName} no ${platform}.
Objetivo: ${objective}

Inclua:
- Conceito visual e referências de estilo
- Layout e composição detalhada
- Paleta de cores com códigos hex
- Tipografia (fontes, tamanhos, hierarquia)
- Elementos gráficos e ícones necessários
- Texto para cada elemento (headline, body, CTA)
- Adaptações de tamanho (1080x1080, 1080x1920, 1920x1080)
- Checklist de produção`;

    return this.generate('visual', prompt, { maxTokens: 2000 });
  }

  async generateBrandIdentity(businessName: string, businessType: string, values: string[], targetAudience: string): Promise<string> {
    const prompt = `Desenvolva uma identidade de marca completa para ${businessName}.
Tipo de negócio: ${businessType}
Valores: ${values.join(', ')}
Público-alvo: ${targetAudience}

Inclua:
- Posicionamento de marca (statement)
- Proposta de valor única
- Tom de voz (com 5 exemplos práticos)
- Paleta de cores primária e secundária (hex codes)
- Tipografia (fontes para título, corpo, destaque)
- Elementos visuais (ícones, patterns, texturas)
- Guia de aplicação para redes sociais
- Do's and Don'ts de comunicação`;

    return this.generate('branding', prompt, { maxTokens: 2500 });
  }

  // ==================== CODEX MEDIUM - AUTOMACAO ====================

  async generateAutomation(businessName: string, workflow: string, tools: string[]): Promise<string> {
    const prompt = `Crie um fluxo de automação completo para ${businessName}.
Workflow: ${workflow}
Ferramentas disponíveis: ${tools.join(', ')}

Inclua:
- Diagrama do fluxo (em texto estruturado)
- Triggers (eventos que iniciam o fluxo)
- Condições e ramificações
- Ações em cada etapa
- Integrações necessárias (APIs, webhooks)
- Código/pseudocódigo para implementação
- Métricas de monitoramento
- Tratamento de erros e fallbacks`;

    return this.generate('automation', prompt, { maxTokens: 2500 });
  }

  // ==================== CLAUDE OPUS - ESTRATEGIA ====================

  async analyzeStrategy(businessName: string, niche: string, currentMetrics: string, goals: string): Promise<string> {
    const prompt = `Análise estratégica profunda para ${businessName}.
Nicho: ${niche}
Métricas atuais: ${currentMetrics}
Objetivos: ${goals}

Forneça:
1. Diagnóstico atual (SWOT detalhado)
2. Análise competitiva do nicho
3. 5 oportunidades estratégicas com ROI estimado
4. Plano de ação 90 dias com marcos semanais
5. KPIs prioritários com metas numéricas
6. Riscos e planos de contingência
7. Budget recomendado por canal
8. Projeções de crescimento (3, 6, 12 meses)`;

    return this.generate('strategy', prompt, { maxTokens: 3000 });
  }

  async analyzeBusinessMetrics(data: string, period: string, businessType: string): Promise<string> {
    const prompt = `Analise os seguintes dados de negócio e forneça insights acionáveis.
Tipo de negócio: ${businessType}
Período: ${period}
Dados: ${data}

Forneça:
1. Resumo executivo dos dados
2. Tendências identificadas (crescimento, queda, estagnação)
3. Métricas mais críticas e por quê
4. 5 ações imediatas baseadas nos dados
5. Previsões para próximo período
6. Benchmarks do setor para comparação
7. Alertas e anomalias detectadas`;

    return this.generate('analytics', prompt, { maxTokens: 2500 });
  }
}

export const openaiService = new OpenAIService();
export default openaiService;
