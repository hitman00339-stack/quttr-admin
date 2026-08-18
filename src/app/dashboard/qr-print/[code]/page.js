'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Printer, Loader2, Palette, Download,
  Eye, Sparkles, Type, Edit3, RefreshCw,
} from 'lucide-react';

/* ============================================================
   HEADLINE PRESETS — Powerful Hindi hooks (pick one per print)
   Each is designed to hit emotionally + force action
   ============================================================ */
const HEADLINES = [
  {
    id: 'wasted_time',
    hi: ['अगर आपके', 'बर्बाद समय का', 'आप पर है असर,', 'तो तुरन्त', 'डाउनलोड करें'],
    highlight: [1], // second line gets gold highlight
    tag: 'Time Waster',
  },
  {
    id: 'no_wait',
    hi: ['अब लाइन में', 'खड़े होने की', 'ज़रूरत नहीं!', 'बस SCAN करें,', 'बुकिंग हो जाए'],
    highlight: [2],
    tag: 'No More Lines',
  },
  {
    id: 'fresh_look',
    hi: ['नया लुक चाहिए?', 'फिर देर किस बात की?', 'अभी SCAN करें', 'और बुक करें', 'अपना बार्बर'],
    highlight: [1],
    tag: 'Fresh Look',
  },
  {
    id: 'smart_choice',
    hi: ['स्मार्ट लोगों की', 'स्मार्ट पसंद!', 'अब बुकिंग', 'सिर्फ 15 सेकंड में', 'SCAN करें'],
    highlight: [1],
    tag: 'Smart Choice',
  },
  {
    id: 'india_first',
    hi: ['भारत का #1', 'बार्बर बुकिंग ऐप', 'अब आपके शहर में!', 'SCAN करें और', 'तुरन्त बुक करें'],
    highlight: [0],
    tag: 'India #1',
  },
  {
    id: 'skip_wait',
    hi: ['इंतज़ार को', 'कहें अलविदा!', 'फ्रेश लुक की', 'नई शुरुआत', 'यहाँ से करें'],
    highlight: [1],
    tag: 'Skip the Wait',
  },
];

const THEMES = [
  { id: 'fire', name: '🔥 FIRE STORM', desc: 'Dark + fire sparks (like reference)' },
  { id: 'royal', name: '👑 ROYAL GOLD', desc: 'Black + gold luxury' },
  { id: 'street', name: '⚡ STREET BOLD', desc: 'Red + gold high-impact' },
];

