import { GoogleGenAI, Type, Modality } from "@google/genai";
import {
  HashtagSuggestion,
  ViralTrend,
  InnovationIdea,
  AutopilotActionLog,
  PostIdea,
  GrowthCampaign,
  SalesFunnel,
  QuantumLead,
  EngagementOpportunity,
  SocialAccount,
  LocationConfig,
  BioOptimization,
  EditorialDay,
  ViralPredictionResult
} from '../types';

const getApiKey = (): string => {
  try {
    const env = (import.meta as any).env || {};
    return env.VITE_GEMINI_API_KEY || env.VITE_API_KEY || '';
  } catch {
    return '';
  }
};

const generateImageFromPrompt = async (ai: GoogleGenAI, prompt: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '16:9',
        outputMimeType: 'image/jpeg'
      },
    });
    return response.generatedImages?.[0]?.image?.imageBytes
      ? `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`
      : undefined;
  } catch (error) {
    console.warn("Failed to generate image for prompt:", prompt, error);
    return undefined;
  }
};

export const testGeminiConnection = async (): Promise<boolean> => {
  const apiKey = getApiKey();
  if (!apiKey) return false;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Ping',
    });
    return !!response.text;
  } catch (e) {
    return false;
  }
};

export const verifyImageGenerationStatus = async (): Promise<boolean> => {
  const apiKey = getApiKey();
  if (!apiKey) return false;
  try {
    const ai = new GoogleGenAI({ apiKey });
    return !!ai;
  } catch (e) {
    return false;
  }
};

export const generateHashtagSuggestions = async (topic: string): Promise<HashtagSuggestion | null> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    const base = topic.trim() || 'negócio';
    const slug = base.replace(/\s+/g, '');
    return {
      local: [`#${slug}Local`, `#${slug}DaSuaCidade`, '#NegócioLocal'],
      national: [`#${slug}`, '#Brasil', '#Tendencia'],
      global: [`#${slug}World`, '#Viral', '#FYP']
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Gere hashtags estratégicas para o tópico/nicho: "${topic}". Retorne JSON com 3 arrays: 'local' (focadas em cidade/bairro), 'national' (Brasil) e 'global' (Mundo/Inglês).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            local: { type: Type.ARRAY, items: { type: Type.STRING } },
            national: { type: Type.ARRAY, items: { type: Type.STRING } },
            global: { type: Type.ARRAY, items: { type: Type.STRING } },
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return null;
  }
};

export const getViralTrends = async (platform: string): Promise<ViralTrend[]> => {
  return [
    { title: 'Trend de bastidores rápidos', description: `Mostre os bastidores do seu negócio em poucos segundos (${platform}).`, type: 'Desafio' },
    { title: 'Antes e depois do resultado', description: 'Apresente o estado antes do cliente comprar e o depois com o resultado transformado.', type: 'Áudio' },
    { title: '#SouClienteFiel', description: 'Hashtag para reforçar depoimentos e recorrência de compra.', type: 'Hashtag' },
  ];
};

export const diagnoseAndSuggestFix = async (issue: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Sugestão (simulação): revisar integrações, limpar cache e reiniciar o serviço afetado.";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Aja como um engenheiro de confiabilidade de site (SRE). Diagnostique e sugira uma correção técnica para este problema no sistema: "${issue}". Seja conciso e técnico.`
    });
    return response.text || "Não foi possível gerar uma solução.";
  } catch (e) {
    return "Erro ao consultar IA.";
  }
};

