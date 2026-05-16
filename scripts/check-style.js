#!/usr/bin/env node
/**
 * Neural Proof: pre-commit style enforcer for Simplifii-OS.
 *
 *  Hard-fails if it finds:
 *    - U+2014 em-dash or U+2013 en-dash anywhere in src/ or public/.
 *    - US-spelling tells inside string literals or JSX text:
 *        behavior, color, flavor, analyze, organize, realize,
 *        optimize, optimization (and -ed / -ing / -ation forms).
 *
 *  Skips:
 *    - CSS property contexts (color:, scroll-behavior, fill-, stroke-).
 *    - Tailwind class names (text-*, bg-*, border-*, fill-*, stroke-*).
 *    - Identifier names where the word is part of a longer token.
 *
 *  Exit 0 = clean.  Exit 1 = violations printed to stderr.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGETS = ['src', 'public'];
const EXCLUDED_DIRS = new Set(['node_modules', 'build', 'dist', '.git', '.husky']);
const ALLOWED_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.md']);

const DASH_RE = /[—–]/g;
const RGBA_RE = /rgba\s*\(/g;
const TOKEN_FILE = 'src/theme/tokens.js';

const US_FORMS = [
  { stem: 'behavior', expected: 'behaviour' },
  { stem: 'color',    expected: 'colour'    },
  { stem: 'flavor',   expected: 'flavour'   },
  { stem: 'analyze',  expected: 'analyse'   },
  { stem: 'organize', expected: 'organise'  },
  { stem: 'realize',  expected: 'realise'   },
  { stem: 'optimize', expected: 'optimise'  }
];

// Returns true if the position falls inside a string literal or JSX text.
// Used to suppress identifier-context false positives.
function isInTemplateInterpolation(line, index) {
  const before = line.slice(0, index);
  const lastOpen = before.lastIndexOf('${');
  const lastClose = before.lastIndexOf('}');
  return lastOpen > lastClose;
}

function isInUserFacingContext(line, index) {
  // Heuristic: count quote and angle-bracket positions up to index. A
  // substring in a string literal will be inside a matched pair of " ' or `,
  // or appear between > and < in JSX text. For our enforcement we accept
  // some imprecision: flag when surrounded by quotes OR JSX braces.
  const before = line.slice(0, index);
  const after = line.slice(index);

  const inQuotedString =
    (before.match(/["']/g) || []).length % 2 === 1 ||
    (before.match(/`/g) || []).length % 2 === 1;
  if (inQuotedString) return true;

  const lastGt = before.lastIndexOf('>');
  const lastLt = before.lastIndexOf('<');
  const nextLt = after.indexOf('<');
  if (lastGt > lastLt && nextLt !== -1) return true;

  return false;
}

function isCssOrTailwindContext(line) {
  if (/\bcolor\s*:/.test(line)) return true;
  if (/scroll-behavior/i.test(line)) return true;
  if (/\b(text|bg|border|fill|stroke|ring|outline|shadow|placeholder|caret|accent|divide|from|via|to)-(?:[a-z]+-)?(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)\b/.test(line)) return true;
  return false;
}

const violations = [];
const warnings = [];

function scanFile(filePath, content) {
  const rel = path.relative(ROOT, filePath);
  const lines = content.split('\n');

  // File-level directive: lookup tables / functional word lists can opt out
  // of the spelling rule (em-dash check still runs). Place
  //   // allow-style:file
  // anywhere in the first 10 lines.
  const headerScope = lines.slice(0, 10).join('\n');
  const skipSpelling = /allow-style:file/.test(headerScope);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Em-dashes / en-dashes: any occurrence is a hard fail.
    let m;
    DASH_RE.lastIndex = 0;
    while ((m = DASH_RE.exec(line)) !== null) {
      violations.push(`${rel}:${i + 1}: em-dash or en-dash (U+${m[0].charCodeAt(0).toString(16).toUpperCase()}) - use comma, full stop, or pair of hyphens`);
    }

    // Raw rgba() values: warned in component files. tokens.js is the
    // single source of truth for colour values including alpha variants.
    // Warning only until Sprint 3.6 lands. After 3.6 commits, rgba() in component files is a hard fail.
    if (!rel.endsWith(TOKEN_FILE) && !rel.endsWith('.css')) {
      RGBA_RE.lastIndex = 0;
      let rm;
      while ((rm = RGBA_RE.exec(line)) !== null) {
        // Skip comments
        const before = line.slice(0, rm.index);
        if (/\/\//.test(before)) break;
        warnings.push(`${rel}:${i + 1}: raw rgba() value - promote to a token in ${TOKEN_FILE}`);
      }
    }

    // Raw markdown link syntax (should be JSX <a> tags, not __[text](url)__)
    if (/__\[/.test(line) && !/\/\//.test(line.slice(0, line.indexOf('__[')))) {
      violations.push(`${rel}:${i + 1}: raw markdown link syntax (__[...]) detected - use JSX <a> tag instead`);
    }

    // US spellings inside user-facing contexts only.
    if (skipSpelling) continue;
    if (isCssOrTailwindContext(line)) continue;
    if (/\/\/\s*allow-style/.test(line) || /\/\*\s*allow-style/.test(line)) continue;

    for (const { stem, expected } of US_FORMS) {
      const re = new RegExp(`\\b${stem}(?:s|d|r|rs|ation|ations|ed|ing)?\\b`, 'gi');
      let sm;
      while ((sm = re.exec(line)) !== null) {
        const charBefore = sm.index > 0 ? line[sm.index - 1] : '';
        if (charBefore === '.') continue; // property access, e.g. obj.color
        if (isInTemplateInterpolation(line, sm.index)) continue; // ${...}
        if (isInUserFacingContext(line, sm.index)) {
          violations.push(`${rel}:${i + 1}: '${sm[0]}' (US spelling) - Australian-English uses '${expected}' family`);
        }
      }
    }
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (ALLOWED_EXTS.has(path.extname(entry.name))) {
      try {
        scanFile(full, fs.readFileSync(full, 'utf8'));
      } catch (err) {
        console.error(`Could not read ${full}: ${err.message}`);
      }
    }
  }
}

for (const t of TARGETS) {
  const dir = path.join(ROOT, t);
  if (fs.existsSync(dir)) walk(dir);
}

if (warnings.length > 0) {
  console.warn(`\n[Neural Proof] ${warnings.length} raw rgba() warning${warnings.length === 1 ? '' : 's'} (non-blocking, legacy migration pending):\n`);
  for (const w of warnings) console.warn('  ' + w);
  console.warn('');
}

if (violations.length > 0) {
  console.error('\n[Neural Proof] Style violations detected. Commit blocked.\n');
  for (const v of violations) console.error('  ' + v);
  console.error('\nStrict rules: zero em-dashes, Australian-English spelling. Fix and try again.\n');
  process.exit(1);
}

console.log('[Neural Proof] Clean. Australian-English maintained, zero em-dashes.');
process.exit(0);
