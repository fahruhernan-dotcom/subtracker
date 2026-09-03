'use client';

import React, { useState } from 'react';
import { Subscription } from '@/types/subscription';
import { formatCurrency, getCategoryDisplayName, getCategoryColor } from '@/lib/utils';
import { PieChart as PieIcon, Layers, Users, TrendingUp } from 'lucide-react';

interface CategoryExpenseChartProps {
  subscriptions: Subscription[];
}

export const CategoryExpenseChart: React.FC<CategoryExpenseChartProps> = ({
  subscriptions,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Aggregate active subscriptions by category / provider
  const activeSubs = subscriptions.filter(s => s.status !== 'TERMINATED');
  
  const categoryTotals: Record<string, { value: number; count: number; name: string; color: string }> = {};
  let totalMonthlyCost = 0;

  activeSubs.forEach(sub => {
    let monthlyRate = sub.price;
    if (sub.billingCycle === 'yearly') monthlyRate = sub.price / 12;
    else if (sub.billingCycle === 'quarterly') monthlyRate = sub.price / 3;
    else if (sub.billingCycle === 'semi_annual') monthlyRate = sub.price / 6;

    const rawKey = sub.category || sub.provider || 'other';
    const normalizedName = getCategoryDisplayName(rawKey);
    const color = getCategoryColor(rawKey);

    if (!categoryTotals[rawKey]) {
      categoryTotals[rawKey] = {
        value: 0,
        count: 0,
        name: normalizedName,
        color: color,
      };
    }

    categoryTotals[rawKey].value += monthlyRate;
    categoryTotals[rawKey].count += 1;
    totalMonthlyCost += monthlyRate;
  });

  const chartData = Object.entries(categoryTotals)
    .map(([key, item]) => ({
      key,
      name: item.name,
      count: item.count,
      value: Math.round(item.value),
      percent: totalMonthlyCost > 0 ? Math.round((item.value / totalMonthlyCost) * 100) : 0,
      color: item.color,
    }))
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
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 flex items-center justify-center shadow-xs">
              <PieIcon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                Distribusi Omset per Layanan & Kategori
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Breakdown perputaran slot langganan aktif
              </p>
            </div>
          </div>

          <span className="eyebrow-pill bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
            {chartData.length} Kategori Aktif
          </span>
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
                    </div>
                  ) : (
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Total Omset
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight block">
                        {formatCurrency(totalMonthlyCost, 'IDR')}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                        / bulan
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

                    {/* Row 2: Slots Count & Monthly Revenue */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span>{item.count} slot terisi</span>
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {formatCurrency(item.value, 'IDR')}<span className="text-[10px] font-medium text-slate-400">/bln</span>
                      </span>
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
        )}
      </div>
    </div>
  );
};
