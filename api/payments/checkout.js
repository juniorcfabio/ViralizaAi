// API ENDPOINT PARA PAGAMENTOS CHECKOUT
// Endpoint para processar diferentes tipos de checkout

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('💳 API de checkout chamada');
    console.log('Body:', req.body);

    // Redirecionar para API correta baseado no tipo
    const { type } = req.body;
    
    let redirectUrl;
    switch (type) {
      case 'subscription':
        redirectUrl = '/api/create-checkout-session';
        break;
      case 'tool':
        redirectUrl = '/api/create-tool-payment';
        break;
      case 'ad':
        redirectUrl = '/api/create-ad-payment';
        break;
      case 'video':
        redirectUrl = '/api/create-video-payment';
        break;
      default:
        redirectUrl = '/api/create-checkout-session';
    }

    // Fazer chamada para API específica
    const response = await fetch(`https://viralizaai.vercel.app${redirectUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    const result = await response.json();
    
    return res.status(response.status).json(result);

  } catch (error) {
    console.error('❌ Erro na API de checkout:', error);
    
    return res.status(500).json({
      error: 'Erro no checkout',
      message: error.message,
      success: false
    });
  }
}
