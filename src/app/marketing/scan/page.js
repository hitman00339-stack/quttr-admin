'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Camera, Keyboard, Loader2, ScanLine, X, ZapIcon } from 'lucide-react';

const SCANNER_DIV_ID = 'qr-scanner-region';

export default function ScanPage() {
  const router = useRouter();
  const [mode, setMode] = useState('camera'); // 'camera' | 'manual'
  const [manualCode, setManualCode] = useState('');
  const [scannerReady, setScannerReady] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const html5QrCodeRef = useRef(null);
  const isMountedRef = useRef(true);

  // Verify logged in
  useEffect(() => {
    fetch('/api/marketing/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) router.replace('/marketing/login');
      });
    return () => { isMountedRef.current = false; };
  }, [router]);

  // Start / stop scanner based on mode
  useEffect(() => {
    if (mode !== 'camera') {
      stopScanner();
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        setCameraError(null);
        // dynamic import — html5-qrcode is client-only
        const mod = await import('html5-qrcode');
        if (cancelled || !isMountedRef.current) return;

        const { Html5Qrcode } = mod;
        const scanner = new Html5Qrcode(SCANNER_DIV_ID);
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const size = Math.floor(minEdge * 0.75);
              return { width: size, height: size };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => onDecoded(decodedText),
          () => {} // scan-failure — ignore
        );
        if (isMountedRef.current) setScannerReady(true);
      } catch (err) {
        console.error('Scanner start error:', err);
        if (isMountedRef.current) {
          setCameraError(
            err?.message?.includes('Permission')
              ? 'Camera permission denied. Please allow camera access in browser settings.'
              : 'Could not start camera. Try manual entry.'
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const stopScanner = async () => {
    const scanner = html5QrCodeRef.current;
    if (scanner) {
      try {
        if (scanner.isScanning) await scanner.stop();
        await scanner.clear();
      } catch (e) {}
      html5QrCodeRef.current = null;
    }
    setScannerReady(false);
  };

  const onDecoded = async (decoded) => {
    // Extract short_code from decoded text.
    // The QR encodes: https://quttrr.com/q/ABC123
    const code = extractShortCode(decoded);
    if (!code) {
      toast.error('Not a valid Quttr QR code');
      return;
    }
    // Stop scanner and navigate
    await stopScanner();
    router.push(`/marketing/activate/${code}`);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const code = manualCode.trim().toUpperCase();
    if (!code) return;
    setChecking(true);
    try {
      // Verify the code exists before navigating
      const res = await fetch(`/api/qr/activate?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.success) {
        router.push(`/marketing/activate/${code}`);
      } else {
        toast.error('QR code not found. Check the code.');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-black/70 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/marketing/dashboard"
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-sm font-bold">Scan QR</h1>
          <div className="w-14" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Mode toggle */}
        <div className="flex gap-2 p-1 bg-white/[0.05] rounded-full border border-white/10">
          <button
            onClick={() => setMode('camera')}
            className={`flex-1 py-2 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition ${
              mode === 'camera'
                ? 'bg-gradient-to-r from-[#E63946] to-[#B01824] text-white shadow-lg'
                : 'text-white/60'
            }`}
          >
            <Camera className="w-4 h-4" />
            Camera
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition ${
              mode === 'manual'
                ? 'bg-gradient-to-r from-[#E63946] to-[#B01824] text-white shadow-lg'
                : 'text-white/60'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            Type Code
          </button>
        </div>

        {mode === 'camera' && (
          <div className="space-y-3">
            {/* Camera viewfinder */}
            <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border-2 border-[#FFD700]/30">
              <div
                id={SCANNER_DIV_ID}
                className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
              />

              {/* Loading overlay */}
              {!scannerReady && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
                  <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin mb-3" />
                  <p className="text-sm text-white/70">Starting camera...</p>
                </div>
              )}

              {/* Error overlay */}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm p-6 text-center">
                  <X className="w-10 h-10 text-red-400 mb-2" />
                  <p className="text-sm text-white/80 mb-4">{cameraError}</p>
                  <button
                    onClick={() => setMode('manual')}
                    className="px-4 py-2 bg-[#FFD700] text-black text-sm font-bold rounded-lg"
                  >
                    Use Manual Entry
                  </button>
                </div>
              )}

              {/* Scan target guide (visible when ready) */}
              {scannerReady && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-3/4 aspect-square">
                    {['top-0 left-0 border-t-4 border-l-4', 'top-0 right-0 border-t-4 border-r-4', 'bottom-0 left-0 border-b-4 border-l-4', 'bottom-0 right-0 border-b-4 border-r-4'].map((cls, i) => (
                      <div key={i} className={`absolute w-8 h-8 border-[#FFD700] ${cls}`} />
                    ))}
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.8)] qr-scan-line" />
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <p className="text-sm text-white/70 flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-[#FFD700] flex-shrink-0" />
                <span>Point camera at any Quttr QR sticker. Auto-detects.</span>
              </p>
            </div>
          </div>
        )}

        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
              <label className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-3">
                QR Short Code
              </label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="e.g., 7ZWMX5"
                autoFocus
                maxLength={12}
                className="w-full px-4 py-4 bg-black/50 border-2 border-[#FFD700]/30 rounded-xl text-2xl font-black text-center font-mono text-[#FFD700] tracking-[0.3em] focus:border-[#FFD700] focus:outline-none uppercase"
              />
              <p className="text-xs text-white/40 mt-2 text-center">
                Type the code printed under the QR (usually 6 letters/numbers)
              </p>
            </div>

            <button
              type="submit"
              disabled={checking || !manualCode.trim()}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#E63946] to-[#B01824] text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {checking ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Checking...</>
              ) : (
                <><ZapIcon className="w-5 h-5" /> Continue</>
              )}
            </button>
          </form>
        )}
      </main>

      <style jsx>{`
        @keyframes scanLineAnim {
          0% { top: 8%; opacity: 1; }
          50% { top: 92%; opacity: 1; }
          100% { top: 8%; opacity: 1; }
        }
        .qr-scan-line {
          animation: scanLineAnim 2.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Extract the short code from either "https://quttrr.com/q/ABC123" or raw "ABC123"
function extractShortCode(text) {
  if (!text) return null;
  const cleaned = text.trim();
  // If it's a URL, take the last path segment
  try {
    const url = new URL(cleaned);
    const parts = url.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && /^[A-Za-z0-9]{4,15}$/.test(last)) return last.toUpperCase();
  } catch (e) {
    // not a URL — check if it's a raw code
    if (/^[A-Za-z0-9]{4,15}$/.test(cleaned)) return cleaned.toUpperCase();
  }
  return null;
}
