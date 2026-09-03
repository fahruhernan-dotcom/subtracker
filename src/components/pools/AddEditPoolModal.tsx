'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Layers, 
  Sparkles, 
  Clock, 
  Check, 
  Users, 
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';
import { AccountPool, SubscriptionCategory } from '@/types/subscription';
import { format, addMonths } from 'date-fns';
import { formatNumberIDR, parseCurrencyInput } from '@/lib/utils';
import { DatePickerField } from '@/components/ui/DatePickerField';

interface AddEditPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (poolData: Omit<AccountPool, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => void;
  initialPool?: AccountPool | null;
}

const POOL_PRESETS = [
  {
    name: 'Google One 5TB Family Sharing',
    provider: 'Google One',
    category: 'google_one' as SubscriptionCategory,
    totalCapacity: 5,
    masterCost: 135000,
    avatarColor: 'bg-blue-600',
  },
  {
    name: 'Canva Pro Team',
    provider: 'Canva Pro',
    category: 'canva_team' as SubscriptionCategory,
    totalCapacity: 50,
    masterCost: 750000,
    avatarColor: 'bg-teal-500',
  },
  {
    name: 'Google Workspace Business Standard',
    provider: 'Google Workspace',
    category: 'workspace' as SubscriptionCategory,
    totalCapacity: 20,
    masterCost: 1800000,
    avatarColor: 'bg-indigo-600',
  },
  {
    name: 'Adobe Creative Cloud All Apps Team',
    provider: 'Adobe CC',
    category: 'adobe_seat' as SubscriptionCategory,
    totalCapacity: 10,
    masterCost: 2400000,
    avatarColor: 'bg-rose-600',
  },
];

const MASTER_DURATION_PRESETS = [
  { id: '1m', label: '1 Bulan', months: 1 },
  { id: '3m', label: '3 Bulan', months: 3 },
  { id: '6m', label: '6 Bulan', months: 6 },
  { id: '1y', label: '1 Tahun', months: 12 },
  { id: '2y', label: '2 Tahun', months: 24 },
];

