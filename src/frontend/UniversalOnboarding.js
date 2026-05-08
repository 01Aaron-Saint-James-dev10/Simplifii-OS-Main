import React, { useRef, useState } from 'react';
import { ArrowRight, User, Calendar, BookOpen, Brain, UploadCloud, Loader2 } from 'lucide-react';
import { processDocumentWithGCP } from '../services/DocumentAIService';
import { extractDeepCourseData, mergeExtractionData } from '../services/BriefService';

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
              placeholder="Subject Name (e.g., BABS1201)" 
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
              <option value="highschool">High School</option>
              <option value="undergrad">Undergraduate</option>
              <option value="mres">Masters / MRes</option>
              <option value="phd">Doctoral</option>
            </select>
          </div>
          <button 
            type="submit"
            className="w-full py-4 rounded-xl bg-blue-500 text-black font-black uppercase tracking-widest hover:bg-blue-400 transition-all shadow-glow-blue"
          >
            Initialize Knowledge Graph
          </button>
        </form>
      </div>
    </div>
  );
}

export function Grounding({ onComplete, profile }) {
  const [parsingFiles, setParsingFiles] = useState(false);
  const [extractionError, setExtractionError] = useState(null);
  const [aggregated, setAggregated] = useState(null);
  const [fileNames, setFileNames] = useState([]);
  const fileInputRef = useRef(null);

  const baseFromProfile = () => ({
    unitCode: profile.courseName,
    level: profile.level,
    theme: 'General'
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setExtractionError(null);
    setParsingFiles(true);
    try {
      let next = aggregated || baseFromProfile();
      for (const file of files) {
        const text = await processDocumentWithGCP(file, 'mock_jwt_token_xyz123');
        const deepData = extractDeepCourseData(text);
        next = mergeExtractionData(next, { ...deepData, rawText: text });
      }
      setAggregated(next);
      setFileNames(prev => [...prev, ...files.map(f => f.name)]);
    } catch (error) {
      console.error("Critical extraction failure:", error);
      setExtractionError(error?.message || 'Could not read that file. Try another PDF.');
    } finally {
      setParsingFiles(false);
      // Reset the input so the same filename can be re-selected.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleContinue = () => {
    if (aggregated) onComplete(aggregated);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative p-12 bg-[#07080D] text-white overflow-y-auto">
      <div className="w-full max-w-2xl z-10 text-center animate-fade-in">
        <div className="mb-8">
          <Brain size={64} className="text-emerald-500 mx-auto drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]" />
        </div>
        <h2 className="text-4xl font-black text-white tracking-tight mb-4">Triple-Stage Grounding</h2>
        <p className="text-zinc-400 font-medium mb-12 text-lg">Drop your Outline, Brief, and Rubric here.</p>
        
        <input
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={parsingFiles}
          className="w-full py-8 rounded-3xl bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer disabled:opacity-50"
        >
          {parsingFiles ? <Loader2 size={48} className="animate-spin text-emerald-500" /> : <UploadCloud size={48} className="text-zinc-600 group-hover:text-emerald-500 transition-colors" />}
          <span className="text-xl font-black uppercase tracking-widest text-zinc-400 group-hover:text-emerald-400 transition-colors">
            {parsingFiles
              ? 'Extracting Metadata...'
              : fileNames.length === 0
                ? 'Drop Documents Here'
                : '+ Add Another File'}
          </span>
        </button>
        {extractionError && (
          <div role="alert" className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-left">
            <p className="text-red-400 text-sm font-bold mb-1">Extraction failed</p>
            <p className="text-red-300/80 text-xs font-medium leading-relaxed">{extractionError}</p>
          </div>
        )}

        {aggregated && fileNames.length > 0 && (
          <div className="mt-6 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/30 text-left">
            <p className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-3">{fileNames.length} file{fileNames.length === 1 ? '' : 's'} aggregated</p>
            <ul className="text-zinc-400 text-xs font-medium space-y-1 mb-4">
              {fileNames.map((name, i) => <li key={i}>· {name}</li>)}
            </ul>
            <div className="grid grid-cols-3 gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">
              <div><span className="text-emerald-400 block text-xl font-black">{aggregated.learningOutcomes?.length || 0}</span>Learning Outcomes</div>
              <div><span className="text-emerald-400 block text-xl font-black">{aggregated.assessmentDates?.length || 0}</span>Dates</div>
              <div><span className="text-emerald-400 block text-xl font-black">{aggregated.udlPrinciples?.length || 0}</span>UDL Principles</div>
            </div>
            <button
              onClick={handleContinue}
              className="w-full py-3 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest hover:bg-emerald-400 transition-all"
            >
              Continue to Canvas
            </button>
          </div>
        )}

        <p className="mt-6 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
          Parsed locally on your Mac. The file does not leave this device.
        </p>
      </div>
    </div>
  );
}

export default function UniversalOnboarding() {
  return null;
}
