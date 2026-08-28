'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Share2, Users, Upload, Play, BarChart3, MessageCircle,
  Zap, Database, RefreshCw, Plus, Trash2, Eye, Heart,
  Clock, Check, Copy, Send, TrendingUp, Sparkles, X
} from 'lucide-react';
import { authService } from '../../../services/auth';

// ============================================
// ⚠️ Set your Render backend URL here or in .env
// ============================================
const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/social`
  : 'https://your-backend.onrender.com/api/social';

// ============================================
// API HELPER — Uses your quttr_admin_token
// ============================================
const apiCall = async (endpoint, options = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('quttr_admin_token') : null;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'API Error');
  }
  return res.json();
};

const fmt = (n) => {
  if (!n) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
};

const timeAgo = (d) => {
  if (!d) return 'recently';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
};

const NICHES = ['entertainment', 'tech', 'lifestyle', 'motivation', 'comedy', 'education', 'fitness', 'food', 'travel', 'fashion'];

const TABS = [
  { k: 'dashboard', l: 'Dashboard', icon: BarChart3 },
  { k: 'accounts', l: 'Accounts', icon: Users },
  { k: 'upload', l: 'Upload', icon: Upload },
  { k: 'reels', l: 'Reels', icon: Play },
  { k: 'analytics', l: 'Analytics', icon: TrendingUp },
  { k: 'comments', l: 'Comments', icon: MessageCircle },
  { k: 'ai', l: 'AI Tools', icon: Zap },
  { k: 'setup', l: 'Setup', icon: Database },
];

export default function SocialMediaPage() {
  const [tab, setTab] = useState('dashboard');
  const [accounts, setAccounts] = useState([]);
  const [overview, setOverview] = useState(null);
  const [todayStats, setTodayStats] = useState(null);
  const [reels, setReels] = useState([]);
  const [comments, setComments] = useState([]);
  const [accPerf, setAccPerf] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Upload state
  const [selAccs, setSelAccs] = useState([]);
  const [uTitle, setUTitle] = useState('');
  const [uCaption, setUCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  // AI state
  const [aiNiche, setAiNiche] = useState('entertainment');
  const [aiTitles, setAiTitles] = useState([]);
  const [aiCaption, setAiCaption] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Add account modal
  const [showAdd, setShowAdd] = useState(false);
  const [newAcc, setNewAcc] = useState({ username: '', displayName: '', niche: 'entertainment', followers: 0 });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAccounts = useCallback(async () => {
    try {
      const data = await apiCall('/accounts');
      setAccounts(data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadTab = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'dashboard') {
        const [ov, ts, rl] = await Promise.all([
          apiCall('/analytics/overview'),
          apiCall('/reels/today-stats'),
          apiCall('/reels?limit=6'),
        ]);
        setOverview(ov);
        setTodayStats(ts);
        setReels(rl.reels || []);
      } else if (tab === 'analytics') {
        const [ov, ap] = await Promise.all([
          apiCall('/analytics/overview'),
          apiCall('/analytics/accounts'),
        ]);
        setOverview(ov);
        setAccPerf(ap || []);
      } else if (tab === 'reels') {
        const rl = await apiCall('/reels?limit=50');
        setReels(rl.reels || []);
      } else if (tab === 'comments') {
        const cm = await apiCall('/comments');
        setComments(cm || []);
      }
      if (tab === 'accounts' || tab === 'upload') {
        await loadAccounts();
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [tab, loadAccounts]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    loadTab();
  }, [loadTab]);

  const seed = async (type) => {
    try {
      const res = await apiCall(`/seed/${type}`, { method: 'POST' });
      showToast(res.message || `${type} seeded!`);
      loadAccounts();
      loadTab();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const createReel = async () => {
    if (selAccs.length === 0) return showToast('Select at least one account', 'error');
    setUploading(true);
    try {
      if (selAccs.length > 1) {
        const res = await apiCall('/reels/bulk', {
          method: 'POST',
          body: JSON.stringify({ accountIds: selAccs }),
        });
        showToast(res.message || 'Uploaded to multiple accounts!');
      } else {
        await apiCall('/reels', {
          method: 'POST',
          body: JSON.stringify({
            accountId: selAccs[0],
            title: uTitle,
            caption: uCaption,
            useAiTitle: !uTitle,
          }),
        });
        showToast('Reel created with QUTTR watermark!');
      }
      setSelAccs([]);
      setUTitle('');
      setUCaption('');
      loadAccounts();
      loadTab();
    } catch (e) {
      showToast(e.message, 'error');
    }
    setUploading(false);
  };

  const addAccount = async () => {
    if (!newAcc.username || !newAcc.displayName) return showToast('Fill all required fields', 'error');
    try {
      await apiCall('/accounts', { method: 'POST', body: JSON.stringify(newAcc) });
      showToast('Account added!');
      setShowAdd(false);
      setNewAcc({ username: '', displayName: '', niche: 'entertainment', followers: 0 });
      loadAccounts();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const deleteAcc = async (id) => {
    if (!confirm('Delete this account and all its reels?')) return;
    try {
      await apiCall(`/accounts/${id}`, { method: 'DELETE' });
      showToast('Account deleted');
      loadAccounts();
      loadTab();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const toggleAutoReply = async (id, current) => {
    try {
      await apiCall(`/accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ autoReplyEnabled: !current }),
      });
      loadAccounts();
      showToast(`Auto-reply ${!current ? 'enabled' : 'disabled'}`);
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const genTitles = async () => {
    setAiLoading(true);
    try {
      const res = await apiCall('/ai/titles', {
        method: 'POST',
        body: JSON.stringify({ niche: aiNiche, count: 8 }),
      });
      setAiTitles(res.titles || []);
      showToast('Titles generated!');
    } catch (e) {
      showToast(e.message, 'error');
    }
    setAiLoading(false);
  };

  const genCaption = async () => {
    setAiLoading(true);
    try {
      const res = await apiCall('/ai/caption', {
        method: 'POST',
        body: JSON.stringify({ title: aiTitles[0] || 'Trending Reel', niche: aiNiche }),
      });
      setAiCaption(res.caption || '');
      showToast('Caption generated!');
    } catch (e) {
      showToast(e.message, 'error');
    }
    setAiLoading(false);
  };

  const simComment = async () => {
    try {
      const rl = await apiCall('/reels?limit=5');
      if (!rl.reels?.length) return showToast('No reels found. Seed data first.', 'error');
      const r = rl.reels[Math.floor(Math.random() * rl.reels.length)];
      await apiCall('/comments/simulate', {
        method: 'POST',
        body: JSON.stringify({ reelId: r._id }),
      });
      showToast('Comment + QUTTR auto-reply sent!');
      loadTab();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  };

  const toggleSel = (id) =>
    setSelAccs((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const activeAccounts = accounts.filter((a) => a.status === 'active');

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl backdrop-blur-xl border ${toast.type === 'error' ? 'bg-red-500/20 border-red-500/40 text-red-200' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'}`}>
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Share2 className="w-5 h-5 text-accent-500" />
            Social Media Hub
          </h1>
          <p className="text-xs text-white/40 mt-1">
            Manage 10 accounts · Auto-watermark · AI Titles · Auto-reply promos
          </p>
        </div>
        <button
          onClick={() => { loadAccounts(); loadTab(); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-white/60 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-x-auto no-scrollbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.k;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-accent-500 text-surface-100 shadow-md shadow-accent-500/20'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.l}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {loading && !overview && tab !== 'setup' && tab !== 'ai' ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ========== DASHBOARD TAB ========== */}
          {tab === 'dashboard' && overview && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { l: 'Accounts', v: overview.totalAccounts, c: 'text-purple-400', bg: 'bg-purple-500/10' },
                  { l: 'Reels', v: overview.totalReels, c: 'text-emerald-400', bg: 'bg-emerald-500/10', extra: `+${overview.todayReels} today` },
                  { l: 'Views', v: fmt(overview.totalViews), c: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { l: 'Likes', v: fmt(overview.totalLikes), c: 'text-orange-400', bg: 'bg-orange-500/10' },
                  { l: 'Engagement', v: `${overview.avgEngagement}%`, c: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                  { l: 'Auto Replies', v: fmt(overview.totalAutoReplies), c: 'text-pink-400', bg: 'bg-pink-500/10' },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center text-xs font-bold`}>●</div>
                      {s.extra && <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">{s.extra}</span>}
                    </div>
                    <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
                    <p className="text-2xs text-white/40 mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>

              {/* Today's Upload Tracker */}
              {todayStats && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent-500" />
                    <h3 className="text-sm font-bold">Today&apos;s Uploads: <span className="text-accent-500">{todayStats.totalToday}</span></h3>
                  </div>
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {todayStats.accounts?.map((a) => (
                      <div key={a.accountId} className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3 text-center">
                        <div
                          className="w-7 h-7 rounded-lg mx-auto flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: a.color }}
                        >
                          {a.username?.[0]?.toUpperCase()}
                        </div>
                        <p className="text-lg font-bold mt-2" style={{ color: a.color }}>{a.todayUploads}</p>
                        <p className="text-[10px] text-white/40 truncate">@{a.username}</p>
                        <div className="h-1 bg-white/[0.06] rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min((a.todayUploads / a.dailyLimit) * 100, 100)}%`, background: a.color }}
                          />
                        </div>
                        <p className="text-[9px] text-white/30 mt-1">{a.todayUploads}/{a.dailyLimit} limit</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Reels Grid */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2"><Play className="w-4 h-4 text-accent-500" /> Recent Reels</h3>
                  <button onClick={() => setTab('reels')} className="text-xs text-accent-500 hover:underline">View All →</button>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {reels.slice(0, 6).map((r) => (
                    <ReelCard key={r._id} reel={r} />
                  ))}
                  {reels.length === 0 && (
                    <p className="text-sm text-white/30 col-span-full text-center py-8">No reels published yet — go to Setup to seed sample data</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========== ACCOUNTS TAB ========== */}
          {tab === 'accounts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/40">{accounts.length}/10 slots used</p>
                <button
                  onClick={() => setShowAdd(true)}
                  disabled={accounts.length >= 10}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-500 text-surface-100 text-xs font-bold hover:opacity-90 disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Account
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {accounts.map((a) => (
                  <div key={a._id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 relative">
                    <span
                      className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${a.color}22`, color: a.color }}
                    >
                      {a.niche}
                    </span>
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                        style={{ background: a.color }}
                      >
                        {a.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{a.displayName}</p>
                        <p className="text-xs text-white/40">@{a.username}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {[
                        { l: 'Followers', v: fmt(a.followers) },
                        { l: 'Reels', v: a.totalReels },
                        { l: 'Today', v: a.todayUploads },
                      ].map((s, i) => (
                        <div key={i} className="text-center p-2 rounded-lg bg-white/[0.03]">
                          <p className="text-sm font-bold">{s.v}</p>
                          <p className="text-[9px] text-white/30 uppercase">{s.l}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                        <p className="text-sm font-bold">{fmt(a.totalViews)}</p>
                        <p className="text-[9px] text-white/30">Views</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                        <p className="text-sm font-bold">{fmt(a.totalLikes)}</p>
                        <p className="text-[9px] text-white/30">Likes</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                      <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={a.autoReplyEnabled}
                          onChange={() => toggleAutoReply(a._id, a.autoReplyEnabled)}
                          className="rounded border-white/20 bg-white/5"
                        />
                        Auto-Reply Promo
                      </label>
                      <button onClick={() => deleteAcc(a._id)} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Account Modal */}
              {showAdd && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
                  <div className="bg-surface-100 border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                      <h3 className="font-bold text-sm">Add Instagram Account</h3>
                      <button onClick={() => setShowAdd(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="p-5 space-y-3">
                      {[
                        { k: 'username', l: 'Username', ph: 'quttr_entertainment' },
                        { k: 'displayName', l: 'Display Name', ph: 'QUTTR Entertainment' },
                      ].map((f) => (
                        <div key={f.k}>
                          <label className="text-xs text-white/40 block mb-1">{f.l}</label>
                          <input
                            className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm focus:outline-none focus:border-accent-500"
                            value={newAcc[f.k]}
                            onChange={(e) => setNewAcc({ ...newAcc, [f.k]: e.target.value })}
                            placeholder={f.ph}
                          />
                        </div>
                      ))}
                      <div>
                        <label className="text-xs text-white/40 block mb-1">Niche</label>
                        <select
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm focus:outline-none focus:border-accent-500"
                          value={newAcc.niche}
                          onChange={(e) => setNewAcc({ ...newAcc, niche: e.target.value })}
                        >
                          {NICHES.map((n) => <option key={n} value={n}>{n.toUpperCase()}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-white/40 block mb-1">Followers</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm focus:outline-none focus:border-accent-500"
                          value={newAcc.followers}
                          onChange={(e) => setNewAcc({ ...newAcc, followers: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="px-5 py-4 border-t border-white/[0.06] flex gap-2 justify-end">
                      <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-xs text-white/50 hover:text-white">Cancel</button>
                      <button onClick={addAccount} className="px-4 py-2 rounded-xl bg-accent-500 text-surface-100 text-xs font-bold">Add Account</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== UPLOAD TAB ========== */}
          {tab === 'upload' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent-500" /> Branding & Title
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="p-3 rounded-xl bg-accent-500/10 border border-accent-500/20 text-xs text-accent-300">
                    ✨ Automatic: Adds <strong>QUTTR watermark</strong> and generates <strong>AI trending titles</strong> for maximum engagement.
                  </div>
                  <div>
                    <label className="text-xs text-white/40 block mb-1">Title (optional - AI will generate if empty)</label>
                    <input
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm focus:outline-none focus:border-accent-500"
                      value={uTitle}
                      onChange={(e) => setUTitle(e.target.value)}
                      placeholder="Leave empty for AI auto-generation..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 block mb-1">Caption (optional - AI will generate if empty)</label>
                    <textarea
                      className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm focus:outline-none focus:border-accent-500 min-h-[100px] resize-y"
                      value={uCaption}
                      onChange={(e) => setUCaption(e.target.value)}
                      placeholder="Leave empty for AI caption with QUTTR app promo..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                    <h3 className="text-sm font-bold">Select Target Accounts ({selAccs.length})</h3>
                    <button
                      onClick={() =>
                        setSelAccs(
                          selAccs.length === activeAccounts.length
                            ? []
                            : activeAccounts.map((a) => a._id)
                        )
                      }
                      className="text-xs text-accent-500 hover:underline"
                    >
                      {selAccs.length === activeAccounts.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-2">
                    {activeAccounts.map((a) => (
                      <div
                        key={a._id}
                        onClick={() => toggleSel(a._id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                          selAccs.includes(a._id)
                            ? 'border-accent-500 bg-accent-500/10'
                            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold"
                          style={{ background: a.color }}
                        >
                          {a.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">@{a.username}</p>
                          <p className="text-[10px] text-white/30">{a.niche}</p>
                        </div>
                        {selAccs.includes(a._id) && <Check className="w-3.5 h-3.5 text-accent-500" />}
                      </div>
                    ))}
                    {activeAccounts.length === 0 && (
                      <p className="text-xs text-white/30 col-span-2 text-center py-4">No active accounts found — seed accounts first</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={createReel}
                  disabled={selAccs.length === 0 || uploading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent-500 to-accent-700 text-surface-100 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  <Upload className="w-4 h-4" />
                  {uploading
                    ? 'Creating & Applying Watermark...'
                    : `Upload & Brand on ${selAccs.length} Account${selAccs.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}

          {/* ========== REELS TAB ========== */}
          {tab === 'reels' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {reels.length === 0 ? (
                <div className="col-span-full text-center py-16 text-white/30">
                  <Play className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No reels published</p>
                  <p className="text-xs mt-1">Go to Setup to seed sample reels</p>
                </div>
              ) : (
                reels.map((r) => <ReelCard key={r._id} reel={r} />)
              )}
            </div>
          )}

          {/* ========== ANALYTICS TAB ========== */}
          {tab === 'analytics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { l: 'Total Views', v: fmt(overview?.totalViews), c: 'text-blue-400' },
                  { l: 'Total Reach', v: fmt(overview?.totalReach), c: 'text-emerald-400' },
                  { l: 'Total Saves', v: fmt(overview?.totalSaves), c: 'text-orange-400' },
                  { l: 'Total Shares', v: fmt(overview?.totalShares), c: 'text-yellow-400' },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
                    <p className="text-xs text-white/40 mt-1">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <h3 className="text-sm font-bold">Account Performance Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] uppercase text-white/30 border-b border-white/[0.06]">
                        {['Account', 'Niche', 'Followers', 'Reels', 'Today', 'Views', 'Likes', 'Engagement', 'Auto Reply'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {accPerf.map((a) => (
                        <tr key={a._id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ background: a.color }}>
                                {a.username?.[0]?.toUpperCase()}
                              </div>
                              <span className="font-semibold text-xs">@{a.username}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${a.color}22`, color: a.color }}>{a.niche}</span></td>
                          <td className="px-4 py-3">{fmt(a.followers)}</td>
                          <td className="px-4 py-3 font-bold">{a.totalReels}</td>
                          <td className="px-4 py-3"><span className={`font-bold ${a.todayReels > 0 ? 'text-emerald-400' : 'text-white/30'}`}>{a.todayReels}</span></td>
                          <td className="px-4 py-3">{fmt(a.totalViews)}</td>
                          <td className="px-4 py-3">{fmt(a.totalLikes)}</td>
                          <td className="px-4 py-3" style={{ color: parseFloat(a.avgEngagement) > 5 ? '#34d399' : '#fbbf24' }}>{a.avgEngagement}%</td>
                          <td className="px-4 py-3">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${a.autoReplyEnabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                              {a.autoReplyEnabled ? 'ON' : 'OFF'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {accPerf.length === 0 && (
                        <tr><td colSpan={9} className="px-4 py-8 text-center text-white/30">No performance data — seed accounts & reels first</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========== COMMENTS TAB ========== */}
          {tab === 'comments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/40">{comments.length} comments monitored</p>
                <button onClick={simComment} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-500 text-surface-100 text-xs font-bold">
                  <MessageCircle className="w-3.5 h-3.5" /> Simulate Comment
                </button>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                {comments.length === 0 ? (
                  <div className="text-center py-12 text-white/30">
                    <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No comments recorded</p>
                    <p className="text-xs mt-1">Click Simulate Comment to test QUTTR auto-replies</p>
                  </div>
                ) : (
                  comments.map((c) => (
                    <div key={c._id} className="flex gap-3 py-3 border-b border-white/[0.04] last:border-0">
                      <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-xs flex-shrink-0">👤</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold">@{c.username}</span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full ml-auto" style={{ background: `${c.account?.color || '#6C5CE7'}22`, color: c.account?.color || '#6C5CE7' }}>
                            @{c.account?.username}
                          </span>
                        </div>
                        <p className="text-xs text-white/70">{c.text}</p>
                        {c.replied && (
                          <div className="mt-2 pl-3 border-l-2 border-accent-500 bg-accent-500/5 rounded-r-lg py-1.5 px-3">
                            <p className="text-[9px] font-bold text-accent-500 mb-0.5">🤖 QUTTR AUTO-REPLY</p>
                            <p className="text-xs text-accent-300/80">{c.replyText}</p>
                          </div>
                        )}
                        <p className="text-[9px] text-white/30 mt-1">
                          {timeAgo(c.createdAt)} {c.replied && <span className="text-emerald-400">✓ Replied</span>}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========== AI TOOLS TAB ========== */}
          {tab === 'ai' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <h3 className="text-sm font-bold flex items-center gap-2"><Zap className="w-4 h-4 text-accent-500" /> Title Generator</h3>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <label className="text-xs text-white/40 block mb-1">Niche</label>
                    <select
                      className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs focus:outline-none focus:border-accent-500"
                      value={aiNiche}
                      onChange={(e) => setAiNiche(e.target.value)}
                    >
                      {NICHES.map((n) => <option key={n} value={n}>{n.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={genTitles}
                    disabled={aiLoading}
                    className="w-full py-2.5 rounded-xl bg-accent-500 text-surface-100 text-xs font-bold disabled:opacity-40"
                  >
                    {aiLoading ? 'Generating...' : '🤖 Generate 8 Trending Titles'}
                  </button>
                  {aiTitles.map((t, i) => (
                    <div
                      key={i}
                      onClick={() => copyToClipboard(t)}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] cursor-pointer hover:border-accent-500/40 transition-colors text-xs"
                    >
                      <span className="text-accent-500 font-bold">{i + 1}.</span>
                      <span className="flex-1">{t}</span>
                      <Copy className="w-3 h-3 text-white/30" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <h3 className="text-sm font-bold flex items-center gap-2"><Send className="w-4 h-4 text-emerald-400" /> Caption Generator</h3>
                </div>
                <div className="p-5 space-y-3">
                  <button
                    onClick={genCaption}
                    disabled={aiLoading}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold disabled:opacity-40"
                  >
                    {aiLoading ? 'Generating...' : '✍️ Generate QUTTR Promo Caption'}
                  </button>
                  {aiCaption && (
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs leading-relaxed whitespace-pre-wrap">
                      {aiCaption}
                      <button onClick={() => copyToClipboard(aiCaption)} className="mt-3 flex items-center gap-1 text-accent-500 text-xs font-bold">
                        <Copy className="w-3 h-3" /> Copy Caption
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========== SETUP TAB ========== */}
          {tab === 'setup' && (
            <div className="max-w-md rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h3 className="text-sm font-bold flex items-center gap-2"><Database className="w-4 h-4 text-accent-500" /> Seed Demo Data</h3>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-xs text-white/40 mb-2">Initialize your hub with sample accounts, reels, and comments:</p>
                {[
                  { type: 'accounts', label: '1️⃣ Seed 10 Instagram Accounts', desc: 'Creates accounts across all 10 niches' },
                  { type: 'reels', label: '2️⃣ Seed Sample Reels', desc: 'Creates reels with AI titles & views' },
                  { type: 'comments', label: '3️⃣ Seed Sample Comments', desc: 'Creates comments with QUTTR auto-replies' },
                ].map((s) => (
                  <div key={s.type} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <div>
                      <p className="text-xs font-semibold">{s.label}</p>
                      <p className="text-[10px] text-white/30">{s.desc}</p>
                    </div>
                    <button
                      onClick={() => seed(s.type)}
                      className="px-3 py-1.5 rounded-lg bg-accent-500 text-surface-100 text-xs font-bold hover:opacity-90"
                    >
                      Seed
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* Helper Reel Card */
function ReelCard({ reel: r }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/10 transition-colors">
      <div
        className="h-24 flex items-center justify-center relative"
        style={{ background: `${r.account?.color || '#6C5CE7'}15` }}
      >
        <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
          <Play className="w-3.5 h-3.5 text-white" />
        </div>
        <span
          className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
          style={{ background: r.account?.color || '#6C5CE7' }}
        >
          @{r.account?.username}
        </span>
        <div className="absolute top-2 left-2 flex gap-1">
          {r.watermarkApplied && (
            <span className="text-[8px] font-black tracking-wide px-1.5 py-0.5 rounded bg-accent-500 text-white">QUTTR ✓</span>
          )}
          {r.aiGeneratedTitle && (
            <span className="text-[8px] font-black tracking-wide px-1.5 py-0.5 rounded bg-emerald-500 text-white">AI ✓</span>
          )}
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold leading-snug line-clamp-2 mb-1">{r.title}</p>
        <p className="text-[10px] text-white/30 mb-2">{timeAgo(r.publishedAt || r.createdAt)}</p>
        <div className="grid grid-cols-4 gap-1">
          {[
            { v: fmt(r.views), l: 'Views' },
            { v: fmt(r.likes), l: 'Likes' },
            { v: fmt(r.comments), l: 'Cmts' },
            { v: fmt(r.shares), l: 'Shares' },
          ].map((m, i) => (
            <div key={i} className="text-center p-1 rounded-lg bg-white/[0.03]">
              <p className="text-[10px] font-bold">{m.v}</p>
              <p className="text-[8px] text-white/30 uppercase">{m.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
