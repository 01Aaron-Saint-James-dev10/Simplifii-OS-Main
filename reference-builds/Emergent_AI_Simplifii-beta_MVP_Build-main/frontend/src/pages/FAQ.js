import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { ChevronDown, ChevronUp, Search, Lock, Copy, Mail, Check, ExternalLink } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}`;

/* ─── FAQ Data ─── */
const TAB1_SECTIONS = [
  {
    title: 'What is Simplifii?',
    items: [
      { q: 'What is Simplifii?', a: "Simplifii is a neuroinclusive study support platform built specifically for university students. It uses AI to help you understand assessment briefs, decode rubrics, plan your semester, get feedback on drafts, and break through the hidden curriculum that universities never explicitly teach.\n\nIt was built by a neurodivergent student who nearly didn't finish his degree — because the system wasn't built for his brain. Simplifii exists so no student has to feel that way again." },
      { q: 'Who is Simplifii for?', a: "Simplifii was built for neurodivergent students, first-generation university students, international students, mature-aged students, and anyone who has ever felt like they were on the outside of something they were never properly let into.\n\nYou don't need to identify as disabled or neurodivergent to use it. You just need to have ever read an assessment brief and not known where to start." },
      { q: 'Do I need to be neurodivergent to use Simplifii?', a: "Not at all. Simplifii was built with neurodivergent students in mind, but every tool is designed to reduce cognitive load and make expectations clearer for everyone. If you've ever felt confused by an assessment brief, Simplifii is for you." },
      { q: 'Is Simplifii free?', a: "You get 5 free tickets when you sign up — enough to try the core tools at no cost. No credit card required. Additional tickets can be purchased, earned through referrals, or claimed with promo codes.\n\nIf you genuinely cannot afford tickets, hardship access is available — email simplifii.contact@gmail.com" },
      { q: 'What universities does Simplifii work with?', a: "Simplifii works with any Australian university and most international universities. It understands documents from UNSW, USYD, UTS, Monash, Melbourne, ANU, QUT, Griffith, and 40+ other Australian institutions. If your university isn't automatically detected, you can select it manually." },
      { q: 'Is Simplifii considered academic misconduct?', a: "No. Simplifii does not generate essay content or write your assignments. It simplifies instructions, explains rubrics, and helps you plan your work. This is the same support provided by university learning centres and academic skills advisors — just available 24/7 and designed for neurodivergent students.\n\nIf you are unsure, check your university's academic integrity policy or ask your course coordinator." },
      { q: 'Will my lecturer know I used Simplifii?', a: "Simplifii is a comprehension and planning tool, not a writing tool. It helps you understand what to do — it does not write your assignment for you. Using Simplifii is no different from asking a tutor to explain an assessment brief, which is entirely legitimate academic support." },
      { q: 'Who built Simplifii?', a: 'Simplifii was built by Aaron Saint-James — a neurodivergent MRes student, co-founder of the Diversified Project at UNSW, and member of the Remarkable Accelerator. Read his full story on the About page.', link: { text: 'Read the About page', to: '/about' } },
      { q: 'I want to partner with Simplifii or pilot it at my university.', a: 'Aaron would love to hear from you. Email simplifii.contact@gmail.com with subject line: "University Partnership"' },
      { q: 'How do I sign up?', a: "Click \"Sign in with Google\" on the homepage. It takes 30 seconds. You'll get 5 free tickets automatically as soon as your account is created. No credit card required." },
    ],
  },
];

const TAB2_SECTIONS = [
  {
    title: 'Getting Started',
    items: [
      { q: 'Which tool should I use first?', a: "It depends where you are in your assessment:\n\n- Have a brief you don't understand? Start with Brief Simplifier\n- Staring at a blank page? Start with Assessment Scaffolder\n- Have a draft and want feedback? Start with Essay Scorer\n- Got multiple deadlines piling up? Start with Course Planner\n- Not sure at all? Check your Dashboard Quick Win — it suggests your best next step based on what you've uploaded." },
      { q: 'What are tickets?', a: "Tickets are how you use Simplifii's tools. Each tool costs 1-3 tickets depending on complexity:\n\n- Brief Simplifier: 3 tickets\n- Assessment Scaffolder: 3 tickets\n- Course Planner: 3 tickets\n- Essay Scorer: 2 tickets\n- Humaniser: 2 tickets\n- Rubric Simplifier: 2 tickets\n- Hidden Curriculum Decoder: 2 tickets\n- Concept Visualiser: 1 ticket\n- Executive Function Planner: 1 ticket\n\nYou get 5 free tickets on signup. Tickets never expire." },
    ],
  },
  {
    title: 'Tickets and Credits',
    items: [
      { q: 'How do I get more tickets?', a: "Four ways:\n1. Purchase a credit pack on the Credits page\n2. Enter a promo code on the Credits page or at signup\n3. Refer a friend — you both get bonus tickets when they sign up using your referral code\n4. Apply for hardship access if you genuinely cannot afford tickets (see below — we will never turn anyone away)" },
      { q: 'How much do tickets cost?', a: "Credit packs are available on the Credits page. Prices are designed to be accessible for students — a small pack gives you enough for a full semester of use." },
      { q: 'I have a promo code. Where do I enter it?', a: 'Go to the Credits page in the navigation bar and scroll down to "Have a promo code?" Enter your code and click Apply. Tickets are added to your balance instantly. You can also enter a promo code immediately after signing up on the welcome screen.' },
      { q: 'Do my tickets expire?', a: "No. Tickets stay in your account until you use them. There is no expiry date." },
      { q: "I can't afford tickets but I genuinely need support. What do I do?", a: "Simplifii has a hardship access programme. We will never turn away a student who needs help.\n\nEmail simplifii.contact@gmail.com with subject line: \"Access Support Request\"\n\nUse the email template below — only share what you feel comfortable sharing. We never require proof of hardship.", hasTemplate: true },
    ],
  },
  {
    title: 'Using the Tools',
    items: [
      { q: 'How do I use the Brief Simplifier?', a: "1. Click Brief Simplifier in the nav\n2. Upload your assessment brief as a PDF\n3. Watch it auto-detect your assessment details — subject, word count, due date, weighting\n4. Confirm or correct the due date\n5. Choose your analysis depth: Quick Scan, Deep Dive, or Expert Analysis\n6. Click Simplify Brief\n7. Get your complete week-by-week plan" },
      { q: 'How do I use the Assessment Scaffolder?', a: "1. Click Scaffolder in the nav\n2. Upload your brief and/or rubric (recommended but not required)\n3. Select your assessment type and word count\n4. Select your academic level\n5. Click Generate Scaffold\n6. Get your section-by-section writing blueprint with word counts, starter sentences, and Bloom's Taxonomy guidance" },
      { q: 'How do I use the Rubric Simplifier?', a: "1. Click Rubric Simplifier in the nav\n2. Upload your rubric PDF\n3. Click Simplify Rubric\n4. Get a plain language breakdown of exactly what earns every mark" },
      { q: 'How do I use the Essay Scorer?', a: "1. Click Essay Scorer in the nav\n2. Upload your rubric PDF\n3. Paste your essay draft into the text field\n4. Click Score Essay\n5. Get criterion-by-criterion feedback with an estimated grade band" },
      { q: 'How do I use the Humaniser?', a: "1. Click Humaniser in the nav\n2. Paste your writing into the text field\n3. Click Humanise\n4. Get your authentic voice restored\n5. See before/after AI detection risk scores" },
      { q: 'How do I use the Course Planner?', a: "1. Click Course Planner in the nav\n2. Upload up to 10 course documents (outlines, assessment schedules, unit guides — any format)\n3. Click Generate Plan\n4. Get your full semester timeline with all deadlines, week-by-week priorities, and scheduled classes" },
      { q: 'How do I use the Hidden Curriculum Decoder?', a: "1. Click Decoder in the nav\n2. Upload any academic document\n3. Click Decode\n4. Get the unwritten rules, hidden expectations, and what your marker actually wants but never says" },
      { q: 'How do I use the Concept Visualiser?', a: "1. Click Visualiser in the nav\n2. Type any concept you don't understand\n3. Click Visualise\n4. Get it explained simply, then accurately, using the Feynman Technique" },
      { q: 'How do I use the Executive Function Planner?', a: "1. Click Planner in the nav\n2. Enter your assessment tasks\n3. Click Generate Plan\n4. Get timed focus sessions with a built-in Pomodoro timer\n5. Use ADHD Sprint mode (15/3) if you need shorter bursts" },
      { q: 'What is Study Buddy?', a: "Study Buddy is your personal AI study coach inside Simplifii. Ask it anything uni-related — understanding your brief, study strategies, breaking down complex tasks, time management, citation help, or anything else you're stuck on.\n\nStudy Buddy unlocks when you purchase any ticket pack." },
      { q: 'Can I save my outputs?', a: "Yes. Every output is automatically saved to My Outputs in the nav bar. You can return to any previous output at any time without using extra tickets." },
      { q: 'Can I download my outputs as a PDF?', a: "Yes. Every tool has an Export PDF button at the top of the output. The PDF uses clear visual formatting designed for students with dyslexia and visual processing differences — teal section headers, clear spacing, proper page breaks." },
      { q: "The tools connected — what does the \"next step\" card mean?", a: "After every tool generates output, Simplifii suggests the most logical next tool based on what you just did. For example, after Brief Simplifier it suggests Rubric Simplifier. After Essay Scorer it suggests Humaniser (if you scored well) or Scaffolder (if you need to rebuild your structure).\n\nClick the button to go there — your assessment details carry across automatically so you don't have to re-enter anything." },
    ],
  },
  {
    title: 'Privacy and Safety',
    items: [
      { q: 'Is my document stored or shared?', a: "Your document content is never stored on our servers and never shared with other users. Only anonymised metadata is kept (assessment type, university, word count) to help us improve the tools. No student names, student IDs, or document content are ever retained." },
      { q: 'My mental health is really struggling right now.', a: "Simplifii is an academic tool and cannot provide mental health support. If you are struggling, please reach out:\n\n- Lifeline: 13 11 14 (24/7)\n- Beyond Blue: 1300 22 4636\n- Your university counselling service\n\nWe want you to succeed academically — but your wellbeing comes first. Always." },
    ],
  },
  {
    title: 'Technical Issues',
    items: [
      { q: 'The tool is loading but nothing happens.', a: "1. Refresh the page\n2. Clear your browser cache\n3. Try Chrome (works best)\n4. Check your internet connection\n5. Still not working? Email simplifii.contact@gmail.com" },
      { q: 'My output disappeared when I refreshed the page.', a: "Go to My Outputs in the nav bar — all outputs are automatically saved. Click any saved output to view the full result." },
      { q: 'I was charged tickets but got no output.', a: "This should not happen — if a tool fails, no tickets are deducted. If you believe you were incorrectly charged, email simplifii.contact@gmail.com with the date, time, and tool name. We will restore your tickets immediately." },
      { q: "Simplifii doesn't work well on my phone.", a: "Simplifii is optimised for desktop and tablet browsers. Mobile support is being improved. For best results use Chrome on a laptop or desktop." },
      { q: 'I have an idea to make Simplifii better.', a: "Click the Feedback button in the nav bar, or visit the Simplifii Lab card on your Dashboard. Your feedback is read personally by Aaron and directly shapes what gets built next.\n\nYou can also email simplifii.contact@gmail.com" },
    ],
  },
];

const HARDSHIP_TEMPLATE = `Subject: Access Support Request — [Your Name] — [Your University]

