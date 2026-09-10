'use client';

import React, { useState } from 'react';
import { Subscription } from '@/types/subscription';
import { formatCurrency, getCategoryDisplayName, getCategoryColor } from '@/lib/utils';
import { PieChart as PieIcon, Layers, Users, TrendingUp } from 'lucide-react';

interface CategoryExpenseChartProps {
  subscriptions: Subscription[];
  initialMode?: 'actual' | 'monthly';
}

export const CategoryExpenseChart: React.FC<CategoryExpenseChartProps> = ({
  subscriptions,
  initialMode = 'actual',
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<'actual' | 'monthly'>(initialMode);

  // Aggregate active subscriptions by category / provider
  const activeSubs = subscriptions.filter(s => s.status !== 'TERMINATED');
  
  const categoryTotals: Record<string, { actualValue: number; monthlyValue: number; count: number; name: string; color: string }> = {};
  let totalActualCost = 0;
  let totalMonthlyCost = 0;

  activeSubs.forEach(sub => {
    const rawPrice = Number(sub.price) || 0;
    let monthlyRate = rawPrice;
    if (sub.billingCycle === 'yearly') monthlyRate = rawPrice / 12;
    else if (sub.billingCycle === 'quarterly') monthlyRate = rawPrice / 3;
    else if (sub.billingCycle === 'semi_annual') monthlyRate = rawPrice / 6;

    const rawKey = sub.category || sub.provider || 'other';
    const normalizedName = getCategoryDisplayName(rawKey);
    const color = getCategoryColor(rawKey);

    if (!categoryTotals[rawKey]) {
      categoryTotals[rawKey] = {
        actualValue: 0,
        monthlyValue: 0,
        count: 0,
        name: normalizedName,
        color: color,
      };
    }

    categoryTotals[rawKey].actualValue += rawPrice;
    categoryTotals[rawKey].monthlyValue += monthlyRate;
    categoryTotals[rawKey].count += 1;
    totalActualCost += rawPrice;
    totalMonthlyCost += monthlyRate;
  });

  const activeTotal = chartMode === 'actual' ? totalActualCost : totalMonthlyCost;

  const chartData = Object.entries(categoryTotals)
    .map(([key, item]) => {
      const displayVal = chartMode === 'actual' ? item.actualValue : item.monthlyValue;
      return {
        key,
        name: item.name,
        count: item.count,
        value: Math.round(displayVal),
        actualValue: Math.round(item.actualValue),
        monthlyValue: Math.round(item.monthlyValue),
        percent: activeTotal > 0 ? Math.round((displayVal / activeTotal) * 100) : 0,
        color: item.color,
      };
    })
    .sort((a, b) => b.value - a.value);

  // Calculate SVG Pie/Donut Arc Paths
  const radius = 60;
  const strokeWidth = 18;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  let accumulatedOffset = 0;

  const hoveredItem = hoveredCategory ? chartData.find(d => d.key === hoveredCategory) : null;

  return (
    <div className="bezel-shell">
      <div className="bezel-core p-6 flex flex-col justify-between space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 flex items-center justify-center shadow-xs">
              <PieIcon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                Distribusi Omset per Layanan & Kategori
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Pilih tampilan Revenue Kas Masuk atau Rata-rata Per Bulan (MRR)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Total Kas vs Per Bulan */}
            <div className="flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setChartMode('actual')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  chartMode === 'actual'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                Total Kas (Revenue)
              </button>
              <button
                type="button"
                onClick={() => setChartMode('monthly')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  chartMode === 'monthly'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                Per Bulan (MRR)
              </button>
            </div>

            <span className="eyebrow-pill bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 text-[10px] hidden sm:inline-block">
              {chartData.length} Kategori
            </span>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2">
              <Layers className="h-5 w-5" />
            </div>
            <p className="text-xs text-slate-400 font-bold">
              Belum ada data member aktif untuk dianalisis.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
              
              {/* Left Column: Interactive Luxury SVG Donut Ring */}
              <div className="md:col-span-5 flex flex-col items-center justify-center">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg
                    className="w-full h-full transform -rotate-90 filter drop-shadow-sm"
                    viewBox="0 0 140 140"
                  >
                    {/* Background Track Ring */}
                    <circle
                      stroke="currentColor"
                      fill="transparent"
                      strokeWidth={strokeWidth}
                      r={normalizedRadius}
                      cx="70"
                      cy="70"
                      className="text-slate-100 dark:text-slate-800/80"
                    />

                    {/* Donut Segments */}
                    {chartData.map((slice) => {
                      const strokeDashoffset = circumference - (slice.percent / 100) * circumference;
                      const currentOffset = accumulatedOffset;
                      accumulatedOffset += (slice.percent / 100) * circumference;

                      const isHovered = hoveredCategory === slice.key;

                      return (
                        <circle
                          key={slice.key}
                          stroke={slice.color}
                          fill="transparent"
                          strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                          strokeDasharray={`${circumference} ${circumference}`}
                          style={{
                            strokeDashoffset: strokeDashoffset,
                            transformOrigin: '50% 50%',
                            transform: `rotate(${(currentOffset / circumference) * 360}deg)`,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                          r={normalizedRadius}
                          cx="70"
                          cy="70"
                          onMouseEnter={() => setHoveredCategory(slice.key)}
                          onMouseLeave={() => setHoveredCategory(null)}
                          className="cursor-pointer"
                        />
                      );
                    })}
                  </svg>

                  {/* Dynamic Center Hub (Real-time Live Information) */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                    {hoveredItem ? (
                      <div className="animate-in fade-in duration-150">
                        <span 
                          className="text-[9px] font-black uppercase tracking-wider block truncate max-w-[120px]"
                          style={{ color: hoveredItem.color }}
                        >
                          {hoveredItem.name}
                        </span>
                        <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight block">
                          {formatCurrency(hoveredItem.value, 'IDR')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 block">
                          {hoveredItem.count} slot ({hoveredItem.percent}%)
                        </span>
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                          {chartMode === 'actual' ? `~${formatCurrency(hoveredItem.monthlyValue, 'IDR')}/bln` : `Kas: ${formatCurrency(hoveredItem.actualValue, 'IDR')}`}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          {chartMode === 'actual' ? 'Total Kas (Revenue)' : 'Omset / Bulan'}
                        </span>
                        <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight block">
                          {formatCurrency(activeTotal, 'IDR')}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                          {chartMode === 'actual' ? `${activeSubs.length} slot aktif` : '/ bulan'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Multi-Tier Category Breakdown Cards (Zero Text Collision) */}
              <div className="md:col-span-7 space-y-2.5">
                {chartData.map((item) => {
                  const isHovered = hoveredCategory === item.key;

                  return (
                    <div
                      key={item.key}
                      onMouseEnter={() => setHoveredCategory(item.key)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                        isHovered
                          ? 'bg-blue-50/60 dark:bg-slate-800 border-blue-400 dark:border-blue-600 shadow-md scale-[1.01]'
                          : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-750 hover:bg-slate-100/90 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      {/* Row 1: Category Name & Percentage Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span 
                            className="h-3 w-3 rounded-full shrink-0 shadow-2xs" 
                            style={{ backgroundColor: item.color }} 
                          />
                          <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                            {item.name}
                          </span>
                        </div>

                        <span 
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-black text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.percent}%
                        </span>
                      </div>

                      {/* Row 2: Slots Count & Revenue Comparison */}
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Users className="h-3 w-3 text-slate-400" />
                          <span>{item.count} slot terisi</span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 dark:text-white block">
                            {chartMode === 'actual' 
                              ? formatCurrency(item.actualValue, 'IDR')
                              : `${formatCurrency(item.monthlyValue, 'IDR')}/bln`}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                            {chartMode === 'actual' 
                              ? `~${formatCurrency(item.monthlyValue, 'IDR')}/bln` 
                              : `Kas Riil: ${formatCurrency(item.actualValue, 'IDR')}`}
                          </span>
                        </div>
                      </div>

                      {/* Row 3: Full-width Smooth Progress Bar */}
                      <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${item.percent}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explainer Footer Note */}
            <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                💡 <strong>Logika Finansial:</strong> Member paket 3 Bulan seharga Rp 90.000 terhitung sebagai <strong>Revenue Kas: Rp 90.000</strong> dan <strong>Omset Bulanan: Rp 30.000/bln</strong>.
              </span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400 text-[10px] shrink-0 self-end sm:self-auto">
                {chartMode === 'actual' ? 'Sedang Menampilkan: Total Kas (Revenue Riil)' : 'Sedang Menampilkan: Rate Bulanan (MRR)'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
