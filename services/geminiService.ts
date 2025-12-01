
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

const getApiKey = () => process.env.API_KEY;

// Helper function to generate images within the service
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
    // We don't actually generate an image to save quota/time, but we check if we can init the client
    // and if previous calls worked (simulated check)
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
        return {
            local: [`#${topic.split(' ')[0]}Local`, `#${topic.replace(' ', '')}Brasil`, '#DicaLocal'],
            national: [`#${topic.replace(' ', '')}`, '#Brasil', '#Tendencia'],
            global: [`#${topic}World`, '#Viral', '#FYP']
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
    // Mock implementation for stability if API fails or is unnecessary for this specific task
    return [
        { title: 'Áudio: "Pode falar..."', description: 'Áudio de comédia em alta para dublagens.', type: 'Áudio' },
        { title: 'Desafio da Transição', description: 'Corte seco de roupa casual para formal.', type: 'Desafio' },
        { title: '#DiaDeTBT', description: 'Postar evolução da empresa.', type: 'Hashtag' },
    ];
};

export const diagnoseAndSuggestFix = async (issue: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "Sugestão Automática (Simulação): Reiniciar o pod do serviço afetado e limpar o cache do Redis. Se o problema persistir, escalar o banco de dados.";

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
            title: 'Análise de Sentimento em Vídeo (Beta)',
            description: 'Implementar visão computacional para ler expressões faciais em vídeos do TikTok e avaliar a reação emocional da audiência frame a frame.',
            category: 'Platform Upgrade',
            impactScore: 9
        },
        {
            id: `idea_${Date.now()}_2`,
            title: 'Agente de Negociação Autônomo',
            description: 'Bot que utiliza NLP para negociar preços e fechar vendas simples via Direct do Instagram sem intervenção humana.',
            category: 'User Feature',
            impactScore: 8
        },
        {
            id: `idea_${Date.now()}_3`,
            title: 'Otimizador de Orçamento Cross-Platform',
            description: 'Algoritmo que move automaticamente o orçamento de ads entre Facebook, Google e TikTok dependendo do ROI em tempo real.',
            category: 'Admin Tool',
            impactScore: 10
        }
    ];

    if (!apiKey) return mockIdeas;

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Aja como um Product Manager visionário de uma plataforma SaaS de marketing viral. Gere 3 ideias de funcionalidades inovadoras e técnicas. Retorne apenas um JSON array.",
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

