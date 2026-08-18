'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  TrendingUp, DollarSign, Users, Store, Calendar,
  Activity, Clock, Award, MapPin, Scissors,
  BarChart3, PieChart as PieChartIcon, Zap,
  ArrowUpRight, TrendingDown, AlertCircle, Loader2, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend,
} from 'recharts';

const COLORS = ['#FFD700', '#E63946', '#00D68F', '#0095FF', '#FFAA00', '#B67FF0', '#FF6B9D', '#4ECDC4'];

const RANGES = [
  { id: '7', label: '7 Days' },
  { id: '30', label: '30 Days' },
  { id: '90', label: '90 Days' },
  { id: '365', label: '1 Year' },
];

export default function ShopAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState('30');
  const [city, setCity] = useState('all');
  const [shopId, setShopId] = useState('all');
  const [cities, setCities] = useState([]);
  const [shops, setShops] = useState([]);

  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('quttr_admin_token');
  };

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    load();
  }, [range, city, shopId]);

  const loadFilters = async () => {
    try {
      const token = getToken();
      const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://quttr-backend.onrender.com/api/v1';

      const [citiesRes, shopsRes] = await Promise.all([
        fetch(`${BACKEND}/admin/shop-analytics/cities`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BACKEND}/admin/shop-analytics/shops-list`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const citiesData = await citiesRes.json();
      const shopsData = await shopsRes.json();

      if (citiesData.success) setCities(citiesData.cities || []);
      if (shopsData.success) setShops(shopsData.shops || []);
    } catch (e) {
      console.error('Filter load error:', e);
    }
  };

  const load = async () => {
    try {
      const token = getToken();
      const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://quttr-backend.onrender.com/api/v1';

      const params = new URLSearchParams({ days: range });
      if (city !== 'all') params.set('city', city);
      if (shopId !== 'all') params.set('shopId', shopId);

      const res = await fetch(`${BACKEND}/admin/shop-analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();

      if (result.success) {
        setData(result.analytics);
      } else {
        toast.error(result.message || 'Failed to load');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto text-center py-32">
        <p className="text-white/50">No data available</p>
        <button onClick={load} className="mt-4 px-4 py-2 bg-white/[0.05] rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  const filteredShops = city !== 'all' ? shops.filter(s => s.city === city) : shops;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">
              Live · Last {range} Days
            </span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#FFD700]" />
            Shop Analytics
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Business insights and shop performance metrics
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

      {/* Filters */}
      <div className="p-4 flex flex-wrap items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-white/40" />
          <select
            value={city}
            onChange={(e) => { setCity(e.target.value); setShopId('all'); }}
            className="px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-sm text-white min-w-[180px]"
          >
            <option value="all">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-white/40" />
          <select
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            className="px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-sm text-white min-w-[220px]"
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
            className="text-xs text-white/60 hover:text-white"
          >
            Reset Filters
          </button>
        )}

        <div className="ml-auto text-[10px] text-white/40">
          {shopId !== 'all' ? 'Showing 1 shop' : `Showing ${filteredShops.length || data?.overview?.totalShops || 0} shops`}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Revenue"
          value={`₹${(data?.overview?.totalRevenue || 0).toLocaleString('en-IN')}`}
          sub={`Avg: ₹${data?.overview?.avgOrderValue || 0}/booking`}
          icon={DollarSign}
          color="from-emerald-500 to-emerald-700"
        />
        <MetricCard
          label="Total Bookings"
          value={(data?.overview?.totalBookings || 0).toLocaleString('en-IN')}
          sub={`${data?.overview?.cancellationRate || 0}% cancellation`}
          icon={Calendar}
          color="from-blue-500 to-blue-700"
        />
        <MetricCard
          label="Active Shops"
          value={data?.overview?.activeShops || 0}
          sub={`of ${data?.overview?.totalShops || 0} total`}
          icon={Store}
          color="from-[#FFD700] to-[#B08900]"
          valueClass="text-black"
        />
        <MetricCard
          label="Attention Needed"
          value={(data?.overview?.pendingShops || 0) + (data?.overview?.suspendedShops || 0)}
          sub={`${data?.overview?.pendingShops || 0} pending · ${data?.overview?.suspendedShops || 0} suspended`}
          icon={AlertCircle}
          color="from-amber-500 to-amber-700"
        />
      </div>

      {/* Revenue & Bookings Trend */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FFD700]" />
              Revenue & Bookings Trend
            </h2>
            <p className="text-[10px] text-white/40 mt-1">Daily performance</p>
          </div>
        </div>

        {(!data?.dailyTrend || data.dailyTrend.length === 0) ? (
          <EmptyChart msg="No data in this period yet" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.dailyTrend}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D68F" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00D68F" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFD700" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#00D68F" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#FFD700" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '8px' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#00D68F" strokeWidth={2} fill="url(#revGrad)" />
              <Area yAxisId="right" type="monotone" dataKey="bookings" name="Bookings" stroke="#FFD700" strokeWidth={2} fill="url(#bookGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Shops + Shops by City */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#FFD700]" />
            Top Performing Shops
          </h3>
          {(!data?.topShops || data.topShops.length === 0) ? (
            <EmptyChart msg="No shop data yet" />
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
              {data.topShops.map((shop, i) => (
                <div key={shop.shopId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03]">
                  <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0 ${
                    i === 0 ? 'bg-[#FFD700] text-black' :
                    i === 1 ? 'bg-gray-300 text-black' :
                    i === 2 ? 'bg-amber-700 text-white' :
                    'bg-white/5 text-[#FFD700]'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{shop.name}</p>
                    <p className="text-xs text-white/50">
                      {shop.city} · ⭐ {shop.rating?.toFixed(1) || '0.0'} · {shop.bookings} bookings
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-400">₹{shop.revenue.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-white/40">Avg ₹{shop.avgOrderValue}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FFD700]" />
            Shops by City
          </h3>
          {(!data?.shopsByCity || data.shopsByCity.length === 0) ? (
            <EmptyChart msg="No city data" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.shopsByCity} layout="vertical" margin={{ left: 5, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                <YAxis dataKey="city" type="category" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }} width={90} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="active" name="Active" fill="#00D68F" radius={[0, 4, 4, 0]} />
                <Bar dataKey="count" name="Total" fill="#0095FF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Popular Services + Peak Hours */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Scissors className="w-4 h-4 text-[#FFD700]" />
            Popular Services
          </h3>
          {(!data?.popularServices || data.popularServices.length === 0) ? (
            <EmptyChart msg="No service data yet" />
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
              {data.popularServices.map((s, i) => (
                <div key={s.service} className="p-3 rounded-lg bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">{s.service}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFD700]/15 text-[#FFD700]">
                      {s.count} bookings
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/40">Avg {s.avgDuration}min</span>
                    <span className="text-emerald-400 font-bold">₹{s.revenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#E63946] to-[#FFD700]"
                      style={{ width: `${(s.count / (data.popularServices[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FFD700]" />
            Peak Hours
          </h3>
          {(!data?.peakHours || data.peakHours.length === 0) ? (
            <EmptyChart msg="No time data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hourLabel" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '8px' }} />
                <Bar dataKey="bookings" fill="#FFAA00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Status Distribution + Top Barbers */}
      <div className="grid md:grid-cols-2 gap-4">
        {data?.statusDistribution && data.statusDistribution.length > 0 && (
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-[#FFD700]" />
              Booking Status
            </h3>
            <ResponsiveContainer width="100%" height={240}>
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
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FFD700]" />
            Top Barbers
          </h3>
          {(!data?.staffPerformance || data.staffPerformance.length === 0) ? (
            <EmptyChart msg="No staff data yet" />
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
              {data.staffPerformance.map((staff, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03]">
                  <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                    i === 0 ? 'bg-[#FFD700] text-black' :
                    i === 1 ? 'bg-gray-300 text-black' :
                    'bg-white/5 text-[#FFD700]'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {staff.name}
                      <span className="text-[10px] text-white/40 ml-2 capitalize">({staff.role})</span>
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      {staff.shopName} · ⭐ {staff.rating?.toFixed(1) || '0.0'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-400">₹{staff.revenue.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-white/40">{staff.bookings} bookings</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3 flex items-center gap-3 text-[10px] text-white/40">
        <Zap className="w-3.5 h-3.5 text-[#FFD700]" />
        <span>
          Refreshes automatically · Last updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
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
      <p className={`text-2xl font-black mt-1 ${valueClass}`}>{value}</p>
      {sub && <p className="text-[10px] text-white/40 mt-1">{sub}</p>}
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
