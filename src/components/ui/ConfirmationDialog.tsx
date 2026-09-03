'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, CheckCircle2 } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  targetName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  description,
  targetName,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  variant = 'danger',
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

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
        <div className="bezel-core p-6 flex flex-col justify-between">
          {/* Header & Icon */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isDanger 
                ? 'bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20 shadow-sm' 
                : 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 shadow-sm'
            }`}>
              {isDanger ? <Trash2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {description}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Highlight Target Box */}
          {targetName && (
            <div className="mb-5 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="text-slate-400 font-normal">Target:</span>
              <span className="truncate max-w-[240px] text-right font-bold text-rose-600 dark:text-rose-400">
                {targetName}
              </span>
            </div>
          )}

          {/* Actions Button-in-Button */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all active:scale-[0.98] cursor-pointer"
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              className={`group flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full text-xs font-bold text-white transition-all active:scale-[0.98] shadow-md cursor-pointer ${
                isDanger
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
              }`}
            >
              <span>{confirmLabel}</span>
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                {isDanger ? <Trash2 className="h-3.5 w-3.5 text-white" /> : <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
