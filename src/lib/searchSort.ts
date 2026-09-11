import { Subscription, AccountPool } from '@/types/subscription';
import { getDaysRemaining } from './utils';

export type MemberSortOption = 
  | 'EXPIRY_ASC'    // Jatuh Tempo Terdekat (Default: Expired otomatis di bawah)
  | 'EXPIRY_DESC'   // Masa Aktif Terjauh / Terlama
  | 'LATEST'        // Terbaru Ditambahkan (Latest createdAt / updatedAt)
  | 'NAME_ASC'      // Nama Member (A - Z)
  | 'NAME_DESC'     // Nama Member (Z - A)
  | 'POOL_NAME';    // Urutkan per Pool (A - Z)

export type PoolSortOption =
  | 'EXPIRY_ASC'        // Masa Aktif Induk Terdekat (Induk Expired otomatis di bawah)
  | 'EXPIRY_DESC'       // Masa Aktif Induk Terjauh
  | 'AVAILABLE_SLOTS'   // Sisa Slot Kosong Terbanyak
  | 'NAME_ASC'          // Nama Pool (A - Z)
  | 'LATEST';           // Terbaru Dibuat

/**
 * Intelligent multi-token search for Subscriptions / Members.
 * Matches across member name, email, WhatsApp phone, pool, service name, notes, tags, slot number.
 * Supports multi-word matching (e.g. "Google oren" or "budi 2tb").
 */
export function matchesSubscriptionSearch(sub: Subscription, rawQuery: string): boolean {
  const query = (rawQuery || '').trim().toLowerCase();
  if (!query) return true;

  const tokens = query.split(/\s+/).filter(Boolean);
  const cleanSubPhone = (sub.clientPhone || '').replace(/\D/g, '');

  return tokens.every(token => {
    const tokenDigits = token.replace(/\D/g, '');
    const matchesPhoneDigits = tokenDigits.length >= 3 && cleanSubPhone.includes(tokenDigits);

    const memberName = (sub.memberName || '').toLowerCase();
    const accountEmail = (sub.accountEmail || '').toLowerCase();
    const clientPhone = (sub.clientPhone || '').toLowerCase();
    const poolName = (sub.poolName || '').toLowerCase();
    const name = (sub.name || '').toLowerCase();
    const provider = (sub.provider || '').toLowerCase();
    const notes = (sub.notes || '').toLowerCase();
    const category = (sub.category || '').toLowerCase();
    const slotString = sub.slotNumber ? `slot #${sub.slotNumber} slot ${sub.slotNumber} #${sub.slotNumber}` : '';
    const tags = (sub.tags || []).map(t => t.toLowerCase());

    return (
      memberName.includes(token) ||
      accountEmail.includes(token) ||
      clientPhone.includes(token) ||
      matchesPhoneDigits ||
      poolName.includes(token) ||
      name.includes(token) ||
      provider.includes(token) ||
      notes.includes(token) ||
      category.includes(token) ||
      slotString.includes(token) ||
      tags.some(t => t.includes(token))
    );
  });
}

/**
 * Check if a subscription is considered expired or terminated.
 */
export function isSubscriptionExpired(sub: Subscription): boolean {
  if (sub.status === 'TERMINATED') return true;
  const daysLeft = getDaysRemaining(sub.endDate);
  return daysLeft < 0;
}

/**
 * Sort subscriptions with strict auto-demotion of expired / terminated accounts.
 * Active accounts will ALWAYS appear on top, while expired / terminated accounts sink to the bottom.
 */
export function sortSubscriptions(
  subs: Subscription[], 
  sortOption: MemberSortOption = 'EXPIRY_ASC'
): Subscription[] {
  return [...subs].sort((a, b) => {
    // 1. AUTO-DEMOTE EXPIRED / TERMINATED TO THE VERY BOTTOM
    const aExpired = isSubscriptionExpired(a);
    const bExpired = isSubscriptionExpired(b);

    if (aExpired !== bExpired) {
      return aExpired ? 1 : -1; // Active on top (return -1), Expired at the bottom (return 1)
    }

    // 2. Primary sorting within the respective tier (active tier or expired tier)
    switch (sortOption) {
      case 'EXPIRY_ASC': {
        const timeA = new Date(a.endDate).getTime();
        const timeB = new Date(b.endDate).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return (a.memberName || a.name || '').localeCompare(b.memberName || b.name || '');
      }

      case 'EXPIRY_DESC': {
        const timeA = new Date(a.endDate).getTime();
        const timeB = new Date(b.endDate).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return (a.memberName || a.name || '').localeCompare(b.memberName || b.name || '');
      }

      case 'LATEST': {
        const dateA = new Date(a.createdAt || a.updatedAt || a.startDate).getTime();
        const dateB = new Date(b.createdAt || b.updatedAt || b.startDate).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return (a.memberName || a.name || '').localeCompare(b.memberName || b.name || '');
      }

      case 'NAME_ASC': {
        const nameA = (a.memberName || a.name || '').trim().toLowerCase();
        const nameB = (b.memberName || b.name || '').trim().toLowerCase();
        const diff = nameA.localeCompare(nameB);
        if (diff !== 0) return diff;
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      }

      case 'NAME_DESC': {
        const nameA = (a.memberName || a.name || '').trim().toLowerCase();
        const nameB = (b.memberName || b.name || '').trim().toLowerCase();
        const diff = nameB.localeCompare(nameA);
        if (diff !== 0) return diff;
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      }

      case 'POOL_NAME': {
        const poolA = (a.poolName || 'ZZZ').trim().toLowerCase();
        const poolB = (b.poolName || 'ZZZ').trim().toLowerCase();
        const diff = poolA.localeCompare(poolB);
        if (diff !== 0) return diff;
        // If same pool, sort by slotNumber, then memberName
        const slotA = a.slotNumber || 999;
        const slotB = b.slotNumber || 999;
        if (slotA !== slotB) return slotA - slotB;
        return (a.memberName || '').localeCompare(b.memberName || '');
      }

      default:
        return 0;
    }
  });
}

