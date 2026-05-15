import React, { useRef, useEffect } from 'react';

const COL_WIDTH = 14;
const FONT = '12px JetBrains Mono, ui-monospace, monospace';
const GLYPHS = '0123456789ABCDEF<>{}[]/|\\=+-*#@$%&?';
const FPS_CAP = 22;
const FADE_ALPHA = 0.10;

/**
 * MatrixRain
 *
 * Fullscreen canvas-based falling character effect.
 * Theme-reactive: reads --sov-line and --sov-bg from CSS variables
 * so the rain auto-recolours when the theme changes.
 *
 * Respects prefers-reduced-motion: renders nothing when enabled.
 * Pauses when tab is hidden (saves battery).
 * aria-hidden="true" so screen readers skip it entirely.
 */
export default function MatrixRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Respect reduced motion
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let cols, drops, W, H, dpr, raf, lastDraw = 0;

    function getThemeColours() {
      const style = getComputedStyle(document.documentElement);
      return {
        line: style.getPropertyValue('--sov-line').trim() || '#10b981',
        bg: style.getPropertyValue('--sov-bg').trim() || '#09090b',
      };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / COL_WIDTH);
      drops = new Array(cols).fill(0).map(() => Math.random() * -50);
    }
    resize();
    window.addEventListener('resize', resize);

    function draw(t) {
      raf = requestAnimationFrame(draw);
      if (t - lastDraw < 1000 / FPS_CAP) return;
      lastDraw = t;

      const { line, bg } = getThemeColours();

      // Trail fade
      ctx.fillStyle = bg;
      ctx.globalAlpha = FADE_ALPHA;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;

      ctx.font = FONT;
      ctx.textBaseline = 'top';

      for (let i = 0; i < cols; i++) {
        const x = i * COL_WIDTH;
        const y = drops[i] * COL_WIDTH;
        const ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

        // Bright head glyph
        ctx.fillStyle = line;
        ctx.shadowColor = line;
        ctx.shadowBlur = 6;
        ctx.fillText(ch, x, y);

        // Dim trailing glyph
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.45;
        ctx.fillText(
          GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          x,
          y - COL_WIDTH
        );
        ctx.globalAlpha = 1;

        // Advance or reset column
        if (y > H && Math.random() > 0.972) {
          drops[i] = Math.random() * -20;
        } else {
          drops[i] += 0.95 + Math.random() * 0.4;
        }
      }
      ctx.shadowBlur = 0;
    }
    raf = requestAnimationFrame(draw);

    // Pause when tab hidden
    const visHandler = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(draw);
    };
    document.addEventListener('visibilitychange', visHandler);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visHandler);
    };
  }, []);

  return (
    <div
      className="matrix-rain"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.32,
        mixBlendMode: 'screen',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
