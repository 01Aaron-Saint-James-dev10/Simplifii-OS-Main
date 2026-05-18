import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, LogOut, Menu, X, Clock, User, Settings, Gift, Bookmark, ChevronDown, HelpCircle } from 'lucide-react';
import HelpTooltip from './HelpTooltip';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Brief Simplifier', path: '/brief-simplifier' },
    { name: 'Course Planner', path: '/course-planner' },
    { name: 'Rubric Simplifier', path: '/rubric-simplifier' },
    { name: 'Essay Scorer', path: '/essay-scorer' },
    { name: 'Humaniser', path: '/humaniser' },
    { name: 'Scaffolder', path: '/assessment-scaffolder' },
    { name: 'Decoder', path: '/hidden-curriculum' },
    { name: 'Visualiser', path: '/concept-visualiser' },
    { name: 'Planner', path: '/executive-planner' },
    { name: 'My Outputs', path: '/saved-outputs' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#09090B]/80 backdrop-blur-xl" data-testid="main-navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2" data-testid="nav-logo">
              <span className="text-2xl font-bold text-gradient" style={{ fontFamily: 'Outfit' }}>
                Simplifii<span className="text-xs text-emerald-400 font-normal ml-0.5">-β</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  data-testid={`nav-${link.name.toLowerCase().replace(/\s/g, '-')}`}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[36px] flex items-center ${
                    isActive(link.path)
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && user.is_owner && (
              <>
                <span className="flex items-center gap-1 px-2 py-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full" data-testid="owner-badge">Owner</span>
                <Link to="/feedback-dashboard" data-testid="admin-feedback-link" className="flex items-center gap-1 px-2 py-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full hover:bg-emerald-500/15 transition-all">Feedback</Link>
              </>
            )}
            {user && (
              <Link
                to="/credits"
                data-testid="credit-balance"
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full hover:bg-emerald-500/15 transition-all duration-200"
              >
                <span className="text-base leading-none">&#127915;</span>
                <span className="text-sm font-semibold text-emerald-400">{user.is_owner ? '\u221E' : user.credits}</span>
                <HelpTooltip text={"Tickets are used to run tools.\nYou get 5 free on signup.\nTickets never expire.\nGet more on the Credits page."} />
              </Link>
            )}

            <div className="hidden md:flex items-center gap-3">
              {user && (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    data-testid="profile-dropdown-trigger"
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-all"
                  >
                    {user.picture ? (
                      <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full ring-1 ring-white/10" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-zinc-300 max-w-[120px] truncate">{user.name}</span>
                    <ChevronDown size={14} className={`text-zinc-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-[#111113] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50" data-testid="profile-dropdown-menu">
                      <div className="px-4 py-3 border-b border-white/[0.06]">
                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <div className="px-4 py-2.5 flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Tickets</span>
                          <span className="text-sm font-semibold text-emerald-400">{user.is_owner ? '\u221E' : user.credits}</span>
                        </div>
                        <Link to="/saved-outputs" onClick={() => setProfileOpen(false)} data-testid="profile-saved-outputs" className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:bg-white/[0.04] hover:text-white transition-all">
                          <Bookmark size={15} /> Saved Outputs
                        </Link>
                        <Link to="/settings" onClick={() => setProfileOpen(false)} data-testid="profile-settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:bg-white/[0.04] hover:text-white transition-all">
                          <Settings size={15} /> Account Settings
                        </Link>
                        <Link to="/about" onClick={() => setProfileOpen(false)} data-testid="profile-about" className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:bg-white/[0.04] hover:text-white transition-all">
                          <User size={15} /> About Simplifii
                        </Link>
                        <Link to="/faq" onClick={() => setProfileOpen(false)} data-testid="profile-help" className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:bg-white/[0.04] hover:text-white transition-all">
                          <HelpCircle size={15} /> Help Centre
                        </Link>
                        <Link to="/credits" onClick={() => setProfileOpen(false)} data-testid="profile-credits" className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:bg-white/[0.04] hover:text-white transition-all">
                          <CreditCard size={15} /> Buy Tickets
                        </Link>
                        <div className="px-4 py-2.5 flex items-center gap-3 text-sm text-zinc-400 cursor-pointer hover:bg-white/[0.04] transition-all" data-testid="profile-referral" onClick={() => { if (user.referralCode) { navigator.clipboard.writeText(user.referralCode); } }}>
                          <Gift size={15} /> {user.referralCode ? <span className="font-mono text-xs text-emerald-400">{user.referralCode}</span> : 'Referral Code'} <span className="text-[10px] ml-auto bg-white/[0.04] px-2 py-0.5 rounded-full text-zinc-500">{user.referralCode ? 'Click to copy' : 'Coming Soon'}</span>
                        </div>
                      </div>
                      <div className="border-t border-white/[0.06] py-1">
                        <button
                          onClick={() => { setProfileOpen(false); handleLogout(); }}
                          data-testid="logout-btn"
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/5 transition-all"
                        >
                          <LogOut size={15} /> Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-zinc-400 hover:text-zinc-100 min-h-[44px] min-w-[44px]"
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/[0.06] bg-[#0A0A0B]">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg font-medium transition-all duration-200 min-h-[44px] ${
                  isActive(link.path)
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-zinc-400 hover:bg-white/[0.04]'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/credits"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-zinc-400 hover:bg-white/[0.04] font-medium min-h-[44px]"
            >
              Tickets
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-zinc-400 hover:bg-white/[0.04] font-medium min-h-[44px]"
            >
              About
            </Link>
            <Link
              to="/faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-zinc-400 hover:bg-white/[0.04] font-medium min-h-[44px]"
              data-testid="mobile-help-link"
            >
              Help
            </Link>
            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg text-zinc-400 hover:bg-white/[0.04] font-medium min-h-[44px]"
            >
              Settings
            </Link>
            <button
              onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              className="w-full text-left px-4 py-3 rounded-lg text-zinc-400 hover:bg-white/[0.04] font-medium min-h-[44px]"
            >
              Logout
            </button>
            <div className="mt-3 pt-3 border-t border-white/[0.04] px-4">
              <p className="text-[10px] text-zinc-700 leading-relaxed">AI-enhanced accessibility tool. Outputs are AI-generated — always verify with your institution. Your data is never shared.</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
