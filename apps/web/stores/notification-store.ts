import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'order' | 'message' | 'review' | 'system' | 'payout';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/notifications?limit=20`, { credentials: 'include' });
      const json = await res.json();
      const data = json.data ?? [];
      set({
        notifications: data,
        unreadCount: data.filter((n: Notification) => !n.read).length,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await fetch(`${API}/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {}
  },

  markAllAsRead: async () => {
    try {
      await fetch(`${API}/notifications/read-all`, {
        method: 'PATCH',
        credentials: 'include',
      });
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch {}
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  removeNotification: (id: string) => {
    set((state) => {
      const removed = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: removed && !removed.read ? state.unreadCount - 1 : state.unreadCount,
      };
    });
  },
}));
