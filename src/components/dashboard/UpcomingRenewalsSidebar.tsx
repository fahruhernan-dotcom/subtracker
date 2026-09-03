'use client';

import React from 'react';
import { ChevronRight, Clock, MessageSquare } from 'lucide-react';
import { Subscription } from '@/types/subscription';
import { formatCurrency, getDaysLeftLabel } from '@/lib/utils';

interface UpcomingRenewalsSidebarProps {
  subscriptions: Subscription[];
  onSelectSubscription: (sub: Subscription) => void;
  onOpenWhatsAppModal: (sub: Subscription) => void;
  onViewAll: () => void;
}

export const UpcomingRenewalsSidebar: React.FC<UpcomingRenewalsSidebarProps> = ({
  subscriptions,
  onSelectSubscription,
  onOpenWhatsAppModal,
  onViewAll,
}) => {
  // Sort by days left ascending (excluding terminated)
  const upcoming = subscriptions
    .filter(s => s.status !== 'TERMINATED')
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 5);

  return (
    <div className="bezel-shell">
      <div className="bezel-core p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Jatuh Tempo Terdekat
            </h3>
          </div>
          <button
            onClick={onViewAll}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Lihat Semua
          </button>
        </div>

        <div className="space-y-2.5">
          {upcoming.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center font-medium">
              Tidak ada member jatuh tempo dalam 30 hari.
            </p>
          ) : (
            upcoming.map((sub) => {
              const badge = getDaysLeftLabel(sub.endDate, sub.status);

              return (
                <div
                  key={sub.id}
                  className="group flex items-center justify-between p-3 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 hover:bg-blue-50/60 dark:hover:bg-slate-800 border border-transparent hover:border-blue-200 dark:hover:border-blue-800/60 transition-all cursor-pointer"
                >
                  <div 
                    onClick={() => onSelectSubscription(sub)} 
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <div className={`h-9 w-9 rounded-xl ${sub.avatarColor || 'bg-slate-700'} flex items-center justify-center text-white font-black text-xs shrink-0 ring-1 ring-white/10`}>
                      {sub.provider.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {sub.memberName || sub.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`eyebrow-pill py-0.2 px-1.5 border ${badge.colorClass}`}>
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {formatCurrency(sub.price, sub.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onOpenWhatsAppModal(sub); }}
                      title="Kirim WA"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </button>
                    <ChevronRight 
                      onClick={() => onSelectSubscription(sub)}
                      className="h-4 w-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" 
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={onViewAll}
          className="w-full mt-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        >
          Kelola Semua Member ({subscriptions.length})
        </button>
      </div>
    </div>
  );
};
