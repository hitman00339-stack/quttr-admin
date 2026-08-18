'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Loader2, Save, MapPin, CheckCircle, Store,
  User, Phone, FileText, Navigation, AlertCircle,
} from 'lucide-react';

const LOCATION_TYPES = [
  { id: 'barber_shop', name: '💈 Barber Shop', needsShop: true },
  { id: 'salon', name: '💇 Salon / Beauty Parlour', needsShop: true },
  { id: 'restaurant', name: '🍽️ Restaurant / Cafe', needsShop: true },
  { id: 'gym', name: '💪 Gym / Fitness Center', needsShop: true },
  { id: 'medical', name: '⚕️ Medical Store / Clinic', needsShop: true },
  { id: 'kirana', name: '🏪 Kirana / General Store', needsShop: true },
  { id: 'mall', name: '🏬 Mall / Shopping Complex', needsShop: true },
  { id: 'office', name: '🏢 Office / Coworking', needsShop: true },
  { id: 'college', name: '🎓 College / Institute', needsShop: true },
  { id: 'transit', name: '🚏 Bus Stop / Metro Station', needsShop: false },
  { id: 'public_place', name: '🏙️ Public Place / Wall', needsShop: false },
  { id: 'vehicle', name: '🚗 Vehicle (Auto/Bus/Cab)', needsShop: false, isVehicle: true },
  { id: 'other', name: '📍 Other', needsShop: false },
];

