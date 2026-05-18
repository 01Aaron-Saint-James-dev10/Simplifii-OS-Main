import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brain, BookOpen, CheckCircle2, Sparkles, ArrowRight, FileText, Shield, Compass, Calendar, Zap, Lock, Lightbulb, Eye, EyeOff } from 'lucide-react';
import VideoShowcase from '../components/VideoShowcase';

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  // If already logged in, go to dashboard
  if (user) { navigate('/dashboard'); return null; }

  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/auth-callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        navigate('/dashboard');
      } else {
        if (!name.trim()) { setError('Please enter your name'); setLoading(false); return; }
        await register(email, password, name);
        navigate('/onboarding');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const tools = [
    { name: 'Brief Simplifier', desc: 'Visual week-by-week action plans', icon: FileText },
    { name: 'Rubric Simplifier', desc: 'Point-based checkable criteria', icon: BookOpen },
    { name: 'Essay Scorer', desc: 'Formative feedback & estimates', icon: CheckCircle2 },
    { name: 'Humaniser', desc: 'Natural-sounding rewrites', icon: Sparkles },
    { name: 'Assessment Scaffolder', desc: 'Structure & word allocation', icon: Shield },
    { name: 'Course Planner', desc: 'Unified semester calendar', icon: Calendar },
    { name: 'Hidden Curriculum Decoder', desc: 'Decode academic expectations', icon: Compass },
    { name: 'Executive Function Planner', desc: 'Pomodoro & cognitive load', icon: Zap },
    { name: 'Concept Visualiser', desc: 'Visual explanations & quizzes', icon: Brain },
  ];

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Nav */}
      <nav className="border-b border-white/[0.04] bg-[#09090B]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="text-2xl font-bold text-gradient" style={{ fontFamily: 'Outfit' }}>Simplifii<span className="text-xs text-emerald-400 font-normal ml-0.5">-β</span></span>
          <a href="#login" className="text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg transition-all">
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero + Login Side by Side */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-40" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Hero content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] mb-6 text-sm text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Neuroinclusive by design
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 tracking-tight leading-[1.1]" style={{ fontFamily: 'Outfit' }} data-testid="hero-heading">
                <span className="text-white">Built for complex briefs.</span>
                <br />
                <span className="text-gradient">Not complex brains.</span>
              </h1>

              <p className="text-base text-zinc-400 mb-6 leading-relaxed max-w-lg">
                Designed for neurodivergent students &mdash; and built for every student who's ever stared at a brief and not known where to start.
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/[0.06] border border-emerald-500/15 mb-6">
                <span className="text-sm text-emerald-400 font-medium italic">From surviving to thriving.</span>
              </div>

              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> 5 Welcome Tickets on signup</div>
                <div className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> 9 AI-powered tools</div>
              </div>
            </div>

            {/* Right: Login form */}
            <div id="login" className="scroll-mt-24">
              <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-8" data-testid="auth-form">
                <div className="flex gap-1 mb-6 p-1 bg-[#09090B] rounded-xl border border-white/[0.04]">
                  <button data-testid="login-tab" onClick={() => setIsLogin(true)} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 min-h-[40px] ${isLogin ? 'bg-[#18181B] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    Login
                  </button>
                  <button data-testid="signup-tab" onClick={() => setIsLogin(false)} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 min-h-[40px] ${!isLogin ? 'bg-[#18181B] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    Sign Up
                  </button>
                </div>

                <button data-testid="google-login-btn" onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-white/[0.08] rounded-xl hover:bg-white/[0.03] transition-all duration-200 mb-6 min-h-[48px] text-zinc-300">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm font-medium">Continue with Google</span>
                </button>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]"></div></div>
                  <div className="relative flex justify-center text-xs"><span className="px-4 bg-[#111113] text-zinc-600">Or continue with email</span></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-2">Name</label>
                      <input data-testid="name-input" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 transition-all min-h-[48px] text-sm" placeholder="Your name" required={!isLogin} />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">Email</label>
                    <input data-testid="email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 transition-all min-h-[48px] text-sm" placeholder="you@example.com" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2">Password</label>
                    <div className="relative">
                      <input data-testid="password-input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 transition-all min-h-[48px] pr-12 text-sm" placeholder="••••••••" required minLength={6} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400" data-testid="toggle-password">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  {error && <div data-testid="error-message" className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
                  <button data-testid="submit-btn" type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3 px-6 rounded-xl transition-all min-h-[48px] disabled:opacity-50 text-sm">
                    {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Sign Up')}
                  </button>
                </form>

                <p className="text-center mt-4 text-sm text-zinc-600">
                  {isLogin ? "New to Simplifii?" : "Already have an account?"}{' '}
                  <button onClick={() => setIsLogin(!isLogin)} className="text-emerald-400 hover:text-emerald-300 font-medium">
                    {isLogin ? 'Sign up' : 'Log in'}
                  </button>
                </p>
                <p className="text-center mt-3 text-xs text-zinc-700">
                  <Link to="/faq" className="hover:text-zinc-500 transition-colors" data-testid="landing-faq-link">FAQ</Link>
                  <span className="mx-2">&middot;</span>
                  <Link to="/about" className="hover:text-zinc-500 transition-colors">About</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Showcase */}
      <VideoShowcase />

      {/* 8 Tools Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Outfit' }}>9 powerful tools. One mission.</h2>
          <p className="text-zinc-400 text-base">Everything you need to conquer university assessments — made accessible.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <div key={i} className="group p-6 rounded-2xl bg-[#111113] border border-white/[0.06] hover:border-emerald-500/20 transition-all duration-300" data-testid={`tool-card-${i}`}>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                  <Icon size={20} className="text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1" style={{ fontFamily: 'Outfit' }}>{tool.name}</h3>
                <p className="text-xs text-zinc-500">{tool.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* How It Works */}
      <div className="border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16" style={{ fontFamily: 'Outfit' }}>How it works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '1', title: 'Upload Your Brief', description: 'Upload up to 10 PDF files — assessment brief, rubric, and course outline.' },
              { step: '2', title: 'Choose Your Depth', description: 'Pick Quick Scan, Deep Dive, or Expert Analysis. Get a visual week-by-week plan.' },
              { step: '3', title: 'Track & Celebrate', description: 'Check off tasks, earn celebrations, and go from surviving to thriving.' }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-emerald-500 text-black rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>{item.step}</div>
                <h3 className="text-lg font-semibold text-white mb-3" style={{ fontFamily: 'Outfit' }}>{item.title}</h3>
                <p className="text-zinc-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust & Privacy */}
      <div className="border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 rounded-2xl bg-[#111113] border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-4"><Lock size={20} className="text-emerald-400" /><h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Outfit' }}>Your Data Stays Yours</h3></div>
              <p className="text-sm text-zinc-400 leading-relaxed">Your documents, plans, and progress are never shared with anyone. Everything stays within your own profile, encrypted and private. We don't sell data. Ever.</p>
            </div>
            <div className="p-8 rounded-2xl bg-[#111113] border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-4"><Lightbulb size={20} className="text-amber-400" /><h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Outfit' }}>AI-Enhanced Accessibility</h3></div>
              <p className="text-sm text-zinc-400 leading-relaxed">Simplifii uses AI to make academic content more accessible. All outputs are AI-generated simplifications — always verify with your unit coordinator. AI assists, you decide.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <p className="text-zinc-600 text-sm">&copy; 2026 Simplifii-&beta;. From surviving to thriving.</p>
          <div className="flex items-center justify-center gap-4">
            <a href="/privacy" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">Privacy Policy</a>
            <span className="text-zinc-800">&middot;</span>
            <a href="/terms" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">Terms of Service</a>
          </div>
          <p className="text-zinc-700 text-xs max-w-lg mx-auto">
            AI Disclaimer: Simplifii uses artificial intelligence to make academic content more accessible. Outputs are AI-generated and should be used as a guide — always verify with your institution. Your information is never shared.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
