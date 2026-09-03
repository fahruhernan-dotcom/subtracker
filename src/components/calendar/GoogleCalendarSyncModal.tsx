'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ExternalLink, 
  Download, 
  Copy, 
  Check, 
  X, 
  Sparkles, 
  ShieldCheck, 
  BellRing,
  HelpCircle,
  Layers,
  Users
} from 'lucide-react';
import { Subscription, AccountPool } from '@/types/subscription';
import { 
  TARGET_GOOGLE_CALENDAR_ID, 
  TARGET_ICAL_FEED_URL, 
  downloadMasterIcsFile 
} from '@/lib/calendar';

interface GoogleCalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
  pools: AccountPool[];
}

export const GoogleCalendarSyncModal: React.FC<GoogleCalendarSyncModalProps> = ({
  isOpen,
  onClose,
  subscriptions,
  pools,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Escape key listener to close modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeCount = subscriptions.filter(s => s.status !== 'TERMINATED').length;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(TARGET_ICAL_FEED_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMaster = () => {
    downloadMasterIcsFile(subscriptions, pools);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const googleCalDirectUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(TARGET_GOOGLE_CALENDAR_ID)}`;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bezel-shell w-full max-w-xl scale-100 animate-in zoom-in-95 duration-200 cursor-default"
      >
        <div className="bezel-core p-6 flex flex-col justify-between max-h-[90vh] overflow-y-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Google Calendar Live Sync Hub
                  </h3>
                  <span className="eyebrow-pill bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 text-[9px]">
                    Connected
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sinkronisasi jadwal kick member dan jatuh tempo pool langsung ke Google Calendar
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Connected Calendar Info Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Kalender Google Aktif
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                {activeCount} Member • {pools.length} Pool Induk
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 font-mono text-xs break-all text-slate-700 dark:text-slate-300 select-all">
              {TARGET_GOOGLE_CALENDAR_ID}
            </div>

            {/* iCal Feed URL Copy Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                {TARGET_ICAL_FEED_URL}
              </div>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-xs shrink-0"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-blue-500" />}
                <span>{copied ? 'Tersalin!' : 'Salin iCal'}</span>
              </button>
            </div>
          </div>

          {/* Primary Action Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Action 1: Open Google Calendar */}
            <a
              href={googleCalDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-lg shadow-blue-500/25 group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Calendar className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="text-left">
                  <span className="font-extrabold text-xs block">Buka Google Calendar</span>
                  <span className="text-[10px] text-white/80 font-medium">Lihat jadwal di Google</span>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-white/80 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* Action 2: Download Master .ics File */}
            <button
              type="button"
              onClick={handleDownloadMaster}
              className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 transition-all shadow-xs group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Download className="h-4.5 w-4.5" />
                </div>
                <div className="text-left">
                  <span className="font-extrabold text-xs block">Export Master .ics</span>
                  <span className="text-[10px] text-slate-400 font-medium">{activeCount} Member & Pool</span>
                </div>
              </div>
              {downloaded ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Download className="h-4 w-4 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
              )}
            </button>
          </div>

          {/* Quick Guide / Feature List */}
          <div className="space-y-2 text-xs">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BellRing className="h-3.5 w-3.5 text-amber-500" /> Pengingat Otomatis yang Terpasang:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                <span><strong>H-7:</strong> Peringatan awal tagihan member</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <span><strong>H-1:</strong> Siapkan draft WA & kick checklist</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                <span><strong>Hari H:</strong> Wajib kick dari Google Family</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                <span><strong>H-14 Pool:</strong> Perpanjang akun master induk</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
