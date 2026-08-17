'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Search, Filter, Download, MoreVertical, Store, MapPin, Phone,
  CheckCircle2, XCircle, Pause, Trash2, RefreshCw, Eye, Star,
  Users, Calendar, TrendingUp, Loader2, AlertCircle, Clock,
} from 'lucide-react';
import DataTable from '../../../components/DataTable';
import ConfirmModal from '../../../components/ConfirmModal';
import { shopsService } from '../../../services/shops';

export default function ShopsPage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);
  const [modal, setModal] = useState(null); // { type, shop }
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadShops();
  }, [page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') setPage(1);
      loadShops();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadShops = async () => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (statusFilter !== 'all') params.status = statusFilter;
    if (search) params.city = search;

    const result = await shopsService.getAll(params);
    if (result.success) {
      let filtered = result.shops || [];

      // Client-side name search (name isn't a backend filter)
      if (search) {
        filtered = filtered.filter((s) =>
          s.name?.toLowerCase().includes(search.toLowerCase()) ||
          s.address?.city?.toLowerCase().includes(search.toLowerCase()) ||
          s.owner?.name?.toLowerCase().includes(search.toLowerCase()) ||
          s.owner?.phone?.includes(search)
        );
      }

      setShops(filtered);
      setTotal(result.total || 0);
      setTotalPages(Math.ceil((result.total || 0) / 20));
    }
    setLoading(false);
  };

  const handleAction = async (type, shop, reason = '') => {
    setActionLoading(true);
    let result;

    switch (type) {
      case 'approve':
        result = await shopsService.approveLocation(shop._id);
        break;
      case 'reject':
        result = await shopsService.rejectLocation(shop._id, reason);
        break;
      case 'suspend':
        result = await shopsService.suspend(shop._id, reason);
        break;
      case 'terminate':
        result = await shopsService.terminate(shop._id, reason);
        break;
      case 'reactivate':
        result = await shopsService.reactivate(shop._id);
        break;
      case 'delete':
        result = await shopsService.delete(shop._id);
        break;
    }

    setActionLoading(false);

    if (result?.success) {
      toast.success(result.message || 'Action completed');
      setModal(null);
      loadShops();
    } else {
      toast.error(result?.message || 'Action failed');
    }
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Owner', 'Phone', 'City', 'Status', 'Location Status', 'Created'],
      ...shops.map((s) => [
        s.name,
        s.owner?.name || '',
        s.owner?.phone || '',
        s.address?.city || '',
        s.approvalStatus,
        s.locationStatus,
        new Date(s.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.map((c) => `"${c}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quttr-shops-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV downloaded');
  };

  const getStatusChip = (shop) => {
    if (shop.approvalStatus === 'terminated') return <span className="chip-error">Terminated</span>;
    if (shop.approvalStatus === 'suspended') return <span className="chip-warning">Suspended</span>;
    if (shop.locationStatus === 'pending') return <span className="chip-info">Pending</span>;
    if (shop.locationStatus === 'rejected') return <span className="chip-error">Rejected</span>;
    if (shop.approvalStatus === 'approved' && shop.isActive) return <span className="chip-success">Active</span>;
    return <span className="chip-neutral">Inactive</span>;
  };

  const columns = [
    {
      key: 'name',
      label: 'Shop',
      render: (shop) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
            <Store className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-white truncate">{shop.name || 'Unnamed'}</p>
            <p className="text-2xs text-white/40 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {shop.address?.city || 'No city'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (shop) => (
        <div>
          <p className="text-sm">{shop.owner?.name || 'Unknown'}</p>
          <p className="text-2xs text-white/40 flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {shop.owner?.phone || 'N/A'}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (shop) => getStatusChip(shop),
    },
    {
      key: 'metrics',
      label: 'Metrics',
      render: (shop) => (
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-white/60">
            <Star className="w-3 h-3 text-accent-500" />
            {shop.rating?.average?.toFixed(1) || '0.0'}
          </span>
          <span className="flex items-center gap-1 text-white/60">
            <Users className="w-3 h-3" />
            {shop.totalBookings || 0}
          </span>
        </div>
      ),
    },
    {
      key: 'created',
      label: 'Created',
      render: (shop) => (
        <span className="text-xs text-white/40">
          {new Date(shop.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '60px',
      render: (shop) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenu(openMenu === shop._id ? null : shop._id);
            }}
            className="btn-icon"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {openMenu === shop._id && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpenMenu(null)}
              />
              <div className="absolute right-0 top-full mt-1 w-52 card p-1.5 z-20 animate-scale-in">
                <Link
                  href={`/dashboard/shops/${shop._id}`}
                  className="cmd-item"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </Link>

                {shop.locationStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setOpenMenu(null);
                        setModal({ type: 'approve', shop });
                      }}
                      className="cmd-item w-full text-success"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setOpenMenu(null);
                        setModal({ type: 'reject', shop });
                      }}
                      className="cmd-item w-full text-error"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}

                {shop.approvalStatus === 'approved' && (
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      setModal({ type: 'suspend', shop });
                    }}
                    className="cmd-item w-full text-warning"
                  >
                    <Pause className="w-4 h-4" />
                    Suspend
                  </button>
                )}

                {['suspended', 'terminated', 'rejected'].includes(shop.approvalStatus) && (
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      setModal({ type: 'reactivate', shop });
                    }}
                    className="cmd-item w-full text-success"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reactivate
                  </button>
                )}

                {shop.approvalStatus !== 'terminated' && (
                  <button
                    onClick={() => {
                      setOpenMenu(null);
                      setModal({ type: 'terminate', shop });
                    }}
                    className="cmd-item w-full text-error"
                  >
                    <XCircle className="w-4 h-4" />
                    Terminate
                  </button>
                )}

                <div className="divider my-1" />

                <button
                  onClick={() => {
                    setOpenMenu(null);
                    setModal({ type: 'delete', shop });
                  }}
                  className="cmd-item w-full text-error"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

  const modalConfig = {
    approve: {
      title: 'Approve Shop Location?',
      message: `Approve "${modal?.shop?.name}"? Shop will be visible to users.`,
      confirmText: 'Approve',
      variant: 'info',
      requireReason: false,
    },
    reject: {
      title: 'Reject Shop Location?',
      message: `Reject "${modal?.shop?.name}"? Shop owner will be notified with the reason.`,
      confirmText: 'Reject',
      variant: 'danger',
      requireReason: true,
    },
    suspend: {
      title: 'Suspend Shop?',
      message: `Suspend "${modal?.shop?.name}"? Shop will be temporarily hidden.`,
      confirmText: 'Suspend',
      variant: 'warning',
      requireReason: true,
    },
    terminate: {
      title: 'Terminate Shop?',
      message: `Permanently terminate "${modal?.shop?.name}"? This action requires reactivation later.`,
      confirmText: 'Terminate',
      variant: 'danger',
      requireReason: true,
    },
    reactivate: {
      title: 'Reactivate Shop?',
      message: `Reactivate "${modal?.shop?.name}"? Shop will become visible again.`,
      confirmText: 'Reactivate',
      variant: 'info',
      requireReason: false,
    },
    delete: {
      title: 'Delete Shop Permanently?',
      message: `⚠️ This will PERMANENTLY delete "${modal?.shop?.name}" and all its data. This cannot be undone.`,
      confirmText: 'Delete Forever',
      variant: 'danger',
      requireReason: false,
    },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-display">Shops</h1>
          <p className="text-body mt-1">
            Manage all barbershops · {total} total
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-outline">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by shop name, owner, city, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="input min-w-[160px]"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
          <option value="terminated">Terminated</option>
          <option value="rejected">Rejected</option>
        </select>

        <button
          onClick={() => {
            setSearch('');
            setStatusFilter('all');
            setPage(1);
          }}
          className="btn-ghost"
        >
          Reset
        </button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={shops}
        loading={loading}
        emptyMessage="No shops found. Try changing filters."
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      {/* Confirm Modal */}
      {modal && (
        <ConfirmModal
          isOpen={!!modal}
          onClose={() => !actionLoading && setModal(null)}
          onConfirm={(reason) => handleAction(modal.type, modal.shop, reason)}
          loading={actionLoading}
          {...modalConfig[modal.type]}
        />
      )}
    </div>
  );
}
