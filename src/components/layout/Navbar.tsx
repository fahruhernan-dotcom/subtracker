'use client';

import React from 'react';
import { 
  Bell, 
  Search, 
  Moon, 
  Sun, 
  Plus, 
  Database,
  Calendar,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { AppNotification } from '@/types/subscription';

export type CloudSyncStatus = 'synced' | 'syncing' | 'offline' | 'unconfigured';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAddModal: () => void;
  onOpenNotifications: () => void;
  onOpenExportImport: () => void;
  onOpenCalendarSync?: () => void;
  notifications: AppNotification[];
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  cloudSyncStatus?: CloudSyncStatus;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  onOpenNotifications,
  onOpenExportImport,
  onOpenCalendarSync,
  notifications,
  isDarkMode,
  onToggleDarkMode,
  cloudSyncStatus = 'unconfigured',
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0a0e1a]/80 backdrop-blur-md sticky top-0 z-30 px-6 md:px-8 flex items-center justify-between transition-colors">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-full max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama member, email, pool, atau nomor WA..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all font-medium shadow-2xs"
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Cloud Sync Status Indicator */}
        <button
          onClick={onOpenExportImport}
          title={
            cloudSyncStatus === 'synced'
              ? 'Tersinkronisasi ke Cloud Supabase'
              : cloudSyncStatus === 'syncing'
              ? 'Sedang menyinkronkan data cloud...'
              : cloudSyncStatus === 'offline'
              ? 'Mode Offline (Menggunakan Cache Lokal)'
              : 'Supabase belum dikonfigurasi di Vercel (Klik untuk panduan)'
          }
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer shadow-2xs border ${
            cloudSyncStatus === 'synced'
              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/30'
              : cloudSyncStatus === 'syncing'
              ? 'text-blue-700 dark:text-blue-300 bg-blue-500/10 border-blue-500/30 animate-pulse'
              : cloudSyncStatus === 'offline'
              ? 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
              : 'text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/30'
          }`}
        >
          {cloudSyncStatus === 'synced' && (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Cloud className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">Cloud Synced</span>
            </>
          )}
          {cloudSyncStatus === 'syncing' && (
            <>
              <RefreshCw className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
              <span className="hidden md:inline">Syncing...</span>
            </>
          )}
          {cloudSyncStatus === 'unconfigured' && (
            <>
              <CloudOff className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden md:inline">Local Only</span>
            </>
          )}
          {cloudSyncStatus === 'offline' && (
            <>
              <CloudOff className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden md:inline">Offline Cache</span>
            </>
          )}
        </button>

        {/* Google Calendar Sync */}
        {onOpenCalendarSync && (
          <button
            onClick={onOpenCalendarSync}
            title="Google Calendar Live Sync"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 transition-all cursor-pointer shadow-2xs"
          >
            <Calendar className="h-3.5 w-3.5 text-blue-500" />
            <span>Google Calendar</span>
          </button>
        )}

        {/* Backup / Export */}
        <button
          onClick={onOpenExportImport}
          title="Backup & Restore Data"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
        >
          <Database className="h-3.5 w-3.5 text-slate-500" />
          <span>Backup</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          title={isDarkMode ? "Light Mode" : "Dark Mode"}
          className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        >
          {isDarkMode ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-slate-600" />}
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          title="Notifikasi Kick / Expiry"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Add Member CTA with Button-in-Button */}
        <button
          onClick={onOpenAddModal}
          className="group flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <span className="hidden sm:inline">+ Tambah Member</span>
          <span className="sm:hidden">+ Member</span>
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
            <Plus className="h-3 w-3 text-white" />
          </div>
        </button>
      </div>
    </header>
  );
};
