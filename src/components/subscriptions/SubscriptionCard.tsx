'use client';

import React, { useState } from 'react';
import { 
  MoreVertical, 
  Calendar, 
  RefreshCw, 
  Mail, 
  Trash2, 
  Edit, 
  Download,
  ExternalLink,
  MessageSquare,
  UserX,
  History,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Phone,
  ShieldCheck,
  AlertTriangle,
  Info,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { Subscription, ActivityLog } from '@/types/subscription';
import { formatDate, formatCurrency, getDaysLeftLabel, getMonthlyEquivalent, getWarrantyInfo } from '@/lib/utils';
import { downloadIcsFile, generateGoogleCalendarUrl } from '@/lib/calendar';

interface SubscriptionCardProps {
  subscription: Subscription;
  activityLogs?: ActivityLog[];
  onOpenChecklist: (sub: Subscription) => void;
  onOpenWhatsAppModal: (sub: Subscription) => void;
  onEdit: (sub: Subscription) => void;
  onRequestDelete: (sub: Subscription) => void;
  onQuickRenew: (sub: Subscription) => void;
  onRequestTerminate: (sub: Subscription) => void;
  onMoveMemberPool?: (sub: Subscription) => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription: sub,
  activityLogs = [],
  onOpenChecklist,
  onOpenWhatsAppModal,
  onEdit,
  onRequestDelete,
  onQuickRenew,
  onRequestTerminate,
  onMoveMemberPool,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const badge = getDaysLeftLabel(sub.endDate, sub.status);
  const warranty = getWarrantyInfo(sub.billingCycle);
  const completedTasks = sub.checklist.filter(c => c.completed).length;
  const totalTasks = sub.checklist.length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;

  // Filter logs for this member
  const memberLogs = (activityLogs || []).filter(
    l => l.subscriptionId === sub.id || 
         (l.memberName && sub.memberName && l.memberName.toLowerCase() === sub.memberName.toLowerCase()) ||
         (l.description && sub.memberName && l.description.toLowerCase().includes(sub.memberName.toLowerCase()))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sub.accountEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const getCycleLabel = (cycle: string) => {
    switch (cycle) {
      case 'yearly': return '1 Tahun';
      case 'quarterly': return '3 Bulan';
      case 'semi_annual': return '6 Bulan';
      case 'custom': return 'Custom';
      default: return '1 Bulan';
    }
  };

  return (
    <div className={`bezel-shell transition-all duration-200 hover:shadow-md ${
      sub.status === 'ACTION_REQUIRED' 
        ? 'ring-2 ring-rose-500/50 shadow-rose-500/10' 
        : sub.status === 'EXPIRING_SOON'
        ? 'ring-1.5 ring-amber-500/40 shadow-amber-500/10'
        : 'hover:border-slate-300 dark:hover:border-slate-700'
    }`}>
      <div className="bezel-core p-4 sm:p-5 space-y-3.5">
        
        {/* ROW 1: HEADER (Pool & Warranty Badge on Left, Expiry Countdown & Menu on Right) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
            {sub.poolName ? (
              <span 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700 truncate max-w-[170px]" 
                title={sub.poolName}
              >
                <Layers className="h-3 w-3 text-blue-500 shrink-0" />
                <span className="truncate">{sub.poolName}</span>
              </span>
            ) : (
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 truncate">
                {sub.provider}
              </span>
            )}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap shrink-0 ${warranty.badgeClass}`}>
              {warranty.shortBadge}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border whitespace-nowrap ${badge.colorClass}`}>
              {badge.label}
            </span>

            {/* Quick 3-Dots Action Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Menu Aksi"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-1 text-xs animate-in zoom-in-95 duration-100">
                    {onMoveMemberPool && (
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); onMoveMemberPool(sub); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold cursor-pointer"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        <span>Pindah ke Pool Lain</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onEdit(sub); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5 text-blue-500" />
                      <span>Edit Data Member</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onOpenChecklist(sub); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Checklist SOP Kick</span>
                    </button>

                    <a
                      href={generateGoogleCalendarUrl(sub)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
                    >
                      <Calendar className="h-3.5 w-3.5 text-amber-500" />
                      <span>Sync ke Google Calendar</span>
                    </a>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onRequestTerminate(sub); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-medium cursor-pointer"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      <span>Kick / Putus Akses</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onRequestDelete(sub); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 font-medium cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus Permanen</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ROW 2: MEMBER PROFILE & CONTACT */}
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl ${sub.avatarColor || 'bg-blue-600'} text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700`}>
            {sub.memberName ? sub.memberName.charAt(0).toUpperCase() : sub.provider.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate" title={sub.memberName || sub.name}>
              {sub.memberName || sub.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <Mail className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="truncate font-medium select-all" title={sub.accountEmail}>
                {sub.accountEmail}
              </span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
                title="Salin Email"
              >
                {copiedEmail ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              </button>
              {sub.clientPhone && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 pl-1 border-l border-slate-200 dark:border-slate-700 font-mono">
                  <Phone className="h-2.5 w-2.5" />
                  {sub.clientPhone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ROW 3: FINANCIAL & EXPIRY SCHEDULE BOX */}
        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
              Tagihan Slot
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                {formatCurrency(sub.price, sub.currency)}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                /{getCycleLabel(sub.billingCycle)}
              </span>
            </div>
            {sub.billingCycle !== 'monthly' && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                ~{formatCurrency(getMonthlyEquivalent(sub.price, sub.billingCycle), sub.currency)}/bln
              </span>
            )}
          </div>

          <div className="space-y-0.5 text-right flex flex-col justify-between items-end">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span>Jatuh Tempo</span>
            </span>
            <div>
              <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200 text-xs block">
                {formatDate(sub.endDate)}
              </span>
              <span className={`text-[10px] font-bold ${
                sub.status === 'ACTION_REQUIRED' ? 'text-rose-600 dark:text-rose-400' :
                sub.status === 'EXPIRING_SOON' ? 'text-amber-600 dark:text-amber-400' :
                'text-slate-400'
              }`}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        {/* ROW 4: KICK CHECKLIST MICRO-BAR (Context-Aware) */}
        {sub.status === 'ACTION_REQUIRED' ? (
          <div 
            onClick={() => onOpenChecklist(sub)}
            className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 cursor-pointer transition-all hover:bg-rose-100/80 space-y-1.5"
            title="Klik untuk buka SOP Checklist Kick Admin"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500 animate-pulse shrink-0" />
                <span>Wajib Kick Admin ({completedTasks}/{totalTasks})</span>
              </span>
              <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
                {completedTasks === totalTasks ? 'Selesai 100% ✅' : `${Math.round(progressPercent)}%`}
              </span>
            </div>
            <div className="w-full bg-rose-200/80 dark:bg-rose-900/50 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-rose-600 dark:bg-rose-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : sub.status === 'EXPIRING_SOON' ? (
          <div 
            onClick={() => onOpenChecklist(sub)}
            className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 cursor-pointer transition-all hover:bg-amber-100/80 space-y-1.5"
            title="Klik untuk buka SOP Checklist Kick Admin"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>SOP Kick Disiapkan ({completedTasks}/{totalTasks})</span>
              </span>
              <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                {completedTasks === totalTasks ? 'Selesai 100% ✅' : `${Math.round(progressPercent)}%`}
              </span>
            </div>
            <div className="w-full bg-amber-200/80 dark:bg-amber-900/50 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div 
            onClick={() => onOpenChecklist(sub)}
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/40 cursor-pointer transition-colors text-xs"
            title="Klik untuk buka SOP Checklist Kick Admin"
          >
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px] font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span>SOP Kick Admin</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              <span>{completedTasks === totalTasks ? 'Siap 100% ✅' : `${completedTasks}/${totalTasks} Item`}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-blue-600 dark:text-blue-400 hover:underline">Lihat Checklist</span>
            </div>
          </div>
        )}

        {/* ROW 5: FOOTER ACTION BAR */}
        <div className="flex items-center justify-between pt-1 gap-2">
          {/* Left Actions (WhatsApp & History Log Drawer Toggle) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenWhatsAppModal(sub)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800/60 transition-all cursor-pointer"
              title="Kirim pesan WhatsApp tagihan / konfirmasi"
            >
              <MessageSquare className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                isHistoryExpanded
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title="Lihat riwayat audit trail member"
            >
              <History className="h-3.5 w-3.5" />
              <span>Riwayat</span>
              {memberLogs.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  isHistoryExpanded ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {memberLogs.length}
                </span>
              )}
              {isHistoryExpanded ? <ChevronUp className="h-3 w-3 ml-0.5" /> : <ChevronDown className="h-3 w-3 ml-0.5" />}
            </button>
          </div>

          {/* Right Action (Perpanjang or Re-alokasi) */}
          <div>
            {sub.status === 'TERMINATED' && onMoveMemberPool ? (
              <button
                type="button"
                onClick={() => onMoveMemberPool(sub)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                title="Alokasikan kembali member ini ke pool baru"
              >
                <ArrowRightLeft className="h-3 w-3" />
                <span>Re-alokasi</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onQuickRenew(sub)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                  sub.status === 'ACTION_REQUIRED' || sub.status === 'EXPIRING_SOON'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
                title="Perpanjang masa aktif slot"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Perpanjang</span>
              </button>
            )}
          </div>
        </div>

        {/* EXPANDABLE MEMBER AUDIT TRAIL DRAWER */}
        {isHistoryExpanded && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                <span>Audit Trail & Log Aktivitas ({sub.memberName || sub.name})</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {memberLogs.length} catatan
              </span>
            </div>

            {memberLogs.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic p-3 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl">
                Belum ada catatan aktivitas tercatat untuk member ini.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {memberLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 text-[11px] flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                        {log.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span className="font-mono font-medium">{formatDate(log.timestamp)}</span>
                        <span>•</span>
                        <span className="eyebrow-pill text-[9px] bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {log.actionType}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
