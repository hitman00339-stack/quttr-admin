'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Loader2, Save, MapPin, CheckCircle, Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ScissorQR from '@/components/qr/ScissorQR';

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

export default function QRDetailPage() {
  const params = useParams();
  const shortCode = params.code;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [data, setData] = useState(null);
  const [gpsCaptured, setGpsCaptured] = useState(false);
  
  const [formData, setFormData] = useState({
    location_type: 'barber_shop',
    shop_name: '',
    vehicle_number: '',
    state: '',
    city: '',
    town: '',
    gps_lat: null,
    gps_lng: null,
    notes: '',
  });

  useEffect(() => {
    if (shortCode) loadQR();
  }, [shortCode]);

  const loadQR = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/qr/activate?code=${shortCode}`);
      const result = await res.json();
      
      if (result.success) {
        setData(result);
        if (result.activation) {
          setFormData({
            location_type: result.activation.location_type || 'barber_shop',
            shop_name: result.activation.shop_name || '',
            vehicle_number: result.activation.vehicle_number || '',
            state: result.activation.location?.state || '',
            city: result.activation.location?.city || '',
            town: result.activation.location?.town || '',
            gps_lat: result.activation.gps_location?.latitude || null,
            gps_lng: result.activation.gps_location?.longitude || null,
            notes: result.activation.notes || '',
          });
          if (result.activation.gps_location) {
            setGpsCaptured(true);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const captureGPSAndLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('GPS not supported on this device');
      return;
    }
    
    setGpsLoading(true);
    toast.loading('📍 Getting location...', { id: 'gps' });
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          // Use OpenStreetMap Nominatim (FREE) for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en&zoom=18`
          );
          
          const data = await response.json();
          
          if (data && data.address) {
            const addr = data.address;
            
            // Extract state and city
            const state = addr.state || addr.state_district || '';
            const city = addr.city || addr.town || addr.county || addr.suburb || '';
            
            setFormData(prev => ({
              ...prev,
              state,
              city,
              gps_lat: lat,
              gps_lng: lng,
            }));
            
            setGpsCaptured(true);
            toast.success(`📍 ${city}, ${state}`, { id: 'gps' });
          } else {
            // Just save GPS if reverse geocoding fails
            setFormData(prev => ({ ...prev, gps_lat: lat, gps_lng: lng }));
            setGpsCaptured(true);
            toast.success('GPS captured! Fill state/city manually', { id: 'gps' });
          }
        } catch (err) {
          setFormData(prev => ({ ...prev, gps_lat: lat, gps_lng: lng }));
          setGpsCaptured(true);
          toast.success('GPS captured!', { id: 'gps' });
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        setGpsLoading(false);
        let msg = 'Could not get location';
        if (error.code === 1) msg = 'Please allow location permission';
        toast.error(msg, { id: 'gps' });
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSave = async () => {
    // Validation
    if (!formData.location_type) {
      toast.error('Select location type');
      return;
    }
    if (!formData.town) {
      toast.error('Please enter Town name');
      return;
    }
    
    const type = LOCATION_TYPES.find(t => t.id === formData.location_type);
    
    if (type?.needsShop && !formData.shop_name) {
      toast.error('Please enter shop name');
      return;
    }
    if (type?.isVehicle && !formData.vehicle_number) {
      toast.error('Please enter vehicle number');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        short_code: shortCode,
        location_type: formData.location_type,
        shop_name: formData.shop_name,
        vehicle_number: formData.vehicle_number,
        state: formData.state,
        city: formData.city,
        town: formData.town,
        notes: formData.notes,
        gps_location: (formData.gps_lat && formData.gps_lng) ? {
          latitude: formData.gps_lat,
          longitude: formData.gps_lng,
        } : null,
      };
      
      const res = await fetch('/api/qr/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success('✅ QR Activated!');
        loadQR();
      } else {
        toast.error(result.message || 'Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Deactivate this QR?')) return;
    try {
      const res = await fetch(`/api/qr/activate?code=${shortCode}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        toast.success('QR deactivated');
        loadQR();
      }
    } catch (error) {
      toast.error('Failed');
    }
  };

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <Loader2 className="w-8 h-8 text-accent-500 animate-spin mx-auto" />
      </div>
    );
  }

  const selectedType = LOCATION_TYPES.find(t => t.id === formData.location_type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/qr-codes" className="btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-heading font-mono">{data?.qr_code?.short_code}</h1>
            <p className="text-caption mt-1">
              {data?.qr_code?.status === 'ACTIVE' ? '✅ Active' : '⏳ Not activated'} · {data?.qr_code?.total_scans || 0} scans
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: QR Code */}
        <div className="card p-6">
          <h3 className="text-title mb-4">QR Code</h3>
          <div className="flex justify-center mb-4">
            {data?.qr_code?.full_url && (
              <ScissorQR value={data.qr_code.full_url} size={280} />
            )}
          </div>
          <div className="p-3 bg-white/[0.03] rounded-xl">
            <p className="text-xs text-white/60 break-all text-center">
              {data?.qr_code?.full_url}
            </p>
          </div>
          
          {data?.activation && (
            <div className="mt-4 p-4 bg-success/10 border border-success/20 rounded-xl">
              <p className="text-success font-bold mb-2">✅ Activated</p>
              <div className="text-sm space-y-1">
                {data.activation.shop_name && (
                  <p><span className="text-white/50">Shop:</span> {data.activation.shop_name}</p>
                )}
                {data.activation.location?.town && (
                  <p><span className="text-white/50">Town:</span> <span className="text-[#FFD700] font-bold">{data.activation.location.town}</span></p>
                )}
                {data.activation.location?.city && (
                  <p><span className="text-white/50">City:</span> {data.activation.location.city}</p>
                )}
                {data.activation.location?.state && (
                  <p><span className="text-white/50">State:</span> {data.activation.location.state}</p>
                )}
              </div>
              <button
                onClick={handleDeactivate}
                className="mt-3 text-xs text-error hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Deactivate
              </button>
            </div>
          )}
        </div>

        {/* Right: Simple Form */}
        <div className="card p-6">
          <h3 className="text-title mb-4">
            {data?.activation ? '✏️ Update Details' : '✨ Activate QR'}
          </h3>

          <div className="space-y-4">
            {/* Step 1: GPS Capture */}
            <div className="p-4 bg-gradient-to-br from-[#E63946]/10 to-[#FFD700]/5 border border-[#FFD700]/30 rounded-xl">
              <p className="text-sm font-bold text-[#FFD700] mb-2">
                📍 Step 1: Capture Location
              </p>
              <p className="text-xs text-white/60 mb-3">
                Click below to auto-fill State and City using GPS
              </p>
              <button
                onClick={captureGPSAndLocation}
                disabled={gpsLoading}
                className="btn-accent w-full"
              >
                {gpsLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Getting location...</>
                ) : gpsCaptured ? (
                  <><CheckCircle className="w-4 h-4" /> ✅ GPS Captured - Re-capture</>
                ) : (
                  <><MapPin className="w-4 h-4" /> Capture GPS Now</>
                )}
              </button>
              
              {gpsCaptured && formData.gps_lat && (
                <p className="text-xs text-white/50 mt-2 text-center">
                  📍 {formData.gps_lat.toFixed(4)}, {formData.gps_lng.toFixed(4)}
                </p>
              )}
            </div>

            {/* Step 2: Location Type */}
            <div>
              <label className="label">
                <span className="text-error">*</span> Step 2: Location Type
              </label>
              <select
                value={formData.location_type}
                onChange={(e) => setFormData({...formData, location_type: e.target.value})}
                className="input"
              >
                {LOCATION_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            {/* Shop Name (if needed) */}
            {selectedType?.needsShop && (
              <div>
                <label className="label">
                  <span className="text-error">*</span> Shop Name
                </label>
                <input
                  type="text"
                  value={formData.shop_name}
                  onChange={(e) => setFormData({...formData, shop_name: e.target.value})}
                  className="input"
                  placeholder="e.g., Sharma Barber Shop"
                />
                <p className="label-hint">This name will show on landing page</p>
              </div>
            )}

            {/* Vehicle Number (if vehicle) */}
            {selectedType?.isVehicle && (
              <div>
                <label className="label">
                  <span className="text-error">*</span> Vehicle Number
                </label>
                <input
                  type="text"
                  value={formData.vehicle_number}
                  onChange={(e) => setFormData({...formData, vehicle_number: e.target.value.toUpperCase()})}
                  className="input font-mono"
                  placeholder="e.g., DL-1RJ-1234"
                />
              </div>
            )}

            {/* Auto-filled State & City (read-only if GPS captured) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className={`input ${gpsCaptured ? 'bg-success/5 border-success/30' : ''}`}
                  placeholder="Auto-filled from GPS"
                />
                {gpsCaptured && <p className="label-hint text-success">✅ Auto-filled</p>}
              </div>
              <div>
                <label className="label">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className={`input ${gpsCaptured ? 'bg-success/5 border-success/30' : ''}`}
                  placeholder="Auto-filled from GPS"
                />
                {gpsCaptured && <p className="label-hint text-success">✅ Auto-filled</p>}
              </div>
            </div>

            {/* Town - MAIN FIELD */}
            <div className="p-4 bg-gradient-to-br from-[#FFD700]/10 to-[#E63946]/5 border-2 border-[#FFD700]/40 rounded-xl">
              <label className="label text-[#FFD700]">
                <span className="text-error">*</span> 🏘️ Town / Nagar (Required)
              </label>
              <input
                type="text"
                value={formData.town}
                onChange={(e) => setFormData({...formData, town: e.target.value})}
                className="input text-lg font-semibold"
                placeholder="e.g., Lajpat Nagar, Karol Bagh"
                autoFocus
              />
              <p className="label-hint text-[#FFD700] mt-2">
                ✨ यह Town नाम landing page पर दिखेगा
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="label">Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="input min-h-[60px] resize-none"
                placeholder="Any additional notes..."
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-brand w-full py-3"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> {data?.activation ? 'Update' : 'Activate'} QR Code</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
