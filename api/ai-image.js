// 🎨 API DE GERAÇÃO DE IMAGENS - OpenAI DALL-E 3
// Endpoint para Criador de Logos e futuras ferramentas de imagem
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
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
    const { prompt, style = 'logo', size = '1024x1024', quality = 'standard', userId } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Campo obrigatório: prompt' });
    }

    // ==================== VERIFICAÇÃO DE CRÉDITOS/LIMITES ====================
    if (!userId) {
      return res.status(403).json({ error: 'Autenticação necessária', message: 'Faça login para gerar imagens.', blocked: true });
    }

    try {
      const { data: activeSub } = await supabase
        .from('subscriptions')
        .select('plan_type, end_date, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      let { data: userCredits } = await supabase
        .from('user_credits')
        .select('balance, daily_limit, daily_usage, last_daily_reset')
        .eq('user_id', userId)
        .maybeSingle();

      if (!userCredits) {
        await supabase.from('user_credits').upsert({
          user_id: userId, balance: 0, daily_limit: 20, daily_usage: 0, last_daily_reset: new Date().toISOString()
        }, { onConflict: 'user_id' });
        userCredits = { balance: 0, daily_limit: 20, daily_usage: 0 };
      }

      const hasActivePlan = activeSub && activeSub.status === 'active' && new Date(activeSub.end_date) > new Date();
      const creditBalance = userCredits.balance || 0;
      const dailyLimit = userCredits.daily_limit || 20;
      const dailyUsage = userCredits.daily_usage || 0;

      if (hasActivePlan) {
        if (dailyUsage >= dailyLimit && creditBalance <= 0) {
          return res.status(403).json({
            error: 'Limite diário atingido',
            message: `Limite diário de ${dailyLimit} usos atingido e sem créditos extras. Compre créditos para continuar.`,
            blocked: true
          });
        }
      } else {
        if (creditBalance <= 0) {
          return res.status(403).json({
            error: 'Sem créditos disponíveis',
            message: 'Sem plano ativo e sem créditos. Assine um plano ou compre créditos para gerar imagens.',
            blocked: true
          });
        }
      }
    } catch (creditErr) {
      console.error('❌ Erro ao verificar créditos (imagem):', creditErr.message);
      return res.status(500).json({ error: 'Erro ao verificar créditos', blocked: true });
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
      let errorDetails;
      try {
        errorDetails = await response.json();
      } catch {
        errorDetails = await response.text();
      }
      console.error('❌ DALL-E error:', errorDetails);
      
      // Retornar erro mais descritivo
      const errorMessage = errorDetails?.error?.message || errorDetails?.error || errorDetails || 'Erro desconhecido';
      return res.status(response.status).json({ 
        error: 'Erro na API DALL-E', 
        details: errorMessage,
        status: response.status 
      });
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;
    const revisedPrompt = data.data?.[0]?.revised_prompt;

    if (!imageUrl) {
      return res.status(500).json({ error: 'Nenhuma imagem gerada' });
    }

    console.log('✅ Imagem gerada com sucesso');

    // ==================== LOG DE USO + DEDUÇÃO DE CRÉDITOS ====================
    if (userId) {
      try {
        // Log na usage_log
        await supabase.from('usage_log').insert({
          user_id: userId,
          tool_id: 'image-generator',
          tool_name: 'image-generator',
          tokens_used: 0,
          images_generated: 1,
          audio_minutes: 0,
          openai_model: 'dall-e-3',
          cost_usd: 0,
          cost_brl: 0,
          created_at: new Date().toISOString()
        });

        // Incrementar daily_usage
        const { data: uc } = await supabase.from('user_credits').select('daily_usage, balance').eq('user_id', userId).maybeSingle();
        if (uc) {
          const updates = { daily_usage: (uc.daily_usage || 0) + 1, updated_at: new Date().toISOString() };
          // Deduzir crédito se estiver usando créditos extras (fora do limite do plano)
          if ((uc.daily_usage || 0) >= 20 && uc.balance > 0) {
            updates.balance = Math.max(0, uc.balance - 1);
            console.log(`💳 Crédito deduzido (imagem): ${userId} → saldo: ${updates.balance}`);
          }
          await supabase.from('user_credits').update(updates).eq('user_id', userId);
        }

        // Activity log
        await supabase.from('activity_logs').insert({
          user_id: userId,
          action: 'ai_image_generation',
          details: JSON.stringify({ tool: 'image-generator', model: 'dall-e-3', style, size, quality })
        });
      } catch (logErr) {
        console.warn('⚠️ Erro ao logar uso de imagem:', logErr.message);
      }
    }

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
