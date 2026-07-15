import { create } from 'zustand';

export interface NotificationsState {
  notifications: any[];
  addNotification: (notification: any) => void;
  clearNotifications: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  addNotification: () => {},
  clearNotifications: () => set({ notifications: [] }),
}));
