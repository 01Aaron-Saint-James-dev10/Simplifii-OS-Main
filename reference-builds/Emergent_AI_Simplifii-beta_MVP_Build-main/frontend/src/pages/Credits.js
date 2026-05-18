import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import axios from 'axios';
import { Check, Loader2, ArrowRight, Star, Sparkles, ArrowDown, Upload, FileText, CheckCircle2, BookOpen, Timer, BookMarked, Eye, Zap, Plus, Calendar } from 'lucide-react';

const toolDirectory = [
  { name: 'Brief Simplifier', path: '/brief-simplifier', cost: 3, desc: "Can't figure out what your lecturer actually wants? Upload your assessment brief and get plain language instructions, a week-by-week action plan, and every deadline clearly mapped.", bestFor: 'Starting any new assignment', icon: Upload, accent: 'emerald' },
  { name: 'Course Planner', path: '/course-planner', cost: 3, desc: "Got assessments across three courses and no idea what to tackle first? Upload all your course outlines and get one clear semester-wide plan.", bestFor: 'Semester planning and deadline tracking', icon: BookOpen, accent: 'rose' },
  { name: 'Assessment Scaffolder', path: '/assessment-scaffolder', cost: 3, desc: "Staring at a blank page and don't know where to start? Get a complete section-by-section writing blueprint with exact word counts.", bestFor: "Students who don't know where to start", icon: FileText, accent: 'blue' },
  { name: 'Essay Scorer', path: '/essay-scorer', cost: 2, desc: "Written a draft but not sure if it's good enough to submit? Get honest, rubric-aligned feedback before you submit.", bestFor: 'Improving work before the deadline', icon: CheckCircle2, accent: 'violet' },
  { name: 'Humaniser', path: '/humaniser', cost: 2, desc: 'Does your writing feel stiff or keep getting flagged by AI detectors? Get back your authentic voice with before/after risk scores.', bestFor: 'Students flagged by AI detectors', icon: Sparkles, accent: 'amber' },
  { name: 'Rubric Simplifier', path: '/rubric-simplifier', cost: 2, desc: "Don't know what a Distinction actually looks like in practice? Get a point-by-point breakdown of exactly what earns every mark.", bestFor: 'Understanding exactly what markers want', icon: FileText, accent: 'cyan' },
  { name: 'Hidden Curriculum Decoder', path: '/hidden-curriculum', cost: 2, desc: "Feel like everyone else knows something you were never told? Decode the unwritten rules your lecturers expect but never explain.", bestFor: 'First-gen and international students', icon: BookMarked, accent: 'emerald' },
  { name: 'Concept Visualiser', path: '/concept-visualiser', cost: 1, desc: "Read the textbook three times and still don't get it? Understand any concept using the Feynman Technique.", bestFor: 'Students stuck on a concept', icon: Eye, accent: 'violet' },
  { name: 'Executive Function Planner', path: '/executive-planner', cost: 1, desc: "Know what you need to do but can't make yourself start? Break tasks into timed focus sessions with a built-in Pomodoro timer.", bestFor: 'ADHD and executive function challenges', icon: Timer, accent: 'cyan' },
];

const accentColors = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
};

