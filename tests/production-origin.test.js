const fs = require('fs');
const src = fs.readFileSync('api/gemini.js', 'utf8');
if (!src.includes("'https://hinglish-companion.vercel.app'")) {
  throw new Error('Stable production origin is missing from Gemini gateway allowlist');
}
if (!src.includes("if (!isAllowedOrigin(origin)) return send(res, 403")) {
  throw new Error('Origin protection is unexpectedly missing');
}
console.log('production origin regression PASS');
