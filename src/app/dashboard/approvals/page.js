'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  CheckCircle2, XCircle, Store, User, Scissors, MapPin,
  Phone, Mail, Clock, Loader2, ChevronRight, Eye,
  ExternalLink, Navigation,
} from 'lucide-react';
import ConfirmModal from '../../../components/ConfirmModal';
import { approvalsService } from '../../../services/approvals';
import { shopsService } from '../../../services/shops';
import { staffService } from '../../../services/staff';

export default function ApprovalsHub() {
  const [tab, setTab] = useState('shops');
  const [data, setData] = useState({ shops: [], staff: [], services: [] });
  const [counts, setCounts] = useState({ shops: 0, staff: 0, services: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailsModal, setDetailsModal] = useState(null); // Full shop details
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const result = await approvalsService.getAll();
    if (result.success) {
      setData(result.data);
      setCounts(result.counts);
    }
    setLoading(false);
  };

  const openShopDetails = async (shop) => {
    setDetailsLoading(true);
    setDetailsModal({ loading: true });
    const result = await approvalsService.getShopFull(shop._id);
    if (result.success) {
      setDetailsModal(result);
    } else {
      toast.error('Failed to load shop details');
      setDetailsModal(null);
    }
    setDetailsLoading(false);
  };

  const handleAction = async (type, action, item, reason = '') => {
    setActionLoading(true);
    let result;

    if (type === 'shop') {
      if (action === 'approve') result = await shopsService.approveLocation(item._id);
      else result = await shopsService.rejectLocation(item._id, reason);
    } else if (type === 'staff') {
      if (action === 'approve') result = await staffService.approve(item._id);
      else result = await staffService.reject(item._id, reason);
    } else if (type === 'service') {
      if (action === 'approve') result = await shopsService.approveService(item.shopId, item._id);
      else result = await shopsService.rejectService(item.shopId, item._id, reason);
    }

    setActionLoading(false);

    if (result?.success) {
      toast.success(result.message || 'Done');
      setModal(null);
      load();
    } else {
      toast.error(result?.message || 'Failed');
    }
  };

  const tabs = [
    { id: 'shops', label: 'Shops', icon: Store, count: counts.shops },
    { id: 'staff', label: 'Staff', icon: User, count: counts.staff },
    { id: 'services', label: 'Services', icon: Scissors, count: counts.services },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
          <span className="text-2xs uppercase tracking-widest text-warning font-semibold">
            {counts.total} items awaiting your review
          </span>
        </div>
        <h1 className="text-display">Approvals Hub</h1>
        <p className="text-body mt-1">Review and approve pending items · Click card to see details</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`card p-5 text-left transition-all ${
              tab === t.id ? 'border-accent-500/40 shadow-glow-sm' : 'hover:border-white/[0.1]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                t.id === 'shops' ? 'bg-info/15 text-info' :
                t.id === 'staff' ? 'bg-accent-500/15 text-accent-500' :
                'bg-brand-500/15 text-brand-500'
              }`}>
                <t.icon className="w-5 h-5" />
              </div>
              {t.count > 0 && <span className="chip-accent">{t.count} pending</span>}
            </div>
            <p className="text-sm font-semibold">{t.label}</p>
            <p className="text-2xs text-white/40 mt-0.5">
              {t.count === 0 ? 'All clear!' : `${t.count} need review`}
            </p>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent-500" />
        </div>
      ) : (
        <>
          {/* SHOPS TAB */}
          {tab === 'shops' && (
            <div className="space-y-3">
              {data.shops.length === 0 ? (
                <div className="card p-12 text-center">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-success mb-3" />
                  <p className="text-body">No pending shop approvals</p>
                </div>
              ) : (
                data.shops.map((shop) => (
                  <div
                    key={shop._id}
                    onClick={() => openShopDetails(shop)}
                    className="card p-5 cursor-pointer hover:border-white/[0.15] hover:shadow-elevation-3 transition-all group"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
                          <Store className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white truncate group-hover:text-accent-500 transition-colors">
                            {shop.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-2xs text-white/50 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {shop.address?.area}, {shop.address?.city}
                            </span>
                            <span className="text-2xs text-white/50 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {shop.owner?.name}
                            </span>
                            <span className="text-2xs text-white/50 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {shop.owner?.phone || shop.phone}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="chip-info">{shop.services?.length || 0} services</span>
                            <span className="chip-neutral flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(shop.locationSubmittedAt || shop.createdAt).toLocaleDateString('en-IN')}
                            </span>
                            <span className="chip-neutral flex items-center gap-1 text-2xs text-accent-500">
                              <Eye className="w-3 h-3" />
                              Click to view details
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-2 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setModal({ type: 'shop', action: 'reject', item: shop })}
                          className="btn-outline"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => setModal({ type: 'shop', action: 'approve', item: shop })}
                          className="btn-accent"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* STAFF TAB */}
          {tab === 'staff' && (
            <div className="space-y-3">
              {data.staff.length === 0 ? (
                <div className="card p-12 text-center">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-success mb-3" />
                  <p className="text-body">No pending staff approvals</p>
                </div>
              ) : (
                data.staff.map((staff) => (
                  <div key={staff._id} className="card p-5">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center flex-shrink-0">
                          {staff.profilePhoto ? (
                            <img src={staff.profilePhoto} alt="" className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-surface-100" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white truncate">
                            {staff.name}
                            {staff.isOwner && <span className="chip-accent ml-2 text-2xs">Owner</span>}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-2xs text-white/50 flex items-center gap-1">
                              <Store className="w-3 h-3" />
                              {staff.shop?.name}
                            </span>
                            <span className="text-2xs text-white/50 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {staff.phone}
                            </span>
                            <span className="chip-neutral capitalize">{staff.role}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setModal({ type: 'staff', action: 'reject', item: staff })}
                          className="btn-outline"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => setModal({ type: 'staff', action: 'approve', item: staff })}
                          className="btn-accent"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* SERVICES TAB */}
          {tab === 'services' && (
            <div className="space-y-3">
              {data.services.length === 0 ? (
                <div className="card p-12 text-center">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-success mb-3" />
                  <p className="text-body">No pending service approvals</p>
                </div>
              ) : (
                data.services.map((service, i) => (
                  <div key={`${service.shopId}-${service._id || i}`} className="card p-5">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {service.photo ? (
                            <img src={service.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Scissors className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white truncate">{service.name}</h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="chip-accent">₹{service.price}</span>
                            <span className="chip-info">{service.duration} min</span>
                            <span className="chip-neutral capitalize">{service.category}</span>
                          </div>
                          <p className="text-2xs text-white/40 mt-2 flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            {service.shopName} · by {service.owner?.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setModal({ type: 'service', action: 'reject', item: service })}
                          className="btn-outline"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => setModal({ type: 'service', action: 'approve', item: service })}
                          className="btn-accent"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* CONFIRM MODAL */}
      {modal && (
        <ConfirmModal
          isOpen={!!modal}
          onClose={() => !actionLoading && setModal(null)}
          onConfirm={(reason) => handleAction(modal.type, modal.action, modal.item, reason)}
          loading={actionLoading}
          title={`${modal.action === 'approve' ? 'Approve' : 'Reject'} ${modal.type}?`}
          message={
            modal.action === 'approve'
              ? `Approve "${modal.item.name || modal.item.shop?.name}"?`
              : `Reject "${modal.item.name || modal.item.shop?.name}"? Please provide a reason.`
          }
          confirmText={modal.action === 'approve' ? 'Approve' : 'Reject'}
          variant={modal.action === 'approve' ? 'info' : 'danger'}
          requireReason={modal.action === 'reject'}
        />
      )}

      {/* ⭐ FULL SHOP DETAILS MODAL */}
      {detailsModal && (
        <ShopDetailsModal
          data={detailsModal}
          loading={detailsLoading}
          onClose={() => setDetailsModal(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// SHOP DETAILS MODAL COMPONENT
// ═══════════════════════════════════════════════════
function ShopDetailsModal({ data, loading, onClose }) {
  if (loading || !data || data.loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative card p-12 flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-accent-500" />
          <p className="text-body">Loading shop details...</p>
        </div>
      </div>
    );
  }

  const { shop, staff, recentBookings, reviews, metrics } = data;
  const coords = shop?.location?.coordinates || [0, 0];
  const [lng, lat] = coords;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl my-8 card p-6 animate-scale-in">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 btn-icon z-10">
          <XCircle className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
            <Store className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-heading truncate">{shop.name}</h2>
            <p className="text-body mt-1">{shop.description || 'No description'}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="chip-warning">Pending Approval</span>
              <span className="chip-info">{shop.services?.length || 0} services</span>
              <span className="chip-neutral">{staff?.length || 0} staff</span>
            </div>
          </div>
        </div>

        {/* Owner Info */}
        <div className="card p-4 mb-6">
          <p className="stat-label mb-3">Shop Owner</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-500/15 flex items-center justify-center">
              <User className="w-5 h-5 text-accent-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{shop.owner?.name}</p>
              <div className="flex items-center gap-3 mt-1">
                <a
                  href={`tel:${shop.owner?.phone || shop.phone}`}
                  className="text-xs text-white/60 hover:text-accent-500 flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  {shop.owner?.phone || shop.phone}
                </a>
                {shop.owner?.email && (
                  <a
                    href={`mailto:${shop.owner.email}`}
                    className="text-xs text-white/60 hover:text-accent-500 flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    {shop.owner.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card p-4 mb-6">
          <p className="stat-label mb-3">Location</p>
          <div className="flex items-start gap-3 mb-3">
            <MapPin className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm">{shop.address?.fullAddress || shop.address?.area}</p>
              <p className="text-xs text-white/40 mt-1">
                {shop.address?.city}, {shop.address?.state} {shop.address?.pincode}
              </p>
              {coords[0] !== 0 && (
                <p className="text-2xs text-white/40 font-mono mt-1">
                  📍 {lat.toFixed(6)}, {lng.toFixed(6)}
                </p>
              )}
            </div>
          </div>

          {coords[0] !== 0 && (
            <div className="flex gap-2 flex-wrap">
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener"
                className="btn-outline flex-1 justify-center"
              >
                <ExternalLink className="w-4 h-4" />
                View on Google Maps
              </a>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener"
                className="btn-outline flex-1 justify-center"
              >
                <Navigation className="w-4 h-4" />
                Get Directions
              </a>
            </div>
          )}
        </div>

        {/* Services */}
        {shop.services?.length > 0 && (
          <div className="mb-6">
            <p className="stat-label mb-3">Services Offered ({shop.services.length})</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {shop.services.map((s, i) => (
                <div key={i} className="card p-3 flex items-center gap-3">
                  {s.photo ? (
                    <img src={s.photo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-brand-500/15 flex items-center justify-center">
                      <Scissors className="w-4 h-4 text-brand-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-accent-500 font-semibold">₹{s.price}</span>
                      <span className="text-2xs text-white/40">{s.duration}min</span>
                      <span className="text-2xs text-white/40 capitalize">{s.category}</span>
                    </div>
                  </div>
                  <span className={
                    s.approvalStatus === 'approved' ? 'chip-success text-2xs' :
                    s.approvalStatus === 'rejected' ? 'chip-error text-2xs' :
                    'chip-warning text-2xs'
                  }>
                    {s.approvalStatus || 'approved'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Staff */}
        {staff?.length > 0 && (
          <div className="mb-6">
            <p className="stat-label mb-3">Staff Members ({staff.length})</p>
            <div className="space-y-2">
              {staff.map((s) => (
                <div key={s._id} className="card p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent-500/15 flex items-center justify-center overflow-hidden">
                    {s.profilePhoto ? (
                      <img src={s.profilePhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-accent-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {s.name}
                      {s.isOwner && <span className="chip-accent text-2xs ml-2">Owner</span>}
                    </p>
                    <p className="text-2xs text-white/40">{s.phone} · {s.role}</p>
                  </div>
                  <span className={
                    s.approvalStatus === 'approved' ? 'chip-success text-2xs' :
                    s.approvalStatus === 'rejected' ? 'chip-error text-2xs' :
                    'chip-warning text-2xs'
                  }>
                    {s.approvalStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Working Hours */}
        {shop.workingHours && Object.keys(shop.workingHours).length > 0 && (
          <div className="mb-6">
            <p className="stat-label mb-3">Working Hours</p>
            <div className="card p-3 space-y-1">
              {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => {
                const h = shop.workingHours[day];
                if (!h) return null;
                return (
                  <div key={day} className="flex items-center justify-between text-xs">
                    <span className="capitalize text-white/60">{day}</span>
                    <span className={h.isOff ? 'text-error' : 'text-white'}>
                      {h.isOff ? 'CLOSED' : `${h.open || h.start || '09:00'} - ${h.close || h.end || '21:00'}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