Hi Aaron,

My name is [Your Name] and I'm a [Year] student at [University], studying [Course/Degree].

I came across Simplifii and I think it would genuinely help me.
[Add one sentence about why — for example: "I have ADHD and struggle to decode assessment briefs" or "I'm a first-generation student and don't always understand what my lecturers expect."]

I'm currently experiencing financial difficulty and am unable to purchase credits.
[Optional: add any context you feel comfortable sharing — this is entirely up to you and never required.]

I would be really grateful for access support if it's possible.

Thank you for building something that actually gets it.

[Your Name]
[Your student email]`;

/* ─── Accordion Item ─── */
const AccordionItem = ({ item, isOpen, onToggle, onShowTemplate }) => (
  <div className="border-b border-white/[0.04]">
    <button onClick={onToggle} className="w-full flex items-center justify-between py-4 text-left group" data-testid={`faq-q-${item.q.substring(0, 30).replace(/[^a-zA-Z]/g, '-').toLowerCase()}`}>
      <span className="text-sm text-white font-medium pr-4 group-hover:text-emerald-400 transition-colors">{item.q}</span>
      {isOpen ? <ChevronUp size={16} className="text-zinc-500 flex-shrink-0" /> : <ChevronDown size={16} className="text-zinc-500 flex-shrink-0" />}
    </button>
    {isOpen && (
      <div className="pb-5 space-y-3">
        <p className="text-sm text-zinc-400 whitespace-pre-line leading-relaxed">{item.a}</p>
        {item.link && <Link to={item.link.to} className="text-sm text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1">{item.link.text} <ExternalLink size={12} /></Link>}
        {item.hasTemplate && (
          <button onClick={onShowTemplate} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-all mt-2" data-testid="hardship-template-btn">
            <Mail size={14} /> Get the email template
          </button>
        )}
      </div>
    )}
  </div>
);

/* ─── Hardship Template Modal ─── */
const HardshipModal = ({ open, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(HARDSHIP_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mailtoUrl = `mailto:simplifii.contact@gmail.com?subject=${encodeURIComponent('Access Support Request — [Your Name] — [Your University]')}&body=${encodeURIComponent(HARDSHIP_TEMPLATE.replace('Subject: Access Support Request — [Your Name] — [Your University]\n\n', ''))}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" data-testid="hardship-modal">
      <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#111] border-b border-white/5 p-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Hardship Access Email Template</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg">&times;</button>
        </div>
        <div className="p-5 space-y-4">
          <pre className="text-xs text-zinc-300 whitespace-pre-wrap bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 leading-relaxed">{HARDSHIP_TEMPLATE}</pre>
          <div className="flex gap-3">
            <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors" data-testid="copy-template-btn">
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy email</>}
            </button>
            <a href={mailtoUrl} className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.08] text-zinc-300 rounded-lg text-sm font-medium transition-colors" data-testid="open-mail-btn">
              <Mail size={14} /> Open in Mail
            </a>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">Your story is yours. Only share what you feel comfortable sharing. We will never judge or require proof of hardship. Every request is read personally by Aaron.</p>
        </div>
      </div>
    </div>
  );
};

