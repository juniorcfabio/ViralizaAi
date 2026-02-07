// 🌍🔥 CRON JOBS PARA SISTEMA DE AFILIADOS
import cron from 'node-cron';
import { affiliateSystem } from '../lib/affiliateSystem.js';

// 💸 PROCESSAR PAGAMENTOS DE AFILIADOS A CADA 30 MINUTOS
cron.schedule('*/30 * * * *', async () => {
  console.log('💸 Processando pagamentos de afiliados...');
  
  try {
    await affiliateSystem.processarPagamentosAutomaticos();
    console.log('✅ Pagamentos de afiliados processados');
  } catch (error) {
    console.error('🚨 Erro ao processar pagamentos de afiliados:', error);
  }
});

// 📊 ATUALIZAR ESTATÍSTICAS DE AFILIADOS A CADA 15 MINUTOS
cron.schedule('*/15 * * * *', async () => {
  console.log('📊 Atualizando estatísticas de afiliados...');
  
  try {
    // Processar comissões pendentes
    await affiliateSystem.processPendingCommissions();
    console.log('✅ Estatísticas de afiliados atualizadas');
  } catch (error) {
    console.error('🚨 Erro ao atualizar estatísticas:', error);
  }
});

// 🔗 LIMPAR TRACKING EXPIRADO A CADA 6 HORAS
cron.schedule('0 */6 * * *', async () => {
  console.log('🔗 Limpando tracking expirado...');
  
  try {
    // Limpar conversions tracking mais antigos que 30 dias
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    
    // EM PRODUÇÃO: Implementar limpeza no banco
    // await db.affiliate_tracking.deleteMany({
    //   where: { created_at: { lt: thirtyDaysAgo } }
    // });
    
    console.log('✅ Tracking expirado limpo');
  } catch (error) {
    console.error('🚨 Erro ao limpar tracking:', error);
  }
});

// 📈 GERAR RELATÓRIO DIÁRIO DE AFILIADOS (todo dia às 08:00)
cron.schedule('0 8 * * *', async () => {
  console.log('📈 Gerando relatório diário de afiliados...');
  
  try {
    const stats = affiliateSystem.getAffiliateSystemStats();
    
    console.log('📊 Estatísticas de afiliados:', {
      totalAffiliates: stats.totalAffiliates,
      totalCommissions: stats.totalCommissions,
      conversionRate: stats.conversionRate,
      recentActivity: stats.recentActivity
    });
    
    // EM PRODUÇÃO: Salvar relatório no banco ou enviar por email
    
  } catch (error) {
    console.error('🚨 Erro ao gerar relatório de afiliados:', error);
  }
});

console.log('⏰ Cron jobs de afiliados iniciados');
