// ============================================================================
//  RESEARCH ORCHESTRATOR
//  input {name?, url?}  ->  safe website fetch + web search  ->  Claude synthesis
//  ->  server-authoritative product/price fill  ->  UI-ready intelligence object.
// ============================================================================

import { safeFetch } from './safeFetch.js';
import { webSearch } from './search.js';
import { synthesize } from './anthropic.js';
import { productFor } from './catalog.js';

const GRADS = [
  'linear-gradient(135deg,#1F2937,#4B5563)',
  'linear-gradient(135deg,#0E7490,#22C3B8)',
  'linear-gradient(135deg,#7C2D12,#C2703B)',
  'linear-gradient(135deg,#312E81,#6366F1)',
  'linear-gradient(135deg,#134E4A,#0EA5A0)',
  'linear-gradient(135deg,#7C2D6B,#C2569E)',
];

function initialsOf(name) {
  const parts = (name || 'Business').trim().split(/\s+/).filter(Boolean);
  const s = (parts[0]?.[0] || 'B') + (parts[1]?.[0] || parts[0]?.[1] || '');
  return s.toUpperCase();
}
function hash(str) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
function clamp(n, lo, hi, dflt) {
  const x = Number(n);
  if (Number.isNaN(x)) return dflt;
  return Math.max(lo, Math.min(hi, x));
}

function normalizeUrl(url) {
  if (!url) return '';
  let u = url.trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}

export async function runResearch({ name, url, catalog }) {
  const useCustom = Array.isArray(catalog) && catalog.length > 0;
  const pfor = useCustom
    ? (pkey) => { const p = catalog.find((x) => x.pkey === pkey); return p ? { name: p.name, price: p.price } : { name: '(unmatched)', price: '' }; }
    : productFor;
  const website = normalizeUrl(url);
  const todayShort = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // 1) Gather evidence (both can fail independently — partial is fine)
  const sources = [];
  let page = { ok: false, text: '', finalUrl: website };
  if (website) {
    page = await safeFetch(website);
    sources.push({ type: 'website', url: page.finalUrl || website, ok: page.ok, note: page.error || '' });
  }
  const query = name ? `${name} ${website ? '' : ''}`.trim() : website;
  const searchRes = await webSearch(query || name || website, 6);
  if (searchRes.results?.length) {
    searchRes.results.forEach((r) => sources.push({ type: 'search', url: r.link, ok: true, note: r.title }));
  }

  // 2) Synthesize with Claude
  const intel = await synthesize({
    businessName: name,
    website,
    pageText: page.text,
    pageOk: page.ok,
    search: searchRes.results,
    todayShort,
    catalog: useCustom ? catalog : null,
  });

  // 3) Server-authoritative post-processing (prices come from catalog, never the model)
  intel.name = intel.name || name || 'Unknown Business';
  intel.loc = intel.loc || '';
  intel.identity = clamp(intel.identity, 0, 1, 0.6);
  intel.score = Math.round(clamp(intel.score, 0, 100, 60));
  intel.initials = initialsOf(intel.name);
  intel.color = GRADS[hash(intel.name) % GRADS.length];

  // defensive defaults so the UI never crashes on a missing field
  intel.matched = intel.matched || [];
  intel.relSecondary = intel.relSecondary || [];
  intel.comps = intel.comps || [];
  intel.claims = (intel.claims || []).map((c) => {
    let conf = Number(c.conf);
    if (Number.isNaN(conf)) conf = 0;
    if (conf > 0 && conf <= 1) conf = conf * 100; // model sometimes returns 0.98 instead of 98
    return { ...c, conf: Math.round(conf) };
  });
  intel.timeline = intel.timeline || [];
  intel.revenue = intel.revenue || [];
  intel.strat = intel.strat || { primary: '', primaryWhy: '', secondary: '' };
  intel.nba = intel.nba || { act: '', lead: '', ask: '', avoid: '' };
  intel.play = intel.play || { opening: '', discovery: [], value: '', objection: [], close: '' };
  intel.play.discovery = intel.play.discovery || [];
  intel.play.objection = intel.play.objection || [];
  if (intel.bdplay === undefined) intel.bdplay = null;

  intel.opps = (intel.opps || []).map((o, i) => {
    const p = pfor(o.pkey);
    return { ...o, rank: o.rank || i + 1, product: p.name, price: p.price };
  });
  if (intel.play) {
    const pp = pfor(intel.play.pkey);
    intel.play.product = pp.price ? `${pp.name} — ${pp.price}` : pp.name;
  }

  // 4) Partial / provenance metadata (never hide incomplete research — PRD §72)
  intel.partial = !page.ok || !searchRes.ok;
  intel._sources = sources;
  intel._meta = {
    fetchedWebsite: page.ok,
    fetchError: page.ok ? '' : page.error || '',
    searchOk: !!searchRes.ok,
    searchNote: searchRes.note || '',
    model: process.env.BD_MODEL || 'claude-haiku-4-5',
    at: new Date().toISOString(),
  };

  return intel;
}
