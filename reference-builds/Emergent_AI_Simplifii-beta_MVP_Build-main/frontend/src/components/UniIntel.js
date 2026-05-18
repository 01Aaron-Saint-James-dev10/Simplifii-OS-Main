import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GraduationCap, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

const UniIntel = () => {
  const [intel, setIntel] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    const fetchIntel = async () => {
      try {
        const res = await axios.get(`${API}/university/intel`, { withCredentials: true });
        setIntel(res.data);
      } catch (err) {
        // Not authenticated or no university set
      }
    };
    fetchIntel();
  }, [API]);

  if (!intel || !intel.university) return null;

  return (
    <div className="p-5 rounded-2xl bg-[#111113] border border-white/[0.06]" data-testid="uni-intel-widget">
      <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-cyan-400" />
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Your Uni</span>
        </div>
        {expanded ? <ChevronUp size={14} className="text-zinc-600" /> : <ChevronDown size={14} className="text-zinc-600" />}
      </div>
      <p className="text-sm font-medium text-white mb-2" style={{ fontFamily: 'Outfit' }} data-testid="uni-intel-name">{intel.university}</p>
      <p className="text-[11px] text-zinc-500 mb-1">{intel.grading}</p>

      {expanded && (
        <div className="mt-3 space-y-3 animate-in fade-in duration-200">
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Referencing</p>
            <p className="text-xs text-zinc-400">{intel.referencing}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Tips</p>
            <ul className="space-y-1">
              {intel.tips?.map((tip, i) => (
                <li key={i} className="text-xs text-zinc-400 flex gap-1.5">
                  <BookOpen size={10} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniIntel;
