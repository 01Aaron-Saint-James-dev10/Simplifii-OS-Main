#!/usr/bin/env node
/**
 * Copies the pdf.js worker out of node_modules into public/ so the cockpit
 * can serve it from its own origin instead of fetching it from unpkg.com
 * at runtime. Going local fixes the
 *   "Failed to fetch dynamically imported module: pdf.worker.min.js"
 * crash, makes PDF parsing offline-capable, and matches the sovereign
 * privacy posture the rest of the OS already follows.
 *
 * Triggered automatically by npm install via the postinstall hook in
 * package.json. Safe to re-run; it overwrites the destination.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DEST = path.join(PUBLIC_DIR, 'pdf.worker.min.js');

// pdfjs-dist v4 ships the legacy UMD worker at multiple paths depending on
// the minor version. We probe the candidates in order and copy the first
// one we find.
const CANDIDATES = [
  'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js',
  'node_modules/pdfjs-dist/legacy/build/pdf.worker.js',
  'node_modules/pdfjs-dist/build/pdf.worker.min.js',
  'node_modules/pdfjs-dist/build/pdf.worker.js'
].map(rel => path.join(ROOT, rel));

const source = CANDIDATES.find(p => fs.existsSync(p));
if (!source) {
  console.warn('[copy-pdf-worker] No pdf.worker file found in node_modules. Skipping.');
  console.warn('[copy-pdf-worker] Tried:', CANDIDATES.join('\n  '));
  process.exit(0);
}

if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.copyFileSync(source, DEST);
console.log(`[copy-pdf-worker] Copied ${path.relative(ROOT, source)} -> ${path.relative(ROOT, DEST)}`);
