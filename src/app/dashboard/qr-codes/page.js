'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  QrCode, Plus, Search, TrendingUp, CheckCircle, AlertCircle, 
  Loader2, Package, Eye, Calendar, BarChart3, Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function QRCodesPage() {
  const [tab, setTab] = useState('batches'); // 'batches' or 'all'
  const [stats, setStats] = useState(null);
  const [batches, setBatches] = useState([]);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [filter, tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const promises = [
        fetch('/api/qr/stats').then(r => r.json()),
      ];
      
      if (tab === 'batches') {
        promises.push(fetch('/api/qr/batches').then(r => r.json()));
      } else {
        promises.push(fetch(`/api/qr/generate?status=${filter}&limit=100`).then(r => r.json()));
      }
      
      const [statsRes, dataRes] = await Promise.all(promises);
      
      if (statsRes.success) setStats(statsRes.stats);
      
      if (tab === 'batches' && dataRes.success) {
        setBatches(dataRes.batches || []);
      } else if (dataRes.success) {
        setCodes(dataRes.codes || []);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
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
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading">QR Codes</h1>
          <p className="text-caption mt-1">Manage all QR codes and view analytics</p>
        </div>
        <Link href="/dashboard/qr-codes/generate" className="btn-brand">
          <Plus className="w-4 h-4" />
          Generate New Batch
        </Link>
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
              <p className="stat-label">Inactive</p>
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

      {/* Tabs */}
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
                >
                  {s}
                </button>
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
        // Batches View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBatches.length === 0 ? (
            <div className="col-span-full card p-12 text-center">
              <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-body mb-2">No batches yet</p>
              <p className="text-caption mb-6">Generate your first batch to get started</p>
              <Link href="/dashboard/qr-codes/generate" className="btn-brand inline-flex">
                <Plus className="w-4 h-4" />
                Generate First Batch
              </Link>
            </div>
          ) : (
            filteredBatches.map(batch => (
              <Link
                key={batch.batch_id}
                href={`/dashboard/qr-codes/batch/${batch.batch_id}`}
                className="card-interactive p-6 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center">
                    <Package className="w-6 h-6 text-accent-500" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <Calendar className="w-3 h-3" />
                    {formatDate(batch.created_at)}
                  </div>
                </div>
                
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
                
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-accent-500" />
                    <span className="font-semibold text-accent-500">{batch.total_scans}</span>
                    <span className="text-white/40 text-xs">scans</span>
                  </div>
                  <div className="text-xs text-accent-500 group-hover:translate-x-1 transition-transform">
                    View →
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : (
        // All QR Codes View
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
                    <th className="text-left px-6 py-3 text-2xs font-semibold text-white/50 uppercase tracking-wider">Created</th>
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
                        <span className="text-xs text-white/50">{formatDate(code.created_at)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
