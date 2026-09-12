import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { db, DEFAULT_PRICING_PACKAGES } from '@/lib/db/dexie-db';
import { 
  Subscription, 
  AccountPool, 
  ActivityLog, 
  PricingPackage, 
  VaultItem 
} from '@/types/subscription';

/**
 * ============================================================================
 * DATA MAPPERS (CamelCase <-> Supabase snake_case)
 * ============================================================================
 */

export function mapPoolToRow(pool: AccountPool) {
  return {
    id: pool.id,
    name: pool.name,
    provider: pool.provider,
    category: pool.category || 'other',
    master_email: pool.masterEmail,
    master_password: pool.masterPassword || null,
    total_capacity: pool.totalCapacity ?? 5,
    master_end_date: pool.masterEndDate,
    master_cost: pool.masterCost ?? 0,
    notes: pool.notes || null,
    avatar_color: pool.avatarColor || 'bg-blue-600',
    created_at: pool.createdAt || new Date().toISOString(),
    updated_at: pool.updatedAt || new Date().toISOString(),
  };
}

export function mapRowToPool(row: any): AccountPool {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    category: row.category,
    masterEmail: row.master_email,
    masterPassword: row.master_password || undefined,
    totalCapacity: row.total_capacity ?? 5,
    masterEndDate: row.master_end_date,
    masterCost: row.master_cost ? Number(row.master_cost) : undefined,
    notes: row.notes || undefined,
    avatarColor: row.avatar_color || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSubscriptionToRow(sub: Subscription) {
  return {
    id: sub.id,
    name: sub.name,
    provider: sub.provider,
    category: sub.category || 'other',
    account_email: sub.accountEmail,
    member_name: sub.memberName,
    client_phone: sub.clientPhone || null,
    pool_id: sub.poolId || null,
    pool_name: sub.poolName || null,
    slot_number: sub.slotNumber ?? null,
    start_date: sub.startDate,
    end_date: sub.endDate,
    price: sub.price ?? 0,
    currency: sub.currency || 'IDR',
    billing_cycle: sub.billingCycle || 'monthly',
    auto_renews: Boolean(sub.autoRenews),
    status: sub.status || 'ACTIVE',
    checklist: sub.checklist || [],
    reminder_offsets: sub.reminderOffsets || [-7, -3, -1, 0, 1],
    notes: sub.notes || null,
    tags: sub.tags || [],
    service_url: sub.serviceUrl || null,
    avatar_color: sub.avatarColor || 'bg-blue-600',
    created_at: sub.createdAt || new Date().toISOString(),
    updated_at: sub.updatedAt || new Date().toISOString(),
    terminated_at: sub.terminatedAt || null,
    last_renewed_at: sub.lastRenewedAt || null,
  };
}

export function mapRowToSubscription(row: any): Subscription {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    category: row.category,
    accountEmail: row.account_email,
    memberName: row.member_name,
    clientPhone: row.client_phone || undefined,
    poolId: row.pool_id || undefined,
    poolName: row.pool_name || undefined,
    slotNumber: row.slot_number ?? undefined,
    startDate: row.start_date,
    endDate: row.end_date,
    price: Number(row.price || 0),
    currency: row.currency || 'IDR',
    billingCycle: row.billing_cycle || 'monthly',
    autoRenews: Boolean(row.auto_renews),
    status: row.status || 'ACTIVE',
    checklist: Array.isArray(row.checklist) ? row.checklist : [],
    reminderOffsets: Array.isArray(row.reminder_offsets) ? row.reminder_offsets : [-7, -3, -1, 0, 1],
    notes: row.notes || undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    serviceUrl: row.service_url || undefined,
    avatarColor: row.avatar_color || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    terminatedAt: row.terminated_at || undefined,
    lastRenewedAt: row.last_renewed_at || undefined,
  };
}

