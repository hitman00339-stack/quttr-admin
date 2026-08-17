'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Search, Download, MoreVertical, User, Phone, Mail,
  CheckCircle2, XCircle, Ban, Trash2, Users as UsersIcon,
  Award, Calendar, Crown,
} from 'lucide-react';
import DataTable from '../../../components/DataTable';
import ConfirmModal from '../../../components/ConfirmModal';
import { usersService } from '../../../services/users';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [openMenu, setOpenMenu] = useState(null);
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, verifiedFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') setPage(1);
      loadUsers();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadUsers = async () => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (roleFilter !== 'all') params.role = roleFilter;
    if (verifiedFilter !== 'all') params.isVerified = verifiedFilter;
    if (search) params.search = search;

    const result = await usersService.getAll(params);
    if (result.success) {
      setUsers(result.users || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    }
    setLoading(false);
  };

  const handleAction = async (type, user) => {
    setActionLoading(true);
    let result;

    if (type === 'toggle') result = await usersService.toggleStatus(user._id);
    if (type === 'delete') result = await usersService.delete(user._id);

    setActionLoading(false);

    if (result?.success) {
      toast.success(result.message || 'Success');
      setModal(null);
      loadUsers();
    } else {
      toast.error(result?.message || 'Failed');
    }
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Phone', 'Email', 'Role', 'Verified', 'Bookings', 'Spent', 'Joined'],
      ...users.map((u) => [
        u.name, u.phone, u.email || '', u.role,
        u.isVerified ? 'Yes' : 'No',
        u.totalBookings, u.totalSpent,
        new Date(u.createdAt).toLocaleDateString(),
      ]),
    ].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quttr-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV downloaded');
  };

  const roleIcons = {
    customer: User,
    shopOwner: Crown,
    admin: Award,
  };

  const roleColors = {
    customer: 'from-blue-500 to-blue-700',
    shopOwner: 'from-accent-500 to-accent-700',
    admin: 'from-brand-500 to-brand-700',
  };

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (user) => {
        const Icon = roleIcons[user.role] || User;
        return (
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${roleColors[user.role]} flex items-center justify-center flex-shrink-0`}>
              {user.profilePhoto ? (
                <img src={user.profilePhoto} alt="" className="w-full h-full rounded-lg object-cover" />
              ) : (
                <Icon className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-white truncate flex items-center gap-2">
                {user.name}
                {user.isVerified && <CheckCircle2 className="w-3 h-3 text-info flex-shrink-0" />}
              </p>
              <p className="text-2xs text-white/40 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {user.phone}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'role',
      label: 'Role',
      render: (user) => (
        <span className={`chip ${
          user.role === 'admin' ? 'chip-error' :
          user.role === 'shopOwner' ? 'chip-accent' :
          'chip-info'
        }`}>
          {user.role}
        </span>
      ),
    },
    {
      key: 'stats',
      label: 'Activity',
      render: (user) => (
        <div className="text-xs text-white/60">
          <div>{user.totalBookings} bookings</div>
          <div className="text-white/40">₹{(user.totalSpent || 0).toLocaleString('en-IN')} spent</div>
        </div>
      ),
    },
    {
      key: 'points',
      label: 'Points',
      render: (user) => (
        <span className="chip-accent">
          {user.loyaltyPoints || 0} pts
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (user) => (
        user.isActive
          ? <span className="chip-success">Active</span>
          : <span className="chip-error">Banned</span>
      ),
    },
    {
      key: 'joined',
      label: 'Joined',
      render: (user) => (
        <span className="text-xs text-white/40">
          {new Date(user.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '60px',
      render: (user) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenu(openMenu === user._id ? null : user._id);
            }}
            className="btn-icon"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {openMenu === user._id && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
              <div className="absolute right-0 top-full mt-1 w-52 card p-1.5 z-20 animate-scale-in">
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    setModal({ type: 'toggle', user });
                  }}
                  className={`cmd-item w-full ${user.isActive ? 'text-warning' : 'text-success'}`}
                >
                  {user.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  {user.isActive ? 'Ban User' : 'Unban User'}
                </button>
                <div className="divider my-1" />
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    setModal({ type: 'delete', user });
                  }}
                  className="cmd-item w-full text-error"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete User
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
          <h1 className="text-display">Users</h1>
          <p className="text-body mt-1">Manage all users · {total} total</p>
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
            placeholder="Search by name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="input min-w-[140px]"
        >
          <option value="all">All Roles</option>
          <option value="customer">Customer</option>
          <option value="shopOwner">Shop Owner</option>
          <option value="admin">Admin</option>
        </select>

        <select
          value={verifiedFilter}
          onChange={(e) => {
            setVerifiedFilter(e.target.value);
            setPage(1);
          }}
          className="input min-w-[140px]"
        >
          <option value="all">All Users</option>
          <option value="true">Verified Only</option>
          <option value="false">Unverified</option>
        </select>

        <button
          onClick={() => {
            setSearch('');
            setRoleFilter('all');
            setVerifiedFilter('all');
            setPage(1);
          }}
          className="btn-ghost"
        >
          Reset
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="No users found."
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />

      {modal && (
        <ConfirmModal
          isOpen={!!modal}
          onClose={() => !actionLoading && setModal(null)}
          onConfirm={() => handleAction(modal.type, modal.user)}
          loading={actionLoading}
          title={modal.type === 'toggle' ? (modal.user.isActive ? 'Ban User?' : 'Unban User?') : 'Delete User?'}
          message={
            modal.type === 'toggle'
              ? `${modal.user.isActive ? 'Ban' : 'Unban'} "${modal.user.name}"? They ${modal.user.isActive ? "won't" : 'will'} be able to use the app.`
              : `⚠️ Permanently delete "${modal.user.name}"? All their data will be lost.`
          }
          confirmText={modal.type === 'delete' ? 'Delete Forever' : 'Confirm'}
          variant={modal.user.isActive || modal.type === 'delete' ? 'danger' : 'info'}
        />
      )}
    </div>
  );
}
