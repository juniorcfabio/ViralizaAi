// 🔐 SISTEMA DE PERMISSÕES POR CARGO - CONTROLE GRANULAR
// Middleware avançado para diferentes níveis de acesso

import { ROLES } from "./globalConfig.js";

export class RolePermissionManager {
  constructor() {
    this.roles = ROLES;
  }

  // 🔍 VERIFICAR SE USUÁRIO TEM PERMISSÃO
  hasPermission(userRole, requiredPermission) {
    const role = this.roles[userRole];
    if (!role) return false;

    // 🌟 ADMIN TEM TODAS AS PERMISSÕES
    if (role.permissions.includes('*')) return true;

    // 🎯 VERIFICAR PERMISSÃO ESPECÍFICA
    return role.permissions.includes(requiredPermission);
  }

  // 📊 VERIFICAR NÍVEL DE ACESSO
  hasMinimumLevel(userRole, requiredLevel) {
    const role = this.roles[userRole];
    if (!role) return false;

    return role.level >= requiredLevel;
  }

  // 🔒 MIDDLEWARE PARA VERIFICAR ROLE
  requireRole(requiredRole) {
    return (req, res, next) => {
      try {
        const userRole = req.user?.role || 'user';
        
        console.log(`🔐 Verificando role: ${userRole} vs ${requiredRole}`);

        if (userRole === requiredRole || userRole === 'admin') {
          console.log("✅ Role autorizada");
          next();
        } else {
          console.log("❌ Role não autorizada");
          return res.status(403).json({
            error: "Acesso negado - Role insuficiente",
            code: "INSUFFICIENT_ROLE",
            required: requiredRole,
            current: userRole
          });
        }
      } catch (error) {
        console.error("🚨 Erro na verificação de role:", error);
        return res.status(500).json({
          error: "Erro interno na verificação de permissões"
        });
      }
    };
  }

  // 🎯 MIDDLEWARE PARA VERIFICAR PERMISSÃO ESPECÍFICA
  requirePermission(requiredPermission) {
    return (req, res, next) => {
      try {
        const userRole = req.user?.role || 'user';
        
        console.log(`🔐 Verificando permissão: ${requiredPermission} para role: ${userRole}`);

        if (this.hasPermission(userRole, requiredPermission)) {
          console.log("✅ Permissão autorizada");
          next();
        } else {
          console.log("❌ Permissão negada");
          return res.status(403).json({
            error: "Acesso negado - Permissão insuficiente",
            code: "INSUFFICIENT_PERMISSION",
            required: requiredPermission,
            userRole: userRole
          });
        }
      } catch (error) {
        console.error("🚨 Erro na verificação de permissão:", error);
        return res.status(500).json({
          error: "Erro interno na verificação de permissões"
        });
      }
    };
  }

  // 📈 MIDDLEWARE PARA VERIFICAR NÍVEL MÍNIMO
  requireMinimumLevel(requiredLevel) {
    return (req, res, next) => {
      try {
        const userRole = req.user?.role || 'user';
        
        console.log(`🔐 Verificando nível: ${requiredLevel} para role: ${userRole}`);

        if (this.hasMinimumLevel(userRole, requiredLevel)) {
          console.log("✅ Nível autorizado");
          next();
        } else {
          console.log("❌ Nível insuficiente");
          return res.status(403).json({
            error: "Acesso negado - Nível insuficiente",
            code: "INSUFFICIENT_LEVEL",
            required: requiredLevel,
            userRole: userRole,
            userLevel: this.roles[userRole]?.level || 0
          });
        }
      } catch (error) {
        console.error("🚨 Erro na verificação de nível:", error);
        return res.status(500).json({
          error: "Erro interno na verificação de permissões"
        });
      }
    };
  }

  // 👥 OBTER INFORMAÇÕES DO ROLE
  getRoleInfo(roleName) {
    const role = this.roles[roleName];
    if (!role) return null;

    return {
      name: role.name,
      level: role.level,
      permissions: role.permissions,
      canAccess: (permission) => this.hasPermission(roleName, permission)
    };
  }

  // 📋 LISTAR TODOS OS ROLES
  getAllRoles() {
    return Object.entries(this.roles).map(([key, role]) => ({
      id: key,
      name: role.name,
      level: role.level,
      permissionCount: role.permissions.length
    }));
  }

  // 🔍 VERIFICAR MÚLTIPLAS PERMISSÕES
  hasAnyPermission(userRole, permissions) {
    return permissions.some(permission => 
      this.hasPermission(userRole, permission)
    );
  }

  // 🎯 VERIFICAR TODAS AS PERMISSÕES
  hasAllPermissions(userRole, permissions) {
    return permissions.every(permission => 
      this.hasPermission(userRole, permission)
    );
  }

  // 🔄 MIDDLEWARE COMBINADO (ROLE OU PERMISSÃO)
  requireRoleOrPermission(requiredRole, requiredPermission) {
    return (req, res, next) => {
      try {
        const userRole = req.user?.role || 'user';
        
        const hasRole = userRole === requiredRole || userRole === 'admin';
        const hasPermission = this.hasPermission(userRole, requiredPermission);

        if (hasRole || hasPermission) {
          console.log("✅ Acesso autorizado (role ou permissão)");
          next();
        } else {
          console.log("❌ Acesso negado (nem role nem permissão)");
          return res.status(403).json({
            error: "Acesso negado",
            code: "INSUFFICIENT_ACCESS",
            required: {
              role: requiredRole,
              permission: requiredPermission
            },
            current: {
              role: userRole
            }
          });
        }
      } catch (error) {
        console.error("🚨 Erro na verificação combinada:", error);
        return res.status(500).json({
          error: "Erro interno na verificação de permissões"
        });
      }
    };
  }
}

// 🚀 INSTÂNCIA GLOBAL DO GERENCIADOR
export const roleManager = new RolePermissionManager();

// 🔧 MIDDLEWARES EXPORTADOS PARA USO DIRETO
export const requireRole = (role) => roleManager.requireRole(role);
export const requirePermission = (permission) => roleManager.requirePermission(permission);
export const requireMinimumLevel = (level) => roleManager.requireMinimumLevel(level);
export const requireRoleOrPermission = (role, permission) => roleManager.requireRoleOrPermission(role, permission);

// 🎯 FUNÇÕES AUXILIARES
export const hasPermission = (userRole, permission) => roleManager.hasPermission(userRole, permission);
export const hasMinimumLevel = (userRole, level) => roleManager.hasMinimumLevel(userRole, level);
export const getRoleInfo = (roleName) => roleManager.getRoleInfo(roleName);
export const getAllRoles = () => roleManager.getAllRoles();

// 📊 MAPEAMENTO DE PERMISSÕES POR FUNCIONALIDADE
export const PERMISSION_GROUPS = {
  // 👥 USUÁRIOS
  users: [
    'view_users',
    'edit_users',
    'block_users',
    'unblock_users',
    'delete_users'
  ],

  // 💳 PAGAMENTOS
  payments: [
    'view_payments',
    'process_refunds',
    'view_revenue',
    'export_financial_data'
  ],

  // 📊 ANALYTICS
  analytics: [
    'view_analytics',
    'view_metrics',
    'export_reports',
    'view_real_time_data'
  ],

  // 🛠️ SISTEMA
  system: [
    'manage_settings',
    'view_logs',
    'manage_integrations',
    'system_maintenance'
  ],

  // 🚨 SEGURANÇA
  security: [
    'view_fraud_reports',
    'manage_security_settings',
    'view_audit_logs',
    'manage_api_keys'
  ]
};

console.log("🔐 Sistema de permissões carregado - Controle granular ativo");
