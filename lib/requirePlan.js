// 🔒 MIDDLEWARE DE PROTEÇÃO TOTAL - MODELO SAAS PROFISSIONAL
// Frontend nunca decide acesso - Backend valida plano via SUPABASE/POSTGRESQL
// ZERO DADOS SIMULADOS - TUDO REAL

import { createClient } from "@supabase/supabase-js";
import { getPlanRules } from "./planRules.js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ymmswnmietxoupeazmok.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function requireActivePlan(req, res, next) {
  try {
    const userId = req.headers["x-user-id"];

    console.log("🔍 Verificando acesso para usuário:", userId);

    if (!userId) {
      console.log("❌ Usuário não identificado");
      return res.status(401).json({ 
        error: "Não autorizado",
        code: "NO_USER_ID"
      });
    }

    // 🔥 BUSCAR USUÁRIO NO SUPABASE (REAL)
    const user = await getUserFromDB(userId);

    if (!user) {
      console.log("❌ Usuário não encontrado no Supabase:", userId);
      return res.status(401).json({ 
        error: "Usuário inválido",
        code: "USER_NOT_FOUND"
      });
    }

    console.log("👤 Usuário encontrado no Supabase:", {
      userId: user.userId,
      plan: user.plan,
      status: user.planStatus,
      expires: user.planExpiresAt,
      dailyUsage: user.dailyUsage || 0
    });

    // 🛡️ VERIFICAR STATUS DO PLANO
    if (user.planStatus !== "active") {
      console.log("❌ Plano inativo:", user.planStatus);
      return res.status(403).json({ 
        error: "Plano inativo",
        code: "PLAN_INACTIVE",
        planStatus: user.planStatus
      });
    }

    // ⏰ VERIFICAR EXPIRAÇÃO
    const now = new Date();
    const expiresAt = new Date(user.planExpiresAt);
    
    if (expiresAt < now) {
      console.log("❌ Plano expirado:", {
        expiresAt: user.planExpiresAt,
        now: now.toISOString()
      });
      
      // 🔒 MARCAR COMO EXPIRADO NO SUPABASE
      await updateUserPlanStatus(userId, "expired");
      
      return res.status(403).json({ 
        error: "Plano expirado",
        code: "PLAN_EXPIRED",
        expiresAt: user.planExpiresAt
      });
    }

    // 📊 VERIFICAR LIMITES DO PLANO
    let planRules;
    try {
      planRules = getPlanRules(user.plan);
    } catch {
      planRules = { toolsPerDay: 20 };
    }
    const dailyUsage = user.dailyUsage || 0;

    console.log("📋 Regras do plano:", {
      plan: user.plan,
      toolsPerDay: planRules.toolsPerDay,
      currentUsage: dailyUsage
    });

    // 🚫 VERIFICAR LIMITE DIÁRIO
    if (planRules.toolsPerDay !== Infinity && dailyUsage >= planRules.toolsPerDay) {
      console.log("❌ Limite diário atingido:", {
        limit: planRules.toolsPerDay,
        usage: dailyUsage
      });
      
      return res.status(403).json({ 
        error: "Limite diário de ferramentas atingido",
        code: "DAILY_LIMIT_EXCEEDED",
        limit: planRules.toolsPerDay,
        usage: dailyUsage,
        resetTime: getNextResetTime()
      });
    }

    console.log("✅ Acesso liberado para:", userId);

    // 🔓 USUÁRIO VÁLIDO - ADICIONAR AO REQUEST
    req.user = user;
    
    if (next) {
      next();
    } else {
      return { success: true, user };
    }

  } catch (error) {
    console.error("🚨 Erro no middleware de proteção:", error);
    return res.status(500).json({ 
      error: "Erro interno do servidor",
      code: "INTERNAL_ERROR"
    });
  }
}

