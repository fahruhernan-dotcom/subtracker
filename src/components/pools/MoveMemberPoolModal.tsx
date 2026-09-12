'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  Layers, 
  Clock, 
  AlertTriangle, 
  Sparkles,
  Info
} from 'lucide-react';
import { Subscription, AccountPool, BillingCycle } from '@/types/subscription';
import { formatDate, getDaysRemaining, getPoolTierInfo, cn } from '@/lib/utils';
import { addMonths, parseISO, format, isValid } from 'date-fns';

interface MoveMemberPoolModalProps {
  subscription: Subscription | null;
  pools: AccountPool[];
  subscriptions: Subscription[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmMove: (
    sub: Subscription,
    targetPool: AccountPool,
    transferOption: 'keep_dates' | 'renew',
    newDurationMonths?: number,
    newBillingCycle?: BillingCycle,
    renewalPrice?: number
  ) => void;
}

const RENEW_OPTIONS: { months: number; label: string; cycle: BillingCycle }[] = [
  { months: 1, label: '1 Bulan (Monthly)', cycle: 'monthly' },
  { months: 2, label: '2 Bulan', cycle: 'monthly' },
  { months: 3, label: '3 Bulan (Quarterly)', cycle: 'quarterly' },
  { months: 6, label: '6 Bulan (Semi-Annual)', cycle: 'semi_annual' },
  { months: 12, label: '1 Tahun (Yearly)', cycle: 'yearly' },
];

export const MoveMemberPoolModal: React.FC<MoveMemberPoolModalProps> = ({
  subscription: sub,
  pools,
  subscriptions,
  isOpen,
  onClose,
  onConfirmMove,
}) => {
  const [selectedTargetPoolId, setSelectedTargetPoolId] = useState<string>('');
  const [transferOption, setTransferOption] = useState<'keep_dates' | 'renew'>('keep_dates');
  const [renewMonths, setRenewMonths] = useState<number>(1);
  const [renewalPrice, setRenewalPrice] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-select pool when modal opens
  useEffect(() => {
    if (isOpen && sub) {
      // Find candidate pools that have slots available and are not the current pool
      const candidates = pools.filter(p => {
        const isCurrent = p.id === sub.poolId;
        const daysLeft = getDaysRemaining(p.masterEndDate);
        if (daysLeft < 0) return false;
        const occupied = subscriptions.filter(
          s => (s.poolId === p.id || s.poolName?.toLowerCase() === p.name.toLowerCase()) && s.status !== 'TERMINATED'
        ).length;
        const available = Math.max(0, p.totalCapacity - occupied);
        return !isCurrent && available > 0;
      });

      if (candidates.length > 0) {
        setSelectedTargetPoolId(candidates[0].id);
      } else {
        setSelectedTargetPoolId('');
      }

      // Set initial price for renewal
      setRenewalPrice(Number(sub.price) || 0);

      // If member is terminated or expired, default to 'renew'
      if (sub.status === 'TERMINATED' || getDaysRemaining(sub.endDate) < 0) {
        setTransferOption('renew');
      } else {
        setTransferOption('keep_dates');
      }
    }
  }, [isOpen, sub, pools, subscriptions]);

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !sub) return null;

  // Pools with calculated availability
  const poolsWithAvailability = pools.map(p => {
    const occupied = subscriptions.filter(
      s => (s.poolId === p.id || s.poolName?.toLowerCase() === p.name.toLowerCase()) && s.status !== 'TERMINATED'
    ).length;
    const availableSlots = Math.max(0, p.totalCapacity - occupied);
    const tierInfo = getPoolTierInfo(p);
    const isCurrentPool = p.id === sub.poolId;

    return {
      pool: p,
      occupied,
      availableSlots,
      tierInfo,
      isCurrentPool,
    };
  });

  const selectedTarget = poolsWithAvailability.find(p => p.pool.id === selectedTargetPoolId);

  // Calculate new prospective end date
  let prospectiveEndDate = sub.endDate;
  if (transferOption === 'renew') {
    try {
      const baseDate = sub.status === 'TERMINATED' || getDaysRemaining(sub.endDate) < 0
        ? new Date()
        : parseISO(sub.endDate);
      const calculated = addMonths(isValid(baseDate) ? baseDate : new Date(), renewMonths);
      prospectiveEndDate = format(calculated, 'yyyy-MM-dd');
    } catch {
      prospectiveEndDate = sub.endDate;
    }
  }

