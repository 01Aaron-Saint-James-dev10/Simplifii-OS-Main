import React, { useState } from 'react';
import { Share2, Download, Trophy, Star, Zap, Check } from 'lucide-react';

const badgeIcons = { trophy: Trophy, star: Star, zap: Zap };
const badgeColors = { emerald: 'text-emerald-400 bg-emerald-500/10', amber: 'text-amber-400 bg-amber-500/10', cyan: 'text-cyan-400 bg-cyan-500/10' };

const ShareCard = ({ cardData }) => {
  const [copied, setCopied] = useState(false);

  if (!cardData) return null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Simplifii-B Progress`,
          text: cardData.share_text,
          url: window.location.origin,
        });
      } catch (err) {
        fallbackCopy();
      }
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    navigator.clipboard.writeText(`${cardData.share_text}\n${window.location.origin}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div data-testid="share-card">
      {/* Visual Card */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#111113] via-[#0a1a1a] to-[#111113] border border-emerald-500/20 p-6" data-testid="share-card-visual">
        <div className="text-center mb-4">
          <div className="text-xs text-emerald-400 font-medium uppercase tracking-widest mb-1">Simplifii-B</div>
          <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>{cardData.title}</h3>
          <p className="text-xs text-zinc-500 mt-1">{cardData.type}</p>
        </div>

        {/* Progress Ring */}
        <div className="flex justify-center mb-4">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={cardData.progress_pct === 100 ? '#10b981' : '#06b6d4'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${cardData.progress_pct * 2.51} 251`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>{cardData.progress_pct}%</span>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-zinc-400 mb-4">
          {cardData.tasks_done} of {cardData.tasks_total} tasks completed
        </div>

        {/* Badges */}
        {cardData.badges.length > 0 && (
          <div className="flex justify-center gap-2 mb-4">
            {cardData.badges.map((badge, i) => {
              const Icon = badgeIcons[badge.icon] || Star;
              const colors = badgeColors[badge.colour] || badgeColors.emerald;
              return (
                <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${colors} text-xs font-medium`}>
                  <Icon size={12} /> {badge.name}
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center text-[10px] text-zinc-600">
          {cardData.student_name} on Simplifii-B
        </div>
      </div>

      {/* Share Button */}
      <button
        onClick={handleShare}
        data-testid="share-card-btn"
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all text-sm"
      >
        {copied ? <><Check size={16} /> Copied!</> : <><Share2 size={16} /> Share Your Progress</>}
      </button>
    </div>
  );
};

export default ShareCard;
