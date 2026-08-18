'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, Store, MapPin, User, Phone, Calendar,
  TrendingUp, Zap, Activity, Copy, ExternalLink, QrCode,
  Smartphone, Globe, Navigation, FileText, Clock, Package,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function QRDetailPage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.code]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/qr/${params.code}`);
      const d = await res.json();
      if (d.success) setData(d);
      else toast.error(d.message || 'Failed to load');
    } catch (e) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = () => {
    if (!data?.qr?.full_url) return;
    navigator.clipboard.writeText(data.qr.full_url);
    toast.success('URL copied');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-12 flex justify-center">
        <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
      </div>
    );
  }
  if (!data?.qr) {
    return (
      <div className="max-w-6xl mx-auto text-center py-20">
        <QrCode className="w-16 h-16 mx-auto text-white/20 mb-3" />
        <p className="text-white/60">QR code not found</p>
        <Link href="/dashboard/qr-explorer" className="text-[#FFD700] mt-3 inline-block">
          ← Back to Explorer
        </Link>
      </div>
    );
  }

  const { qr, activation, daily_scans, device_breakdown, recent_scans } = data;
  const isActivated = !!activation;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/dashboard/qr-explorer" className="p-2 bg-white/[0.05] rounded-lg hover:bg-white/[0.1] flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-lg font-black text-[#FFD700] bg-[#FFD700]/10 px-3 py-1 rounded-lg">
              {qr.short_code}
            </span>
            {qr.status === 'ACTIVE' ? (
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full font-bold">ACTIVE</span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 bg-red-500/15 text-red-400 rounded-full font-bold">INACTIVE</span>
            )}
          </div>
          <h1 className="text-2xl font-bold truncate">
            {activation?.shop_name || <span className="text-white/50">Not activated yet</span>}
          </h1>
          {activation && (
            <p className="text-sm text-white/60 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {activation.location?.town || activation.location?.city || 'No location'}
              {activation.location?.state && ` · ${activation.location.state}`}
            </p>
          )}
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Scans" value={qr.total_scans} icon={TrendingUp} color="from-[#E63946] to-[#B01824]" />
        <MetricCard
          label="Last Scan"
          value={qr.last_scanned_at ? timeAgo(qr.last_scanned_at) : 'Never'}
          icon={Clock}
          color="from-blue-500 to-blue-700"
          isText
        />
        <MetricCard
          label="Activated"
          value={activation ? new Date(activation.activated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Not yet'}
          icon={Zap}
          color="from-emerald-500 to-emerald-700"
          isText
        />
        <MetricCard
          label="Batch"
          value={qr.batch_name || 'N/A'}
          icon={Package}
          color="from-[#FFD700] to-[#B08900]"
          valueClass="text-black"
          isText
        />
      </div>

      {/* URL bar */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex items-center gap-3">
        <QrCode className="w-4 h-4 text-[#FFD700] flex-shrink-0" />
        <code className="text-xs text-white/70 flex-1 truncate">{qr.full_url}</code>
        <button
          onClick={copyUrl}
          className="p-2 bg-white/[0.05] rounded-lg hover:bg-white/[0.1]"
          title="Copy URL"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <a
          href={qr.full_url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 bg-white/[0.05] rounded-lg hover:bg-white/[0.1]"
          title="Open"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {isActivated ? (
        <>
          {/* Scan chart */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FFD700]" />
              Scans (last 30 days)
            </h3>
            {daily_scans.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Activity className="w-8 h-8 text-white/10 mb-2" />
                <p className="text-xs text-white/40">No scans yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={daily_scans}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a1a',
                      border: '1px solid rgba(255,215,0,0.3)',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#FFD700" strokeWidth={3} dot={{ fill: '#E63946', r: 3 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Details grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Shop / Location details */}
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Store className="w-4 h-4 text-[#FFD700]" />
                Shop / Location Details
              </h3>
              <div className="space-y-2.5">
                <DetailRow label="Type" value={formatType(activation.location_type)} />
                <DetailRow label="Shop Name" value={activation.shop_name} highlight />
                <DetailRow label="Owner" value={activation.owner_name} />
                <DetailRow label="Owner Phone" value={activation.owner_phone} />
                {activation.vehicle_number && (
                  <DetailRow label="Vehicle Number" value={activation.vehicle_number} mono />
                )}
                <div className="border-t border-white/[0.06] my-3" />
                <DetailRow label="Town" value={activation.location?.town} highlight />
                <DetailRow label="City" value={activation.location?.city} />
                <DetailRow label="State" value={activation.location?.state} />
                <DetailRow label="Pincode" value={activation.location?.pincode} />
                <DetailRow label="Landmark" value={activation.location?.landmark} />
                <DetailRow label="Address" value={activation.location?.address} />
                <DetailRow label="Placement" value={activation.placement_position} />
              </div>
            </div>

            {/* Activation + GPS + Notes */}
            <div className="space-y-4">
              {/* Who activated */}
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#FFD700]" />
                  Activated By
                </h3>
                {activation.activated_by_id ? (
                  <Link
                    href={`/dashboard/marketing/${activation.activated_by_id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E63946] to-[#B01824] flex items-center justify-center text-white font-black border-2 border-[#FFD700]/30">
                      {activation.activated_by_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{activation.activated_by_name}</p>
                      <p className="text-xs text-white/50">Marketing Agent · Click to view profile</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-white/40" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03]">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white font-black">
                      A
                    </div>
                    <div>
                      <p className="font-semibold">Admin</p>
                      <p className="text-xs text-white/50">Activated from admin panel</p>
                    </div>
                  </div>
                )}
                <p className="text-xs text-white/40 mt-3">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {new Date(activation.activated_at).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>

              {/* GPS */}
              {activation.gps_location && (
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-[#FFD700]" />
                    GPS Location
                  </h3>
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5">
                    <p className="text-xs text-white/50">Latitude · Longitude</p>
                    <p className="font-mono text-sm text-[#FFD700] mt-1">
                      {activation.gps_location.latitude?.toFixed(6)}, {activation.gps_location.longitude?.toFixed(6)}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${activation.gps_location.latitude},${activation.gps_location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold hover:bg-blue-500/20"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in Google Maps
                  </a>
                </div>
              )}

              {/* Notes */}
              {activation.notes && (
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#FFD700]" />
                    Notes
                  </h3>
                  <p className="text-sm text-white/80 whitespace-pre-wrap">{activation.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Device breakdown */}
          {device_breakdown.length > 0 && (
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#FFD700]" />
                Scanner Devices
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {device_breakdown.map((d) => (
                  <div key={d.name} className="p-3 rounded-lg bg-white/[0.03]">
                    <p className="text-xs text-white/50 uppercase">{d.name}</p>
                    <p className="text-xl font-black text-[#FFD700] mt-1">{d.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent scans */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl">
            <div className="p-4 border-b border-white/[0.06]">
              <h3 className="font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FFD700]" />
                Recent Scans ({recent_scans.length})
              </h3>
            </div>
            {recent_scans.length === 0 ? (
              <div className="p-12 text-center">
                <Activity className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">No scans yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {recent_scans.map((s) => (
                  <div key={s._id} className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-4 h-4 text-white/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="capitalize font-semibold">{s.device?.os || 'unknown'}</span>
                        <span className="text-white/40"> · {s.device?.type || 'device'}</span>
                      </p>
                      <p className="text-xs text-white/50 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {s.scanner_location?.city || s.scanner_location?.country || 'Unknown location'}
                      </p>
                    </div>
                    <span className="text-xs text-white/40">{timeAgo(s.scanned_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-8 text-center">
          <QrCode className="w-12 h-12 text-yellow-500/50 mx-auto mb-3" />
          <p className="text-lg font-bold text-yellow-400">This QR is not activated yet</p>
          <p className="text-sm text-white/60 mt-2">
            Print this QR and have a marketing agent scan it to activate.
          </p>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color, valueClass = 'text-white', isText = false }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-2`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold">{label}</p>
      <p className={`font-black mt-1 ${isText ? 'text-sm' : 'text-2xl'} ${valueClass}`}>
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </p>
    </div>
  );
}

function DetailRow({ label, value, highlight, mono }) {
  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <span className="text-white/50 uppercase text-[10px] font-bold tracking-wider self-center">
        {label}
      </span>
      <span className={`col-span-2 ${highlight ? 'text-[#FFD700] font-bold' : 'text-white/90'} ${mono ? 'font-mono text-xs' : ''}`}>
        {value || <span className="text-white/30 italic">—</span>}
      </span>
    </div>
  );
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatType(t) {
  if (!t) return '—';
  const map = {
    barber_shop: '💈 Barber Shop',
    salon: '💇 Salon',
    restaurant: '🍽️ Restaurant',
    gym: '💪 Gym',
    medical: '⚕️ Medical',
    kirana: '🏪 Kirana',
    mall: '🏬 Mall',
    office: '🏢 Office',
    college: '🎓 College',
    transit: '🚏 Transit',
    public_place: '🏙️ Public Place',
    vehicle: '🚗 Vehicle',
    other: '📍 Other',
  };
  return map[t] || t;
}
