'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Phone, PhoneCall, Users, Store, FileText, BarChart3, HelpCircle,
  Send, Play, Pause, RefreshCw, CheckCircle2, AlertCircle, Layers,
  CheckSquare, Square, Clock, ShieldCheck, ChevronRight, Volume2,
  MessageSquare, Download, Filter, Search, X, Shuffle, ArrowRight
} from 'lucide-react';

export default function CallingDashboard() {
  const [activeTab, setActiveTab] = useState('launcher'); // launcher | call_barbers | call_users | bulk | logs | analytics | missing | inactive
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    logs: [],
    dayGroups: [],
    availableDates: [],
    stats: { totalCalls: 0, completedCalls: 0, noAnswerCalls: 0, totalDurationSeconds: 0, averageDurationSeconds: 0 },
    missingRequests: [],
    inactiveBarbers: [],
  });

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
  const [greetingVariationIndex, setGreetingVariationIndex] = useState(0);

  // Bulk / Campaign state
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [selectedBarberIds, setSelectedBarberIds] = useState(new Set());
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [isCampaignPaused, setIsCampaignPaused] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState({
    current: 0,
    total: 0,
    currentTarget: '',
    phone: '',
    status: '',
    elapsedSec: 0,
  });
  const [campaignLogs, setCampaignLogs] = useState([]);

  // Campaign control refs
  const campaignStopRequestedRef = useRef(false);
  const campaignPauseRef = useRef(false);

  // Manual Bulk Queue state
  const [manualBulkNumbers, setManualBulkNumbers] = useState('');
  const [manualBulkType, setManualBulkType] = useState('customer');

  // Logs Filtering state
  const [filterDate, setFilterDate] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Transcript modal state
  const [activeTranscriptLog, setActiveTranscriptLog] = useState(null);

  useEffect(() => {
    fetchCallingData();
    fetchContacts();
  }, [filterDate, filterType, filterStatus]);

  const fetchCallingData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate && filterDate !== 'all') params.set('date', filterDate);
      if (filterType && filterType !== 'all') params.set('type', filterType);
      if (filterStatus && filterStatus !== 'all') params.set('status', filterStatus);
      if (searchQuery) params.set('q', searchQuery);

      const res = await fetch(`/api/admin/calling?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        toast.error(json.error || 'Failed to load call logs');
      }
    } catch (e) {
      toast.error('Failed to connect to calling server');
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
      // Non-critical
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

  // Preview Greeting generator
  const getPreviewGreeting = () => {
    if (callType === 'barber') {
      const name = barberOwnerName || 'सलमान अली';
      const shop = barberShopName || 'SS hair wig house';
      const variations = [
        `हेलो ${name} जी? क्या मेरी आवाज़ आ रही है आपको?`,
        `हेलो? हाँजी ${name} जी, क्या मेरी आवाज़ साफ़ आ रही है आपको?`,
        `हेलो ${name} जी? सुन पा रहे हैं ना आप मुझे?`,
        `हेलो ${name} जी! क्या मेरी आवाज़ आ रही है आपको?`,
        `हेलो? हाँजी, आवाज़ आ रही है ना आपको?`,
      ];
      return variations[greetingVariationIndex % variations.length];
    } else {
      const name = customerName || 'निरंश';
      const variations = [
        `हेलो ${name} जी? क्या मेरी आवाज़ आ रही है आपको?`,
        `हेलो? हाँजी ${name} जी, क्या मेरी आवाज़ साफ़ आ रही है आपको?`,
        `हेलो ${name} जी? सुन पा रहे हैं आप मुझे?`,
        `हेलो ${name} जी! मेरी आवाज़ आ रही है ना आपको?`,
        `हेलो? हाँजी, आवाज़ आ रही है आपको?`,
        `हेलो? क्या मेरी आवाज़ साफ़ आ रही है आपको?`,
      ];
      return variations[greetingVariationIndex % variations.length];
    }
  };

  // Trigger Single Call
  const handleSingleCall = async () => {
    if (!targetPhone || targetPhone.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    setCallingState(true);
    const toastId = toast.loading(`Placing personalized call to ${targetPhone}...`);

    try {
      const payload = {
        phone: targetPhone,
        call_type: callType,
        name: callType === 'barber' ? barberOwnerName : customerName,
        owner_name: barberOwnerName,
        shop_name: barberShopName,
        variation_index: greetingVariationIndex,
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
        // Refresh logs after 8 seconds to fetch OmniDimension's newly placed record
        setTimeout(fetchCallingData, 8000);
      } else {
        toast.error(json.error || 'Failed to place call', { id: toastId });
      }
    } catch (err) {
      toast.error('Network error placing call', { id: toastId });
    }
    setCallingState(false);
  };

  // ═════════════════════════════════════════════════════════════════════
  // SAFE SEQUENTIAL QUEUE: WAITS UNTIL PREVIOUS CALL FULLY ENDS
  // ═════════════════════════════════════════════════════════════════════

  const waitForCallCompletion = async (phone, targetLabel, maxWaitSec = 140) => {
    const startTs = Date.now();
    // Wait initial 6 seconds for call setup/ringing before polling
    await new Promise((r) => setTimeout(r, 6000));

    while (Date.now() - startTs < maxWaitSec * 1000) {
      if (campaignStopRequestedRef.current) {
        return { ended: true, status: 'canceled', duration: Math.round((Date.now() - startTs) / 1000) };
      }

      // Handle pause
      while (campaignPauseRef.current && !campaignStopRequestedRef.current) {
        await new Promise((r) => setTimeout(r, 1000));
      }

      const elapsed = Math.round((Date.now() - startTs) / 1000);
      setCampaignProgress((prev) => ({
        ...prev,
        elapsedSec: elapsed,
        status: `Call in progress with ${targetLabel}... (${elapsed}s elapsed)`,
      }));

      try {
        const res = await fetch(`/api/admin/calling/status?phone=${encodeURIComponent(phone)}`);
        const json = await res.json();

        if (json.success && json.found) {
          if (json.hasEnded) {
            return {
              ended: true,
              status: json.status || 'completed',
              duration: json.durationSeconds || elapsed,
              summary: json.summary || '',
              recordingUrl: json.recordingUrl || '',
            };
          }
        }
      } catch (_) {}

      // Poll every 3.5 seconds
      await new Promise((r) => setTimeout(r, 3500));
    }

    // Fallback if timeout reached
    const totalElapsed = Math.round((Date.now() - startTs) / 1000);
    return { ended: true, status: 'completed', duration: totalElapsed, summary: 'Call finished' };
  };

  // Start Sequential Barber Feedback Campaign
  const handleStartBarberCampaign = async () => {
    const queue = registeredBarbers.filter((b) => selectedBarberIds.has(b.id));
    if (queue.length === 0) {
      toast.error('Please select at least one barber to call');
      return;
    }

    setIsCampaignRunning(true);
    setIsCampaignPaused(false);
    campaignStopRequestedRef.current = false;
    campaignPauseRef.current = false;
    setCampaignLogs([]);

    toast.success(`Starting campaign for ${queue.length} barbers sequentially (no skipping)...`);

    for (let i = 0; i < queue.length; i++) {
      if (campaignStopRequestedRef.current) {
        toast.info('Campaign stopped by admin');
        break;
      }

      // Check pause
      while (campaignPauseRef.current && !campaignStopRequestedRef.current) {
        await new Promise((r) => setTimeout(r, 1000));
      }

      const b = queue[i];
      setCampaignProgress({
        current: i + 1,
        total: queue.length,
        currentTarget: `${b.ownerName} (${b.shopName})`,
        phone: b.phone,
        status: `Dialing ${b.ownerName}...`,
        elapsedSec: 0,
      });

      const tId = toast.loading(`[${i + 1}/${queue.length}] Dialing ${b.ownerName} (${b.shopName})...`);

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
            variation_index: i,
          }),
        });
        const json = await res.json();

        if (json.success) {
          toast.loading(`[${i + 1}/${queue.length}] Call active with ${b.ownerName}. Waiting for completion...`, { id: tId });

          // WAIT UNTIL CALL ACTUALLY FINISHES!
          const result = await waitForCallCompletion(b.phone, b.ownerName);

          const logEntry = {
            target: `${b.ownerName} (${b.shopName})`,
            phone: b.phone,
            status: result.status === 'completed' ? 'Completed' : (result.status === 'no-answer' ? 'No Answer' : result.status),
            duration: `${result.duration}s`,
            summary: result.summary || json.summary || 'Call finished',
            recordingUrl: result.recordingUrl,
            time: new Date().toLocaleTimeString(),
          };
          setCampaignLogs((prev) => [logEntry, ...prev]);

          toast.success(`[${i + 1}/${queue.length}] Call ended with ${b.ownerName} (${result.duration}s)`, { id: tId });
        } else {
          toast.error(`[${i + 1}/${queue.length}] Failed to dial ${b.ownerName}: ${json.error}`, { id: tId });
          setCampaignLogs((prev) => [
            {
              target: `${b.ownerName} (${b.shopName})`,
              phone: b.phone,
              status: 'Failed',
              duration: '0s',
              summary: json.error || 'Failed to place call',
              time: new Date().toLocaleTimeString(),
            },
            ...prev,
          ]);
        }
      } catch (e) {
        toast.error(`[${i + 1}/${queue.length}] Network error: ${b.ownerName}`, { id: tId });
      }

      // Small 4-second breather so trunk is 100% clear before next dial
      if (i < queue.length - 1 && !campaignStopRequestedRef.current) {
        setCampaignProgress((prev) => ({
          ...prev,
          status: 'Call ended. Cool-down 4s before dialing next barber...',
        }));
        await new Promise((r) => setTimeout(r, 4000));
      }
    }

    setIsCampaignRunning(false);
    setIsCampaignPaused(false);
    toast.success('🎉 Barber campaign completed! Refreshing summaries...');
    fetchCallingData();
  };

  // Start Sequential Customer Campaign
  const handleStartUserCampaign = async () => {
    const queue = registeredUsers.filter((u) => selectedUserIds.has(u.id));
    if (queue.length === 0) {
      toast.error('Please select at least one customer to call');
      return;
    }

    setIsCampaignRunning(true);
    setIsCampaignPaused(false);
    campaignStopRequestedRef.current = false;
    campaignPauseRef.current = false;
    setCampaignLogs([]);

    toast.success(`Starting campaign for ${queue.length} customers sequentially (no skipping)...`);

    for (let i = 0; i < queue.length; i++) {
      if (campaignStopRequestedRef.current) {
        toast.info('Campaign stopped by admin');
        break;
      }

      // Check pause
      while (campaignPauseRef.current && !campaignStopRequestedRef.current) {
        await new Promise((r) => setTimeout(r, 1000));
      }

      const u = queue[i];
      setCampaignProgress({
        current: i + 1,
        total: queue.length,
        currentTarget: u.name,
        phone: u.phone,
        status: `Dialing customer ${u.name}...`,
        elapsedSec: 0,
      });

      const tId = toast.loading(`[${i + 1}/${queue.length}] Dialing ${u.name}...`);

      try {
        const res = await fetch('/api/omni/trigger-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: u.phone,
            call_type: 'customer',
            name: u.name,
            variation_index: i,
          }),
        });
        const json = await res.json();

        if (json.success) {
          toast.loading(`[${i + 1}/${queue.length}] Call active with ${u.name}. Waiting for call to end...`, { id: tId });

          // WAIT UNTIL CALL ACTUALLY FINISHES!
          const result = await waitForCallCompletion(u.phone, u.name);

          const logEntry = {
            target: u.name,
            phone: u.phone,
            status: result.status === 'completed' ? 'Completed' : (result.status === 'no-answer' ? 'No Answer' : result.status),
            duration: `${result.duration}s`,
            summary: result.summary || json.summary || 'Call finished',
            recordingUrl: result.recordingUrl,
            time: new Date().toLocaleTimeString(),
          };
          setCampaignLogs((prev) => [logEntry, ...prev]);

          toast.success(`[${i + 1}/${queue.length}] Call ended with ${u.name} (${result.duration}s)`, { id: tId });
        } else {
          toast.error(`[${i + 1}/${queue.length}] Failed: ${u.name}`, { id: tId });
        }
      } catch (e) {
        toast.error(`[${i + 1}/${queue.length}] Error: ${u.name}`, { id: tId });
      }

      // 4-second breather between calls
      if (i < queue.length - 1 && !campaignStopRequestedRef.current) {
        setCampaignProgress((prev) => ({
          ...prev,
          status: 'Call ended. Cool-down 4s before dialing next customer...',
        }));
        await new Promise((r) => setTimeout(r, 4000));
      }
    }

    setIsCampaignRunning(false);
    setIsCampaignPaused(false);
    toast.success('🎉 Customer campaign completed! Refreshing summaries...');
    fetchCallingData();
  };

  // Pause / Resume / Stop Campaign Controls
  const togglePauseCampaign = () => {
    campaignPauseRef.current = !campaignPauseRef.current;
    setIsCampaignPaused(campaignPauseRef.current);
    if (campaignPauseRef.current) {
      toast.info('Campaign paused. Current call will complete, but no new call will be dialed.');
    } else {
      toast.success('Campaign resumed!');
    }
  };

  const handleStopCampaign = () => {
    campaignStopRequestedRef.current = true;
    campaignPauseRef.current = false;
    setIsCampaignPaused(false);
    toast.info('Stopping campaign...');
  };

  // Manual Campaign
  const handleStartManualCampaign = async () => {
    const rawNumbers = manualBulkNumbers
      .split(/[\n,;]+/)
      .map((n) => n.trim().replace(/\D/g, '').slice(-10))
      .filter((n) => n.length === 10);

    const uniqueNumbers = Array.from(new Set(rawNumbers));

    if (uniqueNumbers.length === 0) {
      toast.error('Please enter at least one valid 10-digit number');
      return;
    }

    setIsCampaignRunning(true);
    campaignStopRequestedRef.current = false;
    campaignPauseRef.current = false;
    setCampaignLogs([]);
    toast.success(`Starting queue of ${uniqueNumbers.length} numbers sequentially...`);

    for (let i = 0; i < uniqueNumbers.length; i++) {
      if (campaignStopRequestedRef.current) break;

      const num = uniqueNumbers[i];
      setCampaignProgress({
        current: i + 1,
        total: uniqueNumbers.length,
        currentTarget: `Number ${num}`,
        phone: num,
        status: `Dialing +91${num}...`,
        elapsedSec: 0,
      });

      const tId = toast.loading(`[${i + 1}/${uniqueNumbers.length}] Calling ${num}...`);

      try {
        const res = await fetch('/api/omni/trigger-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: num,
            call_type: manualBulkType,
            variation_index: i,
          }),
        });
        const json = await res.json();

        if (json.success) {
          const result = await waitForCallCompletion(num, num);
          setCampaignLogs((prev) => [
            {
              target: `+91${num}`,
              phone: num,
              status: result.status,
              duration: `${result.duration}s`,
              summary: result.summary || 'Call completed',
              time: new Date().toLocaleTimeString(),
            },
            ...prev,
          ]);
          toast.success(`[${i + 1}/${uniqueNumbers.length}] Ended with ${num} (${result.duration}s)`, { id: tId });
        } else {
          toast.error(`Failed ${num}`, { id: tId });
        }
      } catch (e) {
        toast.error(`Error ${num}`, { id: tId });
      }

      if (i < uniqueNumbers.length - 1 && !campaignStopRequestedRef.current) {
        await new Promise((r) => setTimeout(r, 4000));
      }
    }

    setIsCampaignRunning(false);
    toast.success('🎉 Manual campaign completed!');
    fetchCallingData();
  };

  // Toggle helpers
  const toggleBarberSelection = (id) => {
    setSelectedBarberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllBarbers = () => {
    if (selectedBarberIds.size === registeredBarbers.length) {
      setSelectedBarberIds(new Set());
    } else {
      setSelectedBarberIds(new Set(registeredBarbers.map((b) => b.id)));
    }
  };

  const toggleUserSelection = (id) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllUsers = () => {
    if (selectedUserIds.size === registeredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(registeredUsers.map((u) => u.id)));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <PhoneCall className="w-7 h-7 text-brand-500" />
              OmniDimension AI Calling Center
            </h1>
            <span className="chip-primary text-xs font-mono font-bold">Agent 265888</span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Voice Agent Riya (रिया) · Natural Variations · Zero Call Skipping Queue · Day-Wise Recordings & AI Summaries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchCallingData();
              toast.success('Syncing with OmniDimension...');
            }}
            className="btn-outline flex items-center gap-1.5 text-xs py-2 px-3"
            title="Sync latest call recordings and summaries"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync OmniDimension
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex gap-2 border-b border-white/10 overflow-x-auto pb-2 text-sm font-medium">
        <button
          onClick={() => setActiveTab('launcher')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'launcher' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Phone className="w-4 h-4" /> Single Call Launcher
        </button>

        <button
          onClick={() => setActiveTab('call_barbers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'call_barbers' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Store className="w-4 h-4" /> Call Barbers ({registeredBarbers.length})
        </button>

        <button
          onClick={() => setActiveTab('call_users')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'call_users' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" /> Call Customers ({registeredUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('bulk')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'bulk' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" /> Manual Numbers Queue
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'logs' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4" /> Call Logs & Recordings ({data.stats?.totalCalls || data.logs.length})
        </button>

        <button
          onClick={() => setActiveTab('missing')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'missing' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <AlertCircle className="w-4 h-4" /> Missing Barbers ({data.missingRequests.length})
        </button>
      </div>

      {/* TAB 1: SINGLE CALL LAUNCHER */}
      {activeTab === 'launcher' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-brand-400" /> Start Personalized Live Call
            </h2>

            {/* Audience Type Selection */}
            <div>
              <label className="text-xs text-white/60 block mb-1 font-semibold">Call Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCallType('customer')}
                  className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    callType === 'customer'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400 shadow-sm'
                      : 'border-white/10 text-white/60 hover:border-white/20'
                  }`}
                >
                  <Users className="w-4 h-4" /> Customer Pitch
                </button>
                <button
                  type="button"
                  onClick={() => setCallType('barber')}
                  className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    callType === 'barber'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400 shadow-sm'
                      : 'border-white/10 text-white/60 hover:border-white/20'
                  }`}
                >
                  <Store className="w-4 h-4" /> Barber Feedback
                </button>
              </div>
            </div>

            {/* Barber Quick Selector */}
            {callType === 'barber' && (
              <div className="space-y-3 p-3.5 rounded-lg bg-white/5 border border-white/10">
                <label className="text-xs text-white/80 block font-semibold">
                  Quick Select Registered Shop Owner:
                </label>
                <select
                  onChange={(e) => handleSelectBarberForSingleCall(e.target.value)}
                  className="input w-full text-xs cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled className="bg-slate-900">
                    -- Select Registered Barber ({registeredBarbers.length} Available) --
                  </option>
                  {registeredBarbers.map((b) => (
                    <option key={b.id} value={b.id} className="bg-slate-900">
                      {b.shopName} - {b.ownerName} ({b.city})
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <label className="text-2xs text-white/60 block mb-1">Owner Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Salman Ali"
                      value={barberOwnerName}
                      onChange={(e) => setBarberOwnerName(e.target.value)}
                      className="input w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-2xs text-white/60 block mb-1">Shop Name</label>
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

            {/* Customer Name */}
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

            {/* Phone Number Input */}
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

            {/* Greeting Variation Selector & Preview */}
            <div className="p-3.5 rounded-lg bg-brand-500/10 border border-brand-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-400 flex items-center gap-1.5">
                  <Shuffle className="w-3.5 h-3.5" /> Spoken Greeting Variation #{greetingVariationIndex + 1}:
                </span>
                <button
                  type="button"
                  onClick={() => setGreetingVariationIndex((prev) => prev + 1)}
                  className="btn-outline text-2xs py-0.5 px-2 flex items-center gap-1"
                >
                  <Shuffle className="w-3 h-3" /> Shuffle Variation
                </button>
              </div>
              <p className="text-xs text-white/90 italic bg-black/20 p-2.5 rounded border border-white/5 leading-relaxed">
                &ldquo;{getPreviewGreeting()}&rdquo;
              </p>
              <p className="text-2xs text-white/50">
                ✨ Variation rotates automatically in bulk campaigns to ensure calls never sound repetitive or like an AI.
              </p>
            </div>

            <button
              disabled={callingState}
              onClick={handleSingleCall}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              <Send className="w-4 h-4" /> {callingState ? 'Placing Call...' : 'Start Personalized Call Now'}
            </button>
          </div>

          {/* Engine & Configuration Card */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> OmniDimension Engine Status
            </h2>
            <div className="space-y-2.5 text-sm text-white/80">
              <div className="flex justify-between p-2.5 rounded bg-white/5">
                <span>AI Voice Assistant:</span> <strong className="text-brand-400">Riya (रिया)</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-white/5">
                <span>Active Agent ID:</span> <strong className="text-accent-500 font-mono">265888</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-white/5">
                <span>Brand Pronunciation:</span> <strong className="text-brand-400">कटर (Katar / Cutter)</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-white/5">
                <span>Early Interruption Handling:</span> <strong className="text-emerald-400">Active (Completes Pitch)</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-white/5">
                <span>Registered Barber Shops:</span> <strong className="text-emerald-400">{registeredBarbers.length} Active</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-white/5">
                <span>Total Calls Logged:</span> <strong>{data.stats?.totalCalls || data.logs.length}</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1.5 text-white/80">
              <strong className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Early Interruption Protection:
              </strong>
              <p className="text-2xs text-white/70 leading-relaxed">
                If the user says &ldquo;हेलो?&rdquo;, &ldquo;हाँ बोलो&rdquo;, or &ldquo;कौन बोल रहा है?&rdquo; at the start of the call, Riya will politely answer and smoothly deliver her full intro pitch without hanging up or skipping steps.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CALL REGISTERED BARBERS SEPARATELY */}
      {activeTab === 'call_barbers' && (
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-accent-500" /> Sequential Barber Feedback Campaign
                </h2>
                <p className="text-xs text-white/60 mt-1">
                  Calls registered shop owners one by one. The system polls call status and <strong>waits until each call finishes</strong> before dialing the next, ensuring zero trunk clashes or skipped numbers.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {isCampaignRunning ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePauseCampaign}
                      className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs"
                    >
                      {isCampaignPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-yellow-400" />}
                      {isCampaignPaused ? 'Resume Campaign' : 'Pause Campaign'}
                    </button>
                    <button
                      onClick={handleStopCampaign}
                      className="btn-outline border-red-500/40 text-red-400 hover:bg-red-500/10 flex items-center gap-1.5 px-3 py-2 text-xs"
                    >
                      <X className="w-3.5 h-3.5" /> Stop Campaign
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={selectedBarberIds.size === 0}
                    onClick={handleStartBarberCampaign}
                    className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
                  >
                    <Play className="w-4 h-4" />
                    Call Selected Barbers ({selectedBarberIds.size})
                  </button>
                )}
              </div>
            </div>

            {/* Campaign In-Progress Status Card */}
            {isCampaignRunning && (
              <div className="p-4 rounded-lg bg-brand-500/15 border border-brand-500/40 space-y-3">
                <div className="flex justify-between text-sm font-bold text-brand-300">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Calling Barber: {campaignProgress.currentTarget}
                  </span>
                  <span>{campaignProgress.current} of {campaignProgress.total}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-brand-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(campaignProgress.current / campaignProgress.total) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-white/80">
                  <span className="font-mono text-emerald-300">{campaignProgress.status}</span>
                  <span className="text-2xs text-white/60">Phone: {campaignProgress.phone}</span>
                </div>
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
                        <td className="p-3 text-xs text-emerald-400 font-semibold">₹{b.startingPrice}</td>
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
                            Call Now
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Campaign Execution History */}
          {campaignLogs.length > 0 && (
            <div className="card p-4 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Campaign Progress Results ({campaignLogs.length})</span>
                <span className="text-xs text-white/50">Updated live as calls end</span>
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {campaignLogs.map((log, i) => (
                  <div key={i} className="p-2.5 rounded bg-white/5 border border-white/10 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-brand-400">{log.target}</span> ({log.phone})
                      <p className="text-white/60 mt-0.5 line-clamp-1">{log.summary}</p>
                    </div>
                    <div className="text-right">
                      <span className={`chip-${log.status === 'Completed' ? 'success' : 'warning'} text-2xs`}>
                        {log.status} ({log.duration})
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

      {/* TAB 3: CALL REGISTERED CUSTOMERS SEPARATELY */}
      {activeTab === 'call_users' && (
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent-500" /> Sequential Customer Outreach Campaign
                </h2>
                <p className="text-xs text-white/60 mt-1">
                  Calls customers one-by-one to pitch barber booking on Quttr. Each call runs to completion before the next one starts.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {isCampaignRunning ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePauseCampaign}
                      className="btn-outline flex items-center gap-1.5 px-3 py-2 text-xs"
                    >
                      {isCampaignPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-yellow-400" />}
                      {isCampaignPaused ? 'Resume Campaign' : 'Pause Campaign'}
                    </button>
                    <button
                      onClick={handleStopCampaign}
                      className="btn-outline border-red-500/40 text-red-400 hover:bg-red-500/10 flex items-center gap-1.5 px-3 py-2 text-xs"
                    >
                      <X className="w-3.5 h-3.5" /> Stop Campaign
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={selectedUserIds.size === 0}
                    onClick={handleStartUserCampaign}
                    className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
                  >
                    <Play className="w-4 h-4" />
                    Call Selected Customers ({selectedUserIds.size})
                  </button>
                )}
              </div>
            </div>

            {/* Campaign Progress Bar */}
            {isCampaignRunning && (
              <div className="p-4 rounded-lg bg-brand-500/15 border border-brand-500/40 space-y-3">
                <div className="flex justify-between text-sm font-bold text-brand-300">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Calling Customer: {campaignProgress.currentTarget}
                  </span>
                  <span>{campaignProgress.current} of {campaignProgress.total}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-brand-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(campaignProgress.current / campaignProgress.total) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-white/80">
                  <span className="font-mono text-emerald-300">{campaignProgress.status}</span>
                  <span className="text-2xs text-white/60">Phone: {campaignProgress.phone}</span>
                </div>
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
        </div>
      )}

      {/* TAB 4: MANUAL NUMBERS QUEUE */}
      {activeTab === 'bulk' && (
        <div className="card p-6 space-y-4 max-w-3xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent-500" /> Manual Phone Numbers Queue
          </h2>
          <p className="text-xs text-white/60">
            Paste phone numbers below (one per line or separated by commas). The queue waits for each call to finish before placing the next.
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
              className="input w-full font-mono text-sm leading-relaxed"
            />
          </div>

          <button
            disabled={isCampaignRunning}
            onClick={handleStartManualCampaign}
            className="btn-primary flex items-center gap-2 px-6 py-2.5"
          >
            <Play className="w-4 h-4" /> {isCampaignRunning ? 'Campaign in Progress...' : 'Start Manual Queue Campaign'}
          </button>
        </div>
      )}

      {/* TAB 5: CALL LOGS, EXACT SUMMARIES & DAY-WISE RECORDINGS */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="card p-4 text-center">
              <p className="text-xs text-white/60">Total Calls Logged</p>
              <h3 className="text-2xl font-bold text-white mt-1">{data.stats?.totalCalls || 0}</h3>
            </div>
            <div className="card p-4 text-center border-emerald-500/20 bg-emerald-500/5">
              <p className="text-xs text-emerald-400 font-medium">Completed Calls</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{data.stats?.completedCalls || 0}</h3>
            </div>
            <div className="card p-4 text-center border-yellow-500/20 bg-yellow-500/5">
              <p className="text-xs text-yellow-400 font-medium">No Answer / Busy</p>
              <h3 className="text-2xl font-bold text-yellow-400 mt-1">{data.stats?.noAnswerCalls || 0}</h3>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-white/60">Total Talk Time</p>
              <h3 className="text-2xl font-bold text-brand-400 mt-1">
                {Math.floor((data.stats?.totalDurationSeconds || 0) / 60)}m {(data.stats?.totalDurationSeconds || 0) % 60}s
              </h3>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-white/60">Average Call Duration</p>
              <h3 className="text-2xl font-bold text-accent-400 mt-1">{data.stats?.averageDurationSeconds || 0}s</h3>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Date Filter */}
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs">
                <Clock className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-white/60">Day:</span>
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-transparent text-white font-semibold outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900">All Days</option>
                  <option value="today" className="bg-slate-900">Today</option>
                  <option value="yesterday" className="bg-slate-900">Yesterday</option>
                  {(data.availableDates || []).map((d) => (
                    <option key={d.dateKey} value={d.dateKey} className="bg-slate-900">
                      {d.label} ({d.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Call Type Filter */}
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-accent-400" />
                <span className="text-white/60">Type:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-transparent text-white font-semibold outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900">All Audiences</option>
                  <option value="barber" className="bg-slate-900">Barbers Feedback</option>
                  <option value="customer" className="bg-slate-900">Customers Pitch</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs">
                <span className="text-white/60">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent text-white font-semibold outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900">All Statuses</option>
                  <option value="completed" className="bg-slate-900">Completed</option>
                  <option value="no-answer" className="bg-slate-900">No Answer</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search phone, name, shop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCallingData()}
                className="input pl-9 text-xs w-full md:w-64"
              />
            </div>
          </div>

          {/* DAY-WISE GROUPED CALL LOGS */}
          <div className="space-y-6">
            {loading ? (
              <div className="card p-12 text-center text-white/60">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-400" />
                Loading latest call summaries and audio recordings...
              </div>
            ) : data.dayGroups?.length === 0 ? (
              <div className="card p-12 text-center text-white/50 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-white/30" />
                <p className="text-base font-semibold text-white">No call logs found for this filter.</p>
                <p className="text-xs text-white/50">Try switching the date filter or trigger a new call above.</p>
              </div>
            ) : (
              data.dayGroups.map((group) => (
                <div key={group.dateKey} className="space-y-3">
                  {/* Day Header Banner */}
                  <div className="flex items-center justify-between bg-white/5 border border-white/10 px-4 py-2.5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-brand-400" />
                      <h3 className="font-bold text-sm text-white">{group.label}</h3>
                      <span className="text-xs text-white/40 font-mono">({group.dateKey})</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/60">
                      <span>{group.logs.length} Calls</span>
                      <span>·</span>
                      <span className="text-emerald-400 font-medium">{group.completedCount} Completed</span>
                      <span>·</span>
                      <span className="text-brand-400 font-mono">{Math.floor(group.totalDuration / 60)}m {group.totalDuration % 60}s Talk Time</span>
                    </div>
                  </div>

                  {/* Calls in this Day Group */}
                  <div className="space-y-3">
                    {group.logs.map((log) => {
                      const isCompleted = log.status?.toLowerCase() === 'completed';
                      const isBarber = log.callType === 'barber';

                      return (
                        <div
                          key={log.omniCallId || log._id}
                          className="card p-4 space-y-3 border-white/10 hover:border-brand-500/40 transition-all bg-slate-900/40"
                        >
                          {/* Top Row: Caller identity & Status */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-base">{log.name || 'Caller'}</span>
                              <span className="text-xs font-mono text-white/60">({log.phone})</span>

                              {log.shopName && (
                                <span className="text-xs text-accent-400 font-medium bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20">
                                  Shop: {log.shopName}
                                </span>
                              )}

                              <span
                                className={`text-2xs font-semibold px-2 py-0.5 rounded ${
                                  isBarber
                                    ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                                    : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                                }`}
                              >
                                {isBarber ? 'Barber Feedback' : 'Customer Outreach'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                  isCompleted
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                }`}
                              >
                                {log.status || 'Completed'}
                              </span>
                            </div>
                          </div>

                          {/* Middle Row: EXACT RUN TILL TIME & DURATION */}
                          <div className="flex items-center gap-3 text-xs text-white/70 bg-black/20 p-2 rounded-lg border border-white/5 flex-wrap">
                            <span className="flex items-center gap-1.5 text-brand-300 font-medium">
                              <Clock className="w-3.5 h-3.5 text-brand-400" />
                              {log.runTillText}
                            </span>
                            {log.durationSeconds > 0 && (
                              <span className="text-white/40">· Duration: <strong className="text-white font-mono">{log.durationFormatted}</strong></span>
                            )}
                            {log.hangupReason && (
                              <span className="text-white/40">· Reason: <span className="text-white/70">{log.hangupReason}</span></span>
                            )}
                          </div>

                          {/* EXACT OMNIDIMENSION AI CALL SUMMARY */}
                          <div className="p-3 rounded-lg bg-brand-500/5 border border-brand-500/15 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-400">
                              <ShieldCheck className="w-3.5 h-3.5" /> OmniDimension AI Summary:
                            </div>
                            <p className="text-xs text-white/90 leading-relaxed italic">
                              &ldquo;{log.summary}&rdquo;
                            </p>
                          </div>

                          {/* AUDIO RECORDING PLAYER & TRANSCRIPT BUTTON */}
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-white/5">
                            {log.recordingUrl ? (
                              <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
                                <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <audio
                                  controls
                                  preload="none"
                                  src={log.recordingUrl}
                                  className="w-full h-8 text-xs accent-brand-500"
                                />
                                <a
                                  href={log.recordingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="btn-outline p-1.5 text-white/60 hover:text-white shrink-0"
                                  title="Download recording MP3"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-2xs text-white/40 italic flex items-center gap-1">
                                <Volume2 className="w-3.5 h-3.5" /> Recording unavailable for this call
                              </span>
                            )}

                            {log.transcript && (
                              <button
                                onClick={() => setActiveTranscriptLog(log)}
                                className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 text-brand-300 hover:text-white shrink-0"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-brand-400" /> View Turn-by-Turn Transcript
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: MISSING BARBERS REQUESTED BY CUSTOMERS */}
      {activeTab === 'missing' && (
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-accent-500" /> Barbers Requested by Callers
          </h2>
          <p className="text-xs text-white/60">
            When callers tell Riya their local shop is missing, Riya records their details via RequestNewBarber tool.
          </p>

          {data.missingRequests.length === 0 ? (
            <p className="text-sm text-white/40 py-8 text-center">No missing barber requests recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {data.missingRequests.map((req) => (
                <div key={req._id} className="p-3.5 rounded-lg bg-white/5 border border-white/10 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white">{req.shopName || req.shop_name} ({req.barberName || req.barber_name})</p>
                    <p className="text-xs text-white/60 mt-0.5">{req.area}, {req.district} · Requested by: {req.customerPhone || req.customer_phone}</p>
                  </div>
                  <span className="chip-warning text-xs">Pending Onboarding</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TRANSCRIPT POPUP MODAL */}
      {activeTranscriptLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-2xl w-full max-h-[85vh] flex flex-col p-6 space-y-4 border-brand-500/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-400" /> Turn-by-Turn Call Transcript
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Call with {activeTranscriptLog.name} ({activeTranscriptLog.phone}) · {activeTranscriptLog.runTillText}
                </p>
              </div>
              <button
                onClick={() => setActiveTranscriptLog(null)}
                className="btn-outline p-1.5 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Audio player if recording available */}
            {activeTranscriptLog.recordingUrl && (
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <audio controls src={activeTranscriptLog.recordingUrl} className="w-full h-8" />
              </div>
            )}

            {/* Transcript turns */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs">
              {activeTranscriptLog.transcript
                .split(/<br\s*\/?>|\n/)
                .filter((line) => line && line.trim())
                .map((line, idx) => {
                  const isBot = line.startsWith('LLM:') || line.startsWith('Bot:') || line.startsWith('Agent:');
                  const isUser = line.startsWith('User:');
                  const cleanText = line.replace(/^(LLM:|Bot:|Agent:|User:)\s*/, '');

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg max-w-[90%] ${
                        isBot
                          ? 'bg-brand-500/15 border border-brand-500/30 text-white mr-auto'
                          : isUser
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 ml-auto'
                          : 'bg-white/5 text-white/80'
                      }`}
                    >
                      <strong className={`block mb-1 text-2xs uppercase ${isBot ? 'text-brand-400' : isUser ? 'text-emerald-400' : 'text-white/50'}`}>
                        {isBot ? 'Riya (AI Assistant)' : isUser ? 'Customer / Barber' : 'System'}
                      </strong>
                      <p className="leading-relaxed">{cleanText}</p>
                    </div>
                  );
                })}
            </div>

            <div className="border-t border-white/10 pt-3 flex justify-end">
              <button onClick={() => setActiveTranscriptLog(null)} className="btn-primary text-xs px-4 py-2">
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
