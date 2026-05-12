import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';

/**
 * NeuroProfiler - Stage 01: Neuro-Profiler Handshake
 *
 * A 4-step, tile-driven wizard that builds the learner profile immediately
 * after Google OAuth completes. No passphrases. No typing until Step 4.
 *
 * Steps:
 *   1. Cognitive Preference     -> profile.preferredMode
 *   2. Emotional Baseline       -> profile.emotionalBaseline
 *   3. Academic Level           -> profile.level
 *   4. Institutional Lock       -> profile.institution / profile.referencingStyle
 *
 * Exports:
 *   default NeuroProfiler       the wizard component
 *   BASELINE_STRATEGY           map of emotional state to AURA adaptation rules
 *   deriveReferencingStyle(str) institution -> default referencing style
 *
 * Props:
 *   onComplete {Function(profile)} called with the completed profile object
 *   userName   {string}           display name from Google auth (optional)
 */

// ------------------------------------------------------------
// Data
// ------------------------------------------------------------

/**
 * BASELINE_STRATEGY is exported so AURA can read it at task-initiation time.
 * microTasksOnly: true -> show only 1 Pareto micro-step instead of the full roadmap.
 * lodLevel: 'compass' -> minimalist LOD; 'map' -> full overview LOD.
 */
export const BASELINE_STRATEGY = {
  overwhelmed: { mode: 'deep_focus', microTasksOnly: true,  lodLevel: 'compass' },
  on_top:      { mode: 'standard',   microTasksOnly: false, lodLevel: 'map' },
  starting:    { mode: 'visual',     microTasksOnly: false, lodLevel: 'map' },
  burned_out:  { mode: 'literal',    microTasksOnly: true,  lodLevel: 'compass' },
};

const INSTITUTION_REFERENCING = {
  UNSW:    'Harvard',
  USyd:    'APA 7',
  UQ:      'APA 7',
  Monash:  'APA 7',
  UMelb:   'APA 7',
  RMIT:    'Harvard',
  UTS:     'Harvard',
  ACU:     'APA 7',
};

export function deriveReferencingStyle(institution) {
  return INSTITUTION_REFERENCING[institution] || 'Harvard';
}

const AU_INSTITUTIONS = ['UNSW', 'USyd', 'UQ', 'Monash', 'UMelb', 'RMIT', 'UTS', 'ACU'];

// ------------------------------------------------------------
// Step definitions
// ------------------------------------------------------------

const COGNITIVE_OPTIONS = [
  {
    id: 'literal',
    label: 'Plain words',
    sub: 'Clear, direct language with no jargon',
    dot: 'bg-indigo-500',
  },
  {
    id: 'visual',
    label: 'Diagrams and steps',
    sub: 'Visual guides and structured checklists',
    dot: 'bg-emerald-500',
  },
  {
    id: 'deep_focus',
    label: 'Just the essentials',
    sub: 'Minimal interface, one task at a time',
    dot: 'bg-zinc-400',
  },
];

const EMOTIONAL_OPTIONS = [
  {
    id: 'overwhelmed',
    label: 'Overwhelmed',
    sub: 'Too much, not sure where to start',
    dot: 'bg-amber-500',
  },
  {
    id: 'on_top',
    label: 'On Top of It',
    sub: 'I have a clear picture of what to do',
    dot: 'bg-emerald-500',
  },
  {
    id: 'starting',
    label: 'Just Starting',
    sub: 'Early days, feeling okay',
    dot: 'bg-blue-400',
  },
  {
    id: 'burned_out',
    label: 'Burned Out',
    sub: 'Running on empty right now',
    dot: 'bg-rose-500',
  },
];

const LEVEL_OPTIONS = [
  { id: 'Primary',    label: 'Primary',    sub: 'K-6' },
  { id: 'Secondary',  label: 'Secondary',  sub: 'Years 7-12' },
  { id: 'University', label: 'University', sub: 'Undergraduate' },
  { id: 'Postgrad',   label: 'Postgrad',   sub: 'Masters or PhD' },
  { id: 'TAFE',       label: 'TAFE',       sub: 'Vocational education' },
  { id: 'Homeschool', label: 'Homeschool', sub: 'Parent or child' },
];

// ------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------

