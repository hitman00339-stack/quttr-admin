'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  requireReason = false,
  variant = 'danger', // danger, warning, info
  loading = false,
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen) setReason('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireReason && reason.trim().length < 5) return;
    onConfirm(reason);
  };

  const variantStyles = {
    danger: 'from-error to-red-800 shadow-brand',
    warning: 'from-warning to-amber-700',
    info: 'from-info to-blue-800',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={loading ? undefined : onClose}
      />

      <div className="relative w-full max-w-md card p-6 animate-scale-in">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 btn-icon"
        >
          <X className="w-4 h-4" />
        </button>

        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${variantStyles[variant]} flex items-center justify-center mb-4`}>
          <AlertTriangle className="w-6 h-6 text-white" />
        </div>

        <h2 className="text-title mb-2">{title}</h2>
        <p className="text-body mb-6">{message}</p>

        {requireReason && (
          <div className="mb-6">
            <label className="label">Reason (required)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the reason (min 5 characters)..."
              className="input min-h-[100px] resize-none"
              disabled={loading}
              autoFocus
            />
            <p className="label-hint">This will be shown to the shop owner</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-outline flex-1"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (requireReason && reason.trim().length < 5)}
            className={`btn-brand flex-1 ${variant === 'danger' ? 'bg-gradient-to-b from-error to-red-800' : ''}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
