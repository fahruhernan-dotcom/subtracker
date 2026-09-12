'use client';

import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { 
  Plus, 
  Grid, 
  List, 
  AlertOctagon, 
  Users, 
  Building,
  ArrowUpDown
} from 'lucide-react';
import { 
  MemberSortOption, 
  matchesSubscriptionSearch, 
  sortSubscriptions 
} from '@/lib/searchSort';
import { 
  Subscription, 
  AccountPool,
  ActivityLog, 
  AppNotification,
  PricingPackage,
  BillingCycle
} from '@/types/subscription';
import { 
  db, 
  initializeDatabaseWithSeed 
} from '@/lib/db/dexie-db';
import { isSupabaseConfigured } from '@/lib/supabase';
import { 
  syncLocalAndCloud, 
  upsertSubscriptionCloud, 
  deleteSubscriptionCloud, 
  upsertPoolCloud, 
  deletePoolCloud, 
  upsertPackageCloud, 
  deletePackageCloud, 
  logActivityCloud, 
  subscribeToCloudChanges 
} from '@/lib/supabase-service';
import { 
  resolveSubscriptionStatus, 
  computeDashboardMetrics, 
  generateNotificationsFromSubscriptions 
} from '@/lib/lifecycle/state-engine';
import { formatDate, getDaysRemaining, formatCurrency } from '@/lib/utils';
import { format, parseISO, addMonths, isValid } from 'date-fns';
import { Navbar, CloudSyncStatus } from '@/components/layout/Navbar';
import { Sidebar, NavTab } from '@/components/layout/Sidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { MetricsSummary } from '@/components/dashboard/MetricsSummary';
import { ActionInboxBanner } from '@/components/dashboard/ActionInboxBanner';
import { UpcomingRenewalsSidebar } from '@/components/dashboard/UpcomingRenewalsSidebar';
import { CategoryExpenseChart } from '@/components/dashboard/CategoryExpenseChart';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { SubscriptionCard } from '@/components/subscriptions/SubscriptionCard';
import { SubscriptionTable } from '@/components/subscriptions/SubscriptionTable';
import { ActionChecklistModal } from '@/components/subscriptions/ActionChecklistModal';
import { AddEditSubscriptionModal } from '@/components/subscriptions/AddEditSubscriptionModal';
import { QuickRenewModal } from '@/components/subscriptions/QuickRenewModal';
import { MoveMemberPoolModal } from '@/components/pools/MoveMemberPoolModal';
import { WhatsAppMessageModal } from '@/components/subscriptions/WhatsAppMessageModal';
import { NotificationCenterDrawer } from '@/components/subscriptions/NotificationCenterDrawer';
import { ExportImportModal } from '@/components/subscriptions/ExportImportModal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { PoolsView } from '@/components/pools/PoolsView';
import { savePoolToVault, deleteFromVault } from '@/lib/vault/vault-manager';
import { AddEditPoolModal } from '@/components/pools/AddEditPoolModal';
import { GoogleCalendarSyncModal } from '@/components/calendar/GoogleCalendarSyncModal';
import { FinancialAnalyticsView } from '@/components/dashboard/FinancialAnalyticsView';
import { PriceListView } from '@/components/pricelist/PriceListView';

