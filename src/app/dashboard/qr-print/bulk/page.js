'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Download, Loader2, CheckSquare, Square,
  QrCode, Package, X, Search, RefreshCw,
} from 'lucide-react';

export default function BulkPrintPage() {
  const [qrs, setQrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [downloading, setDownloading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const load = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo(null);
    try {
      const params = new URLSearchParams({ limit: '500' });
      if (statusFilter === 'active') params.set('status', 'ACTIVE');
      if (statusFilter === 'inactive') params.set('status', 'INACTIVE');

      // Use dedicated list endpoint (no auth required)
      const url = `/api/qr/list-for-print?${params.toString()}`;
      console.log('[bulk] fetching:', url);

      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      const status = res.status;
      const contentType = res.headers.get('content-type') || '';

      // If response isn't JSON, capture what it is
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        setDebugInfo({
          url,
          status,
          contentType,
          bodyPreview: text.substring(0, 200),
        });
        throw new Error(`Server returned ${contentType || 'non-JSON'} (status ${status})`);
      }

      const d = await res.json();
      console.log('[bulk] response:', d);

      if (!res.ok) {
        throw new Error(d.error || d.message || `HTTP ${status}`);
      }

      if (!d.success) {
        throw new Error(d.error || d.message || 'API returned failure');
      }

      const codes = d.codes || [];
      setQrs(codes);

      if (codes.length === 0) {
        console.warn('[bulk] 0 QRs returned');
      } else {
        console.log(`[bulk] loaded ${codes.length} QRs`);
      }
    } catch (e) {
      console.error('[bulk] load failed:', e);
      setError(e.message);
      setQrs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredQrs = qrs.filter((q) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      q.short_code?.toLowerCase().includes(s) ||
      q.batch_name?.toLowerCase().includes(s) ||
      q.activation?.shop_name?.toLowerCase().includes(s)
    );
  });

  const toggleOne = (code) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === filteredQrs.length && filteredQrs.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredQrs.map((q) => q.short_code)));
    }
  };

  const selectByStatus = (status) => {
    const matching = filteredQrs
      .filter((q) => q.status === status)
      .map((q) => q.short_code);
    setSelected(new Set(matching));
    toast.success(`Selected ${matching.length} ${status.toLowerCase()} QRs`);
  };

  const downloadZip = async () => {
    if (selected.size === 0) {
      toast.error('Select at least 1 QR');
      return;
    }
    if (selected.size > 200) {
      toast.error('Max 200 QRs per batch');
      return;
    }

    setDownloading(true);
    toast.loading(`Generating ${selected.size} posters...`, { id: 'bulk' });

    try {
      const res = await fetch('/api/qr/poster-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes: Array.from(selected) }),
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        let msg = `HTTP ${res.status}`;
        if (contentType.includes('json')) {
          const err = await res.json().catch(() => ({}));
          msg = err.message || err.error || msg;
        } else {
          msg = await res.text().then((t) => t.substring(0, 100));
        }
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quttr-posters-${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${selected.size} posters!`, { id: 'bulk' });
      setSelected(new Set());
    } catch (e) {
      toast.error(e.message || 'Failed to generate ZIP', { id: 'bulk' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <Link href="/dashboard/qr-codes" className="p-2 bg-white/[0.05] rounded-lg hover:bg-white/[0.1]">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-[#FFD700]" />
            Bulk Print Posters
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Select QRs → download as ZIP · Each poster is print-ready
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2 bg-white/[0.05] rounded-lg hover:bg-white/[0.1]"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error banner with debug info */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
          <div>
            <p className="text-sm font-bold text-red-400 mb-1">⚠️ Failed to load QRs</p>
            <p className="text-xs text-white/70 font-mono break-all bg-black/30 p-2 rounded">
              {error}
            </p>
          </div>

          {debugInfo && (
            <div className="bg-black/40 p-3 rounded text-[10px] font-mono space-y-1">
              <p className="text-yellow-400">🔍 Debug info:</p>
              <p className="text-white/70">URL: {debugInfo.url}</p>
              <p className="text-white/70">Status: {debugInfo.status}</p>
              <p className="text-white/70">Content-Type: {debugInfo.contentType}</p>
              <p className="text-white/70 mt-2">Response preview:</p>
              <pre className="text-white/60 whitespace-pre-wrap break-all">{debugInfo.bodyPreview}</pre>
            </div>
          )}

          <div className="text-xs text-white/60 space-y-1">
            <p className="font-bold text-white/80">💡 Try these:</p>
            <p>1. Open API directly: <a href={`/api/qr/list-for-print?limit=10`} target="_blank" rel="noreferrer" className="text-[#FFD700] underline">/api/qr/list-for-print?limit=10</a></p>
            <p>2. Check console (F12 → Console tab) for details</p>
            <p>3. Make sure you deployed the new file <code className="text-[#FFD700]">src/app/api/qr/list-for-print/route.js</code></p>
          </div>
        </div>
      )}

      {/* Selection bar */}
      <div className="bg-gradient-to-r from-[#FFD700]/10 to-[#E63946]/10 border border-[#FFD700]/30 rounded-xl p-4 flex items-center gap-3 flex-wrap sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl font-black text-[#FFD700]">{selected.size}</span>
          <span className="text-sm text-white/70">selected of {filteredQrs.length}</span>
        </div>
        <button
          onClick={() => selectByStatus('INACTIVE')}
          disabled={filteredQrs.length === 0}
          className="text-xs px-3 py-2 bg-white/[0.05] rounded-lg hover:bg-white/[0.1] text-white/80 font-bold disabled:opacity-40"
        >
          Select Inactive
        </button>
        <button
          onClick={() => selectByStatus('ACTIVE')}
          disabled={filteredQrs.length === 0}
          className="text-xs px-3 py-2 bg-white/[0.05] rounded-lg hover:bg-white/[0.1] text-white/80 font-bold disabled:opacity-40"
        >
          Select Active
        </button>
        <button
          onClick={toggleAll}
          disabled={filteredQrs.length === 0}
          className="text-xs px-3 py-2 bg-white/[0.05] rounded-lg hover:bg-white/[0.1] text-white/80 font-bold disabled:opacity-40"
        >
          {selected.size === filteredQrs.length && filteredQrs.length > 0 ? 'Deselect All' : 'Select All'}
        </button>
        {selected.size > 0 && (
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs p-2 bg-white/[0.05] rounded-lg hover:bg-white/[0.1]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={downloadZip}
          disabled={downloading || selected.size === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-40 text-sm"
        >
          {downloading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
          ) : (
            <><Download className="w-4 h-4" /> Download ZIP ({selected.size})</>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by code, batch, shop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:border-[#FFD700]/40 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-sm text-white"
        >
          <option value="all">All QRs</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
          <p className="text-sm text-white/60">Loading your QRs...</p>
        </div>
      ) : filteredQrs.length === 0 ? (
        <div className="p-12 text-center bg-white/[0.02] border border-white/10 rounded-xl">
          <QrCode className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/60 font-bold mb-2">
            {qrs.length === 0 ? 'No QRs in database' : 'No QRs match filters'}
          </p>
          {qrs.length === 0 && !error && (
            <p className="text-xs text-white/40 mb-4">
              Generate QR codes first from the QR Codes page.
            </p>
          )}
          <Link
            href="/dashboard/qr-codes"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E63946] to-[#B01824] text-white text-sm font-bold rounded-lg"
          >
            <QrCode className="w-4 h-4" />
            Go to QR Codes
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredQrs.map((q) => {
            const isSelected = selected.has(q.short_code);
            return (
              <button
                key={q._id || q.short_code}
                onClick={() => toggleOne(q.short_code)}
                className={`relative p-3 rounded-xl border-2 transition text-left ${
                  isSelected
                    ? 'border-[#FFD700] bg-[#FFD700]/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className="absolute top-2 right-2">
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-[#FFD700]" />
                  ) : (
                    <Square className="w-5 h-5 text-white/30" />
                  )}
                </div>
                <div className="w-12 h-12 bg-white rounded p-1 mb-2 mx-auto">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`https://quttrr.com/q/${q.short_code}`)}&margin=0`}
                    alt=""
                    className="w-full h-full"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <p className="font-mono text-[10px] text-[#FFD700] text-center font-bold mb-1">
                  {q.short_code}
                </p>
                <div className="flex justify-center mb-1">
                  {q.status === 'ACTIVE' ? (
                    <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded font-bold">ACTIVE</span>
                  ) : (
                    <span className="text-[8px] px-1.5 py-0.5 bg-red-500/15 text-red-400 rounded font-bold">INACTIVE</span>
                  )}
                </div>
                {q.activation?.shop_name && (
                  <p className="text-[10px] text-white/70 truncate text-center">
                    {q.activation.shop_name}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-white/80">
        <p className="font-bold text-blue-300 mb-2">📦 About bulk export:</p>
        <ul className="text-xs space-y-1">
          <li>• Each poster is <b>~500 KB</b> — plan for ~50 MB per 100 posters</li>
          <li>• Max <b>200 posters</b> per ZIP</li>
          <li>• Works with both <b>active</b> and <b>inactive</b> QRs</li>
        </ul>
      </div>
    </div>
  );
}
