'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Users, Store, Calendar,
  DollarSign, Activity, ArrowUpRight, Clock, CheckCircle2,
  Sparkles, ArrowRight, PhoneCall, Loader2, AlertCircle,
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
      setTimeout(() => setToastMessage(null), 6000);
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="skeleton h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-32" />)}
        </div>
      </div>
    );
  }

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
    <div className="max-w-7xl mx-auto space-y-8 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-2xs uppercase tracking-widest text-success font-semibold">
              Live · Updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h1 className="text-display">
            Good {getGreeting()}, <span className="text-gradient">Niransh</span>
          </h1>
          <p className="text-body mt-2">Here's what's happening with QUTTR today.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <PhoneCall className="w-4 h-4 text-black" />
            📞 AI Call All Barbers
          </button>
          <button className="btn-outline">
            <Sparkles className="w-4 h-4" />
            What's new
          </button>
        </div>
      </div>

      {/* Toast Alert */}
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
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs text-white/40 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div
            key={stat.label}
            className="stat-card animate-in"
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-[0.08] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />

            <div className="flex items-center justify-between mb-4">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
            </div>

            <p className="stat-label">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
            <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${stat.positive ? 'text-success' : 'text-warning'}`}>
              {stat.positive ? <TrendingUp className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Chart + Sidebar */}
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
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-title mb-1">Quick Actions</h3>
            <p className="text-caption mb-4">Common admin tasks</p>

            <div className="space-y-2">
              {[
                { label: 'Approve Shops', count: stats?.shops?.pending || 0, href: '/dashboard/shops/pending' },
                { label: 'Send Notice', count: null, href: '/dashboard/notices' },
                { label: 'View Bookings', count: stats?.bookings?.active || 0, href: '/dashboard/bookings' },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.1] transition-all group"
                >
                  <span className="text-sm font-medium">{action.label}</span>
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

      {/* Broadcast AI Voice Call Confirmation Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 space-y-5 border border-amber-500/30 animate-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <PhoneCall className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Broadcast AI Voice Call</h3>
                <p className="text-xs text-white/50">Calling campaign to all registered barbers</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white/80 space-y-2">
              <p className="font-semibold text-amber-400">Campaign Details:</p>
              <p>• Riya will call all active barbers sequentially with a 2-second interval.</p>
              <p>• Caller ID: <span className="font-mono text-amber-300 font-bold">+91 94294 92250</span></p>
              <p className="italic text-white/60">"Namaste! Main QUTTR se bol rahi hoon. Humne naya AI booking system launch kiya hai. Aage se aapko booking calls is number se aayengi: 94294 92250. Is number ko save kar lijiye. Dhanyawad!"</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowBroadcastModal(false)}
                disabled={isBroadcasting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.05] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBroadcastAiCall}
                disabled={isBroadcasting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                {isBroadcasting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Initiating Campaign...
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-3.5 h-3.5" />
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
