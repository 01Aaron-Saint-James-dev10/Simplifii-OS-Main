import React, { useState, useRef } from 'react';
import { Brain, ArrowRight, FileText, CheckCircle2, UploadCloud, Loader2 } from 'lucide-react';
import { extractDeepCourseData, extractDynamicThemes } from '../services/BriefService';
import { useSettings } from './SettingsContext';
import { processDocumentWithGCP } from '../services/DocumentAIService';
import { COLOUR_WARN_BORDER, COLOUR_WARN_GLOW, GLOW_DROP_50 } from '../theme/tokens';

export default function SmartIntake({ task, onSelectPath, onSprintCreated }) {
  const { eduLevel, setEduLevel, setMode } = useSettings();
  const [filesUploaded, setFilesUploaded] = useState({ outline: false, brief: false, rubric: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState({ unitCode: '', words: 2000, theme: '' });
  const [showNeuroSuggest, setShowNeuroSuggest] = useState(false);
  
  const [parsingFiles, setParsingFiles] = useState(false);
  const fileInputRef = useRef(null);

  const extractFallbackMetadata = (fileName) => {
    const lowerName = fileName.toLowerCase();
    let tier = 'tertiary';
    if (lowerName.includes('mres') || lowerName.includes('master')) tier = 'mres';
    if (lowerName.includes('tafe')) tier = 'tafe';
    if (lowerName.includes('primary')) tier = 'primary';
    if (lowerName.includes('secondary')) tier = 'secondary';
    
    return tier;
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    console.log("File upload triggered. Files selected:", files.length);
    if (files.length === 0) return;
    
    setParsingFiles(true);
    
    let combinedExtractedData = { unitCode: '', words: 2000, theme: '' };
    const uploadState = { outline: false, brief: false, rubric: false };
    
    try {
      await Promise.all(files.map(async (file) => {
        const lowerName = file.name.toLowerCase();
        let text = '';
        
        const determineType = () => {
          if (lowerName.includes('outline')) { uploadState.outline = true; return 'outline'; }
          if (lowerName.includes('brief') || lowerName.includes('assessment')) { uploadState.brief = true; return 'brief'; }
          if (lowerName.includes('rubric') || lowerName.includes('criteria')) { uploadState.rubric = true; return 'rubric'; }
          uploadState.brief = true; return 'brief';
        };
        const docType = determineType();

        try {
          // Instead of react-pdftotext, we use the GCP Document AI Service.
          // Note: In a full OAuth flow, we would pass the actual user token here.
          text = await processDocumentWithGCP(file, 'mock_jwt_token_xyz123');
        } catch (err) {
          console.error(`Failed to extract text from ${file.name}`);
          const fallbackTier = extractFallbackMetadata(file.name);
          if (fallbackTier) setEduLevel(fallbackTier);
          combinedExtractedData.level = fallbackTier;
          combinedExtractedData.theme = 'General Studies';
          return;
        }

        if (docType === 'outline') {
          const unitCodeMatch = text.match(/[A-Z]{4}\d{4}/i);
          combinedExtractedData.unitCode = unitCodeMatch ? unitCodeMatch[0].toUpperCase() : '';
        } else if (docType === 'brief') {
          const theme = extractDynamicThemes(text);
          const deepData = extractDeepCourseData(text);
          if (deepData.detectedLevel) {
            setEduLevel(deepData.detectedLevel);
            if (deepData.detectedLevel === 'tertiary') setShowNeuroSuggest(true);
          }
          combinedExtractedData = { ...combinedExtractedData, theme, level: deepData.detectedLevel || eduLevel, rawText: text, ...deepData };
        } else if (docType === 'rubric') {
          combinedExtractedData.rubricText = text;
          const theme = extractDynamicThemes(text);
          const deepData = extractDeepCourseData(text);
          if (deepData.detectedLevel) setEduLevel(deepData.detectedLevel);
          combinedExtractedData = { ...combinedExtractedData, theme, level: deepData.detectedLevel || eduLevel, rawText: text, ...deepData };
        }
      }));

      setExtractedData(prev => ({ ...prev, ...combinedExtractedData }));
      setFilesUploaded({ ...uploadState }); // Ensure new reference
    } catch (error) {
      console.error("Critical extraction failure:", error);
    } finally {
      setParsingFiles(false);
      if (e.target) e.target.value = null; // Reset input to allow re-upload
    }
  };

  const isReady = filesUploaded.brief || filesUploaded.outline || filesUploaded.rubric;

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
          <div className="text-center">
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
              className="px-8 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500 hover:text-emerald-400 transition-all font-black uppercase tracking-widest flex items-center gap-3 disabled:opacity-50 mx-auto shadow-xl"
            >
              {parsingFiles ? <Loader2 size={24} className="animate-spin" /> : <UploadCloud size={24} />} 
              {parsingFiles ? 'EXTRACTING METADATA...' : 'DROP DOCUMENTS HERE'}
            </button>
            <p className="text-zinc-500 text-xs mt-3 font-medium tracking-wide">Upload Outline, Brief, and Rubric simultaneously for deep grounding.</p>
          </div>
        </div>

        {showNeuroSuggest && (
          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl mb-8 animate-fade-in" style={{ boxShadow: `0 0 15px ${COLOUR_WARN_BORDER}` }}>
            <div className="flex items-center gap-3">
              <Brain size={24} className="text-amber-500" />
              <div>
                <h4 className="text-amber-500 font-black tracking-widest text-xs uppercase">Dense Academic Text Detected</h4>
                <p className="text-zinc-400 text-sm font-medium">Would you like to enable the Lexical/OpenDyslexic layout for easier reading?</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNeuroSuggest(false)} className="px-4 py-2 text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest transition-all">Dismiss</button>
              <button 
                onClick={() => { setMode('lexical'); setShowNeuroSuggest(false); }} 
                className="px-4 py-2 bg-amber-500 text-black rounded-lg text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all"
                style={{ boxShadow: `0 0 10px ${COLOUR_WARN_GLOW}` }}
              >
                Enable Layout
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className={`p-8 rounded-3xl border transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center ${filesUploaded.outline ? 'bg-emerald-500/5 border-emerald-500/50 shadow-glow-emerald' : 'bg-[#07080D] border-zinc-800 opacity-50'}`}>
            <div className="mb-4">
              {filesUploaded.outline ? <CheckCircle2 size={40} className="text-emerald-400" style={{ filter: `drop-shadow(0 0 10px ${GLOW_DROP_50})` }} /> : <FileText size={40} className="text-zinc-600" />}
            </div>
            <h3 className={`font-black text-lg mb-2 uppercase tracking-widest ${filesUploaded.outline ? 'text-emerald-400' : 'text-white'}`}>Stage 1: Course Outline</h3>
            {filesUploaded.outline && (
              <div className="px-4 py-2 mt-4 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-widest border border-emerald-500/30">
                Extracted: {extractedData.unitCode}
              </div>
            )}
          </div>

          <div className={`p-8 rounded-3xl border transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center ${filesUploaded.brief ? 'bg-emerald-500/5 border-emerald-500/50 shadow-glow-emerald' : 'bg-[#07080D] border-zinc-800 opacity-50'}`}>
            <div className="mb-4">
              {filesUploaded.brief ? <CheckCircle2 size={40} className="text-emerald-400" style={{ filter: `drop-shadow(0 0 10px ${GLOW_DROP_50})` }} /> : <FileText size={40} className="text-zinc-600" />}
            </div>
            <h3 className={`font-black text-lg mb-2 uppercase tracking-widest ${filesUploaded.brief ? 'text-emerald-400' : 'text-white'}`}>Stage 2: Assessment Brief</h3>
            {filesUploaded.brief && (
              <div className="px-4 py-2 mt-4 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-widest border border-emerald-500/30">
                Extracted: {extractedData.words} Words
              </div>
            )}
          </div>
          
          <div className={`p-8 rounded-3xl border transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center ${filesUploaded.rubric ? 'bg-emerald-500/5 border-emerald-500/50 shadow-glow-emerald' : 'bg-[#07080D] border-zinc-800 opacity-50'}`}>
            <div className="mb-4">
              {filesUploaded.rubric ? <CheckCircle2 size={40} className="text-emerald-400" style={{ filter: `drop-shadow(0 0 10px ${GLOW_DROP_50})` }} /> : <FileText size={40} className="text-zinc-600" />}
            </div>
            <h3 className={`font-black text-lg mb-2 uppercase tracking-widest ${filesUploaded.rubric ? 'text-emerald-400' : 'text-white'}`}>Stage 3: Marking Rubric</h3>
            {filesUploaded.rubric && (
              <div className="px-4 py-2 mt-4 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-widest border border-emerald-500/30">
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
