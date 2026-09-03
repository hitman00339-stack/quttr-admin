'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Wallet, Store, Calendar, Banknote, ShieldAlert, ScrollText,
  Search, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  ToggleLeft, ToggleRight, FileText, Loader2, TrendingUp,
  DollarSign, Users, X,
} from 'lucide-react';
import { authService } from '../../../services/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.quttrr.com/api/v1';

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────
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
  const token =
    (typeof authService.getToken === 'function' ? authService.getToken() : null) ||
    (typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null);

  const res = await fetch(`${API_BASE}/commission${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
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

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════
export default function CommissionPage() {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Overview
  const [summary, setSummary] = useState(null);

  // Shops
  const [shops, setShops] = useState([]);
  const [shopQ, setShopQ] = useState('');
  const [shopFilter, setShopFilter] = useState('all');
  const [shopPage, setShopPage] = useState(1);
  const [shopPag, setShopPag] = useState({ totalPages: 1 });

  // Bookings
  const [bookings, setBookings] = useState([]);
  const [bookPage, setBookPage] = useState(1);
  const [bookPag, setBookPag] = useState({ totalPages: 1 });
  const [bookFilter, setBookFilter] = useState('credited');

  // Withdrawals
  const [withdrawals, setWithdrawals] = useState([]);
  const [wdStatus, setWdStatus] = useState('pending');
  const [wdPage, setWdPage] = useState(1);
  const [wdPag, setWdPag] = useState({ totalPages: 1 });

  // Suspicious
  const [suspicious, setSuspicious] = useState([]);

  // Audit
  const [audits, setAudits] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPag, setAuditPag] = useState({ totalPages: 1 });

  // Modal state
  const [editShop, setEditShop] = useState(null);
  const [editForm, setEditForm] = useState({
    commissionEnabled: false,
    commissionPercent: 0,
    minWithdrawalAmount: 500,
  });
  const [saving, setSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── LOADERS ───
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

  // Debounced shop search
  useEffect(() => {
    if (tab !== 'shops') return;
    const t = setTimeout(() => {
      setShopPage(1);
      loadShops().catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [shopQ]); // eslint-disable-line

  // ─── ACTIONS ───
  const openEdit = (shop) => {
    setEditShop(shop);
    setEditForm({
      commissionEnabled: !!shop.commissionEnabled,
      commissionPercent: shop.commissionPercent || 0,
      minWithdrawalAmount: shop.minWithdrawalAmount || 500,
    });
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
      setEditShop(null);
      await loadShops();
      loadSummary().catch(() => {});
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
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
      loadSummary().catch(() => {});
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // ─── UI ───
  const cards = useMemo(() => {
    const t = summary?.totals || {};
    return [
      {
        label: 'Enabled Shops',
        value: summary?.enabledShops ?? '—',
        icon: Store,
        color: 'from-accent-500 to-accent-700',
      },
      {
        label: 'Pending Withdrawals',
        value: summary?.pendingWithdrawals ?? '—',
        icon: Banknote,
        color: 'from-warning to-yellow-600',
        highlight: (summary?.pendingWithdrawals || 0) > 0,
      },
      {
        label: 'Credited Today',
        value: summary?.creditedToday ?? '—',
        icon: TrendingUp,
        color: 'from-success to-green-600',
      },
      {
        label: 'Fake Flags',
        value: summary?.fakeFlags ?? '—',
        icon: ShieldAlert,
        color: 'from-error to-red-700',
      },
      {
        label: 'Lifetime Earned',
        value: money(t.totalEarned),
        icon: DollarSign,
        color: 'from-brand-500 to-brand-700',
        wide: true,
      },
      {
        label: 'Total Withdrawn',
        value: money(t.totalWithdrawn),
        icon: Wallet,
        color: 'from-business-500 to-business-800',
        wide: true,
      },
    ];
  }, [summary]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-accent-500" />
            Commission Control
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Owner-only commissions · Staff services credit the shop owner · Silent fraud checks
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm hover:bg-white/[0.08] transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ─── TABS ─── */}
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

      {/* ─── ERROR ─── */}
      {error && (
        <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* ─── LOADING ─── */}
      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-accent-500" />
        </div>
      )}

      {/* ═══════════ OVERVIEW ═══════════ */}
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
                    <p className="text-2xs uppercase tracking-widest text-white/35 font-semibold">
                      {c.label}
                    </p>
                    <p className="text-2xl font-bold mt-2">{c.value}</p>
                  </div>
                  <Icon className="w-5 h-5 text-white/30" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ SHOPS ═══════════ */}
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
                  onClick={() => {
                    setShopFilter(f);
                    setShopPage(1);
                  }}
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
                    <tr
                      key={s._id}
                      className="border-t border-white/[0.05] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-white/40 mt-0.5">
                          {s.owner?.name || 'Owner'} · {s.owner?.phone || s.phone || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {s.commissionEnabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/15 text-success text-xs font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                            ON
                          </span>
                        ) : (
                          <span className="text-white/30 text-xs">Off</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">{s.commissionPercent || 0}%</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {money(s.minWithdrawalAmount || 500)}
                      </td>
                      <td className="px-4 py-3 text-xs text-white/60">
                        <div>Earned: {money(s.ownerWallet?.totalEarned)}</div>
                        <div className="text-accent-500">
                          Avail: {money(s.ownerWallet?.withdrawableBalance)}
                        </div>
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
                      <td colSpan={6} className="px-4 py-16 text-center text-white/30">
                        No shops found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <Pager page={shopPage} totalPages={shopPag.totalPages} onChange={setShopPage} />
        </div>
      )}

      {/* ═══════════ BOOKINGS ═══════════ */}
      {tab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'credited', label: 'Credited' },
              { id: 'all', label: 'All completed' },
              { id: 'fake', label: 'Marked fake' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setBookFilter(f.id);
                  setBookPage(1);
                }}
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
                    const gap =
                      b.actualStartTime || b.completedAt
                        ? (
                            (new Date(b.actualStartTime || b.completedAt) -
                              new Date(b.createdAt)) /
                            60000
                          ).toFixed(1)
                        : '—';
                    return (
                      <tr
                        key={b._id}
                        className="border-t border-white/[0.05] hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium font-mono">
                            {b.queueNumber || `#${b._id.slice(-6)}`}
                          </div>
                          <div className="text-xs text-white/40">{b.service?.name}</div>
                          <div className="text-xs text-white/30">{money(b.service?.price)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs">{b.shop?.name}</div>
                          <div className="text-2xs text-white/40 mt-0.5">
                            Staff: {b.staff?.name || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs">{b.customer?.name || '—'}</div>
                          <div className="text-2xs text-white/40 mt-0.5">
                            {b.customer?.phone || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-2xs">
                          <div className="flex flex-col gap-0.5">
                            <span
                              className={
                                b.bookingLocation?.distanceFromShop >= 100
                                  ? 'text-success'
                                  : 'text-error'
                              }
                            >
                              📍{' '}
                              {b.bookingLocation?.distanceFromShop != null
                                ? `${b.bookingLocation.distanceFromShop}m`
                                : 'no gps'}
                            </span>
                            <span className={gap >= 5 ? 'text-success' : 'text-error'}>
                              ⏱ {gap} min gap
                            </span>
                            {b.fraudReason && (
                              <span
                                className="text-warning max-w-[160px] truncate"
                                title={b.fraudReason}
                              >
                                {b.fraudReason}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {b.commissionFraudFlag ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full bg-error/15 text-error text-2xs font-bold">
                              FAKE
                            </span>
                          ) : b.commissionCredited ? (
                            <div>
                              <div className="text-success text-xs font-bold">
                                {money(b.commissionAmount)}
                              </div>
                              <div className="text-2xs text-white/40">
                                {b.commissionPercent}%
                              </div>
                            </div>
                          ) : (
                            <span className="text-white/30 text-2xs">Not credited</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!b.commissionFraudFlag && (
                            <button
                              onClick={() => markFake(b)}
                              className="px-3 py-1.5 rounded-lg text-2xs font-semibold bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-colors"
                            >
                              Mark Fake
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {bookings.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center text-white/30">
                        No bookings
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <Pager page={bookPage} totalPages={bookPag.totalPages} onChange={setBookPage} />
        </div>
      )}

      {/* ═══════════ WITHDRAWALS ═══════════ */}
      {tab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['pending', 'approved', 'rejected'].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setWdStatus(s);
                  setWdPage(1);
                }}
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
              <div
                key={w._id}
                className="rounded-2xl border border-white/[0.06] bg-surface-100/50 p-4 backdrop-blur"
              >
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
                      <div className="text-xs text-error mt-2">
                        Rejected: {w.rejectionReason}
                      </div>
                    )}
                    {w.transactionReference && w.status === 'approved' && (
                      <div className="text-xs text-success mt-2">
                        Ref: {w.transactionReference}
                      </div>
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

      {/* ═══════════ SUSPICIOUS ═══════════ */}
      {tab === 'suspicious' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-warning/20 bg-warning/[0.05] p-4">
            <p className="text-sm text-warning font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Auto-Detection: Same customer completing 3+ bookings at same shop within 24 hours
            </p>
          </div>

          {suspicious.map((a, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-warning/20 bg-warning/[0.03] p-4 hover:bg-warning/[0.06] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-warning text-lg">{a.count}</span>
                    <span className="text-xs text-white/50">bookings ·</span>
                    <span className="text-sm font-semibold">{money(a.totalPaid)} total</span>
                  </div>
                  <div className="text-sm mt-2">
                    <span className="text-white/70">Shop:</span>{' '}
                    <span className="font-medium">{a.shopName || 'Unknown'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-white/70">Customer:</span>{' '}
                    <span className="font-medium">{a.customerName || 'Unknown'}</span>
                    {a.customerPhone && (
                      <span className="text-white/40 text-xs ml-2">({a.customerPhone})</span>
                    )}
                  </div>
                  <div className="text-2xs text-white/30 mt-2 font-mono">
                    IDs: {(a.bookingIds || []).map((id) => id.toString().slice(-6)).join(', ')}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setBookFilter('credited');
                    setTab('bookings');
                  }}
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

      {/* ═══════════ AUDIT ═══════════ */}
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
              <div
                key={log._id}
                className="rounded-xl border border-white/[0.06] p-4 bg-surface-100/40 hover:bg-surface-100/60 transition-colors"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span
                    className={`inline-flex px-2 py-1 rounded-md text-2xs font-bold border ${badge}`}
                  >
                    {log.action}
                  </span>
                  <div className="text-2xs text-white/30 font-mono">
                    {new Date(log.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-sm mt-2">
                  <span className="text-white/70">By:</span>{' '}
                  <span className="font-medium">
                    {log.adminName || log.admin?.name || 'Admin'}
                  </span>
                  {log.reason && (
                    <>
                      <span className="text-white/40 mx-2">·</span>
                      <span className="text-white/80">{log.reason}</span>
                    </>
                  )}
                </div>
                {log.details && (
                  <details className="mt-2">
                    <summary className="text-2xs text-white/40 cursor-pointer hover:text-white/60">
                      Details
                    </summary>
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
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setEditShop(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-surface-100 p-6 shadow-elevation-4 animate-scale-in">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="text-lg font-bold">Configure Commission</h3>
                <p className="text-sm text-white/40 mt-1">{editShop.name}</p>
                <p className="text-xs text-white/30 mt-0.5">
                  Owner: {editShop.owner?.name || '—'}
                </p>
              </div>
              <button
                onClick={() => setEditShop(null)}
                className="p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() =>
                setEditForm((f) => ({ ...f, commissionEnabled: !f.commissionEnabled }))
              }
              className="mt-5 w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
            >
              <div className="text-left">
                <div className="text-sm font-medium">Enable commission</div>
                <div className="text-2xs text-white/40 mt-0.5">
                  Owner will start earning from valid bookings
                </div>
              </div>
              {editForm.commissionEnabled ? (
                <ToggleRight className="w-9 h-9 text-success" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-white/30" />
              )}
            </button>

            <div className="mt-5">
              <label className="block text-xs text-white/50 mb-1.5 font-medium">
                Commission Percentage (0–100)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={editForm.commissionPercent}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      commissionPercent: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm outline-none focus:border-accent-500/40"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                  %
                </span>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs text-white/50 mb-1.5 font-medium">
                Minimum Withdrawal Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  value={editForm.minWithdrawalAmount}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      minWithdrawalAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm outline-none focus:border-accent-500/40"
                />
              </div>
            </div>

            <div className="mt-6 p-3 rounded-xl bg-warning/[0.05] border border-warning/20 text-2xs text-warning/80">
              ⚠ All changes are logged in Audit Log with your admin identity, IP address, and
              timestamp
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setEditShop(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/60 hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveShopCommission}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-sm font-bold shadow-brand disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOAST ─── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[90] animate-slide-up">
          <div
            className={`px-4 py-3 rounded-xl shadow-elevation-3 backdrop-blur border text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-error/20 border-error/40 text-error'
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

// ═══════════════════════════════════════════════════
// PAGINATION COMPONENT
// ═══════════════════════════════════════════════════
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
      <span className="text-xs text-white/40 px-3">
        Page {page} of {totalPages}
      </span>
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
