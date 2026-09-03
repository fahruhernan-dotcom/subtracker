'use client';

import React, { useState } from 'react';
import { 
  Tag, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  Copy, 
  MessageSquare, 
  Calculator, 
  Layers, 
  Users, 
  ArrowRight, 
  AlertTriangle,
  Info,
  DollarSign,
  TrendingUp,
  Percent,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  BellRing,
  Send
} from 'lucide-react';
import { AccountPool, Subscription, PricingPackage } from '@/types/subscription';
import { formatCurrency } from '@/lib/utils';
import { AddEditPackageModal } from '@/components/pricelist/AddEditPackageModal';

interface PriceListViewProps {
  pools: AccountPool[];
  subscriptions: Subscription[];
  packages: PricingPackage[];
  onSavePackage: (pkg: Partial<PricingPackage>) => void;
  onDeletePackage: (pkg: PricingPackage) => void;
  onSelectPackageForMember: (pkg: {
    packageName: string;
    accountType: 'PRIMARY_EMAIL' | 'SECONDARY_EMAIL';
    durationMonths: number;
    billingCycle: 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';
    price: number;
    notes: string;
  }) => void;
}

export const PriceListView: React.FC<PriceListViewProps> = ({
  pools,
  subscriptions,
  packages = [],
  onSavePackage,
  onDeletePackage,
  onSelectPackageForMember,
}) => {
  const [copiedWA, setCopiedWA] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PricingPackage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [waTemplateType, setWaTemplateType] = useState<'promo' | 'reminder' | 'activation'>('promo');

  // Filter packages by account tier and sort strictly by duration in ascending order
  const primaryPackages = packages
    .filter((p) => p.accountType === 'PRIMARY_EMAIL' && p.isActive !== false)
    .sort((a, b) => (a.durationMonths || 0) - (b.durationMonths || 0) || (a.sortOrder || 0) - (b.sortOrder || 0));

  const secondaryPackages = packages
    .filter((p) => p.accountType === 'SECONDARY_EMAIL' && p.isActive !== false)
    .sort((a, b) => (a.durationMonths || 0) - (b.durationMonths || 0) || (a.sortOrder || 0) - (b.sortOrder || 0));

  // 1. Template Broadcast Penawaran / Price List Lengkap
  const generatePromoBroadcast = () => {
    let text = `🔥 *UPGRADE RESMI GOOGLE ONE PRO 5TB FAMILY SHARING* 🔥\n`;
    text += `Bikin Google Drive, Google Photos, dan Gmail kamu lega tanpa batas! Bebas khawatir memori HP/Laptop penuh.\n\n`;

    text += `⭐ *A. PAKET EMAIL PRIBADI / AKUN UTAMA (GARANSI BISA PERPANJANG ⭐)*\n`;
    text += `_(🛡️ 100% GARANSI BISA PERPANJANG • Tanpa Ganti Family Group • Bebas Limit 12 Bulan Google • Dialokasikan ke Pool Master 1 Tahun)_\n`;
    primaryPackages.forEach((pkg) => {
      const isPopularBadge = pkg.isPopular ? ' 🔥 _(Paling Laris)_' : '';
      const minBadge = pkg.durationMonths === 2 ? ' _(Min. Order)_' : '';
      const yearBadge = pkg.durationMonths === 12 ? ' _(Hanya Rp 25rb/bln!)_' : '';
      text += `• ${pkg.durationMonths} Bulan : *${formatCurrency(pkg.price, 'IDR')}*${minBadge}${isPopularBadge}${yearBadge}\n`;
    });

    text += `\n📦 *B. PAKET AKUN SEKUNDER / BUKAN EMAIL UTAMA*\n`;
    text += `_(💡 Khusus email kedua untuk backup foto, video mentah & arsip file dokumen)_\n`;
    secondaryPackages.forEach((pkg) => {
      const perBulan = Math.round(pkg.price / pkg.durationMonths);
      const minBadge = pkg.durationMonths === 2 ? ' _(Min. Order)_' : '';
      text += `• ${pkg.durationMonths} Bulan : *${formatCurrency(pkg.price, 'IDR')}* _(Setara ${formatCurrency(perBulan, 'IDR')}/bln)_${minBadge}\n`;
    });

    text += `\n✨ *Keunggulan Berlangganan di Kami:*\n`;
    text += `✅ 100% Legal & Resmi via Google Family Sharing\n`;
    text += `✅ Data & Foto Pribadi 100% Aman (Tidak bisa dilihat anggota lain)\n`;
    text += `✅ Tanpa Password akun Anda (Cukup terima email undangan resmi)\n`;
    text += `✅ Garansi Full selama masa aktif langganan\n`;
    text += `✅ Proses cepat aktif dalam hitungan menit\n\n`;

    text += `📲 *Format Pemesanan Cepat:*\n`;
    text += `Nama :\n`;
    text += `Email Google :\n`;
    text += `Pilihan Paket : (Contoh: Akun Utama 3 Bulan)\n\n`;
    text += `Silakan balas pesan ini untuk langsung kami kirimkan undangan aktif ya! 🙏🚀`;

    return text;
  };

  // 2. Template Reminder Jatuh Tempo & Tagihan Perpanjangan
  const generateReminderTemplate = () => {
    let text = `Halo kak! 👋\n\n`;
    text += `Mengingatkan bahwa masa aktif langganan *Google One Pro 5TB Family* kakak akan segera jatuh tempo dalam beberapa hari ke depan.\n\n`;
    text += `Agar akses penyimpanan Google Drive & Google Photos tidak terputus, yuk segera lakukan perpanjangan dengan pilihan paket:\n\n`;

    primaryPackages.forEach((pkg) => {
      text += `• ${pkg.durationMonths} Bulan : *${formatCurrency(pkg.price, 'IDR')}* ${pkg.isPopular ? '⭐' : ''}\n`;
    });

    text += `\n💳 *Metode Pembayaran:* (BCA / Mandiri / BRI / Dana / QRIS)\n\n`;
    text += `Silakan konfirmasi pilihan paket kakak dengan membalas pesan ini ya. Terima kasih banyak kak! 🙏✨`;
    return text;
  };

  // 3. Template Konfirmasi Aktivasi Slot Berhasil
  const generateActivationTemplate = () => {
    let text = `Halo kak! 🎉\n\n`;
    text += `Undangan slot *Google One Pro 5TB Family* telah berhasil kami kirimkan ke email kakak!\n\n`;
    text += `📌 *Langkah Mudah Mengaktifkan:*\n`;
    text += `1. Buka aplikasi Gmail atau email masuk Anda.\n`;
    text += `2. Cari email undangan dari *Google Families*.\n`;
    text += `3. Klik tombol *'Terima Undangan' / 'Join Family'*.\n`;
    text += `4. Selesai! Kapasitas Google Drive & Google Photos langsung otomatis bertambah ke 5TB.\n\n`;
    text += `🛡️ *Catatan Keamanan:* Seluruh file, email, dan foto kakak tetap 100% pribadi dan tidak dapat dilihat oleh siapa pun.\n\n`;
    text += `Jika ada kendala saat klik terima undangan, langsung kabari kami di sini ya kak. Selamat menikmati storage lega! 🚀`;
    return text;
  };

  const getActiveWAText = () => {
    if (waTemplateType === 'reminder') return generateReminderTemplate();
    if (waTemplateType === 'activation') return generateActivationTemplate();
    return generatePromoBroadcast();
  };

  const handleCopyWA = () => {
    const text = getActiveWAText();
    navigator.clipboard.writeText(text);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  // Simulator State
  const [simSelectedPackageId, setSimSelectedPackageId] = useState<string>(
    primaryPackages.find((p) => p.isPopular)?.id || primaryPackages[0]?.id || packages[0]?.id || ''
  );

  const selectedSimPkg = packages.find((p) => p.id === simSelectedPackageId) || primaryPackages[0] || packages[0];
  const simPrice = selectedSimPkg ? selectedSimPkg.price : 90000;
  const durationMultiplier = selectedSimPkg ? selectedSimPkg.durationMonths : 3;
  const simOmset5Slot = simPrice * 5;
  const avgMasterCostYearly = 70000;
  const simModalPeriod = Math.round((avgMasterCostYearly / 12) * durationMultiplier);
  const simNetProfit = simOmset5Slot - simModalPeriod;
  const simMargin = simOmset5Slot > 0 ? Math.round((simNetProfit / simOmset5Slot) * 100) : 0;
  const simRoi = simModalPeriod > 0 ? Number((simOmset5Slot / simModalPeriod).toFixed(1)) : 10;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Tag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              Price List & Katalog Paket
            </h1>
            <span className="eyebrow-pill bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 text-[10px]">
              Tersimpan di Database ({packages.length} Paket)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium max-w-2xl">
            Katalog paket dinamis yang tersimpan di database lokal & cloud. Anda dapat menambah, mengedit harga, atau mendaftarkan member dengan 1-klik.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setEditingPackage(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-blue-500" />
            <span>+ Tambah Paket Baru</span>
          </button>

          <button
            type="button"
            onClick={handleCopyWA}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            {copiedWA ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copiedWA ? 'Format WA Tersalin!' : 'Salin Format Penawaran WA'}</span>
          </button>
        </div>
      </div>

      {/* Google Policy Educational Alert Banner */}
      <div className="p-4.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-amber-500/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Strategi Kebijakan Limit 12-Bulan Google Family</span>
              <span className="eyebrow-pill bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px]">Aturan Google</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              Akun Google hanya diizinkan berpindah Family Group <strong>maksimal 1 kali dalam 12 bulan</strong>. 
              Gunakan <strong>Paket Email Pribadi (2 Bln Rp 60k / 3 Bln Rp 90k)</strong> dan alokasikan ke <strong>Pool Master 1 Tahun</strong> agar pembeli akun utama bisa terus perpanjang berkali-kali tanpa risiko akun terkunci / harus keluar-masuk family group.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] text-slate-400 font-bold block">Rekomendasi Penjualan:</span>
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
            Prioritaskan Paket Email Pribadi ⭐
          </span>
        </div>
      </div>

      {/* SECTION 1: TIER A - EMAIL PRIBADI / AKUN UTAMA */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs ring-1 ring-emerald-500/20">
              ⭐
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Tier A: Paket Email Pribadi / Akun Utama
                </h2>
                <span className="eyebrow-pill bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 text-[9px] font-black">
                  🛡️ 100% Garansi Bisa Perpanjang
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Dialokasikan ke Pool Master 1 Tahun • Garansi Anti Pindah Family Group • Bebas Limit 12 Bulan Google
              </span>
            </div>
          </div>

          <span className="eyebrow-pill bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 text-[10px]">
            {primaryPackages.length} Paket Terdaftar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {primaryPackages.map((pkg) => {
            const ratePerMonth = Math.round(pkg.price / pkg.durationMonths);

            return (
              <div 
                key={pkg.id} 
                className={`bezel-shell relative transition-all duration-200 hover:-translate-y-1 ${
                  pkg.isPopular ? 'ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10' : ''
                }`}
              >
                <div className="bezel-core p-5 flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`eyebrow-pill ring-1 text-[9px] ${pkg.badgeColor || (pkg.isPopular ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20')}`}>
                        {pkg.badge || `${pkg.durationMonths} Bulan`}
                      </span>
                      
                      {/* Edit / Delete quick controls */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPackage(pkg);
                            setIsModalOpen(true);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          title="Edit Paket"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePackage(pkg)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus Paket"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {pkg.name}
                      </h3>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                          {formatCurrency(pkg.price, 'IDR')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-medium mt-0.5">
                        Setara {formatCurrency(ratePerMonth, 'IDR')} / bulan
                      </span>
                    </div>

                    {pkg.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2.5">
                        {pkg.description}
                      </p>
                    )}

                    {/* Feature Checklist */}
                    {pkg.features && pkg.features.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {pkg.features.map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                            <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Direct Action Button */}
                  <button
                    type="button"
                    onClick={() => onSelectPackageForMember({
                      packageName: `Google One 5TB - ${pkg.name} (Akun Utama)`,
                      accountType: 'PRIMARY_EMAIL',
                      durationMonths: pkg.durationMonths,
                      billingCycle: pkg.billingCycle,
                      price: pkg.price,
                      notes: `Paket Email Utama (Tier A). Alokasikan ke Pool Master 1 Tahun.`,
                    })}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      pkg.isPopular
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Daftarkan Member</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: TIER B - AKUN SEKUNDER / CADANGAN */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs ring-1 ring-blue-500/20">
              📦
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Tier B: Paket Akun Sekunder / Bukan Email Utama (Hemat)
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">
                Khusus untuk email kedua / backup storage dokumen • Harga lebih hemat • Fleksibel alokasi pool
              </span>
            </div>
          </div>

          <span className="eyebrow-pill bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 text-[10px]">
            {secondaryPackages.length} Paket Terdaftar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {secondaryPackages.map((pkg) => {
            const ratePerMonth = Math.round(pkg.price / pkg.durationMonths);

            return (
              <div key={pkg.id} className="bezel-shell transition-all duration-200 hover:-translate-y-1">
                <div className="bezel-core p-5 flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`eyebrow-pill ring-1 text-[9px] ${pkg.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-slate-700'}`}>
                        {pkg.badge || `${pkg.durationMonths} Bulan`}
                      </span>

                      {/* Edit / Delete quick controls */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPackage(pkg);
                            setIsModalOpen(true);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          title="Edit Paket"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePackage(pkg)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus Paket"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {pkg.name}
                      </h3>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                          {formatCurrency(pkg.price, 'IDR')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-medium mt-0.5">
                        Setara {formatCurrency(ratePerMonth, 'IDR')} / bulan
                      </span>
                    </div>

                    {pkg.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2.5">
                        {pkg.description}
                      </p>
                    )}

                    {/* Feature Checklist */}
                    {pkg.features && pkg.features.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {pkg.features.map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                            <Check className="h-3 w-3 text-blue-500 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Direct Action Button */}
                  <button
                    type="button"
                    onClick={() => onSelectPackageForMember({
                      packageName: `Google One 5TB - ${pkg.name} (Akun Sekunder)`,
                      accountType: 'SECONDARY_EMAIL',
                      durationMonths: pkg.durationMonths,
                      billingCycle: pkg.billingCycle,
                      price: pkg.price,
                      notes: `Paket Akun Sekunder (Tier B). Khusus email cadangan.`,
                    })}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Daftarkan Member</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: PROFIT SIMULATOR PER POOL & WHATSAPP TEMPLATES SUITE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
        
        {/* Left (6 cols): Unit Economics Profit Simulator */}
        <div className="lg:col-span-6">
          <div className="bezel-shell h-full">
            <div className="bezel-core p-5 space-y-4 flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Calculator className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Simulator Laba Reseller per 1 Pool (5 Slot)
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Estimasi keuntungan jika 1 pool master diisi penuh
                      </p>
                    </div>
                  </div>
                </div>

                {/* Package Picker */}
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Pilih Paket untuk Simulasi:</span>
                  <select
                    value={simSelectedPackageId}
                    onChange={(e) => setSimSelectedPackageId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 text-xs"
                  >
                    {[...packages].sort((a, b) => (a.durationMonths || 0) - (b.durationMonths || 0) || (a.sortOrder || 0) - (b.sortOrder || 0)).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.accountType === 'PRIMARY_EMAIL' ? '⭐' : '📦'} {p.name} - {formatCurrency(p.price, 'IDR')} ({p.accountType === 'PRIMARY_EMAIL' ? 'Akun Utama' : 'Akun Sekunder'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Simulator Breakdown Numbers */}
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">Harga Jual per Slot</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                      {formatCurrency(simPrice, 'IDR')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">Total Omset (5 Slot)</span>
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-base">
                      +{formatCurrency(simOmset5Slot, 'IDR')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block">Modal Pool ({durationMultiplier} Bln)</span>
                    <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-base">
                      -{formatCurrency(simModalPeriod, 'IDR')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-black block">Laba Bersih per Pool</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">
                      +{formatCurrency(simNetProfit, 'IDR')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between text-xs">
                <span className="font-bold text-purple-900 dark:text-purple-300">
                  Margin Keuntungan: <strong>{simMargin}%</strong>
                </span>
                <span className="font-mono font-black text-purple-600 dark:text-purple-400">
                  ROI {simRoi}x lipat modal
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right (6 cols): Multi-Template WhatsApp Suite */}
        <div className="lg:col-span-6">
          <div className="bezel-shell h-full">
            <div className="bezel-core p-5 space-y-3 flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Template WhatsApp Penjualan & Tagihan
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Pilih template teks siap kirim ke WhatsApp pembeli
                      </p>
                    </div>
                  </div>
                </div>

                {/* Template Type Selector Tabs */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setWaTemplateType('promo')}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center truncate cursor-pointer ${
                      waTemplateType === 'promo'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    🔥 Promo Broadcast
                  </button>

                  <button
                    type="button"
                    onClick={() => setWaTemplateType('reminder')}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center truncate cursor-pointer ${
                      waTemplateType === 'reminder'
                        ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    ⏰ Tagihan Jatuh Tempo
                  </button>

                  <button
                    type="button"
                    onClick={() => setWaTemplateType('activation')}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center truncate cursor-pointer ${
                      waTemplateType === 'activation'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    🎉 Panduan Aktivasi
                  </button>
                </div>

                {/* Text Display */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed select-all">
                  {getActiveWAText()}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyWA}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {copiedWA ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>
                  {copiedWA 
                    ? 'Teks Berhasil Disalin ke Clipboard!' 
                    : waTemplateType === 'promo' 
                    ? 'Salin Format Promo Broadcast' 
                    : waTemplateType === 'reminder'
                    ? 'Salin Pesan Tagihan Jatuh Tempo'
                    : 'Salin Panduan Aktivasi Slot'}
                </span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Add / Edit Package Modal */}
      <AddEditPackageModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPackage(null);
        }}
        onSave={onSavePackage}
        initialPackage={editingPackage}
      />

    </div>
  );
};
