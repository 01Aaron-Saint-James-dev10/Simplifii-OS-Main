import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * NeuroProfiler
 *
 * 4-step handshake wizard (5 steps for the Homeschool branch).
 * Linear-app aesthetic: sharp 1px borders, #18181b zinc surfaces,
 * JetBrains Mono labels, sticky nav footer so Complete is never cut off.
 *
 * Steps:
 *   1  Processing Style     profile.preferredMode
 *   2  Emotional Baseline   profile.emotionalBaseline
 *   3  Academic Level       profile.level
 *   3.5 (Homeschool only)   profile.homeschoolPlatform
 *   4  Institution Lock     profile.institution / profile.referencingStyle
 *
 * Props:
 *   onComplete {Function(profile)}   called with the completed profile
 *   userName   {string}              display name from Google auth
 */

// ============================================================
// Data
// ============================================================

export const BASELINE_STRATEGY = {
  overwhelmed: { mode: 'deep_focus', microTasksOnly: true,  lodLevel: 'compass' },
  on_top:      { mode: 'standard',   microTasksOnly: false, lodLevel: 'map' },
  starting:    { mode: 'visual',     microTasksOnly: false, lodLevel: 'map' },
  burned_out:  { mode: 'literal',    microTasksOnly: true,  lodLevel: 'compass' },
};

const INSTITUTION_REFERENCING = {
  UNSW: 'Harvard', USyd: 'APA 7', UQ: 'APA 7',
  Monash: 'APA 7', UMelb: 'APA 7', RMIT: 'Harvard',
  UTS: 'Harvard', ACU: 'APA 7',
};

export function deriveReferencingStyle(institution) {
  return INSTITUTION_REFERENCING[institution] || 'Harvard';
}

const AU_INSTITUTIONS = ['UNSW', 'USyd', 'UQ', 'Monash', 'UMelb', 'RMIT', 'UTS', 'ACU'];

const COGNITIVE_OPTIONS = [
  { id: 'literal',     label: 'Plain words',         sub: 'Direct language, no jargon' },
  { id: 'visual',      label: 'Diagrams and steps',  sub: 'Visual guides and checklists' },
  { id: 'deep_focus',  label: 'Just the essentials', sub: 'Minimal, one task at a time' },
];

const EMOTIONAL_OPTIONS = [
  { id: 'overwhelmed', label: 'Overwhelmed',   sub: 'Too much, not sure where to start', dot: '#f59e0b' },
  { id: 'on_top',      label: 'On Top of It',  sub: 'Clear picture of what to do',        dot: '#10b981' },
  { id: 'starting',    label: 'Just Starting', sub: 'Early days, feeling okay',           dot: '#60a5fa' },
  { id: 'burned_out',  label: 'Burned Out',    sub: 'Running on empty right now',         dot: '#f43f5e' },
];

const LEVEL_OPTIONS = [
  { id: 'Primary',    label: 'Primary',    sub: 'K-6' },
  { id: 'Secondary',  label: 'Secondary',  sub: 'Years 7-12' },
  { id: 'University', label: 'University', sub: 'Undergraduate' },
  { id: 'Postgrad',   label: 'Postgrad',   sub: 'Masters or PhD' },
  { id: 'TAFE',       label: 'TAFE',       sub: 'Vocational education' },
  { id: 'Homeschool', label: 'Homeschool', sub: 'Parent or child' },
];

const HOMESCHOOL_PLATFORMS = [
  { id: 'euka',         label: 'Euka',         sub: 'Structured home-based curriculum' },
  { id: 'khan_academy', label: 'Khan Academy', sub: 'Video-based self-paced learning' },
  { id: 'distance_ed',  label: 'Distance Ed',  sub: 'State correspondence school' },
  { id: 'other',        label: 'Other',        sub: 'Independent or mixed curriculum' },
];

// ============================================================
// Inline style tokens
// ============================================================