const Credits = () => {
  const { user, checkAuth } = useAuth();
  const location = useLocation();
  const [purchasing, setPurchasing] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg, setPromoMsg] = useState('');
  const [promoErr, setPromoErr] = useState('');
  const [ownerCode, setOwnerCode] = useState('');
  const [ownerTickets, setOwnerTickets] = useState(5);
  const [ownerMaxUses, setOwnerMaxUses] = useState(100);
  const [ownerExpiry, setOwnerExpiry] = useState('');
  const [ownerCreating, setOwnerCreating] = useState(false);
  const [ownerMsg, setOwnerMsg] = useState('');

  const singlePacks = [
    { id: 'single-1', tickets: 1, price: 1.99 },
    { id: 'single-2', tickets: 2, price: 3.49 },
    { id: 'single-3', tickets: 3, price: 4.99 },
  ];

  const packages = [
    { id: 'starter',  tickets: 10,  price: 14.99,  perTicket: '$1.50', save: null,  popular: false },
    { id: 'standard', tickets: 30,  price: 38.99,  perTicket: '$1.30', save: '13%', popular: true  },
    { id: 'semester', tickets: 75,  price: 89.99,  perTicket: '$1.20', save: '20%', popular: false },
    { id: 'power',    tickets: 200, price: 219.99, perTicket: '$1.10', save: '27%', popular: false },
  ];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');
    if (sessionId) checkPaymentStatus(sessionId);
  }, [location]);

  const checkPaymentStatus = async (sessionId, attempt = 0) => {
    if (attempt >= 8) { setPaymentMessage('Payment check timed out. Please refresh.'); setCheckingPayment(false); return; }
    setCheckingPayment(true);
    setPaymentMessage('Checking payment status...');
    try {
      const response = await axios.get(`${API}/credits/status/${sessionId}`, { withCredentials: true });
      if (response.data.status === 'completed') {
        const added = response.data.tickets_added;
        const newBal = response.data.new_balance || (user?.credits || 0) + added;
        setPaymentMessage(`You're in — ${added} tickets added. New balance: ${newBal} tickets.`);
        await checkAuth();
        setTimeout(() => { window.history.replaceState({}, '', '/credits'); setPaymentMessage(''); }, 4000);
      } else if (response.data.status === 'expired') {
        setPaymentMessage('Payment session expired. Please try again.');
      } else {
        setTimeout(() => checkPaymentStatus(sessionId, attempt + 1), 2000);
      }
    } catch (error) {
      setPaymentMessage('Error checking payment status.');
    } finally {
      if (attempt === 0) setCheckingPayment(false);
    }
  };

  const handlePurchase = async (packageId) => {
    setPurchasing(packageId);
    try {
      const originUrl = window.location.origin;
      const formData = new FormData();
      formData.append('package_id', packageId);
      formData.append('origin_url', originUrl);
      const response = await axios.post(`${API}/credits/purchase`, formData, { withCredentials: true });
      window.location.href = response.data.url;
    } catch (error) {
      alert(error.response?.data?.detail || 'Purchase failed. Please try again.');
      setPurchasing(null);
    }
  };

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true); setPromoMsg(''); setPromoErr('');
    try {
      const res = await axios.post(`${API}/promo/redeem`, { code: promoCode.trim() }, { withCredentials: true });
      setPromoMsg(`${res.data.tickets_added} tickets added! New balance: ${res.data.new_balance}`);
      setPromoCode('');
      await checkAuth();
    } catch (e) {
      setPromoErr(e.response?.data?.detail || 'Invalid code');
    } finally { setPromoLoading(false); }
  };

  const handleCreatePromo = async () => {
    if (!ownerCode.trim() || ownerTickets < 1) return;
    setOwnerCreating(true); setOwnerMsg('');
    try {
      await axios.post(`${API}/promo/create`, {
        code: ownerCode.trim(),
        tickets: ownerTickets,
        max_uses: ownerMaxUses,
        expiry: ownerExpiry || null,
      }, { withCredentials: true });
      setOwnerMsg(`Code "${ownerCode.trim().toUpperCase()}" created (${ownerTickets} tickets, max ${ownerMaxUses} uses)`);
      setOwnerCode(''); setOwnerTickets(5); setOwnerMaxUses(100); setOwnerExpiry('');
    } catch (e) {
      setOwnerMsg(e.response?.data?.detail || 'Failed to create code');
    } finally { setOwnerCreating(false); }
  };

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navigation />
      <AccessibilityToolbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3" style={{ fontFamily: 'Outfit' }} data-testid="tickets-page-title">
            Grab Your Tickets
          </h1>
          <p className="text-lg text-zinc-400 mb-6">Tickets power every tool. Bundle up and save.</p>
          <div className="inline-flex items-center gap-3 px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <span className="text-2xl">&#127915;</span>
            <div className="text-left">
              <div className="text-xs text-zinc-500">Your Balance</div>
              <div className="text-xl font-bold text-emerald-400" data-testid="current-tickets">{user?.credits} tickets</div>
            </div>
          </div>
        </div>

        {paymentMessage && (
          <div className={`mb-8 p-4 rounded-xl text-center text-sm ${paymentMessage.includes("You're in") ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`} data-testid="payment-message">
            {checkingPayment && <Loader2 size={16} className="inline-block animate-spin mr-2" />}
            {paymentMessage.includes("You're in") && <span className="mr-1">&#127915;</span>}
            {paymentMessage}
          </div>
        )}

        {/* Promo Code */}
        <div className="mb-10 max-w-md mx-auto" data-testid="promo-section">
          <p className="text-sm text-zinc-500 text-center mb-3">Have a promo code?</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value); setPromoErr(''); setPromoMsg(''); }}
              placeholder="Enter code"
              className="flex-1 px-4 py-2.5 bg-[#111113] border border-white/[0.08] rounded-xl text-white text-sm placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
              data-testid="promo-input"
            />
            <button
              onClick={handleRedeemPromo}
              disabled={promoLoading || !promoCode.trim()}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
              data-testid="promo-apply-btn"
            >
              {promoLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
            </button>
          </div>
          {promoMsg && <p className="text-xs text-emerald-400 mt-2 text-center">{promoMsg}</p>}
          {promoErr && <p className="text-xs text-red-400 mt-2 text-center">{promoErr}</p>}
        </div>

        {/* Owner Promo Creator */}
        {user?.is_owner && (
          <div className="mb-10 max-w-md mx-auto p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl" data-testid="owner-promo-creator">
            <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2"><Plus size={14} /> Create promo code (owner only)</h3>
            <div className="space-y-2">
              <input value={ownerCode} onChange={(e) => setOwnerCode(e.target.value)} placeholder="Code name (e.g. WELCOME10)" className="w-full px-3 py-2 bg-[#09090B] border border-white/[0.08] rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30" data-testid="owner-code-input" />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Tickets</label>
                  <input type="number" min="1" value={ownerTickets} onChange={(e) => setOwnerTickets(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 bg-[#09090B] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/30" data-testid="owner-tickets-input" />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Max uses</label>
                  <input type="number" min="1" value={ownerMaxUses} onChange={(e) => setOwnerMaxUses(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 bg-[#09090B] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/30" data-testid="owner-max-uses-input" />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1 flex items-center gap-1">Expiry <Calendar size={10} /></label>
                  <input type="date" value={ownerExpiry} onChange={(e) => setOwnerExpiry(e.target.value)} className="w-full px-3 py-2 bg-[#09090B] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/30" data-testid="owner-expiry-input" />
                </div>
              </div>
              <button onClick={handleCreatePromo} disabled={ownerCreating || !ownerCode.trim()} className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-semibold transition-colors disabled:opacity-40" data-testid="owner-create-btn">
                {ownerCreating ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Create Code'}
              </button>
              {ownerMsg && <p className="text-xs text-amber-400 text-center mt-1">{ownerMsg}</p>}
            </div>
          </div>
        )}

        {/* Tool Directory */}
        <div className="mb-10" data-testid="tool-directory">
          <h2 className="text-lg font-bold text-white mb-5 text-center" style={{ fontFamily: 'Outfit' }}>What can you do with your tickets?</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {toolDirectory.map((tool) => {
              const colors = accentColors[tool.accent];
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.path}
                  to={tool.path}
                  className={`bg-[#111113] rounded-xl border border-white/[0.06] hover:${colors.border} p-4 transition-all group`}
                  data-testid={`tool-dir-${tool.path.slice(1)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 ${colors.bg} rounded-lg flex items-center justify-center`}>
                        <Icon size={14} className={colors.text} />
                      </div>
                      <h3 className="text-sm font-bold text-white">{tool.name}</h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{tool.cost} {tool.cost === 1 ? 'ticket' : 'tickets'}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-2 leading-relaxed">{tool.desc}</p>
                  <p className="text-[10px] text-zinc-600">Best for: {tool.bestFor}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Single Ticket Purchases */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-white mb-1 text-center" style={{ fontFamily: 'Outfit' }}>Just need a few tickets?</h2>
          <p className="text-sm text-zinc-500 text-center mb-5">Grab exactly what you need — no commitment.</p>
          <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto">
            {singlePacks.map((pack) => (
              <div
                key={pack.id}
                className="bg-[#111113] rounded-xl border border-white/[0.06] hover:border-emerald-500/20 p-5 text-center transition-all"
                data-testid={`package-${pack.id}`}
              >
                <div className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit' }}>{pack.tickets}</div>
                <div className="text-xs text-zinc-500 mb-3">{pack.tickets === 1 ? 'ticket' : 'tickets'}</div>
                <div className="text-lg font-bold text-emerald-400 mb-4" style={{ fontFamily: 'Outfit' }}>${pack.price.toFixed(2)} <span className="text-[10px] text-zinc-500 font-normal">AUD</span></div>
                <button
                  onClick={() => handlePurchase(pack.id)}
                  disabled={purchasing === pack.id}
                  data-testid={`buy-${pack.id}-btn`}
                  className="w-full py-2.5 rounded-lg font-semibold transition-all text-sm bg-white/[0.06] hover:bg-emerald-500/20 hover:text-emerald-400 text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasing === pack.id ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> ...</span>
                  ) : (
                    'Grab'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bundle separator */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 border-t border-white/[0.06]" />
          <span className="text-sm text-zinc-500 flex items-center gap-1.5">Or save more with a bundle <ArrowDown size={14} /></span>
          <div className="flex-1 border-t border-white/[0.06]" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-[#111113] rounded-2xl p-6 transition-all duration-200 ${
                pkg.popular
                  ? 'border-2 border-emerald-500/30 ring-1 ring-emerald-500/10'
                  : 'border border-white/[0.06] hover:border-white/[0.12]'
              }`}
              data-testid={`package-${pkg.id}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-black text-xs font-bold rounded-full uppercase tracking-wider">
                  Best Value
                </div>
              )}
              {pkg.save && (
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-bold text-amber-400">
                  Save {pkg.save}
                </div>
              )}

              <div className="text-center mb-5">
                <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'Outfit' }}>{pkg.id.charAt(0).toUpperCase() + pkg.id.slice(1)}</h3>
              </div>

              <div className="text-center mb-5">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>{pkg.tickets}</span>
                  <span className="text-zinc-500 text-sm">tickets</span>
                </div>
                <div className="text-2xl font-bold text-emerald-400 mt-2" style={{ fontFamily: 'Outfit' }}>${pkg.price.toFixed(2)} <span className="text-xs text-zinc-500 font-normal">AUD</span></div>
                <div className="text-xs text-zinc-500 mt-1">{pkg.perTicket} per ticket</div>
              </div>

              <ul className="space-y-2 mb-5">
                <li className="flex items-center gap-2 text-zinc-400 text-sm"><Check size={14} className="text-emerald-500 flex-shrink-0" /><span>{pkg.tickets} tool uses</span></li>
                <li className="flex items-center gap-2 text-zinc-400 text-sm"><Check size={14} className="text-emerald-500 flex-shrink-0" /><span>All 9 tools</span></li>
                <li className="flex items-center gap-2 text-zinc-400 text-sm"><Check size={14} className="text-emerald-500 flex-shrink-0" /><span>Tickets never expire</span></li>
                {pkg.tickets >= 10 && (
                  <li className="flex items-center gap-2 text-zinc-400 text-sm"><Sparkles size={14} className="text-violet-400 flex-shrink-0" /><span>Includes Study Buddy AI coach</span></li>
                )}
              </ul>

              <button
                onClick={() => handlePurchase(pkg.id)}
                disabled={purchasing === pkg.id}
                data-testid={`buy-${pkg.id}-btn`}
                className={`w-full py-3 rounded-xl font-semibold transition-all min-h-[48px] text-sm ${
                  pkg.popular
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                    : 'bg-white/[0.06] hover:bg-white/[0.08] text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {purchasing === pkg.id ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Processing...</span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">Grab these tickets <ArrowRight size={14} /></span>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Value comparison */}
        <div className="mt-10 p-6 bg-[#111113] rounded-2xl border border-white/[0.06] text-center">
          <div className="space-y-1.5 text-sm text-zinc-400">
            <p>One Brief Simplifier use: <span className="text-white font-semibold">$4.50</span></p>
            <p>One hour with a private tutor: <span className="text-white font-semibold">$80-120 AUD</span></p>
            <p className="text-zinc-500">Tickets never expire. Use them whenever you need them.</p>
          </div>
        </div>

        {/* Secure Payment */}
        <div className="mt-4 flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/5 border border-amber-500/10 rounded-xl">
            <Star size={14} className="text-amber-400" />
            <span className="text-sm text-amber-300/80">Secure payment via Stripe. Tickets added instantly.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credits;