export const generateInnovationIdeas = async (): Promise<InnovationIdea[]> => {
  const apiKey = getApiKey();

  const mockIdeas: InnovationIdea[] = [
    {
      id: `idea_${Date.now()}_1`,
      title: 'Painel de tendências em tempo real',
      description: 'Monitorar em tempo real conteúdos e ofertas que mais convertem dentro do seu nicho e sugerir ajustes automáticos.',
      category: 'Platform Upgrade',
      impactScore: 9
    },
    {
      id: `idea_${Date.now()}_2`,
      title: 'Assistente de respostas em Direct',
      description: 'Bot que responde mensagens frequentes dos clientes mantendo o tom da marca e capturando leads quentes.',
      category: 'User Feature',
      impactScore: 8
    },
    {
      id: `idea_${Date.now()}_3`,
      title: 'Otimização automática de criativos',
      description: 'Sistema que testa variações de criativos em pequeno volume e escala automaticamente o melhor desempenho.',
      category: 'Admin Tool',
      impactScore: 10
    }
  ];

  if (!apiKey) return mockIdeas;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Aja como um Product Manager de uma plataforma SaaS de marketing. Gere 3 ideias de funcionalidades inovadoras e técnicas. Retorne apenas um JSON array.",
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING, enum: ['Admin Tool', 'User Feature', 'Platform Upgrade'] },
              impactScore: { type: Type.NUMBER },
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || '[]');
    return data.map((item: any, index: number) => ({
      ...item,
      id: `ai_idea_${Date.now()}_${index}`
    }));

  } catch (error) {
    console.error("Error generating innovations:", error);
    return mockIdeas;
  }
};

