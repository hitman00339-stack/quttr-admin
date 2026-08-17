'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Store, MapPin, Phone, Mail, Star,
  Users, DollarSign, Calendar, TrendingUp, Clock,
  Scissors, User, CheckCircle2, XCircle, Eye,
  Activity, Crown, Award,
} from 'lucide-react';
import { approvalsService } from '../../../../services/approvals';

export default function ShopDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    load();
  }, [params.id]);

  const load = async () => {
    setLoading(true);
    const result = await approvalsService.getShopFull(params.id);
    if (result.success) {
      setData(result);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-40" />
        <div className="skeleton h-64" />
      </div>
    );
  }

  if (!data?.shop) {
    return (
      <div className="max-w-7xl mx-auto text-center py-20">
        <XCircle className="w-16 h-16 mx-auto text-error mb-4" />
        <h2 className="text-title">Shop not found</h2>
        <Link href="/dashboard/shops" className="btn-outline mt-4 inline-flex">
          Back to Shops
        </Link>
      </div>
    );
  }

  const { shop, staff, recentBookings, reviews, metrics } = data;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Store },
    { id: 'services', label: `Services (${shop.services?.length || 0})`, icon: Scissors },
    { id: 'staff', label: `Staff (${staff?.length || 0})`, icon: Users },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'reviews', label: `Reviews (${reviews?.length || 0})`, icon: Star },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/dashboard/shops" className="btn-icon flex-shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {shop.approvalStatus === 'approved' && shop.isActive
              ? <span className="chip-success">Active</span>
              : shop.approvalStatus === 'suspended'
                ? <span className="chip-warning">Suspended</span>
                : <span className="chip-error">Inactive</span>
            }
            {shop.isVerified && <span className="chip-info">Verified</span>}
          </div>
          <h1 className="text-display truncate">{shop.name}</h1>
          <p className="text-body mt-1 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            {shop.address?.area}, {shop.address?.city}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mb-3">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <p className="stat-label">Total Revenue</p>
          <p className="stat-value">₹{metrics.totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-2xs text-white/40 mt-1">Today: ₹{metrics.todayRevenue.toLocaleString('en-IN')}</p>
        </div>

        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-info to-blue-700 flex items-center justify-center mb-3">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <p className="stat-label">Bookings</p>
          <p className="stat-value">{data.totalBookings}</p>
          <p className="text-2xs text-white/40 mt-1">{metrics.activeQueue} in queue now</p>
        </div>

        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center mb-3">
            <Star className="w-4 h-4 text-surface-100 fill-surface-100" />
          </div>
          <p className="stat-label">Rating</p>
          <p className="stat-value">{metrics.averageRating.toFixed(1)}</p>
          <p className="text-2xs text-white/40 mt-1">{metrics.totalReviews} reviews</p>
        </div>

        <div className="stat-card">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-3">
            <Users className="w-4 h-4 text-white" />
          </div>
          <p className="stat-label">Staff</p>
          <p className="stat-value">{metrics.totalStaff}</p>
          <p className="text-2xs text-success mt-1">{metrics.activeStaff} active</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-1.5 inline-flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`btn ${tab === t.id ? 'bg-white text-surface-100' : 'btn-ghost'}`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6">
            <h3 className="text-title mb-4">About</h3>
            <p className="text-body mb-6">{shop.description || 'No description'}</p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-white/40" />
                <span>{shop.phone}</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-white/40 mt-0.5" />
                <div>
                  <p>{shop.address?.fullAddress || shop.address?.area}</p>
                  <p className="text-xs text-white/40">{shop.address?.city}, {shop.address?.state} {shop.address?.pincode}</p>
                </div>
              </div>
              {shop.location?.coordinates && (
                <div className="flex items-center gap-3 text-sm">
                  <Activity className="w-4 h-4 text-white/40" />
                  <span className="font-mono text-xs">
                    {shop.location.coordinates[1]?.toFixed(4)}, {shop.location.coordinates[0]?.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-title mb-4">Owner</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
                {shop.owner?.profilePhoto ? (
                  <img src={shop.owner.profilePhoto} alt="" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <User className="w-5 h-5 text-surface-100" />
                )}
              </div>
              <div>
                <p className="font-semibold">{shop.owner?.name}</p>
                <p className="text-xs text-white/40">{shop.owner?.phone}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'services' && (
        <div className="space-y-3">
          {shop.services?.length > 0 ? shop.services.map((s, i) => (
            <div key={i} className="card p-4 flex items-center gap-4">
              {s.photo ? (
                <img src={s.photo} alt="" className="w-14 h-14 rounded-xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                  <Scissors className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-semibold">{s.name}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="chip-accent">₹{s.price}</span>
                  <span className="chip-info">{s.duration} min</span>
                  <span className="chip-neutral capitalize">{s.category}</span>
                  <span className={
                    s.approvalStatus === 'approved' ? 'chip-success' :
                    s.approvalStatus === 'rejected' ? 'chip-error' :
                    'chip-warning'
                  }>
                    {s.approvalStatus || 'approved'}
                  </span>
                </div>
              </div>
            </div>
          )) : (
            <div className="card p-12 text-center">
              <Scissors className="w-8 h-8 mx-auto text-white/20 mb-3" />
              <p className="text-body">No services added yet</p>
            </div>
          )}
        </div>
      )}

      {tab === 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staff?.length > 0 ? staff.map((s) => (
            <div key={s._id} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
                  {s.profilePhoto ? (
                    <img src={s.profilePhoto} alt="" className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-surface-100" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold flex items-center gap-2">
                    {s.name}
                    {s.isOwner && <Crown className="w-3.5 h-3.5 text-accent-500" />}
                  </h4>
                  <p className="text-xs text-white/40">{s.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-white/[0.02]">
                  <p className="text-white/40">Role</p>
                  <p className="font-semibold capitalize">{s.role}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02]">
                  <p className="text-white/40">Status</p>
                  <p className={
                    s.status === 'active' ? 'text-success font-semibold' :
                    s.status === 'break' ? 'text-warning font-semibold' :
                    'text-white/60 font-semibold'
                  }>{s.status}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02]">
                  <p className="text-white/40">Earnings</p>
                  <p className="font-semibold text-success">₹{(s.totalEarnings || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02]">
                  <p className="text-white/40">Served</p>
                  <p className="font-semibold">{s.totalCustomersServed || 0}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className={
                  s.approvalStatus === 'approved' ? 'chip-success' :
                  s.approvalStatus === 'rejected' ? 'chip-error' :
                  'chip-warning'
                }>
                  {s.approvalStatus}
                </span>
                {s.rating?.average > 0 && (
                  <span className="chip-accent">
                    <Star className="w-3 h-3 fill-accent-500" /> {s.rating.average.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          )) : (
            <div className="col-span-full card p-12 text-center">
              <Users className="w-8 h-8 mx-auto text-white/20 mb-3" />
              <p className="text-body">No staff yet</p>
            </div>
          )}
        </div>
      )}

      {tab === 'bookings' && (
        <div className="card overflow-hidden">
          {recentBookings?.length > 0 ? (
            <div className="divide-y divide-white/[0.05]">
              {recentBookings.map((b) => (
                <div key={b._id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center">
                    <User className="w-4 h-4 text-white/40" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {b.isWalkIn ? b.walkInCustomer?.name : b.customer?.name || 'Unknown'}
                    </p>
                    <p className="text-2xs text-white/40">
                      {b.service?.name} · ₹{b.service?.price} · {new Date(b.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className={
                    b.status === 'completed' ? 'chip-success' :
                    b.status === 'cancelled' ? 'chip-error' :
                    'chip-info'
                  }>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Calendar className="w-8 h-8 mx-auto text-white/20 mb-3" />
              <p className="text-body">No bookings yet</p>
            </div>
          )}
        </div>
      )}

      {tab === 'reviews' && (
        <div className="space-y-3">
          {reviews?.length > 0 ? reviews.map((r) => (
            <div key={r._id} className="card p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/15 flex items-center justify-center">
                  <User className="w-4 h-4 text-info" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{r.customer?.name || 'Anonymous'}</p>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-accent-500 fill-accent-500' : 'text-white/10'}`} />
                      ))}
                    </div>
                    <span className="text-2xs text-white/40 ml-auto">
                      {new Date(r.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-white/70">{r.comment}</p>}
                </div>
              </div>
            </div>
          )) : (
            <div className="card p-12 text-center">
              <Star className="w-8 h-8 mx-auto text-white/20 mb-3" />
              <p className="text-body">No reviews yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
