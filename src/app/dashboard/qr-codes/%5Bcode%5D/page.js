'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, QrCode, Loader2, MapPin, Store, Phone,
  Save, Trash2, CheckCircle, AlertCircle, TrendingUp,
  Copy, ExternalLink, Edit3, Camera as CameraIcon,
  User, Building, Car, Home
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ScissorQR from '@/components/qr/ScissorQR';

// ============================================
// LOCATION TYPES with conditional fields
// ============================================
const LOCATION_TYPES = [
  { 
    id: 'barber_shop', 
    name: 'Barber Shop', 
    icon: '💈',
    requires: ['shop_name', 'owner_name', 'owner_phone']
  },
  { 
    id: 'salon', 
    name: 'Salon / Beauty Parlour', 
    icon: '💇',
    requires: ['shop_name', 'owner_name', 'owner_phone']
  },
  { 
    id: 'restaurant', 
    name: 'Restaurant / Cafe', 
    icon: '🍽️',
    requires: ['shop_name', 'owner_name']
  },
  { 
    id: 'gym', 
    name: 'Gym / Fitness Center', 
    icon: '💪',
    requires: ['shop_name', 'owner_name']
  },
  { 
    id: 'medical', 
    name: 'Medical Store / Clinic', 
    icon: '⚕️',
    requires: ['shop_name']
  },
  { 
    id: 'kirana', 
    name: 'Kirana / General Store', 
    icon: '🏪',
    requires: ['shop_name', 'owner_name']
  },
  { 
    id: 'mall', 
    name: 'Mall / Shopping Complex', 
    icon: '🏬',
    requires: ['shop_name']
  },
  { 
    id: 'office', 
    name: 'Office / Coworking', 
    icon: '🏢',
    requires: ['shop_name']
  },
  { 
    id: 'college', 
    name: 'College / Institute', 
    icon: '🎓',
    requires: ['shop_name']
  },
  { 
    id: 'transit', 
    name: 'Bus Stop / Metro Station', 
    icon: '🚏',
    requires: []
  },
  { 
    id: 'public_place', 
    name: 'Public Place / Wall', 
    icon: '🏙️',
    requires: []
  },
  { 
    id: 'vehicle', 
    name: 'Vehicle (Auto/Bus/Cab)', 
    icon: '🚗',
    requires: ['vehicle_number', 'vehicle_type']
  },
  { 
    id: 'other', 
    name: 'Other', 
    icon: '📍',
    requires: []
  },
];

const VEHICLE_TYPES = [
  { id: 'auto', name: 'Auto Rickshaw' },
  { id: 'bus', name: 'Bus' },
  { id: 'cab', name: 'Taxi / Cab (Ola/Uber)' },
  { id: 'truck', name: 'Truck / Delivery Vehicle' },
  { id: 'bike', name: 'Bike / Scooter' },
  { id: 'other', name: 'Other Vehicle' },
];

const PLACEMENT_POSITIONS = [
  { id: 'entrance', name: 'Near Entrance / Door' },
  { id: 'inside', name: 'Inside / Waiting Area' },
  { id: 'counter', name: 'Counter / Billing Area' },
  { id: 'window', name: 'Window / Glass' },
  { id: 'wall', name: 'Wall / Pole' },
  { id: 'mirror', name: 'Near Mirror' },
  { id: 'vehicle_back', name: 'Vehicle Back' },
  { id: 'vehicle_side', name: 'Vehicle Side' },
  { id: 'vehicle_inside', name: 'Inside Vehicle' },
  { id: 'other', name: 'Other Position' },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Chandigarh', 'Puducherry', 'Andaman and Nicobar Islands',
  'Dadra and Nagar Haveli', 'Daman and Diu', 'Lakshadweep'
];