export const generateAutopilotAction = async (
  businessInfo?: string
): Promise<Omit<AutopilotActionLog, 'id' | 'timestamp' | 'status'>> => {
  const platforms = ['Instagram', 'X', 'LinkedIn', 'TikTok'] as const;
  const actions = ['Postar', 'Comentar', 'Seguir', 'Like'] as const;

  const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
  const randomAction = actions[Math.floor(Math.random() * actions.length)];

  const niche = (businessInfo || 'seu nicho').trim();
  const shortNiche = niche.length > 40 ? niche.slice(0, 40) + '...' : niche;

  // Links simulados mais úteis por plataforma
  const baseLinks: Record<(typeof platforms)[number], string> = {
    Instagram: `https://www.instagram.com/explore/tags/${encodeURIComponent(shortNiche.replace(/\s+/g, ''))}`,
    X: `https://twitter.com/search?q=${encodeURIComponent(shortNiche)}`,
    LinkedIn: `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(shortNiche)}`,
    TikTok: `https://www.tiktok.com/tag/${encodeURIComponent(shortNiche.replace(/\s+/g, ''))}`
  };

  let content = `Ação de engajamento genérica para ${randomPlatform}`;
  let link = baseLinks[randomPlatform];

  const apiKey = getApiKey();

  // Se tiver chave, pede para a IA refinar a ação; se não tiver, usa um mock bem trabalhado
  if (businessInfo) {
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `
Você é um assistente de growth para redes sociais.

Negócio/Nicho: "${businessInfo}"
Plataforma: ${randomPlatform}
Tipo de ação: ${randomAction}

Gere UMA ação curta e específica, em no máximo 220 caracteres, explicando:
- O que será feito (ex: comentar em posts com tal hashtag, publicar um reels com tal ideia, etc).
- Qual público ou tema será alvo.

Retorne APENAS o texto da ação, sem explicações extras.
          `.trim()
        });
        const text = (response.text || '').trim();
        if (text) {
          content = text.length > 260 ? text.slice(0, 260) : text;
        } else {
          content = `Interagindo com público ideal de ${shortNiche} no ${randomPlatform}, focando em ganhar visibilidade e novos seguidores.`;
        }
      } catch {
        content = `Interagindo com público ideal de ${shortNiche} no ${randomPlatform}, focando em ganhar visibilidade e novos seguidores.`;
      }
    } else {
      // Modo DEMO: ações humanizadas por plataforma/ação
      if (randomPlatform === 'Instagram' && randomAction === 'Comentar') {
        content = `Comentando em posts recentes de ${shortNiche} com elogios verdadeiros e perguntas abertas para gerar respostas e novos seguidores.`;
      } else if (randomPlatform === 'Instagram' && randomAction === 'Postar') {
        content = `Sugestão de novo Reels mostrando bastidores de ${shortNiche}, com legenda chamando para salvar o conteúdo e seguir o perfil.`;
      } else if (randomPlatform === 'TikTok' && randomAction === 'Postar') {
        content = `Gravando vídeo curto no TikTok usando um áudio em alta, conectando a trend com ${shortNiche} e chamando para seguir o perfil.`;
      } else if (randomPlatform === 'LinkedIn' && randomAction === 'Postar') {
        content = `Publicando post educativo no LinkedIn explicando um aprendizado prático sobre ${shortNiche}, com CTA para comentar uma experiência.`;
      } else if (randomPlatform === 'X' && randomAction === 'Postar') {
        content = `Tweetando insight rápido sobre ${shortNiche} com pergunta no final, usando 1–2 hashtags estratégicas para ampliar o alcance.`;
      } else if (randomAction === 'Seguir') {
        content = `Seguindo perfis que falam de ${shortNiche} e que interagem com conteúdos parecidos, para aumentar a chance de follow de volta.`;
      } else if (randomAction === 'Like') {
        content = `Curtindo conteúdos recentes sobre ${shortNiche} em ${randomPlatform}, para aumentar a exposição orgânica do perfil.`;
      } else {
        content = `Interagindo com público ideal de ${shortNiche} no ${randomPlatform}, combinando ações rápidas de ${randomAction.toLowerCase()}.`;
      }
    }
  }

  // Alguns casos especiais de link (ex.: criação de post)
  if (randomPlatform === 'X' && randomAction === 'Postar') {
    link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`;
  }

  return {
    platform: randomPlatform,
    action: randomAction,
    content,
    link
  };
};

export const generatePersonaSpeech = async (script: string): Promise<string | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: {
        parts: [{ text: script }],
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    // @ts-ignore
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return audioData || null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};

export const generatePostIdeas = async (
  businessInfo: string,
  platform: string,
  tone: string,
  locationConfig: LocationConfig
): Promise<PostIdea[]> => {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Gere 3 ideias de posts para ${platform}. Negócio/Nicho: "${businessInfo}". Tom: ${tone}. Alcance: ${locationConfig.reach} ${locationConfig.city ? `(${locationConfig.city})` : ''}.
            Retorne JSON array. Cada item deve ter: title, content, platform (igual ao input), videoPrompt (prompt para gerar video), optimalTime (horário ideal).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              platform: { type: Type.STRING },
              videoPrompt: { type: Type.STRING },
              optimalTime: { type: Type.STRING },
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const generateGrowthCampaign = async (
  businessInfo: string,
  platform: string,
  tone: string,
  locationConfig: LocationConfig
): Promise<GrowthCampaign> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    const nicho = businessInfo || 'seu negócio';
    return {
      targetPersona: `Pessoas que têm interesse em ${nicho.toLowerCase()} e buscam qualidade, confiança e boa experiência de atendimento.`,
      strategy: `Criar presença forte em ${platform}, combinando bastidores, provas sociais (clientes reais) e ofertas específicas para ${nicho.toLowerCase()}, com CTAs claros para Direct, WhatsApp ou link da bio.`,
      posts: [
        {
          id: Date.now(),
          title: `Bastidores: como é ${nicho}`,
          content: `Mostre em vídeo como funciona o dia a dia de ${nicho.toLowerCase()}, destacando detalhes que passam confiança (qualidade, processo, atendimento, diferencial).`,
          platform,
          videoPrompt: `Bastidores reais de ${nicho.toLowerCase()}, mostrando detalhes, equipe e ambiente, em clima profissional e acolhedor`,
          optimalTime: "19:30"
        },
        {
          id: Date.now() + 1,
          title: "Prova social: cliente satisfeito",
          content: `Grave um cliente falando rapidamente por que recomenda ${nicho.toLowerCase()} e o que mais gosta na sua marca.`,
          platform,
          videoPrompt: `Cliente sorrindo falando sobre ${nicho.toLowerCase()}, em ambiente real do negócio`,
          optimalTime: "20:15"
        }
      ]
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Atue como um estrategista de marketing. Crie uma campanha de crescimento viral para: ${businessInfo}. 
            Plataforma alvo: ${platform}. Tom de voz: ${tone}.
            IMPORTANTE: Retorne APENAS um JSON válido seguindo estritamente o esquema.
            A campanha deve incluir uma persona detalhada, uma estratégia clara e 4 ideias de posts práticos.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetPersona: { type: Type.STRING },
            strategy: { type: Type.STRING },
            posts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER, nullable: true },
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                  platform: { type: Type.STRING },
                  videoPrompt: { type: Type.STRING },
                  optimalTime: { type: Type.STRING },
                }
              }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || '{}');

    if (data.posts && Array.isArray(data.posts)) {
      data.posts = data.posts.map((p: any, i: number) => ({
        ...p,
        id: Date.now() + i,
        mediaStatus: 'uninitialized',
        mediaType: 'image'
      }));
    }

    return data;
  } catch (e) {
    console.error("Campaign Generation Error:", e);
    return {
      targetPersona: "Erro ao gerar persona. Verifique sua conexão.",
      strategy: "Tente novamente em alguns instantes.",
      posts: []
    };
  }
};

export const generateSalesFunnel = async (businessInfo: string): Promise<SalesFunnel> => {
  const apiKey = getApiKey();

  // MODO DEMO: Ebook completo (12 capítulos) + imagens simuladas, baseado no nicho
  if (!apiKey) {
    const nicho = businessInfo || 'seu negócio';
    const nLower = nicho.toLowerCase();

    const makeImage = (label: string) =>
      `https://via.placeholder.com/800x400.png?text=${encodeURIComponent(label)}`;

    const chapters = [
      {
        title: "Capítulo 1 – Entendendo o seu cliente ideal",
        content: `Quem é a pessoa perfeita para comprar de ${nLower}? Neste capítulo você irá definir perfil, dores, desejos e objeções para falar a língua certa do seu público.`,
        image: makeImage(`Cliente ideal - ${nicho}`)
      },
      {
        title: "Capítulo 2 – Oferta irresistível para o seu nicho",
        content: `Como estruturar combos, bônus, garantias e diferenciais para que a sua oferta em ${nLower} pareça óbvia e difícil de recusar.`,
        image: makeImage(`Oferta irresistível - ${nicho}`)
      },
      {
        title: "Capítulo 3 – Estratégias de divulgação nas redes sociais",
        content: `Ideias de posts, stories, reels e campanhas para atrair clientes para ${nLower}, mesmo com pouco orçamento.`,
        image: makeImage(`Redes sociais - ${nicho}`)
      },
      {
        title: "Capítulo 4 – Construindo autoridade no seu nicho",
        content: `Como posicionar ${nLower} como referência, usando conteúdo educativo, bastidores e provas sociais para que o público confie na sua marca antes mesmo de comprar.`,
        image: makeImage(`Autoridade - ${nicho}`)
      },
      {
        title: "Capítulo 5 – Jornada completa do cliente",
        content: `Mapeie desde o primeiro contato até o pós-venda em ${nLower}, identificando pontos de atrito e oportunidades de encantamento em cada etapa.`,
        image: makeImage(`Jornada do cliente - ${nicho}`)
      },
      {
        title: "Capítulo 6 – Copywriting que vende",
        content: `Modelos de mensagens, legendas e chamadas que despertam desejo em quem procura por ${nLower}, usando gatilhos mentais de forma ética.`,
        image: makeImage(`Copywriting - ${nicho}`)
      },
      {
        title: "Capítulo 7 – Provas sociais e depoimentos",
        content: `Como coletar, organizar e exibir depoimentos de clientes de ${nLower} para reduzir objeções e aumentar a taxa de conversão.`,
        image: makeImage(`Provas sociais - ${nicho}`)
      },
      {
        title: "Capítulo 8 – Ofertas, combos e promoções",
        content: `Estruture ofertas pontuais, campanhas sazonais e combos lucrativos para ${nLower}, sem depender de descontos agressivos o tempo todo.`,
        image: makeImage(`Ofertas - ${nicho}`)
      },
      {
        title: "Capítulo 9 – Funis simples para captar leads",
        content: `Modelos de funis para capturar contatos interessados em ${nLower} usando iscas digitais, formulários e automações simples.`,
        image: makeImage(`Funis de leads - ${nicho}`)
      },
      {
        title: "Capítulo 10 – Seguimento e nutrição de leads",
        content: `Sequências de mensagens e conteúdos que mantêm o interesse das pessoas que demonstraram interesse em ${nLower}, até o momento certo da compra.`,
        image: makeImage(`Nutrição de leads - ${nicho}`)
      },
      {
        title: "Capítulo 11 – Escalando o que funciona",
        content: `Como identificar campanhas e ações que mais trazem resultados em ${nLower} e direcionar mais energia e orçamento para o que realmente converte.`,
        image: makeImage(`Escala - ${nicho}`)
      },
      {
        title: "Capítulo 12 – Plano de ação em 30 dias",
        content: `Um roteiro prático de 30 dias com tarefas diárias para aplicar tudo que você aprendeu e começar a ver resultados reais em ${nLower}.`,
        image: makeImage(`Plano 30 dias - ${nicho}`)
      }
    ];

    return {
      leadMagnet: {
        title: `Guia Definitivo para aumentar vendas de ${nicho}`,
        description: `Um passo a passo simples e prático para multiplicar o faturamento de ${nLower} usando estratégias digitais.`,
        coverImage: makeImage(`Capa Ebook - ${nicho}`),
        chapters
      },
      landingPageCopy: {
        headline: `Transforme ${nicho} em uma máquina previsível de vendas`,
        body: `Neste guia exclusivo você vai aprender, passo a passo, como posicionar ${nLower}, criar ofertas irresistíveis e usar as redes sociais para atrair clientes prontos para comprar.`,
        cta: "Quero baixar o guia agora"
      },
      emailSequence: [
        {
          subject: `Bem-vindo(a) ao guia de crescimento de ${nicho}`,
          body: "E-mail 1 (demo): agradeça o download, conte rapidamente a história da marca e mostre o que a pessoa vai aprender no material."
        },
        {
          subject: "3 erros que estão travando suas vendas hoje",
          body: "E-mail 2 (demo): liste erros comuns que negócios desse nicho cometem, gere valor e prepare o terreno para uma oferta."
        },
        {
          subject: "Convite especial: próximos passos para crescer mais rápido",
          body: "E-mail 3 (demo): apresente a oferta principal (serviço, produto ou consultoria) e chame para uma ação clara (responder, agendar, comprar, etc.)."
        }
      ]
    };
  }

  // MODO COM API KEY: usa Gemini para gerar texto + imagens
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Crie um E-book "Ímã de Leads" Premium e EXTENSO para o negócio: ${businessInfo}.
            O E-book deve ser denso o suficiente para preencher 15 páginas A4.
            
            Requisitos Obrigatórios:
            1. Título altamente persuasivo e vendável.
            2. Descrição impactante.
            3. Exatamente 12 capítulos MUITO DETALHADOS. Cada capítulo deve ter no mínimo 400 palavras, com tópicos práticos, exemplos e listas.
            4. Inclua também a Copy da Landing Page e uma Sequência de 3 Emails de vendas.
            
            Retorne APENAS JSON.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            leadMagnet: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                chapters: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      content: { type: Type.STRING },
                    }
                  }
                }
              }
            },
            landingPageCopy: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                body: { type: Type.STRING },
                cta: { type: Type.STRING },
              }
            },
            emailSequence: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  body: { type: Type.STRING },
                }
              }
            }
          }
        }
      }
    });

    const funnelData = JSON.parse(response.text || '{}');

    if (funnelData.leadMagnet) {
      const coverPrompt = `High quality book cover for "${funnelData.leadMagnet.title}", professional design, marketing style, theme: ${businessInfo}.`;
      const coverPromise = generateImageFromPrompt(ai, coverPrompt);

      const chapterPromises = (funnelData.leadMagnet.chapters || []).map(async (chapter: any) => {
        const chapPrompt = `Editorial illustration for book chapter titled "${chapter.title}", context: ${businessInfo}, professional style, high quality.`;
        const img = await generateImageFromPrompt(ai, chapPrompt);
        return { ...chapter, image: img };
      });

      const [coverImage, ...chaptersWithImages] = await Promise.all([coverPromise, ...chapterPromises]);

      funnelData.leadMagnet.coverImage = coverImage;
      funnelData.leadMagnet.chapters = chaptersWithImages;
    }

    return funnelData;

  } catch (e) {
    console.error("Sales Funnel Generation Error:", e);
    throw e;
  }
};