export function mapPackageToRow(pkg: PricingPackage) {
  return {
    id: pkg.id,
    name: pkg.name,
    account_type: pkg.accountType || 'PRIMARY_EMAIL',
    duration_months: pkg.durationMonths ?? 3,
    billing_cycle: pkg.billingCycle || 'quarterly',
    price: pkg.price ?? 0,
    badge: pkg.badge || null,
    badge_color: pkg.badgeColor || null,
    is_popular: Boolean(pkg.isPopular),
    is_active: pkg.isActive !== false,
    description: pkg.description || null,
    features: pkg.features || [],
    sort_order: pkg.sortOrder ?? 0,
    created_at: pkg.createdAt || new Date().toISOString(),
    updated_at: pkg.updatedAt || new Date().toISOString(),
  };
}

export function mapRowToPackage(row: any): PricingPackage {
  return {
    id: row.id,
    name: row.name,
    accountType: row.account_type || 'PRIMARY_EMAIL',
    durationMonths: row.duration_months ?? 3,
    billingCycle: row.billing_cycle || 'quarterly',
    price: Number(row.price || 0),
    badge: row.badge || undefined,
    badgeColor: row.badge_color || undefined,
    isPopular: Boolean(row.is_popular),
    isActive: row.is_active !== false,
    description: row.description || undefined,
    features: Array.isArray(row.features) ? row.features : [],
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapLogToRow(log: ActivityLog) {
  return {
    id: log.id,
    subscription_id: log.subscriptionId || null,
    subscription_name: log.subscriptionName || null,
    member_name: log.memberName || null,
    pool_id: log.poolId || null,
    pool_name: log.poolName || null,
    action_type: log.actionType,
    severity: log.severity || 'info',
    old_value: log.oldValue || null,
    new_value: log.newValue || null,
    metadata: log.metadata || {},
    description: log.description,
    timestamp: log.timestamp || new Date().toISOString(),
  };
}

export function mapRowToLog(row: any): ActivityLog {
  return {
    id: row.id,
    subscriptionId: row.subscription_id || undefined,
    subscriptionName: row.subscription_name || undefined,
    memberName: row.member_name || undefined,
    poolId: row.pool_id || undefined,
    poolName: row.pool_name || undefined,
    actionType: row.action_type,
    severity: row.severity || 'info',
    oldValue: row.old_value || undefined,
    newValue: row.new_value || undefined,
    metadata: row.metadata || undefined,
    description: row.description,
    timestamp: row.timestamp,
  };
}

export function mapVaultToRow(vault: VaultItem) {
  return {
    id: vault.id,
    pool_id: vault.poolId || null,
    title: vault.title,
    service_provider: vault.serviceProvider || 'Google One',
    account_email: vault.accountEmail,
    secret_type: vault.secretType || 'password',
    secret_value: vault.secretValue,
    is_encrypted: vault.isEncrypted !== false,
    notes: vault.notes || null,
    created_at: vault.createdAt || new Date().toISOString(),
    updated_at: vault.updatedAt || new Date().toISOString(),
  };
}

export function mapRowToVault(row: any): VaultItem {
  return {
    id: row.id,
    poolId: row.pool_id || undefined,
    title: row.title,
    serviceProvider: row.service_provider,
    accountEmail: row.account_email,
    secretType: row.secret_type || 'password',
    secretValue: row.secret_value,
    isEncrypted: row.is_encrypted !== false,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * ============================================================================
 * SUPABASE CLOUD OPERATIONS
 * ============================================================================
 */

export async function fetchAllCloudData(): Promise<{
  pools: AccountPool[];
  subscriptions: Subscription[];
  packages: PricingPackage[];
  logs: ActivityLog[];
  vault: VaultItem[];
} | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const [poolsRes, subsRes, pkgsRes, logsRes, vaultRes] = await Promise.all([
      supabase.from('pools').select('*').order('created_at', { ascending: true }),
      supabase.from('subscriptions').select('*').order('created_at', { ascending: true }),
      supabase.from('pricing_packages').select('*').order('sort_order', { ascending: true }),
      supabase.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(200),
      supabase.from('credential_vault').select('*'),
    ]);

    if (poolsRes.error || subsRes.error) {
      console.warn('Supabase fetch error:', poolsRes.error || subsRes.error);
      return null;
    }

    return {
      pools: (poolsRes.data || []).map(mapRowToPool),
      subscriptions: (subsRes.data || []).map(mapRowToSubscription),
      packages: (pkgsRes.data || []).map(mapRowToPackage),
      logs: (logsRes.data || []).map(mapRowToLog),
      vault: (vaultRes.data || []).map(mapRowToVault),
    };
  } catch (err) {
    console.error('Failed to fetch from Supabase:', err);
    return null;
  }
}

/**
 * Reconciles local Dexie DB and Supabase Cloud DB.
 * Ensures the user has unified data across browser reloads and multiple devices.
 */
export async function syncLocalAndCloud(): Promise<{
  subscriptions: Subscription[];
  pools: AccountPool[];
  packages: PricingPackage[];
  activityLogs: ActivityLog[];
  source: 'cloud' | 'local';
}> {
  // 1. Read current local data from Dexie
  const [localSubs, localPools, localPkgs, localLogs] = await Promise.all([
    db.subscriptions.toArray(),
    db.pools.toArray(),
    db.pricingPackages.toArray(),
    db.activityLogs.toArray(),
  ]);

  // If Supabase is not configured (e.g. env vars not yet added in Vercel), return local
  if (!isSupabaseConfigured) {
    return {
      subscriptions: localSubs,
      pools: localPools,
      packages: localPkgs.length > 0 ? localPkgs : DEFAULT_PRICING_PACKAGES,
      activityLogs: localLogs,
      source: 'local',
    };
  }

  try {
    const cloud = await fetchAllCloudData();

    if (!cloud) {
      // Cloud unreachable, fallback to local Dexie
      return {
        subscriptions: localSubs,
        pools: localPools,
        packages: localPkgs.length > 0 ? localPkgs : DEFAULT_PRICING_PACKAGES,
        activityLogs: localLogs,
        source: 'local',
      };
    }

    const hasCloudData = cloud.pools.length > 0 || cloud.subscriptions.length > 0;
    const hasLocalData = localPools.length > 0 || localSubs.length > 0;

    // CASE A: Cloud has data -> Cloud is source of truth, cache to local Dexie
    if (hasCloudData) {
      await db.pools.clear();
      await db.subscriptions.clear();
      if (cloud.pools.length > 0) await db.pools.bulkPut(cloud.pools);
      if (cloud.subscriptions.length > 0) await db.subscriptions.bulkPut(cloud.subscriptions);

      if (cloud.packages.length > 0) {
        await db.pricingPackages.clear();
        await db.pricingPackages.bulkPut(cloud.packages);
      }

      if (cloud.logs.length > 0) {
        await db.activityLogs.clear();
        await db.activityLogs.bulkPut(cloud.logs);
      }

      if (cloud.vault.length > 0) {
        await db.vault.clear();
        await db.vault.bulkPut(cloud.vault);
      }

      return {
        subscriptions: cloud.subscriptions,
        pools: cloud.pools,
        packages: cloud.packages.length > 0 ? cloud.packages : DEFAULT_PRICING_PACKAGES,
        activityLogs: cloud.logs,
        source: 'cloud',
      };
    }

    // CASE B: Cloud is empty, but local has data -> Upload local data to Cloud
    if (!hasCloudData && hasLocalData) {
      await uploadLocalDataToCloud();
      return {
        subscriptions: localSubs,
        pools: localPools,
        packages: localPkgs.length > 0 ? localPkgs : DEFAULT_PRICING_PACKAGES,
        activityLogs: localLogs,
        source: 'cloud',
      };
    }

    // CASE C: Both are clean/empty -> Seed default packages to both
    if (cloud.packages.length === 0) {
      const pkgRows = DEFAULT_PRICING_PACKAGES.map(mapPackageToRow);
      await supabase.from('pricing_packages').upsert(pkgRows);
    }
    if (localPkgs.length === 0) {
      await db.pricingPackages.bulkPut(DEFAULT_PRICING_PACKAGES);
    }

    return {
      subscriptions: [],
      pools: [],
      packages: DEFAULT_PRICING_PACKAGES,
      activityLogs: localLogs,
      source: 'cloud',
    };
  } catch (err) {
    console.error('Error during cloud sync:', err);
    return {
      subscriptions: localSubs,
      pools: localPools,
      packages: localPkgs.length > 0 ? localPkgs : DEFAULT_PRICING_PACKAGES,
      activityLogs: localLogs,
      source: 'local',
    };
  }
}

/**
 * Upload all existing local Dexie data to Supabase Cloud
 */
export async function uploadLocalDataToCloud(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const [subs, pools, pkgs, logs, vault] = await Promise.all([
      db.subscriptions.toArray(),
      db.pools.toArray(),
      db.pricingPackages.toArray(),
      db.activityLogs.toArray(),
      db.vault.toArray(),
    ]);

    if (pools.length > 0) {
      await supabase.from('pools').upsert(pools.map(mapPoolToRow));
    }

    if (subs.length > 0) {
      await supabase.from('subscriptions').upsert(subs.map(mapSubscriptionToRow));
    }

    const packagesToUpload = pkgs.length > 0 ? pkgs : DEFAULT_PRICING_PACKAGES;
    await supabase.from('pricing_packages').upsert(packagesToUpload.map(mapPackageToRow));

    if (logs.length > 0) {
      await supabase.from('activity_logs').upsert(logs.map(mapLogToRow));
    }

    if (vault.length > 0) {
      await supabase.from('credential_vault').upsert(vault.map(mapVaultToRow));
    }

    return true;
  } catch (err) {
    console.error('Failed to upload local data to cloud:', err);
    return false;
  }
}

/**
 * Cloud mutation helpers (called alongside Dexie in DashboardMain)
 */

export async function upsertPoolCloud(pool: AccountPool): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('pools').upsert(mapPoolToRow(pool));
  } catch (err) {
    console.warn('Failed to upsert pool to cloud:', err);
  }
}

