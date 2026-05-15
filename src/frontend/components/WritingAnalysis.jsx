import React, { useMemo } from 'react';
import {
  SURFACE_RAISED,
  TEXT_PRIMARY, TEXT_MUTED, TEXT_FAINT,
  ACCENT_PULSE, ACCENT_GLASS, ACCENT_BORDER,
  COLOUR_WARN,
  FONT_SYSTEM, FONT_BODY,
  BORDER_RADIUS,
} from '../../theme/tokens';

/**
 * WritingAnalysis
 *
 * Real-time writing metrics sidebar. Updates as user types.
 * Shows: reading level, avg sentence length, passive voice,
 * word repetition, filler words.
 *
 * Props:
 *   draftText - string (HTML or plain text)
 */

const FILLERS = ['just', 'really', 'very', 'actually', 'basically', 'literally', 'simply', 'quite', 'rather'];
const PASSIVE_RE = /\b(?:is|are|was|were|been|being)\s+\w+ed\b/gi;

function analyse(text) {
  const plain = (text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plain || plain.length < 10) return null;

  const words = plain.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = plain.split(/[.!?]+/).filter(s => s.trim().length > 3);
  const sentenceCount = sentences.length || 1;

  // Average sentence length
  const avgSentenceLength = Math.round(wordCount / sentenceCount);

  // Reading level (Flesch-Kincaid approximate)
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const fkGrade = Math.round(0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59);
  const readingLevel = Math.max(1, Math.min(18, fkGrade));

  // Passive voice
  const passiveMatches = plain.match(PASSIVE_RE) || [];
  const passiveCount = passiveMatches.length;
  const passivePct = Math.round((passiveCount / sentenceCount) * 100);

  // Filler words
  const lowerWords = words.map(w => w.toLowerCase().replace(/[^a-z]/g, ''));
  const fillerCount = lowerWords.filter(w => FILLERS.includes(w)).length;

  // Word repetition (top 3 most repeated non-stop words, 4+ chars)
  const counts = {};
  for (const w of lowerWords) {
    if (w.length < 4) continue;
    counts[w] = (counts[w] || 0) + 1;
  }
  const repeated = Object.entries(counts)
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word, count]) => ({ word, count }));

  return { wordCount, sentenceCount, avgSentenceLength, readingLevel, passiveCount, passivePct, fillerCount, repeated };
}

function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  let count = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').match(/[aeiouy]{1,2}/g);
  return count ? count.length : 1;
}

function Metric({ label, value, warning }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
      <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_MUTED }}>{label}</span>
      <span style={{ fontFamily: FONT_SYSTEM, fontSize: 11, fontWeight: 600, color: warning ? COLOUR_WARN : ACCENT_PULSE }}>{value}</span>
    </div>
  );
}

export default function WritingAnalysis({ draftText }) {
  const stats = useMemo(() => analyse(draftText), [draftText]);

  if (!stats) {
    return (
      <div style={{ padding: '12px 14px' }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 11, color: TEXT_FAINT, margin: 0 }}>
          Start writing to see analysis.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <h4 style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, margin: '0 0 6px' }}>
        Writing analysis
      </h4>

      <Metric label="Words" value={stats.wordCount} />
      <Metric label="Sentences" value={stats.sentenceCount} />
      <Metric label="Avg sentence" value={`${stats.avgSentenceLength} words`} warning={stats.avgSentenceLength > 25} />
      <Metric label="Reading level" value={`Grade ${stats.readingLevel}`} />
      <Metric label="Passive voice" value={`${stats.passivePct}%`} warning={stats.passivePct > 30} />
      <Metric label="Filler words" value={stats.fillerCount} warning={stats.fillerCount > 5} />

      {stats.repeated.length > 0 && (
        <div style={{ marginTop: 4, borderTop: `1px solid ${SURFACE_RAISED}`, paddingTop: 4 }}>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT }}>Repeated words:</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
            {stats.repeated.map(r => (
              <span key={r.word} style={{ fontFamily: FONT_SYSTEM, fontSize: 9, padding: '1px 5px', background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: 3, color: COLOUR_WARN }}>
                {r.word} ({r.count}x)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
