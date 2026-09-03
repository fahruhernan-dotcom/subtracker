import { Subscription } from '@/types/subscription';
import { formatDate, formatCurrency, getDaysRemaining } from '@/lib/utils';

export function generateWhatsAppReminderText(sub: Subscription): string {
  const daysLeft = getDaysRemaining(sub.endDate);
  const formattedEndDate = formatDate(sub.endDate);
  const greeting = `Halo Kak ${sub.memberName || 'Pelanggan'}! 👋`;

  if (daysLeft < 0) {
    return `${greeting}

Masa aktif layanan *${sub.name}* untuk akun *${sub.accountEmail}* telah *berakhir pada ${formattedEndDate}* (${Math.abs(daysLeft)} hari lalu).

⚠️ Karena belum ada konfirmasi pembayaran, akses Google One Family Sharing akan segera dinonaktifkan secara bertahap.

🛡️ *100% GARANSI BISA PERPANJANG DI AKUN UTAMA / PRIBADI ANDA*
_(Tetap di Family Group yang sama tanpa ganti akun, aman dari limit 12 bulan Google!)_

Pilihan Paket Perpanjangan Akun Utama:
• 2 Bulan : *Rp 60.000*
• 3 Bulan : *Rp 90.000* ⭐ _(Paling Laris)_
• 4 Bulan : *Rp 120.000*
• 6 Bulan : *Rp 170.000*
• 12 Bulan : *Rp 300.000* _(Hanya Rp 25rb/bln)_

💳 *Metode Pembayaran:* (BCA / Mandiri / BRI / Dana / QRIS)

Silakan balas pesan ini untuk konfirmasi perpanjangan agar slot tidak dialihkan ke member lain ya kak. Terima kasih banyak! 🙏✨`;
  }

  if (daysLeft === 0) {
    return `${greeting}

Mengingatkan bahwa masa aktif langganan *${sub.name}* untuk akun *${sub.accountEmail}* *berakhir HARI INI* (${formattedEndDate}).

Agar penyimpanan Google Drive, Gmail & Google Photos tidak terputus, yuk segera lakukan perpanjangan.

🛡️ *100% GARANSI BISA PERPANJANG DI AKUN UTAMA / PRIBADI ANDA*
_(Tetap di Family Group yang sama tanpa ganti akun, aman dari limit 12 bulan Google!)_

Pilihan Paket Perpanjangan Akun Utama:
• 2 Bulan : *Rp 60.000*
• 3 Bulan : *Rp 90.000* ⭐ _(Paling Laris)_
• 4 Bulan : *Rp 120.000*
• 6 Bulan : *Rp 170.000*
• 12 Bulan : *Rp 300.000* _(Hanya Rp 25rb/bln)_

💳 *Metode Pembayaran:* (BCA / Mandiri / BRI / Dana / QRIS)

Silakan balas pesan ini untuk konfirmasi pilihan paket kakak ya. Terima kasih banyak kak! 🙏✨`;
  }

  return `${greeting}

Mengingatkan bahwa masa aktif langganan *${sub.name}* untuk akun *${sub.accountEmail}* akan segera jatuh tempo dalam *${daysLeft} hari lagi* (pada tanggal ${formattedEndDate}).

Agar akses penyimpanan Google Drive & Google Photos tidak terputus, yuk segera lakukan perpanjangan dengan pilihan paket:

🛡️ *100% GARANSI BISA PERPANJANG DI AKUN UTAMA / PRIBADI ANDA*
_(Tetap di Family Group yang sama tanpa ganti akun, bebas limit 12 bulan Google!)_

• 2 Bulan : *Rp 60.000*
• 3 Bulan : *Rp 90.000* ⭐ _(Paling Laris)_
• 4 Bulan : *Rp 120.000*
• 6 Bulan : *Rp 170.000*
• 12 Bulan : *Rp 300.000* _(Hanya Rp 25rb/bln)_

💳 *Metode Pembayaran:* (BCA / Mandiri / BRI / Dana / QRIS)

Silakan konfirmasi pilihan paket kakak dengan membalas pesan ini ya. Terima kasih banyak kak! 🙏✨`;
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
