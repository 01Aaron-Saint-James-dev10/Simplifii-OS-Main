import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Play, Share2, Copy, Check, Pencil, X, Save, Link2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const parseYoutubeId = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([^?&\s]+)/);
  return m ? m[1] : null;
};

const VideoCard = ({ video, isOwner, onUpdate }) => {
  const [shareOpen, setShareOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editUrl, setEditUrl] = useState(video.video_url || '');
  const [editTitle, setEditTitle] = useState(video.title || '');
  const [editDesc, setEditDesc] = useState(video.description || '');
  const [editDur, setEditDur] = useState(video.duration || '');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const ytId = parseYoutubeId(video.video_url);
  const hasVideo = !!video.video_url && !video.placeholder;

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/showcase/videos/${video.id}`, {
        video_url: editUrl, title: editTitle, description: editDesc, duration: editDur,
      }, { withCredentials: true });
      onUpdate();
      setEditing(false);
    } catch {}
    setSaving(false);
  };

  const handleShare = (type) => {
    const url = window.location.origin;
    const text = `Check out Simplifii — ${video.title}`;
    if (type === 'copy') {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (type === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (type === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    }
    setShareOpen(false);
  };

  if (editing) {
    return (
      <div className="bg-[#111113] rounded-2xl border border-amber-500/20 p-5 space-y-3" data-testid={`video-edit-${video.id}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-amber-400 font-medium">Edit Video</span>
          <button onClick={() => setEditing(false)} className="text-zinc-600 hover:text-zinc-400"><X size={14} /></button>
        </div>
        <input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="YouTube URL or embed code" className="w-full px-3 py-2.5 bg-[#09090B] border border-white/[0.08] rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30" data-testid={`video-url-input-${video.id}`} />
        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Video title" className="w-full px-3 py-2 bg-[#09090B] border border-white/[0.08] rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
        <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Short description" className="w-full px-3 py-2 bg-[#09090B] border border-white/[0.08] rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
        <input value={editDur} onChange={(e) => setEditDur(e.target.value)} placeholder="Duration (e.g. 90 sec)" className="w-full px-3 py-2 bg-[#09090B] border border-white/[0.08] rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30" />
        <button onClick={handleSave} disabled={saving} className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-semibold transition-colors disabled:opacity-40" data-testid={`video-save-${video.id}`}>
          {saving ? 'Saving...' : <><Save size={14} className="inline mr-1.5" />Save Video</>}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#111113] rounded-2xl border border-white/[0.06] hover:border-emerald-500/15 transition-all group" data-testid={`video-card-${video.id}`}>
      {/* Video area */}
      <div className="relative aspect-video rounded-t-2xl overflow-hidden bg-[#0a0a0c]">
        {hasVideo && ytId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ytId}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : hasVideo && video.video_url ? (
          <video src={video.video_url} controls className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
              <Play size={24} className="text-emerald-400 ml-1" />
            </div>
            <p className="text-xs text-zinc-600">Video coming soon</p>
          </div>
        )}
        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[10px] text-white font-medium">
            {video.duration}
          </div>
        )}
        {/* Owner edit icon */}
        {isOwner && (
          <button onClick={() => setEditing(true)} className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-lg text-amber-400 hover:text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`video-edit-btn-${video.id}`}>
            <Pencil size={12} />
          </button>
        )}
      </div>
      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-white mb-1 line-clamp-1" style={{ fontFamily: 'Outfit' }}>{video.title}</h3>
        <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{video.description}</p>
        <div className="relative">
          <button onClick={() => setShareOpen(!shareOpen)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.06] rounded-lg text-xs text-zinc-400 hover:text-zinc-300 transition-all" data-testid={`video-share-btn-${video.id}`}>
            <Share2 size={12} /> Share
          </button>
          {shareOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-44 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden" data-testid={`video-share-menu-${video.id}`}>
              <button onClick={() => handleShare('copy')} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-zinc-300 hover:bg-white/[0.04] transition-colors">
                {copied ? <Check size={12} className="text-emerald-400" /> : <Link2 size={12} />} {copied ? 'Copied!' : 'Copy link'}
              </button>
              <button onClick={() => handleShare('whatsapp')} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-zinc-300 hover:bg-white/[0.04] transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.79 23.329l4.47-1.474A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.18-.673-5.836-1.82l-.418-.248-2.65.875.89-2.582-.273-.434A9.78 9.78 0 012.182 12c0-5.42 4.398-9.818 9.818-9.818S21.818 6.58 21.818 12 17.42 21.818 12 21.818z"/></svg>
                WhatsApp
              </button>
              <button onClick={() => handleShare('facebook')} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-zinc-300 hover:bg-white/[0.04] transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VideoShowcase = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [referralCopied, setReferralCopied] = useState(false);

  const fetchVideos = async () => {
    try {
      const res = await axios.get(`${API}/showcase/videos`);
      setVideos(res.data.videos || []);
    } catch {}
  };

  useEffect(() => { fetchVideos(); }, []);

  const isOwnerUser = user?.is_owner === true;

  const handleCopyReferral = () => {
    const referralUrl = `${window.location.origin}?ref=${user?.referralCode || ''}`;
    navigator.clipboard.writeText(referralUrl);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 3000);
  };

  return (
    <div className="border-t border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" data-testid="video-showcase-section">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Outfit' }}>See Simplifii in action</h2>
          <p className="text-zinc-400 text-base max-w-2xl mx-auto">Watch how students are using Simplifii to decode their assessments, plan their semester, and finally understand what their lecturers want.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} isOwner={isOwnerUser} onUpdate={fetchVideos} />
          ))}
        </div>

        {/* Referral CTA */}
        <div className="text-center">
          <p className="text-sm text-zinc-400 mb-4">Want to share Simplifii with your study group?</p>
          {user ? (
            <div>
              <button onClick={handleCopyReferral} className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-semibold text-sm transition-colors" data-testid="referral-copy-btn">
                {referralCopied ? <><Check size={14} /> Link copied! Share it with your study group.</> : <><Copy size={14} /> Copy your referral link</>}
              </button>
            </div>
          ) : (
            <a href="#login" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-semibold text-sm transition-colors" data-testid="referral-signup-btn">
              Sign up to get your referral link <span>&rarr;</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoShowcase;
