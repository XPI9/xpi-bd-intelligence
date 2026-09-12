// ============================================================================
//  XPI BD Intelligence — proof server
//  Serves the app UI and three live endpoints:
//    POST /api/extract   card image  -> contact fields
//    POST /api/research  {name,url}  -> full prospect intelligence (live AI)
//    GET  /api/health
// ============================================================================

import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runResearch } from './lib/research.js';
import { extractCard, generateVariations, generateCloser } from './lib/anthropic.js';
import { CATALOG } from './lib/catalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '12mb' })); // card images arrive as base64

const KEY_OK = !!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('REPLACE_ME');

// --- auth gate: only signed-in users can spend AI, and cap how much ---
const SB_URL = 'https://ladcpxqwvfiosffrvwdq.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZGNweHF3dmZpb3NmZnJ2d2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxODI3OTQsImV4cCI6MjEwNDc1ODc5NH0.0Se1F_572VXg5Z3QzDVxGdjhehci5ljM8-FFRyiR8dQ';
async function getUser(req) {
  const a = req.headers.authorization || '';
  const token = a.startsWith('Bearer ') ? a.slice(7) : '';
  if (!token) return null;
  try {
    const r = await fetch(SB_URL + '/auth/v1/user', { headers: { apikey: SB_ANON, authorization: 'Bearer ' + token } });
    if (!r.ok) return null;
    const u = await r.json();
    return u && u.id ? u : null;
  } catch (_) { return null; }
}
const _scans = new Map(); // uid -> [timestamps]
function underLimit(uid, max) {
  const now = Date.now(), WIN = 3600000;
  const arr = (_scans.get(uid) || []).filter((t) => now - t < WIN);
  if (arr.length >= max) return false;
  arr.push(now); _scans.set(uid, arr); return true;
}
async function gate(req, res, cost) {
  const u = await getUser(req);
  if (!u) { res.status(401).json({ error: 'auth', message: 'Please sign in to run this.' }); return null; }
  if (!underLimit(u.id, cost || 60)) { res.status(429).json({ error: 'rate', message: 'You’ve hit the hourly limit — give it a few minutes and try again.' }); return null; }
  return u;
}

// --- brand profile (drives the front-end look; catalog is chosen in lib/catalog.js) ---
const PROFILE = (process.env.BD_PROFILE || 'xpi').toLowerCase();
const CONFIG = {
  xpi: {
    profile: 'xpi',
    wordmark: 'XPI<span>·</span>Intel',
    accent: '#F2A93B',
    pageTitle: 'XPI BD Intelligence',
    eyebrow: 'XPI Solutions · Product Demo',
    lede:
      'See the opportunity before you make the pitch. Capture any business, and the platform researches it, backs every finding with <b>evidence</b>, scores the opportunity, and tells your rep exactly what to do next.',
    productLabel: 'XPI match',
    showWhiteLabel: true,
  },
  core: {
    profile: 'core',
    wordmark: 'BD<span>·</span>Intel',
    accent: '#3B82F6',
    pageTitle: 'BD Intelligence',
    eyebrow: 'Business Development Intelligence',
    lede:
      'Scan any business — card, website, or name — and get an evidence-backed opportunity brief in seconds: who they are, where they’re leaking revenue, and the next best move. Your catalog, your brand.',
    productLabel: 'Solution match',
    showWhiteLabel: false,
  },
};
const BRAND = CONFIG[PROFILE] || CONFIG.xpi;

app.get('/api/config', (_req, res) => res.json(BRAND));