/**
 * Deep search for Account Pools.
 * A pool matches if:
 * 1. Its own name, master email, provider, or notes match the query, OR
 * 2. ANY member currently inside that pool matches the query!
 */
export function matchesPoolSearch(
  pool: AccountPool,
  poolMembers: Subscription[],
  rawQuery: string
): boolean {
  const query = (rawQuery || '').trim().toLowerCase();
  if (!query) return true;

  const tokens = query.split(/\s+/).filter(Boolean);

  // Check if all tokens match the pool's own attributes
  const poolSelfMatches = tokens.every(token => {
    const name = (pool.name || '').toLowerCase();
    const masterEmail = (pool.masterEmail || '').toLowerCase();
    const provider = (pool.provider || '').toLowerCase();
    const notes = (pool.notes || '').toLowerCase();
    const category = (pool.category || '').toLowerCase();

    return (
      name.includes(token) ||
      masterEmail.includes(token) ||
      provider.includes(token) ||
      notes.includes(token) ||
      category.includes(token)
    );
  });

  if (poolSelfMatches) return true;

  // Deep search: check if any member allocated to this pool matches
  return poolMembers.some(member => matchesSubscriptionSearch(member, rawQuery));
}

/**
 * Check if a pool's master account is expired
 */
export function isPoolExpired(pool: AccountPool): boolean {
  return getDaysRemaining(pool.masterEndDate) < 0;
}

/**
 * Sort pools with automatic demotion of expired master accounts to the bottom.
 */
export function sortPools(
  pools: AccountPool[],
  subscriptions: Subscription[],
  sortOption: PoolSortOption = 'EXPIRY_ASC'
): AccountPool[] {
  // Precompute occupied slots per pool
  const occupancyMap = new Map<string, number>();
  pools.forEach(p => {
    const occupied = subscriptions.filter(
      s => (s.poolId === p.id || s.poolName?.toLowerCase() === p.name.toLowerCase()) && s.status !== 'TERMINATED'
    ).length;
    occupancyMap.set(p.id, occupied);
  });

  return [...pools].sort((a, b) => {
    // 1. AUTO-DEMOTE EXPIRED MASTER ACCOUNTS TO THE BOTTOM
    const aExpired = isPoolExpired(a);
    const bExpired = isPoolExpired(b);

    if (aExpired !== bExpired) {
      return aExpired ? 1 : -1;
    }

    // 2. Primary sort within tier
    switch (sortOption) {
      case 'EXPIRY_ASC': {
        const timeA = new Date(a.masterEndDate).getTime();
        const timeB = new Date(b.masterEndDate).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return a.name.localeCompare(b.name);
      }

      case 'EXPIRY_DESC': {
        const timeA = new Date(a.masterEndDate).getTime();
        const timeB = new Date(b.masterEndDate).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return a.name.localeCompare(b.name);
      }

      case 'AVAILABLE_SLOTS': {
        const occupiedA = occupancyMap.get(a.id) || 0;
        const occupiedB = occupancyMap.get(b.id) || 0;
        const availableA = Math.max(0, a.totalCapacity - occupiedA);
        const availableB = Math.max(0, b.totalCapacity - occupiedB);
        if (availableA !== availableB) return availableB - availableA; // Most slots first
        return a.name.localeCompare(b.name);
      }

      case 'NAME_ASC': {
        return a.name.localeCompare(b.name);
      }

      case 'LATEST': {
        const dateA = new Date(a.createdAt || a.updatedAt || a.masterEndDate).getTime();
        const dateB = new Date(b.createdAt || b.updatedAt || b.masterEndDate).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return a.name.localeCompare(b.name);
      }

      default:
        return 0;
    }
  });
}
