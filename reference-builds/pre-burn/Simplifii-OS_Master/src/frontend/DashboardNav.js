import React, { useState, useRef, useEffect } from 'react';
import { Brain, RefreshCw, Sparkles, FileText, AlertTriangle, Shield, HardDrive, UploadCloud, Trash2, X } from 'lucide-react';
import { saveUploadedPdf, listUploadedPdfs, deleteUploadedPdf, clearAllUploadedPdfs } from '../services/IndexedDBService';

/**
 * DashboardNav - Top Navigation Bar
 * Renders the fixed 70px header: logo/brand left, action buttons right.
 * Slides off-screen during Zen Mode (translate-y-full).
 *
 * Props:
 *   isZenMode          {boolean}  hide the bar in Zen Mode
 *   viewMode           {string}   current view ('canvas'|'gallery'|'cockpit')
 *   setViewMode        {Function} navigate to a view
 *   activeCourse       {Object}   active course from ProjectContext (shadow pill)
 *   ingesting          {boolean}  PDF ingestion in progress
 *   ingestStatus       {string}   ingestion progress label
 *   groundingCount     {number}   PDFs in /src/grounding/active/
 *   handleIngestGrounding {Function} trigger grounding ingest
 *   showStudio         {boolean}  Studio vs Classic canvas flag
 *   setShowStudio      {Function} toggle Studio
 *   isBionicActive     {boolean}  bionic reading on (UDL button highlight)
 *   overlayTint        {string}   colour tint selection
 *   isRulerActive      {boolean}  reading ruler on
 *   isLiteralMode      {boolean}  Literal Mode on
 *   setIsLiteralMode   {Function} toggle Literal Mode
 *   ghostMode          {boolean}  vault ghost mode active
 *   setGhostMode       {Function} clear ghost mode
 *   setVaultDismissed  {Function} re-open vault unlock modal
 *   setShowSteering    {Function} open Steering Drawer
 *   setShowScaffolder  {Function} open Scaffolder overlay
 *   setShowSupportBridge {Function} open SOS bridge
 */