// --- NEW TOOLS FOR "CRESCIMENTO AVANÇADO" ---

export const analyzeViralTrends = async (niche: string): Promise<ViralTrend[]> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    const n = niche || 'seu nicho';
    return [
      {
        title: 'Reels de bastidores do negócio',
        description: `Mostre o dia a dia de ${n.toLowerCase()}, com cortes rápidos e texto na tela destacando diferenciais.`,
        type: 'Desafio',
      },
      {
        title: 'Trend do “antes e depois do cliente”',
        description: 'Mostre a situação do cliente antes de comprar de você e o depois usando seu produto/serviço.',
        type: 'Áudio',
      },
      {
        title: '#ClienteFeliz',
        description: 'Hashtag temática para reforçar depoimentos e resultados de clientes.',
        type: 'Hashtag',
      },
    ];
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analise as tendências atuais para o nicho "${niche}". Identifique 3 oportunidades virais (Áudios, Desafios ou Hashtags). Retorne JSON.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['Áudio', 'Hashtag', 'Desafio'] },
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};

export const optimizeBio = async (niche: string, currentBio: string): Promise<BioOptimization | null> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    const n = niche || 'seu nicho';
    return {
      headline: `${n}`,
      body: `Ajudo pessoas que procuram ${n.toLowerCase()} a terem uma experiência diferenciada, com atendimento próximo e foco em resultado.`,
      cta: 'Chame no Direct ou clique no link para falar agora',
      linkText: 'Clique aqui para falar com nossa equipe',
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Otimize esta biografia de Instagram/TikTok para o nicho "${niche}". Foco em conversão e autoridade. Bio Atual: "${currentBio}". Retorne JSON com headline, body, cta e linkText.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            body: { type: Type.STRING },
            cta: { type: Type.STRING },
            linkText: { type: Type.STRING },
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return null;
  }
};

