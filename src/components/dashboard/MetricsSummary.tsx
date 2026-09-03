'use client';

import React from 'react';
import { 
  Users, 
  CalendarClock, 
  TrendingUp, 
  ArrowUpRight, 
  ShieldAlert
} from 'lucide-react';
import { DashboardMetrics } from '@/types/subscription';
import { formatCurrency } from '@/lib/utils';

interface MetricsSummaryProps {
  metrics: DashboardMetrics;
  onFilterNeedAction: () => void;
  onFilterUpcoming: () => void;
  onFilterAllActive: () => void;
}

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({
  metrics,
  onFilterNeedAction,
  onFilterUpcoming,
  onFilterAllActive,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* 1. Total Active Member Slots */}
      <div 
        onClick={onFilterAllActive}
        className="bezel-shell group cursor-pointer hover:-translate-y-1 transition-transform"
      >
        <div className="bezel-core p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow-pill bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
              Active Member Slots
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {metrics.totalActive}
            </h3>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              <ArrowUpRight className="h-3 w-3" /> Terisi
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
            Member aktif di semua pool
          </p>
        </div>
      </div>

      {/* 2. Upcoming Expirations (30 Days) */}
      <div 
        onClick={onFilterUpcoming}
        className="bezel-shell group cursor-pointer hover:-translate-y-1 transition-transform"
      >
        <div className="bezel-core p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow-pill bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
              Jatuh Tempo (30d)
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarClock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {metrics.upcomingRenewalsCount}
            </h3>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              Member
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
            Perlu konfirmasi / tagihan WA
          </p>
        </div>
      </div>

      {/* 3. Urgent: Kick Action Required */}
      <div 
        onClick={onFilterNeedAction}
        className="bezel-shell group cursor-pointer hover:-translate-y-1 transition-transform ring-1 ring-rose-500/30"
      >
        <div className="bezel-core p-5 flex flex-col justify-between h-full bg-gradient-to-br from-white to-rose-50/40 dark:from-slate-900 dark:to-rose-950/20">
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow-pill bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
              Wajib Kick / Lepas
            </span>
            <div className="h-8 w-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {metrics.needActionCount}
            </h3>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white uppercase tracking-wider">
              Urgent
            </span>
          </div>
          <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-2 font-semibold">
            Expired tapi belum di-kick
          </p>
        </div>
      </div>

      {/* 4. Monthly Revenue Forecast */}
      <div className="bezel-shell group hover:-translate-y-1 transition-transform">
        <div className="bezel-core p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow-pill bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
              Omset / Bulan
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(metrics.monthlyRevenueEstimate, 'IDR')}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium flex items-center gap-1">
            <span>Est. 1 Thn:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {formatCurrency(metrics.yearlyRevenueEstimate, 'IDR')}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