export const AddEditPoolModal: React.FC<AddEditPoolModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPool,
}) => {
  const [name, setName] = useState(initialPool?.name || '');
  const [provider, setProvider] = useState(initialPool?.provider || 'Google One');
  const [category, setCategory] = useState<SubscriptionCategory>(initialPool?.category || 'google_one');
  const [masterEmail, setMasterEmail] = useState(initialPool?.masterEmail || '');
  const [masterPassword, setMasterPassword] = useState(initialPool?.masterPassword || '');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [totalCapacity, setTotalCapacity] = useState(initialPool?.totalCapacity || 5);
  const [masterEndDate, setMasterEndDate] = useState(initialPool?.masterEndDate || format(addMonths(new Date(), 12), 'yyyy-MM-dd'));
  const [masterCost, setMasterCost] = useState<number | undefined>(initialPool?.masterCost);
  const [avatarColor, setAvatarColor] = useState(initialPool?.avatarColor || POOL_PRESETS[0].avatarColor);
  const [notes, setNotes] = useState(initialPool?.notes || '');

  // Escape key listener to close modal
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

  const getCleanUsername = (email: string) => {
    if (!email) return '';
    const user = email.includes('@') ? email.split('@')[0] : email;
    return user.trim();
  };

  const handleMasterEmailChange = (emailVal: string) => {
    setMasterEmail(emailVal);
    const username = getCleanUsername(emailVal);
    if (username) {
      const isGenericOrAuto = !name || 
        POOL_PRESETS.some(p => p.name === name) ||
        name.includes('Family Pool') ||
        name.includes('Family Sharing') ||
        name.startsWith('Google One') ||
        name.startsWith('Canva') ||
        name.startsWith('Google Workspace') ||
        name.includes(' - ');

      if (isGenericOrAuto) {
        if (provider === 'Google One') {
          setName(`Google One 5TB Family - ${username}`);
        } else {
          setName(`${provider} Family - ${username}`);
        }
      }
    }
  };

  const applyPreset = (preset: typeof POOL_PRESETS[0]) => {
    setProvider(preset.provider);
    setCategory(preset.category);
    setTotalCapacity(preset.totalCapacity);
    setMasterCost(preset.masterCost);
    setAvatarColor(preset.avatarColor);
    const username = getCleanUsername(masterEmail);
    if (username) {
      setName(`${preset.provider} 5TB Family - ${username}`);
    } else {
      setName(preset.name);
    }
  };

  const handleApplyEmailDomain = (domain: string) => {
    if (!masterEmail) {
      handleMasterEmailChange(domain);
      return;
    }
    const prefix = masterEmail.includes('@') ? masterEmail.split('@')[0] : masterEmail;
    handleMasterEmailChange(`${prefix}${domain}`);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(masterPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !masterEmail || !masterEndDate || totalCapacity <= 0) return;

    onSave(
      {
        name,
        provider,
        category,
        masterEmail,
        masterPassword: masterPassword.trim() || undefined,
        totalCapacity,
        masterEndDate,
        masterCost: masterCost || 0,
        avatarColor,
        notes,
      },
      initialPool?.id
    );
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bezel-shell w-full max-w-xl max-h-[90vh] scale-100 animate-in zoom-in-95 duration-200 cursor-default"
      >
        <div className="bezel-core p-6 flex flex-col justify-between max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {initialPool ? 'Edit Akun Induk / Pool' : 'Tambah Pool / Family Group Baru'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Daftarkan master account untuk memonitor kapasitas slot dan masa aktif akun induk
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs">
            {/* Quick Presets */}
            {!initialPool && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Preset Akun Induk:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POOL_PRESETS.map((p) => {
                    const isSelected = name === p.name;
                    return (
                      <button
                        type="button"
                        key={p.name}
                        onClick={() => applyPreset(p)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${p.avatarColor}`} />
                        <span>{p.provider} ({p.totalCapacity} slot)</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Master Account Info */}
            <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                <Mail className="h-4 w-4 text-blue-500" />
                <span>Identitas Akun Induk / Master Owner</span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Master Email First */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Akun Induk / Master *
                    </label>
                    <input
                      type="email"
                      required
                      value={masterEmail}
                      onChange={(e) => handleMasterEmailChange(e.target.value)}
                      placeholder="husnidrsae@gmail.com"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                    />

                    {/* Quick Domain Completion Chips */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-bold">Quick domain:</span>
                      {['@gmail.com', '@googlemail.com'].map((dom) => (
                        <button
                          type="button"
                          key={dom}
                          onClick={() => handleApplyEmailDomain(dom)}
                          className="px-2 py-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-750 hover:bg-blue-600 hover:text-white text-[10px] font-mono text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
                        >
                          {dom}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pool Name */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Pool / Nama Family Group *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Google One 5TB Family - husnidrsae"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                    />

                    {/* Smart Auto-Name Suggestion Chip */}
                    {getCleanUsername(masterEmail) && (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (provider === 'Google One') {
                              setName(`Google One 5TB Family - ${getCleanUsername(masterEmail)}`);
                            } else {
                              setName(`${provider} Family - ${getCleanUsername(masterEmail)}`);
                            }
                          }}
                          className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-500/10 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold transition-all cursor-pointer border border-blue-500/20"
                          title="Terapkan format nama pool dari email master"
                        >
                          <Sparkles className="h-3 w-3 text-amber-500" />
                          <span>Gunakan: {provider === 'Google One' ? 'Google One 5TB Family' : `${provider} Family`} - {getCleanUsername(masterEmail)}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Password Akun Induk (Opsional)
                    </label>
                    {masterPassword && (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedPassword ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedPassword ? 'Tersalin' : 'Salin Password'}</span>
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      placeholder="Password login akun Google / Master"
                      className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title={showPassword ? "Sembunyikan password" : "Lihat password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Disimpan aman di browser/database lokal untuk mempermudah saat login ke Family Group / Admin Console.
                  </span>
                </div>
              </div>
            </div>

            {/* Capacity & Master Expiry */}
            <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                <Users className="h-4 w-4 text-blue-500" />
                <span>Kapasitas Slot & Masa Aktif Akun Induk</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Kapasitas Kursi / Slot Member *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    required
                    value={totalCapacity}
                    onChange={(e) => setTotalCapacity(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-extrabold text-sm"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Google One Family max 5 member, Canva Team bisa 50+
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Biaya Modal Akun Induk (Opsional)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={masterCost ? formatNumberIDR(masterCost) : ''}
                      onChange={(e) => setMasterCost(parseCurrencyInput(e.target.value) || undefined)}
                      placeholder="135.000"
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Master Expiry DatePicker */}
              <div className="pt-1">
                <DatePickerField
                  label="Tanggal Jatuh Tempo Akun Induk"
                  required
                  variant="pool"
                  value={masterEndDate}
                  onChange={(val) => {
                    setMasterEndDate(val);
                  }}
                  quickPresets={[
                    { label: '+1 Bln', months: 1 },
                    { label: '+3 Bln', months: 3 },
                    { label: '+6 Bln', months: 6 },
                    { label: '+1 Thn', months: 12 },
                  ]}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Akun Induk / Info Recovery
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan login master, kartu pembayaran yang dipakai, atau password vault..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </form>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="group flex items-center gap-2 pl-5 pr-1.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>{initialPool ? 'Perbarui Akun Induk' : 'Simpan & Daftarkan Pool'}</span>
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
