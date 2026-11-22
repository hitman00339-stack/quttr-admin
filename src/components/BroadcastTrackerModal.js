'use client';

import React from 'react';
import {
  PhoneCall, Play, Pause, Square, RefreshCw, CheckCircle2,
  AlertCircle, Clock, ShieldCheck, X, Loader2, Sparkles
} from 'lucide-react';

export default function BroadcastTrackerModal({
  isOpen,
  onClose,
  campaignStatus,
  onRefresh,
  onControl,
  isActionLoading,
  onStartNew,
}) {
  if (!isOpen) return null;

  const status = campaignStatus || {};
  const isActive = status.isActive;
  const isPaused = status.isPaused;
  const isStopped = status.isStopped;
  const total = status.totalBarbers || 0;
  const current = status.currentIndex || 0;
  const progressPercent = status.progressPercent || 0;
  const successCount = status.successCount || 0;
  const failCount = status.failCount || 0;
  const remainingCount = status.remainingCount || 0;
  const currentBarber = status.currentBarber;
  const results = status.results || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="card max-w-2xl w-full p-6 space-y-5 border border-amber-500/40 shadow-2xl bg-surface-200/95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-500/40 flex items-center justify-center">
              <PhoneCall className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Live AI Announcement Broadcast</h3>
                {isActive && !isPaused && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </span>
                    DIALING LIVE
                  </span>
                )}
                {isActive && isPaused && (
                  <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    PAUSED
                  </span>
                )}
                {isStopped && (
                  <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    STOPPED
                  </span>
                )}
                {!isActive && status.completedAt && (
                  <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    COMPLETED
                  </span>
                )}
              </div>
              <p className="text-2xs text-white/50 mt-0.5 flex items-center gap-2">
                <span>Official Caller ID: <strong className="text-amber-300 font-mono">+91 94294 92250</strong></span>
                <span>•</span>
                <span>Agent: <strong className="text-white/80">Riya (QUTTR V3)</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/60 hover:text-white transition-all cursor-pointer"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/60 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Live Target Banner */}
        {isActive && currentBarber ? (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-black font-extrabold flex items-center justify-center text-xs animate-pulse">
                {current}
              </div>
              <div>
                <p className="text-2xs text-amber-300 uppercase tracking-wider font-semibold">Currently Dialing</p>
                <p className="text-xs font-bold text-white">{currentBarber.name} <span className="font-mono text-amber-200">({currentBarber.phone})</span></p>
                <p className="text-2xs text-white/60">{currentBarber.shopName || 'QUTTR Barber Shop'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400 text-2xs font-medium bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Placing AI Call...</span>
            </div>
          </div>
        ) : null}

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-2xs text-white/70">
            <span>Progress: <strong className="text-white">{current}</strong> of <strong className="text-white">{total}</strong> Barbers</span>
            <span className="font-mono font-bold text-amber-300">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden p-0.5 border border-white/[0.04]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
            <p className="text-2xs text-white/50 uppercase">Total</p>
            <p className="text-base font-extrabold text-white mt-0.5">{total}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-2xs text-emerald-400 uppercase">Success</p>
            <p className="text-base font-extrabold text-emerald-400 mt-0.5">{successCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
            <p className="text-2xs text-rose-400 uppercase">Failed</p>
            <p className="text-base font-extrabold text-rose-400 mt-0.5">{failCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
            <p className="text-2xs text-white/50 uppercase">Remaining</p>
            <p className="text-base font-extrabold text-white/80 mt-0.5">{remainingCount}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {isActive && !isPaused && (
              <button
                type="button"
                onClick={() => onControl('pause')}
                disabled={isActionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" /> Pause
              </button>
            )}
            {isActive && isPaused && (
              <button
                type="button"
                onClick={() => onControl('resume')}
                disabled={isActionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" /> Resume
              </button>
            )}
            {isActive && (
              <button
                type="button"
                onClick={() => onControl('stop')}
                disabled={isActionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-rose-300" /> Stop Campaign
              </button>
            )}
          </div>

          {!isActive && onStartNew && (
            <button
              type="button"
              onClick={onStartNew}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-black shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Start New Broadcast
            </button>
          )}
        </div>

        {/* Real-time Call Stream Log */}
        <div className="flex-1 overflow-hidden flex flex-col space-y-2 pt-2 border-t border-white/[0.08]">
          <div className="flex items-center justify-between text-2xs text-white/60">
            <span className="font-semibold uppercase tracking-wider">Live Call Activity Feed</span>
            <span>{results.length} Recorded</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-56">
            {results.length === 0 ? (
              <div className="text-center py-8 text-white/40 text-xs">
                No calls dispatched yet. Start a campaign to see live sequential calls here.
              </div>
            ) : (
              results.map((log, idx) => (
                <div
                  key={`${log.phone}_${idx}`}
                  className="p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xs font-mono text-white/40 w-5">#{log.index || results.length - idx}</span>
                    <div>
                      <p className="font-bold text-white text-xs leading-none">
                        {log.name}{' '}
                        <span className="font-mono text-2xs text-white/50 ml-1">{log.phone}</span>
                      </p>
                      <p className="text-2xs text-white/40 mt-1 leading-none">{log.shopName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {log.status === 'dialing' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" /> Dialing
                      </span>
                    )}
                    {log.status === 'success' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Dispatched
                      </span>
                    )}
                    {log.status === 'failed' && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        title={log.error}
                      >
                        <AlertCircle className="w-2.5 h-2.5 text-rose-400" /> Failed
                      </span>
                    )}
                    <span className="font-mono text-2xs text-white/40">{log.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

