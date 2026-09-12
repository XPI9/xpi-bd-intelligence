// ============================================================================
//  XPI PRODUCT CATALOG  (pain-first — matched on the problem, not the industry)
//  The AI may ONLY recommend products from this list, by pkey, and it NEVER
//  writes a price — prices are filled in from here, server-side.
//  `solves` = the PAIN a business feels, in plain words, so the AI recommends
//  the product when its research shows that prospect actually has the pain.
// ============================================================================

export const CATALOG = [
  {
    pkey: 'smartcard',
    name: 'XPI SmartCard™',
    solves:
      "Paper business cards get lost and prospects never follow up. There's no way to capture or track the person you just met, so networking and events don't turn into leads. Tap or scan to share your info instantly and drop the new contact straight into your system.",
    setup: 35, monthly: 10,
    price: '$35 card (one-time) + $10/mo',
    verticals: ['sales', 'insurance', 'realestate', 'consulting', 'contractor', 'barber', 'salon', 'restaurant', 'dealership', 'general'],
  },
  {
    pkey: 'formless',
    name: 'XPI FormLess™',
    solves:
      'Customers abandon long forms, leave required fields blank, and struggle to fill out PDFs on their phones — then staff waste hours retyping it into other systems. Intake becomes a simple question-by-question conversation that validates the answers, captures a signature, and drops the record into the CRM.',
    setup: null, monthly: null,
    price: 'Custom pricing (contact XPI)',
    verticals: ['childcare', 'school', 'insurance', 'healthcare', 'nonprofit', 'membership', 'contractor', 'financial', 'general'],
  },
  {
    pkey: 'growth',
    name: 'XPI Growth System™ — Website + Lead Infrastructure',
    solves:
      "The website looks fine but doesn't actually bring in or capture business. Leads trickle in from the site, phone, cards, and forms but land in different places, so inquiries get missed and follow-up falls apart. One connected loop captures every lead, routes it, and follows up.",
    setup: 459, monthly: 149,
    price: 'Starter $149/mo + $459 setup · Business $349/mo + $659 setup · Growth $549/mo + $899 setup · 24-mo',
    verticals: ['service', 'childcare', 'cleaning', 'contractor', 'insurance', 'consulting', 'restaurant', 'salon', 'healthcare', 'startup', 'general'],
  },
  {
    pkey: 'childcare',
    name: 'XPI Full Childcare Automation™',
    solves:
      'The center loses enrollments to missed calls, paper enrollment packets, manual tour scheduling, chasing documents, and endless front-desk busywork — and interested parents drop off before they ever enroll. Enrollment, tours, forms, documents, payments, parent messaging, and a 24/7 AI receptionist all run themselves.',
    setup: 459, monthly: 220,
    price: 'Starter from $459 start + $220/mo · Full/Center Suite to $404–$604/mo · hosting $360/yr',
    verticals: ['childcare', 'daycare', 'preschool', 'earlylearning', 'headstart'],
  },
  {
    pkey: 'eventvault',
    name: 'EventVault™',
    solves:
      'Events still run on clipboard check-ins, paper waivers, scattered forms, and sponsors who have no proof anyone engaged. There is no single place for the schedule, registration, waivers, or donations. One NFC/QR hub handles check-in, schedules, waivers, sponsors, and donations — and reports on it all afterward.',
    setup: 499, monthly: 149,
    price: 'Starter $499 · Pro $1,250 · Premium $2,500+ · optional $149–$299/mo support',
    verticals: ['events', 'sports', 'nonprofit', 'church', 'conference', 'festival', 'school', 'fundraiser', 'expo', 'community'],
  },
  {
    pkey: 'signage',
    name: 'XPI Smart-Signage™',
    solves:
      "People walk up to the business when it's closed, can't get answers, and leave without booking — and none of that foot traffic ever becomes a trackable lead. A tap or scan on the door, counter, or vehicle answers questions, books, and captures the lead 24/7.",
    setup: 129, monthly: 29,
    price: '$129 setup + $29/mo',
    verticals: ['restaurant', 'childcare', 'salon', 'barber', 'gym', 'clinic', 'contractor', 'dealership', 'retail', 'hotel', 'events', 'general'],
  },
  {
    pkey: 'setitsell',
    name: 'Set It & Sell™',
    solves:
      'You collect email addresses but never follow up. The list just sits there with no welcome, no nurture, and no offers — so you keep paying to get leads you never convert. Build your own automated email system that welcomes, nurtures, and sells on autopilot.',
    setup: 297, monthly: 0,
    price: '$297 one-time (founding cohort), then $497 · lifetime access',
    verticals: ['coaching', 'consulting', 'creator', 'course', 'service', 'ecommerce', 'general'],
  },
  {
    pkey: 'sitepulse',
    name: 'XPI SitePulse™ — Facility Maintenance & Operations',
    solves:
      'Maintenance problems get reported by text or word-of-mouth and slip through the cracks. No one can track repairs, vendor costs, approvals, asset history, or status across locations. A tap turns any issue into a documented work order with photos, assignments, approvals, and reporting.',
    setup: 499, monthly: 149,
    price: 'Pilot $499 setup + $149/mo · Core $749 + $199/mo · Dispatch $1,250 + $349/mo · Command from $599/mo',
    verticals: ['restaurant', 'childcare', 'school', 'church', 'hotel', 'property', 'retail', 'franchise', 'warehouse', 'gym', 'healthcare', 'facilities'],
  },
  {
    pkey: 'soultag',
    name: 'SoulTag™',
    solves:
      "Family stories, voices, photos, and the meaning behind a keepsake get lost over the generations, and there's no lasting place to keep them with the item itself. A tag attaches a permanent digital story — photos, audio, and memories — to the physical keepsake.",
    setup: 59, monthly: 0,
    price: 'Classic $59 · Platinum $119 · Gold $199',
    verticals: ['consumer', 'funeral', 'memorial', 'church', 'senior', 'genealogy', 'estate', 'veterans', 'museum', 'gift'],
  },
  {
    pkey: 'command',
    name: 'XPI Command Center™',
    solves:
      'Leads, pricing, estimates, proposals, follow-ups, and customer info are scattered across spreadsheets, texts, and email — so deals slip and nobody knows what is happening. One dashboard runs the whole pipeline: leads, quotes, follow-up, and customers in one place.',
    setup: null, monthly: null,
    price: 'Custom pricing (contact XPI)',
    verticals: ['cleaning', 'contractor', 'flooring', 'painter', 'landscaper', 'homeservice', 'consulting', 'sales', 'service'],
  },
  {
    pkey: 'vault',
    name: 'XPI Vault™',
    solves:
      "You hunt across a dozen websites for deals on travel, dining, retail, and everyday purchases, never sure you're getting the best price. One private place to check your savings before you book, buy, or go out — with a concierge to find deals for you.",
    setup: 0, monthly: 0,
    price: '$5/year membership · $25 per concierge request',
    verticals: ['consumer', 'family', 'traveler', 'employer', 'association', 'membership', 'general'],
  },
  {
    pkey: 'agentic',
    name: 'XPI Agentic Experience Builder™',
    solves:
      "A dealership's inventory, test-drives, financing, trade-ins, sales routing, and follow-up live in disconnected steps, and building a digital journey for every vehicle by hand is too slow and costly. Explain the rules once and every vehicle gets its own connected NFC/QR experience with lead routing built in.",
    setup: null, monthly: null,
    price: 'Custom pricing (contact XPI)',
    verticals: ['dealership', 'auto', 'dealergroup', 'fleet', 'rental'],
  },
  {
    pkey: 'vehicletap',
    name: 'XPI Vehicle Tap™',
    solves:
      "A branded vehicle — a work truck, a wrapped car, or a whole dealership lot — gets seen by thousands, but there's no way for an interested person to act in the moment. Nobody remembers a phone number off a moving truck, and shoppers walk a lot after hours with no way to get details, so all that attention is wasted and never becomes a lead. A tap or scan on any vehicle instantly shows info, pricing, and booking, and turns the person into a tracked lead 24/7.",
    setup: 99, monthly: 29,
    price: 'Single vehicle $99 setup + $29/mo · Dealership lots from $399 setup + $6/vehicle/mo (or $249/mo up to 50) · 24-mo',
    verticals: ['contractor', 'homeservice', 'cleaning', 'mobile', 'service', 'dealership', 'auto', 'general'],
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
