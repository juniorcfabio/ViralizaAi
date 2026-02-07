// =======================
// 💳 SERVIÇO DE BILLING - MICROSERVIÇO
// =======================

import express from 'express';
import Stripe from 'stripe';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import DatabaseService from '../database/DatabaseService';

interface BillingRequest extends express.Request {
  user?: any;
}

class BillingService {
  private app: express.Application;
  private stripe: Stripe;
  private db: DatabaseService;
  private webhookSecret: string;

  constructor() {
    this.app = express();
    this.db = DatabaseService.getInstance();
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
      typescript: true,
    });

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Segurança
    this.app.use(helmet());

    // Rate limiting para billing
    const billingLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 20, // máximo 20 requests por IP
      message: {
        error: 'Muitas requisições de billing. Tente novamente em 15 minutos.',
        code: 'BILLING_RATE_LIMIT_EXCEEDED'
      }
    });

    this.app.use('/checkout', billingLimiter);
    this.app.use('/subscription', billingLimiter);

    // Middleware específico para webhooks (raw body)
    this.app.use('/webhook', express.raw({ type: 'application/json' }));
    
    // JSON para outras rotas
    this.app.use(express.json({ limit: '10mb' }));
  }

  private setupRoutes(): void {
    // =======================
    // 💳 CRIAR CHECKOUT SESSION
    // =======================
    this.app.post('/checkout/create', async (req: BillingRequest, res) => {
      try {
        const {
          userId,
          plan,
          billingCycle,
          successUrl,
          cancelUrl,
          customerEmail
        } = req.body;

        // Validar dados
        if (!userId || !plan || !successUrl || !cancelUrl) {
          return res.status(400).json({
            success: false,
            error: 'Dados obrigatórios não fornecidos'
          });
        }

        // Mapear planos para preços
        const planPrices = {
          mensal: { amount: 5990, interval: 'month' }, // R$ 59,90
          trimestral: { amount: 15990, interval: 'month', interval_count: 3 }, // R$ 159,90
          semestral: { amount: 25990, interval: 'month', interval_count: 6 }, // R$ 259,90
          anual: { amount: 39990, interval: 'year' } // R$ 399,90
        };

        const priceData = planPrices[plan];
        if (!priceData) {
          return res.status(400).json({
            success: false,
            error: 'Plano inválido'
          });
        }

        // Buscar ou criar customer no Stripe
        let customer;
        const user = await this.db.getUserById(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'Usuário não encontrado'
          });
        }

        // Verificar se já existe customer
        const existingCustomers = await this.stripe.customers.list({
          email: user.email,
          limit: 1
        });

        if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
        } else {
          customer = await this.stripe.customers.create({
            email: user.email,
            name: user.name,
            metadata: {
              userId: userId,
              plan: plan
            }
          });
        }

        // Criar sessão de checkout
        const session = await this.stripe.checkout.sessions.create({
          customer: customer.id,
          payment_method_types: ['card', 'pix'],
          line_items: [{
            price_data: {
              currency: 'brl',
              product_data: {
                name: `ViralizaAI - Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
                description: `Acesso completo às ferramentas de marketing viral`,
                images: ['https://viralizaai.vercel.app/logo.png']
              },
              unit_amount: priceData.amount,
              recurring: {
                interval: priceData.interval,
                interval_count: priceData.interval_count || 1
              }
            },
            quantity: 1
          }],
          mode: 'subscription',
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            userId: userId,
            plan: plan,
            billingCycle: billingCycle || plan
          },
          subscription_data: {
            metadata: {
              userId: userId,
              plan: plan
            }
          },
          allow_promotion_codes: true,
          billing_address_collection: 'required',
          tax_id_collection: {
            enabled: true
          }
        });

        // Log da criação
        await this.db.createAuditLog({
          user_id: userId,
          action: 'checkout_session_created',
          resource_type: 'stripe_session',
          resource_id: session.id,
          success: true,
          severity: 'info',
          request_data: { plan, billingCycle }
        });

        res.json({
          success: true,
          data: {
            sessionId: session.id,
            url: session.url,
            customerId: customer.id
          }
        });

      } catch (error: any) {
        console.error('❌ Erro ao criar checkout:', error);
        
        await this.db.createAuditLog({
          action: 'checkout_creation_error',
          success: false,
          error_message: error.message,
          severity: 'error'
        });

        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });

    // =======================
    // 🔄 GERENCIAR ASSINATURA
    // =======================
    this.app.post('/subscription/manage', async (req: BillingRequest, res) => {
      try {
        const { userId, action } = req.body; // action: 'cancel', 'pause', 'resume'

        const user = await this.db.getUserById(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'Usuário não encontrado'
          });
        }

        // Buscar assinatura ativa
        const subscriptions = await this.stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'active',
          limit: 1
        });

        if (subscriptions.data.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Assinatura ativa não encontrada'
          });
        }

        const subscription = subscriptions.data[0];
        let updatedSubscription;

        switch (action) {
          case 'cancel':
            updatedSubscription = await this.stripe.subscriptions.update(subscription.id, {
              cancel_at_period_end: true
            });
            break;
          
          case 'pause':
            updatedSubscription = await this.stripe.subscriptions.update(subscription.id, {
              pause_collection: {
                behavior: 'keep_as_draft'
              }
            });
            break;
          
          case 'resume':
            updatedSubscription = await this.stripe.subscriptions.update(subscription.id, {
              pause_collection: null
            });
            break;
          
          default:
            return res.status(400).json({
              success: false,
              error: 'Ação inválida'
            });
        }

        // Atualizar no banco
        await this.db.updateSubscriptionStatus(subscription.id, updatedSubscription.status);

        // Log da ação
        await this.db.createAuditLog({
          user_id: userId,
          action: `subscription_${action}`,
          resource_type: 'stripe_subscription',
          resource_id: subscription.id,
          success: true,
          severity: 'info'
        });

        res.json({
          success: true,
          data: {
            subscriptionId: updatedSubscription.id,
            status: updatedSubscription.status,
            cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end
          }
        });

      } catch (error: any) {
        console.error('❌ Erro ao gerenciar assinatura:', error);
        
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });

    // =======================
    // 📊 PORTAL DO CLIENTE
    // =======================
    this.app.post('/portal/create', async (req: BillingRequest, res) => {
      try {
        const { userId, returnUrl } = req.body;

        const user = await this.db.getUserById(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'Usuário não encontrado'
          });
        }

        if (!user.stripe_customer_id) {
          return res.status(400).json({
            success: false,
            error: 'Cliente não possui assinatura'
          });
        }

        const session = await this.stripe.billingPortal.sessions.create({
          customer: user.stripe_customer_id,
          return_url: returnUrl || 'https://viralizaai.vercel.app/dashboard'
        });

        res.json({
          success: true,
          data: {
            url: session.url
          }
        });

      } catch (error: any) {
        console.error('❌ Erro ao criar portal:', error);
        
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });

    // =======================
    // 🎣 WEBHOOK DO STRIPE
    // =======================
    this.app.post('/webhook', async (req, res) => {
      const sig = req.headers['stripe-signature'] as string;
      let event: Stripe.Event;

      try {
        event = this.stripe.webhooks.constructEvent(req.body, sig, this.webhookSecret);
      } catch (err: any) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      try {
        await this.handleWebhookEvent(event);
        res.json({ received: true });
      } catch (error: any) {
        console.error('❌ Erro ao processar webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
      }
    });

    // =======================
    // 📊 HEALTH CHECK
    // =======================
    this.app.get('/health', async (req, res) => {
      try {
        const dbHealth = await this.db.healthCheck();
        
        res.json({
          success: true,
          service: 'billing-service',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: dbHealth ? 'connected' : 'disconnected',
          stripe: 'connected'
        });
      } catch (error) {
        res.status(503).json({
          success: false,
          service: 'billing-service',
          status: 'unhealthy'
        });
      }
    });
  }

  // =======================
  // 🎣 PROCESSAR EVENTOS WEBHOOK
  // =======================
  private async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    console.log(`🎣 Processando webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.trial_will_end':
        await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`🔔 Evento não tratado: ${event.type}`);
    }

    // Log do evento
    await this.db.createAuditLog({
      action: `webhook_${event.type}`,
      resource_type: 'stripe_webhook',
      resource_id: event.id,
      success: true,
      severity: 'info',
      request_data: { type: event.type, object: event.data.object.id }
    });
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;

    if (!userId || !plan) {
      console.error('❌ Metadata inválida no checkout:', session.metadata);
      return;
    }

    // Atualizar plano do usuário
    await this.db.updateUser(userId, { plan });

    // Criar/atualizar assinatura
    if (session.subscription) {
      const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string);
      
      await this.db.createSubscription({
        user_id: userId,
        stripe_customer_id: session.customer,
        stripe_subscription_id: subscription.id,
        plan,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        amount: subscription.items.data[0].price.unit_amount! / 100,
        currency: subscription.items.data[0].price.currency,
        metadata: session.metadata
      });
    }

    console.log(`✅ Checkout concluído para usuário ${userId}, plano ${plan}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;
    
    if (!userId) {
      console.error('❌ Metadata inválida na assinatura:', subscription.metadata);
      return;
    }

    // Atualizar status da assinatura
    await this.db.updateSubscriptionStatus(subscription.id, subscription.status);

    // Se cancelada, downgrade para plano gratuito
    if (subscription.status === 'canceled') {
      await this.db.updateUser(userId, { plan: 'mensal' });
    }

    console.log(`🔄 Assinatura ${subscription.id} atualizada: ${subscription.status}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;
    
    if (!userId) return;

    // Downgrade para plano gratuito
    await this.db.updateUser(userId, { plan: 'mensal' });
    await this.db.updateSubscriptionStatus(subscription.id, 'canceled');

    console.log(`❌ Assinatura ${subscription.id} cancelada para usuário ${userId}`);
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log(`💰 Pagamento bem-sucedido: ${invoice.id}`);
    
    // Aqui você pode implementar lógica adicional como:
    // - Enviar email de confirmação
    // - Atualizar métricas de receita
    // - Ativar recursos premium
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log(`💸 Pagamento falhou: ${invoice.id}`);
    
    if (invoice.subscription) {
      const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription as string);
      const userId = subscription.metadata?.userId;
      
      if (userId) {
        await this.db.updateSubscriptionStatus(subscription.id, 'past_due');
        
        // Enviar notificação de pagamento falhado
        // Implementar retry logic se necessário
      }
    }
  }

  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;
    
    if (userId) {
      // Enviar notificação de fim de trial
      console.log(`⏰ Trial terminando para usuário ${userId}`);
    }
  }

  // =======================
  // 🚀 INICIAR SERVIÇO
  // =======================
  public start(port: number = 3002): void {
    this.app.listen(port, () => {
      console.log(`💳 Billing Service rodando na porta ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`🎣 Webhook URL: http://localhost:${port}/webhook`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default BillingService;
