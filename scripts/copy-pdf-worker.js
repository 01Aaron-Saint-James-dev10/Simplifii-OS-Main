#!/usr/bin/env node
/**
 * Copies the pdf.js worker out of node_modules into public/ so the cockpit
 * can serve it from its own origin instead of fetching it from unpkg.com
 * at runtime. Going local fixes the
 *   "Failed to fetch dynamically imported module: pdf.worker.min.js"
 * crash, makes PDF parsing offline-capable, and matches the sovereign
 * privacy posture the rest of the OS already follows.
 *
 * Triggered automatically by npm install (postinstall), npm start
 * (prestart), and npm run build (prebuild). Safe to re-run; it
 * overwrites the destination.
 *
 * Handles both layouts:
 *   - pdfjs-dist 2.x/3.x ships pdf.worker.min.js (UMD, classic script)
 *   - pdfjs-dist 4.x ships pdf.worker.min.mjs   (ESM, module script)
 * The first matching candidate wins; the destination filename mirrors
 * the source extension so the dev server serves the correct MIME type.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

const CANDIDATES = [
  // 3.x and earlier: legacy UMD worker. This is the path the current
  // DocumentAIService.workerSrc points at, so it wins by default.
  { src: 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js', dest: 'pdf.worker.min.js' },
  { src: 'node_modules/pdfjs-dist/legacy/build/pdf.worker.js',     dest: 'pdf.worker.min.js' },
  { src: 'node_modules/pdfjs-dist/build/pdf.worker.min.js',        dest: 'pdf.worker.min.js' },
  { src: 'node_modules/pdfjs-dist/build/pdf.worker.js',            dest: 'pdf.worker.min.js' },
  // 4.x: ESM worker. Copied with .mjs extension so the dev server
  // serves it as a module script. DocumentAIService falls back to
  // /pdf.worker.min.mjs when the .js variant is missing.
  { src: 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs', dest: 'pdf.worker.min.mjs' },
  { src: 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',     dest: 'pdf.worker.min.mjs' },
  { src: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',        dest: 'pdf.worker.min.mjs' },
  { src: 'node_modules/pdfjs-dist/build/pdf.worker.mjs',            dest: 'pdf.worker.min.mjs' }
];

const found = CANDIDATES.find(({ src }) => fs.existsSync(path.join(ROOT, src)));
if (!found) {
  console.warn('[copy-pdf-worker] No pdf.worker file found in node_modules.');
  console.warn('[copy-pdf-worker] Run `npm install` to populate dependencies.');
  console.warn('[copy-pdf-worker] Tried:');
  CANDIDATES.forEach(({ src }) => console.warn('  -', src));
  process.exit(0);
}

if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
const sourcePath = path.join(ROOT, found.src);
const destPath = path.join(PUBLIC_DIR, found.dest);
fs.copyFileSync(sourcePath, destPath);
console.log(`[copy-pdf-worker] Copied ${found.src} -> public/${found.dest}`);
