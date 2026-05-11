import React, { useRef, useState } from 'react';
import { ArrowRight, User, Calendar, BookOpen, Brain, UploadCloud, Loader2 } from 'lucide-react';
import { processDocumentWithGCP } from '../services/DocumentAIService';
import { extractDeepCourseData, mergeExtractionData, detectUnitCode, detectAcademicTier } from '../services/BriefService';
import { speakSystemMessage } from '../services/MessagingHub';

export function StartIgnition({ onStart }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative p-12 bg-[#07080D] text-white overflow-y-auto">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="w-full max-w-2xl z-10 text-center animate-fade-in">
         <h1 className="text-6xl font-black tracking-tighter mb-6 leading-tight">
          Universal Context.<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Zero Friction.</span>
        </h1>
        <p className="text-xl text-zinc-400 font-medium leading-relaxed mb-10">
          Connect your digital brain to initialize the Neural-Docs linear editor.
        </p>
        <button 
          onClick={onStart}
          className="px-10 py-5 rounded-full bg-emerald-500 text-black font-black text-lg uppercase tracking-widest hover:shadow-glow-emerald transition-all flex items-center gap-3 mx-auto"
        >
          Initiate Handshake <ArrowRight />
        </button>
      </div>
    </div>
  );
}

export function IdentityGate({ onComplete, profile, setProfile }) {
  const styleOptions = [
    { key: 'Deep-Focus Layout', hint: 'Single task in view, distractions dimmed.' },
    { key: 'Non-Linear Navigation', hint: 'Jump between sections without losing your place.' },
    { key: 'Visual Scaffolding', hint: 'Larger fonts, generous spacing, optional tints.' },
    { key: 'Audio-Augmented', hint: 'Read-aloud and plain-language defaults.' }
  ];

  const toggleStyle = (key) => {
    const current = profile.processingStyles || [];
    const isSelected = current.includes(key);
    const next = isSelected ? current.filter(t => t !== key) : [...current, key];
    setProfile({ ...profile, processingStyles: next });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative p-12 bg-[#07080D] text-white overflow-y-auto">
      <div className="w-full max-w-2xl z-10 text-center animate-fade-in bg-zinc-900/50 border border-zinc-800 p-12 rounded-3xl backdrop-blur-xl shadow-2xl">
        <User size={48} className="text-emerald-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black mb-4">Identity Gate</h2>
        <p className="text-zinc-400 mb-8 text-lg">Welcome, <strong className="text-emerald-400">{profile.name}</strong>. Pick the processing styles you want the OS to default to. You can change these any time.</p>

        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Processing Styles</p>
          <div className="flex flex-wrap justify-center gap-3">
            {styleOptions.map(opt => {
              const selected = profile.processingStyles?.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  onClick={() => toggleStyle(opt.key)}
                  title={opt.hint}
                  className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${selected ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)] border-emerald-500' : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-white'}`}
                >
                  {opt.key}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mt-4 font-bold">No diagnoses required. Pick what helps you read and write.</p>
        </div>

        <button
          onClick={onComplete}
          className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
        >
          Build My Profile
        </button>
      </div>
    </div>
  );
}

export function TemporalBaseline({ onComplete, profile }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative p-12 bg-[#07080D] text-white overflow-y-auto">
      <div className="w-full max-w-2xl z-10 text-center animate-fade-in bg-zinc-900/50 border border-zinc-800 p-12 rounded-3xl backdrop-blur-xl shadow-2xl">
        <Calendar size={48} className="text-amber-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black mb-4">Temporal Baseline</h2>
        <p className="text-zinc-400 mb-8 text-lg">Deadline approaching on <strong className="text-amber-400">{profile.deadline}</strong>. Friction Map adjusted.</p>
        <div className="flex gap-4">
          <button 
            onClick={onComplete}
            className="flex-1 py-4 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-glow-amber"
          >
            Confirm Sprint
          </button>
          <button 
            onClick={onComplete}
            className="flex-1 py-4 rounded-xl bg-zinc-800 text-white font-black uppercase tracking-widest hover:bg-zinc-700 transition-all"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}

export function CourseDefinition({ onComplete, profile, setProfile }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete();
  };
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative p-12 bg-[#07080D] text-white overflow-y-auto">
      <div className="w-full max-w-2xl z-10 text-center animate-fade-in bg-zinc-900/50 border border-zinc-800 p-12 rounded-3xl backdrop-blur-xl shadow-2xl">
        <BookOpen size={48} className="text-blue-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black mb-6">Course Definition</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input 
              type="text" 
              placeholder="Subject Name (e.g. BABS1201, Year 12 English, MATH3000)"
              required
              value={profile.courseName || ''}
              onChange={(e) => setProfile({...profile, courseName: e.target.value})}
              className="w-full bg-black/50 border border-zinc-800 rounded-xl px-6 py-4 text-white placeholder-zinc-600 focus:border-blue-500 outline-none text-center text-lg font-bold"
            />
          </div>
          <div>
            <select
              required
              value={profile.level || ''}
              onChange={(e) => setProfile({...profile, level: e.target.value})}
              className="w-full bg-black/50 border border-zinc-800 rounded-xl px-6 py-4 text-white focus:border-blue-500 outline-none text-center text-lg font-bold appearance-none"
            >
              <option value="" disabled>Select Academic Level</option>
              <option value="primary">Primary (K to 6)</option>
              <option value="secondary">Secondary (Y7 to 10)</option>
              <option value="highschool">High School (Y11 to 12)</option>
              <option value="tafe">TAFE</option>
              <option value="undergrad">Undergraduate</option>
              <option value="mres">Masters / MRes</option>
              <option value="phd">Doctoral</option>
              <option value="homeschool">Homeschool</option>
            </select>
          </div>
          {/* Sovereign stream picker. Explicitly answers 'Who are you
              building today?' so profile.streamId is set instead of
              derived. The router still falls back to deriving from
              level when this field is empty. */}
          <div>
            <label className="block text-zinc-400 text-xs font-black uppercase tracking-widest mb-2">Stream</label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: 'primary',    label: 'Primary',    sub: 'K-6' },
                { id: 'secondary',  label: 'Secondary',  sub: 'Y7-10' },
                { id: 'tertiary',   label: 'Tertiary',   sub: 'Uni / MRes' },
                { id: 'tafe',       label: 'TAFE',       sub: 'Trade' },
                { id: 'homeschool', label: 'Homeschool', sub: 'Self-led' }
              ].map((s) => {
                const active = profile.streamId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setProfile({ ...profile, streamId: s.id })}
                    className={`px-3 py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-black/40 text-zinc-400 border-zinc-800 hover:border-emerald-500/40 hover:text-white'}`}
                    title={`Stream: ${s.label} (${s.sub})`}
                  >
                    <div>{s.label}</div>
                    <div className="text-[9px] opacity-70 mt-1">{s.sub}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-zinc-500 mt-2 text-center">Pick the brain you are building for. The cockpit re-skins itself: vocabulary, default landing, focus session length.</p>
          </div>
          {/* Gate the submit on stream selection. The picker was
              previously decorative; without an explicit streamId the
              router fell back to streamFromLevel(level), which works
              but never surfaces Primary / Secondary / TAFE / Homeschool
              for users whose level field maps elsewhere. Requiring the
              choice keeps Literal Mode and stream theming honest. */}
          <button
            type="submit"
            disabled={!profile.streamId}
            className="w-full py-4 rounded-xl bg-blue-500 text-black font-black uppercase tracking-widest hover:bg-blue-400 transition-all shadow-glow-blue disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {profile.streamId ? 'Initialize Knowledge Graph' : 'Pick a stream above'}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Grounding  -  Stage 02: The Ingestion Drive
 *
 * The Gravity Well dropzone. High-contrast light theme. Drag the
 * Outline, Brief, and Rubric in; the OS detects unit-code prefixes
 * on each filename and groups files into distinct Course Pillars
 * (BABS1201 separate from BABS1202, MATH2018 separate again).
 *
 * Siltbrand Pulse on drag-over: 1px emerald-500 perimeter ring plus
 * outer glow, matches the LandingPage gateway treatment.
 *
 * onComplete is now called with an ARRAY of per-unit-code payloads
 * so the caller (MasterDashboard.handleSprintCreation) creates one
 * Course Pillar per group rather than one mashed-up course.
 */
export function Grounding({ onComplete, profile }) {
  const [parsingFiles, setParsingFiles] = useState(false);
  const [extractionError, setExtractionError] = useState(null);
  const [parsedFiles, setParsedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [pastedAggregated, setPastedAggregated] = useState(null);

  const baseForCode = (code) => ({
    unitCode: code || profile.courseName || 'Unknown',
    level: profile.level,
    theme: 'General'
  });

  const handlePasteSubmit = () => {
    const text = (pastedText || '').trim();
    if (text.length < 100) {
      setExtractionError('Paste at least 100 characters of assessment text so the extractor has something to work with.');
      return;
    }
    setExtractionError(null);
    setParsingFiles(true);
    try {
      const code = detectUnitCode('pasted-' + text.slice(0, 64)) || profile.courseName || 'Pasted';
      const next = pastedAggregated || baseForCode(code);
      const deepData = extractDeepCourseData(text);
      const merged = mergeExtractionData(next, { ...deepData, rawText: text });
      setPastedAggregated(merged);
      setParsedFiles((prev) => [...prev, { name: 'Pasted text', unitCode: code, rawText: text, deepData }]);
      setPastedText('');
    } catch (err) {
      setExtractionError(err?.message || 'Could not parse the pasted text.');
    } finally {
      setParsingFiles(false);
    }
  };

  const classifyFile = (file) => {
    const n = (file.name || '').toLowerCase();
    if (/outline|course[ _-]?info|co[_-]/i.test(n)) return 0;
    if (/brief|assess|task|instruction/i.test(n)) return 1;
    if (/rubric|criteria|marking/i.test(n)) return 2;
    return 3;
  };

  const ingestFiles = async (rawFiles) => {
    const files = Array.from(rawFiles).sort((a, b) => classifyFile(a) - classifyFile(b));
    if (files.length === 0) return;
    setExtractionError(null);
    setParsingFiles(true);
    try {
      const next = [];
      for (const file of files) {
        if (typeof console !== 'undefined') console.info('[Grounding] processing', file.name, 'class=', classifyFile(file));
        const text = await processDocumentWithGCP(file, 'mock_jwt_token_xyz123');
        const deepData = extractDeepCourseData(text);
        next.push({
          name: file.name,
          unitCode: detectUnitCode(file.name) || '__unknown',
          rawText: text,
          deepData
        });
      }
      setParsedFiles((prev) => [...prev, ...next]);
    } catch (error) {
      console.error('Critical extraction failure:', error);
      const msg = error?.message || '';
      if (/worker/i.test(msg)) {
        try { speakSystemMessage('System breach. PDF engine offline.', 'PDF engine offline.'); } catch { /* speech unavailable */ }
      }
      setExtractionError(msg || 'Could not read that file. Try another PDF.');
    } finally {
      setParsingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e) => ingestFiles(e.target.files);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      ingestFiles(e.dataTransfer.files);
    }
  };

  // Group parsedFiles by unitCode and merge each group into one
  // payload. Each group becomes one Course Pillar downstream.
  const buildGroupedPayloads = () => {
    const groups = {};
    for (const entry of parsedFiles) {
      const code = entry.unitCode || '__unknown';
      if (!groups[code]) groups[code] = [];
      groups[code].push(entry);
    }
    const codes = Object.keys(groups).sort();
    return codes.map((code) => {
      let acc = baseForCode(code === '__unknown' ? null : code);
      const fileList = [];
      for (const entry of groups[code]) {
        acc = mergeExtractionData(acc, { ...entry.deepData, rawText: entry.rawText });
        fileList.push(entry.name);
      }
      acc.sourceFiles = fileList;
      acc.academicTier = detectAcademicTier(acc.rawText || '', fileList);
      return acc;
    });
  };

  const handleContinue = () => {
    const payloads = buildGroupedPayloads();
    if (payloads.length === 0) return;
    onComplete(payloads);
  };

  const detectedGroups = (() => {
    const counts = {};
    for (const f of parsedFiles) {
      const code = f.unitCode || '__unknown';
      counts[code] = (counts[code] || 0) + 1;
    }
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  })();

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative p-12 overflow-y-auto" style={{ background: '#fafafa', color: '#18181b' }}>
      <div className="w-full max-w-2xl z-10 text-center">
        <div className="mb-8">
          <Brain size={56} className="mx-auto" color="#10b981" />
        </div>
        <h2 className="text-3xl font-black tracking-tight mb-3" style={{ color: '#18181b' }}>The Gravity Well</h2>
        <p className="font-medium mb-8 text-base" style={{ color: '#52525b' }}>
          Drop your Outline, Brief, and Rubric. The OS detects unit codes on each filename and builds one Course Pillar per code.
        </p>

        <div className="flex justify-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setPasteMode(false)}
            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition-all`}
            style={{
              background: !pasteMode ? '#10b981' : 'transparent',
              color: !pasteMode ? '#052e1f' : '#52525b',
              borderColor: !pasteMode ? '#10b981' : '#e4e4e7'
            }}
          >
            Drop PDF
          </button>
          <button
            type="button"
            onClick={() => setPasteMode(true)}
            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition-all`}
            style={{
              background: pasteMode ? '#10b981' : 'transparent',
              color: pasteMode ? '#052e1f' : '#52525b',
              borderColor: pasteMode ? '#10b981' : '#e4e4e7'
            }}
          >
            Paste Text
          </button>
        </div>

        {pasteMode && (
          <div className="mb-8">
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste the assessment description, brief, or rubric text here. The cockpit will run the same extraction it does on a PDF."
              className="w-full h-48 rounded-2xl p-4 text-sm outline-none font-mono leading-relaxed resize-none"
              style={{
                background: '#ffffff',
                color: '#18181b',
                border: '1px solid #e4e4e7'
              }}
              spellCheck={false}
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handlePasteSubmit}
                disabled={parsingFiles || pastedText.trim().length < 100}
                className="px-6 py-3 rounded-2xl font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                style={{ background: '#10b981', color: '#052e1f' }}
              >
                {parsingFiles ? 'Parsing...' : 'Process pasted text'}
              </button>
            </div>
          </div>
        )}

        <input
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          aria-label="Drop PDF files to ingest, or click to open the file picker"
          aria-disabled={parsingFiles}
          style={{
            width: '100%',
            padding: '40px 24px',
            borderRadius: 20,
            background: dragOver ? 'rgba(16, 185, 129, 0.06)' : '#ffffff',
            border: dragOver ? '1px solid #10b981' : '2px dashed #d4d4d8',
            boxShadow: dragOver ? '0 0 0 1px #10b981, 0 0 28px rgba(16, 185, 129, 0.22)' : '0 1px 0 rgba(0,0,0,0.04)',
            transition: 'all 220ms ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            cursor: parsingFiles ? 'wait' : 'pointer',
            opacity: parsingFiles ? 0.6 : 1
          }}
        >
          {parsingFiles
            ? <Loader2 size={44} className="animate-spin" color="#10b981" />
            : <UploadCloud size={44} color={dragOver ? '#10b981' : '#a1a1aa'} />}
          <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: dragOver ? '#10b981' : '#52525b' }}>
            {parsingFiles
              ? 'Initialising Grounding...'
              : parsedFiles.length === 0
                ? 'Drop Documents Here'
                : 'Add Another File'}
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a1a1aa' }}>
            PDF only  ·  parsed locally  ·  no upload
          </span>
        </div>

        {extractionError && (
          <div role="alert" className="mt-6 p-4 rounded-2xl text-left" style={{ background: '#fff1f2', border: '1px solid #fda4af' }}>
            <p className="text-sm font-bold mb-1" style={{ color: '#9f1239' }}>Extraction failed</p>
            <p className="text-xs font-medium leading-relaxed" style={{ color: '#be123c' }}>{extractionError}</p>
          </div>
        )}

        {parsedFiles.length > 0 && (
          <div className="mt-6 p-5 rounded-2xl text-left" style={{ background: '#ffffff', border: '1px solid #d1fae5' }}>
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#047857' }}>
              {parsedFiles.length} file{parsedFiles.length === 1 ? '' : 's'} parsed  ·  {detectedGroups.length} unit code{detectedGroups.length === 1 ? '' : 's'} detected
            </p>
            <ul className="text-xs font-medium space-y-3 mb-4">
              {detectedGroups.map(([code, count]) => (
                <li key={code} style={{ borderLeft: '2px solid #10b981', paddingLeft: 10 }}>
                  <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: '#18181b' }}>
                    {code === '__unknown' ? 'No unit code detected' : code}  ·  {count} file{count === 1 ? '' : 's'}
                  </div>
                  <ul style={{ marginTop: 4 }}>
                    {parsedFiles.filter(f => f.unitCode === code).map((f, i) => (
                      <li key={i} style={{ fontSize: 11, color: '#71717a' }}>{f.name}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#71717a' }}>
              Neural Map Ready  ·  one Course Pillar will be created per unit code
            </p>
            <button
              onClick={handleContinue}
              className="w-full py-3 rounded-xl font-black uppercase tracking-widest transition-all"
              style={{ background: '#10b981', color: '#052e1f' }}
            >
              Continue to Canvas  ·  Build {detectedGroups.length} pillar{detectedGroups.length === 1 ? '' : 's'}
            </button>
          </div>
        )}

        <p className="mt-6 text-[10px] uppercase tracking-widest font-bold" style={{ color: '#a1a1aa' }}>
          Parsed locally on your device. The file does not leave this machine.
        </p>
      </div>
    </div>
  );
}

export default function UniversalOnboarding() {
  return null;
}
