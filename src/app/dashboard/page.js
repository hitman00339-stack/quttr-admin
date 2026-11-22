'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Users, Store, Calendar,
  DollarSign, Activity, ArrowUpRight, Clock, CheckCircle2,
  Sparkles, ArrowRight, PhoneCall, Loader2, AlertCircle,
  Radio, Volume2, ShieldCheck,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const handleBroadcastAiCall = async () => {
    setIsBroadcasting(true);
    try {
      const res = await api.post('/admin/broadcast-ai-call');
      setShowBroadcastModal(false);
      setToastMessage({
        type: 'success',
        text: res.data?.message || 'Broadcast AI call campaign initiated successfully!',
      });
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to trigger broadcast call',
      });
    } finally {
      setIsBroadcasting(false);
      setTimeout(() => setToastMessage(null), 8000);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/dashboard/stats');
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.users?.total || 0,
      change: `+${stats?.users?.todayNew || 0} today`,
      icon: Users,
      color: 'from-blue-500 to-blue-700',
      positive: true,
    },
    {
      label: 'Total Shops',
      value: stats?.shops?.total || 0,
      change: `${stats?.shops?.pending || 0} pending`,
      icon: Store,
      color: 'from-purple-500 to-purple-700',
      positive: (stats?.shops?.pending || 0) === 0,
    },
    {
      label: 'Today Bookings',
      value: stats?.bookings?.today || 0,
      change: `${stats?.bookings?.active || 0} active now`,
      icon: Calendar,
      color: 'from-emerald-500 to-emerald-700',
      positive: true,
    },
    {
      label: 'Revenue Today',
      value: `₹${(stats?.revenue?.today || 0).toLocaleString('en-IN')}`,
      change: `₹${(stats?.revenue?.total || 0).toLocaleString('en-IN')} total`,
      icon: DollarSign,
      color: 'from-amber-500 to-amber-700',
      positive: true,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-2xs uppercase tracking-widest text-emerald-400 font-semibold">
              Live · Updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h1 className="text-display text-white font-bold">
            Good {getGreeting()}, <span className="text-gradient">Niransh</span>
          </h1>
          <p className="text-body text-white/60 mt-1">Here's what's happening with QUTTR today.</p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3">
          <button
            id="btn-ai-call-all-barbers"
            type="button"
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer border border-amber-300/40"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black"></span>
            </span>
            <PhoneCall className="w-4 h-4 text-black stroke-[2.5]" />
            <span>📞 AI Call All Barbers</span>
          </button>
          <button className="btn-outline">
            <Sparkles className="w-4 h-4" />
            What's new
          </button>
        </div>
      </div>

      {/* ── Featured Broadcast Banner ────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-surface-200/90 to-amber-500/5 p-5 shadow-xl backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/10">
              <PhoneCall className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
                  VOICE BROADCAST SYSTEM
                </span>
                <span className="text-2xs font-mono font-semibold text-white/50">
                  Caller ID: <strong className="text-amber-300">+91 94294 92250</strong>
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-1">Broadcast Launch Announcement to All Barbers</h2>
              <p className="text-xs text-white/60 mt-0.5">
                Riya will place automated calls to every active barber with the official announcement and prompt app update.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowBroadcastModal(true)}
            className="flex-shrink-0 flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-black stroke-[2.5]" />
            Launch Announcement Campaign
          </button>
        </div>
      </div>

      {/* ── Toast Alert ────────────────────────────────────────────── */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs text-white/40 hover:text-white px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Stats Grid (or Skeleton while loading) ────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <div
              key={stat.label}
              className="stat-card animate-in"
              style={{ animationDelay: `${i * 75}ms` }}
            >
              <div
                className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-[0.08] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`}
              />

              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 flex items-center justify-center`}
                >
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
              </div>

              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
              <p
                className={`text-xs font-medium mt-2 flex items-center gap-1 ${
                  stat.positive ? 'text-success' : 'text-warning'
                }`}
              >
                {stat.positive ? <TrendingUp className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {stat.change}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Chart + Quick Actions ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-title">Bookings Trend</h3>
              <p className="text-caption mt-1">Last 7 days activity</p>
            </div>
            <div className="chip-neutral">
              <Activity className="w-3 h-3" />
              Live
            </div>
          </div>

          <div className="h-64">
            {loading ? (
              <div className="w-full h-full skeleton rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.chart?.last7Days || []}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFD700" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="rgba(255,255,255,0.4)"
                    style={{ fontSize: '11px' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#141417',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke="#FFD700"
                    strokeWidth={2}
                    fill="url(#colorBookings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-title mb-1">Quick Actions</h3>
            <p className="text-caption mb-4">Common admin tasks</p>

            <div className="space-y-2">
              {/* Highlighted Broadcast Action */}
              <button
                type="button"
                onClick={() => setShowBroadcastModal(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-all group text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <PhoneCall className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      📞 AI Call All Barbers
                    </span>
                    <p className="text-2xs text-white/50">Launch voice broadcast</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              {[
                { label: 'Approve Shops', count: stats?.shops?.pending || 0, href: '/dashboard/shops/pending' },
                { label: 'Booking Calls', count: null, href: '/dashboard/booking-calling' },
                { label: 'Send Notice', count: null, href: '/dashboard/notices' },
                { label: 'View Bookings', count: stats?.bookings?.active || 0, href: '/dashboard/bookings' },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.1] transition-all group"
                >
                  <span className="text-xs font-medium text-white/90">{action.label}</span>
                  <div className="flex items-center gap-2">
                    {action.count !== null && action.count > 0 && (
                      <span className="chip-accent text-2xs">{action.count}</span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="card p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-accent-500/10" />
            <div className="relative">
              <CheckCircle2 className="w-6 h-6 text-success mb-3" />
              <p className="text-sm font-medium">All systems operational</p>
              <p className="text-caption mt-1">Backend, FCM, and Socket connected</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Broadcast AI Voice Call Confirmation Modal ─────────────── */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 space-y-5 border border-amber-500/30 animate-in shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Broadcast AI Voice Call</h3>
                <p className="text-xs text-white/50">Calling campaign to all registered barbers</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white/80 space-y-2.5">
              <p className="font-bold text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Campaign Specifications:
              </p>
              <p>• Riya will place outbound calls to all active barbers sequentially with a 2-second interval.</p>
              <p>
                • Official Caller ID: <span className="font-mono text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded">+91 94294 92250</span>
              </p>
              <div className="p-2.5 rounded-lg bg-surface-300/60 border border-white/[0.04]">
                <p className="italic text-white/70 text-2xs leading-relaxed">
                  "Namaste! Main QUTTR ki AI assistant hoon. QUTTR ne naya AI booking system launch kiya hai. Ab aapko booking calls is naye number se aayengi: 94294 92250. Kripya is number ko save karein aur apna QUTTR Business App turant Play Store se update karein. Customers ko app se booking karne ke liye encourage karein. Dhanyawad!"
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                disabled={isBroadcasting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBroadcastAiCall}
                disabled={isBroadcasting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                {isBroadcasting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Initiating Campaign...
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-3.5 h-3.5 stroke-[2.5]" />
                    Confirm & Start Calls
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
