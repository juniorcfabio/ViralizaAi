// 🎨 API DE GERAÇÃO DE IMAGENS - OpenAI DALL-E 3
// Endpoint para Criador de Logos e futuras ferramentas de imagem

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
    const { prompt, style = 'logo', size = '1024x1024', quality = 'standard' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Campo obrigatório: prompt' });
    }

    // Montar prompt otimizado para logos
    const enhancedPrompt = buildImagePrompt(prompt, style);

    console.log(`🎨 DALL-E 3: style=${style}, size=${size}, quality=${quality}`);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size,
        quality,
        response_format: 'url'
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('❌ DALL-E error:', err);
      return res.status(response.status).json({ error: 'Erro na API DALL-E', details: err });
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;
    const revisedPrompt = data.data?.[0]?.revised_prompt;

    if (!imageUrl) {
      return res.status(500).json({ error: 'Nenhuma imagem gerada' });
    }

    console.log('✅ Imagem gerada com sucesso');

    return res.status(200).json({
      success: true,
      imageUrl,
      revisedPrompt,
      model: 'dall-e-3',
      size,
      quality
    });

  } catch (error) {
    console.error('🚨 Erro no AI Image:', error);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}

function buildImagePrompt(userPrompt, style) {
  const styleInstructions = {
    'logo': `Design a professional, modern logo. Clean vector-style design on a solid white background. Minimalist, memorable, suitable for business branding. NO text in the image, just the icon/symbol. ${userPrompt}`,

    'logo-text': `Design a professional logo with the text included. Clean, modern typography. High contrast, suitable for business cards and websites. White or transparent-style background. ${userPrompt}`,

    'thumbnail': `Create a vibrant, eye-catching YouTube/social media thumbnail. Bold colors, high contrast, engaging composition. ${userPrompt}`,

    'banner': `Create a professional social media banner/cover image. Wide format, clean design, suitable for Facebook/LinkedIn/Twitter header. ${userPrompt}`,

    'icon': `Design a clean, modern app icon. Simple shapes, bold colors, recognizable at small sizes. Flat design style. ${userPrompt}`,

    'illustration': `Create a professional digital illustration. Modern style, vibrant colors, clean lines. ${userPrompt}`
  };

  return styleInstructions[style] || styleInstructions['logo'];
}
