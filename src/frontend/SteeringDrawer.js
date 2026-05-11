import React from 'react';
import { X } from 'lucide-react';
import { useSettings } from './SettingsContext';
import { useProject } from './ProjectContext';
import { getAvatarByStream } from './AvatarVault';

/**
 * SteeringDrawer
 *
 * Right-side pull-out drawer that surfaces the four steering dials
 * the student uses to tune Simplifii's behaviour.
 */

const SegControl = ({ label, value, options, onChange, hint }) => (
  <div className="mb-5">
    <div className="flex justify-between items-baseline mb-2">
      <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
        {label}
      </span>
    </div>
    <div 
      role="radiogroup" 
      aria-label={label} 
      className="grid gap-1 bg-muted/50 border border-border rounded-xl p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
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
            className={`py-2 px-1 text-[10px] font-bold tracking-wider uppercase rounded-lg border-none transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              active 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-transparent text-foreground hover:bg-muted'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
    {hint && <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">{hint}</p>}
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

  // Handle escape key to close
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 z-[1500] ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      
      {/* Drawer Panel */}
      <aside
        role="dialog"
        aria-label="Steering Drawer"
        aria-modal="true"
        aria-hidden={!open}
        className={`fixed top-0 right-0 h-screen w-[340px] max-w-[90vw] bg-card border-l border-border shadow-2xl z-[1600] flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <header className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StreamAvatar size={42} />
            <div>
              <div className="text-[11px] font-bold tracking-widest uppercase text-primary">
                Steering / {avatarName}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                You are the driver. {avatarName} is the GPS.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close steering drawer"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X size={18} />
          </button>
        </header>

        {/* Controls */}
        <div className="p-5 overflow-y-auto flex-1">
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
              { value: 'sprint',  label: 'Sprint',  title: "Today's sprint visible. Future sprints hidden." },
              { value: 'map',     label: 'Map',     title: 'Whole semester visible. Use sparingly.' }
            ]}
            hint="How much of the task graph is on screen. Compass is the calmest."
          />

          {/* Info Card */}
          <div className="mt-6 p-4 border border-border rounded-xl bg-muted/30">
            <div className="text-[10px] font-bold tracking-widest uppercase text-primary mb-2">
              Why these dials
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Universities accept Simplifii because the student steers it visibly. These four dials are the steering wheel; the History of Thought log records every adjustment so the Authenticity Report can prove the student stayed in control.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
