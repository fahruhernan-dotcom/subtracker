'use client';

import React from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Sparkles, 
  ExternalLink, 
  Download, 
  CheckCircle2,
  AlertTriangle,
  Flame
} from 'lucide-react';
import { formatDateIndo } from '@/lib/utils';
import { parseISO, differenceInCalendarDays, addDays, addMonths, format, isValid } from 'date-fns';
import { Subscription } from '@/types/subscription';
import { generateGoogleCalendarUrl, downloadIcsFile } from '@/lib/calendar';
import { CustomDatePicker, QuickPreset } from './CustomDatePicker';

export type DatePickerPreset = QuickPreset;

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  variant?: 'start' | 'expiry' | 'pool' | 'neutral';
  min?: string;
  max?: string;
  helperText?: string;
  relativeDate?: string; // e.g. start date for calculating difference
  poolEndDate?: string;
  quickPresets?: DatePickerPreset[];
  showCalendarSync?: boolean;
  subscription?: Subscription;
  className?: string;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  required = false,
  variant = 'neutral',
  min,
  max,
  helperText,
  relativeDate,
  poolEndDate,
  quickPresets,
  showCalendarSync = false,
  subscription,
  className = '',
}) => {
  const [showSyncMenu, setShowSyncMenu] = React.useState(false);

  // Compute Human-readable text & relative distance
  const dateInfo = React.useMemo(() => {
    if (!value) return null;
    try {
      const parsed = parseISO(value);
      if (isNaN(parsed.getTime())) return null;

      const formattedReadable = formatDateIndo(value);

      // Relative calculation
      const baseDate = relativeDate ? parseISO(relativeDate) : new Date();
      const diffDays = differenceInCalendarDays(parsed, baseDate);

      let relativeLabel = '';
      let badgeTone: 'blue' | 'amber' | 'rose' | 'emerald' | 'slate' = 'slate';

      if (diffDays === 0) {
        relativeLabel = 'Hari Ini';
        badgeTone = 'amber';
      } else if (diffDays === 1) {
        relativeLabel = 'Besok (+1 hari)';
        badgeTone = 'amber';
      } else if (diffDays > 1) {
        if (diffDays >= 30) {
          const months = Math.round(diffDays / 30);
          relativeLabel = `${diffDays} hari lagi (~${months} bln)`;
        } else {
          relativeLabel = `${diffDays} hari lagi`;
        }
        badgeTone = diffDays <= 7 ? 'amber' : 'emerald';
      } else {
        const past = Math.abs(diffDays);
        relativeLabel = `Lewat ${past} hari lalu`;
        badgeTone = 'rose';
      }

      return {
        formattedReadable,
        diffDays,
        relativeLabel,
        badgeTone,
      };
    } catch {
      return null;
    }
  }, [value, relativeDate]);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Top Header: Label + Google Calendar Sync Action */}
      <div className="flex items-center justify-between">
        <label className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 select-none">
          <CalendarIcon className={`h-3.5 w-3.5 ${
            variant === 'expiry' ? 'text-rose-500' :
            variant === 'start' ? 'text-blue-500' :
            variant === 'pool' ? 'text-purple-500' : 'text-slate-400'
          }`} />
          <span>{label}</span>
          {required && <span className="text-rose-500 font-black">*</span>}
        </label>

        {/* Calendar Sync Menu */}
        {showCalendarSync && subscription && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSyncMenu(!showSyncMenu)}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer bg-blue-500/5 dark:bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20"
            >
              <Clock className="h-2.5 w-2.5" />
              <span>+ Kalender</span>
            </button>

            {showSyncMenu && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowSyncMenu(false)} 
                />
                <div className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl z-40 p-2 text-xs font-bold animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                    Sinkronisasi Kalender
                  </div>
                  <a
                    href={generateGoogleCalendarUrl(subscription)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowSyncMenu(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Google Calendar</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSyncMenu(false);
                      downloadIcsFile(subscription);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-left cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Apple / Outlook (.ics)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bespoke Luxury Custom Date Picker Trigger & Popover */}
      <CustomDatePicker
        value={value}
        onChange={onChange}
        required={required}
        variant={variant}
        relativeDate={relativeDate}
        poolEndDate={poolEndDate}
        quickPresets={quickPresets}
        placeholder="Pilih Tanggal..."
      />

      {/* Bottom Status Info Bar: Localized Date (Left) + Relative Countdown Badge (Right) */}
      <div className="flex items-center justify-between gap-2 px-1 text-[11px] min-h-[22px]">
        {dateInfo ? (
          <>
            <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 truncate">
              <CheckCircle2 className="h-3 w-3 text-blue-500 shrink-0" />
              <span className="truncate">{dateInfo.formattedReadable}</span>
            </span>

            <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 ${
              dateInfo.badgeTone === 'emerald'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : dateInfo.badgeTone === 'amber'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                : dateInfo.badgeTone === 'rose'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}>
              {dateInfo.badgeTone === 'rose' && <AlertTriangle className="h-2.5 w-2.5" />}
              {dateInfo.badgeTone === 'amber' && <Flame className="h-2.5 w-2.5" />}
              <span>{dateInfo.relativeLabel}</span>
            </span>
          </>
        ) : (
          <span className="text-slate-400 text-[10px]">
            {helperText || 'Pilih tanggal'}
          </span>
        )}
      </div>
    </div>
  );
};
