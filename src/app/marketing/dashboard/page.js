'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { LogOut, Loader2, Scissors, MapPin, User } from 'lucide-react';

export default function AgentDashboardPage() {
  const router = useRouter();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/marketing/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setAgent(data.agent);
        else router.replace('/marketing/login');
      })
      .catch(() => router.replace('/marketing/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/marketing/auth/logout', { method: 'POST' });
    toast.success('Logged out');
    router.replace('/marketing/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
      </div>
    );
  }

  if (!agent) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-black/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E63946] to-[#B01824] flex items-center justify-center">
              <Scissors className="w-4 h-4 text-[#FFD700]" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-black leading-none">Quttr<span className="text-[#FFD700]">.</span></p>
              <p className="text-[10px] text-[#FFD700] font-bold tracking-wider">MARKETING</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] px-3 py-2 rounded-lg transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#E63946]/20 to-[#FFD700]/10 border border-[#FFD700]/20">
          <p className="text-xs text-[#FFD700] font-bold tracking-wider uppercase mb-1">Welcome back</p>
          <h1 className="text-2xl font-black">{agent.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-xs text-white/60">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {agent.phone}
            </span>
            {agent.city_assigned && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {agent.city_assigned}
              </span>
            )}
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <p className="text-xs text-white/50">QRs Activated</p>
            <p className="text-3xl font-black text-white mt-1">{agent.total_activations || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <p className="text-xs text-white/50">Total Scans</p>
            <p className="text-3xl font-black text-[#FFD700] mt-1">{agent.total_scans_generated || 0}</p>
          </div>
        </div>

        {/* Phase 2 preview */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-dashed border-white/20 text-center">
          <p className="text-sm text-white/60">
            📷 <b>Scan QR</b> button coming in Phase 2
          </p>
          <p className="text-xs text-white/40 mt-2">
            You&apos;ll be able to open camera, scan any Quttr QR, and activate it instantly.
          </p>
        </div>
      </main>
    </div>
  );
}
