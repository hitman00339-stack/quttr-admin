'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, User, Phone, Mail, MapPin, Loader2, Calendar,
  TrendingUp, Store, Zap, Activity, Clock,
} from 'lucide-react';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [params.id]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/marketing/agents/${params.id}`);
      const d = await res.json();
      if (d.success) setData(d);
      else toast.error(d.message || 'Failed');
    } catch (e) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#FFD700]" />
      </div>
    );
  }
  if (!data?.agent) {
    return (
      <div className="text-center py-20">
        <p className="text-white/60">Agent not found</p>
        <Link href="/dashboard/marketing" className="text-[#FFD700] mt-4 inline-block">
          ← Back to agents
        </Link>
      </div>
    );
  }

  const { agent, stats, recent_activations } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/dashboard/marketing" className="p-2 bg-white/[0.05] rounded-lg hover:bg-white/[0.1]">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E63946] to-[#B01824] flex items-center justify-center border-2 border-[#FFD700]/30">
            <span className="text-2xl font-black text-white">{agent.name[0]?.toUpperCase()}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              {agent.is_active ? (
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full font-bold">ACTIVE</span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 bg-red-500/15 text-red-400 rounded-full font-bold">SUSPENDED</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-white/60 flex-wrap">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{agent.phone}</span>
              {agent.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{agent.email}</span>}
              {agent.city_assigned && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{agent.city_assigned}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBig label="QRs Activated" value={stats.total_activations} icon={Zap} color="from-emerald-500 to-emerald-700" />
        <StatBig label="Total Scans Generated" value={stats.total_scans} icon={TrendingUp} color="from-[#E63946] to-[#B01824]" />
        <StatBig label="Last Login" value={agent.last_login_at ? new Date(agent.last_login_at).toLocaleDateString('en-IN') : 'Never'} icon={Clock} color="from-blue-500 to-blue-700" isText />
        <StatBig label="Joined" value={new Date(agent.created_at).toLocaleDateString('en-IN')} icon={Calendar} color="from-[#FFD700] to-[#B08900]" isText />
      </div>

      {/* Activations table */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <Store className="w-4 h-4 text-[#FFD700]" />
            All Activations by {agent.name}
          </h2>
          <span className="text-xs text-white/50">{recent_activations.length} shown</span>
        </div>

        {recent_activations.length === 0 ? (
          <div className="p-12 text-center">
            <Store className="w-10 h-10 mx-auto text-white/20 mb-3" />
            <p className="text-white/50">No activations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {recent_activations.map((a) => (
              <div key={a._id} className="p-4 hover:bg-white/[0.02] flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E63946]/30 to-[#B01824]/30 flex items-center justify-center flex-shrink-0 border border-[#FFD700]/20">
                  <Store className="w-4 h-4 text-[#FFD700]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{a.shop_name || a.qr_code}</p>
                    <span className="text-[10px] font-mono bg-white/[0.05] px-2 py-0.5 rounded">{a.qr_code}</span>
                  </div>
                  <p className="text-xs text-white/50 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {a.location?.town || a.location?.city || 'No location'}
                    {a.location?.state && ` · ${a.location.state}`}
                  </p>
                </div>
                <div className="text-right text-xs text-white/40 hidden sm:block">
                  {new Date(a.activated_at).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBig({ label, value, icon: Icon, color, isText = false }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold">{label}</p>
      <p className={`font-black mt-1 ${isText ? 'text-sm' : 'text-2xl'} text-white`}>
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </p>
    </div>
  );
}
