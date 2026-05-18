import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

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
        if (!name.trim()) {
          setError('Please enter your name');
          setLoading(false);
          return;
        }
        await register(email, password, name);
        navigate('/onboarding');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090B] p-4 relative">
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.03] blur-[100px]" />
      
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link to="/">
            <h1 className="text-4xl font-bold text-gradient mb-3" style={{ fontFamily: 'Outfit' }}>
              Simplifii
            </h1>
          </Link>
          <p className="text-zinc-500 text-sm">Built for complex briefs. Not complex brains.</p>
        </div>

        <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-8">
          <div className="flex gap-1 mb-6 p-1 bg-[#09090B] rounded-xl border border-white/[0.04]">
            <button
              data-testid="login-tab"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 min-h-[40px] ${
                isLogin ? 'bg-[#18181B] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Login
            </button>
            <button
              data-testid="signup-tab"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 min-h-[40px] ${
                !isLogin ? 'bg-[#18181B] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          <button
            data-testid="google-login-btn"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-white/[0.08] rounded-xl hover:bg-white/[0.03] transition-all duration-200 mb-6 min-h-[48px] text-zinc-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium">Continue with Google</span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-[#111113] text-zinc-600">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Name</label>
                <input
                  data-testid="name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-200 min-h-[48px] text-sm"
                  placeholder="Your name"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Email</label>
              <input
                data-testid="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-200 min-h-[48px] text-sm"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Password</label>
              <div className="relative">
                <input
                  data-testid="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-200 min-h-[48px] pr-12 text-sm"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                  data-testid="toggle-password"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div data-testid="error-message" className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              data-testid="submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-3 px-6 rounded-xl transition-all duration-200 min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Sign Up')}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-zinc-600">
          {isLogin ? "New to Simplifii?" : "Already have an account?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-emerald-400 hover:text-emerald-300 font-medium"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
        <p className="text-center mt-4 text-xs text-zinc-700">
          <Link to="/faq" className="hover:text-zinc-500 transition-colors" data-testid="login-faq-link">FAQ</Link>
          <span className="mx-2">&middot;</span>
          <Link to="/about" className="hover:text-zinc-500 transition-colors">About</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
