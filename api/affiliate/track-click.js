// 🔗 API PARA RASTREAR CLIQUES EM LINKS DE AFILIADO
import { affiliateSystem } from '../../lib/affiliateSystem.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // 📝 EXTRAIR DADOS
    const { refCode, userIP, userAgent } = req.body;

    if (!refCode) {
      return res.status(400).json({ error: 'Código de referência obrigatório' });
    }

    // 🔍 VERIFICAR SE CÓDIGO EXISTE
    const affiliate = await affiliateSystem.getAffiliateByCode(refCode);
    if (!affiliate) {
      return res.status(404).json({ error: 'Código de afiliado inválido' });
    }

    // 📊 REGISTRAR CLICK
    await affiliateSystem.updateAffiliateStats(affiliate.id, 'click');

    // 🍪 DEFINIR COOKIE DE TRACKING (30 dias)
    res.setHeader('Set-Cookie', [
      `affiliate_ref=${refCode}; Max-Age=${30 * 24 * 60 * 60}; Path=/; HttpOnly; SameSite=Lax`,
      `affiliate_click_time=${Date.now()}; Max-Age=${30 * 24 * 60 * 60}; Path=/; HttpOnly; SameSite=Lax`
    ]);

    // ✅ RETORNAR SUCESSO
    res.status(200).json({
      success: true,
      message: 'Click registrado com sucesso',
      affiliateCode: refCode,
      trackingExpiration: 30 // dias
    });

  } catch (error) {
    console.error('🚨 Erro no tracking de click:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