app.get('/api/selftest', async (_req, res) => {
  const out = {};
  const k = process.env.ANTHROPIC_API_KEY || '';
  let bad = 0;
  for (let i = 0; i < k.length; i++) { if (k.charCodeAt(i) > 126) bad++; }
  out.key = { present: !!k, clean: bad === 0 }; // no key material exposed
  try {
    const r = await fetch('https://api.anthropic.com/v1/models', { headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01' } });
    out.anthropic = { ok: true, status: r.status };
  } catch (e) { out.anthropic = { ok: false, code: (e.cause && e.cause.code) || e.name, msg: e.message }; }
  try {
    const r = await fetch('https://1.1.1.1', { redirect: 'manual' });
    out.internet_by_ip = { ok: true, status: r.status };
  } catch (e) { out.internet_by_ip = { ok: false, code: (e.cause && e.cause.code) || e.name, msg: e.message }; }
  res.json(out);
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    profile: PROFILE,
    anthropicKey: KEY_OK,
    searchKey: !!process.env.SERPER_API_KEY,
    model: process.env.BD_MODEL || 'claude-haiku-4-5',
    catalogSize: CATALOG.length,
  });
});

app.get('/api/catalog', (_req, res) => res.json(CATALOG));

app.post('/api/research', async (req, res) => {
  if (!KEY_OK) return res.status(400).json({ error: 'no_api_key', message: 'Add your ANTHROPIC_API_KEY to .env and restart.' });
  if (!(await gate(req, res, 60))) return;
  const { name, url, catalog } = req.body || {};
  if (!name && !url) return res.status(400).json({ error: 'bad_input', message: 'Provide a business name or website.' });
  try {
    const intel = await runResearch({ name, url, catalog: Array.isArray(catalog) ? catalog.slice(0, 40) : null });
    res.json(intel);
  } catch (e) {
    console.error('[research]', e);
    res.status(500).json({ error: 'research_failed', message: e.message });
  }
});

app.post('/api/variations', async (req, res) => {
  if (!KEY_OK) return res.status(400).json({ error: 'no_api_key', message: 'Add your ANTHROPIC_API_KEY to .env and restart.' });
  if (!(await gate(req, res, 80))) return;
  const { intel } = req.body || {};
  if (!intel || !intel.name) return res.status(400).json({ error: 'bad_input', message: 'Missing prospect context. Run a scan first.' });
  try {
    const variations = await generateVariations(intel);
    res.json(variations);
  } catch (e) {
    console.error('[variations]', e);
    res.status(500).json({ error: 'variations_failed', message: e.message });
  }
});

app.post('/api/closer', async (req, res) => {
  if (!KEY_OK) return res.status(400).json({ error: 'no_api_key', message: 'Add your ANTHROPIC_API_KEY to .env and restart.' });
  if (!(await gate(req, res, 80))) return;
  const { intel, catalog, format } = req.body || {};
  if (!intel || !intel.name) return res.status(400).json({ error: 'bad_input', message: 'Missing prospect context. Run a scan first.' });
  try {
    const cat = Array.isArray(catalog) && catalog.length ? catalog.slice(0, 40) : CATALOG;
    const closer = await generateCloser(intel, cat, { forceKind: format });
    res.json(closer);
  } catch (e) {
    console.error('[closer]', e);
    res.status(500).json({ error: 'closer_failed', message: e.message });
  }
});

app.post('/api/extract', async (req, res) => {
  if (!KEY_OK) return res.status(400).json({ error: 'no_api_key', message: 'Add your ANTHROPIC_API_KEY to .env and restart.' });
  if (!(await gate(req, res, 80))) return;
  const { imageBase64, mediaType } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: 'bad_input', message: 'No image provided.' });
  try {
    const fields = await extractCard(imageBase64, mediaType || 'image/jpeg');
    res.json(fields);
  } catch (e) {
    console.error('[extract]', e);
    res.status(500).json({ error: 'extract_failed', message: e.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  ${BRAND.pageTitle}  (${PROFILE})  →  http://localhost:${PORT}`);
  console.log(`  Claude key: ${KEY_OK ? 'loaded ✓' : 'MISSING ✗  (edit .env)'}`);
  console.log(`  Search key: ${process.env.SERPER_API_KEY ? 'loaded ✓' : 'not set (website-only)'}`);
  console.log(`  Catalog: ${CATALOG.length} products\n`);
});
