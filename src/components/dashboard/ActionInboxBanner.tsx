'use client';

import React from 'react';
import { 
  AlertOctagon, 
  CheckCircle, 
  RefreshCw, 
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  UserX,
  Send
} from 'lucide-react';
import { Subscription } from '@/types/subscription';
import { getDaysRemaining, formatCurrency } from '@/lib/utils';

interface ActionInboxBannerProps {
  urgentSubscriptions: Subscription[];
  onOpenWhatsAppModal: (sub: Subscription) => void;
  onToggleChecklistItem: (subId: string, itemId: string) => void;
  onRequestTerminate: (sub: Subscription) => void;
  onQuickRenew: (sub: Subscription) => void;
}

export const ActionInboxBanner: React.FC<ActionInboxBannerProps> = ({
  urgentSubscriptions,
  onOpenWhatsAppModal,
  onToggleChecklistItem,
  onRequestTerminate,
  onQuickRenew,
}) => {
  if (urgentSubscriptions.length === 0) {
    return (
      <div className="bezel-shell mb-8">
        <div className="bezel-core p-6 flex items-center justify-between bg-emerald-500/5 border-emerald-500/20">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Semua Slot Bersih & Terkelola! 🎉
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tidak ada member expired yang menggantung di Google Family / Admin Console saat ini.
              </p>
            </div>
          </div>
          <span className="eyebrow-pill bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
            All Pools Clean
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-600/25">
            <AlertOctagon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Kick Action Required
              <span className="eyebrow-pill bg-rose-500 text-white shadow-xs">
                {urgentSubscriptions.length} Member Expired
              </span>
            </h2>
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
          Akses Google/Canva member harus dicabut manual oleh Admin
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {urgentSubscriptions.map((sub) => {
          const daysLeft = getDaysRemaining(sub.endDate);
          const completedCount = sub.checklist.filter(c => c.completed).length;
          const totalCount = sub.checklist.length;
          const allCompleted = totalCount > 0 && completedCount === totalCount;

          return (
            <div key={sub.id} className="bezel-shell ring-1 ring-rose-500/30 shadow-lg shadow-rose-500/5">
              <div className="bezel-core p-5 sm:p-6 bg-gradient-to-br from-white to-rose-50/20 dark:from-slate-900 dark:to-rose-950/15">
                {/* Top Row: Provider Logo, Member Name, Days Left Pill, Price */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className={`h-12 w-12 rounded-2xl ${sub.avatarColor || 'bg-red-500'} flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0 ring-2 ring-white/10`}>
                      {sub.provider.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {sub.memberName || 'Member'}
                        </h3>
                        <span className="text-xs font-bold text-slate-400">
                          ({sub.name})
                        </span>
                        <span className="eyebrow-pill bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20">
                          {daysLeft < 0 ? `Expired (${Math.abs(daysLeft)}d lalu)` : daysLeft === 0 ? 'Expired Hari Ini' : `${daysLeft}d left`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span>Email: <strong className="text-slate-800 dark:text-slate-200">{sub.accountEmail}</strong></span>
                        {sub.poolName && (
                          <span>• Pool: <strong className="text-slate-800 dark:text-slate-200">{sub.poolName}</strong></span>
                        )}
                        {sub.slotNumber && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            Slot #{sub.slotNumber}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {formatCurrency(sub.price, sub.currency)}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">/{sub.billingCycle}</span>
                  </div>
                </div>

                {/* Warning Callout Box for Admin Action */}
                <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
                      <strong>⚠️ Akses belum dicabut dari sistem!</strong> Member ini masih bisa memakai kuota/lisensi. Buka console penyedia layanan untuk kick email member atau hubungi via WhatsApp untuk tagihan.
                    </div>
                  </div>

                  {sub.serviceUrl && (
                    <a
                      href={sub.serviceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-extrabold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0 transition-all cursor-pointer shadow-xs"
                    >
                      <span>Buka Console</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Admin Checklist Items */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    <span>Tindakan Admin:</span>
                    <span className="text-slate-400 font-semibold">
                      {completedCount} of {totalCount} selesai
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {sub.checklist.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          item.completed 
                            ? 'bg-slate-100/50 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800 text-slate-400 line-through' 
                            : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-400 shadow-xs'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => onToggleChecklistItem(sub.id, item.id)}
                          className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                        />
                        <span className="leading-snug">{item.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Buttons (Button-in-Button Architecture) */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {/* WhatsApp 1-Click Trigger */}
                    <button
                      type="button"
                      onClick={() => onOpenWhatsAppModal(sub)}
                      className="group flex items-center gap-1.5 pl-3.5 pr-1.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 ring-1 ring-emerald-500/30 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <span>Kirim WA Tagihan</span>
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center transition-transform group-hover:scale-110">
                        <Send className="h-3 w-3" />
                      </div>
                    </button>

                    {sub.serviceUrl && (
                      <a
                        href={sub.serviceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="md:hidden inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        <ExternalLink className="h-3 w-3" /> Console
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Perpanjang / Renew Period */}
                    <button
                      type="button"
                      onClick={() => onQuickRenew(sub)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Perpanjang Member
                    </button>

                    {/* Kick & Terminate Button */}
                    <button
                      type="button"
                      onClick={() => onRequestTerminate(sub)}
                      className={`group flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full text-xs font-bold text-white transition-all active:scale-[0.98] shadow-md cursor-pointer ${
                        allCompleted
                          ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25 ring-2 ring-emerald-400/40'
                          : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25'
                      }`}
                    >
                      <span>{allCompleted ? '✓ Kick Selesai (Kosongkan Slot)' : 'Kick & Kosongkan Slot'}</span>
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
                        {allCompleted ? <CheckCircle className="h-3.5 w-3.5 text-white" /> : <UserX className="h-3.5 w-3.5 text-white" />}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
