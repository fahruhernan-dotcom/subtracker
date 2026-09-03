import { 
  Subscription, 
  AccountPool,
  SubscriptionStatus, 
  DashboardMetrics, 
  AppNotification, 
  CurrencyCode 
} from "@/types/subscription";
import { getDaysRemaining } from "@/lib/utils";

export function resolveSubscriptionStatus(sub: Subscription, currentDate: Date = new Date()): SubscriptionStatus {
  // If already manually terminated/kicked, retain terminated status
  if (sub.status === 'TERMINATED') {
    return 'TERMINATED';
  }

  const daysLeft = getDaysRemaining(sub.endDate, currentDate);

  // Expired or Overdue
  if (daysLeft < 0) {
    return 'ACTION_REQUIRED';
  }

  // Due today
  if (daysLeft === 0) {
    return 'ACTION_REQUIRED';
  }

  // Expiring within 7 days
  if (daysLeft <= 7) {
    return 'EXPIRING_SOON';
  }

  return 'ACTIVE';
}

export function computeDashboardMetrics(
  subscriptions: Subscription[],
  pools: AccountPool[] = []
): DashboardMetrics {
  const currentDate = new Date();
  
  let totalActive = 0;
  let upcomingRenewalsCount = 0;
  let needActionCount = 0;
  let terminatedCount = 0;
  let monthlyRevenueEstimate = 0;
  let yearlyRevenueEstimate = 0;
  let totalContractedRevenue = 0;
  
  const currencyBreakdown: Record<CurrencyCode, number> = {
    IDR: 0,
    USD: 0,
    EUR: 0,
    SGD: 0,
    GBP: 0,
  };

  subscriptions.forEach(sub => {
    const status = resolveSubscriptionStatus(sub, currentDate);
    const daysLeft = getDaysRemaining(sub.endDate, currentDate);

    if (status === 'TERMINATED') {
      terminatedCount++;
      return; // Do not count into active revenue
    }

    if (status === 'ACTION_REQUIRED') {
      needActionCount++;
    }

    if (status === 'ACTIVE' || status === 'EXPIRING_SOON') {
      totalActive++;
    }

    // Upcoming in next 30 days
    if (daysLeft >= 0 && daysLeft <= 30) {
      upcomingRenewalsCount++;
    }

    // Total contracted revenue (Sum of actual prices paid by active members)
    totalContractedRevenue += (Number(sub.price) || 0);

    // Monthly revenue normalizer
    let monthlyRate = sub.price;
    if (sub.billingCycle === 'yearly') {
      monthlyRate = sub.price / 12;
    } else if (sub.billingCycle === 'quarterly') {
      monthlyRate = sub.price / 3;
    } else if (sub.billingCycle === 'semi_annual') {
      monthlyRate = sub.price / 6;
    }

    monthlyRevenueEstimate += monthlyRate;
    yearlyRevenueEstimate += monthlyRate * 12;

    if (currencyBreakdown[sub.currency] !== undefined) {
      currencyBreakdown[sub.currency] += monthlyRate;
    }
  });

  // Calculate Master Pool Costs (Total Modal Akun Induk)
  const totalMasterCost = pools.reduce((sum, p) => sum + (Number(p.masterCost) || 0), 0);
  const totalMasterCostYearly = totalMasterCost;
  const totalMasterCostMonthly = Math.round(totalMasterCost / 12);

  // Total Actual Realized Net Profit (Total Revenue Paid - Total Master Cost Spent)
  const totalNetProfit = Math.round(totalContractedRevenue - totalMasterCost);
  const totalProfitMarginPercent = totalContractedRevenue > 0
    ? Math.round((totalNetProfit / totalContractedRevenue) * 100)
    : (totalMasterCost > 0 ? -100 : 0);

  // Normalized Monthly Net Profit & Profit Margin
  const netProfitMonthly = Math.round(monthlyRevenueEstimate - totalMasterCostMonthly);
  const netProfitYearly = Math.round(yearlyRevenueEstimate - totalMasterCostYearly);
  const profitMarginPercent = monthlyRevenueEstimate > 0 
    ? Math.round((netProfitMonthly / monthlyRevenueEstimate) * 100) 
    : 0;
  
  const roiMultiplier = totalMasterCost > 0 
    ? Number((totalContractedRevenue / totalMasterCost).toFixed(1)) 
    : (totalContractedRevenue > 0 ? 10 : 0);

  return {
    totalActive,
    upcomingRenewalsCount,
    needActionCount,
    terminatedCount,
    totalContractedRevenue: Math.round(totalContractedRevenue),
    totalMasterCost: Math.round(totalMasterCost),
    totalNetProfit,
    totalProfitMarginPercent,
    monthlyRevenueEstimate: Math.round(monthlyRevenueEstimate),
    yearlyRevenueEstimate: Math.round(yearlyRevenueEstimate),
    totalMasterCostMonthly,
    totalMasterCostYearly,
    netProfitMonthly,
    netProfitYearly,
    profitMarginPercent,
    roiMultiplier,
    currencyBreakdown,
  };
}

export function generateNotificationsFromSubscriptions(
  subscriptions: Subscription[],
  currentDate: Date = new Date()
): AppNotification[] {
  const notifications: AppNotification[] = [];

  subscriptions.forEach(sub => {
    if (sub.status === 'TERMINATED') return;

    const daysLeft = getDaysRemaining(sub.endDate, currentDate);
    const member = sub.memberName || 'Member';

    if (daysLeft < 0) {
      notifications.push({
        id: `notif-overdue-${sub.id}`,
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        memberName: member,
        type: 'OVERDUE',
        title: `⚠️ Wajib Kick: Masa aktif ${member} telah habis!`,
        message: `Akun ${sub.accountEmail} (${sub.name}) telah melewati jatuh tempo ${Math.abs(daysLeft)} hari lalu. Segera cabut invite dari admin console.`,
        daysDiff: daysLeft,
        read: false,
        createdAt: new Date().toISOString(),
      });
    } else if (daysLeft === 0) {
      notifications.push({
        id: `notif-today-${sub.id}`,
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        memberName: member,
        type: 'DUE_TODAY',
        title: `🔴 ${member} jatuh tempo HARI INI`,
        message: `Masa aktif ${sub.name} habis hari ini. Kirim WA reminder atau cabut akses jika tidak diperpanjang.`,
        daysDiff: 0,
        read: false,
        createdAt: new Date().toISOString(),
      });
    } else if (daysLeft <= 3) {
      notifications.push({
        id: `notif-urgent-${sub.id}`,
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        memberName: member,
        type: 'ACTION_REQUIRED',
        title: `🟠 Reminder: ${member} berakhir dalam ${daysLeft} hari`,
        message: `Siapkan tagihan WhatsApp untuk ${sub.name} (${sub.accountEmail}).`,
        daysDiff: daysLeft,
        read: false,
        createdAt: new Date().toISOString(),
      });
    } else if (daysLeft <= 7) {
      notifications.push({
        id: `notif-soon-${sub.id}`,
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        memberName: member,
        type: 'EXPIRING_SOON',
        title: `🟡 Reminder H-7: ${member} (${sub.name})`,
        message: `Masa aktif jatuh tempo pada ${sub.endDate}.`,
        daysDiff: daysLeft,
        read: true,
        createdAt: new Date().toISOString(),
      });
    }
  });

  return notifications;
}
