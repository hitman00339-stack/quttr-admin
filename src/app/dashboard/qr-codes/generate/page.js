'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, QrCode, Loader2, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ScissorQR from '@/components/qr/ScissorQR';

export default function GenerateQRPage() {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [formData, setFormData] = useState({
    quantity: 10,
    batch_name: '',
    notes: '',
  });

  const handleGenerate = async () => {
    if (formData.quantity < 1 || formData.quantity > 500) {
      toast.error('Quantity must be between 1 and 500');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setGenerated(data);
        toast.success(`Generated ${data.count} QR codes!`);
      } else {
        toast.error(data.message || 'Failed to generate');
      }
    } catch (error) {
      toast.error('Failed to generate QR codes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/qr-codes" className="btn-icon">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-heading">Generate QR Codes</h1>
          <p className="text-caption mt-1">Create scissor-themed QR codes in bulk</p>
        </div>
      </div>

      {!generated ? (
        <div className="max-w-2xl">
          <div className="card p-8">
            <div className="space-y-6">
              <div>
                <label className="label">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                  className="input"
                />
                <p className="label-hint">Generate 1 to 500 QR codes at once</p>
              </div>

              <div>
                <label className="label">Batch Name (Optional)</label>
                <input
                  type="text"
                  value={formData.batch_name}
                  onChange={(e) => setFormData({...formData, batch_name: e.target.value})}
                  className="input"
                  placeholder="e.g., Delhi Barbers - January 2025"
                />
              </div>

              <div>
                <label className="label">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="input min-h-[100px] resize-none"
                  placeholder="Any notes about this batch..."
                />
              </div>

              <div className="glass p-4 rounded-xl">
                <p className="text-sm font-medium text-white mb-2">📌 What happens next?</p>
                <ul className="text-xs text-white/60 space-y-1">
                  <li>• {formData.quantity} unique scissor-themed QR codes generated</li>
                  <li>• You can print and distribute them</li>
                  <li>• Field team activates them at shops</li>
                </ul>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-brand w-full py-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    Generate {formData.quantity} QR Codes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card p-6 no-print">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-title">✅ Generated {generated.count} QR Codes</h3>
                <p className="text-caption mt-1">Batch: {generated.batch_name}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="btn-accent">
                  <Printer className="w-4 h-4" />
                  Print All
                </button>
                <Link href="/dashboard/qr-codes" className="btn-outline">Done</Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print-grid">
            {generated.codes.map((code, idx) => (
              <div key={idx} className="card p-6 flex flex-col items-center print-card">
                <ScissorQR value={code.full_url} size={280} />
                <div className="mt-4 text-center">
                  <p className="font-mono text-lg font-bold text-white">{code.short_code}</p>
                  <p className="text-xs text-white/50 mt-1 break-all">{code.full_url}</p>
                </div>
              </div>
            ))}
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
