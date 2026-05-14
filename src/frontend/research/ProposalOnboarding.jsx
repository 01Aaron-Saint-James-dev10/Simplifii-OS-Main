/**
 * ProposalOnboarding.jsx
 *
 * Proposal-first onboarding gate for the Bowser-OS research workspace.
 * Step 1: Upload research proposal (PDF or DOCX).
 * Step 2: Heuristic extraction populates editable fields.
 * Step 3: Confirm and create the project structure.
 *
 * Also exposes "Use Demo Data" to load Aaron's pre-seeded MRes for testing.
 *
 * Props:
 *   onProjectCreated(projectData, phase, strands, chapters) - callback
 *   onUseDemo  - callback to trigger Aaron seed
 */

import React, { useState, useRef } from 'react';
import mammoth from 'mammoth';
import {
  SURFACE_BASE,
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
  ACCENT_GLASS_STRONG,
  ACCENT_BORDER,
  ACCENT_BORDER_STRONG,
  COLOUR_WARN,
  COLOUR_WARN_GLASS,
  COLOUR_WARN_BORDER,
} from '../../theme/tokens';

// ─── PDF text extraction via pdfjs-dist ──────────────────────────────────────

async function extractPdfText(file) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map(item => item.str).join(' '));
  }
  return pages.join('\n');
}

// ─── Heuristic proposal parser ────────────────────────────────────────────────

const AU_UNIVERSITIES = [
  'UNSW', 'University of Sydney', 'University of Melbourne', 'Monash University',
  'ANU', 'Australian National University', 'University of Queensland', 'UQ',
  'University of Western Australia', 'UWA', 'University of Adelaide', 'Flinders',
  'La Trobe', 'Deakin', 'Griffith', 'QUT', 'RMIT', 'UTS', 'Macquarie',
  'Newcastle', 'Wollongong', 'Charles Darwin', 'Bond', 'ACU', 'CQU',
];

const RESEARCH_TYPE_KEYWORDS = {
  phd:     ['phd', 'ph.d', 'doctor of philosophy', 'doctoral'],
  mres:    ['mres', 'm.res', 'master of research', 'master by research'],
  honours: ['honours', 'honor', 'hons'],
  masters: ['master of', 'coursework masters'],
};

