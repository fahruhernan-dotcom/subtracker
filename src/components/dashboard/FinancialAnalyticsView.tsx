'use client';

import React, { useState } from 'react';
import { Subscription, AccountPool, DashboardMetrics } from '@/types/subscription';
import { formatCurrency, formatDate, getCategoryDisplayName, getCategoryColor } from '@/lib/utils';
import { CategoryExpenseChart } from '@/components/dashboard/CategoryExpenseChart';
import { 
  TrendingUp, 
  DollarSign, 
  Wallet, 
  PieChart, 
  Layers, 
  Percent, 
  ArrowUpRight, 
  Users, 
  Mail, 
  ShieldCheck, 
  HelpCircle,
  Sparkles,
  Building,
  KeyRound,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Calculator,
  Calendar,
  Clock,
  ArrowRight,
  Receipt,
  Eye,
  EyeOff
} from 'lucide-react';

interface FinancialAnalyticsViewProps {
  subscriptions: Subscription[];
  pools: AccountPool[];
  metrics: DashboardMetrics;
}

export const FinancialAnalyticsView: React.FC<FinancialAnalyticsViewProps> = ({
  subscriptions,
  pools,
  metrics,
}) => {
  const [period, setPeriod] = useState<'actual' | 'monthly' | 'yearly'>('actual');
  const [expandedPoolId, setExpandedPoolId] = useState<string | null>(null);
  const [showModalCost, setShowModalCost] = useState<boolean>(false);

  // Helper to normalize subscription monthly price
  const getSubMonthlyRate = (sub: Subscription) => {
    const rawPrice = Number(sub.price) || 0;
    if (sub.billingCycle === 'yearly') return Math.round(rawPrice / 12);
    if (sub.billingCycle === 'quarterly') return Math.round(rawPrice / 3);
    if (sub.billingCycle === 'semi_annual') return Math.round(rawPrice / 6);
    return Math.round(rawPrice);
  };

  // Compute per-pool unit economics
  const poolAnalytics = pools.map(pool => {
    // Members assigned to this pool
    const members = subscriptions.filter(
      s => (s.poolId === pool.id || s.poolName?.toLowerCase() === pool.name.toLowerCase()) && s.status !== 'TERMINATED'
    );

    // 1. Total Actual Contracted Revenue (Sum of actual prices paid by active members)
    const totalActualRevenue = members.reduce((sum, sub) => sum + (Number(sub.price) || 0), 0);
    const totalActualCost = pool.masterCost || 0;
    const netActual = totalActualRevenue - totalActualCost;
    const actualMarginPercent = totalActualRevenue > 0
      ? Math.round((netActual / totalActualRevenue) * 100)
      : (totalActualCost > 0 ? -100 : 0);
    const actualRoi = totalActualCost > 0
      ? Number((totalActualRevenue / totalActualCost).toFixed(1))
      : (totalActualRevenue > 0 ? 10 : 0);

    // 2. Normalized Monthly Run-Rate (MRR)
    let monthlyRevenue = 0;
    members.forEach(sub => {
      monthlyRevenue += getSubMonthlyRate(sub);
    });
    const monthlyCost = Math.round(totalActualCost / 12);
    const netMonthly = Math.round(monthlyRevenue - monthlyCost);
    const monthlyMarginPercent = monthlyRevenue > 0 
      ? Math.round((netMonthly / monthlyRevenue) * 100) 
      : (monthlyCost > 0 ? -100 : 0);
    const monthlyRoi = monthlyCost > 0 
      ? Number((monthlyRevenue / monthlyCost).toFixed(1)) 
      : (monthlyRevenue > 0 ? 10 : 0);

    // 3. Annualized Projection (ARR)
    const yearlyRevenue = monthlyRevenue * 12;
    const yearlyCost = totalActualCost;
    const netYearly = Math.round(yearlyRevenue - yearlyCost);

    return {
      pool,
      members,
      memberCount: members.length,
      occupancy: Math.round((members.length / pool.totalCapacity) * 100),
      // Actual Metrics
      totalActualCost,
      totalActualRevenue,
      netActual,
      actualMarginPercent,
      actualRoi,
      // Monthly Metrics
      monthlyCost,
      monthlyRevenue: Math.round(monthlyRevenue),
      netMonthly,
      monthlyMarginPercent,
      monthlyRoi,
      // Yearly Metrics
      yearlyCost,
      yearlyRevenue: Math.round(yearlyRevenue),
      netYearly,
    };
  });

  // Global Display Metrics based on chosen view
  let displayRevenue = metrics.totalContractedRevenue || 0;
  let displayModal = metrics.totalMasterCost || 0;
  let displayProfit = metrics.totalNetProfit || 0;
  let displayMargin = metrics.totalProfitMarginPercent || 0;
  let displayRoi = metrics.roiMultiplier || 0;
  let periodLabel = 'Total Riil';
  let periodSubText = 'Total kas iuran member aktif vs total modal master';

  if (period === 'monthly') {
    displayRevenue = metrics.monthlyRevenueEstimate;
    displayModal = metrics.totalMasterCostMonthly;
    displayProfit = metrics.netProfitMonthly;
    displayMargin = metrics.profitMarginPercent;
    displayRoi = metrics.totalMasterCostMonthly > 0 ? Number((displayRevenue / metrics.totalMasterCostMonthly).toFixed(1)) : 0;
    periodLabel = 'Bulan';
    periodSubText = 'Rata-rata perputaran per 30 hari (MRR)';
  } else if (period === 'yearly') {
    displayRevenue = metrics.yearlyRevenueEstimate;
    displayModal = metrics.totalMasterCostYearly;
    displayProfit = metrics.netProfitYearly;
    displayMargin = metrics.profitMarginPercent;
    displayRoi = metrics.totalMasterCostYearly > 0 ? Number((displayRevenue / metrics.totalMasterCostYearly).toFixed(1)) : 0;
    periodLabel = 'Tahun';
    periodSubText = 'Proyeksi tahunan 12 bulan (ARR)';
  }

  const modalPercentOfRevenue = displayRevenue > 0 ? Math.min(100, Math.round((displayModal / displayRevenue) * 100)) : 0;
  const profitPercentOfRevenue = Math.max(0, 100 - modalPercentOfRevenue);

  const toggleExpand = (poolId: string) => {
    setExpandedPoolId(expandedPoolId === poolId ? null : poolId);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header & Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              P&L & Financial Command Center
            </h1>
            <span className="eyebrow-pill bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 text-[10px]">
              Laba Bersih & Modal
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Kalkulasi modal seluruh akun master pool vs omset iuran dari paket member (1 bulan, 3 bulan, dll).
          </p>
        </div>

        {/* 3-Way Mode Switcher Tabs + Privacy Eye Toggle */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
          {/* Privacy Eye Toggle for Modal Induk */}
          <button
            type="button"
            onClick={() => setShowModalCost(!showModalCost)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
            title={showModalCost ? "Sembunyikan Modal Induk" : "Lihat Modal Induk"}
          >
            {showModalCost ? <EyeOff className="h-3.5 w-3.5 text-rose-500" /> : <Eye className="h-3.5 w-3.5 text-slate-400" />}
            <span>{showModalCost ? 'Sembunyikan Modal' : 'Lihat Modal'}</span>
          </button>

          <div className="flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setPeriod('actual')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                period === 'actual'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              Total Riil (Aktual)
            </button>
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                period === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              Rata-rata Bulanan
            </button>
            <button
              type="button"
              onClick={() => setPeriod('yearly')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                period === 'yearly'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              Proyeksi 1 Tahun
            </button>
          </div>
        </div>
      </div>

      {/* Revenue Logic Explainer Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-transparent border border-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Calculator className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                Logika Finansial: Revenue Kas vs Revenue Per Bulan
              </h4>
              <span className="eyebrow-pill bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 text-[9px]">
                Multi-Durasi
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              Jika member berlangganan paket <strong>3 Bulan seharga Rp 90.000</strong>:
              <br className="hidden sm:inline" />
              • <strong>Total Kas (Revenue Riil):</strong> Terhitung penuh <strong>Rp 90.000</strong> (uang kas uang masuk di muka).
              <br className="hidden sm:inline" />
              • <strong>Revenue Per Bulan (MRR):</strong> Terhitung <strong>Rp 30.000 / bulan</strong> (dibagi rata per 30 hari selama masa aktif).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right shadow-xs">
            <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Kas Masuk (Revenue)</span>
            <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
              {formatCurrency(metrics.totalContractedRevenue, 'IDR')}
            </span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-right shadow-xs">
            <span className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Omset / Bulan (MRR)</span>
            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
              {formatCurrency(metrics.monthlyRevenueEstimate, 'IDR')}/bln
            </span>
          </div>
        </div>
      </div>

      {/* 4 Financial KPI Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Gross Revenue */}
        <div className="bezel-shell">
          <div className="bezel-core p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Omset Member Masuk
              </span>
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(displayRevenue, 'IDR')}
              </div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                {period === 'actual' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] ring-1 ring-emerald-500/20">
                    ~{formatCurrency(metrics.monthlyRevenueEstimate, 'IDR')} / bulan
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold text-[10px] ring-1 ring-blue-500/20">
                    Total Kas: {formatCurrency(metrics.totalContractedRevenue, 'IDR')}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-bold">
                  ({metrics.totalActive} slot)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Capital / Master Cost (Modal Seluruh Akun Induk) */}
        <div className="bezel-shell">
          <div className="bezel-core p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Modal Seluruh Akun Induk (COGS)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowModalCost(!showModalCost)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title={showModalCost ? "Sembunyikan Modal Induk" : "Lihat Modal Induk"}
                >
                  {showModalCost ? <EyeOff className="h-4 w-4 text-rose-500" /> : <Eye className="h-4 w-4" />}
                </button>
                <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20 flex items-center justify-center">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                {showModalCost ? (
                  formatCurrency(displayModal, 'IDR')
                ) : (
                  <span className="font-mono tracking-widest text-slate-400 dark:text-slate-500 select-none">
                    Rp ••••••
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                Total modal beli {pools.length} Akun Master Pool
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Net Profit (Laba Bersih) */}
        <div className="bezel-shell">
          <div className="bezel-core p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Laba Bersih (Net Profit)
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className={`text-xl font-black tracking-tight ${displayProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                {displayProfit >= 0 ? '+' : ''}{formatCurrency(displayProfit, 'IDR')}
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                <ArrowUpRight className="h-3 w-3" /> Surplus Profit {profitPercentOfRevenue}% dari Omset
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Profit Margin & ROI Multiplier */}
        <div className="bezel-shell">
          <div className="bezel-core p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Margin & ROI Modal
              </span>
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20 flex items-center justify-center">
                <Percent className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
                {displayMargin}% Margin
              </div>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block mt-0.5">
                ROI {displayRoi}x lipat modal master
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* P&L Visual Ratio Bar & Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Category Breakdown (7 cols) */}
        <div className="lg:col-span-7">
          <CategoryExpenseChart subscriptions={subscriptions} />
        </div>

        {/* P&L Financial Structure Card (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bezel-shell h-full">
            <div className="bezel-core p-6 flex flex-col justify-between h-full space-y-6">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Struktur P&L Keuangan ({periodLabel})
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Rasio modal akun induk terhadap laba bersih riil
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visual Ratio Progress Bar */}
                <div className="space-y-2 mt-5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-rose-500 flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                      Modal Induk ({modalPercentOfRevenue}%)
                    </span>
                    <span className="text-emerald-500 flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      Laba Bersih ({profitPercentOfRevenue}%)
                    </span>
                  </div>

                  <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
                    <div 
                      className="bg-rose-500 transition-all duration-500" 
                      style={{ width: `${modalPercentOfRevenue}%` }}
                      title={`Modal: ${formatCurrency(displayModal, 'IDR')}`}
                    />
                    <div 
                      className="bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${profitPercentOfRevenue}%` }}
                      title={`Laba Bersih: ${formatCurrency(displayProfit, 'IDR')}`}
                    />
                  </div>
                </div>

                {/* Financial Line Items */}
                <div className="space-y-3 mt-6 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-600 dark:text-slate-300 font-bold block">Total Omset Iuran Member:</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                        {period === 'actual' 
                          ? `Ekuivalen: ${formatCurrency(metrics.monthlyRevenueEstimate, 'IDR')}/bln` 
                          : `Total Kas Riil: ${formatCurrency(metrics.totalContractedRevenue, 'IDR')}`}
                      </span>
                    </div>
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      +{formatCurrency(displayRevenue, 'IDR')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                    <div className="flex items-center gap-1.5">
                      <span className="text-rose-700 dark:text-rose-300 font-bold">Total Modal Seluruh Akun Induk:</span>
                      <button
                        type="button"
                        onClick={() => setShowModalCost(!showModalCost)}
                        className="p-0.5 rounded text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 transition-colors cursor-pointer"
                        title={showModalCost ? "Sembunyikan Modal" : "Lihat Modal"}
                      >
                        {showModalCost ? <EyeOff className="h-3 w-3 text-rose-500" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </div>
                    <span className="font-mono font-black text-rose-600 dark:text-rose-400">
                      {showModalCost ? `-${formatCurrency(displayModal, 'IDR')}` : '-Rp ••••••'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                    <span className="text-emerald-800 dark:text-emerald-300 font-black">Laba Bersih Riil:</span>
                    <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                      {displayProfit >= 0 ? '+' : ''}{formatCurrency(displayProfit, 'IDR')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-100/60 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Modal dihitung langsung dari akumulasi biaya modal riil seluruh akun master pool yang terdaftar di tab <strong>Pool & Akun Induk</strong>.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Pool Unit Economics Breakdown Table */}
      <div className="bezel-shell">
        <div className="bezel-core p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20 flex items-center justify-center">
                <Building className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Analisis Unit Economics & Profitabilitas per Pool
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Breakdown performa modal vs omset vs laba per masing-masing grup akun induk. Klik baris pool untuk melihat rincian member & rumus kalkulasi.
                </p>
              </div>
            </div>

            <span className="eyebrow-pill bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20">
              {pools.length} Pool Master Terdaftar
            </span>
          </div>

          {poolAnalytics.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-bold">
              Belum ada data pool master untuk dianalisis.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="pb-3 pl-2">Nama Pool & Master</th>
                    <th className="pb-3">Slot Okupansi</th>
                    <th className="pb-3">
                      <div className="flex items-center gap-1">
                        <span>Modal Induk ({periodLabel})</span>
                        <button
                          type="button"
                          onClick={() => setShowModalCost(!showModalCost)}
                          className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title={showModalCost ? "Sembunyikan Modal" : "Lihat Modal"}
                        >
                          {showModalCost ? <EyeOff className="h-3 w-3 text-rose-500" /> : <Eye className="h-3 w-3" />}
                        </button>
                      </div>
                    </th>
                    <th className="pb-3">Omset Member ({periodLabel})</th>
                    <th className="pb-3">Laba Bersih ({periodLabel})</th>
                    <th className="pb-3">Margin %</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-2 text-right">Rincian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {poolAnalytics.map(({ 
                    pool, 
                    members, 
                    memberCount, 
                    occupancy, 
                    totalActualCost,
                    totalActualRevenue,
                    netActual,
                    actualMarginPercent,
                    actualRoi,
                    monthlyCost,
                    monthlyRevenue,
                    netMonthly,
                    monthlyMarginPercent,
                    monthlyRoi,
                    yearlyCost,
                    yearlyRevenue,
                    netYearly,
                  }) => {
                    let cost = totalActualCost;
                    let rev = totalActualRevenue;
                    let profit = netActual;
                    let marginPercent = actualMarginPercent;
                    let roi = actualRoi;

                    if (period === 'monthly') {
                      cost = monthlyCost;
                      rev = monthlyRevenue;
                      profit = netMonthly;
                      marginPercent = monthlyMarginPercent;
                      roi = monthlyRoi;
                    } else if (period === 'yearly') {
                      cost = yearlyCost;
                      rev = yearlyRevenue;
                      profit = netYearly;
                      marginPercent = monthlyMarginPercent;
                      roi = monthlyRoi;
                    }

                    const isRowExpanded = expandedPoolId === pool.id;

                    return (
                      <React.Fragment key={pool.id}>
                        <tr 
                          onClick={() => toggleExpand(pool.id)}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                            isRowExpanded ? 'bg-slate-50/90 dark:bg-slate-800/60' : ''
                          }`}
                        >
                          {/* Pool Name & Master Email */}
                          <td className="py-3.5 pl-2">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-8 w-8 rounded-xl ${pool.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs`}>
                                {pool.provider.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <span className="font-extrabold text-slate-900 dark:text-white block truncate max-w-[200px]" title={pool.name}>
                                  {pool.name}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[180px]" title={pool.masterEmail}>
                                  {pool.masterEmail}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Slot Occupancy */}
                          <td className="py-3.5">
                            <div className="space-y-1">
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {memberCount} / {pool.totalCapacity} slot
                              </span>
                              <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-1.5 rounded-full ${occupancy >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                  style={{ width: `${Math.min(100, occupancy)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Modal Cost */}
                          <td className="py-3.5 font-mono font-bold text-rose-600 dark:text-rose-400">
                            {showModalCost ? formatCurrency(cost, 'IDR') : 'Rp ••••••'}
                          </td>

                          {/* Omset Revenue */}
                          <td className="py-3.5">
                            <div className="font-mono font-black text-slate-900 dark:text-white">
                              {formatCurrency(rev, 'IDR')}
                            </div>
                            {period === 'actual' && monthlyRevenue > 0 && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block whitespace-nowrap">
                                ~{formatCurrency(monthlyRevenue, 'IDR')}/bln
                              </span>
                            )}
                            {period === 'monthly' && totalActualRevenue > 0 && (
                              <span className="text-[10px] text-slate-400 font-medium block whitespace-nowrap">
                                Kas: {formatCurrency(totalActualRevenue, 'IDR')}
                              </span>
                            )}
                          </td>

                          {/* Net Profit */}
                          <td className="py-3.5">
                            <span className={`font-mono font-black ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                              {profit >= 0 ? '+' : ''}{formatCurrency(profit, 'IDR')}
                            </span>
                          </td>

                          {/* Margin % */}
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${marginPercent >= 50 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : marginPercent > 0 ? 'bg-blue-500/10 text-blue-600' : 'bg-rose-500/10 text-rose-600'}`}>
                              {marginPercent}%
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5">
                            {profit > 100000 ? (
                              <span className="eyebrow-pill bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 text-[9px]">
                                Sangat Profit 🚀
                              </span>
                            ) : profit > 0 ? (
                              <span className="eyebrow-pill bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 text-[9px]">
                                Profit Sehat 🟢
                              </span>
                            ) : profit === 0 && memberCount > 0 ? (
                              <span className="eyebrow-pill bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 text-[9px]">
                                Break Even 🟡
                              </span>
                            ) : (
                              <span className="eyebrow-pill bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px]">
                                Belum Terisi ⚪
                              </span>
                            )}
                          </td>

                          {/* Expand Trigger Button */}
                          <td className="py-3.5 pr-2 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(pool.id);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 text-slate-500 transition-colors cursor-pointer"
                              title={isRowExpanded ? 'Tutup Rincian' : 'Lihat Rincian Member & Kalkulasi'}
                            >
                              {isRowExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </td>
                        </tr>

                        {/* EXPANDED DETAIL ROW */}
                        {isRowExpanded && (
                          <tr className="bg-slate-50/60 dark:bg-slate-800/30">
                            <td colSpan={8} className="p-4">
                              <div className="space-y-4 rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
                                
                                {/* Section 1: Financial Calculation Breakdown Formula */}
                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 space-y-2.5">
                                  <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
                                    <Calculator className="h-4 w-4 text-blue-500" />
                                    <span>Rincian Finansial & Kalkulasi Pool: {pool.name}</span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-slate-400 font-bold block">Modal Akun Induk</span>
                                        <button
                                          type="button"
                                          onClick={() => setShowModalCost(!showModalCost)}
                                          className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                          title={showModalCost ? "Sembunyikan Modal" : "Lihat Modal"}
                                        >
                                          {showModalCost ? <EyeOff className="h-2.5 w-2.5 text-rose-500" /> : <Eye className="h-2.5 w-2.5" />}
                                        </button>
                                      </div>
                                      <span className="font-mono font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                                        {showModalCost ? formatCurrency(cost, 'IDR') : 'Rp ••••••'}
                                      </span>
                                      <span className="text-[10px] text-slate-400 block mt-0.5">
                                        {period === 'actual' ? 'Total modal beli akun master' : `Biaya modal per ${periodLabel}`}
                                      </span>
                                    </div>

                                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                      <span className="text-[10px] text-slate-400 font-bold block">Omset Member ({memberCount} Slot)</span>
                                      <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                                        +{formatCurrency(rev, 'IDR')}
                                      </span>
                                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                                        Rate: {formatCurrency(monthlyRevenue, 'IDR')} / bulan
                                      </div>
                                      <span className="text-[9px] text-slate-400 block mt-0.5">
                                        Total kas masuk: {formatCurrency(totalActualRevenue, 'IDR')}
                                      </span>
                                    </div>

                                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                      <span className="text-[10px] text-slate-400 font-bold block">Laba Bersih Riil</span>
                                      <span className={`font-mono font-extrabold text-sm ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                                        {profit >= 0 ? '+' : ''}{formatCurrency(profit, 'IDR')}
                                      </span>
                                      <span className="text-[10px] text-slate-400 block mt-0.5">
                                        Omset Member - Modal Induk
                                      </span>
                                    </div>

                                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                      <span className="text-[10px] text-slate-400 font-bold block">Margin & ROI</span>
                                      <span className="font-mono font-extrabold text-purple-600 dark:text-purple-400 text-sm">
                                        {marginPercent}% • {roi}x
                                      </span>
                                      <span className="text-[10px] text-slate-400 block mt-0.5">
                                        Efisiensi perputaran modal
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Section 2: Member Roster Table for this Pool */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white">
                                    <span className="flex items-center gap-1.5">
                                      <UserCheck className="h-4 w-4 text-emerald-500" />
                                      Daftar Member & Iuran yang Masuk ke Pool Ini ({members.length}):
                                    </span>
                                  </div>

                                  {members.length === 0 ? (
                                    <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-400 font-medium">
                                      Belum ada member yang dialokasikan ke pool ini. Sisa slot kosong: <strong>{pool.totalCapacity} slot</strong>.
                                    </div>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left text-xs border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                          <tr>
                                            <th className="p-2.5 pl-3">Nama Member</th>
                                            <th className="p-2.5">Email Member</th>
                                            <th className="p-2.5">Siklus / Paket</th>
                                            <th className="p-2.5">Harga Paket (Total Kas)</th>
                                            <th className="p-2.5">Rate / Bulan</th>
                                            <th className="p-2.5">Jatuh Tempo</th>
                                            <th className="p-2.5 pr-3 text-right">Status</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                          {members.map((m) => {
                                            const monthlyRate = getSubMonthlyRate(m);
                                            return (
                                              <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                                <td className="p-2.5 pl-3 font-extrabold text-slate-900 dark:text-white">
                                                  {m.memberName || 'Member'}
                                                </td>
                                                <td className="p-2.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                                  {m.accountEmail}
                                                </td>
                                                <td className="p-2.5">
                                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                    {m.billingCycle === 'yearly' ? 'Tahunan (1 Thn)' : m.billingCycle === 'quarterly' ? '3 Bulan (Quarterly)' : m.billingCycle === 'semi_annual' ? '6 Bulan' : 'Bulanan (1 Bln)'}
                                                  </span>
                                                </td>
                                                <td className="p-2.5 font-mono font-black text-slate-900 dark:text-white">
                                                  {formatCurrency(m.price, 'IDR')}
                                                </td>
                                                <td className="p-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                  {formatCurrency(monthlyRate, 'IDR')}/bln
                                                </td>
                                                <td className="p-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                                                  {formatDate(m.endDate)}
                                                </td>
                                                <td className="p-2.5 pr-3 text-right">
                                                  <span className={`eyebrow-pill text-[9px] ${
                                                    m.status === 'ACTIVE' 
                                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20' 
                                                      : m.status === 'EXPIRING_SOON'
                                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20'
                                                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20'
                                                  }`}>
                                                    {m.status}
                                                  </span>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
