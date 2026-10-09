'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Phone, PhoneCall, Users, Store, FileText, BarChart3, HelpCircle,
  Send, Play, Pause, RefreshCw, CheckCircle2, AlertCircle, Layers
} from 'lucide-react';

export default function CallingDashboard() {
  const [activeTab, setActiveTab] = useState('launcher'); // launcher | bulk | logs | analytics | missing | inactive
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ logs: [], missingRequests: [], inactiveBarbers: [], categoriesCount: {}, totalCalls: 0 });

  // Single Call launcher state
  const [targetPhone, setTargetPhone] = useState('');
  const [callType, setCallType] = useState('customer');
  const [callingState, setCallingState] = useState(false);

  // Bulk Queue Campaign state
  const [bulkNumbers, setBulkNumbers] = useState('');
  const [bulkType, setBulkType] = useState('customer');
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [campaignQueue, setCampaignQueue] = useState([]);
  const [currentCallIndex, setCurrentCallIndex] = useState(0);

  useEffect(() => {
    fetchCallingData();
  }, []);

  const fetchCallingData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/calling');
      const json = await res.json();
      if (json.success) setData(json);
    } catch (e) {
      toast.error('Failed to load call logs');
    }
    setLoading(false);
  };

  // Trigger Single Call
  const handleSingleCall = async () => {
    if (!targetPhone || targetPhone.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    setCallingState(true);
    const toastId = toast.loading(`Triggering live call to ${targetPhone}...`);

    try {
      const res = await fetch('/api/omni/trigger-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone, call_type: callType }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success(json.message, { id: toastId });
        setTargetPhone('');
        fetchCallingData();
      } else {
        toast.error(json.error || 'Failed to place call', { id: toastId });
      }
    } catch (err) {
      toast.error('Network error placing call', { id: toastId });
    }
    setCallingState(false);
  };

  // Prepare and Start Bulk Sequential Campaign
  const handleStartBulkCampaign = async () => {
    const rawList = bulkNumbers.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length >= 10);
    if (rawList.length === 0) {
      toast.error('Please paste at least one valid 10-digit phone number');
      return;
    }

    setCampaignQueue(rawList);
    setCurrentCallIndex(0);
    setIsCampaignRunning(true);
    toast.success(`Starting campaign for ${rawList.length} numbers one by one...`);

    // Sequentially process queue
    for (let i = 0; i < rawList.length; i++) {
      setCurrentCallIndex(i);
      const phone = rawList[i];
      
      const tId = toast.loading(`[${i + 1}/${rawList.length}] Calling ${phone}...`);
      
      try {
        const res = await fetch('/api/omni/trigger-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, call_type: bulkType }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success(`[${i + 1}/${rawList.length}] Call sent to ${phone}`, { id: tId });
        } else {
          toast.error(`[${i + 1}/${rawList.length}] Failed: ${phone}`, { id: tId });
        }
      } catch (err) {
        toast.error(`[${i + 1}/${rawList.length}] Network error: ${phone}`, { id: tId });
      }

      // Wait 15 seconds gap between numbers so Riya finishes conversation before dialing next
      if (i < rawList.length - 1) {
        await new Promise((r) => setTimeout(r, 15000));
      }
    }

    setIsCampaignRunning(false);
    toast.success('🎉 Bulk calling campaign completed!');
    fetchCallingData();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-display flex items-center gap-2">
            <PhoneCall className="w-8 h-8 text-brand-500" />
            AI Calling Center (Riya)
          </h1>
          <p className="text-body mt-1">
            Real-time automated customer outreach & barber feedback
          </p>
        </div>

        <button onClick={fetchCallingData} className="btn-outline flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 flex-wrap">
        {[
          { id: 'launcher', label: 'Single Call', icon: Phone },
          { id: 'bulk', label: 'Bulk Campaign (One-by-One)', icon: Layers },
          { id: 'logs', label: 'Call Logs', icon: FileText },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'missing', label: 'Missing Barbers', icon: HelpCircle },
          { id: 'inactive', label: 'Inactive Barbers', icon: Store },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-brand-500 text-white shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SINGLE CALL LAUNCHER */}
      {activeTab === 'launcher' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-brand-400" /> Instant Single Call
            </h2>

            <div>
              <label className="text-xs text-white/60 block mb-1">Call Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCallType('customer')}
                  className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${
                    callType === 'customer'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                      : 'border-white/10 text-white/60'
                  }`}
                >
                  <Users className="w-4 h-4" /> Customer Pitch
                </button>

                <button
                  type="button"
                  onClick={() => setCallType('barber')}
                  className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${
                    callType === 'barber'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                      : 'border-white/10 text-white/60'
                  }`}
                >
                  <Store className="w-4 h-4" /> Barber Feedback
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/60 block mb-1">Target Phone Number</label>
              <input
                type="text"
                placeholder="Enter 10-digit number (e.g. 9580133593)"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                className="input w-full"
              />
            </div>

            <button
              disabled={callingState}
              onClick={handleSingleCall}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              <Send className="w-4 h-4" /> {callingState ? 'Placing Call...' : 'Start Call Now'}
            </button>
          </div>

          <div className="card p-6 space-y-3">
            <h2 className="text-lg font-bold text-white">Calling Engine Info</h2>
            <div className="space-y-2 text-sm text-white/80">
              <div className="flex justify-between p-2 rounded bg-white/5">
                <span>AI Agent Name:</span> <strong className="text-brand-400">Riya (रिया)</strong>
              </div>
              <div className="flex justify-between p-2 rounded bg-white/5">
                <span>Agent ID:</span> <strong className="text-accent-500 font-mono">265888</strong>
              </div>
              <div className="flex justify-between p-2 rounded bg-white/5">
                <span>Brand Pronunciation:</span> <strong className="text-brand-400">कटर (Katar)</strong>
              </div>
              <div className="flex justify-between p-2 rounded bg-white/5">
                <span>Total Calls Logged:</span> <strong>{data.totalCalls}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BULK CAMPAIGN (ONE-BY-ONE QUEUE) */}
      {activeTab === 'bulk' && (
        <div className="card p-6 space-y-4 max-w-3xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent-500" /> Bulk Sequential Calling Campaign
          </h2>
          <p className="text-xs text-white/60">
            Paste phone numbers below (one per line or separated by commas). Riya will call them one by one automatically!
          </p>

          <div>
            <label className="text-xs text-white/60 block mb-1">Target Audience</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setBulkType('customer')}
                className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${
                  bulkType === 'customer'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                    : 'border-white/10 text-white/60'
                }`}
              >
                <Users className="w-4 h-4" /> Customers List
              </button>

              <button
                type="button"
                onClick={() => setBulkType('barber')}
                className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${
                  bulkType === 'barber'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                    : 'border-white/10 text-white/60'
                }`}
              >
                <Store className="w-4 h-4" /> Barbers List
              </button>
            </div>

            <textarea
              rows={6}
              placeholder="Paste 10-digit numbers here, e.g.:&#10;9580133593&#10;9876543210&#10;9123456789"
              value={bulkNumbers}
              onChange={(e) => setBulkNumbers(e.target.value)}
              className="input w-full font-mono text-sm"
              disabled={isCampaignRunning}
            />
          </div>

          {isCampaignRunning && (
            <div className="p-4 rounded-lg bg-brand-500/10 border border-brand-500/30 space-y-2">
              <div className="flex justify-between text-sm font-bold text-brand-400">
                <span>Campaign Progress:</span>
                <span>{currentCallIndex + 1} / {campaignQueue.length}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-brand-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((currentCallIndex + 1) / campaignQueue.length) * 100}%` }}
                />
              </div>
              <p className="text-2xs text-white/60">Currently dialing: {campaignQueue[currentCallIndex]}</p>
            </div>
          )}

          <button
            disabled={isCampaignRunning}
            onClick={handleStartBulkCampaign}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            <Play className="w-4 h-4" /> {isCampaignRunning ? 'Campaign in Progress...' : 'Start Sequential Campaign'}
          </button>
        </div>
      )}

      {/* TAB 3: LOGS */}
      {activeTab === 'logs' && (
        <div className="card p-4">
          <h2 className="text-lg font-bold mb-4">Recent Call History</h2>
          <div className="space-y-3">
            {data.logs.map((log) => (
              <div key={log._id} className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-brand-400">{log.name} ({log.phone})</span>
                  <span className="chip-info text-2xs">{log.category}</span>
                </div>
                <p className="text-xs text-white/80">{log.summary}</p>
                <p className="text-2xs text-white/40">{new Date(log.createdAt).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(data.categoriesCount).map(([cat, count]) => (
            <div key={cat} className="card p-4 text-center">
              <p className="text-xs text-white/60 capitalize">{cat.replace('_', ' ')}</p>
              <h3 className="text-2xl font-bold text-brand-400 mt-1">{count}</h3>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: MISSING BARBERS */}
      {activeTab === 'missing' && (
        <div className="card p-4 space-y-3">
          <h2 className="text-lg font-bold">Barber Addition Requests from Customers</h2>
          {data.missingRequests.map((req) => (
            <div key={req._id} className="p-3 rounded bg-white/5 border border-white/10 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">{req.shopName || req.shop_name} ({req.barberName || req.barber_name})</p>
                <p className="text-xs text-white/60">{req.area}, {req.district} · Requested by: {req.customerPhone || req.customer_phone}</p>
              </div>
              <span className="chip-warning">Pending Onboarding</span>
            </div>
          ))}
        </div>
      )}

      {/* TAB 6: INACTIVE BARBERS */}
      {activeTab === 'inactive' && (
        <div className="card p-4 space-y-3">
          <h2 className="text-lg font-bold">Inactive Barbers Needed Feedback Call</h2>
          {data.inactiveBarbers.map((b) => (
            <div key={b._id} className="p-3 rounded bg-white/5 border border-white/10 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">{b.name}</p>
                <p className="text-xs text-white/60">Owner: {b.owner?.name} ({b.owner?.phone})</p>
              </div>
              <button
                onClick={() => {
                  setTargetPhone(b.owner?.phone || '');
                  setActiveTab('launcher');
                }}
                className="btn-outline text-xs flex items-center gap-1"
              >
                <Phone className="w-3 h-3" /> Load Number
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