/* ─── Main FAQ Component ─── */
const FAQ = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('about');
  const [openItems, setOpenItems] = useState({});
  const [search, setSearch] = useState('');
  const [showTemplate, setShowTemplate] = useState(false);

  const toggleItem = (key) => setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));

  const allItems = useMemo(() => {
    const items = [];
    TAB1_SECTIONS.forEach((s, si) => s.items.forEach((item, ii) => items.push({ ...item, tab: 'about', sectionTitle: s.title, key: `about-${si}-${ii}` })));
    TAB2_SECTIONS.forEach((s, si) => s.items.forEach((item, ii) => items.push({ ...item, tab: 'using', sectionTitle: s.title, key: `using-${si}-${ii}` })));
    return items;
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return allItems.filter(item => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q));
  }, [search, allItems]);

  const isSearching = search.trim().length > 0;

  const renderSection = (section, sectionIdx, tabPrefix) =>
    section.items.length > 0 && (
      <div key={`${tabPrefix}-${sectionIdx}`} className="mb-8">
        <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-4">{section.title}</h3>
        <div className="bg-[#111113] rounded-xl border border-white/[0.06] divide-y divide-white/[0.04] px-5">
          {section.items.map((item, ii) => {
            const key = `${tabPrefix}-${sectionIdx}-${ii}`;
            return <AccordionItem key={key} item={item} isOpen={openItems[key]} onToggle={() => toggleItem(key)} onShowTemplate={() => setShowTemplate(true)} />;
          })}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12" style={{ lineHeight: 1.8 }}>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3" style={{ fontFamily: 'Outfit' }} data-testid="faq-heading">Help Centre</h1>
        <p className="text-lg text-zinc-400 mb-8">Everything you need to know about Simplifii.</p>

        {/* Search */}
        <div className="relative mb-8" data-testid="faq-search">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for help..."
            className="w-full pl-11 pr-4 py-3.5 bg-[#111113] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 text-sm"
            data-testid="faq-search-input"
          />
        </div>

        {/* Search Results */}
        {isSearching ? (
          <div data-testid="faq-search-results">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-400 text-sm mb-2">No results for &lsquo;{search}&rsquo;</p>
                <p className="text-zinc-600 text-xs">Email <a href="mailto:simplifii.contact@gmail.com" className="text-emerald-400 hover:underline">simplifii.contact@gmail.com</a> and we'll help directly.</p>
              </div>
            ) : (
              <div className="bg-[#111113] rounded-xl border border-white/[0.06] divide-y divide-white/[0.04] px-5">
                {filtered.map(item => {
                  const needsAuth = item.tab === 'using' && !user;
                  return needsAuth ? (
                    <div key={item.key} className="py-4">
                      <p className="text-sm text-zinc-500 flex items-center gap-2"><Lock size={14} /> {item.q} <span className="text-xs text-zinc-600">— sign in to view</span></p>
                    </div>
                  ) : (
                    <AccordionItem key={item.key} item={item} isOpen={openItems[item.key]} onToggle={() => toggleItem(item.key)} onShowTemplate={() => setShowTemplate(true)} />
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl mb-8" data-testid="faq-tabs">
              <button onClick={() => setActiveTab('about')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'about' ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-zinc-300'}`} data-testid="faq-tab-about">
                About Simplifii
              </button>
              <button onClick={() => setActiveTab('using')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'using' ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-zinc-300'}`} data-testid="faq-tab-using">
                Using Simplifii
              </button>
            </div>

            {/* Tab 1 — About */}
            {activeTab === 'about' && TAB1_SECTIONS.map((s, i) => renderSection(s, i, 'about'))}

            {/* Tab 2 — Using (requires login) */}
            {activeTab === 'using' && (
              user ? (
                TAB2_SECTIONS.map((s, i) => renderSection(s, i, 'using'))
              ) : (
                <div className="text-center py-16 bg-[#111113] rounded-xl border border-white/[0.06]" data-testid="faq-login-prompt">
                  <Lock size={32} className="text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'Outfit' }}>Sign in to access the full help centre</h3>
                  <p className="text-sm text-zinc-500 mb-6">Tool guides, ticket info, and troubleshooting are available after signing in.</p>
                  <a href={`https://auth.emergentagent.com/?redirect=${encodeURIComponent(window.location.origin + '/auth/callback')}`} className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-black rounded-xl font-medium text-sm transition-colors" data-testid="faq-google-signin">
                    <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                    Continue with Google
                  </a>
                </div>
              )
            )}
          </>
        )}
      </div>
      <HardshipModal open={showTemplate} onClose={() => setShowTemplate(false)} />
    </div>
  );
};

export default FAQ;
