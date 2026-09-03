'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Upload, Database, Trash2, Sparkles } from 'lucide-react';
import { db, resetToDemoData } from '@/lib/db/dexie-db';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => void;
  onRequestClearAll?: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
  onRequestClearAll,
}) => {
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

  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      const [subs, pools, logs] = await Promise.all([
        db.subscriptions.toArray(),
        db.pools.toArray(),
        db.activityLogs.toArray(),
      ]);

      const exportObject = {
        version: 4,
        exportedAt: new Date().toISOString(),
        subscriptions: subs,
        pools: pools,
        activityLogs: logs,
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `subtracker_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error("Export error", err);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (Array.isArray(parsed.subscriptions)) {
          await db.subscriptions.clear();
          await db.subscriptions.bulkPut(parsed.subscriptions);
          
          if (Array.isArray(parsed.pools)) {
            await db.pools.clear();
            await db.pools.bulkPut(parsed.pools);
          }

          if (Array.isArray(parsed.activityLogs)) {
            await db.activityLogs.clear();
            await db.activityLogs.bulkPut(parsed.activityLogs);
          }

          setImportStatus('Data berhasil di-restore!');
          setTimeout(() => {
            onDataRestored();
            onClose();
          }, 1000);
        } else {
          setImportStatus('Format JSON tidak valid.');
        }
      } catch {
        setImportStatus('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = async () => {
    await resetToDemoData();
    setImportStatus('Data contoh/demo berhasil dimuat ulang!');
    setTimeout(() => {
      onDataRestored();
      onClose();
    }, 1000);
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bezel-shell w-full max-w-md scale-100 animate-in zoom-in-95 duration-200 cursor-default"
      >
        <div className="bezel-core p-6 flex flex-col justify-between max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 flex items-center justify-center">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Manajemen Data & Backup
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Backup, restore, atau bersihkan data tracker & pools
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

          {/* Content */}
          <div className="py-4 space-y-4 text-xs">
            {importStatus && (
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 font-bold text-center">
                {importStatus}
              </div>
            )}

            {/* Export section */}
            <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                Export Backup (JSON)
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-3">
                Simpan semua data member, master pool, dan riwayat tindakan ke file JSON.
              </p>
              <button
                type="button"
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] cursor-pointer"
              >
                <Download className="h-4 w-4" /> Download File Backup JSON
              </button>
            </div>

            {/* Import section */}
            <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                Restore dari File Backup
              </h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mb-3">
                Pulihkan data dari file JSON yang pernah Anda export.
              </p>
              <label className="w-full flex items-center justify-center gap-2 py-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold transition-all active:scale-[0.98] cursor-pointer">
                <Upload className="h-4 w-4" /> Pilih File JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick Actions: Clear & Reset Demo */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleResetDemo}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Muat Data Demo
              </button>

              {onRequestClearAll && (
                <button
                  type="button"
                  onClick={() => { onClose(); onRequestClearAll(); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] ring-1 ring-rose-500/20 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Kosongkan Semua Data
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