  // Check compatibility
  const selectedOptionObj = RENEW_OPTIONS.find(o => o.months === renewMonths);
  const targetDaysLeft = selectedTarget ? getDaysRemaining(selectedTarget.pool.masterEndDate) : 0;
  const isTargetShortTerm = targetDaysLeft < 180;
  const isSelectedDurationTooLong = transferOption === 'renew' && renewMonths >= 6 && isTargetShortTerm;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarget) return;

    setIsSubmitting(true);
    const cycle = selectedOptionObj?.cycle || sub.billingCycle;
    onConfirmMove(
      sub,
      selectedTarget.pool,
      transferOption,
      transferOption === 'renew' ? renewMonths : undefined,
      cycle,
      transferOption === 'renew' ? renewalPrice : undefined
    );
    setIsSubmitting(false);
    onClose();
  };

  const isTerminated = sub.status === 'TERMINATED';

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
        <div className="bezel-core p-6 flex flex-col justify-between max-h-[92vh] overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 flex items-center justify-center shadow-sm shrink-0">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Pindah Pool Member</span>
                  {isTerminated && (
                    <span className="eyebrow-pill text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 font-bold">
                      Re-aktivasi
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pindahkan slot akun member ke pool baru tanpa kehilangan histori & data kontak.
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

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="py-4 space-y-4 overflow-y-auto text-xs flex-1">
            
            {/* Member Profile Summary Box */}
            <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Member yang Dipindahkan
                </span>
                <div className="font-black text-sm text-slate-900 dark:text-white">
                  {sub.memberName || 'Member'}
                </div>
                <div className="font-mono text-slate-500 dark:text-slate-400 text-xs">
                  {sub.accountEmail} {sub.clientPhone ? `• ${sub.clientPhone}` : ''}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Pool Saat Ini
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                  {sub.poolName || 'Belum Masuk Pool'}
                </span>
                <span className={cn(
                  "eyebrow-pill text-[9px] mt-1 inline-block",
                  isTerminated 
                    ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                )}>
                  {isTerminated ? 'Status: Sudah Di-kick' : `Exp: ${formatDate(sub.endDate)}`}
                </span>
              </div>
            </div>

            {/* Re-activation Notice if Terminated */}
            {isTerminated && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/25 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
                  <strong>✨ Re-aktivasi Otomatis:</strong> Member ini sebelumnya berstatus <em>Sudah Di-kick</em>. Memindahkannya ke pool tujuan akan otomatis mengembalikan statusnya menjadi <strong>Aktif</strong> dan mengisi 1 slot di pool tujuan.
                </div>
              </div>
            )}

            {/* Target Pool Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Pilih Pool Tujuan (Tersedia):
              </label>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {poolsWithAvailability.map(({ pool: p, availableSlots, tierInfo, isCurrentPool }) => {
                  const isSelected = p.id === selectedTargetPoolId;
                  const isExpired = tierInfo.isExpiredInactive;
                  const isDisabled = isCurrentPool || isExpired || availableSlots === 0;

                  return (
                    <div
                      key={p.id}
                      onClick={() => !isDisabled && setSelectedTargetPoolId(p.id)}
                      className={cn(
                        "p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3",
                        isSelected
                          ? "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/30 dark:bg-blue-950/20"
                          : isDisabled
                          ? "opacity-50 bg-slate-50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800 cursor-not-allowed"
                          : "bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "h-9 w-9 rounded-xl flex items-center justify-center text-white shrink-0 font-bold",
                          p.avatarColor || 'bg-blue-600'
                        )}>
                          <Layers className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-900 dark:text-white truncate">
                              {p.name}
                            </span>
                            {isCurrentPool && (
                              <span className="eyebrow-pill text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                Pool Asal
                              </span>
                            )}
                            <span className={cn("eyebrow-pill text-[8px] font-black", tierInfo.badgeClass)}>
                              {tierInfo.badgeLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="font-mono">{p.masterEmail}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getDaysRemaining(p.masterEndDate)}d lagi
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isExpired ? (
                          <span className="text-[11px] font-black text-rose-500">🔴 Expired</span>
                        ) : availableSlots === 0 ? (
                          <span className="text-[11px] font-black text-amber-500">Slot Penuh</span>
                        ) : (
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {availableSlots} slot kosong
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {poolsWithAvailability.filter(p => !p.isCurrentPool && !p.tierInfo.isExpiredInactive && p.availableSlots > 0).length === 0 && (
                <p className="text-xs text-rose-500 font-bold p-2 text-center">
                  ⚠️ Tidak ada pool aktif lain yang memiliki slot kosong saat ini. Buat pool baru terlebih dahulu.
                </p>
              )}
            </div>

            {/* Transfer Mode & Duration Options */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Opsi Durasi & Masa Aktif di Pool Baru:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Option A: Keep current dates */}
                <div
                  onClick={() => setTransferOption('keep_dates')}
                  className={cn(
                    "p-3 rounded-2xl border transition-all cursor-pointer",
                    transferOption === 'keep_dates'
                      ? "border-blue-500 bg-blue-500/5 ring-1.5 ring-blue-500/30 dark:bg-blue-950/20"
                      : "bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      Pertahankan Masa Aktif
                    </span>
                    <input
                      type="radio"
                      name="transferOption"
                      checked={transferOption === 'keep_dates'}
                      onChange={() => setTransferOption('keep_dates')}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Tanggal expired tetap sama ({formatDate(sub.endDate)}). Cocok untuk migrasi darurat / rebalancing akun induk.
                  </p>
                </div>

                {/* Option B: Renew / reset duration */}
                <div
                  onClick={() => setTransferOption('renew')}
                  className={cn(
                    "p-3 rounded-2xl border transition-all cursor-pointer",
                    transferOption === 'renew'
                      ? "border-blue-500 bg-blue-500/5 ring-1.5 ring-blue-500/30 dark:bg-blue-950/20"
                      : "bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      Sekaligus Perpanjang Durasi
                    </span>
                    <input
                      type="radio"
                      name="transferOption"
                      checked={transferOption === 'renew'}
                      onChange={() => setTransferOption('renew')}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Reset masa aktif baru. Cocok jika member sekalian melakukan pembayaran perpanjangan sewa.
                  </p>
                </div>
              </div>

              {/* Duration buttons if 'renew' selected */}
              {transferOption === 'renew' && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2 animate-in fade-in duration-150">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pilih Paket Durasi Tambahan:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {RENEW_OPTIONS.map((opt) => (
                      <button
                        key={opt.months}
                        type="button"
                        onClick={() => setRenewMonths(opt.months)}
                        className={cn(
                          "py-2 px-2 text-center rounded-xl font-extrabold text-xs transition-all cursor-pointer",
                          renewMonths === opt.months
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                        )}
                      >
                        {opt.months} Bln
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                    <span>Masa Aktif Baru:</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                      s/d {formatDate(prospectiveEndDate)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      Nominal Kas Perpanjangan (IDR):
                    </span>
                    <div className="relative flex-1 max-w-[150px]">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={renewalPrice}
                        onChange={(e) => setRenewalPrice(Number(e.target.value) || 0)}
                        className="w-full pl-8 pr-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs text-right text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Warning if 6+ months chosen for short-term pool */}
              {isSelectedDurationTooLong && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-snug font-medium">
                    <strong>Peringatan Tier:</strong> Pool tujuan memiliki sisa masa aktif &lt; 180 hari ({targetDaysLeft}d). Sebaiknya gunakan paket 2-3 bulan (Akun Lepas) atau pilih pool yang memiliki garansi perpanjangan &gt;= 6 bulan.
                  </p>
                </div>
              )}
            </div>

            {/* Informational Callout */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800 flex items-start gap-2.5 text-slate-500 dark:text-slate-400 text-[11px]">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                Memindahkan member akan mengosongkan 1 slot di pool lama dan mengisi 1 slot di pool baru. Nomor WhatsApp, email akun, dan riwayat aktivitas member tetap tersimpan utuh di sistem.
              </div>
            </div>

          </form>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedTarget || isSubmitting}
              className={cn(
                "group flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full text-xs font-bold text-white shadow-md transition-all active:scale-[0.98] cursor-pointer",
                !selectedTarget || isSubmitting
                  ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25"
              )}
            >
              <span>{isTerminated ? '✓ Re-aktivasi & Pindah Pool' : '✓ Konfirmasi Pindah Pool'}</span>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
                <ArrowRightLeft className="h-3.5 w-3.5 text-white" />
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
