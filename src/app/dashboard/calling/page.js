'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Phone, Users, Store, FileText, BarChart3, HelpCircle, Send } from 'lucide-react';

export default function CallingDashboard() {
  const [activeTab, setActiveTab] = useState('launcher');
  const [data, setData] = useState({ logs: [], missingRequests: [], inactiveBarbers: [], categoriesCount: {}, totalCalls: 0 });
  const [targetPhone, setTargetPhone] = useState('');
  const [callType, setCallType] = useState('customer');

  useEffect(() => {
    fetch('/api/admin/calling').then(r => r.json()).then(res => {
      if(res.success) setData(res);
    });
  }, []);

  const handleCall = () => {
    if(!targetPhone) return toast.error("Enter phone number");
    toast.success(`Triggering ${callType} call to ${targetPhone} via OmniDimension API...`);
    // Note: To make this ACTUALLY dial out, you need to call OmniDimension's Outbound Calling API here.
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in">
      <div>
        <h1 className="text-display">AI Calling Center (Riya)</h1>
        <p className="text-body mt-1">Automated customer outreach & barber feedback loop</p>
      </div>

      <div className="flex gap-2 border-b border-white/10 pb-3 flex-wrap">
        {[
          { id: 'launcher', label: 'Call Launcher', icon: Phone },
          { id: 'logs', label: 'Call Logs', icon: FileText },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'missing', label: 'Missing Barbers', icon: HelpCircle },
          { id: 'inactive', label: 'Inactive Barbers', icon: Store }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === tab.id ? 'bg-brand-500 text-white' : 'text-white/60 hover:bg-white/5'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'launcher' && (
        <div className="card p-6 max-w-md space-y-4">
          <h2 className="text-lg font-bold">Start AI Call</h2>
          <div className="flex gap-2">
            <button onClick={() => setCallType('customer')} className={`flex-1 p-3 rounded-lg border ${callType === 'customer' ? 'border-brand-500 text-brand-400' : 'border-white/10'}`}>Customer Pitch</button>
            <button onClick={() => setCallType('barber')} className={`flex-1 p-3 rounded-lg border ${callType === 'barber' ? 'border-brand-500 text-brand-400' : 'border-white/10'}`}>Barber Feedback</button>
          </div>
          <input type="text" placeholder="Phone Number (e.g. 9876543210)" value={targetPhone} onChange={(e) => setTargetPhone(e.target.value)} className="input w-full" />
          <button onClick={handleCall} className="btn-primary w-full flex items-center justify-center gap-2 py-3"><Send className="w-4 h-4"/> Start Call</button>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-3">
          {data.logs.map((log, i) => (
            <div key={i} className="card p-4 space-y-1">
              <div className="flex justify-between font-bold text-brand-400"><span>{log.name} ({log.phone})</span><span className="text-xs text-white">{log.category}</span></div>
              <p className="text-sm text-white/80">{log.summary}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'missing' && (
        <div className="space-y-3">
          {data.missingRequests.map((req, i) => (
            <div key={i} className="card p-4">
              <p className="font-bold">{req.shop_name} ({req.barber_name})</p>
              <p className="text-sm text-white/60">Area: {req.area}, {req.district} | Req By: {req.customer_phone}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
