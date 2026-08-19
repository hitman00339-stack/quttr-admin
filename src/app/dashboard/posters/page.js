'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Image as ImageIcon, Plus, Upload, Loader2, Star, StarOff,
  Trash2, MousePointer2, X, Check, Edit3, Package, AlertCircle,
} from 'lucide-react';

export default function PostersPage() {
  const [posters, setPosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [busy, setBusy] = useState(null); // tracks which poster is busy

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/posters');
      const d = await res.json();
      if (d.success) setPosters(d.posters);
      else toast.error(d.error || 'Failed to load');
    } catch (e) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const setDefault = async (poster) => {
    setBusy(poster._id);
    try {
      const res = await fetch(`/api/posters/${poster._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`"${poster.name}" is now default`);
        load();
      } else {
        toast.error(d.message || 'Failed');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setBusy(null);
    }
  };

  const deletePoster = async (poster) => {
    if (!confirm(`Delete "${poster.name}"? This cannot be undone.`)) return;
    setBusy(poster._id);
    try {
      const res = await fetch(`/api/posters/${poster._id}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) {
        toast.success('Poster deleted');
        load();
      } else {
        toast.error(d.message || 'Failed');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setBusy(null);
    }
  };

  const startRename = (poster) => {
    setEditingId(poster._id);
    setEditName(poster.name);
  };

  const saveRename = async (poster) => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setBusy(poster._id);
    try {
      const res = await fetch(`/api/posters/${poster._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success('Renamed');
        setEditingId(null);
        load();
      } else {
        toast.error(d.message || 'Failed');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setBusy(null);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-[#FFD700]" />
            Poster Templates
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Upload posters · Calibrate QR position · Print in bulk · {posters.length} total
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#E63946] to-[#B01824] text-white font-bold rounded-lg hover:shadow-[0_0_20px_rgba(230,57,70,0.5)] transition text-sm"
        >
          <Plus className="w-4 h-4" />
          Upload Poster
        </button>
      </div>

      {/* Info banner */}
      {posters.length === 0 && !loading && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-300">Get started</p>
            <p className="text-xs text-white/70 mt-1">
              Upload your first poster template (PNG/JPG, max 8 MB). Then calibrate where the QR should appear, and you can start bulk printing!
            </p>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
        </div>
      ) : posters.length === 0 ? (
        <div className="p-12 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-xl">
          <ImageIcon className="w-16 h-16 text-white/20 mx-auto mb-3" />
          <p className="text-white/60 font-bold mb-4">No posters yet</p>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#E63946] to-[#B01824] text-white text-sm font-bold rounded-lg"
          >
            <Upload className="w-4 h-4" />
            Upload Your First Poster
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posters.map((p) => {
            const isBusy = busy === p._id;
            const isEditing = editingId === p._id;

            return (
              <div
                key={p._id}
                className={`bg-white/[0.02] border rounded-xl overflow-hidden transition ${
                  p.is_default
                    ? 'border-[#FFD700]/60 shadow-[0_0_20px_rgba(255,215,0,0.15)]'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Poster image */}
                <div className="relative aspect-[3/4] bg-black overflow-hidden">
                  <img
                    src={`/api/posters/${p._id}/image`}
                    alt={p.name}
                    className="w-full h-full object-contain"
                  />

                  {/* Default badge */}
                  {p.is_default && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#FFD700] text-black text-[10px] font-black px-2 py-1 rounded-full shadow-lg">
                      <Star className="w-3 h-3 fill-black" />
                      DEFAULT
                    </div>
                  )}

                  {/* Busy overlay */}
                  {isBusy && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
                    </div>
                  )}
                </div>

                {/* Info + actions */}
                <div className="p-4 space-y-3">
                  {/* Name (editable) */}
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white/[0.05] border border-[#FFD700]/40 rounded text-sm text-white focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(p);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button
                        onClick={() => saveRename(p)}
                        className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 bg-white/[0.05] rounded hover:bg-white/[0.1]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white truncate">{p.name}</p>
                        {p.description && (
                          <p className="text-xs text-white/50 mt-0.5 line-clamp-1">
                            {p.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => startRename(p)}
                        className="p-1 text-white/40 hover:text-white/70 flex-shrink-0"
                        title="Rename"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-[10px] text-white/40">
                    <span>{p.width}×{p.height}px</span>
                    <span>·</span>
                    <span>{formatSize(p.image_size)}</span>
                    <span>·</span>
                    <span>{new Date(p.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short',
                    })}</span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/dashboard/posters/${p._id}/calibrate`}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-[#FFD700] to-[#B08900] text-black font-bold rounded-lg hover:shadow-lg transition text-xs"
                    >
                      <MousePointer2 className="w-3.5 h-3.5" />
                      Calibrate
                    </Link>
                    {p.is_default ? (
                      <button
                        disabled
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30 rounded-lg text-xs font-bold cursor-default"
                      >
                        <Star className="w-3.5 h-3.5 fill-[#FFD700]" />
                        Default
                      </button>
                    ) : (
                      <button
                        onClick={() => setDefault(p)}
                        disabled={isBusy}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] text-white rounded-lg text-xs font-bold disabled:opacity-40"
                      >
                        <StarOff className="w-3.5 h-3.5" />
                        Set Default
                      </button>
                    )}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => deletePoster(p)}
                    disabled={isBusy}
                    className="w-full flex items-center justify-center gap-1 px-3 py-1.5 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-bold disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setShowUpload(false); load(); }}
          hasExistingPosters={posters.length > 0}
        />
      )}
    </div>
  );
}

// ============================================================
// UPLOAD MODAL — with drag & drop
// ============================================================
function UploadModal({ onClose, onUploaded, hasExistingPosters }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(!hasExistingPosters);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG or JPG)');
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      toast.error('File too large. Max 8 MB');
      return;
    }
    setFile(f);

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);

    // Auto-fill name from filename if empty
    if (!name) {
      const cleanName = f.name.replace(/\.(png|jpe?g|gif|webp)$/i, '').replace(/[-_]/g, ' ');
      setName(cleanName);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Enter a name'); return; }
    if (!file) { toast.error('Select an image'); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('is_default', isDefault.toString());
      formData.append('image', file);

      const res = await fetch('/api/posters', {
        method: 'POST',
        body: formData,
      });
      const d = await res.json();

      if (d.success) {
        toast.success('✅ Poster uploaded!');
        onUploaded();
      } else {
        toast.error(d.message || d.error || 'Upload failed');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between sticky top-0 bg-neutral-900 z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#FFD700]" />
            Upload New Poster
          </h2>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 hover:bg-white/[0.05] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Drag-drop area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
              dragOver
                ? 'border-[#FFD700] bg-[#FFD700]/5'
                : preview
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-white/20 hover:border-white/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="hidden"
            />
            {preview ? (
              <div>
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-48 mx-auto mb-2 rounded"
                />
                <p className="text-xs text-emerald-400 font-bold">✓ {file?.name}</p>
                <p className="text-[10px] text-white/40 mt-1">Click to change</p>
              </div>
            ) : (
              <div>
                <Upload className="w-10 h-10 text-white/30 mx-auto mb-2" />
                <p className="text-sm text-white/70 font-semibold">
                  Drop poster image here
                </p>
                <p className="text-xs text-white/40 mt-1">
                  or click to browse · PNG/JPG · max 8 MB
                </p>
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-white/60 mb-1 block font-semibold">
              Poster Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Sidhauli Campaign, Diwali Special"
              className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg text-white focus:border-[#FFD700]/40 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-white/60 mb-1 block font-semibold">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="For which campaign / area / audience..."
              className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm focus:border-[#FFD700]/40 focus:outline-none resize-none"
            />
          </div>

          {/* Default checkbox */}
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-white/[0.03] rounded-lg">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 accent-[#FFD700]"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Set as default poster</p>
              <p className="text-xs text-white/50">
                Auto-used when downloading without picking one
              </p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex gap-2 pt-2 sticky bottom-0 bg-neutral-900 pb-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="flex-1 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg text-white/70 hover:bg-white/[0.08]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file || !name.trim()}
              className="flex-1 py-2.5 bg-gradient-to-r from-[#E63946] to-[#B01824] text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="w-4 h-4" /> Upload</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
