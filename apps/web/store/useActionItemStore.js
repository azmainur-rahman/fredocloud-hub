import { create } from "zustand";
import api from "../lib/axios.js";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

const useActionItemStore = create((set, get) => ({
  actionItems: [],
  isLoading: false,

  upsertActionItem: (actionItem) => {
    set({
      actionItems: get().actionItems.some((item) => item.id === actionItem.id)
        ? get().actionItems.map((item) =>
            item.id === actionItem.id ? actionItem : item,
          )
        : [actionItem, ...get().actionItems],
    });
  },

  removeActionItem: (actionItemId) => {
    set({
      actionItems: get().actionItems.filter((item) => item.id !== actionItemId),
    });
  },

  fetchActionItems: async (workspaceId) => {
    if (!workspaceId) {
      set({ actionItems: [] });
      return [];
    }

    set({ isLoading: true });

    try {
      const response = await api.get(`/workspaces/${workspaceId}/action-items`);
      const actionItems = response.data.actionItems || [];

      set({ actionItems, isLoading: false });

      return actionItems;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getErrorMessage(error, "Failed to fetch action items."));
    }
  },

  createActionItem: async (workspaceId, payload) => {
    set({ isLoading: true });

    try {
      const response = await api.post(
        `/workspaces/${workspaceId}/action-items`,
        payload,
      );
      const actionItem = response.data.actionItem;

      set({
        actionItems: [actionItem, ...get().actionItems],
        isLoading: false,
      });

      return actionItem;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getErrorMessage(error, "Failed to create action item."));
    }
  },

  updateActionItem: async (workspaceId, actionItemId, payload) => {
    set({ isLoading: true });

    try {
      const response = await api.put(
        `/workspaces/${workspaceId}/action-items/${actionItemId}`,
        payload,
      );
      const actionItem = response.data.actionItem;

      set({
        actionItems: get().actionItems.map((currentActionItem) =>
          currentActionItem.id === actionItem.id
            ? actionItem
            : currentActionItem,
        ),
        isLoading: false,
      });

      return actionItem;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getErrorMessage(error, "Failed to update action item."));
    }
  },

  deleteActionItem: async (workspaceId, actionItemId) => {
    set({ isLoading: true });

    try {
      await api.delete(
        `/workspaces/${workspaceId}/action-items/${actionItemId}`,
      );

      set({
        actionItems: get().actionItems.filter(
          (actionItem) => actionItem.id !== actionItemId,
        ),
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getErrorMessage(error, "Failed to delete action item."));
    }
  },
}));

export default useActionItemStore;
