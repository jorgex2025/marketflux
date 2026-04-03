'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  data?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  // Fetch historial inicial
  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/notifications`, { credentials: 'include' });
      if (!res.ok) return;
      const data: AppNotification[] = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.readAt).length);
    } catch {
      // sin crash si no hay sesión
    }
  }, []);

  // Conectar WebSocket
  useEffect(() => {
    const socket = io(API_URL, {
      withCredentials: true,
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('notification', (notif: AppNotification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    fetchAll();

    return () => {
      socket.disconnect();
    };
  }, [fetchAll]);

  const markRead = useCallback(async (id: string) => {
    await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      credentials: 'include',
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PATCH',
      credentials: 'include',
    });
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
    );
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, markRead, markAllRead, fetchAll };
}
