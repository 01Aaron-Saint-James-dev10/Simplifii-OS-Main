import React, { useState, useMemo } from 'react';
import { Link as LinkIcon, Loader2, CheckCircle2, FileText, Search, AlertCircle } from 'lucide-react';
import { translateToEnglish } from '../services/TranslationService';
import { extractSemanticEntities } from '../services/KnowledgeGraphService';

export default function ResourceIngestor({ evidenceFormula = [], onIngestComplete }) {
  const slots = useMemo(() => {
    let s = [];
    if (evidenceFormula && evidenceFormula.length > 0) {
      evidenceFormula.forEach(f => {
        for(let i=0; i<f.count; i++) {
          s.push({ type: f.type, label: `${f.label} ${i+1}` });
        }
      });
    } else {
      s = [{ type: 'generic', label: 'Academic Source 1' }, { type: 'generic', label: 'Academic Source 2' }, { type: 'generic', label: 'Academic Source 3' }];
    }
    return s;
  }, [evidenceFormula]);

  const [urls, setUrls] = useState(Array(slots.length).fill(''));
  const [errors, setErrors] = useState(Array(slots.length).fill(''));
  const [isScraping, setIsScraping] = useState(false);
  const [ingested, setIngested] = useState(false);

  const validateUrl = (url, type) => {
    if (!url) return '';
    const lowerUrl = url.toLowerCase();
    if (type === 'primary') {
      const validDomains = ['.gov', '.edu', 'nature.com', 'ncbi.nlm.nih.gov', 'sciencedirect.com', 'plos.org'];
      const isValid = validDomains.some(domain => lowerUrl.includes(domain));
      if (!isValid) return 'Rejected: URL does not appear to be from a recognized primary research publisher (.gov, .edu, nature, ncbi, etc.).';
    }
    return '';
  };

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
    // Simulate semantic scraping, translation, and knowledge graph mapping
    const focus = localStorage.getItem('simplifii_inferred_focus') || 'General Academic Topic';
    
    setTimeout(async () => {
      const extractions = await Promise.all(urls.filter(u => u).map(async (url, index) => {
        const domainMatch = url.match(/:\/\/(www\.)?([^/]+)/);
        const source = domainMatch ? domainMatch[2] : 'Academic Database';
        
        // 1. "Scrape" raw text (Simulated)
        const rawContent = `Foreign/Raw finding regarding ${focus}: Specific conditions activate key molecular pathways.`;
        
        // 2. Multi-Modal Translation
        const translatedContent = await translateToEnglish(rawContent, 'mock_jwt_token_xyz123');
        
        // 3. Knowledge Graph Entity Extraction
        const entities = await extractSemanticEntities(translatedContent, 'mock_jwt_token_xyz123');
        const entityTags = entities.map(e => `<span class="bg-zinc-800 text-emerald-400 px-1 py-0.5 rounded text-[10px] uppercase font-bold">${e.label}</span>`).join(' ');

        return {
          id: `ev_${Date.now()}_${index}`,
          type: 'link',
          source: source,
          content: `${translatedContent}<br/><div class="mt-2 flex gap-1 flex-wrap">${entityTags}</div>`,
          entities: entities, // Save raw entities for the Ledger
          timestamp: Date.now()
        };
      }));
      
      setIsScraping(false);
      setIngested(true);
      if (onIngestComplete) onIngestComplete(extractions);
    }, 1500);
  };

  if (ingested) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-fade-in">
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
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
      >
        {isScraping ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
        {isScraping ? 'SCRAPING RESOURCES...' : 'EXTRACT METADATA'}
      </button>
    </div>
  );
}
