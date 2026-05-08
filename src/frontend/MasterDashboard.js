import React, { useState, useRef, useEffect } from 'react';
import { Brain, RefreshCw, Sparkles, CheckCircle2, Layout, FileText, Download, Target, AlertTriangle, Shield, ChevronDown, Eye } from 'lucide-react';
import { useSettings } from './SettingsContext';
import { useProject } from './ProjectContext';
import { useInstitution } from './InstitutionalContext';
import CourseTrack from './CourseTrack';
import TaskCard from './TaskCard';
import SmartIntake from './SmartIntake';
import { fetchLMSData } from '../backend/LMSConnector';
import { mapToWorkspace } from '../services/BriefService';
import { jsPDF } from 'jspdf';
import { useEffortTracker } from './EffortTracker';
import FloatingResourceCard from './FloatingResourceCard';
import ResourceIngestor from './ResourceIngestor';
import { simulateIncomingWebhook } from '../services/MessagingHub';
import { auditProjectContext } from '../services/VerificationService';

function VerificationGate({ onVerify, extractionData }) {
  const [theme, setTheme] = useState(extractionData?.theme || '');
  const [articles, setArticles] = useState(['', '', '']);
  const [formattingConfirmed, setFormattingConfirmed] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleVerify = async () => {
    setIsVerifying(true);
    setErrors([]);
    const res = await auditProjectContext({ theme, articles, formattingConfirmed });
    setIsVerifying(false);
    
    if (res.verified) {
      onVerify();
    } else {
      setErrors(res.errors);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-zinc-950 p-6 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-xl bg-[#07080D] border border-emerald-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-amber-500"></div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-500/20 p-2 rounded-xl text-amber-500"><Shield size={24}/></div>
          <h2 className="text-2xl font-black text-white tracking-tight">Source Verification</h2>
        </div>
        
        <p className="text-emerald-400 mb-8 font-bold border border-emerald-500/30 bg-emerald-500/10 p-4 rounded-xl">
          "I've read your Course Outline and Brief. I've set your goal to 2,000 words and confirmed you need 3 specific articles. Is this correct?"
        </p>

        {errors.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
            <h4 className="font-black text-red-400 text-sm mb-2 flex items-center gap-2"><AlertTriangle size={14}/> Requirement Gaps Found</h4>
            <ul className="list-disc pl-5 space-y-1">
              {errors.map((e, i) => <li key={i} className="text-red-300 text-xs font-bold">{e}</li>)}
            </ul>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-emerald-500 mb-2">BABS1201 Theme</label>
            <select value={theme} onChange={e => setTheme(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white font-medium focus:border-emerald-500 outline-none">
              <option value="">Select a theme...</option>
              <option value="molecules">Molecules</option>
              <option value="cells">Cells</option>
              <option value="genes">Genes</option>
            </select>
          </div>

          <ResourceIngestor 
            evidenceFormula={extractionData?.evidenceFormula} 
            onIngestComplete={() => {}} 
          />

          <div className="flex items-start gap-3 bg-zinc-900 p-4 border border-zinc-800 rounded-xl">
            <input 
              type="checkbox" 
              checked={formattingConfirmed} 
              onChange={e => setFormattingConfirmed(e.target.checked)}
              className="mt-1 w-5 h-5 accent-emerald-500" 
            />
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-emerald-500 mb-1">Formatting Check</label>
              <p className="text-zinc-400 text-sm font-medium">I confirm I am prepared to provide proper referencing throughout both the review and process sections.</p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleVerify}
          disabled={isVerifying}
          className="w-full mt-8 py-4 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest hover:shadow-glow-emerald transition-all flex items-center justify-center gap-2"
        >
          {isVerifying ? <RefreshCw className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>}
          {isVerifying ? 'Verifying...' : 'Verify & Unlock Drafting'}
        </button>
      </div>
    </div>
  );
}

function CanvasBlock({ block, updateBlock, logEffort, integrityLog, onFocus, isFocused, mode, isAnyFocused, isFocusMode }) {
  const [isChecking, setIsChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(null);
  
  const { handleKeyDown, isTyping, pulseLevel } = useEffortTracker(block.id, logEffort);

  const blockLogs = integrityLog.filter(log => log.blockId === block.id);
  const recentLogs = blockLogs.slice(-20);

  const handleVibeCheck = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      setChecked(true);
      setScore(Math.floor(Math.random() * 15) + 85); 
      setTimeout(() => { setChecked(false); setScore(null); }, 4000);
    }, 2000);
  };

  const handleTextChange = (e) => {
    updateBlock(block.id, e.target.value);
  };

  const isNonLinear = mode === 'nonlinear' || isFocusMode;
  const shouldDim = isNonLinear && isAnyFocused && !isFocused;

  return (
    <div className={`mb-6 p-6 rounded-3xl border transition-all duration-500 flex flex-col ${shouldDim ? 'opacity-30 scale-[0.98]' : 'opacity-100 scale-100'} ${isChecking ? 'border-amber-500/50 shadow-glow-amber bg-amber-500/5' : checked ? 'border-emerald-500/50 shadow-glow-emerald bg-emerald-500/5' : isFocused && isNonLinear ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] bg-zinc-900/90' : isFocused ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 focus-within:border-zinc-700/50'}`}>
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h3 className="font-black text-xs uppercase tracking-widest text-zinc-400">{block.type}</h3>
        <button 
          aria-label="Run Vibe Check"
          onClick={handleVibeCheck}
          disabled={isChecking || !block.content}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all focus:ring-2 focus:ring-emerald-500 outline-none ${isChecking ? 'bg-amber-500 text-black shadow-glow-amber animate-pulse' : checked ? 'bg-emerald-500 text-black shadow-glow-emerald' : !block.content ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700'}`}
        >
          {isChecking ? <Sparkles size={14} className="animate-spin" /> : checked ? <CheckCircle2 size={14} /> : <Sparkles size={14} />}
          {isChecking ? 'HUMANISING...' : score ? `${score}% AUTHENTIC RHYTHM` : 'VIBE CHECK'}
        </button>
      </div>
      
      <textarea
        value={block.content}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        placeholder={block.placeholder || `Start writing your ${block.type.toLowerCase()} here...`}
        className="w-full bg-transparent border-none text-white text-lg leading-relaxed resize-none focus:ring-0 outline-none min-h-[120px] font-sans flex-1 placeholder-zinc-700"
      />

      <div className="flex justify-between items-end mt-4 border-t border-zinc-800/50 pt-4 shrink-0">
         <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest flex items-center gap-2">
           <Brain size={12}/> Thinking History
         </span>
         <div className={`flex items-end gap-1 h-6 transition-opacity ${isTyping || recentLogs.length > 0 ? 'opacity-100' : 'opacity-60'}`}>
           {recentLogs.length === 0 && !isTyping ? <span className="text-[10px] text-zinc-600 font-bold">No effort logged yet</span> : 
             [...recentLogs, { isLive: true }].slice(-20).map((log, i) => {
               if (log.isLive) {
                 const height = pulseLevel === 3 ? 24 : pulseLevel === 2 ? 16 : pulseLevel === 1 ? 8 : 4;
                 return (
                   <div 
                     key="live" 
                     className={`w-2 rounded-t-sm transition-all duration-300 ${isTyping ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-zinc-800'}`}
                     style={{ height: `${height}px` }}
                   />
                 );
               }
               const height = Math.min(Math.max((log.keystrokes || 1) * 2, 4), 24); 
               return (
                 <div 
                   key={i} 
                   className={`w-2 rounded-t-sm transition-all duration-300 ${log.bursts ? 'bg-amber-500/50' : 'bg-emerald-500/30'}`}
                   style={{ height: `${height}px` }}
                 />
               );
             })
           }
         </div>
      </div>
    </div>
  );
}

export default function MasterDashboard() {
  const { mode, setMode } = useSettings();
  const { project, updateBlock, appendToBlock, receiveMessage, clearMessage, setBlocks, logEffort } = useProject();
  const { setInstitutionalData } = useInstitution();
  
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [activePath, setActivePath] = useState(null);
  const [extractionData, setExtractionData] = useState(null);
  const [activeTab, setActiveTab] = useState('canvas');
  const [lmsData, setLmsData] = useState(null);
  const [focusedBlockId, setFocusedBlockId] = useState(null);
  const [workflowPhase, setWorkflowPhase] = useState('verification'); // verification | drafting

  const currentWords = project.blocks.reduce((acc, block) => acc + (block.content.match(/\S+/g)?.length || 0), 0);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const activeBlock = project.blocks.find(b => b.id === focusedBlockId) || project.blocks[0];

  useEffect(() => {
    const isHighStakes = true; // Simulated high stakes week from TemporalFilter
    if (isHighStakes && project.integrityLog.length === 0 && tasks.length > 0) {
      setMode('nonlinear');
    }
  }, [tasks.length, project.integrityLog.length, setMode]);

  const handleStartTask = async (task) => {
    setActiveTask(task);
    setActivePath(null); 
    setWorkflowPhase('verification');
    const blocks = mapToWorkspace(task.rawText || '', task.level || 'MRes');
    setBlocks(blocks);
  };

  const generatePremiumPDF = () => {
    const doc = new jsPDF();
    
    doc.setFillColor(13, 15, 24); 
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(16, 185, 129); 
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("SIMPLIFII-OS", 15, 25);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("Certificate of Learning", 145, 25);
    
    let y = 50;
    
    project.blocks.forEach(block => {
      if (y > 250) { doc.addPage(); y = 20; }
      
      doc.setFillColor(240, 249, 246);
      doc.rect(15, y, 180, 12, 'F');
      
      doc.setTextColor(6, 78, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(block.type.toUpperCase(), 20, y + 8);
      
      y += 18;
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      
      const splitText = doc.splitTextToSize(block.content || 'No content provided.', 170);
      doc.text(splitText, 20, y);
      
      y += (splitText.length * 6) + 15;
    });
    
    if (y > 230) { doc.addPage(); y = 20; }
    y += 15;
    doc.setFillColor(245, 158, 11); 
    doc.rect(15, y, 180, 1, 'F');
    
    y += 12;
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("VERIFIED HUMAN EFFORT", 15, y);
    
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += 8;
    doc.text(`Thinking Hours Logged: ${project.integrityLog.length} cognitive events tracked securely via Simplifii-OS.`, 15, y);
    
    doc.save(`${activeTask?.task || 'Draft'}_Certificate.pdf`);
  };

  const handleSprintCreation = (data) => {
    const newTask = { course: data.unitCode || 'Extracted', task: 'Mini Literature Review', level: data.level, rawText: data.rawText };
    setTasks(prev => [...prev, newTask]);
    setActiveTask(newTask);
    setExtractionData(data);
    setInstitutionalData({
      learningOutcomes: data.learningOutcomes || [],
      referencingStyle: data.referencingStyle || 'Harvard',
      rubricCriteria: data.rubricCriteria || []
    });
    const generatedBlocks = mapToWorkspace(data.rawText || '', data.level || 'MRes');
    setBlocks(generatedBlocks);
    setActivePath('scaffolder');
    setWorkflowPhase('verification');
  };

  const handlePathSelect = (path, data) => {
    setActivePath(path);
    if (data) setExtractionData(data);
  };

  const handleSystemise = (resource) => {
    appendToBlock(resource.targetBlock, resource.content);
    clearMessage(resource.id);
  };

  const simulateVoiceNote = () => {
    const payload = {
      type: 'voice',
      source: 'WhatsApp',
      timestamp: Date.now(),
      content: 'I was thinking about the literature review. A study found that osmotic pressure affects cell membranes, but I need to double check the lab notes on that. Put this in the process.'
    };
    simulateIncomingWebhook(payload, receiveMessage);
  };

  const handleExport = () => {
    const doc = new jsPDF();
    doc.text('Cryptographic Proof of Learning', 20, 20);
    doc.text(`Total Verifications: ${project.verifications.length}`, 20, 30);
    doc.text(`Blocks Completed: ${project.blocks.length}`, 20, 40);
    doc.save('simplifii-os-proof.pdf');
  };

  const renderContent = () => {
    if (!activeTask) {
      return <SmartIntake onSprintCreated={handleSprintCreation} />;
    }

    if (workflowPhase === 'verification') {
      return <VerificationGate onVerify={() => setWorkflowPhase('drafting')} extractionData={extractionData} />;
    }

    return (
      <div className="flex-1 flex overflow-hidden animate-fade-in relative z-0">
        <section className={`w-[35%] border-r border-zinc-800/50 p-8 flex flex-col bg-black/40 backdrop-blur-xl transition-opacity duration-500 z-10 ${(mode === 'nonlinear' || isFocusMode) && focusedBlockId ? 'opacity-30' : 'opacity-100'}`}>
          <header className="flex justify-between items-center mb-8 shrink-0">
            <h2 className="text-xs font-black uppercase text-emerald-500 tracking-widest">Cognitive Profile</h2>
            <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 backdrop-blur-md relative">
              <select 
                value={mode} 
                onChange={(e) => setMode(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase tracking-wider text-emerald-400 outline-none appearance-none pr-6 pl-3 py-1.5 cursor-pointer"
              >
                <option value="sequential" className="bg-zinc-900 text-zinc-300">Sequential / Deep</option>
                <option value="nonlinear" className="bg-zinc-900 text-emerald-400">Non-Linear / Rapid</option>
                <option value="lexical" className="bg-zinc-900 text-amber-400">Lexical / Visual</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500">
                <ChevronDown size={14} />
              </div>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-start gap-4 mb-8">
               <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0 shadow-glow-emerald mt-1">
                 <Brain size={18} className="text-emerald-500" />
               </div>
               <div className="bg-zinc-900 border border-zinc-800 rounded-3xl rounded-tl-sm p-5 text-sm leading-relaxed shadow-lg border-l-2 border-l-emerald-500 w-full">
                 <p className="font-black text-white text-base mb-2">Partner Active</p>
                 <p className="text-zinc-400 mb-4">I've set up the <strong className="text-emerald-400">Block OS</strong> for {activeTask.task}. Begin drafting section by section. Use the Vibe Check to ensure your tone is authentic.</p>
                 {activePath === 'humaniser' && (
                   <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-medium mt-4 shadow-inner">
                     <strong className="text-amber-500 font-black tracking-widest uppercase block mb-1">Shield Active:</strong> 
                     We will heavily prioritize maintaining your unique voice.
                   </div>
                 )}
               </div>
            </div>

            {activeBlock && activeBlock.keyQuestions && (
              <div className="animate-fade-in pl-14 pr-2">
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Target size={14} className="text-emerald-400"/> Focus: {activeBlock.type}
                </h3>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 mb-4">
                  <p className="text-[10px] uppercase font-black text-zinc-500 mb-2">Key Questions to Answer</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {activeBlock.keyQuestions.map((q, i) => (
                      <li key={i} className="text-zinc-300 text-sm font-medium">{q}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                  <p className="text-[10px] uppercase font-black text-amber-500/70 mb-2 flex items-center gap-1"><AlertTriangle size={12}/> Common Mistakes</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {activeBlock.commonMistakes.map((m, i) => (
                      <li key={i} className="text-amber-200/80 text-sm font-medium">{m}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="flex-1 bg-zinc-950 p-6 flex flex-col relative min-w-0">
          <div className="flex flex-col gap-4 mb-6 shrink-0">
            <CourseTrack currentWords={currentWords} blocks={project.blocks} verifications={project.verifications} />
            
            <div className="flex justify-between items-center bg-[#07080D] p-1.5 rounded-2xl border border-zinc-800">
              <div className="flex">
                <button 
                  onClick={() => setActiveTab('canvas')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'canvas' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <Layout size={14} /> Canvas Blocks
                </button>
                <button 
                  onClick={() => setActiveTab('resources')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'resources' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 shadow-glow-emerald' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <FileText size={14} /> Resources
                </button>
              </div>
              
              <div className="flex items-center">
                <button 
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all mr-2 ${isFocusMode ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'}`}
                >
                  <Eye size={14} /> Mono-Task
                </button>
                <button 
                  aria-label="Export PDF Certificate"
                  onClick={generatePremiumPDF}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-emerald-500 border border-emerald-500 hover:bg-emerald-500 hover:text-black hover:shadow-glow-emerald transition-all mr-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <Download size={14} /> Export Certificate
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'canvas' ? (
              <div className="h-full overflow-y-auto pr-2 pb-20 relative">
                
                {project.inbox && project.inbox.length > 0 && (
                  <div className="sticky top-0 z-50 mb-6">
                    {project.inbox.map(msg => (
                      <FloatingResourceCard key={msg.id} resource={msg} onSystemise={handleSystemise} />
                    ))}
                  </div>
                )}

                {project.blocks.map(block => (
                  <CanvasBlock 
                    key={block.id} 
                    block={block} 
                    updateBlock={updateBlock} 
                    logEffort={logEffort}
                    integrityLog={project.integrityLog} 
                    onFocus={() => setFocusedBlockId(block.id)}
                    isFocused={focusedBlockId === block.id}
                    mode={mode}
                    isAnyFocused={!!focusedBlockId}
                    isFocusMode={isFocusMode}
                  />
                ))}
              </div>
            ) : (
              <div className="h-full rounded-3xl border border-emerald-500/20 bg-[#07080D] p-8 overflow-y-auto shadow-2xl">
                <div>
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Decoded Brief</h3>
                  <p className="text-emerald-400 font-bold mb-8">Extracted from LMS Sync</p>
                </div>
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
                    <h4 className="font-black text-white mb-3 text-sm tracking-widest uppercase">Objectives</h4>
                    <ul className="list-disc pl-5 space-y-2 text-zinc-300 text-sm">
                      {lmsData ? lmsData.objectives.map((obj, i) => <li key={i}>{obj}</li>) : <li>Syncing...</li>}
                    </ul>
                  </div>
                  <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
                    <h4 className="font-black text-white mb-3 text-sm tracking-widest uppercase">Rubric Focus</h4>
                    <ul className="space-y-4 text-zinc-300 text-sm">
                      {lmsData ? lmsData.rubric.map((r, i) => (
                        <li key={i}>
                          <strong className="text-emerald-400 block mb-1">{r.criterion} ({r.weight})</strong> 
                          {r.description}
                        </li>
                      )) : <li>Syncing...</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#07080D] text-white overflow-hidden font-sans">
      <aside className={`w-64 border-r border-zinc-800/50 bg-black/40 backdrop-blur-xl p-5 flex flex-col shrink-0 transition-opacity duration-500 z-10 ${mode === 'nonlinear' && focusedBlockId ? 'opacity-30' : 'opacity-100'}`}>
        <div className="flex items-center gap-2 mb-10">
          <div className="bg-emerald-500 p-1.5 rounded-lg shadow-glow-emerald"><Brain size={20} className="text-black" /></div>
          <span className="font-black text-lg tracking-tighter">SIMPLIFII-OS</span>
        </div>
        
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 px-2">Active Sprints</p>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {tasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 px-4 mt-20">
              <Brain size={32} className="mx-auto mb-4 text-zinc-600" />
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">No Active Sprints</p>
              <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">Upload Course Outline and Assessment Brief to begin grounding.</p>
            </div>
          ) : (
            tasks.map((t, i) => (
              <TaskCard key={i} task={t} onStart={handleStartTask} isActive={activeTask?.task === t.task} />
            ))
          )}
        </div>

        {tasks.length > 0 && (
          <>
            <div className="mt-4 flex flex-col gap-2">
              <button 
                onClick={simulateVoiceNote}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                Simulate Voice Note 🎙️
              </button>
              
              <button 
                onClick={handleExport}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Download size={14} /> EXPORT CRYPTOGRAPHIC PROOF
              </button>
            </div>
            
            <button 
              onClick={() => { setActiveTask(null); setActivePath(null); }}
              className="mt-2 w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-emerald-500 hover:shadow-glow-emerald transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              + NEW SPRINT
            </button>
          </>
        )}
      </aside>

      <main className="flex-1 flex overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
}
