'use client';

import { useEffect, useRef, useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { useNotificationStore } from '@/stores/notification-store';
import { useSocket } from '@/hooks/use-socket';
import Link from 'next/link';

export function NotificationBell() {
  const { notifications, unreadCount, fetchNotifications, markAsRead } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { on, off } = useSocket();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleNotification = (data: any) => {
      useNotificationStore.getState().addNotification(data);
    };
    on('notification', handleNotification);
    return () => { off('notification', handleNotification); };
  }, [on, off]);

  const typeIcons: Record<string, string> = {
    order: '📦',
    message: '💬',
    review: '⭐',
    system: '⚙️',
    payout: '💰',
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => { setOpen(!open); if (!open && unreadCount === 0) fetchNotifications(); }} className="relative p-2 text-zinc-500 hover:text-zinc-700 transition-colors">
        {unreadCount > 0 ? <BellSolidIcon className="h-6 w-6 text-indigo-600" /> : <BellIcon className="h-6 w-6" />}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4.5 h-4.5 min-w-[18px] flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
            <h3 className="font-semibold text-sm">Notificaciones</h3>
            {unreadCount > 0 && (
              <button onClick={() => useNotificationStore.getState().markAllAsRead()} className="text-xs text-indigo-600 hover:text-indigo-700">Marcar todas leídas</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-zinc-400 text-sm py-8">No hay notificaciones</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 hover:bg-zinc-50 transition-colors ${!n.read ? 'bg-indigo-50/50' : ''}`}>
                  {n.link ? (
                    <Link href={n.link} onClick={() => markAsRead(n.id)} className="block">
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{typeIcons[n.type] ?? '🔔'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{n.title}</p>
                          <p className="text-xs text-zinc-500 truncate">{n.message}</p>
                          <p className="text-xs text-zinc-400 mt-1">{new Date(n.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 bg-indigo-600 rounded-full mt-2 shrink-0" />}
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{typeIcons[n.type] ?? '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        <p className="text-xs text-zinc-500 truncate">{n.message}</p>
                        <p className="text-xs text-zinc-400 mt-1">{new Date(n.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {!n.read && <button onClick={() => markAsRead(n.id)} className="w-2 h-2 bg-indigo-600 rounded-full mt-2 shrink-0 hover:opacity-70" />}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
