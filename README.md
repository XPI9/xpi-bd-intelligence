# XPI BD Intelligence — "One Real Scan" proof

Capture a business (card photo, website, or name) → **live AI research** → evidence-backed
findings → XPI product match → sales play. This is the working proof: real Claude research,
not mock data.

> The polished mock demo (all sample data) is separate and still lives as your Artifact / the
> `index.html` you host. THIS project is the live engine.

---

## 1. One-time setup

You already have Node installed. In this folder:

```bash
npm install
```

## 2. Add your keys

Open **`.env`** and paste:

- `ANTHROPIC_API_KEY` — from https://console.anthropic.com → API Keys. **Required.**
- `SERPER_API_KEY` — from https://serper.dev → API Key (free tier). Optional; enables web
  search beyond the business's own site. Leave blank for website-only.

```
ANTHROPIC_API_KEY=sk-ant-...your real key...
BD_MODEL=claude-sonnet-5
SERPER_API_KEY=...your serper key...
PORT=3000
```

`.env` is git-ignored and never leaves your machine.

## 3. Run it

```bash
npm start
```

Open **http://localhost:3000** on your computer, or on your phone using your computer's local
IP (e.g. `http://192.168.1.20:3000`) while on the same Wi‑Fi.

- **Sample businesses** = instant, offline (the old demo data — good for a guaranteed pitch).
- **Website / Business name / Business card** = **live AI research** through your key.

Check `http://localhost:3000/api/health` to confirm your keys loaded.

---

## What's inside

```
server.js            Express server + 3 endpoints
lib/catalog.js       >> YOUR XPI PRODUCTS + PRICES <<  (AI recommends only from here)
lib/safeFetch.js     SSRF-guarded website fetcher (blocks internal/private targets)
lib/search.js        Serper web search (optional)
lib/anthropic.js     Claude: card vision + research synthesis (evidence rules baked in)
lib/research.js      Orchestrator: fetch + search + AI + server-set pricing
public/index.html    The app UI (same look as the demo), wired to the live API
```

### Endpoints
- `POST /api/research` `{ name?, url? }` → full prospect intelligence (live)
- `POST /api/extract`  `{ imageBase64, mediaType }` → business-card fields
- `GET  /api/health` → key + model status
- `GET  /api/catalog` → current product catalog

---

## Edit your catalog (important)

Open `lib/catalog.js` and replace the placeholder products with your real ones — name, what
each solves, and price. The AI can **only** recommend these `pkey`s and **never** writes a
price (prices are filled in from this file server-side). That's the PRD's hard rule against
hallucinated pricing.

---

## Security notes (built in from day one)

- **SSRF guard** (`safeFetch.js`): only http/https, DNS re-validated, private/loopback/
  link-local/cloud-metadata ranges blocked, redirects re-checked, size + timeout caps.
- **Prompt-injection defense** (`anthropic.js`): website/search text is labeled UNTRUSTED;
  the model is instructed to treat it as data only and ignore any instructions inside it.
- **No invented pricing/products**: enforced by the catalog + server-side price fill.
- Keys are server-side only (`.env`), never sent to the browser.

## Deploying later
Runs on any Node host (Render, Railway, a Hostinger Node app, or port to Next.js/Vercel to
match your other apps). Keep `.env` values in the host's environment settings, never in code.

## Cost
Each live scan = 1–2 Claude calls (website text + optional search) + optional Serper call.
Website-only keeps it cheapest. Watch usage in the Anthropic console.
