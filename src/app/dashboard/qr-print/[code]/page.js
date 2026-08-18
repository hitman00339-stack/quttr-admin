'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Download, Loader2, Printer, ExternalLink,
  MousePointer2, Sparkles, RefreshCw,
} from 'lucide-react';

export default function PrintQRPage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgLoading, setImgLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/analytics/qr/${params.code}`);
        const d = await res.json();
        if (d.success) setData(d);
        else toast.error(d.message || 'QR not found');
      } catch (e) {
        toast.error('Network error');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.code]);

  const posterUrl = `/api/qr/poster/${params.code}?v=${reloadKey}`;
  const downloadUrl = `/api/qr/poster/${params.code}?download=1&v=${reloadKey}`;

  const downloadPoster = () => {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `quttr-poster-${params.code}.png`;
    a.click();
    toast.success('Downloading poster...');
  };

  const printPoster = () => {
    window.open(posterUrl, '_blank');
    toast.success('Opening print view...');
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
      </div>
    );
  }
  if (!data?.qr) {
    return (
      <div className="text-center py-20">
        <p className="text-white/60">QR not found</p>
        <Link href="/dashboard/qr-explorer" className="text-[#FFD700] mt-3 inline-block">
          ← Back
        </Link>
      </div>
    );
  }

  const { qr, activation } = data;
  const shopName = activation?.shop_name || null;
  const town = activation?.location?.town || null;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <Link href={`/dashboard/qr-explorer/${qr.short_code}`} className="p-2 bg-white/[0.05] rounded-lg hover:bg-white/[0.1]">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Printer className="w-6 h-6 text-[#FFD700]" />
            Print Poster
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="font-mono text-xs text-[#FFD700] bg-[#FFD700]/10 px-2 py-0.5 rounded font-bold">
              {qr.short_code}
            </span>
            {qr.status === 'ACTIVE' ? (
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full font-bold">ACTIVE</span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 bg-red-500/15 text-red-400 rounded-full font-bold">INACTIVE</span>
            )}
            {shopName && (
              <span className="text-xs text-white/70">
                · {shopName}{town ? ` · ${town}` : ''}
              </span>
            )}
          </div>
        </div>
        <Link
          href="/dashboard/qr-print/calibrate"
          className="flex items-center gap-1 text-xs text-white/50 hover:text-[#FFD700] px-3 py-2 bg-white/[0.03] rounded-lg"
          title="Adjust QR position on poster"
        >
          <MousePointer2 className="w-3.5 h-3.5" />
          Calibrate
        </Link>
      </div>

      {/* Action buttons */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex items-center gap-2 flex-wrap">
        <button
          onClick={downloadPoster}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-bold rounded-lg hover:shadow-lg transition text-sm"
        >
          <Download className="w-4 h-4" />
          Download PNG
        </button>
        <button
          onClick={printPoster}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#E63946] to-[#B01824] text-white font-bold rounded-lg hover:shadow-lg transition text-sm"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
        <button
          onClick={() => { setImgLoading(true); setReloadKey((k) => k + 1); }}
          className="flex items-center gap-1 text-xs px-3 py-2 bg-white/[0.05] rounded-lg hover:bg-white/[0.1]"
          title="Regenerate poster"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate
        </button>
        <div className="ml-auto text-xs text-white/50 hidden sm:block">
          <Sparkles className="w-3 h-3 inline mr-1 text-[#FFD700]" />
          Poster is generated on-demand
        </div>
      </div>

      {/* Poster preview */}
      <div className="bg-neutral-900 rounded-xl p-4 flex justify-center">
        <div className="relative w-full" style={{ maxWidth: '600px' }}>
          {imgLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg z-10">
              <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
            </div>
          )}
          <img
            key={reloadKey}
            src={posterUrl}
            alt={`Poster for ${qr.short_code}`}
            className="w-full h-auto rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            onLoad={() => setImgLoading(false)}
            onError={() => {
              setImgLoading(false);
              toast.error('Failed to load poster. Check if poster-template.png exists.');
            }}
          />
        </div>
      </div>

      {/* Print tips */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-white/80">
        <p className="font-bold text-blue-300 mb-2">📌 Print tips:</p>
        <ul className="space-y-1 text-xs">
          <li>• Print at <b>100% scale</b> on <b>A4 paper</b></li>
          <li>• Use <b>200 GSM paper</b> for premium feel</li>
          <li>• Laminate for outdoor use (weatherproof)</li>
          <li>• Test scan the printed QR before mass printing</li>
          <li>• QR position not right? Click <Link href="/dashboard/qr-print/calibrate" className="text-[#FFD700] underline">Calibrate</Link></li>
        </ul>
      </div>
    </div>
  );
}
