// API DE TESTE PARA DEBUG DO STRIPE
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      STRIPE_SECRET_KEY_EXISTS: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_SECRET_KEY_PREFIX: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 15) : 'NOT_FOUND',
      STRIPE_WEBHOOK_SECRET_EXISTS: !!process.env.STRIPE_WEBHOOK_SECRET,
      ALL_ENV_KEYS: Object.keys(process.env).filter(k => k.includes('STRIPE')),
      TIMESTAMP: new Date().toISOString()
    };

    console.log('🔍 Environment Debug:', envCheck);

    return res.status(200).json({
      success: true,
      message: 'API funcionando',
      environment: envCheck
    });

  } catch (error) {
    console.error('❌ Erro na API de teste:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