export const generateEditorialCalendar = async (niche: string): Promise<EditorialDay[]> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    const n = niche || 'seu negócio';
    return [
      { day: 'Dia 1', theme: 'Bastidores', postIdea: `Mostre o processo ou bastidores de ${n.toLowerCase()}.`, format: 'Reels' },
      { day: 'Dia 2', theme: 'Prova social', postIdea: 'Cliente dando depoimento rápido sobre a experiência com sua marca.', format: 'Stories' },
      { day: 'Dia 3', theme: 'Oferta especial', postIdea: 'Oferta ou condição exclusiva válida por tempo limitado.', format: 'Stories' },
      { day: 'Dia 4', theme: 'Educação', postIdea: `Explique algo que poucas pessoas sabem sobre ${n.toLowerCase()}.`, format: 'Carrossel' },
      { day: 'Dia 5', theme: 'Produto/serviço em destaque', postIdea: 'Apresente um produto/serviço específico e mostre seus benefícios.', format: 'Reels' },
      { day: 'Dia 6', theme: 'Equipe/Marca', postIdea: 'Apresente a equipe ou bastidores humanos por trás da marca.', format: 'Imagem' },
      { day: 'Dia 7', theme: 'Chamada forte', postIdea: 'Convite direto para reservar, pedir, marcar horário ou comprar.', format: 'Reels' },
    ];
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Crie um calendário editorial de 7 dias para o nicho "${niche}". Retorne JSON array.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING },
              theme: { type: Type.STRING },
              postIdea: { type: Type.STRING },
              format: { type: Type.STRING, enum: ['Reels', 'Carrossel', 'Imagem', 'Stories'] }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};

