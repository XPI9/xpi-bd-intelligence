// ============================================================================
//  WHITE-LABEL CORE CATALOG  (template — REPLACE with your own products)
//
//  This is the "plug-in-your-own-catalog" profile. The engine recommends ONLY
//  from the products below, by pkey, and NEVER writes a price (prices are filled
//  in from here). The examples are generic placeholders so the tool works out of
//  the box — swap them for the real products/services the operator sells.
//
//  MATCHING RULE: match on the PAIN a business demonstrates, not its industry.
//  The `solves` field carries the most weight.
//
//  To add a product, copy one block and edit: pkey (unique id), name, solves
//  (the problem it removes — be specific about the pain), price (display string),
//  verticals (business types it fits).
// ============================================================================

export const CATALOG = [
  {
    pkey: 'website',
    name: 'Website & Lead Infrastructure',
    solves:
      'Website looks fine but does not generate or capture leads; inquiries scattered across site, calls, and forms get missed. A site built to capture and route every lead.',
    price: 'from $1,500 build + monthly care',
    verticals: ['service', 'contractor', 'restaurant', 'salon', 'healthcare', 'general'],
  },
  {
    pkey: 'booking',
    name: 'Online Booking / Scheduling',
    solves:
      'No way to book online; customers must call, and appointments are missed after hours. Adds self-serve booking and scheduling.',
    price: 'from $99/mo',
    verticals: ['barber', 'salon', 'medspa', 'clinic', 'contractor', 'general'],
  },
  {
    pkey: 'concierge',
    name: 'AI Answering & Concierge',
    solves:
      'Missed calls and after-hours inquiries go unanswered; new leads are lost with no follow-up. Answers every call/message, captures the lead, and books.',
    price: 'from $199/mo',
    verticals: ['general', 'service', 'restaurant', 'childcare', 'contractor'],
  },
  {
    pkey: 'reviews',
    name: 'Reviews & Reputation',
    solves:
      'Low review volume or a strong reputation not converted into referrals; no review-request flow. Automates review requests and referrals.',
    price: 'from $99/mo',
    verticals: ['restaurant', 'salon', 'barber', 'medspa', 'contractor', 'general'],
  },
  {
    pkey: 'intake',
    name: 'Digital Intake & Forms',
    solves:
      'Long forms and PDFs get abandoned or filled out wrong; staff retype everything. Turns intake into a guided mobile flow with signatures into the CRM.',
    price: 'from $129/mo',
    verticals: ['insurance', 'clinic', 'childcare', 'legal', 'nonprofit', 'general'],
  },
  {
    pkey: 'crm',
    name: 'CRM & Follow-up',
    solves:
      'Leads scattered across spreadsheets, email, and text; no pipeline or automated follow-up, so leads fall through the cracks. One dashboard with follow-up automation.',
    price: 'from $149/mo',
    verticals: ['sales', 'contractor', 'realestate', 'insurance', 'service', 'general'],
  },
];

// Fast lookup by pkey
export const CATALOG_MAP = Object.fromEntries(CATALOG.map((p) => [p.pkey, p]));

// Compact list the AI is shown (pkey + name + what it solves + which verticals)
export function catalogForPrompt() {
  return CATALOG.map(
    (p) => `- ${p.pkey}: ${p.name}\n    SOLVES: ${p.solves}\n    best for: ${p.verticals.join(', ')}`
  ).join('\n');
}

// Look up display fields for a pkey the AI returned (server-authoritative pricing)
export function productFor(pkey) {
  const p = CATALOG_MAP[pkey];
  if (!p) return { name: '(unmatched)', price: '' };
  return { name: p.name, price: p.price };
}