function detectResearchType(text) {
  const lower = text.toLowerCase();
  for (const [type, keywords] of Object.entries(RESEARCH_TYPE_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return type;
  }
  return 'mres';
}

function extractTitle(lines) {
  const titlePrefixes = ['title:', 'research title:', 'project title:', 'thesis title:'];
  for (const line of lines.slice(0, 20)) {
    const lower = line.toLowerCase().trim();
    for (const prefix of titlePrefixes) {
      if (lower.startsWith(prefix)) {
        return line.slice(line.indexOf(':') + 1).trim();
      }
    }
  }
  // Fallback: first non-trivial line
  return lines.find(l => l.trim().length > 20 && l.trim().length < 200) || '';
}

function extractSupervisor(text) {
  const patterns = [
    /supervisor[:\s]+(?:prof(?:essor)?\.?\s+|dr\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /supervised\s+by\s+(?:prof(?:essor)?\.?\s+|dr\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /(?:prof(?:essor)?|dr)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*[\(,\n]/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1].trim();
  }
  return '';
}

function extractInstitution(text) {
  for (const uni of AU_UNIVERSITIES) {
    if (text.includes(uni)) return uni;
  }
  const m = text.match(/University\s+of\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/);
  return m ? m[0] : '';
}

function extractPositionality(text) {
  const sentences = text.replace(/\n/g, ' ').split(/(?<=[.!?])\s+/);
  const triggers = ['i am', 'my position', 'as a researcher', 'positionality', 'lived experience', 'dual role', 'insider'];
  const matches = sentences.filter(s => triggers.some(t => s.toLowerCase().includes(t)));
  return matches.slice(0, 3).join(' ').trim();
}

function extractTheoreticalFramework(text) {
  const sentences = text.replace(/\n/g, ' ').split(/(?<=[.!?])\s+/);
  const triggers = ['theoretical framework', 'underpinned by', 'draw on', 'informed by', 'grounded in', 'critical disability', 'social constructi'];
  const matches = sentences.filter(s => triggers.some(t => s.toLowerCase().includes(t)));
  return matches.slice(0, 3).join(' ').trim();
}

function extractResearchQuestions(text) {
  const rqPhrases = ['research question', 'rq1', 'rq2', 'rq 1', 'rq 2'];
  const lines = text.split('\n');
  const hits = lines.filter(l => rqPhrases.some(p => l.toLowerCase().includes(p)));
  return hits.slice(0, 4).join('\n').trim();
}

function detectMethodology(text) {
  const lower = text.toLowerCase();
  const methods = [];
  if (/qualitative/.test(lower)) methods.push('Qualitative');
  if (/quantitative/.test(lower)) methods.push('Quantitative');
  if (/mixed.method/.test(lower)) methods.push('Mixed methods');
  if (/thematic/.test(lower)) methods.push('Thematic analysis');
  if (/grounded theory/.test(lower)) methods.push('Grounded theory');
  if (/ethnograph/.test(lower)) methods.push('Ethnography');
  if (/survey/.test(lower)) methods.push('Survey');
  if (/interview/.test(lower)) methods.push('Interviews');
  if (/audit/.test(lower)) methods.push('Audit');
  return methods.length > 0 ? methods.join(', ') : 'To be determined';
}

const CHAPTER_TEMPLATES = {
  mres: [
    { number: 1, title: 'Introduction' },
    { number: 2, title: 'Literature Review' },
    { number: 3, title: 'Methodology' },
    { number: 4, title: 'Findings' },
    { number: 5, title: 'Discussion' },
    { number: 6, title: 'Conclusion' },
  ],
  phd: [
    { number: 1, title: 'Introduction' },
    { number: 2, title: 'Literature Review' },
    { number: 3, title: 'Theoretical Framework' },
    { number: 4, title: 'Methodology' },
    { number: 5, title: 'Findings: Study 1' },
    { number: 6, title: 'Findings: Study 2' },
    { number: 7, title: 'Discussion' },
    { number: 8, title: 'Conclusion' },
  ],
  honours: [
    { number: 1, title: 'Introduction' },
    { number: 2, title: 'Literature Review' },
    { number: 3, title: 'Methodology' },
    { number: 4, title: 'Results and Discussion' },
    { number: 5, title: 'Conclusion' },
  ],
  masters: [
    { number: 1, title: 'Introduction' },
    { number: 2, title: 'Literature Review' },
    { number: 3, title: 'Methodology' },
    { number: 4, title: 'Analysis' },
    { number: 5, title: 'Conclusion' },
  ],
};

function parseProposal(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const researchType = detectResearchType(text);
  return {
    title:                  extractTitle(lines),
    supervisor:             extractSupervisor(text),
    institution:            extractInstitution(text),
    researchType,
    positionalityStatement: extractPositionality(text),
    theoreticalFramework:   extractTheoreticalFramework(text),
    researchQuestions:      extractResearchQuestions(text),
    methodology:            detectMethodology(text),
    suggestedChapters:      CHAPTER_TEMPLATES[researchType] || CHAPTER_TEMPLATES.mres,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProposalOnboarding({ onProjectCreated, onUseDemo }) {
  const fileRef   = useRef(null);
  const [step,    setStep]    = useState('upload'); // 'upload' | 'confirm'
  const [parsing, setParsing] = useState(false);
  const [error,   setError]   = useState(null);
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function processFile(file) {
    setError(null);
    setParsing(true);
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      let text = '';
      if (ext === 'pdf') {
        text = await extractPdfText(file);
      } else if (ext === 'docx') {
        const buf = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer: buf });
        text = res.value || '';
      } else {
        throw new Error(`Please upload a PDF or DOCX file. Received: .${ext}`);
      }
      if (!text.trim()) throw new Error('Could not extract text from this file. Try a different format.');
      const parsed = parseProposal(text);
      setForm(parsed);
      setStep('confirm');
    } catch (err) {
      setError(err.message || 'Failed to parse file.');
    } finally {
      setParsing(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form?.title?.trim()) return;
    setSaving(true);
    try {
      await onProjectCreated({
        title:                 form.title.trim(),
        supervisor:            form.supervisor.trim(),
        institution:           form.institution.trim(),
        positionalityStatement: form.positionalityStatement.trim(),
        theoreticalFramework:  form.theoreticalFramework.trim(),
        researchType:          form.researchType,
        suggestedChapters:     form.suggestedChapters,
      });
    } finally {
      setSaving(false);
    }
  }

  const LABEL = { fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, margin: '0 0 4px', display: 'block' };
  const INPUT = { width: '100%', padding: '8px 10px', background: SURFACE_RAISED, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS, fontFamily: FONT_BODY, fontSize: 13, color: TEXT_PRIMARY, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', background: SURFACE_BASE, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32, maxWidth: 520 }}>
        <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT_PULSE, margin: '0 0 10px' }}>
          Bowser-OS Research Workspace
        </p>
        <h1 style={{ fontFamily: FONT_BODY, fontSize: 24, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 10px', lineHeight: 1.3 }}>
          {step === 'upload' ? 'Upload your research proposal' : 'Confirm your project structure'}
        </h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_MUTED, margin: 0, lineHeight: 1.6 }}>
          {step === 'upload'
            ? 'We will map your proposal into phases, strands, and chapter outlines automatically.'
            : 'Review and adjust the extracted data before creating your project.'}
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 560 }}>
        {step === 'upload' && (
          <>
            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
              aria-label="Upload research proposal PDF or DOCX"
              style={{ border: `2px dashed ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS * 2, padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: ACCENT_GLASS, marginBottom: 16 }}
            >
              <input ref={fileRef} type="file" accept=".pdf,.docx" style={{ display: 'none' }} onChange={e => e.target.files[0] && processFile(e.target.files[0])} />
              <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: TEXT_MUTED, margin: '0 0 6px' }}>
                {parsing ? 'Parsing proposal...' : 'Drop your proposal here, or click to browse'}
              </p>
              <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, margin: 0, letterSpacing: '0.06em' }}>
                PDF or DOCX (up to 30 pages extracted)
              </p>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: COLOUR_WARN_GLASS, border: `1px solid ${COLOUR_WARN_BORDER}`, borderRadius: BORDER_RADIUS, marginBottom: 16 }}>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLOUR_WARN, margin: 0 }}>{error}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, letterSpacing: '0.06em' }}>OR</span>
            </div>
            <button
              type="button"
              onClick={onUseDemo}
              style={{ width: '100%', marginTop: 12, padding: '10px', background: 'transparent', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS * 2, fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED, cursor: 'pointer' }}
            >
              Use Demo Data (Aaron Saint-James MRes)
            </button>
          </>
        )}

        {step === 'confirm' && form && (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '10px 14px', background: ACCENT_GLASS, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS, marginBottom: 4 }}>
              <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: ACCENT_PULSE, margin: 0, letterSpacing: '0.06em' }}>
                Detected: {form.researchType.toUpperCase()} | Methodology: {form.methodology}
              </p>
            </div>

            <div>
              <label style={LABEL} htmlFor="title">Research Title</label>
              <input id="title" style={INPUT} value={form.title} onChange={e => updateField('title', e.target.value)} required />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={LABEL} htmlFor="supervisor">Supervisor</label>
                <input id="supervisor" style={INPUT} value={form.supervisor} onChange={e => updateField('supervisor', e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LABEL} htmlFor="institution">Institution</label>
                <input id="institution" style={INPUT} value={form.institution} onChange={e => updateField('institution', e.target.value)} />
              </div>
            </div>
            <div>
              <label style={LABEL} htmlFor="positionality">Positionality Statement (extracted)</label>
              <textarea id="positionality" rows={3} style={{ ...INPUT, resize: 'vertical' }} value={form.positionalityStatement} onChange={e => updateField('positionalityStatement', e.target.value)} />
            </div>
            <div>
              <label style={LABEL} htmlFor="framework">Theoretical Framework (extracted)</label>
              <textarea id="framework" rows={3} style={{ ...INPUT, resize: 'vertical' }} value={form.theoreticalFramework} onChange={e => updateField('theoreticalFramework', e.target.value)} />
            </div>

            <div style={{ padding: '10px 14px', background: SURFACE_CARD, border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS }}>
              <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, margin: '0 0 6px' }}>
                Chapter Structure ({form.suggestedChapters.length} chapters)
              </p>
              {form.suggestedChapters.map(ch => (
                <span key={ch.number} style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: ACCENT_PULSE, background: ACCENT_GLASS_STRONG, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS, padding: '2px 8px', marginRight: 4, marginBottom: 4, display: 'inline-block' }}>
                  Ch {ch.number}: {ch.title}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setStep('upload')}
                style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS * 2, fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: TEXT_MUTED, cursor: 'pointer' }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!form.title.trim() || saving}
                style={{ flex: 2, padding: '10px', background: ACCENT_GLASS_STRONG, border: `1px solid ${ACCENT_BORDER_STRONG}`, borderRadius: BORDER_RADIUS * 2, fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE, cursor: form.title.trim() ? 'pointer' : 'not-allowed' }}
              >
                {saving ? 'Creating project...' : 'Create My Research Project'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
