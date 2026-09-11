'use client';

import React from 'react';
import { 
  RefreshCw, 
  Edit, 
  Trash2, 
  MessageSquare,
  UserX,
  Calendar,
  ArrowRightLeft
} from 'lucide-react';
import { Subscription } from '@/types/subscription';
import { formatDate, formatCurrency, getDaysLeftLabel, getMonthlyEquivalent, getWarrantyInfo } from '@/lib/utils';
import { generateGoogleCalendarUrl } from '@/lib/calendar';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onOpenChecklist: (sub: Subscription) => void;
  onOpenWhatsAppModal: (sub: Subscription) => void;
  onEdit: (sub: Subscription) => void;
  onRequestDelete: (sub: Subscription) => void;
  onQuickRenew: (sub: Subscription) => void;
  onRequestTerminate: (sub: Subscription) => void;
  onMoveMemberPool?: (sub: Subscription) => void;
}

export const SubscriptionTable: React.FC<SubscriptionTableProps> = ({
  subscriptions,
  onOpenChecklist,
  onOpenWhatsAppModal,
  onEdit,
  onRequestDelete,
  onQuickRenew,
  onRequestTerminate,
  onMoveMemberPool,
}) => {
  return (
    <div className="bezel-shell overflow-hidden">
      <div className="bezel-core overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/40 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
              <th className="py-3.5 px-4">Member & Layanan</th>
              <th className="py-3.5 px-4">Pool / Slot</th>
              <th className="py-3.5 px-4">Email Akun</th>
              <th className="py-3.5 px-4">Jatuh Tempo</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Biaya</th>
              <th className="py-3.5 px-4">Checklist Kick</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {subscriptions.map((sub) => {
              const badge = getDaysLeftLabel(sub.endDate, sub.status);
              const warranty = getWarrantyInfo(sub.billingCycle);
              const completedCount = sub.checklist.filter(i => i.completed).length;
              const totalCount = sub.checklist.length;

              return (
                <tr
                  key={sub.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {/* Member & Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-xl ${sub.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs`}>
                        {sub.provider.charAt(0)}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 dark:text-white">
                          {sub.memberName || 'Member'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400">
                            {sub.name}
                          </span>
                          <span className={`eyebrow-pill text-[8px] py-0 px-1.5 ring-1 ${warranty.badgeClass}`}>
                            {warranty.shortBadge}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Pool */}
                  <td className="py-3.5 px-4">
                    <div className="text-slate-700 dark:text-slate-300 font-bold">
                      {sub.poolName || '-'}
                    </div>
                    {sub.slotNumber && (
                      <span className="text-[10px] text-slate-400">Slot #{sub.slotNumber}</span>
                    )}
                  </td>

                  {/* Email */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {sub.accountEmail}
                  </td>

                  {/* End Date */}
                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{formatDate(sub.endDate)}</span>
                      <a
                        href={generateGoogleCalendarUrl(sub)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Tambah Pengingat ke Google Calendar"
                        className="p-1 rounded-md text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                      >
                        <Calendar className="h-3 w-3" />
                      </a>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    <span className={`eyebrow-pill ${badge.bgColor} ${badge.color} ring-1 ${badge.borderColor}`}>
                      {badge.label}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                    <div>{formatCurrency(sub.price, sub.currency)}</div>
                    {sub.billingCycle !== 'monthly' && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block whitespace-nowrap">
                        ~{formatCurrency(getMonthlyEquivalent(sub.price, sub.billingCycle), sub.currency)}/bln
                      </span>
                    )}
                  </td>

                  {/* Checklist */}
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => onOpenChecklist(sub)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      {completedCount}/{totalCount} selesai
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* WhatsApp trigger */}
                      <button
                        type="button"
                        onClick={() => onOpenWhatsAppModal(sub)}
                        title="Kirim WA Tagihan"
                        className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>

                      {/* Quick renew */}
                      <button
                        type="button"
                        onClick={() => onQuickRenew(sub)}
                        title="Perpanjang Masa Aktif"
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>

                      {/* Pindah Pool */}
                      {onMoveMemberPool && (
                        <button
                          type="button"
                          onClick={() => onMoveMemberPool(sub)}
                          title="Pindahkan ke Pool Lain"
                          className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </button>
                      )}

                      {/* Kick / Terminate */}
                      <button
                        type="button"
                        onClick={() => onRequestTerminate(sub)}
                        title="Kick & Simpan ke Arsip"
                        className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                      >
                        <UserX className="h-4 w-4" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => onEdit(sub)}
                        title="Edit Data"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onRequestDelete(sub)}
                        title="Hapus"
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
