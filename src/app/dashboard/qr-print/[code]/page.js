'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Printer, Loader2, Palette, Layout, Download,
  Eye, Sparkles, Zap, Star, FileText,
} from 'lucide-react';

const THEMES = [
  { id: 'impact', name: '🔥 BOLD IMPACT', desc: 'Loud red + gold. Max attention. Best for streets/malls.' },
  { id: 'premium', name: '✨ PREMIUM BLACK', desc: 'Dark luxury. Best for salons, upscale shops.' },
  { id: 'clean', name: '📄 CLEAN WHITE', desc: 'Ink-saving. Perfect for A4 printers, saves cost.' },
];

export default function PrintQRPage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('impact');
  const printRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/analytics/qr/${params.code}`);
        const d = await res.json();
        if (d.success) setData(d);
        else toast.error('QR not found');
      } catch (e) {
        toast.error('Network error');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.code]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast.success('Use "Print" → "Save as PDF" from print dialog');
    setTimeout(() => window.print(), 500);
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
  const town = activation?.location?.town || activation?.location?.city || null;
  const state = activation?.location?.state || null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Control Panel (hidden in print) */}
      <div className="no-print mb-6 space-y-4">
        <div className="flex items-start gap-3">
          <Link href={`/dashboard/qr-explorer/${qr.short_code}`} className="p-2 bg-white/[0.05] rounded-lg hover:bg-white/[0.1]">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Printer className="w-6 h-6 text-[#FFD700]" />
              Print QR Sticker
            </h1>
            <p className="text-sm text-white/60 mt-1">
              Ultra-professional A4 poster · Code: <span className="font-mono text-[#FFD700]">{qr.short_code}</span>
            </p>
          </div>
        </div>

        {/* Theme picker */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-[#FFD700]" />
            <h2 className="font-bold text-sm">Choose Design Theme</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-4 rounded-xl border-2 text-left transition ${
                  theme === t.id
                    ? 'border-[#FFD700] bg-[#FFD700]/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <p className="font-black text-sm mb-1">{t.name}</p>
                <p className="text-[10px] text-white/60">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-wrap items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#E63946] to-[#B01824] text-white font-bold rounded-lg hover:shadow-lg transition text-sm"
          >
            <Printer className="w-4 h-4" />
            Print Now (A4)
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.05] border border-white/10 text-white font-bold rounded-lg hover:bg-white/[0.1] transition text-sm"
          >
            <Download className="w-4 h-4" />
            Save as PDF
          </button>
          <div className="ml-auto flex items-center gap-2 text-xs text-white/50">
            <Eye className="w-3.5 h-3.5" />
            Preview shows exactly what will print
          </div>
        </div>

        {/* Info box */}
        {!activation && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-yellow-400">This QR is not activated yet</p>
              <p className="text-xs text-white/60 mt-1">
                Poster will show generic messaging. Activate the QR first (add shop name + town) for personalized posters.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* THE POSTER (this is what prints) */}
      <div ref={printRef} className="print-container">
        {theme === 'impact' && <ImpactPoster qr={qr} shopName={shopName} town={town} state={state} />}
        {theme === 'premium' && <PremiumPoster qr={qr} shopName={shopName} town={town} state={state} />}
        {theme === 'clean' && <CleanPoster qr={qr} shopName={shopName} town={town} state={state} />}
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .no-print,
          .no-print * {
            display: none !important;
          }
          .print-container {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
            page-break-after: always;
          }
          .a4-poster {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: always;
          }
          nav, aside, header {
            display: none !important;
          }
        }

        /* Screen preview — show A4 aspect ratio */
        @media screen {
          .print-container {
            display: flex;
            justify-content: center;
            padding: 20px;
            background: #1a1a1a;
            border-radius: 16px;
          }
          .a4-poster {
            width: 100%;
            max-width: 595px; /* A4 width at 72dpi preview */
            aspect-ratio: 210 / 297;
            box-shadow: 0 20px 60px rgba(0,0,0,0.6);
            overflow: hidden;
          }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   LAYOUT 1: BOLD IMPACT — Red + Gold + Black
   Maximum eye-catching for streets, malls, public places
   ============================================================ */
function ImpactPoster({ qr, shopName, town, state }) {
  return (
    <div className="a4-poster bg-black text-white relative overflow-hidden" style={{ fontFamily: "'Inter', 'Noto Sans Devanagari', sans-serif" }}>
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#E63946]/40 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#FFD700]/25 rounded-full blur-[130px]" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-[#E63946]/25 rounded-full blur-[130px]" />
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-14 h-14 border-t-4 border-l-4 border-[#FFD700]" />
      <div className="absolute top-4 right-4 w-14 h-14 border-t-4 border-r-4 border-[#FFD700]" />
      <div className="absolute bottom-4 left-4 w-14 h-14 border-b-4 border-l-4 border-[#FFD700]" />
      <div className="absolute bottom-4 right-4 w-14 h-14 border-b-4 border-r-4 border-[#FFD700]" />

      <div className="relative z-10 h-full flex flex-col items-center px-8 py-10">
        {/* HEADER: Brand */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-3 mb-2">
            <span className="text-4xl">✂️</span>
            <h1 className="text-6xl font-black tracking-tight" style={{ background: 'linear-gradient(135deg, #FFD700 0%, #E63946 50%, #FFD700 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              QUTTR
            </h1>
            <span className="text-4xl">✂️</span>
          </div>
          <p className="text-[11px] tracking-[0.5em] text-[#FFD700] font-bold uppercase">
            India's #1 Barber Booking App
          </p>
        </div>

        {/* Divider */}
        <div className="w-full max-w-md h-0.5 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4" />

        {/* Shop info (if activated) OR generic hero */}
        {shopName && (
          <div className="text-center mb-3 bg-[#FFD700]/10 border-2 border-[#FFD700]/40 rounded-2xl px-6 py-3">
            <p className="text-[10px] text-[#FFD700] font-bold tracking-widest uppercase mb-1">
              📍 अब उपलब्ध यहाँ · Now Available At
            </p>
            <h2 className="text-3xl font-black text-white leading-tight">{shopName}</h2>
            {town && <p className="text-sm text-[#FFD700] font-bold mt-1">{town}{state ? `, ${state}` : ''}</p>}
          </div>
        )}

        {/* MAIN HOOK - Bilingual */}
        <div className="text-center my-4">
          <h2 className="text-5xl font-black leading-none mb-2" style={{ color: '#FFD700', textShadow: '0 4px 20px rgba(230,57,70,0.5)' }}>
            इंतज़ार खत्म!
          </h2>
          <h3 className="text-3xl font-black text-white leading-none">
            NO MORE WAITING
          </h3>
        </div>

        {/* QR CODE — MASSIVE */}
        <div className="relative my-3">
          <div className="absolute -inset-4 bg-gradient-to-r from-[#FFD700] via-[#E63946] to-[#FFD700] rounded-3xl blur-md opacity-70" />
          <div className="relative bg-white p-5 rounded-2xl shadow-[0_0_60px_rgba(255,215,0,0.5)]">
            <QRImage code={qr.short_code} size={280} />
          </div>
          {/* SCAN badge */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#E63946] to-[#B01824] text-white font-black px-6 py-2 rounded-full text-lg shadow-lg border-2 border-[#FFD700]">
            📱 SCAN ME
          </div>
        </div>

        {/* CTA — Bilingual force */}
        <div className="text-center mt-6 mb-3">
          <p className="text-2xl font-black text-white leading-none">
            <span className="text-[#FFD700]">👆 अभी SCAN करें</span>
          </p>
          <p className="text-lg text-white/80 font-bold mt-1">
            Scan Now · Book in 15 Seconds · 100% FREE
          </p>
        </div>

        {/* BENEFITS — 3 columns */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-md mt-2">
          <BenefitBox icon="⚡" hi="15 सेकंड" en="Book Fast" />
          <BenefitBox icon="🎯" hi="कोई लाइन नहीं" en="No Queue" />
          <BenefitBox icon="🎁" hi="100% FREE" en="No Charge" />
        </div>

        {/* Bottom — URL + Code */}
        <div className="mt-auto w-full text-center pt-3">
          <div className="inline-block bg-white/10 backdrop-blur-md border border-[#FFD700]/40 rounded-full px-5 py-1.5">
            <p className="text-xs font-mono text-white">
              <span className="text-[#FFD700] font-black">quttrr.com/q/</span>
              <span className="font-black">{qr.short_code}</span>
            </p>
          </div>
          <p className="text-[9px] text-white/50 mt-2 tracking-widest uppercase">
            Made in India 🇮🇳 · Available on Google Play
          </p>
        </div>
      </div>
    </div>
  );
}

function BenefitBox({ icon, hi, en }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-[#FFD700]/30 rounded-xl p-2 text-center">
      <div className="text-2xl mb-0.5">{icon}</div>
      <p className="text-[11px] font-black text-[#FFD700] leading-tight">{hi}</p>
      <p className="text-[9px] text-white/70 font-bold">{en}</p>
    </div>
  );
}

/* ============================================================
   LAYOUT 2: PREMIUM BLACK — Dark luxury
   Best for salons, upscale shops
   ============================================================ */
function PremiumPoster({ qr, shopName, town, state }) {
  return (
    <div className="a4-poster bg-[#0a0a0a] text-white relative overflow-hidden" style={{ fontFamily: "'Inter', 'Noto Sans Devanagari', sans-serif" }}>
      {/* Subtle gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#FFD700]/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#E63946]/10 to-transparent" />
      </div>

      {/* Elegant border */}
      <div className="absolute inset-6 border border-[#FFD700]/20 rounded-lg pointer-events-none" />

      <div className="relative z-10 h-full flex flex-col items-center px-10 py-14">
        {/* Top ornament */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-px bg-[#FFD700]" />
          <div className="w-1.5 h-1.5 rotate-45 bg-[#FFD700]" />
          <div className="w-8 h-px bg-[#FFD700]" />
        </div>

        {/* Brand — refined */}
        <h1 className="text-6xl font-black tracking-[0.15em] mt-3" style={{ background: 'linear-gradient(180deg, #FFF8DC 0%, #FFD700 50%, #B08900 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          QUTTR
        </h1>
        <p className="text-[10px] text-white/40 tracking-[0.5em] font-light uppercase mt-1">
          The Art of Booking
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 mt-6 mb-6">
          <div className="w-16 h-px bg-gradient-to-r from-transparent to-[#FFD700]" />
          <span className="text-[#FFD700] text-lg">✦</span>
          <div className="w-16 h-px bg-gradient-to-l from-transparent to-[#FFD700]" />
        </div>

        {/* Shop */}
        {shopName && (
          <div className="text-center mb-5">
            <p className="text-[9px] tracking-[0.4em] text-[#FFD700] uppercase font-bold mb-2">
              Exclusively At
            </p>
            <h2 className="text-3xl font-black text-white tracking-tight">{shopName}</h2>
            {town && <p className="text-xs text-white/60 mt-1 tracking-wider uppercase">{town}{state ? ` · ${state}` : ''}</p>}
          </div>
        )}

        {/* Main headline */}
        <div className="text-center my-4">
          <h2 className="text-4xl font-black leading-tight text-white">
            बुकिंग एक टैप पर
          </h2>
          <p className="text-lg text-[#FFD700] font-bold mt-1 italic">
            Booking, One Tap Away
          </p>
        </div>

        {/* QR — elegant frame */}
        <div className="relative my-4">
          <div className="absolute -inset-2 border border-[#FFD700]/40 rounded-2xl" />
          <div className="absolute -inset-5 border border-[#FFD700]/20 rounded-3xl" />
          <div className="relative bg-white p-4 rounded-xl">
            <QRImage code={qr.short_code} size={260} />
          </div>
          {/* Corner ornaments */}
          <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-[#FFD700]" />
          <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-[#FFD700]" />
          <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-[#FFD700]" />
          <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-[#FFD700]" />
        </div>

        {/* CTA */}
        <div className="text-center mt-6">
          <p className="text-xl font-black text-white leading-tight">
            <span className="text-[#FFD700]">SCAN</span> · कैमरा खोलें · Point
          </p>
          <p className="text-xs text-white/50 tracking-widest mt-2 uppercase">
            No App Download Required to Scan
          </p>
        </div>

        {/* Features — minimalist row */}
        <div className="flex items-center gap-4 mt-6 text-center">
          <div>
            <p className="text-2xl font-black text-[#FFD700]">15s</p>
            <p className="text-[9px] text-white/50 tracking-widest uppercase">Book</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div>
            <p className="text-2xl font-black text-[#FFD700]">500+</p>
            <p className="text-[9px] text-white/50 tracking-widest uppercase">Barbers</p>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div>
            <p className="text-2xl font-black text-[#FFD700]">FREE</p>
            <p className="text-[9px] text-white/50 tracking-widest uppercase">Forever</p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-auto text-center pt-6">
          <div className="flex items-center gap-2 mb-2 justify-center">
            <div className="w-8 h-px bg-[#FFD700]/50" />
            <p className="text-[10px] text-white/60 tracking-[0.3em] font-mono uppercase">
              quttrr.com/q/{qr.short_code}
            </p>
            <div className="w-8 h-px bg-[#FFD700]/50" />
          </div>
          <p className="text-[8px] text-white/30 tracking-[0.4em] uppercase">
            Available on Google Play · Made in India
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   LAYOUT 3: CLEAN WHITE — Ink saving, still eye-catching
   Best for bulk prints, offices, cafes
   ============================================================ */
function CleanPoster({ qr, shopName, town, state }) {
  return (
    <div className="a4-poster bg-white text-black relative overflow-hidden" style={{ fontFamily: "'Inter', 'Noto Sans Devanagari', sans-serif" }}>
      {/* Top red bar */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-[#E63946] via-[#FFD700] to-[#E63946]" />
      {/* Bottom red bar */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-[#E63946] via-[#FFD700] to-[#E63946]" />

      <div className="relative h-full flex flex-col items-center px-10 py-14">
        {/* Brand */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-3">
            <span className="text-3xl">✂️</span>
            <h1 className="text-6xl font-black tracking-tight text-[#E63946]">
              QUTTR
            </h1>
            <span className="text-3xl">✂️</span>
          </div>
          <p className="text-xs tracking-[0.4em] text-[#B01824] font-bold uppercase mt-1">
            भारत का #1 Barber App
          </p>
        </div>

        {/* Divider with gold accent */}
        <div className="flex items-center gap-3 my-3">
          <div className="w-20 h-1 bg-[#FFD700] rounded" />
          <div className="w-3 h-3 rotate-45 bg-[#E63946]" />
          <div className="w-20 h-1 bg-[#FFD700] rounded" />
        </div>

        {/* Shop card */}
        {shopName && (
          <div className="text-center mb-4 bg-[#FFF8DC] border-2 border-[#FFD700] rounded-2xl px-6 py-3 shadow-md">
            <p className="text-[10px] text-[#B01824] font-black tracking-widest uppercase mb-0.5">
              📍 Available At
            </p>
            <h2 className="text-3xl font-black text-black leading-tight">{shopName}</h2>
            {town && <p className="text-sm text-[#E63946] font-bold mt-1">{town}{state ? `, ${state}` : ''}</p>}
          </div>
        )}

        {/* MAIN HOOK */}
        <div className="text-center my-3">
          <h2 className="text-5xl font-black leading-none text-[#E63946]">
            इंतज़ार खत्म!
          </h2>
          <h3 className="text-2xl font-black text-black leading-none mt-2">
            SKIP THE WAIT
          </h3>
        </div>

        {/* QR CODE - clean framed */}
        <div className="relative my-4">
          {/* Gold decorative frame */}
          <div className="absolute -inset-3 border-[3px] border-[#FFD700] rounded-2xl" />
          <div className="absolute -inset-6 border-2 border-[#E63946] rounded-3xl" />

          <div className="relative bg-white p-4 border-2 border-black">
            <QRImage code={qr.short_code} size={280} />
          </div>

          {/* SCAN badge */}
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-[#E63946] text-white font-black px-6 py-2 rounded-full text-lg shadow-xl border-4 border-[#FFD700] whitespace-nowrap">
            📱 SCAN करें NOW!
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-7 mb-3">
          <p className="text-2xl font-black text-black leading-tight">
            👆 <span className="text-[#E63946]">अभी SCAN करें</span> 👆
          </p>
          <p className="text-base text-gray-700 font-bold mt-1">
            Book in 15 seconds · कोई इंतज़ार नहीं
          </p>
        </div>

        {/* Benefits row */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-md mt-3">
          <BenefitBoxWhite icon="⚡" hi="तेज़" en="Fast" />
          <BenefitBoxWhite icon="🎯" hi="आसान" en="Easy" />
          <BenefitBoxWhite icon="🎁" hi="मुफ्त" en="Free" />
        </div>

        {/* Bottom URL */}
        <div className="mt-auto text-center pt-3">
          <div className="inline-block bg-black text-white font-mono px-4 py-1.5 rounded">
            <span className="text-[#FFD700] font-black">quttrr.com/q/</span>
            <span className="font-black">{qr.short_code}</span>
          </div>
          <p className="text-[9px] text-gray-500 mt-2 tracking-widest uppercase">
            Made in India 🇮🇳 · Google Play Store
          </p>
        </div>
      </div>
    </div>
  );
}

function BenefitBoxWhite({ icon, hi, en }) {
  return (
    <div className="bg-white border-2 border-[#E63946] rounded-xl p-2 text-center shadow-sm">
      <div className="text-2xl mb-0.5">{icon}</div>
      <p className="text-sm font-black text-[#E63946] leading-tight">{hi}</p>
      <p className="text-[9px] text-gray-600 font-bold uppercase">{en}</p>
    </div>
  );
}

/* ============================================================
   QR CODE IMAGE COMPONENT
   Uses free QR API — no dependency needed
   ============================================================ */
function QRImage({ code, size = 280 }) {
  const url = `https://quttrr.com/q/${code}`;
  // Using quickchart.io — free, reliable, high quality QR API
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=0&ecc=H`;
  return (
    <img
      src={qrUrl}
      alt={`QR Code ${code}`}
      width={size}
      height={size}
      style={{ display: 'block', imageRendering: 'crisp-edges' }}
    />
  );
}
