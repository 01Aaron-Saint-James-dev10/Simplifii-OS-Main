#!/usr/bin/env node
/**
 * Scans src/grounding/active/ and writes a JSON manifest that the
 * browser-side NeuralAuditPipeline can import at build time.
 */
const fs = require('fs');
const path = require('path');

const ACTIVE_DIR = path.resolve(__dirname, '../src/grounding/active');
const OUT_FILE = path.resolve(__dirname, '../src/grounding/activeManifest.json');

let filenames = [];
try {
  filenames = fs.readdirSync(ACTIVE_DIR);
} catch {
  // directory missing — write empty manifest
}

fs.writeFileSync(OUT_FILE, JSON.stringify(filenames, null, 2) + '\n');
console.log(`[build-grounding-manifest] Wrote ${filenames.length} entries to activeManifest.json`);