export default function QRDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shortCode = params.code;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  
  const [formData, setFormData] = useState({
    location_type: '',
    shop_name: '',
    owner_name: '',
    owner_phone: '',
    owner_whatsapp: '',
    vehicle_number: '',
    vehicle_type: '',
    state: '',
    city: '',
    area: '',
    address: '',
    landmark: '',
    pincode: '',
    placement_position: '',
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
            location_type: result.activation.location_type || '',
            shop_name: result.activation.shop_name || '',
            owner_name: result.activation.owner_name || '',
            owner_phone: result.activation.owner_phone || '',
            owner_whatsapp: result.activation.owner_whatsapp || '',
            vehicle_number: result.activation.vehicle_number || '',
            vehicle_type: result.activation.vehicle_type || '',
            state: result.activation.location?.state || '',
            city: result.activation.location?.city || '',
            area: result.activation.location?.area || '',
            address: result.activation.location?.address || '',
            landmark: result.activation.location?.landmark || '',
            pincode: result.activation.location?.pincode || '',
            placement_position: result.activation.placement_position || '',
            notes: result.activation.notes || '',
          });
        } else {
          setEditing(true);
        }
      } else {
        toast.error('QR not found');
      }
    } catch (error) {
      toast.error('Failed to load QR');
    } finally {
      setLoading(false);
    }
  };

  const captureGPS = () => {
    if (!navigator.geolocation) {
      toast.error('GPS not supported');
      return;
    }
    
    toast.loading('Getting location...', { id: 'gps' });
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        toast.success('Location captured!', { id: 'gps' });
      },
      (error) => {
        toast.error('Could not get location', { id: 'gps' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const getSelectedType = () => {
    return LOCATION_TYPES.find(t => t.id === formData.location_type);
  };

  const isFieldRequired = (field) => {
    const type = getSelectedType();
    return type?.requires?.includes(field) || false;
  };

  const validateForm = () => {
    if (!formData.location_type) {
      toast.error('Please select location type');
      return false;
    }
    
    if (!formData.state) {
      toast.error('Please select state');
      return false;
    }
    
    if (!formData.city) {
      toast.error('Please enter city');
      return false;
    }
    
    const type = getSelectedType();
    if (type) {
      for (const field of type.requires) {
        if (!formData[field]) {
          const fieldNames = {
            shop_name: 'Shop Name',
            owner_name: 'Owner Name',
            owner_phone: 'Owner Phone',
            vehicle_number: 'Vehicle Number',
            vehicle_type: 'Vehicle Type',
          };
          toast.error(`Please enter ${fieldNames[field]}`);
          return false;
        }
      }
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        short_code: shortCode,
        ...formData,
        gps_location: gpsLocation,
      };
      
      const res = await fetch('/api/qr/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success(result.message);
        setEditing(false);
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
    if (!confirm('Deactivate this QR? It will show default landing page.')) return;

    try {
      const res = await fetch(`/api/qr/activate?code=${shortCode}`, {
        method: 'DELETE',
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success('QR deactivated');
        loadQR();
      }
    } catch (error) {
      toast.error('Failed to deactivate');
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(data.qr_code.full_url);
    toast.success('Copied!');
  };

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <Loader2 className="w-8 h-8 text-accent-500 animate-spin mx-auto" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-12 text-center">
        <AlertCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <p className="text-body mb-4">QR not found</p>
        <Link href="/dashboard/qr-codes" className="btn-outline inline-flex">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>
    );
  }

  const { qr_code, activation } = data;
  const selectedType = getSelectedType();
  const isVehicle = formData.location_type === 'vehicle';
  const needsShop = selectedType?.requires?.includes('shop_name');
  const needsOwner = selectedType?.requires?.includes('owner_name');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/qr-codes" className="btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-heading font-mono">{qr_code.short_code}</h1>
            <p className="text-caption mt-1">QR Code Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {qr_code.status === 'ACTIVE' && (
            <span className="chip-success">✅ Active</span>
          )}
          {qr_code.status === 'INACTIVE' && (
            <span className="chip-warning">⏳ Pending Activation</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Scans</p>
              <p className="stat-value text-accent-500">{qr_code.total_scans}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-accent-500 opacity-50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Status</p>
              <p className="stat-value text-white text-lg">{qr_code.status}</p>
            </div>
            <QrCode className="w-8 h-8 opacity-50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Location</p>
              <p className="stat-value text-white text-lg">
                {activation?.location?.city || 'Not set'}
              </p>
            </div>
            <MapPin className="w-8 h-8 opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: QR Code */}
        <div className="card p-6">
          <h3 className="text-title mb-4">QR Code</h3>
          <div className="flex justify-center mb-6">
            <ScissorQR value={qr_code.full_url} size={300} />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03]">
              <code className="flex-1 text-sm text-white/80 truncate">
                {qr_code.full_url}
              </code>
              <button onClick={copyUrl} className="btn-icon">
                <Copy className="w-4 h-4" />
              </button>
              <a href={qr_code.full_url} target="_blank" rel="noopener noreferrer" className="btn-icon">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            
            {activation && (
              <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                <p className="text-xs text-success font-semibold mb-1">✅ This QR is ACTIVE</p>
                <p className="text-xs text-white/60">
                  Anyone scanning will see personalized landing page for this location
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Activation Form */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-title">
              {activation && !editing ? '📍 Location Details' : '✨ Activate QR Code'}
            </h3>
            {activation && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="btn-outline"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {!editing && activation ? (
            /* View Mode */
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-white/[0.03]">
                <p className="label">Type</p>
                <p className="text-white flex items-center gap-2 text-lg">
                  {LOCATION_TYPES.find(t => t.id === activation.location_type)?.icon}
                  {LOCATION_TYPES.find(t => t.id === activation.location_type)?.name}
                </p>
              </div>
              
              {activation.shop_name && (
                <div className="p-3 rounded-xl bg-white/[0.03]">
                  <p className="label">Shop / Place Name</p>
                  <p className="text-white text-lg font-medium">{activation.shop_name}</p>
                </div>
              )}
              
              {activation.owner_name && (
                <div className="p-3 rounded-xl bg-white/[0.03]">
                  <p className="label">Owner</p>
                  <p className="text-white">
                    {activation.owner_name}
                    {activation.owner_phone && (
                      <span className="text-white/60 ml-2">· {activation.owner_phone}</span>
                    )}
                  </p>
                </div>
              )}

              {activation.vehicle_number && (
                <div className="p-3 rounded-xl bg-white/[0.03]">
                  <p className="label">Vehicle</p>
                  <p className="text-white font-mono">{activation.vehicle_number}</p>
                  <p className="text-xs text-white/60">{activation.vehicle_type}</p>
                </div>
              )}
              
              <div className="p-3 rounded-xl bg-white/[0.03]">
                <p className="label">📍 Location</p>
                <p className="text-white">
                  {[activation.location?.area, activation.location?.city, activation.location?.state]
                    .filter(Boolean).join(', ')}
                </p>
                {activation.location?.address && (
                  <p className="text-sm text-white/60 mt-1">{activation.location.address}</p>
                )}
                {activation.location?.landmark && (
                  <p className="text-xs text-white/50 mt-1">📌 {activation.location.landmark}</p>
                )}
                {activation.location?.pincode && (
                  <p className="text-xs text-white/50 mt-1">PIN: {activation.location.pincode}</p>
                )}
              </div>

              {activation.placement_position && (
                <div className="p-3 rounded-xl bg-white/[0.03]">
                  <p className="label">Placement Position</p>
                  <p className="text-white">
                    {PLACEMENT_POSITIONS.find(p => p.id === activation.placement_position)?.name}
                  </p>
                </div>
              )}
              
              {activation.notes && (
                <div className="p-3 rounded-xl bg-white/[0.03]">
                  <p className="label">Notes</p>
                  <p className="text-sm text-white/70">{activation.notes}</p>
                </div>
              )}
              
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={handleDeactivate}
                  className="btn-outline text-error border-error/30 w-full"
                >
                  <Trash2 className="w-4 h-4" />
                  Deactivate QR
                </button>
              </div>
            </div>
          ) : (
            /* Edit Mode - Activation Form */
            <div className="space-y-4">
              {/* Step 1: Location Type */}
              <div>
                <label className="label">
                  <span className="text-error">*</span> Location Type
                </label>
                <select
                  value={formData.location_type}
                  onChange={(e) => setFormData({...formData, location_type: e.target.value})}
                  className="input"
                >
                  <option value="">Select location type...</option>
                  {LOCATION_TYPES.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.name}
                    </option>
                  ))}
                </select>
                <p className="label-hint">Choose where this QR is being placed</p>
              </div>

              {/* Conditional Fields Based on Type */}
              {formData.location_type && (
                <>
                  {/* Vehicle-specific fields */}
                  {isVehicle && (
                    <>
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

                      <div>
                        <label className="label">
                          <span className="text-error">*</span> Vehicle Type
                        </label>
                        <select
                          value={formData.vehicle_type}
                          onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})}
                          className="input"
                        >
                          <option value="">Select vehicle type...</option>
                          {VEHICLE_TYPES.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Shop/Place Name */}
                  {needsShop && !isVehicle && (
                    <div>
                      <label className="label">
                        <span className="text-error">*</span> Shop / Place Name
                      </label>
                      <input
                        type="text"
                        value={formData.shop_name}
                        onChange={(e) => setFormData({...formData, shop_name: e.target.value})}
                        className="input"
                        placeholder="e.g., Sharma Barber Shop"
                      />
                      <p className="label-hint">This name will show to customers on landing page</p>
                    </div>
                  )}

                  {/* Owner Details */}
                  {needsOwner && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">
                          <span className="text-error">*</span> Owner Name
                        </label>
                        <input
                          type="text"
                          value={formData.owner_name}
                          onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                          className="input"
                          placeholder="Owner's name"
                        />
                      </div>
                      <div>
                        <label className="label">
                          {isFieldRequired('owner_phone') && <span className="text-error">*</span>} Owner Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.owner_phone}
                          onChange={(e) => setFormData({...formData, owner_phone: e.target.value})}
                          className="input"
                          placeholder="+91 98765..."
                          maxLength={15}
                        />
                      </div>
                    </div>
                  )}

                  {needsOwner && (
                    <div>
                      <label className="label">Owner WhatsApp (Optional)</label>
                      <input
                        type="tel"
                        value={formData.owner_whatsapp}
                        onChange={(e) => setFormData({...formData, owner_whatsapp: e.target.value})}
                        className="input"
                        placeholder="Same as phone or different"
                        maxLength={15}
                      />
                    </div>
                  )}

                  {/* Location Section */}
                  <div className="pt-4 border-t border-white/10">
                    <h4 className="text-sm font-semibold text-white mb-3">📍 Location Details</h4>
                  </div>

                  <div>
                    <label className="label">
                      <span className="text-error">*</span> State
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({...formData, state: e.target.value})}
                      className="input"
                    >
                      <option value="">Select state...</option>
                      {INDIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">
                        <span className="text-error">*</span> City
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className="input"
                        placeholder="e.g., New Delhi"
                      />
                    </div>
                    <div>
                      <label className="label">Area / Locality</label>
                      <input
                        type="text"
                        value={formData.area}
                        onChange={(e) => setFormData({...formData, area: e.target.value})}
                        className="input"
                        placeholder="e.g., Lajpat Nagar"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Full Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="input min-h-[70px] resize-none"
                      placeholder="Shop/Place complete address..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Landmark</label>
                      <input
                        type="text"
                        value={formData.landmark}
                        onChange={(e) => setFormData({...formData, landmark: e.target.value})}
                        className="input"
                        placeholder="Near..."
                      />
                    </div>
                    <div>
                      <label className="label">PIN Code</label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                        className="input"
                        placeholder="110024"
                        maxLength={6}
                      />
                    </div>
                  </div>

                  {/* Placement Position */}
                  <div>
                    <label className="label">Where is QR Placed?</label>
                    <select
                      value={formData.placement_position}
                      onChange={(e) => setFormData({...formData, placement_position: e.target.value})}
                      className="input"
                    >
                      <option value="">Select position...</option>
                      {PLACEMENT_POSITIONS.map(pos => (
                        <option key={pos.id} value={pos.id}>{pos.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* GPS Location */}
                  <div>
                    <label className="label">GPS Location (Optional)</label>
                    <button
                      onClick={captureGPS}
                      className="btn-outline w-full"
                      type="button"
                    >
                      <MapPin className="w-4 h-4" />
                      {gpsLocation ? '✅ GPS Captured' : 'Capture Current GPS'}
                    </button>
                    {gpsLocation && (
                      <p className="text-xs text-white/50 mt-2">
                        Lat: {gpsLocation.latitude.toFixed(6)}, Lng: {gpsLocation.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="label">Additional Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="input min-h-[60px] resize-none"
                      placeholder="Any additional information..."
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.location_type}
                  className="btn-brand flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {activation ? 'Update Details' : 'Activate QR'}
                    </>
                  )}
                </button>
                {editing && activation && (
                  <button
                    onClick={() => {
                      setEditing(false);
                      loadQR();
                    }}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
