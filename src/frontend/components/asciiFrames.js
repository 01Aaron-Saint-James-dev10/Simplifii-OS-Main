/**
 * asciiFrames.js
 *
 * Generates 24 frames of ASCII art for the branded loader.
 * Pattern: rising/breathing sine wave that suggests thinking.
 * Aesthetic: emerald monospace on Obsidian (Zinc-950).
 *
 * Generated algorithmically at module load. Deterministic, no runtime cost
 * beyond the initial generation (cached in FRAMES constant).
 */

const WIDTH = 60;
const HEIGHT = 12;
const FRAME_COUNT = 24;
const CHARSET = ['.', ',', ':', ';', '-', '=', '+', '*', '\u2592', '\u2591', '\u2593'];

function generateFrames() {
  const frames = [];
  for (let t = 0; t < FRAME_COUNT; t++) {
    const rows = [];
    const phase = (t / FRAME_COUNT) * Math.PI * 2;
    for (let y = 0; y < HEIGHT; y++) {
      let row = '';
      for (let x = 0; x < WIDTH; x++) {
        const wave1 = Math.sin((x / WIDTH) * Math.PI * 2 + phase);
        const wave2 = Math.sin((x / WIDTH) * Math.PI * 4 - phase * 0.7);
        const verticalFade = y / HEIGHT;
        const combined = (wave1 * 0.6 + wave2 * 0.4 + 0.5);
        const density = Math.max(0, Math.min(1, combined * (1 - verticalFade)));
        if (density < 0.05) {
          row += ' ';
        } else {
          const charIndex = Math.floor(density * (CHARSET.length - 1));
          row += CHARSET[charIndex];
        }
      }
      rows.push(row);
    }
    frames.push(rows);
  }
  return frames;
}

export const FRAMES = generateFrames();

if (typeof console !== 'undefined') {
  console.info('[asciiFrames] generated', FRAMES.length, 'frames,', FRAMES[0].length, 'rows,', FRAMES[0][0].length, 'cols');
}
