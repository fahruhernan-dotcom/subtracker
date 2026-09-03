'use client';

import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Plus, 
  Users, 
  Clock, 
  CheckCircle2, 
  Search,
  Building
} from 'lucide-react';
import { AccountPool, Subscription } from '@/types/subscription';
import { PoolCard } from './PoolCard';
import { getDaysRemaining } from '@/lib/utils';

interface PoolsViewProps {
  pools: AccountPool[];
  subscriptions: Subscription[];
  onOpenAddPoolModal: () => void;
  onEditPool: (pool: AccountPool) => void;
  onRequestDeletePool: (pool: AccountPool) => void;
  onAddMemberToPool: (pool: AccountPool) => void;
  onOpenWhatsAppModal: (sub: Subscription) => void;
  onOpenMemberChecklist: (sub: Subscription) => void;
}

export const PoolsView: React.FC<PoolsViewProps> = ({
  pools,
  subscriptions,
  onOpenAddPoolModal,
  onEditPool,
  onRequestDeletePool,
  onAddMemberToPool,
  onOpenWhatsAppModal,
  onOpenMemberChecklist,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Compute Pool Metrics
  const poolMetrics = useMemo(() => {
    let totalCapacity = 0;
    let totalOccupied = 0;
    let masterExpiringCount = 0;

    pools.forEach((p) => {
      totalCapacity += p.totalCapacity;
      const occupied = subscriptions.filter(
        s => (s.poolId === p.id || s.poolName?.toLowerCase() === p.name.toLowerCase()) && s.status !== 'TERMINATED'
      ).length;
      totalOccupied += occupied;

      const daysLeft = getDaysRemaining(p.masterEndDate);
      if (daysLeft <= 30 && daysLeft >= 0) {
        masterExpiringCount++;
      }
    });

    const totalAvailable = Math.max(0, totalCapacity - totalOccupied);
    const overallOccupancy = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    return {
      totalPools: pools.length,
      totalCapacity,
      totalOccupied,
      totalAvailable,
      overallOccupancy,
      masterExpiringCount,
    };
  }, [pools, subscriptions]);

  const filteredPools = useMemo(() => {
    return pools.filter((p) => {
      const matchesSearch = 
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.masterEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.provider.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [pools, searchQuery, categoryFilter]);

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

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bezel-shell">
          <div className="bezel-core p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Total Pool / Akun Induk
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {poolMetrics.totalPools} <span className="text-xs font-medium text-slate-400">Grup</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 */}
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
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bezel-shell">
          <div className="bezel-core p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Slot Kosong (Available)
              </span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {poolMetrics.totalAvailable} <span className="text-xs font-medium text-slate-400">Slot Siap Jual</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bezel-shell">
          <div className="bezel-core p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Akun Induk Jatuh Tempo (30d)
              </span>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                {poolMetrics.masterExpiringCount} <span className="text-xs font-medium text-slate-400">Akun</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pool, email akun induk, atau provider..."
            className="w-full pl-9 pr-3.5 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
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
            />
          ))}
        </div>
      )}
    </div>
  );
};
