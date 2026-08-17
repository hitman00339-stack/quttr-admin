'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Search, Download, MoreVertical, User, Phone, Store,
  CheckCircle2, XCircle, Trash2, Crown, Star, DollarSign,
} from 'lucide-react';
import DataTable from '../../../components/DataTable';
import ConfirmModal from '../../../components/ConfirmModal';
import { staffService } from '../../../services/staff';

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    load();
  }, [page, approvalFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') setPage(1);
      load();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const load = async () => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (approvalFilter !== 'all') params.approval = approvalFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (search) params.search = search;

    const result = await staffService.getAll(params);
    if (result.success) {
      setStaff(result.staff || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    }
    setLoading(false);
  };

  const handleAction = async (type, item, reason = '') => {
    setActionLoading(true);
    let result;

    if (type === 'approve') result = await staffService.approve(item._id);
    if (type === 'reject') result = await staffService.reject(item._id, reason);
    if (type === 'delete') result = await staffService.delete(item._id);

    setActionLoading(false);

    if (result?.success) {
      toast.success(result.message);
      setModal(null);
      load();
    } else {
      toast.error(result?.message);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Phone', 'Shop', 'Role', 'Status', 'Approval', 'Earnings', 'Customers'],
      ...staff.map((s) => [
        s.name, s.phone, s.shop?.name || '', s.role,
        s.status, s.approvalStatus,
        s.totalEarnings || 0, s.totalCustomersServed || 0,
      ]),
    ].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quttr-staff-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV downloaded');
  };

  const columns = [
    {
      key: 'staff',
      label: 'Staff Member',
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center flex-shrink-0">
            {s.profilePhoto ? (
              <img src={s.profilePhoto} alt="" className="w-full h-full rounded-lg object-cover" />
            ) : (
              <User className="w-4 h-4 text-surface-100" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-white truncate flex items-center gap-1.5">
              {s.name}
              {s.isOwner && <Crown className="w-3 h-3 text-accent-500" />}
            </p>
            <p className="text-2xs text-white/40 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {s.phone}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'shop',
      label: 'Shop',
      render: (s) => (
        <div className="flex items-center gap-2 text-sm">
          <Store className="w-3.5 h-3.5 text-white/40" />
          <span className="truncate">{s.shop?.name || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (s) => (
        <span className="chip-neutral capitalize">{s.role}</span>
      ),
    },
    {
      key: 'approval',
      label: 'Approval',
      render: (s) => (
        <span className={
          s.approvalStatus === 'approved' ? 'chip-success' :
          s.approvalStatus === 'rejected' ? 'chip-error' :
          'chip-warning'
        }>
          {s.approvalStatus}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (s) => (
        <span className={
          s.status === 'active' ? 'chip-success' :
          s.status === 'break' ? 'chip-warning' :
          'chip-neutral'
        }>
          {s.status}
        </span>
      ),
    },
    {
      key: 'metrics',
      label: 'Performance',
      render: (s) => (
        <div className="text-xs">
          <div className="flex items-center gap-1 text-accent-500">
            <Star className="w-3 h-3 fill-accent-500" />
            {s.rating?.average?.toFixed(1) || '0.0'}
          </div>
          <div className="text-white/40 mt-0.5">
            {s.totalCustomersServed || 0} served
          </div>
        </div>
      ),
    },
    {
      key: 'earnings',
      label: 'Earnings',
      render: (s) => (
        <div className="text-xs">
          <div className="text-success font-semibold">
            ₹{(s.totalEarnings || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-white/40 mt-0.5">
            Today: ₹{(s.todayEarnings || 0).toLocaleString('en-IN')}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '60px',
      render: (s) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenu(openMenu === s._id ? null : s._id);
            }}
            className="btn-icon"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {openMenu === s._id && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
              <div className="absolute right-0 top-full mt-1 w-48 card p-1.5 z-20 animate-scale-in">
                {s.approvalStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setOpenMenu(null);
                        setModal({ type: 'approve', item: s });
                      }}
                      className="cmd-item w-full text-success"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setOpenMenu(null);
                        setModal({ type: 'reject', item: s });
                      }}
                      className="cmd-item w-full text-error"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <div className="divider my-1" />
                  </>
                )}
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    setModal({ type: 'delete', item: s });
                  }}
                  className="cmd-item w-full text-error"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-display">Staff</h1>
          <p className="text-body mt-1">All barbers · {total} total</p>
        </div>

        <button onClick={handleExport} className="btn-outline">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search staff by name, phone, shop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        <select
          value={approvalFilter}
          onChange={(e) => { setApprovalFilter(e.target.value); setPage(1); }}
          className="input min-w-[140px]"
        >
          <option value="all">All Approvals</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input min-w-[140px]"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="break">On Break</option>
          <option value="offline">Offline</option>
        </select>

        <button
          onClick={() => { setSearch(''); setApprovalFilter('all'); setStatusFilter('all'); setPage(1); }}
          className="btn-ghost"
        >
          Reset
        </button>
      </div>

      <DataTable
        columns={columns}
        data={staff}
        loading={loading}
        emptyMessage="No staff found."
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      {modal && (
        <ConfirmModal
          isOpen={!!modal}
          onClose={() => !actionLoading && setModal(null)}
          onConfirm={(reason) => handleAction(modal.type, modal.item, reason)}
          loading={actionLoading}
          title={
            modal.type === 'approve' ? 'Approve Staff?' :
            modal.type === 'reject' ? 'Reject Staff?' :
            'Remove Staff?'
          }
          message={
            modal.type === 'approve' ? `Approve "${modal.item.name}"? They can start working.` :
            modal.type === 'reject' ? `Reject "${modal.item.name}"? Please provide a reason.` :
            `⚠️ Permanently remove "${modal.item.name}" from the system?`
          }
          confirmText={
            modal.type === 'approve' ? 'Approve' :
            modal.type === 'reject' ? 'Reject' : 'Remove'
          }
          variant={modal.type === 'approve' ? 'info' : 'danger'}
          requireReason={modal.type === 'reject'}
        />
      )}
    </div>
  );
}
