'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, RotateCcw, MousePointer2, Loader2 } from 'lucide-react';

export default function CalibratePage() {
  const [config, setConfig] = useState({
    xPercent: 4.5,
    yPercent: 61.5,
    widthPercent: 34,
    heightPercent: 22.5,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(null); // 'move' | 'resize'
  const containerRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    fetch('/api/qr/poster-config')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setConfig(d.config);
      })
      .finally(() => setLoading(false));
  }, []);

  const startDrag = (e, mode) => {
    e.preventDefault();
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
          return {
            ...prev,
            widthPercent: newWidth,
            heightPercent: newWidth * (s.rect.width / s.rect.height), // keep visual square
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
    document.addEventListener('touchmove', move);
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
    try {
      const res = await fetch('/api/qr/poster-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const d = await res.json();
      if (d.success) toast.success('QR position saved! All posters will use this from now on.');
      else toast.error(d.message || 'Save failed');
    } catch (e) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setConfig({ xPercent: 4.5, yPercent: 61.5, widthPercent: 34, heightPercent: 22.5 });
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
          className="relative w-full mx-auto select-none"
          style={{ maxWidth: '500px' }}
        >
          {/* Poster */}
          <img
            src="/poster-template.png"
            alt="Poster template"
            className="w-full h-auto block rounded-lg"
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
            className="absolute cursor-move border-4 border-[#FFD700] bg-[#FFD700]/20 rounded-md"
            style={{
              left: `${config.xPercent}%`,
              top: `${config.yPercent}%`,
              width: `${config.widthPercent}%`,
              height: `${config.heightPercent}%`,
              boxShadow: '0 0 0 2px rgba(0,0,0,0.5), 0 0 30px rgba(255,215,0,0.5)',
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
              className="absolute bottom-0 right-0 w-6 h-6 bg-[#FFD700] rounded-tl-lg cursor-se-resize border-l-2 border-t-2 border-black"
              onMouseDown={(e) => {
                e.stopPropagation();
                startDrag(e, 'resize');
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                startDrag(e, 'resize');
              }}
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
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Position
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg hover:bg-white/[0.1] text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Default
        </button>
        <Link
          href="/dashboard/qr-print/calibrate/preview"
          className="ml-auto text-sm text-[#FFD700] hover:underline"
        >
          Preview with sample QR →
        </Link>
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