const S = {
  tile: (selected) => ({
    background: selected ? 'rgba(16,185,129,0.08)' : '#18181b',
    border: `1px solid ${selected ? '#10b981' : '#27272a'}`,
    borderRadius: 3, padding: '12px 14px', cursor: 'pointer',
    textAlign: 'left', transition: 'border 0.15s, background 0.15s',
    outline: 'none', width: '100%',
  }),
  tileLabel: { fontSize: 13, fontWeight: 600, color: '#e4e4e7', fontFamily: "'JetBrains Mono', monospace", display: 'block', marginBottom: 2 },
  tileSub:   { fontSize: 11, color: '#52525b', fontFamily: "'JetBrains Mono', monospace" },
  stepLabel: { fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#3f3f46', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10, display: 'block' },
  heading:   { fontSize: 18, fontWeight: 700, color: '#f4f4f5', margin: '0 0 6px', lineHeight: 1.3 },
  subtext:   { fontSize: 12, color: '#71717a', margin: '0 0 20px', lineHeight: 1.6 },
  chip: (selected) => ({
    fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
    padding: '5px 12px', borderRadius: 2,
    border: `1px solid ${selected ? '#10b981' : '#27272a'}`,
    background: selected ? 'rgba(16,185,129,0.08)' : 'transparent',
    color: selected ? '#10b981' : '#71717a',
    cursor: 'pointer', transition: 'border 0.15s',
    outline: 'none',
  }),
};

// ============================================================
// TileGrid
// ============================================================

function TileGrid({ options, selected, onSelect, columns = 2 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
      {options.map((opt) => (
        <button key={opt.id} type="button" onClick={() => onSelect(opt.id)} style={S.tile(selected === opt.id)}>
          {opt.dot && (
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: opt.dot, marginBottom: 8 }} />
          )}
          <span style={S.tileLabel}>{opt.label}</span>
          {opt.sub && <span style={S.tileSub}>{opt.sub}</span>}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// ProgressDots
// ============================================================

function ProgressDots({ step, total }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i < step ? 20 : 6, height: 2, borderRadius: 1,
          background: i < step ? '#10b981' : '#27272a',
          transition: 'width 0.3s ease, background 0.3s ease',
        }} />
      ))}
    </div>
  );
}

// ============================================================
// NeuroProfiler
// ============================================================

