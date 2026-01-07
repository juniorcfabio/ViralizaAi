// API DE TESTE PARA FERRAMENTAS
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('🔧 API de teste de ferramenta chamada');
  console.log('Method:', req.method);
  console.log('Body:', req.body);

  return res.status(200).json({
    success: true,
    message: 'API de ferramenta funcionando',
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });
}
