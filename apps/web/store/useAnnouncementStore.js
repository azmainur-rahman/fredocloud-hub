import { create } from "zustand";
import api from "../lib/axios.js";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

const sortAnnouncements = (announcements) =>
  [...announcements].sort((a, b) => {
    if (a.pinned === b.pinned) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }

    return Number(b.pinned) - Number(a.pinned);
  });

const useAnnouncementStore = create((set, get) => ({
  announcements: [],
  isLoading: false,

  upsertAnnouncement: (announcement) => {
    set({
      announcements: sortAnnouncements(
        get().announcements.some(
          (currentAnnouncement) => currentAnnouncement.id === announcement.id,
        )
          ? get().announcements.map((currentAnnouncement) =>
              currentAnnouncement.id === announcement.id
                ? announcement
                : currentAnnouncement,
            )
          : [announcement, ...get().announcements],
      ),
    });
  },

  removeAnnouncement: (announcementId) => {
    set({
      announcements: get().announcements.filter(
        (announcement) => announcement.id !== announcementId,
      ),
    });
  },

  fetchAnnouncements: async (workspaceId) => {
    if (!workspaceId) {
      set({ announcements: [] });
      return [];
    }

    set({ isLoading: true });

    try {
      const response = await api.get(
        `/workspaces/${workspaceId}/announcements`,
      );
      const announcements = response.data.announcements || [];

      set({
        announcements: sortAnnouncements(announcements),
        isLoading: false,
      });

      return announcements;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getErrorMessage(error, "Failed to fetch announcements."));
    }
  },

  createAnnouncement: async (workspaceId, payload) => {
    set({ isLoading: true });

    try {
      const response = await api.post(
        `/workspaces/${workspaceId}/announcements`,
        payload,
      );
      const announcement = response.data.announcement;

      set({
        announcements: sortAnnouncements([
          announcement,
          ...get().announcements,
        ]),
        isLoading: false,
      });

      return announcement;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getErrorMessage(error, "Failed to create announcement."));
    }
  },

  updateAnnouncement: async (workspaceId, announcementId, payload) => {
    set({ isLoading: true });

    try {
      const response = await api.put(
        `/workspaces/${workspaceId}/announcements/${announcementId}`,
        payload,
      );
      const announcement = response.data.announcement;

      set({
        announcements: sortAnnouncements(
          get().announcements.map((currentAnnouncement) =>
            currentAnnouncement.id === announcement.id
              ? announcement
              : currentAnnouncement,
          ),
        ),
        isLoading: false,
      });

      return announcement;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getErrorMessage(error, "Failed to update announcement."));
    }
  },

  deleteAnnouncement: async (workspaceId, announcementId) => {
    set({ isLoading: true });

    try {
      await api.delete(
        `/workspaces/${workspaceId}/announcements/${announcementId}`,
      );

      set({
        announcements: get().announcements.filter(
          (announcement) => announcement.id !== announcementId,
        ),
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getErrorMessage(error, "Failed to delete announcement."));
    }
  },
}));

export default useAnnouncementStore;
