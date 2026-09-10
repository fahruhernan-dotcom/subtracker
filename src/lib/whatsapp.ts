import { Subscription } from '@/types/subscription';
import { formatDate, formatCurrency, getDaysRemaining } from '@/lib/utils';

export function getCleanServiceName(sub: Subscription): string {
  let name = sub.provider && sub.provider.toLowerCase() !== 'other'
    ? sub.provider
    : sub.name.split(' - ')[0]?.trim() || sub.name;

  // Hapus kata 'family', 'sharing', 'group', 'seat' agar tidak membuat pelanggan bingung/ragu
  name = name.replace(/\b(family|sharing|group|seat)\b/gi, '').replace(/\s+/g, ' ').trim();
  return name || 'Google AI Pro 5TB';
}

export function getClientFirstName(name?: string): string {
  if (!name) return 'Kak';
  const first = name.trim().split(/\s+/)[0];
  return `Kak ${first}`;
}

export function generateWhatsAppReminderText(sub: Subscription): string {
  const daysLeft = getDaysRemaining(sub.endDate);
  const formattedEndDate = formatDate(sub.endDate);
  const serviceName = getCleanServiceName(sub);
  const clientGreeting = getClientFirstName(sub.memberName);

  const packageOptionsText = `🛡️ *Paket Akun Utama (Garansi Perpanjang):*
• 6 Bulan : Rp 170.000 (Rp 28.300/bln)
• 12 Bulan : Rp 300.000 (Rp 25.000/bln - Paling Hemat)

📦 *Paket Akun 2nd / Lepas:*
• 3 Bulan : Rp 90.000 (Rp 30.000/bln)`;

  // 1. KASUS SUDAH EXPIRED (LEWAT JATUH TEMPO)
  if (daysLeft < 0) {
    const overdueDays = Math.abs(daysLeft);
    return `Halo ${clientGreeting},

Masa aktif langganan *${serviceName}* untuk akun *${sub.accountEmail}* telah *berakhir* pada ${formattedEndDate}${overdueDays > 1 ? ` (${overdueDays} hari lalu)` : ''}.

Mohon konfirmasi jika ingin melanjutkan agar akses penyimpanan tidak terputus dan slot tidak dialihkan ke member lain:

${packageOptionsText}

Pembayaran: BCA, Mandiri, BRI, DANA, atau QRIS.

Silakan balas pesan ini untuk perpanjangan. Terima kasih!`;
  }

  // 2. KASUS JATUH TEMPO HARI H
  if (daysLeft === 0) {
    return `Halo ${clientGreeting},

Masa aktif langganan *${serviceName}* untuk akun *${sub.accountEmail}* *berakhir hari ini* (${formattedEndDate}).

Agar akses penyimpanan Google Drive & Photos tidak terputus, mohon konfirmasi perpanjangan hari ini:

${packageOptionsText}

Pembayaran: BCA, Mandiri, BRI, DANA, atau QRIS.

Silakan balas pesan ini untuk konfirmasi perpanjangan. Terima kasih!`;
  }

  // 3. KASUS MENDEKATI JATUH TEMPO (H-1 s/d H-7)
  if (daysLeft <= 7) {
    return `Halo ${clientGreeting},

Meningatkan bahwa langganan *${serviceName}* untuk akun *${sub.accountEmail}* akan berakhir dalam *${daysLeft} hari* (pada ${formattedEndDate}).

Agar penyimpanan Drive & Photos tetap aktif tanpa gangguan, silakan lakukan perpanjangan:

${packageOptionsText}

Pembayaran: BCA, Mandiri, BRI, DANA, atau QRIS.

Silakan balas pesan ini untuk konfirmasi perpanjangan. Terima kasih!`;
  }

  // 4. KASUS INFORMASI STATUS / JATUH TEMPO MASIH LAMA (> 7 HARI)
  return `Halo ${clientGreeting},

Informasi masa aktif langganan *${serviceName}* untuk akun *${sub.accountEmail}* saat ini aktif hingga *${formattedEndDate}* (${daysLeft} Hari Lagi).

Jika Anda ingin melakukan perpanjangan lebih awal, berikut opsi paket yang tersedia:

${packageOptionsText}

Pembayaran: BCA, Mandiri, BRI, DANA, atau QRIS.

Silakan balas pesan ini jika membutuhkan bantuan atau ingin perpanjangan. Terima kasih!`;
}

// 5. TEMPLATE AKTIVASI BARU (TINGGAL ACCEPT, TANPA KATA FAMILY)
export function generateWhatsAppActivationText(sub: Subscription): string {
  const daysLeft = getDaysRemaining(sub.endDate);
  const formattedEndDate = formatDate(sub.endDate);
  const serviceName = getCleanServiceName(sub);
  const clientGreeting = getClientFirstName(sub.memberName);

  const countdownText = daysLeft > 0 
    ? ` (${daysLeft} Hari Lagi)` 
    : daysLeft === 0 
      ? ' (Hari Ini)' 
      : '';

  return `Halo ${clientGreeting},

Aktivasi *${serviceName}* untuk akun *${sub.accountEmail}* sudah kami proses.

Silakan terima (accept) undangannya agar kuota langsung aktif di akun Anda:

1. Buka email masuk dari Google di Gmail (atau klik https://families.google.com/)
2. Klik tombol *"Terima Undangan"* (Accept)

Setelah di-accept, kuota penyimpanan Anda otomatis langsung aktif.

Masa aktif hingga: *${formattedEndDate}*${countdownText}.

Kabari kami jika sudah ya. Terima kasih!`;
}

export function formatWhatsAppUrl(phoneNumber?: string, messageText?: string): string {
  if (!phoneNumber) return '';
  // Clean phone number: remove non-digits, replace leading 0 with 62
  let cleanNumber = phoneNumber.replace(/\D/g, '');
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '62' + cleanNumber.slice(1);
  } else if (!cleanNumber.startsWith('62')) {
    cleanNumber = '62' + cleanNumber;
  }

  const encodedMsg = encodeURIComponent(messageText || '');
  return `https://wa.me/${cleanNumber}?text=${encodedMsg}`;
}

