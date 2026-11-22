'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PhoneCall,
  PhoneIncoming,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCw,
  Search,
  Filter,
  ShieldAlert,
  ChevronRight,
  X,
  Volume2,
  ToggleLeft,
  ToggleRight,
  Store,
  Layers,
  ArrowUpDown,
  Loader2,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { authService } from '../../../services/auth';
import { shopsService } from '../../../services/shops';
import BroadcastTrackerModal from '../../../components/BroadcastTrackerModal';

export default function BookingCallingDashboard() {
  // ─── Broadcast State & Live Tracker ──────────────────────────────────────────
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const pollBroadcastStatus = async () => {
    try {
      const res = await api.get('/admin/broadcast-status');
      if (res?.data?.success && res?.data?.data) {
        setCampaignStatus(res.data.data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    pollBroadcastStatus();
  }, []);

  useEffect(() => {
    let timer = null;
    if (showTrackerModal || campaignStatus?.isActive) {
      timer = setInterval(pollBroadcastStatus, 2000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showTrackerModal, campaignStatus?.isActive]);

  const handleBroadcastAiCall = async () => {
    setIsBroadcasting(true);
    try {
      const res = await api.post('/admin/broadcast-ai-call');
      setShowBroadcastModal(false);
      setShowTrackerModal(true);
      const barbers = res?.data?.barbers || [];
      if (barbers.length === 0) {
        toast('No active barbers found to call.', { icon: 'ℹ️' });
        return;
      }
      if (res?.data?.status) {
        setCampaignStatus(res.data.status);
      }
      toast.success(res?.data?.message || `Broadcast AI call campaign initiated for ${barbers.length} active barbers!`, { duration: 6000 });
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to start broadcast', { duration: 6000 });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleCampaignControl = async (action) => {
    setIsActionLoading(true);
    try {
      const res = await api.post('/admin/broadcast-control', { action });
      if (res?.data?.data) {
        setCampaignStatus(res.data.data);
      }
      toast.success(res?.data?.message || `Campaign ${action}ed`);
    } catch (err) {
      toast.error(err?.response?.data?.message || `Failed to ${action} campaign`);
    } finally {
      setIsActionLoading(false);
    }
  };
  // ─── Auth State ─────────────────────────────────────────────────────────────
  const [admin, setAdmin] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // ─── Data & View States ─────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [kpis, setKpis] = useState({
    totalDispatched: 0,
    acceptedCount: 0,
    declinedCount: 0,
    acceptanceRate: 0,
    avgDurationSeconds: 0,
    avgRetryCount: 0,
  });

  // ─── Filter States ──────────────────────────────────────────────────────────
  const [decisionFilter, setDecisionFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedShopId, setSelectedShopId] = useState('');

  // ─── Config & Toggles ───────────────────────────────────────────────────────
  const [callingConfig, setCallingConfig] = useState({
    globalCallingEnabled: true,
    shopCallingOverrides: {},
  });
  const [updatingConfig, setUpdatingConfig] = useState(false);
  const [newOverrideShopId, setNewOverrideShopId] = useState('');
  const [newOverrideEnabled, setNewOverrideEnabled] = useState(true);

  // ─── Shop-wise Calling Controls State ───────────────────────────────────────
  const [shops, setShops] = useState([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [updatingShopId, setUpdatingShopId] = useState(null);
  const [shopFilterTerm, setShopFilterTerm] = useState('');

  // ─── Modal / Detail State ───────────────────────────────────────────────────
  const [selectedSession, setSelectedSession] = useState(null);

  // ─── Check Admin Role on Mount ──────────────────────────────────────────────
  useEffect(() => {
    const currentAdmin = authService.getCurrentAdmin();
    if (currentAdmin) {
      setAdmin(currentAdmin);
      const role = (currentAdmin.role || '').toLowerCase();
      setIsAdmin(role === 'admin' || currentAdmin.isAdmin === true);
    }
    setAuthChecked(true);
  }, []);

  // ─── Fetch Config & Sessions ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('quttr_admin_token') : '';
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // 1. Fetch System Calling Config
      try {
        const cfgRes = await fetch('/api/omni/booking/config', { headers });
        if (cfgRes.ok) {
          const cfgData = await cfgRes.json();
          if (cfgData.success && cfgData.config) {
            setCallingConfig(cfgData.config);
          }
        }
      } catch (_) {}

      // 2. Fetch Sessions List
      const queryParams = new URLSearchParams();
      if (decisionFilter !== 'all') queryParams.set('decision', decisionFilter);
      if (selectedShopId) queryParams.set('shopId', selectedShopId);
      queryParams.set('limit', '100');

      const sessRes = await fetch(`/api/omni/booking/sessions?${queryParams.toString()}`, { headers });
      if (!sessRes.ok) {
        throw new Error(`HTTP ${sessRes.status}: Failed to retrieve booking calls`);
      }

      const sessData = await sessRes.json();
      if (!sessData.success) {
        throw new Error(sessData.error || 'Server rejected request');
      }

      const rawSessions = sessData.sessions || [];
      setSessions(rawSessions);

      // 3. Fetch Shops List for Shop-wise Calling Controls
      setShopsLoading(true);
      try {
        const shopsRes = await shopsService.getAll({ limit: 100 });
        if (shopsRes.success && shopsRes.shops) {
          setShops(shopsRes.shops);
        }
      } catch (shopErr) {
        console.warn('Failed to fetch shops for calling control:', shopErr);
      } finally {
        setShopsLoading(false);
      }

      // Compute or retrieve KPIs
      const total = rawSessions.length;
      const accepted = rawSessions.filter((s) => s.decision === 'accepted').length;
      const declined = rawSessions.filter((s) => s.decision === 'declined').length;
      const totalDuration = rawSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
      const totalRetries = rawSessions.reduce((acc, s) => acc + (s.retryCount || 0), 0);

      setKpis({
        totalDispatched: sessData.kpis?.totalDispatched ?? total,
        acceptedCount: sessData.kpis?.acceptedCount ?? accepted,
        declinedCount: sessData.kpis?.declinedCount ?? declined,
        acceptanceRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
        avgDurationSeconds: total > 0 ? Math.round(totalDuration / total) : 0,
        avgRetryCount: total > 0 ? Number((totalRetries / total).toFixed(1)) : 0,
      });
    } catch (err) {
      setError(err.message || 'Error loading booking call sessions');
    } finally {
      setLoading(false);
    }
  }, [decisionFilter, selectedShopId]);

  useEffect(() => {
    if (authChecked && isAdmin) {
      fetchData();
    }
  }, [authChecked, isAdmin, fetchData]);

  // ─── Toggle Handlers ────────────────────────────────────────────────────────
  const handleToggleGlobal = async () => {
    if (!isAdmin) return;
    setUpdatingConfig(true);
    const nextVal = !callingConfig.globalCallingEnabled;
    try {
      const token = localStorage.getItem('quttr_admin_token') || '';
      const res = await fetch('/api/omni/booking/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ globalCallingEnabled: nextVal }),
      });
      const data = await res.json();
      if (data.success) {
        setCallingConfig((prev) => ({ ...prev, globalCallingEnabled: nextVal }));
        toast.success(`Global AI Booking Calling ${nextVal ? 'ENABLED' : 'DISABLED'}`);
      } else {
        toast.error(data.error || 'Failed to update global toggle');
      }
    } catch (e) {
      toast.error('Network error updating calling configuration');
    } finally {
      setUpdatingConfig(false);
    }
  };

  const handleSaveShopOverride = async () => {
    if (!isAdmin || !newOverrideShopId.trim()) return;
    setUpdatingConfig(true);
    try {
      const token = localStorage.getItem('quttr_admin_token') || '';
      const res = await fetch('/api/omni/booking/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shopId: newOverrideShopId.trim(), enabled: newOverrideEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        setCallingConfig((prev) => ({
          ...prev,
          shopCallingOverrides: { ...prev.shopCallingOverrides, [newOverrideShopId.trim()]: newOverrideEnabled },
        }));
        toast.success(`Shop ${newOverrideShopId.trim()} AI_CALL set to ${newOverrideEnabled ? 'ON' : 'OFF'}`);
        setNewOverrideShopId('');
      } else {
        toast.error(data.error || 'Failed to update shop toggle');
      }
    } catch (e) {
      toast.error('Failed to update shop override');
    } finally {
      setUpdatingConfig(false);
    }
  };

  const handleUpdateShopMode = async (shopId, newMode) => {
    if (!isAdmin) return;
    setUpdatingShopId(shopId);
    try {
      const res = await shopsService.updateBookingMode(shopId, newMode);
      if (res.success) {
        toast.success(`Booking Mode set to ${newMode.toUpperCase()}! ✅`);
        setShops((prev) =>
          prev.map((s) =>
            s._id === shopId
              ? {
                  ...s,
                  adminOverrideMode: newMode,
                  bookingPreferences: {
                    ...(s.bookingPreferences || {}),
                    adminOverrideMode: newMode,
                  },
                }
              : s
          )
        );
      } else {
        toast.error(res.message || 'Failed to update shop mode');
      }
    } catch (err) {
      toast.error('Network error updating shop mode');
    } finally {
      setUpdatingShopId(null);
    }
  };

  // ─── Filtered Sessions ──────────────────────────────────────────────────────
  const filteredSessions = sessions.filter((s) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchBooking = (s.bookingId || '').toLowerCase().includes(q);
      const matchCustomer = (s.customerName || '').toLowerCase().includes(q);
      const matchBarber = (s.barberName || '').toLowerCase().includes(q);
      const matchPhone = (s.destinationPhone || '').includes(q);
      if (!matchBooking && !matchCustomer && !matchBarber && !matchPhone) return false;
    }
    if (dateFilter && s.createdAt) {
      const dateStr = new Date(s.createdAt).toISOString().slice(0, 10);
      if (dateStr !== dateFilter) return false;
    }
    return true;
  });

  // ─── Non-Admin Access Guard ─────────────────────────────────────────────────
  if (authChecked && !isAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-red-900/60 text-red-400 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Restricted: Admin Privilege Required</h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Booking-Acceptance Voice Calling and AI telephony controls are restricted to primary system administrators.
            Your current account role does not have permission to view or modify calling queues.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
              <PhoneIncoming className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Booking-Acceptance AI Calling</h1>
              <p className="text-xs text-gray-400">
                Autonomous voice call dispatch for barber booking confirmation (OmniDimension AI)
              </p>
            </div>
          </div>
        </div>

        {/* Actions & Global On/Off Toggle */}
        <div className="flex items-center flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-black stroke-[2.5]" />
            <span>📞 AI Call All Barbers</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTrackerModal(true)}
            className="flex items-center gap-2 bg-surface-100/80 hover:bg-surface-200 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-white/[0.08] transition-all cursor-pointer shadow-md"
            title="Open Live Broadcast Tracker & Feed"
          >
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Live Tracker</span>
            {campaignStatus?.isActive && (
              <span className="relative flex h-2 w-2 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </button>

          <div className="flex items-center gap-4 bg-surface-100/60 border border-white/[0.08] rounded-xl px-4 py-2.5">
            <div className="text-right">
              <div className="text-xs font-semibold text-white">Global Dispatch</div>
              <div className="text-2xs text-gray-400">
                {callingConfig.globalCallingEnabled ? 'Calls active' : 'Calls paused'}
              </div>
            </div>
            <button
              onClick={handleToggleGlobal}
              disabled={updatingConfig}
              className={`p-1 rounded-lg transition-colors ${
                callingConfig.globalCallingEnabled ? 'text-teal-400 hover:text-teal-300' : 'text-gray-500 hover:text-gray-400'
              }`}
              title="Toggle global calling"
            >
              {callingConfig.globalCallingEnabled ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8" />
              )}
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white border border-white/[0.08] rounded-lg transition-colors"
              title="Refresh logs"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-surface-100/50 border border-white/[0.06] rounded-xl">
          <div className="text-xs text-gray-400 font-medium">Total Dispatched</div>
          <div className="text-2xl font-black text-white mt-1">{kpis.totalDispatched}</div>
          <div className="text-2xs text-gray-500 mt-1">Calls initiated by AI</div>
        </div>
        <div className="p-4 bg-surface-100/50 border border-white/[0.06] rounded-xl">
          <div className="text-xs text-gray-400 font-medium">Acceptance Rate</div>
          <div className="text-2xl font-black text-teal-400 mt-1">{kpis.acceptanceRate}%</div>
          <div className="text-2xs text-gray-500 mt-1">
            {kpis.acceptedCount} accepted / {kpis.declinedCount} declined
          </div>
        </div>
        <div className="p-4 bg-surface-100/50 border border-white/[0.06] rounded-xl">
          <div className="text-xs text-gray-400 font-medium">Avg Duration</div>
          <div className="text-2xl font-black text-white mt-1">{kpis.avgDurationSeconds}s</div>
          <div className="text-2xs text-gray-500 mt-1">Carrier talk time</div>
        </div>
        <div className="p-4 bg-surface-100/50 border border-white/[0.06] rounded-xl">
          <div className="text-xs text-gray-400 font-medium">Avg Retries</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{kpis.avgRetryCount}</div>
          <div className="text-2xs text-gray-500 mt-1">Max 2 per appointment</div>
        </div>
      </div>

      {/* ── Per-Shop AI_CALL Overrides & Control Section ────────────────────────── */}
      <div className="p-4 bg-surface-100/40 border border-white/[0.06] rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-teal-400" />
            <div>
              <div className="text-sm font-semibold text-white">Shop-Wise Booking Acceptance Controls</div>
              <div className="text-2xs text-gray-400">Admin override to enforce AI Call or App Mode per barber shop</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter shops..."
                value={shopFilterTerm}
                onChange={(e) => setShopFilterTerm(e.target.value)}
                className="pl-8 pr-3 py-1 bg-black/40 border border-white/[0.1] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <button
              onClick={fetchData}
              disabled={shopsLoading}
              className="p-1.5 text-gray-400 hover:text-white border border-white/[0.08] rounded-lg transition-colors"
              title="Refresh shops"
            >
              <RotateCw className={`w-3.5 h-3.5 ${shopsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Shops Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-gray-400">
                <th className="pb-2 font-medium">Shop</th>
                <th className="pb-2 font-medium">Phone Numbers</th>
                <th className="pb-2 font-medium">Shop Preference</th>
                <th className="pb-2 font-medium">Admin Enforced Mode</th>
                <th className="pb-2 font-medium text-right">Effective Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {shops
                .filter((s) => {
                  if (!shopFilterTerm) return true;
                  const term = shopFilterTerm.toLowerCase();
                  return (
                    (s.name || '').toLowerCase().includes(term) ||
                    (s.phone || '').includes(term) ||
                    (s.address?.city || '').toLowerCase().includes(term) ||
                    (s._id || '').includes(term)
                  );
                })
                .slice(0, 20)
                .map((shop) => {
                  const shopPref = shop.bookingPreferences?.acceptanceMode || 'app';
                  const adminMode = shop.adminOverrideMode || shop.bookingPreferences?.adminOverrideMode || 'default';
                  const effectiveMode = (adminMode !== 'default' && adminMode !== 'none') ? adminMode : shopPref;
                  const isUpdating = updatingShopId === shop._id;

                  return (
                    <tr key={shop._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pr-3">
                        <div className="font-semibold text-white">{shop.name || 'Unnamed Shop'}</div>
                        <div className="text-2xs text-gray-400">{shop.address?.city || 'Location N/A'} • ID: {shop._id.slice(-6)}</div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="text-gray-300 font-mono">{shop.bookingPreferences?.aiCallPhone || shop.phone || 'No phone'}</div>
                        {shop.bookingPreferences?.aiCallPhone && shop.bookingPreferences.aiCallPhone !== shop.phone && (
                          <div className="text-2xs text-teal-400">AI: {shop.bookingPreferences.aiCallPhone}</div>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold uppercase ${
                          shopPref === 'ai_call' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {shopPref === 'ai_call' ? 'AI Voice Call' : 'In-App'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <select
                          value={adminMode}
                          disabled={isUpdating}
                          onChange={(e) => handleUpdateShopMode(shop._id, e.target.value)}
                          className={`bg-black/60 border rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:border-teal-500 ${
                            adminMode === 'ai_call'
                              ? 'border-teal-500/50 text-teal-300'
                              : adminMode === 'app'
                              ? 'border-blue-500/50 text-blue-300'
                              : 'border-white/[0.12] text-gray-300'
                          }`}
                        >
                          <option value="default">DEFAULT (Shop Decides)</option>
                          <option value="ai_call">FORCE: AI Voice Call</option>
                          <option value="app">FORCE: In-App Push</option>
                        </select>
                        {isUpdating && <RotateCw className="w-3 h-3 text-teal-400 inline-block ml-2 animate-spin" />}
                      </td>
                      <td className="py-2.5 text-right font-medium">
                        <span className={`inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded ${
                          effectiveMode === 'ai_call'
                            ? 'bg-teal-950 text-teal-400 border border-teal-800'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${effectiveMode === 'ai_call' ? 'bg-teal-400 animate-pulse' : 'bg-gray-400'}`}></span>
                          {effectiveMode === 'ai_call' ? 'LIVE CALLS' : 'IN-APP'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              {shops.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-gray-500">
                    {shopsLoading ? 'Loading shops...' : 'No shops found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-surface-100/30 p-3 rounded-xl border border-white/[0.06]">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search booking, barber, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-white/[0.1] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-black/40 border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
            title="Filter by date"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Decision:</span>
          </div>
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="bg-black/40 border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Outcomes</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="pending">Pending</option>
            <option value="unclear">Unclear</option>
          </select>
        </div>
      </div>

      {/* ── 4 Distinct States: Loading / Error / Empty / Populated Table ──────── */}
      {loading ? (
        // State 1: LOADING
        <div className="space-y-3 p-8 bg-surface-100/20 border border-white/[0.06] rounded-xl">
          <div className="flex items-center justify-center gap-3 text-teal-400">
            <RotateCw className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Loading booking call sessions...</span>
          </div>
          <div className="space-y-2 pt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-white/[0.02] rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      ) : error ? (
        // State 2: ERROR
        <div className="p-8 bg-red-950/30 border border-red-500/30 rounded-xl text-center space-y-3">
          <div className="w-10 h-10 bg-red-900/40 text-red-400 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-sm font-bold text-white">Failed to load booking calls</div>
          <div className="text-xs text-gray-400 max-w-md mx-auto">{error}</div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredSessions.length === 0 ? (
        // State 3: EMPTY
        <div className="p-12 bg-surface-100/20 border border-white/[0.06] rounded-xl text-center space-y-3">
          <div className="w-12 h-12 bg-gray-800/60 text-gray-400 rounded-full flex items-center justify-center mx-auto">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-white">No booking calls found</div>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchTerm || decisionFilter !== 'all' || dateFilter
              ? 'No records match your selected filters. Try resetting the search or filter options.'
              : 'Outbound voice calls dispatched to barbers for slot acceptance will appear here in real time.'}
          </p>
        </div>
      ) : (
        // State 4: POPULATED TABLE
        <div className="overflow-x-auto bg-surface-100/30 border border-white/[0.06] rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-black/20 text-gray-400">
                <th className="py-3 px-4 font-semibold">Booking ID</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Barber</th>
                <th className="py-3 px-4 font-semibold">Shop</th>
                <th className="py-3 px-4 font-semibold">Call Status</th>
                <th className="py-3 px-4 font-semibold">Decision</th>
                <th className="py-3 px-4 font-semibold text-center">Retries</th>
                <th className="py-3 px-4 font-semibold">Created At</th>
                <th className="py-3 px-4 font-semibold">Provider Call ID</th>
                <th className="py-3 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredSessions.map((s) => {
                const dec = s.decision || 'pending';
                let badgeClass = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                if (dec === 'accepted') badgeClass = 'bg-teal-500/10 text-teal-400 border-teal-500/20';
                if (dec === 'declined') badgeClass = 'bg-red-500/10 text-red-400 border-red-500/20';
                if (dec === 'unclear') badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                return (
                  <tr
                    key={s._id || s.providerCallId}
                    onClick={() => setSelectedSession(s)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      {s.bookingId || s.queue?.queueNumber || (s.queue?._id ? `Q-${s.queue._id.slice(-4).toUpperCase()}` : null) || (s._id ? s._id.slice(-6).toUpperCase() : 'N/A')}
                    </td>
                    <td className="py-3 px-4 text-gray-200">
                      {s.customerName || s.customer?.name || s.queue?.walkInCustomer?.name || s.queue?.customer?.name || 'Customer'}
                    </td>
                    <td className="py-3 px-4 text-gray-200">
                      <div>{s.barberName || s.assignedUser?.name || 'Barber'}</div>
                      <div className="text-2xs text-gray-500">{s.destinationPhone}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{s.shopName || s.shop?.name || s.shopId?.slice(-6) || 'Main'}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-gray-300">{s.sessionStatus || 'completed'}</span>
                      {s.failureReason && (
                        <div className="text-2xs text-red-400 truncate max-w-[140px]">{s.failureReason}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-2xs font-semibold ${badgeClass}`}>
                        {dec === 'accepted' && <CheckCircle2 className="w-3 h-3" />}
                        {dec === 'declined' && <XCircle className="w-3 h-3" />}
                        {dec === 'pending' && <Clock className="w-3 h-3" />}
                        <span className="capitalize">{dec}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-gray-300">
                      {s.retryCount ?? 0} / {s.maxRetries ?? 2}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-2xs whitespace-nowrap">
                      {s.createdAt ? new Date(s.createdAt).toLocaleString('en-IN') : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono text-2xs text-gray-500 truncate max-w-[120px]">
                      {s.providerCallId || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-gray-500 inline-block" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Detail View Modal (Row Click) ────────────────────────────────────── */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-100 border border-white/[0.1] rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Call Session Details</h3>
                <p className="text-xs font-mono text-gray-400">ID: {selectedSession.providerCallId || selectedSession._id}</p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.05]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Session Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-black/40 rounded-lg">
                <span className="text-gray-500">Booking ID</span>
                <div className="text-white font-mono mt-0.5">
                  {selectedSession.bookingId || selectedSession.queue?.queueNumber || (selectedSession._id ? selectedSession._id.slice(-6).toUpperCase() : 'N/A')}
                </div>
              </div>
              <div className="p-3 bg-black/40 rounded-lg">
                <span className="text-gray-500">Decision</span>
                <div className="text-teal-400 font-bold capitalize mt-0.5">{selectedSession.decision || 'pending'}</div>
              </div>
              <div className="p-3 bg-black/40 rounded-lg">
                <span className="text-gray-500">Decision Source</span>
                <div className="text-white capitalize mt-0.5">{selectedSession.decisionSource || 'none'}</div>
              </div>
              <div className="p-3 bg-black/40 rounded-lg">
                <span className="text-gray-500">Barber</span>
                <div className="text-white mt-0.5">
                  {selectedSession.barberName || selectedSession.assignedUser?.name || 'Barber'} ({selectedSession.destinationPhone})
                </div>
              </div>
              <div className="p-3 bg-black/40 rounded-lg">
                <span className="text-gray-500">Customer</span>
                <div className="text-white mt-0.5">
                  {selectedSession.customerName || selectedSession.customer?.name || selectedSession.queue?.walkInCustomer?.name || selectedSession.queue?.customer?.name || 'Customer'}
                </div>
              </div>
              <div className="p-3 bg-black/40 rounded-lg">
                <span className="text-gray-500">Shop</span>
                <div className="text-white mt-0.5">
                  {selectedSession.shopName || selectedSession.shop?.name || 'Shop'}
                </div>
              </div>
              <div className="p-3 bg-black/40 rounded-lg">
                <span className="text-gray-500">Talk Duration</span>
                <div className="text-white mt-0.5">{selectedSession.durationSeconds || selectedSession.callDurationSeconds || 0} seconds</div>
              </div>
            </div>

            {/* Transcript Snippet */}
            {selectedSession.transcriptSnippet && (
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-medium">Voice Transcript Snippet:</span>
                <div className="p-3 bg-black/50 border border-white/[0.06] rounded-lg text-xs text-gray-300 font-sans">
                  &ldquo;{selectedSession.transcriptSnippet}&rdquo;
                </div>
              </div>
            )}

            {/* Webhook Payloads Timeline */}
            <div className="space-y-2">
              <span className="text-xs text-gray-400 font-medium">
                Webhook Event Timeline ({selectedSession.webhookPayloads?.length || 0} events):
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedSession.webhookPayloads && selectedSession.webhookPayloads.length > 0 ? (
                  selectedSession.webhookPayloads.map((wh, idx) => (
                    <div key={idx} className="p-2.5 bg-black/30 border border-white/[0.04] rounded-lg text-2xs space-y-1">
                      <div className="flex items-center justify-between text-gray-400">
                        <span className="font-mono text-teal-400">{wh.event}</span>
                        <span>{wh.receivedAt ? new Date(wh.receivedAt).toLocaleTimeString() : ''}</span>
                      </div>
                      <pre className="text-gray-500 overflow-x-auto p-1 bg-black/40 rounded">
                        {JSON.stringify(wh.payload, null, 2)}
                      </pre>
                    </div>
                  ))
                ) : (
                  <div className="text-2xs text-gray-500 italic p-2">No webhook raw events recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
      {/* ── Live AI Broadcast Campaign Tracker Modal ─────────────── */}
      <BroadcastTrackerModal
        isOpen={showTrackerModal}
        onClose={() => setShowTrackerModal(false)}
        campaignStatus={campaignStatus}
        onRefresh={pollBroadcastStatus}
        onControl={handleCampaignControl}
        isActionLoading={isActionLoading}
        onStartNew={() => {
          setShowTrackerModal(false);
          setShowBroadcastModal(true);
        }}
      />
    </div>
  );
}

