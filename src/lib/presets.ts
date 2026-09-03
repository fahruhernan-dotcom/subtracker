import { ActionChecklistItem, BillingCycle, CurrencyCode, SubscriptionCategory } from "@/types/subscription";

export interface PresetService {
  name: string;
  provider: string;
  category: SubscriptionCategory;
  defaultPrice: number;
  defaultCurrency: CurrencyCode;
  defaultBillingCycle: BillingCycle;
  brandColor: string;
  textColor: string;
  logoLetter: string;
  defaultPoolPrefix: string;
  defaultChecklist: string[];
  defaultReminderOffsets: number[];
}

export const PRESET_SERVICES: PresetService[] = [
  {
    name: "Google One 5TB Family Sharing",
    provider: "Google One",
    category: "google_one",
    defaultPrice: 35000,
    defaultCurrency: "IDR",
    defaultBillingCycle: "monthly",
    brandColor: "bg-blue-600",
    textColor: "text-blue-500",
    logoLetter: "G",
    defaultPoolPrefix: "Google One 5TB Family Pool #1",
    defaultChecklist: [
      "Kirim WhatsApp pengingat perpanjangan ke member",
      "Buka families.google.com & Cabut / Kick email member dari Family Group",
      "Pastikan kuota storage kembali ke akun utama admin",
      "Tandai slot siap dijual / dialokasikan ke member baru"
    ],
    defaultReminderOffsets: [-7, -3, -1, 0, 1]
  },
  {
    name: "Google Workspace Enterprise Seat",
    provider: "Google Workspace",
    category: "workspace",
    defaultPrice: 135000,
    defaultCurrency: "IDR",
    defaultBillingCycle: "monthly",
    brandColor: "bg-red-500",
    textColor: "text-red-500",
    logoLetter: "W",
    defaultPoolPrefix: "Google Workspace Org ID-1",
    defaultChecklist: [
      "Kirim tagihan renewal via WhatsApp",
      "Buka Google Admin Console (admin.google.com) > Cabut User / Suspend lisensi",
      "Hapus alias email & transfer data jika diperlukan",
      "Konfirmasi ke member bahwa akses telah dinonaktifkan"
    ],
    defaultReminderOffsets: [-7, -3, -1, 0, 1]
  },
  {
    name: "Canva Pro Team Seat",
    provider: "Canva Pro",
    category: "canva_team",
    defaultPrice: 25000,
    defaultCurrency: "IDR",
    defaultBillingCycle: "monthly",
    brandColor: "bg-teal-500",
    textColor: "text-teal-500",
    logoLetter: "C",
    defaultPoolPrefix: "Canva Team Alpha",
    defaultChecklist: [
      "Kirim tagihan reminder via WhatsApp",
      "Buka Canva Team Settings > Anggota Tim > Hapus email member dari tim",
      "Verifikasi slot member kosong di dashboard Canva"
    ],
    defaultReminderOffsets: [-7, -3, -1, 0, 1]
  },
  {
    name: "Adobe Creative Cloud Pro Seat",
    provider: "Adobe",
    category: "adobe_seat",
    defaultPrice: 175000,
    defaultCurrency: "IDR",
    defaultBillingCycle: "monthly",
    brandColor: "bg-rose-600",
    textColor: "text-rose-600",
    logoLetter: "A",
    defaultPoolPrefix: "Adobe Enterprise Group",
    defaultChecklist: [
      "Kirim konfirmasi perpanjangan ke WhatsApp member",
      "Buka Adobe Admin Console > Users > Cabut lisensi produk",
      "Tandai lisensi available untuk member berikutnya"
    ],
    defaultReminderOffsets: [-14, -7, -3, -1, 0]
  },
  {
    name: "Microsoft 365 Family Sharing",
    provider: "Microsoft",
    category: "workspace",
    defaultPrice: 35000,
    defaultCurrency: "IDR",
    defaultBillingCycle: "monthly",
    brandColor: "bg-sky-600",
    textColor: "text-sky-600",
    logoLetter: "M",
    defaultPoolPrefix: "M365 Family Pool #1",
    defaultChecklist: [
      "Kirim pesan WA konfirmasi perpanjangan",
      "Buka account.microsoft.com/family > Hapus member dari sharing",
      "Pastikan 1TB OneDrive member terputus"
    ],
    defaultReminderOffsets: [-7, -3, -1, 0]
  },
  {
    name: "ChatGPT Team / Plus Seat",
    provider: "OpenAI",
    category: "ai_tools",
    defaultPrice: 150000,
    defaultCurrency: "IDR",
    defaultBillingCycle: "monthly",
    brandColor: "bg-emerald-600",
    textColor: "text-emerald-600",
    logoLetter: "O",
    defaultPoolPrefix: "ChatGPT Workspace ID-A",
    defaultChecklist: [
      "Kirim pengingat WhatsApp tagihan",
      "Buka OpenAI Workspace > Members > Remove Member",
      "Konfirmasi slot telah kosong"
    ],
    defaultReminderOffsets: [-7, -3, -1, 0]
  },
  {
    name: "Custom Member Seat",
    provider: "Custom",
    category: "other",
    defaultPrice: 50000,
    defaultCurrency: "IDR",
    defaultBillingCycle: "monthly",
    brandColor: "bg-indigo-600",
    textColor: "text-indigo-600",
    logoLetter: "*",
    defaultPoolPrefix: "Custom Pool #1",
    defaultChecklist: [
      "Kirim notifikasi / pesan WA ke member",
      "Cabut akses invite / kick dari sistem atau grup",
      "Konfirmasi status pemutusan & slot kosong"
    ],
    defaultReminderOffsets: [-7, -3, -1, 0, 1]
  }
];

export function buildDefaultChecklist(presetName?: string): ActionChecklistItem[] {
  const preset = PRESET_SERVICES.find(p => p.name === presetName) || PRESET_SERVICES[0];
  return preset.defaultChecklist.map((title, index) => ({
    id: `item-${Date.now()}-${index}`,
    title,
    completed: false,
    required: true,
  }));
}
