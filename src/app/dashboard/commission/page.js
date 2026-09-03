'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Wallet, Store, Calendar, Banknote, ShieldAlert, ScrollText,
  Search, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  ToggleLeft, ToggleRight, FileText, Loader2,
} from 'lucide-react';
import { authService } from '../../../services/auth';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.quttrr.com/api/v1';

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

async function api(path, options = {}) {
  const token = authService.getToken?.() || (typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null);
  const res = await fetch(`${API}/commission${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

const TABS = [
  { id: 'overview', name: 'Overview', icon: Wallet },
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
  const [editForm, setEditForm] = useState({ commissionEnabled: false, commissionPercent: 0, minWithdrawalAmount: 500 });
  const [saving, setSaving] = useState(false);

  const loadSummary = useCallback(async () => {
    const d = await api('/admin/summary');
    setSummary(d.data);
  }, []);

  const loadShops = useCallback(async () => {
    const d = await api(`/admin/shops?page=${shopPage}&limit=20&q=${encodeURIComponent(shopQ)}`);
    setShops(d.data || []);
    setShopPag(d.pagination || { totalPages: 1 });
  }, [shopPage, shopQ]);

  const loadBookings = useCallback(async () => {
    let qs = `page=${bookPage}&limit=20`;
    if (bookFilter === 'credited') qs += '&credited=true';
    if (bookFilter === 'fake') qs += '&fake=true';
    const d = await api(`/admin/bookings?${qs}`);
    setBookings(d.data || []);
    setBookPag(d.pagination || { totalPages: 1 });
  }, [bookPage, bookFilter]);

  const loadWithdrawals = useCallback(async () => {
    const d = await api(`/admin/withdrawals?page=${wdPage}&limit=20&status=${wdStatus}`);
    setWithdrawals(d.data || []);
    setWdPag(d.pagination || { totalPages: 1 });
  }, [wdPage, wdStatus]);

  const loadSuspicious = useCallback(async () => {
    const d = await api('/admin/suspicious');
    setSuspicious(d.alerts || []);
  }, []);

  const loadAudit = useCallback(async () => {
    const d = await api(`/admin/audit-logs?page=${auditPage}&limit=30`);
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

  // debounce shop search
  useEffect(() => {
    if (tab !== 'shops') return;
    const t = setTimeout(() => {
      setShopPage(1);
      loadShops().catch(() => {});
    }, 350);
    return () => clearTimeout(t);
  }, [shopQ]); // eslint-disable-line

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
      await api('/admin/set-commission', {
        method: 'POST',
        body: JSON.stringify({
          shopId: editShop._id,
          ...editForm,
        }),
      });
      setEditShop(null);
      await loadShops();
      await loadSummary().catch(() => {});
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const markFake = async (bookingId) => {
    const reason = prompt('Reason for marking this booking FAKE?');
    if (!reason) return;
    try {
      await api('/admin/mark-fake', {
        method: 'POST',
        body: JSON.stringify({ bookingId, reason }),
      });
      await loadBookings();
    } catch (e) {
      alert(e.message);
    }
  };

  const processWd = async (withdrawalId, action) => {
    let rejectionReason = '';
    let transactionReference = '';
    if (action === 'reject') {
      rejectionReason = prompt('Rejection reason?') || '';
      if (!rejectionReason) return;
    } else {
      transactionReference = prompt('Bank/UPI transaction reference?') || 'N/A';
    }
    try {
      const d = await api('/admin/process-withdrawal', {
        method: 'POST',
        body: JSON.stringify({ withdrawalId, action, rejectionReason, transactionReference }),
      });
      if (action === 'approve' && d.data?.documentUrl) {
        window.open(d.data.documentUrl, '_blank');
      }
      await loadWithdrawals();
      await loadSummary().catch(() => {});
    } catch (e) {
      alert(e.message);
    }
  };

  const cards = useMemo(() => {
    const t = summary?.totals || {};
    return [
      { label: 'Enabled Shops', value: summary?.enabledShops ?? '—', color: 'text-accent-500' },
      { label: 'Pending Withdrawals', value: summary?.pendingWithdrawals ?? '—', color: 'text-warning' },
      { label: 'Credited Today', value: summary?.creditedToday ?? '—', color: 'text-success' },
      { label: 'Fake Flags', value: summary?.fakeFlags ?? '—', color: 'text-error' },
      { label: 'Lifetime Earned', value: money(t.totalEarned), color: 'text-accent-500' },
      { label: 'Total Withdrawn', value: money(t.totalWithdrawn), color: 'text-white' },
    ];
  }, [summary]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-accent-500" />
            Commission Control
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Owner-only commissions · Staff services credit the shop owner · Fraud checks are silent
          </p>
        </div>
        <button onClick={refresh} className="btn-icon" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                active
                  ? 'bg-accent-500/15 text-accent-500 border border-accent-500/30'
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

      {loading && !summary && tab === 'overview' && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-accent-500" />
        </div>
      )}

      {/* OVERVIEW */}
      {tab === 'overview' && summary && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border border-white/[0.06] bg-surface-100/60 p-4 backdrop-blur"
            >
              <p className="text-2xs uppercase tracking-widest text-white/35">{c.label}</p>
              <p className={`text-xl font-bold mt-2 ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* SHOPS */}
      {tab === 'shops' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={shopQ}
              onChange={(e) => setShopQ(e.target.value)}
              placeholder="Search shop / phone..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm outline-none focus:border-accent-500/40"
            />
          </div>

          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
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
                    <tr key={s._id} className="border-t border-white/[0.05] hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-white/40">
                          {s.owner?.name || 'Owner'} · {s.owner?.phone || s.phone || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {s.commissionEnabled ? (
                          <span className="text-success text-xs font-semibold">ENABLED</span>
                        ) : (
                          <span className="text-white/30 text-xs">Off</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{s.commissionPercent || 0}%</td>
                      <td className="px-4 py-3">{money(s.minWithdrawalAmount || 500)}</td>
                      <td className="px-4 py-3 text-xs text-white/60">
                        <div>Earned {money(s.ownerWallet?.totalEarned)}</div>
                        <div>Avail {money(s.ownerWallet?.withdrawableBalance)}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(s)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-500/15 text-accent-500 border border-accent-500/20 hover:bg-accent-500/25"
                        >
                          Configure
                        </button>
                      </td>
                    </tr>
                  ))}
                  {shops.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-white/30">
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

      {/* BOOKINGS */}
      {tab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All completed' },
              { id: 'credited', label: 'Credited' },
              { id: 'fake', label: 'Marked fake' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setBookFilter(f.id);
                  setBookPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  bookFilter === f.id
                    ? 'border-accent-500/40 bg-accent-500/15 text-accent-500'
                    : 'border-white/10 text-white/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] text-white/40 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3">Booking</th>
                    <th className="text-left px-4 py-3">Shop / Staff</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">GPS / Time</th>
                    <th className="text-left px-4 py-3">Commission</th>
                    <th className="text-right px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const gapMin =
                      b.actualStartTime || b.completedAt
                        ? (
                            (new Date(b.actualStartTime || b.completedAt) - new Date(b.createdAt)) /
                            60000
                          ).toFixed(1)
                        : '—';
                    return (
                      <tr key={b._id} className="border-t border-white/[0.05] hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <div className="font-medium">{b.queueNumber || b._id.slice(-6)}</div>
                          <div className="text-xs text-white/40">{b.service?.name}</div>
                          <div className="text-xs text-white/30">{money(b.service?.price)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div>{b.shop?.name}</div>
                          <div className="text-xs text-white/40">Staff: {b.staff?.name || '—'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div>{b.customer?.name || '—'}</div>
                          <div className="text-xs text-white/40">{b.customer?.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div>
                            Dist:{' '}
                            {b.bookingLocation?.distanceFromShop != null
                              ? `${b.bookingLocation.distanceFromShop}m`
                              : 'N/A'}
                          </div>
                          <div>Gap: {gapMin} min</div>
                          {b.fraudReason && (
                            <div className="text-warning mt-1 max-w-[180px] truncate" title={b.fraudReason}>
                              {b.fraudReason}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {b.commissionFraudFlag ? (
                            <span className="text-error text-xs font-bold">FAKE</span>
                          ) : b.commissionCredited ? (
                            <span className="text-success text-xs font-bold">
                              {money(b.commissionAmount)} ({b.commissionPercent}%)
                            </span>
                          ) : (
                            <span className="text-white/30 text-xs">Not credited</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!b.commissionFraudFlag && (
                            <button
                              onClick={() => markFake(b._id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-error/10 text-error border border-error/20 hover:bg-error/20"
                            >
                              Mark Fake
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-white/30">
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

      {/* WITHDRAWALS */}
      {tab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {['pending', 'approved', 'rejected'].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setWdStatus(s);
                  setWdPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize ${
                  wdStatus === s
                    ? 'border-accent-500/40 bg-accent-500/15 text-accent-500'
                    : 'border-white/10 text-white/40'
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
                className="rounded-2xl border border-white/[0.06] bg-surface-100/50 p-4 flex flex-col lg:flex-row lg:items-center gap-4 justify-between"
              >
                <div>
                  <div className="font-semibold">
                    {money(w.amount)} · {w.shop?.name || 'Shop'}
                  </div>
                  <div className="text-xs text-white/40 mt-1">
                    Owner: {w.owner?.name || '—'} · {w.owner?.phone || '—'}
                  </div>
                  <div className="text-xs text-white/35 mt-1">
                    {w.payoutDetails?.upiId
                      ? `UPI: ${w.payoutDetails.upiId}`
                      : `A/C: ${w.payoutDetails?.accountNumber || '—'} / ${w.payoutDetails?.ifscCode || ''}`}
                  </div>
                  <div className="text-2xs text-white/25 mt-1">
                    {new Date(w.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {w.documentUrl && (
                    <a
                      href={w.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/60 hover:text-white flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> PDF
                    </a>
                  )}
                  {w.status === 'pending' && (
                    <>
                      <button
                        onClick={() => processWd(w._id, 'approve')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-success/15 text-success border border-success/20 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => processWd(w._id, 'reject')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-error/15 text-error border border-error/20 flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {withdrawals.length === 0 && (
              <div className="text-center text-white/30 py-12">No withdrawals</div>
            )}
          </div>
          <Pager page={wdPage} totalPages={wdPag.totalPages} onChange={setWdPage} />
        </div>
      )}

      {/* SUSPICIOUS */}
      {tab === 'suspicious' && (
        <div className="space-y-3">
          <p className="text-sm text-white/40">
            Same customer completing 3+ bookings at same shop within 24 hours.
          </p>
          {suspicious.map((a, idx) => (
            <div key={idx} className="rounded-xl border border-warning/20 bg-warning/5 p-4">
              <div className="font-semibold text-warning">
                {a.count} bookings · {money(a.totalPaid)}
              </div>
              <div className="text-sm mt-1">
                {a.shopName || 'Shop'} · {a.customerName || 'Customer'} ({a.customerPhone || '—'})
              </div>
            </div>
          ))}
          {suspicious.length === 0 && (
            <div className="text-center text-white/30 py-12">No suspicious patterns 🎉</div>
          )}
        </div>
      )}

      {/* AUDIT */}
      {tab === 'audit' && (
        <div className="space-y-3">
          {audits.map((log) => (
            <div key={log._id} className="rounded-xl border border-white/[0.06] p-4 bg-white/[0.02]">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-mono text-accent-500">{log.action}</div>
                <div className="text-2xs text-white/30">
                  {new Date(log.createdAt).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-sm mt-1">
                {log.adminName || log.admin?.name || 'Admin'}
                {log.reason ? ` — ${log.reason}` : ''}
              </div>
              {log.details && (
                <pre className="text-2xs text-white/35 mt-2 overflow-x-auto">
                  {JSON.stringify(log.details, null, 0)}
                </pre>
              )}
            </div>
          ))}
          <Pager page={auditPage} totalPages={auditPag.totalPages} onChange={setAuditPage} />
        </div>
      )}

      {/* Edit modal */}
      {editShop && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditShop(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-surface-100 p-6 shadow-elevation-4">
            <h3 className="text-lg font-bold">Configure Commission</h3>
            <p className="text-sm text-white/40 mt-1">{editShop.name}</p>

            <button
              onClick={() =>
                setEditForm((f) => ({ ...f, commissionEnabled: !f.commissionEnabled }))
              }
              className="mt-5 w-full flex items-center justify-between px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]"
            >
              <span className="text-sm">Enable for this owner</span>
              {editForm.commissionEnabled ? (
                <ToggleRight className="w-7 h-7 text-success" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-white/30" />
              )}
            </button>

            <label className="block mt-4 text-xs text-white/40 mb-1">Commission %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={editForm.commissionPercent}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, commissionPercent: parseFloat(e.target.value) || 0 }))
              }
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm outline-none focus:border-accent-500/40"
            />

            <label className="block mt-4 text-xs text-white/40 mb-1">Minimum Withdrawal (₹)</label>
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
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm outline-none focus:border-accent-500/40"
            />

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setEditShop(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/60"
              >
                Cancel
              </button>
              <button
                onClick={saveShopCommission}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-sm font-bold disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
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
        className="px-3 py-1.5 rounded-lg text-xs border border-white/10 disabled:opacity-30"
      >
        Prev
      </button>
      <span className="text-xs text-white/40">
        {page} / {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-1.5 rounded-lg text-xs border border-white/10 disabled:opacity-30"
      >
        Next
      </button>
    </div>
  );
}
