'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp, DollarSign, Users, Store,
  Award, BarChart3, Calendar,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { analyticsService } from '../../../services/analytics';

const COLORS = ['#FFD700', '#E63946', '#00D68F', '#0095FF', '#FFAA00'];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  useEffect(() => {
    load();
  }, [range]);

  const load = async () => {
    setLoading(true);
    const result = await analyticsService.get(range);
    if (result.success) setData(result);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="skeleton h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="skeleton h-80" />
          <div className="skeleton h-80" />
        </div>
      </div>
    );
  }

  const totalRevenue = data?.revenueByDay?.reduce((sum, d) => sum + d.revenue, 0) || 0;
  const totalBookings = data?.revenueByDay?.reduce((sum, d) => sum + d.bookings, 0) || 0;
  const totalUsers = data?.userGrowth?.reduce((sum, d) => sum + d.users, 0) || 0;
  const avgRevenue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-display">Analytics</h1>
          <p className="text-body mt-1">Business insights · Last {range} days</p>
        </div>

        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`btn ${range === d ? 'btn-accent' : 'btn-outline'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mb-3">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <p className="stat-label">Total Revenue</p>
          <p className="stat-value">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>

        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-info to-blue-700 flex items-center justify-center mb-3">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <p className="stat-label">Bookings</p>
          <p className="stat-value">{totalBookings.toLocaleString('en-IN')}</p>
        </div>

        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center mb-3">
            <Users className="w-4 h-4 text-white" />
          </div>
          <p className="stat-label">New Users</p>
          <p className="stat-value">{totalUsers.toLocaleString('en-IN')}</p>
        </div>

        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <p className="stat-label">Avg Order</p>
          <p className="stat-value">₹{avgRevenue}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="card p-6">
        <h3 className="text-title mb-4">Revenue Trend</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.revenueByDay || []}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFD700" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: '11px' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#141417',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#FFD700" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Growth + Top Shops */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-title mb-4">User Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.userGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#141417', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="users" fill="#0095FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-title mb-4">Top Performing Shops</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar">
            {(data?.topShops || []).slice(0, 10).map((shop, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-accent-500 text-surface-100' :
                  i === 1 ? 'bg-white/20 text-white' :
                  i === 2 ? 'bg-brand-500/40 text-white' :
                  'bg-white/10 text-white/60'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{shop.name}</p>
                  <p className="text-2xs text-white/40">{shop.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-accent-500">₹{shop.revenue.toLocaleString('en-IN')}</p>
                  <p className="text-2xs text-white/40">{shop.bookings} bookings</p>
                </div>
              </div>
            ))}
            {(!data?.topShops || data.topShops.length === 0) && (
              <p className="text-center text-white/40 text-sm py-8">No data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      {data?.statusDistribution && data.statusDistribution.length > 0 && (
        <div className="card p-6">
          <h3 className="text-title mb-4">Bookings by Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  dataKey="count"
                  nameKey="_id"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry._id}: ${entry.count}`}
                >
                  {data.statusDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#141417', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
