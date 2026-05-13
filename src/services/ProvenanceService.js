/**
 * ProvenanceService.js
 *
 * Computes work provenance data from HistoryOfThought events.
 * Sessions = consecutive text_edit events within 30 minutes.
 * Read-only from HistoryOfThought. Never writes or modifies events.
 */

import { listEvents } from '../core/HistoryOfThought';

const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Build sessions from text_edit events for a given course + assessment.
 */
export async function buildSessions(courseId, assessmentTitle) {
  let events;
  try {
    events = await listEvents({ limit: 5000 });
  } catch { return []; }

  const relevant = (events || [])
    .filter(e =>
      e.event_type === 'text_edit' &&
      e.payload?.courseId === courseId &&
      e.payload?.assessmentTitle === assessmentTitle
    )
    .sort((a, b) => (a.payload?.timestamp || 0) - (b.payload?.timestamp || 0));

  if (relevant.length === 0) return [];

  const sessions = [];
  let current = { events: [relevant[0]], start: relevant[0].payload?.timestamp || 0 };

  for (let i = 1; i < relevant.length; i++) {
    const ts = relevant[i].payload?.timestamp || 0;
    const prevTs = relevant[i - 1].payload?.timestamp || 0;
    if (ts - prevTs > SESSION_GAP_MS) {
      current.end = prevTs;
      sessions.push(current);
      current = { events: [relevant[i]], start: ts };
    } else {
      current.events.push(relevant[i]);
    }
  }
  current.end = relevant[relevant.length - 1].payload?.timestamp || 0;
  sessions.push(current);

  return sessions.map((s, i) => {
    const wordCounts = s.events.map(e => e.payload?.wordCount || 0);
    const firstWords = wordCounts[0] || 0;
    const lastWords = wordCounts[wordCounts.length - 1] || 0;
    const duration = Math.max(0, s.end - s.start);
    const pauses = [];
    for (let j = 1; j < s.events.length; j++) {
      const gap = (s.events[j].payload?.timestamp || 0) - (s.events[j - 1].payload?.timestamp || 0);
      if (gap > 2000) pauses.push(gap);
    }
    const avgPause = pauses.length > 0 ? Math.round(pauses.reduce((a, b) => a + b, 0) / pauses.length) : 0;

    return {
      id: `session_${i}`,
      index: i + 1,
      start: s.start,
      end: s.end,
      durationMs: duration,
      durationMinutes: Math.round(duration / 60000),
      editCount: s.events.length,
      wordsStart: firstWords,
      wordsEnd: lastWords,
      wordsAdded: Math.max(0, lastWords - firstWords),
      wordsRemoved: Math.max(0, firstWords - lastWords),
      wordsNet: lastWords - firstWords,
      averagePauseMs: avgPause,
    };
  });
}

/**
 * Compute summary stats from sessions.
 */
export function computeSummary(sessions) {
  if (!sessions || sessions.length === 0) {
    return { totalSessions: 0, totalWords: 0, totalMinutes: 0, totalEdits: 0, editRatio: 0 };
  }
  const totalMinutes = sessions.reduce((s, sess) => s + sess.durationMinutes, 0);
  const totalEdits = sessions.reduce((s, sess) => s + sess.editCount, 0);
  const lastSession = sessions[sessions.length - 1];
  const totalWords = lastSession.wordsEnd;
  const editRatio = totalWords > 0 ? Math.round((totalEdits / totalWords) * 100) / 100 : 0;

  return { totalSessions: sessions.length, totalWords, totalMinutes, totalEdits, editRatio };
}

/**
 * Generate exportable provenance JSON.
 */
export async function generateProvenanceExport({ courseId, courseName, courseCode, term, assessmentTitle }) {
  const sessions = await buildSessions(courseId, assessmentTitle);
  const summary = computeSummary(sessions);

  const exportData = {
    version: 1,
    exported_at: new Date().toISOString(),
    course: { code: courseCode || courseName, name: courseName, term: term || null },
    assessment: assessmentTitle,
    summary: {
      total_sessions: summary.totalSessions,
      total_words: summary.totalWords,
      total_minutes: summary.totalMinutes,
    },
    sessions: sessions.map(s => ({
      index: s.index,
      start: new Date(s.start).toISOString(),
      end: new Date(s.end).toISOString(),
      duration_minutes: s.durationMinutes,
      edits: s.editCount,
      words_start: s.wordsStart,
      words_end: s.wordsEnd,
      words_net: s.wordsNet,
      average_pause_ms: s.averagePauseMs,
    })),
  };

  // Tamper detection: sha256 of the JSON without the signature field
  const jsonStr = JSON.stringify(exportData);
  let hash = 'unavailable';
  try {
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(jsonStr));
    hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch { /* crypto unavailable */ }
  exportData.signature = hash;

  return exportData;
}
