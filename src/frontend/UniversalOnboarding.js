import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, User, Calendar, BookOpen, Brain, UploadCloud, Loader2, AlertCircle, Shield, CheckCircle } from 'lucide-react';
import { processDocumentWithGCP } from '../services/DocumentAIService';
import { extractDeepCourseData, mergeExtractionData } from '../services/BriefService';
import { speakSystemMessage } from '../services/MessagingHub';

/**
 * Phase Progress Indicator Component
 * Shows the current stage in the onboarding flow
 */
function PhaseIndicator({ currentPhase, totalPhases = 4 }) {
  const phases = [
    { id: 1, label: 'Start' },
    { id: 2, label: 'Identity' },
    { id: 3, label: 'Course' },
    { id: 4, label: 'Ground' }
  ];
  
  return (
    <nav 
      className="absolute top-6 left-6 z-50" 
      aria-label="Onboarding progress"
      role="navigation"
    >
      <ol className="flex items-center gap-2">
        {phases.slice(0, totalPhases).map((phase, index) => {
          const isComplete = index + 1 < currentPhase;
          const isCurrent = index + 1 === currentPhase;
          
          return (
            <li key={phase.id} className="flex items-center gap-2">
              <span
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300
                  ${isComplete 
                    ? 'bg-primary text-primary-foreground' 
                    : isCurrent 
                      ? 'bg-primary/20 text-primary border-2 border-primary' 
                      : 'bg-muted text-muted-foreground'
                  }
                `}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isComplete ? <CheckCircle size={14} /> : index + 1}
              </span>
              <span className={`hidden sm:block text-xs font-semibold ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                {phase.label}
              </span>
              {index < totalPhases - 1 && (
                <div className={`w-6 h-0.5 rounded-full transition-colors duration-300 ${isComplete ? 'bg-primary' : 'bg-border'}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function StartIgnition({ onStart, currentPhase = 1 }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative p-12 bg-background text-foreground overflow-y-auto transition-colors duration-300">
      <PhaseIndicator currentPhase={currentPhase} />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-2xl z-10 text-center animate-fade-in">
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-6 leading-tight text-foreground">
          Universal Context.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
            Zero Friction.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed mb-10 max-w-lg mx-auto">
          Connect your digital brain to initialize the Neural-Docs linear editor.
        </p>
        <button
          onClick={onStart}
          className="px-10 py-5 rounded-full bg-primary text-primary-foreground font-bold text-base uppercase tracking-widest hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 flex items-center gap-3 mx-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Begin onboarding process"
        >
          Initiate Handshake <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

export function IdentityGate({ onComplete, profile, setProfile, currentPhase = 2 }) {
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
    <div className="flex-1 flex flex-col items-center justify-center relative p-8 md:p-12 bg-background text-foreground overflow-y-auto transition-colors duration-300">
      <PhaseIndicator currentPhase={currentPhase} />
      
      <div className="w-full max-w-2xl z-10 text-center animate-fade-in">
        <div className="bg-card border border-border p-8 md:p-12 rounded-2xl shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <User size={32} className="text-primary" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-card-foreground">Identity Gate</h2>
          <p className="text-muted-foreground mb-8 text-base leading-relaxed">
            Welcome, <strong className="text-primary">{profile.name}</strong>. Pick the processing styles you want the OS to default to. You can change these any time.
          </p>

          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Processing Styles</p>
            <div className="flex flex-wrap justify-center gap-3" role="group" aria-label="Select processing styles">
              {styleOptions.map(opt => {
                const selected = profile.processingStyles?.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    onClick={() => toggleStyle(opt.key)}
                    title={opt.hint}
                    aria-pressed={selected}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      selected 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border'
                    }`}
                  >
                    {opt.key}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-4 font-medium">
              No diagnoses required. Pick what helps you read and write.
            </p>
          </div>

          <button
            onClick={onComplete}
            className="w-full py-4 rounded-xl bg-foreground text-background font-bold uppercase tracking-widest hover:opacity-90 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Build My Profile
          </button>
        </div>
      </div>
    </div>
  );
}

export function TemporalBaseline({ onComplete, profile, currentPhase = 3 }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative p-8 md:p-12 bg-background text-foreground overflow-y-auto transition-colors duration-300">
      <PhaseIndicator currentPhase={currentPhase} />
      
      <div className="w-full max-w-2xl z-10 text-center animate-fade-in">
        <div className="bg-card border border-border p-8 md:p-12 rounded-2xl shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <Calendar size={32} className="text-amber-500" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-card-foreground">Temporal Baseline</h2>
          <p className="text-muted-foreground mb-8 text-base leading-relaxed">
            Deadline approaching on <strong className="text-amber-500">{profile.deadline}</strong>. Friction Map adjusted.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onComplete}
              className="flex-1 py-4 rounded-xl bg-amber-500 text-black font-bold uppercase tracking-widest hover:bg-amber-400 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            >
              Confirm Sprint
            </button>
            <button
              onClick={onComplete}
              className="flex-1 py-4 rounded-xl bg-muted text-foreground font-bold uppercase tracking-widest hover:bg-muted/80 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CourseDefinition({ onComplete, profile, setProfile, currentPhase = 3 }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete();
  };
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative p-8 md:p-12 bg-background text-foreground overflow-y-auto transition-colors duration-300">
      <PhaseIndicator currentPhase={currentPhase} />
      
      <div className="w-full max-w-2xl z-10 text-center animate-fade-in">
        <div className="bg-card border border-border p-8 md:p-12 rounded-2xl shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
            <BookOpen size={32} className="text-blue-500" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-card-foreground">Course Definition</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="courseName" className="sr-only">Subject Name</label>
              <input
                id="courseName"
                type="text"
                placeholder="Subject Name (e.g. BABS1201, Year 12 English, MATH3000)"
                required
                value={profile.courseName || ''}
                onChange={(e) => setProfile({ ...profile, courseName: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-6 py-4 text-foreground placeholder-muted-foreground focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent outline-none text-center text-base font-semibold transition-all"
              />
            </div>
            
            <div>
              <label htmlFor="level" className="sr-only">Academic Level</label>
              <select
                id="level"
                required
                value={profile.level || ''}
                onChange={(e) => setProfile({ ...profile, level: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-6 py-4 text-foreground focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent outline-none text-center text-base font-semibold appearance-none cursor-pointer transition-all"
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
            
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-3">Stream</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="radiogroup" aria-label="Select your stream">
                {[
                  { id: 'primary', label: 'Primary', sub: 'K-6' },
                  { id: 'secondary', label: 'Secondary', sub: 'Y7-10' },
                  { id: 'tertiary', label: 'Tertiary', sub: 'Uni / MRes' },
                  { id: 'tafe', label: 'TAFE', sub: 'Trade' },
                  { id: 'homeschool', label: 'Homeschool', sub: 'Self-led' }
                ].map((s) => {
                  const active = profile.streamId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setProfile({ ...profile, streamId: s.id })}
                      className={`px-3 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        active 
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' 
                          : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                      }`}
                      title={`Stream: ${s.label} (${s.sub})`}
                    >
                      <div>{s.label}</div>
                      <div className="text-[9px] opacity-70 mt-1 font-medium">{s.sub}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 text-center leading-relaxed">
                Pick the brain you are building for. The cockpit re-skins itself: vocabulary, default landing, focus session length.
              </p>
            </div>
            
            <button
              type="submit"
              disabled={!profile.streamId}
              className="w-full py-4 rounded-xl bg-blue-500 text-white font-bold uppercase tracking-widest hover:bg-blue-400 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {profile.streamId ? 'Initialize Knowledge Graph' : 'Pick a stream above'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function Grounding({ onComplete, profile, currentPhase = 4 }) {
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

      let combinedAggregated = aggregated;
      const allNames = [];
      for (const code of codes) {
        const groupFiles = groups[code].sort((a, b) => classifyFile(a) - classifyFile(b));
        setIngestStatus(`Sorting by Unit Code: ${code}`);
        let next = combinedAggregated || baseFromProfile();
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
    <div className="flex-1 flex flex-col items-center justify-center relative p-8 md:p-12 bg-background text-foreground overflow-y-auto font-sans transition-colors duration-300">
      <PhaseIndicator currentPhase={currentPhase} />
      
      <div className="w-full max-w-2xl z-10 text-center animate-fade-in">
        <header className="mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Brain size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">Ingestion Drive</h2>
          <p className="text-sm text-muted-foreground">Stage 02: Upload your syllabus, brief, or rubric to ground the OS.</p>
        </header>

        {/* Mode switcher */}
        <div className="flex justify-center gap-3 mb-8" role="tablist" aria-label="Input method">
          <button
            type="button"
            role="tab"
            aria-selected={!pasteMode}
            onClick={() => setPasteMode(false)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              !pasteMode 
                ? 'bg-foreground text-background border-foreground' 
                : 'bg-card text-muted-foreground border-border hover:border-muted-foreground'
            }`}
          >
            <UploadCloud size={14} />
            <span>Upload files</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pasteMode}
            onClick={() => setPasteMode(true)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              pasteMode 
                ? 'bg-foreground text-background border-foreground' 
                : 'bg-card text-muted-foreground border-border hover:border-muted-foreground'
            }`}
          >
            <BookOpen size={14} />
            <span>Paste text</span>
          </button>
        </div>

        {pasteMode ? (
          <div className="mb-8 animate-fade-in" role="tabpanel">
            <label htmlFor="pasteArea" className="sr-only">Paste assessment text</label>
            <textarea
              id="pasteArea"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste assessment description or rubric text here..."
              className="w-full h-48 bg-card border border-border rounded-xl p-5 text-sm text-foreground placeholder:text-muted-foreground outline-none font-mono leading-relaxed resize-none transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
              spellCheck={false}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={handlePasteSubmit}
                disabled={parsingFiles || pastedText.trim().length < 100}
                className="px-6 py-3 rounded-lg bg-foreground text-background text-sm font-bold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {parsingFiles ? 'Initialising...' : 'Process Text'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            role="tabpanel"
            className="relative w-full group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
            onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
            onDragLeave={() => setIsOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsOver(false); handleFileUpload({ target: { files: e.dataTransfer.files } }); }}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload PDF files"
          >
            <AnimatePresence>
              {(isOver || parsingFiles) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -inset-[2px] border-2 border-primary rounded-xl pointer-events-none z-0"
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
              aria-hidden="true"
            />

            <div className={`relative z-10 w-full py-14 rounded-xl bg-card border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
              isOver 
                ? 'border-primary bg-primary/5' 
                : 'border-border group-hover:border-muted-foreground'
            } ${parsingFiles ? 'opacity-60 cursor-wait' : ''}`}>
              {parsingFiles ? (
                <Loader2 size={28} className="animate-spin text-primary" />
              ) : (
                <UploadCloud size={28} className={`transition-colors duration-200 ${isOver ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
              )}
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground transition-colors">
                  {parsingFiles ? 'Processing files...' : fileNames.length === 0 ? 'Drop PDF files here or click to browse' : 'Add more files'}
                </span>
                <span className="text-xs text-muted-foreground font-mono" role="status" aria-live="polite">
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
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-muted border border-border text-muted-foreground text-xs font-medium rounded-lg">
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
            className="mt-6 p-4 border border-destructive/30 bg-destructive/10 rounded-xl text-left flex items-start gap-3"
            role="alert"
          >
            <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-destructive mb-1">Extraction failed</p>
              <p className="text-sm text-destructive/80">{extractionError}</p>
            </div>
          </motion.div>
        )}

        {aggregated && fileNames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 border border-primary/30 bg-primary/5 rounded-xl text-left"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm font-bold text-foreground mb-1">Grounding successful</p>
                <p className="text-xs text-muted-foreground">
                  {fileNames.length} source{fileNames.length === 1 ? '' : 's'} integrated
                  {aggregated.academicTier ? ` (Tier: ${aggregated.academicTier})` : ''}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-card border border-primary/30 text-primary text-xs font-bold rounded-lg">
                <Shield size={12} />
                <span>Local only</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="border-l-2 border-primary pl-3">
                <span className="text-foreground block text-lg font-bold">{aggregated.assessmentTitles?.length || 0}</span>
                <span className="text-xs text-muted-foreground font-medium">Assessments</span>
              </div>
              <div className="border-l-2 border-primary pl-3">
                <span className="text-foreground block text-lg font-bold">{aggregated.learningOutcomes?.length || 0}</span>
                <span className="text-xs text-muted-foreground font-medium">Outcomes</span>
              </div>
              <div className="border-l-2 border-primary pl-3">
                <span className="text-foreground block text-lg font-bold">{aggregated.udlPrinciples?.length || 0}</span>
                <span className="text-xs text-muted-foreground font-medium">UDL Tags</span>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="w-full py-4 bg-foreground text-background text-sm font-bold rounded-xl transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shadow-lg"
            >
              Enter Dashboard
            </button>
          </motion.div>
        )}

        <footer className="mt-12 border-t border-border pt-6 flex items-center justify-center gap-3 text-muted-foreground">
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
