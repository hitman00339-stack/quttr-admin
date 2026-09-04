'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Wallet, Store, Calendar, Banknote, ShieldAlert, ScrollText,
  Search, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  ToggleLeft, ToggleRight, FileText, Loader2, TrendingUp,
  DollarSign, X, Zap, Undo2,
} from 'lucide-react';
import { authService } from '../../../services/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://quttr-backend.onrender.com/api/v1';

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

async function apiCall(path, options = {}) {
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('quttr_admin_token');
  }
  if (!token || token === 'null' || token === 'undefined') {
    throw new Error('Not logged in — please refresh or login again');
  }
  token = token.replace(/^Bearer\s+/i, '');
  const res = await fetch(`${API_BASE}/commission${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error(data.message || 'Invalid or expired token');
  if (res.status === 403) throw new Error(data.message || 'Access denied');
  if (!res.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

const TABS = [
  { id: 'overview', name: 'Overview', icon: TrendingUp },
  { id: 'shops', name: 'Shop Owners', icon: Store },
  { id: 'bookings', name: 'Bookings', icon: Calendar },
  { id: 'withdrawals', name: 'Withdrawals', icon: Banknote },
  { id: 'suspicious', name: 'Suspicious', icon: ShieldAlert },
  { id: 'audit', name: 'Audit Log', icon: ScrollText },
];

export default function CommissionPage() {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [summary, setSummary] = useState(null);

  const [shops, setShops] = useState([]);
  const [shopQ, setShopQ] = useState('');
  const [shopFilter, setShopFilter] = useState('all');
  const [shopPage, setShopPage] = useState(1);
  const [shopPag, setShopPag] = useState({ totalPages: 1 });

  const [bookings, setBookings] = useState([]);
  const [bookPage, setBookPage] = useState(1);
  const [bookPag, setBookPag] = useState({ totalPages: 1 });
  const [bookFilter, setBookFilter] = useState('all');

  const [withdrawals, setWithdrawals] = useState([]);
  const [wdStatus, setWdStatus] = useState('pending');
  const [wdPage, setWdPage] = useState(1);
  const [wdPag, setWdPag] = useState({ totalPages: 1 });

  const [suspicious, setSuspicious] = useState([]);

  const [audits, setAudits] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPag, setAuditPag] = useState({ totalPages: 1 });

  const [editShop, setEditShop] = useState(null);
  const [editForm, setEditForm] = useState({
    commissionEnabled: false,
    commissionPercent: 0,
    minWithdrawalAmount: 500,
  });
  const [saving, setSaving] = useState(false);

  const [shopServices, setShopServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [savingServiceIdx, setSavingServiceIdx] = useState(null);
  const [recalculatingId, setRecalculatingId] = useState(null);
  const [undoingId, setUndoingId] = useState(null);

  // ⭐ CONFIRMATION MODALS
  const [confirmCreditBooking, setConfirmCreditBooking] = useState(null);
  const [confirmUndoBooking, setConfirmUndoBooking] = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadSummary = useCallback(async () => {
    const d = await apiCall('/admin/summary');
    setSummary(d.data);
  }, []);

  const loadShops = useCallback(async () => {
    let qs = `page=${shopPage}&limit=20&q=${encodeURIComponent(shopQ)}`;
    if (shopFilter === 'enabled') qs += '&enabled=true';
    if (shopFilter === 'disabled') qs += '&enabled=false';
    const d = await apiCall(`/admin/shops?${qs}`);
    setShops(d.data || []);
    setShopPag(d.pagination || { totalPages: 1 });
  }, [shopPage, shopQ, shopFilter]);

  const loadBookings = useCallback(async () => {
    let qs = `page=${bookPage}&limit=20`;
    if (bookFilter === 'credited') qs += '&credited=true';
    if (bookFilter === 'fake') qs += '&fake=true';
    const d = await apiCall(`/admin/bookings?${qs}`);
    setBookings(d.data || []);
    setBookPag(d.pagination || { totalPages: 1 });
  }, [bookPage, bookFilter]);

  const loadWithdrawals = useCallback(async () => {
    const d = await apiCall(`/admin/withdrawals?page=${wdPage}&limit=20&status=${wdStatus}`);
    setWithdrawals(d.data || []);
    setWdPag(d.pagination || { totalPages: 1 });
  }, [wdPage, wdStatus]);

  const loadSuspicious = useCallback(async () => {
    const d = await apiCall('/admin/suspicious');
    setSuspicious(d.alerts || []);
  }, []);

  const loadAudit = useCallback(async () => {
    const d = await apiCall(`/admin/audit-logs?page=${auditPage}&limit=30`);
    setAudits(d.data || []);
    setAuditPag(d.pagination || { totalPages: 1 });
  }, [auditPage]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'overview') await loadSummary();
      if (tab === 'shops') await loadShops();
      if (tab === 'bookings') await loadBookings();
      if (tab === 'withdrawals') await loadWithdrawals();
      if (tab === 'suspicious') await loadSuspicious();
      if (tab === 'audit') await loadAudit();
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [tab, loadSummary, loadShops, loadBookings, loadWithdrawals, loadSuspicious, loadAudit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (tab !== 'shops') return;
    const t = setTimeout(() => {
      setShopPage(1);
      loadShops().catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [shopQ]); // eslint-disable-line

  const openEdit = async (shop) => {
    setEditShop(shop);
    setEditForm({
      commissionEnabled: !!shop.commissionEnabled,
      commissionPercent: shop.commissionPercent || 0,
      minWithdrawalAmount: shop.minWithdrawalAmount || 500,
    });
    setShopServices([]);
    setLoadingServices(true);
    try {
      const d = await apiCall(`/admin/shops/${shop._id}/services`);
      setShopServices(d.data?.services || []);
      if (d.data) {
        setEditForm({
          commissionEnabled: !!d.data.commissionEnabled,
          commissionPercent: d.data.commissionPercent || 0,
          minWithdrawalAmount: d.data.minWithdrawalAmount || 500,
        });
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoadingServices(false);
    }
  };

  const saveShopCommission = async () => {
    if (!editShop) return;
    setSaving(true);
    try {
      await apiCall('/admin/set-commission', {
        method: 'POST',
        body: JSON.stringify({ shopId: editShop._id, ...editForm }),
      });
      showToast('Commission settings saved ✓');
      try {
        const d = await apiCall(`/admin/shops/${editShop._id}/services`);
        setShopServices(d.data?.services || []);
      } catch (_) {}
      await loadShops();
      loadSummary().catch(() => {});
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleServiceCommission = async (serviceIndex, enabled) => {
    if (!editShop) return;
    setSavingServiceIdx(serviceIndex);
    try {
      const d = await apiCall('/admin/set-service-commission', {
        method: 'POST',
        body: JSON.stringify({
          shopId: editShop._id,
          serviceIndex,
          commissionEnabled: enabled,
        }),
      });
      setShopServices(d.data?.services || []);
      showToast(enabled ? 'Service commission ON ✓' : 'Service commission OFF ✓');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSavingServiceIdx(null);
    }
  };

  // ⭐ CONFIRMED CREDIT/SYNC (Idempotent — Never Doubles)
  const executeRecalculateBooking = async (booking) => {
    setRecalculatingId(booking._id);
    setConfirmCreditBooking(null);
    try {
      const res = await apiCall('/admin/recalculate-booking', {
        method: 'POST',
        body: JSON.stringify({ bookingId: booking._id }),
      });
      const isDup = res.alreadyCredited === true;
      showToast(res.message, isDup ? 'info' : 'success');
      await loadBookings();
      await loadShops();
      loadSummary().catch(() => {});
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setRecalculatingId(null);
    }
  };

  // ⭐ UNDO DUPLICATE CREDIT
  const executeUndoDuplicate = async (booking) => {
    setUndoingId(booking._id);
    setConfirmUndoBooking(null);
    try {
      const res = await apiCall('/admin/reverse-duplicate-commission', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: booking._id,
          reason: 'Manual undo by Admin — removed accidental over-credit',
        }),
      });
      showToast(res.message, 'success');
      await loadBookings();
      await loadShops();
      loadSummary().catch(() => {});
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setUndoingId(null);
    }
  };

  const markFake = async (booking) => {
    const reason = prompt(
      `Mark this booking as FAKE?\n\nBooking: ${booking.queueNumber || booking._id.slice(-6)}\nShop: ${booking.shop?.name}\nCustomer: ${booking.customer?.name}\n\nReason:`
    );
    if (!reason || reason.trim().length < 3) return;
    try {
      await apiCall('/admin/mark-fake', {
        method: 'POST',
        body: JSON.stringify({ bookingId: booking._id, reason: reason.trim() }),
      });
      showToast('Marked fake · commission reversed ✓');
      await loadBookings();
      await loadShops();
      loadSummary().catch(() => {});
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const processWd = async (wd, action) => {
    let rejectionReason = '';
    let transactionReference = '';
    if (action === 'reject') {
      rejectionReason = prompt('Rejection reason?');
      if (!rejectionReason) return;
    } else {
      transactionReference = prompt(
        `Approving payout of ${money(wd.amount)} to ${wd.owner?.name}.\n\nBank/UPI transaction reference:`
      );
      if (!transactionReference) return;
    }
    try {
      const d = await apiCall('/admin/process-withdrawal', {
        method: 'POST',
        body: JSON.stringify({
          withdrawalId: wd._id,
          action,
          rejectionReason,
          transactionReference,
        }),
      });
      showToast(`Withdrawal ${action}d ✓`);
      if (action === 'approve' && d.data?.documentUrl) {
        window.open(d.data.documentUrl, '_blank');
      }
      await loadWithdrawals();
      await loadShops();
      loadSummary().catch(() => {});
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const cards = useMemo(() => {
    const t = summary?.totals || {};
    return [
      { label: 'Enabled Shops', value: summary?.enabledShops ?? '—', icon: Store, color: 'from-accent-500 to-accent-700' },
      { label: 'Pending Withdrawals', value: summary?.pendingWithdrawals ?? '—', icon: Banknote, color: 'from-warning to-yellow-600', highlight: (summary?.pendingWithdrawals || 0) > 0 },
      { label: 'Credited Today', value: summary?.creditedToday ?? '—', icon: TrendingUp, color: 'from-success to-green-600' },
      { label: 'Fake Flags', value: summary?.fakeFlags ?? '—', icon: ShieldAlert, color: 'from-error to-red-700' },
      { label: 'Lifetime Earned', value: money(t.totalEarned), icon: DollarSign, color: 'from-brand-500 to-brand-700', wide: true },
      { label: 'Total Withdrawn', value: money(t.totalWithdrawn), icon: Wallet, color: 'from-business-500 to-business-800', wide: true },
    ];
  }, [summary]);

  const enabledServiceCount = shopServices.filter((s) => s.commissionEnabled).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-accent-500" />
            Commission Control
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Owner-only commissions · Per-service toggles · Silent fraud checks · Idempotent credits
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm hover:bg-white/[0.08] transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto no-scrollbar p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                active
                  ? 'bg-accent-500/15 text-accent-500 border border-accent-500/30 shadow-glow-sm'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.name}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}
      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-accent-500" />
        </div>
      )}

      {tab === 'overview' && summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.label}
                className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur transition-all hover:scale-[1.02] ${
                  c.highlight
                    ? 'border-warning/40 bg-warning/[0.05] animate-pulse-glow'
                    : 'border-white/[0.06] bg-surface-100/60'
                } ${c.wide ? 'col-span-2' : ''}`}
              >
                <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 bg-gradient-to-br ${c.color}`} />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-2xs uppercase tracking-widest text-white/35 font-semibold">{c.label}</p>
                    <p className="text-2xl font-bold mt-2">{c.value}</p>
                  </div>
                  <Icon className="w-5 h-5 text-white/30" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'shops' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={shopQ}
                onChange={(e) => setShopQ(e.target.value)}
                placeholder="Search shop name or phone..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm outline-none focus:border-accent-500/40"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'enabled', 'disabled'].map((f) => (
                <button
                  key={f}
                  onClick={() => { setShopFilter(f); setShopPage(1); }}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize border transition-colors ${
                    shopFilter === f
                      ? 'border-accent-500/40 bg-accent-500/15 text-accent-500'
                      : 'border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] overflow-hidden bg-surface-100/40">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] text-white/40 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3">Shop / Owner</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">%</th>
                    <th className="text-left px-4 py-3">Min WD</th>
                    <th className="text-left px-4 py-3">Wallet</th>
                    <th className="text-right px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shops.map((s) => (
                    <tr key={s._id} className="border-t border-white/[0.05] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-white/40 mt-0.5">
                          {s.owner?.name || 'Owner'} · {s.owner?.phone || s.phone || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {s.commissionEnabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 text-success text-xs font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> ON
                          </span>
                        ) : (
                          <span className="text-white/30 text-xs">Off</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">{s.commissionPercent || 0}%</td>
                      <td className="px-4 py-3 font-mono text-xs">{money(s.minWithdrawalAmount || 500)}</td>
                      <td className="px-4 py-3 text-xs text-white/60">
                        <div>Earned: {money(s.ownerWallet?.totalEarned)}</div>
                        <div className="text-accent-500">Avail: {money(s.ownerWallet?.withdrawableBalance)}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(s)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-500/15 text-accent-500 border border-accent-500/20 hover:bg-accent-500/25 transition-colors"
                        >
                          Configure
                        </button>
                      </td>
                    </tr>
                  ))}
                  {shops.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center text-white/30">No shops found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <Pager page={shopPage} totalPages={shopPag.totalPages} onChange={setShopPage} />
        </div>
      )}

      {tab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: 'All completed' },
              { id: 'credited', label: 'Credited (>₹0)' },
              { id: 'fake', label: 'Marked fake' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => { setBookFilter(f.id); setBookPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  bookFilter === f.id
                    ? 'border-accent-500/40 bg-accent-500/15 text-accent-500'
                    : 'border-white/10 text-white/40 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/[0.06] overflow-hidden bg-surface-100/40">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] text-white/40 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3">Booking</th>
                    <th className="text-left px-4 py-3">Shop / Staff</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Fraud Check</th>
                    <th className="text-left px-4 py-3">Commission</th>
                    <th className="text-right px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const gap = b.actualStartTime || b.completedAt
                      ? ((new Date(b.actualStartTime || b.completedAt) - new Date(b.createdAt)) / 60000).toFixed(1)
                      : '—';
                    const isCredited = b.commissionCredited && b.commissionAmount > 0;

                    return (
                      <tr key={b._id} className="border-t border-white/[0.05] hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <div className="font-medium font-mono">{b.queueNumber || `#${b._id.slice(-6)}`}</div>
                          <div className="text-xs text-white/40">{b.service?.name}</div>
                          <div className="text-xs text-white/30">{money(b.service?.price)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs">{b.shop?.name}</div>
                          <div className="text-2xs text-white/40 mt-0.5">Staff: {b.staff?.name || '—'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs">{b.customer?.name || '—'}</div>
                          <div className="text-2xs text-white/40 mt-0.5">{b.customer?.phone || '—'}</div>
                        </td>
                        <td className="px-4 py-3 text-2xs">
                          <div className="flex flex-col gap-0.5">
                            <span className={b.bookingLocation?.distanceFromShop >= 200 ? 'text-success' : 'text-error'}>
                              📍 {b.bookingLocation?.distanceFromShop != null ? `${b.bookingLocation.distanceFromShop}m` : 'no gps'}
                            </span>
                            <span className={gap >= 5 ? 'text-success' : 'text-error'}>⏱ {gap} min gap</span>
                            {b.fraudReason && (
                              <span className="text-warning max-w-[160px] truncate" title={b.fraudReason}>
                                {b.fraudReason}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {b.commissionFraudFlag ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full bg-error/15 text-error text-2xs font-bold">FAKE</span>
                          ) : isCredited ? (
                            <div>
                              <div className="text-success text-xs font-bold">{money(b.commissionAmount)}</div>
                              <div className="text-2xs text-white/40">{b.commissionPercent}%</div>
                            </div>
                          ) : (
                            <div>
                              <span className="text-white/30 text-2xs">₹0 (0%)</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {!b.commissionFraudFlag && (
                              <button
                                onClick={() => setConfirmCreditBooking(b)}
                                disabled={recalculatingId === b._id}
                                className={`px-2.5 py-1.5 rounded-lg text-2xs font-bold border transition-colors flex items-center gap-1 disabled:opacity-40 ${
                                  isCredited
                                    ? 'bg-white/[0.04] text-white/50 border-white/10 hover:bg-white/[0.08]'
                                    : 'bg-accent-500/15 text-accent-500 border-accent-500/30 hover:bg-accent-500/25'
                                }`}
                                title={isCredited ? 'Sync display only (won\'t double-credit)' : 'Credit commission to shop owner wallet'}
                              >
                                {recalculatingId === b._id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Zap className={`w-3 h-3 ${isCredited ? 'text-white/50' : 'text-accent-500'}`} />
                                )}
                                {isCredited ? 'Sync' : 'Credit'}
                              </button>
                            )}

                            {/* ⭐ UNDO DUPLICATE — Only if credited */}
                            {isCredited && !b.commissionFraudFlag && (
                              <button
                                onClick={() => setConfirmUndoBooking(b)}
                                disabled={undoingId === b._id}
                                className="px-2.5 py-1.5 rounded-lg text-2xs font-semibold bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20 transition-colors flex items-center gap-1 disabled:opacity-40"
                                title="Remove one duplicate credit (if double-credited by accident)"
                              >
                                {undoingId === b._id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Undo2 className="w-3 h-3" />
                                )}
                                Undo Dupe
                              </button>
                            )}

                            {!b.commissionFraudFlag && (
                              <button
                                onClick={() => markFake(b)}
                                className="px-2.5 py-1.5 rounded-lg text-2xs font-semibold bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-colors"
                              >
                                Mark Fake
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {bookings.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center text-white/30">No bookings</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <Pager page={bookPage} totalPages={bookPag.totalPages} onChange={setBookPage} />
        </div>
      )}

      {tab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['pending', 'approved', 'rejected'].map((s) => (
              <button
                key={s}
                onClick={() => { setWdStatus(s); setWdPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-colors ${
                  wdStatus === s
                    ? 'border-accent-500/40 bg-accent-500/15 text-accent-500'
                    : 'border-white/10 text-white/40 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w._id} className="rounded-2xl border border-white/[0.06] bg-surface-100/50 p-4 backdrop-blur">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{money(w.amount)}</span>
                      <span className="text-xs text-white/40">·</span>
                      <span className="text-sm font-medium">{w.shop?.name || 'Shop'}</span>
                    </div>
                    <div className="text-xs text-white/40 mt-1">
                      Owner: {w.owner?.name || '—'} · {w.owner?.phone || '—'}
                    </div>
                    <div className="text-xs text-white/35 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {w.payoutDetails?.upiId ? (
                        <span>💳 UPI: {w.payoutDetails.upiId}</span>
                      ) : (
                        <>
                          <span>🏦 A/C: {w.payoutDetails?.accountNumber || '—'}</span>
                          <span>IFSC: {w.payoutDetails?.ifscCode || '—'}</span>
                          <span>{w.payoutDetails?.bankName || ''}</span>
                        </>
                      )}
                    </div>
                    <div className="text-2xs text-white/25 mt-2">
                      🕐 {new Date(w.createdAt).toLocaleString('en-IN')} · {timeAgo(w.createdAt)}
                    </div>
                    {w.rejectionReason && (
                      <div className="text-xs text-error mt-2">Rejected: {w.rejectionReason}</div>
                    )}
                    {w.transactionReference && w.status === 'approved' && (
                      <div className="text-xs text-success mt-2">Ref: {w.transactionReference}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {w.documentUrl && (
                      <a
                        href={w.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-lg text-xs font-semibold border border-white/10 text-white/60 hover:text-white hover:border-white/30 flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" /> View PDF
                      </a>
                    )}
                    {w.status === 'pending' && (
                      <>
                        <button
                          onClick={() => processWd(w, 'approve')}
                          className="px-4 py-2 rounded-lg text-xs font-semibold bg-success/15 text-success border border-success/30 flex items-center gap-1.5 hover:bg-success/25 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => processWd(w, 'reject')}
                          className="px-4 py-2 rounded-lg text-xs font-semibold bg-error/15 text-error border border-error/30 flex items-center gap-1.5 hover:bg-error/25 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {withdrawals.length === 0 && !loading && (
              <div className="text-center text-white/30 py-16 rounded-2xl border border-white/[0.06] bg-surface-100/40">
                No {wdStatus} withdrawals
              </div>
            )}
          </div>
          <Pager page={wdPage} totalPages={wdPag.totalPages} onChange={setWdPage} />
        </div>
      )}

      {tab === 'suspicious' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-warning/20 bg-warning/[0.05] p-4">
            <p className="text-sm text-warning font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Auto-Detection: Same customer completing 3+ bookings at same shop within 24 hours
            </p>
          </div>
          {suspicious.map((a, idx) => (
            <div key={idx} className="rounded-xl border border-warning/20 bg-warning/[0.03] p-4 hover:bg-warning/[0.06] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-warning text-lg">{a.count}</span>
                    <span className="text-xs text-white/50">bookings ·</span>
                    <span className="text-sm font-semibold">{money(a.totalPaid)} total</span>
                  </div>
                  <div className="text-sm mt-2">
                    <span className="text-white/70">Shop:</span> <span className="font-medium">{a.shopName || 'Unknown'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-white/70">Customer:</span> <span className="font-medium">{a.customerName || 'Unknown'}</span>
                    {a.customerPhone && (<span className="text-white/40 text-xs ml-2">({a.customerPhone})</span>)}
                  </div>
                  <div className="text-2xs text-white/30 mt-2 font-mono">
                    IDs: {(a.bookingIds || []).map((id) => id.toString().slice(-6)).join(', ')}
                  </div>
                </div>
                <button
                  onClick={() => { setBookFilter('all'); setTab('bookings'); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-colors"
                >
                  Investigate
                </button>
              </div>
            </div>
          ))}
          {suspicious.length === 0 && !loading && (
            <div className="text-center text-white/30 py-16 rounded-2xl border border-white/[0.06] bg-surface-100/40">
              🎉 No suspicious patterns detected in last 24 hours
            </div>
          )}
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-2">
          {audits.map((log) => {
            const badge =
              log.action === 'MARK_BOOKING_FAKE'
                ? 'bg-error/15 text-error border-error/20'
                : log.action === 'APPROVE_WITHDRAWAL'
                ? 'bg-success/15 text-success border-success/20'
                : log.action === 'REJECT_WITHDRAWAL'
                ? 'bg-warning/15 text-warning border-warning/20'
                : 'bg-accent-500/15 text-accent-500 border-accent-500/20';
            return (
              <div key={log._id} className="rounded-xl border border-white/[0.06] p-4 bg-surface-100/40 hover:bg-surface-100/60 transition-colors">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className={`inline-flex px-2 py-1 rounded-md text-2xs font-bold border ${badge}`}>{log.action}</span>
                  <div className="text-2xs text-white/30 font-mono">{new Date(log.createdAt).toLocaleString('en-IN')}</div>
                </div>
                <div className="text-sm mt-2">
                  <span className="text-white/70">By:</span>{' '}
                  <span className="font-medium">{log.adminName || log.admin?.name || 'Admin'}</span>
                  {log.reason && (<><span className="text-white/40 mx-2">·</span><span className="text-white/80">{log.reason}</span></>)}
                </div>
                {log.details && (
                  <details className="mt-2">
                    <summary className="text-2xs text-white/40 cursor-pointer hover:text-white/60">Details</summary>
                    <pre className="text-2xs text-white/40 mt-2 p-2 rounded bg-black/40 overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            );
          })}
          {audits.length === 0 && !loading && (
            <div className="text-center text-white/30 py-16 rounded-2xl border border-white/[0.06] bg-surface-100/40">
              No audit logs yet
            </div>
          )}
          <Pager page={auditPage} totalPages={auditPag.totalPages} onChange={setAuditPage} />
        </div>
      )}

      {/* ═══════════ EDIT MODAL ═══════════ */}
      {editShop && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditShop(null)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-surface-100 p-6 shadow-elevation-4 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="text-lg font-bold">Configure Commission</h3>
                <p className="text-sm text-white/40 mt-1">{editShop.name}</p>
                <p className="text-xs text-white/30 mt-0.5">Owner: {editShop.owner?.name || '—'}</p>
              </div>
              <button onClick={() => setEditShop(null)} className="p-1 rounded-lg hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setEditForm((f) => ({ ...f, commissionEnabled: !f.commissionEnabled }))}
              className="mt-5 w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
            >
              <div className="text-left">
                <div className="text-sm font-medium">Enable commission (shop master)</div>
                <div className="text-2xs text-white/40 mt-0.5">
                  Turn ON to allow any per-service commission
                </div>
              </div>
              {editForm.commissionEnabled ? (
                <ToggleRight className="w-9 h-9 text-success" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-white/30" />
              )}
            </button>

            <div className="mt-5">
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Commission Percentage (0–100)</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={editForm.commissionPercent}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, commissionPercent: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm outline-none focus:border-accent-500/40"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">%</span>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Minimum Withdrawal Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">₹</span>
                <input
                  type="number"
                  min={0}
                  value={editForm.minWithdrawalAmount}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, minWithdrawalAmount: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm outline-none focus:border-accent-500/40"
                />
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-white/50 font-medium">Services eligible for commission</label>
                <span className="text-2xs text-white/30">
                  {enabledServiceCount}/{shopServices.length} ON
                </span>
              </div>

              {!editForm.commissionEnabled && (
                <div className="mb-2 text-2xs text-warning/80 px-2">
                  ⚠ Turn on shop master switch above first — then enable individual services.
                </div>
              )}

              {loadingServices ? (
                <div className="py-6 flex justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-accent-500" />
                </div>
              ) : shopServices.length === 0 ? (
                <div className="text-xs text-white/30 py-4 text-center border border-white/[0.06] rounded-xl">
                  No services on this shop
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 rounded-xl border border-white/[0.06] p-2 bg-white/[0.02]">
                  {shopServices.map((svc) => (
                    <div
                      key={svc.index}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                        svc.commissionEnabled
                          ? 'border-success/30 bg-success/[0.06]'
                          : 'border-white/[0.06] bg-white/[0.02]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{svc.name}</div>
                        <div className="text-2xs text-white/40">
                          ₹{svc.price} · {svc.duration}m
                          {svc.category ? ` · ${svc.category}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={savingServiceIdx === svc.index || !editForm.commissionEnabled}
                        onClick={() => toggleServiceCommission(svc.index, !svc.commissionEnabled)}
                        className="flex-shrink-0 disabled:opacity-40"
                      >
                        {savingServiceIdx === svc.index ? (
                          <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                        ) : svc.commissionEnabled ? (
                          <ToggleRight className="w-8 h-8 text-success" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-white/30" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setEditShop(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/60 hover:bg-white/[0.04] transition-colors"
              >
                Close
              </button>
              <button
                onClick={saveShopCommission}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-sm font-bold shadow-brand disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Master'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ CREDIT/SYNC CONFIRMATION MODAL */}
      {confirmCreditBooking && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setConfirmCreditBooking(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-accent-500/40 bg-surface-100 p-6 shadow-glow-md animate-scale-in">
            <div className="flex items-center gap-3 text-accent-500 mb-3">
              <div className="p-2 rounded-xl bg-accent-500/15 border border-accent-500/30">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {confirmCreditBooking.commissionCredited && confirmCreditBooking.commissionAmount > 0
                  ? 'Sync Booking Display'
                  : 'Confirm Commission Credit'}
              </h3>
            </div>

            <p className="text-sm text-white/70 leading-relaxed mb-4">
              {confirmCreditBooking.commissionCredited && confirmCreditBooking.commissionAmount > 0
                ? <>This booking is already credited. Clicking Sync will refresh display only — <span className="font-bold text-warning">no duplicate ₹ will be added.</span></>
                : <>Are you sure you want to credit commission for booking{' '}
                    <span className="font-mono text-white font-bold">
                      #{confirmCreditBooking.queueNumber || confirmCreditBooking._id.slice(-6)}
                    </span>{' '}
                    to <span className="text-accent-500 font-bold">{confirmCreditBooking.shop?.name}</span>?</>
              }
            </p>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs space-y-1.5 mb-5 text-white/60">
              <div>Service: <span className="text-white font-medium">{confirmCreditBooking.service?.name} ({money(confirmCreditBooking.service?.price)})</span></div>
              <div>Customer: <span className="text-white font-medium">{confirmCreditBooking.customer?.name} ({confirmCreditBooking.customer?.phone})</span></div>
              {confirmCreditBooking.commissionAmount > 0 && (
                <div className="pt-1 border-t border-white/5">
                  Current Credit: <span className="text-success font-bold">{money(confirmCreditBooking.commissionAmount)} ({confirmCreditBooking.commissionPercent}%)</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-info/[0.08] border border-info/20 text-2xs text-info mb-4">
              🔒 System is idempotent — same booking can never be credited twice.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCreditBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/60 hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => executeRecalculateBooking(confirmCreditBooking)}
                disabled={recalculatingId === confirmCreditBooking._id}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-amber-600 text-surface-100 text-sm font-bold shadow-glow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {recalculatingId === confirmCreditBooking._id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ UNDO DUPLICATE CONFIRMATION MODAL */}
      {confirmUndoBooking && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setConfirmUndoBooking(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-warning/40 bg-surface-100 p-6 shadow-glow-md animate-scale-in">
            <div className="flex items-center gap-3 text-warning mb-3">
              <div className="p-2 rounded-xl bg-warning/15 border border-warning/30">
                <Undo2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Undo Duplicate Credit</h3>
            </div>

            <p className="text-sm text-white/70 leading-relaxed mb-4">
              This will remove <span className="font-bold text-warning">{money(confirmUndoBooking.commissionAmount)}</span> from{' '}
              <span className="text-white font-bold">{confirmUndoBooking.shop?.name}</span>'s wallet.
            </p>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs space-y-1.5 mb-4 text-white/60">
              <div>Booking: <span className="font-mono text-white">#{confirmUndoBooking.queueNumber || confirmUndoBooking._id.slice(-6)}</span></div>
              <div>Currently Credited: <span className="text-success font-bold">{money(confirmUndoBooking.commissionAmount)}</span></div>
              <div className="pt-1 border-t border-white/5 text-warning">After Undo: -{money(confirmUndoBooking.commissionAmount)} from owner wallet</div>
            </div>

            <div className="p-3 rounded-xl bg-warning/[0.08] border border-warning/20 text-2xs text-warning mb-5">
              ⚠️ Use ONLY if a duplicate/over-credit happened. This action is logged in Audit Log with your admin identity.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmUndoBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/60 hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => executeUndoDuplicate(confirmUndoBooking)}
                disabled={undoingId === confirmUndoBooking._id}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-warning to-orange-600 text-white text-sm font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {undoingId === confirmUndoBooking._id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Undo2 className="w-4 h-4" />
                    Confirm Undo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] animate-slide-up">
          <div
            className={`px-4 py-3 rounded-xl shadow-elevation-3 backdrop-blur border text-sm font-medium max-w-md ${
              toast.type === 'error'
                ? 'bg-error/20 border-error/40 text-error'
                : toast.type === 'info'
                ? 'bg-warning/20 border-warning/40 text-warning'
                : 'bg-success/20 border-success/40 text-success'
            }`}
          >
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}

function Pager({ page, totalPages = 1, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-1.5 rounded-lg text-xs border border-white/10 disabled:opacity-30 hover:bg-white/[0.04] transition-colors"
      >
        ← Prev
      </button>
      <span className="text-xs text-white/40 px-3">Page {page} of {totalPages}</span>
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-1.5 rounded-lg text-xs border border-white/10 disabled:opacity-30 hover:bg-white/[0.04] transition-colors"
      >
        Next →
      </button>
    </div>
  );
}
