import React, { useState, useMemo } from 'react';
import { Link as LinkIcon, Loader2, CheckCircle2, FileText, Search, AlertCircle } from 'lucide-react';
import { ACCENT_BORDER_FAINT, ACCENT_FOCUS } from '../theme/tokens';
import { buildSlotsFromFormula, validateUrl, scrapeAndExtract } from '../services/EvidenceFormulaService';

export default function ResourceIngestor({ evidenceFormula = [], onIngestComplete }) {
  const slots = useMemo(() => buildSlotsFromFormula(evidenceFormula), [evidenceFormula]);

  const [urls, setUrls] = useState(Array(slots.length).fill(''));
  const [errors, setErrors] = useState(Array(slots.length).fill(''));
  const [isScraping, setIsScraping] = useState(false);
  const [ingested, setIngested] = useState(false);

  const handleUrlChange = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
    
    // Clear error on typing
    const newErrors = [...errors];
    newErrors[index] = '';
    setErrors(newErrors);
  };

  const handleScrape = () => {
    // Validate all
    let hasError = false;
    const newErrors = [...errors];
    urls.forEach((url, i) => {
      const err = validateUrl(url, slots[i].type);
      if (err) {
        hasError = true;
        newErrors[i] = err;
      }
    });

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsScraping(true);
    // 1500ms simulates network scraping latency; actual work is in EvidenceFormulaService.
    setTimeout(async () => {
      const extractions = await scrapeAndExtract(urls, slots);
      setIsScraping(false);
      setIngested(true);
      if (onIngestComplete) onIngestComplete(extractions);
    }, 1500);
  };

  if (ingested) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl flex items-center justify-between animate-fade-in" style={{ boxShadow: `0 0 20px ${ACCENT_BORDER_FAINT}` }}>
        <div className="flex items-center gap-4">
          <CheckCircle2 size={24} className="text-emerald-400" />
          <div>
            <h3 className="text-emerald-400 font-black uppercase tracking-widest text-sm mb-1">Resources Grounded</h3>
            <p className="text-zinc-400 text-xs font-medium">Abstracts & Methodologies successfully extracted to Institutional Context.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-zinc-800 p-2 rounded-lg text-emerald-500"><Search size={18} /></div>
        <div>
          <h3 className="text-white font-black uppercase tracking-widest text-sm">Evidence Grounding</h3>
          <p className="text-zinc-500 text-xs font-medium">URLs are used to 'Ground' the synthesis. We will extract Findings to populate your drafting blocks.</p>
        </div>
      </div>
      
      <div className="space-y-4 mb-6">
        {slots.map((slot, i) => (
          <div key={i}>
            <div className="flex items-center gap-3 relative">
              <LinkIcon size={14} className="text-zinc-600 absolute left-4" />
              <input 
                type="text" 
                value={urls[i] || ''}
                onChange={(e) => handleUrlChange(i, e.target.value)}
                placeholder={`${slot.label} URL`}
                className={`w-full bg-black/50 border ${errors[i] ? 'border-red-500' : 'border-zinc-800'} rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder-zinc-700 font-medium`}
              />
            </div>
            {errors[i] && (
              <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-1">
                <AlertCircle size={12} /> {errors[i]}
              </p>
            )}
          </div>
        ))}
      </div>

      <button 
        onClick={handleScrape}
        disabled={isScraping || urls.every(u => !u)}
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
        style={{ boxShadow: `0 0 15px ${ACCENT_FOCUS}` }}
      >
        {isScraping ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
        {isScraping ? 'SCRAPING RESOURCES...' : 'EXTRACT METADATA'}
      </button>
    </div>
  );
}
