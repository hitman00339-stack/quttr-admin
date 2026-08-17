'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  QrCode, 
  Plus, 
  Search, 
  Filter, 
  Download,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function QRCodesPage() {
  const [stats, setStats] = useState(null);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, codesRes] = await Promise.all([
        fetch('/api/qr/stats').then(r => r.json()),
        fetch(`/api/qr/generate?status=${filter}&limit=50`).then(r => r.json()),
      ]);
      
      if (statsRes.success) setStats(statsRes.stats);
      if (codesRes.success) setCodes(codesRes.codes || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredCodes = codes.filter(c => 
    !search || c.short_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search QR code..."
              className="input pl-10"
            />
          </div>
          
          <div className="flex gap-2">
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
        </div>
      </div>

      {/* QR Codes List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-caption mt-4">Loading...</p>
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="p-12 text-center">
            <QrCode className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-body">No QR codes found</p>
            <Link href="/dashboard/qr-codes/generate" className="btn-brand mt-4 inline-flex">
              <Plus className="w-4 h-4" />
              Generate Your First Batch
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
                            {code.activation.location?.city}, {code.activation.location?.state}
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
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