// --- END NEW TOOLS ---

export const generateQuantumLeads = async (
  businessInfo: string,
  socialAccounts: SocialAccount[]
): Promise<QuantumLead[] | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  try {
    const accountsStr = socialAccounts.map(a => `${a.platform}: ${a.username}`).join(', ');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Gere 5 leads potenciais (influenciadores ou perfis de empresas) para o negócio: "${businessInfo}". Contas conectadas: ${accountsStr}.
            Retorne JSON array com name, profileUrl (use urls ficticias se necessario), reason, affinityScore (0-100).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, nullable: true },
              name: { type: Type.STRING },
              profileUrl: { type: Type.STRING },
              reason: { type: Type.STRING },
              affinityScore: { type: Type.NUMBER },
            }
          }
        }
      }
    });
    const data = JSON.parse(response.text || '[]');
    return data.map((l: any, i: number) => ({ ...l, id: `lead_${i}` }));
  } catch (e) {
    return null;
  }
};

export const generateEngagementMatrix = async (businessInfo: string): Promise<EngagementOpportunity[] | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Gere 3 oportunidades de engajamento em comunidades para: "${businessInfo}".
            Retorne JSON array com platform, community, topic, suggestedAction, contentSuggestion.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, nullable: true },
              platform: { type: Type.STRING },
              community: { type: Type.STRING },
              topic: { type: Type.STRING },
              suggestedAction: { type: Type.STRING },
              contentSuggestion: { type: Type.STRING },
            }
          }
        }
      }
    });
    const data = JSON.parse(response.text || '[]');
    return data.map((d: any, i: number) => ({ ...d, id: `eng_${i}` }));
  } catch (e) {
    return null;
  }
};

