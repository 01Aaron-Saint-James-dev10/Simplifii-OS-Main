import React from 'react';
import { Mic, Link as LinkIcon, FileImage, Sparkles } from 'lucide-react';
import { ACCENT_BORDER_FAINT, ACCENT_GLASS_STRONG } from '../theme/tokens';

export default function FloatingResourceCard({ resource, onSystemise }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('resource_id', resource.id);
    e.dataTransfer.setData('resource_content', resource.content);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  return (
    <div 
      className="bg-zinc-900/80 backdrop-blur-md border border-emerald-500/30 p-4 rounded-xl mb-3 relative overflow-hidden group cursor-grab active:cursor-grabbing"
      style={{ boxShadow: `0 0 20px ${ACCENT_BORDER_FAINT}` }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      
      <div className="flex items-start gap-3 relative z-10">
        <div className="p-2 bg-zinc-800 rounded-lg">
          {resource.type === 'voice' ? <Mic size={16} className="text-emerald-400" /> : 
           resource.type === 'image' ? <FileImage size={16} className="text-emerald-400" /> : 
           <LinkIcon size={16} className="text-emerald-400" />}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{resource.source}</span>
            <span className="text-[10px] text-zinc-500">{new Date(resource.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          
          <p className="text-sm text-zinc-300 leading-relaxed italic" dangerouslySetInnerHTML={{ __html: `"${resource.content}"` }}></p>
          
          {resource.type === 'voice' && (
            <div className="mt-3 flex justify-end">
              <button 
                onClick={() => onSystemise(resource)}
                className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                style={{ boxShadow: `0 0 10px ${ACCENT_GLASS_STRONG}` }}
              >
                <Sparkles size={12} /> Systemise to {resource.targetBlock || 'Block'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
