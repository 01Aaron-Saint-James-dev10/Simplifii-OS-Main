/**
 * NeuralSnake.jsx
 *
 * Zinc/emerald line-aesthetic Snake game for the BrOWSER Pit Stop.
 * Rendered on HTML canvas. Snake head uses a mini BrOWSER geometric silhouette.
 * Eating a "Source" data point triggers emerald flame particles.
 *
 * Props:
 *   onExit  - callback when the player closes the game
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';

const GRID      = 22;
const TICK_MS   = 120;
const ZINC_950  = '#09090b';
const ZINC_800  = '#27272a';
const ZINC_700  = '#3f3f46';
const EMERALD   = '#10b981';
const EMERALD_G = 'rgba(16,185,129,0.4)';
const ROSE      = '#f43f5e';
const ROSE_G    = 'rgba(244,63,94,0.5)';

function randomCell(exclude = []) {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (exclude.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

function drawBrOWSERHead(ctx, cx, cy, r) {
  ctx.save();
  ctx.strokeStyle = EMERALD;
  ctx.lineWidth   = 1.5;
  ctx.shadowColor = EMERALD;
  ctx.shadowBlur  = 8;

  // Hex-ish head
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Crown spikes (3 small triangular notches)
  const spikeAngles = [-90, -30, -150];
  for (const deg of spikeAngles) {
    const rad = (deg * Math.PI) / 180;
    const sx  = cx + Math.cos(rad) * r;
    const sy  = cy + Math.sin(rad) * r;
    const ex  = cx + Math.cos(rad) * (r + 4);
    const ey  = cy + Math.sin(rad) * (r + 4);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }

  // Eyes
  ctx.fillStyle = EMERALD;
  ctx.shadowBlur = 0;
  const eyeR = Math.max(1, r * 0.18);
  ctx.beginPath();
  ctx.arc(cx - r * 0.28, cy - r * 0.12, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.28, cy - r * 0.12, eyeR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export default function NeuralSnake({ onExit }) {
  const canvasRef  = useRef(null);
  const snakeRef   = useRef([{ x: 11, y: 11 }, { x: 10, y: 11 }, { x: 9, y: 11 }]);
  const foodRef    = useRef({ x: 5, y: 7 });
  const dirRef     = useRef({ x: 1, y: 0 });
  const nextDirRef = useRef({ x: 1, y: 0 });
  const scoreRef   = useRef(0);
  const tickRef    = useRef(null);
  const particlesRef = useRef([]);
  const rafRef     = useRef(null);

  const [score,     setScore]     = useState(0);
  const [gameState, setGameState] = useState('idle'); // idle | playing | over

  function cellSize(canvas) {
    return Math.floor(Math.min(canvas.width, canvas.height) / GRID);
  }

  function draw(canvas) {
    const ctx  = canvas.getContext('2d');
    const W    = canvas.width;
    const H    = canvas.height;
    const cs   = cellSize(canvas);
    const offX = Math.floor((W - cs * GRID) / 2);
    const offY = Math.floor((H - cs * GRID) / 2);

    ctx.fillStyle = ZINC_950;
    ctx.fillRect(0, 0, W, H);

    // Grid border
    ctx.strokeStyle = ZINC_800;
    ctx.lineWidth   = 1;
    ctx.strokeRect(offX, offY, cs * GRID, cs * GRID);

    // Subtle grid dots
    ctx.fillStyle = ZINC_700;
    for (let gx = 0; gx < GRID; gx++) {
      for (let gy = 0; gy < GRID; gy++) {
        ctx.fillRect(offX + gx * cs + cs / 2 - 0.5, offY + gy * cs + cs / 2 - 0.5, 1, 1);
      }
    }

    const snake = snakeRef.current;

    // Snake body: connected emerald line
    if (snake.length > 1) {
      ctx.save();
      ctx.strokeStyle = EMERALD;
      ctx.lineWidth   = Math.max(2, cs * 0.35);
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.shadowColor = EMERALD_G;
      ctx.shadowBlur  = 6;
      ctx.beginPath();
      snake.forEach((seg, i) => {
        const px = offX + seg.x * cs + cs / 2;
        const py = offY + seg.y * cs + cs / 2;
        if (i === 0) ctx.moveTo(px, py);
        else         ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.restore();
    }

    // BrOWSER head
    const head = snake[0];
    const hx   = offX + head.x * cs + cs / 2;
    const hy   = offY + head.y * cs + cs / 2;
    drawBrOWSERHead(ctx, hx, hy, cs * 0.44);

    // Food (rose "Source" node)
    const food = foodRef.current;
    const fx   = offX + food.x * cs + cs / 2;
    const fy   = offY + food.y * cs + cs / 2;
    ctx.save();
    ctx.shadowColor = ROSE_G;
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = ROSE;
    ctx.beginPath();
    ctx.arc(fx, fy, cs * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle  = ROSE;
    ctx.font       = `bold ${Math.max(7, cs * 0.38)}px monospace`;
    ctx.textAlign  = 'center';
    ctx.fillText('src', fx, fy + cs * 0.75);
    ctx.restore();

    // Flame particles
    const now = Date.now();
    particlesRef.current = particlesRef.current.filter(p => now - p.born < 600);
    for (const p of particlesRef.current) {
      const t   = (now - p.born) / 600;
      const px  = p.sx + p.vx * t * 30;
      const py  = p.sy + p.vy * t * 30;
      const a   = 1 - t;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle   = EMERALD;
      ctx.shadowColor = EMERALD_G;
      ctx.shadowBlur  = 6;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(1, cs * 0.15 * (1 - t * 0.5)), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Score HUD
    ctx.fillStyle = EMERALD;
    ctx.font      = `bold 11px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${scoreRef.current}`, offX + 4, offY - 6);
  }

  function spawnParticles(canvas, fx, fy) {
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    const born   = Date.now();
    const cs     = cellSize(canvas);
    const offX   = Math.floor((canvas.width  - cs * GRID) / 2);
    const offY   = Math.floor((canvas.height - cs * GRID) / 2);
    const sx     = offX + fx * cs + cs / 2;
    const sy     = offY + fy * cs + cs / 2;
    for (const deg of angles) {
      const rad = (deg * Math.PI) / 180;
      particlesRef.current.push({ born, sx, sy, vx: Math.cos(rad), vy: Math.sin(rad) });
    }
  }

  const tick = useCallback(() => {
    dirRef.current = nextDirRef.current;
    const snake   = snakeRef.current;
    const head    = snake[0];
    const newHead = { x: head.x + dirRef.current.x, y: head.y + dirRef.current.y };

    if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
      clearInterval(tickRef.current);
      setGameState('over');
      return;
    }
    if (snake.slice(0, -1).some(s => s.x === newHead.x && s.y === newHead.y)) {
      clearInterval(tickRef.current);
      setGameState('over');
      return;
    }

    const food  = foodRef.current;
    const ate   = newHead.x === food.x && newHead.y === food.y;
    const newSnake = [newHead, ...snake];
    if (!ate) newSnake.pop();
    snakeRef.current = newSnake;

    if (ate) {
      scoreRef.current += 10;
      setScore(scoreRef.current);
      const oldFood = { ...food };
      foodRef.current = randomCell(newSnake);
      const canvas = canvasRef.current;
      if (canvas) spawnParticles(canvas, oldFood.x, oldFood.y);
    }
  }, []);

  // Render loop (independent of game tick for smooth particles)
  useEffect(() => {
    function loop() {
      const canvas = canvasRef.current;
      if (canvas) draw(canvas);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // eslint-disable-line

  function startGame() {
    snakeRef.current    = [{ x: 11, y: 11 }, { x: 10, y: 11 }, { x: 9, y: 11 }];
    foodRef.current     = randomCell(snakeRef.current);
    dirRef.current      = { x: 1, y: 0 };
    nextDirRef.current  = { x: 1, y: 0 };
    scoreRef.current    = 0;
    particlesRef.current = [];
    setScore(0);
    setGameState('playing');
    clearInterval(tickRef.current);
    tickRef.current = setInterval(tick, TICK_MS);
  }

  useEffect(() => {
    return () => { clearInterval(tickRef.current); cancelAnimationFrame(rafRef.current); };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handler = (e) => {
      if (gameState !== 'playing') return;
      const d = dirRef.current;
      if ((e.key === 'ArrowUp'    || e.key === 'w') && d.y !== 1)  nextDirRef.current = { x: 0, y: -1 };
      if ((e.key === 'ArrowDown'  || e.key === 's') && d.y !== -1) nextDirRef.current = { x: 0, y: 1 };
      if ((e.key === 'ArrowLeft'  || e.key === 'a') && d.x !== 1)  nextDirRef.current = { x: -1, y: 0 };
      if ((e.key === 'ArrowRight' || e.key === 'd') && d.x !== -1) nextDirRef.current = { x: 1, y: 0 };
      e.preventDefault();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameState]);

  // Fit canvas to container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: ZINC_950, borderRadius: 12, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ flex: 1, display: 'block', width: '100%' }}
        aria-label="BrOWSER Neural Snake game"
      />

      {/* Idle screen */}
      {gameState === 'idle' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 13, color: EMERALD, textAlign: 'center', margin: 0 }}>
            BrOWSER Neural Snake
          </p>
          <p style={{ fontFamily: 'monospace', fontSize: 10, color: ZINC_700, textAlign: 'center', margin: 0 }}>
            Eat the &quot;src&quot; nodes. Arrow keys or WASD.
          </p>
          <button onClick={startGame} style={{ padding: '8px 20px', background: 'transparent', border: `1px solid ${EMERALD}`, borderRadius: 6, fontFamily: 'monospace', fontSize: 11, color: EMERALD, cursor: 'pointer' }}>
            START
          </button>
        </div>
      )}

      {/* Game over screen */}
      {gameState === 'over' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'rgba(9,9,11,0.85)' }}>
          <p style={{ fontFamily: 'monospace', fontSize: 13, color: ROSE, margin: 0 }}>Connection Lost</p>
          <p style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: EMERALD, margin: 0 }}>{score}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={startGame} style={{ padding: '6px 16px', background: 'transparent', border: `1px solid ${EMERALD}`, borderRadius: 6, fontFamily: 'monospace', fontSize: 11, color: EMERALD, cursor: 'pointer' }}>
              Retry
            </button>
            {onExit && (
              <button onClick={onExit} style={{ padding: '6px 16px', background: 'transparent', border: `1px solid ${ZINC_700}`, borderRadius: 6, fontFamily: 'monospace', fontSize: 11, color: ZINC_700, cursor: 'pointer' }}>
                Exit
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
