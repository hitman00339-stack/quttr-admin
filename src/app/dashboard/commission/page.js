'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, Users, TrendingUp, ShieldAlert, Wallet, FileText,
  CheckCircle2, XCircle, Clock, Download, Search, ArrowUpRight,
  ArrowDownRight, Filter, Sparkles, AlertTriangle, Percent,
  ChevronRight, Eye, ToggleLeft, ToggleRight, Award, Activity,
  Building2, Phone, IndianRupee, Calendar, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';

export default function CommissionPage() {
  const [activeTab, setActiveTab] = useState('barbers');
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [fraudLogs, setFraudLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'barbers') {
        const res = await api.get('/commission/admin/staff');
        setStaffList(res.data.staff || []);
      } else if (activeTab === 'withdrawals') {
        const res = await api.get('/commission/admin/withdrawals');
        setWithdrawals(res.data.withdrawals || []);
      } else if (activeTab === 'fraud') {
        const res = await api.get('/commission/admin/fraud-logs');
        setFraudLogs(res.data.logs || []);
      } else if (activeTab === 'audit') {
        const res = await api.get('/commission/admin/audit-logs');
        setAuditLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ─── Stats Aggregation ───────────────────────────────
  const stats = useMemo(() => {
    const enabledCount = staffList.filter(s => s.commissionEnabled).length;
    const totalWallet = staffList.reduce((sum, s) => sum + (s.commissionWallet || 0), 0);
    const totalEarned = staffList.reduce((sum, s) => sum + (s.commissionTotalEarned || 0), 0);
    const totalWithdrawn = staffList.reduce((sum, s) => sum + (s.commissionTotalWithdrawn || 0), 0);
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;

    return { enabledCount, totalWallet, totalEarned, totalWithdrawn, pendingWithdrawals };
  }, [staffList, withdrawals]);

  // ─── Actions ─────────────────────────────────────────
  const updateCommissionSettings = async (staffId, enabled, percent, minWithdraw) => {
    try {
      await api.put('/commission/admin/set', {
        staffId, enabled, percent: parseFloat(percent), minWithdraw: parseFloat(minWithdraw),
      });
      toast.success('Settings saved');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const approveWithdrawal = async (id) => {
    const ref = prompt('Enter UTR / UPI Reference Number:');
    if (!ref) return;
    const method = prompt('Payment method: upi / bank / cash', 'upi');
    if (!method) return;

    try {
      await api.post('/commission/admin/withdrawal/approve', {
        withdrawalId: id, paymentReference: ref, paymentMethod: method,
      });
      toast.success('Withdrawal approved & paid ✓');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const rejectWithdrawal = async (id) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;

    try {
      await api.post('/commission/admin/withdrawal/reject', { withdrawalId: id, reason });
      toast.success('Withdrawal rejected');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const markBookingFake = async (queueId) => {
    const reason = prompt('Reason for marking fake:');
    if (!reason) return;
    try {
      await api.post('/commission/admin/mark-fake', { queueId, reason });
      toast.success('Booking marked as fake, commission reversed');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const generateCertificate = async (withdrawalId) => {
    const loadingToast = toast.loading('Generating certificate...');
    try {
      const res = await api.get(`/commission/admin/withdrawal/${withdrawalId}/certificate`);
      toast.dismiss(loadingToast);
      printCertificate(res.data);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to generate');
    }
  };

  // ─── Filtered Data ───────────────────────────────────
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const matchSearch = !searchQuery ||
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone?.includes(searchQuery);
      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'enabled' && s.commissionEnabled) ||
        (statusFilter === 'disabled' && !s.commissionEnabled);
      return matchSearch && matchStatus;
    });
  }, [staffList, searchQuery, statusFilter]);

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter(w => {
      if (statusFilter === 'all') return true;
      return w.status === statusFilter;
    });
  }, [withdrawals, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-2xs uppercase tracking-widest text-success font-semibold">
              Commission System · Live
            </span>
          </div>
          <h1 className="text-display">
            Commission <span className="text-gradient">& Payouts</span>
          </h1>
          <p className="text-body mt-2">
            Manage barber commissions, verify real bookings, and issue official payment certificates.
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={loadData} className="btn-outline">
            <Activity className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Active Barbers"
          value={stats.enabledCount}
          sub={`of ${staffList.length} total`}
          icon={Users}
          color="from-blue-500 to-blue-700"
        />
        <KPICard
          label="Live Wallet Balance"
          value={`₹${stats.totalWallet.toLocaleString('en-IN')}`}
          sub="pending payout"
          icon={Wallet}
          color="from-amber-500 to-amber-700"
        />
        <KPICard
          label="Total Earned (All Time)"
          value={`₹${stats.totalEarned.toLocaleString('en-IN')}`}
          sub="commission credited"
          icon={TrendingUp}
          color="from-emerald-500 to-emerald-700"
        />
        <KPICard
          label="Pending Withdrawals"
          value={stats.pendingWithdrawals}
          sub={`₹${stats.totalWithdrawn.toLocaleString('en-IN')} paid out`}
          icon={Clock}
          color="from-purple-500 to-purple-700"
          urgent={stats.pendingWithdrawals > 0}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-2xl border border-white/[0.06] w-fit">
        {[
          { id: 'barbers', label: 'Barbers', icon: Users, count: staffList.length },
          { id: 'withdrawals', label: 'Withdrawals', icon: Wallet, count: stats.pendingWithdrawals, badge: stats.pendingWithdrawals > 0 },
          { id: 'fraud', label: 'Fraud Logs', icon: ShieldAlert, count: fraudLogs.length },
          { id: 'audit', label: 'Audit Trail', icon: FileText, count: auditLogs.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-black shadow-lg'
                : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-2xs font-bold bg-accent-500 text-white">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm placeholder:text-white/30 focus:outline-none focus:border-brand-500/50 focus:bg-white/[0.05] transition-all"
          />
        </div>

        {(activeTab === 'barbers' || activeTab === 'withdrawals') && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-white/40" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm focus:outline-none focus:border-brand-500/50"
            >
              <option value="all">All</option>
              {activeTab === 'barbers' && (
                <>
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </>
              )}
              {activeTab === 'withdrawals' && (
                <>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="rejected">Rejected</option>
                </>
              )}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : (
        <>
          {activeTab === 'barbers' && (
            <BarbersTable
              staff={filteredStaff}
              onUpdate={updateCommissionSettings}
            />
          )}

          {activeTab === 'withdrawals' && (
            <WithdrawalsTable
              withdrawals={filteredWithdrawals}
              onApprove={approveWithdrawal}
              onReject={rejectWithdrawal}
              onCertificate={generateCertificate}
            />
          )}

          {activeTab === 'fraud' && <FraudLogsTable logs={fraudLogs} onMarkFake={markBookingFake} />}

          {activeTab === 'audit' && <AuditLogsTable logs={auditLogs} />}
        </>
      )}
    </div>
  );
}

/* ─── KPI CARD ────────────────────────────────────────── */
function KPICard({ label, value, sub, icon: Icon, color, urgent }) {
  return (
    <div className={`stat-card ${urgent ? 'ring-1 ring-accent-500/40' : ''}`}>
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-[0.08] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
      <div className="flex items-center justify-between mb-4">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} bg-opacity-10 flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="text-xs font-medium mt-2 text-white/50">{sub}</p>
    </div>
  );
}

/* ─── BARBERS TABLE ────────────────────────────────────── */
function BarbersTable({ staff, onUpdate }) {
  if (staff.length === 0) return <EmptyState icon={Users} title="No barbers found" desc="Try changing your search or filter." />;

  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead className="border-b border-white/[0.06] bg-white/[0.02]">
          <tr>
            <th className="text-left px-6 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Barber</th>
            <th className="text-center px-4 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Status</th>
            <th className="text-center px-4 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Commission %</th>
            <th className="text-center px-4 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Min Withdraw</th>
            <th className="text-right px-4 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Wallet</th>
            <th className="text-right px-4 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Lifetime</th>
            <th className="text-center px-6 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => <BarberRow key={s._id} staff={s} onUpdate={onUpdate} />)}
        </tbody>
      </table>
    </div>
  );
}

function BarberRow({ staff, onUpdate }) {
  const [percent, setPercent] = useState(staff.commissionPercent || 0);
  const [minWithdraw, setMinWithdraw] = useState(staff.commissionMinWithdraw || 500);

  return (
    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center font-bold text-white text-sm">
            {(staff.name || 'B')[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-sm">{staff.name || 'Unknown'}</div>
            <div className="text-xs text-white/40 flex items-center gap-2 mt-0.5">
              <Phone className="w-3 h-3" />
              {staff.phone}
              {staff.shop?.name && (
                <>
                  <span className="text-white/20">•</span>
                  <Building2 className="w-3 h-3" />
                  {staff.shop.name}
                </>
              )}
            </div>
          </div>
        </div>
      </td>

      <td className="px-4 py-4 text-center">
        {staff.commissionEnabled ? (
          <span className="chip-success">
            <CheckCircle2 className="w-3 h-3" /> Enabled
          </span>
        ) : (
          <span className="chip-neutral">
            <XCircle className="w-3 h-3" /> Disabled
          </span>
        )}
      </td>

      <td className="px-4 py-4 text-center">
        <div className="inline-flex items-center gap-1">
          <input
            type="number"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            onBlur={() => onUpdate(staff._id, staff.commissionEnabled, percent, minWithdraw)}
            className="w-16 px-2 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-center text-sm font-semibold focus:outline-none focus:border-brand-500/50"
            min="0" max="100" step="0.5"
          />
          <span className="text-white/40 text-sm">%</span>
        </div>
      </td>

      <td className="px-4 py-4 text-center">
        <div className="inline-flex items-center gap-1">
          <span className="text-white/40 text-sm">₹</span>
          <input
            type="number"
            value={minWithdraw}
            onChange={(e) => setMinWithdraw(e.target.value)}
            onBlur={() => onUpdate(staff._id, staff.commissionEnabled, percent, minWithdraw)}
            className="w-20 px-2 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-center text-sm font-semibold focus:outline-none focus:border-brand-500/50"
            min="0" step="100"
          />
        </div>
      </td>

      <td className="px-4 py-4 text-right">
        <div className="font-bold text-brand-500">₹{(staff.commissionWallet || 0).toLocaleString('en-IN')}</div>
      </td>

      <td className="px-4 py-4 text-right">
        <div className="text-sm font-semibold text-emerald-400">₹{(staff.commissionTotalEarned || 0).toLocaleString('en-IN')}</div>
        <div className="text-2xs text-white/40 mt-0.5">₹{(staff.commissionTotalWithdrawn || 0).toLocaleString('en-IN')} paid</div>
      </td>

      <td className="px-6 py-4 text-center">
        <button
          onClick={() => onUpdate(staff._id, !staff.commissionEnabled, percent, minWithdraw)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            staff.commissionEnabled
              ? 'bg-white/[0.05] hover:bg-red-500/10 text-white/70 hover:text-red-400 border border-white/[0.08]'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {staff.commissionEnabled ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
          {staff.commissionEnabled ? 'Disable' : 'Enable'}
        </button>
      </td>
    </tr>
  );
}

/* ─── WITHDRAWALS TABLE ────────────────────────────────── */
function WithdrawalsTable({ withdrawals, onApprove, onReject, onCertificate }) {
  if (withdrawals.length === 0) return <EmptyState icon={Wallet} title="No withdrawal requests" desc="All caught up! No pending withdrawals." />;

  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead className="border-b border-white/[0.06] bg-white/[0.02]">
          <tr>
            <th className="text-left px-6 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Requested</th>
            <th className="text-left px-4 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Barber</th>
            <th className="text-right px-4 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Amount</th>
            <th className="text-left px-4 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Payment Details</th>
            <th className="text-center px-4 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Status</th>
            <th className="text-center px-6 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.map((w) => (
            <tr key={w._id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
              <td className="px-6 py-4">
                <div className="text-sm">{new Date(w.requestedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                <div className="text-2xs text-white/40 mt-0.5">
                  {new Date(w.requestedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="font-semibold text-sm">{w.staff?.name || 'Unknown'}</div>
                <div className="text-xs text-white/40 mt-0.5">{w.shop?.name}</div>
              </td>
              <td className="px-4 py-4 text-right">
                <div className="font-bold text-brand-500 text-lg">₹{w.amount.toLocaleString('en-IN')}</div>
              </td>
              <td className="px-4 py-4">
                <div className="text-xs bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 font-mono max-w-xs">
                  {w.bankSnapshot?.upiId ? (
                    <div>
                      <div className="text-brand-500 font-semibold">UPI</div>
                      <div className="text-white/70 mt-0.5">{w.bankSnapshot.upiId}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-brand-500 font-semibold">{w.bankSnapshot?.bankName || 'BANK'}</div>
                      <div className="text-white/70 mt-0.5">A/C: {w.bankSnapshot?.accountNumber}</div>
                      <div className="text-white/50 text-2xs">IFSC: {w.bankSnapshot?.ifscCode}</div>
                    </div>
                  )}
                  <div className="text-white/40 text-2xs mt-1 border-t border-white/[0.05] pt-1">
                    {w.bankSnapshot?.accountHolderName}
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-center">
                <StatusChip status={w.status} />
                {w.paymentReference && (
                  <div className="text-2xs text-white/40 mt-1 font-mono">Ref: {w.paymentReference}</div>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 justify-center">
                  {w.status === 'pending' && (
                    <>
                      <button onClick={() => onApprove(w._id)} className="btn-primary btn-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button onClick={() => onReject(w._id)} className="btn-outline btn-sm text-red-400 hover:bg-red-500/10 hover:border-red-500/30">
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {(w.status === 'paid' || w.status === 'approved') && (
                    <button onClick={() => onCertificate(w._id)} className="btn-primary btn-sm">
                      <Award className="w-3.5 h-3.5" />
                      Certificate
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── FRAUD LOGS TABLE ─────────────────────────────────── */
function FraudLogsTable({ logs, onMarkFake }) {
  if (logs.length === 0) return <EmptyState icon={ShieldAlert} title="No fraud detected" desc="All bookings are passing fraud checks. System is clean! 🛡️" />;

  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead className="border-b border-white/[0.06] bg-white/[0.02]">
          <tr>
            <th className="text-left px-6 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Detected</th>
            <th className="text-left px-4 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Barber</th>
            <th className="text-left px-4 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Violation</th>
            <th className="text-left px-4 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Details</th>
            <th className="text-center px-6 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log._id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
              <td className="px-6 py-4">
                <div className="text-sm">{new Date(log.detectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                <div className="text-2xs text-white/40">
                  {new Date(log.detectedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="font-semibold text-sm">{log.staff?.name || 'Unknown'}</div>
                <div className="text-xs text-white/40">{log.shop?.name}</div>
              </td>
              <td className="px-4 py-4">
                <span className="chip-warning text-2xs">
                  <AlertTriangle className="w-3 h-3" />
                  {log.checkType.replace(/_/g, ' ').toUpperCase()}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="text-sm text-white/80">{log.reason}</div>
              </td>
              <td className="px-6 py-4 text-center">
                {log.queue && (
                  <button onClick={() => onMarkFake(log.queue._id)} className="btn-outline btn-sm text-red-400 hover:bg-red-500/10 hover:border-red-500/30">
                    Mark Fake
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── AUDIT LOGS TABLE ─────────────────────────────────── */
function AuditLogsTable({ logs }) {
  if (logs.length === 0) return <EmptyState icon={FileText} title="No audit logs" desc="Admin actions will appear here." />;

  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead className="border-b border-white/[0.06] bg-white/[0.02]">
          <tr>
            <th className="text-left px-6 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Time</th>
            <th className="text-left px-4 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Admin</th>
            <th className="text-left px-4 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Action</th>
            <th className="text-left px-4 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">Description</th>
            <th className="text-left px-6 py-4 text-2xs uppercase tracking-widest text-white/40 font-semibold">IP</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log._id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
              <td className="px-6 py-4 text-xs text-white/60 whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="px-4 py-4 text-sm font-semibold">{log.adminName || 'Admin'}</td>
              <td className="px-4 py-4">
                <span className="chip-neutral text-2xs">{log.action.replace(/_/g, ' ').toUpperCase()}</span>
              </td>
              <td className="px-4 py-4 text-sm text-white/70">{log.description}</td>
              <td className="px-6 py-4 text-2xs text-white/40 font-mono">{log.ipAddress || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── HELPERS ────────────────────────────────────────── */
function StatusChip({ status }) {
  const styles = {
    pending: 'chip-warning',
    approved: 'chip-neutral',
    paid: 'chip-success',
    rejected: 'chip-danger',
  };
  return <span className={`${styles[status] || 'chip-neutral'} capitalize`}>{status}</span>;
}

function EmptyState({ icon: Icon, title, desc }) {
  return (
    <div className="card p-16 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
        <Icon className="w-6 h-6 text-white/40" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-white/50">{desc}</p>
    </div>
  );
}

/* ─── CERTIFICATE GENERATOR ────────────────────────────── */
function printCertificate({ withdrawal, transactions }) {
  const w = withdrawal;
  const s = w.staff || {};
  const shop = w.shop || s.shop || {};
  const bank = w.bankSnapshot || {};
  const amountInWords = numberToWords(Math.round(w.amount));
  const totalServiceValue = transactions.reduce((sum, t) => sum + (t.servicePrice || 0), 0);
  const periodStart = w.periodStart ? new Date(w.periodStart).toLocaleDateString('en-IN') : '—';
  const periodEnd = w.periodEnd ? new Date(w.periodEnd).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const issueDate = new Date(w.paidAt || w.certificateGeneratedAt || new Date()).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Payment Certificate ${w.certificateNumber}</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #fff; }
  .page {
    width: 210mm; min-height: 297mm; padding: 20mm; position: relative; background: #fff;
    background-image: 
      radial-gradient(circle at 100% 0%, rgba(255,215,0,0.04) 0%, transparent 50%),
      radial-gradient(circle at 0% 100%, rgba(230,57,70,0.03) 0%, transparent 50%);
  }
  .watermark {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-15deg);
    width: 400px; opacity: 0.04; pointer-events: none; z-index: 0;
  }
  .content { position: relative; z-index: 1; }
  
  /* HEADER */
  .header {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding-bottom: 20px; border-bottom: 3px solid #FFD700; margin-bottom: 30px;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand-logo { width: 60px; height: 60px; object-fit: contain; }
  .brand-text h1 { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #000; }
  .brand-text p { font-size: 10px; color: #666; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }
  
  .cert-meta { text-align: right; }
  .cert-badge {
    display: inline-block; padding: 6px 12px; background: linear-gradient(135deg, #FFD700, #FFA500);
    color: #000; font-size: 10px; font-weight: 800; letter-spacing: 2px; border-radius: 4px;
    text-transform: uppercase; margin-bottom: 8px;
  }
  .cert-no { font-size: 11px; color: #666; font-family: 'Courier New', monospace; }
  .cert-date { font-size: 12px; color: #333; margin-top: 4px; font-weight: 600; }
  
  /* TITLE */
  .title-box {
    text-align: center; padding: 24px 0; margin-bottom: 30px;
    background: linear-gradient(135deg, #FAF8F0 0%, #FFF9E6 100%);
    border-radius: 8px; border: 1px solid rgba(255,215,0,0.2);
  }
  .title-eyebrow { font-size: 11px; color: #8B0000; letter-spacing: 4px; text-transform: uppercase; font-weight: 700; }
  .title { font-size: 28px; font-weight: 900; color: #000; margin-top: 6px; letter-spacing: -0.5px; }
  .subtitle { font-size: 12px; color: #666; margin-top: 6px; font-style: italic; }
  
  /* INFO GRID */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
  .info-card {
    padding: 16px 18px; background: #fafafa; border-radius: 8px; border: 1px solid #eee;
  }
  .info-card-title {
    font-size: 9px; color: #999; letter-spacing: 2px; text-transform: uppercase;
    font-weight: 700; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #eee;
  }
  .info-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 4px 0; font-size: 12px; }
  .info-label { color: #666; font-weight: 500; }
  .info-value { color: #000; font-weight: 600; text-align: right; }
  
  /* AMOUNT BOX */
  .amount-box {
    background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
    color: #FFD700; padding: 20px 24px; border-radius: 10px; margin-bottom: 30px;
    display: flex; justify-content: space-between; align-items: center;
    border: 2px solid #FFD700;
  }
  .amount-label { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; opacity: 0.7; font-weight: 700; }
  .amount-value { font-size: 32px; font-weight: 900; margin-top: 4px; letter-spacing: -1px; }
  .amount-words { font-size: 11px; opacity: 0.7; margin-top: 6px; font-style: italic; }
  .amount-icon { font-size: 40px; opacity: 0.3; }
  
  /* TABLE */
  .section-title {
    font-size: 12px; color: #000; letter-spacing: 2px; text-transform: uppercase;
    font-weight: 800; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #000;
  }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
  thead th {
    background: #000; color: #FFD700; text-align: left; padding: 10px 12px;
    font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 800;
  }
  thead th:first-child { border-radius: 6px 0 0 0; }
  thead th:last-child { border-radius: 0 6px 0 0; text-align: right; }
  tbody td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
  tbody tr:nth-child(even) { background: #fafafa; }
  tbody tr:hover { background: #fffbe6; }
  .amt-cell { text-align: right; font-weight: 700; color: #000; }
  .commission-cell { text-align: right; font-weight: 700; color: #00796b; }
  tfoot { background: #FFF9E6; font-weight: 800; }
  tfoot td { padding: 12px; border-top: 2px solid #FFD700; font-size: 12px; }
  tfoot .total-amount { color: #8B0000; font-size: 14px; }
  
  /* FOOTER */
  .footer { display: grid; grid-template-columns: 1fr auto 1fr; gap: 40px; margin-top: 40px; align-items: end; }
  .signature-box { text-align: center; }
  .signature-line { height: 50px; margin-bottom: 8px; display: flex; align-items: flex-end; justify-content: center; }
  .signature-line img { max-height: 50px; max-width: 180px; }
  .signature-title { font-size: 11px; font-weight: 700; color: #000; padding-top: 6px; border-top: 1px solid #000; }
  .signature-subtitle { font-size: 9px; color: #666; margin-top: 2px; }
  
  .stamp {
    width: 120px; height: 120px; border: 4px solid #8B0000; border-radius: 50%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: #8B0000; transform: rotate(-12deg); opacity: 0.85;
    font-family: Georgia, serif;
  }
  .stamp-inner {
    width: 100px; height: 100px; border: 1px dashed #8B0000; border-radius: 50%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .stamp-top { font-size: 8px; letter-spacing: 2px; font-weight: 700; }
  .stamp-center { font-size: 14px; font-weight: 900; margin: 4px 0; }
  .stamp-bottom { font-size: 8px; letter-spacing: 2px; font-weight: 700; }
  
  /* DISCLAIMER */
  .disclaimer {
    margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee;
    text-align: center; font-size: 9px; color: #999; line-height: 1.6;
  }
  .disclaimer strong { color: #666; }
  .verify-qr { display: inline-block; margin-top: 8px; font-size: 8px; color: #666; }
  
  @media print {
    body { background: #fff; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="page">
  <img src="/quttr-logo.png" class="watermark" onerror="this.style.display='none'"/>
  
  <div class="content">
    <!-- HEADER -->
    <div class="header">
      <div class="brand">
        <img src="/quttr-logo.png" class="brand-logo" onerror="this.style.display='none'"/>
        <div class="brand-text">
          <h1>QUTTR</h1>
          <p>Barber Booking Platform</p>
        </div>
      </div>
      <div class="cert-meta">
        <div class="cert-badge">Official Certificate</div>
        <div class="cert-no">${w.certificateNumber || 'QTR-CERT-XXXXX'}</div>
        <div class="cert-date">Issued: ${issueDate}</div>
      </div>
    </div>
    
    <!-- TITLE -->
    <div class="title-box">
      <div class="title-eyebrow">Payment Confirmation</div>
      <div class="title">Commission Payout Certificate</div>
      <div class="subtitle">This is to certify the successful payment of commission earnings</div>
    </div>
    
    <!-- INFO GRID -->
    <div class="info-grid">
      <div class="info-card">
        <div class="info-card-title">Payee Information</div>
        <div class="info-row"><span class="info-label">Barber Name</span><span class="info-value">${s.name || '—'}</span></div>
        <div class="info-row"><span class="info-label">Contact</span><span class="info-value">${s.phone || '—'}</span></div>
        <div class="info-row"><span class="info-label">Shop</span><span class="info-value">${shop.name || '—'}</span></div>
        ${shop.address ? `<div class="info-row"><span class="info-label">Location</span><span class="info-value">${(shop.address.area || '')}, ${(shop.address.city || '')}</span></div>` : ''}
      </div>
      
      <div class="info-card">
        <div class="info-card-title">Payment Details</div>
        <div class="info-row"><span class="info-label">Method</span><span class="info-value">${(w.paymentMethod || 'UPI').toUpperCase()}</span></div>
        <div class="info-row"><span class="info-label">Reference</span><span class="info-value" style="font-family: monospace; font-size: 10px;">${w.paymentReference || 'N/A'}</span></div>
        <div class="info-row"><span class="info-label">Beneficiary</span><span class="info-value">${bank.accountHolderName || '—'}</span></div>
        <div class="info-row"><span class="info-label">${bank.upiId ? 'UPI ID' : 'Account'}</span><span class="info-value" style="font-family: monospace; font-size: 10px;">${bank.upiId || bank.accountNumber || '—'}</span></div>
        ${!bank.upiId && bank.ifscCode ? `<div class="info-row"><span class="info-label">IFSC</span><span class="info-value" style="font-family: monospace; font-size: 10px;">${bank.ifscCode}</span></div>` : ''}
      </div>
    </div>
    
    <!-- AMOUNT BOX -->
    <div class="amount-box">
      <div>
        <div class="amount-label">Total Amount Paid</div>
        <div class="amount-value">₹${(w.amount || 0).toLocaleString('en-IN')}</div>
        <div class="amount-words">${amountInWords} Rupees Only</div>
      </div>
      <div class="amount-icon">₹</div>
    </div>
    
    <!-- TRANSACTIONS TABLE -->
    <div class="section-title">Commission Breakdown</div>
    <p style="font-size: 10px; color: #666; margin-bottom: 10px;">Period: ${periodStart} — ${periodEnd} · ${transactions.length} transactions</p>
    
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Service</th>
          <th>Customer</th>
          <th style="text-align:right">Service ₹</th>
          <th style="text-align:right">Rate</th>
          <th style="text-align:right">Commission</th>
        </tr>
      </thead>
      <tbody>
        ${transactions.map((t) => `
          <tr>
            <td>${new Date(t.servicedAt || t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
            <td>${t.serviceName || '—'}</td>
            <td>${t.customerName || '—'}</td>
            <td class="amt-cell">₹${(t.servicePrice || 0).toLocaleString('en-IN')}</td>
            <td style="text-align:right; color:#666">${t.percent || 0}%</td>
            <td class="commission-cell">₹${(t.amount || 0).toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3">TOTALS</td>
          <td class="amt-cell">₹${totalServiceValue.toLocaleString('en-IN')}</td>
          <td></td>
          <td class="commission-cell total-amount">₹${(w.amount || 0).toLocaleString('en-IN')}</td>
        </tr>
      </tfoot>
    </table>
    
    <!-- FOOTER -->
    <div class="footer">
      <div class="signature-box">
        <div class="signature-line"><img src="/admin/signature.png" onerror="this.style.display='none'"/></div>
        <div class="signature-title">Authorized Signatory</div>
        <div class="signature-subtitle">QUTTR Finance Department</div>
      </div>
      
      <div class="stamp">
        <div class="stamp-inner">
          <div class="stamp-top">★ QUTTR ★</div>
          <div class="stamp-center">VERIFIED</div>
          <div class="stamp-bottom">PAYMENT</div>
        </div>
      </div>
      
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-title">Receiver Signature</div>
        <div class="signature-subtitle">${s.name || 'Barber'}</div>
      </div>
    </div>
    
    <!-- DISCLAIMER -->
    <div class="disclaimer">
      <strong>Important:</strong> This is a computer-generated certificate issued by QUTTR representing commission payout for services rendered on the QUTTR platform. 
      This document serves as official proof of payment. For any discrepancies, please contact <strong>support@quttrr.com</strong> within 7 days of issuance.
      <br/><br/>
      <strong>QUTTR Technologies Pvt. Ltd.</strong> · support@quttrr.com · www.quttrr.com
      <div class="verify-qr">Certificate ID: ${w.certificateNumber} · Verify at quttrr.com/verify</div>
    </div>
  </div>
</div>

<script>
  window.onload = function() {
    setTimeout(function() { window.print(); }, 500);
  };
</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=1000');
  win.document.write(html);
  win.document.close();
}

/* ─── Number to Words (Indian format) ─────────────────── */
function numberToWords(num) {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function inWords(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
  }
  return inWords(Math.round(num));
}
