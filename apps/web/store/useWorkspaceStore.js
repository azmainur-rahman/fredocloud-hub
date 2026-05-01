import { create } from "zustand";
import api from "../lib/axios.js";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  isLoading: false,

  fetchWorkspaces: async () => {
    set({ isLoading: true });

    try {
      const response = await api.get("/workspaces");
      const workspaces = response.data.workspaces || [];
      const currentActive = get().activeWorkspace;
      const activeWorkspace =
        workspaces.find((workspace) => workspace.id === currentActive?.id) ||
        workspaces[0] ||
        null;

      set({ workspaces, activeWorkspace, isLoading: false });

      return workspaces;
    } catch (error) {
      set({ workspaces: [], activeWorkspace: null, isLoading: false });
      throw new Error(getErrorMessage(error, "Failed to fetch workspaces."));
    }
  },

  createWorkspace: async (payload) => {
    set({ isLoading: true });

    try {
      const response = await api.post("/workspaces", payload);
      const workspace = response.data.workspace;
      const workspaces = [...get().workspaces, workspace];

      set({ workspaces, activeWorkspace: workspace, isLoading: false });

      return workspace;
    } catch (error) {
      set({ isLoading: false });
      throw new Error(getErrorMessage(error, "Failed to create workspace."));
    }
  },

  setActiveWorkspace: (workspaceId) => {
    const activeWorkspace =
      get().workspaces.find((workspace) => workspace.id === workspaceId) ||
      null;

    set({ activeWorkspace });
  },
}));

export default useWorkspaceStore;
