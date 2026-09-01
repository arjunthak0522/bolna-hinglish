module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, category: 'method_not_allowed' });
  return res.status(200).json({ ok: true, service: 'bolna-gemini-gateway', runtime: 'single-v1' });
};
