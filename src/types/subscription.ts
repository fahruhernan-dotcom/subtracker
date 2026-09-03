export type SubscriptionStatus =
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'ACTION_REQUIRED'
  | 'TERMINATED';

export type SubscriptionCategory =
  | 'workspace'
  | 'google_one'
  | 'canva_team'
  | 'adobe_seat'
  | 'ai_tools'
  | 'developer'
  | 'streaming'
  | 'security'
  | 'other';

export type BillingCycle = 'monthly' | 'quarterly' | 'semi_annual' | 'yearly' | 'custom';

export type CurrencyCode = 'IDR' | 'USD' | 'EUR' | 'SGD' | 'GBP';

export interface ActionChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  required?: boolean;
}

export interface AccountPool {
  id: string;
  name: string;                   // e.g. "Google One 5TB Family - Pool #1"
  provider: string;               // e.g. "Google One", "Canva", "Google Workspace"
  category: SubscriptionCategory;
  masterEmail: string;            // Email akun induk / master owner
  masterPassword?: string;        // Password login akun induk / master (opsional)
  totalCapacity: number;          // Total slot member (e.g. 5 slot)
  masterEndDate: string;          // Tanggal jatuh tempo akun induk (YYYY-MM-DD)
  masterCost?: number;            // Biaya modal langganan akun induk (IDR)
  notes?: string;
  avatarColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PricingPackage {
  id: string;
  name: string;                   // e.g. "3 Bulan (Quarterly)"
  accountType: 'PRIMARY_EMAIL' | 'SECONDARY_EMAIL'; // Akun Utama vs Akun Sekunder
  durationMonths: number;          // 2, 3, 6, 12
  billingCycle: 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';
  price: number;                  // e.g. 90000
  badge?: string;                 // e.g. "⭐ Paling Laris & Rekomendasi"
  badgeColor?: string;
  isPopular?: boolean;
  isActive: boolean;
  description?: string;
  features: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  name: string;                   // e.g. "Google One 5TB Family - Slot #3"
  provider: string;               // e.g. "Google One", "Canva Team", "Adobe CC", "ChatGPT"
  category: SubscriptionCategory;
  accountEmail: string;           // Email member / client yang di-invite
  memberName: string;             // Nama client / pembeli slot
  clientPhone?: string;           // WhatsApp number client (e.g. 081234567890)
  poolId?: string;                // Relasi ke AccountPool.id
  poolName?: string;              // e.g. "Google One Pool #1"
  slotNumber?: number;            // Slot #1, #2, #3, etc.
  startDate: string;              // ISO Date (YYYY-MM-DD)
  endDate: string;                // Tanggal Jatuh Tempo / Expired Member (YYYY-MM-DD)
  price: number;                  // Harga tagihan ke member (e.g. 35000)
  currency: CurrencyCode;
  billingCycle: BillingCycle;
  autoRenews: boolean;
  status: SubscriptionStatus;
  checklist: ActionChecklistItem[]; // Admin action checklist saat expired (Kick dari family, stop share, WA)
  reminderOffsets: number[];      // e.g. [-7, -3, -1, 0, 1]
  notes?: string;
  tags?: string[];
  serviceUrl?: string;
  avatarColor?: string;
  iconName?: string;
  createdAt: string;
  updatedAt: string;
  terminatedAt?: string;
  lastRenewedAt?: string;
}

export interface ActivityLog {
  id: string;
  subscriptionId?: string;
  subscriptionName?: string;
  memberName?: string;
  poolId?: string;
  poolName?: string;
  actionType: 
    | 'CREATED' 
    | 'UPDATED' 
    | 'DELETED'
    | 'MEMBER_KICKED'
    | 'TASK_COMPLETED' 
    | 'TASK_UNCHECKED' 
    | 'TERMINATED' 
    | 'RENEWED' 
    | 'SNOOZED' 
    | 'WA_SENT' 
    | 'MEMBER_SWAPPED' 
    | 'ERROR_LOGGED' 
    | 'POOL_CREATED' 
    | 'POOL_UPDATED' 
    | 'POOL_DELETED';
  severity?: 'info' | 'warning' | 'error';
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
  description: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  subscriptionId: string;
  subscriptionName: string;
  memberName: string;
  type: 'EXPIRING_SOON' | 'DUE_TODAY' | 'ACTION_REQUIRED' | 'OVERDUE' | 'MASTER_POOL_EXPIRING';
  title: string;
  message: string;
  daysDiff: number;
  read: boolean;
  createdAt: string;
}

export interface DashboardMetrics {
  totalActive: number;
  upcomingRenewalsCount: number; // next 30 days
  needActionCount: number;       // member yang perlu di-kick / ditagih
  terminatedCount: number;
  totalContractedRevenue: number; // Total Omset Kas Aktual Masuk (Sum of sub.price all active members)
  totalMasterCost: number;        // Total Modal Akun Induk Aktual (Sum of pool.masterCost)
  totalNetProfit: number;         // Total Laba Bersih Riil (totalContractedRevenue - totalMasterCost)
  totalProfitMarginPercent: number; // Margin Keuntungan Total (%)
  monthlyRevenueEstimate: number; // Omset Normalisasi Bulanan (MRR)
  yearlyRevenueEstimate: number;  // Proyeksi Omset Tahunan (ARR)
  totalMasterCostMonthly: number; // Biaya Modal Akun Induk per Bulan (COGS / 12)
  totalMasterCostYearly: number;  // Biaya Modal Akun Induk per Tahun
  netProfitMonthly: number;       // Laba Bersih Bulanan (MRR - Modal Bulanan)
  netProfitYearly: number;        // Laba Bersih Tahunan
  profitMarginPercent: number;    // Margin Keuntungan (%)
  roiMultiplier: number;          // Return on Cost Multiplier (e.g. 3.4x)
  currencyBreakdown: Record<CurrencyCode, number>;
}
