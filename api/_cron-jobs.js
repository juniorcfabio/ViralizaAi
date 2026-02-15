// =======================
// ⏰ CRON JOBS - SISTEMA DE RECORRÊNCIA
// =======================

const cron = require('node-cron');
const db = require('./db');
const { sendExpirationWarning, sendRenewalReminder } = require('./mailer');

// Inicializar CRON jobs
const initializeCronJobs = () => {
  console.log('⏰ Inicializando CRON jobs...');

  // 1. Verificar assinaturas expiradas (todo dia às 03:00)
  cron.schedule('0 3 * * *', async () => {
    console.log('🔄 Executando verificação de assinaturas expiradas...');
    
    try {
      const expiredCount = await db.subscriptions.expireSubscriptions();
      
      console.log(`📊 Assinaturas expiradas: ${expiredCount}`);
      
      // Log de auditoria
      await db.audit.log({
        action: 'cron_expire_subscriptions',
        entity_type: 'system',
        details: {
          expired_count: expiredCount,
          executed_at: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ Erro no CRON de expiração:', error);
      
      await db.audit.log({
        action: 'cron_expire_subscriptions_error',
        entity_type: 'system',
        details: {
          error: error.message,
          stack: error.stack
        }
      });
    }
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });

  // 2. Avisos de vencimento (todo dia às 09:00)
  cron.schedule('0 9 * * *', async () => {
    console.log('📧 Enviando avisos de vencimento...');
    
    try {
      // Buscar assinaturas que vencem em 3 dias
      const expiringSoon = await db.subscriptions.findExpiringSoon(3);
      
      let emailsSent = 0;
      
      for (const subscription of expiringSoon) {
        try {
          await sendExpirationWarning({
            email: subscription.email,
            name: subscription.name,
            planName: subscription.plan_name,
            expiresAt: subscription.expires_at
          });
          
          // Criar notificação no banco
          await db.query(
            `INSERT INTO notifications (user_id, type, title, message, email_sent, email_sent_at)
             VALUES ($1, $2, $3, $4, true, NOW())`,
            [
              subscription.user_id,
              'expiration_warning',
              'Sua assinatura vence em 3 dias',
              `Sua assinatura do ${subscription.plan_name} vence em ${new Date(subscription.expires_at).toLocaleDateString('pt-BR')}. Renove agora!`
            ]
          );
          
          emailsSent++;
          
        } catch (emailError) {
          console.error(`❌ Erro ao enviar email para ${subscription.email}:`, emailError);
        }
      }
      
      console.log(`📧 Emails de aviso enviados: ${emailsSent}`);
      
      // Log de auditoria
      await db.audit.log({
        action: 'cron_expiration_warnings',
        entity_type: 'system',
        details: {
          subscriptions_found: expiringSoon.length,
          emails_sent: emailsSent
        }
      });
      
    } catch (error) {
      console.error('❌ Erro no CRON de avisos:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });

  // 3. Lembretes de renovação (todo dia às 10:00)
  cron.schedule('0 10 * * *', async () => {
    console.log('🔄 Enviando lembretes de renovação...');
    
    try {
      // Buscar assinaturas que vencem hoje
      const expiringToday = await db.subscriptions.findExpiringSoon(0);
      
      let renewalsSent = 0;
      
      for (const subscription of expiringToday) {
        try {
          // Gerar novo link de pagamento
          const renewalUrl = await generateRenewalPaymentLink(subscription);
          
          await sendRenewalReminder({
            email: subscription.email,
            name: subscription.name,
            planName: subscription.plan_name,
            renewalUrl: renewalUrl
          });
          
          renewalsSent++;
          
        } catch (renewalError) {
          console.error(`❌ Erro ao enviar renovação para ${subscription.email}:`, renewalError);
        }
      }
      
      console.log(`🔄 Lembretes de renovação enviados: ${renewalsSent}`);
      
    } catch (error) {
      console.error('❌ Erro no CRON de renovação:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });

  // 4. Limpeza de dados antigos (toda segunda às 02:00)
  cron.schedule('0 2 * * 1', async () => {
    console.log('🧹 Executando limpeza de dados antigos...');
    
    try {
      // Limpar logs de auditoria > 90 dias
      const auditResult = await db.query(
        `DELETE FROM audit_logs 
         WHERE created_at < NOW() - INTERVAL '90 days'`
      );
      
      // Limpar notificações lidas > 30 dias
      const notificationResult = await db.query(
        `DELETE FROM notifications 
         WHERE read_at IS NOT NULL 
         AND read_at < NOW() - INTERVAL '30 days'`
      );
      
      console.log(`🧹 Limpeza concluída:`, {
        audit_logs_removed: auditResult.rowCount,
        notifications_removed: notificationResult.rowCount
      });
      
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });

  // 5. Relatório diário (todo dia às 08:00)
  cron.schedule('0 8 * * *', async () => {
    console.log('📊 Gerando relatório diário...');
    
    try {
      const stats = await generateDailyStats();
      
      console.log('📊 Estatísticas do dia:', stats);
      
      // Salvar métricas no banco
      await db.query(
        `INSERT INTO system_config (key, value, description, updated_at)
         VALUES ('daily_stats', $1, 'Estatísticas diárias do sistema', NOW())
         ON CONFLICT (key) DO UPDATE SET 
         value = $1, updated_at = NOW()`,
        [JSON.stringify(stats)]
      );
      
    } catch (error) {
      console.error('❌ Erro no relatório diário:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });

  console.log('✅ CRON jobs inicializados com sucesso');
};

// Gerar link de renovação
const generateRenewalPaymentLink = async (subscription) => {
  try {
    // Aqui você integraria com o Stripe para criar nova sessão
    // Por enquanto, retornar URL da página de preços
    return `${process.env.FRONTEND_URL}/pricing?renewal=${subscription.id}&plan=${subscription.plan_type}`;
  } catch (error) {
    console.error('❌ Erro ao gerar link de renovação:', error);
    return `${process.env.FRONTEND_URL}/pricing`;
  }
};

// Gerar estatísticas diárias
const generateDailyStats = async () => {
  try {
    const [
      totalUsers,
      activeSubscriptions,
      todayRevenue,
      todaySignups
    ] = await Promise.all([
      // Total de usuários
      db.query('SELECT COUNT(*) as count FROM users WHERE is_active = true'),
      
      // Assinaturas ativas
      db.query('SELECT COUNT(*) as count FROM subscriptions WHERE status = \'active\''),
      
      // Receita de hoje
      db.query(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM payments 
        WHERE status = 'paid' 
        AND created_at >= CURRENT_DATE
      `),
      
      // Cadastros de hoje
      db.query(`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE created_at >= CURRENT_DATE
      `)
    ]);

    return {
      date: new Date().toISOString().split('T')[0],
      total_users: parseInt(totalUsers.rows[0].count),
      active_subscriptions: parseInt(activeSubscriptions.rows[0].count),
      today_revenue: parseFloat(todayRevenue.rows[0].total) / 100, // converter de centavos
      today_signups: parseInt(todaySignups.rows[0].count)
    };
    
  } catch (error) {
    console.error('❌ Erro ao gerar estatísticas:', error);
    return {
      date: new Date().toISOString().split('T')[0],
      error: error.message
    };
  }
};

// Parar todos os CRON jobs
const stopCronJobs = () => {
  console.log('⏰ Parando CRON jobs...');
  cron.getTasks().forEach(task => {
    task.stop();
  });
  console.log('✅ CRON jobs parados');
};

// Listar CRON jobs ativos
const listActiveCronJobs = () => {
  const tasks = cron.getTasks();
  console.log(`📋 CRON jobs ativos: ${tasks.size}`);
  
  tasks.forEach((task, index) => {
    console.log(`  ${index + 1}. Status: ${task.getStatus()}`);
  });
  
  return tasks.size;
};

module.exports = {
  initializeCronJobs,
  stopCronJobs,
  listActiveCronJobs,
  generateDailyStats
};