export default function NeuroProfiler({ onComplete, userName }) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    preferredMode: null,
    emotionalBaseline: null,
    level: null,
    homeschoolPlatform: null,
    institution: '',
    referencingStyle: 'Harvard',
    integrations: { zotero: false, mendeley: false },
    consents: { dataSharing: true, commercialResearch: false, affiliateOptimisation: false },
  });

  const totalSteps = profile.level === 'Homeschool' ? 5 : 4;

  const handleTileSelect = (field, value) => {
    setProfile(p => ({ ...p, [field]: value }));
    setTimeout(() => setStep(s => s + 1), 200);
  };

  const handlePlatformSelect = (id) => {
    setProfile(p => ({ ...p, homeschoolPlatform: id }));
    setTimeout(() => setStep(5), 200);
  };

  const handleInstitutionSelect = (name) => {
    setProfile(p => ({ ...p, institution: name, referencingStyle: deriveReferencingStyle(name) }));
  };

  const handleComplete = () => {
    console.log('PROFILER_COMPLETE_TRIGGERED');
    try { localStorage.setItem('simplifii_vault_seeded', 'true'); } catch { /* storage unavailable */ }
    onComplete({ ...profile, consents: { ...profile.consents, dataSharing: true } });
  };

  const isLastStep = (step === 4 && profile.level !== 'Homeschool') || step === 5;
  const canGoBack = step > 1;
  const greeting = userName ? `Hi ${userName.split(' ')[0]}.` : 'Welcome.';

  const stepVariants = {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' } },
    exit:    { opacity: 0, x: -16, transition: { duration: 0.16 } },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>

      {/* Step content: scrollable, never clips the nav footer */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        <AnimatePresence mode="wait">

          {/* Step 1: Processing Style */}
          {step === 1 && (
            <motion.div key="s1" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <span style={S.stepLabel}>Step 1 of {totalSteps}</span>
              <h2 style={S.heading}>{greeting}</h2>
              <p style={S.subtext}>When you get instructions, what helps most?</p>
              <TileGrid options={COGNITIVE_OPTIONS} selected={profile.preferredMode}
                onSelect={(v) => handleTileSelect('preferredMode', v)} columns={3} />
            </motion.div>
          )}

          {/* Step 2: Emotional Baseline */}
          {step === 2 && (
            <motion.div key="s2" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <span style={S.stepLabel}>Step 2 of {totalSteps}</span>
              <h2 style={S.heading}>Current state check.</h2>
              <p style={S.subtext}>How are you feeling about your workload right now?</p>
              <TileGrid options={EMOTIONAL_OPTIONS} selected={profile.emotionalBaseline}
                onSelect={(v) => handleTileSelect('emotionalBaseline', v)} columns={2} />
              <p style={{ marginTop: 12, fontSize: 10, color: '#3f3f46', fontFamily: "'JetBrains Mono', monospace", textAlign: 'center' }}>
                No wrong answers. This calibrates what AURA shows you first.
              </p>
            </motion.div>
          )}

          {/* Step 3: Academic Level */}
          {step === 3 && (
            <motion.div key="s3" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <span style={S.stepLabel}>Step 3 of {totalSteps}</span>
              <h2 style={S.heading}>What level are you studying?</h2>
              <p style={S.subtext}>Sets scaffolding depth, citation style, and task defaults.</p>
              <TileGrid options={LEVEL_OPTIONS} selected={profile.level}
                onSelect={(v) => handleTileSelect('level', v)} columns={2} />
            </motion.div>
          )}

          {/* Step 3.5: Homeschool platform */}
          {step === 4 && profile.level === 'Homeschool' && (
            <motion.div key="s3h" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <span style={S.stepLabel}>Step 4 of 5</span>
              <h2 style={S.heading}>Which platform are we upgrading?</h2>
              <p style={S.subtext}>Simplifii-OS maps your curriculum into a UDL 3.0 layout. No data is sent to your current provider.</p>
              <TileGrid options={HOMESCHOOL_PLATFORMS} selected={profile.homeschoolPlatform}
                onSelect={handlePlatformSelect} columns={2} />
            </motion.div>
          )}

          {/* Step 4 (standard) or Step 5 (Homeschool): Institution */}
          {isLastStep && (
            <motion.div key="s-inst" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <span style={S.stepLabel}>Step {totalSteps} of {totalSteps}</span>
              <h2 style={S.heading}>Which institution?</h2>
              <p style={S.subtext}>Sets the default referencing style for your exports.</p>

              {/* Quick-select chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {[...AU_INSTITUTIONS, 'None / Other'].map((name) => (
                  <button key={name} type="button"
                    onClick={() => handleInstitutionSelect(name === 'None / Other' ? 'None' : name)}
                    style={S.chip(profile.institution === (name === 'None / Other' ? 'None' : name))}>
                    {name}
                  </button>
                ))}
              </div>

              {/* Free-text */}
              <input
                type="text"
                value={profile.institution === 'None' ? '' : profile.institution}
                onChange={(e) => {
                  const val = e.target.value;
                  setProfile(p => ({ ...p, institution: val, referencingStyle: deriveReferencingStyle(val.trim()) }));
                }}
                placeholder="Or type your institution..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#18181b', border: '1px solid #27272a',
                  borderRadius: 3, padding: '10px 12px',
                  fontSize: 12, color: '#e4e4e7', outline: 'none',
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: profile.institution && profile.institution !== 'None' ? 6 : 16,
                }}
                aria-label="Institution name"
              />

              {profile.institution && profile.institution !== 'None' && (
                <p style={{ fontSize: 10, color: '#52525b', fontFamily: "'JetBrains Mono', monospace", marginBottom: 16 }}>
                  Default style: {profile.referencingStyle}
                </p>
              )}

              {/* Sovereign Guarantee: slim, dim */}
              <div style={{
                border: '1px solid #27272a', borderRadius: 3,
                padding: '10px 12px', marginBottom: 14,
                background: 'rgba(255,255,255,0.02)',
              }}>
                <p style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#3f3f46', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 5 }}>
                  Sovereign Guarantee
                </p>
                <p style={{ fontSize: 11, color: '#52525b', lineHeight: 1.6, margin: 0 }}>
                  Your data is de-identified in your browser before anything leaves your device.
                  Simplifii-OS cannot read your writing or link telemetry back to your identity.
                </p>
              </div>

              {/* Single required consent */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={profile.consents.dataSharing}
                  onChange={() => setProfile(p => ({ ...p, consents: { ...p.consents, dataSharing: !p.consents.dataSharing } }))}
                  style={{ marginTop: 2, accentColor: '#10b981', flexShrink: 0, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 11, color: '#71717a', lineHeight: 1.6 }}>
                  Personalise my interface in real time using anonymised session patterns.
                  No personally identifiable information is stored.
                </span>
              </label>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Sticky nav footer: always visible */}
      <div style={{
        position: 'sticky', bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 16, marginTop: 8,
        borderTop: '1px solid #18181b',
        background: 'rgba(24,24,27,0.95)',
        backdropFilter: 'blur(8px)',
      }}>
        {/* Back */}
        <button
          type="button"
          onClick={() => setStep(s => s - 1)}
          disabled={!canGoBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
            color: canGoBack ? '#71717a' : 'transparent',
            background: 'none', border: 'none', cursor: canGoBack ? 'pointer' : 'default',
            padding: '4px 0', outline: 'none',
          }}
        >
          <ChevronLeft size={13} />
          Back
        </button>

        <ProgressDots step={step} total={totalSteps} />

        {/* Next or Complete */}
        {isLastStep ? (
          <button
            type="button"
            onClick={handleComplete}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              background: '#10b981', color: '#fff',
              border: 'none', borderRadius: 3, padding: '8px 16px',
              cursor: 'pointer', outline: 'none',
              transition: 'background 0.15s',
            }}
          >
            Enter OS
            <ChevronRight size={13} />
          </button>
        ) : (
          <div style={{ width: 80 }} />
        )}
      </div>

    </div>
  );
}
