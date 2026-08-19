'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  QrCode, Plus, Search, TrendingUp, CheckCircle, AlertCircle, 
  Loader2, Package, Eye, Calendar, BarChart3, Layers, Camera,
  Download, Printer, Image as ImageIcon, Star, X, Clock, Info,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// SAFE chunk sizes for JPEG downloads
const CHUNK_OPTIONS = [
  { size: 5,  label: '5 per ZIP',  desc: '⚡ Safest · Most files',  color: 'green' },
  { size: 10, label: '10 per ZIP', desc: '🚀 Fast · Reliable',      color: 'blue' },
  { size: 25, label: '25 per ZIP', desc: '⭐ Recommended',           color: 'yellow' },
  { size: 50, label: '50 per ZIP', desc: '📦 Fewest files',         color: 'orange' },
];

export default function QRCodesPage() {
  const [tab, setTab] = useState('batches');
  const [stats, setStats] = useState(null);
  const [batches, setBatches] = useState([]);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [downloadingBatch, setDownloadingBatch] = useState(null);
  const [pickerBatch, setPickerBatch] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);

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
    if (count === 0) { toast.error('No QRs to download'); return; }
    setPickerBatch({ batch, statusFilter, count });
  };

  // Download single chunk with retry logic
  const downloadChunk = async (batch, statusFilter, posterId, chunkNum, chunkSize, retryCount = 0) => {
    const MAX_RETRIES = 3;
    
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (posterId) params.set('poster', posterId);
      params.set('chunk', String(chunkNum));
      params.set('size', String(chunkSize));

      // Add timeout controller (55 sec, slightly less than server's 60s)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000);

      const res = await fetch(`/api/qr/poster-batch/${batch.batch_id}?${params.toString()}`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      
      if (blob.size === 0) {
        throw new Error('Empty ZIP file returned');
      }

      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      const cd = res.headers.get('content-disposition') || '';
      const match = cd.match(/filename="?([^"]+)"?/);
      const cleanName = (batch.batch_name || batch.batch_id).replace(/[^a-z0-9]/gi, '-');
      a.download = match ? match[1] : `${cleanName}-part${chunkNum}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Wait a moment before revoking URL so download can start
      setTimeout(() => URL.revokeObjectURL(objUrl), 5000);

      return { success: true, chunk: chunkNum };
    } catch (err) {
      // Retry on network errors (Failed to fetch, timeout, etc.)
      if (retryCount < MAX_RETRIES) {
        console.log(`Retry ${retryCount + 1}/${MAX_RETRIES} for chunk ${chunkNum}`);
        toast.loading(`Retrying part ${chunkNum} (attempt ${retryCount + 2}/${MAX_RETRIES + 1})...`, { id: 'batch-dl' });
        
        // Wait longer between retries
        await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1)));
        return downloadChunk(batch, statusFilter, posterId, chunkNum, chunkSize, retryCount + 1);
      }
      
      throw err;
    }
  };

  const doDownload = async (batch, statusFilter, posterId, chunkSize, count) => {
    const key = `${batch.batch_id}-${statusFilter || 'all'}`;
    setDownloadingBatch(key);
    setPickerBatch(null);

    const totalChunks = Math.ceil(count / chunkSize);
    setDownloadProgress({ current: 0, total: totalChunks });

    try {
      if (totalChunks === 1) {
        toast.loading(`Generating ${count} posters...`, { id: 'batch-dl' });
        await downloadChunk(batch, statusFilter, posterId, 1, chunkSize);
        toast.success(`✅ Downloaded ${count} posters!`, { id: 'batch-dl' });
      } else {
        // Sequential download with LONGER delays between files
        let successChunks = 0;
        const failedChunks = [];

        for (let chunkNum = 1; chunkNum <= totalChunks; chunkNum++) {
          setDownloadProgress({ current: chunkNum, total: totalChunks });
          toast.loading(
            `Part ${chunkNum} of ${totalChunks}... (${successChunks} done)`,
            { id: 'batch-dl' }
          );
          
          try {
            await downloadChunk(batch, statusFilter, posterId, chunkNum, chunkSize);
            successChunks++;
            
            // LONG delay between downloads (5 seconds)
            // Browsers block rapid sequential downloads for security
            if (chunkNum < totalChunks) {
              toast.loading(
                `Downloaded ${successChunks}/${totalChunks}. Waiting 5s before next...`,
                { id: 'batch-dl' }
              );
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          } catch (err) {
            console.error(`Chunk ${chunkNum} failed:`, err);
            failedChunks.push(chunkNum);
            
            // Continue with next chunk instead of stopping
            toast.error(`Part ${chunkNum} failed. Continuing...`, { duration: 3000 });
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }

        if (failedChunks.length === 0) {
          toast.success(`✅ All ${totalChunks} parts downloaded (${count} posters)!`, { id: 'batch-dl', duration: 5000 });
        } else {
          toast.error(
            `Downloaded ${successChunks}/${totalChunks} parts. Failed: ${failedChunks.join(', ')}. Try again for failed parts.`,
            { id: 'batch-dl', duration: 10000 }
          );
        }
      }
    } catch (err) {
      console.error('Download error:', err);
      toast.error(err.message || 'Download failed', { id: 'batch-dl' });
    } finally {
      setDownloadingBatch(null);
      setDownloadProgress(null);
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
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading">QR Codes</h1>
          <p className="text-caption mt-1">Generate, scan and manage QR codes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Link href="/dashboard/posters" className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#FFD700] to-[#B08900] text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition text-sm">
          <ImageIcon className="w-4 h-4" />
          Manage Posters
        </Link>
        <Link href="/dashboard/qr-codes/scan" className="flex items-center justify-center gap-2 px-4 py-3 bg-accent-500/10 border border-accent-500/30 hover:bg-accent-500/20 text-accent-500 font-bold rounded-xl transition text-sm">
          <Camera className="w-4 h-4" />
          Scan QR
        </Link>
        <Link href="/dashboard/qr-codes/generate" className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#E63946] to-[#B01824] text-white font-bold rounded-xl hover:shadow-lg transition text-sm">
          <Plus className="w-4 h-4" />
          Generate Batch
        </Link>
      </div>

      {/* Download progress banner */}
      {downloadProgress && downloadProgress.total > 1 && (
        <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/40 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Downloading Part {downloadProgress.current} of {downloadProgress.total}
            </p>
            <span className="text-xs text-white/60">
              {Math.round((downloadProgress.current / downloadProgress.total) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all"
              style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-white/60 mt-2">
            ⏳ Waits 5 seconds between downloads to prevent browser blocking
          </p>
        </div>
      )}

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-white/80">
          <span className="font-bold text-blue-300">Tip: </span>
          Multi-part downloads have 5-second delays between files. Browser may ask to "Allow multiple downloads" — click Allow.
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div><p className="stat-label">Total QRs</p><p className="stat-value">{stats?.total_qr || 0}</p></div>
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-brand-500" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div><p className="stat-label">Active</p><p className="stat-value text-success">{stats?.active_qr || 0}</p></div>
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div><p className="stat-label">Pending</p><p className="stat-value text-warning">{stats?.inactive_qr || 0}</p></div>
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

      {/* Tabs */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex gap-2">
            <button onClick={() => setTab('batches')} className={`btn ${tab === 'batches' ? 'btn-accent' : 'btn-outline'}`}>
              <Layers className="w-4 h-4" /> Batches
            </button>
            <button onClick={() => setTab('all')} className={`btn ${tab === 'all' ? 'btn-accent' : 'btn-outline'}`}>
              <QrCode className="w-4 h-4" /> All QR Codes
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
                <button key={s} onClick={() => setFilter(s)} className={`btn ${filter === s ? 'btn-accent' : 'btn-outline'}`}>{s}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center"><Loader2 className="w-8 h-8 text-accent-500 animate-spin mx-auto" /></div>
      ) : tab === 'batches' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBatches.length === 0 ? (
            <div className="col-span-full card p-12 text-center">
              <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-body mb-2">No batches yet</p>
              <Link href="/dashboard/qr-codes/generate" className="btn-brand inline-flex mt-4">
                <Plus className="w-4 h-4" /> Generate First Batch
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
                  <Link href={`/dashboard/qr-codes/batch/${batch.batch_id}`} className="flex items-start justify-between mb-4 hover:opacity-80">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center">
                      <Package className="w-6 h-6 text-accent-500" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/40">
                      <Calendar className="w-3 h-3" />{formatDate(batch.created_at)}
                    </div>
                  </Link>

                  <Link href={`/dashboard/qr-codes/batch/${batch.batch_id}`} className="block">
                    <h3 className="text-title mb-2 group-hover:text-accent-500 transition-colors">{batch.batch_name}</h3>
                    {batch.notes && <p className="text-xs text-white/50 mb-4 line-clamp-2">{batch.notes}</p>}
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

                  <div className="pt-4 border-t border-white/[0.06] space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Printer className="w-3.5 h-3.5 text-[#FFD700]" />
                      <span className="text-2xs font-semibold text-white/60 uppercase tracking-wider">Download Posters</span>
                    </div>

                    <button
                      onClick={(e) => openPicker(batch, null, e)}
                      disabled={anyDownloading || batch.total === 0}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                    >
                      {isDownloadingAll ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Downloading...</>
                      ) : (
                        <><Download className="w-4 h-4" /> Download ALL ({batch.total})</>
                      )}
                    </button>

                    {(batch.inactive > 0 || batch.active > 0) && (
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={(e) => openPicker(batch, 'INACTIVE', e)} disabled={anyDownloading || batch.inactive === 0}
                          className="flex items-center justify-center gap-1 px-2 py-2 bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20 rounded-lg text-xs font-bold disabled:opacity-40">
                          {isDownloadingInactive ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                          Pending ({batch.inactive})
                        </button>
                        <button onClick={(e) => openPicker(batch, 'ACTIVE', e)} disabled={anyDownloading || batch.active === 0}
                          className="flex items-center justify-center gap-1 px-2 py-2 bg-success/10 text-success border border-success/30 hover:bg-success/20 rounded-lg text-xs font-bold disabled:opacity-40">
                          {isDownloadingActive ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
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
                    <Link href={`/dashboard/qr-codes/batch/${batch.batch_id}`} className="text-xs text-accent-500 hover:translate-x-1 transition-transform">View →</Link>
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
                      <td className="px-6 py-4"><span className="font-mono text-sm font-bold text-white">{code.short_code}</span></td>
                      <td className="px-6 py-4">
                        {code.status === 'ACTIVE' && <span className="chip-success">Active</span>}
                        {code.status === 'INACTIVE' && <span className="chip-warning">Inactive</span>}
                      </td>
                      <td className="px-6 py-4">
                        {code.activation ? (
                          <div>
                            <div className="text-sm font-medium text-white">{code.activation.shop_name || 'N/A'}</div>
                            <div className="text-xs text-white/50">{code.activation.location?.city}</div>
                          </div>
                        ) : <span className="text-xs text-white/40">Not activated</span>}
                      </td>
                      <td className="px-6 py-4"><span className="text-sm font-semibold text-accent-500">{code.total_scans || 0}</span></td>
                      <td className="px-6 py-4"><span className="text-xs text-white/50">{code.batch_name}</span></td>
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/qr-codes/${code.short_code}`} className="text-sm text-accent-500 hover:text-accent-400">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {pickerBatch && (
        <DownloadPickerModal
          batch={pickerBatch.batch}
          statusFilter={pickerBatch.statusFilter}
          count={pickerBatch.count}
          onClose={() => setPickerBatch(null)}
          onConfirm={(posterId, chunkSize) => doDownload(pickerBatch.batch, pickerBatch.statusFilter, posterId, chunkSize, pickerBatch.count)}
        />
      )}
    </div>
  );
}

