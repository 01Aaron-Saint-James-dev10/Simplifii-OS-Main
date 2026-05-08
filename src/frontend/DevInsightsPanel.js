import React, { useState } from 'react';
import { Terminal, X, CheckCircle, Database, GitBranch, Github, ShieldAlert, Cpu, Activity, Play, Code } from 'lucide-react';
import { speakSystemMessage } from '../services/MessagingHub';

export default function DevInsightsPanel({ onClose }) {
  const [deployedFixes, setDeployedFixes] = useState({});
  const [isDeploying, setIsDeploying] = useState(null);

  const mockInsights = [
    {
      id: 'insight1',
      point: 'APA 7th Reference Anxiety',
      source: 'r/UNSW / Discord',
      fix: 'cite-right-v2 (Auto-correction for DOIs)',
      description: 'Students are spending 30% of their assignment time manually formatting citations instead of thinking.'
    },
    {
      id: 'insight2',
      point: 'Cognitive Fatigue in BABS1201',
      source: 'r/ADHD',
      fix: 'focus-pulse-js (Haptic focus reminders)',
      description: 'The 2000-word limit is causing executive paralysis. They need micro-milestones.'
    },
    {
      id: 'insight3',
      point: 'AI Detection False Positives',
      source: 'r/StudentLife',
      fix: 'human-rhythm-checker (Drafting history proof)',
      description: 'Autistic students with formal, literal writing styles are being flagged by Turnitin.'
    }
  ];

  const handleDeploy = (insight) => {
    setIsDeploying(insight.id);
    speakSystemMessage(`Deploying open-source fix for ${insight.point}. System evolving.`, "Deploying GitHub Fix...");
    
    setTimeout(() => {
      setDeployedFixes(prev => ({ ...prev, [insight.id]: true }));
      setIsDeploying(null);
      speakSystemMessage(`${insight.fix} integrated successfully. Zero system drag.`, "Integration Complete.");
    }, 2500);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 z-[1200] bg-black/95 backdrop-blur-3xl border-l border-indigo-500/30 flex flex-col shadow-[-20px_0_100px_rgba(79,70,229,0.15)] animate-slide-in-right font-mono">
      {/* Header */}
      <div className="p-6 border-b border-indigo-500/20 flex justify-between items-center bg-indigo-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-scan-line opacity-50"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/50 relative">
            <Terminal size={20} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
          </div>
          <div>
            <h2 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              Dev Insights <span className="text-[9px] bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300">LIVE</span>
            </h2>
            <p className="text-[10px] text-zinc-500 tracking-wide mt-1">MCP Scraper Feed: r/UNSW</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors relative z-10">
          <X size={20} />
        </button>
      </div>

      {/* Database Connection Status */}
      <div className="px-6 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-emerald-500 tracking-widest">
          <Database size={12} />
          <span>Firecrawl Agent: Active</span>
        </div>
        <span className="text-[10px] text-zinc-500">Syncing...</span>
      </div>

      {/* Content Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {mockInsights.map((insight) => (
          <div key={insight.id} className="bg-[#0a0a0a] border border-zinc-800 rounded-xl overflow-hidden relative group">
            {/* Deploying Matrix Overlay */}
            {isDeploying === insight.id && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center border-2 border-emerald-500 rounded-xl">
                <Code size={32} className="text-emerald-500 animate-pulse mb-3" />
                <p className="text-xs text-emerald-500 font-bold tracking-widest uppercase animate-pulse">Compiling Weights...</p>
                <div className="w-3/4 h-1 bg-zinc-800 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-emerald-500 w-full animate-slide-in-left"></div>
                </div>
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <ShieldAlert size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Friction Detected</span>
                </div>
                <span className="text-[9px] text-zinc-500 tracking-widest">{insight.source}</span>
              </div>
              
              <h3 className="text-sm font-bold text-white mb-2 leading-snug">{insight.point}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">{insight.description}</p>
              
              <div className="bg-indigo-500/5 border border-indigo-500/20 p-3 rounded-lg flex items-center gap-3">
                <Github size={16} className="text-indigo-400 shrink-0" />
                <div>
                  <p className="text-[9px] uppercase font-black text-indigo-500 mb-1">Proposed Fix</p>
                  <p className="text-[11px] text-indigo-300 font-medium">{insight.fix}</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 p-3 border-t border-zinc-800 flex justify-end">
              <button 
                disabled={deployedFixes[insight.id]}
                onClick={() => handleDeploy(insight)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  deployedFixes[insight.id] 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' 
                    : 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                }`}
              >
                {deployedFixes[insight.id] ? (
                  <><CheckCircle size={14} /> Deployed</>
                ) : (
                  <><GitBranch size={14} /> Deploy Fix</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
