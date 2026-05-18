import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, ChevronRight } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const sanitizeInput = (text) => {
  if (!text) return '';
  return text.replace(/[^\x20-\x7E\u00C0-\u024F]/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 60);
};

const RecentToolOutputs = ({ toolName }) => {
  const [entries, setEntries] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API}/history/recent/${encodeURIComponent(toolName)}?limit=3`, { withCredentials: true });
        setEntries(res.data.entries || []);
      } catch {}
    };
    fetch();
  }, [toolName]);

  if (entries.length === 0) return null;

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <div className="mt-6 p-4 rounded-xl border border-white/[0.06] bg-white/[0.01]" data-testid="recent-tool-outputs">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent {toolName} outputs</h3>
      <div className="space-y-2">
        {entries.map((e) => (
          <button
            key={e.history_id}
            data-testid={`recent-output-${e.history_id}`}
            onClick={() => navigate(`/saved-outputs/${e.history_id}`)}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] transition-all text-left group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300 truncate">{sanitizeInput(e.input_summary)}</p>
              <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5"><Clock size={10} /> {formatDate(e.created_at)}</p>
            </div>
            <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentToolOutputs;