function DownloadPickerModal({ batch, statusFilter, count, onClose, onConfirm }) {
  const [posters, setPosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosterId, setSelectedPosterId] = useState(null);
  const [selectedChunkSize, setSelectedChunkSize] = useState(10);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/posters');
        const d = await res.json();
        if (d.success) {
          setPosters(d.posters);
          const def = d.posters.find(p => p.is_default);
          if (def) setSelectedPosterId(def._id);
          else if (d.posters.length > 0) setSelectedPosterId(d.posters[0]._id);
        }
      } catch (e) {
        toast.error('Failed to load posters');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Auto-suggest SAFER chunk sizes
  useEffect(() => {
    if (count <= 5) setSelectedChunkSize(5);
    else if (count <= 10) setSelectedChunkSize(10);
    else if (count <= 50) setSelectedChunkSize(10);  // Safer default
    else setSelectedChunkSize(25);
  }, [count]);

  const totalChunks = Math.ceil(count / selectedChunkSize);
  const generationTime = totalChunks * (selectedChunkSize * 0.8); // ~800ms per poster
  const delayTime = (totalChunks - 1) * 5; // 5s delay between chunks
  const totalTime = generationTime + delayTime;

  const confirm = () => {
    if (!selectedPosterId) { toast.error('Select a poster'); return; }
    if (!selectedChunkSize) { toast.error('Select chunk size'); return; }
    onConfirm(selectedPosterId, selectedChunkSize);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between sticky top-0 bg-neutral-900 z-10">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Download className="w-5 h-5 text-[#FFD700]" />
              Download Posters
            </h2>
            <p className="text-xs text-white/60 mt-1">
              Batch: <b>{batch.batch_name}</b> · <b>{count}</b> posters
              {statusFilter && ` (${statusFilter.toLowerCase()} only)`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/[0.05] rounded-lg flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
          </div>
        ) : posters.length === 0 ? (
          <div className="p-12 text-center">
            <ImageIcon className="w-16 h-16 text-white/20 mx-auto mb-3" />
            <p className="text-white/60 font-bold mb-2">No posters uploaded</p>
            <Link href="/dashboard/posters" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E63946] to-[#B01824] text-white text-sm font-bold rounded-lg mt-2">
              <ImageIcon className="w-4 h-4" /> Go to Posters
            </Link>
          </div>
        ) : (
          <div className="p-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-[#FFD700] text-black font-black text-xs flex items-center justify-center">1</span>
                <h3 className="text-sm font-bold text-white">Choose Poster Design</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {posters.map((p) => {
                  const isSelected = selectedPosterId === p._id;
                  return (
                    <button key={p._id} onClick={() => setSelectedPosterId(p._id)}
                      className={`relative rounded-xl overflow-hidden border-2 transition text-left ${
                        isSelected ? 'border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="aspect-[3/4] bg-black overflow-hidden">
                        <img src={`/api/posters/${p._id}/image`} alt={p.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="p-2 bg-white/[0.03]">
                        <div className="flex items-center gap-1 mb-1">
                          {p.is_default && <Star className="w-3 h-3 fill-[#FFD700] text-[#FFD700] flex-shrink-0" />}
                          <p className="text-xs font-bold text-white truncate">{p.name}</p>
                        </div>
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

            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-[#FFD700] text-black font-black text-xs flex items-center justify-center">2</span>
                <h3 className="text-sm font-bold text-white">Choose Chunk Size</h3>
              </div>
              <p className="text-xs text-white/50 mb-3">
                Smaller = safer (fewer failures). Recommended: <b className="text-[#FFD700]">10 per ZIP</b>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CHUNK_OPTIONS.map((opt) => {
                  const isSelected = selectedChunkSize === opt.size;
                  const chunksNeeded = Math.ceil(count / opt.size);
                  return (
                    <button
                      key={opt.size}
                      onClick={() => setSelectedChunkSize(opt.size)}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        isSelected
                          ? 'border-[#FFD700] bg-[#FFD700]/10 shadow-[0_0_15px_rgba(255,215,0,0.3)]'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-lg font-black text-white">{opt.size}</span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-[#FFD700]" />}
                      </div>
                      <p className="text-[10px] font-bold text-white/80">{opt.label}</p>
                      <p className="text-[9px] text-white/50 mt-1">{opt.desc}</p>
                      {count > opt.size && (
                        <p className="text-[9px] text-[#FFD700] mt-1 font-bold">
                          = {chunksNeeded} ZIP files
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#FFD700]/10 to-[#E63946]/10 border border-[#FFD700]/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-[#FFD700]" />
                <p className="text-sm font-bold text-[#FFD700]">Download Summary</p>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/60">Total posters:</span>
                  <span className="font-bold text-white">{count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">ZIP files:</span>
                  <span className="font-bold text-emerald-400">{totalChunks} file{totalChunks > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Total time:
                  </span>
                  <span className="font-bold text-white">
                    ~{Math.ceil(totalTime)}s 
                    {totalChunks > 1 && ` (${Math.ceil(generationTime)}s gen + ${delayTime}s delays)`}
                  </span>
                </div>
              </div>

              {totalChunks > 1 && (
                <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <p className="text-[11px] text-orange-300 leading-relaxed">
                    ⚠️ <b>Multi-part download:</b> Browser will download <b>{totalChunks} ZIP files</b> with <b>5-second delays</b> between each.
                    Auto-retries on failures.
                  </p>
                  <p className="text-[11px] text-orange-300/80 mt-2">
                    💡 <b>Tip:</b> If browser blocks multiple downloads, click "Allow" in the popup.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && posters.length > 0 && (
          <div className="p-5 border-t border-white/[0.06] flex gap-2 sticky bottom-0 bg-neutral-900">
            <button onClick={onClose} className="flex-1 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg text-white/70 hover:bg-white/[0.08]">
              Cancel
            </button>
            <button onClick={confirm} disabled={!selectedPosterId}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
              <Download className="w-4 h-4" />
              {totalChunks === 1 ? `Download ZIP (${count})` : `Download ${totalChunks} ZIPs`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
