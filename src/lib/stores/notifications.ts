import { writable } from 'svelte/store';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

function createNotificationStore() {
  const { subscribe, set, update } = writable<Notification[]>([]);

  return {
    subscribe,
    add: (message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) => {
      const id = Date.now().toString();
      const notification: Notification = { id, message, type, duration };

      update(notifications => [...notifications, notification]);

      if (duration > 0) {
        setTimeout(() => {
          update(notifications => notifications.filter(n => n.id !== id));
        }, duration);
      }
    },
    remove: (id: string) => {
      update(notifications => notifications.filter(n => n.id !== id));
    },
    clear: () => set([])
  };
}

export const notifications = createNotificationStore();
