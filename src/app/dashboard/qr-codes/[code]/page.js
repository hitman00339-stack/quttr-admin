'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, QrCode, Loader2, MapPin, Store, Phone,
  Save, Trash2, CheckCircle, AlertCircle, TrendingUp,
  Copy, ExternalLink, Edit3
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ScissorQR from '@/components/qr/ScissorQR';

const LOCATION_TYPES = [
  { id: 'barber_shop', name: 'Barber Shop', icon: '💈' },
  { id: 'salon', name: 'Salon / Beauty Parlour', icon: '💇' },
  { id: 'public_place', name: 'Public Place', icon: '🏙️' },
  { id: 'vehicle', name: 'Vehicle', icon: '🚗' },
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
  { id: 'gym', name: 'Gym', icon: '💪' },
  { id: 'mall', name: 'Mall', icon: '🏬' },
  { id: 'office', name: 'Office', icon: '🏢' },
  { id: 'college', name: 'College', icon: '🎓' },
  { id: 'other', name: 'Other', icon: '📍' },
];

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab',
  'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Chandigarh', 'Jammu and Kashmir', 'Ladakh'
];

export default function QRDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shortCode = params.code;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    location_type: '',
    shop_name: '',
    owner_name: '',
    owner_phone: '',
    state: '',
    city: '',
    area: '',
    address: '',
    landmark: '',
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
            state: result.activation.location?.state || '',
            city: result.activation.location?.city || '',
            area: result.activation.location?.area || '',
            address: result.activation.location?.address || '',
            landmark: result.activation.location?.landmark || '',
            notes: result.activation.notes || '',
          });
        } else {
          setEditing(true); // Auto-edit mode if not activated
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

  const handleSave = async () => {
    if (!formData.location_type) {
      toast.error('Please select location type');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/qr/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          short_code: shortCode,
          ...formData,
        }),
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
            <span className="chip-success">Active</span>
          )}
          {qr_code.status === 'INACTIVE' && (
            <span className="chip-warning">Pending Activation</span>
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

      <div className="grid md:grid-cols-2 gap-6">
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
          </div>
        </div>

        {/* Right: Activation Form */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-title">
              {activation ? 'Location Details' : 'Activate QR'}
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
              <div>
                <p className="label">Type</p>
                <p className="text-white flex items-center gap-2">
                  {LOCATION_TYPES.find(t => t.id === activation.location_type)?.icon}
                  {LOCATION_TYPES.find(t => t.id === activation.location_type)?.name}
                </p>
              </div>
              
              {activation.shop_name && (
                <div>
                  <p className="label">Shop Name</p>
                  <p className="text-white">{activation.shop_name}</p>
                </div>
              )}
              
              {activation.owner_name && (
                <div>
                  <p className="label">Owner</p>
                  <p className="text-white">
                    {activation.owner_name}
                    {activation.owner_phone && ` · ${activation.owner_phone}`}
                  </p>
                </div>
              )}
              
              <div>
                <p className="label">Location</p>
                <p className="text-white">
                  {[activation.location?.area, activation.location?.city, activation.location?.state]
                    .filter(Boolean).join(', ')}
                </p>
                {activation.location?.address && (
                  <p className="text-sm text-white/60 mt-1">{activation.location.address}</p>
                )}
                {activation.location?.landmark && (
                  <p className="text-xs text-white/50 mt-1">📍 {activation.location.landmark}</p>
                )}
              </div>
              
              {activation.notes && (
                <div>
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
                  Deactivate
                </button>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <div className="space-y-4">
              <div>
                <label className="label">Location Type *</label>
                <select
                  value={formData.location_type}
                  onChange={(e) => setFormData({...formData, location_type: e.target.value})}
                  className="input"
                >
                  <option value="">Select type...</option>
                  {LOCATION_TYPES.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Shop / Place Name</label>
                <input
                  type="text"
                  value={formData.shop_name}
                  onChange={(e) => setFormData({...formData, shop_name: e.target.value})}
                  className="input"
                  placeholder="e.g., Sharma Barber Shop"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Owner Name</label>
                  <input
                    type="text"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                    className="input"
                    placeholder="Owner name"
                  />
                </div>
                <div>
                  <label className="label">Owner Phone</label>
                  <input
                    type="tel"
                    value={formData.owner_phone}
                    onChange={(e) => setFormData({...formData, owner_phone: e.target.value})}
                    className="input"
                    placeholder="+91..."
                  />
                </div>
              </div>

              <div>
                <label className="label">State *</label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="input"
                >
                  <option value="">Select state...</option>
                  {STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="input"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="label">Area / Locality</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    className="input"
                    placeholder="Area"
                  />
                </div>
              </div>

              <div>
                <label className="label">Full Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="input min-h-[60px] resize-none"
                  placeholder="Shop address..."
                />
              </div>

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
                <label className="label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="input min-h-[60px] resize-none"
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
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
                      {activation ? 'Update' : 'Activate'}
                    </>
                  )}
                </button>
                {editing && activation && (
                  <button
                    onClick={() => setEditing(false)}
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
