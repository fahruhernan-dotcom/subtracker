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
  Sparkles
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
      <div className="bezel-core p-4 sm:p-5 space-y-4">
        
        {/* ROW 1: HEADER (Avatar + Pool Name + Days Left Countdown Badge) */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`h-10 w-10 rounded-2xl ${sub.avatarColor || 'bg-blue-600'} text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white/20 dark:ring-black/20`}>
              {sub.provider.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {sub.provider}
                </span>
                {sub.poolName && (
                  <span className="eyebrow-pill bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700 text-[9px] truncate max-w-[140px]">
                    {sub.poolName}
                  </span>
                )}
                <span className={`eyebrow-pill text-[9px] py-0 px-1.5 ring-1 ${warranty.badgeClass}`}>
                  {warranty.shortBadge}
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white truncate mt-0.5" title={sub.memberName || sub.name}>
                {sub.memberName || sub.name}
              </h3>
            </div>
          </div>

          {/* Countdown Pill Badge */}
          <div className="shrink-0 flex items-center gap-1">
            <span className={`eyebrow-pill text-[10px] font-black ring-1 ${badge.colorClass}`}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* ROW 2: MEMBER EMAIL & PHONE */}
        <div className="flex items-center justify-between text-xs py-1 border-y border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 min-w-0 text-slate-600 dark:text-slate-400">
            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium select-all" title={sub.accountEmail}>
              {sub.accountEmail}
            </span>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
              title="Salin Email"
            >
              {copiedEmail ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>

          {sub.clientPhone && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0 pl-2">
              <Phone className="h-3 w-3 text-slate-400" />
              <span className="font-mono">{sub.clientPhone}</span>
            </div>
          )}
        </div>

        {/* ROW 3: FINANCIAL & EXPIRY SCHEDULE BOX */}
        <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
              Tagihan Slot
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                {formatCurrency(sub.price, sub.currency)}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                / {getCycleLabel(sub.billingCycle)}
              </span>
            </div>
            {sub.billingCycle !== 'monthly' && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                ~{formatCurrency(getMonthlyEquivalent(sub.price, sub.billingCycle), sub.currency)}/bln
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider flex items-center justify-end gap-1">
              <Calendar className="h-3 w-3" />
              <span>Jatuh Tempo</span>
            </span>
            <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
              {formatDate(sub.endDate)}
            </span>
          </div>
        </div>

        {/* ROW 4: KICK CHECKLIST MICRO-BAR */}
        <div 
          onClick={() => onOpenChecklist(sub)}
          className="p-2.5 rounded-xl bg-slate-100/70 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 cursor-pointer transition-colors space-y-1.5"
          title="Klik untuk buka SOP Checklist Kick Admin"
        >
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
              <span>SOP Kick Admin ({completedTasks}/{totalTasks})</span>
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {completedTasks === totalTasks ? 'Selesai 100% ✅' : `${Math.round(progressPercent)}%`}
            </span>
          </div>

          {/* Progress bar track */}
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 rounded-full ${
                completedTasks === totalTasks 
                  ? 'bg-emerald-500' 
                  : completedTasks > 0 
                  ? 'bg-blue-500' 
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ROW 5: FOOTER ACTION BAR */}
        <div className="flex items-center justify-between pt-1 gap-2">
          
          {/* Left Actions (WhatsApp & History Log Drawer Toggle) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenWhatsAppModal(sub)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs ring-1 ring-emerald-500/20 transition-all cursor-pointer"
              title="Kirim pesan WhatsApp tagihan / konfirmasi"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isHistoryExpanded
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              title="Lihat riwayat audit trail member"
            >
              <History className="h-3.5 w-3.5" />
              <span>Riwayat</span>
              {memberLogs.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  isHistoryExpanded ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {memberLogs.length}
                </span>
              )}
              {isHistoryExpanded ? <ChevronUp className="h-3 w-3 ml-0.5" /> : <ChevronDown className="h-3 w-3 ml-0.5" />}
            </button>
          </div>

          {/* Right Actions (Quick Renew & Dropdown) */}
          <div className="flex items-center gap-1.5 relative">
            <button
              type="button"
              onClick={() => onQuickRenew(sub)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              title="Perpanjang masa aktif slot"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Perpanjang</span>
            </button>

            {/* Dropdown Menu Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 bottom-full mb-1 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-1 text-xs animate-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onEdit(sub); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                    >
                      <Edit className="h-3.5 w-3.5 text-blue-500" />
                      <span>Edit Data Member</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onOpenChecklist(sub); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Checklist SOP Kick</span>
                    </button>

                    <a
                      href={generateGoogleCalendarUrl(sub)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                    >
                      <Calendar className="h-3.5 w-3.5 text-amber-500" />
                      <span>Sync ke Google Calendar</span>
                    </a>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onRequestTerminate(sub); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-medium"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      <span>Kick / Putus Akses</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onRequestDelete(sub); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-medium"
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
