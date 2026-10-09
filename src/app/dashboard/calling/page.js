'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Phone, PhoneCall, Users, Store, FileText, BarChart3, HelpCircle,
  Send, Play, Pause, RefreshCw, CheckCircle2, AlertCircle, Layers,
  CheckSquare, Square, Clock, ShieldCheck, ChevronRight
} from 'lucide-react';

export default function CallingDashboard() {
  const [activeTab, setActiveTab] = useState('launcher'); // launcher | call_users | call_barbers | bulk | logs | analytics | missing | inactive
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ logs: [], missingRequests: [], inactiveBarbers: [], categoriesCount: {}, totalCalls: 0 });

  // Registered Contacts
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [registeredBarbers, setRegisteredBarbers] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Single Call launcher state
  const [targetPhone, setTargetPhone] = useState('');
  const [callType, setCallType] = useState('customer'); // customer | barber
  const [customerName, setCustomerName] = useState('');
  const [barberOwnerName, setBarberOwnerName] = useState('');
  const [barberShopName, setBarberShopName] = useState('');
  const [callingState, setCallingState] = useState(false);

  // Bulk / Campaign state
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [selectedBarberIds, setSelectedBarberIds] = useState(new Set());
  const [callDelaySeconds, setCallDelaySeconds] = useState(15);
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState({ current: 0, total: 0, currentTarget: '' });
  const [campaignLogs, setCampaignLogs] = useState([]);

  // Manual Bulk Queue state
  const [manualBulkNumbers, setManualBulkNumbers] = useState('');
  const [manualBulkType, setManualBulkType] = useState('customer');

  useEffect(() => {
    fetchCallingData();
    fetchContacts();
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

  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      const res = await fetch('/api/admin/calling/contacts');
      const json = await res.json();
      if (json.success) {
        setRegisteredBarbers(json.barbers || []);
        setRegisteredUsers(json.users || []);
        // Select all by default
        setSelectedBarberIds(new Set((json.barbers || []).map((b) => b.id)));
        setSelectedUserIds(new Set((json.users || []).map((u) => u.id)));
      }
    } catch (e) {
      // Non-critical error
    }
    setLoadingContacts(false);
  };

  // Select Barber in Single Call
  const handleSelectBarberForSingleCall = (barberId) => {
    const barber = registeredBarbers.find((b) => b.id === barberId);
    if (barber) {
      setBarberOwnerName(barber.ownerName);
      setBarberShopName(barber.shopName);
      setTargetPhone(barber.phone.replace(/\D/g, '').slice(-10));
    }
  };

  // Trigger Single Call
  const handleSingleCall = async () => {
    if (!targetPhone || targetPhone.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    setCallingState(true);
    const toastId = toast.loading(`Triggering personalized call to ${targetPhone}...`);

    try {
      const payload = {
        phone: targetPhone,
        call_type: callType,
        name: callType === 'barber' ? barberOwnerName : customerName,
        owner_name: barberOwnerName,
        shop_name: barberShopName,
      };

      const res = await fetch('/api/omni/trigger-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        toast.success(json.message, { id: toastId });
        setTargetPhone('');
        setCustomerName('');
        setBarberOwnerName('');
        setBarberShopName('');
        fetchCallingData();
      } else {
        toast.error(json.error || 'Failed to place call', { id: toastId });
      }
    } catch (err) {
      toast.error('Network error placing call', { id: toastId });
    }
    setCallingState(false);
  };

  // Run Sequential Campaign for Barbers
  const handleStartBarberCampaign = async () => {
    const queue = registeredBarbers.filter((b) => selectedBarberIds.has(b.id));
    if (queue.length === 0) {
      toast.error('Please select at least one barber to call');
      return;
    }

    setIsCampaignRunning(true);
    setCampaignLogs([]);
    setCampaignProgress({ current: 0, total: queue.length, currentTarget: queue[0].shopName });
    toast.success(`Starting personalized campaign for ${queue.length} barbers one by one...`);

    for (let i = 0; i < queue.length; i++) {
      const b = queue[i];
      setCampaignProgress({
        current: i + 1,
        total: queue.length,
        currentTarget: `${b.ownerName} (${b.shopName}) - ${b.phone}`,
      });

      const tId = toast.loading(`[${i + 1}/${queue.length}] Calling ${b.ownerName} (${b.shopName})...`);

      try {
        const res = await fetch('/api/omni/trigger-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: b.phone,
            call_type: 'barber',
            owner_name: b.ownerName,
            shop_name: b.shopName,
            name: b.ownerName,
          }),
        });
        const json = await res.json();

        const logEntry = {
          target: `${b.ownerName} (${b.shopName})`,
          phone: b.phone,
          status: json.success ? 'Dispatched' : 'Failed',
          summary: json.summary || json.message,
          time: new Date().toLocaleTimeString(),
        };
        setCampaignLogs((prev) => [logEntry, ...prev]);

        if (json.success) {
          toast.success(`[${i + 1}/${queue.length}] Dispatched to ${b.ownerName}`, { id: tId });
        } else {
          toast.error(`[${i + 1}/${queue.length}] Failed: ${b.ownerName}`, { id: tId });
        }
      } catch (e) {
        toast.error(`[${i + 1}/${queue.length}] Error: ${b.ownerName}`, { id: tId });
      }

      if (i < queue.length - 1) {
        await new Promise((r) => setTimeout(r, callDelaySeconds * 1000));
      }
    }

    setIsCampaignRunning(false);
    toast.success('🎉 Barber calling campaign completed!');
    fetchCallingData();
  };

  // Run Sequential Campaign for Customers / Users
  const handleStartUserCampaign = async () => {
    const queue = registeredUsers.filter((u) => selectedUserIds.has(u.id));
    if (queue.length === 0) {
      toast.error('Please select at least one user to call');
      return;
    }

    setIsCampaignRunning(true);
    setCampaignLogs([]);
    setCampaignProgress({ current: 0, total: queue.length, currentTarget: queue[0].name });
    toast.success(`Starting campaign for ${queue.length} customers one by one...`);

    for (let i = 0; i < queue.length; i++) {
      const u = queue[i];
      setCampaignProgress({
        current: i + 1,
        total: queue.length,
        currentTarget: `${u.name} - ${u.phone}`,
      });

      const tId = toast.loading(`[${i + 1}/${queue.length}] Calling ${u.name}...`);

      try {
        const res = await fetch('/api/omni/trigger-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: u.phone,
            call_type: 'customer',
            name: u.name,
          }),
        });
        const json = await res.json();

        const logEntry = {
          target: u.name,
          phone: u.phone,
          status: json.success ? 'Dispatched' : 'Failed',
          summary: json.summary || json.message,
          time: new Date().toLocaleTimeString(),
        };
        setCampaignLogs((prev) => [logEntry, ...prev]);

        if (json.success) {
          toast.success(`[${i + 1}/${queue.length}] Dispatched to ${u.name}`, { id: tId });
        } else {
          toast.error(`[${i + 1}/${queue.length}] Failed: ${u.name}`, { id: tId });
        }
      } catch (e) {
        toast.error(`[${i + 1}/${queue.length}] Error: ${u.name}`, { id: tId });
      }

      if (i < queue.length - 1) {
        await new Promise((r) => setTimeout(r, callDelaySeconds * 1000));
      }
    }

    setIsCampaignRunning(false);
    toast.success('🎉 User outreach campaign completed!');
    fetchCallingData();
  };

  // Run Manual Paste Campaign
  const handleStartManualCampaign = async () => {
    const rawList = manualBulkNumbers.split(/[\n,]+/).map((n) => n.trim()).filter((n) => n.length >= 10);
    if (rawList.length === 0) {
      toast.error('Please paste at least one valid 10-digit phone number');
      return;
    }

    setIsCampaignRunning(true);
    setCampaignLogs([]);
    setCampaignProgress({ current: 0, total: rawList.length, currentTarget: rawList[0] });
    toast.success(`Starting campaign for ${rawList.length} numbers one by one...`);

    for (let i = 0; i < rawList.length; i++) {
      const phone = rawList[i];
      setCampaignProgress({
        current: i + 1,
        total: rawList.length,
        currentTarget: phone,
      });

      const tId = toast.loading(`[${i + 1}/${rawList.length}] Calling ${phone}...`);

      try {
        const res = await fetch('/api/omni/trigger-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, call_type: manualBulkType }),
        });
        const json = await res.json();

        const logEntry = {
          target: json.customer_name || 'Customer',
          phone,
          status: json.success ? 'Dispatched' : 'Failed',
          summary: json.summary || json.message,
          time: new Date().toLocaleTimeString(),
        };
        setCampaignLogs((prev) => [logEntry, ...prev]);

        if (json.success) {
          toast.success(`[${i + 1}/${rawList.length}] Call sent to ${phone}`, { id: tId });
        } else {
          toast.error(`[${i + 1}/${rawList.length}] Failed: ${phone}`, { id: tId });
        }
      } catch (err) {
        toast.error(`[${i + 1}/${rawList.length}] Network error: ${phone}`, { id: tId });
      }

      if (i < rawList.length - 1) {
        await new Promise((r) => setTimeout(r, callDelaySeconds * 1000));
      }
    }

    setIsCampaignRunning(false);
    toast.success('🎉 Manual bulk calling campaign completed!');
    fetchCallingData();
  };

  // Toggle selection helpers
  const toggleBarberSelection = (id) => {
    const next = new Set(selectedBarberIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedBarberIds(next);
  };

  const toggleAllBarbers = () => {
    if (selectedBarberIds.size === registeredBarbers.length) {
      setSelectedBarberIds(new Set());
    } else {
      setSelectedBarberIds(new Set(registeredBarbers.map((b) => b.id)));
    }
  };

  const toggleUserSelection = (id) => {
    const next = new Set(selectedUserIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedUserIds(next);
  };

  const toggleAllUsers = () => {
    if (selectedUserIds.size === registeredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(registeredUsers.map((u) => u.id)));
    }
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
            Real-time personalized customer outreach & barber feedback in native Hindi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={fetchContacts} className="btn-outline flex items-center gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Reload Contacts
          </button>
          <button onClick={fetchCallingData} className="btn-outline flex items-center gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Call Logs
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 flex-wrap">
        {[
          { id: 'launcher', label: 'Single Call', icon: Phone },
          { id: 'call_barbers', label: `Call Barbers (${registeredBarbers.length})`, icon: Store },
          { id: 'call_users', label: `Call Users (${registeredUsers.length})`, icon: Users },
          { id: 'bulk', label: 'Manual Numbers Queue', icon: Layers },
          { id: 'logs', label: `Call Logs (${data.logs.length})`, icon: FileText },
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
              <Phone className="w-5 h-5 text-brand-400" /> Instant Personalized Single Call
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

            {/* Barber Specific Quick Selection */}
            {callType === 'barber' && (
              <div className="space-y-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <label className="text-xs text-brand-400 block font-semibold">
                  Select Registered Barber (Auto-fills Details):
                </label>
                <select
                  onChange={(e) => handleSelectBarberForSingleCall(e.target.value)}
                  className="input w-full text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>
                    -- Choose from {registeredBarbers.length} Active Barbers --
                  </option>
                  {registeredBarbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.shopName} — {b.ownerName} ({b.city})
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-2xs text-white/60 block mb-0.5">Barber Owner Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Salman Ali"
                      value={barberOwnerName}
                      onChange={(e) => setBarberOwnerName(e.target.value)}
                      className="input w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-2xs text-white/60 block mb-0.5">Barber Shop Name</label>
                    <input
                      type="text"
                      placeholder="e.g. SS hair wig house"
                      value={barberShopName}
                      onChange={(e) => setBarberShopName(e.target.value)}
                      className="input w-full text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Customer Specific Name */}
            {callType === 'customer' && (
              <div>
                <label className="text-xs text-white/60 block mb-1">Customer Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul, Niransh"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input w-full"
                />
              </div>
            )}

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
              <Send className="w-4 h-4" /> {callingState ? 'Placing Call...' : 'Start Personalized Call Now'}
            </button>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Calling Engine Info & Greetings
            </h2>
            <div className="space-y-2.5 text-sm text-white/80">
              <div className="flex justify-between p-2.5 rounded bg-white/5">
                <span>AI Agent Name:</span> <strong className="text-brand-400">Riya (रिया)</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-white/5">
                <span>Agent ID:</span> <strong className="text-accent-500 font-mono">265888</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-white/5">
                <span>Spoken Pronunciation:</span> <strong className="text-brand-400">कटर (Katar / Cutter)</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-white/5">
                <span>Active Registered Barbers:</span> <strong className="text-emerald-400">{registeredBarbers.length} Shops</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-white/5">
                <span>Total Calls Logged:</span> <strong>{data.totalCalls}</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-xs space-y-1 text-white/80">
              <strong className="text-brand-400 block font-semibold">Native Hindi Greeting Used:</strong>
              {callType === 'barber' ? (
                <p className="italic">
                  &quot;नमस्ते [Barber Name] जी, मैं रिया बोल रही हूँ कटर ऐप से। आप [Shop Name] के ओनर हैं ना? क्या आपसे एक मिनट बात हो सकती है?&quot;
                </p>
              ) : (
                <p className="italic">
                  &quot;नमस्ते [Customer Name] जी, मैं रिया बोल रही हूँ कटर ऐप से। बस आधा मिनट बात हो सकती है क्या आपसे?&quot;
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CALL ALL REGISTERED BARBERS SEPARATELY */}
      {activeTab === 'call_barbers' && (
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-accent-500" /> Sequential Barber Feedback Campaign
                </h2>
                <p className="text-xs text-white/60 mt-1">
                  Calls registered shop owners one by one. Riya speaks their owner name and shop name personally, takes their feedback, and saves call summaries automatically.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-white/80 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-brand-400" /> Delay between calls:
                  <select
                    value={callDelaySeconds}
                    onChange={(e) => setCallDelaySeconds(Number(e.target.value))}
                    className="bg-transparent text-white font-bold outline-none cursor-pointer"
                  >
                    <option value={10} className="bg-slate-900">10s</option>
                    <option value={15} className="bg-slate-900">15s</option>
                    <option value={20} className="bg-slate-900">20s</option>
                    <option value={30} className="bg-slate-900">30s</option>
                  </select>
                </div>

                <button
                  disabled={isCampaignRunning || selectedBarberIds.size === 0}
                  onClick={handleStartBarberCampaign}
                  className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
                >
                  <Play className="w-4 h-4" />
                  {isCampaignRunning ? 'Campaign Running...' : `Call Selected Barbers (${selectedBarberIds.size})`}
                </button>
              </div>
            </div>

            {/* Campaign In-Progress Status */}
            {isCampaignRunning && (
              <div className="p-4 rounded-lg bg-brand-500/10 border border-brand-500/30 space-y-2 animate-pulse">
                <div className="flex justify-between text-sm font-bold text-brand-400">
                  <span>Currently Calling Barber:</span>
                  <span>{campaignProgress.current} / {campaignProgress.total}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-brand-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(campaignProgress.current / campaignProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-white/80 font-mono">Dialing: {campaignProgress.currentTarget}</p>
              </div>
            )}

            {/* Barbers Table */}
            <div className="border border-white/10 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-b border-white/10 text-xs text-white/60">
                  <tr>
                    <th className="p-3 w-10">
                      <button onClick={toggleAllBarbers} className="text-white hover:text-brand-400">
                        {selectedBarberIds.size === registeredBarbers.length ? (
                          <CheckSquare className="w-4 h-4 text-brand-500" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="p-3">Shop Name</th>
                    <th className="p-3">Barber Owner</th>
                    <th className="p-3">Phone Number</th>
                    <th className="p-3">City / Area</th>
                    <th className="p-3">Starting Rate</th>
                    <th className="p-3 text-right">Instant Call</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {registeredBarbers.map((b) => {
                    const isSelected = selectedBarberIds.has(b.id);
                    return (
                      <tr key={b.id} className={`hover:bg-white/5 transition-colors ${isSelected ? 'bg-brand-500/5' : ''}`}>
                        <td className="p-3">
                          <button onClick={() => toggleBarberSelection(b.id)}>
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-brand-500" />
                            ) : (
                              <Square className="w-4 h-4 text-white/40" />
                            )}
                          </button>
                        </td>
                        <td className="p-3 font-semibold text-white">{b.shopName}</td>
                        <td className="p-3 text-brand-300">{b.ownerName}</td>
                        <td className="p-3 font-mono text-xs text-white/80">{b.phone}</td>
                        <td className="p-3 text-xs text-white/60">{b.area ? `${b.area}, ${b.city}` : b.city}</td>
                        <td className="p-3 font-mono text-xs text-emerald-400">₹{b.startingPrice}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setTargetPhone(b.phone.replace(/\D/g, '').slice(-10));
                              setBarberOwnerName(b.ownerName);
                              setBarberShopName(b.shopName);
                              setCallType('barber');
                              setActiveTab('launcher');
                            }}
                            className="btn-outline text-xs px-2.5 py-1"
                          >
                            Call
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Campaign Execution Logs */}
          {campaignLogs.length > 0 && (
            <div className="card p-4 space-y-3">
              <h3 className="text-sm font-bold text-white">Live Campaign Dispatched Logs</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {campaignLogs.map((log, i) => (
                  <div key={i} className="p-2.5 rounded bg-white/5 border border-white/10 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-brand-400">{log.target}</span> ({log.phone})
                      <p className="text-white/60 mt-0.5">{log.summary}</p>
                    </div>
                    <div className="text-right">
                      <span className={`chip-${log.status === 'Dispatched' ? 'success' : 'danger'} text-2xs`}>
                        {log.status}
                      </span>
                      <p className="text-2xs text-white/40 mt-1">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CALL ALL REGISTERED USERS (CUSTOMERS) SEPARATELY */}
      {activeTab === 'call_users' && (
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-400" /> Sequential Customer Outreach Campaign
                </h2>
                <p className="text-xs text-white/60 mt-1">
                  Calls registered users one by one. Riya introduces local barber booking, checks their neighborhood preferences, and answers shop inquiries.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-white/80 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-brand-400" /> Delay between calls:
                  <select
                    value={callDelaySeconds}
                    onChange={(e) => setCallDelaySeconds(Number(e.target.value))}
                    className="bg-transparent text-white font-bold outline-none cursor-pointer"
                  >
                    <option value={10} className="bg-slate-900">10s</option>
                    <option value={15} className="bg-slate-900">15s</option>
                    <option value={20} className="bg-slate-900">20s</option>
                    <option value={30} className="bg-slate-900">30s</option>
                  </select>
                </div>

                <button
                  disabled={isCampaignRunning || selectedUserIds.size === 0}
                  onClick={handleStartUserCampaign}
                  className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
                >
                  <Play className="w-4 h-4" />
                  {isCampaignRunning ? 'Campaign Running...' : `Call Selected Users (${selectedUserIds.size})`}
                </button>
              </div>
            </div>

            {/* Campaign In-Progress Status */}
            {isCampaignRunning && (
              <div className="p-4 rounded-lg bg-brand-500/10 border border-brand-500/30 space-y-2 animate-pulse">
                <div className="flex justify-between text-sm font-bold text-brand-400">
                  <span>Currently Calling Customer:</span>
                  <span>{campaignProgress.current} / {campaignProgress.total}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-brand-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(campaignProgress.current / campaignProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-white/80 font-mono">Dialing: {campaignProgress.currentTarget}</p>
              </div>
            )}

            {/* Users Table */}
            <div className="border border-white/10 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 border-b border-white/10 text-xs text-white/60">
                  <tr>
                    <th className="p-3 w-10">
                      <button onClick={toggleAllUsers} className="text-white hover:text-brand-400">
                        {selectedUserIds.size === registeredUsers.length ? (
                          <CheckSquare className="w-4 h-4 text-brand-500" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Phone Number</th>
                    <th className="p-3">City</th>
                    <th className="p-3 text-right">Instant Call</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {registeredUsers.map((u) => {
                    const isSelected = selectedUserIds.has(u.id);
                    return (
                      <tr key={u.id} className={`hover:bg-white/5 transition-colors ${isSelected ? 'bg-brand-500/5' : ''}`}>
                        <td className="p-3">
                          <button onClick={() => toggleUserSelection(u.id)}>
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-brand-500" />
                            ) : (
                              <Square className="w-4 h-4 text-white/40" />
                            )}
                          </button>
                        </td>
                        <td className="p-3 font-semibold text-white">{u.name}</td>
                        <td className="p-3 font-mono text-xs text-white/80">{u.phone}</td>
                        <td className="p-3 text-xs text-white/60">{u.city}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              setTargetPhone(u.phone.replace(/\D/g, '').slice(-10));
                              setCustomerName(u.name);
                              setCallType('customer');
                              setActiveTab('launcher');
                            }}
                            className="btn-outline text-xs px-2.5 py-1"
                          >
                            Call
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Campaign Execution Logs */}
          {campaignLogs.length > 0 && (
            <div className="card p-4 space-y-3">
              <h3 className="text-sm font-bold text-white">Live Campaign Dispatched Logs</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {campaignLogs.map((log, i) => (
                  <div key={i} className="p-2.5 rounded bg-white/5 border border-white/10 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-brand-400">{log.target}</span> ({log.phone})
                      <p className="text-white/60 mt-0.5">{log.summary}</p>
                    </div>
                    <div className="text-right">
                      <span className={`chip-${log.status === 'Dispatched' ? 'success' : 'danger'} text-2xs`}>
                        {log.status}
                      </span>
                      <p className="text-2xs text-white/40 mt-1">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MANUAL NUMBERS QUEUE */}
      {activeTab === 'bulk' && (
        <div className="card p-6 space-y-4 max-w-3xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent-500" /> Manual Phone Numbers Queue
          </h2>
          <p className="text-xs text-white/60">
            Paste phone numbers below (one per line or separated by commas). Riya will dial each number sequentially with an auto delay!
          </p>

          <div>
            <label className="text-xs text-white/60 block mb-1">Target Audience Mode</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setManualBulkType('customer')}
                className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${
                  manualBulkType === 'customer'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                    : 'border-white/10 text-white/60'
                }`}
              >
                <Users className="w-4 h-4" /> Customer Pitch Mode
              </button>

              <button
                type="button"
                onClick={() => setManualBulkType('barber')}
                className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${
                  manualBulkType === 'barber'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                    : 'border-white/10 text-white/60'
                }`}
              >
                <Store className="w-4 h-4" /> Barber Feedback Mode
              </button>
            </div>

            <textarea
              rows={6}
              placeholder="Paste 10-digit numbers here, e.g.:&#10;9580133593&#10;9876543210&#10;9123456789"
              value={manualBulkNumbers}
              onChange={(e) => setManualBulkNumbers(e.target.value)}
              className="input w-full font-mono text-sm"
              disabled={isCampaignRunning}
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-white/80">
              <Clock className="w-4 h-4 text-brand-400" />
              <span>Delay between numbers:</span>
              <select
                value={callDelaySeconds}
                onChange={(e) => setCallDelaySeconds(Number(e.target.value))}
                className="bg-white/10 rounded px-2 py-1 text-white border border-white/20"
              >
                <option value={10} className="bg-slate-900">10 seconds</option>
                <option value={15} className="bg-slate-900">15 seconds</option>
                <option value={20} className="bg-slate-900">20 seconds</option>
                <option value={30} className="bg-slate-900">30 seconds</option>
              </select>
            </div>

            <button
              disabled={isCampaignRunning}
              onClick={handleStartManualCampaign}
              className="btn-primary flex items-center gap-2 px-6 py-2.5"
            >
              <Play className="w-4 h-4" /> {isCampaignRunning ? 'Campaign in Progress...' : 'Start Manual Campaign'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: CALL LOGS */}
      {activeTab === 'logs' && (
        <div className="card p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Recent Call History & Summaries</h2>
            <span className="text-xs text-white/60">{data.logs.length} Total Calls</span>
          </div>

          <div className="space-y-3">
            {data.logs.length === 0 ? (
              <p className="text-sm text-white/40 py-8 text-center">No call logs found yet.</p>
            ) : (
              data.logs.map((log) => (
                <div key={log._id} className="p-3.5 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex justify-between items-start text-sm">
                    <div>
                      <span className="font-bold text-brand-400">{log.name || 'Caller'}</span>
                      <span className="text-white/60 font-mono text-xs ml-2">({log.phone})</span>
                      {log.shopName && (
                        <span className="text-accent-400 text-xs ml-2">· Shop: {log.shopName}</span>
                      )}
                    </div>
                    <span className={`chip-${log.category?.includes('barber') ? 'warning' : 'info'} text-2xs uppercase`}>
                      {log.category?.replace('_', ' ') || 'CALL'}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">{log.summary}</p>
                  <p className="text-2xs text-white/40">{new Date(log.createdAt).toLocaleString('en-IN')}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: ANALYTICS */}
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

      {/* TAB 7: MISSING BARBERS */}
      {activeTab === 'missing' && (
        <div className="card p-4 space-y-3">
          <h2 className="text-lg font-bold">Barber Addition Requests from Customers</h2>
          {data.missingRequests.length === 0 ? (
            <p className="text-sm text-white/40 py-8 text-center">No missing barber requests.</p>
          ) : (
            data.missingRequests.map((req) => (
              <div key={req._id} className="p-3 rounded bg-white/5 border border-white/10 flex justify-between items-center">
                <div>
                  <p className="font-bold text-white">{req.shopName || req.shop_name} ({req.barberName || req.barber_name})</p>
                  <p className="text-xs text-white/60">{req.area}, {req.district} · Requested by: {req.customerPhone || req.customer_phone}</p>
                </div>
                <span className="chip-warning">Pending Onboarding</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 8: INACTIVE BARBERS */}
      {activeTab === 'inactive' && (
        <div className="card p-4 space-y-3">
          <h2 className="text-lg font-bold">Inactive Barbers Needed Feedback Call</h2>
          {data.inactiveBarbers.length === 0 ? (
            <p className="text-sm text-white/40 py-8 text-center">All registered barbers are currently active!</p>
          ) : (
            data.inactiveBarbers.map((b) => (
              <div key={b._id} className="p-3 rounded bg-white/5 border border-white/10 flex justify-between items-center">
                <div>
                  <p className="font-bold text-white">{b.name}</p>
                  <p className="text-xs text-white/60">Owner: {b.owner?.name} ({b.owner?.phone})</p>
                </div>
                <button
                  onClick={() => {
                    setTargetPhone(b.owner?.phone || '');
                    setBarberOwnerName(b.owner?.name || '');
                    setBarberShopName(b.name || '');
                    setCallType('barber');
                    setActiveTab('launcher');
                  }}
                  className="btn-outline text-xs flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" /> Call Feedback
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
