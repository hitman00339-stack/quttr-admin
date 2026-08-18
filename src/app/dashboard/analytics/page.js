'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  BarChart3, TrendingUp, MapPin, Users, QrCode, Loader2,
  Store, Zap, Activity, ArrowUpRight, RefreshCw,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: 'all', label: 'All Time' },
];

const PIE_COLORS = ['#E63946', '#FFD700', '#3949AB', '#00d9a3', '#FF9A00', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function AnalyticsPage() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`/api/analytics/overview?range=${range}`);
      const d = await res.json();
      if (d.success) setData(d);
      else toast.error('Failed to load analytics');
    } catch (e) {
      toast.error('Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [range]);

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
      </div>
    );
  }
  if (!data) return null;

  const { overview, daily_scans, top_cities, top_towns, top_states, top_shops, top_agents, type_breakdown, recent_activations } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#FFD700]" />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Complete overview of QR performance, scans, and agent activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="p-2 bg-white/[0.05] rounded-lg hover:bg-white/[0.1] transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex bg-white/[0.05] border border-white/10 rounded-lg overflow-hidden">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`px-3 py-2 text-xs font-bold transition ${
                  range === r.id
                    ? 'bg-gradient-to-r from-[#E63946] to-[#B01824] text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top-level metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total QRs Printed"
          value={overview.total_qrs}
          icon={QrCode}
          color="from-blue-500 to-blue-700"
        />
        <MetricCard
          label="QRs Activated"
          value={overview.activated_qrs}
          sub={`${overview.inactive_qrs} inactive`}
          icon={Zap}
          color="from-emerald-500 to-emerald-700"
        />
        <MetricCard
          label={`Scans (${RANGES.find(r => r.id === range)?.label})`}
          value={overview.total_scans}
          icon={TrendingUp}
          color="from-[#E63946] to-[#B01824]"
        />
        <MetricCard
          label="Active Agents"
          value={overview.active_agents}
          sub={`${overview.total_agents} total`}
          icon={Users}
          color="from-[#FFD700] to-[#B08900]"
          valueClass="text-black"
        />
      </div>

      {/* Big chart: Scans over time */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#FFD700]" />
            Scans Over Time
          </h2>
          <span className="text-xs text-white/40">
            {daily_scans.length} data points
          </span>
        </div>
        {daily_scans.length === 0 ? (
          <EmptyChart msg="No scans in this period yet" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={daily_scans}>
              <defs>
                <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFD700" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: '#1a1a1a',
                  border: '1px solid rgba(255,215,0,0.3)',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey="count" stroke="#FFD700" strokeWidth={3} dot={{ fill: '#E63946', r: 3 }} activeDot={{ r: 6 }} fill="url(#scanGrad)" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 1: Top Cities + Top Towns */}
      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="🏙️ Top Cities" data={top_cities} color="#E63946" />
        <ChartCard title="🏘️ Top Towns" data={top_towns} color="#FFD700" />
      </div>

      {/* Row 2: Top States + Top Agents */}
      <div className="grid md:grid-cols-2 gap-4">
        <ChartCard title="🗺️ Top States" data={top_states} color="#3949AB" />

        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FFD700]" />
            Top Marketing Agents
          </h3>
          {top_agents.length === 0 ? (
            <EmptyChart msg="No agent activations yet" />
          ) : (
            <div className="space-y-2">
              {top_agents.slice(0, 8).map((a, i) => (
                <Link
                  key={a._id}
                  href={`/dashboard/marketing/${a._id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.05] transition"
                >
                  <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0 ${
                    i === 0 ? 'bg-[#FFD700] text-black' :
                    i === 1 ? 'bg-gray-300 text-black' :
                    i === 2 ? 'bg-amber-700 text-white' :
                    'bg-white/5 text-[#FFD700]'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{a.name}</p>
                    <p className="text-xs text-white/50">{a.activations} QRs activated</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#FFD700]">{a.scans}</p>
                    <p className="text-[10px] text-white/40">scans</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Top Shops + Type Breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Store className="w-4 h-4 text-[#FFD700]" />
            Top Shops by Scans
          </h3>
          {top_shops.length === 0 ? (
            <EmptyChart msg="No shop scans yet" />
          ) : (
            <div className="space-y-2">
              {top_shops.slice(0, 8).map((s, i) => (
                <div key={s.name + i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03]">
                  <span className="w-6 h-6 rounded-lg bg-white/5 text-xs font-black flex items-center justify-center text-[#FFD700]">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{s.name}</p>
                    <p className="text-xs text-white/50 truncate">
                      {s.town || s.city || 'Unknown location'}
                    </p>
                  </div>
                  <span className="text-sm font-black text-[#FFD700]">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FFD700]" />
            QR Types Breakdown
          </h3>
          {type_breakdown.length === 0 ? (
            <EmptyChart msg="No activations yet" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={type_breakdown}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {type_breakdown.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1a1a1a',
                    border: '1px solid rgba(255,215,0,0.3)',
                    borderRadius: '8px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Activations */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#FFD700]" />
            Recent Activations
          </h3>
          <Link href="/dashboard/qr-explorer" className="text-xs text-[#FFD700] hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        {recent_activations.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-white/50">No activations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {recent_activations.map((a) => (
              <Link
                key={a._id}
                href={`/dashboard/qr-explorer/${a.qr_code}`}
                className="p-3 flex items-center gap-3 hover:bg-white/[0.03] transition"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E63946]/30 to-[#B01824]/30 flex items-center justify-center flex-shrink-0 border border-[#FFD700]/20">
                  <Store className="w-4 h-4 text-[#FFD700]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate">{a.shop_name || a.qr_code}</p>
                    <span className="text-[10px] font-mono bg-white/[0.05] px-2 py-0.5 rounded">{a.qr_code}</span>
                  </div>
                  <p className="text-xs text-white/50 truncate">
                    {a.town || 'No town'}{a.city ? ` · ${a.city}` : ''}
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-white/70">{a.activated_by_name}</p>
                  <p className="text-[10px] text-white/40">
                    {new Date(a.activated_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short',
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, icon: Icon, color, valueClass = 'text-white' }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold">{label}</p>
      <p className={`text-2xl font-black mt-1 ${valueClass}`}>
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </p>
      {sub && <p className="text-[10px] text-white/40 mt-1">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, data, color }) {
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
      <h3 className="font-bold text-sm mb-4">{title}</h3>
      {data.length === 0 ? (
        <EmptyChart msg="No data yet" />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 5, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }} width={90} />
            <Tooltip
              contentStyle={{
                background: '#1a1a1a',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="count" fill={color} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function EmptyChart({ msg }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-center">
      <BarChart3 className="w-8 h-8 text-white/10 mb-2" />
      <p className="text-xs text-white/40">{msg}</p>
    </div>
  );
}
