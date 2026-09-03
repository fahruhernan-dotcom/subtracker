'use client';

import React, { useState } from 'react';
import { 
  Layers, 
  Users, 
  Clock, 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { AccountPool, Subscription } from '@/types/subscription';
import { formatDate, getDaysRemaining, formatCurrency } from '@/lib/utils';

interface PoolCardProps {
  pool: AccountPool;
  subscriptions: Subscription[];
  onAddMemberToPool: (pool: AccountPool) => void;
  onEditPool: (pool: AccountPool) => void;
  onRequestDeletePool: (pool: AccountPool) => void;
  onOpenWhatsAppModal: (sub: Subscription) => void;
  onOpenMemberChecklist: (sub: Subscription) => void;
}

export const PoolCard: React.FC<PoolCardProps> = ({
  pool,
  subscriptions,
  onAddMemberToPool,
  onEditPool,
  onRequestDeletePool,
  onOpenWhatsAppModal,
  onOpenMemberChecklist,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Members allocated to this pool (active & expiring)
  const poolMembers = subscriptions.filter(
    s => (s.poolId === pool.id || s.poolName?.toLowerCase() === pool.name.toLowerCase()) && s.status !== 'TERMINATED'
  );

  const activeCount = poolMembers.length;
  const availableSlots = Math.max(0, pool.totalCapacity - activeCount);
  const occupancyPercent = Math.min(100, Math.round((activeCount / pool.totalCapacity) * 100));

  // Compute monthly revenue of this pool
  const monthlyRevenue = poolMembers.reduce((sum, sub) => {
    let rate = sub.price;
    if (sub.billingCycle === 'yearly') rate = sub.price / 12;
    else if (sub.billingCycle === 'quarterly') rate = sub.price / 3;
    else if (sub.billingCycle === 'semi_annual') rate = sub.price / 6;
    return sum + rate;
  }, 0);

  // Master account expiry calculation
  const masterDaysLeft = getDaysRemaining(pool.masterEndDate);
  const isMasterExpiringSoon = masterDaysLeft <= 14 && masterDaysLeft >= 0;
  const isMasterExpired = masterDaysLeft < 0;

  const handleCopy = (type: 'email' | 'password', text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(type);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bezel-shell group hover:border-blue-500/30 transition-all duration-300">
      <div className="bezel-core p-5 sm:p-6 space-y-4">
        
        {/* Main Horizontal Layout: 3 Columns on Large Screens */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          
          {/* COLUMN 1 (Left, 5 cols): Pool Identity & Credentials */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-2xl ${pool.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center shadow-md ring-2 ring-white/10 shrink-0`}>
                <Layers className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="eyebrow-pill text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {pool.provider}
                  </span>
                  {availableSlots === 0 ? (
                    <span className="eyebrow-pill text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
                      Slot Penuh
                    </span>
                  ) : (
                    <span className="eyebrow-pill text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                      {availableSlots} Slot Kosong
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight mt-0.5 leading-snug break-words" title={pool.name}>
                  {pool.name}
                </h3>
              </div>
            </div>

            {/* Inset Credentials Bar */}
            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
              {/* Email Master */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0 text-slate-600 dark:text-slate-300">
                  <Mail className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span className="truncate font-mono font-medium text-xs" title={pool.masterEmail}>
                    {pool.masterEmail}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('email', pool.masterEmail)}
                  className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                  title="Salin Email Master"
                >
                  {copiedField === 'email' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Password Master */}
              <div className="flex items-center justify-between gap-2 text-xs pt-1.5 border-t border-slate-200/60 dark:border-slate-750">
                <div className="flex items-center gap-2 min-w-0 text-slate-600 dark:text-slate-300">
                  <KeyRound className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  {pool.masterPassword ? (
                    <span className="font-mono font-bold tracking-wider text-[11px] truncate">
                      {showPassword ? pool.masterPassword : '••••••••••••'}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onEditPool(pool)}
                      className="text-[11px] text-slate-400 hover:text-blue-500 hover:underline italic cursor-pointer"
                    >
                      + Simpan password akun
                    </button>
                  )}
                </div>

                {pool.masterPassword && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title={showPassword ? "Sembunyikan password" : "Lihat password"}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy('password', pool.masterPassword!)}
                      className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Salin Password"
                    >
                      {copiedField === 'password' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Master Expiry Pill */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span>Masa Aktif Akun Induk:</span>
              </div>
              <div className="font-extrabold flex items-center gap-1 font-mono">
                {isMasterExpired ? (
                  <span className="text-rose-600 dark:text-rose-400">Expired ({Math.abs(masterDaysLeft)}d lalu)</span>
                ) : isMasterExpiringSoon ? (
                  <span className="text-amber-600 dark:text-amber-400">{masterDaysLeft} hari lagi ({formatDate(pool.masterEndDate)})</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">{masterDaysLeft} hari lagi ({formatDate(pool.masterEndDate)})</span>
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 2 (Middle, 4 cols): Capacity Progress & Financials */}
          <div className="lg:col-span-4 space-y-3 lg:px-4 lg:border-x lg:border-slate-100 dark:lg:border-slate-800">
            {/* Slot Capacity Stats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-blue-500" />
                  Kapasitas Slot Member:
                </span>
                <span className="text-slate-900 dark:text-white font-extrabold font-mono">
                  {activeCount} / {pool.totalCapacity} Slot ({occupancyPercent}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${occupancyPercent}%` }}
                  className={`h-full transition-all duration-500 rounded-full ${
                    availableSlots === 0 ? 'bg-emerald-500 shadow-xs' : 'bg-blue-600'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span>Terisi: <strong className="text-slate-800 dark:text-slate-200">{activeCount} member</strong></span>
                <span>Sisa: <strong className={availableSlots > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}>{availableSlots} slot</strong></span>
              </div>
            </div>

            {/* Financial Performance Mini Banner */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Omset Pool
                </span>
                <span className="font-mono font-black text-slate-900 dark:text-white">
                  {formatCurrency(monthlyRevenue, 'IDR')}<span className="text-[10px] font-normal text-slate-400">/bln</span>
                </span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Modal Induk
                </span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(pool.masterCost || 0, 'IDR')}<span className="text-[10px] font-normal text-slate-400">/thn</span>
                </span>
              </div>
            </div>
          </div>

          {/* COLUMN 3 (Right, 3 cols): Avatars, Roster Toggle & Primary Actions */}
          <div className="lg:col-span-3 flex flex-col justify-between h-full space-y-3">
            
            {/* Top Row: Member Avatars Cluster + Edit/Delete */}
            <div className="flex items-center justify-between gap-2">
              {/* Member Avatar Bubble Cluster */}
              <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 cursor-pointer group/avatars"
                title="Klik untuk melihat daftar member"
              >
                <div className="flex -space-x-1.5 items-center p-0.5">
                  {poolMembers.slice(0, 4).map((m, idx) => {
                    const avatarPalette = [
                      'from-blue-500 to-indigo-600',
                      'from-emerald-500 to-teal-600',
                      'from-purple-500 to-pink-600',
                      'from-amber-500 to-orange-600',
                    ];
                    const bgClass = avatarPalette[idx % avatarPalette.length];
                    const initial = m.memberName ? m.memberName.trim().charAt(0).toUpperCase() : `${idx + 1}`;

                    return (
                      <div
                        key={m.id}
                        className={`h-8 w-8 rounded-full bg-gradient-to-br ${bgClass} text-white text-xs font-black flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-slate-900 group-hover/avatars:scale-105 transition-transform shrink-0`}
                        title={`${m.memberName} (${m.accountEmail})`}
                      >
                        <span className="leading-none select-none">{initial}</span>
                      </div>
                    );
                  })}
                </div>
                {poolMembers.length > 4 && (
                  <span className="h-6 px-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700 flex items-center justify-center">
                    +{poolMembers.length - 4}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEditPool(pool)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  title="Edit Data Pool"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onRequestDeletePool(pool)}
                  className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-900/30"
                  title="Hapus Pool"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Bottom Actions: Expand Member Drawer & Add Member */}
            <div className="space-y-2">
              {/* Expand Member Drawer Button */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
              >
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  <span>Lihat {poolMembers.length} Member</span>
                </span>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {/* Primary Allocate Member Button */}
              <button
                type="button"
                onClick={() => onAddMemberToPool(pool)}
                disabled={availableSlots === 0}
                className={`w-full group flex items-center justify-center gap-2 py-2 px-3.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  availableSlots > 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-[0.98]'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 cursor-not-allowed border border-slate-200/60 dark:border-slate-800'
                }`}
              >
                <span>{availableSlots > 0 ? '+ Alokasikan Member' : 'Slot Pool Penuh'}</span>
                {availableSlots > 0 && (
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
                    <Plus className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* EXPANDABLE MEMBER ROSTER DRAWER */}
        {isExpanded && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-blue-500" />
                Daftar Member Aktif di Pool Ini ({poolMembers.length} / {pool.totalCapacity}):
              </span>
              <span className="text-[10px] text-slate-400">
                Klik chevron untuk aksi checklist kick atau kirim WA
              </span>
            </div>

            {poolMembers.length === 0 ? (
              <div className="py-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-400 font-medium">
                Belum ada member yang dialokasikan ke pool ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {poolMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group/item"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-extrabold text-slate-900 dark:text-white truncate">
                        {member.memberName || 'Member'}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
                        {member.accountEmail}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                        Exp: {formatDate(member.endDate)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {member.clientPhone && (
                        <button
                          type="button"
                          onClick={() => onOpenWhatsAppModal(member)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                          title="Kirim Pesan WA"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenMemberChecklist(member)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                        title="Buka Checklist Kick"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
