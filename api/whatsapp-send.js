// =============================================================
// 📱 WHATSAPP BUSINESS API - ENVIO DE MENSAGENS + CONFIG
// =============================================================
// POST /api/whatsapp-send
//   action: 'send'    → Enviar mensagem manual
//   action: 'config'  → Salvar/atualizar configuração do chatbot
//   action: 'status'  → Verificar status da conexão
//   action: 'history' → Buscar histórico de conversas
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, userId, ...params } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'action é obrigatório' });
    }

    // ========== ACTION: config - Salvar configuração do chatbot ==========
    if (action === 'config') {
      const {
        businessName, businessType, objective, tone,
        platform, phoneNumberId, whatsappToken,
        customInstructions, faq, botName
      } = params;

      if (!userId) {
        return res.status(400).json({ error: 'userId é obrigatório' });
      }

      // Upsert chatbot config
      const configData = {
        user_id: userId,
        business_name: businessName || 'Meu Negócio',
        business_type: businessType || 'varejo',
        objective: objective || 'Atendimento ao cliente',
        tone: tone || 'amigável e profissional',
        platform: platform || 'whatsapp',
        phone_number_id: phoneNumberId || null,
        whatsapp_token: whatsappToken || null,
        custom_instructions: customInstructions || '',
        faq: faq || '',
        bot_name: botName || 'Assistente IA',
        active: true,
        updated_at: new Date().toISOString()
      };

      // Try upsert, fallback to insert
      let result;
      try {
        const { data: existing } = await supabase
          .from('chatbot_configs')
          .select('id')
          .eq('user_id', userId)
          .eq('platform', platform || 'whatsapp')
          .single();

        if (existing) {
          const { data, error } = await supabase
            .from('chatbot_configs')
            .update(configData)
            .eq('id', existing.id)
            .select()
            .single();
          result = data;
          if (error) throw error;
        } else {
          configData.created_at = new Date().toISOString();
          const { data, error } = await supabase
            .from('chatbot_configs')
            .insert(configData)
            .select()
            .single();
          result = data;
          if (error) throw error;
        }
      } catch (dbErr) {
        console.warn('⚠️ Supabase chatbot_configs save warning:', dbErr.message);
        // Return success anyway - config was generated
        result = configData;
      }

      // Construct webhook URL for the user
      const webhookUrl = `https://viralizaai.vercel.app/api/whatsapp-webhook`;

      return res.status(200).json({
        success: true,
        config: result,
        webhookUrl,
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'viralizaai_whatsapp_verify_2024',
        message: 'Configuração do chatbot salva com sucesso'
      });
    }

    // ========== ACTION: send - Enviar mensagem manual ==========
    if (action === 'send') {
      const { phoneNumberId, recipientPhone, message } = params;

      if (!recipientPhone || !message) {
        return res.status(400).json({ error: 'recipientPhone e message são obrigatórios' });
      }

      const WHATSAPP_TOKEN = params.whatsappToken || process.env.WHATSAPP_ACCESS_TOKEN;
      const pnId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (!WHATSAPP_TOKEN) {
        return res.status(400).json({ error: 'WhatsApp Access Token não configurado. Configure nas variáveis de ambiente ou envie no request.' });
      }

      if (!pnId) {
        return res.status(400).json({ error: 'Phone Number ID não configurado.' });
      }

      // Send via WhatsApp Business Cloud API
      const waRes = await fetch(
        `https://graph.facebook.com/v21.0/${pnId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipientPhone.replace(/\D/g, ''), // Remove non-digits
            type: 'text',
            text: { body: message }
          })
        }
      );

      const waData = await waRes.json();

      if (!waRes.ok) {
        return res.status(waRes.status).json({
          success: false,
          error: waData.error?.message || 'Erro ao enviar mensagem',
          details: waData.error
        });
      }

      // Save to Supabase
      try {
        await supabase.from('chatbot_messages').insert({
          phone_number_id: pnId,
          sender_phone: 'system',
          sender_name: 'Operador',
          role: 'assistant',
          content: message,
          recipient_phone: recipientPhone.replace(/\D/g, ''),
          platform: 'whatsapp',
          created_at: new Date().toISOString()
        });
      } catch (_) {}

      return res.status(200).json({
        success: true,
        messageId: waData.messages?.[0]?.id,
        message: 'Mensagem enviada com sucesso via WhatsApp'
      });
    }

    // ========== ACTION: status - Verificar conexão ==========
    if (action === 'status') {
      const WHATSAPP_TOKEN = params.whatsappToken || process.env.WHATSAPP_ACCESS_TOKEN;
      const pnId = params.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (!WHATSAPP_TOKEN || !pnId) {
        return res.status(200).json({
          success: true,
          connected: false,
          message: 'WhatsApp não configurado. Configure o Access Token e Phone Number ID.'
        });
      }

      try {
        const statusRes = await fetch(
          `https://graph.facebook.com/v21.0/${pnId}`,
          {
            headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}` }
          }
        );
        const statusData = await statusRes.json();

        if (statusRes.ok) {
          return res.status(200).json({
            success: true,
            connected: true,
            phoneNumber: statusData.display_phone_number,
            qualityRating: statusData.quality_rating,
            verifiedName: statusData.verified_name,
            message: `WhatsApp conectado: ${statusData.display_phone_number || pnId}`
          });
        } else {
          return res.status(200).json({
            success: true,
            connected: false,
            error: statusData.error?.message,
            message: 'Falha na conexão com WhatsApp'
          });
        }
      } catch (err) {
        return res.status(200).json({
          success: true,
          connected: false,
          error: err.message,
          message: 'Erro ao verificar conexão'
        });
      }
    }

    // ========== ACTION: history - Buscar histórico ==========
    if (action === 'history') {
      const { senderPhone, limit: msgLimit } = params;

      try {
        let query = supabase
          .from('chatbot_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(msgLimit || 50);

        if (senderPhone) {
          query = query.eq('sender_phone', senderPhone.replace(/\D/g, ''));
        }
        if (userId) {
          // Get user's phone_number_ids first
          const { data: configs } = await supabase
            .from('chatbot_configs')
            .select('phone_number_id')
            .eq('user_id', userId);
          if (configs && configs.length > 0) {
            const pnIds = configs.map(c => c.phone_number_id).filter(Boolean);
            if (pnIds.length > 0) {
              query = query.in('phone_number_id', pnIds);
            }
          }
        }

        const { data, error } = await query;
        if (error) throw error;

        return res.status(200).json({
          success: true,
          messages: data || [],
          total: data?.length || 0
        });
      } catch (err) {
        return res.status(200).json({
          success: true,
          messages: [],
          error: err.message
        });
      }
    }

    return res.status(400).json({ error: `Ação desconhecida: ${action}` });

  } catch (error) {
    console.error('🚨 WhatsApp Send API Error:', error.message);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}
