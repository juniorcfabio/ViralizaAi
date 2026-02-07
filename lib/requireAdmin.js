// 🔒 MIDDLEWARE DE PROTEÇÃO ADMIN - ACESSO RESTRITO
// Somente administradores com chave secreta podem acessar

export async function requireAdmin(req, res, next) {
  try {
    console.log("🔐 Verificando acesso admin...");

    const adminKey = req.headers["x-admin-key"];
    const adminSecret = process.env.ADMIN_SECRET || "super_chave_admin_123";

    if (!adminKey) {
      console.log("❌ Chave admin não fornecida");
      return res.status(401).json({ 
        error: "Chave de administrador é obrigatória",
        code: "ADMIN_KEY_MISSING"
      });
    }

    if (adminKey !== adminSecret) {
      console.log("❌ Chave admin inválida:", adminKey);
      return res.status(403).json({ 
        error: "Acesso negado - Chave inválida",
        code: "ADMIN_ACCESS_DENIED"
      });
    }

    console.log("✅ Acesso admin autorizado");

    // 📝 LOG DE AUDITORIA
    const timestamp = new Date().toISOString();
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    console.log("🔍 AUDITORIA ADMIN:", {
      timestamp,
      ip,
      userAgent,
      endpoint: req.url,
      method: req.method
    });

    if (next) {
      next();
    } else {
      return { success: true, admin: true };
    }

  } catch (error) {
    console.error("🚨 Erro no middleware admin:", error);
    return res.status(500).json({ 
      error: "Erro interno do servidor",
      code: "ADMIN_ERROR"
    });
  }
}

// 🔍 FUNÇÃO PARA VERIFICAR SE É ADMIN (SEM MIDDLEWARE)
export async function isAdmin(adminKey) {
  const adminSecret = process.env.ADMIN_SECRET || "super_chave_admin_123";
  return adminKey === adminSecret;
}

// 📊 FUNÇÃO PARA LOG DE AÇÕES ADMIN
export function logAdminAction(action, details) {
  const timestamp = new Date().toISOString();
  console.log("📋 AÇÃO ADMIN:", {
    timestamp,
    action,
    details
  });
  
  // 🔍 EM PRODUÇÃO: SALVAR NO BANCO
  // await database.adminLogs.insertOne({
  //   timestamp,
  //   action,
  //   details
  // });
}
