'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  QrCode, Plus, Search, TrendingUp, CheckCircle, AlertCircle, 
  Loader2, Package, Eye, Calendar, BarChart3, Layers, Camera,
  Download, Printer, Image as ImageIcon, Star, X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function QRCodesPage() {
  const [tab, setTab] = useState('batches');
  const [stats, setStats] = useState(null);
  const [batches, setBatches] = useState([]);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [downloadingBatch, setDownloadingBatch] = useState(null);
  const [pickerBatch, setPickerBatch] = useState(null); // { batch, statusFilter }

  useEffect(() => {
    loadData();
  }, [filter, tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const promises = [fetch('/api/qr/stats').then(r => r.json())];
      if (tab === 'batches') {
        promises.push(fetch('/api/qr/batches').then(r => r.json()));
      } else {
        promises.push(fetch(`/api/qr/generate?status=${filter}&limit=100`).then(r => r.json()));
      }
      const [statsRes, dataRes] = await Promise.all(promises);
      if (statsRes.success) setStats(statsRes.stats);
      if (tab === 'batches' && dataRes.success) setBatches(dataRes.batches || []);
      else if (dataRes.success) setCodes(dataRes.codes || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openPicker = (batch, statusFilter = null, e) => {
    e?.preventDefault();
    e?.stopPropagation();

    const count =
      statusFilter === 'ACTIVE' ? batch.active :
      statusFilter === 'INACTIVE' ? batch.inactive :
      batch.total;

    if (count === 0) {
      toast.error('No QRs to download');
      return;
    }
    if (count > 200) {
      toast.error(`Batch has ${count} QRs. Max 200 per download.`);
      return;
    }

    setPickerBatch({ batch, statusFilter, count });
  };

  const doDownload = async (batch, statusFilter, posterId, count) => {
    const key = `${batch.batch_id}-${statusFilter || 'all'}`;
    setDownloadingBatch(key);
    setPickerBatch(null);

    toast.loading(`Generating ${count} posters... (~${Math.ceil(count / 3)}s)`, { id: 'batch-dl' });

    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (posterId) params.set('poster', posterId);
      const url = `/api/qr/poster-batch/${batch.batch_id}?${params.toString()}`;

      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      const cd = res.headers.get('content-disposition') || '';
      const match = cd.match(/filename="?([^"]+)"?/);
      const cleanName = (batch.batch_name || batch.batch_id).replace(/[^a-z0-9]/gi, '-');
      a.download = match ? match[1] : `${cleanName}-posters.zip`;
      a.click();
      URL.revokeObjectURL(objUrl);

      toast.success(`Downloaded ${count} posters!`, { id: 'batch-dl' });
    } catch (err) {
      console.error('Batch download error:', err);
      toast.error(err.message || 'Download failed', { id: 'batch-dl' });
    } finally {
      setDownloadingBatch(null);
    }
  };

  const filteredCodes = codes.filter(c => 
    !search || c.short_code.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBatches = batches.filter(b => 
    !search || (b.batch_name && b.batch_name.toLowerCase().includes(search.toLowerCase()))
  );

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading">QR Codes</h1>
          <p className="text-caption mt-1">Generate, scan and manage QR codes</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <Link
          href="/dashboard/posters"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#FFD700] to-[#B08900] text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition text-sm"
        >
          <ImageIcon className="w-4 h-4" />
          Manage Posters
        </Link>
        <Link
          href="/dashboard/qr-codes/scan"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-accent-500/10 border border-accent-500/30 hover:bg-accent-500/20 text-accent-500 font-bold rounded-xl transition text-sm"
        >
          <Camera className="w-4 h-4" />
          Scan QR
        </Link>
        <Link
          href="/dashboard/qr-codes/generate"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#E63946] to-[#B01824] text-white font-bold rounded-xl hover:shadow-lg transition text-sm"
        >
          <Plus className="w-4 h-4" />
          Generate Batch
        </Link>
      </div>

      {/* Info tip */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-start gap-2">
        <ImageIcon className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-white/80">
          <span className="font-bold text-blue-300">Tip: </span>
          Upload posters at <Link href="/dashboard/posters" className="text-[#FFD700] underline">Manage Posters</Link> first.
          Then when downloading a batch, you'll pick which poster design to use.
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total QRs</p>
              <p className="stat-value">{stats?.total_qr || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-brand-500" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Active</p>
              <p className="stat-value text-success">{stats?.active_qr || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Pending</p>
              <p className="stat-value text-warning">{stats?.inactive_qr || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-warning" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Scans</p>
              <p className="stat-value text-accent-500">{stats?.total_scans || 0}</p>
              <p className="text-2xs text-white/40 mt-1">Today: {stats?.today_scans || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('batches')}
              className={`btn ${tab === 'batches' ? 'btn-accent' : 'btn-outline'}`}
            >
              <Layers className="w-4 h-4" />
              Batches
            </button>
            <button
              onClick={() => setTab('all')}
              className={`btn ${tab === 'all' ? 'btn-accent' : 'btn-outline'}`}
            >
              <QrCode className="w-4 h-4" />
              All QR Codes
            </button>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'batches' ? 'Search batches...' : 'Search QR codes...'}
              className="input pl-10"
            />
          </div>
          {tab === 'all' && (
            <div className="flex gap-2 flex-wrap">
              {['ALL', 'ACTIVE', 'INACTIVE', 'PAUSED'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`btn ${filter === s ? 'btn-accent' : 'btn-outline'}`}
                >{s}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card p-12 text-center">
          <Loader2 className="w-8 h-8 text-accent-500 animate-spin mx-auto" />
          <p className="text-caption mt-4">Loading...</p>
        </div>
      ) : tab === 'batches' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBatches.length === 0 ? (
            <div className="col-span-full card p-12 text-center">
              <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-body mb-2">No batches yet</p>
              <Link href="/dashboard/qr-codes/generate" className="btn-brand inline-flex mt-4">
                <Plus className="w-4 h-4" />
                Generate First Batch
              </Link>
            </div>
          ) : (
            filteredBatches.map(batch => {
              const isDownloadingAll = downloadingBatch === `${batch.batch_id}-all`;
              const isDownloadingActive = downloadingBatch === `${batch.batch_id}-ACTIVE`;
              const isDownloadingInactive = downloadingBatch === `${batch.batch_id}-INACTIVE`;
              const anyDownloading = downloadingBatch !== null;

              return (
                <div key={batch.batch_id} className="card p-6 group flex flex-col">
                  <Link
                    href={`/dashboard/qr-codes/batch/${batch.batch_id}`}
                    className="flex items-start justify-between mb-4 hover:opacity-80"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center">
                      <Package className="w-6 h-6 text-accent-500" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/40">
                      <Calendar className="w-3 h-3" />
                      {formatDate(batch.created_at)}
                    </div>
                  </Link>

                  <Link href={`/dashboard/qr-codes/batch/${batch.batch_id}`} className="block">
                    <h3 className="text-title mb-2 group-hover:text-accent-500 transition-colors">
                      {batch.batch_name}
                    </h3>
                    {batch.notes && (
                      <p className="text-xs text-white/50 mb-4 line-clamp-2">{batch.notes}</p>
                    )}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                        <div className="text-lg font-bold text-white">{batch.total}</div>
                        <div className="text-2xs text-white/40 uppercase">Total</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-success/10">
                        <div className="text-lg font-bold text-success">{batch.active}</div>
                        <div className="text-2xs text-white/40 uppercase">Active</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-warning/10">
                        <div className="text-lg font-bold text-warning">{batch.inactive}</div>
                        <div className="text-2xs text-white/40 uppercase">Pending</div>
                      </div>
                    </div>
                  </Link>

                  {/* Download section */}
                  <div className="pt-4 border-t border-white/[0.06] space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Printer className="w-3.5 h-3.5 text-[#FFD700]" />
                      <span className="text-2xs font-semibold text-white/60 uppercase tracking-wider">
                        Download Posters
                      </span>
                    </div>

                    <button
                      onClick={(e) => openPicker(batch, null, e)}
                      disabled={anyDownloading || batch.total === 0 || batch.total > 200}
                      title={
                        batch.total > 200
                          ? 'Max 200 per batch download'
                          : `Choose poster & download all ${batch.total}`
                      }
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                    >
                      {isDownloadingAll ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                      ) : (
                        <><Download className="w-4 h-4" /> Download ALL ({batch.total})</>
                      )}
                    </button>

                    {(batch.inactive > 0 || batch.active > 0) && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={(e) => openPicker(batch, 'INACTIVE', e)}
                          disabled={anyDownloading || batch.inactive === 0}
                          className="flex items-center justify-center gap-1 px-2 py-2 bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20 rounded-lg text-xs font-bold disabled:opacity-40"
                        >
                          {isDownloadingInactive ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                          Pending ({batch.inactive})
                        </button>
                        <button
                          onClick={(e) => openPicker(batch, 'ACTIVE', e)}
                          disabled={anyDownloading || batch.active === 0}
                          className="flex items-center justify-center gap-1 px-2 py-2 bg-success/10 text-success border border-success/30 hover:bg-success/20 rounded-lg text-xs font-bold disabled:opacity-40"
                        >
                          {isDownloadingActive ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                          Active ({batch.active})
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-accent-500" />
                      <span className="font-semibold text-accent-500">{batch.total_scans}</span>
                      <span className="text-white/40 text-xs">scans</span>
                    </div>
                    <Link
                      href={`/dashboard/qr-codes/batch/${batch.batch_id}`}
                      className="text-xs text-accent-500 hover:translate-x-1 transition-transform"
                    >View →</Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filteredCodes.length === 0 ? (
            <div className="p-12 text-center">
              <QrCode className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-body mb-2">No QR codes found</p>
              <Link href="/dashboard/qr-codes/generate" className="btn-brand mt-4 inline-flex">
                <Plus className="w-4 h-4" />
                Generate QR Codes
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                  <tr>
                    <th className="text-left px-6 py-3 text-2xs font-semibold text-white/50 uppercase tracking-wider">Code</th>
                    <th className="text-left px-6 py-3 text-2xs font-semibold text-white/50 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-2xs font-semibold text-white/50 uppercase tracking-wider">Location</th>
                    <th className="text-left px-6 py-3 text-2xs font-semibold text-white/50 uppercase tracking-wider">Scans</th>
                    <th className="text-left px-6 py-3 text-2xs font-semibold text-white/50 uppercase tracking-wider">Batch</th>
                    <th className="text-left px-6 py-3 text-2xs font-semibold text-white/50 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredCodes.map(code => (
                    <tr key={code._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-bold text-white">{code.short_code}</span>
                      </td>
                      <td className="px-6 py-4">
                        {code.status === 'ACTIVE' && <span className="chip-success">Active</span>}
                        {code.status === 'INACTIVE' && <span className="chip-warning">Inactive</span>}
                        {code.status === 'PAUSED' && <span className="chip-neutral">Paused</span>}
                      </td>
                      <td className="px-6 py-4">
                        {code.activation ? (
                          <div>
                            <div className="text-sm font-medium text-white">
                              {code.activation.shop_name || code.activation.location?.city || 'N/A'}
                            </div>
                            <div className="text-xs text-white/50">
                              {code.activation.location?.city}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-white/40">Not activated</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-accent-500">{code.total_scans || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-white/50">{code.batch_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/dashboard/qr-codes/${code.short_code}`}
                          className="text-sm text-accent-500 hover:text-accent-400"
                        >View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Poster picker modal */}
      {pickerBatch && (
        <PosterPickerModal
          batch={pickerBatch.batch}
          statusFilter={pickerBatch.statusFilter}
          count={pickerBatch.count}
          onClose={() => setPickerBatch(null)}
          onPick={(posterId) => doDownload(pickerBatch.batch, pickerBatch.statusFilter, posterId, pickerBatch.count)}
        />
      )}
    </div>
  );
}

// ============================================================
// POSTER PICKER MODAL
// ============================================================
function PosterPickerModal({ batch, statusFilter, count, onClose, onPick }) {
  const [posters, setPosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/posters');
        const d = await res.json();
        if (d.success) {
          setPosters(d.posters);
          // Auto-select default
          const def = d.posters.find(p => p.is_default);
          if (def) setSelectedId(def._id);
          else if (d.posters.length > 0) setSelectedId(d.posters[0]._id);
        }
      } catch (e) {
        toast.error('Failed to load posters');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const confirm = () => {
    if (!selectedId) {
      toast.error('Select a poster');
      return;
    }
    onPick(selectedId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between sticky top-0 bg-neutral-900 z-10">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#FFD700]" />
              Choose Poster Design
            </h2>
            <p className="text-xs text-white/60 mt-1">
              Batch: <b>{batch.batch_name}</b> · Downloading <b>{count}</b> posters
              {statusFilter && ` (${statusFilter.toLowerCase()} only)`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/[0.05] rounded-lg flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
          </div>
        ) : posters.length === 0 ? (
          <div className="p-12 text-center">
            <ImageIcon className="w-16 h-16 text-white/20 mx-auto mb-3" />
            <p className="text-white/60 font-bold mb-2">No posters uploaded</p>
            <p className="text-xs text-white/40 mb-4">
              Upload a poster template first
            </p>
            <Link
              href="/dashboard/posters"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E63946] to-[#B01824] text-white text-sm font-bold rounded-lg"
            >
              <ImageIcon className="w-4 h-4" />
              Go to Posters
            </Link>
          </div>
        ) : (
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {posters.map((p) => {
                const isSelected = selectedId === p._id;
                return (
                  <button
                    key={p._id}
                    onClick={() => setSelectedId(p._id)}
                    className={`relative rounded-xl overflow-hidden border-2 transition text-left ${
                      isSelected
                        ? 'border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.4)]'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="aspect-[3/4] bg-black overflow-hidden">
                      <img
                        src={`/api/posters/${p._id}/image`}
                        alt={p.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-2 bg-white/[0.03]">
                      <div className="flex items-center gap-1 mb-1">
                        {p.is_default && (
                          <Star className="w-3 h-3 fill-[#FFD700] text-[#FFD700] flex-shrink-0" />
                        )}
                        <p className="text-xs font-bold text-white truncate">{p.name}</p>
                      </div>
                      <p className="text-[10px] text-white/40">
                        {p.width}×{p.height}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#FFD700] flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-5 h-5 text-black" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        {!loading && posters.length > 0 && (
          <div className="p-5 border-t border-white/[0.06] flex gap-2 sticky bottom-0 bg-neutral-900">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg text-white/70 hover:bg-white/[0.08]"
            >
              Cancel
            </button>
            <button
              onClick={confirm}
              disabled={!selectedId}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Download ({count})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
