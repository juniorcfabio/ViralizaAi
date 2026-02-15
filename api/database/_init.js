// 🗄️ API PARA INICIALIZAR BANCO DE DADOS
import { initializeDatabase, runMigrations, testConnection } from '../../lib/database.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // 🔐 VERIFICAR SE É ADMIN (EM PRODUÇÃO)
    const adminKey = req.headers['x-admin-key'];
    if (process.env.NODE_ENV === 'production' && adminKey !== process.env.ADMIN_INIT_KEY) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    console.log('🚀 Iniciando configuração do banco de dados...');

    // 🧪 TESTAR CONEXÃO
    const connectionTest = await testConnection();
    if (!connectionTest) {
      return res.status(500).json({
        error: 'Falha na conexão com banco',
        message: 'Verifique as variáveis de ambiente DATABASE_URL ou SUPABASE_URL'
      });
    }

    // 🗄️ INICIALIZAR BANCO
    const initResult = await initializeDatabase();
    if (!initResult) {
      return res.status(500).json({
        error: 'Falha na inicialização',
        message: 'Erro ao inicializar conexão com banco'
      });
    }

    // 🏗️ EXECUTAR MIGRATIONS
    const migrationResult = await runMigrations();
    if (!migrationResult) {
      return res.status(500).json({
        error: 'Falha nas migrations',
        message: 'Erro ao executar migrations do banco'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Banco de dados inicializado com sucesso!',
      details: {
        connection: 'OK',
        initialization: 'OK',
        migrations: 'OK',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('🚨 Erro na inicialização do banco:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
