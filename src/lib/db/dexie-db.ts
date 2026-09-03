import Dexie, { type Table } from 'dexie';
import { Subscription, AccountPool, ActivityLog, AppNotification, PricingPackage } from '@/types/subscription';
import { addDays, format, subDays } from 'date-fns';

export class SubTrackerDatabase extends Dexie {
  subscriptions!: Table<Subscription, string>;
  pools!: Table<AccountPool, string>;
  activityLogs!: Table<ActivityLog, string>;
  notifications!: Table<AppNotification, string>;
  pricingPackages!: Table<PricingPackage, string>;

  constructor() {
    super('SubTrackerDB');
    this.version(6).stores({
      subscriptions: 'id, name, provider, category, status, endDate, accountEmail, memberName, poolId, poolName',
      pools: 'id, name, provider, category, masterEmail, masterEndDate',
      activityLogs: 'id, subscriptionId, actionType, severity, poolId, timestamp',
      notifications: 'id, subscriptionId, type, read, createdAt',
      pricingPackages: 'id, accountType, durationMonths, price, isActive, sortOrder',
    });
  }
}

export const db = new SubTrackerDatabase();

// Clean default: 0 placeholder records
export const INITIAL_SEED_SUBSCRIPTIONS: Subscription[] = [];
export const INITIAL_SEED_POOLS: AccountPool[] = [];