function ProgressBar({ step, total }) {
  return (
    <div className="flex items-center gap-2 mb-10" role="progressbar" aria-valuenow={step} aria-valuemax={total} aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i < step ? 'bg-emerald-500' : 'bg-zinc-200'}`}
        />
      ))}
    </div>
  );
}

function TileGrid({ options, onSelect, selected, columns = 2 }) {
  const gridClass = columns === 3
    ? 'grid grid-cols-3 gap-3'
    : 'grid grid-cols-2 gap-3';

  return (
    <div className={gridClass}>
      {options.map((opt) => {
        const isSelected = selected === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={`text-left p-4 border-2 rounded-lg transition-all focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              isSelected
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-zinc-200 bg-white hover:border-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {opt.dot && <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.dot}`} aria-hidden="true" />}
              {isSelected && <CheckCircle2 size={14} className="text-emerald-600 ml-auto" />}
            </div>
            <p className="text-sm font-bold text-zinc-900 leading-snug">{opt.label}</p>
            {opt.sub && <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{opt.sub}</p>}
          </button>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// Main component
// ------------------------------------------------------------

const TOTAL_STEPS = 4;

export default function NeuroProfiler({ onComplete, userName }) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    preferredMode: null,
    emotionalBaseline: null,
    level: null,
    institution: '',
    referencingStyle: 'Harvard',
    integrations: { zotero: false, mendeley: false },
    consents: { dataSharing: false },
  });

  // Tile selections auto-advance on click.
  const handleTileSelect = (field, value) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    // Short pause so the selected tile highlights before the step changes.
    setTimeout(() => setStep(s => s + 1), 220);
  };

  // Step 4 institution chips and text input do NOT auto-advance.
  const handleInstitutionSelect = (name) => {
    setProfile(p => ({
      ...p,
      institution: name,
      referencingStyle: deriveReferencingStyle(name),
    }));
  };

  const toggleIntegration = (key) => {
    setProfile(p => ({
      ...p,
      integrations: { ...p.integrations, [key]: !p.integrations[key] },
    }));
  };

  const toggleConsent = () => {
    setProfile(p => ({
      ...p,
      consents: { ...p.consents, dataSharing: !p.consents.dataSharing },
    }));
  };

  const handleInstitutionInput = (e) => {
    const val = e.target.value;
    setProfile(p => ({
      ...p,
      institution: val,
      referencingStyle: deriveReferencingStyle(val.trim()),
    }));
  };

  const handleComplete = () => {
    onComplete(profile);
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
    exit:    { opacity: 0, x: -20, transition: { duration: 0.15 } },
  };

  const greeting = userName ? `Hi ${userName.split(' ')[0]}.` : 'Welcome.';

  return (
    <div className="w-full max-w-md mx-auto">
      <ProgressBar step={step} total={TOTAL_STEPS} />

      <AnimatePresence mode="wait">

        {/* Step 1: Cognitive Preference */}
        {step === 1 && (
          <motion.div key="step-1" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Step 1 of 4</p>
            <h2 className="text-xl font-bold text-zinc-900 mb-1">{greeting}</h2>
            <p className="text-sm text-zinc-600 mb-6">
              When you get instructions, what helps most?
            </p>
            <TileGrid
              options={COGNITIVE_OPTIONS}
              selected={profile.preferredMode}
              onSelect={(val) => handleTileSelect('preferredMode', val)}
              columns={3}
            />
          </motion.div>
        )}

        {/* Step 2: Emotional Baseline */}
        {step === 2 && (
          <motion.div key="step-2" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Step 2 of 4</p>
            <h2 className="text-xl font-bold text-zinc-900 mb-1">Current state check.</h2>
            <p className="text-sm text-zinc-600 mb-6">
              How are you feeling about your workload right now?
            </p>
            <TileGrid
              options={EMOTIONAL_OPTIONS}
              selected={profile.emotionalBaseline}
              onSelect={(val) => handleTileSelect('emotionalBaseline', val)}
              columns={2}
            />
            <p className="mt-4 text-[11px] text-zinc-400 text-center">
              No wrong answers. This helps the OS calibrate what to show you first.
            </p>
          </motion.div>
        )}

        {/* Step 3: Academic Level */}
        {step === 3 && (
          <motion.div key="step-3" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Step 3 of 4</p>
            <h2 className="text-xl font-bold text-zinc-900 mb-1">What level are you studying?</h2>
            <p className="text-sm text-zinc-600 mb-6">
              This sets the default scaffolding, citation style, and task depth.
            </p>
            <TileGrid
              options={LEVEL_OPTIONS}
              selected={profile.level}
              onSelect={(val) => handleTileSelect('level', val)}
              columns={2}
            />
          </motion.div>
        )}

        {/* Step 4: Institutional Lock + Integrations + Consent */}
        {step === 4 && (
          <motion.div key="step-4" variants={stepVariants} initial="initial" animate="animate" exit="exit">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Step 4 of 4</p>
            <h2 className="text-xl font-bold text-zinc-900 mb-1">Which institution?</h2>
            <p className="text-sm text-zinc-600 mb-5">
              Sets the default referencing style for your exports. You can change this later.
            </p>

            {/* Quick-select chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {AU_INSTITUTIONS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleInstitutionSelect(name)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full border-2 transition-all focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                    profile.institution === name
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                  }`}
                >
                  {name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleInstitutionSelect('None')}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border-2 transition-all focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                  profile.institution === 'None'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                }`}
              >
                None / Other
              </button>
            </div>

            {/* Free-text fallback */}
            <input
              type="text"
              value={profile.institution === 'None' ? '' : profile.institution}
              onChange={handleInstitutionInput}
              placeholder="Or type your institution..."
              className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus-visible:ring-3 focus-visible:ring-emerald-500 mb-2"
              aria-label="Institution name"
            />

            {profile.institution && profile.institution !== 'None' && (
              <p className="text-[11px] text-zinc-400 mb-5">
                Default referencing style: <span className="font-bold text-zinc-600">{profile.referencingStyle}</span>
              </p>
            )}

            {/* Research Tool Integrations */}
            <div className="border-t border-zinc-100 pt-5 mb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Research Tools (optional)</p>
              <div className="flex gap-3 mb-4">
                {[
                  { key: 'zotero',   label: 'Zotero',   sub: 'Citation manager' },
                  { key: 'mendeley', label: 'Mendeley', sub: 'Reference manager' },
                ].map(({ key, label, sub }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleIntegration(key)}
                    className={`flex-1 text-left p-3 border-2 rounded-lg transition-all focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                      profile.integrations[key]
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    <p className="text-xs font-bold text-zinc-900">{label}</p>
                    <p className="text-[11px] text-zinc-500">{sub}</p>
                  </button>
                ))}
              </div>

              {/* Gamma.ai recommendation slot.
                  TODO: replace href="#" with your Gamma.ai affiliate link
                  once you have registered at gamma.app and obtained your
                  referral code (e.g. https://gamma.app?ref=YOUR_CODE). */}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border border-dashed border-zinc-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50/50 transition-all group"
                aria-label="Recommended: Gamma.ai presentation tool (affiliate)"
              >
                <div>
                  <p className="text-xs font-bold text-zinc-700 group-hover:text-emerald-700">Gamma.ai</p>
                  <p className="text-[11px] text-zinc-400">AI-powered presentations for your assessments</p>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-emerald-400 border border-current rounded px-1.5 py-0.5">
                  Recommended
                </span>
              </a>
            </div>

            {/* Consent checkbox. Required to proceed.
                Note: consent paired with app access has weaker standing under
                the Australian Privacy Act than freely-given opt-in. Add
                "You can change this in Settings at any time" to strengthen
                your consent position before launch. */}
            <div className="border-t border-zinc-100 pt-5 mb-5">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={profile.consents.dataSharing}
                  onChange={toggleConsent}
                  className="mt-0.5 w-4 h-4 accent-emerald-600 shrink-0 cursor-pointer"
                  aria-describedby="consent-desc"
                />
                <span id="consent-desc" className="text-[11px] text-zinc-600 leading-relaxed">
                  I consent to my anonymised, de-identified study patterns being used for educational research.{' '}
                  <span className="text-zinc-400">You can change this in Settings at any time.</span>
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleComplete}
              disabled={!profile.consents.dataSharing}
              className="w-full py-4 bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wide rounded-lg transition-all focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Enter Simplifii-OS
            </button>

            <p className="mt-3 text-[11px] text-zinc-400 text-center">
              Institution and tool settings are adjustable from the cockpit.
            </p>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Back navigation (not shown on Step 1) */}
      {step > 1 && (
        <button
          type="button"
          onClick={() => setStep(s => s - 1)}
          className="mt-8 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-700 transition-colors focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none rounded px-1 py-0.5"
        >
          <ChevronLeft size={14} />
          Back
        </button>
      )}
    </div>
  );
}