export default function DashboardNav({
  isZenMode,
  setViewMode,
  activeCourse,
  ingesting, ingestStatus, groundingCount, handleIngestGrounding,
  onPdfsChanged,
  showStudio, setShowStudio,
  isBionicActive, overlayTint, isRulerActive,
  isLiteralMode, setIsLiteralMode,
  ghostMode, setGhostMode, setVaultDismissed,
  setShowSteering,
  setShowScaffolder,
  setShowSupportBridge
}) {
  // Sprint 9.1a: local PDF upload and management
  const fileInputRef = useRef(null);
  const [showManagePanel, setShowManagePanel] = useState(false);
  const [uploadedPdfs, setUploadedPdfs] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (showManagePanel) {
      listUploadedPdfs().then(setUploadedPdfs).catch(() => setUploadedPdfs([]));
    }
  }, [showManagePanel]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        await saveUploadedPdf(file).catch(err => {
          if (typeof console !== 'undefined') console.warn('[DashboardNav] PDF save failed:', err && err.message);
        });
      }
    }
    if (e.target) e.target.value = null;
    const updated = await listUploadedPdfs().catch(() => []);
    setUploadedPdfs(updated);
    setUploading(false);
    if (onPdfsChanged) onPdfsChanged();
  };

  const handleDeletePdf = async (id) => {
    await deleteUploadedPdf(id).catch(() => {});
    const updated = await listUploadedPdfs().catch(() => []);
    setUploadedPdfs(updated);
    if (onPdfsChanged) onPdfsChanged();
  };

  const handleClearAll = async () => {
    await clearAllUploadedPdfs().catch(() => {});
    setUploadedPdfs([]);
    if (onPdfsChanged) onPdfsChanged();
  };

  return (
    <div className={`h-[70px] shrink-0 flex items-center justify-between px-8 border-b border-zinc-800 bg-black/80 backdrop-blur-md relative z-[1200] transition-all duration-700 ${isZenMode ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setViewMode('gallery')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
            <Brain size={18} className="text-indigo-400" />
          </div>
          <span className="font-black tracking-widest uppercase text-sm bg-gradient-to-r from-indigo-400 to-indigo-600 text-transparent bg-clip-text">
            Simplifii
          </span>
        </button>
        <div className="h-4 w-px bg-zinc-800"></div>
        <span className="text-[12px] font-bold text-zinc-500 tracking-[0.2em] uppercase">
          Sovereign OS
        </span>
        <div className="ml-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
          Zero Disclosure
        </div>
        <div className="ml-2 flex items-center gap-2 px-3 py-1 rounded-full border text-[12px] font-black uppercase tracking-widest transition-all bg-emerald-500/10 border-emerald-500/50 text-emerald-400 cursor-help" title="Sovereign Engine Active">
          <HardDrive size={10} /> Sovereign
        </div>
        {/* Shadow State pill: visible while regex-derived draft is showing and
            the Ollama confirmation pass is still in flight. Clears automatically
            when the upgrade lands or the no-LLM fallback marks shadow: false. */}
        {activeCourse?.extractionData?.shadow && (
          <div className="ml-2 flex items-center gap-2 px-3 py-1 rounded-full border text-[12px] font-black uppercase tracking-widest bg-amber-500/10 border-amber-500/40 text-amber-300 cursor-help" title="Draft roadmap from regex. Refining via Ollama; the cockpit will swap to confirmed truth automatically.">
            <RefreshCw size={10} className="animate-spin" /> Draft  ·  refining
          </div>
        )}
      </div>

      <div className="flex items-center gap-5 relative z-[1300]">
        {/* NOT VERIFIED badge: learner opted into Ghost Mode (vault skipped).
            Click to reopen the vault unlock modal. */}
        {ghostMode && (
          <button
            type="button"
            onClick={() => { setGhostMode(false); setVaultDismissed(false); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] font-black uppercase tracking-widest transition-all cursor-pointer bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/20"
            title="Ghost Mode: no events recorded. Click to unlock the vault."
          >
            <Shield size={11} /> NOT VERIFIED
          </button>
        )}
        {/* Peripheral toolbar. data-focus-locked dims buttons during an
            active FocusSession so the only visible surface is the cockpit,
            AURA, and SOS. */}
        <button
          data-focus-locked="true"
          onClick={() => setShowScaffolder(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all cursor-pointer bg-transparent border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
          title="Open Sovereign Scaffolder (tiered support overlay)"
        >
          <Sparkles size={14} /> Scaffolder
        </button>
        {/* Steering Drawer: Persona / Scaffolding / Grit / LOD dials.
            Stays unlocked during focus sessions so the learner can dial
            the OS down without ending the sprint. */}
        <button
          onClick={() => setShowSteering(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all cursor-pointer bg-transparent border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
          title="Open Steering Drawer (Persona, Scaffolding, Grit, LOD)"
        >
          <Sparkles size={14} /> Steering
        </button>
        {/* Ingest Grounding: disabled when folder is empty or ingest is running. */}
        {groundingCount > 0 && (
          <button
            onClick={handleIngestGrounding}
            disabled={ingesting}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${ingesting ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 cursor-wait' : 'bg-transparent border-amber-500/40 text-amber-400 hover:bg-amber-500/10'} disabled:cursor-wait`}
            title={ingesting ? (ingestStatus || 'Scanning grounding folder...') : `Ingest ${groundingCount} PDF${groundingCount === 1 ? '' : 's'} from /src/grounding/active/ into the cockpit.`}
          >
            {ingesting
              ? <RefreshCw size={14} className="animate-spin" />
              : <FileText size={14} />}
            {ingesting ? 'Scanning...' : 'Ingest Grounding'}
          </button>
        )}
        {/* Sprint 9.1a: Upload PDFs + Manage panel. Zero-Disclosure: local only. */}
        <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={handleUpload} />
        <button
          data-focus-locked="true"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${uploading ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 cursor-wait' : 'bg-transparent border-sky-500/40 text-sky-400 hover:bg-sky-500/10'}`}
          title="Upload PDFs from your device. Stored locally only. Never sent to any server."
        >
          {uploading ? <RefreshCw size={14} className="animate-spin" /> : <UploadCloud size={14} />}
          {uploading ? 'Saving...' : 'Upload PDFs'}
        </button>
        <button
          data-focus-locked="true"
          onClick={() => setShowManagePanel(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${showManagePanel ? 'bg-sky-500 border-sky-500 text-black' : 'bg-transparent border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'}`}
          title="View and manage uploaded PDFs"
        >
          <FileText size={14} /> Manage PDFs
        </button>
        {showManagePanel && (
          <div className="absolute top-[70px] right-8 w-96 max-h-80 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-[1300] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-300">Uploaded PDFs (local only)</h4>
              <button onClick={() => setShowManagePanel(false)} className="text-zinc-500 hover:text-white"><X size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {uploadedPdfs.length === 0 && (
                <p className="text-zinc-600 text-xs text-center py-4">No uploaded PDFs. Use "Upload PDFs" to add your syllabus, briefs, and rubrics.</p>
              )}
              {uploadedPdfs.map(pdf => (
                <div key={pdf.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 font-bold truncate">{pdf.name}</p>
                    <p className="text-[10px] text-zinc-600">{(pdf.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    onClick={() => handleDeletePdf(pdf.id)}
                    className="text-zinc-600 hover:text-rose-400 transition-colors shrink-0"
                    title={`Delete ${pdf.name}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            {uploadedPdfs.length > 0 && (
              <div className="p-3 border-t border-zinc-800">
                <button
                  onClick={handleClearAll}
                  className="w-full px-3 py-2 rounded-lg border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-widest hover:bg-rose-500/10 transition-colors"
                >
                  Clear All Uploaded PDFs
                </button>
              </div>
            )}
          </div>
        )}
        {/* Studio toggle: classic LinearCanvas vs tri-column SimplifiiStudio. */}
        <button
          data-focus-locked="true"
          onClick={() => setShowStudio(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${showStudio ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-transparent border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'}`}
          title={showStudio ? 'Switch to Classic Cockpit' : 'Switch to Studio (tri-column)'}
        >
          <Sparkles size={14} /> {showStudio ? 'Classic' : 'Studio'}
        </button>
        <button
          data-focus-locked="true"
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-view-mode'))}
          className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all bg-transparent border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 cursor-pointer"
        >
          <Sparkles size={14} /> View as Speech
        </button>
        {/* UDL Overrides: amber highlight when any accessibility override is active. */}
        <button
          data-focus-locked="true"
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-accessibility'))}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${isBionicActive || overlayTint !== 'none' || isRulerActive ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-transparent border-zinc-700 text-zinc-400'} hover:text-white hover:border-zinc-500`}
        >
          <Sparkles size={14} /> UDL Overrides
        </button>
        {/* Literal Mode toggle. */}
        <button
          data-focus-locked="true"
          type="button"
          role="switch"
          aria-checked={isLiteralMode}
          aria-label="Toggle Literal Mode"
          onClick={() => setIsLiteralMode(prev => !prev)}
          className="flex items-center gap-3 bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800 cursor-pointer hover:border-zinc-600 transition-colors"
        >
          <span className="text-[12px] font-bold uppercase tracking-widest text-zinc-500">Literal Mode</span>
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
  );
}
