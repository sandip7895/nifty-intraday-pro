export default async function handler(req, res) {
  try {
    const urlObj = new URL(req.url, 'http://localhost');
    let subPath = urlObj.searchParams.get('path') || '';
    urlObj.searchParams.delete('path');

    if (!subPath) {
      subPath = req.url.replace(/^\/(api\/yahoo|yahoo-api)/, '').split('?')[0];
    }

    if (!subPath.startsWith('/')) {
      subPath = '/' + subPath;
    }

    const queryStr = urlObj.searchParams.toString();
    const targetUrl = `https://query1.finance.yahoo.com${subPath}${queryStr ? '?' + queryStr : ''}`;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-IN,en;q=0.9'
    };

    if (req.headers && req.headers['x-forwarded-for']) {
      headers['X-Forwarded-For'] = req.headers['x-forwarded-for'];
    }

    const response = await fetch(targetUrl, { headers });

    const data = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    return res.status(response.status).send(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Proxy error' });
  }
}
