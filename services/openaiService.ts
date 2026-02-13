// 🤖 SERVIÇO OPENAI - CLIENTE FRONTEND
// Todas as ferramentas usam este serviço para chamar a API centralizada

class OpenAIService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = `${window.location.origin}/api/ai-generate`;
  }

  async generate(tool: string, prompt: string, params: Record<string, any> = {}): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, prompt, params })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error(`❌ OpenAI ${tool} error:`, err);
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ AI ${tool}: ${data.tokens_used} tokens usados`);
      return data.content;
    } catch (error) {
      console.error(`❌ OpenAI ${tool} falhou:`, error);
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
    imageStyle: string = 'logo'
  ): Promise<{ imageUrl: string; revisedPrompt: string }> {
    const prompt = `Logo for "${businessName}", a ${businessType} business. Style: ${style}. Colors: ${colors}. Modern, professional, memorable.`;

    const response = await fetch(`${window.location.origin}/api/ai-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        style: imageStyle,
        size: '1024x1024',
        quality: 'standard'
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(err.error || `HTTP ${response.status}`);
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
}

export const openaiService = new OpenAIService();
export default openaiService;
