'use client';

import React, { useState, useMemo } from 'react';
import { 
  RefreshCw, 
  PlusCircle, 
  Trash2, 
  History, 
  AlertOctagon, 
  MessageSquare, 
  Repeat, 
  Layers, 
  ArrowRight
} from 'lucide-react';
import { ActivityLog } from '@/types/subscription';
import { formatDate } from '@/lib/utils';

interface RecentActivityFeedProps {
  activityLogs: ActivityLog[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activityLogs,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    const sorted = [...activityLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (filterType === 'ALL') return sorted;
    if (filterType === 'SWAP_KICK') {
      return sorted.filter(l => l.actionType === 'TERMINATED' || l.actionType === 'MEMBER_SWAPPED');
    }
    if (filterType === 'ERRORS') {
      return sorted.filter(l => l.actionType === 'ERROR_LOGGED' || l.severity === 'error' || l.severity === 'warning');
    }
    if (filterType === 'RENEW') {
      return sorted.filter(l => l.actionType === 'RENEWED');
    }
    if (filterType === 'WHATSAPP') {
      return sorted.filter(l => l.actionType === 'WA_SENT');
    }
    if (filterType === 'POOLS') {
      return sorted.filter(l => l.actionType?.startsWith('POOL_'));
    }
    return sorted;
  }, [activityLogs, filterType]);

  const getLogDetails = (log: ActivityLog) => {
    switch (log.actionType) {
      case 'ERROR_LOGGED':
        return {
          icon: <AlertOctagon className="h-4 w-4 text-rose-500" />,
          bgColor: 'bg-rose-500/10 dark:bg-rose-950/30',
          borderColor: 'border-rose-500/20',
          badgeText: 'ERROR',
          badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20',
        };
      case 'MEMBER_SWAPPED':
        return {
          icon: <Repeat className="h-4 w-4 text-purple-500" />,
          bgColor: 'bg-purple-500/10 dark:bg-purple-950/30',
          borderColor: 'border-purple-500/20',
          badgeText: 'PERGANTIAN',
          badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-purple-500/20',
        };
      case 'TERMINATED':
      case 'MEMBER_KICKED':
      case 'DELETED':
        return {
          icon: <Trash2 className="h-4 w-4 text-rose-500" />,
          bgColor: 'bg-rose-500/10 dark:bg-rose-950/30',
          borderColor: 'border-rose-500/20',
          badgeText: log.actionType === 'MEMBER_KICKED' ? 'MEMBER KICKED' : log.actionType === 'DELETED' ? 'DELETED' : 'TERMINATED',
          badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20',
        };
      case 'RENEWED':
        return {
          icon: <RefreshCw className="h-4 w-4 text-blue-500" />,
          bgColor: 'bg-blue-500/10 dark:bg-blue-950/30',
          borderColor: 'border-blue-500/20',
          badgeText: 'PERPANJANGAN',
          badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20',
        };
      case 'WA_SENT':
        return {
          icon: <MessageSquare className="h-4 w-4 text-emerald-500" />,
          bgColor: 'bg-emerald-500/10 dark:bg-emerald-950/30',
          borderColor: 'border-emerald-500/20',
          badgeText: 'WA SENT',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
        };
      case 'POOL_CREATED':
      case 'POOL_UPDATED':
      case 'POOL_DELETED':
        return {
          icon: <Layers className="h-4 w-4 text-indigo-500" />,
          bgColor: 'bg-indigo-500/10 dark:bg-indigo-950/30',
          borderColor: 'border-indigo-500/20',
          badgeText: 'POOL MASTER',
          badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-indigo-500/20',
        };
      case 'CREATED':
        return {
          icon: <PlusCircle className="h-4 w-4 text-indigo-500" />,
          bgColor: 'bg-indigo-500/10 dark:bg-indigo-950/30',
          borderColor: 'border-indigo-500/20',
          badgeText: 'MEMBER BARU',
          badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-indigo-500/20',
        };
      default:
        return {
          icon: <History className="h-4 w-4 text-slate-400" />,
          bgColor: 'bg-slate-100 dark:bg-slate-800',
          borderColor: 'border-slate-200 dark:border-slate-700',
          badgeText: 'LOG',
          badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-500',
        };
    }
  };

  return (
    <div className="bezel-shell">
      <div className="bezel-core p-5 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <History className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Audit Trail & Riwayat Aksi ({activityLogs.length})
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              Log otomatis pergantian slot, perpanjangan, broadcast WhatsApp, dan insiden
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType('SWAP_KICK')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                filterType === 'SWAP_KICK'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Kick / Swap
            </button>
            <button
              onClick={() => setFilterType('ERRORS')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                filterType === 'ERRORS'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Error & Alert
            </button>
            <button
              onClick={() => setFilterType('RENEW')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                filterType === 'RENEW'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Renewal
            </button>
            <button
              onClick={() => setFilterType('WHATSAPP')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                filterType === 'WHATSAPP'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              WhatsApp
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-2.5 text-xs max-h-96 overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-400 font-medium">
              Belum ada catatan aktivitas untuk filter ini.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const details = getLogDetails(log);

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 transition-colors"
                >
                  <div className={`mt-0.5 p-2 rounded-xl ${details.bgColor} ring-1 ${details.borderColor} shrink-0`}>
                    {details.icon}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider ring-1 ${details.badgeColor}`}>
                        {details.badgeText}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {formatDate(log.timestamp, 'dd MMM yyyy, HH:mm')}
                      </span>
                    </div>

                    <p className="text-slate-900 dark:text-slate-100 font-medium leading-snug">
                      {log.description}
                    </p>

                    {/* Diff / Value Change Indicator */}
                    {(log.oldValue || log.newValue) && (
                      <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-700/50 text-[10px]">
                        {log.oldValue && (
                          <span className="text-rose-500 line-through truncate max-w-[120px]">
                            {log.oldValue}
                          </span>
                        )}
                        {log.oldValue && log.newValue && (
                          <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                        )}
                        {log.newValue && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[140px]">
                            {log.newValue}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                      {log.subscriptionName && (
                        <span className="font-bold text-slate-600 dark:text-slate-300">
                          {log.subscriptionName}
                        </span>
                      )}
                      {log.memberName && (
                        <>
                          <span>•</span>
                          <span className="text-slate-500">Member: {log.memberName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
