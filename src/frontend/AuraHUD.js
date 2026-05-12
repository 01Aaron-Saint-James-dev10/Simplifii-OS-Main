/**
 * AuraHUD
 *
 * Floating, draggable glass-morphism HUD for the AURA intelligence layer.
 * Native pointer events only. Zero dependencies added.
 *
 * Features:
 *   - Draggable via pointer events (no library)
 *   - Persona-driven dot colour + pulse animation from visualProfile
 *   - Nudge carousel (cycles on click)
 *   - Affiliate scaffold cards (Gamma.ai, Zotero) from toolIntentTags
 *   - Homeschool Import button (surfaces when homeschoolPlatform is set)
 *   - Minimal mode: single dot only until first friction detected
 *   - Auto-proposes Zen Monk / Anchor persona when CFS > 75
 *   - Stage C brain link: reads cognitiveFrictionScore from ProjectContext
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useProject } from './ProjectContext';
import { selectPersona, getNudge, getPersonaById } from '../core/Personas';
import { convertToSovereignFormat } from '../services/DocumentAIService';
import { auditCurriculum } from '../services/UDLAuditService';

// ============================================================
// Constants
// ============================================================

const DEFAULT_POS     = { x: 20, y: 120 };
const CFS_CRISIS      = 76;
const NUDGE_INTERVAL  = 30_000; // auto-advance nudge every 30 s

// Safe-harbour personas for CFS crisis
const CRISIS_PERSONA_IDS = ['zen_monk', 'anchor', 'therapist'];

// ============================================================
// Pulse animation keyframes injected once
// ============================================================

const PULSE_CSS = `
@keyframes aura-pulse-fast   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.35)} }
@keyframes aura-pulse-medium { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.2)} }
@keyframes aura-pulse-slow   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.12)} }
@keyframes aura-btn-glow {
  0%,100% { box-shadow: 0 0 0 1px rgba(16,185,129,0.12), 0 0 6px rgba(16,185,129,0.06); }
  50%     { box-shadow: 0 0 0 1px rgba(16,185,129,0.42), 0 0 18px rgba(16,185,129,0.22); }
}
.aura-import-btn {
  transition: background 0.2s ease;
}
.aura-import-btn-pulsing:not(:disabled) {
  animation: aura-btn-glow var(--aura-btn-pulse, 1.6s) ease-in-out infinite;
}
.aura-import-btn:hover:not(:disabled) {
  box-shadow: 0 0 0 1px rgba(16,185,129,0.4), 0 0 16px rgba(16,185,129,0.22) !important;
  background: #0f9d80 !important;
}
`;

let pulseInjected = false;
function injectPulseCSS() {
  if (pulseInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = PULSE_CSS;
  document.head.appendChild(el);
  pulseInjected = true;
}

const PULSE_ANIMATION = {
  fast:   'aura-pulse-fast   0.8s ease-in-out infinite',
  medium: 'aura-pulse-medium 1.6s ease-in-out infinite',
  slow:   'aura-pulse-slow   2.8s ease-in-out infinite',
  still:  'none',
};

// Maps dot pulse speed to the matching duration for the import button glow.
const PULSE_DURATIONS = { fast: '0.8s', medium: '1.6s', slow: '2.8s', still: null };

// ============================================================
// Component
// ============================================================

export default function AuraHUD() {
  injectPulseCSS();

  const { profile, updateProfile } = useProject();
  const {
    cognitiveFrictionScore = 0,
    toolIntentTags = [],
    emotionalBaseline,
    preferredMode,
    level,
    homeschoolPlatform,
    integrations = {},
  } = profile;

  // ---- State ----
  const [pos, setPos]                   = useState(DEFAULT_POS);
  const [isMinimal, setIsMinimal]       = useState(true);
  const [isExpanded, setIsExpanded]     = useState(false);
  const [nudgeIndex, setNudgeIndex]     = useState(0);
  const [persona, setPersona]           = useState(null);
  const [proposedPersona, setProposed]  = useState(null);
  const [isUpgrading, setIsUpgrading]   = useState(false);
  const [upgradeError, setUpgradeError] = useState(null);
  const [auditResult, setAuditResult]   = useState(null);

  // ---- Drag refs ----
  const hudRef    = useRef(null);
  const dragState = useRef({ active: false, startX: 0, startY: 0, ox: 0, oy: 0 });

  // ---- Persona selection ----
  useEffect(() => {
    const selected = selectPersona({
      emotionalBaseline,
      cognitiveFrictionScore,
      toolIntentTags,
      preferredMode,
      level,
    });
    setPersona(selected);
  }, [emotionalBaseline, cognitiveFrictionScore, toolIntentTags, preferredMode, level]);

  // ---- CFS crisis: auto-propose safe-harbour ----
  useEffect(() => {
    if (cognitiveFrictionScore >= CFS_CRISIS && persona) {
      const isSafe = CRISIS_PERSONA_IDS.includes(persona.id);
      if (!isSafe) {
        setProposed(getPersonaById('zen_monk'));
      }
    } else {
      setProposed(null);
    }
  }, [cognitiveFrictionScore, persona]);

  // ---- Expand from minimal when tags arrive ----
  useEffect(() => {
    if (toolIntentTags.length > 0 && isMinimal) {
      setIsMinimal(false);
    }
  }, [toolIntentTags]);

  // ---- Auto-advance nudge ----
  useEffect(() => {
    const id = setInterval(() => setNudgeIndex(i => i + 1), NUDGE_INTERVAL);
    return () => clearInterval(id);
  }, []);

  // ---- Drag: pointer events ----
  const onDragStart = useCallback((e) => {
    e.preventDefault();
    dragState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      ox: pos.x,
      oy: pos.y,
    };
    hudRef.current?.setPointerCapture(e.pointerId);
  }, [pos]);

  const onDragMove = useCallback((e) => {
    if (!dragState.current.active) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPos({
      x: Math.max(0, dragState.current.ox + dx),
      y: Math.max(0, dragState.current.oy + dy),
    });
  }, []);

  const onDragEnd = useCallback(() => {
    dragState.current.active = false;
  }, []);

  // ---- Helpers ----
  const acceptPersona = () => {
    if (proposedPersona) {
      setPersona(proposedPersona);
      setProposed(null);
    }
  };

  const dismissProposal = () => setProposed(null);

  const handleImportPlatform = async () => {
    if (isUpgrading) return;
    setIsUpgrading(true);
    setUpgradeError(null);
    try {
      // Retrieve the last ingested raw text from localStorage (written by the ingestion hook).
      const rawText = (() => {
        try { return localStorage.getItem('simplifii_last_raw_text') || ''; } catch { return ''; }
      })();
      if (rawText) {
        const ctx = {
          platform: (homeschoolPlatform || '').toLowerCase().replace(/\s/g, '_'),
          level: (level || 'secondary').toLowerCase(),
        };
        // Run audit and conversion. Audit is synchronous; conversion embeds results in YAML.
        const audit = auditCurriculum(rawText);
        const smContent = convertToSovereignFormat(rawText, ctx);
        setAuditResult(audit);
        try { localStorage.setItem('simplifii_last_sm', smContent); } catch { /* storage unavailable */ }
        window.dispatchEvent(new CustomEvent('sm-ready'));
      }
      if (typeof updateProfile === 'function') {
        updateProfile({ toolIntentTags: [...toolIntentTags, 'homeschool_transform'] });
      }
    } catch (err) {
      setUpgradeError('Upgrade failed. Please try again.');
      console.error('[AuraHUD] sovereign format conversion failed:', err);
    } finally {
      setIsUpgrading(false);
    }
  };

  const platformLabel = (() => {
    const map = {
      euka:         'Euka',
      khan_academy: 'Khan Academy',
      distance_ed:  'Distance Ed',
      other:        'Your Platform',
    };
    return map[(homeschoolPlatform || '').toLowerCase().replace(/\s/g, '_')] || 'Platform';
  })();

  if (!persona) return null;

  const vp      = persona.visualProfile;
  const pulse   = PULSE_ANIMATION[vp.pulseSpeed] || 'none';
  const nudge   = getNudge(persona, nudgeIndex);
  const showZotero = toolIntentTags.includes('zotero_upsell') && !integrations.zotero;
  const showGamma  = toolIntentTags.includes('gamma_upsell')  && !integrations.gamma;
  const showImport = !!homeschoolPlatform && toolIntentTags.includes('homeschool_mode');

  // ============================================================
  // Render: minimal dot only
  // ============================================================
  if (isMinimal) {
    return (
      <div
        ref={hudRef}
        style={{
          position: 'fixed',
          left: pos.x,
          top:  pos.y,
          zIndex: 9999,
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        title={`AURA: ${persona.name}`}
        aria-label={`AURA cognitive assistant: ${persona.name}`}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: vp.dotColour,
            animation: pulse,
            boxShadow: `0 0 8px ${vp.dotColour}88`,
          }}
        />
      </div>
    );
  }

  // ============================================================
  // Render: full HUD
  // ============================================================
  return (
    <div
      ref={hudRef}
      style={{
        position:       'fixed',
        left:           pos.x,
        top:            pos.y,
        zIndex:         9999,
        width:          288,
        background:     'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border:         '1px solid rgba(0,0,0,0.08)',
        borderRadius:   10,
        boxShadow:      '0 8px 32px rgba(0,0,0,0.10)',
        overflow:       'hidden',
        touchAction:    'none',
        userSelect:     'none',
        fontFamily:     "'Inter', sans-serif",
      }}
    >
      {/* --- Drag handle / header --- */}
      <div
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          8,
          padding:      '8px 10px',
          background:   vp.hudTint,
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          cursor:       'grab',
        }}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
      >
        <div
          style={{
            width: 10, height: 10,
            borderRadius: '50%',
            backgroundColor: vp.dotColour,
            animation: pulse,
            flexShrink: 0,
            boxShadow: `0 0 6px ${vp.dotColour}99`,
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', flex: 1 }}>
          {persona.avatar} {persona.name}
        </span>
        <button
          onClick={() => setIsExpanded(e => !e)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#9ca3af', padding: '0 2px' }}
          aria-label={isExpanded ? 'Collapse AURA' : 'Expand AURA'}
        >
          {isExpanded ? '▲' : '▼'}
        </button>
        <button
          onClick={() => setIsMinimal(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#9ca3af', padding: '0 2px' }}
          aria-label="Minimise AURA"
        >
          ×
        </button>
      </div>

      {/* --- Nudge message --- */}
      <div
        style={{ padding: '10px 12px', borderBottom: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer' }}
        onClick={() => setNudgeIndex(i => i + 1)}
        title="Click for next nudge"
      >
        <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
          {nudge}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 10, color: '#9ca3af' }}>
          {persona.primaryStrategy}
        </p>
      </div>

      {/* --- Crisis persona proposal --- */}
      {proposedPersona && (
        <div style={{ padding: '8px 12px', background: 'rgba(249,115,22,0.06)', borderBottom: '1px solid rgba(249,115,22,0.12)' }}>
          <p style={{ margin: '0 0 6px', fontSize: 11, color: '#92400e', lineHeight: 1.4 }}>
            High friction detected. Switch to {proposedPersona.avatar} {proposedPersona.name}?
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={acceptPersona} style={btnStyle('#f59e0b', '#fff')}>Switch</button>
            <button onClick={dismissProposal} style={btnStyle('transparent', '#6b7280', '1px solid #e5e7eb')}>Not now</button>
          </div>
        </div>
      )}

      {/* --- Expanded details --- */}
      {isExpanded && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <p style={{ margin: 0, fontSize: 10, color: '#6b7280', lineHeight: 1.5 }}>
            <strong>Goal:</strong> {persona.goal}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: '#6b7280', lineHeight: 1.5 }}>
            <strong>CFS:</strong> {cognitiveFrictionScore ?? 'n/a'}/100
          </p>
        </div>
      )}

      {/* --- Homeschool Import button --- */}
      {showImport && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <button
            onClick={handleImportPlatform}
            disabled={isUpgrading}
            className={`aura-import-btn${!isUpgrading && PULSE_DURATIONS[vp.pulseSpeed] ? ' aura-import-btn-pulsing' : ''}`}
            style={{
              ...btnStyle(isUpgrading ? '#6b7280' : '#0d9488', '#fff', undefined, true),
              ...(PULSE_DURATIONS[vp.pulseSpeed] && { '--aura-btn-pulse': PULSE_DURATIONS[vp.pulseSpeed] }),
            }}
          >
            {isUpgrading ? 'Upgrading to Sovereign Format...' : `Import from ${platformLabel}`}
          </button>
          {upgradeError && (
            <p style={{ margin: '4px 0 0', fontSize: 10, color: '#dc2626' }}>{upgradeError}</p>
          )}
          {!upgradeError && (
            <p style={{ margin: '4px 0 0', fontSize: 10, color: '#6b7280' }}>
              {isUpgrading
                ? 'Converting to .sm format. This takes a few seconds.'
                : `Convert your ${platformLabel} curriculum to UDL 3.0 format.`}
            </p>
          )}
        </div>
      )}

      {/* --- UDL 3.0 Audit result --- */}
      {auditResult && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.05)', background: auditResult.criticalCount > 0 ? 'rgba(239,68,68,0.04)' : 'rgba(16,185,129,0.04)' }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: auditResult.criticalCount > 0 ? '#b91c1c' : '#065f46', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            UDL 3.0 Lens Applied
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#374151', lineHeight: 1.5 }}>
            {auditResult.barrierCount === 0
              ? `This lesson meets AHEAD Ireland UDL compliance. Score: ${auditResult.udl3Score}/100.`
              : `${auditResult.barrierCount} barrier${auditResult.barrierCount !== 1 ? 's' : ''} detected (${auditResult.criticalCount} critical, ${auditResult.highCount} high). UDL score: ${auditResult.udl3Score}/100. Teacher notes added to .sm file.`
            }
          </p>
          {auditResult.criticalCount > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 10, color: '#6b7280' }}>
              {auditResult.systemicExclusions[0]}
            </p>
          )}
        </div>
      )}

      {/* --- Affiliate scaffold cards --- */}
      {(showGamma || showZotero) && (
        <div style={{ padding: '8px 12px' }}>
          <p style={{ margin: '0 0 6px', fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Cognitive Scaffold
          </p>
          {showGamma && (
            <AffiliateCard
              label="Gamma.ai"
              sub="AI-powered presentations from your notes"
              href="#"
              colour="#7c3aed"
            />
          )}
          {showZotero && (
            <AffiliateCard
              label="Zotero"
              sub="Free reference manager: cite as you write"
              href="https://www.zotero.org"
              colour="#0d9488"
            />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// AffiliateCard sub-component
// ============================================================

function AffiliateCard({ label, sub, href, colour }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            8,
        padding:        '6px 8px',
        marginBottom:   6,
        background:     `${colour}0f`,
        border:         `1px solid ${colour}33`,
        borderRadius:   6,
        textDecoration: 'none',
        cursor:         'pointer',
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colour, flexShrink: 0 }} />
      <div>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#374151' }}>{label}</p>
        <p style={{ margin: 0, fontSize: 10, color: '#6b7280' }}>{sub}</p>
      </div>
    </a>
  );
}

// ============================================================
// Style helper
// ============================================================

function btnStyle(bg, color, border, full = false) {
  return {
    background:    bg,
    color:         color,
    border:        border || 'none',
    borderRadius:  4,
    padding:       '4px 10px',
    fontSize:      11,
    fontWeight:    700,
    cursor:        'pointer',
    width:         full ? '100%' : 'auto',
    textAlign:     'center',
  };
}
