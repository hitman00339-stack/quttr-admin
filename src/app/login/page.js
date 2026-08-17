'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Shield, Phone, Lock, ArrowRight, Loader2,
  ShieldCheck, KeyRound, ChevronLeft, Eye, EyeOff,
  Sparkles, Command,
} from 'lucide-react';
import { authService } from '../../services/auth';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [devOTP, setDevOTP] = useState(null);

  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    if (authService.isAuthenticated()) router.push('/dashboard');
  }, [router]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (step === 2 && otpRefs[0].current) {
      setTimeout(() => otpRefs[0].current?.focus(), 300);
    }
  }, [step]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) return toast.error('Enter valid 10-digit number');

    setLoading(true);
    const result = await authService.sendOTP(cleanPhone);
    setLoading(false);

    if (result.success) {
      toast.success('OTP sent successfully');
      setStep(2);
      setResendTimer(60);
      setDevOTP(result.devOTP);
    } else {
      toast.error(result.message);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 3) otpRefs[index + 1].current?.focus();
    if (index === 3 && value && newOtp.every((d) => d)) handleVerifyOTP(newOtp.join(''));
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs[index - 1].current?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setOtp(pasted.split(''));
      handleVerifyOTP(pasted);
    }
  };

  const handleVerifyOTP = async (otpCode) => {
    const code = otpCode || otp.join('');
    if (code.length !== 4) return toast.error('Enter complete OTP');

    setLoading(true);
    const result = await authService.verifyOTP(phone, code);
    setLoading(false);

    if (result.success) {
      toast.success('OTP verified');
      setStep(3);
    } else {
      toast.error(result.message);
      setOtp(['', '', '', '']);
      otpRefs[0].current?.focus();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) return toast.error('Enter your password');

    setLoading(true);
    const result = await authService.login(phone, password);
    setLoading(false);

    if (result.success) {
      toast.success(`Welcome, ${result.admin.name}`);
      setTimeout(() => router.push('/dashboard'), 400);
    } else {
      toast.error(result.message);
      setPassword('');
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    const result = await authService.sendOTP(phone);
    setLoading(false);
    if (result.success) {
      toast.success('New OTP sent');
      setResendTimer(60);
      setOtp(['', '', '', '']);
      setDevOTP(result.devOTP);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 relative overflow-hidden flex items-center justify-center p-6">
      {/* Background effects */}
      <div className="fixed inset-0 mesh-bg pointer-events-none" />
      <div className="fixed inset-0 grid-bg pointer-events-none opacity-40" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent-500/[0.03] rounded-full blur-3xl" />

      {/* Grid pattern */}
      <div className="absolute inset-0 noise pointer-events-none" />

      {/* Main content */}
      <div className="w-full max-w-[420px] relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-accent-500/20 rounded-2xl blur-2xl animate-glow" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 border border-white/10 flex items-center justify-center shadow-elevation-3">
              <Sparkles className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            QUTTR<span className="text-accent-500 font-mono">·</span>Admin
          </h1>
          <p className="text-caption mt-1">Manage your barbershop empire</p>
        </div>

        {/* Card */}
        <div className="card p-8 backdrop-blur-2xl">
          {/* Progress */}
          <div className="flex items-center justify-center gap-1.5 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-500 ${
                  step > s ? 'w-8 bg-accent-500'
                    : step === s ? 'w-8 bg-white'
                    : 'w-4 bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Back button */}
          {step > 1 && (
            <button
              onClick={() => step === 2 ? (setStep(1), setOtp(['', '', '', ''])) : (setStep(2), setPassword(''))}
              className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 transition-colors group"
              disabled={loading}
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back
            </button>
          )}

          {/* STEP 1: Phone */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="animate-fade-in">
              <div className="mb-6">
                <h2 className="text-heading mb-1">Welcome back</h2>
                <p className="text-caption">Enter your registered admin number</p>
              </div>

              <div className="mb-6">
                <label className="label">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <span className="text-white/40 font-medium text-sm">+91</span>
                    <div className="w-px h-5 bg-white/10 ml-3" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9580133593"
                    className="input pl-16 text-base font-medium tracking-wide"
                    maxLength={10}
                    autoFocus
                    disabled={loading}
                  />
                </div>
                <p className="label-hint">Only whitelisted admin numbers can access</p>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="btn-primary w-full h-12 text-base"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : (
                  <>Continue <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h2 className="text-heading mb-1">Verify OTP</h2>
                <p className="text-caption">
                  Sent to <span className="text-white/80 font-medium">+91 {phone}</span>
                </p>
              </div>

              {devOTP && (
                <div className="mb-6 p-3 rounded-xl bg-accent-500/[0.08] border border-accent-500/20">
                  <p className="text-xs text-accent-400 flex items-center gap-2">
                    <Command className="w-3.5 h-3.5" />
                    Dev OTP: <span className="font-mono font-bold tracking-widest ml-1">{devOTP}</span>
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-between mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={otpRefs[index]}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    disabled={loading}
                    className="w-full h-14 text-center text-xl font-bold bg-surface-300/50 border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-accent-500/50 focus:bg-surface-300/80 focus:ring-4 focus:ring-accent-500/10 transition-all"
                    maxLength={1}
                  />
                ))}
              </div>

              <button
                onClick={() => handleVerifyOTP()}
                disabled={loading || otp.some((d) => !d)}
                className="btn-primary w-full h-12 text-base"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                ) : (
                  <>Verify <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <div className="text-center mt-4">
                {resendTimer > 0 ? (
                  <p className="text-caption">
                    Resend in <span className="text-accent-500 font-medium">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Password */}
          {step === 3 && (
            <form onSubmit={handleLogin} className="animate-fade-in">
              <div className="mb-6">
                <h2 className="text-heading mb-1">Enter password</h2>
                <p className="text-caption">Final step to access dashboard</p>
              </div>

              <div className="mb-6">
                <label className="label">Admin Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input pr-12"
                    autoFocus
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-white/40 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="btn-primary w-full h-12 text-base"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                ) : (
                  <>Sign in to Dashboard <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <div className="mt-6 flex items-center gap-2 text-2xs text-white/40">
                <Shield className="w-3 h-3" />
                <span>Session expires in 24 hours</span>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-2xs text-white/30 tracking-wide">
            © 2026 QUTTR · Protected by 3-step verification
          </p>
        </div>
      </div>
    </div>
  );
}
