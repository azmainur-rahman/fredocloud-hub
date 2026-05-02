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

const upsertAnnouncements = (announcements, announcement) =>
  sortAnnouncements(
    announcements.some(
      (currentAnnouncement) => currentAnnouncement.id === announcement.id,
    )
      ? announcements.map((currentAnnouncement) =>
          currentAnnouncement.id === announcement.id
            ? announcement
            : currentAnnouncement,
        )
      : [announcement, ...announcements],
  );

const uniqueAnnouncements = (announcements) =>
  Array.from(
    new Map(
      announcements.map((announcement) => [announcement.id, announcement]),
    ).values(),
  );

const useAnnouncementStore = create((set, get) => ({
  announcements: [],
  isLoading: false,

  upsertAnnouncement: (announcement) => {
    set({
      announcements: upsertAnnouncements(get().announcements, announcement),
    });
  },

  removeAnnouncement: (announcementId) => {
    set({
      announcements: get().announcements.filter(
        (announcement) => announcement.id !== announcementId,
      ),
    });
  },

  addComment: (announcementId, comment) => {
    set({
      announcements: get().announcements.map((announcement) =>
        announcement.id === announcementId
          ? {
              ...announcement,
              comments: (announcement.comments || []).some(
                (currentComment) => currentComment.id === comment.id,
              )
                ? announcement.comments
                : [...(announcement.comments || []), comment],
            }
          : announcement,
      ),
    });
  },

  applyReactionChange: (announcementId, reaction, removed) => {
    set({
      announcements: get().announcements.map((announcement) => {
        if (announcement.id !== announcementId) {
          return announcement;
        }

        const reactions = announcement.reactions || [];

        return {
          ...announcement,
          reactions: removed
            ? reactions.filter(
                (currentReaction) => currentReaction.id !== reaction.id,
              )
            : reactions.some(
                  (currentReaction) => currentReaction.id === reaction.id,
                )
              ? reactions
              : [...reactions, reaction],
        };
      }),
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
        announcements: sortAnnouncements(uniqueAnnouncements(announcements)),
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
        announcements: upsertAnnouncements(get().announcements, announcement),
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

  createComment: async (workspaceId, announcementId, payload) => {
    set({ isLoading: true });

    try {
      const response = await api.post(
        `/workspaces/${workspaceId}/announcements/${announcementId}/comments`,
        payload,
      );
      const comment = response.data.comment;

      get().addComment(announcementId, comment);
      set({ isLoading: false });

      return comment;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getErrorMessage(error, "Failed to create comment."));
    }
  },

  toggleReaction: async (workspaceId, announcementId, emoji) => {
    try {
      const response = await api.post(
        `/workspaces/${workspaceId}/announcements/${announcementId}/reactions`,
        { emoji },
      );
      const { reaction, removed } = response.data;

      get().applyReactionChange(announcementId, reaction, removed);

      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error, "Failed to update reaction."));
    }
  },
}));

export default useAnnouncementStore;
