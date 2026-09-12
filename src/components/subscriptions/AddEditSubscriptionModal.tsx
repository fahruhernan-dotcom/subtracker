'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  Calendar, 
  CreditCard, 
  User, 
  Clock, 
  RotateCcw, 
  Save, 
  Building,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Users,
  Search,
  Phone,
  Mail,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { 
  Subscription, 
  AccountPool,
  SubscriptionCategory, 
  BillingCycle, 
  CurrencyCode, 
  ActionChecklistItem 
} from '@/types/subscription';
import { PRESET_SERVICES, PresetService, buildDefaultChecklist } from '@/lib/presets';
import { formatDate, formatDateIndo, formatCurrency, formatNumberIDR, parseCurrencyInput, getMonthlyEquivalent, getBillingCycleMonths, getWarrantyInfo, getPoolTierInfo } from '@/lib/utils';
import { format, addMonths, parseISO, isValid } from 'date-fns';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { db } from '@/lib/db/dexie-db';

interface AddEditSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subscriptionData: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => Promise<void> | void;
  initialSubscription?: Subscription | null;
  pools?: AccountPool[];
  onOpenAddPoolModal?: () => void;
  preselectedPool?: AccountPool | null;
  existingSubscriptions?: Subscription[];
}

const DURATION_PACKAGES = [
  { id: '1m', label: '1 Bulan', months: 1, defaultPrice: 35000, cycle: 'monthly' as BillingCycle },
  { id: '2m', label: '2 Bulan', months: 2, defaultPrice: 60000, cycle: 'monthly' as BillingCycle },
  { id: '3m', label: '3 Bulan', months: 3, defaultPrice: 90000, cycle: 'quarterly' as BillingCycle },
  { id: '6m', label: '6 Bulan', months: 6, defaultPrice: 170000, cycle: 'semi_annual' as BillingCycle },
  { id: '12m', label: '1 Tahun', months: 12, defaultPrice: 300000, cycle: 'yearly' as BillingCycle },
];

const DRAFT_STORAGE_KEY = 'subtracker_member_form_draft';

function getInitialFormData(
  initialSubscription?: Subscription | null,
  preselectedPool?: AccountPool | null
) {
  if (initialSubscription) {
    return {
      name: initialSubscription.name,
      provider: initialSubscription.provider,
      category: initialSubscription.category,
      memberName: initialSubscription.memberName || '',
      accountEmail: initialSubscription.accountEmail,
      clientPhone: initialSubscription.clientPhone || '',
      poolId: initialSubscription.poolId,
      poolName: initialSubscription.poolName || '',
      slotNumber: initialSubscription.slotNumber,
      startDate: initialSubscription.startDate,
      endDate: initialSubscription.endDate,
      price: initialSubscription.price,
      currency: initialSubscription.currency,
      billingCycle: initialSubscription.billingCycle,
      autoRenews: initialSubscription.autoRenews,
      avatarColor: initialSubscription.avatarColor || 'bg-blue-600',
      notes: initialSubscription.notes || '',
      checklist: initialSubscription.checklist,
      reminderOffsets: initialSubscription.reminderOffsets || [-7, -3, -1, 0, 1],
      activeDurationPackage: '',
      selectedPreset: '',
      hasRestoredDraft: false,
    };
  }

  if (preselectedPool) {
    const pTier = getPoolTierInfo(preselectedPool);
    const isGuaranteed = pTier.tier === 'LONG_TERM_GUARANTEED';
    const defaultMonths = isGuaranteed ? 6 : 3;
    const defaultDurationKey = isGuaranteed ? '6m' : '3m';
    const defaultPrice = isGuaranteed ? 170000 : 90000;
    const defaultCycle: BillingCycle = isGuaranteed ? 'semi_annual' : 'quarterly';
    const defaultEndDate = format(addMonths(new Date(), defaultMonths), 'yyyy-MM-dd');

    return {
      name: `${preselectedPool.name} - Slot`,
      provider: preselectedPool.provider,
      category: preselectedPool.category,
      memberName: '',
      accountEmail: '',
      clientPhone: '',
      poolId: preselectedPool.id,
      poolName: preselectedPool.name,
      slotNumber: undefined,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: defaultEndDate,
      price: defaultPrice,
      currency: 'IDR' as CurrencyCode,
      billingCycle: defaultCycle,
      autoRenews: false,
      avatarColor: preselectedPool.avatarColor || 'bg-blue-600',
      notes: '',
      checklist: buildDefaultChecklist(preselectedPool.name),
      reminderOffsets: [-7, -3, -1, 0, 1],
      activeDurationPackage: defaultDurationKey,
      selectedPreset: '',
      hasRestoredDraft: false,
    };
  }

  // Check localStorage draft if in browser
  if (typeof window !== 'undefined') {
    const savedDraftJson = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraftJson) {
      try {
        const draft = JSON.parse(savedDraftJson);
        return {
          name: draft.name || PRESET_SERVICES[0].name,
          provider: draft.provider || PRESET_SERVICES[0].provider,
          category: draft.category || PRESET_SERVICES[0].category,
          memberName: draft.memberName || '',
          accountEmail: draft.accountEmail || '',
          clientPhone: draft.clientPhone || '',
          poolId: draft.poolId,
          poolName: draft.poolName || '',
          slotNumber: draft.slotNumber,
          startDate: draft.startDate || format(new Date(), 'yyyy-MM-dd'),
          endDate: draft.endDate || format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
          price: typeof draft.price === 'number' ? draft.price : 35000,
          currency: (draft.currency || 'IDR') as CurrencyCode,
          billingCycle: (draft.billingCycle || 'monthly') as BillingCycle,
          autoRenews: !!draft.autoRenews,
          avatarColor: draft.avatarColor || 'bg-blue-600',
          notes: draft.notes || '',
          checklist: draft.checklist || buildDefaultChecklist(PRESET_SERVICES[0].name),
          reminderOffsets: draft.reminderOffsets || [-7, -3, -1, 0, 1],
          activeDurationPackage: draft.activeDurationPackage || '1m',
          selectedPreset: draft.selectedPreset || PRESET_SERVICES[0].name,
          hasRestoredDraft: Boolean(draft.memberName || draft.accountEmail || draft.clientPhone),
        };
      } catch {}
    }
  }

  // Default preset
  return {
    name: PRESET_SERVICES[0].name,
    provider: PRESET_SERVICES[0].provider,
    category: PRESET_SERVICES[0].category,
    memberName: '',
    accountEmail: '',
    clientPhone: '',
    poolId: undefined as string | undefined,
    poolName: PRESET_SERVICES[0].defaultPoolPrefix,
    slotNumber: undefined as number | undefined,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    price: PRESET_SERVICES[0].defaultPrice,
    currency: PRESET_SERVICES[0].defaultCurrency,
    billingCycle: PRESET_SERVICES[0].defaultBillingCycle,
    autoRenews: false,
    avatarColor: PRESET_SERVICES[0].brandColor,
    notes: '',
    checklist: buildDefaultChecklist(PRESET_SERVICES[0].name),
    reminderOffsets: PRESET_SERVICES[0].defaultReminderOffsets,
    activeDurationPackage: '1m',
    selectedPreset: PRESET_SERVICES[0].name,
    hasRestoredDraft: false,
  };
}

