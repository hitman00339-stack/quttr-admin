'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Search, MoreVertical, Store,
  Trash2, RefreshCw, Activity,
} from 'lucide-react';
import DataTable from '../../../components/DataTable';
import ConfirmModal from '../../../components/ConfirmModal';
import { bookingsService } from '../../../services/bookings';

// ─── Normalize whatever shape the API returns ───
function getCustomer(b) {
  // Walk-in first
  if (b.isWalkIn || b.walkIn || b.type === 'walk-in') {
    const w = b.walkInCustomer || b.walkIn || {};
    return {
      name: w.name || b.customerName || b.walkInName || 'Walk-in Customer',
      phone: w.phone || b.customerPhone || b.walkInPhone || '',
      isWalkIn: true,
    };
  }

  // Populated customer / user object
  const c =
    (b.customer && typeof b.customer === 'object' ? b.customer : null) ||
    (b.user && typeof b.user === 'object' ? b.user : null) ||
    (b.customerId && typeof b.customerId === 'object' ? b.customerId : null) ||
    (b.userId && typeof b.userId === 'object' ? b.userId : null) ||
    {};

  return {
    name:
      c.name ||
      c.fullName ||
      c.username ||
      b.customerName ||
      b.userName ||
      'Unknown',
    phone:
      c.phone ||
      c.mobile ||
      c.phoneNumber ||
      b.customerPhone ||
      b.userPhone ||
      '',
    isWalkIn: false,
  };
}

function getShop(b) {
  const s =
    (b.shop && typeof b.shop === 'object' ? b.shop : null) ||
    (b.shopId && typeof b.shopId === 'object' ? b.shopId : null) ||
    (b.store && typeof b.store === 'object' ? b.store : null) ||
    {};

  return {
    name:
      s.name ||
      s.shopName ||
      s.title ||
      b.shopName ||
      b.storeName ||
      'Unknown',
  };
}

function getService(b) {
  const svc =
    (b.service && typeof b.service === 'object' ? b.service : null) ||
    (b.serviceId && typeof b.serviceId === 'object' ? b.serviceId : null) ||
    {};

  // Sometimes services is an array
  if (!svc.name && Array.isArray(b.services) && b.services.length > 0) {
    const first = typeof b.services[0] === 'object' ? b.services[0] : {};
    return {
      name: first.name || b.serviceName || 'N/A',
      price: first.price ?? b.price ?? b.totalAmount ?? 0,
      duration: first.duration ?? b.duration ?? 0,
    };
  }

  return {
    name: svc.name || b.serviceName || b.service || 'N/A',
    price: svc.price ?? b.price ?? b.totalAmount ?? b.amount ?? 0,
    duration: svc.duration ?? b.duration ?? b.serviceDuration ?? 0,
  };
}

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

      // Debug once in console so we can see real shape
      if (filtered.length > 0 && process.env.NODE_ENV === 'development') {
        console.log('Booking sample:', filtered[0]);
      }

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter((b) => {
          const customer = getCustomer(b);
          const shop = getShop(b);
          return (
            customer.name?.toLowerCase().includes(q) ||
            customer.phone?.includes(search) ||
            shop.name?.toLowerCase().includes(q)
          );
        });
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
    no_show: 'chip-neutral',
  };

  const columns = [
    {
      key: 'customer',
      label: 'Customer',
      render: (b) => {
        const customer = getCustomer(b);
        return (
          <div>
            <p className="text-sm font-medium">
              {customer.name}
              {customer.isWalkIn && (
                <span className="ml-2 text-2xs text-info">walk-in</span>
              )}
            </p>
            <p className="text-2xs text-white/40">
              {customer.phone || 'No phone'}
            </p>
          </div>
        );
      },
    },
    {
      key: 'shop',
      label: 'Shop',
      render: (b) => {
        const shop = getShop(b);
        return (
          <div className="flex items-center gap-2">
            <Store className="w-3.5 h-3.5 text-white/40" />
            <span className="text-sm truncate">{shop.name}</span>
          </div>
        );
      },
    },
    {
      key: 'service',
      label: 'Service',
      render: (b) => {
        const service = getService(b);
        return (
          <div>
            <p className="text-sm">{service.name}</p>
            <p className="text-2xs text-white/40">
              ₹{service.price} · {service.duration}min
            </p>
          </div>
        );
      },
    },
    {
      key: 'position',
      label: 'Queue #',
      render: (b) => (
        <span className="chip-accent">
          #{b.position ?? b.queuePosition ?? b.queueNumber ?? 0}
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
          {new Date(b.createdAt || b.bookingTime || Date.now()).toLocaleString('en-IN', {
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
          <option value="declined">Declined</option>
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
