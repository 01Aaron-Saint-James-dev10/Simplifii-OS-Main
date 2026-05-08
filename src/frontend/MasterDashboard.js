import React, { useState, useRef, useEffect } from 'react';
import { Brain, RefreshCw, Sparkles, CheckCircle2, Layout, FileText, Download, Target, AlertTriangle, Shield, ChevronLeft, ChevronRight, Eye, HardDrive } from 'lucide-react';
import { useSettings } from './SettingsContext';
import { useProject } from './ProjectContext';
import { useInstitution } from './InstitutionalContext';
import TaskCard from './TaskCard';
import AccessibilityVault from './AccessibilityVault';
import { StartIgnition, IdentityGate, TemporalBaseline, CourseDefinition, Grounding } from './UniversalOnboarding';
import LinearCanvas from './LinearCanvas';
import MathsStepEditor from './MathsStepEditor';
import AIAvatar from './AIAvatar';
import SupportBridge from './SupportBridge';
import { fetchLMSData } from '../backend/LMSConnector';
import { mapToWorkspace } from '../services/BriefService';
import { jsPDF } from 'jspdf';
import FloatingResourceCard from './FloatingResourceCard';
import ResourceIngestor from './ResourceIngestor';
import { simulateIncomingWebhook } from '../services/MessagingHub';
import { auditProjectContext } from '../services/VerificationService';
import { saveGhostAsset, getAllGhostAssets } from '../services/IndexedDBService';

