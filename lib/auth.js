// 🔐 SISTEMA DE AUTENTICAÇÃO COM BANCO DE DADOS
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 🔐 MIDDLEWARE DE AUTENTICAÇÃO
export async function authMiddleware(req) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-auth-token'] ||
                  req.cookies?.token;

    if (!token) {
      return null;
    }

    // ✅ VERIFICAR TOKEN JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 🔍 BUSCAR USUÁRIO NO BANCO
    const result = await query(
      'SELECT * FROM users WHERE id = $1 AND email = $2',
      [decoded.id, decoded.email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    
    // 🔄 ATUALIZAR ÚLTIMO ACESSO
    await query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      plano: user.plano,
      plano_ativo: user.plano_ativo,
      role: user.role || 'user',
      stripe_customer_id: user.stripe_customer_id,
      affiliate_code: user.affiliate_code
    };

  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
    return null;
  }
}

// 📝 REGISTRAR USUÁRIO
export async function registerUser(userData) {
  try {
    const { name, email, password } = userData;

    // 🔍 VERIFICAR SE EMAIL JÁ EXISTE
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return { success: false, message: 'Email já cadastrado' };
    }

    // 🔒 HASH DA SENHA
    const passwordHash = await bcrypt.hash(password, 12);

    // 🎯 GERAR CÓDIGO DE AFILIADO
    const affiliateCode = generateAffiliateCode();

    // 💾 INSERIR USUÁRIO
    const result = await query(`
      INSERT INTO users (name, email, password_hash, affiliate_code)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, plano, plano_ativo, affiliate_code
    `, [name, email, passwordHash, affiliateCode]);

    const user = result.rows[0];

    // 🎫 GERAR TOKEN
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plano: user.plano,
        plano_ativo: user.plano_ativo,
        affiliate_code: user.affiliate_code
      },
      token
    };

  } catch (error) {
    console.error('❌ Erro no registro:', error);
    return { success: false, message: 'Erro interno do servidor' };
  }
}

// 🔑 LOGIN DO USUÁRIO - MIGRADO PARA SUPABASE AUTH
export async function loginUser(email, password) {
  console.warn('⚠️ DEPRECATED: Use supabase.auth.signInWithPassword() instead');
  return { success: false, message: 'Use Supabase Auth' };
}

// 👤 OBTER PERFIL DO USUÁRIO
export async function getUserProfile(userId) {
  try {
    const result = await query(`
      SELECT 
        u.*,
        s.status as subscription_status,
        s.plan_type as subscription_plan,
        s.current_period_end
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return { success: false, message: 'Usuário não encontrado' };
    }

    const user = result.rows[0];
    
    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plano: user.plano,
        plano_ativo: user.plano_ativo,
        affiliate_code: user.affiliate_code,
        subscription: {
          status: user.subscription_status,
          plan: user.subscription_plan,
          expires_at: user.current_period_end
        },
        created_at: user.created_at
      }
    };

  } catch (error) {
    console.error('❌ Erro ao obter perfil:', error);
    return { success: false, message: 'Erro interno do servidor' };
  }
}

// 🔄 ATUALIZAR PLANO DO USUÁRIO
export async function updateUserPlan(userId, planType, isActive = true) {
  try {
    const result = await query(`
      UPDATE users 
      SET plano = $1, plano_ativo = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, name, email, plano, plano_ativo
    `, [planType, isActive, userId]);

    if (result.rows.length === 0) {
      return { success: false, message: 'Usuário não encontrado' };
    }

    return {
      success: true,
      user: result.rows[0]
    };

  } catch (error) {
    console.error('❌ Erro ao atualizar plano:', error);
    return { success: false, message: 'Erro interno do servidor' };
  }
}

// 🎯 GERAR CÓDIGO DE AFILIADO
function generateAffiliateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 🔍 BUSCAR USUÁRIO POR EMAIL
export async function findUserByEmail(email) {
  try {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    return null;
  }
}

// 🔍 BUSCAR USUÁRIO POR ID
export async function findUserById(id) {
  try {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    return null;
  }
}

// 🎫 GERAR TOKEN JWT
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ✅ VERIFICAR TOKEN JWT
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
