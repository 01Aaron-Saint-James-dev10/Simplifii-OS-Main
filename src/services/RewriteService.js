/**
 * RewriteService.js
 *
 * Pluggable rewrite layer for the Academic Tools (Elevate Rigour, Synthesise,
 * Apply Logic Mode). Three providers behind one feature flag set in
 * localStorage.simplifii_rewrite_provider:
 *
 *   'local-mock' (default): deterministic level-aware transforms wrapped in
 *     a 2-second 'reasoning' delay so the cockpit feels like it is thinking.
 *
 *   'ollama': stub. Wires to localhost:11434 in a follow-up. Throws today
 *     so we can see the seam without pretending the real model is running.
 *
 * All providers dispatch simplifii:reasoning-start and simplifii:reasoning-end
 * events on window so the AURA Avatar can pulse faster while reasoning is in
 * flight. Per-section spinners live in the consumer (LinearCanvas).
 */

const PROVIDER_KEY = 'simplifii_rewrite_provider';
const DEFAULT_PROVIDER = 'local-mock';
const REASONING_MIN_MS = 2000;

export const REASONING_START_EVENT = 'simplifii:reasoning-start';
export const REASONING_END_EVENT = 'simplifii:reasoning-end';

// Level-tiered synonym sets. High-school prefers plain language; tertiary and
// up reach for academic register. Anything not in the tier keeps its original
// surface form.
const SYNONYMS_BASE = {
  'a lot of': 'many',
  'really': 'particularly',
  'big': 'significant',
  'shows': 'demonstrates',
  'gets': 'obtains',
  'uses': 'employs',
  'helps': 'supports',
  'looks at': 'examines',
  'finds': 'identifies',
  'thinks': 'argues',
  'so': 'therefore',
  'also': 'furthermore',
  'but': 'however'
};

const SYNONYMS_TERTIARY = {
  ...SYNONYMS_BASE,
  'a lot of': 'a substantial body of',
  'helps': 'facilitates',
  'big': 'considerable',
  'thinks': 'contends'
};

const SYNONYMS_BY_LEVEL = {
  highschool: SYNONYMS_BASE,
  university: SYNONYMS_TERTIARY,
  undergrad: SYNONYMS_TERTIARY,
  honours: SYNONYMS_TERTIARY,
  mres: SYNONYMS_TERTIARY,
  phd: SYNONYMS_TERTIARY
};

const swapByLevel = (text, level) => {
  const dict = SYNONYMS_BY_LEVEL[level] || SYNONYMS_TERTIARY;
  return Object.entries(dict).reduce(
    (acc, [from, to]) => acc.replace(new RegExp(`\\b${from}\\b`, 'gi'), to),
    text
  );
};

// Logic-mode prefixes. Maps the active mode id to a framing stem the
// rewrite leans into.
const LOGIC_FRAMES = {
  inst1: 'Comparing methodologies across the primary sources reviewed,',
  inst2: 'A critical gap remains in the literature, namely',
  inst3: 'Synthesising the evidence reviewed above,'
};

const localMock = {
  async elevateRigour(text, ctx = {}) {
    const swapped = swapByLevel(text, ctx.level);
    const opener = ctx.level === 'highschool'
      ? `Looking at this carefully, ${swapped.charAt(0).toLowerCase()}${swapped.slice(1)}`
      : `Drawing on the peer-reviewed literature, ${swapped.charAt(0).toLowerCase()}${swapped.slice(1)}`;
    return opener;
  },
  async synthesise(text, ctx = {}) {
    const swapped = swapByLevel(text, ctx.level);
    return `Synthesising the evidence reviewed above: ${swapped}`;
  },
  async applyLogicMode(text, mode, ctx = {}) {
    const frame = LOGIC_FRAMES[mode] || 'Working from the active logic frame:';
    const swapped = swapByLevel(text, ctx?.level);
    return `${frame} ${swapped}`;
  }
};

const notWired = (label) => async () => {
  throw new Error(`${label} provider not yet wired. Set localStorage.simplifii_rewrite_provider to 'local-mock' or finish the Ollama integration.`);
};

const ollama = {
  elevateRigour: notWired('ollama'),
  synthesise: notWired('ollama'),
  applyLogicMode: notWired('ollama')
};

const PROVIDERS = { 'local-mock': localMock, ollama };

export const getProviderName = () => {
  if (typeof window === 'undefined') return DEFAULT_PROVIDER;
  return localStorage.getItem(PROVIDER_KEY) || DEFAULT_PROVIDER;
};

const getProvider = () => {
  const name = getProviderName();
  return PROVIDERS[name] || PROVIDERS[DEFAULT_PROVIDER];
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function reason(method, args) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REASONING_START_EVENT));
  }
  const start = Date.now();
  try {
    const provider = getProvider();
    const result = await provider[method](...args);
    const elapsed = Date.now() - start;
    if (elapsed < REASONING_MIN_MS) await sleep(REASONING_MIN_MS - elapsed);
    return result;
  } finally {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(REASONING_END_EVENT));
    }
  }
}

export const elevateRigour = (text, ctx) => reason('elevateRigour', [text, ctx]);
export const synthesise = (text, ctx) => reason('synthesise', [text, ctx]);
export const applyLogicMode = (text, mode, ctx) => reason('applyLogicMode', [text, mode, ctx]);