export default function PrintQRPage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('fire');
  const [headlineId, setHeadlineId] = useState('wasted_time');
  const [customHeadline, setCustomHeadline] = useState(null); // if user edits
  const [showEditor, setShowEditor] = useState(false);
  const [editLines, setEditLines] = useState(['', '', '', '', '']);
  const [editHighlight, setEditHighlight] = useState([1]);

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

  const openEditor = () => {
    const current = customHeadline || HEADLINES.find((h) => h.id === headlineId);
    if (current) {
      const lines = [...current.hi];
      while (lines.length < 5) lines.push('');
      setEditLines(lines.slice(0, 5));
      setEditHighlight(current.highlight || [1]);
    }
    setShowEditor(true);
  };

  const saveCustomHeadline = () => {
    const filtered = editLines.filter((l) => l.trim());
    if (filtered.length < 2) {
      toast.error('Please add at least 2 lines');
      return;
    }
    setCustomHeadline({
      id: 'custom',
      hi: filtered,
      highlight: editHighlight,
      tag: 'Custom',
    });
    setShowEditor(false);
    toast.success('Custom headline applied');
  };

  const toggleLineHighlight = (idx) => {
    setEditHighlight((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
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
  const currentHeadline = customHeadline || HEADLINES.find((h) => h.id === headlineId);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Control Panel (hidden in print) */}
      <div className="no-print mb-6 space-y-4">
        <div className="flex items-start gap-3">
          <Link
            href={`/dashboard/qr-explorer/${qr.short_code}`}
            className="p-2 bg-white/[0.05] rounded-lg hover:bg-white/[0.1]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Printer className="w-6 h-6 text-[#FFD700]" />
              Print QR Poster
            </h1>
            <p className="text-sm text-white/60 mt-1">
              Ultra-professional A4 poster · Fully customizable
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#E63946] to-[#B01824] text-white font-bold rounded-lg hover:shadow-[0_0_25px_rgba(230,57,70,0.5)] transition text-sm"
          >
            <Printer className="w-4 h-4" />
            PRINT NOW
          </button>
        </div>

        {/* Theme picker */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-[#FFD700]" />
            <h2 className="font-bold text-sm">Choose Design</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-3 rounded-xl border-2 text-left transition ${
                  theme === t.id
                    ? 'border-[#FFD700] bg-[#FFD700]/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <p className="font-black text-sm">{t.name}</p>
                <p className="text-[10px] text-white/60 mt-1">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Headline picker */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-[#FFD700]" />
              <h2 className="font-bold text-sm">Headline / Hook</h2>
              {customHeadline && (
                <span className="text-[10px] px-2 py-0.5 bg-[#FFD700]/20 text-[#FFD700] rounded-full font-bold">
                  CUSTOM
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {customHeadline && (
                <button
                  onClick={() => { setCustomHeadline(null); toast.success('Reset to preset'); }}
                  className="text-xs text-white/50 hover:text-white flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset
                </button>
              )}
              <button
                onClick={openEditor}
                className="flex items-center gap-1 text-xs text-[#FFD700] hover:underline font-bold"
              >
                <Edit3 className="w-3 h-3" />
                Edit Text
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {HEADLINES.map((h) => (
              <button
                key={h.id}
                onClick={() => { setHeadlineId(h.id); setCustomHeadline(null); }}
                className={`p-3 rounded-lg border text-left transition ${
                  !customHeadline && headlineId === h.id
                    ? 'border-[#FFD700] bg-[#FFD700]/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <p className="text-[10px] text-[#FFD700] font-bold uppercase mb-1">{h.tag}</p>
                <p className="text-xs text-white/80 leading-tight" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {h.hi.slice(0, 2).join(' ')}...
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Info if activated */}
        {shopName && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <p className="text-xs text-emerald-300">
              Activated · Shop info will appear on poster: <b>{shopName}</b>
              {town && ` · ${town}`}
            </p>
          </div>
        )}

        {/* Preview label */}
        <div className="flex items-center gap-2 text-xs text-white/50 pt-2">
          <Eye className="w-3.5 h-3.5" />
          Preview shows exactly what will print on A4
        </div>
      </div>

      {/* THE POSTER (this is what prints) */}
      <div className="print-container">
        {theme === 'fire' && <FirePoster qr={qr} shopName={shopName} town={town} headline={currentHeadline} />}
        {theme === 'royal' && <RoyalPoster qr={qr} shopName={shopName} town={town} headline={currentHeadline} />}
        {theme === 'street' && <StreetPoster qr={qr} shopName={shopName} town={town} headline={currentHeadline} />}
      </div>

      {/* Headline Editor Modal */}
      {showEditor && (
        <div className="no-print fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#FFD700]" />
                Edit Headline
              </h2>
              <button onClick={() => setShowEditor(false)} className="text-white/50 hover:text-white text-2xl">×</button>
            </div>
            <p className="text-xs text-white/50 mb-4">
              Write up to 5 short lines. Click star ⭐ to highlight a line in <span className="text-[#FFD700] font-bold">gold</span>.
            </p>
            <div className="space-y-2">
              {editLines.map((line, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLineHighlight(i)}
                    className={`p-2 rounded-lg transition ${
                      editHighlight.includes(i)
                        ? 'bg-[#FFD700]/20 text-[#FFD700]'
                        : 'bg-white/[0.05] text-white/40'
                    }`}
                    title={editHighlight.includes(i) ? 'Highlighted (gold)' : 'Normal (white)'}
                  >
                    ⭐
                  </button>
                  <input
                    type="text"
                    value={line}
                    onChange={(e) => {
                      const copy = [...editLines];
                      copy[i] = e.target.value;
                      setEditLines(copy);
                    }}
                    placeholder={`Line ${i + 1}`}
                    className="flex-1 px-3 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg text-white focus:border-[#FFD700]/40 focus:outline-none"
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowEditor(false)}
                className="flex-1 py-2.5 bg-white/[0.05] rounded-lg text-white/70"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomHeadline}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#E63946] to-[#B01824] text-white font-bold rounded-lg"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800;900&family=Inter:wght@400;600;700;800;900&display=swap');

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, .no-print * { display: none !important; }
          .print-container {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
            background: none !important;
          }
          .a4-poster {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: always;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          nav, aside, header { display: none !important; }
        }

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
            max-width: 595px;
            aspect-ratio: 210 / 297;
            box-shadow: 0 20px 60px rgba(0,0,0,0.7);
            overflow: hidden;
          }
        }

        .devanagari { font-family: 'Noto Sans Devanagari', 'Inter', sans-serif; }
      `}</style>
    </div>
  );
}

/* ============================================================
   LAYOUT 1: FIRE STORM — inspired by your reference
   ============================================================ */
function FirePoster({ qr, shopName, town, headline }) {
  return (
    <div className="a4-poster relative overflow-hidden" style={{ background: '#0a0505' }}>
      {/* Fire background layers */}
      <div className="absolute inset-0">
        {/* Dark gradient base */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 40%, #2a0a08 0%, #0a0505 60%, #000 100%)',
        }} />
        {/* Fire sparks - top */}
        <div className="absolute top-0 left-0 right-0 h-1/2" style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(230,57,70,0.35) 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, rgba(255,140,0,0.25) 0%, transparent 50%)',
        }} />
        {/* Fire sparks - bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{
          background: 'radial-gradient(ellipse at 70% 80%, rgba(255,215,0,0.2) 0%, transparent 50%), radial-gradient(ellipse at 20% 70%, rgba(230,57,70,0.25) 0%, transparent 50%)',
        }} />

        {/* Dot noise for grunge texture */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,215,0,0.15) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />

        {/* Spark particles */}
        <FireParticles />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col px-8 pt-10 pb-6">
        {/* SHOP BADGE (top, if activated) */}
        {shopName && (
          <div className="text-center mb-3">
            <div className="inline-block bg-black/60 backdrop-blur border border-[#FFD700]/50 rounded-full px-4 py-1">
              <p className="text-[11px] font-black text-[#FFD700] tracking-wider uppercase devanagari">
                📍 {shopName} {town ? `· ${town}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* HEADLINE - big dramatic Hindi */}
        <div className="devanagari" style={{ marginTop: shopName ? 8 : 24 }}>
          {headline.hi.map((line, i) => {
            const isHighlighted = headline.highlight?.includes(i);
            return (
              <h1
                key={i}
                className="font-black leading-[1.1] mb-1"
                style={{
                  fontSize: line.length > 15 ? '38px' : '46px',
                  color: isHighlighted ? '#FFD700' : '#FFFFFF',
                  textShadow: isHighlighted
                    ? '0 3px 20px rgba(255,215,0,0.5), 0 0 40px rgba(230,57,70,0.3)'
                    : '0 3px 15px rgba(0,0,0,0.8), 0 0 25px rgba(230,57,70,0.4)',
                  WebkitTextStroke: isHighlighted ? '1px rgba(230,57,70,0.4)' : '0',
                  letterSpacing: '-0.02em',
                }}
              >
                {line}
              </h1>
            );
          })}
        </div>

        {/* QR + LOGO ROW */}
        <div className="flex items-center justify-between gap-4 my-6 flex-1">
          {/* QR on left */}
          <div className="relative flex-shrink-0">
            {/* Glow ring */}
            <div className="absolute -inset-2 bg-gradient-to-br from-[#FFD700] via-[#E63946] to-[#FFD700] rounded-2xl blur-md opacity-70" />
            <div className="relative bg-white p-3 rounded-xl">
              <QRImage code={qr.short_code} size={220} />
            </div>
          </div>

          {/* QUTTR Logo on right */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Big Q logo */}
            <div className="relative mb-2">
              <div className="absolute inset-0 bg-[#E63946] blur-2xl opacity-60 rounded-full" />
              <div className="relative w-32 h-32 rounded-full flex items-center justify-center border-[6px] border-[#FFD700] shadow-[0_0_40px_rgba(255,215,0,0.5)]" style={{
                background: 'radial-gradient(circle at 30% 30%, #E63946 0%, #8B0000 100%)',
              }}>
                {/* Scissors icon */}
                <svg viewBox="0 0 24 24" className="w-16 h-16 text-[#FFD700]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <line x1="20" y1="4" x2="8.12" y2="15.88" />
                  <line x1="14.47" y1="14.48" x2="20" y2="20" />
                  <line x1="8.12" y1="8.12" x2="12" y2="12" />
                </svg>
              </div>
            </div>

            {/* QUTTR text - big golden */}
            <h2 className="font-black tracking-wider" style={{
              fontSize: '54px',
              lineHeight: '0.9',
              background: 'linear-gradient(180deg, #FFF5B7 0%, #FFD700 40%, #C99A00 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 8px rgba(0,0,0,0.5)',
              filter: 'drop-shadow(0 3px 6px rgba(255,215,0,0.4))',
            }}>
              QUTTR
            </h2>

            {/* Tagline */}
            <div className="mt-2 bg-black/60 backdrop-blur px-3 py-1 rounded">
              <p className="text-[11px] font-bold text-white devanagari text-center whitespace-nowrap">
                समय बचाओ, जीवन बनाओ
              </p>
            </div>
          </div>
        </div>

        {/* SOCIAL BAR at bottom */}
        <SocialBar theme="dark" />
      </div>
    </div>
  );
}

/* ============================================================
   LAYOUT 2: ROYAL GOLD — Premium black + gold luxury
   ============================================================ */
function RoyalPoster({ qr, shopName, town, headline }) {
  return (
    <div className="a4-poster relative overflow-hidden" style={{ background: '#000' }}>
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(255,215,0,0.12) 0%, transparent 60%)',
        }} />
        {/* Gold border ornament */}
        <div className="absolute inset-4 border border-[#FFD700]/30 rounded-lg" />
        <div className="absolute inset-6 border border-[#FFD700]/15 rounded-lg" />

        {/* Corner flourishes */}
        {[
          'top-3 left-3 border-t-2 border-l-2',
          'top-3 right-3 border-t-2 border-r-2',
          'bottom-3 left-3 border-b-2 border-l-2',
          'bottom-3 right-3 border-b-2 border-r-2',
        ].map((pos, i) => (
          <div key={i} className={`absolute w-10 h-10 border-[#FFD700] ${pos}`} />
        ))}
      </div>

      <div className="relative h-full flex flex-col px-10 pt-12 pb-6">
        {/* Ornament top */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-10 h-px bg-[#FFD700]" />
          <div className="w-2 h-2 rotate-45 bg-[#FFD700]" />
          <div className="w-10 h-px bg-[#FFD700]" />
        </div>

        {/* Shop */}
        {shopName && (
          <div className="text-center mb-2">
            <p className="text-[10px] tracking-[0.4em] text-[#FFD700] uppercase font-bold">
              Presented By
            </p>
            <h3 className="text-xl font-black text-white mt-1 devanagari">{shopName}</h3>
            {town && <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">{town}</p>}
          </div>
        )}

        {/* Headline */}
        <div className="devanagari text-center mt-4">
          {headline.hi.map((line, i) => {
            const isHighlighted = headline.highlight?.includes(i);
            return (
              <h1
                key={i}
                className="font-black leading-tight mb-1"
                style={{
                  fontSize: line.length > 15 ? '32px' : '40px',
                  background: isHighlighted
                    ? 'linear-gradient(180deg, #FFF5B7 0%, #FFD700 50%, #B08900 100%)'
                    : 'linear-gradient(180deg, #FFFFFF 0%, #E0E0E0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.01em',
                }}
              >
                {line}
              </h1>
            );
          })}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 justify-center my-5">
          <div className="w-16 h-px bg-gradient-to-r from-transparent to-[#FFD700]" />
          <span className="text-[#FFD700] text-lg">✦</span>
          <div className="w-16 h-px bg-gradient-to-l from-transparent to-[#FFD700]" />
        </div>

        {/* QR - elegant framed */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute -inset-4 bg-[#FFD700]/20 blur-2xl rounded-3xl" />
            {/* Gold frame */}
            <div className="absolute -inset-3 border-2 border-[#FFD700] rounded-2xl" />
            <div className="absolute -inset-6 border border-[#FFD700]/30 rounded-3xl" />
            {/* Corner accents */}
            {[
              '-top-3 -left-3 border-t-2 border-l-2',
              '-top-3 -right-3 border-t-2 border-r-2',
              '-bottom-3 -left-3 border-b-2 border-l-2',
              '-bottom-3 -right-3 border-b-2 border-r-2',
            ].map((pos, i) => (
              <div key={i} className={`absolute w-8 h-8 border-[#FFD700] ${pos}`} />
            ))}

            <div className="relative bg-white p-4 rounded-xl">
              <QRImage code={qr.short_code} size={260} />
            </div>
          </div>
        </div>

        {/* QUTTR wordmark */}
        <div className="text-center mt-5 mb-3">
          <h2 className="font-black tracking-[0.2em]" style={{
            fontSize: '38px',
            background: 'linear-gradient(180deg, #FFF5B7 0%, #FFD700 50%, #B08900 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            QUTTR
          </h2>
          <p className="text-[10px] text-white/60 tracking-[0.4em] uppercase mt-1 devanagari">
            समय बचाओ · जीवन बनाओ
          </p>
        </div>

        {/* Social bar */}
        <SocialBar theme="dark" />
      </div>
    </div>
  );
}

/* ============================================================
   LAYOUT 3: STREET BOLD — High-impact red + gold
   ============================================================ */
function StreetPoster({ qr, shopName, town, headline }) {
  return (
    <div className="a4-poster relative overflow-hidden" style={{ background: '#0a0000' }}>
      {/* Bold color splashes */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(230,57,70,0.4) 0%, transparent 40%, transparent 60%, rgba(255,215,0,0.2) 100%)',
        }} />
        {/* Diagonal stripes */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#E63946] via-[#FFD700] to-[#E63946]" />
        <div className="absolute bottom-24 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FFD700] via-[#E63946] to-[#FFD700]" />

        {/* Blur orbs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#E63946]/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 bg-[#FFD700]/25 rounded-full blur-3xl" />
      </div>

      <div className="relative h-full flex flex-col px-8 pt-10 pb-6">
        {/* Shop */}
        {shopName && (
          <div className="text-center mb-3">
            <div className="inline-block bg-[#E63946] px-4 py-1 rounded transform -skew-x-6 border-2 border-[#FFD700]">
              <p className="text-[12px] font-black text-white tracking-wider uppercase devanagari transform skew-x-6">
                📍 {shopName} {town ? `· ${town}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* HEADLINE */}
        <div className="devanagari mt-2">
          {headline.hi.map((line, i) => {
            const isHighlighted = headline.highlight?.includes(i);
            return (
              <h1
                key={i}
                className="font-black leading-[1.05] mb-1"
                style={{
                  fontSize: line.length > 15 ? '40px' : '48px',
                  color: isHighlighted ? '#FFD700' : '#FFFFFF',
                  textShadow: '3px 3px 0 #E63946, 6px 6px 0 rgba(0,0,0,0.5)',
                  letterSpacing: '-0.02em',
                  transform: 'skew(-2deg)',
                }}
              >
                {line}
              </h1>
            );
          })}
        </div>

        {/* QR + Logo side-by-side */}
        <div className="flex items-center justify-center gap-5 my-6 flex-1">
          {/* QR */}
          <div className="relative flex-shrink-0">
            {/* Angular colored bg */}
            <div className="absolute -inset-3 bg-[#FFD700] rounded-lg transform rotate-3" />
            <div className="absolute -inset-3 bg-[#E63946] rounded-lg transform -rotate-3" />
            <div className="relative bg-white p-3 rounded-lg">
              <QRImage code={qr.short_code} size={200} />
            </div>
            {/* "SCAN" tag */}
            <div className="absolute -top-3 -right-3 bg-[#FFD700] text-black font-black text-xs px-2 py-1 rounded rotate-12 border-2 border-black">
              📱 SCAN
            </div>
          </div>

          {/* QUTTR */}
          <div className="flex flex-col items-center">
            {/* Big Q logo */}
            <div className="relative mb-2">
              <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.5)]" style={{
                background: 'radial-gradient(circle at 30% 30%, #E63946 0%, #8B0000 100%)',
              }}>
                <svg viewBox="0 0 24 24" className="w-12 h-12 text-[#FFD700]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <line x1="20" y1="4" x2="8.12" y2="15.88" />
                  <line x1="14.47" y1="14.48" x2="20" y2="20" />
                  <line x1="8.12" y1="8.12" x2="12" y2="12" />
                </svg>
              </div>
            </div>
            <h2 className="font-black tracking-wide" style={{
              fontSize: '42px',
              lineHeight: '0.9',
              background: 'linear-gradient(180deg, #FFF5B7 0%, #FFD700 50%, #B08900 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '3px 3px 0 rgba(0,0,0,0.5)',
            }}>
              QUTTR
            </h2>
            <p className="text-[10px] text-white/80 font-bold devanagari mt-1 whitespace-nowrap">
              समय बचाओ, जीवन बनाओ
            </p>
          </div>
        </div>

        {/* Social bar */}
        <SocialBar theme="dark" />
      </div>
    </div>
  );
}

/* ============================================================
   SOCIAL BAR — Same for all layouts, at bottom
   Compact: Instagram + Facebook + WhatsApp only
   ============================================================ */
function SocialBar({ theme = 'dark' }) {
  return (
    <div className="bg-black/60 backdrop-blur border border-[#FFD700]/30 rounded-xl px-4 py-2.5 mt-auto">
      <div className="grid grid-cols-3 gap-2 items-center">
        {/* Instagram */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{
            background: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4)',
          }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
              <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 011.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772 4.915 4.915 0 01-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 00-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[8px] text-white/60 font-bold uppercase tracking-wider leading-none">Instagram</p>
            <p className="text-[11px] text-[#FFD700] font-black leading-tight truncate">@quttrofficial</p>
          </div>
        </div>

        {/* Facebook */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1877F2] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[8px] text-white/60 font-bold uppercase tracking-wider leading-none">Facebook</p>
            <p className="text-[11px] text-[#FFD700] font-black leading-tight truncate">Quttr</p>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#25D366] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[8px] text-white/60 font-bold uppercase tracking-wider leading-none">WhatsApp</p>
            <p className="text-[11px] text-[#FFD700] font-black leading-tight truncate">9519953149</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FIRE PARTICLES — subtle animated sparks (for FirePoster)
   ============================================================ */
function FireParticles() {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: 2 + Math.random() * 4,
    color: Math.random() > 0.5 ? '#FFD700' : '#E63946',
  }));

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            opacity: 0.6,
          }}
        />
      ))}
    </>
  );
}

/* ============================================================
   QR IMAGE — high-quality QR from free API
   ============================================================ */
function QRImage({ code, size = 260 }) {
  const url = `https://quttrr.com/q/${code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&margin=0&ecc=H`;
  return (
    <img
      src={qrUrl}
      alt=""
      width={size}
      height={size}
      style={{ display: 'block', imageRendering: 'crisp-edges' }}
    />
  );
}