const generateSubId = () => `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
const generatePoolId = () => `pool-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
const generateLogId = () => `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function subscribeTheme(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    mql.removeEventListener('change', callback);
  };
}

function getThemeSnapshot() {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('theme');
  if (saved) return saved === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getThemeServerSnapshot() {
  return false;
}

export default function DashboardMain() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pools, setPools] = useState<AccountPool[]>([]);
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<MemberSortOption>('EXPIRY_ASC');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  const systemDarkMode = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  );
  const [manualDarkMode, setManualDarkMode] = useState<boolean | null>(null);
  const isDarkMode = manualDarkMode !== null ? manualDarkMode : systemDarkMode;

  const mounted = useMounted();

  // Modals & Drawers
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [preselectedPool, setPreselectedPool] = useState<AccountPool | null>(null);
  const [isAddPoolOpen, setIsAddPoolOpen] = useState(false);
  const [editingPool, setEditingPool] = useState<AccountPool | null>(null);
  const [checklistSub, setChecklistSub] = useState<Subscription | null>(null);
  const [renewSub, setRenewSub] = useState<Subscription | null>(null);
  const [movingSub, setMovingSub] = useState<Subscription | null>(null);
  const [waModalSub, setWaModalSub] = useState<Subscription | null>(null);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [isCalendarSyncOpen, setIsCalendarSyncOpen] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>(
    isSupabaseConfigured ? 'syncing' : 'unconfigured'
  );

  // Custom Confirmation Dialog State (Zero Native Popups)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    targetName: string;
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirmAction: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    targetName: '',
    confirmLabel: 'Hapus',
    variant: 'danger',
    onConfirmAction: async () => {},
  });

  // 1. Initial Load & Cloud Sync Database
  const loadData = async () => {
    try {
      if (isSupabaseConfigured) {
        setCloudSyncStatus('syncing');
      }
      const { subscriptions: subs, pools: loadedPools, packages: loadedPkgs, activityLogs: logs } = await syncLocalAndCloud();

      const evaluatedSubs = subs.map(s => ({
        ...s,
        status: resolveSubscriptionStatus(s),
      }));

      setSubscriptions(evaluatedSubs);
      setPools(loadedPools);
      setPackages(loadedPkgs || []);
      setActivityLogs(logs || []);
      setNotifications(generateNotificationsFromSubscriptions(evaluatedSubs));
      setCloudSyncStatus(isSupabaseConfigured ? 'synced' : 'unconfigured');
    } catch (err) {
      console.error('Error loading data from database', err);
      setCloudSyncStatus(isSupabaseConfigured ? 'offline' : 'unconfigured');
    }
  };

  useEffect(() => {
    let isCurrent = true;

    async function initialFetch() {
      try {
        if (isSupabaseConfigured) {
          setCloudSyncStatus('syncing');
        }
        const { subscriptions: subs, pools: loadedPools, packages: loadedPkgs, activityLogs: logs } = await syncLocalAndCloud();

        const evaluatedSubs = subs.map(s => ({
          ...s,
          status: resolveSubscriptionStatus(s),
        }));

        if (isCurrent) {
          setSubscriptions(evaluatedSubs);
          setPools(loadedPools);
          setPackages(loadedPkgs || []);
          setActivityLogs(logs || []);
          setNotifications(generateNotificationsFromSubscriptions(evaluatedSubs));
          setCloudSyncStatus(isSupabaseConfigured ? 'synced' : 'unconfigured');
        }
      } catch (err) {
        console.error('Error loading data from database', err);
        if (isCurrent) {
          setCloudSyncStatus(isSupabaseConfigured ? 'offline' : 'unconfigured');
        }
      }
    }

    initialFetch();

    // Subscribe to live cloud changes from other devices/tabs
    const unsubscribeCloud = subscribeToCloudChanges(() => {
      if (isCurrent) {
        loadData();
      }
    });

    const handleExtensionError = (event: ErrorEvent) => {
      const filename = event.filename || (event.error && event.error.stack) || '';
      const message = event.message || (event.error && event.error.message) || '';
      if (
        filename.includes('chrome-extension://') ||
        filename.includes('moz-extension://') ||
        message.includes('M_ID') ||
        message.includes('bis_skin_checked')
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Catch and neutralize errors thrown by external browser extensions
      if (
        (event.reason && typeof event.reason.stack === 'string' && (event.reason.stack.includes('chrome-extension://') || event.reason.stack.includes('moz-extension://'))) ||
        (event.reason?.message && (event.reason.message.includes('M_ID') || event.reason.message.includes('bis_skin_checked')))
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener('error', handleExtensionError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

    return () => {
      isCurrent = false;
      unsubscribeCloud();
      window.removeEventListener('error', handleExtensionError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    const next = !isDarkMode;
    setManualDarkMode(next);
    if (typeof window !== 'undefined') {
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  };

  // 2. Metrics & Dynamic Derivations
  const metrics = useMemo(() => {
    return computeDashboardMetrics(subscriptions, pools);
  }, [subscriptions, pools]);

  const urgentSubscriptions = useMemo(() => {
    return subscriptions.filter(s => s.status === 'ACTION_REQUIRED');
  }, [subscriptions]);

  const filteredSubscriptions = useMemo(() => {
    const matched = subscriptions.filter(s => {
      const matchesSearch = matchesSubscriptionSearch(s, searchQuery);
      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    return sortSubscriptions(matched, sortOption);
  }, [subscriptions, searchQuery, statusFilter, categoryFilter, sortOption]);

  // 3. Database Mutations - Members
  const handleSaveSubscription = async (
    data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>,
    editId?: string
  ) => {
    const now = new Date().toISOString();

    if (editId) {
      const existing = subscriptions.find(s => s.id === editId);
      if (!existing) return;

      const updated: Subscription = {
        ...existing,
        ...data,
        updatedAt: now,
      };
      updated.status = resolveSubscriptionStatus(updated);

      await db.subscriptions.put(updated);
      await upsertSubscriptionCloud(updated);
      await logActivity(
        editId, 
        updated.name, 
        updated.memberName,
        'UPDATED', 
        `Memperbarui data member ${updated.memberName} (${updated.name})`
      );
    } else {
      const newSub: Subscription = {
        ...data,
        id: generateSubId(),
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE',
      };
      newSub.status = resolveSubscriptionStatus(newSub);

      await db.subscriptions.add(newSub);
      await upsertSubscriptionCloud(newSub);
      await logActivity(
        newSub.id, 
        newSub.name, 
        newSub.memberName,
        'CREATED', 
        `Menambahkan member baru ${newSub.memberName} ke ${newSub.poolName || newSub.name}`
      );
    }

    await loadData();
    setIsAddEditOpen(false);
    setEditingSub(null);
    setPreselectedPool(null);
  };

  const handleUpdateSubscription = async (updated: Subscription) => {
    updated.status = resolveSubscriptionStatus(updated);
    await db.subscriptions.put(updated);
    await upsertSubscriptionCloud(updated);
    await loadData();
    if (checklistSub && checklistSub.id === updated.id) {
      setChecklistSub(updated);
    }
  };

  // 4. Database Mutations - Master Pools
  const handleSavePool = async (
    poolData: Omit<AccountPool, 'id' | 'createdAt' | 'updatedAt'>,
    editId?: string
  ) => {
    const now = new Date().toISOString();

    if (editId) {
      const existing = pools.find(p => p.id === editId);
      if (!existing) return;

      const updatedPool: AccountPool = {
        ...existing,
        ...poolData,
        updatedAt: now,
      };

      await db.pools.put(updatedPool);
      await upsertPoolCloud(updatedPool);
      if (updatedPool.masterPassword) {
        await savePoolToVault(updatedPool);
      }
      await logActivity(
        editId,
        updatedPool.name,
        undefined,
        'POOL_UPDATED',
        `Memperbarui data akun induk / pool ${updatedPool.name} (Kredensial tersimpan di Vault)`
      );
    } else {
      const newPool: AccountPool = {
        ...poolData,
        id: generatePoolId(),
        createdAt: now,
        updatedAt: now,
      };

      await db.pools.add(newPool);
      await upsertPoolCloud(newPool);
      if (newPool.masterPassword) {
        await savePoolToVault(newPool);
      }
      await logActivity(
        newPool.id,
        newPool.name,
        undefined,
        'POOL_CREATED',
        `Mendaftarkan pool akun induk baru ${newPool.name} (Kapasitas: ${newPool.totalCapacity} slot, Kredensial tersimpan di Vault)`
      );
    }

    await loadData();
    setIsAddPoolOpen(false);
    setEditingPool(null);
  };

  const triggerDeletePoolConfirm = (pool: AccountPool) => {
    const attachedMembers = subscriptions.filter(s => s.poolId === pool.id);
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Pool Akun Induk?',
      description: `Pool "${pool.name}" (${attachedMembers.length} member teralokasi) akan dihapus. Akun member yang terdaftar tidak akan hilang tapi poolId akan dilepas.`,
      targetName: pool.name,
      confirmLabel: 'Ya, Hapus Pool',
      variant: 'danger',
      onConfirmAction: async () => {
        await db.pools.delete(pool.id);
        await deletePoolCloud(pool.id);
        await deleteFromVault(pool.id);
        // detach pool from attached members
        for (const m of attachedMembers) {
          const detached = { ...m, poolId: undefined, poolName: undefined };
          await db.subscriptions.update(m.id, { poolId: undefined, poolName: undefined });
          await upsertSubscriptionCloud(detached);
        }
        await logActivity(
          pool.id,
          pool.name,
          undefined,
          'POOL_DELETED',
          `Menghapus pool akun induk ${pool.name}`
        );
        await loadData();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const triggerDeleteMemberConfirm = (sub: Subscription) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Data Member?',
      description: `Data slot member "${sub.memberName || sub.name}" (${sub.accountEmail}) akan dihapus permanen dari database lokal.`,
      targetName: `${sub.memberName || sub.name} (${sub.accountEmail})`,
      confirmLabel: 'Ya, Hapus Member',
      variant: 'danger',
      onConfirmAction: async () => {
        await db.subscriptions.delete(sub.id);
        await deleteSubscriptionCloud(sub.id);
        await logActivity(
          sub.id,
          sub.name,
          sub.memberName,
          'DELETED',
          `Menghapus data member ${sub.memberName || sub.name}`
        );
        await loadData();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Kick & Terminate Flow with Custom Dialog (Soft-Kick Archive Preservation)
  const triggerKickConfirm = (sub: Subscription) => {
    const uncompletedTasks = sub.checklist.filter(c => !c.completed).length;
    const isFullyChecked = uncompletedTasks === 0;

    setConfirmDialog({
      isOpen: true,
      title: isFullyChecked ? 'Konfirmasi Kick & Simpan di Arsip' : 'Peringatan: Checklist Belum Lengkap!',
      description: isFullyChecked
        ? `Akses ${sub.memberName || 'member'} di ${sub.name} telah diputus dan checklist selesai. Slot siap dikosongkan untuk pembeli baru. Data profil, no WhatsApp, dan histori member tetap tersimpan aman di arsip pool.`
        : `Masih ada ${uncompletedTasks} tindakan admin yang belum dicentang. Pastikan akun ${sub.accountEmail} sudah benar-benar di-kick dari Family / Admin Console agar tidak ada akses bocor! Data member tetap tersimpan di arsip riwayat pool.`,
      targetName: `${sub.memberName} • ${sub.accountEmail}`,
      confirmLabel: isFullyChecked ? '✓ Kick & Simpan di Arsip' : 'Tetap Kick & Simpan di Arsip',
      variant: isFullyChecked ? 'warning' : 'danger',
      onConfirmAction: async () => {
        const completedChecklist = sub.checklist.map(c => ({ ...c, completed: true }));
        const updated: Subscription = {
          ...sub,
          status: 'TERMINATED',
          checklist: completedChecklist,
          updatedAt: new Date().toISOString(),
          terminatedAt: new Date().toISOString(),
        };

        await db.subscriptions.put(updated);
        await upsertSubscriptionCloud(updated);
        await logActivity(
          sub.id, 
          sub.name, 
          sub.memberName,
          'MEMBER_KICKED', 
          `Member ${sub.memberName} (${sub.accountEmail}) telah di-kick dari pool "${sub.poolName || sub.name}". Slot dikosongkan, profil tersimpan di riwayat arsip.`
        );
        await loadData();
        setChecklistSub(null);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Quick Renewal Handler
  const handleConfirmRenew = async (
    sub: Subscription,
    newStartDate: string,
    newEndDate: string,
    resetChecklist: boolean
  ) => {
    const now = new Date().toISOString();
    const updatedChecklist = resetChecklist
      ? sub.checklist.map(c => ({ ...c, completed: false, completedAt: undefined }))
      : sub.checklist;

    const updated: Subscription = {
      ...sub,
      startDate: newStartDate,
      endDate: newEndDate,
      checklist: updatedChecklist,
      updatedAt: now,
    };
    updated.status = resolveSubscriptionStatus(updated);

    await db.subscriptions.put(updated);
    await upsertSubscriptionCloud(updated);
    await logActivity(
      sub.id,
      sub.name,
      sub.memberName,
      'RENEWED',
      `Memperpanjang masa aktif member ${sub.memberName} hingga ${newEndDate}`
    );
    await loadData();
    setRenewSub(null);
  };

  // Move Member Pool Handler (Transfer across pools without losing data)
  const handleConfirmMovePool = async (
    sub: Subscription,
    targetPool: AccountPool,
    transferOption: 'keep_dates' | 'renew',
    newDurationMonths?: number,
    newBillingCycle?: BillingCycle,
    renewalPrice?: number
  ) => {
    const oldPoolName = sub.poolName || 'Tanpa Pool';
    const now = new Date().toISOString();

    let newStartDate = sub.startDate;
    let newEndDate = sub.endDate;
    let newPrice = sub.price;

    if (transferOption === 'renew' && newDurationMonths) {
      const base = sub.status === 'TERMINATED' || getDaysRemaining(sub.endDate) < 0
        ? new Date()
        : parseISO(sub.endDate);
      const validBase = isValid(base) ? base : new Date();
      newStartDate = format(validBase, 'yyyy-MM-dd');
      newEndDate = format(addMonths(validBase, newDurationMonths), 'yyyy-MM-dd');
      if (renewalPrice !== undefined && renewalPrice > 0) {
        newPrice = renewalPrice;
      }
    }

    const updated: Subscription = {
      ...sub,
      poolId: targetPool.id,
      poolName: targetPool.name,
      price: newPrice,
      startDate: newStartDate,
      endDate: newEndDate,
      billingCycle: newBillingCycle || sub.billingCycle,
      status: 'ACTIVE',
      updatedAt: now,
      checklist: sub.checklist.map(c => ({ ...c, completed: false, completedAt: undefined })),
    };
    updated.status = resolveSubscriptionStatus(updated);

    await db.subscriptions.put(updated);
    await upsertSubscriptionCloud(updated);
    await logActivity(
      sub.id,
      updated.name,
      sub.memberName,
      'MEMBER_SWAPPED',
      `Member ${sub.memberName} (${sub.accountEmail}) dipindahkan dari "${oldPoolName}" ke "${targetPool.name}" (${transferOption === 'renew' ? `Perpanjang ${newDurationMonths} bln s/d ${formatDate(newEndDate)} (Kas: ${formatCurrency(newPrice, 'IDR')})` : `Masa aktif s/d ${formatDate(newEndDate)}`}). Data profil tersimpan utuh.`
    );

    await loadData();
    setMovingSub(null);
  };

  // Reactivate Terminated Member in Same Pool
  const handleReactivateInPool = async (sub: Subscription, pool: AccountPool) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Aktifkan Kembali Member di Pool Ini?',
      description: `Member ${sub.memberName} (${sub.accountEmail}) akan diaktifkan kembali dan mengisi 1 slot di ${pool.name}. Anda dapat memperpanjang masa aktifnya setelah ini.`,
      targetName: `${sub.memberName} • ${pool.name}`,
      confirmLabel: '✓ Aktifkan Kembali',
      variant: 'info',
      onConfirmAction: async () => {
        const now = new Date().toISOString();
        const updated: Subscription = {
          ...sub,
          poolId: pool.id,
          poolName: pool.name,
          status: 'ACTIVE',
          updatedAt: now,
          checklist: sub.checklist.map(c => ({ ...c, completed: false, completedAt: undefined })),
        };
        updated.status = resolveSubscriptionStatus(updated);

        await db.subscriptions.put(updated);
        await upsertSubscriptionCloud(updated);

        await logActivity(
          sub.id,
          updated.name,
          sub.memberName,
          'MEMBER_SWAPPED',
          `Member ${sub.memberName} (${sub.accountEmail}) diaktifkan kembali ke slot ${pool.name}`
        );

        await loadData();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleToggleChecklistItem = async (subId: string, itemId: string) => {
    const sub = subscriptions.find(s => s.id === subId);
    if (!sub) return;

    const updatedChecklist = sub.checklist.map(item => {
      if (item.id === itemId) {
        const next = !item.completed;
        return {
          ...item,
          completed: next,
          completedAt: next ? new Date().toISOString() : undefined,
        };
      }
      return item;
    });

    const updated: Subscription = {
      ...sub,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString(),
    };
    updated.status = resolveSubscriptionStatus(updated);

    await db.subscriptions.put(updated);
    await upsertSubscriptionCloud(updated);
    await loadData();
  };

  const logActivity = async (
    subId: string, 
    subName: string, 
    memberName: string | undefined,
    actionType: ActivityLog['actionType'], 
    description: string
  ) => {
    const newLog: ActivityLog = {
      id: generateLogId(),
      subscriptionId: subId,
      subscriptionName: subName,
      memberName,
      actionType,
      description,
      timestamp: new Date().toISOString(),
    };
    await db.activityLogs.add(newLog);
    await logActivityCloud(newLog);
  };

  const handleSavePackage = async (pkg: Partial<PricingPackage>) => {
    const pkgId = pkg.id || `pkg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const existing = packages.find(p => p.id === pkgId);
    const newPkg: PricingPackage = {
      id: pkgId,
      name: pkg.name || 'Paket Langganan',
      accountType: pkg.accountType || 'PRIMARY_EMAIL',
      durationMonths: pkg.durationMonths || 3,
      billingCycle: pkg.billingCycle || 'quarterly',
      price: pkg.price || 90000,
      badge: pkg.badge,
      badgeColor: pkg.badgeColor,
      isPopular: Boolean(pkg.isPopular),
      isActive: pkg.isActive !== false,
      description: pkg.description,
      features: pkg.features || [],
      sortOrder: pkg.sortOrder !== undefined ? pkg.sortOrder : (existing?.sortOrder || packages.length + 1),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.pricingPackages.put(newPkg);
    await upsertPackageCloud(newPkg);
    const updated = await db.pricingPackages.orderBy('sortOrder').toArray();
    setPackages(updated);
    await logActivity(
      pkgId, 
      newPkg.name, 
      'Admin Catalog', 
      existing ? 'UPDATED' : 'CREATED', 
      `${existing ? 'Memperbarui' : 'Menambahkan'} paket ${newPkg.name} ke database.`
    );
  };

  const handleDeletePackage = async (pkg: PricingPackage) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Paket Langganan?',
      description: `Apakah Anda yakin ingin menghapus paket "${pkg.name}" dari katalog harga database?`,
      targetName: pkg.name,
      confirmLabel: 'Hapus Paket',
      variant: 'danger',
      onConfirmAction: async () => {
        await db.pricingPackages.delete(pkg.id);
        await deletePackageCloud(pkg.id);
        const updated = await db.pricingPackages.orderBy('sortOrder').toArray();
        setPackages(updated);
        await logActivity(
          pkg.id, 
          pkg.name, 
          'Admin Catalog', 
          'DELETED', 
          `Menghapus paket ${pkg.name} dari database.`
        );
      },
    });
  };

  const handleEnrollFromPackage = (pkg: {
    packageName: string;
    accountType: 'PRIMARY_EMAIL' | 'SECONDARY_EMAIL';
    durationMonths: number;
    billingCycle: 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';
    price: number;
    notes: string;
  }) => {
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + pkg.durationMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setEditingSub({
      id: '',
      name: pkg.packageName,
      provider: 'Google One',
      category: 'google_one',
      price: pkg.price,
      currency: 'IDR',
      billingCycle: pkg.billingCycle,
      startDate,
      endDate,
      status: 'ACTIVE',
      accountEmail: '',
      memberName: '',
      autoRenews: false,
      reminderOffsets: [-7, -3, -1, 0, 1],
      notes: pkg.notes,
      checklist: [
        { id: '1', title: 'Hapus dari Google Family Group', completed: false },
        { id: '2', title: 'Putus Akses Storage 5TB', completed: false },
        { id: '3', title: 'Kirim WA Konfirmasi Berhenti', completed: false },
        { id: '4', title: 'Kosongkan Slot di Dashboard', completed: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setPreselectedPool(null);
    setIsAddEditOpen(true);
  };

  if (!mounted) {
    return (
      <div 
        suppressHydrationWarning
        className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#070a12]"
      >
        <div 
          suppressHydrationWarning
          className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" 
        />
      </div>
    );
  }

  return (
    <div 
      suppressHydrationWarning
      className="min-h-screen flex bg-slate-50 dark:bg-[#070a12] text-slate-900 dark:text-slate-100 antialiased transition-colors"
    >
      {/* Docked Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        needActionCount={metrics.needActionCount}
        totalActiveCount={metrics.totalActive}
        totalPoolsCount={pools.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Full-width Docked Header Bar */}
        <Navbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenAddModal={() => { setEditingSub(null); setPreselectedPool(null); setIsAddEditOpen(true); }}
          onOpenNotifications={() => setIsNotifDrawerOpen(true)}
          onOpenExportImport={() => setIsExportImportOpen(true)}
          onOpenCalendarSync={() => setIsCalendarSyncOpen(true)}
          notifications={notifications}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          cloudSyncStatus={cloudSyncStatus}
        />

        {/* Dynamic Main Body per Tab */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 md:space-y-8 pb-28 md:pb-12">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Header Greeting */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="eyebrow-pill bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20">
                      Live Multi-Slot Guard
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      • {pools.length} Active Pools
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    SubTracker Command Center
                  </h1>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Monitor masa aktif member Google One, Canva Team, Workspace, dan broadcast WA pengingat tagihan.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingPool(null); setIsAddPoolOpen(true); }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
                  >
                    <Building className="h-3.5 w-3.5 text-blue-500" />
                    <span>+ Tambah Pool</span>
                  </button>

                  <button
                    onClick={() => { setEditingSub(null); setPreselectedPool(null); setIsAddEditOpen(true); }}
                    className="group flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span>+ Tambah Member</span>
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
                      <Plus className="h-3.5 w-3.5 text-white" />
                    </div>
                  </button>
                </div>
              </div>

              {/* 4 KPI Cards (Double-Bezel) */}
              <MetricsSummary
                metrics={metrics}
                onFilterNeedAction={() => { setActiveTab('action_inbox'); }}
                onFilterUpcoming={() => { setStatusFilter('EXPIRING_SOON'); setActiveTab('all_subscriptions'); }}
                onFilterAllActive={() => { setStatusFilter('ACTIVE'); setActiveTab('all_subscriptions'); }}
              />

              {/* ACTION INBOX SECTION (MEMBER EXPIRED / KICK REQUIRED) */}
              <ActionInboxBanner
                urgentSubscriptions={urgentSubscriptions}
                onOpenWhatsAppModal={(sub) => setWaModalSub(sub)}
                onToggleChecklistItem={handleToggleChecklistItem}
                onRequestTerminate={triggerKickConfirm}
                onQuickRenew={(sub) => setRenewSub(sub)}
              />

              {/* Dashboard 2-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Active Subscriptions Grid */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Daftar Slot & Member Aktif</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-extrabold">
                        {filteredSubscriptions.length}
                      </span>
                    </h2>

                    <div className="flex items-center gap-2">
                      {/* Sort Dropdown */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        <ArrowUpDown className="h-3 w-3 text-blue-500 shrink-0" />
                        <select
                          value={sortOption}
                          onChange={(e) => setSortOption(e.target.value as MemberSortOption)}
                          className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
                        >
                          <option value="EXPIRY_ASC">📅 Jatuh Tempo Terdekat (Expired di Bawah)</option>
                          <option value="EXPIRY_DESC">⏳ Masa Aktif Terjauh</option>
                          <option value="LATEST">✨ Terbaru Ditambahkan (Latest)</option>
                          <option value="NAME_ASC">🔤 Nama Member (A - Z)</option>
                          <option value="NAME_DESC">🔤 Nama Member (Z - A)</option>
                          <option value="POOL_NAME">🏢 Urutkan per Pool</option>
                        </select>
                      </div>

                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          viewMode === 'grid'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                      >
                        <Grid className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          viewMode === 'table'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {filteredSubscriptions.length === 0 ? (
                    <div className="bezel-shell text-center py-12 px-4">
                      <div className="bezel-core p-8 flex flex-col items-center max-w-sm mx-auto">
                        <Users className="h-10 w-10 text-slate-400 mb-3" />
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          Tidak ada slot yang cocok dengan filter
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 mb-4">
                          Coba ganti kata kunci pencarian atau tambah member baru.
                        </p>
                        <button
                          onClick={() => { setEditingSub(null); setPreselectedPool(null); setIsAddEditOpen(true); }}
                          className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
                        >
                          + Tambah Member
                        </button>
                      </div>
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredSubscriptions.map((sub) => (
                        <SubscriptionCard
                          key={sub.id}
                          subscription={sub}
                          activityLogs={activityLogs}
                          onOpenChecklist={(s) => setChecklistSub(s)}
                          onOpenWhatsAppModal={(s) => setWaModalSub(s)}
                          onEdit={(s) => { setEditingSub(s); setPreselectedPool(null); setIsAddEditOpen(true); }}
                          onRequestDelete={triggerDeleteMemberConfirm}
                          onQuickRenew={(s) => setRenewSub(s)}
                          onRequestTerminate={triggerKickConfirm}
                          onMoveMemberPool={(s) => setMovingSub(s)}
                        />
                      ))}
                    </div>
                  ) : (
                    <SubscriptionTable
                      subscriptions={filteredSubscriptions}
                      sortOption={sortOption}
                      onSortChange={setSortOption}
                      onOpenChecklist={(s) => setChecklistSub(s)}
                      onOpenWhatsAppModal={(s) => setWaModalSub(s)}
                      onEdit={(s) => { setEditingSub(s); setPreselectedPool(null); setIsAddEditOpen(true); }}
                      onRequestDelete={triggerDeleteMemberConfirm}
                      onQuickRenew={(s) => setRenewSub(s)}
                      onRequestTerminate={triggerKickConfirm}
                      onMoveMemberPool={(s) => setMovingSub(s)}
                    />
                  )}
                </div>

                {/* Right: Upcoming Sidebar, Donut Chart & Feed */}
                <div className="space-y-6">
                  <UpcomingRenewalsSidebar
                    subscriptions={subscriptions}
                    onSelectSubscription={(s) => setChecklistSub(s)}
                    onOpenWhatsAppModal={(s) => setWaModalSub(s)}
                    onViewAll={() => { setStatusFilter('EXPIRING_SOON'); setActiveTab('all_subscriptions'); }}
                  />

                  <CategoryExpenseChart subscriptions={subscriptions} />

                  <RecentActivityFeed activityLogs={activityLogs} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: POOLS & GROUPS */}
          {activeTab === 'pools' && (
            <PoolsView
              pools={pools}
              subscriptions={subscriptions}
              externalSearchQuery={searchQuery}
              onExternalSearchChange={setSearchQuery}
              onOpenAddPoolModal={() => { setEditingPool(null); setIsAddPoolOpen(true); }}
              onEditPool={(pool) => { setEditingPool(pool); setIsAddPoolOpen(true); }}
              onRequestDeletePool={triggerDeletePoolConfirm}
              onAddMemberToPool={(pool) => {
                setEditingSub(null);
                setPreselectedPool(pool);
                setIsAddEditOpen(true);
              }}
              onOpenWhatsAppModal={(sub) => setWaModalSub(sub)}
              onOpenMemberChecklist={(sub) => setChecklistSub(sub)}
              onMoveMemberPool={(sub) => setMovingSub(sub)}
              onReactivateMemberInPool={handleReactivateInPool}
            />
          )}

          {/* TAB 3: ACTION INBOX */}
          {activeTab === 'action_inbox' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <AlertOctagon className="h-6 w-6 text-rose-500" />
                  Kick Action & Slot Triage Inbox
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Daftar member yang masa aktifnya telah habis dan memerlukan tindakan manual Admin (Kick dari Family/Admin Console, Stop Access, Kirim WA).
                </p>
              </div>

              <ActionInboxBanner
                urgentSubscriptions={urgentSubscriptions}
                onOpenWhatsAppModal={(sub) => setWaModalSub(sub)}
                onToggleChecklistItem={handleToggleChecklistItem}
                onRequestTerminate={triggerKickConfirm}
                onQuickRenew={(sub) => setRenewSub(sub)}
                onMoveMemberPool={(sub) => setMovingSub(sub)}
              />
            </div>
          )}

          {/* TAB 4: ALL SUBSCRIPTIONS */}
          {activeTab === 'all_subscriptions' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Semua Member & Slot Pool ({subscriptions.length})
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    Katalog lengkap member aktif, jatuh tempo, dan riwayat slot yang sudah di-kick.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <ArrowUpDown className="h-3 w-3 text-blue-500 shrink-0" />
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as MemberSortOption)}
                      className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="EXPIRY_ASC">📅 Jatuh Tempo Terdekat (Expired di Bawah)</option>
                      <option value="EXPIRY_DESC">⏳ Masa Aktif Terjauh</option>
                      <option value="LATEST">✨ Terbaru Ditambahkan (Latest)</option>
                      <option value="NAME_ASC">🔤 Nama Member (A - Z)</option>
                      <option value="NAME_DESC">🔤 Nama Member (Z - A)</option>
                      <option value="POOL_NAME">🏢 Urutkan per Pool</option>
                    </select>
                  </div>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 text-xs rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold focus:outline-none"
                  >
                    <option value="ALL">Semua Layanan</option>
                    <option value="google_one">Google One Family</option>
                    <option value="workspace">Google Workspace</option>
                    <option value="canva_team">Canva Team</option>
                    <option value="adobe_seat">Adobe CC</option>
                    <option value="ai_tools">AI Tools (ChatGPT/Claude)</option>
                    <option value="other">Lainnya</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold focus:outline-none"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="ACTIVE">Aktif</option>
                    <option value="EXPIRING_SOON">Jatuh Tempo</option>
                    <option value="ACTION_REQUIRED">Wajib Kick</option>
                    <option value="TERMINATED">Sudah Di-kick</option>
                  </select>

                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                    className="p-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Empty state or Grid/Table */}
              {filteredSubscriptions.length === 0 ? (
                <div className="bezel-shell">
                  <div className="bezel-core p-12 text-center flex flex-col items-center justify-center">
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 flex items-center justify-center mb-3">
                      <Users className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Belum Ada Member Terdaftar
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Daftarkan member baru atau buat pool akun induk terlebih dahulu untuk mengelola alokasi slot.
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={() => { setEditingPool(null); setIsAddPoolOpen(true); }}
                        className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        + Buat Pool Induk
                      </button>
                      <button
                        onClick={() => { setEditingSub(null); setPreselectedPool(null); setIsAddEditOpen(true); }}
                        className="group flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <span>+ Tambah Member Pertama</span>
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
                          <Plus className="h-3 w-3 text-white" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="space-y-3.5">
                  {filteredSubscriptions.map((sub) => (
                    <SubscriptionCard
                      key={sub.id}
                      subscription={sub}
                      activityLogs={activityLogs}
                      onOpenChecklist={(s) => setChecklistSub(s)}
                      onOpenWhatsAppModal={(s) => setWaModalSub(s)}
                      onEdit={(s) => { setEditingSub(s); setPreselectedPool(null); setIsAddEditOpen(true); }}
                      onRequestDelete={triggerDeleteMemberConfirm}
                      onQuickRenew={(s) => setRenewSub(s)}
                      onRequestTerminate={triggerKickConfirm}
                      onMoveMemberPool={(s) => setMovingSub(s)}
                    />
                  ))}
                </div>
              ) : (
                <SubscriptionTable
                  subscriptions={filteredSubscriptions}
                  sortOption={sortOption}
                  onSortChange={setSortOption}
                  onOpenChecklist={(s) => setChecklistSub(s)}
                  onOpenWhatsAppModal={(s) => setWaModalSub(s)}
                  onEdit={(s) => { setEditingSub(s); setPreselectedPool(null); setIsAddEditOpen(true); }}
                  onRequestDelete={triggerDeleteMemberConfirm}
                  onQuickRenew={(s) => setRenewSub(s)}
                  onRequestTerminate={triggerKickConfirm}
                  onMoveMemberPool={(s) => setMovingSub(s)}
                />
              )}
            </div>
          )}

          {/* TAB 5: PRICE LIST & PACKAGE CATALOG (DATABASE-DRIVEN) */}
          {activeTab === 'pricelist' && (
            <PriceListView
              pools={pools}
              subscriptions={subscriptions}
              packages={packages}
              onSavePackage={handleSavePackage}
              onDeletePackage={handleDeletePackage}
              onSelectPackageForMember={handleEnrollFromPackage}
            />
          )}

          {/* TAB 6: ANALYTICS & FINANCIAL COMMAND CENTER */}
          {activeTab === 'analytics' && (
            <FinancialAnalyticsView
              subscriptions={subscriptions}
              pools={pools}
              metrics={metrics}
            />
          )}

          {/* TAB 6: AUDIT & KICK LOGS */}
          {activeTab === 'activity_logs' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Audit Trail & Riwayat Kick Member
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Log lengkap riwayat pendaftaran member, broadcast WhatsApp, perpanjangan, dan pemutusan akses.
                </p>
              </div>

              <RecentActivityFeed activityLogs={activityLogs} />
            </div>
          )}
        </main>
      </div>

      {/* MEMBER ONBOARDING MODAL */}
      <AddEditSubscriptionModal
        key={editingSub ? editingSub.id : (preselectedPool ? `pool-${preselectedPool.id}` : (isAddEditOpen ? 'new-sub' : 'closed-sub'))}
        isOpen={isAddEditOpen}
        onClose={() => { setIsAddEditOpen(false); setEditingSub(null); setPreselectedPool(null); }}
        onSave={handleSaveSubscription}
        initialSubscription={editingSub}
        pools={pools}
        onOpenAddPoolModal={() => { setIsAddEditOpen(false); setEditingPool(null); setIsAddPoolOpen(true); }}
        preselectedPool={preselectedPool}
        existingSubscriptions={subscriptions}
      />

      {/* MASTER POOL MODAL */}
      <AddEditPoolModal
        key={editingPool ? editingPool.id : (isAddPoolOpen ? 'new-pool' : 'closed-pool')}
        isOpen={isAddPoolOpen}
        onClose={() => { setIsAddPoolOpen(false); setEditingPool(null); }}
        onSave={handleSavePool}
        initialPool={editingPool}
      />

      <ActionChecklistModal
        key={checklistSub?.id || 'checklist-none'}
        subscription={checklistSub}
        isOpen={!!checklistSub}
        onClose={() => setChecklistSub(null)}
        onUpdateSubscription={handleUpdateSubscription}
        onOpenWhatsAppModal={(s) => setWaModalSub(s)}
        onRequestTerminate={triggerKickConfirm}
        onRenew={(s) => setRenewSub(s)}
        onMoveMemberPool={(s) => setMovingSub(s)}
      />

      <QuickRenewModal
        key={renewSub?.id || 'renew-none'}
        subscription={renewSub}
        pools={pools}
        isOpen={!!renewSub}
        onClose={() => setRenewSub(null)}
        onConfirmRenew={handleConfirmRenew}
      />

      <MoveMemberPoolModal
        key={movingSub?.id || 'move-none'}
        subscription={movingSub}
        pools={pools}
        subscriptions={subscriptions}
        isOpen={!!movingSub}
        onClose={() => setMovingSub(null)}
        onConfirmMove={handleConfirmMovePool}
      />

      <WhatsAppMessageModal
        key={waModalSub?.id || 'wa-none'}
        subscription={waModalSub}
        isOpen={!!waModalSub}
        onClose={() => setWaModalSub(null)}
        onLoggedSent={async (s) => {
          await logActivity(s.id, s.name, s.memberName, 'WA_SENT', `Mengirim pesan tagihan WhatsApp ke member ${s.memberName}`);
          await loadData();
        }}
      />

      <NotificationCenterDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        subscriptions={subscriptions}
        onSelectSubscription={(s) => setChecklistSub(s)}
        onMarkAllAsRead={async () => {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }}
      />

      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        onDataRestored={loadData}
        onRequestClearAll={() => {
          setConfirmDialog({
            isOpen: true,
            title: 'Kosongkan Semua Data?',
            description: 'Semua data member, slot pool, dan log aktivitas akan dihapus bersih dari browser.',
            targetName: `${subscriptions.length} Member & ${pools.length} Pools`,
            confirmLabel: 'Ya, Kosongkan Semua',
            variant: 'danger',
            onConfirmAction: async () => {
              const { clearAllData } = await import('@/lib/db/dexie-db');
              await clearAllData();
              await loadData();
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
          });
        }}
      />

      {/* GOOGLE CALENDAR SYNC MODAL */}
      <GoogleCalendarSyncModal
        isOpen={isCalendarSyncOpen}
        onClose={() => setIsCalendarSyncOpen(false)}
        subscriptions={subscriptions}
        pools={pools}
      />

      {/* CUSTOM LUXURY CONFIRMATION DIALOG (No native window.confirm!) */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        targetName={confirmDialog.targetName}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirmAction}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Mobile Glassmorphic Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        needActionCount={metrics.needActionCount}
        onQuickAdd={() => {
          setEditingSub(null);
          setPreselectedPool(null);
          setIsAddEditOpen(true);
        }}
      />
    </div>
  );
}
