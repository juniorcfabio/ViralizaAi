// 🧲 MIDDLEWARE PARA CAPTURAR INDICAÇÕES DE AFILIADOS
import { affiliateSystem } from '../lib/affiliateSystem.js';

export function affiliateTrackingMiddleware(req, res, next) {
  try {
    // 🔍 VERIFICAR SE HÁ CÓDIGO DE REFERÊNCIA
    const refCode = req.query.ref || req.cookies.affiliate_ref;
    
    if (refCode) {
      // 📊 REGISTRAR CLICK NO LINK
      affiliateSystem.updateAffiliateStats(refCode, 'click').catch(console.error);
      
      // 🍪 DEFINIR COOKIE DE TRACKING (30 dias)
      if (!req.cookies.affiliate_ref) {
        res.cookie('affiliate_ref', refCode, {
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
          httpOnly: true,
          sameSite: 'lax'
        });
        
        res.cookie('affiliate_click_time', Date.now(), {
          maxAge: 30 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          sameSite: 'lax'
        });
      }
      
      // 📝 ADICIONAR DADOS AO REQUEST
      req.affiliateTracking = {
        refCode,
        clickTime: req.cookies.affiliate_click_time || Date.now(),
        userIP: req.ip || req.connection.remoteAddress
      };
    }
    
    next();
    
  } catch (error) {
    console.error('🚨 Erro no middleware de tracking:', error);
    next(); // Continuar mesmo com erro
  }
}

// 🎯 MIDDLEWARE PARA CAPTURAR INDICAÇÃO NO CADASTRO
export async function captureAffiliateReferral(userId, req) {
  try {
    const refCode = req.affiliateTracking?.refCode || req.cookies.affiliate_ref;
    
    if (refCode && userId) {
      const result = await affiliateSystem.capturarIndicacao(
        refCode, 
        userId, 
        req.affiliateTracking?.userIP
      );
      
      if (result.success) {
        console.log(`✅ Indicação capturada: ${refCode} -> ${userId}`);
        
        // 🧹 LIMPAR COOKIES APÓS CAPTURA
        // res.clearCookie('affiliate_ref');
        // res.clearCookie('affiliate_click_time');
        
        return result;
      }
    }
    
    return { success: false, message: 'Nenhuma referência encontrada' };
    
  } catch (error) {
    console.error('🚨 Erro ao capturar indicação:', error);
    return { success: false, error: error.message };
  }
}

// 💳 MIDDLEWARE PARA PROCESSAR COMISSÃO APÓS PAGAMENTO
export async function processAffiliateCommission(paymentData) {
  try {
    const result = await affiliateSystem.processarComissao(paymentData);
    
    if (result.success) {
      console.log(`💰 Comissão processada: R$${result.commissionValue.toFixed(2)} para ${result.affiliateCode}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('🚨 Erro ao processar comissão:', error);
    return { success: false, error: error.message };
  }
}
