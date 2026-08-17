'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Search, Download, MoreVertical, Calendar, Clock,
  CheckCircle2, XCircle, User, Store, Scissors,
  Trash2, RefreshCw, Activity,
} from 'lucide-react';
import DataTable from '../../../components/DataTable';
import ConfirmModal from '../../../components/ConfirmModal';
import { bookingsService } from '../../../services/bookings';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 15000);
    return () => clearInterval(interval);
  }, [page, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') setPage(1);
      loadBookings();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadBookings = async () => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (statusFilter !== 'all') params.status = statusFilter;

    const result = await bookingsService.getAll(params);
    if (result.success) {
      let filtered = result.bookings || result.data || [];

      if (search) {
        filtered = filtered.filter((b) =>
          b.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
          b.customer?.phone?.includes(search) ||
          b.shop?.name?.toLowerCase().includes(search.toLowerCase()) ||
          b.walkInCustomer?.name?.toLowerCase().includes(search.toLowerCase())
        );
      }

      setBookings(filtered);
      setTotal(result.total || filtered.length);
      setTotalPages(Math.ceil((result.total || filtered.length) / 20) || 1);
    }
    setLoading(false);
  };

  const handleDelete = async (booking) => {
    setActionLoading(true);
    const result = await bookingsService.delete(booking._id);
    setActionLoading(false);

    if (result.success) {
      toast.success('Booking deleted');
      setModal(null);
      loadBookings();
    } else {
      toast.error(result.message || 'Delete failed');
    }
  };

  const statusColors = {
    waiting: 'chip-info',
    notified: 'chip-warning',
    arrived: 'chip-success',
    serving: 'chip-accent',
    completed: 'chip-success',
    cancelled: 'chip-error',
    declined: 'chip-error',
    noShow: 'chip-neutral',
  };

  const columns = [
    {
      key: 'customer',
      label: 'Customer',
      render: (b) => (
        <div>
          <p className="text-sm font-medium">
            {b.isWalkIn ? b.walkInCustomer?.name : b.customer?.name || 'Unknown'}
            {b.isWalkIn && <span className="ml-2 text-2xs text-info">walk-in</span>}
          </p>
          <p className="text-2xs text-white/40">
            {b.isWalkIn ? (b.walkInCustomer?.phone || 'No phone') : b.customer?.phone}
          </p>
        </div>
      ),
    },
    {
      key: 'shop',
      label: 'Shop',
      render: (b) => (
        <div className="flex items-center gap-2">
          <Store className="w-3.5 h-3.5 text-white/40" />
          <span className="text-sm truncate">{b.shop?.name || 'Unknown'}</span>
        </div>
      ),
    },
    {
      key: 'service',
      label: 'Service',
      render: (b) => (
        <div>
          <p className="text-sm">{b.service?.name || 'N/A'}</p>
          <p className="text-2xs text-white/40">
            ₹{b.service?.price || 0} · {b.service?.duration || 0}min
          </p>
        </div>
      ),
    },
    {
      key: 'position',
      label: 'Queue #',
      render: (b) => (
        <span className="chip-accent">
          #{b.position || 0}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (b) => (
        <span className={statusColors[b.status] || 'chip-neutral'}>
          {b.status}
        </span>
      ),
    },
    {
      key: 'created',
      label: 'Time',
      render: (b) => (
        <span className="text-xs text-white/40">
          {new Date(b.createdAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '60px',
      render: (b) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenu(openMenu === b._id ? null : b._id);
            }}
            className="btn-icon"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {openMenu === b._id && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
              <div className="absolute right-0 top-full mt-1 w-48 card p-1.5 z-20 animate-scale-in">
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    setModal({ booking: b });
                  }}
                  className="cmd-item w-full text-error"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Booking
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
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-success animate-pulse" />
            <span className="text-2xs uppercase tracking-widest text-success font-semibold">
              Live · Refreshes every 15s
            </span>
          </div>
          <h1 className="text-display">Bookings</h1>
          <p className="text-body mt-1">All bookings across shops · {total} total</p>
        </div>

        <button onClick={loadBookings} className="btn-outline">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by customer, shop..."
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
          <option value="waiting">Waiting</option>
          <option value="notified">Notified</option>
          <option value="arrived">Arrived</option>
          <option value="serving">Serving</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
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

      <DataTable
        columns={columns}
        data={bookings}
        loading={loading}
        emptyMessage="No bookings found."
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      {modal && (
        <ConfirmModal
          isOpen={!!modal}
          onClose={() => !actionLoading && setModal(null)}
          onConfirm={() => handleDelete(modal.booking)}
          loading={actionLoading}
          title="Delete Booking?"
          message="⚠️ Permanently delete this booking? This cannot be undone."
          confirmText="Delete"
          variant="danger"
        />
      )}
    </div>
  );
}