export default function MasterDashboard() {
  const {
    mode, setMode,
    overlayTint, isRulerActive, isBionicActive,
    isZenMode, setIsZenMode,
    isLeftCollapsed, setIsLeftCollapsed,
    isRightCollapsed, setIsRightCollapsed,
    isLiteralMode, setIsLiteralMode
  } = useSettings();
  const {
    project, updateBlock, appendToBlock, receiveMessage, clearMessage, setBlocks, logEffort,
    profile, setProfile,
    tasks, setTasks,
    extractionData, setExtractionData,
    activeTask, setActiveTask
  } = useProject();
  const { setInstitutionalData } = useInstitution();

  const [focusedBlockId, setFocusedBlockId] = useState(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [globalGhostAssets, setGlobalGhostAssets] = useState([]);
  const [showSupportBridge, setShowSupportBridge] = useState(false);
  const [showAccessibilityVault, setShowAccessibilityVault] = useState(false);

  useEffect(() => {
    const handleToggleAccessibility = () => setShowAccessibilityVault(prev => !prev);
    window.addEventListener('toggle-accessibility', handleToggleAccessibility);
    return () => window.removeEventListener('toggle-accessibility', handleToggleAccessibility);
  }, []);

  // Metacognitive reflection on Zen Mode exit
  const prevZenModeRef = useRef(isZenMode);
  useEffect(() => {
    if (prevZenModeRef.current === true && isZenMode === false) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Adonis, you spent 80% of your time in High-Rigor analysis today. Your Focus peaked during the Methodology block.");
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    }
    prevZenModeRef.current = isZenMode;
  }, [isZenMode]);

  useEffect(() => {
    getAllGhostAssets().then(setGlobalGhostAssets).catch(() => {});
  }, []);

  // Cmd+F toggles Zen Mode globally; Shift+D dispatches the Dev Insights signal.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsZenMode(prev => !prev);
      }
      if (e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('toggle-dev-insights'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsZenMode]);

  const handleAddGhostAsset = (asset) => {
    saveGhostAsset(asset).then(() => {
      setGlobalGhostAssets(prev => [...prev, asset]);
    });
  };

  const handleStageTransition = (nextStage, speechMessage) => {
    if (speechMessage && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speechMessage);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
    setCurrentStage(nextStage);
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
    const generatedBlocks = mapToWorkspace(data.rawText || '', data.level || 'Tertiary');
    setBlocks(generatedBlocks);
  };

  const generatePremiumPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(7, 8, 13);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text(extractionData?.unitCode || 'Research Paper', 20, 30);
    
    // Add Bionic Export Badge
    if (isBionicActive) {
      doc.setTextColor(245, 158, 11); // Amber
      doc.setFontSize(10);
      doc.text("BIONIC READING FORMAT", 20, 40);
      doc.setTextColor(255, 255, 255);
    }
    
    let yPos = 50;
    
    // In a real implementation, we would parse words and use doc.setFont('helvetica', 'bold') 
    // for the first half of each word, but for this MVP we append a notice.
    
    doc.setFontSize(12);
    doc.text("Title: " + profile.courseName, 20, yPos);
    yPos += 20;

    tasks.forEach(task => {
      if (yPos > 270) {
        doc.addPage();
        doc.setFillColor(7, 8, 13);
        doc.rect(0, 0, 210, 297, 'F');
        yPos = 30;
      }
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129); // Emerald
      doc.text(task.title, 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      const lines = doc.splitTextToSize(task.description || '', 170);
      doc.text(lines, 20, yPos);
      yPos += (lines.length * 5) + 15;
    });

    doc.save(`${profile.name}_BABS1201_Export.pdf`);
    avatarSpeak("Premium PDF compiled. Your structural scaffolding is ready.", "PDF Exported.");
  };

  const simulateVoiceNote = () => {
    const payload = {
      type: 'voice',
      source: 'WhatsApp',
      timestamp: Date.now(),
      content: 'I was thinking about the literature review...'
    };
    simulateIncomingWebhook(payload, receiveMessage);
  };

  // Reading Ruler logic
  const [mouseY, setMouseY] = useState(0);
  useEffect(() => {
    if (!isRulerActive) return;
    const handleMouseMove = (e) => setMouseY(e.clientY);
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isRulerActive]);

  const renderContent = () => {
    switch (currentStage) {
      case 1:
        return <IdentityGate onComplete={() => handleStageTransition(2, `Welcome, ${profile.name}.`)} profile={profile} setProfile={setProfile} />;
      case 2:
        return <TemporalBaseline onComplete={() => handleStageTransition(3, `Deadline locked to ${profile.deadline}.`)} profile={profile} />;
      case 3:
        return <CourseDefinition onComplete={() => handleStageTransition(4, "Course defined. Initialize knowledge graph.")} profile={profile} setProfile={setProfile} />;
      case 4:
        return <Grounding onComplete={(data) => {
          handleSprintCreation(data);
          handleStageTransition(5, "Extraction complete. Transitioning to Document Editor.");
        }} profile={profile} />;
      case 5:
      default:
        const isMaths = profile.courseName.toLowerCase().includes('maths') || profile.courseName.toLowerCase().includes('hsc');
        return (
          <div className="flex-1 flex overflow-hidden animate-fade-in relative z-0">
            {isMaths ? (
              <MathsStepEditor extractionData={extractionData} profile={profile} />
            ) : (
              <LinearCanvas 
                extractionData={extractionData} 
                profile={profile} 
                onAddGhostAsset={handleAddGhostAsset} 
                isZenMode={isZenMode}
                setIsZenMode={setIsZenMode}
                isLeftCollapsed={isLeftCollapsed}
                setIsLeftCollapsed={setIsLeftCollapsed}
                isRightCollapsed={isRightCollapsed}
                setIsRightCollapsed={setIsRightCollapsed}
              />
            )}
          </div>
        );
      case 0:
        return <StartIgnition onStart={() => {
          const hasActiveSession = tasks.length > 0 && extractionData;
          if (hasActiveSession) {
            handleStageTransition(5, "Resuming active session.");
          } else {
            handleStageTransition(1, "Initiating handshake.");
          }
        }} />;
    }
  };

  const leftSidebarClass = isZenMode ? 'w-0 opacity-0 px-0' : isLeftCollapsed ? 'w-16 px-2' : 'w-72 p-5';
  const rightSidebarClass = isZenMode ? 'w-0 opacity-0' : isRightCollapsed ? 'w-16' : 'w-72';

  const getOverlayColor = () => {
    if (overlayTint === 'mint') return 'bg-[#e6fdee]';
    if (overlayTint === 'cream') return 'bg-[#fdf5e6]';
    if (overlayTint === 'skyblue') return 'bg-[#e6f0fd]';
    return '';
  };

  const isBooting = currentStage === 0;

  return (
    <div className={`h-screen w-full bg-black text-zinc-200 flex flex-col font-sans overflow-hidden transition-colors duration-1000 ${getOverlayColor()} ${isZenMode ? 'zen-mode-active' : ''}`}>
      {/* Top Navigation Bar */}
      <div className={`h-[70px] shrink-0 flex items-center justify-between px-8 border-b border-zinc-800 bg-black/80 backdrop-blur-md relative z-[1200] transition-all duration-700 ${isZenMode ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Brain size={18} className="text-indigo-400" />
            </div>
            <span className="font-black tracking-widest uppercase text-sm bg-gradient-to-r from-indigo-400 to-indigo-600 text-transparent bg-clip-text">
              Simplifii
            </span>
          </div>
          <div className="h-4 w-px bg-zinc-800"></div>
          <span className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase">
            Sovereign OS
          </span>
          <div className="ml-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
            Zero Disclosure
          </div>
          <div className="ml-2 flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all bg-emerald-500/10 border-emerald-500/50 text-emerald-500 cursor-help" title="Sovereign Engine Active">
            <HardDrive size={10} /> Sovereign
          </div>
        </div>

        <div className="flex items-center gap-5 relative z-[1300]">
          {/* View as Speech Button */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-view-mode'))}
            className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all bg-transparent border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 cursor-pointer"
          >
            <Sparkles size={14} /> View as Speech
          </button>
          {/* UDL Overrides Button */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-accessibility'))}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${isBionicActive || overlayTint !== 'none' || isRulerActive ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-transparent border-zinc-700 text-zinc-400'} hover:text-white hover:border-zinc-500`}
          >
            <Sparkles size={14} /> UDL Overrides
          </button>

          {/* Literal Mode Toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={isLiteralMode}
            aria-label="Toggle Literal Mode"
            onClick={() => setIsLiteralMode(prev => !prev)}
            className="flex items-center gap-3 bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800 cursor-pointer hover:border-zinc-600 transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Literal Mode</span>
            <span className={`w-10 h-5 rounded-full relative transition-colors ${isLiteralMode ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
              <span className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${isLiteralMode ? 'translate-x-6' : 'translate-x-1'}`}></span>
            </span>
          </button>

          <button
            onClick={() => setShowSupportBridge(true)}
            className="flex items-center gap-2 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white shadow-glow-rose cursor-pointer"
          >
            <AlertTriangle size={14} /> SOS
          </button>
        </div>
      </div>

      {/* Restored Avatar: Fixed Anchor at top:100px (clears the z-1200 nav) */}
      <div className="fixed top-[100px] left-4 z-[1100] w-56 animate-fade-in pointer-events-none">
        <div className="pointer-events-auto">
          <AIAvatar 
             onClick={() => {
                if (isBooting) {
                   // This simulates the trigger for the pulsing guide effect in AIAvatar
                   window.dispatchEvent(new CustomEvent('trigger-onboarding-guide'));
                } else {
                   setShowSupportBridge(true);
                }
             }} 
             isLiteralMode={isLiteralMode} 
             isOnboardingMode={isBooting}
          />
        </div>
      </div>

      {showSupportBridge && <SupportBridge onClose={() => setShowSupportBridge(false)} isLiteralMode={isLiteralMode} />}
      {showAccessibilityVault && <AccessibilityVault onClose={() => setShowAccessibilityVault(false)} />}

      {/* Body row: sidebar + main + right archive share the height below the nav */}
      <div className="flex-1 flex overflow-hidden min-h-0">

      {/* Global Sprints Sidebar (Left) */}
      <aside className={`${leftSidebarClass} border-r border-zinc-800/50 bg-black/40 backdrop-blur-xl flex flex-col shrink-0 transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] z-10 relative overflow-hidden pt-44`}>
        {!isZenMode && (
          <button 
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className="absolute -right-3 top-24 z-50 bg-zinc-800 border border-zinc-700 rounded-full p-1 text-zinc-400 hover:text-white hover:border-emerald-500 transition-all"
          >
            {isLeftCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}

        <div className={`flex items-center gap-2 mb-10 mt-5 transition-opacity ${isLeftCollapsed ? 'opacity-0 h-0 overflow-hidden mb-0 mt-0' : 'opacity-100'}`}>
          <div className="bg-emerald-500 p-1.5 rounded-lg shadow-glow-emerald"><Brain size={20} className="text-black" /></div>
          <span className="font-black text-lg tracking-tighter whitespace-nowrap">SIMPLIFII-OS</span>
        </div>

        {isLeftCollapsed && !isZenMode && (
          <div className="flex flex-col items-center mt-5 space-y-8">
            <div className="bg-emerald-500 p-1.5 rounded-lg shadow-glow-emerald"><Brain size={20} className="text-black" /></div>
            <Layout size={20} className="text-zinc-600" />
            <Target size={20} className="text-zinc-600" />
          </div>
        )}
        
        {!isLeftCollapsed && (
          <>
            {!isBooting && (
              <>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 px-2 whitespace-nowrap">Semester Roadmap</p>
                <div className="mb-8 px-2 border-l border-zinc-800 ml-2 space-y-4 relative">
                  <div className="relative pl-4 group">
                    <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    <p className="text-[10px] font-black uppercase text-emerald-500">Current Task</p>
                    <p className="text-xs text-white font-bold">Literature Review</p>
                  </div>
                  <div className="relative pl-4 group opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-zinc-700 border border-zinc-600"></div>
                    <p className="text-[10px] font-black uppercase text-zinc-500">Next Assessment</p>
                    <p className="text-xs text-zinc-300 font-bold">Oral Presentation</p>
                  </div>
                  <div className="relative pl-4 group opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-zinc-700 border border-zinc-600"></div>
                    <p className="text-[10px] font-black uppercase text-zinc-500">Final Milestone</p>
                    <p className="text-xs text-zinc-300 font-bold">Final Exam</p>
                  </div>
                </div>
              </>
            )}

            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 px-2 whitespace-nowrap">Active Context</p>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              {isBooting || tasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 px-4 mt-10">
                  <Brain size={32} className="mx-auto mb-4 text-zinc-600" />
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">No Active Context</p>
                </div>
              ) : (
                tasks.map((t, i) => (
                  <TaskCard key={i} task={t} onStart={() => {}} isActive={activeTask?.task === t.task} />
                ))
              )}
            </div>

            {!isBooting && tasks.length > 0 && (
              <div className="mt-auto shrink-0 flex flex-col gap-4 pt-4 border-t border-zinc-800/50">
                <div className="bg-black border border-zinc-800 p-3 rounded-xl flex items-start gap-3">
                  <Shield size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-white tracking-widest mb-1">Zero-Disclosure Data</p>
                    <p className="text-[9px] text-zinc-500 leading-relaxed whitespace-normal font-bold">Your cognitive telemetry is visible only to you and is never shared with your university.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={simulateVoiceNote} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] truncate">
                    Simulate Voice 🎙️
                  </button>
                  <button onClick={generatePremiumPDF} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-xl transition-all truncate">
                    Export Proof
                  </button>
                </div>
              </div>
            )}
            
            {isBooting && (
              <div className="mt-auto shrink-0 pt-4 border-t border-zinc-800/50">
                <div className="bg-black border border-zinc-800 p-3 rounded-xl flex items-start gap-3">
                  <Shield size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-white tracking-widest mb-1">Zero-Disclosure OS</p>
                    <p className="text-[9px] text-zinc-500 leading-relaxed whitespace-normal font-bold">Student-first architecture. Waiting for handshake to unlock context.</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </aside>

      <main className="flex-1 flex overflow-hidden">
        {renderContent()}
      </main>

      {/* Global Archive Sidebar (Right) */}
      {currentStage === 5 && (
        <aside className={`${rightSidebarClass} bg-black/80 backdrop-blur-xl border-l border-zinc-900 flex flex-col shrink-0 transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] z-50 relative overflow-hidden`}>
          {!isZenMode && (
            <button 
              onClick={() => setIsRightCollapsed(!isRightCollapsed)}
              className="absolute -left-3 top-24 z-50 bg-zinc-800 border border-zinc-700 rounded-full p-1 text-zinc-400 hover:text-white hover:border-blue-500 transition-all"
            >
              {isRightCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          )}

          {isRightCollapsed && !isZenMode ? (
            <div className="flex flex-col items-center mt-5 space-y-8 pt-6">
              <Shield size={20} className="text-blue-500" />
            </div>
          ) : !isZenMode && (
            <>
              <div className="p-5 flex items-center gap-3 text-blue-500 whitespace-nowrap pt-8">
                <Shield size={24} className="shrink-0" />
                <h3 className="font-black tracking-widest uppercase text-sm">Cognitive Archive</h3>
              </div>
              <div
                className="flex-1 overflow-y-auto px-6 pb-6 whitespace-nowrap custom-scrollbar"
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-1', 'ring-blue-500/40'); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove('ring-1', 'ring-blue-500/40'); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('ring-1', 'ring-blue-500/40');
                  const textData = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
                  if (!textData) return;
                  const isUrl = /^https?:\/\//.test(textData);
                  const newAsset = {
                    id: Date.now().toString(),
                    blockId: 'archive',
                    source: isUrl ? new URL(textData).hostname : textData.slice(0, 50),
                    text: isUrl ? `Extracted Insight from ${new URL(textData).hostname}: pending semantic mapping.` : textData,
                    author: 'Manual capture',
                    year: new Date().getFullYear().toString(),
                    isPrimary: false
                  };
                  handleAddGhostAsset(newAsset);
                }}
              >
                {globalGhostAssets.length === 0 ? (
                  <div className="text-zinc-500 text-xs font-bold mt-10 px-2">
                    <p>No embedded assets yet.</p>
                    <p className="mt-2 font-medium normal-case text-[11px] leading-relaxed text-zinc-600">Drag a research URL or text snippet directly here, or drop it on a section in the Canvas.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {globalGhostAssets.map(asset => (
                      <div key={asset.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl max-w-full">
                        <p className="text-[10px] font-black uppercase text-emerald-500 mb-2 truncate">{asset.blockId === 'archive' ? `Source: ${asset.source}` : `Block: ${asset.blockId}`}</p>
                        <p className="text-xs text-zinc-300 whitespace-normal line-clamp-3">{asset.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      )}
      </div>

      {/* Zen Mode Indicator */}
      {isZenMode && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-900/80 border border-zinc-800 backdrop-blur rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2 animate-pulse z-50">
          <Eye size={12} /> Focus Mode Active (Cmd+F to exit)
        </div>
      )}
    </div>
  );
}
