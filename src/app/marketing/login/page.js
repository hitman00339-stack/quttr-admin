'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, LogIn, Eye, EyeOff, Scissors } from 'lucide-react';

export default function AgentLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error('Please enter phone/email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/marketing/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Welcome, ${data.agent.name}!`);
        router.push('/marketing/dashboard');
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#E63946]/[0.15] rounded-full blur-[130px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#FFD700]/[0.08] rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-[#E63946] to-[#B01824] flex items-center justify-center border-2 border-[#FFD700]/40 shadow-[0_0_40px_rgba(230,57,70,0.5)]">
            <Scissors className="w-9 h-9 text-[#FFD700]" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-white">
            Quttr<span className="text-[#FFD700]">.</span>
          </h1>
          <p className="text-sm text-[#FFD700] font-bold mt-1 tracking-wider">
            MARKETING PORTAL
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white mb-1">Agent Login</h2>
          <p className="text-sm text-white/50 mb-6">
            Sign in to activate QR codes
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wider">
                Phone or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="9876543210 or you@quttrr.com"
                autoComplete="username"
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#FFD700]/50 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-[#FFD700]/50 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#E63946] to-[#B01824] text-white font-bold text-base flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(230,57,70,0.5)] transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-white/40 text-center mt-6">
            Contact your admin if you forgot your password
          </p>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          © 2025 Quttr Marketing · Authorized personnel only
        </p>
      </div>
    </div>
  );
}