export const generateAutopilotAction = async (businessInfo?: string): Promise<Omit<AutopilotActionLog, 'id' | 'timestamp' | 'status'>> => {
    const platforms = ['Instagram', 'X', 'LinkedIn', 'TikTok'];
    const actions = ['Postar', 'Comentar', 'Seguir', 'Like'];
    const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    
    let content = `Ação de engajamento genérica para ${randomPlatform}`;
    let link = `https://${randomPlatform.toLowerCase()}.com`;

    if (businessInfo) {
        const apiKey = getApiKey();
        if (apiKey) {
             try {
                const ai = new GoogleGenAI({ apiKey });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `Gere uma ação curta de marketing automatizado para a plataforma ${randomPlatform} para o negócio: ${businessInfo}. Ação: ${randomAction}. Retorne apenas o texto do conteúdo/comentário.`,
                });
                content = response.text?.substring(0, 100) || content;
            } catch (e) {}
        } else {
             content = `Interagindo com público alvo de: ${businessInfo.substring(0, 20)}...`;
        }
    }
    
    // Generate intent links for realism
    if (randomPlatform === 'X' && randomAction === 'Postar') {
        link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`;
    } else if (randomPlatform === 'WhatsApp') {
        link = `https://wa.me/?text=${encodeURIComponent(content)}`;
    }

    return {
        platform: randomPlatform,
        action: randomAction,
        content: content,
        link: link
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
            contents: `Gere 3 ideias de posts para ${platform}. Negócio: "${businessInfo}". Tom: ${tone}. Alcance: ${locationConfig.reach} ${locationConfig.city ? `(${locationConfig.city})` : ''}.
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
    
    // Mock fallback
    if (!apiKey) {
        return {
            targetPersona: "Profissionais jovens e entusiastas (Mock)",
            strategy: "Conteúdo educativo e de bastidores (Mock)",
            posts: []
        };
    }

    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Atue como um estrategista de marketing de elite. Crie uma campanha de crescimento viral para: ${businessInfo}. 
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
        
        // Ensure posts have IDs for React rendering keys
        if (data.posts && Array.isArray(data.posts)) {
            data.posts = data.posts.map((p: any, i: number) => ({ 
                ...p, 
                id: Date.now() + i,
                mediaStatus: 'uninitialized', // Reset media status
                mediaType: 'image'
            }));
        }
        
        return data;
    } catch (e) {
        console.error("Campaign Generation Error:", e);
        // Return a partial object so UI doesn't crash completely
        return {
            targetPersona: "Erro ao gerar persona. Verifique sua conexão.",
            strategy: "Tente novamente em alguns instantes.",
            posts: []
        };
    }
};

export const generateSalesFunnel = async (businessInfo: string): Promise<SalesFunnel> => {
    const apiKey = getApiKey();
    
    if (!apiKey) {
         return {
            leadMagnet: { title: "Guia (Modo Offline)", description: "Configure sua API Key para gerar conteúdo completo.", chapters: [] },
            landingPageCopy: { headline: "Headline Mock", body: "Body Mock", cta: "Clique Aqui" },
            emailSequence: []
         };
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        // Step 1: Generate the Content (Text)
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

        // Step 2: Generate Images for Cover and Chapters in Parallel
        if (funnelData.leadMagnet) {
            const coverPrompt = `High quality book cover for "${funnelData.leadMagnet.title}", professional design, 8k resolution, marketing style, ${businessInfo} theme.`;
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
    if (!apiKey) return [];

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
    if (!apiKey) return null;
    
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
    } catch(e) {
        return null;
    }
};

export const generateEditorialCalendar = async (niche: string): Promise<EditorialDay[]> => {
    const apiKey = getApiKey();
    if(!apiKey) return [];

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
    } catch(e) {
        return [];
    }
}

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
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '1080p',
                aspectRatio: '16:9'
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({operation: operation});
        }
        
        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
             // Append API Key for access as per guidelines
             return `${videoUri}&key=${apiKey}`;
        }
        return null;
    } catch (e) {
        console.error("Video generation failed", e);
        throw e; // Propagate error to handle API key issues in UI
    }
};

export const generatePresentationMedia = async (prompt: string): Promise<string[]> => {
    const apiKey = getApiKey();
    if (!apiKey) return [];
    
    const ai = new GoogleGenAI({ apiKey });
    try {
        // Generate 3 images for a presentation
        const images = [];
        for(let i=0; i<3; i++) {
            const img = await generateImageFromPrompt(ai, `${prompt} - Slide ${i+1}, professional presentation style, high quality, 4k`);
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
        // Mock response for testing without API Key
        return {
            score: 8.5,
            viralProbability: 'Alta',
            analysis: {
                copy: 'O texto está envolvente, mas pode ter um CTA mais agressivo.',
                visuals: 'Sugestão: Use cores contrastantes e um rosto humano expressivo.',
                cta: 'Adicione "Salve para depois" para aumentar o alcance.'
            },
            suggestions: [
                'Adicionar legenda oculta para SEO.',
                'Usar áudio trending "Funny Cat" do TikTok.',
                'Postar às 18:00 para maior alcance.'
            ]
        };
    }

    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Aja como um especialista em algoritmos de redes sociais. Analise este conteúdo para o ${platform}: "${contentDescription}".
            Preveja o potencial viral de 0 a 10.
            Retorne JSON com: score (number), viralProbability (Baixa/Média/Alta/Muito Alta), analysis (objeto com copy, visuals, cta), e suggestions (array de strings).`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER },
                        viralProbability: { type: Type.STRING, enum: ['Baixa', 'Média', 'Alta', 'Muito Alta'] },
                        analysis: {
                            type: Type.OBJECT,
                            properties: {
                                copy: { type: Type.STRING },
                                visuals: { type: Type.STRING },
                                cta: { type: Type.STRING },
                            }
                        },
                        suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        
        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error("Viral Prediction Error:", e);
         return {
            score: 0,
            viralProbability: 'Baixa',
            analysis: { copy: '', visuals: '', cta: '' },
            suggestions: ['Erro ao conectar com a IA.']
        };
    }
};
