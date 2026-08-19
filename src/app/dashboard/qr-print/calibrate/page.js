'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Save, RotateCcw, MousePointer2, Loader2,
  AlertCircle, CheckCircle2,
} from 'lucide-react';

export default function CalibratePage() {
  const [config, setConfig] = useState({
    xPercent: 4.5,
    yPercent: 61.5,
    widthPercent: 34,
    heightPercent: 22.5,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [errorDetails, setErrorDetails] = useState(null);
  const containerRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/qr/poster-config');
      const d = await res.json();
      if (d.success && d.config) {
        setConfig(d.config);
      }
    } catch (e) {
      console.error('Load config failed:', e);
      // Keep defaults
    } finally {
      setLoading(false);
    }
  };

  const startDrag = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;
    startRef.current = {
      x: clientX,
      y: clientY,
      rect,
      config: { ...config },
    };
    setDragging(mode);
  };

  useEffect(() => {
    if (!dragging) return;

    const move = (e) => {
      const clientX = e.touches?.[0]?.clientX ?? e.clientX;
      const clientY = e.touches?.[0]?.clientY ?? e.clientY;
      const s = startRef.current;
      if (!s) return;

      const dx = ((clientX - s.x) / s.rect.width) * 100;
      const dy = ((clientY - s.y) / s.rect.height) * 100;

      setConfig((prev) => {
        if (dragging === 'move') {
          return {
            ...prev,
            xPercent: Math.max(0, Math.min(100 - prev.widthPercent, s.config.xPercent + dx)),
            yPercent: Math.max(0, Math.min(100 - prev.heightPercent, s.config.yPercent + dy)),
          };
        }
        if (dragging === 'resize') {
          const newWidth = Math.max(5, Math.min(80, s.config.widthPercent + dx));
          const newHeight = Math.max(5, Math.min(80, s.config.heightPercent + dy));
          return {
            ...prev,
            widthPercent: newWidth,
            heightPercent: newHeight,
          };
        }
        return prev;
      });
    };

    const end = () => {
      setDragging(null);
      startRef.current = null;
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', end);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', end);
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', end);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', end);
    };
  }, [dragging]);

  const save = async () => {
    setSaving(true);
    setSaveStatus(null);
    setErrorDetails(null);

    try {
      const res = await fetch('/api/qr/poster-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      // Check response type
      const contentType = res.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        const text = await res.text();
        setErrorDetails({
          status: res.status,
          contentType,
          bodyPreview: text.substring(0, 300),
          url: '/api/qr/poster-config',
        });
        throw new Error(`Server returned ${contentType || 'non-JSON'} (status ${res.status})`);
      }

      const d = await res.json();

      if (!res.ok || !d.success) {
        setErrorDetails({
          status: res.status,
          response: d,
        });
        throw new Error(d.message || d.error || `HTTP ${res.status}`);
      }

      toast.success('✅ QR position saved! All posters will use this from now on.', {
        duration: 4000,
      });
      setSaveStatus('success');

      // Auto-hide success after 5 seconds
      setTimeout(() => setSaveStatus(null), 5000);
    } catch (e) {
      console.error('Save failed:', e);
      toast.error(e.message || 'Save failed');
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setConfig({
      xPercent: 4.5,
      yPercent: 61.5,
      widthPercent: 34,
      heightPercent: 22.5,
    });
    toast.success('Reset to default position');
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/dashboard/qr-codes" className="p-2 bg-white/[0.05] rounded-lg hover:bg-white/[0.1]">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MousePointer2 className="w-6 h-6 text-[#FFD700]" />
            Calibrate QR Position
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Drag the yellow box to mark where QR should be placed on the poster.
            This is a <b>one-time setup</b> — all posters will use this position.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-white/80 space-y-1">
        <p>✋ <b>Drag the yellow box</b> to move it to the QR spot on the poster</p>
        <p>↔️ <b>Drag the corner handle</b> (bottom-right) to resize</p>
        <p>💾 Click <b>Save</b> when it's perfectly placed over the empty QR area</p>
      </div>

      {/* Success banner */}
      {saveStatus === 'success' && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-300">✅ Position saved successfully!</p>
            <p className="text-xs text-white/60 mt-1">
              All future posters (single + bulk) will use this exact position.
              Go to <Link href="/dashboard/qr-codes" className="text-[#FFD700] underline">QR Codes</Link> to test print.
            </p>
          </div>
        </div>
      )}

      {/* Error banner with debug info */}
      {saveStatus === 'error' && errorDetails && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-400">⚠️ Save failed</p>
              <p className="text-xs text-white/70 mt-1">
                The calibration values were valid but the server couldn't save them.
              </p>
            </div>
          </div>

          <div className="bg-black/40 p-3 rounded text-[10px] font-mono space-y-1">
            <p className="text-yellow-400">🔍 Debug info:</p>
            {errorDetails.url && <p className="text-white/70">URL: {errorDetails.url}</p>}
            {errorDetails.status && <p className="text-white/70">Status: {errorDetails.status}</p>}
            {errorDetails.contentType && (
              <p className="text-white/70">Content-Type: {errorDetails.contentType}</p>
            )}
            {errorDetails.bodyPreview && (
              <>
                <p className="text-white/70 mt-2">Response preview:</p>
                <pre className="text-white/60 whitespace-pre-wrap break-all">{errorDetails.bodyPreview}</pre>
              </>
            )}
            {errorDetails.response && (
              <>
                <p className="text-white/70 mt-2">Response:</p>
                <pre className="text-white/60 whitespace-pre-wrap break-all">
                  {JSON.stringify(errorDetails.response, null, 2)}
                </pre>
              </>
            )}
          </div>

          <div className="text-xs text-white/70 space-y-1">
            <p className="font-bold text-white/90">💡 Common causes & fixes:</p>
            <p>1. API file missing — check <code className="text-[#FFD700]">src/app/api/qr/poster-config/route.js</code> exists on GitHub</p>
            <p>2. Deployment failed — check Vercel dashboard for green ✅ Ready</p>
            <p>3. MongoDB env var missing — check Vercel Settings → Environment Variables → MONGODB_URI</p>
            <p>4. Test API: <a href="/api/qr/poster-config" target="_blank" rel="noreferrer" className="text-[#FFD700] underline">/api/qr/poster-config</a></p>
          </div>
        </div>
      )}

      {/* Position values */}
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
        <div className="grid grid-cols-4 gap-3 text-center">
          <ValueDisplay label="Left %" value={config.xPercent.toFixed(1)} />
          <ValueDisplay label="Top %" value={config.yPercent.toFixed(1)} />
          <ValueDisplay label="Width %" value={config.widthPercent.toFixed(1)} />
          <ValueDisplay label="Height %" value={config.heightPercent.toFixed(1)} />
        </div>
      </div>

      {/* Poster with draggable QR box */}
      <div className="bg-black rounded-xl p-4">
        <div
          ref={containerRef}
          className="relative w-full mx-auto select-none touch-none"
          style={{ maxWidth: '500px' }}
        >
          {/* Poster */}
          <img
            src="/poster-template.png"
            alt="Poster template"
            className="w-full h-auto block rounded-lg pointer-events-none"
            draggable={false}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
          <div className="hidden w-full aspect-[2/3] rounded-lg bg-red-500/10 border-2 border-dashed border-red-500 items-center justify-center text-center p-6">
            <div>
              <p className="text-red-400 font-bold mb-2">⚠️ poster-template.png not found</p>
              <p className="text-xs text-white/60">
                Upload the poster to <code>/public/poster-template.png</code>
              </p>
            </div>
          </div>

          {/* Draggable QR box */}
          <div
            className="absolute cursor-move border-4 border-[#FFD700] bg-[#FFD700]/25 rounded-md touch-none"
            style={{
              left: `${config.xPercent}%`,
              top: `${config.yPercent}%`,
              width: `${config.widthPercent}%`,
              height: `${config.heightPercent}%`,
              boxShadow: '0 0 0 2px rgba(0,0,0,0.5), 0 0 30px rgba(255,215,0,0.6)',
            }}
            onMouseDown={(e) => startDrag(e, 'move')}
            onTouchStart={(e) => startDrag(e, 'move')}
          >
            <div className="w-full h-full flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-[#FFD700] font-black text-lg drop-shadow">QR HERE</p>
                <p className="text-[10px] text-white/80 mt-1">drag to move</p>
              </div>
            </div>

            {/* Resize handle bottom-right */}
            <div
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#FFD700] rounded-tl-lg cursor-se-resize border-l-2 border-t-2 border-black touch-none"
              onMouseDown={(e) => startDrag(e, 'resize')}
              onTouchStart={(e) => startDrag(e, 'resize')}
              title="Drag to resize"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-bold rounded-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition disabled:opacity-50 text-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Position'}
        </button>
        <button
          onClick={reset}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg hover:bg-white/[0.1] text-sm disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Default
        </button>
        <div className="ml-auto flex items-center gap-3">
          <a
            href="/api/qr/poster-config"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-white/40 hover:text-white/70"
          >
            Test API
          </a>
          <Link
            href="/dashboard/qr-codes"
            className="text-sm text-[#FFD700] hover:underline"
          >
            ← Back to QR Codes
          </Link>
        </div>
      </div>
    </div>
  );
}

function ValueDisplay({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold">{label}</p>
      <p className="text-lg font-black text-[#FFD700] mt-1 font-mono">{value}</p>
    </div>
  );
}
