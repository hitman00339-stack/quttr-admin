'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Users, Search, Plus, MoreVertical, Eye, Edit, Trash2,
  KeyRound, Pause, Play, Loader2, Phone, Mail, MapPin,
  TrendingUp, CheckCircle2, XCircle,
} from 'lucide-react';

export default function MarketingAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const load = async () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (statusFilter !== 'all') q.set('status', statusFilter);
    try {
      const res = await fetch(`/api/marketing/agents?${q.toString()}`);
      const data = await res.json();
      if (data.success) setAgents(data.agents);
    } catch (e) {
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  const toggleStatus = async (agent) => {
    const res = await fetch(`/api/marketing/agents/${agent._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !agent.is_active }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Agent ${data.agent.is_active ? 'activated' : 'suspended'}`);
      load();
    } else toast.error(data.message || 'Failed');
    setOpenMenu(null);
  };

  const deleteAgent = async (agent) => {
    if (!confirm(`Delete agent "${agent.name}"? Their QR activation history will be preserved.`)) return;
    const res = await fetch(`/api/marketing/agents/${agent._id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      toast.success('Agent deleted');
      load();
    } else toast.error(data.message || 'Failed');
    setOpenMenu(null);
  };

  const resetPassword = async (agent) => {
    const newPass = prompt(`Set new password for "${agent.name}" (min 6 characters):`);
    if (!newPass) return;
    if (newPass.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    const res = await fetch(`/api/marketing/agents/${agent._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_password: newPass }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Password reset. All sessions cleared.');
      alert(`New password for ${agent.name}:\n\n${newPass}\n\nShare securely with agent.`);
    } else toast.error(data.message || 'Failed');
    setOpenMenu(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Marketing Agents</h1>
          <p className="text-sm text-white/60 mt-1">
            Create login accounts for your marketing team · {agents.length} agents
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-accent flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E63946] to-[#B01824] text-white rounded-lg font-semibold hover:shadow-lg transition"
        >
          <Plus className="w-4 h-4" />
          Add Agent
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by name, phone, email, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-[#FFD700]/40 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-sm text-white"
        >
          <option value="all">All Agents</option>
          <option value="active">Active</option>
          <option value="inactive">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="card bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#FFD700]" />
          </div>
        ) : agents.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">No agents yet. Add your first agent!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {agents.map((a) => (
              <div key={a._id} className="p-4 hover:bg-white/[0.02] transition flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E63946] to-[#B01824] flex items-center justify-center flex-shrink-0 border-2 border-[#FFD700]/30">
                  <span className="text-white font-black">{a.name[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white truncate">{a.name}</p>
                    {a.is_active ? (
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full font-bold">ACTIVE</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 bg-red-500/15 text-red-400 rounded-full font-bold">SUSPENDED</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/50 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />{a.phone}
                    </span>
                    {a.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />{a.email}
                      </span>
                    )}
                    {a.city_assigned && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{a.city_assigned}
                      </span>
                    )}
                  </div>
                </div>
                <div className="hidden sm:flex flex-col items-end text-xs text-white/60">
                  <span className="font-bold text-white text-base">{a.total_activations || 0}</span>
                  <span>QRs activated</span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === a._id ? null : a._id)}
                    className="p-2 hover:bg-white/[0.05] rounded-lg"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenu === a._id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
                        <Link
                          href={`/dashboard/marketing/${a._id}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/[0.05] text-white"
                        >
                          <Eye className="w-4 h-4" /> View Details
                        </Link>
                        <button
                          onClick={() => resetPassword(a)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/[0.05] text-white text-left"
                        >
                          <KeyRound className="w-4 h-4" /> Reset Password
                        </button>
                        <button
                          onClick={() => toggleStatus(a)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/[0.05] text-left"
                        >
                          {a.is_active ? (
                            <><Pause className="w-4 h-4 text-amber-500" /> <span className="text-amber-400">Suspend</span></>
                          ) : (
                            <><Play className="w-4 h-4 text-emerald-500" /> <span className="text-emerald-400">Activate</span></>
                          )}
                        </button>
                        <div className="border-t border-white/5" />
                        <button
                          onClick={() => deleteAgent(a)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-500/10 text-red-400 text-left"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateAgentModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CreateAgentModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    city_assigned: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let p = '';
    for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)];
    setForm((f) => ({ ...f, password: p }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.password) {
      toast.error('Name, phone and password are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/marketing/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Agent created!');
        alert(
          `AGENT CREATED — share these credentials:\n\n` +
            `Name: ${form.name}\n` +
            `Login: ${form.phone}${form.email ? ' or ' + form.email : ''}\n` +
            `Password: ${form.password}\n` +
            `URL: ${window.location.origin}/marketing/login`
        );
        onCreated();
      } else {
        toast.error(data.message || 'Failed');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">Add New Agent</h2>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-white/60 mb-1 block">Full Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Rajesh Kumar"
              className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg text-white focus:border-[#FFD700]/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Phone (used for login) *</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="9876543210"
              className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg text-white focus:border-[#FFD700]/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Email (optional)</label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="rajesh@quttrr.com"
              type="email"
              className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg text-white focus:border-[#FFD700]/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 flex items-center justify-between">
              <span>Password *</span>
              <button type="button" onClick={generatePassword} className="text-[#FFD700] text-xs font-bold">
                Generate
              </button>
            </label>
            <input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min 6 characters"
              className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg text-white font-mono focus:border-[#FFD700]/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">City Assigned (optional)</label>
            <input
              value={form.city_assigned}
              onChange={(e) => setForm({ ...form, city_assigned: e.target.value })}
              placeholder="Sidhauli"
              className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg text-white focus:border-[#FFD700]/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm focus:border-[#FFD700]/40 focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg text-white/70 hover:bg-white/[0.08]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#E63946] to-[#B01824] text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Agent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
