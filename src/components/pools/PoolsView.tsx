'use client';

import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Plus, 
  Users, 
  Clock, 
  CheckCircle2, 
  Search,
  Building,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  AlertCircle,
  ArrowUpDown
} from 'lucide-react';
import { AccountPool, Subscription } from '@/types/subscription';
import { PoolCard } from './PoolCard';
import { getDaysRemaining, getPoolTierInfo, cn } from '@/lib/utils';
import { matchesPoolSearch, sortPools, PoolSortOption } from '@/lib/searchSort';

interface PoolsViewProps {
  pools: AccountPool[];
  subscriptions: Subscription[];
  externalSearchQuery?: string;
  onExternalSearchChange?: (q: string) => void;
  onOpenAddPoolModal: () => void;
  onEditPool: (pool: AccountPool) => void;
  onRequestDeletePool: (pool: AccountPool) => void;
  onAddMemberToPool: (pool: AccountPool) => void;
  onOpenWhatsAppModal: (sub: Subscription) => void;
  onOpenMemberChecklist: (sub: Subscription) => void;
  onMoveMemberPool?: (sub: Subscription) => void;
  onReactivateMemberInPool?: (sub: Subscription, pool: AccountPool) => void;
}

export const PoolsView: React.FC<PoolsViewProps> = ({
  pools,
  subscriptions,
  externalSearchQuery,
  onExternalSearchChange,
  onOpenAddPoolModal,
  onEditPool,
  onRequestDeletePool,
  onAddMemberToPool,
  onOpenWhatsAppModal,
  onOpenMemberChecklist,
  onMoveMemberPool,
  onReactivateMemberInPool,
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const activeSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;
  const handleSearchChange = (val: string) => {
    setLocalSearchQuery(val);
    if (onExternalSearchChange) {
      onExternalSearchChange(val);
    }
  };

  const [sortOption, setSortOption] = useState<PoolSortOption>('EXPIRY_ASC');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'GUARANTEED' | 'SHORT_TERM' | 'EXPIRED'>('ALL');
  const [showAllModalCost, setShowAllModalCost] = useState<boolean>(false);

  // Compute Pool Metrics with Tier Breakdown & Auto-Inactive
  const poolMetrics = useMemo(() => {
    let totalCapacity = 0;
    let totalOccupied = 0;
    let availableGuaranteedSlots = 0; // >= 180 hari (bisa 6 - 12 bln)
    let availableShortTermSlots = 0;   // 0 - 179 hari (khusus lepas 2 - 3 bln)
    let guaranteedPoolsCount = 0;
    let shortTermPoolsCount = 0;
    let expiredPoolsCount = 0;
    let masterExpiringCount = 0;

    pools.forEach((p) => {
      totalCapacity += p.totalCapacity;
      const occupied = subscriptions.filter(
        s => (s.poolId === p.id || s.poolName?.toLowerCase() === p.name.toLowerCase()) && s.status !== 'TERMINATED'
      ).length;
      totalOccupied += occupied;
      const availableInPool = Math.max(0, p.totalCapacity - occupied);

      const daysLeft = getDaysRemaining(p.masterEndDate);
      if (daysLeft < 0) {
        expiredPoolsCount++;
        // Expired pools DO NOT contribute to available slots for sale!
      } else if (daysLeft >= 180) {
        guaranteedPoolsCount++;
        availableGuaranteedSlots += availableInPool;
      } else {
        shortTermPoolsCount++;
        availableShortTermSlots += availableInPool;
        if (daysLeft <= 30) {
          masterExpiringCount++;
        }
      }
    });

    const totalActiveAvailable = availableGuaranteedSlots + availableShortTermSlots;
    const overallOccupancy = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    return {
      totalPools: pools.length,
      totalCapacity,
      totalOccupied,
      totalActiveAvailable,
      availableGuaranteedSlots,
      availableShortTermSlots,
      guaranteedPoolsCount,
      shortTermPoolsCount,
      expiredPoolsCount,
      overallOccupancy,
      masterExpiringCount,
    };
  }, [pools, subscriptions]);

  const filteredPools = useMemo(() => {
    const matched = pools.filter((p) => {
      const poolMembers = subscriptions.filter(
        s => (s.poolId === p.id || s.poolName?.toLowerCase() === p.name.toLowerCase())
      );

      const matchesSearch = matchesPoolSearch(p, poolMembers, activeSearchQuery);
      const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;

      const tierInfo = getPoolTierInfo(p);
      let matchesTier = true;
      if (tierFilter === 'GUARANTEED') {
        matchesTier = tierInfo.tier === 'LONG_TERM_GUARANTEED';
      } else if (tierFilter === 'SHORT_TERM') {
        matchesTier = tierInfo.tier === 'SHORT_TERM_LEPAS';
      } else if (tierFilter === 'EXPIRED') {
        matchesTier = tierInfo.isExpiredInactive;
      }

      return matchesSearch && matchesCat && matchesTier;
    });

    return sortPools(matched, subscriptions, sortOption);
  }, [pools, subscriptions, activeSearchQuery, categoryFilter, tierFilter, sortOption]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="eyebrow-pill bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
              Master Accounts & Shared Pools
            </span>
            <span className="text-xs text-slate-400 font-bold">
              • {pools.length} Pools Terdaftar
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Manajemen Pool, Family Group & Organisasi
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Pantau kapasitas slot member, alokasi kursi, dan countdown masa aktif akun induk secara terpusat.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddPoolModal}
          className="group flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] cursor-pointer shrink-0"
        >
          <span>+ Tambah Pool Baru</span>
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
            <Plus className="h-3.5 w-3.5 text-white" />
          </div>
        </button>
      </div>

      {/* 4 Summary Metric Cards: Inventori Garansi Perpanjang vs Akun Lepas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Slot Garansi Perpanjang (6 - 12 Bulan) */}
        <div className="bezel-shell">
          <div className="bezel-core p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Slot Garansi Perpanjang
              </span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {poolMetrics.availableGuaranteedSlots} <span className="text-xs font-medium text-slate-400">Slot (6-12 Bln)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {poolMetrics.guaranteedPoolsCount} Pool Aktif (≥ 180 Hari)
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Slot Akun Lepas (2 - 3 Bulan) */}
        <div className="bezel-shell">
          <div className="bezel-core p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Slot Khusus Akun Lepas
              </span>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                {poolMetrics.availableShortTermSlots} <span className="text-xs font-medium text-slate-400">Slot (2-3 Bln)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {poolMetrics.shortTermPoolsCount} Pool Khusus Lepas (&lt; 180 Hari)
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Terisi / Kapasitas */}
        <div className="bezel-shell">
          <div className="bezel-core p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Slot Terisi / Kapasitas
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {poolMetrics.totalOccupied} / {poolMetrics.totalCapacity} <span className="text-xs font-bold text-indigo-500">({poolMetrics.overallOccupancy}%)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Total {poolMetrics.totalActiveAvailable} Slot Aktif Siap Jual
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Status Akun Induk & Auto-Nonaktif */}
        <div className="bezel-shell">
          <div className="bezel-core p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-2xl ${
              poolMetrics.expiredPoolsCount > 0 
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20' 
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20'
            } flex items-center justify-center shrink-0`}>
              {poolMetrics.expiredPoolsCount > 0 ? <AlertCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Status Akun Induk
              </span>
              <div className={`text-xl font-black ${poolMetrics.expiredPoolsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                {poolMetrics.expiredPoolsCount > 0 
                  ? `${poolMetrics.expiredPoolsCount} Nonaktif` 
                  : `${poolMetrics.totalPools} Aktif`}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {poolMetrics.expiredPoolsCount > 0 
                  ? `${poolMetrics.expiredPoolsCount} Akun Expired (Otomatis Nonaktif)` 
                  : poolMetrics.masterExpiringCount > 0 
                  ? `${poolMetrics.masterExpiringCount} Akun Expire ≤ 30 Hari` 
                  : 'Semua Akun Induk Normal'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setTierFilter('ALL')}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
            tierFilter === 'ALL'
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
          )}
        >
          <span>Semua Pool</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20">
            {pools.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTierFilter('GUARANTEED')}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
            tierFilter === 'GUARANTEED'
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          )}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Garansi Perpanjang (6-12 Bln)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20">
            {poolMetrics.guaranteedPoolsCount} Pool • {poolMetrics.availableGuaranteedSlots} Slot
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTierFilter('SHORT_TERM')}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
            tierFilter === 'SHORT_TERM'
              ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
              : "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-950/30"
          )}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Khusus Akun Lepas (2-3 Bln)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20">
            {poolMetrics.shortTermPoolsCount} Pool • {poolMetrics.availableShortTermSlots} Slot
          </span>
        </button>

        {poolMetrics.expiredPoolsCount > 0 && (
          <button
            type="button"
            onClick={() => setTierFilter('EXPIRED')}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
              tierFilter === 'EXPIRED'
                ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
                : "bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            )}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Nonaktif / Expired</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20">
              {poolMetrics.expiredPoolsCount} Pool
            </span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={activeSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari pool, email akun induk, atau nama member..."
            className="w-full pl-9 pr-3.5 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 shadow-xs"
          />
          {activeSearchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Privacy Eye Toggle for Master Cost */}
          <button
            type="button"
            onClick={() => setShowAllModalCost(!showAllModalCost)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
            title={showAllModalCost ? "Sembunyikan modal akun induk" : "Lihat modal akun induk"}
          >
            {showAllModalCost ? <EyeOff className="h-3.5 w-3.5 text-rose-500" /> : <Eye className="h-3.5 w-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{showAllModalCost ? 'Sembunyikan Modal' : 'Lihat Modal'}</span>
          </button>

          {/* Sort Dropdown for Pools */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as PoolSortOption)}
              className="bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              <option value="EXPIRY_ASC">📅 Masa Aktif Induk Terdekat (Expired di Bawah)</option>
              <option value="EXPIRY_DESC">⏳ Masa Aktif Induk Terjauh</option>
              <option value="AVAILABLE_SLOTS">🟢 Sisa Slot Kosong Terbanyak</option>
              <option value="NAME_ASC">🏢 Nama Pool (A - Z)</option>
              <option value="LATEST">✨ Terbaru Dibuat</option>
            </select>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold focus:outline-none shadow-xs"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="google_one">Google One Family</option>
            <option value="canva_team">Canva Pro Team</option>
            <option value="workspace">Google Workspace</option>
            <option value="adobe_seat">Adobe Creative Cloud</option>
            <option value="ai_tools">AI Tools (ChatGPT / Claude)</option>
            <option value="other">Lainnya</option>
          </select>
        </div>
      </div>

      {/* Pools Grid */}
      {filteredPools.length === 0 ? (
        <div className="bezel-shell">
          <div className="bezel-core p-12 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 flex items-center justify-center mb-3">
              <Building className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Belum Ada Pool / Akun Induk Terdaftar
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Daftarkan grup Google One 5TB Family, Canva Team, atau Workspace untuk memonitor kapasitas slot member dan masa aktif akun utama.
            </p>
            <button
              onClick={onOpenAddPoolModal}
              className="mt-4 group flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>+ Daftarkan Pool Pertama</span>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
                <Plus className="h-3 w-3 text-white" />
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPools.map((pool) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              subscriptions={subscriptions}
              onAddMemberToPool={onAddMemberToPool}
              onEditPool={onEditPool}
              onRequestDeletePool={onRequestDeletePool}
              onOpenWhatsAppModal={onOpenWhatsAppModal}
              onOpenMemberChecklist={onOpenMemberChecklist}
              onMoveMemberPool={onMoveMemberPool}
              onReactivateMemberInPool={onReactivateMemberInPool}
              showModalCostByDefault={showAllModalCost}
            />
          ))}
        </div>
      )}
    </div>
  );
};
