'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  RefreshCw, 
  ShieldAlert, 
  ExternalLink,
  UserX,
  Send,
  Calendar,
  Download,
  Clock,
  ArrowRightLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Subscription, ActionChecklistItem } from '@/types/subscription';
import { formatDate } from '@/lib/utils';
import { generateGoogleCalendarUrl, downloadIcsFile } from '@/lib/calendar';

interface ActionChecklistModalProps {
  subscription: Subscription | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSubscription: (updated: Subscription) => void;
  onOpenWhatsAppModal: (sub: Subscription) => void;
  onRequestTerminate: (sub: Subscription) => void;
  onRenew: (sub: Subscription) => void;
  onMoveMemberPool?: (sub: Subscription) => void;
}

export const ActionChecklistModal: React.FC<ActionChecklistModalProps> = ({
  subscription: sub,
  isOpen,
  onClose,
  onUpdateSubscription,
  onOpenWhatsAppModal,
  onRequestTerminate,
  onRenew,
  onMoveMemberPool,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');

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

  if (!isOpen || !sub) return null;

  const completedTasks = sub.checklist.filter(c => c.completed).length;
  const totalTasks = sub.checklist.length;
  const allCompleted = totalTasks > 0 && completedTasks === totalTasks;

  const handleToggleTask = (itemId: string) => {
    const updatedChecklist = sub.checklist.map(item => {
      if (item.id === itemId) {
        const nextState = !item.completed;
        return {
          ...item,
          completed: nextState,
          completedAt: nextState ? new Date().toISOString() : undefined,
        };
      }
      return item;
    });

    onUpdateSubscription({
      ...sub,
      checklist: updatedChecklist,
    });

    if (!sub.checklist.find(c => c.id === itemId)?.completed && completedTasks + 1 === totalTasks) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: ActionChecklistItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      completed: false,
      required: true,
    };

    onUpdateSubscription({
      ...sub,
      checklist: [...sub.checklist, newTask],
    });
    setNewTaskTitle('');
  };

  const handleDeleteTask = (itemId: string) => {
    onUpdateSubscription({
      ...sub,
      checklist: sub.checklist.filter(item => item.id !== itemId),
    });
  };

  const handleTerminateTrigger = () => {
    onClose();
    onRequestTerminate(sub);
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
        className="bezel-shell w-full max-w-lg scale-100 animate-in zoom-in-95 duration-200 cursor-default"
      >
        <div className="bezel-core p-6 flex flex-col justify-between max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20 flex items-center justify-center shadow-sm">
                <UserX className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Checklist Tindakan Kick & Lepas Akses
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {sub.name} • {sub.accountEmail}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="py-4 space-y-4 overflow-y-auto text-xs flex-1">
            {/* Status Alert Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                  <strong className="block mb-0.5">Tindakan Admin Diperlukan</strong>
                  Pastikan akun member ini sudah di-kick dari sistem / family group sebelum menandai slot kosong.
                  <span className="block mt-1 text-[11px] text-amber-800 dark:text-amber-300 font-normal">
                    💡 <em>Catatan:</em> Data profil, no WhatsApp, dan histori transaksi member <strong>tetap tersimpan aman di arsip</strong>.
                  </span>
                </div>
              </div>

              {sub.serviceUrl && (
                <a
                  href={sub.serviceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-extrabold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                >
                  <span>Buka Console</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {/* Member Card Box */}
            <div className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Kontak Member
                </span>
                <div className="font-extrabold text-slate-900 dark:text-white">
                  {sub.memberName} ({sub.clientPhone || 'No WA belum diisi'})
                </div>
              </div>

              <button
                type="button"
                onClick={() => { onClose(); onOpenWhatsAppModal(sub); }}
                className="group flex items-center gap-1.5 pl-3.5 pr-1.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <span>Kirim WA</span>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Send className="h-3 w-3" />
                </div>
              </button>
            </div>

            {/* Expiry & Calendar Quick Reminder Bar */}
            <div className="p-3 rounded-2xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                    Jadwal Jatuh Tempo / Kick
                  </span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {formatDate(sub.endDate)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href={generateGoogleCalendarUrl(sub)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold shadow-xs transition-all cursor-pointer"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Google Calendar</span>
                </a>

                <button
                  type="button"
                  onClick={() => downloadIcsFile(sub)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-extrabold hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <Download className="h-3 w-3" />
                  <span>.ics (Apple/Outlook)</span>
                </button>
              </div>
            </div>

            {/* Checklist Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Checklist Kick & Lepas Akses ({completedTasks}/{totalTasks})
                </h4>
                {allCompleted && (
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Siap dikosongkan
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {sub.checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`group flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      item.completed
                        ? 'bg-slate-100/40 dark:bg-slate-800/30 border-slate-200/40 dark:border-slate-800 text-slate-400 line-through'
                        : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-xs'
                    }`}
                  >
                    <label className="flex items-start gap-2.5 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleTask(item.id)}
                        className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                      />
                      <span className="text-xs leading-normal font-medium">{item.title}</span>
                    </label>

                    <button
                      onClick={() => handleDeleteTask(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Task Form */}
              <form onSubmit={handleAddTask} className="mt-2.5 flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="+ Tambah tindakan manual lainnya..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-100/70 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-transparent focus:border-blue-500 focus:outline-none font-medium"
                />
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 disabled:opacity-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { onClose(); onRenew(sub); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Perpanjang</span>
              </button>

              {onMoveMemberPool && (
                <button
                  type="button"
                  onClick={() => { onClose(); onMoveMemberPool(sub); }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-bold text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
                  title="Pindahkan member ke pool lain"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Pindah Pool</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleTerminateTrigger}
              className={`group flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full text-xs font-bold text-white shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                allCompleted
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25 ring-2 ring-emerald-400/40'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
              }`}
            >
              <span>{allCompleted ? '✓ Kick Selesai (Simpan di Arsip)' : 'Kick & Simpan ke Arsip'}</span>
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
                <UserX className="h-3.5 w-3.5 text-white" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