// Default dynamic pricing packages seeded into database
export const DEFAULT_PRICING_PACKAGES: PricingPackage[] = [
  // TIER A: AKUN UTAMA / EMAIL PRIBADI (Pool 1 Tahun)
  {
    id: 'pkg-primary-2m',
    name: '2 Bulan (Minimal)',
    accountType: 'PRIMARY_EMAIL',
    durationMonths: 2,
    billingCycle: 'monthly',
    price: 60000,
    badge: 'Durasi Minimal',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20',
    isPopular: false,
    isActive: true,
    description: 'Paket durasi minimal untuk email utama. Hemat dan aman untuk coba 2 bulan.',
    features: [
      '100% Garansi Bisa Perpanjang',
      'Alokasi Pool Master 1 Tahun',
      'Tanpa Ganti Family Group',
      'Aman dari limit 12 bulan Google',
    ],
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pkg-primary-3m',
    name: '3 Bulan (Quarterly)',
    accountType: 'PRIMARY_EMAIL',
    durationMonths: 3,
    billingCycle: 'quarterly',
    price: 90000,
    badge: '⭐ Paling Laris & Rekomendasi',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
    isPopular: true,
    isActive: true,
    description: 'Pilihan paling favorit untuk pengguna akun pribadi. Hemat, stabil, dan bebas ribet.',
    features: [
      '100% Garansi Bisa Perpanjang',
      'Alokasi Pool Master 1 Tahun (Long-Term)',
      'Garansi Anti Pindah Family Group',
      'Bebas risiko limit 12 bulan Google',
    ],
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pkg-primary-4m',
    name: '4 Bulan (Caturwulan)',
    accountType: 'PRIMARY_EMAIL',
    durationMonths: 4,
    billingCycle: 'quarterly',
    price: 120000,
    badge: 'Fleksibel',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-indigo-500/20',
    isPopular: false,
    isActive: true,
    description: 'Paket durasi menengah 4 bulan untuk pengguna aktif Google Workspace & Photos.',
    features: [
      '100% Garansi Bisa Perpanjang',
      'Alokasi Pool Master 1 Tahun',
      'Garansi 120 hari penuh',
      'Anti pindah family group',
    ],
    sortOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pkg-primary-6m',
    name: '6 Bulan (Semi-Annual)',
    accountType: 'PRIMARY_EMAIL',
    durationMonths: 6,
    billingCycle: 'semi_annual',
    price: 170000,
    badge: 'Hemat',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-purple-500/20',
    isPopular: false,
    isActive: true,
    description: 'Solusi setengah tahun tanpa repot transfer tagihan sering-sering.',
    features: [
      '100% Garansi Bisa Perpanjang',
      'Alokasi Pool Master 1 Tahun',
      'Hemat Rp 10.000 dibanding triwulan',
      'Anti pindah family group',
    ],
    sortOrder: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pkg-primary-12m',
    name: '1 Tahun Penuh (12 Bulan)',
    accountType: 'PRIMARY_EMAIL',
    durationMonths: 12,
    billingCycle: 'yearly',
    price: 300000,
    badge: 'Full Protection',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
    isPopular: false,
    isActive: true,
    description: 'Tenang 365 hari penuh tanpa mikir tagihan perpanjangan.',
    features: [
      '100% Garansi Bisa Perpanjang',
      '1 Tahun Penuh Tanpa Gangguan',
      'Rate termurah Rp 25.000/bln',
      '100% Bebas limit Google Family',
    ],
    sortOrder: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // TIER B: AKUN SEKUNDER / CADANGAN (HEMAT)
  {
    id: 'pkg-sec-2m',
    name: '2 Bulan (Minimal)',
    accountType: 'SECONDARY_EMAIL',
    durationMonths: 2,
    billingCycle: 'monthly',
    price: 55000,
    badge: 'Durasi Minimal',
    badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-slate-700',
    isPopular: false,
    isActive: true,
    description: 'Pilihan paling hemat untuk kebutuhan backup storage di email cadangan.',
    features: [
      'Harga sangat ekonomis (Rp 55rb / 2 bln)',
      'Khusus email sekunder / non-utama',
      'Garansi 60 hari',
    ],
    sortOrder: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pkg-sec-3m',
    name: '3 Bulan (Quarterly)',
    accountType: 'SECONDARY_EMAIL',
    durationMonths: 3,
    billingCycle: 'quarterly',
    price: 80000,
    badge: 'Best Value Sekunder',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20',
    isPopular: false,
    isActive: true,
    description: 'Paket hemat 3 bulan untuk backup drive & Google Photos di email sekunder.',
    features: [
      'Hemat Rp 10.000 dibanding paket utama',
      'Khusus email cadangan',
      'Garansi 90 hari',
    ],
    sortOrder: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pkg-sec-4m',
    name: '4 Bulan (Caturwulan)',
    accountType: 'SECONDARY_EMAIL',
    durationMonths: 4,
    billingCycle: 'quarterly',
    price: 105000,
    badge: 'Lebih Hemat',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-indigo-500/20',
    isPopular: false,
    isActive: true,
    description: 'Paket 4 bulan ekonomis untuk backup storage drive email sekunder.',
    features: [
      'Harga Rp 26.250 / bulan',
      'Khusus email cadangan',
      'Garansi 120 hari',
    ],
    sortOrder: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pkg-sec-6m',
    name: '6 Bulan (Semi-Annual)',
    accountType: 'SECONDARY_EMAIL',
    durationMonths: 6,
    billingCycle: 'semi_annual',
    price: 150000,
    badge: 'Super Hemat',
    badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-slate-700',
    isPopular: false,
    isActive: true,
    description: 'Paket storage backup 6 bulan dengan harga grosir hemat.',
    features: [
      'Harga Rp 25.000 / bulan',
      'Khusus email sekunder',
      'Garansi 180 hari',
    ],
    sortOrder: 9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Demo seed data only loaded on manual request
export const DEMO_SEED_POOLS: AccountPool[] = [
  {
    id: 'pool-google-one-1',
    name: 'Google One 5TB Family Pool #1',
    provider: 'Google One',
    category: 'google_one',
    masterEmail: 'admin.family1@gmail.com',
    totalCapacity: 5,
    masterEndDate: format(addDays(new Date(), 84), 'yyyy-MM-dd'),
    masterCost: 135000,
    notes: 'Akun induk utama Google One 5TB Family (Storage sharing 5 slot member).',
    avatarColor: 'bg-blue-600',
    createdAt: subDays(new Date(), 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pool-canva-alpha',
    name: 'Canva Pro Team Alpha',
    provider: 'Canva Pro',
    category: 'canva_team',
    masterEmail: 'owner.canvateam@gmail.com',
    totalCapacity: 50,
    masterEndDate: format(addDays(new Date(), 120), 'yyyy-MM-dd'),
    masterCost: 750000,
    notes: 'Canva Pro enterprise team (Kapasitas 50 seats member).',
    avatarColor: 'bg-teal-500',
    createdAt: subDays(new Date(), 28).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export async function initializeDatabaseWithSeed(): Promise<{ 
  subscriptions: Subscription[]; 
  pools: AccountPool[];
  pricingPackages: PricingPackage[];
}> {
  const isInitialized = localStorage.getItem('subtracker_seed_initialized_v6_4m');

  if (!isInitialized) {
    for (const defPkg of DEFAULT_PRICING_PACKAGES) {
      const existing = await db.pricingPackages.get(defPkg.id);
      if (!existing) {
        await db.pricingPackages.put(defPkg);
      }
    }
    localStorage.setItem('subtracker_seed_initialized_v6_4m', 'true');
  }

  // Ensure all default packages exist
  const existingPkgCount = await db.pricingPackages.count();
  if (existingPkgCount === 0) {
    await db.pricingPackages.bulkPut(DEFAULT_PRICING_PACKAGES);
  } else {
    // Check if 4-month packages exist, if not, insert them
    const p4 = await db.pricingPackages.get('pkg-primary-4m');
    if (!p4) {
      const pkgPrimary4m = DEFAULT_PRICING_PACKAGES.find(p => p.id === 'pkg-primary-4m');
      if (pkgPrimary4m) await db.pricingPackages.put(pkgPrimary4m);
    }
    const s4 = await db.pricingPackages.get('pkg-sec-4m');
    if (!s4) {
      const pkgSec4m = DEFAULT_PRICING_PACKAGES.find(p => p.id === 'pkg-sec-4m');
      if (pkgSec4m) await db.pricingPackages.put(pkgSec4m);
    }
  }

  const subscriptions = await db.subscriptions.toArray();
  const pools = await db.pools.toArray();
  const pricingPackages = await db.pricingPackages.orderBy('sortOrder').toArray();

  return { subscriptions, pools, pricingPackages };
}

export async function resetToDemoData(): Promise<void> {
  await db.subscriptions.clear();
  await db.pools.clear();
  await db.activityLogs.clear();
  await db.notifications.clear();
  await db.pricingPackages.clear();
  
  await db.pools.bulkAdd(DEMO_SEED_POOLS);
  await db.pricingPackages.bulkPut(DEFAULT_PRICING_PACKAGES);
  localStorage.setItem('subtracker_seed_initialized_v6_4m', 'true');
}

export async function clearAllData(): Promise<void> {
  await db.subscriptions.clear();
  await db.pools.clear();
  await db.activityLogs.clear();
  await db.notifications.clear();
  await db.pricingPackages.clear();
  await db.pricingPackages.bulkPut(DEFAULT_PRICING_PACKAGES);
  localStorage.setItem('subtracker_seed_initialized_v6_4m', 'true');
}