export default function AgentActivatePage() {
  const params = useParams();
  const router = useRouter();
  const shortCode = params.code;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [data, setData] = useState(null);
  const [gpsCaptured, setGpsCaptured] = useState(false);

  const [form, setForm] = useState({
    location_type: 'barber_shop',
    shop_name: '',
    owner_name: '',
    owner_phone: '',
    vehicle_number: '',
    state: '',
    city: '',
    town: '',
    landmark: '',
    gps_lat: null,
    gps_lng: null,
    notes: '',
  });

  // Verify logged in + load QR
  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch('/api/marketing/auth/me');
        const me = await meRes.json();
        if (!me.success) {
          router.replace('/marketing/login');
          return;
        }
        await loadQR();
      } catch (e) {
        router.replace('/marketing/login');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadQR = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/qr/activate?code=${encodeURIComponent(shortCode)}`);
      const result = await res.json();
      if (result.success) {
        setData(result);
        if (result.activation) {
          setForm({
            location_type: result.activation.location_type || 'barber_shop',
            shop_name: result.activation.shop_name || '',
            owner_name: result.activation.owner_name || '',
            owner_phone: result.activation.owner_phone || '',
            vehicle_number: result.activation.vehicle_number || '',
            state: result.activation.location?.state || '',
            city: result.activation.location?.city || '',
            town: result.activation.location?.town || '',
            landmark: result.activation.location?.landmark || '',
            gps_lat: result.activation.gps_location?.latitude || null,
            gps_lng: result.activation.gps_location?.longitude || null,
            notes: result.activation.notes || '',
          });
          if (result.activation.gps_location) setGpsCaptured(true);
        }
      } else {
        toast.error(result.message || 'QR not found');
      }
    } catch (e) {
      toast.error('Failed to load QR');
    } finally {
      setLoading(false);
    }
  };

  const captureGPS = () => {
    if (!navigator.geolocation) {
      toast.error('GPS not supported on this device');
      return;
    }
    setGpsLoading(true);
    toast.loading('Getting location...', { id: 'gps' });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en&zoom=18`
          );
          const d = await r.json();
          if (d?.address) {
            const state = d.address.state || '';
            const city =
              d.address.city ||
              d.address.town ||
              d.address.village ||
              d.address.county ||
              d.address.suburb ||
              '';
            setForm((f) => ({
              ...f,
              state,
              city,
              gps_lat: lat,
              gps_lng: lng,
            }));
            setGpsCaptured(true);
            toast.success(`📍 ${city || 'GPS captured'}`, { id: 'gps' });
          } else {
            setForm((f) => ({ ...f, gps_lat: lat, gps_lng: lng }));
            setGpsCaptured(true);
            toast.success('GPS captured', { id: 'gps' });
          }
        } catch (e) {
          setForm((f) => ({ ...f, gps_lat: lat, gps_lng: lng }));
          setGpsCaptured(true);
          toast.success('GPS captured', { id: 'gps' });
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        const msg =
          err.code === 1
            ? 'Please allow location permission in browser'
            : 'Could not get location';
        toast.error(msg, { id: 'gps' });
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSave = async () => {
    if (!form.town.trim()) {
      toast.error('Town is required');
      return;
    }
    const type = LOCATION_TYPES.find((t) => t.id === form.location_type);
    if (type?.needsShop && !form.shop_name.trim()) {
      toast.error('Shop name required for this location type');
      return;
    }
    if (type?.isVehicle && !form.vehicle_number.trim()) {
      toast.error('Vehicle number required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        short_code: shortCode,
        location_type: form.location_type,
        shop_name: form.shop_name,
        owner_name: form.owner_name,
        owner_phone: form.owner_phone,
        vehicle_number: form.vehicle_number,
        state: form.state,
        city: form.city,
        town: form.town,
        landmark: form.landmark,
        notes: form.notes,
        gps_location:
          form.gps_lat && form.gps_lng
            ? { latitude: form.gps_lat, longitude: form.gps_lng }
            : null,
      };
      const res = await fetch('/api/qr/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('✅ QR Activated!');
        setTimeout(() => router.push('/marketing/dashboard'), 800);
      } else {
        toast.error(result.message || 'Failed to save');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
      </div>
    );
  }

  const selectedType = LOCATION_TYPES.find((t) => t.id === form.location_type);
  const isReactivate = !!data?.activation;

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <header className="border-b border-white/[0.06] bg-black/70 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/marketing/scan"
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Scan Again
          </Link>
          <h1 className="text-sm font-bold">
            {isReactivate ? 'Update QR' : 'Activate QR'}
          </h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {/* QR code display */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFD700]/15 to-[#E63946]/10 border-2 border-[#FFD700]/40 text-center">
          <p className="text-xs uppercase tracking-wider text-[#FFD700] font-bold mb-1">
            QR Code
          </p>
          <p className="text-3xl font-black font-mono text-white tracking-[0.2em]">
            {shortCode}
          </p>
          {isReactivate && (
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" />
              Already activated · Updating
            </div>
          )}
        </div>

        {/* Step 1: GPS */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#E63946]/15 to-[#FFD700]/5 border border-[#FFD700]/30">
          <p className="text-sm font-bold text-[#FFD700] mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#FFD700] text-black text-xs flex items-center justify-center font-black">1</span>
            Capture Location (GPS)
          </p>
          <p className="text-xs text-white/60 mb-3">
            Auto-fills State & City from your phone GPS
          </p>
          <button
            onClick={captureGPS}
            disabled={gpsLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#B08900] text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {gpsLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Getting location...</>
            ) : gpsCaptured ? (
              <><CheckCircle className="w-4 h-4" /> ✓ Captured — Re-capture</>
            ) : (
              <><Navigation className="w-4 h-4" /> Capture GPS Now</>
            )}
          </button>
          {gpsCaptured && form.gps_lat && (
            <p className="text-[10px] text-white/50 mt-2 text-center font-mono">
              📍 {form.gps_lat.toFixed(5)}, {form.gps_lng.toFixed(5)}
            </p>
          )}
        </div>

        {/* Step 2: Location Type */}
        <div>
          <label className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#FFD700] text-black text-xs flex items-center justify-center font-black">2</span>
            Location Type
          </label>
          <select
            value={form.location_type}
            onChange={(e) => setForm({ ...form, location_type: e.target.value })}
            className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white focus:border-[#FFD700]/40 focus:outline-none"
          >
            {LOCATION_TYPES.map((t) => (
              <option key={t.id} value={t.id} className="bg-neutral-900">
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Shop name */}
        {selectedType?.needsShop && (
          <FormField
            label="Shop Name"
            required
            icon={Store}
            value={form.shop_name}
            onChange={(v) => setForm({ ...form, shop_name: v })}
            placeholder="e.g., Sharma Barber Shop"
            hint="This name will appear inside the app for owner tracking"
          />
        )}

        {/* Vehicle */}
        {selectedType?.isVehicle && (
          <FormField
            label="Vehicle Number"
            required
            value={form.vehicle_number}
            onChange={(v) => setForm({ ...form, vehicle_number: v.toUpperCase() })}
            placeholder="e.g., DL-1RJ-1234"
            className="font-mono"
          />
        )}

        {/* Owner name & phone (optional but recommended) */}
        {selectedType?.needsShop && (
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Owner Name"
              icon={User}
              value={form.owner_name}
              onChange={(v) => setForm({ ...form, owner_name: v })}
              placeholder="Optional"
            />
            <FormField
              label="Owner Phone"
              icon={Phone}
              value={form.owner_phone}
              onChange={(v) => setForm({ ...form, owner_phone: v })}
              placeholder="Optional"
              type="tel"
            />
          </div>
        )}

        {/* State + City (auto-filled) */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="State"
            value={form.state}
            onChange={(v) => setForm({ ...form, state: v })}
            placeholder="From GPS"
            highlight={gpsCaptured}
          />
          <FormField
            label="City"
            value={form.city}
            onChange={(v) => setForm({ ...form, city: v })}
            placeholder="From GPS"
            highlight={gpsCaptured}
          />
        </div>

        {/* Town — CRITICAL */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFD700]/15 to-[#E63946]/5 border-2 border-[#FFD700]/40">
          <label className="text-sm font-bold text-[#FFD700] mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#FFD700] text-black text-xs flex items-center justify-center font-black">3</span>
            🏘️ Town / Nagar (REQUIRED)
          </label>
          <input
            type="text"
            value={form.town}
            onChange={(e) => setForm({ ...form, town: e.target.value })}
            placeholder="e.g., Lajpat Nagar, Sidhauli"
            className="w-full px-4 py-3 bg-black/50 border border-[#FFD700]/40 rounded-xl text-white text-lg font-semibold focus:border-[#FFD700] focus:outline-none"
          />
          <p className="text-[10px] text-[#FFD700] mt-2">
            ⚠️ यह Town नाम landing page पर दिखेगा — जरूर भरें
          </p>
        </div>

        {/* Landmark */}
        <FormField
          label="Landmark"
          value={form.landmark}
          onChange={(v) => setForm({ ...form, landmark: v })}
          placeholder="e.g., Near HDFC ATM"
        />

        {/* Notes */}
        <div>
          <label className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-2">
            <FileText className="w-3 h-3 inline mr-1" />
            Notes (optional)
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            placeholder="Any additional info..."
            className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white text-sm resize-none focus:border-[#FFD700]/40 focus:outline-none"
          />
        </div>

        {/* Save button — sticky bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-black/80 backdrop-blur-xl border-t border-white/10">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#E63946] to-[#B01824] text-white font-black text-base flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_30px_rgba(230,57,70,0.5)]"
            >
              {saving ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-5 h-5" /> {isReactivate ? 'Update' : 'Activate'} QR</>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  required,
  icon: Icon,
  type = 'text',
  hint,
  className = '',
  highlight = false,
}) {
  return (
    <div>
      <label className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-2 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-white/[0.05] border rounded-xl text-white focus:border-[#FFD700]/40 focus:outline-none ${
          highlight ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/10'
        } ${className}`}
      />
      {hint && <p className="text-[10px] text-white/40 mt-1">{hint}</p>}
      {highlight && <p className="text-[10px] text-emerald-400 mt-1">✓ Auto-filled from GPS</p>}
    </div>
  );
}
