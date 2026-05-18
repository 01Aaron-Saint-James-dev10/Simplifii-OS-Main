import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import { useAuth } from '../contexts/AuthContext';
import { UNIVERSITY_GROUPS, STUDY_YEARS } from '../utils/universities';
import HelpTooltip from '../components/HelpTooltip';
import axios from 'axios';
import { User, Mail, Shield, Palette, ArrowLeft, GraduationCap, Gift, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const Settings = () => {
  const { user, checkAuth } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [university, setUniversity] = useState(user?.university || '');
  const [studyYear, setStudyYear] = useState(user?.studyYear || '');
  const [faculty, setFaculty] = useState(user?.faculty || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  const [referralMsg, setReferralMsg] = useState('');
  const [referralErr, setReferralErr] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      if (name.trim() && name !== user?.name) payload.name = name.trim();
      if (university !== user?.university) payload.university = university;
      if (studyYear !== user?.studyYear) payload.studyYear = studyYear;
      if (faculty.trim() !== (user?.faculty || '')) payload.faculty = faculty.trim();
      if (Object.keys(payload).length === 0) { setSaving(false); return; }
      await axios.put(`${API}/user/profile`, payload, { withCredentials: true });
      await checkAuth();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleRedeemReferral = async () => {
    if (!referralInput.trim()) return;
    setReferralMsg('');
    setReferralErr('');
    try {
      const res = await axios.post(`${API}/user/redeem-referral`, { code: referralInput.trim() }, { withCredentials: true });
      setReferralMsg(res.data.message);
      setReferralInput('');
      await checkAuth();
    } catch (err) {
      setReferralErr(err.response?.data?.detail || 'Could not redeem code');
    }
  };

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navigation />
      <AccessibilityToolbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors" data-testid="settings-back">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <h1 className="text-4xl font-bold text-white mb-8" style={{ fontFamily: 'Outfit' }} data-testid="settings-heading">Account Settings</h1>

        {/* Profile Section */}
        <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-6 mb-6" data-testid="settings-profile-section">
          <div className="flex items-center gap-2 mb-5">
            <User size={16} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Profile</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="settings-name-input"
                className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Email</label>
              <div className="flex items-center gap-2 px-4 py-3 bg-[#09090B] border border-white/[0.06] rounded-xl">
                <Mail size={14} className="text-zinc-600" />
                <span className="text-sm text-zinc-400">{user?.email}</span>
                <span className="ml-auto text-[10px] text-zinc-600 bg-white/[0.04] px-2 py-0.5 rounded-full">Cannot change</span>
              </div>
            </div>
          </div>
        </div>

        {/* University Section */}
        <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-6 mb-6" data-testid="settings-university-section">
          <div className="flex items-center gap-2 mb-5">
            <GraduationCap size={16} className="text-violet-400" />
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">University</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">University</label>
              <select
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                data-testid="settings-university"
                className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white text-sm focus:ring-2 focus:ring-violet-500/40 appearance-none"
              >
                <option value="">Select your university...</option>
                {UNIVERSITY_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((uni) => (
                      <option key={uni} value={uni}>{uni}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Year Level</label>
                <select
                  value={studyYear}
                  onChange={(e) => setStudyYear(e.target.value)}
                  data-testid="settings-year"
                  className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white text-sm focus:ring-2 focus:ring-violet-500/40 appearance-none"
                >
                  <option value="">Select year...</option>
                  {STUDY_YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Faculty / School</label>
                <input
                  type="text"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  data-testid="settings-faculty"
                  placeholder="e.g. Business, Arts..."
                  className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 text-sm focus:ring-2 focus:ring-violet-500/40"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              data-testid="settings-save-btn"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Referral Section */}
        <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-6 mb-6" data-testid="settings-referral-section">
          <div className="flex items-center gap-2 mb-5">
            <Gift size={16} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Referral Program</h2>
            <HelpTooltip text={"Share this code with a friend.\nWhen they sign up, you both get\nbonus tickets automatically."} />
          </div>
          <p className="text-sm text-zinc-500 mb-4">Share your code with a mate — you both get <span className="text-emerald-400 font-semibold">1 free ticket</span> when they redeem it.</p>

          {user?.referralCode && (
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 px-4 py-3 bg-[#09090B] border border-white/[0.06] rounded-xl font-mono text-emerald-400 text-sm tracking-wider" data-testid="referral-code-display">
                {user.referralCode}
              </div>
              <button onClick={copyReferralCode} data-testid="copy-referral-btn" className="px-4 py-3 bg-white/[0.04] hover:bg-white/[0.06] rounded-xl text-zinc-400 hover:text-white transition-all">
                {copiedCode ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
              </button>
            </div>
          )}

          {!user?.referredBy && (
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Got a referral code? Enter it below</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralInput}
                  onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                  data-testid="referral-input"
                  placeholder="SIM-XXXXXX"
                  className="flex-1 px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white font-mono placeholder-zinc-600 text-sm focus:ring-2 focus:ring-amber-500/40 uppercase"
                />
                <button onClick={handleRedeemReferral} disabled={!referralInput.trim()} data-testid="redeem-referral-btn" className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Redeem
                </button>
              </div>
              {referralMsg && <p className="text-sm text-emerald-400 mt-2">{referralMsg}</p>}
              {referralErr && <p className="text-sm text-red-400 mt-2">{referralErr}</p>}
            </div>
          )}
          {user?.referredBy && (
            <p className="text-sm text-zinc-500">You used referral code: <span className="text-emerald-400 font-mono">{user.referredBy}</span></p>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-6 mb-6" data-testid="settings-account-section">
          <div className="flex items-center gap-2 mb-5">
            <Shield size={16} className="text-cyan-400" />
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Account</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-zinc-400">Tickets remaining</span>
              <span className="text-sm font-semibold text-emerald-400">{user?.credits}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-zinc-400">Account type</span>
              <span className="text-sm text-zinc-300">{user?.is_owner ? 'Owner' : user?.has_purchased ? 'Paid' : 'Free'}</span>
            </div>
          </div>
        </div>

        {/* Accessibility Quick Link */}
        <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-6" data-testid="settings-accessibility-section">
          <div className="flex items-center gap-2 mb-3">
            <Palette size={16} className="text-teal-400" />
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Accessibility</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-3">Adjust font size, contrast, reading ruler, and focus mode using the accessibility panel on the left side of every page.</p>
          <div className="text-xs text-zinc-600">Settings are saved automatically and persist across sessions.</div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
