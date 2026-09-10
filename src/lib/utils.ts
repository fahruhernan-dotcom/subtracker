import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, differenceInCalendarDays, addDays, addMonths, addYears } from "date-fns";
import { BillingCycle, CurrencyCode, SubscriptionStatus } from "@/types/subscription";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'IDR'): string {
  if (currency === 'IDR') {
    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
    // Standardize spacing: "Rp 35.000" instead of "Rp35.000" or non-breaking spaces
    return formatted.replace(/^Rp\s*/, 'Rp ');
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatNumberIDR(amount?: number | null): string {
  if (amount === undefined || amount === null) return '';
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseCurrencyInput(value: string): number {
  if (!value) return 0;
  // Remove non-digit characters
  const cleanNumberStr = value.replace(/[^0-9]/g, '');
  return cleanNumberStr ? parseInt(cleanNumberStr, 10) : 0;
}

export function formatDate(dateString: string, formatStr: string = 'dd/MM/yyyy'): string {
  if (!dateString) return '-';
  try {
    return format(parseISO(dateString), formatStr);
  } catch {
    return dateString;
  }
}

export function formatDateIndo(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = parseISO(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function getDaysRemaining(endDateStr: string, currentDate: Date = new Date()): number {
  try {
    const endDate = parseISO(endDateStr);
    return differenceInCalendarDays(endDate, currentDate);
  } catch {
    return 0;
  }
}

export function getDaysLeftLabel(endDateStr: string, status: SubscriptionStatus): {
  label: string;
  days: number;
  isUrgent: boolean;
  isExpired: boolean;
  colorClass: string;
  className: string;
  bgColor: string;
  color: string;
  borderColor: string;
} {
  if (status === 'TERMINATED') {
    const colorClass = 'text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    return {
      label: 'Terminated',
      days: 0,
      isUrgent: false,
      isExpired: false,
      colorClass,
      className: colorClass,
      bgColor: 'bg-slate-100 dark:bg-slate-800',
      color: 'text-slate-400',
      borderColor: 'border-slate-200 dark:border-slate-700',
    };
  }

  const days = getDaysRemaining(endDateStr);

  if (days < 0) {
    const overdueDays = Math.abs(days);
    const colorClass = 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    return {
      label: `Lewat (${overdueDays} hari)`,
      days,
      isUrgent: true,
      isExpired: true,
      colorClass,
      className: colorClass,
      bgColor: 'bg-rose-50 dark:bg-rose-950/40',
      color: 'text-rose-600 dark:text-rose-400',
      borderColor: 'border-rose-200 dark:border-rose-800',
    };
  }

  if (days === 0) {
    const colorClass = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    return {
      label: 'Jatuh Tempo Hari Ini',
      days: 0,
      isUrgent: true,
      isExpired: true,
      colorClass,
      className: colorClass,
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      color: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-800',
    };
  }

  if (days <= 3) {
    const colorClass = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    return {
      label: `${days} hari lagi`,
      days,
      isUrgent: true,
      isExpired: false,
      colorClass,
      className: colorClass,
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      color: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-800',
    };
  }

  if (days <= 7) {
    const colorClass = 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    return {
      label: `${days} hari lagi`,
      days,
      isUrgent: false,
      isExpired: false,
      colorClass,
      className: colorClass,
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      color: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800',
    };
  }

  const colorClass = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
  return {
    label: `${days} hari lagi`,
    days,
    isUrgent: false,
    isExpired: false,
    colorClass,
    className: colorClass,
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    color: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  };
}

export function calculateNextPeriodDates(
  currentEndDateStr: string,
  billingCycle: 'monthly' | 'quarterly' | 'semi_annual' | 'yearly' | 'custom' = 'monthly',
  customDays: number = 30
): { nextStartDate: string; nextEndDate: string } {
  try {
    const currentEnd = parseISO(currentEndDateStr);
    const nextStart = currentEnd;
    let nextEnd: Date;

    switch (billingCycle) {
      case 'monthly':
        nextEnd = addMonths(nextStart, 1);
        break;
      case 'quarterly':
        nextEnd = addMonths(nextStart, 3);
        break;
      case 'semi_annual':
        nextEnd = addMonths(nextStart, 6);
        break;
      case 'yearly':
        nextEnd = addYears(nextStart, 1);
        break;
      case 'custom':
      default:
        nextEnd = addDays(nextStart, customDays || 30);
        break;
    }

    return {
      nextStartDate: format(nextStart, 'yyyy-MM-dd'),
      nextEndDate: format(nextEnd, 'yyyy-MM-dd'),
    };
  } catch {
    const now = new Date();
    return {
      nextStartDate: format(now, 'yyyy-MM-dd'),
      nextEndDate: format(addMonths(now, 1), 'yyyy-MM-dd'),
    };
  }
}

export const CATEGORY_DISPLAY_MAP: Record<string, { label: string; color: string; bgClass: string }> = {
  google_one: { label: 'Google One Family', color: '#3b82f6', bgClass: 'bg-blue-500' },
  workspace: { label: 'Google Workspace', color: '#2563eb', bgClass: 'bg-blue-600' },
  canva_team: { label: 'Canva Team', color: '#06b6d4', bgClass: 'bg-cyan-500' },
  adobe_seat: { label: 'Adobe Creative Cloud', color: '#ec4899', bgClass: 'bg-pink-500' },
  ai_tools: { label: 'AI Tools (ChatGPT / Claude)', color: '#10b981', bgClass: 'bg-emerald-500' },
  productivity: { label: 'Productivity & Office', color: '#8b5cf6', bgClass: 'bg-purple-500' },
  developer: { label: 'Developer & VPS', color: '#6366f1', bgClass: 'bg-indigo-500' },
  streaming: { label: 'Streaming & Media', color: '#f59e0b', bgClass: 'bg-amber-500' },
  security: { label: 'Security & VPN', color: '#f97316', bgClass: 'bg-orange-500' },
  design: { label: 'Design & UI/UX', color: '#d946ef', bgClass: 'bg-fuchsia-500' },
  other: { label: 'Lainnya / Custom', color: '#64748b', bgClass: 'bg-slate-500' },
};

export function getCategoryDisplayName(catOrProvider: string): string {
  if (!catOrProvider) return 'Lainnya';
  const key = catOrProvider.toLowerCase().trim();
  if (CATEGORY_DISPLAY_MAP[key]) return CATEGORY_DISPLAY_MAP[key].label;
  
  // Format snake_case or kebab-case to Title Case
  return catOrProvider
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

export function getCategoryColor(catOrProvider: string): string {
  if (!catOrProvider) return '#64748b';
  const key = catOrProvider.toLowerCase().trim();
  if (CATEGORY_DISPLAY_MAP[key]) return CATEGORY_DISPLAY_MAP[key].color;
  return '#3b82f6';
}

/**
 * Konversi billingCycle menjadi total bulan (contoh: quarterly -> 3 bulan)
 */
export function getBillingCycleMonths(cycle: BillingCycle | string | number): number {
  if (typeof cycle === 'number') return cycle > 0 ? cycle : 1;
  if (typeof cycle === 'string') {
    const parsed = parseInt(cycle, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  switch (cycle) {
    case 'quarterly':
      return 3;
    case 'semi_annual':
      return 6;
    case 'yearly':
      return 12;
    case 'monthly':
    default:
      return 1;
  }
}

/**
 * Label Bahasa Indonesia untuk siklus tagihan
 */
export function getCycleLabel(cycle: BillingCycle | string): string {
  switch (cycle) {
    case 'yearly':
      return '1 Tahun';
    case 'quarterly':
      return '3 Bulan';
    case 'semi_annual':
      return '6 Bulan';
    case 'custom':
      return 'Custom';
    case 'monthly':
    default:
      return '1 Bulan';
  }
}

/**
 * Hitung nilai setara per bulan (contoh: Rp 90.000 / 3 bulan = Rp 30.000/bln)
 */
export function getMonthlyEquivalent(price: number, cycleOrMonths: BillingCycle | string | number): number {
  if (!price || price <= 0) return 0;
  const months = getBillingCycleMonths(cycleOrMonths);
  return Math.round(price / months);
}

/**
 * Format string harga per bulan (contoh: "Rp 30.000/bln")
 */
export function formatMonthlyRate(
  price: number, 
  cycleOrMonths: BillingCycle | string | number, 
  currency: CurrencyCode = 'IDR'
): string {
  const monthly = getMonthlyEquivalent(price, cycleOrMonths);
  return `${formatCurrency(monthly, currency)}/bln`;
}

/**
 * Logika Penentuan Tier Garansi:
 * - Durasi > 5 Bulan (6m, 12m): Akun Utama (100% Garansi Perpanjang, tetap di grup sama)
 * - Durasi <= 4 Bulan (1m, 2m, 3m, 4m): Akun Lepas (Khusus Email 2nd / Cadangan)
 */
export function getWarrantyInfo(durationMonthsOrCycle: number | BillingCycle | string): {
  tier: 'PRIMARY_GUARANTEED' | 'SECONDARY_LEPAS';
  label: string;
  shortBadge: string;
  badgeClass: string;
  isGuaranteed: boolean;
  targetAccountLabel: string;
  description: string;
} {
  const months = getBillingCycleMonths(durationMonthsOrCycle);

  if (months > 5) {
    return {
      tier: 'PRIMARY_GUARANTEED',
      label: 'Garansi Perpanjang (Akun Utama)',
      shortBadge: '🛡️ Garansi Perpanjang',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20',
      isGuaranteed: true,
      targetAccountLabel: 'Akun Utama / Pribadi',
      description: '100% Garansi bisa diperpanjang di akun utama & tetap di grup master yang sama tanpa risiko limit Google.'
    };
  }

  return {
    tier: 'SECONDARY_LEPAS',
    label: 'Akun Lepas (Khusus Email 2nd)',
    shortBadge: '📦 Akun Lepas (2nd)',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20',
    isGuaranteed: false,
    targetAccountLabel: 'Email Sekunder / Backup',
    description: 'Sistem akun lepas untuk email cadangan. Tidak disarankan untuk email utama demi mencegah limit Google 12 bulan.'
  };
}

