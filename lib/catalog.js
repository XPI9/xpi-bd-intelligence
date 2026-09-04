// ============================================================================
//  CATALOG LOADER
//  Picks which product catalog the engine uses, based on BD_PROFILE:
//    BD_PROFILE=xpi   (default) -> lib/catalog.xpi.js   (the 12 XPI products)
//    BD_PROFILE=core            -> lib/catalog.core.js  (white-label template)
//  Everything else in the engine imports from here and doesn't care which.
// ============================================================================

const profile = (process.env.BD_PROFILE || 'xpi').toLowerCase();
const mod = await import(profile === 'core' ? './catalog.core.js' : './catalog.xpi.js');

export const CATALOG = mod.CATALOG;
export const CATALOG_MAP = mod.CATALOG_MAP;
export const catalogForPrompt = mod.catalogForPrompt;
export const productFor = mod.productFor;