// 🗄️ BUSCAR USUÁRIO NO SUPABASE/POSTGRESQL (REAL)
async function getUserFromDB(userId) {
  console.log("🔍 Buscando usuário no Supabase:", userId);
  
  try {
    // 1. Buscar subscription ativa
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.warn("⚠️ Erro ao buscar subscription:", subError.message);
    }

    // 2. Buscar créditos/uso diário
    const { data: credits } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // 3. Verificar reset diário
    let dailyUsage = credits?.daily_usage || 0;
    if (credits?.last_daily_reset) {
      const lastReset = new Date(credits.last_daily_reset);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (lastReset < today) {
        // Reset automático
        dailyUsage = 0;
        await supabase
          .from('user_credits')
          .update({ daily_usage: 0, last_daily_reset: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      }
    }

    if (subscription) {
      console.log("✅ Subscription ativa encontrada no Supabase");
      return {
        userId: userId,
        plan: subscription.plan_type,
        planStatus: subscription.status,
        planExpiresAt: subscription.end_date,
        lastPaymentId: subscription.payment_id,
        activatedAt: subscription.start_date,
        subscriptionId: subscription.stripe_subscription_id,
        customerId: subscription.stripe_customer_id,
        dailyUsage: dailyUsage,
        dailyLimit: credits?.daily_limit || 20,
        monthlyUsage: {
          aiGenerations: credits?.monthly_ai_generations || 0,
          videos: credits?.monthly_videos || 0,
          ebooks: credits?.monthly_ebooks || 0
        }
      };
    }

    // 4. Se não tem subscription ativa, verificar se tem compras avulsas
    const { data: purchases } = await supabase
      .from('purchases')
      .select('tool_name')
      .eq('user_id', userId)
      .eq('status', 'paid');

    if (purchases && purchases.length > 0) {
      console.log("✅ Compras avulsas encontradas no Supabase:", purchases.length);
      return {
        userId: userId,
        plan: 'individual',
        planStatus: 'active',
        planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        dailyUsage: dailyUsage,
        dailyLimit: credits?.daily_limit || 20,
        purchasedTools: purchases.map(p => p.tool_name)
      };
    }

    console.log("❌ Nenhuma subscription ou compra encontrada no Supabase");
    return null;

  } catch (error) {
    console.error("🚨 Erro ao buscar usuário no Supabase:", error);
    return null;
  }
}

// ⏰ FUNÇÃO PARA CALCULAR PRÓXIMO RESET
function getNextResetTime() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

// 📈 INCREMENTAR USO NO SUPABASE (REAL)
export async function incrementUsage(userId, usageType = 'daily_usage', toolData = {}) {
  console.log(`📈 Incrementando uso no Supabase: ${userId} -> ${usageType}`);
  
  try {
    // Incrementar no user_credits
    const { data: current } = await supabase
      .from('user_credits')
      .select(usageType)
      .eq('user_id', userId)
      .maybeSingle();

    const currentValue = current?.[usageType] || 0;

    await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        [usageType]: currentValue + 1,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    // Log de uso da ferramenta
    if (toolData.tool) {
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'tool_usage',
        details: {
          tool: toolData.tool,
          ip: toolData.ip,
          metadata: toolData.metadata
        }
      });
    }

    console.log("✅ Uso incrementado no Supabase");
  } catch (error) {
    console.error("❌ Erro ao incrementar uso:", error);
  }
}

// 🔄 ATUALIZAR STATUS DO PLANO NO SUPABASE (REAL)
async function updateUserPlanStatus(userId, status) {
  console.log(`🔄 Atualizando status no Supabase: ${userId} -> ${status}`);
  
  try {
    await supabase
      .from('subscriptions')
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (status === 'expired') {
      // Desativar acessos
      await supabase
        .from('user_access')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('access_type', 'subscription');
    }

    console.log("✅ Status atualizado no Supabase");
  } catch (error) {
    console.error("❌ Erro ao atualizar status:", error);
  }
}

