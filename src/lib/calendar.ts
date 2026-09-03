import { Subscription, AccountPool } from '@/types/subscription';
import { parseISO, format } from 'date-fns';

export const TARGET_GOOGLE_CALENDAR_ID = '1605a444580f5913249c325b3cce304d9254bba00e3cbdbc6d2ee6de63a31496@group.calendar.google.com';
export const TARGET_ICAL_FEED_URL = 'https://calendar.google.com/calendar/ical/1605a444580f5913249c325b3cce304d9254bba00e3cbdbc6d2ee6de63a31496%40group.calendar.google.com/public/basic.ics';

/**
 * Generate 1-Click Google Calendar event link targeting the user's specific SubTracker calendar.
 */
export function generateGoogleCalendarUrl(sub: Subscription): string {
  try {
    const end = parseISO(sub.endDate);
    const startDateFormatted = format(end, "yyyyMMdd'T'090000");
    const endDateFormatted = format(end, "yyyyMMdd'T'100000");

    const checklistText = sub.checklist.map(item => `- [${item.completed ? 'x' : ' '}] ${item.title}`).join('\n');
    const details = `⚠️ PERHATIAN ADMIN: Masa aktif member ${sub.memberName || 'Member'} (${sub.name}) berakhir hari ini!

Akses TIDAK otomatis berhenti. Pastikan tindakan admin berikut dilakukan:
${checklistText}

Detail Member:
- Nama Member: ${sub.memberName || '-'}
- Email Member: ${sub.accountEmail}
- WhatsApp: ${sub.clientPhone || '-'}
- Pool / Group: ${sub.poolName || '-'}
- Provider: ${sub.provider}
- Catatan: ${sub.notes || '-'}

Dikelola via SubTracker Pro (Admin Multi-Member Guard)`;

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `[Admin Action] Kick / Expiry: ${sub.memberName || 'Member'} (${sub.name})`,
      dates: `${startDateFormatted}/${endDateFormatted}`,
      details: details,
      location: sub.serviceUrl || sub.provider,
      src: TARGET_GOOGLE_CALENDAR_ID,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch {
    return 'https://calendar.google.com';
  }
}

/**
 * Generate 1-Click Google Calendar event for Pool Master Expiry
 */
export function generatePoolGoogleCalendarUrl(pool: AccountPool): string {
  try {
    const end = parseISO(pool.masterEndDate);
    const startDateFormatted = format(end, "yyyyMMdd'T'090000");
    const endDateFormatted = format(end, "yyyyMMdd'T'100000");

    const details = `👑 PERHATIAN ADMIN: Masa aktif Akun Induk Pool "${pool.name}" (${pool.provider}) berakhir hari ini!

Perpanjang tagihan master account sebelum seluruh slot member (${pool.totalCapacity} slot) terputus.

Detail Pool:
- Nama Pool: ${pool.name}
- Provider: ${pool.provider}
- Master Email: ${pool.masterEmail}
- Total Kapasitas: ${pool.totalCapacity} Slot
- Catatan: ${pool.notes || '-'}

Dikelola via SubTracker Pro`;

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `[Master Pool Expiry] ${pool.name} (${pool.provider})`,
      dates: `${startDateFormatted}/${endDateFormatted}`,
      details: details,
      location: pool.provider,
      src: TARGET_GOOGLE_CALENDAR_ID,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch {
    return 'https://calendar.google.com';
  }
}

/**
 * Download single subscription .ics file
 */
export function downloadIcsFile(sub: Subscription): void {
  try {
    const end = parseISO(sub.endDate);
    const dateStr = format(end, "yyyyMMdd'T'090000");
    const endHourStr = format(end, "yyyyMMdd'T'100000");
    const nowStr = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");

    const checklistText = sub.checklist
      .map(item => `\\n- [${item.completed ? 'x' : ' '}] ${item.title}`)
      .join('');

    const description = `PERHATIAN ADMIN: Masa aktif ${sub.memberName || 'Member'} (${sub.name}) berakhir hari ini!\\n\\nTindakan Wajib:${checklistText}\\n\\nEmail: ${sub.accountEmail}\\nWhatsApp: ${sub.clientPhone || '-'}\\nPool: ${sub.poolName || '-'}`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SubTracker Pro//Admin Member Expiry Action//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:sub-${sub.id}-${Date.now()}@subtracker.app`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${dateStr}`,
      `DTEND:${endHourStr}`,
      `SUMMARY:[Admin Action] Expiry: ${sub.memberName || 'Member'} (${sub.name})`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-P7D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder H-7: ${sub.memberName || 'Member'} (${sub.name})`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:URGENT: ${sub.memberName || 'Member'} expires tomorrow! Prepare kick/billing.`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:PT0M',
      'ACTION:DISPLAY',
      `DESCRIPTION:ACTION REQUIRED: ${sub.memberName || 'Member'} expires today! Kick/revoke access now.`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${(sub.memberName || sub.name).replace(/\s+/g, '_')}_expiry_reminder.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Failed to generate .ics file', err);
  }
}

/**
 * Generate and download a comprehensive Master .ics calendar feed containing ALL active member deadlines and pool master dates
 */
export function downloadMasterIcsFile(subscriptions: Subscription[], pools: AccountPool[] = []): void {
  try {
    const nowStr = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
    const activeSubs = subscriptions.filter(s => s.status !== 'TERMINATED');

    const events: string[] = [];

    // 1. Member Events
    activeSubs.forEach(sub => {
      try {
        const end = parseISO(sub.endDate);
        const dateStr = format(end, "yyyyMMdd'T'090000");
        const endHourStr = format(end, "yyyyMMdd'T'100000");

        const checklistText = sub.checklist
          .map(item => `\\n- [${item.completed ? 'x' : ' '}] ${item.title}`)
          .join('');

        const description = `PERHATIAN ADMIN: Masa aktif member ${sub.memberName || 'Member'} (${sub.name}) berakhir hari ini!\\n\\nTindakan Wajib:${checklistText}\\n\\nEmail: ${sub.accountEmail}\\nWhatsApp: ${sub.clientPhone || '-'}\\nPool: ${sub.poolName || '-'}\\nProvider: ${sub.provider}`;

        events.push([
          'BEGIN:VEVENT',
          `UID:sub-${sub.id}@subtracker.app`,
          `DTSTAMP:${nowStr}`,
          `DTSTART:${dateStr}`,
          `DTEND:${endHourStr}`,
          `SUMMARY:[SubTracker] Kick/Expiry: ${sub.memberName || 'Member'} (${sub.name})`,
          `DESCRIPTION:${description}`,
          'STATUS:CONFIRMED',
          'BEGIN:VALARM',
          'TRIGGER:-P7D',
          'ACTION:DISPLAY',
          `DESCRIPTION:Reminder H-7: ${sub.memberName || 'Member'} (${sub.name})`,
          'END:VALARM',
          'BEGIN:VALARM',
          'TRIGGER:-P1D',
          'ACTION:DISPLAY',
          `DESCRIPTION:URGENT H-1: ${sub.memberName || 'Member'} expires tomorrow!`,
          'END:VALARM',
          'BEGIN:VALARM',
          'TRIGGER:PT0M',
          'ACTION:DISPLAY',
          `DESCRIPTION:ACTION TODAY: Kick/Revoke ${sub.memberName || 'Member'} (${sub.name})`,
          'END:VALARM',
          'END:VEVENT',
        ].join('\r\n'));
      } catch (e) {
        console.error('Failed formatting event for', sub.id, e);
      }
    });

    // 2. Pool Master Events
    pools.forEach(pool => {
      try {
        const end = parseISO(pool.masterEndDate);
        const dateStr = format(end, "yyyyMMdd'T'090000");
        const endHourStr = format(end, "yyyyMMdd'T'100000");

        const description = `👑 PERHATIAN ADMIN: Masa aktif Akun Induk Pool "${pool.name}" (${pool.provider}) berakhir hari ini!\\n\\nKapasitas: ${pool.totalCapacity} Slot\\nMaster Email: ${pool.masterEmail}\\nCatatan: ${pool.notes || '-'}`;

        events.push([
          'BEGIN:VEVENT',
          `UID:pool-${pool.id}@subtracker.app`,
          `DTSTAMP:${nowStr}`,
          `DTSTART:${dateStr}`,
          `DTEND:${endHourStr}`,
          `SUMMARY:👑 [Master Pool Expiry] ${pool.name} (${pool.provider})`,
          `DESCRIPTION:${description}`,
          'STATUS:CONFIRMED',
          'BEGIN:VALARM',
          'TRIGGER:-P14D',
          'ACTION:DISPLAY',
          `DESCRIPTION:Reminder H-14 Master Pool Expiry: ${pool.name}`,
          'END:VALARM',
          'BEGIN:VALARM',
          'TRIGGER:-P3D',
          'ACTION:DISPLAY',
          `DESCRIPTION:URGENT H-3: Perpanjang Akun Induk ${pool.name}!`,
          'END:VALARM',
          'END:VEVENT',
        ].join('\r\n'));
      } catch (e) {
        console.error('Failed formatting pool event for', pool.id, e);
      }
    });

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SubTracker Pro//Master Expiry Calendar//ID',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:SubTracker Pro - Member & Pool Deadlines',
      'X-WR-TIMEZONE:Asia/Jakarta',
      ...events,
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `subtracker_master_calendar_${format(new Date(), 'yyyyMMdd')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Failed to generate master .ics file', err);
  }
}
