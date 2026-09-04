// ============================================================================
//  WEB SEARCH  (Serper.dev — Google results)
//  Used to research beyond the business's own website: reviews, listings,
//  socials, news. Optional — if SERPER_API_KEY is empty, returns [] and the
//  research runs website-only.
// ============================================================================

export async function webSearch(query, num = 6) {
  const key = process.env.SERPER_API_KEY;
  if (!key) return { ok: false, results: [], note: 'no_search_key' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { ok: false, results: [], note: `search_http_${res.status}` };
    const data = await res.json();
    const results = (data.organic || []).slice(0, num).map((r) => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet || '',
    }));
    // Include a couple of high-signal blocks if present
    if (data.knowledgeGraph?.title) {
      results.unshift({
        title: `[Knowledge Graph] ${data.knowledgeGraph.title}`,
        link: data.knowledgeGraph.website || '',
        snippet: [data.knowledgeGraph.type, data.knowledgeGraph.description, data.knowledgeGraph.rating ? `rating ${data.knowledgeGraph.rating} (${data.knowledgeGraph.ratingCount} reviews)` : '']
          .filter(Boolean)
          .join(' · '),
      });
    }
    return { ok: true, results };
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, results: [], note: `search_error_${e.message}` };
  }
}
