/**
 * SovereignRouter
 *
 * Layer 1 of the Sovereign Architecture Blueprint.
 *
 * Resolves the active stream (primary / secondary / tertiary / tafe /
 * homeschool) and hydrates its profile, vocab, theme, and capability
 * registry. Existing tertiary users are unaffected; on first call without
 * a stored stream the router defaults to 'tertiary' so the existing build
 * keeps working.
 *
 * The router is read-only after hydration. Switching streams requires a
 * full session restart (see Blueprint hard rules). All five stream
 * profiles ship as static JSON under /src/streams/, imported here at
 * build time so the resolver never makes a network call and never asks
 * an LLM for stream config.
 *
 * Hard rules from the Blueprint enforced here:
 *   - stream profile data NEVER comes from inference
 *   - capability registry is the only source of truth for module access
 *   - tertiary fallback preserves the existing build
 */

import primaryProfile from '../streams/primary/profile.json';
import primaryVocab from '../streams/primary/vocab.json';
import primaryTheme from '../streams/primary/theme.json';
import primaryCapabilities from '../streams/primary/capabilities.json';

import secondaryProfile from '../streams/secondary/profile.json';
import secondaryVocab from '../streams/secondary/vocab.json';
import secondaryTheme from '../streams/secondary/theme.json';
import secondaryCapabilities from '../streams/secondary/capabilities.json';

import tertiaryProfile from '../streams/tertiary/profile.json';
import tertiaryVocab from '../streams/tertiary/vocab.json';
import tertiaryTheme from '../streams/tertiary/theme.json';
import tertiaryCapabilities from '../streams/tertiary/capabilities.json';

import tafeProfile from '../streams/tafe/profile.json';
import tafeVocab from '../streams/tafe/vocab.json';
import tafeTheme from '../streams/tafe/theme.json';
import tafeCapabilities from '../streams/tafe/capabilities.json';

import homeschoolProfile from '../streams/homeschool/profile.json';
import homeschoolVocab from '../streams/homeschool/vocab.json';
import homeschoolTheme from '../streams/homeschool/theme.json';
import homeschoolCapabilities from '../streams/homeschool/capabilities.json';

const STREAMS = {
  primary:    { profile: primaryProfile,    vocab: primaryVocab,    theme: primaryTheme,    capabilities: primaryCapabilities },
  secondary:  { profile: secondaryProfile,  vocab: secondaryVocab,  theme: secondaryTheme,  capabilities: secondaryCapabilities },
  tertiary:   { profile: tertiaryProfile,   vocab: tertiaryVocab,   theme: tertiaryTheme,   capabilities: tertiaryCapabilities },
  tafe:       { profile: tafeProfile,       vocab: tafeVocab,       theme: tafeTheme,       capabilities: tafeCapabilities },
  homeschool: { profile: homeschoolProfile, vocab: homeschoolVocab, theme: homeschoolTheme, capabilities: homeschoolCapabilities }
};

const VALID_STREAM_IDS = Object.keys(STREAMS);
const DEFAULT_STREAM = 'tertiary';

// Map the existing profile.level to a stream id. Any unmapped value
// falls through to tertiary so existing users land where they have
// always landed.
const LEVEL_TO_STREAM = {
  primary: 'primary',
  secondary: 'secondary',
  highschool: 'secondary',
  tafe: 'tafe',
  homeschool: 'homeschool',
  university: 'tertiary',
  undergrad: 'tertiary',
  honours: 'tertiary',
  mres: 'tertiary',
  phd: 'tertiary'
};

export const streamFromLevel = (level) => {
  const key = String(level || '').toLowerCase().trim();
  return LEVEL_TO_STREAM[key] || DEFAULT_STREAM;
};

export const isValidStream = (id) => VALID_STREAM_IDS.includes(id);

/**
 * hydrate(session): resolve a session's stream and return the merged
 * profile object. The session may carry an explicit streamId (set during
 * onboarding); if absent we derive from session.profile.level; if both
 * are absent we default to tertiary.
 */
export const hydrate = (session = {}) => {
  let streamId = session.streamId;
  if (!streamId || !isValidStream(streamId)) {
    streamId = streamFromLevel(session.profile?.level);
  }
  const stream = STREAMS[streamId] || STREAMS[DEFAULT_STREAM];
  return {
    streamId,
    profile: stream.profile,
    vocab: stream.vocab,
    theme: stream.theme,
    capabilities: stream.capabilities,
    // Convenience helpers consumers can call without re-reading the
    // structure manually.
    getVocab: (key) => stream.vocab[key] || STREAMS[DEFAULT_STREAM].vocab[key] || key,
    canAccess: (moduleId) => Array.isArray(stream.capabilities) && stream.capabilities.includes(moduleId),
    getDefaultLanding: () => stream.profile.defaultLanding || 'studio'
  };
};

/**
 * applyTheme(stream): write the stream's CSS custom properties onto the
 * document root so existing components that read var(--bg) etc continue
 * to work without per-component changes. Idempotent.
 */
export const applyTheme = (stream) => {
  if (typeof document === 'undefined' || !stream || !stream.theme) return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(stream.theme)) {
    if (key.startsWith('--')) root.style.setProperty(key, value);
  }
};

export const __internals = { STREAMS, LEVEL_TO_STREAM, VALID_STREAM_IDS, DEFAULT_STREAM };
