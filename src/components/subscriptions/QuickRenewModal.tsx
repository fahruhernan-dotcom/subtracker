'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  RotateCw, 
  Check, 
  Clock, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Subscription, AccountPool, BillingCycle } from '@/types/subscription';
import { formatDate, formatDateIndo, formatCurrency } from '@/lib/utils';
import { addMonths, parseISO, format, isValid } from 'date-fns';
import { DatePickerField } from '@/components/ui/DatePickerField';

interface QuickRenewModalProps {
  subscription: Subscription | null;
  pools?: AccountPool[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmRenew: (
    subscription: Subscription,
    newStartDate: string,
    newEndDate: string,
    resetChecklist: boolean
  ) => void;
}

const RENEW_PACKAGES = [
  { id: '1m', label: '1 Bulan', months: 1, cycle: 'monthly' as BillingCycle },
  { id: '2m', label: '2 Bulan', months: 2, cycle: 'monthly' as BillingCycle },
  { id: '3m', label: '3 Bulan', months: 3, cycle: 'quarterly' as BillingCycle },
  { id: '6m', label: '6 Bulan', months: 6, cycle: 'semi_annual' as BillingCycle },
  { id: '12m', label: '1 Tahun', months: 12, cycle: 'yearly' as BillingCycle },
];

export const QuickRenewModal: React.FC<QuickRenewModalProps> = ({
  subscription: sub,
  pools = [],
  isOpen,
  onClose,
  onConfirmRenew,
}) => {
  const initialStart = sub ? sub.endDate : '';
  let initialEnd = '';
  if (sub) {
    try {
      const parsed = parseISO(sub.endDate);
      if (isValid(parsed)) {
        initialEnd = format(addMonths(parsed, 1), 'yyyy-MM-dd');
      }
    } catch {
      initialEnd = sub.endDate;
    }
  }

  const matchedPool = pools.find(p => p.id === sub?.poolId);

  const [selectedDuration, setSelectedDuration] = useState('1m');
  const [newStartDate] = useState(initialStart);
  const [newEndDate, setNewEndDate] = useState(initialEnd);
  const [resetChecklist, setResetChecklist] = useState(true);

  if (!isOpen || !sub) return null;

  const handlePackageSelect = (pkg: typeof RENEW_PACKAGES[0]) => {
    setSelectedDuration(pkg.id);
    try {
      const start = parseISO(newStartDate || sub.endDate);
      if (isValid(start)) {
        const end = addMonths(start, pkg.months);
        setNewEndDate(format(end, 'yyyy-MM-dd'));
      }
    } catch (e) {
      console.error("Error setting package date", e);
    }
  };

  const handlePoolEndSelect = () => {
    if (matchedPool?.masterEndDate) {
      setSelectedDuration('pool_end');
      setNewEndDate(matchedPool.masterEndDate);
    }
  };

  const handleConfirm = () => {
    onConfirmRenew(sub, newStartDate, newEndDate, resetChecklist);
    onClose();
  };

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
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 flex items-center justify-center shadow-sm">
                <RotateCw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Perpanjang Masa Aktif Member
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update tanggal jatuh tempo dan reset checklist tindakan
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

          {/* Body */}
          <div className="py-4 space-y-4 text-xs">
            {/* Member & Service Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Member / Akun
                  </span>
                  <div className="font-extrabold text-slate-900 dark:text-white">
                    {sub.memberName || 'Pelanggan'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {sub.accountEmail} • {sub.name}
                  </div>
                  {matchedPool && (
                    <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                      Pool: {matchedPool.name} (Exp: {formatDate(matchedPool.masterEndDate)})
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Biaya Perpanjangan
                  </span>
                  <div className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {formatCurrency(sub.price, sub.currency)}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Duration Package Selector */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                Pilih Durasi Perpanjangan:
              </label>
              
              <div className="grid grid-cols-5 gap-1.5">
                {RENEW_PACKAGES.map((pkg) => {
                  const isActive = selectedDuration === pkg.id;
                  return (
                    <button
                      type="button"
                      key={pkg.id}
                      onClick={() => handlePackageSelect(pkg)}
                      className={`py-2 px-1 rounded-xl text-center font-black text-[11px] transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {pkg.label}
                    </button>
                  );
                })}
              </div>

              {/* Sampai Akun Google Pool Berakhir */}
              {matchedPool?.masterEndDate && (
                <button
                  type="button"
                  onClick={handlePoolEndSelect}
                  className={`w-full py-2 px-3 rounded-xl flex items-center justify-between font-bold text-xs transition-all cursor-pointer border ${
                    selectedDuration === 'pool_end'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md shadow-blue-500/25'
                      : 'bg-blue-500/10 hover:bg-blue-500/15 text-blue-800 dark:text-blue-200 border-blue-500/30'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Sampai Akun Google Pool Berakhir</span>
                  </div>
                  <span className="text-[11px] font-extrabold bg-white/20 px-2 py-0.5 rounded">
                    Hingga {formatDateIndo(matchedPool.masterEndDate)}
                  </span>
                </button>
              )}
            </div>

            {/* Custom Expiry Date Adjustment */}
            <div className="pt-1">
              <DatePickerField
                label="Sesuaikan Tanggal Jatuh Tempo Baru"
                required
                variant="expiry"
                value={newEndDate}
                onChange={(val) => {
                  setNewEndDate(val);
                  setSelectedDuration('');
                }}
                relativeDate={newStartDate}
                poolEndDate={matchedPool?.masterEndDate}
                showCalendarSync={true}
                subscription={sub}
                quickPresets={[
                  { label: '+1 Bln', months: 1 },
                  { label: '+3 Bln', months: 3 },
                  { label: '+6 Bln', months: 6 },
                  { label: '+1 Thn', months: 12 },
                  ...(matchedPool?.masterEndDate ? [{ label: 'Pool End', isPoolEnd: true }] : []),
                ]}
              />
            </div>

            {/* Period Comparison Card */}
            <div className="p-3.5 rounded-2xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Perbandingan Periode Masa Aktif:
              </div>

              <div className="flex items-center justify-between text-xs font-medium">
                <div>
                  <span className="text-slate-400 block text-[10px]">Periode Sekarang:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {formatDate(sub.startDate)} - {formatDate(sub.endDate)}
                  </span>
                </div>

                <ArrowRight className="h-4 w-4 text-blue-500 shrink-0 mx-2" />

                <div className="text-right">
                  <span className="text-blue-600 dark:text-blue-400 font-bold block text-[10px]">Periode Baru:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {formatDate(newStartDate)} - {formatDate(newEndDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Reset Checklist Switch */}
            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={resetChecklist}
                onChange={(e) => setResetChecklist(e.target.checked)}
                className="h-4 w-4 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
              />
              <div className="flex-1">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Reset Checklist Aksi Kick
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Kosongkan kembali checklist tindakan admin untuk periode berikutnya
                </span>
              </div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="group flex items-center gap-2 pl-5 pr-1.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Konfirmasi Perpanjang</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
