// ============================================================================
//  XPI PRODUCT CATALOG  (real products + pricing)
//  The AI may ONLY recommend products from this list, by pkey, and it NEVER
//  writes a price — prices are filled in from here, server-side. This enforces
//  the rule: pricing comes from the catalog, never from the model.
//
//  MATCHING RULE (from XPI): match on the PAIN a business demonstrates, not on
//  its industry. The `solves` field carries the most weight.
// ============================================================================

export const CATALOG = [
  {
    pkey: 'smartcard',
    name: 'XPI SmartCard™',
    solves:
      'Paper business cards get lost and prospects never follow up; no way to capture or track the person you just met. Tap/scan to share contact + links and feed the lead into the XPI system.',
    setup: 35,
    monthly: 10,
    price: '$35 hardware (one-time) + $10/mo',
    verticals: ['sales', 'insurance', 'realestate', 'consulting', 'contractor', 'barber', 'salon', 'restaurant', 'dealership', 'general'],
  },
  {
    pkey: 'formless',
    name: 'XPI FormLess™',
    solves:
      'Customers abandon long forms, leave fields blank, and struggle with PDFs on phones; staff retype everything. Turns intake into a mobile question-by-question conversation, validates, captures signature, generates the PDF, and sends it to the CRM.',
    setup: null,
    monthly: null,
    price: 'Custom pricing (contact XPI)',
    verticals: ['childcare', 'school', 'insurance', 'healthcare', 'nonprofit', 'membership', 'contractor', 'financial', 'general'],
  },
  {
    pkey: 'growth',
    name: 'XPI Growth System™ — Website + Lead Infrastructure',
    solves:
      'Website looks good but does not generate or capture revenue; leads scattered across site, calls, cards, and forms cause missed inquiries and poor follow-up. Connects website, lead capture, CRM, SmartCard, AI receptionist, and automation into one revenue loop.',
    setup: 1500,
    monthly: 49,
    price: 'Launch $1,500 build + from $49/mo · Build $2,300 + from $79/mo · Scale custom · hosting $360/yr',
    verticals: ['service', 'childcare', 'cleaning', 'contractor', 'insurance', 'consulting', 'restaurant', 'salon', 'healthcare', 'startup', 'general'],
  },
  {
    pkey: 'childcare',
    name: 'XPI Full Childcare Automation™',
    solves:
      'Childcare centers lose enrollments to missed calls, paper enrollment packets, manual tour scheduling, document collection, tuition admin, and repetitive front-office work. Combines enrollment website, Parent Portal, forms, documents, payments, tour scheduling, and Vicky AI receptionist.',
    setup: 459,
    monthly: 220,
    price: 'Starter from $459 start + $220/mo · Full/Center Suite to $404–$604/mo · hosting $360/yr',
    verticals: ['childcare', 'daycare', 'preschool', 'earlylearning', 'headstart'],
  },
  {
    pkey: 'eventvault',
    name: 'EventVault™',
    solves:
      'Events rely on clipboard check-ins, scattered forms, paper waivers, disconnected donation links, and sponsorships with no measurable engagement. One NFC/QR event hub for check-in, schedules, waivers, sponsors, donations, VIP access, registration, and post-event reporting.',
    setup: 499,
    monthly: 149,
    price: 'Starter $499 · Pro $1,250 · Premium $2,500+ · optional $149–$299/mo support',
    verticals: ['events', 'sports', 'nonprofit', 'church', 'conference', 'festival', 'school', 'fundraiser', 'expo', 'community'],
  },
  {
    pkey: 'signage',
    name: 'XPI Smart-Signage™',
    solves:
      'People walk up when the business is closed, cannot get answers, leave without booking, and never become a trackable lead. Turns a storefront, counter, vehicle, or location into a 24/7 tap/scan salesperson that answers, books, and drops the visitor into the lead dashboard.',
    setup: 129,
    monthly: 29,
    price: '$129 setup + $29/mo',
    verticals: ['restaurant', 'childcare', 'salon', 'barber', 'gym', 'clinic', 'contractor', 'dealership', 'retail', 'hotel', 'events', 'general'],
  },
  {
    pkey: 'setitsell',
    name: 'Set It & Sell™',
    solves:
      'Businesses collect emails but never follow up; lists sit with no welcome, nurture, offers, or re-engagement, so they keep paying to acquire prospects without capturing the value. Teaches users to build their own automated email sales system.',
    setup: 297,
    monthly: 0,
    price: '$297 one-time (founding cohort), then $497 · lifetime access',
    verticals: ['coaching', 'consulting', 'creator', 'course', 'service', 'ecommerce', 'general'],
  },
  {
    pkey: 'sitepulse',
    name: 'XPI SitePulse™ — Facility Maintenance & Operations',
    solves:
      'Facility problems are reported verbally, by text, or not at all; managers lose track of repairs, vendor costs, approvals, asset history, and status across locations. An NFC/QR tap becomes a documented work order with photos, assignments, vendor controls, approvals, history, and reporting.',
    setup: 499,
    monthly: 149,
    price: 'Pilot $499 setup + $149/mo · Core $749 + $199/mo · Dispatch $1,250 + $349/mo · Command from $599/mo',
    verticals: ['restaurant', 'childcare', 'school', 'church', 'hotel', 'property', 'retail', 'franchise', 'warehouse', 'gym', 'healthcare', 'facilities'],
  },
  {
    pkey: 'soultag',
    name: 'SoulTag™',
    solves:
      'Family stories, voices, photos, and the meaning behind heirlooms disappear over generations. Attaches a permanent digital story (photos, stories, audio, memories) to a physical keepsake via NFC/QR.',
    setup: 59,
    monthly: 0,
    price: 'Classic $59 · Platinum $119 · Gold $199',
    verticals: ['consumer', 'funeral', 'memorial', 'church', 'senior', 'genealogy', 'estate', 'veterans', 'museum', 'gift'],
  },
  {
    pkey: 'command',
    name: 'XPI Command Center™',
    solves:
      'Service businesses juggle leads, pricing, estimates, proposals, follow-ups, and pipeline across spreadsheets, email, and text. Brings those revenue operations into one business dashboard.',
    setup: null,
    monthly: null,
    price: 'Custom pricing (contact XPI)',
    verticals: ['cleaning', 'contractor', 'flooring', 'painter', 'landscaper', 'homeservice', 'consulting', 'sales', 'service'],
  },
  {
    pkey: 'vault',
    name: 'XPI Vault™',
    solves:
      'Consumers hunt across many sites for travel, dining, retail, and everyday discounts. One private place to check savings before they book or buy — and an ongoing membership relationship with XPI.',
    setup: 0,
    monthly: 0,
    price: '$5/year membership · $25 per concierge request',
    verticals: ['consumer', 'family', 'traveler', 'employer', 'association', 'membership', 'general'],
  },
  {
    pkey: 'agentic',
    name: 'XPI Agentic Experience Builder™',
    solves:
      'Dealerships have inventory, test-drive scheduling, financing, trade-ins, sales routing, and follow-up spread across disconnected processes; building a per-vehicle digital journey by hand is too costly. The dealer explains the rules once; XPI generates the connected windshield NFC/QR experience, lead routing, and workflow per vehicle.',
    setup: null,
    monthly: null,
    price: 'Custom pricing (contact XPI)',
    verticals: ['dealership', 'auto', 'dealergroup', 'fleet', 'rental'],
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