// 🔓 LIBERAR PLANO SEGURO VIA SUPABASE (CHAMADA PELO WEBHOOK)
export async function liberarPlanoSeguro(userId, planType, paymentId) {
  console.log(`🔓 Liberando plano no Supabase: ${userId} -> ${planType}`);

  const ALL_TOOLS = [
    'Gerador de Scripts IA', 'Criador de Thumbnails', 'Analisador de Trends',
    'Otimizador de SEO', 'Gerador de Hashtags', 'Criador de Logos',
    'Agendamento Multiplataforma', 'IA de Copywriting', 'Tradutor Automático',
    'Gerador de QR Code', 'Editor de Vídeo Pro', 'Gerador de Ebooks Premium',
    'Gerador de Animações', 'IA Video Generator 8K', 'AI Funil Builder'
  ];

  const plan = (planType || '').toLowerCase();
  let tools;
  if (plan.includes('mensal')) tools = ALL_TOOLS.slice(0, 6);
  else if (plan.includes('trimestral')) tools = ALL_TOOLS.slice(0, 9);
  else if (plan.includes('semestral')) tools = ALL_TOOLS.slice(0, 12);
  else if (plan.includes('anual')) tools = ALL_TOOLS;
  else tools = ALL_TOOLS.slice(0, 6);

  // Calcular expiração
  const now = new Date();
  let expiration = new Date();
  switch (planType) {
    case 'mensal': expiration.setMonth(expiration.getMonth() + 1); break;
    case 'trimestral': expiration.setMonth(expiration.getMonth() + 3); break;
    case 'semestral': expiration.setMonth(expiration.getMonth() + 6); break;
    case 'anual': expiration.setFullYear(expiration.getFullYear() + 1); break;
    default: expiration.setMonth(expiration.getMonth() + 1);
  }

  try {
    // 1. Cancelar subscriptions ativas
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: now.toISOString() })
      .eq('user_id', userId)
      .eq('status', 'active');

    // 2. Criar nova subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: planType,
        status: 'active',
        payment_provider: 'stripe',
        payment_id: paymentId,
        start_date: now.toISOString(),
        end_date: expiration.toISOString()
      })
      .select('id')
      .single();

    // 3. Desativar acessos antigos
    await supabase
      .from('user_access')
      .update({ is_active: false, updated_at: now.toISOString() })
      .eq('user_id', userId)
      .eq('access_type', 'subscription');

    // 4. Criar acessos
    for (const toolName of tools) {
      await supabase
        .from('user_access')
        .upsert({
          user_id: userId,
          tool_name: toolName,
          access_type: 'subscription',
          source_id: sub?.id,
          valid_until: expiration.toISOString(),
          is_active: true,
          updated_at: now.toISOString()
        }, { onConflict: 'user_id,tool_name' });
    }

    // 5. Log
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'plan_activated_secure',
      details: { plan_type: planType, payment_id: paymentId, tools_count: tools.length }
    });

    console.log("✅ Plano liberado no Supabase com segurança!");
    
    return {
      userId, plan: planType, planStatus: "active",
      planExpiresAt: expiration.toISOString(),
      lastPaymentId: paymentId, activatedAt: now.toISOString()
    };
  } catch (error) {
    console.error("❌ Erro ao liberar plano no Supabase:", error);
    return null;
  }
}

// 🔍 VERIFICAR PLANO NO SUPABASE (PARA FRONTEND)
export async function checkUserPlan(userId) {
  const user = await getUserFromDB(userId);
  
  if (!user) {
    return { hasAccess: false, reason: "USER_NOT_FOUND" };
  }

  if (user.planStatus !== "active") {
    return { hasAccess: false, reason: "PLAN_INACTIVE", planStatus: user.planStatus };
  }

  const now = new Date();
  const expiresAt = new Date(user.planExpiresAt);
  
  if (expiresAt < now) {
    await updateUserPlanStatus(userId, "expired");
    return { hasAccess: false, reason: "PLAN_EXPIRED", expiresAt: user.planExpiresAt };
  }

  return { hasAccess: true, user, plan: user.plan, expiresAt: user.planExpiresAt };
}
