import React from 'react';
import { Network, Database, Calendar, Search } from 'lucide-react';

export default function GraphView({ syncData }) {
  // Demo nodes shown until real entities arrive from KnowledgeGraphService.
  const nodes = [
    { id: 'n1', label: 'Active Course Brief', icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'n2', label: 'Key Concept', icon: Search, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'n3', label: 'Upcoming Deadline', icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'n4', label: 'Linked Notes', icon: Database, color: 'text-purple-500', bg: 'bg-purple-500/10' }
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl mb-6 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="bg-zinc-800 p-2 rounded-lg text-emerald-500"><Network size={18} /></div>
        <div>
          <h3 className="text-white font-black uppercase tracking-widest text-sm">Cognitive Web</h3>
          <p className="text-zinc-500 text-xs font-medium">Map of Thought: Visualizing semantic connections between your Vault, Calendar, and Search.</p>
        </div>
      </div>

      <div className="relative h-48 w-full bg-black/40 rounded-xl border border-zinc-800/50 flex items-center justify-center p-4 overflow-hidden">
        {/* Simulated connections */}
        <svg className="absolute inset-0 w-full h-full opacity-30" style={{ zIndex: 0 }}>
          <path d="M 150 100 Q 250 50 350 100" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
          <path d="M 350 100 Q 400 150 250 180" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" style={{ animationDelay: '500ms' }} />
          <path d="M 150 100 Q 100 150 250 180" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" style={{ animationDelay: '1000ms' }} />
          <path d="M 150 100 Q 250 150 550 100" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" style={{ animationDelay: '1500ms' }} />
        </svg>

        <div className="flex justify-between items-center w-full max-w-3xl relative z-10">
          {nodes.map((node, i) => {
            const Icon = node.icon;
            return (
              <div key={node.id} className="flex flex-col items-center gap-2" style={{ transform: i % 2 !== 0 ? 'translateY(30px)' : 'translateY(-20px)' }}>
                <div className={`p-4 rounded-full ${node.bg} ${node.color} border border-zinc-800 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all hover:scale-110 cursor-pointer`}>
                  <Icon size={24} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest bg-black/80 px-2 py-1 rounded border border-zinc-800 ${node.color}`}>
                  {node.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
