// ============================================================================
//  SAFE FETCHER  (P0 SSRF protection — PRD §42)
//  Lets us fetch a business's public website WITHOUT letting a malicious URL
//  reach internal/private infrastructure or cloud metadata endpoints.
//
//  Controls: https/http only · DNS resolved and IP re-validated · private,
//  loopback, link-local, metadata, reserved ranges blocked · redirects
//  re-validated per hop · timeout · response-size cap.
// ============================================================================

import dns from 'node:dns/promises';

const MAX_REDIRECTS = 4;
const TIMEOUT_MS = 12000;
const MAX_BYTES = 2_500_000; // ~2.5MB hard cap

function ipToLong(ip) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
}
function inRange(ip, base, maskBits) {
  const ipl = ipToLong(ip);
  const bl = ipToLong(base);
  if (ipl === null || bl === null) return false;
  const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
  return (ipl & mask) === (bl & mask);
}

// Returns true if the resolved IP must NOT be fetched.
export function isBlockedIP(ip) {
  if (!ip) return true;
  let addr = ip.toLowerCase();

  // IPv6 handling
  if (addr.includes(':')) {
    if (addr === '::1' || addr === '::') return true; // loopback / unspecified
    if (addr.startsWith('fe80') || addr.startsWith('fc') || addr.startsWith('fd')) return true; // link-local / unique-local
    // IPv4-mapped (::ffff:1.2.3.4)
    const m = addr.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (m) addr = m[1];
    else return false; // other global IPv6 — allow
  }

  const blocked = [
    ['0.0.0.0', 8],
    ['10.0.0.0', 8],
    ['100.64.0.0', 10], // CGNAT
    ['127.0.0.0', 8], // loopback
    ['169.254.0.0', 16], // link-local + cloud metadata (169.254.169.254)
    ['172.16.0.0', 12],
    ['192.0.0.0', 24],
    ['192.0.2.0', 24],
    ['192.168.0.0', 16],
    ['198.18.0.0', 15],
    ['198.51.100.0', 24],
    ['203.0.113.0', 24],
    ['224.0.0.0', 4], // multicast
    ['240.0.0.0', 4], // reserved
  ];
  return blocked.some(([b, m]) => inRange(addr, b, m));
}

async function assertSafeHost(hostname) {
  let records;
  try {
    records = await dns.lookup(hostname, { all: true });
  } catch {
    throw new Error(`DNS lookup failed for ${hostname}`);
  }
  if (!records.length) throw new Error(`No DNS records for ${hostname}`);
  for (const r of records) {
    if (isBlockedIP(r.address)) {
      throw new Error(`Blocked address for ${hostname} (${r.address}) — private/internal target refused`);
    }
  }
}

function stripToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Safely fetch a public URL and return extracted text.
 * @returns {Promise<{ok:boolean, status:number, finalUrl:string, text:string, error?:string}>}
 */
export async function safeFetch(rawUrl) {
  let url = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let u;
    try {
      u = new URL(url);
    } catch {
      return { ok: false, status: 0, finalUrl: url, text: '', error: 'Invalid URL' };
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return { ok: false, status: 0, finalUrl: url, text: '', error: `Blocked protocol: ${u.protocol}` };
    }

    try {
      await assertSafeHost(u.hostname);
    } catch (e) {
      return { ok: false, status: 0, finalUrl: url, text: '', error: e.message };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(u.href, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'XPI-BD-Intelligence/0.1 (+business research)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });
    } catch (e) {
      clearTimeout(timer);
      return { ok: false, status: 0, finalUrl: url, text: '', error: `Fetch failed: ${e.message}` };
    }
    clearTimeout(timer);

    // Handle redirects manually so every hop is re-validated
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location'), u.href).href;
      continue;
    }

    if (!res.ok) {
      return { ok: false, status: res.status, finalUrl: u.href, text: '', error: `HTTP ${res.status}` };
    }

    const ctype = res.headers.get('content-type') || '';
    if (!/text\/html|text\/plain|application\/xhtml/i.test(ctype)) {
      return { ok: false, status: res.status, finalUrl: u.href, text: '', error: `Unsupported content-type: ${ctype}` };
    }

    // Read with a byte cap
    const reader = res.body.getReader();
    let received = 0;
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
      if (received > MAX_BYTES) {
        reader.cancel();
        break;
      }
      chunks.push(value);
    }
    const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    const html = buf.toString('utf8');
    const text = stripToText(html).slice(0, 14000);
    return { ok: true, status: res.status, finalUrl: u.href, text };
  }
  return { ok: false, status: 0, finalUrl: url, text: '', error: 'Too many redirects' };
}
