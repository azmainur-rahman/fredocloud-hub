import { create } from "zustand";
import api from "../lib/axios.js";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

const useNotificationStore = create((set, get) => ({
  notifications: [],
  isLoading: false,

  upsertNotification: (notification) => {
    set({
      notifications: get().notifications.some(
        (currentNotification) => currentNotification.id === notification.id,
      )
        ? get().notifications.map((currentNotification) =>
            currentNotification.id === notification.id
              ? notification
              : currentNotification,
          )
        : [notification, ...get().notifications],
    });
  },

  fetchNotifications: async () => {
    set({ isLoading: true });

    try {
      const response = await api.get("/notifications");
      const notifications = response.data.notifications || [];

      set({ notifications, isLoading: false });

      return notifications;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getErrorMessage(error, "Failed to fetch notifications."));
    }
  },

  markRead: async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      const notification = response.data.notification;

      set({
        notifications: get().notifications.map((currentNotification) =>
          currentNotification.id === notification.id
            ? notification
            : currentNotification,
        ),
      });

      return notification;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Failed to update notification."));
    }
  },
}));

export default useNotificationStore;
