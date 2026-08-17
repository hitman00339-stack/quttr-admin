'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, QrCode, Printer, Loader2, 
  CheckCircle, AlertCircle, TrendingUp,
  Copy, ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ScissorQR from '@/components/qr/ScissorQR';

export default function BatchDetailPage() {
  const params = useParams();
  const batchId = params.batchId;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [view, setView] = useState('grid');

  useEffect(() => {
    if (batchId) loadBatch();
  }, [batchId]);

  const loadBatch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/qr/batches/${batchId}`);
      const result = await res.json();
      
      if (result.success) {
        setData(result);
      } else {
        toast.error('Batch not found');
      }
    } catch (error) {
      toast.error('Failed to load batch');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <Loader2 className="w-8 h-8 text-accent-500 animate-spin mx-auto" />
        <p className="text-caption mt-4">Loading batch...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card p-12 text-center">
        <AlertCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <p className="text-body mb-4">Batch not found</p>
        <Link href="/dashboard/qr-codes" className="btn-outline inline-flex">
          <ArrowLeft className="w-4 h-4" />
          Back to QR Codes
        </Link>
      </div>
    );
  }

  const { batch, codes } = data;
  const stats = {
    total: codes.length,
    active: codes.filter(c => c.status === 'ACTIVE').length,
    inactive: codes.filter(c => c.status === 'INACTIVE').length,
    totalScans: codes.reduce((sum, c) => sum + (c.total_scans || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/qr-codes" className="btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-heading">{batch.batch_name}</h1>
            <p className="text-caption mt-1">
              Batch created on {formatDate(batch.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-accent">
            <Printer className="w-4 h-4" />
            Print All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total QRs</p>
              <p className="stat-value">{stats.total}</p>
            </div>
            <QrCode className="w-8 h-8 text-brand-500 opacity-50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Active</p>
              <p className="stat-value text-success">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success opacity-50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Pending</p>
              <p className="stat-value text-warning">{stats.inactive}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-warning opacity-50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Scans</p>
              <p className="stat-value text-accent-500">{stats.totalScans}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-accent-500 opacity-50" />
          </div>
        </div>
      </div>

      {batch.notes && (
        <div className="card p-4 no-print">
          <p className="text-caption mb-1">Notes:</p>
          <p className="text-sm">{batch.notes}</p>
        </div>
      )}

      <div className="flex gap-2 no-print">
        <button
          onClick={() => setView('grid')}
          className={`btn ${view === 'grid' ? 'btn-accent' : 'btn-outline'}`}
        >
          Grid View
        </button>
        <button
          onClick={() => setView('list')}
          className={`btn ${view === 'list' ? 'btn-accent' : 'btn-outline'}`}
        >
          List View
        </button>
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print-grid">
          {codes.map((code) => (
            <div key={code._id} className="card p-6 flex flex-col items-center print-card">
              <ScissorQR value={code.full_url} size={260} />
              
              <div className="mt-4 text-center w-full">
                <p className="font-mono text-lg font-bold text-white mb-1">{code.short_code}</p>
                <p className="text-xs text-white/50 mb-3 break-all">{code.full_url}</p>
                
                <div className="flex items-center justify-center gap-2 mb-3">
                  {code.status === 'ACTIVE' && <span className="chip-success">Active</span>}
                  {code.status === 'INACTIVE' && <span className="chip-warning">Pending</span>}
                  {code.status === 'PAUSED' && <span className="chip-neutral">Paused</span>}
                  <span className="text-xs text-accent-500 font-semibold">
                    {code.total_scans || 0} scans
                  </span>
                </div>
                
                {code.activation && (
                  <div className="text-xs text-white/60 mb-3 p-2 bg-white/[0.03] rounded-lg">
                    <div className="font-medium text-white">{code.activation.shop_name}</div>
                    <div>{code.activation.location?.city}</div>
                  </div>
                )}
                
                <div className="flex gap-2 justify-center no-print">
                  <button
                    onClick={() => copyToClipboard(code.full_url)}
                    className="btn-icon"
                    title="Copy URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={code.full_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-icon"
                    title="Open URL"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/[0.02] border-b border-white/[0.06]">
                <tr>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-white/50 uppercase">Code</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-white/50 uppercase">URL</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-white/50 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-white/50 uppercase">Location</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-white/50 uppercase">Scans</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-white/50 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {codes.map(code => (
                  <tr key={code._id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold">{code.short_code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white/60 truncate max-w-xs block">{code.full_url}</span>
                    </td>
                    <td className="px-4 py-3">
                      {code.status === 'ACTIVE' && <span className="chip-success">Active</span>}
                      {code.status === 'INACTIVE' && <span className="chip-warning">Pending</span>}
                      {code.status === 'PAUSED' && <span className="chip-neutral">Paused</span>}
                    </td>
                    <td className="px-4 py-3">
                      {code.activation ? (
                        <span className="text-sm">{code.activation.shop_name || code.activation.location?.city}</span>
                      ) : (
                        <span className="text-xs text-white/40">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-accent-500">{code.total_scans || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => copyToClipboard(code.full_url)} className="btn-icon">
                          <Copy className="w-3 h-3" />
                        </button>
                        <a href={code.full_url} target="_blank" rel="noopener noreferrer" className="btn-icon">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-grid { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 20px !important; }
          .print-card { page-break-inside: avoid; background: white !important; border: 1px solid #000 !important; }
          .print-card p { color: black !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
