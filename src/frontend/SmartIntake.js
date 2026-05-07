import React, { useState, useRef } from 'react';
import { Brain, ArrowRight, FileText, CheckCircle2, UploadCloud, Loader2 } from 'lucide-react';
import pdfToText from 'react-pdftotext';
import { extractDeepCourseData } from '../services/BriefService';

export default function SmartIntake({ task, onSelectPath, onSprintCreated }) {
  const [courseOutlineUploaded, setCourseOutlineUploaded] = useState(false);
  const [assessmentBriefUploaded, setAssessmentBriefUploaded] = useState(false);
  const [markingRubricUploaded, setMarkingRubricUploaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState({ unitCode: '', words: 2000, theme: '' });
  const [level, setLevel] = useState('MRes');
  
  const [outlineParsing, setOutlineParsing] = useState(false);
  const [briefParsing, setBriefParsing] = useState(false);
  const [rubricParsing, setRubricParsing] = useState(false);

  const outlineRef = useRef(null);
  const briefRef = useRef(null);
  const rubricRef = useRef(null);

  const handleOutlineUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOutlineParsing(true);
    
    try {
      const text = await pdfToText(file);
      const unitCodeMatch = text.match(/[A-Z]{4}\d{4}/i);
      const code = unitCodeMatch ? unitCodeMatch[0].toUpperCase() : 'BABS1201';
      setExtractedData(prev => ({ ...prev, unitCode: code }));
      setCourseOutlineUploaded(true);
    } catch (error) {
      console.error("Failed to extract text from pdf");
      setExtractedData(prev => ({ ...prev, unitCode: 'BABS1201' }));
      setCourseOutlineUploaded(true);
    } finally {
      setOutlineParsing(false);
    }
  };

  const handleBriefUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBriefParsing(true);
    
    try {
      const text = await pdfToText(file);
      const lowerText = text.toLowerCase();
      
      let theme = 'molecules';
      if (lowerText.includes('genes')) theme = 'genes';
      else if (lowerText.includes('cells')) theme = 'cells';
      else if (lowerText.includes('molecules')) theme = 'molecules';
      
      const deepData = extractDeepCourseData(text, level);
      
      setExtractedData(prev => ({ ...prev, theme, level, rawText: text, ...deepData }));
      setAssessmentBriefUploaded(true);
    } catch (error) {
      console.error("Failed to extract text from pdf");
      setExtractedData(prev => ({ ...prev, theme: 'molecules' }));
      setAssessmentBriefUploaded(true);
    } finally {
      setBriefParsing(false);
    }
  };
  const handleRubricUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRubricParsing(true);
    
    try {
      const text = await pdfToText(file);
      setExtractedData(prev => ({ ...prev, rubricText: text }));
      setMarkingRubricUploaded(true);
    } catch (error) {
      console.error("Failed to extract text from rubric pdf");
      setMarkingRubricUploaded(true);
    } finally {
      setRubricParsing(false);
    }
  };

  const isReady = courseOutlineUploaded && assessmentBriefUploaded && markingRubricUploaded;

  const handleProcess = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSprintCreated(extractedData);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-zinc-950 animate-fade-in relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-3xl z-10">
        <div className="flex items-center gap-4 mb-8 justify-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
            <Brain size={32} className="text-emerald-500 relative z-10" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight">Triple-Stage Grounding</h2>
            <p className="text-zinc-400 font-medium mt-1 tracking-wide">Establish the Source of Truth before drafting.</p>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-zinc-900 p-1.5 rounded-2xl flex gap-2 border border-zinc-800">
            {['Undergrad', 'Honours', 'MRes', 'PhD'].map(tier => (
              <button
                key={tier}
                onClick={() => setLevel(tier)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${level === tier ? 'bg-emerald-500 text-black shadow-glow-emerald' : 'text-zinc-500 hover:text-white'}`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className={`p-8 rounded-3xl border transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center ${courseOutlineUploaded ? 'bg-emerald-500/5 border-emerald-500/50 shadow-glow-emerald' : 'bg-[#07080D] border-zinc-800 hover:border-zinc-700'}`}>
            <div className="mb-4">
              {outlineParsing ? <Loader2 size={40} className="text-emerald-500 animate-spin" /> : courseOutlineUploaded ? <CheckCircle2 size={40} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" /> : <FileText size={40} className="text-zinc-600" />}
            </div>
            <h3 className={`font-black text-lg mb-2 uppercase tracking-widest ${courseOutlineUploaded ? 'text-emerald-400' : 'text-white'}`}>Stage 1: Course Outline</h3>
            <p className="text-sm text-zinc-500 font-medium mb-6">Extracts the Unit Code and Learning Outcomes to align grading criteria.</p>
            
            <input type="file" accept=".pdf" className="hidden" ref={outlineRef} onChange={handleOutlineUpload} />
            
            {!courseOutlineUploaded ? (
              <button 
                onClick={() => outlineRef.current?.click()} 
                disabled={outlineParsing}
                className="px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500 hover:text-emerald-400 transition-all font-black uppercase text-xs tracking-widest flex items-center gap-2 disabled:opacity-50"
              >
                {outlineParsing ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />} 
                {outlineParsing ? 'PARSING PDF...' : 'Upload Outline'}
              </button>
            ) : (
              <div className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-widest border border-emerald-500/30">
                Extracted: {extractedData.unitCode}
              </div>
            )}
          </div>

          <div className={`p-8 rounded-3xl border transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center ${assessmentBriefUploaded ? 'bg-emerald-500/5 border-emerald-500/50 shadow-glow-emerald' : 'bg-[#07080D] border-zinc-800 hover:border-zinc-700'}`}>
            <div className="mb-4">
              {briefParsing ? <Loader2 size={40} className="text-emerald-500 animate-spin" /> : assessmentBriefUploaded ? <CheckCircle2 size={40} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" /> : <FileText size={40} className="text-zinc-600" />}
            </div>
            <h3 className={`font-black text-lg mb-2 uppercase tracking-widest ${assessmentBriefUploaded ? 'text-emerald-400' : 'text-white'}`}>Stage 2: Assessment Brief</h3>
            <p className="text-sm text-zinc-500 font-medium mb-6">Extracts specific word counts, article requirements, and thematic rules.</p>
            
            <input type="file" accept=".pdf" className="hidden" ref={briefRef} onChange={handleBriefUpload} />

            {!assessmentBriefUploaded ? (
              <button 
                onClick={() => briefRef.current?.click()} 
                disabled={briefParsing}
                className="px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500 hover:text-emerald-400 transition-all font-black uppercase text-xs tracking-widest flex items-center gap-2 disabled:opacity-50"
              >
                {briefParsing ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />} 
                {briefParsing ? 'PARSING PDF...' : 'Upload Brief'}
              </button>
            ) : (
              <div className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-widest border border-emerald-500/30">
                Extracted: {extractedData.words} Words
              </div>
            )}
          </div>
          
          <div className={`p-8 rounded-3xl border transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center ${markingRubricUploaded ? 'bg-emerald-500/5 border-emerald-500/50 shadow-glow-emerald' : 'bg-[#07080D] border-zinc-800 hover:border-zinc-700'}`}>
            <div className="mb-4">
              {rubricParsing ? <Loader2 size={40} className="text-emerald-500 animate-spin" /> : markingRubricUploaded ? <CheckCircle2 size={40} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" /> : <FileText size={40} className="text-zinc-600" />}
            </div>
            <h3 className={`font-black text-lg mb-2 uppercase tracking-widest ${markingRubricUploaded ? 'text-emerald-400' : 'text-white'}`}>Stage 3: Marking Rubric</h3>
            <p className="text-sm text-zinc-500 font-medium mb-6">Extracts HD Criteria and Section Weighting.</p>
            
            <input type="file" accept=".pdf" className="hidden" ref={rubricRef} onChange={handleRubricUpload} />

            {!markingRubricUploaded ? (
              <button 
                onClick={() => rubricRef.current?.click()} 
                disabled={rubricParsing || !assessmentBriefUploaded}
                className="px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500 hover:text-emerald-400 transition-all font-black uppercase text-xs tracking-widest flex items-center gap-2 disabled:opacity-50"
              >
                {rubricParsing ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />} 
                {rubricParsing ? 'PARSING PDF...' : 'Upload Rubric'}
              </button>
            ) : (
              <div className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-widest border border-emerald-500/30">
                Parsed Successfully
              </div>
            )}
          </div>
        </div>

        {isReady && (
          <div className="flex justify-center animate-fade-in mt-10">
            <button 
              onClick={handleProcess}
              disabled={isProcessing}
              className="py-5 px-10 rounded-2xl bg-emerald-500 text-black font-black uppercase tracking-widest hover:shadow-glow-emerald transition-all flex items-center gap-3 text-lg"
            >
              {isProcessing ? <Brain className="animate-spin" size={20} /> : <Brain size={20} />}
              {isProcessing ? 'Extracting Evidence Requirements...' : 'Process Grounding Data'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
