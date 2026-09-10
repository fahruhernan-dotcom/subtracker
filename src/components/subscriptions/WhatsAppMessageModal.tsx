'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Copy, 
  Check, 
  Send
} from 'lucide-react';
import { Subscription } from '@/types/subscription';
import { 
  generateWhatsAppReminderText, 
  generateWhatsAppActivationText, 
  formatWhatsAppUrl 
} from '@/lib/whatsapp';
import { formatCurrency, getCycleLabel, getMonthlyEquivalent, getWarrantyInfo } from '@/lib/utils';

interface WhatsAppMessageModalProps {
  subscription: Subscription | null;
  isOpen: boolean;
  onClose: () => void;
  onLoggedSent?: (sub: Subscription) => void;
}

export const WhatsAppMessageModal: React.FC<WhatsAppMessageModalProps> = ({
  subscription: sub,
  isOpen,
  onClose,
  onLoggedSent,
}) => {
  const [templateType, setTemplateType] = useState<'reminder' | 'activation'>('reminder');
  const [message, setMessage] = useState(() => (sub ? generateWhatsAppReminderText(sub) : ''));
  const [phone, setPhone] = useState(() => (sub?.clientPhone || ''));
  const [copied, setCopied] = useState(false);

  // Sync state when sub changes
  useEffect(() => {
    if (sub) {
      setTemplateType('reminder');
      setMessage(generateWhatsAppReminderText(sub));
      setPhone(sub.clientPhone || '');
      setCopied(false);
    }
  }, [sub, isOpen]);

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

  if (!isOpen || !sub) return null;

  const waUrl = formatWhatsAppUrl(phone, message);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWA = () => {
    if (waUrl) {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      if (onLoggedSent) onLoggedSent(sub);
      onClose();
    }
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
        className="bezel-shell w-full max-w-lg scale-100 animate-in zoom-in-95 duration-200 cursor-default"
      >
        <div className="bezel-core p-6 flex flex-col justify-between max-h-[88vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20 flex items-center justify-center shadow-sm">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  Kirim Pengingat WhatsApp
                  <span className="eyebrow-pill bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                    Template Otomatis
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Kirim tagihan / peringatan pemutusan langsung ke member
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

          {/* Body */}
          <div className="py-4 space-y-4 overflow-y-auto text-xs flex-1">
            {/* Member Info Row */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Member
                </span>
                <div className="font-extrabold text-slate-900 dark:text-white">
                  {sub.memberName || 'Pelanggan'}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {sub.accountEmail}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Layanan & Biaya
                </span>
                <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                  <span>{sub.name}</span>
                  <span className={`eyebrow-pill text-[9px] py-0 px-1.5 ring-1 ${getWarrantyInfo(sub.billingCycle).badgeClass}`}>
                    {getWarrantyInfo(sub.billingCycle).shortBadge}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(sub.price, sub.currency)} ({getCycleLabel(sub.billingCycle)})
                  {sub.billingCycle !== 'monthly' && (
                    <span className="text-emerald-600 dark:text-emerald-400 ml-1.5 font-extrabold">
                      (~{formatCurrency(getMonthlyEquivalent(sub.price, sub.billingCycle), sub.currency)}/bln)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor WhatsApp Member (Awalan 08 atau 62):
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            {/* Template Selector Pills */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih Jenis Template Pesan:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTemplateType('activation');
                    setMessage(generateWhatsAppActivationText(sub));
                  }}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    templateType === 'activation'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 ring-1 ring-blue-500/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  <span>🎉 Baru Aktif (Suruh ACC)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTemplateType('reminder');
                    setMessage(generateWhatsAppReminderText(sub));
                  }}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    templateType === 'reminder'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  <span>⏰ Tagihan / Pengingat</span>
                </button>
              </div>
            </div>

            {/* Message Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Isi Pesan WhatsApp (Bisa diedit):
                </label>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Tersalin!' : 'Salin Pesan'}
                </button>
              </div>
              <textarea
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-[11px] leading-relaxed"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Teks Tersalin' : 'Salin Saja'}
            </button>

            <button
              type="button"
              onClick={handleSendWA}
              disabled={!phone}
              className="group flex items-center gap-2 pl-5 pr-1.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Buka WhatsApp & Kirim</span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                <Send className="h-3.5 w-3.5 text-white" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
