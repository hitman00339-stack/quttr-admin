'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  LogOut, Loader2, Scissors, MapPin, User, ScanLine, Zap,
  TrendingUp, Store, ArrowRight, Calendar, Eye, RefreshCw,
} from 'lucide-react';

export default function AgentDashboardPage() {
  const router = useRouter();
  const [agent, setAgent] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = async () => {
    try {
      const [meRes, statsRes] = await Promise.all([
        fetch('/api/marketing/auth/me'),
        fetch('/api/marketing/stats'),
      ]);
      const me = await meRes.json();
      const st = await statsRes.json();

      if (!me.success) {
        router.replace('/marketing/login');
        return;
      }
      setAgent(me.agent);
      if (st.success) setStats(st);
    } catch (e) {
      router.replace('/marketing/login');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/marketing/auth/logout', { method: 'POST' });
    toast.success('Logged out');
    router.replace('/marketing/login');
  };

  const refresh = () => {
    setRefreshing(true);
    loadAll();
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
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-black/70 backdrop-blur-xl sticky top-0 z-10">
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
          <div className="flex items-center gap-1">
            <button
              onClick={refresh}
              disabled={refreshing}
              className="p-2 hover:bg-white/[0.05] rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-white/60 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] px-3 py-2 rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome + agent info */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#E63946]/20 to-[#FFD700]/10 border border-[#FFD700]/20">
          <p className="text-xs text-[#FFD700] font-bold tracking-wider uppercase mb-1">Welcome back</p>
          <h1 className="text-2xl font-black">{agent.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-xs text-white/60 flex-wrap">
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

        {/* BIG SCAN BUTTON */}
        <Link
          href="/marketing/scan"
          className="qr-scan-btn group relative flex flex-col items-center justify-center py-8 rounded-2xl bg-gradient-to-br from-[#FFD700] via-[#FFC700] to-[#E6B800] text-black font-black shadow-[0_0_40px_rgba(255,215,0,0.4)] hover:shadow-[0_0_60px_rgba(255,215,0,0.6)] transition overflow-hidden"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <ScanLine className="w-14 h-14 mb-2 group-hover:scale-110 transition" strokeWidth={2.5} />
          <span className="text-2xl uppercase tracking-wider">Scan QR Code</span>
          <span className="text-xs font-semibold mt-1 opacity-70">Tap to open camera</span>
        </Link>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="QRs Activated"
            value={stats?.stats?.total_activations || 0}
            icon={Zap}
            color="from-emerald-500 to-emerald-700"
          />
          <StatCard
            label="Total Scans"
            value={stats?.stats?.total_scans || 0}
            icon={TrendingUp}
            color="from-[#E63946] to-[#B01824]"
          />
          <StatCard
            label="Last 7 Days"
            value={stats?.stats?.last_7_days_scans || 0}
            icon={Calendar}
            color="from-blue-500 to-blue-700"
          />
          <StatCard
            label="Towns Covered"
            value={stats?.stats?.unique_towns || 0}
            icon={MapPin}
            color="from-[#FFD700] to-[#B08900]"
            valueClass="text-black"
          />
        </div>

        {/* Top towns */}
        {stats?.top_towns?.length > 0 && (
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <h3 className="text-sm font-bold text-white/80 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FFD700]" />
              YOUR TOP TOWNS
            </h3>
            <div className="space-y-2">
              {stats.top_towns.map((t, i) => (
                <div key={t.town} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-white/5 text-xs font-black flex items-center justify-center text-[#FFD700]">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-semibold text-sm truncate">{t.town}</span>
                  <span className="text-xs text-white/50">
                    {t.count} QR{t.count > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent activations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white/80 flex items-center gap-2">
              <Store className="w-4 h-4 text-[#FFD700]" />
              RECENT ACTIVATIONS
            </h3>
            <span className="text-xs text-white/40">
              {stats?.activations?.length || 0} total
            </span>
          </div>

          {!stats?.activations?.length ? (
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center">
              <Store className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/50">No activations yet.</p>
              <p className="text-xs text-white/40 mt-1">
                Tap &quot;Scan QR&quot; above to activate your first one!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.activations.slice(0, 10).map((a) => (
                <div
                  key={a._id}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E63946]/30 to-[#B01824]/30 flex items-center justify-center flex-shrink-0 border border-[#FFD700]/20">
                    <Store className="w-4 h-4 text-[#FFD700]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {a.shop_name || a.qr_code}
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      {a.town || 'No town'}
                      {a.city && a.town !== a.city && ` · ${a.city}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-[#FFD700]">{a.scan_count}</p>
                    <p className="text-[10px] text-white/40 uppercase">scans</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, valueClass = 'text-white' }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-2`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold">{label}</p>
      <p className={`text-2xl font-black mt-1 ${valueClass}`}>{value.toLocaleString('en-IN')}</p>
    </div>
  );
}
