/**
 * GameVault.jsx
 *
 * External game vault for the Pit Stop overlay.
 * Renders hand-picked, non-addictive browser games in sandboxed iframes.
 *
 * Game URL slots are intentionally blank (marked CONFIGURE_URL).
 * Add URLs in the VAULT array below once you have vetted them.
 * Each iframe uses a strict sandbox attribute for isolation.
 *
 * Props:
 *   onBack - callback to return to the main Pit Stop menu
 */

import React, { useState } from 'react';
import {
  SURFACE_CARD,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_BORDER,
} from '../../../theme/tokens';

// ─── Vault configuration ──────────────────────────────────────────────────────
// Add your vetted game URLs here. Each iframe is sandboxed.
// Leave url: '' to show a "Not configured" placeholder.

const VAULT = [
  {
    id: 'typing',
    title: 'Typing Practice',
    description: 'A calm typing drill to keep your hands warm without escalating stakes.',
    category: 'Focus',
    url: '', // CONFIGURE_URL: e.g. https://www.keybr.com
  },
  {
    id: 'chess-puzzle',
    title: 'Chess Puzzle',
    description: 'One puzzle, no timer. Pattern recognition, not competition.',
    category: 'Pattern',
    url: '', // CONFIGURE_URL: e.g. https://lichess.org/training
  },
  {
    id: 'nonogram',
    title: 'Nonogram / Picross',
    description: 'Grid logic puzzles. Calming, finite, no social pressure.',
    category: 'Logic',
    url: '', // CONFIGURE_URL: e.g. a self-hosted nonogram
  },
  {
    id: 'ambient',
    title: 'Ambient Sound Generator',
    description: 'Not a game. Background rain, coffee shop, or white noise to re-enter flow.',
    category: 'Recovery',
    url: '', // CONFIGURE_URL: e.g. https://mynoise.net
  },
];

const CATEGORY_COLOURS = {
  Focus:    '#10b981',
  Pattern:  '#3b82f6',
  Logic:    '#8b5cf6',
  Recovery: '#f59e0b',
};

export default function GameVault({ onBack }) {
  const [active, setActive] = useState(null);

  if (active) {
    const game = VAULT.find(g => g.id === active);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: `1px solid ${SURFACE_RAISED}` }}>
          <button
            type="button"
            onClick={() => setActive(null)}
            style={{ background: 'transparent', border: 'none', color: TEXT_MUTED, cursor: 'pointer', fontFamily: FONT_SYSTEM, fontSize: 10, padding: '2px 6px' }}
          >
            Back
          </button>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED }}>
            {game?.title}
          </span>
        </div>
        {game?.url ? (
          <iframe
            src={game.url}
            title={game.title}
            sandbox="allow-scripts allow-same-origin allow-forms"
            style={{ flex: 1, border: 'none', width: '100%' }}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT, textAlign: 'center' }}>
              URL not configured.
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
              Add a URL for "{game?.title}" in the VAULT array inside GameVault.jsx.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{ background: 'transparent', border: 'none', color: TEXT_MUTED, cursor: 'pointer', fontFamily: FONT_SYSTEM, fontSize: 10, padding: 0 }}
          >
            Back
          </button>
        )}
        <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_FAINT, margin: 0 }}>
          Game Vault
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
        {VAULT.map(game => {
          const catColour = CATEGORY_COLOURS[game.category] || ACCENT_PULSE;
          return (
            <button
              key={game.id}
              type="button"
              onClick={() => setActive(game.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS * 2, cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: catColour, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, margin: '0 0 2px' }}>{game.title}</p>
                <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, margin: 0, letterSpacing: '0.04em' }}>{game.description}</p>
              </div>
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: catColour }}>
                {game.category}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
