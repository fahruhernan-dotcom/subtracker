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
  Send,
  Eye,
  EyeOff
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
  const [showModalCost, setShowModalCost] = useState<boolean>(false);

  // Filter packages by account tier and sort strictly by duration in ascending order
  const primaryPackages = packages
    .filter((p) => p.accountType === 'PRIMARY_EMAIL' && p.isActive !== false)
    .sort((a, b) => (a.durationMonths || 0) - (b.durationMonths || 0) || (a.sortOrder || 0) - (b.sortOrder || 0));

  const secondaryPackages = packages
    .filter((p) => p.accountType === 'SECONDARY_EMAIL' && p.isActive !== false)
    .sort((a, b) => (a.durationMonths || 0) - (b.durationMonths || 0) || (a.sortOrder || 0) - (b.sortOrder || 0));

  // 1. Template Broadcast Penawaran / Price List Lengkap
  const generatePromoBroadcast = () => {
    let text = `🚀 *UPGRADE RESMI GOOGLE AI PRO 5TB* 🚀\n`;
    text += `Dapatkan ekosistem kecerdasan buatan tercanggih dan ruang penyimpanan raksasa 5TB langsung di akun Google Anda.\n\n`;

    text += `✨ *Keuntungan Utama Paket Google AI Pro 5TB:*\n`;
    text += `• Ruang Penyimpanan 5 TB untuk Google Drive, Photos, & Gmail\n`;
    text += `• 1.000 Kredit/Bulan Google Flow (AI Cinematic & Video Creation)\n`;
    text += `• Gemini 3 Pro Deep Search & Integrasi di Gmail/Docs/Sheets\n`;
    text += `• YouTube Premium Lite (Bebas Iklan & Putar di Background)\n`;
    text += `• NotebookLM Enhanced (Kuota 5x Lebih Banyak)\n`;
    text += `• Akses Prioritas Google AI Studio & Antigravity\n\n`;

    text += `⭐ *PILIHAN PAKET LANGGANAN:* ⭐\n\n`;

    text += `🛡️ *PAKET AKUN UTAMA (100% GARANSI PERPANJANG)*\n`;
    text += `_(Wajib untuk Email Pribadi/Utama — Tetap di grup master yang sama tanpa ganti akun, bebas limit 12 bulan Google)_\n`;
    primaryPackages.forEach((pkg) => {
      const ratePerMonth = Math.round(pkg.price / (pkg.durationMonths || 1));
      const isPopularBadge = pkg.isPopular ? ' 🔥 _(Paling Laris)_' : '';
      const yearBadge = pkg.durationMonths === 12 ? ' _(Paling Hemat!)_' : '';
      text += `• ${pkg.durationMonths} Bulan : *${formatCurrency(pkg.price, 'IDR')}* _(${formatCurrency(ratePerMonth, 'IDR')}/bln)_${isPopularBadge}${yearBadge}\n`;
    });

    if (secondaryPackages.length > 0) {
      text += `\n📦 *PAKET AKUN SEKUNDER / 2ND (AKUN LEPAS)*\n`;
      text += `_(Khusus Email Cadangan / Backup Dokumen — Durasi hemat ≤ 4 bulan)_\n`;
      secondaryPackages.forEach((pkg) => {
        const ratePerMonth = Math.round(pkg.price / (pkg.durationMonths || 1));
        text += `• ${pkg.durationMonths} Bulan : *${formatCurrency(pkg.price, 'IDR')}* _(${formatCurrency(ratePerMonth, 'IDR')}/bln)_\n`;
      });
      text += `⚠️ _Catatan: Untuk Email Pribadi / Utama wajib mengambil paket minimal 6 bulan agar garansi perpanjangan aktif tanpa ganti akun._\n`;
    }

    text += `\n🛡️ *Jaminan Layanan:*\n`;
    text += `✅ 100% Resmi & Legal (Tanpa minta password akun Anda)\n`;
    text += `✅ Data & Foto Anda 100% Pribadi & Aman\n`;
    text += `✅ Garansi Penuh selama masa langganan aktif\n`;
    text += `✅ Proses cepat aktif dalam beberapa menit\n\n`;

    text += `📲 *Format Pemesanan Cepat:*\n`;
    text += `Nama :\n`;
    text += `Email Google :\n`;
    text += `Paket : (Contoh: 6 Bulan Akun Utama / 3 Bulan Akun 2nd)\n\n`;
    text += `Silakan balas pesan ini untuk langsung kami kirimkan undangan aktivasi ya! 🙏`;

    return text;
  };

  // 2. Template Reminder Jatuh Tempo & Tagihan Perpanjangan
  const generateReminderTemplate = () => {
    let text = `Halo Kak! 👋\n\n`;
    text += `Mengingatkan bahwa masa aktif langganan *Google AI Pro 5TB* Anda akan segera berakhir dalam beberapa hari ke depan.\n\n`;
    text += `Agar akses penyimpanan cloud dan fitur AI tetap aktif tanpa gangguan, silakan lakukan perpanjangan:\n\n`;

    text += `🛡️ *Pilihan Perpanjangan Akun Utama (Garansi Anti Ganti Akun):*\n`;
    primaryPackages.forEach((pkg) => {
      const ratePerMonth = Math.round(pkg.price / (pkg.durationMonths || 1));
      const yearBadge = pkg.durationMonths === 12 ? ' ⭐ _(Paling Hemat)_' : '';
      text += `• ${pkg.durationMonths} Bulan : *${formatCurrency(pkg.price, 'IDR')}* _(${formatCurrency(ratePerMonth, 'IDR')}/bln)_${yearBadge}\n`;
    });

    if (secondaryPackages.length > 0) {
      text += `\n📦 *Pilihan Paket Akun Cadangan (2nd / Lepas):*\n`;
      secondaryPackages.forEach((pkg) => {
        const ratePerMonth = Math.round(pkg.price / (pkg.durationMonths || 1));
        text += `• ${pkg.durationMonths} Bulan : *${formatCurrency(pkg.price, 'IDR')}* _(${formatCurrency(ratePerMonth, 'IDR')}/bln)_\n`;
      });
    }

    text += `\n💳 *Metode Pembayaran:* BCA, Mandiri, BRI, DANA, atau QRIS\n\n`;
    text += `Silakan balas pesan ini untuk konfirmasi perpanjangan ya. Terima kasih!`;
    return text;
  };

  // 3. Template Konfirmasi Aktivasi Slot Berhasil (Tinggal Accept)
  const generateActivationTemplate = () => {
    let text = `Halo Kak! 🎉\n\n`;
    text += `Aktivasi langganan *Google AI Pro 5TB* untuk akun Anda sudah berhasil kami proses.\n\n`;
    text += `📌 *Silakan Terima (Accept) Undangan:* \n`;
    text += `1. Buka email masuk dari Google di Gmail (atau buka link: https://families.google.com/)\n`;
    text += `2. Klik tombol *'Terima Undangan'* (Accept).\n`;
    text += `3. Selesai! Kuota 5TB dan seluruh benefit AI otomatis langsung aktif di akun Anda.\n\n`;
    text += `🛡️ *Privasi Terjamin:* Seluruh file, foto, dan email Anda 100% pribadi dan tidak dapat diakses oleh siapa pun.\n\n`;
    text += `Kabari kami jika sudah di-accept ya. Terima kasih!`;
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
              Paket <strong>Durasi &gt; 5 Bulan (6 Bln &amp; 12 Bln)</strong> dijual sebagai <strong>Paket Akun Utama (100% Garansi Perpanjang)</strong> yang dialokasikan ke Pool Master 1 Tahun. Sedangkan paket <strong>Durasi &le; 4 Bulan (2 Bln, 3 Bln, 4 Bln)</strong> difokuskan sebagai <strong>Akun Lepas (Khusus Email 2nd)</strong> untuk backup dokumen agar email utama pelanggan terhindar dari limit ganti grup Google.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] text-slate-400 font-bold block">Rekomendasi Akun Utama:</span>
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
            Paket 6 Bulan &amp; 1 Tahun ⭐
          </span>
        </div>
      </div>

      {/* SECTION 1: TIER A - AKUN UTAMA (DURASI > 5 BULAN) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs ring-1 ring-emerald-500/20">
              ⭐
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Tier A: Paket Akun Utama (Durasi &gt; 5 Bulan — 100% Garansi Perpanjang)
                </h2>
                <span className="eyebrow-pill bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 text-[9px] font-black">
                  🛡️ 100% Garansi Perpanjang
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Dialokasikan ke Pool Master 1 Tahun • Garansi Anti Pindah Akun/Grup • Bebas Limit 12 Bulan Google
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
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] ring-1 ring-emerald-500/20">
                          {formatCurrency(ratePerMonth, 'IDR')} / bln
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({pkg.durationMonths} Bulan)
                        </span>
                      </div>
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
                      notes: `Paket Akun Utama (>5 Bulan - 100% Garansi Perpanjang). Alokasikan ke Pool Master 1 Tahun.`,
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

      {/* SECTION 2: TIER B - AKUN SEKUNDER / 2ND (DURASI <= 4 BULAN) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs ring-1 ring-blue-500/20">
              📦
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Tier B: Paket Akun Sekunder / 2nd (Durasi &le; 4 Bulan — Akun Lepas &amp; Backup)
                </h2>
                <span className="eyebrow-pill bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 text-[9px] font-black">
                  📦 Akun Lepas (2nd)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Khusus untuk email cadangan / backup storage dokumen • Sistem lepas tanpa garansi perpanjang di grup yang sama
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
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold text-[11px] ring-1 ring-blue-500/20">
                          {formatCurrency(ratePerMonth, 'IDR')} / bln
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({pkg.durationMonths} Bulan)
                        </span>
                      </div>
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
                      packageName: `Google One 5TB - ${pkg.name} (Akun Lepas 2nd)`,
                      accountType: 'SECONDARY_EMAIL',
                      durationMonths: pkg.durationMonths,
                      billingCycle: pkg.billingCycle,
                      price: pkg.price,
                      notes: `Paket Akun Lepas (≤4 Bulan - Khusus Email 2nd). Tidak dijamin perpanjang di grup yang sama.`,
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
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block">Modal Pool ({durationMultiplier} Bln)</span>
                      <button
                        type="button"
                        onClick={() => setShowModalCost(!showModalCost)}
                        className="p-0.5 rounded text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 transition-colors cursor-pointer"
                        title={showModalCost ? "Sembunyikan modal pool" : "Lihat modal pool"}
                      >
                        {showModalCost ? <EyeOff className="h-3 w-3 text-rose-500" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </div>
                    <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-base">
                      {showModalCost ? `-${formatCurrency(simModalPeriod, 'IDR')}` : '-Rp ••••••'}
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
