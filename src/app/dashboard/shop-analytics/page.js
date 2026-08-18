'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp, DollarSign, Users, Store, Calendar,
  Activity, Clock, Award, MapPin, Scissors,
  BarChart3, PieChart as PieChartIcon, Zap,
  ArrowUpRight, TrendingDown, AlertCircle,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, LineChart, Line,
} from 'recharts';
import { shopAnalyticsService } from '../../../services/shopAnalytics';

const COLORS = ['#FFD700', '#E63946', '#00D68F', '#0095FF', '#FFAA00', '#B67FF0', '#FF6B9D', '#4ECDC4'];

export default function ShopAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);
  const [city, setCity] = useState('all');
  const [shopId, setShopId] = useState('all');
  const [cities, setCities] = useState([]);
  const [shops, setShops] = useState([]);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    load();
  }, [range, city, shopId]);

  const loadFilters = async () => {
    const [citiesResult, shopsResult] = await Promise.all([
      shopAnalyticsService.getCities(),
      shopAnalyticsService.getShopsList(),
    ]);
    if (citiesResult.success) setCities(citiesResult.cities);
    if (shopsResult.success) setShops(shopsResult.shops);
  };

  const load = async () => {
    setLoading(true);
    const params = { days: range };
    if (city !== 'all') params.city = city;
    if (shopId !== 'all') params.shopId = shopId;
    const result = await shopAnalyticsService.get(params);
    if (result.success) setData(result.analytics);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="skeleton h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-32" />)}
        </div>
        <div className="skeleton h-96" />
      </div>
    );
  }

  const filteredShops = city !== 'all'
    ? shops.filter(s => s.city === city)
    : shops;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-2xs uppercase tracking-widest text-success font-semibold">
              Live Data · Last {range} days
            </span>
          </div>
          <h1 className="text-display">Shop Analytics</h1>
          <p className="text-body mt-1">Business insights and shop performance metrics</p>
        </div>

        {/* Range Selector */}
        <div className="flex gap-2">
          {[7, 30, 90, 365].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`btn ${range === d ? 'btn-accent' : 'btn-outline'}`}
            >
              {d === 365 ? '1y' : `${d}d`}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-white/40" />
          <select
            value={city}
            onChange={(e) => { setCity(e.target.value); setShopId('all'); }}
            className="input min-w-[180px]"
          >
            <option value="all">All Cities</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-white/40" />
          <select
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            className="input min-w-[220px]"
          >
            <option value="all">All Shops</option>
            {filteredShops.map(s => (
              <option key={s._id} value={s._id}>{s.name} ({s.city})</option>
            ))}
          </select>
        </div>

        {(city !== 'all' || shopId !== 'all') && (
          <button
            onClick={() => { setCity('all'); setShopId('all'); }}
            className="btn-ghost"
          >
            Reset Filters
          </button>
        )}

        <div className="ml-auto text-2xs text-white/40">
          {shopId !== 'all' ? `Showing 1 shop` : `Showing ${filteredShops.length || data?.overview?.totalShops || 0} shops`}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mb-3">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <p className="stat-label">Total Revenue</p>
          <p className="stat-value">₹{(data?.overview?.totalRevenue || 0).toLocaleString('en-IN')}</p>
          <p className="text-2xs text-white/40 mt-1">Avg: ₹{data?.overview?.avgOrderValue || 0}/booking</p>
        </div>

        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-info to-blue-700 flex items-center justify-center mb-3">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <p className="stat-label">Total Bookings</p>
          <p className="stat-value">{(data?.overview?.totalBookings || 0).toLocaleString('en-IN')}</p>
          <p className={`text-2xs mt-1 flex items-center gap-1 ${data?.overview?.cancellationRate > 20 ? 'text-error' : 'text-white/40'}`}>
            {data?.overview?.cancellationRate > 20 ? <TrendingDown className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
            {data?.overview?.cancellationRate || 0}% cancellation
          </p>
        </div>

        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center mb-3">
            <Store className="w-4 h-4 text-surface-100" />
          </div>
          <p className="stat-label">Active Shops</p>
          <p className="stat-value">{data?.overview?.activeShops || 0}</p>
          <p className="text-2xs text-white/40 mt-1">of {data?.overview?.totalShops || 0} total</p>
        </div>

        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-warning to-amber-700 flex items-center justify-center mb-3">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
          <p className="stat-label">Attention Needed</p>
          <p className="stat-value">{(data?.overview?.pendingShops || 0) + (data?.overview?.suspendedShops || 0)}</p>
          <p className="text-2xs text-white/40 mt-1">
            {data?.overview?.pendingShops || 0} pending · {data?.overview?.suspendedShops || 0} suspended
          </p>
        </div>
      </div>

      {/* Revenue & Bookings Trend */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-title">Revenue & Bookings Trend</h3>
            <p className="text-caption mt-1">Daily performance over selected period</p>
          </div>
          <div className="chip-success">
            <Activity className="w-3 h-3" />
            Live
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.dailyTrend || []}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D68F" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00D68F" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bookingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFD700" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="#00D68F" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#FFD700" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#141417',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#00D68F" strokeWidth={2} fill="url(#revenueGrad)" />
              <Area yAxisId="right" type="monotone" dataKey="bookings" name="Bookings" stroke="#FFD700" strokeWidth={2} fill="url(#bookingsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Shops & Shops by City */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Shops */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-title">Top Performing Shops</h3>
              <p className="text-caption mt-1">By revenue in selected period</p>
            </div>
            <Award className="w-5 h-5 text-accent-500" />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
            {data?.topShops?.length > 0 ? data.topShops.map((shop, i) => (
              <div key={shop.shopId} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
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
                  <p className="text-2xs text-white/40">
                    {shop.city} · ⭐ {shop.rating?.toFixed(1) || '0.0'} · {shop.bookings} bookings
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-success">₹{shop.revenue.toLocaleString('en-IN')}</p>
                  <p className="text-2xs text-white/40">Avg ₹{shop.avgOrderValue}</p>
                </div>
              </div>
            )) : (
              <p className="text-center text-white/40 text-sm py-8">No data yet</p>
            )}
          </div>
        </div>

        {/* Shops by City */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-title">Shops by City</h3>
              <p className="text-caption mt-1">Geographic distribution</p>
            </div>
            <MapPin className="w-5 h-5 text-info" />
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.shopsByCity || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.4)" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                <YAxis dataKey="city" type="category" stroke="rgba(255,255,255,0.4)" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ background: '#141417', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="active" name="Active" fill="#00D68F" radius={[0, 4, 4, 0]} />
                <Bar dataKey="count" name="Total" fill="#0095FF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Popular Services & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Services */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-title">Popular Services</h3>
              <p className="text-caption mt-1">Most booked services</p>
            </div>
            <Scissors className="w-5 h-5 text-brand-500" />
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
            {data?.popularServices?.length > 0 ? data.popularServices.map((s, i) => (
              <div key={s.service} className="p-3 rounded-xl bg-white/[0.02]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{s.service}</p>
                  <span className="chip-accent text-2xs">{s.count} bookings</span>
                </div>
                <div className="flex items-center justify-between text-2xs">
                  <span className="text-white/40">Avg {s.avgDuration}min</span>
                  <span className="text-success font-semibold">₹{s.revenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-accent-500"
                    style={{ width: `${(s.count / (data.popularServices[0]?.count || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )) : (
              <p className="text-center text-white/40 text-sm py-8">No data yet</p>
            )}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-title">Peak Hours</h3>
              <p className="text-caption mt-1">Busiest times of day</p>
            </div>
            <Clock className="w-5 h-5 text-warning" />
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.peakHours || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="hourLabel" stroke="rgba(255,255,255,0.4)" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#141417', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="bookings" fill="#FFAA00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Status Distribution & Staff Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        {data?.statusDistribution?.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-title">Booking Status</h3>
                <p className="text-caption mt-1">Distribution of all bookings</p>
              </div>
              <PieChartIcon className="w-5 h-5 text-info" />
            </div>

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
                  <Tooltip
                    contentStyle={{ background: '#141417', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Staff Performance */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-title">Top Barbers</h3>
              <p className="text-caption mt-1">Best performing staff</p>
            </div>
            <Users className="w-5 h-5 text-accent-500" />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
            {data?.staffPerformance?.length > 0 ? data.staffPerformance.map((staff, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-accent-500 text-surface-100' :
                  i === 1 ? 'bg-white/20 text-white' :
                  'bg-white/10 text-white/60'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {staff.name}
                    <span className="text-2xs text-white/40 ml-2 capitalize">({staff.role})</span>
                  </p>
                  <p className="text-2xs text-white/40 truncate">
                    {staff.shopName} · ⭐ {staff.rating?.toFixed(1) || '0.0'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-success">₹{staff.revenue.toLocaleString('en-IN')}</p>
                  <p className="text-2xs text-white/40">{staff.bookings} bookings</p>
                </div>
              </div>
            )) : (
              <p className="text-center text-white/40 text-sm py-8">No staff data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="card p-4 flex items-center gap-3 text-2xs text-white/40">
        <Zap className="w-3.5 h-3.5 text-accent-500" />
        <span>
          Data refreshes automatically · Last updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
