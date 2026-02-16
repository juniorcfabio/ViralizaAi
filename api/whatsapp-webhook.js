// =============================================================
// 📱 WHATSAPP BUSINESS CLOUD API - WEBHOOK + AUTO-REPLY COM IA
// =============================================================
// Recebe mensagens do WhatsApp via Meta Webhook
// Responde automaticamente usando OpenAI GPT-4o
// Salva conversas no Supabase
// =============================================================
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ========== GET: Webhook Verification (Meta requires this) ==========
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'viralizaai_whatsapp_verify_2024';

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ WhatsApp Webhook verificado com sucesso');
      return res.status(200).send(challenge);
    } else {
      console.warn('❌ WhatsApp Webhook verification failed:', { mode, token });
      return res.status(403).json({ error: 'Verification failed' });
    }
  }

  // ========== POST: Receive incoming messages ==========
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Meta sends various webhook events - we only care about messages
      if (!body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        // Not a message event (could be status update, etc.)
        return res.status(200).json({ status: 'ok', type: 'non-message-event' });
      }

      const change = body.entry[0].changes[0].value;
      const message = change.messages[0];
      const contact = change.contacts?.[0];
      const metadata = change.metadata;

      const senderPhone = message.from; // e.g. "5511999999999"
      const senderName = contact?.profile?.name || 'Cliente';
      const messageText = message.text?.body || '';
      const messageType = message.type; // text, image, audio, etc.
      const phoneNumberId = metadata?.phone_number_id;
      const timestamp = message.timestamp;

      console.log(`📱 WhatsApp mensagem de ${senderName} (${senderPhone}): "${messageText}"`);

      // Only process text messages for now
      if (messageType !== 'text' || !messageText) {
        // Send a polite response for non-text messages
        await sendWhatsAppMessage(phoneNumberId, senderPhone,
          '📎 Recebi sua mídia! No momento, consigo responder apenas mensagens de texto. Por favor, envie sua pergunta por escrito. 😊'
        );
        return res.status(200).json({ status: 'ok', type: 'non-text' });
      }

      // 1) Fetch chatbot config for this phone number from Supabase
      let botConfig = null;
      try {
        const { data } = await supabase
          .from('chatbot_configs')
          .select('*')
          .eq('phone_number_id', phoneNumberId)
          .eq('active', true)
          .single();
        botConfig = data;
      } catch (err) {
        console.warn('⚠️ No chatbot config found for phone_number_id:', phoneNumberId);
      }

      // 2) Fetch conversation history (last 10 messages) for context
      let conversationHistory = [];
      try {
        const { data: history } = await supabase
          .from('chatbot_messages')
          .select('role, content')
          .eq('sender_phone', senderPhone)
          .eq('phone_number_id', phoneNumberId)
          .order('created_at', { ascending: false })
          .limit(10);
        if (history) {
          conversationHistory = history.reverse();
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch conversation history:', err.message);
      }

      // 3) Generate AI response using OpenAI
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        console.error('❌ OPENAI_API_KEY not configured');
        return res.status(200).json({ status: 'ok', error: 'no-api-key' });
      }

      const businessName = botConfig?.business_name || 'Nossa empresa';
      const businessType = botConfig?.business_type || 'negócio';
      const botObjective = botConfig?.objective || 'atendimento ao cliente';
      const botTone = botConfig?.tone || 'amigável e profissional';
      const botInstructions = botConfig?.custom_instructions || '';
      const botFaq = botConfig?.faq || '';

      const systemPrompt = `Você é o assistente virtual de atendimento da "${businessName}", um negócio de ${businessType}.

OBJETIVO: ${botObjective}
TOM DE VOZ: ${botTone}

REGRAS IMPORTANTES:
- Responda SEMPRE em português do Brasil
- Seja ${botTone}, conciso e útil
- Máximo de 300 palavras por resposta
- Use emojis com moderação para tornar a conversa amigável
- Se não souber a resposta, diga que vai encaminhar para um atendente humano
- NUNCA invente informações sobre preços, promoções ou produtos que não foram fornecidos
- Se o cliente quiser falar com um humano, diga que está encaminhando

${botInstructions ? `INSTRUÇÕES ADICIONAIS DO PROPRIETÁRIO:\n${botInstructions}\n` : ''}
${botFaq ? `PERGUNTAS FREQUENTES E RESPOSTAS:\n${botFaq}\n` : ''}

NOME DO CLIENTE: ${senderName}`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: messageText }
      ];

      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 500,
          temperature: 0.7
        })
      });

      const aiData = await aiRes.json();
      const aiReply = aiData.choices?.[0]?.message?.content || 'Desculpe, estou com dificuldades técnicas. Por favor, tente novamente em alguns instantes.';

      console.log(`🤖 Resposta IA para ${senderPhone}: "${aiReply.substring(0, 100)}..."`);

      // 4) Send reply via WhatsApp
      await sendWhatsAppMessage(phoneNumberId, senderPhone, aiReply);

      // 5) Save messages to Supabase
      try {
        await supabase.from('chatbot_messages').insert([
          {
            phone_number_id: phoneNumberId,
            sender_phone: senderPhone,
            sender_name: senderName,
            role: 'user',
            content: messageText,
            platform: 'whatsapp',
            created_at: new Date(parseInt(timestamp) * 1000).toISOString()
          },
          {
            phone_number_id: phoneNumberId,
            sender_phone: senderPhone,
            sender_name: 'Bot IA',
            role: 'assistant',
            content: aiReply,
            platform: 'whatsapp',
            created_at: new Date().toISOString()
          }
        ]);
      } catch (dbErr) {
        console.warn('⚠️ Could not save messages to Supabase:', dbErr.message);
      }

      // 6) Log activity
      try {
        await supabase.from('activity_logs').insert({
          user_id: botConfig?.user_id || 'system',
          action: 'whatsapp_chatbot_reply',
          details: JSON.stringify({
            sender: senderPhone,
            sender_name: senderName,
            message_preview: messageText.substring(0, 100),
            reply_preview: aiReply.substring(0, 100),
            tokens_used: aiData.usage?.total_tokens || 0
          })
        });
      } catch (_) {}

      return res.status(200).json({ status: 'ok', replied: true });

    } catch (error) {
      console.error('🚨 WhatsApp Webhook Error:', error.message);
      // Always return 200 to Meta so they don't retry indefinitely
      return res.status(200).json({ status: 'error', message: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ========== Helper: Send WhatsApp Message ==========
async function sendWhatsAppMessage(phoneNumberId, recipientPhone, text) {
  const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!WHATSAPP_TOKEN) {
    console.error('❌ WHATSAPP_ACCESS_TOKEN not configured');
    return { success: false, error: 'Token not configured' };
  }

  if (!phoneNumberId) {
    console.error('❌ phoneNumberId is required');
    return { success: false, error: 'phoneNumberId required' };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipientPhone,
          type: 'text',
          text: { body: text }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ WhatsApp send error:', JSON.stringify(data));
      return { success: false, error: data.error?.message || 'Send failed' };
    }

    console.log(`✅ WhatsApp mensagem enviada para ${recipientPhone}`);
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err) {
    console.error('❌ WhatsApp send exception:', err.message);
    return { success: false, error: err.message };
  }
}
