// Proxy de imagens para evitar CORS
// Baixa a imagem do URL fornecido e retorna como binário com headers corretos
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    console.log('🖼️ Proxy image:', imageUrl.substring(0, 80) + '...');

    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error('❌ Proxy fetch failed:', response.status);
      return res.status(response.status).json({ error: 'Failed to fetch image' });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'image/png';

    console.log(`✅ Proxy image OK: ${buffer.length} bytes, ${contentType}`);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(buffer);
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    return res.status(500).json({ error: 'Proxy failed', details: error.message });
  }
}
