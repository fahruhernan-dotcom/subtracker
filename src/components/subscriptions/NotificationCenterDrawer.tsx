'use client';

import React from 'react';
import { 
  X, 
  Bell, 
  AlertOctagon, 
  CalendarClock, 
  CheckCheck, 
  ArrowRight
} from 'lucide-react';
import { AppNotification, Subscription } from '@/types/subscription';

interface NotificationCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  subscriptions: Subscription[];
  onSelectSubscription: (sub: Subscription) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationCenterDrawer: React.FC<NotificationCenterDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  subscriptions,
  onSelectSubscription,
  onMarkAllAsRead,
}) => {
  if (!isOpen) return null;

  const handleNotificationClick = (notif: AppNotification) => {
    const targetSub = subscriptions.find(s => s.id === notif.subscriptionId);
    if (targetSub) {
      onSelectSubscription(targetSub);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Bell className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Notifications & Alerts
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {notifications.filter(n => !n.read).length} unread alerts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onMarkAllAsRead}
                title="Mark all as read"
                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="p-6 overflow-y-auto space-y-3 flex-1">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400 mb-3">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Semua Notifikasi Bersih
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Tidak ada reminder yang tertunda.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUrgent = notif.type === 'OVERDUE' || notif.type === 'DUE_TODAY' || notif.type === 'ACTION_REQUIRED';

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                      !notif.read
                        ? isUrgent
                          ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 shadow-xs'
                          : 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 opacity-80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isUrgent 
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-600' 
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                      }`}>
                        {isUrgent ? <AlertOctagon className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                            {notif.title}
                          </h4>
                          {!notif.read && (
                            <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{notif.subscriptionName}</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                            Buka Checklist <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