export async function deletePoolCloud(poolId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('pools').delete().eq('id', poolId);
  } catch (err) {
    console.warn('Failed to delete pool from cloud:', err);
  }
}

export async function upsertSubscriptionCloud(sub: Subscription): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('subscriptions').upsert(mapSubscriptionToRow(sub));
  } catch (err) {
    console.warn('Failed to upsert subscription to cloud:', err);
  }
}

export async function deleteSubscriptionCloud(subId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('subscriptions').delete().eq('id', subId);
  } catch (err) {
    console.warn('Failed to delete subscription from cloud:', err);
  }
}

export async function upsertPackageCloud(pkg: PricingPackage): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('pricing_packages').upsert(mapPackageToRow(pkg));
  } catch (err) {
    console.warn('Failed to upsert package to cloud:', err);
  }
}

export async function deletePackageCloud(pkgId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('pricing_packages').delete().eq('id', pkgId);
  } catch (err) {
    console.warn('Failed to delete package from cloud:', err);
  }
}

export async function logActivityCloud(log: ActivityLog): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('activity_logs').insert(mapLogToRow(log));
  } catch (err) {
    console.warn('Failed to log activity to cloud:', err);
  }
}

export async function saveVaultItemCloud(vaultItem: VaultItem): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('credential_vault').upsert(mapVaultToRow(vaultItem));
  } catch (err) {
    console.warn('Failed to save vault item to cloud:', err);
  }
}

export async function deleteVaultItemCloud(poolId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('credential_vault').delete().eq('pool_id', poolId);
  } catch (err) {
    console.warn('Failed to delete vault item from cloud:', err);
  }
}

/**
 * Setup Supabase Realtime channel to listen for live database changes from other tabs / devices
 */
export function subscribeToCloudChanges(onUpdate: () => void): () => void {
  if (!isSupabaseConfigured) return () => {};

  try {
    const channel = supabase
      .channel('subtracker-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          onUpdate();
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // If Realtime is not enabled on the Supabase project/schema, tear down cleanly to avoid noisy WebSocket reconnect loops
          supabase.removeChannel(channel);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return () => {};
  }
}
