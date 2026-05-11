import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, User, Calendar, BookOpen, Brain, UploadCloud, Loader2, AlertCircle, Shield } from 'lucide-react';
import { processDocumentWithGCP } from '../services/DocumentAIService';
import { extractDeepCourseData, mergeExtractionData } from '../services/BriefService';
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
          Connect your digital brain to initialise the Neural-Docs linear editor.
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

export function Grounding({ onComplete, profile }) {
  const [parsingFiles, setParsingFiles] = useState(false);
  const [ingestStatus, setIngestStatus] = useState('');
  const [extractionError, setExtractionError] = useState(null);
  const [aggregated, setAggregated] = useState(null);
  const [fileNames, setFileNames] = useState([]);
  const [isOver, setIsOver] = useState(false);
  const fileInputRef = useRef(null);

  const [pasteMode, setPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const baseFromProfile = () => ({
    unitCode: profile.courseName,
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
    setIngestStatus('Initialising Grouping...');
    try {
      const next = aggregated || baseFromProfile();
      const deepData = extractDeepCourseData(text);
      const merged = mergeExtractionData(next, { ...deepData, rawText: text });
      setAggregated(merged);
      setFileNames(prev => [...prev, 'Pasted text']);
      setPastedText('');
      setIngestStatus('Neural Map Ready');
    } catch (err) {
      setExtractionError(err?.message || 'Could not parse the pasted text.');
    } finally {
      setParsingFiles(false);
      setTimeout(() => setIngestStatus(''), 2000);
    }
  };

  const classifyFile = (file) => {
    const n = (file.name || '').toLowerCase();
    if (/outline|course[ _-]?info|co[_-]/i.test(n)) return 0;
    if (/brief|assess|task|instruction/i.test(n)) return 1;
    if (/rubric|criteria|marking/i.test(n)) return 2;
    return 3;
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files).sort((a, b) => classifyFile(a) - classifyFile(b));
    if (files.length === 0) return;

    setExtractionError(null);
    setParsingFiles(true);
    setIngestStatus('Initialising Grouping...');

    try {
      // Course-Aware Splitting: group files by unit code before extraction
      // so each code (e.g. BABS1201 vs BABS1202) gets its own aggregation
      const codeRegex = /\b([A-Z]{3,4}\d{4})\b/;
      const groups = {};
      for (const file of files) {
        const match = (file.name || '').match(codeRegex);
        const code = match ? match[1] : (profile.courseName || 'General');
        if (!groups[code]) groups[code] = [];
        groups[code].push(file);
      }
      const codes = Object.keys(groups);
      if (codes.length > 1) {
        setIngestStatus(`Detected ${codes.length} unit codes: ${codes.join(', ')}`);
      }

      // Process each group independently so each code becomes a distinct pillar
      let combinedAggregated = aggregated;
      const allNames = [];
      for (const code of codes) {
        const groupFiles = groups[code].sort((a, b) => classifyFile(a) - classifyFile(b));
        setIngestStatus(`Sorting by Unit Code: ${code}`);
        let next = combinedAggregated || baseFromProfile();
        // Override unitCode for this group
        next = { ...next, unitCode: code };
        for (const file of groupFiles) {
          setIngestStatus(`Processing: ${file.name}`);
          const text = await processDocumentWithGCP(file, 'mock_jwt_token_xyz123');
          const deepData = extractDeepCourseData(text);
          next = mergeExtractionData(next, { ...deepData, rawText: text });
        }
        combinedAggregated = next;
        allNames.push(...groupFiles.map(f => f.name));
      }
      setAggregated(combinedAggregated);
      setFileNames(prev => [...prev, ...allNames]);
      setIngestStatus('Neural Map Ready');
    } catch (error) {
      console.error("Critical extraction failure:", error);
      setExtractionError(error?.message || 'Could not read that file. Try another PDF.');
    } finally {
      setParsingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setIngestStatus(''), 3000);
    }
  };

  const handleContinue = () => {
    if (aggregated) onComplete({ ...aggregated, sourceFiles: fileNames });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative p-8 md:p-12 bg-zinc-50 text-zinc-900 overflow-y-auto font-sans">
      <div className="w-full max-w-2xl z-10 text-center animate-fade-in">
        <header className="mb-10">
          <div className="inline-block p-4 border border-zinc-200 mb-6 bg-white shadow-sm rounded-md">
            <Brain size={36} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-zinc-900">Ingestion Drive</h2>
          <p className="text-sm text-zinc-500">Stage 02: Upload your syllabus, brief, or rubric to ground the OS.</p>
        </header>

        {/* Mode switcher */}
        <div className="flex justify-center gap-3 mb-8">
          <button
            type="button"
            onClick={() => setPasteMode(false)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none ${!pasteMode ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-300 hover:border-zinc-400'}`}
          >
            <UploadCloud size={14} />
            <span>Upload files</span>
          </button>
          <button
            type="button"
            onClick={() => setPasteMode(true)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none ${pasteMode ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-300 hover:border-zinc-400'}`}
          >
            <BookOpen size={14} />
            <span>Paste text</span>
          </button>
        </div>

        {pasteMode ? (
          <div className="mb-8 animate-fade-in">
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste assessment description or rubric text here..."
              className="w-full h-48 bg-white border border-zinc-300 rounded-lg p-5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none font-mono leading-relaxed resize-none transition-colors focus-visible:ring-3 focus-visible:ring-emerald-500"
              spellCheck={false}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={handlePasteSubmit}
                disabled={parsingFiles || pastedText.trim().length < 100}
                className="px-6 py-3 rounded-lg bg-zinc-900 hover:bg-black text-white text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none"
              >
                {parsingFiles ? 'Initialising...' : 'Process Text'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="relative w-full group cursor-pointer focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-lg"
            onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
            onDragLeave={() => setIsOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsOver(false); handleFileUpload({ target: { files: e.dataTransfer.files } }); }}
            onClick={() => fileInputRef.current?.click()}
          >
            {/* Siltbrand Pulse: 1px emerald-500 perimeter on hover/drag */}
            <AnimatePresence>
              {(isOver || parsingFiles) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -inset-[1px] border border-emerald-500 rounded-lg pointer-events-none z-0"
                />
              )}
            </AnimatePresence>

            <input
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
              tabIndex={-1}
            />

            <div className={`relative z-10 w-full py-14 rounded-lg bg-white border-2 border-dashed ${isOver ? 'border-emerald-500 bg-emerald-50/50' : 'border-zinc-300 group-hover:border-zinc-400'} transition-all flex flex-col items-center justify-center gap-4 ${parsingFiles ? 'opacity-60 cursor-wait' : ''}`}>
              {parsingFiles ? (
                <Loader2 size={28} className="animate-spin text-emerald-600" />
              ) : (
                <UploadCloud size={28} className={`${isOver ? 'text-emerald-600' : 'text-zinc-400'} group-hover:text-emerald-600 transition-colors`} />
              )}
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                  {parsingFiles ? 'Processing files...' : fileNames.length === 0 ? 'Drop PDF files here or click to browse' : 'Add more files'}
                </span>
                <span className="text-xs text-zinc-400 font-mono" role="status" aria-live="polite">
                  {ingestStatus || 'Accepts outlines, briefs, and rubrics'}
                </span>
              </div>
            </div>
          </button>
        )}

        {/* Ingested files list */}
        {fileNames.length > 0 && !aggregated && (
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {fileNames.map((name, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-medium rounded-md">
                <UploadCloud size={10} className="flex-shrink-0" />
                <span className="truncate max-w-[180px]">{name}</span>
              </span>
            ))}
          </div>
        )}

        {extractionError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 border border-red-200 bg-red-50 rounded-lg text-left flex items-start gap-3"
          >
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800 mb-1">Extraction failed</p>
              <p className="text-sm text-red-600">{extractionError}</p>
            </div>
          </motion.div>
        )}

        {aggregated && fileNames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 border border-emerald-200 bg-emerald-50 rounded-lg text-left"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm font-bold text-emerald-800 mb-1">Grounding successful</p>
                <p className="text-xs text-emerald-600">
                  {fileNames.length} source{fileNames.length === 1 ? '' : 's'} integrated
                  {aggregated.academicTier ? ` (Tier: ${aggregated.academicTier})` : ''}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-emerald-300 text-emerald-700 text-xs font-bold rounded-md">
                <Shield size={12} />
                <span>Local only</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="border-l-2 border-emerald-300 pl-3">
                <span className="text-zinc-900 block text-lg font-bold">{aggregated.assessmentTitles?.length || 0}</span>
                <span className="text-xs text-zinc-500 font-medium">Assessments</span>
              </div>
              <div className="border-l-2 border-emerald-300 pl-3">
                <span className="text-zinc-900 block text-lg font-bold">{aggregated.learningOutcomes?.length || 0}</span>
                <span className="text-xs text-zinc-500 font-medium">Outcomes</span>
              </div>
              <div className="border-l-2 border-emerald-300 pl-3">
                <span className="text-zinc-900 block text-lg font-bold">{aggregated.udlPrinciples?.length || 0}</span>
                <span className="text-xs text-zinc-500 font-medium">UDL Tags</span>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="w-full py-4 bg-zinc-900 hover:bg-black text-white text-sm font-bold rounded-lg transition-all focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none shadow-md"
            >
              Enter Dashboard
            </button>
          </motion.div>
        )}

        <footer className="mt-12 border-t border-zinc-200 pt-6 flex items-center justify-center gap-3 text-zinc-400">
          <Shield size={14} />
          <span className="text-xs font-medium">Zero-Disclosure: All data stays on this device.</span>
        </footer>
      </div>
    </div>
  );
}

export default function UniversalOnboarding() {
  return null;
}
