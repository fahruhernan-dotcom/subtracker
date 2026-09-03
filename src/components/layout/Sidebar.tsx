'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  AlertOctagon, 
  Users, 
  PieChart, 
  History, 
  ShieldCheck,
  Layers,
  Zap,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavTab = 'dashboard' | 'pools' | 'action_inbox' | 'all_subscriptions' | 'pricelist' | 'analytics' | 'activity_logs';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  needActionCount: number;
  totalActiveCount: number;
  totalPoolsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  needActionCount,
  totalActiveCount,
  totalPoolsCount = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Admin Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'pools' as NavTab,
      label: 'Pools & Groups',
      icon: Layers,
      badge: totalPoolsCount > 0 ? { count: totalPoolsCount, variant: 'neutral' } : null,
    },
    {
      id: 'action_inbox' as NavTab,
      label: 'Kick Action Inbox',
      icon: AlertOctagon,
      badge: needActionCount > 0 ? { count: needActionCount, variant: 'danger' } : null,
    },
    {
      id: 'all_subscriptions' as NavTab,
      label: 'Member Slots',
      icon: Users,
      badge: totalActiveCount > 0 ? { count: totalActiveCount, variant: 'neutral' } : null,
    },
    {
      id: 'pricelist' as NavTab,
      label: 'Price List & Paket',
      icon: Tag,
      badge: null,
    },
    {
      id: 'analytics' as NavTab,
      label: 'Revenue & Metrics',
      icon: PieChart,
      badge: null,
    },
    {
      id: 'activity_logs' as NavTab,
      label: 'Audit & Kick Logs',
      icon: History,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 bg-white dark:bg-[#0a0e1a] border-r border-slate-200/90 dark:border-slate-800/90 flex flex-col justify-between shrink-0 hidden md:flex z-30 transition-colors">
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand Logo Header */}
          <div className="flex items-center gap-3 px-1 py-2 mb-6">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-2 ring-white/10 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black tracking-tight text-slate-900 dark:text-white text-base">
                  SubTracker
                </span>
                <span className="eyebrow-pill bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 py-0.5 px-1.5 text-[9px]">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">
                Multi-Account Pool Guard
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group cursor-pointer",
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                    )} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        "px-2 py-0.5 text-[10px] rounded-full font-black tracking-wider transition-transform group-hover:scale-105",
                        item.badge.variant === 'danger'
                          ? "bg-rose-500 text-white shadow-xs animate-pulse"
                          : isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {item.badge.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Card for Admin Pool Status */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
            <Zap className="h-3.5 w-3.5 shrink-0" />
            <span className="text-[11px] font-black uppercase tracking-wider">Manual Kick Engine</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Google/Canva tidak auto-kick member. Kelola slot dan kirim WA sebelum akses dicabut.
          </p>
        </div>
      </div>
    </aside>
  );
};
