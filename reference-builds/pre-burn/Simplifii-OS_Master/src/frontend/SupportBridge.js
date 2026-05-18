import React, { useState, useEffect } from 'react';
import { Mail, LifeBuoy, X, Shield, Send, ArrowRight, BrainCircuit } from 'lucide-react';
import { speakSystemMessage } from '../services/MessagingHub';
import { useProject } from './ProjectContext';

export default function SupportBridge({ onClose, isLiteralMode }) {
  const { courses, activeCourseId } = useProject();
  const courseName = (courses?.[activeCourseId]?.name || 'this course').trim() || 'this course';
  const [recipient, setRecipient] = useState('convenor@example.edu');

  const templates = [
    {
      id: 'extension',
      title: '3-Day Extension',
      subject: `${courseName} Assessment: Equitable Learning Plan Extension Request - [Your ZID]`,
      body: `Dear Course Convenor,\n\nI am writing to formally request a 3-day extension for the upcoming ${courseName} assessment, in alignment with the reasonable adjustments outlined in my active Equitable Learning Plan (ELP).\n\nDue to current cognitive load (as reflected in the attached effort log), I require this adjustment to ensure my submission accurately reflects my understanding of the course learning outcomes, rather than being a measure of processing speed.\n\nThank you for your ongoing flexibility and for facilitating these institutional adjustments.\n\nKind regards,\n[Your Name]\n[Your ZID]\n\n[UDL Attachment: View My Verified Effort Log: simplifii.link/log-94827]\n*This verified link proves 4.2 hours of focused work on this assessment block.*`
    },
    {
      id: 'format',
      title: 'Format Adjustment',
      subject: `${courseName} Assessment: ELP Format Adjustment Request - [Your ZID]`,
      body: `Dear Course Convenor,\n\nI am contacting you to request a format adjustment for the upcoming ${courseName} assessment, as supported by my Equitable Learning Plan (ELP) under the Universal Design for Learning (UDL) framework.\n\nTo best demonstrate my achievement of the course learning outcomes without the barrier of executive dysfunction, I propose submitting a multi-modal presentation instead of the standard written format.\n\nPlease let me know a suitable time to briefly discuss the logistical implementation of this reasonable adjustment.\n\nKind regards,\n[Your Name]\n[Your ZID]\n\n[UDL Attachment: View My Verified Effort Log: simplifii.link/log-94827]\n*This verified link proves sustained engagement with the learning material.*`
    },
    {
      id: 'checkin',
      title: 'Clarification Check-in',
      subject: `${courseName}: Progress Update & Clarification - [Your ZID]`,
      body: `Dear Course Convenor,\n\nI am providing a brief update on my progress for the ${courseName} assessment. I have successfully mapped the core methodologies but require clarification on one specific rubric criterion to proceed effectively.\n\nCould you please confirm the exact expectations regarding the methodology section?\n\nThank you for your time and guidance.\n\nKind regards,\n[Your Name]\n[Your ZID]\n\n[UDL Attachment: View My Verified Effort Log: simplifii.link/log-94827]\n*This verified link provides context on my current drafting bottlenecks.*`
    }
  ];

  useEffect(() => {
    speakSystemMessage("I've noticed the friction. Here are 3 drafts based on your current progress. Which one feels right?", "Assistant Activated");
  }, []);

  const handleSend = (template) => {
    const subject = encodeURIComponent(template.subject);
    const body = encodeURIComponent(template.body);
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[1200] w-[500px] bg-black/95 backdrop-blur-3xl border-l border-emerald-500/30 flex flex-col shadow-[-20px_0_100px_rgba(16,185,129,0.15)] animate-slide-in-right">
      
      {/* Header */}
      <div className="p-6 border-b border-emerald-500/20 flex justify-between items-center bg-emerald-500/5 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-scan-line opacity-50"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/50">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h2 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              Neural Assistant <span className="text-[9px] bg-emerald-500 text-black px-2 py-0.5 rounded font-bold">UDL PROTOCOL</span>
            </h2>
            <p className="text-[10px] text-zinc-400 font-medium mt-1">Instant No-Apology Institutional Drafts</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors bg-zinc-900 rounded-full border border-zinc-800 relative z-10">
          <X size={20} />
        </button>
      </div>

      {/* Control Bar */}
      <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center shrink-0">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Select Recipient</span>
        <select 
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="bg-black border border-zinc-700 text-zinc-300 text-[10px] font-bold p-2 rounded-lg outline-none"
        >
          <option value="convenor@example.edu">Course Convenor</option>
          <option value="els@unsw.edu.au">Equitable Learning (ELS)</option>
        </select>
      </div>

      {/* Content Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <p className="text-xs text-emerald-500/80 mb-2 leading-relaxed font-bold">
          "I've noticed the friction. Here are 3 drafts for an extension based on your current progress. Which one feels right?"
        </p>
        
        {templates.map((template) => (
          <div key={template.id} className="bg-[#0a0a0a] border border-zinc-800 hover:border-emerald-500/50 rounded-xl overflow-hidden relative group transition-all">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
               <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                 <Shield size={14} /> {template.title}
               </h3>
            </div>
            
            <div className="p-4">
              <input 
                type="text" 
                value={template.subject} 
                readOnly
                className="w-full bg-transparent border-b border-zinc-800 pb-2 text-[10px] font-bold text-white mb-4 outline-none truncate"
              />
              <textarea 
                value={template.body}
                readOnly
                className="w-full h-32 bg-transparent border-none text-[11px] text-zinc-400 leading-relaxed outline-none resize-none custom-scrollbar"
              />
            </div>

            <div className="bg-zinc-900/50 p-3 border-t border-zinc-800 flex justify-end">
              <button 
                onClick={() => handleSend(template)}
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all bg-white text-black hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              >
                Review in Mail <Send size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
