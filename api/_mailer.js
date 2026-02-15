// =======================
// 📧 SISTEMA DE EMAILS AUTOMÁTICOS
// =======================

const nodemailer = require('nodemailer');

// Configurar transporter
const createTransporter = () => {
  // Configuração para diferentes provedores
  const emailConfig = {
    // Gmail/Google Workspace
    gmail: {
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS // App Password
      }
    },
    
    // SendGrid
    sendgrid: {
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    },
    
    // Mailgun
    mailgun: {
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAILGUN_USER,
        pass: process.env.MAILGUN_PASS
      }
    },
    
    // Configuração genérica SMTP
    custom: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  };

  const provider = process.env.EMAIL_PROVIDER || 'custom';
  const config = emailConfig[provider];

  if (!config) {
    throw new Error(`Provedor de email não configurado: ${provider}`);
  }

  return nodemailer.createTransporter(config);
};

// Templates de email
const emailTemplates = {
  // Aviso de vencimento
  expirationWarning: (data) => ({
    subject: `⚠️ Sua assinatura ViralizaAI vence em 3 dias`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🚨 Atenção ${data.name}!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Sua assinatura vence em breve</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Sua assinatura ${data.planName} vence em 3 dias</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Olá <strong>${data.name}</strong>,
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Sua assinatura do <strong>${data.planName}</strong> vence em <strong>${new Date(data.expiresAt).toLocaleDateString('pt-BR')}</strong>.
          </p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #856404; margin: 0 0 10px 0;">⚡ Renove agora e mantenha o acesso:</h3>
            <ul style="color: #856404; margin: 0; padding-left: 20px;">
              <li>Todas as ferramentas de IA</li>
              <li>Automação de redes sociais</li>
              <li>Geração ilimitada de conteúdo</li>
              <li>Suporte prioritário</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/pricing?renewal=true" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 18px;
                      display: inline-block;">
              🔄 Renovar Assinatura
            </a>
          </div>
          
          <p style="font-size: 14px; color: #777; text-align: center;">
            Tem dúvidas? Responda este email ou acesse nosso suporte.
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
          <p style="margin: 0;">ViralizaAI - Transformando seu marketing digital com IA</p>
          <p style="margin: 5px 0 0 0;">© 2024 ViralizaAI. Todos os direitos reservados.</p>
        </div>
      </div>
    `
  }),

  // Lembrete de renovação
  renewalReminder: (data) => ({
    subject: `🔄 Renove sua assinatura ViralizaAI - Link especial`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🔄 Hora de Renovar!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Mantenha seu acesso ativo</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Olá ${data.name}, sua assinatura vence hoje!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Sua assinatura do <strong>${data.planName}</strong> vence hoje. Para manter o acesso a todas as funcionalidades, renove agora com apenas alguns cliques.
          </p>
          
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0c5460; margin: 0 0 10px 0;">🚀 Benefícios que você mantém:</h3>
            <ul style="color: #0c5460; margin: 0; padding-left: 20px;">
              <li><strong>IA Avançada:</strong> Geração de conteúdo ilimitada</li>
              <li><strong>Automação:</strong> Posts automáticos em todas as redes</li>
              <li><strong>Analytics:</strong> Relatórios detalhados de performance</li>
              <li><strong>Suporte VIP:</strong> Atendimento prioritário 24/7</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.renewalUrl}" 
               style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                      color: white; 
                      padding: 18px 40px; 
                      text-decoration: none; 
                      border-radius: 50px; 
                      font-weight: bold; 
                      font-size: 20px;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(240, 147, 251, 0.4);">
              💳 Renovar com PIX
            </a>
          </div>
          
          <div style="background: #fff; border: 2px dashed #f5576c; padding: 20px; border-radius: 8px; text-align: center;">
            <h4 style="color: #f5576c; margin: 0 0 10px 0;">⚡ Renovação Instantânea</h4>
            <p style="margin: 0; color: #666;">
              Pague com PIX e tenha seu acesso renovado automaticamente em segundos!
            </p>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
          <p style="margin: 0;">ViralizaAI - Sua parceira em marketing digital</p>
          <p style="margin: 5px 0 0 0;">Dúvidas? Responda este email ou acesse nosso suporte.</p>
        </div>
      </div>
    `
  }),

  // Confirmação de pagamento
  paymentConfirmation: (data) => ({
    subject: `✅ Pagamento confirmado - Bem-vindo ao ${data.planName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Pagamento Confirmado!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Sua assinatura está ativa</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Olá ${data.name}, bem-vindo(a)!</h2>
          
          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #155724; margin: 0 0 15px 0;">✅ Detalhes da sua assinatura:</h3>
            <ul style="color: #155724; margin: 0; padding-left: 20px; list-style: none;">
              <li style="margin-bottom: 8px;"><strong>📦 Plano:</strong> ${data.planName}</li>
              <li style="margin-bottom: 8px;"><strong>💰 Valor:</strong> R$ ${data.amount.toFixed(2)}</li>
              <li style="margin-bottom: 8px;"><strong>📅 Ativo até:</strong> ${new Date(data.expiresAt).toLocaleDateString('pt-BR')}</li>
              <li style="margin-bottom: 8px;"><strong>🔄 Renovação:</strong> Automática via PIX</li>
            </ul>
          </div>
          
          <h3 style="color: #333;">🚀 Próximos passos:</h3>
          <ol style="color: #555; line-height: 1.8;">
            <li><strong>Acesse sua conta:</strong> Faça login em ${process.env.FRONTEND_URL}</li>
            <li><strong>Explore as ferramentas:</strong> Todas as funcionalidades estão liberadas</li>
            <li><strong>Configure automações:</strong> Conecte suas redes sociais</li>
            <li><strong>Gere conteúdo:</strong> Use nossa IA para criar posts virais</li>
          </ol>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 18px;
                      display: inline-block;">
              🎯 Acessar Dashboard
            </a>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 14px;">
          <p style="margin: 0;">Obrigado por escolher a ViralizaAI!</p>
          <p style="margin: 5px 0 0 0;">Suporte: suporte@viralizaai.com</p>
        </div>
      </div>
    `
  })
};

// Função principal para enviar emails
const sendEmail = async (to, template, data) => {
  try {
    const transporter = createTransporter();
    const emailContent = emailTemplates[template](data);
    
    const mailOptions = {
      from: `"ViralizaAI" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('📧 Email enviado com sucesso:', {
      to: to,
      template: template,
      messageId: result.messageId
    });
    
    return {
      success: true,
      messageId: result.messageId
    };
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
};

// Funções específicas para cada tipo de email
const sendExpirationWarning = async (data) => {
  return await sendEmail(data.email, 'expirationWarning', data);
};

const sendRenewalReminder = async (data) => {
  return await sendEmail(data.email, 'renewalReminder', data);
};

const sendPaymentConfirmation = async (data) => {
  return await sendEmail(data.email, 'paymentConfirmation', data);
};

// Testar configuração de email
const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    console.log('✅ Configuração de email válida');
    return true;
  } catch (error) {
    console.error('❌ Configuração de email inválida:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendExpirationWarning,
  sendRenewalReminder,
  sendPaymentConfirmation,
  testEmailConfiguration
};
