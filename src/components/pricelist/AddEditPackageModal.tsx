'use client';

import React, { useState, useEffect } from 'react';
import { X, Tag, Check, Sparkles } from 'lucide-react';
import { PricingPackage } from '@/types/subscription';
import { formatNumberIDR, parseCurrencyInput } from '@/lib/utils';

interface AddEditPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pkg: Partial<PricingPackage>) => void;
  initialPackage: PricingPackage | null;
}

export const AddEditPackageModal: React.FC<AddEditPackageModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPackage,
}) => {
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<'PRIMARY_EMAIL' | 'SECONDARY_EMAIL'>('PRIMARY_EMAIL');
  const [durationMonths, setDurationMonths] = useState(3);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'semi_annual' | 'yearly'>('quarterly');
  const [price, setPrice] = useState(90000);
  const [badge, setBadge] = useState('');
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [isPopular, setIsPopular] = useState(false);

  useEffect(() => {
    if (initialPackage) {
      setName(initialPackage.name || '');
      setAccountType(initialPackage.accountType || 'PRIMARY_EMAIL');
      setDurationMonths(initialPackage.durationMonths || 3);
      setBillingCycle(initialPackage.billingCycle || 'quarterly');
      setPrice(initialPackage.price || 0);
      setBadge(initialPackage.badge || '');
      setDescription(initialPackage.description || '');
      setFeaturesText((initialPackage.features || []).join('\n'));
      setIsPopular(Boolean(initialPackage.isPopular));
    } else {
      setName('');
      setAccountType('PRIMARY_EMAIL');
      setDurationMonths(3);
      setBillingCycle('quarterly');
      setPrice(90000);
      setBadge('');
      setDescription('');
      setFeaturesText('Alokasi Pool Master 1 Tahun\nGaransi Anti Pindah Family Group\nBebas limit 12 bulan Google');
      setIsPopular(false);
    }
  }, [initialPackage, isOpen]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const features = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    onSave({
      id: initialPackage ? initialPackage.id : undefined,
      name,
      accountType,
      durationMonths: Number(durationMonths) || 1,
      billingCycle,
      price: Number(price) || 0,
      badge: badge.trim() || undefined,
      description: description.trim() || undefined,
      features,
      isPopular,
      isActive: true,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bezel-shell w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
      >
        <div className="bezel-core p-6 space-y-5 max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center ring-1 ring-blue-500/20">
                <Tag className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {initialPackage ? 'Edit Paket Langganan' : 'Tambah Paket Baru ke Database'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Data paket akan langsung tersimpan di database lokal & cloud.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Nama Paket */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Paket *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: 3 Bulan (Quarterly)"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>

            {/* Tipe Akun & Durasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tipe Akun Pembeli *
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value="PRIMARY_EMAIL">⭐ Email Pribadi / Utama</option>
                  <option value="SECONDARY_EMAIL">📦 Akun Sekunder / Cadangan</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Durasi Masa Aktif (Bulan) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  required
                  value={durationMonths}
                  onChange={(e) => {
                    const m = parseInt(e.target.value) || 1;
                    setDurationMonths(m);
                    if (m === 1) setBillingCycle('monthly');
                    else if (m === 3) setBillingCycle('quarterly');
                    else if (m === 6) setBillingCycle('semi_annual');
                    else if (m === 12) setBillingCycle('yearly');
                    else setBillingCycle('monthly');
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold"
                />
              </div>
            </div>

            {/* Harga & Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Harga Jual Paket (IDR) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    value={formatNumberIDR(price)}
                    onChange={(e) => setPrice(parseCurrencyInput(e.target.value))}
                    placeholder="90.000"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono font-black"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Badge Label (Opsional)
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="Contoh: ⭐ Paling Laris"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Keterangan Singkat Paket
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Penjelasan keunggulan paket..."
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Fitur / Keunggulan (1 per baris) */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fitur & Poin Keunggulan (1 baris per poin)
              </label>
              <textarea
                rows={3}
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                placeholder="Alokasi Pool Master 1 Tahun&#10;Garansi Anti Pindah Family Group&#10;Bebas limit Google 12 bulan"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs"
              />
            </div>

            {/* Is Popular Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Tandai sebagai Paket Rekomendasi / Best Seller (Highlight Hijau)
              </span>
            </label>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/25 cursor-pointer"
              >
                {initialPackage ? 'Simpan Perubahan' : 'Tambah Paket ke Database'}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
};
