import React from 'react';
import { X } from 'lucide-react';
import { useSettings } from './SettingsContext';
import { useProject } from './ProjectContext';
import { getAvatarByStream } from './AvatarVault';
import { OVERLAY_MEDIUM } from '../theme/tokens';

/**
 * SteeringDrawer
 *
 * Right-side pull-out drawer that surfaces the four steering dials
 * the student uses to tune Simplifii's behaviour. Closed by default
 * so the cockpit stays in Compass Mode (CLAUDE.md rule 4); the
 * student opens it from the top-nav 'Steering' pill.
 *
 * The dials persist to localStorage through SettingsContext. New
 * AI prompts must read these before composing output (CLAUDE.md
 * 'Steering and Transparency' rule 3).
 *
 * Dials:
 *   Persona       Literal vs Academic. Toggles isLiteralMode.
 *   Scaffolding   Heavy / Balanced / Light. How many micro-steps
 *                 the OS surfaces per task.
 *   Grit          Literal Assistant / Balanced / Hard Socratic.
 *                 How long the OS probes before giving help.
 *   LOD           Compass / Sprint / Map. How much of the task
 *                 graph is visible at once. Compass shows one step;
 *                 Sprint shows today; Map shows everything.
 *
 * The drawer NEVER blocks the cockpit. It overlays the right edge
 * with a 320 px panel; the cockpit stays interactive behind it.
 */

const SegControl = ({ label, value, options, onChange, hint }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a3a3a3' }}>
        {label}
      </span>
    </div>
    <div role="radiogroup" aria-label={label} style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 4, background: '#0b0b0c', border: '1px solid #27272a', borderRadius: 10, padding: 4 }}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            title={opt.title}
            style={{
              padding: '8px 4px',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              borderRadius: 7,
              border: 'none',
              background: active ? '#10b981' : 'transparent',
              color: active ? '#0b1310' : '#d4d4d8',
              cursor: 'pointer',
              transition: 'all 120ms ease'
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
    {hint && <p style={{ fontSize: 10, color: '#71717a', marginTop: 6, lineHeight: 1.4 }}>{hint}</p>}
  </div>
);

export default function SteeringDrawer({ open, onClose }) {
  const {
    isLiteralMode, setIsLiteralMode,
    scaffoldingLevel, setScaffoldingLevel,
    gritLevel, setGritLevel,
    lodLevel, setLodLevel
  } = useSettings();
  const { stream } = useProject();
  const avatarName = stream?.getVocab?.('aura_avatar_name') || 'AURA';
  const StreamAvatar = getAvatarByStream(stream?.streamId, { gritLevel, ariaLabel: `${avatarName}: your steering companion` });

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: open ? 'rgba(0,0,0,0.45)' : 'transparent',
          pointerEvents: open ? 'auto' : 'none',
          transition: 'background 200ms ease',
          zIndex: 1500
        }}
      />
      <aside
        role="dialog"
        aria-label="Steering Drawer"
        aria-hidden={!open}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 340,
          maxWidth: '90vw',
          background: '#09090b',
          borderLeft: '1px solid #27272a',
          boxShadow: '-24px 0 60px rgba(0,0,0,0.5)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          zIndex: 1600,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <header style={{ padding: '20px 20px 16px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <StreamAvatar size={42} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#10b981' }}>Steering  ·  {avatarName}</div>
              <div style={{ fontSize: 12, color: '#a3a3a3', marginTop: 2 }}>You are the driver. {avatarName} is the GPS.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close steering drawer"
            style={{ background: 'transparent', border: 'none', color: '#a3a3a3', cursor: 'pointer', padding: 6, display: 'flex' }}
          >
            <X size={18} />
          </button>
        </header>

        <div style={{ padding: '20px 20px 32px', overflowY: 'auto', flex: 1 }}>
          <SegControl
            label="Persona"
            value={isLiteralMode ? 'literal' : 'academic'}
            onChange={(v) => setIsLiteralMode(v === 'literal')}
            options={[
              { value: 'literal',  label: 'Literal',  title: 'Plain English. No jargon. Best for Primary, Secondary, ESL.' },
              { value: 'academic', label: 'Academic', title: 'Discourse register. Discipline-specific terms intact.' }
            ]}
            hint={isLiteralMode ? 'LiteralMode is on. Vocabulary is being re-voiced at render time.' : 'Academic register. Discipline terms unchanged.'}
          />

          <SegControl
            label="Scaffolding"
            value={scaffoldingLevel}
            onChange={setScaffoldingLevel}
            options={[
              { value: 'heavy',    label: 'Heavy',    title: 'Many micro-steps. Surface every sub-task.' },
              { value: 'balanced', label: 'Balanced', title: 'A handful of next steps; bigger goals visible.' },
              { value: 'light',    label: 'Light',    title: 'Just the next big goal. You drive the rest.' }
            ]}
            hint="How granular the next-step list is."
          />

          <SegControl
            label="Grit"
            value={gritLevel}
            onChange={setGritLevel}
            options={[
              { value: 'literal',  label: 'Direct',   title: 'Literal Assistant. Answers up front; minimal probing.' },
              { value: 'balanced', label: 'Balanced', title: 'One Socratic probe before help arrives.' },
              { value: 'socratic', label: 'Socratic', title: 'Hard Socratic Mentor. Up to ten minutes of teasing before direct help.' }
            ]}
            hint="How long the OS probes before giving direct help."
          />

          <SegControl
            label="Level of Detail"
            value={lodLevel}
            onChange={setLodLevel}
            options={[
              { value: 'compass', label: 'Compass', title: 'One micro-step at a time. Everything else hidden.' },
              { value: 'sprint',  label: 'Sprint',  title: 'Today’s sprint visible. Future sprints hidden.' },
              { value: 'map',     label: 'Map',     title: 'Whole semester visible. Use sparingly.' }
            ]}
            hint="How much of the task graph is on screen. Compass is the calmest."
          />

          <div style={{ marginTop: 28, padding: 12, border: '1px solid #27272a', borderRadius: 10, background: '#0b0b0c' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#10b981', marginBottom: 6 }}>
              Why these dials
            </div>
            <p style={{ fontSize: 11, color: '#a3a3a3', lineHeight: 1.5, margin: 0 }}>
              Universities accept Simplifii because the student steers it visibly. These four dials are the steering wheel; the History of Thought log records every adjustment so the Authenticity Report can prove the student stayed in control.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