export const AddEditSubscriptionModal: React.FC<AddEditSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSubscription,
  pools = [],
  onOpenAddPoolModal,
  preselectedPool,
  existingSubscriptions = [],
}) => {
  const initial = getInitialFormData(initialSubscription, preselectedPool);

  const [selectedPreset, setSelectedPreset] = useState<string>(initial.selectedPreset);
  const [name, setName] = useState(initial.name);
  const [provider, setProvider] = useState(initial.provider);
  const [category, setCategory] = useState<SubscriptionCategory>(initial.category);
  const [memberName, setMemberName] = useState(initial.memberName);
  const [accountEmail, setAccountEmail] = useState(initial.accountEmail);
  const [clientPhone, setClientPhone] = useState(initial.clientPhone);
  const [poolId, setPoolId] = useState<string | undefined>(initial.poolId);
  const [poolName, setPoolName] = useState(initial.poolName);
  const [slotNumber] = useState<number | undefined>(initial.slotNumber);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [activeDurationPackage, setActiveDurationPackage] = useState<string>(initial.activeDurationPackage);
  const [price, setPrice] = useState<number>(initial.price);
  const [currency] = useState<CurrencyCode>(initial.currency);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initial.billingCycle);
  const [autoRenews] = useState(initial.autoRenews);
  const [avatarColor, setAvatarColor] = useState(initial.avatarColor);
  const [notes, setNotes] = useState(initial.notes);
  const [checklist, setChecklist] = useState<ActionChecklistItem[]>(initial.checklist);
  const [reminderOffsets] = useState<number[]>(initial.reminderOffsets);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [hasRestoredDraft, setHasRestoredDraft] = useState(initial.hasRestoredDraft);
  const [showPoolPassword, setShowPoolPassword] = useState(false);
  const [copiedPoolPassword, setCopiedPoolPassword] = useState(false);

  // States for picking from existing members
  const [internalSubscriptions, setInternalSubscriptions] = useState<Subscription[]>([]);
  const [isSelectExistingOpen, setIsSelectExistingOpen] = useState(false);
  const [existingSearchQuery, setExistingSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedFromExisting, setSelectedFromExisting] = useState<string | null>(null);
  const [missingPhoneNotice, setMissingPhoneNotice] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Form Submission Lock Guard
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fallback: fetch from Dexie DB if existingSubscriptions prop is empty
  useEffect(() => {
    if (isOpen && (!existingSubscriptions || existingSubscriptions.length === 0)) {
      db.subscriptions.toArray().then(subs => {
        if (subs && subs.length > 0) {
          setInternalSubscriptions(subs);
        }
      }).catch(err => {
        console.error('Failed to load subscriptions for member autocomplete', err);
      });
    }
  }, [isOpen, existingSubscriptions]);

  interface ExistingClientOption {
    memberName: string;
    clientPhone: string;
    accountEmail: string;
    poolName?: string;
    avatarColor?: string;
    status?: string;
    count: number;
  }

  // Deduplicate and group existing members
  const uniqueMembers: ExistingClientOption[] = useMemo(() => {
    const map = new Map<string, ExistingClientOption>();
    const allSubs = (existingSubscriptions && existingSubscriptions.length > 0)
      ? existingSubscriptions
      : internalSubscriptions;

    allSubs.forEach(sub => {
      const rawName = sub.memberName?.trim();
      if (!rawName) return;
      const key = rawName.toLowerCase();
      
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          memberName: rawName,
          clientPhone: sub.clientPhone?.trim() || '',
          accountEmail: sub.accountEmail?.trim() || '',
          poolName: sub.poolName || '',
          avatarColor: sub.avatarColor || 'bg-blue-600',
          status: sub.status,
          count: 1,
        });
      } else {
        existing.count += 1;
        if (!existing.clientPhone && sub.clientPhone?.trim()) {
          existing.clientPhone = sub.clientPhone.trim();
        }
        if (!existing.accountEmail && sub.accountEmail?.trim()) {
          existing.accountEmail = sub.accountEmail.trim();
        }
        if (sub.status !== 'TERMINATED' && existing.status === 'TERMINATED') {
          existing.status = sub.status;
          existing.poolName = sub.poolName;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.memberName.localeCompare(b.memberName));
  }, [existingSubscriptions, internalSubscriptions]);

  const handleMemberNameChange = (val: string) => {
    setMemberName(val);
    const pool = pools.find(p => p.id === poolId) || preselectedPool;
    if (pool && (!name || name.startsWith(pool.name) || name === PRESET_SERVICES[0].name || name.includes('Slot'))) {
      setName(val ? `${pool.name} - ${val}` : `${pool.name} - Slot Member`);
    }
  };

  // Handle selecting an existing member from either autocomplete or modal
  const handleSelectExistingMember = (client: ExistingClientOption) => {
    handleMemberNameChange(client.memberName);
    if (client.clientPhone && client.clientPhone.trim()) {
      setClientPhone(client.clientPhone.trim());
      setMissingPhoneNotice(false);
    } else {
      setClientPhone('');
      setMissingPhoneNotice(true);
      setTimeout(() => {
        phoneInputRef.current?.focus();
      }, 150);
    }
    if (client.accountEmail) {
      setAccountEmail(client.accountEmail);
    }
    if (client.avatarColor) {
      setAvatarColor(client.avatarColor);
    }
    setSelectedFromExisting(client.memberName);
    setIsSelectExistingOpen(false);
    setIsSearchFocused(false);
  };

  // Inline autocomplete suggestions when typing in memberName field
  const inlineSuggestions = useMemo(() => {
    if (!memberName || memberName.trim().length < 1 || selectedFromExisting) return [];
    const q = memberName.trim().toLowerCase();
    return uniqueMembers.filter(m => 
      m.memberName.toLowerCase().includes(q) ||
      (m.clientPhone && m.clientPhone.includes(q)) ||
      (m.accountEmail && m.accountEmail.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [memberName, uniqueMembers, selectedFromExisting]);

  // Filtered members for the dedicated picker modal
  const modalFilteredMembers = useMemo(() => {
    if (!existingSearchQuery.trim()) return uniqueMembers;
    const q = existingSearchQuery.trim().toLowerCase();
    return uniqueMembers.filter(m => 
      m.memberName.toLowerCase().includes(q) ||
      (m.clientPhone && m.clientPhone.includes(q)) ||
      (m.accountEmail && m.accountEmail.toLowerCase().includes(q)) ||
      (m.poolName && m.poolName.toLowerCase().includes(q))
    );
  }, [uniqueMembers, existingSearchQuery]);

  const currentPool = pools.find(p => p.id === poolId) || preselectedPool;

  const currentDurationKey = activeDurationPackage && activeDurationPackage !== 'pool_end'
    ? activeDurationPackage
    : billingCycle;
  const warrantyInfo = getWarrantyInfo(currentDurationKey);

  // Auto-Save Draft to localStorage on each change (only in add mode)
  useEffect(() => {
    if (!isOpen || initialSubscription) return;

    const draftData = {
      name,
      provider,
      category,
      memberName,
      accountEmail,
      clientPhone,
      poolId,
      poolName,
      slotNumber,
      startDate,
      endDate,
      price,
      currency,
      billingCycle,
      autoRenews,
      avatarColor,
      notes,
      checklist,
      reminderOffsets,
      activeDurationPackage,
      selectedPreset,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
  }, [
    isOpen,
    initialSubscription,
    name,
    provider,
    category,
    memberName,
    accountEmail,
    clientPhone,
    poolId,
    poolName,
    slotNumber,
    startDate,
    endDate,
    price,
    currency,
    billingCycle,
    autoRenews,
    avatarColor,
    notes,
    checklist,
    reminderOffsets,
    activeDurationPackage,
    selectedPreset,
  ]);

  const applyPreset = (preset: PresetService) => {
    setSelectedPreset(preset.name);
    setName(preset.name);
    setProvider(preset.provider);
    setCategory(preset.category);
    setPrice(preset.defaultPrice);
    setBillingCycle(preset.defaultBillingCycle);
    setAvatarColor(preset.brandColor);
    setPoolName(preset.defaultPoolPrefix);
    setPoolId(undefined);
    setChecklist(buildDefaultChecklist(preset.name));
    setMemberName('');
    setAccountEmail('');
    setClientPhone('');
    
    const start = new Date();
    const end = addMonths(start, 1);
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
    setActiveDurationPackage('1m');
  };

  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    applyPreset(PRESET_SERVICES[0]);
    setHasRestoredDraft(false);
  };

  const handleSelectPool = (selectedPoolId: string) => {
    if (!selectedPoolId) {
      setPoolId(undefined);
      setPoolName('');
      return;
    }
    const matched = pools.find(p => p.id === selectedPoolId);
    if (matched) {
      setPoolId(matched.id);
      setPoolName(matched.name);
      setProvider(matched.provider);
      setCategory(matched.category);
      // Smart Auto-Name from Pool & Member Name
      if (memberName) {
        setName(`${matched.name} - ${memberName}`);
      } else if (!name || name === PRESET_SERVICES[0].name || name.includes('Slot')) {
        setName(`${matched.name} - Slot Member`);
      }
      setAvatarColor(matched.avatarColor || 'bg-blue-600');
      if (activeDurationPackage === 'pool_end' && matched.masterEndDate) {
        setEndDate(matched.masterEndDate);
      }
    }
  };

  const handleApplyEmailDomain = (domain: string) => {
    if (!accountEmail) {
      setAccountEmail(domain);
      return;
    }
    const prefix = accountEmail.includes('@') ? accountEmail.split('@')[0] : accountEmail;
    setAccountEmail(`${prefix}${domain}`);
  };

  const handleSelectDurationPackage = (pkg: typeof DURATION_PACKAGES[0]) => {
    setActiveDurationPackage(pkg.id);
    try {
      const parsedStart = parseISO(startDate);
      if (isValid(parsedStart)) {
        const calculatedEnd = addMonths(parsedStart, pkg.months);
        setEndDate(format(calculatedEnd, 'yyyy-MM-dd'));
        setBillingCycle(pkg.cycle);
        // Otomatis sinkronkan harga sesuai tier paket jika harga masih berupa default standar
        if (!price || [35000, 60000, 90000, 120000, 170000, 300000].includes(price)) {
          setPrice(pkg.defaultPrice);
        }
      }
    } catch (e) {
      console.error("Failed to calculate end date from duration package", e);
    }
  };

  const handleSelectPoolEnd = () => {
    if (currentPool && currentPool.masterEndDate) {
      setActiveDurationPackage('pool_end');
      setEndDate(currentPool.masterEndDate);
      setBillingCycle('custom');
    } else if (pools.length > 0) {
      // Pick first pool
      handleSelectPool(pools[0].id);
      if (pools[0].masterEndDate) {
        setEndDate(pools[0].masterEndDate);
      }
      setActiveDurationPackage('pool_end');
      setBillingCycle('custom');
    }
  };

  const handleStartDateChange = (newStartDateStr: string) => {
    setStartDate(newStartDateStr);
    if (activeDurationPackage && activeDurationPackage !== 'pool_end') {
      const matchedPkg = DURATION_PACKAGES.find(p => p.id === activeDurationPackage);
      if (matchedPkg) {
        try {
          const parsedStart = parseISO(newStartDateStr);
          if (isValid(parsedStart)) {
            const calculatedEnd = addMonths(parsedStart, matchedPkg.months);
            setEndDate(format(calculatedEnd, 'yyyy-MM-dd'));
          }
        } catch {}
      }
    }
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: ActionChecklistItem = {
      id: `item-${Date.now()}`,
      title: newChecklistText.trim(),
      completed: false,
      required: true,
    };
    setChecklist(prev => [...prev, newItem]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // 🔒 Guard: prevent duplicate submissions while in-flight
    if (!name || !endDate || !accountEmail || !memberName) return;

    setIsSubmitting(true);
    try {
      await onSave(
        {
          name,
          provider: provider || name,
          category,
          accountEmail,
          memberName,
          clientPhone,
          poolId,
          poolName,
          slotNumber,
          startDate,
          endDate,
          price,
          currency,
          billingCycle,
          autoRenews,
          status: 'ACTIVE',
          checklist,
          reminderOffsets,
          notes,
          tags: [provider, poolName].filter(Boolean) as string[],
          avatarColor,
        },
        initialSubscription?.id
      );

      if (!initialSubscription) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    } catch (err) {
      console.error('Failed to save subscription:', err);
      setIsSubmitting(false);
    }
  };

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

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bezel-shell w-full max-w-2xl max-h-[90vh] scale-100 animate-in zoom-in-95 duration-200 cursor-default"
      >
        <div className="bezel-core p-6 flex flex-col justify-between max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {initialSubscription ? 'Edit Data Member / Slot' : 'Tambah Member & Alokasi Slot Baru'}
                  </h3>
                  {!initialSubscription && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full ring-1 ring-emerald-500/20">
                      <Save className="h-3 w-3" /> Auto-Saved
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Daftarkan member ke shared pool dengan proteksi pengingat kick manual
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!initialSubscription && (hasRestoredDraft || memberName || accountEmail) && (
                <button
                  type="button"
                  onClick={handleClearDraft}
                  title="Reset isian draft form"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" /> Reset Draft
                </button>
              )}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs">
            {/* Template Presets */}
            {!initialSubscription && !preselectedPool && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Template Layanan Cepat:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_SERVICES.map((p) => {
                    const isSelected = selectedPreset === p.name;
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
                        <span className={`h-2 w-2 rounded-full ${p.brandColor}`} />
                        <span>{p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Member Details */}
            <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  <User className="h-4 w-4 text-blue-500" />
                  <span>Informasi Member / Pelanggan</span>
                </div>

                {uniqueMembers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSelectExistingOpen(true);
                      setExistingSearchQuery('');
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Pilih Member Terdaftar ({uniqueMembers.length})</span>
                  </button>
                )}
              </div>

              {/* Status Banner when auto-filled from existing client */}
              {selectedFromExisting && (
                <div className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl border animate-in fade-in slide-in-from-top-1 duration-200 ${
                  clientPhone 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${clientPhone ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <span className="truncate">
                      Data otomatis terisi: <strong>{selectedFromExisting}</strong>
                      {clientPhone ? ` • 📱 ${clientPhone}` : ' (⚠️ Belum ada nomor WhatsApp)'}
                      {accountEmail ? ` • ✉️ ${accountEmail}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFromExisting(null);
                      setMemberName('');
                      setClientPhone('');
                      setAccountEmail('');
                      setMissingPhoneNotice(false);
                    }}
                    className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 underline ml-2 shrink-0 cursor-pointer"
                  >
                    Reset Form
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Nama Member / Klien *
                    </label>
                    {uniqueMembers.length > 0 && (
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        Bisa ketik baru / pilih lama
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      list="existing-members-datalist"
                      value={memberName}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleMemberNameChange(val);

                        // Instant auto-match when picking from native datalist or typing exact name
                        const matched = uniqueMembers.find(
                          m => m.memberName.trim().toLowerCase() === val.trim().toLowerCase()
                        );
                        if (matched) {
                          if (matched.clientPhone && matched.clientPhone.trim()) {
                            setClientPhone(matched.clientPhone.trim());
                            setMissingPhoneNotice(false);
                          } else {
                            setClientPhone('');
                            setMissingPhoneNotice(true);
                            setTimeout(() => {
                              phoneInputRef.current?.focus();
                            }, 150);
                          }
                          if (matched.accountEmail) {
                            setAccountEmail(matched.accountEmail);
                          }
                          if (matched.avatarColor) {
                            setAvatarColor(matched.avatarColor);
                          }
                          setSelectedFromExisting(matched.memberName);
                        } else if (selectedFromExisting && val !== selectedFromExisting) {
                          setSelectedFromExisting(null);
                          setMissingPhoneNotice(false);
                        }
                      }}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => {
                        setTimeout(() => setIsSearchFocused(false), 250);
                      }}
                      placeholder="Nama lengkap member"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                    />

                    {/* Native Datalist Fallback */}
                    <datalist id="existing-members-datalist">
                      {uniqueMembers.map((client) => (
                        <option 
                          key={client.memberName} 
                          value={client.memberName}
                          label={client.clientPhone ? `${client.memberName} (${client.clientPhone})` : `${client.memberName} (Tanpa WA)`} 
                        />
                      ))}
                    </datalist>

                    {/* Rich Autocomplete Suggestions Popover */}
                    {isSearchFocused && inlineSuggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1.5 p-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-blue-500/30 dark:border-blue-500/30 space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-amber-500" />
                            Pelanggan Terdaftar yang Cocok
                          </span>
                          <span>{inlineSuggestions.length} ditemukan</span>
                        </div>
                        {inlineSuggestions.map((client) => (
                          <button
                            key={client.memberName}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectExistingMember(client);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-left transition-colors group cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-7 h-7 rounded-full ${client.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}>
                                {client.memberName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                  {client.memberName}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                  {client.clientPhone ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">📱 {client.clientPhone}</span>
                                  ) : (
                                    <span className="text-slate-400 italic">Tanpa WA</span>
                                  )}
                                  {client.accountEmail && <span className="truncate">✉️ {client.accountEmail}</span>}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/60 px-2 py-0.5 rounded-md shrink-0 ml-2">
                              Pilih
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Nomor WhatsApp Member (08... / 62...)
                    </label>
                    {selectedFromExisting && !clientPhone && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/40 px-2 py-0.5 rounded-md">
                        Belum ada nomor
                      </span>
                    )}
                  </div>
                  <input
                    ref={phoneInputRef}
                    type="text"
                    value={clientPhone}
                    onChange={(e) => {
                      setClientPhone(e.target.value);
                      if (e.target.value.trim().length > 0) {
                        setMissingPhoneNotice(false);
                      }
                    }}
                    placeholder="08xxxxxxxxxx"
                    className={`w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 focus:outline-none font-medium transition-all ${
                      missingPhoneNotice
                        ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20'
                        : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                    }`}
                  />
                  {missingPhoneNotice && (
                    <div className="flex items-start gap-1.5 mt-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 p-2 rounded-xl animate-in fade-in">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                      <span>
                        <strong>Profil {selectedFromExisting || memberName} belum memiliki nomor WhatsApp di database.</strong> Silakan masukkan nomor WhatsApp sekarang agar otomatis tersimpan & ter-fetch untuk order selanjutnya!
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Akun Member yang Di-invite ke Layanan *
                </label>
                <input
                  type="email"
                  required
                  value={accountEmail}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAccountEmail(val);

                    // Reverse auto-match when typing/pasting existing member email
                    if (val && val.includes('@') && val.length > 5) {
                      const matchedByEmail = uniqueMembers.find(
                        m => m.accountEmail && m.accountEmail.trim().toLowerCase() === val.trim().toLowerCase()
                      );
                      if (matchedByEmail) {
                        if (!memberName || memberName.trim() === '') {
                          handleMemberNameChange(matchedByEmail.memberName);
                        }
                        if (matchedByEmail.clientPhone && (!clientPhone || clientPhone.trim() === '')) {
                          setClientPhone(matchedByEmail.clientPhone.trim());
                          setMissingPhoneNotice(false);
                        }
                        if (!selectedFromExisting) {
                          setSelectedFromExisting(matchedByEmail.memberName);
                        }
                      }
                    }
                  }}
                  placeholder="email.member@domain.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                />
                
                {/* Quick Domain Completion Chips */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-bold">Auto-complete domain:</span>
                  {['@gmail.com', '@googlemail.com', '@yahoo.com', '@icloud.com'].map((dom) => (
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
            </div>

            {/* Smart Pool / Shared Group Assignment */}
            <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  <Building className="h-4 w-4 text-blue-500" />
                  <span>Alokasi Pool / Family Group</span>
                </div>

                {onOpenAddPoolModal && (
                  <button
                    type="button"
                    onClick={onOpenAddPoolModal}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Buat Pool Baru
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pilih Pool / Akun Induk
                  </label>
                  {pools.length > 0 ? (
                    <select
                      value={poolId || ''}
                      onChange={(e) => handleSelectPool(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                    >
                      <option value="">-- Pilih Pool / Buat Bebas --</option>
                      {pools.map((p) => {
                        const pTier = getPoolTierInfo(p);
                        const isExpired = pTier.isExpiredInactive;
                        const isGuaranteed = pTier.tier === 'LONG_TERM_GUARANTEED';
                        const prefix = isExpired 
                          ? '🔴 [NONAKTIF]' 
                          : isGuaranteed 
                          ? '🛡️ [Garansi Perpanjang]' 
                          : '⚡ [Akun Lepas]';
                        return (
                          <option 
                            key={p.id} 
                            value={p.id}
                            disabled={isExpired}
                            className={isExpired ? 'text-rose-500' : isGuaranteed ? 'text-emerald-600 font-bold' : ''}
                          >
                            {prefix} {p.name} ({p.totalCapacity} slot • {pTier.daysRemaining < 0 ? `Expired ${Math.abs(pTier.daysRemaining)}d lalu` : `${pTier.daysRemaining}d lagi`})
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={poolName}
                      onChange={(e) => setPoolName(e.target.value)}
                      placeholder="Contoh: Google One 5TB Pool #1"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Layanan / Label Slot *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Google One 5TB Family - Slot #1"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Connected Pool Master Account Info Banner */}
              {currentPool && (() => {
                const currentPoolTier = getPoolTierInfo(currentPool);
                const isLongTermReq = activeDurationPackage === '6m' || activeDurationPackage === '12m' || billingCycle === 'semi_annual' || billingCycle === 'yearly';

                return (
                  <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${currentPoolTier.isExpiredInactive ? 'bg-rose-500' : currentPoolTier.tier === 'LONG_TERM_GUARANTEED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <div className="text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Akun Induk: </span>
                          <strong className="text-slate-900 dark:text-white font-mono">{currentPool.masterEmail}</strong>
                          {currentPool.masterEndDate && (
                            <span className={`text-[11px] font-bold ml-2 ${currentPoolTier.isExpiredInactive ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                              ({currentPoolTier.isExpiredInactive ? `Expired: ${formatDate(currentPool.masterEndDate)}` : `Exp: ${formatDate(currentPool.masterEndDate)}`})
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (memberName) {
                            setName(`${currentPool.name} - ${memberName}`);
                          } else {
                            setName(`${currentPool.name} - Slot Member`);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] cursor-pointer shrink-0 transition-colors shadow-2xs self-start sm:self-auto"
                      >
                        Terapkan Nama Pool ke Slot
                      </button>
                    </div>

                    {/* Compatibility Warning / Guarantee Badge */}
                    {currentPoolTier.isExpiredInactive ? (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                        <div>
                          <strong>🔴 Pool Nonaktif (Masa Aktif Habis):</strong> Akun induk ini sudah melewati masa jatuh tempo. Harap perpanjang akun master terlebih dahulu.
                        </div>
                      </div>
                    ) : isLongTermReq && currentPoolTier.tier === 'SHORT_TERM_LEPAS' ? (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-[11px]">⚠️ Peringatan Kompatibilitas Garansi Perpanjang:</div>
                          <div className="text-[10px] leading-relaxed">
                            Anda memilih paket 6 Bulan / 1 Tahun, namun pool ini hanya tersisa <strong>{currentPoolTier.daysRemaining} hari</strong>. Member berisiko terkena limit 12 bulan Google Family jika akun master habis sebelum masa langganan selesai! Disarankan pilih pool dengan sisa &ge; 180 hari.
                          </div>
                        </div>
                      </div>
                    ) : isLongTermReq && currentPoolTier.tier === 'LONG_TERM_GUARANTEED' ? (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                        <div>
                          <strong>🛡️ 100% Kompatibel Garansi Perpanjang:</strong> Pool ini tersisa {currentPoolTier.daysRemaining} hari (&ge; 180 hari), aman untuk langganan 6 bulan & 1 tahun tanpa risiko limit Google.
                        </div>
                      </div>
                    ) : null}

                    {/* Pool Master Password Row (if present) */}
                    {currentPool.masterPassword && (
                      <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-blue-200/60 dark:border-blue-900/40">
                        <div className="flex items-center gap-2 min-w-0 text-slate-600 dark:text-slate-300">
                          <KeyRound className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">Password Master:</span>
                          <span className="font-mono font-bold tracking-wider text-[11px] truncate text-slate-900 dark:text-white">
                            {showPoolPassword ? currentPool.masterPassword : '••••••••••••'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowPoolPassword(!showPoolPassword)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title={showPoolPassword ? "Sembunyikan password" : "Lihat password"}
                          >
                            {showPoolPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(currentPool.masterPassword!);
                              setCopiedPoolPassword(true);
                              setTimeout(() => setCopiedPoolPassword(false), 2000);
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                            title="Salin Password Master"
                          >
                            {copiedPoolPassword ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-amber-500" />}
                            <span>{copiedPoolPassword ? 'Tersalin' : 'Salin Pass'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Duration Package Quick Selector with Full Pool End Option */}
            <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/15 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Pilih Paket Durasi Akses
                </span>
                <span className="text-[11px] text-slate-400 font-bold">
                  Otomatis menghitung tanggal jatuh tempo
                </span>
              </div>

              {/* Standard month packages */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {DURATION_PACKAGES.map((pkg) => {
                  const isActive = activeDurationPackage === pkg.id;
                  return (
                    <button
                      type="button"
                      key={pkg.id}
                      onClick={() => handleSelectDurationPackage(pkg)}
                      className={`py-2 px-2.5 rounded-xl text-center font-black text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400/40'
                          : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {pkg.label}
                    </button>
                  );
                })}
              </div>

              {/* SPECIAL OPTION: Sampai Akun Google Pool Berakhir */}
              <button
                type="button"
                onClick={handleSelectPoolEnd}
                className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-between font-bold text-xs transition-all cursor-pointer border ${
                  activeDurationPackage === 'pool_end'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
                    : 'bg-blue-500/10 hover:bg-blue-500/15 text-blue-800 dark:text-blue-200 border-blue-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className={`h-4 w-4 ${activeDurationPackage === 'pool_end' ? 'text-amber-300' : 'text-blue-500'}`} />
                  <span className="font-black text-xs">Sampai Akun Google Pool Berakhir</span>
                </div>
                <div className="text-[11px] font-extrabold flex items-center gap-1.5">
                  {currentPool?.masterEndDate ? (
                    <span className={`px-2.5 py-1 rounded-lg ${activeDurationPackage === 'pool_end' ? 'bg-white/20 text-white' : 'bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold'}`}>
                      Hingga {formatDateIndo(currentPool.masterEndDate)}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal">
                      {pools.length > 0 ? `(Otomatis set ke Pool)` : `(Pilih Pool terlebih dahulu)`}
                    </span>
                  )}
                </div>
              </button>

              {/* Dynamic Warranty Status Badge */}
              <div className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                warrantyInfo.isGuaranteed 
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-200' 
                  : 'bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-200'
              }`}>
                <div className="shrink-0 text-sm mt-0.5">
                  {warrantyInfo.isGuaranteed ? '🛡️' : '📦'}
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-[11px]">
                      {warrantyInfo.label}
                    </span>
                    <span className={`eyebrow-pill text-[9px] py-0 px-1.5 ring-1 ${warrantyInfo.badgeClass}`}>
                      {warrantyInfo.targetAccountLabel}
                    </span>
                  </div>
                  <p className="text-[10px] opacity-90 leading-relaxed">
                    {warrantyInfo.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Row 1: Dates (Ample Horizontal Width) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <DatePickerField
                label="Tanggal Mulai"
                required
                variant="start"
                value={startDate}
                onChange={handleStartDateChange}
                quickPresets={[
                  { label: 'Hari Ini', isToday: true },
                  { label: '-1 Bln', months: -1 },
                ]}
              />

              <DatePickerField
                label="Tanggal Jatuh Tempo"
                required
                variant="expiry"
                value={endDate}
                onChange={(val) => {
                  setEndDate(val);
                  setActiveDurationPackage('');
                }}
                relativeDate={startDate}
                poolEndDate={currentPool?.masterEndDate}
                showCalendarSync={!!initialSubscription}
                subscription={initialSubscription || undefined}
                quickPresets={[
                  { label: '+1 Bln', months: 1 },
                  { label: '+3 Bln', months: 3 },
                  { label: '+1 Thn', months: 12 },
                  ...(currentPool?.masterEndDate ? [{ label: 'Pool End', isPoolEnd: true }] : []),
                ]}
              />
            </div>

            {/* Row 2: Pricing & Billing Cycle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div>
                <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Biaya Member (Harga Jual)</span>
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black">
                    {formatCurrency(price, currency)}
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-black text-xs">
                    Rp
                  </div>
                  <input
                    type="text"
                    value={formatNumberIDR(price)}
                    onChange={(e) => setPrice(parseCurrencyInput(e.target.value))}
                    placeholder="35.000"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-extrabold text-sm shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-xs text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  <span>Siklus Penagihan</span>
                </label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-bold text-xs shadow-xs"
                >
                  <option value="monthly">Bulanan (1 Bulan)</option>
                  <option value="quarterly">3 Bulan</option>
                  <option value="semi_annual">6 Bulan</option>
                  <option value="yearly">Tahunan (1 Tahun)</option>
                  <option value="custom">Sekali Bayar / Custom</option>
                </select>
              </div>
            </div>

            {/* Per-Month Rate Breakdown Helper */}
            {billingCycle !== 'monthly' && price > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs animate-in fade-in">
                <span className="font-black text-sm">💡</span>
                <div className="flex-1">
                  <span className="font-bold">Perhitungan Per Bulan: </span>
                  <span>
                    Total <span className="font-extrabold">{formatCurrency(price, currency)}</span> untuk <span className="font-extrabold">{getBillingCycleMonths(billingCycle)} bulan</span> = <span className="font-black text-emerald-600 dark:text-emerald-400 underline">{formatCurrency(getMonthlyEquivalent(price, billingCycle), currency)} / bulan</span>
                  </span>
                </div>
              </div>
            )}

            {/* Admin Kick Checklist Builder */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Checklist Tindakan Admin saat Expired ({checklist.length} aksi):</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Wajib diselesaikan sebelum slot dinyatakan kosong
                </span>
              </label>

              <div className="space-y-1.5 mb-2.5">
                {checklist.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
                  >
                    <span className="text-slate-800 dark:text-slate-200 leading-snug font-medium">
                      {idx + 1}. {item.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  placeholder="+ Tambah checklist aksi kick..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-bold cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Admin / Detail Pembayaran
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan transfer, bank, atau preferensi member..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </form>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              {!initialSubscription && (
                <span>Ketik form, tersimpan otomatis</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className={`group flex items-center gap-2 pl-5 pr-1.5 py-1.5 rounded-full text-white text-xs font-bold shadow-md transition-all ${
                  isSubmitting 
                    ? 'bg-blue-400 dark:bg-blue-500/60 shadow-none opacity-80 cursor-not-allowed pointer-events-none' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 active:scale-[0.98] cursor-pointer'
                }`}
              >
                <span>{isSubmitting ? 'Menyimpan Data...' : (initialSubscription ? 'Perbarui Data Member' : 'Simpan & Monitor Slot')}</span>
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-white" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: PILIH DARI PELANGGAN TERDAFTAR */}
      {isSelectExistingOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Pilih Pelanggan Terdaftar
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Klik salah satu untuk otomatis mengisi nama, WhatsApp, dan email
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectExistingOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-3 sm:p-4 bg-slate-50/70 dark:bg-slate-850/50 border-b border-slate-150 dark:border-slate-800 space-y-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={existingSearchQuery}
                  onChange={(e) => setExistingSearchQuery(e.target.value)}
                  placeholder="Cari nama member, nomor WA (08...), atau email..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:border-blue-500 font-medium"
                />
                {existingSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setExistingSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Menampilkan <strong>{modalFilteredMembers.length}</strong> dari {uniqueMembers.length} member tersimpan</span>
                {existingSearchQuery && <span>Filter aktif</span>}
              </div>
            </div>

            {/* Member List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 max-h-[380px]">
              {modalFilteredMembers.length === 0 ? (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-xs">
                  Tidak ditemukan pelanggan dengan kata kunci &ldquo;{existingSearchQuery}&rdquo;
                </div>
              ) : (
                modalFilteredMembers.map((client) => (
                  <div
                    key={client.memberName}
                    onClick={() => handleSelectExistingMember(client)}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-blue-50/80 dark:hover:bg-blue-900/20 border border-slate-200/60 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/60 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl ${client.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm`}>
                        {client.memberName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                            {client.memberName}
                          </span>
                          {client.count > 1 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold">
                              {client.count}x Order
                            </span>
                          )}
                          {client.status === 'TERMINATED' ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-750 text-slate-600 dark:text-slate-400 font-medium">
                              Mantan
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold">
                              Aktif
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {client.clientPhone ? (
                            <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              <Phone className="h-3 w-3" />
                              {client.clientPhone}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md font-medium">
                              <AlertCircle className="h-3 w-3" />
                              WA Belum Tercatat
                            </span>
                          )}
                          {client.accountEmail && (
                            <span className="flex items-center gap-1 font-mono text-[11px] truncate max-w-[200px]">
                              <Mail className="h-3 w-3 text-slate-400" />
                              {client.accountEmail}
                            </span>
                          )}
                        </div>
                        {client.poolName && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                            Pool: {client.poolName}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs group-hover:scale-105 transition-all ml-3 cursor-pointer"
                    >
                      Pilih
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSelectExistingOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Batal / Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
