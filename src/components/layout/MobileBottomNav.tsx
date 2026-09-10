'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Users, 
  BarChart3, 
  AlertOctagon,
  Plus
} from 'lucide-react';
import { NavTab } from '@/components/layout/Sidebar';

interface MobileBottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  needActionCount: number;
  onQuickAdd: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  needActionCount,
  onQuickAdd,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#070b14]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 pt-1 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-around relative max-w-md mx-auto h-16">
        
        {/* Tab 1: Home / Dashboard */}
        <button
          type="button"
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <LayoutDashboard className={`h-5 w-5 transition-transform ${activeTab === 'dashboard' ? 'scale-110' : ''}`} />
            {activeTab === 'dashboard' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Home</span>
        </button>

        {/* Tab 2: Pools */}
        <button
          type="button"
          onClick={() => onTabChange('pools')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'pools'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <Layers className={`h-5 w-5 transition-transform ${activeTab === 'pools' ? 'scale-110' : ''}`} />
            {activeTab === 'pools' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Pools</span>
        </button>

        {/* Center Floating Action Button (FAB) */}
        <div className="relative -top-3 flex items-center justify-center px-2">
          <button
            type="button"
            onClick={onQuickAdd}
            aria-label="Tambah Member Baru"
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-[#070b14]"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 3: Action Inbox (or Members) */}
        <button
          type="button"
          onClick={() => onTabChange(needActionCount > 0 ? 'action_inbox' : 'all_subscriptions')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'action_inbox' || activeTab === 'all_subscriptions'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            {needActionCount > 0 ? (
              <>
                <AlertOctagon className="h-5 w-5 text-rose-500 animate-pulse" />
                <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[9px] font-extrabold rounded-full px-1 min-w-3.5 h-3.5 flex items-center justify-center">
                  {needActionCount}
                </span>
              </>
            ) : (
              <Users className={`h-5 w-5 transition-transform ${activeTab === 'all_subscriptions' ? 'scale-110' : ''}`} />
            )}
            {(activeTab === 'action_inbox' || activeTab === 'all_subscriptions') && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">
            {needActionCount > 0 ? 'Tindak' : 'Member'}
          </span>
        </button>

        {/* Tab 4: Analytics */}
        <button
          type="button"
          onClick={() => onTabChange('analytics')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <BarChart3 className={`h-5 w-5 transition-transform ${activeTab === 'analytics' ? 'scale-110' : ''}`} />
            {activeTab === 'analytics' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Laba</span>
        </button>

      </div>
    </div>
  );
};