export const generateMarketingVideo = async (prompt: string): Promise<string | null> => {
  const apiKey = getApiKey();

  // MODO DEMO: sem API key → sempre devolve um vídeo de exemplo
  if (!apiKey) {
    // Você pode trocar por um arquivo próprio (ex: /videos/demo-promo.mp4)
    return 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4';
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '16:9',
      },
    });

    // polling até terminar
    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (videoUri) {
      return `${videoUri}&key=${apiKey}`;
    }

    return null;
  } catch (e: any) {
    console.error('Video generation failed', e);
    // Devolve null para o componente tratar e mostrar mensagem amigável
    return null;
  }
};

export const generatePresentationMedia = async (prompt: string): Promise<string[]> => {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  try {
    const images: string[] = [];
    for (let i = 0; i < 3; i++) {
      const img = await generateImageFromPrompt(ai, `${prompt} - Slide ${i + 1}, professional presentation style, high quality, 4k`);
      if (img) images.push(img);
    }
    return images;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const getChatbotResponse = async (message: string, history: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Estou em modo de demonstração offline. Por favor, configure sua API Key.";

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Você é um assistente de suporte do Viraliza.ai. Histórico: ${history}. Usuário: ${message}. Responda de forma útil e curta.`,
    });
    return response.text || "Não entendi, pode repetir?";
  } catch (e) {
    return "Erro ao processar mensagem.";
  }
};

export const editImageWithText = async (base64Image: string, mimeType: string, prompt: string): Promise<string | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData) {
      return part.inlineData.data;
    }
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const predictViralPotential = async (
  contentDescription: string,
  platform: string
): Promise<ViralPredictionResult> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      score: 8.5,
      viralProbability: 'Alta',
      analysis: {
        copy: 'A ideia é boa, mas pode ter um gancho inicial mais forte e um CTA mais direto.',
        visuals: 'Use imagens/vídeo que mostrem claramente o benefício principal para o público.',
        cta: 'Inclua um convite explícito para comentar, salvar ou clicar no link da bio.'
      },
      suggestions: [
        'Adicionar legenda oculta com palavras-chave relevantes do seu nicho.',
        'Usar um áudio em alta na plataforma escolhida.',
        'Publicar em horário de pico do seu público (ex.: entre 18h e 21h).'
      ],
      idealContent:
        `Post para ${platform} com foco em: ${contentDescription}. Comece com uma pergunta forte ou dor do público, mostre rapidamente o benefício principal e finalize com um CTA claro como "comente", "salve" ou "clique no link da bio".`
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Aja como um especialista em algoritmos de redes sociais. 
Analise este conteúdo para o ${platform}: "${contentDescription}". 
1) Preveja o potencial viral de 0 a 10. 
2) Explique os pontos fortes e fracos em termos de copy, visual e CTA.
3) Reescreva a ideia/rascunho de forma ideal para atingir nota 10/10, mantendo o mesmo contexto e plataforma.

Retorne APENAS JSON com:
- score (number)
- viralProbability (Baixa/Média/Alta/Muito Alta)
- analysis (objeto com copy, visuals, cta)
- suggestions (array de strings)
- idealContent (string).`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            viralProbability: { type: Type.STRING },
            analysis: {
              type: Type.OBJECT,
              properties: {
                copy: { type: Type.STRING },
                visuals: { type: Type.STRING },
                cta: { type: Type.STRING },
              }
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            idealContent: { type: Type.STRING }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.idealContent) {
      parsed.idealContent = `Versão otimizada para o ${platform}: ${contentDescription} (ajustada com abertura forte, vantagem clara e CTA direto).`;
    }
    return parsed;
  } catch (e) {
    console.error("Viral Prediction Error:", e);
    return {
      score: 0,
      viralProbability: 'Baixa',
      analysis: { copy: '', visuals: '', cta: '' },
      suggestions: ['Erro ao conectar com a IA.'],
      idealContent: ''
    };
  }
};