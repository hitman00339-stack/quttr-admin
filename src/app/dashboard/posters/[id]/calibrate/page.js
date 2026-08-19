'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Save, RotateCcw, MousePointer2, Loader2,
  CheckCircle2, Star,
} from 'lucide-react';

const DEFAULT_CONFIG = {
  xPercent: 4.5,
  yPercent: 61.5,
  widthPercent: 34,
  heightPercent: 22.5,
};

export default function CalibratePosterPage() {
  const params = useParams();
  const posterId = params.id;

  const [poster, setPoster] = useState(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [saved, setSaved] = useState(false);
  const containerRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    load();
  }, [posterId]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posters/${posterId}`);
      const d = await res.json();
      if (d.success) {
        setPoster(d.poster);
        setConfig(d.poster.qr_config || DEFAULT_CONFIG);
      } else {
        toast.error(d.message || 'Poster not found');
      }
    } catch (e) {
      toast.error('Failed to load');
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
    startRef.current = { x: clientX, y: clientY, rect, config: { ...config } };
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
          return { ...prev, widthPercent: newWidth, heightPercent: newHeight };
        }
        return prev;
      });
    };
    const end = () => { setDragging(null); startRef.current = null; };
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
    setSaved(false);
    try {
      const res = await fetch(`/api/posters/${posterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_config: config }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success('✅ Calibration saved!');
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      } else {
        toast.error(d.message || d.error || 'Save failed');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setConfig(DEFAULT_CONFIG);
    toast.success('Reset to default position');
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
      </div>
    );
  }

  if (!poster) {
    return (
      <div className="text-center py-20">
        <p className="text-white/60">Poster not found</p>
        <Link href="/dashboard/posters" className="text-[#FFD700] mt-3 inline-block">
          ← Back to Posters
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/dashboard/posters" className="p-2 bg-white/[0.05] rounded-lg hover:bg-white/[0.1]">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <MousePointer2 className="w-5 h-5 text-[#FFD700]" />
            <h1 className="text-xl font-bold">Calibrate: {poster.name}</h1>
            {poster.is_default && (
              <span className="flex items-center gap-1 bg-[#FFD700]/20 text-[#FFD700] text-[10px] font-black px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3 fill-[#FFD700]" />
                DEFAULT
              </span>
            )}
          </div>
          <p className="text-sm text-white/60 mt-1">
            Drag the yellow box to mark where QR should be placed. Position saves per-poster.
          </p>
        </div>
      </div>

      {/* Success banner */}
      {saved && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <p className="text-sm text-emerald-300 font-bold">
            Saved! This poster's calibration is now updated.
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-xs text-white/80 space-y-1">
        <p>✋ <b>Drag yellow box</b> to move · ↔️ <b>Corner handle</b> to resize · 💾 Click <b>Save</b> when done</p>
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

      {/* Poster with draggable box */}
      <div className="bg-black rounded-xl p-4">
        <div
          ref={containerRef}
          className="relative w-full mx-auto select-none touch-none"
          style={{ maxWidth: '500px' }}
        >
          <img
            src={`/api/posters/${posterId}/image`}
            alt={poster.name}
            className="w-full h-auto block rounded-lg pointer-events-none"
            draggable={false}
          />

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
      <div className="flex items-center gap-2 flex-wrap sticky bottom-0 bg-black/60 backdrop-blur-md p-3 -mx-3 rounded-xl">
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
          Reset
        </button>
        <Link
          href="/dashboard/posters"
          className="ml-auto text-sm text-[#FFD700] hover:underline"
        >
          ← All Posters
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
