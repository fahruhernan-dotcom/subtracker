'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  X, 
  Check, 
  Clock, 
  CalendarCheck
} from 'lucide-react';
import { 
  format, 
  parseISO, 
  isValid, 
  addMonths, 
  subMonths, 
  addYears, 
  subYears, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday 
} from 'date-fns';
import { formatDateIndo } from '@/lib/utils';

export interface QuickPreset {
  label: string;
  months?: number;
  days?: number;
  isToday?: boolean;
  isPoolEnd?: boolean;
}

interface CustomDatePickerProps {
  value: string; // 'yyyy-MM-dd'
  onChange: (dateStr: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  variant?: 'start' | 'expiry' | 'pool' | 'neutral';
  relativeDate?: string; // base date for relative calculations
  poolEndDate?: string;
  quickPresets?: QuickPreset[];
  className?: string;
}

const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const INDO_DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Pilih Tanggal...',
  required = false,
  disabled = false,
  variant = 'neutral',
  relativeDate,
  poolEndDate,
  quickPresets = [],
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Internal view month state
  const initialDate = value && isValid(parseISO(value)) ? parseISO(value) : new Date();
  const [viewDate, setViewDate] = useState<Date>(initialDate);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync viewDate when value changes
  useEffect(() => {
    if (value && isValid(parseISO(value))) {
      setViewDate(parseISO(value));
    }
  }, [value]);

  // Handle outside click to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle Esc key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectedDate = value && isValid(parseISO(value)) ? parseISO(value) : null;

  // Month navigation
  const handlePrevMonth = () => setViewDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setViewDate(prev => addMonths(prev, 1));
  const handlePrevYear = () => setViewDate(prev => subYears(prev, 1));
  const handleNextYear = () => setViewDate(prev => addYears(prev, 1));

  // Date selection
  const handleSelectDay = (day: Date) => {
    const formatted = format(day, 'yyyy-MM-dd');
    onChange(formatted);
    setIsOpen(false);
  };

  // Preset execution
  const handleApplyPreset = (preset: QuickPreset) => {
    const base = relativeDate && isValid(parseISO(relativeDate)) 
      ? parseISO(relativeDate) 
      : new Date();

    if (preset.isToday) {
      const nowStr = format(new Date(), 'yyyy-MM-dd');
      onChange(nowStr);
      setViewDate(new Date());
    } else if (preset.isPoolEnd && poolEndDate) {
      onChange(poolEndDate);
      if (isValid(parseISO(poolEndDate))) {
        setViewDate(parseISO(poolEndDate));
      }
    } else if (preset.months) {
      const target = addMonths(base, preset.months);
      const targetStr = format(target, 'yyyy-MM-dd');
      onChange(targetStr);
      setViewDate(target);
    } else if (preset.days) {
      const target = new Date(base.getTime() + preset.days * 24 * 60 * 60 * 1000);
      const targetStr = format(target, 'yyyy-MM-dd');
      onChange(targetStr);
      setViewDate(target);
    }
  };

  // Generate calendar days grid (Monday-start)
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDateGrid = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDateGrid = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDateGrid, end: endDateGrid });

  const getBorderTheme = () => {
    if (isOpen) return 'ring-2 ring-blue-500 border-blue-500 shadow-md shadow-blue-500/10';
    if (variant === 'expiry') return 'hover:border-rose-400 dark:hover:border-rose-500';
    if (variant === 'start') return 'hover:border-blue-400 dark:hover:border-blue-500';
    if (variant === 'pool') return 'hover:border-purple-400 dark:hover:border-purple-500';
    return 'hover:border-slate-400';
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CalendarIcon className={`h-3.5 w-3.5 ${
              variant === 'expiry' ? 'text-rose-500' :
              variant === 'start' ? 'text-blue-500' :
              variant === 'pool' ? 'text-purple-500' : 'text-slate-400'
            }`} />
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </span>
        </label>
      )}

      {/* Main Luxury Trigger Input Box */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-between gap-2 cursor-pointer ${getBorderTheme()} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            variant === 'expiry' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
            variant === 'start' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
            variant === 'pool' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            {value ? (
              <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight block truncate">
                {format(parseISO(value), 'dd/MM/yyyy')}
              </span>
            ) : (
              <span className="text-slate-400 text-xs font-medium block truncate">
                {placeholder}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {isOpen ? 'Tutup' : 'Pilih'}
          </span>
        </div>
      </button>

      {/* LUXURY CALENDAR POPOVER MODAL */}
      {isOpen && (
        <div className="absolute left-0 right-0 sm:right-auto sm:w-[340px] top-full mt-2 z-50 rounded-3xl bg-white dark:bg-[#0c1222] border border-slate-200/90 dark:border-slate-700/80 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5">
          
          {/* Quick Preset Chips Row */}
          {quickPresets.length > 0 && (
            <div className="pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Cepat:
              </span>
              {quickPresets.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleApplyPreset(p)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                    p.isPoolEnd
                      ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Month / Year Header Navigation */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevYear}
                title="Tahun Sebelumnya"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold"
              >
                «
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Bulan Sebelumnya"
                className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            <div className="text-center">
              <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                {INDO_MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleNextMonth}
                title="Bulan Berikutnya"
                className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNextYear}
                title="Tahun Berikutnya"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold"
              >
                »
              </button>
            </div>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {INDO_DAYS.map((d, i) => (
              <div 
                key={d} 
                className={`text-[10px] font-extrabold py-1 ${i === 6 ? 'text-rose-500' : 'text-slate-400'}`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid Matrix */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((day) => {
              const isCurrentMonth = isSameMonth(day, viewDate);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isTodayDate = isToday(day);
              const isPoolEndMarker = poolEndDate && isValid(parseISO(poolEndDate)) && isSameDay(day, parseISO(poolEndDate));

              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  onClick={() => handleSelectDay(day)}
                  className={`relative h-9 w-full rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black shadow-md shadow-blue-500/30 scale-105 ring-2 ring-blue-400/40 z-10'
                      : isTodayDate
                      ? 'ring-1 ring-blue-500 text-blue-600 dark:text-blue-400 font-extrabold hover:bg-blue-500/10'
                      : !isCurrentMonth
                      ? 'text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{format(day, 'd')}</span>
                  {isPoolEndMarker && !isSelected && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-purple-500" title="Pool Expiry Date" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Footer: Readable Preview & Close */}
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] text-slate-400 block font-medium">Terpilih:</span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400 truncate block text-[11px]">
                {value ? formatDateIndo(value) : 'Belum dipilih'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const todayStr = format(new Date(), 'yyyy-MM-dd');
                  onChange(todayStr);
                  setViewDate(new Date());
                  setIsOpen(false);
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-[11px] font-bold cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-bold cursor-pointer shadow-xs"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
